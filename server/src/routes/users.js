import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb, nowIso, audit } from '../db/index.js';
import { validateBody, validateQuery, cleanText } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { publicUser } from './auth.js';
import { serializePost } from './posts.js';
import { notify } from '../services/notify.js';

const router = Router();

function profileOf(usernameOrId, viewerId) {
  const db = getDb();
  const u =
    typeof usernameOrId === 'number'
      ? db.prepare('SELECT * FROM users WHERE id = ?').get(usernameOrId)
      : db.prepare('SELECT * FROM users WHERE username = ?').get(String(usernameOrId).toLowerCase());
  if (!u) return null;
  const stats = {
    posts: db.prepare('SELECT COUNT(*) c FROM posts WHERE user_id = ?').get(u.id).c,
    followers: db.prepare('SELECT COUNT(*) c FROM follows WHERE followee_id = ?').get(u.id).c,
    following: db.prepare('SELECT COUNT(*) c FROM follows WHERE follower_id = ?').get(u.id).c,
  };
  const isFollowing = viewerId
    ? !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(viewerId, u.id)
    : false;
  const isMe = viewerId === u.id;
  return {
    ...publicUser(u),
    ...(isMe ? { email: u.email } : {}),
    stats,
    isFollowing,
    isMe,
  };
}

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: profileOf(req.user.id, req.user.id) });
});

const updateMeSchema = z.object({
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(280).optional(),
  school: z.string().trim().max(120).optional(),
  district: z.string().trim().max(60).optional(),
  municipality: z.string().trim().max(80).optional(),
  gradeYear: z.string().trim().max(40).optional(),
  course: z.string().trim().max(80).optional(),
  isPrivate: z.boolean().optional(),
  theme: z.enum(['light', 'dark']).optional(),
  pushEnabled: z.boolean().optional(),
});

const FIELD_MAP = {
  displayName: 'display_name', bio: 'bio', school: 'school', district: 'district',
  municipality: 'municipality', gradeYear: 'grade_year', course: 'course',
};
const BOOL_MAP = { isPrivate: 'is_private', pushEnabled: 'push_enabled' };

router.patch('/me', requireAuth, validateBody(updateMeSchema), (req, res) => {
  const db = getDb();
  const sets = [];
  const params = [];
  for (const [k, col] of Object.entries(FIELD_MAP)) {
    if (req.valid[k] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(cleanText(req.valid[k], 280));
    }
  }
  for (const [k, col] of Object.entries(BOOL_MAP)) {
    if (req.valid[k] !== undefined) {
      sets.push(`${col} = ?`);
      params.push(req.valid[k] ? 1 : 0);
    }
  }
  if (req.valid.theme !== undefined) {
    sets.push('theme = ?');
    params.push(req.valid.theme);
  }
  if (sets.length) {
    params.push(req.user.id);
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  }
  audit(req, 'user.update_profile');
  res.json({ user: profileOf(req.user.id, req.user.id) });
});

router.get('/search', requireAuth, validateQuery(z.object({ q: z.string().trim().min(1).max(40) })), (req, res) => {
  const q = `%${req.validQuery.q.toLowerCase().replace(/[%_]/g, '')}%`;
  const rows = getDb()
    .prepare(
      `SELECT * FROM users
       WHERE (username LIKE ? OR display_name LIKE ? OR school LIKE ?) AND id != ?
       ORDER BY username LIMIT 20`
    )
    .all(q, q, q, req.user.id);
  res.json({ users: rows.map((r) => publicUser(r)) });
});

router.get('/:username', (req, res) => {
  const p = profileOf(req.params.username.toLowerCase(), req.user?.id);
  if (!p) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  if (p.isPrivate && !p.isMe && !p.isFollowing) {
    // perfil privado: apenas cabeçalho público mínimo
    return res.json({ user: { ...p, bio: '', school: '', posts: undefined } });
  }
  res.json({ user: p });
});

router.get('/:username/posts', validateQuery(z.object({ cursor: z.coerce.number().int().positive().optional() })), (req, res) => {
  const db = getDb();
  const target = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const viewerId = req.user?.id;
  const following = viewerId
    ? !!db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(viewerId, target.id)
    : false;
  if (target.is_private && viewerId !== target.id && !following) {
    return res.status(403).json({ error: 'Este perfil é privado.' });
  }
  const posts = db
    .prepare('SELECT * FROM posts WHERE user_id = ? AND (? IS NULL OR id < ?) ORDER BY id DESC LIMIT 20')
    .all(target.id, req.validQuery.cursor ?? null, req.validQuery.cursor ?? null);
  res.json({ posts: posts.map((p) => serializePost(p, viewerId)) });
});

router.post('/:username/follow', requireAuth, (req, res) => {
  const db = getDb();
  const target = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  if (target.id === req.user.id) return res.status(400).json({ error: 'Não podes seguir-te a ti próprio.' });
  const existing = db.prepare('SELECT 1 FROM follows WHERE follower_id = ? AND followee_id = ?').get(req.user.id, target.id);
  if (existing) {
    db.prepare('DELETE FROM follows WHERE follower_id = ? AND followee_id = ?').run(req.user.id, target.id);
    return res.json({ following: false });
  }
  db.prepare('INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, ?)').run(req.user.id, target.id, nowIso());
  notify({
    userId: target.id, type: 'follow', actorId: req.user.id,
    text: `${req.user.username} começou a seguir-te`, url: `/perfil/${req.user.username}`,
  });
  res.json({ following: true });
});

router.get('/:username/followers', (req, res) => {
  const db = getDb();
  const target = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const rows = db
    .prepare('SELECT u.* FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.followee_id = ? ORDER BY f.created_at DESC LIMIT 100')
    .all(target.id);
  res.json({ users: rows.map((r) => publicUser(r)) });
});

router.get('/:username/following', (req, res) => {
  const db = getDb();
  const target = db.prepare('SELECT * FROM users WHERE username = ?').get(req.params.username.toLowerCase());
  if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
  const rows = db
    .prepare('SELECT u.* FROM follows f JOIN users u ON u.id = f.followee_id WHERE f.follower_id = ? ORDER BY f.created_at DESC LIMIT 100')
    .all(target.id);
  res.json({ users: rows.map((r) => publicUser(r)) });
});

export default router;
