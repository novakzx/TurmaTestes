import { Router } from 'express';
import { z } from 'zod';
import { getDb, nowIso } from '../db/index.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { getVapidPublicKey, saveSubscription, removeSubscription } from '../services/push.js';

const router = Router();

router.get('/', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT n.*, u.username AS actor_username, u.display_name AS actor_name, u.avatar_color AS actor_color
       FROM notifications n LEFT JOIN users u ON u.id = n.actor_id
       WHERE n.user_id = ? AND (? = '1' OR n.read_at IS NULL OR n.read_at IS NOT NULL)
       ORDER BY n.id DESC LIMIT 50`
    )
    .all(req.user.id, req.query.unread === '1' ? '1' : '0');
  const unread = getDb().prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read_at IS NULL').get(req.user.id).c;
  res.json({
    unread,
    notifications: rows.map((n) => ({
      id: n.id, type: n.type, text: n.text, url: n.url, createdAt: n.created_at, read: !!n.read_at,
      actor: n.actor_username ? { username: n.actor_username, displayName: n.actor_name, avatarColor: n.actor_color } : null,
      postId: n.post_id, conversationId: n.conversation_id,
    })),
  });
});

router.post('/read', requireAuth, (req, res) => {
  getDb().prepare('UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL').run(nowIso(), req.user.id);
  res.json({ ok: true });
});

// --- Web Push ----------------------------------------------------------------
router.get('/push/vapid-key', (req, res) => {
  res.json({ key: getVapidPublicKey() });
});

const subSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(10).max(100) }),
});

router.post('/push/subscribe', requireAuth, validateBody(subSchema), (req, res) => {
  saveSubscription(req.user.id, req.valid);
  res.json({ ok: true });
});

router.post('/push/unsubscribe', requireAuth, validateBody(z.object({ endpoint: z.string().url().max(1000) })), (req, res) => {
  removeSubscription(req.user.id, req.valid.endpoint);
  res.json({ ok: true });
});

export default router;
