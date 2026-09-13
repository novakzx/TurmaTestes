import { getDb, nowIso } from '../db/index.js';
import { emitToUser } from './sse.js';
import { sendPush } from './push.js';

/**
 * Cria uma notificação in-app, emite por SSE (tempo real) e envia push
 * (respeitando as preferências do utilizador). Nunca lança — falhas de
 * notificação não podem quebrar a ação principal.
 */
export function notify({ userId, type, actorId = null, postId = null, conversationId = null, text = '', url = '', push = false }) {
  try {
    if (actorId && actorId === userId) return; // não notificar ações próprias
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO notifications (user_id, type, actor_id, post_id, conversation_id, text, url, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(userId, type, actorId, postId, conversationId, text, url, nowIso());
    const notif = {
      id: Number(info.lastInsertRowid),
      type,
      actorId,
      postId,
      conversationId,
      text,
      url,
      createdAt: nowIso(),
    };
    emitToUser(userId, 'notification', notif);
    if (push) {
      sendPush(userId, { title: 'Turma+', body: text, url, tag: `${type}-${notif.id}` }).catch(() => {});
    }
    return notif;
  } catch {
    return null;
  }
}
