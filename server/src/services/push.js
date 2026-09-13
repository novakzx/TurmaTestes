/**
 * Notificações Push (Web Push + VAPID).
 * As chaves VAPID são geradas no primeiro arranque e persistidas em
 * server/data/vapid.json; em produção devem ser definidas via ambiente
 * (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY) — ver docs/03-seguranca-gdpr.md.
 */
import fs from 'node:fs';
import webpush from 'web-push';
import { config } from '../config.js';
import { getDb, nowIso } from '../db/index.js';

let ready = false;
let publicKey = null;

function loadVapid() {
  if (ready) return publicKey;
  let keys;
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    keys = { publicKey: process.env.VAPID_PUBLIC_KEY, privateKey: process.env.VAPID_PRIVATE_KEY };
  } else {
    if (fs.existsSync(config.vapid.keysFile)) {
      keys = JSON.parse(fs.readFileSync(config.vapid.keysFile, 'utf8'));
    } else {
      keys = webpush.generateVAPIDKeys();
      fs.writeFileSync(config.vapid.keysFile, JSON.stringify(keys, null, 2), { mode: 0o600 });
    }
  }
  webpush.setVapidDetails(config.vapid.subject, keys.publicKey, keys.privateKey);
  ready = true;
  publicKey = keys.publicKey;
  return publicKey;
}

export function getVapidPublicKey() {
  return loadVapid();
}

/** Envia push a um utilizador; remove subscrições mortas (404/410 Gone). */
export async function sendPush(userId, { title, body, url = '/', tag }) {
  loadVapid();
  const db = getDb();
  const user = db.prepare('SELECT push_enabled FROM users WHERE id = ?').get(userId);
  if (!user || !user.push_enabled) return;
  const subs = db
    .prepare('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?')
    .all(userId);
  const payload = JSON.stringify({ title, body, url, tag });
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          db.prepare('DELETE FROM push_subscriptions WHERE id = ?').run(s.id);
        }
      }
    })
  );
}

export function saveSubscription(userId, sub) {
  loadVapid();
  const db = getDb();
  db.prepare(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth`
  ).run(userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, nowIso());
}

export function removeSubscription(userId, endpoint) {
  getDb()
    .prepare('DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?')
    .run(userId, endpoint);
}
