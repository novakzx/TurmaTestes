import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

process.env.NODE_ENV = 'test';
process.env.DB_FILE = `/tmp/turma-test-${process.pid}.db`;
fs.rmSync(process.env.DB_FILE, { force: true });

const { createApp } = await import('../src/app.js');
const { ensureSeed } = await import('../src/db/seed.js');
const { getDb } = await import('../src/db/index.js');

let server;
let base;

/** Mini jar de cookies para fetch (undici não guarda cookies). */
const jar = new Map();
const cookieHeader = () => [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
function storeCookies(res) {
  for (const sc of res.headers.getSetCookie?.() || []) {
    const [pair] = sc.split(';');
    const [k, ...rest] = pair.split('=');
    jar.set(k.trim(), rest.join('='));
  }
}
async function call(path, { method = 'GET', body, csrf = true } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (csrf && jar.has('tm_csrf')) headers['x-csrf-token'] = jar.get('tm_csrf');
  if (jar.size) headers.Cookie = cookieHeader();
  const res = await fetch(base + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  storeCookies(res);
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return { status: res.status, data, res };
}

before(async () => {
  getDb();
  ensureSeed();
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;
  await call('/auth/session'); // recebe o cookie CSRF
});

after(() => {
  server?.close();
  fs.rmSync(process.env.DB_FILE, { force: true });
});

test('saúde e sessão anónima', async () => {
  const { status, data } = await call('/health', { csrf: false });
  assert.equal(status, 200);
  assert.equal(data.ok, true);
  const s = await call('/auth/session', { csrf: false });
  assert.equal(s.data.user, null);
});

test('login com credenciais erradas → 401 genérico', async () => {
  const { status, data } = await call('/auth/login', { method: 'POST', body: { identifier: 'maria.silva', password: 'errada-123' } });
  assert.equal(status, 401);
  assert.equal(data.error, 'Credenciais inválidas.');
});

test('mutação sem token CSRF → 403', async () => {
  const jarBackup = jar.get('tm_csrf');
  jar.delete('tm_csrf');
  const { status } = await call('/posts', { method: 'POST', body: { content: 'x' }, csrf: false });
  assert.equal(status, 403);
  if (jarBackup) jar.set('tm_csrf', jarBackup);
});

test('registo + sessão + perfil', async () => {
  const payload = {
    email: 'aluno.teste@exemplo.pt', username: 'aluno.teste', password: 'Testando123',
    displayName: 'Aluno Teste', school: 'EB 2,3 de Teste', district: 'Lisboa',
    municipality: 'Lisboa', gradeYear: '9.º ano', course: '',
    consentTerms: true, consentPrivacy: true,
  };
  const r = await call('/auth/register', { method: 'POST', body: payload });
  assert.equal(r.status, 201);
  assert.equal(r.data.user.username, 'aluno.teste');
  const me = await call('/users/me');
  assert.equal(me.data.user.username, 'aluno.teste');
  assert.equal(me.data.user.email, 'aluno.teste@exemplo.pt');

  // registo sem consentimento é rejeitado
  const bad = await call('/auth/register', { method: 'POST', body: { ...payload, username: 'outro.aluno', consentTerms: false } });
  assert.equal(bad.status, 400);
});

test('password fraca é rejeitada', async () => {
  const r = await call('/auth/register', {
    method: 'POST',
    body: { email: 'fraca@exemplo.pt', username: 'fraca.conta', password: 'abc', displayName: 'Fraca', consentTerms: true, consentPrivacy: true },
  });
  assert.equal(r.status, 400);
});

test('login da conta demo + criação de post + feed', async () => {
  const login = await call('/auth/login', { method: 'POST', body: { identifier: 'maria.silva', password: 'Estudante2026!' } });
  assert.equal(login.status, 200);

  const post = await call('/posts', { method: 'POST', body: { content: 'Post de teste com #hashtag e muita vontade ☀️', subject: 'Matemática A' } });
  assert.equal(post.status, 201);
  assert.deepEqual(post.data.post.hashtags, ['#hashtag']);

  const feed = await call('/posts/feed');
  assert.equal(feed.status, 200);
  assert.ok(feed.data.posts.some((p) => p.id === post.data.post.id));

  // XSS cru é armazenado como texto (renderização React escapa; sem innerHTML no cliente)
  const xss = await call('/posts', { method: 'POST', body: { content: '<script>alert(1)</script> ok' } });
  assert.equal(xss.status, 201);
  assert.equal(xss.data.post.content, '<script>alert(1)</script> ok');

  // like / unlike
  const like = await call(`/posts/${post.data.post.id}/like`, { method: 'POST' });
  assert.equal(like.data.liked, true);
  const unlike = await call(`/posts/${post.data.post.id}/like`, { method: 'POST' });
  assert.equal(unlike.data.liked, false);
});

test('calendário: feriados nacionais e municipais corretos', async () => {
  const dez = await call('/calendar/month?year=2026&month=12&municipality=Lisboa');
  assert.equal(dez.status, 200);
  const titles = dez.data.events.map((e) => e.title);
  assert.ok(titles.some((t) => t.includes('Natal')));
  assert.ok(titles.some((t) => t.includes('Restauração da Independência')));

  const jun = await call('/calendar/month?year=2026&month=6&municipality=Lisboa');
  const junTitles = jun.data.events.map((e) => e.title);
  assert.ok(junTitles.some((t) => t.includes('Santo António')), 'feriado municipal de Lisboa em junho');
  assert.ok(junTitles.some((t) => t.includes('Dia de Portugal')), '10 de junho nacional');

  // anónimo e sem município → sem feriados municipais (a região vem do perfil/logado)
  const anon = await fetch(base + '/calendar/month?year=2026&month=6', { headers: { Cookie: 'x=y' } });
  const semMun = { data: await anon.json() };
  assert.ok(!semMun.data.events.some((e) => e.type === 'holiday_municipal'));

  // páscoa 2026 = 5 de abril (móvel, calculado)
  const abr = await call('/calendar/day?date=2026-04-05');
  assert.ok(abr.data.events.some((e) => e.title.includes('Domingo de Páscoa')));
});

test('exportação iCal devolve VCALENDAR', async () => {
  const res = await fetch(base + '/calendar/export.ics?year=2026', { headers: { Cookie: cookieHeader() } });
  assert.equal(res.status, 200);
  const text = await res.text();
  assert.match(text, /BEGIN:VCALENDAR/);
  assert.match(text, /DTSTART;VALUE=DATE:20261225/);
});

test('Explicador: ficha local de equação do 2.º grau', async () => {
  const r = await call('/tutor/ficha', { method: 'POST', body: { question: 'como resolvo uma equação do 2.º grau?', subject: 'Matemática A' } });
  assert.equal(r.status, 200);
  assert.equal(r.data.engine, 'local');
  assert.match(r.data.ficha.titulo, /2.º grau/);
  assert.ok(r.data.ficha.passos.length >= 4);
});

test('Explicador: ferramenta de equações com passos', async () => {
  const r = await call('/tutor/tools', { method: 'POST', body: { kind: 'quadratic', text: 'x^2 - 5x + 6 = 0' } });
  assert.equal(r.status, 200);
  assert.deepEqual(r.data.result.solutions.sort(), [2, 3]);
});

test('Explicador: calculadora rejeita injeção de código', async () => {
  const r = await call('/tutor/tools', { method: 'POST', body: { kind: 'expression', expression: '1+1;process.exit()' } });
  assert.equal(r.status, 400);
});

test('conversas: DM deduplicada, mensagem, leitura', async () => {
  const c1 = await call('/conversations', { method: 'POST', body: { type: 'dm', username: 'rita.rodrigues' } });
  assert.equal(c1.status, 201);
  const id = c1.data.conversation.id;
  const c2 = await call('/conversations', { method: 'POST', body: { type: 'dm', username: 'rita.rodrigues' } });
  assert.equal(c2.data.conversation.id, id, 'mesma DM reutilizada');

  const msg = await call(`/conversations/${id}/messages`, { method: 'POST', body: { content: 'Olá do teste automatizado!' } });
  assert.equal(msg.status, 201);

  const list = await call(`/conversations/${id}/messages`);
  assert.ok(list.data.messages.some((m) => m.content === 'Olá do teste automatizado!'));
});

test('rotas protegidas sem sessão → 401', async () => {
  const jarBackup = [...jar.entries()];
  jar.clear();
  const r = await call('/users/me', { csrf: false });
  assert.equal(r.status, 401);
  for (const [k, v] of jarBackup) jar.set(k, v);
});

test('GDPR: exportação inclui os dados da conta', async () => {
  const res = await fetch(base + '/gdpr/export', { headers: { Cookie: cookieHeader() } });
  assert.equal(res.status, 200);
  const data = JSON.parse(await res.text());
  assert.equal(data.conta.username, 'maria.silva');
  assert.ok(Array.isArray(data.mensagens));
});
