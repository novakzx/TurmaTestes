import { Router } from 'express';
import { z } from 'zod';
import { getDb, nowIso, insertReturningId } from '../db/index.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { tutorLimiter } from '../middleware/rateLimit.js';
import { generateFicha, calcTool } from '../services/tutor/engine.js';
import { buildStudyPlan } from '../services/tutor/math.js';
import { SUBJECTS } from '../services/tutor/knowledge.js';

const router = Router();

router.get('/subjects', (req, res) => res.json({ subjects: SUBJECTS }));

const fichaSchema = z.object({
  question: z.string().trim().min(4, 'Escreve a dúvida com mais detalhe (mínimo 4 caracteres)').max(1000),
  subject: z.string().trim().max(40).optional().default(''),
});

/** Gera uma "ficha de estudo" para a dúvida (motor local ou LLM configurado). */
router.post('/ficha', requireAuth, tutorLimiter, validateBody(fichaSchema), async (req, res) => {
  const { question, subject } = req.valid;
  const { ficha, engine } = await generateFicha({ question, subject });
  const id = insertReturningId(
    'INSERT INTO tutor_fichas (user_id, subject, question, ficha, saved, created_at) VALUES (?, ?, ?, ?, 0, ?)',
    [req.user.id, subject, question, JSON.stringify(ficha), nowIso()]
  );
  res.json({ id, ficha, engine });
});

router.get('/fichas', requireAuth, (req, res) => {
  const rows = getDb()
    .prepare(
      `SELECT id, subject, question, ficha, saved, created_at FROM tutor_fichas
       WHERE user_id = ? AND (? = '1' OR saved = 0 OR saved = 1) ORDER BY id DESC LIMIT 50`
    )
    .all(req.user.id, req.query.saved === '1' ? '1' : '0');
  res.json({
    fichas: rows.map((r) => ({
      id: r.id, subject: r.subject, question: r.question,
      ficha: JSON.parse(r.ficha), saved: !!r.saved, createdAt: r.created_at,
    })),
  });
});

router.post('/fichas/:id(\\d+)/save', requireAuth, (req, res) => {
  const db = getDb();
  const f = db.prepare('SELECT * FROM tutor_fichas WHERE id = ? AND user_id = ?').get(Number(req.params.id), req.user.id);
  if (!f) return res.status(404).json({ error: 'Ficha não encontrada.' });
  db.prepare('UPDATE tutor_fichas SET saved = ? WHERE id = ?').run(f.saved ? 0 : 1, f.id);
  res.json({ saved: !f.saved });
});

router.delete('/fichas/:id(\\d+)', requireAuth, (req, res) => {
  getDb().prepare('DELETE FROM tutor_fichas WHERE id = ? AND user_id = ?').run(Number(req.params.id), req.user.id);
  res.json({ ok: true });
});

const toolSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('expression'), expression: z.string().trim().min(1).max(200) }),
  z.object({
    kind: z.literal('quadratic'),
    a: z.coerce.number().optional(), b: z.coerce.number().optional(), c: z.coerce.number().optional(),
    text: z.string().trim().max(120).optional(),
  }),
  z.object({ kind: z.literal('derivative'), expression: z.string().trim().min(1).max(200) }),
]);

router.post('/tools', requireAuth, tutorLimiter, validateBody(toolSchema), (req, res) => {
  try {
    const result = calcTool(req.valid.kind, req.valid);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Não consegui calcular.' });
  }
});

const planSchema = z.object({
  subject: z.string().trim().min(2).max(60),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hoursPerWeek: z.coerce.number().int().min(1).max(40).default(6),
});

router.post('/plan', requireAuth, validateBody(planSchema), (req, res) => {
  try {
    const plan = buildStudyPlan(req.valid);
    res.json({ plan });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
