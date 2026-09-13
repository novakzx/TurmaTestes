import { Router } from 'express';
import { z } from 'zod';
import { getDb, nowIso, insertReturningId } from '../db/index.js';
import { validateBody, validateQuery, cleanText } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { messageLimiter } from '../middleware/rateLimit.js';
import { emitToUsers } from '../services/sse.js';
import { notify } from '../services/notify.js';

const router = Router();

function memberIds(conversationId) {
  return getDb()
    .prepare('SELECT user_id FROM conversation_members WHERE conversation_id = ?')
    .all(conversationId)
    .map((r) => r.user_id);
}

function requireMember(req, res, next) {
  const id = Number(req.params.id);
  const m = getDb()
    .prepare('SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?')
    .get(id, req.user.id);
  if (!m) return res.status(403).json({ error: 'Não fazes parte desta conversa.' });
  req.conversationId = id;
  next();
}

function serializeConversation(c, viewerId) {
  const db = getDb();
  const members = db
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.avatar_color FROM conversation_members cm
       JOIN users u ON u.id = cm.user_id WHERE cm.conversation_id = ? ORDER BY u.username`
    )
    .all(c.id);
  const last = db
    .prepare(
      `SELECT m.*, u.username, u.display_name FROM messages m JOIN users u ON u.id = m.user_id
       WHERE m.conversation_id = ? ORDER BY m.id DESC LIMIT 1`
    )
    .get(c.id);
  const myMembership = db
    .prepare('SELECT last_read_at FROM conversation_members WHERE conversation_id = ? AND user_id = ?')
    .get(c.id, viewerId);
  const unread = db
    .prepare(
      `SELECT COUNT(*) c FROM messages
       WHERE conversation_id = ? AND user_id != ? AND (? IS NULL OR created_at > ?)`
    )
    .get(c.id, viewerId, myMembership?.last_read_at ?? null, myMembership?.last_read_at ?? null).c;

  // título de DM = nome do outro participante
  let title = c.title;
  if (c.type === 'dm') {
    const other = members.find((m) => m.id !== viewerId);
    title = other ? other.display_name : 'Mensagem';
  }
  return {
    id: c.id,
    type: c.type,
    title,
    members,
    lastMessage: last
      ? { id: last.id, content: last.content, createdAt: last.created_at, author: { id: last.user_id, username: last.username, displayName: last.display_name } }
      : null,
    lastMessageAt: c.last_message_at,
    unread,
  };
}

router.get('/', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT c.* FROM conversations c
       JOIN conversation_members cm ON cm.conversation_id = c.id
       WHERE cm.user_id = ?
       ORDER BY COALESCE(c.last_message_at, c.created_at) DESC LIMIT 50`
    )
    .all(req.user.id);
  res.json({ conversations: rows.map((c) => serializeConversation(c, req.user.id)) });
});

const createSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('dm'), username: z.string().trim().toLowerCase().min(3).max(24) }),
  z.object({
    type: z.literal('group'),
    title: z.string().trim().min(3).max(60),
    usernames: z.array(z.string().trim().toLowerCase()).min(1).max(30),
  }),
]);

router.post('/', requireAuth, validateBody(createSchema), (req, res) => {
  const db = getDb();
  const d = req.valid;
  const now = nowIso();

  if (d.type === 'dm') {
    const target = db.prepare('SELECT * FROM users WHERE username = ?').get(d.username);
    if (!target) return res.status(404).json({ error: 'Utilizador não encontrado.' });
    if (target.id === req.user.id) return res.status(400).json({ error: 'Não podes abrir uma conversa contigo próprio.' });
    // DM existente entre o par?
    const existing = db
      .prepare(
        `SELECT c.id FROM conversations c
         WHERE c.type = 'dm'
           AND EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = c.id AND cm.user_id = ?)
           AND EXISTS (SELECT 1 FROM conversation_members cm WHERE cm.conversation_id = c.id AND cm.user_id = ?)`
      )
      .get(req.user.id, target.id);
    if (existing) return res.json({ conversation: serializeConversation(db.prepare('SELECT * FROM conversations WHERE id = ?').get(existing.id), req.user.id), reused: true });
    const id = insertReturningId("INSERT INTO conversations (type, title, created_by, created_at) VALUES ('dm', '', ?, ?)", [req.user.id, now]);
    const ins = db.prepare('INSERT INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)');
    ins.run(id, req.user.id, now);
    ins.run(id, target.id, now);
    return res.status(201).json({ conversation: serializeConversation(db.prepare('SELECT * FROM conversations WHERE id = ?').get(id), req.user.id) });
  }

  // grupo
  const users = [req.user.id];
  for (const un of d.usernames) {
    const u = db.prepare('SELECT id FROM users WHERE username = ?').get(un);
    if (u && !users.includes(u.id)) users.push(u.id);
  }
  const id = insertReturningId("INSERT INTO conversations (type, title, created_by, created_at) VALUES ('group', ?, ?, ?)", [
    cleanText(d.title, 60), req.user.id, now,
  ]);
  const ins = db.prepare('INSERT INTO conversation_members (conversation_id, user_id, joined_at) VALUES (?, ?, ?)');
  for (const uid of users) ins.run(id, uid, now);
  res.status(201).json({ conversation: serializeConversation(db.prepare('SELECT * FROM conversations WHERE id = ?').get(id), req.user.id) });
});

