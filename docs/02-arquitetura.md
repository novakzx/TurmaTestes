# Turma+ · Arquitetura Técnica (v1.0)

## 1. Diagrama geral

```
                        ┌──────────────────────────────┐
   Browser (PWA)        │  Service Worker (Workbox)    │
 ┌─────────────────┐    │  precache · SWR · BG-Sync    │
 │ React 18 + Vite │◄──►│  push handler · notificações │
 │  SPA pt-PT      │    └──────────────┬───────────────┘
 │  Router · SSE   │                   │ offline-first
 └────────┬────────┘                   │
          │ HTTPS same-origin (/api, /)│
          ▼                            ▼
 ┌───────────────────────────────────────────────────────────┐
 │                    Node.js 20+ · Express                  │
 │  helmet(CSP/HSTS) · cookie-parser · rate-limits · CSRF    │
 │  authenticate (JWT cookie) · validate (Zod) · audit log   │
 ├───────────────┬───────────────┬───────────────┬───────────┤
 │ rotas REST    │ SSE /events   │ Web Push      │ scheduler │
 │ /auth /users  │ (tempo real)  │ (VAPID)       │ lembretes │
 │ /posts /conv  │               │               │ calendário│
 │ /calendar     │               │               │           │
 │ /tutor /gdpr  │               │               │           │
 ├───────────────┴───────────────┴───────────────┴───────────┤
 │ Serviços: notify · sse · push · pt-calendar · tutor/*     │
 ├───────────────────────────────────────────────────────────┤
 │ SQLite (node:sqlite, WAL) — esquema SQL standard          │
 │ (migração PostgreSQL documentada §6)                      │
 └───────────────────────────────────────────────────────────┘
```

**Monorepo:**
```
TurmaTestes/
├── client/            # PWA React (Vite + vite-plugin-pwa, injectManifest)
│   ├── src/
│   │   ├── api/client.js        # fetch same-origin + CSRF header
│   │   ├── store/               # AuthContext · RealtimeContext(SSE) · ToastContext
│   │   ├── components/          # Layout, PostCard, Composer, FichaCard, Modal, ícones SVG
│   │   ├── pages/               # Feed, Calendar, Messages, Chat, Tutor, Profile, …
│   │   ├── styles/global.css    # design system plano (tokens claro/escuro)
│   │   └── sw.js                # service worker Workbox
│   └── public/icons/            # ícones PWA gerados
├── server/            # API Express
│   └── src/
│       ├── config.js            # env + segredos (dev persiste em data/)
│       ├── db/ (schema.sql, seed.js, index.js)
│       ├── middleware/ (auth, validate, rateLimit)
│       ├── routes/ (auth, users, posts, conversations, calendar, tutor, notifications, gdpr, events)
│       └── services/ (notify, sse, push, reminders, pt-calendar, tutor/{engine,knowledge,math})
├── docs/              # este conjunto de documentos
└── package.json       # scripts do monorepo (dev/build/start/test)
```

## 2. Stack e justificação

| Camada | Escolha | Justificação |
|---|---|---|
| Frontend | **React 18 + Vite 5** | Ecossistema, HMR rápido, plugin PWA oficial (Workbox) |
| Estilos | CSS próprio com tokens | Zero dependências; controle total do design plano (sem gradientes) e temas |
| Router | react-router-dom 6 | Rotas SPA + parâmetros (`/mensagens/:id`, `/perfil/:username`) |
| Backend | **Node.js ≥20 + Express 4** | Mesma linguagem do cliente; middlewares maduros (helmet, rate-limit) |
| Base de dados | **SQLite (`node:sqlite`)** | Zero dependências nativas (importante para CI/sandbox), transacional, WAL; SQL standard → migração PG direta |
| Validação | **Zod** | Schemas partilháveis, mensagens de erro pt-PT, parsing de query/body |
| Auth | **JWT (HS256) em cookie httpOnly + SameSite=Lax** + dupla-submissão CSRF | Sessões sem estado, renovação deslizante; ver docs/03 |
| Tempo real | **SSE** | Reconexão nativa do browser, usa cookies httpOnly (ao contrário de WebSocket que exigiria token no URL), passa proxies/CDN |
| Push | **web-push (VAPID)** | Standard Web Push; chaves geradas/persistidas ou via env |
| PWA | **vite-plugin-pwa (injectManifest)** | SW customizado: precache, estratégias por rota, Background Sync, push |
| Testes | `node:test` + fetch | Sem dependências extra; 14 testes de integração da API |

## 3. Modelo de dados (SQLite → PostgreSQL)

Tabelas (schema completo em `server/src/db/schema.sql`):

- `users` — conta, perfil, região (distrito/município), preferências (tema, push), consensos RGPD, `role`.
- `follows` — grafo social (PK composto).
- `posts`, `polls`, `poll_options`, `poll_votes` — publicações e sondagens.
- `likes`, `comments`, `saves` — interações (todas PK/UNIQUE que impedem duplicados).
- `conversations`, `conversation_members`, `messages` — DMs e grupos (`type`), `last_read_at` por membro para não-lidas.
- `notifications` — in-app polimórfica (`type`, `actor_id`, `post_id`, `conversation_id`, `url`).
- `push_subscriptions` — endpoints Web Push por utilizador.
- `calendar_events` — `type ∈ {holiday_national, holiday_regional, holiday_municipal, school_term, school_break, strike, exam, custom}`, `scope ∈ {national, district:*, municipality:*, region:*}`, `official` (0 = estimativa/demo), `source`.
- `tutor_fichas` — histórico/apontamentos do Explicador (ficha em JSON).
- `audit_log` — segurança: ts, ip, user_agent, user_id, action, status(ok/fail), detail.
- `reminder_sent` — deduplicação de lembretes push (PK user+event+kind).

