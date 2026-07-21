import 'dotenv/config';

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import authRouter from './auth.js';
import commentsRouter from './comments.js';
import { ensureSchema } from './db.js';

if (!process.env.JWT_SECRET) {
  console.error('[api] JWT_SECRET manquant, arrêt.');
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? true, credentials: true }));

app.use('/api/auth', authRouter);
app.use('/api/refs', commentsRouter);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT) || 3000;

ensureSchema()
  .then(() => {
    app.listen(port, () => console.log(`[api] à l'écoute sur le port ${port}`));
  })
  .catch((err) => {
    console.error('[api] échec de connexion/initialisation de la base', err);
    process.exit(1);
  });
