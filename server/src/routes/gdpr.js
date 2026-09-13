/**
 * Endpoints GDPR — direitos do titular dos dados (RGPD art. 15–17 e 20):
 * acesso/portabilidade (exportação JSON) e apagamento ("direito a ser esquecido").
 */
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getDb, audit } from '../db/index.js';
import { requireAuth, clearAuthCookie } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.get('/export', requireAuth, (req, res) => {
  const db = getDb();
  const id = req.user.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  delete user.password_hash; // nunca exportar credenciais
  const data = {
    exportadoEm: new Date().toISOString(),
    conta: user,
    publicacoes: db.prepare('SELECT * FROM posts WHERE user_id = ?').all(id),
    comentarios: db.prepare('SELECT * FROM comments WHERE user_id = ?').all(id),
    gostos: db.prepare('SELECT * FROM likes WHERE user_id = ?').all(id),
    guardados: db.prepare('SELECT * FROM saves WHERE user_id = ?').all(id),
    seguidores: db.prepare('SELECT * FROM follows WHERE followee_id = ?').all(id),
    aSeguir: db.prepare('SELECT * FROM follows WHERE follower_id = ?').all(id),
    conversas: db
      .prepare('SELECT c.* FROM conversations c JOIN conversation_members cm ON cm.conversation_id = c.id WHERE cm.user_id = ?')
      .all(id),
    mensagens: db.prepare('SELECT * FROM messages WHERE user_id = ?').all(id),
    fichasExplicador: db.prepare('SELECT id, subject, question, ficha, saved, created_at FROM tutor_fichas WHERE user_id = ?').all(id),
    notificacoes: db.prepare('SELECT * FROM notifications WHERE user_id = ?').all(id),
    consensosEPrivacidade: {
      termosAceitesEm: user.consent_terms_at,
      privacidadeAceiteEm: user.consent_privacy_at,
    },
  };
  audit(req, 'gdpr.export');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="turma-mais-os-meus-dados.json"`);
  res.send(JSON.stringify(data, null, 2));
});

const deleteSchema = z.object({ password: z.string().min(1).max(128) });

router.delete('/account', requireAuth, validateBody(deleteSchema), (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(req.valid.password, user.password_hash)) {
    audit(req, 'gdpr.delete_account', 'fail', 'palavra-passe incorreta');
    return res.status(401).json({ error: 'Palavra-passe incorreta.' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(user.id); // cascata remove todos os dados
  db.prepare('DELETE FROM reminder_sent WHERE user_id = ?').run(user.id);
  audit({ ...req, user: null }, 'gdpr.delete_account', 'ok', `username=${user.username}`);
  clearAuthCookie(res);
  res.json({ ok: true });
});

export default router;
