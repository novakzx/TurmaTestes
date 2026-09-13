import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { authenticate, csrfProtection, issueCsrf } from './middleware/auth.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { audit } from './db/index.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import postRoutes from './routes/posts.js';
import conversationRoutes from './routes/conversations.js';
import calendarRoutes from './routes/calendar.js';
import tutorRoutes from './routes/tutor.js';
import notificationRoutes from './routes/notifications.js';
import gdprRoutes from './routes/gdpr.js';
import eventRoutes from './routes/events.js';

export function createApp() {
  const app = express();

  // Atrás de proxy TLS (produção/preview): IPs reais + cookies "secure" corretos
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'blob:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", 'data:'],
          manifestSrc: ["'self'"],
          workerSrc: ["'self'", 'blob:'],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.isProd ? [] : null,
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      hsts: config.isProd ? { maxAge: 31536000, includeSubDomains: true, preload: false } : false,
    })
  );

  app.use(express.json({ limit: '64kb' })); // payloads pequenos mitigam abuso
  app.use(cookieParser());

  // CSRF em todas as mutações da API (dupla submissão + verificação de Origin)
  app.use('/api', (req, res, next) => {
    issueCsrf(req, res); // garante cookie CSRF mesmo antes do login
    csrfProtection(req, res, next);
  });

  app.get('/api/health', (req, res) => res.json({ ok: true, service: 'turma-mais-api', ts: new Date().toISOString() }));

  app.use('/api/auth', apiLimiter, authenticate, authRoutes);
  app.use('/api/users', apiLimiter, authenticate, userRoutes);
  app.use('/api/posts', apiLimiter, authenticate, postRoutes);
  app.use('/api/conversations', apiLimiter, authenticate, conversationRoutes);
  app.use('/api/calendar', apiLimiter, authenticate, calendarRoutes);
  app.use('/api/tutor', apiLimiter, authenticate, tutorRoutes);
  app.use('/api/notifications', apiLimiter, authenticate, notificationRoutes);
  app.use('/api/gdpr', apiLimiter, authenticate, gdprRoutes);
  app.use('/api/events', authenticate, eventRoutes);

  // 401 em rotas de API desconhecidas
  app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint não encontrado.' }));

  // Registo de tentativas não autenticadas em endpoints sensíveis (auditoria)
  app.use('/api', (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode === 401 || res.statusCode === 403) {
        audit(req, 'access.denied', 'fail', `${req.method} ${req.originalUrl} → ${res.statusCode}`);
      }
    });
    next();
  });

  // Produção: servir o build do cliente (PWA) a partir do mesmo domínio
  if (config.serveClient && fs.existsSync(path.join(config.clientDist, 'index.html'))) {
    app.use(express.static(config.clientDist, { maxAge: config.isProd ? '7d' : 0, index: false }));
    app.get('*', (req, res) => res.sendFile(path.join(config.clientDist, 'index.html')));
  } else {
    app.get('/', (req, res) =>
      res.json({ service: 'Turma+ API', docs: 'docs/', dev: 'Corre o cliente: npm --prefix client run dev (http://localhost:5173)' })
    );
  }

  // Handler de erros — nunca expor stack traces ao cliente
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('[erro]', err.message);
    audit(req, 'server.error', 'fail', err.message);
    if (res.headersSent) return;
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Pedido demasiado grande.' });
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON inválido.' });
    res.status(500).json({ error: 'Erro interno. Tenta novamente.' });
  });

  return app;
}
