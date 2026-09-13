import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let db;

/** Ligação única à base de dados (SQLite via node:sqlite — sem dependências nativas).
 *  O SQL utilizado é standard; a migração para PostgreSQL está documentada
 *  em docs/02-arquitetura.md. */
export function getDb() {
  if (!db) {
    if (config.dbFile !== ':memory:') {
      fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });
    }
    db = new DatabaseSync(config.dbFile);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA busy_timeout = 5000;');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema);
  }
  return db;
}

export const nowIso = () => new Date().toISOString();

/** Insere uma linha e devolve o id gerado (número simples). */
export function insertReturningId(sql, params) {
  const info = getDb().prepare(sql).run(...params);
  return Number(info.lastInsertRowid);
}

/** Registo de auditoria (segurança/GDPR): acessos, autenticação, ações sensíveis. */
export function audit(req, action, status = 'ok', detail = '', userId = null) {
  try {
    getDb()
      .prepare(
        `INSERT INTO audit_log (ts, ip, user_agent, user_id, action, status, detail)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        nowIso(),
        req?.ip || '',
        (req?.get?.('user-agent') || '').slice(0, 256),
        userId ?? req?.user?.id ?? null,
        action,
        status,
        String(detail).slice(0, 512)
      );
  } catch {
    /* auditoria nunca deve quebrar o pedido */
  }
}
