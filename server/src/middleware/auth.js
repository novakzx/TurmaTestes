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

/** Protege métodos de mutação com dupla submissão de token CSRF + verificação de Origin. */
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
  const cookieToken = req.cookies?.tm_csrf;
  const headerToken = req.get('x-csrf-token');
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'Token CSRF inválido ou em falta. Recarrega a página.' });
  }
  next();
}

/** Anexa req.user se existir sessão válida; renova o token a meio do TTL (sessão deslizante). */
export function authenticate(req, res, next) {
  const token = req.cookies?.[config.jwt.cookie];
  if (token) {
    try {
      const payload = jwt.verify(token, config.jwt.secret);
      req.user = { id: payload.sub, username: payload.username, role: payload.role };
      const ttlLeft = payload.exp * 1000 - Date.now();
      if (ttlLeft < 6 * 3600 * 1000) {
        setAuthCookie(res, signToken({ id: payload.sub, username: payload.username, role: payload.role }));
      }
    } catch {
      // token inválido/expirado → trata como anónimo
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