router.get('/:id(\\d+)', requireAuth, requireMember, (req, res) => {
  const c = getDb().prepare('SELECT * FROM conversations WHERE id = ?').get(req.conversationId);
  res.json({ conversation: serializeConversation(c, req.user.id) });
});

router.get('/:id(\\d+)/messages', requireAuth, requireMember, validateQuery(z.object({ before: z.coerce.number().int().positive().optional(), limit: z.coerce.number().int().min(1).max(100).default(50) })), (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT m.*, u.username, u.display_name, u.avatar_color FROM messages m JOIN users u ON u.id = m.user_id
       WHERE m.conversation_id = ? AND (? IS NULL OR m.id < ?) ORDER BY m.id DESC LIMIT ?`
    )
    .all(req.conversationId, req.validQuery.before ?? null, req.validQuery.before ?? null, req.validQuery.limit);
  // marcar como lidas
  db.prepare('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?')
    .run(nowIso(), req.conversationId, req.user.id);
  res.json({
    messages: rows.reverse().map((m) => ({
      id: m.id, content: m.content, createdAt: m.created_at,
      author: { id: m.user_id, username: m.username, displayName: m.display_name, avatarColor: m.avatar_color },
      mine: m.user_id === req.user.id,
    })),
    hasMore: rows.length === req.validQuery.limit,
  });
});

const sendSchema = z.object({ content: z.string().trim().min(1).max(2000) });

router.post('/:id(\\d+)/messages', requireAuth, requireMember, messageLimiter, validateBody(sendSchema), (req, res) => {
  const db = getDb();
  const now = nowIso();
  const content = cleanText(req.valid.content, 2000);
  const id = insertReturningId(
    'INSERT INTO messages (conversation_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
    [req.conversationId, req.user.id, content, now]
  );
  db.prepare('UPDATE conversations SET last_message_at = ? WHERE id = ?').run(now, req.conversationId);
  db.prepare('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?').run(now, req.conversationId, req.user.id);

  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(req.conversationId);
  const message = {
    id, content, createdAt: now, conversationId: req.conversationId, conversationType: conv.type,
    author: { id: req.user.id, username: req.user.username },
  };
  const others = memberIds(req.conversationId).filter((u) => u !== req.user.id);

  // tempo real para quem está online + notificação/push para os restantes
  emitToUsers(others, 'message', message);
  for (const uid of others) {
    const u = db.prepare('SELECT display_name FROM users WHERE id = ?').get(uid);
    const label = conv.type === 'group' ? `${req.user.username} em «${conv.title}»` : req.user.username;
    notify({
      userId: uid, type: 'message', actorId: req.user.id, conversationId: conv.id,
      text: `${label}: ${content.slice(0, 80)}`,
      url: `/mensagens/${conv.id}`,
      push: true,
    });
  }
  res.status(201).json({ message: { ...message, author: { id: req.user.id, username: req.user.username, displayName: (db.prepare('SELECT display_name FROM users WHERE id=?').get(req.user.id) || {}).display_name }, mine: true } });
});

router.post('/:id(\\d+)/read', requireAuth, requireMember, (req, res) => {
  getDb().prepare('UPDATE conversation_members SET last_read_at = ? WHERE conversation_id = ? AND user_id = ?')
    .run(nowIso(), req.conversationId, req.user.id);
  res.json({ ok: true });
});

export default router;
