import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config.js';

const COOKIE_OPTS = () => ({
  httpOnly: true,
  sameSite: 'lax', // mitiga CSRF em pedidos cross-site
  secure: config.isProd || config.publicUrl.startsWith('https'),
  path: '/',
});

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.accessTtl }
  );
}

export function setAuthCookie(res, token) {
  res.cookie(config.jwt.cookie, token, { ...COOKIE_OPTS(), maxAge: 12 * 3600 * 1000 });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.jwt.cookie, COOKIE_OPTS());
}

/** Cookie CSRF de submissão dupla (legível pelo JS do cliente, não httpOnly). */
export function issueCsrf(req, res) {
  let token = req.cookies?.tm_csrf;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) {
    token = crypto.randomBytes(32).toString('hex');
  }
  res.cookie('tm_csrf', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: config.isProd || config.publicUrl.startsWith('https'),
    path: '/',
  });
  return token;
}

/** Token Bearer no header Authorization (fallback quando cookies são bloqueados,
 *  ex.: preview embebido em iframe com cookies de terceiros bloqueados). */
export function bearerToken(req) {
  const m = (req.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch {
    return null;
  }
}

/** Endpoints isentos de dupla-submissão CSRF: a proteção contra CSRF é feita
 *  pela verificação de Origin (abaixo) + rate limiting. (Login CSRF é mitigado
 *  por esses dois mecanismos; o risco residual é aceitável e documentado.) */
const CSRF_EXEMPT = ['/auth/login', '/auth/register'];

/** Protege métodos de mutação:
 *  - pedidos autenticados por Bearer não precisam de CSRF (o header não pode
 *    ser forçado por outro site sem CORS);
 *  - pedidos por cookie exigem dupla submissão + Origin válido. */
export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const origin = req.get('origin');
  if (origin) {
    const host = req.get('host');
    let originHost;
    try { originHost = new URL(origin).host; } catch { originHost = null; }
    // aceita mesma origem (produção) ou o dev server Vite (localhost:5173)
    const allowed = originHost === host || (originHost || '').endsWith('localhost:5173') || (originHost || '').match(/^[0-9a-z-]+\.e2b\.app$/i);
    if (!allowed) return res.status(403).json({ error: 'Origem não permitida.' });
  }

  if (bearerToken(req) && verifyToken(bearerToken(req))) return next();
  if (CSRF_EXEMPT.includes(req.path)) return next();

  const cookieToken = req.cookies?.tm_csrf;
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Token CSRF inválido ou em falta. Recarrega a página.' });
  }
  next();
}

/** Anexa req.user se existir sessão válida (Bearer ou cookie);
 *  renova o token a meio do TTL (sessão deslizante). */
export function authenticate(req, res, next) {
  let payload = null;
  const bearer = bearerToken(req);
  if (bearer) {
    payload = verifyToken(bearer);
    if (payload) req.authVia = 'bearer';
  }
  const token = !payload ? req.cookies?.[config.jwt.cookie] : null;
  if (!payload && token) {
    payload = verifyToken(token);
    if (payload) req.authVia = 'cookie';
  }
  if (payload) {
    req.user = { id: payload.sub, username: payload.username, role: payload.role };
    const ttlLeft = payload.exp * 1000 - Date.now();
    if (ttlLeft < 6 * 3600 * 1000) {
      setAuthCookie(res, signToken({ id: payload.sub, username: payload.username, role: payload.role }));
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Precisas de iniciar sessão.' });
  }
  next();
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso reservado à equipa Turma+.' });
  }
  next();
}
