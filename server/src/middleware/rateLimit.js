import rateLimit from 'express-rate-limit';

const json = (msg) => (req, res) =>
  res.status(429).json({ error: msg });

/** Limite global da API por IP. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 900,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json('Demasiados pedidos. Tenta novamente dentro de minutos.'),
});

/** Limite apertado para autenticação (mitiga força bruta / credential stuffing). */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 25,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || req.body?.username || '').toLowerCase()}`,
  handler: json('Demasiadas tentativas de início de sessão. Aguarda 15 minutos.'),
});

/** Limite do Explicador (custo por pedido mais elevado). */
export const tutorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json('Limite de dúvidas por hora atingido. Faz uma pausa para estudar 🙂'),
});

/** Limite de envio de mensagens (mitiga spam). */
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: json('Estás a enviar mensagens demasiado rápido. Abranda um pouco.'),
});
