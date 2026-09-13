import { createApp } from './app.js';
import { config } from './config.js';
import { getDb } from './db/index.js';
import { ensureSeed } from './db/seed.js';
import { startReminderScheduler } from './services/reminders.js';

const app = createApp();

// Primeira execução: cria dados de demonstração + calendário oficial
getDb();
const seeded = ensureSeed();
if (seeded) console.log('[seed] dados de demonstração criados (conta demo: maria.silva / Estudante2026!)');

startReminderScheduler();

const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`Turma+ API em http://0.0.0.0:${config.port} (${config.env})`);
  if (config.serveClient) console.log(`   a servir o cliente PWA de ${config.clientDist}`);
});

// Encerramento gracioso
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    console.log(`\n${sig} — a encerrar…`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
