/**
 * Lembretes automáticos de calendário: na véspera de feriados/greves
 * relevantes para o município/distrito/região de cada estudante, cria uma
 * notificação in-app e envia push (com deduplicação por utilizador+evento).
 */
import { getDb, nowIso } from '../db/index.js';
import { notify } from './notify.js';
import { slugify, fmtDate, addDays } from './pt-calendar.js';

export function runCalendarReminders(today = new Date()) {
  const db = getDb();
  const tomorrow = addDays(fmtDate(today), 1);
  const events = db
    .prepare(
      `SELECT * FROM calendar_events
       WHERE date_start = ? AND type IN ('holiday_national','holiday_regional','holiday_municipal','strike')`
    )
    .all(tomorrow);
  if (!events.length) return 0;

  const users = db.prepare('SELECT id, municipality, district FROM users').all();
  let sent = 0;
  const already = db.prepare('SELECT 1 FROM reminder_sent WHERE user_id = ? AND event_id = ? AND kind = ?');
  const mark = db.prepare('INSERT OR IGNORE INTO reminder_sent (user_id, event_id, kind, sent_at) VALUES (?, ?, ?, ?)');

  for (const u of users) {
    const mun = slugify(u.municipality || '');
    const dist = slugify(u.district || '');
    for (const e of events) {
      let relevant = e.scope === 'national';
      if (!relevant && e.scope.startsWith('municipality:') && mun) relevant = e.region_key === mun;
      if (!relevant && e.scope.startsWith('district:') && dist) relevant = e.region_key === dist;
      if (!relevant && e.scope === 'region:acores' && dist === 'acores') relevant = true;
      if (!relevant && e.scope === 'region:madeira' && dist === 'madeira') relevant = true;
      if (!relevant) continue;
      if (already.get(u.id, e.id, 'eve')) continue;
      mark.run(u.id, e.id, 'eve', nowIso());
      const when = e.type === 'strike' ? 'Greve amanhã' : 'Feriado amanhã';
      notify({
        userId: u.id, type: 'calendar', postId: null,
        text: `${when}: ${e.title}`, url: '/calendario', push: true,
      });
      sent++;
    }
  }
  return sent;
}

/** Arranca o verificador periódico (a cada hora + no arranque). */
export function startReminderScheduler() {
  const tick = () => {
    try {
      const n = runCalendarReminders();
      if (n) console.log(`[lembretes] ${n} notificações de calendário enviadas`);
    } catch (err) {
      console.error('[lembretes] erro:', err.message);
    }
  };
  tick();
  const t = setInterval(tick, 60 * 60 * 1000);
  t.unref?.();
  return t;
}
