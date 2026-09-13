import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { sseHandler, isOnline } from '../services/sse.js';
import { getDb, nowIso } from '../db/index.js';

const router = Router();

/** Stream SSE autenticado: mensagens e notificações em tempo real. */
router.get('/stream', requireAuth, (req, res) => {
  getDb().prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(nowIso(), req.user.id);
  sseHandler(req, res);
});

/** Presença simples para a lista de conversas. */
router.post('/presence', requireAuth, (req, res) => {
  getDb().prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(nowIso(), req.user.id);
  res.json({ ok: true, online: isOnline(req.user.id) });
});

export default router;
