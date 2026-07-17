import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { db, USERS_TABLE } from './db.js';

const COOKIE_NAME = 'mp_session';
const JWT_SECRET = process.env.JWT_SECRET;
const isProd = process.env.NODE_ENV === 'production';

function setSessionCookie(res, user) {
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '30d',
  });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

function validateCredentials(username, password) {
  if (typeof username !== 'string' || typeof password !== 'string') {
    return 'Pseudo et mot de passe requis.';
  }
  const trimmed = username.trim();
  if (trimmed.length < 2 || trimmed.length > 32) {
    return 'Le pseudo doit faire entre 3 et 32 caractères.';
  }
  if (password.length < 2) {
    return 'Le mot de passe doit faire au moins 6 caractères.';
  }
  return null;
}

const router = Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body ?? {};
  const validationError = validateCredentials(username, password);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const cleanUsername = username.trim();
  const existing = await db(USERS_TABLE).where({ username: cleanUsername }).first();
  if (existing) {
    return res.status(409).json({ error: 'Ce pseudo est déjà pris.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db(USERS_TABLE).insert({ username: cleanUsername, password_hash: passwordHash });
  const user = await db(USERS_TABLE).where({ username: cleanUsername }).first();

  setSessionCookie(res, user);
  res.status(201).json({ username: user.username });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Pseudo et mot de passe requis.' });
  }

  const user = await db(USERS_TABLE).where({ username: username.trim() }).first();
  if (!user) {
    return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Pseudo ou mot de passe incorrect.' });
  }

  setSessionCookie(res, user);
  res.json({ username: user.username });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ error: 'Non connecté.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    res.json({ username: payload.username });
  } catch {
    res.status(401).json({ error: 'Session invalide ou expirée.' });
  }
});

export default router;
