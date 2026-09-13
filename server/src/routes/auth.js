import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb, nowIso, audit, insertReturningId } from '../db/index.js';
import { validateBody, cleanText } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { signToken, setAuthCookie, clearAuthCookie, issueCsrf } from '../middleware/auth.js';

const router = Router();

export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    displayName: u.display_name,
    email: u.email,
    avatarColor: u.avatar_color,
    bio: u.bio,
    school: u.school,
    district: u.district,
    municipality: u.municipality,
    gradeYear: u.grade_year,
    course: u.course,
    isPrivate: !!u.is_private,
    role: u.role,
    pushEnabled: !!u.push_enabled,
    theme: u.theme,
    createdAt: u.created_at,
  };
}

const AVATAR_COLORS = ['#16A34A', '#2563EB', '#DB2777', '#D97706', '#7C3AED', '#0891B2', '#DC2626', '#4F46E5', '#059669', '#E11D48'];

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido').max(160),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._]{3,24}$/, '3–24 caracteres: letras minúsculas, números, ponto ou underscore'),
  password: z
    .string()
    .min(8, 'Mínimo de 8 caracteres')
    .max(128)
    .regex(/[a-zA-Z]/, 'Tem de incluir letras')
    .regex(/[0-9]/, 'Tem de incluir números'),
  displayName: z.string().trim().min(2, 'Nome demasiado curto').max(60),
  school: z.string().trim().max(120).optional().default(''),
  district: z.string().trim().max(60).optional().default(''),
  municipality: z.string().trim().max(80).optional().default(''),
  gradeYear: z.string().trim().max(40).optional().default(''),
  course: z.string().trim().max(80).optional().default(''),
  consentTerms: z.literal(true, { errorMap: () => ({ message: 'Tens de aceitar os Termos' }) }),
  consentPrivacy: z.literal(true, { errorMap: () => ({ message: 'Tens de aceitar a Política de Privacidade' }) }),
});

const loginSchema = z.object({
  identifier: z.string().trim().toLowerCase().min(3).max(160),
  password: z.string().min(1).max(128),
});

router.post('/register', authLimiter, validateBody(registerSchema), (req, res) => {
  const db = getDb();
  const d = req.valid;
  const existsEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(d.email);
  const existsUser = db.prepare('SELECT id FROM users WHERE username = ?').get(d.username);
  if (existsEmail) return res.status(409).json({ error: 'Já existe uma conta com este email.' });
  if (existsUser) return res.status(409).json({ error: 'Este nome de utilizador já está em uso.' });

  const now = nowIso();
  const id = insertReturningId(
    `INSERT INTO users (email, username, display_name, password_hash, avatar_color, school, district, municipality,
       grade_year, course, consent_terms_at, consent_privacy_at, created_at, last_seen_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      d.email, d.username, cleanText(d.displayName, 60), bcrypt.hashSync(d.password, 12),
      AVATAR_COLORS[id_hash(d.username) % AVATAR_COLORS.length],
      cleanText(d.school, 120), cleanText(d.district, 60), cleanText(d.municipality, 80),
      cleanText(d.gradeYear, 40), cleanText(d.course, 80), now, now, now, now,
    ]
  );
  audit(req, 'auth.register', 'ok', `username=${d.username}`, id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  setAuthCookie(res, signToken(user));
  res.status(201).json({ user: publicUser(user) });
});

router.post('/login', authLimiter, validateBody(loginSchema), (req, res) => {
  const db = getDb();
  const { identifier, password } = req.valid;
  const user = db
    .prepare('SELECT * FROM users WHERE email = ? OR username = ?')
    .get(identifier, identifier);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    audit(req, 'auth.login', 'fail', `identifier=${identifier.slice(0, 60)}`);
    // resposta idêntica para credenciais erradas (não revela se a conta existe)
    return res.status(401).json({ error: 'Credenciais inválidas.' });
  }
  db.prepare('UPDATE users SET last_seen_at = ? WHERE id = ?').run(nowIso(), user.id);
  audit(req, 'auth.login', 'ok', '', user.id);
  setAuthCookie(res, signToken(user));
  res.json({ user: publicUser(user) });
});

router.post('/logout', requireAuth, (req, res) => {
  audit(req, 'auth.logout');
  clearAuthCookie(res);
  res.cookie('tm_csrf', '', { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 0 });
  res.json({ ok: true });
});

router.get('/session', (req, res) => {
  issueCsrf(req, res);
  if (!req.user) return res.json({ user: null });
  const user = getDb().prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  res.json({ user: publicUser(user) });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(128),
  newPassword: z.string().min(8).max(128).regex(/[a-zA-Z]/).regex(/[0-9]/),
});

router.patch('/password', requireAuth, authLimiter, validateBody(passwordSchema), (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(req.valid.currentPassword, user.password_hash)) {
    audit(req, 'auth.password_change', 'fail', 'password atual incorreta');
    return res.status(401).json({ error: 'Palavra-passe atual incorreta.' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(req.valid.newPassword, 12), user.id);
  audit(req, 'auth.password_change', 'ok');
  res.json({ ok: true });
});

function id_hash(s) {
  let h = 0;
  for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

export default router;
