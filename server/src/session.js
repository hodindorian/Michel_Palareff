import jwt from 'jsonwebtoken';

export const COOKIE_NAME = 'mp_session';
const JWT_SECRET = process.env.JWT_SECRET;

export function getSessionUser(req) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const user = getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Connecte-toi pour faire ça.' });
  }
  req.user = user;
  next();
}
