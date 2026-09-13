import { Router } from 'express';
import { z } from 'zod';
import { getDb, nowIso, audit, insertReturningId } from '../db/index.js';
import { validateBody, validateQuery, cleanText } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { notify } from '../services/notify.js';

const router = Router();

/** Serializa um post com autor, contagens, estado do viewer e sondagem. */
export function serializePost(p, viewerId) {
  const db = getDb();
  const author = db
    .prepare('SELECT id, username, display_name, avatar_color, school FROM users WHERE id = ?')
    .get(p.user_id);
  const likes = db.prepare('SELECT COUNT(*) c FROM likes WHERE post_id = ?').get(p.id).c;
  const comments = db.prepare('SELECT COUNT(*) c FROM comments WHERE post_id = ?').get(p.id).c;
  const likedByMe = viewerId ? !!db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(viewerId, p.id) : false;
  const savedByMe = viewerId ? !!db.prepare('SELECT 1 FROM saves WHERE user_id = ? AND post_id = ?').get(viewerId, p.id) : false;

  let poll = null;
  const pollRow = db.prepare('SELECT * FROM polls WHERE post_id = ?').get(p.id);
  if (pollRow) {
    const options = db.prepare('SELECT * FROM poll_options WHERE poll_id = ? ORDER BY position').all(pollRow.id);
    const total = db.prepare('SELECT COUNT(*) c FROM poll_votes WHERE option_id IN (SELECT id FROM poll_options WHERE poll_id = ?)').get(pollRow.id).c;
    let myVote = null;
    if (viewerId) {
      const v = db
        .prepare('SELECT option_id FROM poll_votes WHERE user_id = ? AND option_id IN (SELECT id FROM poll_options WHERE poll_id = ?)')
        .get(viewerId, pollRow.id);
      myVote = v ? v.option_id : null;
    }
    poll = {
      id: pollRow.id,
      question: pollRow.question,
      endsAt: pollRow.ends_at,
      totalVotes: total,
      myVote,
      options: options.map((o) => ({
        id: o.id,
        text: o.text,
        votes: db.prepare('SELECT COUNT(*) c FROM poll_votes WHERE option_id = ?').get(o.id).c,
      })),
    };
  }

  const hashtags = [...new Set((p.content.match(/#[\p{L}\p{N}]{2,30}/gu) || []).map((t) => t.toLowerCase()))];

  return {
    id: p.id,
    content: p.content,
    subject: p.subject,
    hashtags,
    createdAt: p.created_at,
    editedAt: p.edited_at,
    author: author
      ? { id: author.id, username: author.username, displayName: author.display_name, avatarColor: author.avatar_color, school: author.school }
      : null,
    likes,
    comments,
    likedByMe,
    savedByMe,
    poll,
    isMine: viewerId === p.user_id,
  };
}

const postSchema = z.object({
  content: z.string().trim().min(1, 'Escreve alguma coisa').max(2000),
  subject: z.string().trim().max(60).optional().default(''),
  poll: z
    .object({
      question: z.string().trim().min(3).max(140),
      options: z.array(z.string().trim().min(1).max(80)).min(2).max(4),
    })
    .optional(),
});

router.post('/', requireAuth, validateBody(postSchema), (req, res) => {
  const db = getDb();
  const content = cleanText(req.valid.content, 2000);
  const id = insertReturningId(
    'INSERT INTO posts (user_id, content, subject, created_at) VALUES (?, ?, ?, ?)',
    [req.user.id, content, cleanText(req.valid.subject, 60), nowIso()]
  );
  if (req.valid.poll) {
    const pollId = insertReturningId('INSERT INTO polls (post_id, question) VALUES (?, ?)', [id, cleanText(req.valid.poll.question, 140)]);
    const stmt = db.prepare('INSERT INTO poll_options (poll_id, text, position) VALUES (?, ?, ?)');
    req.valid.poll.options.forEach((opt, i) => stmt.run(pollId, cleanText(opt, 80), i));
  }
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(id);
  res.status(201).json({ post: serializePost(post, req.user.id) });
});

router.delete('/:id(\\d+)', requireAuth, (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Publicação não encontrada.' });
  if (post.user_id !== req.user.id && req.user.role !== 'admin') {
    audit(req, 'post.delete', 'fail', `post=${post.id} sem permissão`);
    return res.status(403).json({ error: 'Só podes apagar as tuas publicações.' });
  }
  db.prepare('DELETE FROM posts WHERE id = ?').run(post.id);
  audit(req, 'post.delete', 'ok', `post=${post.id}`);
  res.json({ ok: true });
});

router.post('/:id(\\d+)/like', requireAuth, (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Publicação não encontrada.' });
  const existing = db.prepare('SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?').get(req.user.id, post.id);
  if (existing) {
    db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?').run(req.user.id, post.id);
    return res.json({ liked: false, likes: db.prepare('SELECT COUNT(*) c FROM likes WHERE post_id = ?').get(post.id).c });
  }
  db.prepare('INSERT INTO likes (user_id, post_id, created_at) VALUES (?, ?, ?)').run(req.user.id, post.id, nowIso());
  notify({
    userId: post.user_id, type: 'like', actorId: req.user.id, postId: post.id,
    text: `${req.user.username} gostou da tua publicação`, url: `/perfil/${req.user.username}`,
  });
  res.json({ liked: true, likes: db.prepare('SELECT COUNT(*) c FROM likes WHERE post_id = ?').get(post.id).c });
});

router.post('/:id(\\d+)/save', requireAuth, (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Publicação não encontrada.' });
  const existing = db.prepare('SELECT 1 FROM saves WHERE user_id = ? AND post_id = ?').get(req.user.id, post.id);
  if (existing) {
    db.prepare('DELETE FROM saves WHERE user_id = ? AND post_id = ?').run(req.user.id, post.id);
    return res.json({ saved: false });
  }
  db.prepare('INSERT INTO saves (user_id, post_id, created_at) VALUES (?, ?, ?)').run(req.user.id, post.id, nowIso());
  res.json({ saved: true });
});

const commentSchema = z.object({ content: z.string().trim().min(1).max(600) });

router.post('/:id(\\d+)/comments', requireAuth, validateBody(commentSchema), (req, res) => {
  const db = getDb();
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(Number(req.params.id));
  if (!post) return res.status(404).json({ error: 'Publicação não encontrada.' });
  const content = cleanText(req.valid.content, 600);
  const id = insertReturningId(
    'INSERT INTO comments (post_id, user_id, content, created_at) VALUES (?, ?, ?, ?)',
    [post.id, req.user.id, content, nowIso()]
  );
  notify({
    userId: post.user_id, type: 'comment', actorId: req.user.id, postId: post.id,
    text: `${req.user.username} comentou: “${content.slice(0, 60)}”`, url: '/?focus=' + post.id,
  });
  const author = db.prepare('SELECT id, username, display_name, avatar_color FROM users WHERE id = ?').get(req.user.id);
  res.status(201).json({
    comment: {
      id, content, createdAt: nowIso(),
      author: { id: author.id, username: author.username, displayName: author.display_name, avatarColor: author.avatar_color },
    },
  });
});

router.get('/:id(\\d+)/comments', validateQuery(z.object({ cursor: z.coerce.number().int().positive().optional() })), (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.*, u.username, u.display_name, u.avatar_color FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.post_id = ? AND (? IS NULL OR c.id < ?)
       ORDER BY c.id DESC LIMIT 30`
    )
    .all(Number(req.params.id), req.validQuery.cursor ?? null, req.validQuery.cursor ?? null);
  res.json({
    comments: rows.map((c) => ({
      id: c.id, content: c.content, createdAt: c.created_at,
      author: { id: c.user_id, username: c.username, displayName: c.display_name, avatarColor: c.avatar_color },
    })),
  });
});

router.delete('/comments/:id(\\d+)', requireAuth, (req, res) => {
  const db = getDb();
  const c = db.prepare('SELECT * FROM comments WHERE id = ?').get(Number(req.params.id));
  if (!c) return res.status(404).json({ error: 'Comentário não encontrado.' });
  if (c.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Sem permissão.' });
  }
  db.prepare('DELETE FROM comments WHERE id = ?').run(c.id);
  res.json({ ok: true });
});

const voteSchema = z.object({ optionId: z.number().int().positive() });

router.post('/:id(\\d+)/vote', requireAuth, validateBody(voteSchema), (req, res) => {
  const db = getDb();
  const poll = db.prepare('SELECT * FROM polls WHERE post_id = ?').get(Number(req.params.id));
  if (!poll) return res.status(404).json({ error: 'Sondagem não encontrada.' });
  const opt = db.prepare('SELECT * FROM poll_options WHERE id = ? AND poll_id = ?').get(req.valid.optionId, poll.id);
  if (!opt) return res.status(400).json({ error: 'Opção inválida.' });
  db.prepare('DELETE FROM poll_votes WHERE user_id = ? AND option_id IN (SELECT id FROM poll_options WHERE poll_id = ?)').run(req.user.id, poll.id);
  db.prepare('INSERT INTO poll_votes (option_id, user_id, created_at) VALUES (?, ?, ?)').run(opt.id, req.user.id, nowIso());
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(poll.post_id);
  res.json({ post: serializePost(post, req.user.id) });
});

// --- Feed -------------------------------------------------------------------
const feedQuery = z.object({
  cursor: z.coerce.number().int().positive().optional(),
  filter: z.enum(['all', 'following']).default('all'),
  subject: z.string().trim().max(60).optional().default(''),
  hashtag: z.string().trim().max(40).optional().default(''),
});

router.get('/feed', validateQuery(feedQuery), (req, res) => {
  const db = getDb();
  const { cursor, filter, subject, hashtag } = req.validQuery;
  const viewerId = req.user?.id ?? null;
  const where = [];
  const params = [];
  if (cursor) { where.push('p.id < ?'); params.push(cursor); }
  if (subject) { where.push('p.subject = ?'); params.push(subject); }
  if (hashtag) { where.push(`(p.content LIKE ? ESCAPE '\\')`); params.push(`%#${hashtag.replace(/^#/, '')}%`); }
  if (filter === 'following' && viewerId) {
    where.push('(p.user_id IN (SELECT followee_id FROM follows WHERE follower_id = ?) OR p.user_id = ?)');
    params.push(viewerId, viewerId);
  }
  const sql = `SELECT p.* FROM posts p ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY p.id DESC LIMIT 15`;
  const rows = db.prepare(sql).all(...params);
  res.json({
    posts: rows.map((p) => serializePost(p, viewerId)),
    nextCursor: rows.length === 15 ? rows[rows.length - 1].id : null,
  });
});

router.get('/saved', requireAuth, (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT p.* FROM saves s JOIN posts p ON p.id = s.post_id
       WHERE s.user_id = ? AND (? IS NULL OR p.id < ?) ORDER BY s.created_at DESC LIMIT 20`
    )
    .all(req.user.id, req.query.cursor ? Number(req.query.cursor) : null, req.query.cursor ? Number(req.query.cursor) : null);
  res.json({ posts: rows.map((p) => serializePost(p, req.user.id)) });
});

router.get('/trending', (req, res) => {
  const db = getDb();
  // hashtags mais frequentes nos últimos 7 dias
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const rows = db.prepare('SELECT content FROM posts WHERE created_at >= ? ORDER BY id DESC LIMIT 300').all(since);
  const counts = new Map();
  for (const r of rows) {
    for (const t of r.content.match(/#[\p{L}\p{N}]{2,30}/gu) || []) {
      const tag = t.toLowerCase();
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  const hashtags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag, count]) => ({ tag, count }));
  const subjects = db
    .prepare(`SELECT subject, COUNT(*) c FROM posts WHERE subject != '' AND created_at >= ? GROUP BY subject ORDER BY c DESC LIMIT 6`)
    .all(since)
    .map((r) => ({ subject: r.subject, count: r.c }));
  res.json({ hashtags, subjects });
});

export default router;