Índices nas consultas quentes: `posts(created_at DESC)`, `messages(conversation_id, id DESC)`, `notifications(user_id, created_at DESC)`, `calendar_events(date_start)`, `audit_log(ts DESC)`.

**Integridade/GDPR:** todas as FK de conteúdo apontam a `users(id) ON DELETE CASCADE` — apagar a conta apaga tudo em cascata (art. 17).

## 4. API REST (resumo)

Base `/api`. Autenticação: cookie httpOnly `tm_access`; mutações exigem header `x-csrf-token` igual ao cookie `tm_csrf`.

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` `/auth/login` `/auth/logout` | Conta + consensos; login com resposta genérica em erro |
| GET | `/auth/session` | Boot do cliente; emite/renova cookie CSRF |
| PATCH | `/auth/password` | Alteração com confirmação da atual |
| GET/PATCH | `/users/me` | Perfil próprio |
| GET | `/users/search?q=` | Pesquisa de pessoas (DM/grupos) |
| GET | `/users/:username[/posts|/followers|/following]` | Perfil público e conteúdos (respeita privado) |
| POST | `/users/:username/follow` | Seguir/deixar (toggle) |
| GET | `/posts/feed?cursor&filter&subject&hashtag` | Feed paginado |
| POST | `/posts` | Publicar (texto, tema, sondagem) |
| POST/DEL | `/posts/:id/like` `/save` `/vote` `/comments` | Interações |
| GET | `/posts/trending` `/posts/saved` | Tendências e guardados |
| GET/POST | `/conversations[/:id[/messages|/read]]` | Conversas, mensagens, leitura |
| GET | `/calendar/month|day|upcoming|municipalities` | Calendário com escopo regional |
| GET | `/calendar/export.ics` | iCalendar |
| POST/DEL | `/calendar/events` (admin) | Greves/eventos moderados |
| POST | `/tutor/ficha` `/tutor/tools` `/tutor/plan` | Explicador e ferramentas |
| GET/POST/DEL | `/tutor/fichas[...]` | Apontamentos |
| GET/POST | `/notifications[/read]` `/push/subscribe` `/push/unsubscribe` | Notificações e Web Push |
| GET | `/gdpr/export` · DELETE `/gdpr/account` | Direitos RGPD |
| GET | `/events/stream` | SSE autenticado |
| GET | `/health` | Liveness |

Erros sempre `{ "error": "mensagem pt-PT" }` + código HTTP correto; sem stack traces.

## 5. Fluxos-chave

**Login:** POST → bcrypt.compare → JWT assinado → cookie httpOnly SameSite=Lax (secure em produção) + cookie CSRF → `GET /auth/session` no boot do cliente. Tokens deslizantes: reemissão automática quando falta <6 h.

**Mensagem em tempo real:** POST `/conversations/:id/messages` → insert → `emitToUsers(membros, 'message', …)` via SSE → cliente na conversa re-sincroniza; os restantes incrementam badge e recebem notificação + push (se subscrito e offline/inativo).

**Lembrete de calendário:** scheduler horário → eventos de amanhã no âmbito do utilizador → `reminder_sent` dedupe → `notify()` (SSE + push).

**Offline:** SW serve shell e caches de leitura; POST de mensagem falha → fila Background Sync → replay com rede (CSRF preservado por cookie+header originais).

## 6. Migração para PostgreSQL (roadmap de produção)

O SQL é standard; passos previstos:
1. Trocar `node:sqlite` por `pg` (pool) num adaptador `db/index.js` (mesma interface `prepare/run/get/all`).
2. `INTEGER PRIMARY KEY AUTOINCREMENT` → `BIGSERIAL`/`GENERATED … AS IDENTITY`; `INTEGER 0/1` → `BOOLEAN`.
3. Tipos de data: manter ISO-8601 em `TIMESTAMPTZ` na conversão de seed.
4. `PRAGMA` → desnecessários; ativar `pgcrypto` se necessário.
5. Row-Level Security opcional por `app.user_id` (defesa em profundidade).
6. Migrar com `pgloader`/dump SQL gerado do SQLite.

## 7. Deploy

- **Dev:** `npm run dev` (API :4000 + Vite :5173 com proxy `/api`).
- **Produção:** `npm run build && npm start` — o Express serve `client/dist` no mesmo domínio (cookies same-origin, CSP única, SW sem CORS).
- Ambiente: `PORT`, `NODE_ENV`, `PUBLIC_URL`, `JWT_SECRET`, `DB_FILE`, `AI_PROVIDER/AI_API_KEY/AI_BASE_URL/AI_MODEL`, `VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`.
- Escala horizontal: SSE e Background Sync exigem *sticky sessions* ou mover tempo real para Redis pub/sub + fila (roadmap F2); SQLite → PostgreSQL obrigatório multi-nó.
