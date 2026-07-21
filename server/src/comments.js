import { Router } from 'express';

import { db, COMMENTS_TABLE } from './db.js';
import { requireAuth } from './session.js';

const router = Router();

router.get('/:refId/comments', async (req, res) => {
  const comments = await db(COMMENTS_TABLE)
    .where({ ref_id: req.params.refId })
    .orderBy('created_at', 'asc')
    .select('author', 'text', 'created_at');
  res.json(comments);
});

router.post('/:refId/comments', requireAuth, async (req, res) => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  if (!text) {
    return res.status(400).json({ error: 'Le commentaire est vide.' });
  }
  if (text.length > 500) {
    return res.status(400).json({ error: 'Commentaire trop long (500 caractères max).' });
  }

  const comment = { ref_id: req.params.refId, author: req.user.username, text };
  await db(COMMENTS_TABLE).insert(comment);
  res.status(201).json({ ...comment, created_at: new Date().toISOString() });
});

export default router;
