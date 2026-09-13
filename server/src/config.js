import { z } from 'zod';

/**
 * Configuração central do servidor Turma+.
 * Em produção todos os segredos devem vir de variáveis de ambiente
 * (ver docs/03-seguranca-gdpr.md). Em desenvolvimento, segredos são
 * gerados automaticamente e persistidos em server/data/ para conveniência.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

function persistedSecret(file, envValue) {
  if (envValue) return envValue;
  const p = path.join(DATA_DIR, file);
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8').trim();
  const v = crypto.randomBytes(48).toString('hex');
  fs.writeFileSync(p, v, { mode: 0o600 });
  return v;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  // URL pública (usada para cookies "secure" e absolute URLs). Em produção: https://…
  PUBLIC_URL: z.string().default(''),
  JWT_SECRET: z.string().optional(),
  DB_FILE: z.string().default(path.join(DATA_DIR, 'turma.db')),
  // Provedor de IA do Explicador (opcional). Sem configuração, é usado o
  // motor local de apoio ao estudo (funciona 100% offline).
  AI_PROVIDER: z.enum(['local', 'openai']).default('local'),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  VAPID_SUBJECT: z.string().default('mailto:suporte@turmamais.pt'),
  // Servir o build do cliente (produção) — desativar em dev (Vite trata disso)
  SERVE_CLIENT: z.enum(['true', 'false']).default('true'),
  CLIENT_DIST: z.string().default(path.resolve(__dirname, '..', '..', 'client', 'dist')),
});

const env = envSchema.parse(process.env);

export const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  publicUrl: env.PUBLIC_URL,
  dbFile: env.DB_FILE,
  jwt: {
    secret: persistedSecret('jwt.secret', env.JWT_SECRET),
    accessTtl: '12h', // token deslizante; em produção usar par access/refresh curto
    cookie: 'tm_access',
  },
  ai: {
    provider: env.AI_PROVIDER,
    apiKey: env.AI_API_KEY,
    baseUrl: env.AI_BASE_URL,
    model: env.AI_MODEL,
  },
  vapid: {
    subject: env.VAPID_SUBJECT,
    keysFile: path.join(DATA_DIR, 'vapid.json'),
  },
  serveClient: env.SERVE_CLIENT === 'true',
  clientDist: env.CLIENT_DIST,
  dataDir: DATA_DIR,
};
