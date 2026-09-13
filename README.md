# Turma+ 🎒

**Aplicação web progressiva (PWA) para estudantes em Portugal** — feed comunitário, calendário oficial (feriados, férias escolares e greves), mensagens de turma em tempo real, apoio ao estudo gratuito e perfis pessoais. Design plano e amigável (sem gradientes), mobile-first e instalável.

> Versão 1.0.0 (demonstração funcional completa). Documentação de projeto em [`docs/`](docs/):
> [01 · Escopo](docs/01-escopo.md) · [02 · Arquitetura](docs/02-arquitetura.md) · [03 · Segurança & RGPD](docs/03-seguranca-gdpr.md) · [04 · Roadmap](docs/04-roadmap.md)

---

## Funcionalidades

| Área | Destaques |
|---|---|
| 📰 **Feed** | Publicações com temas por disciplina, `#hashtags`, sondagens, gostos, comentários, guardados (🔖), filtros "Para ti / A seguir", tendências e scroll infinito |
| 📅 **Calendário oficial** | 13 feriados nacionais + Carnaval (móveis calculados pelo algoritmo da Páscoa), feriados regionais (Açores/Madeira) e municipais (24 municípios), períodos letivos, férias, exames e greves por âmbito; exportação **.ics**; lembretes push na véspera |
| 💬 **Mensagens** | DMs e grupos de estudo com entrega em tempo real (SSE), badges de não-lidas, envio offline com reenvio automático (Background Sync) |
| 📖 **Apoio ao estudo** | "Explicador" sem cara de chatbot: **fichas de estudo** do currículo português (resposta → passos → conceitos → exemplo → exercícios), calculadora científica, resolvedor de equações com passos, derivadas e **planos de estudo** até ao exame. Gratuito e offline |
| 👤 **Perfil** | Publicações, apontamentos guardados, seguidores, perfil privado, edição completa |
| 🔔 **Notificações** | Centro in-app + **Web Push (VAPID)**; lembretes de feriados/greves do teu município |
| 📱 **PWA** | Instalável, offline-first (service worker Workbox), atalhos, temas claro/escuro |
| 🛡️ **Segurança/RGPD** | JWT httpOnly + CSRF, bcrypt, rate limits, CSP/HSTS, auditoria, exportação e eliminação de dados (arts. 15/17/20) |

## Arranque rápido

Requisitos: **Node.js ≥ 20**.

```bash
npm run install:all   # dependências (raiz + server + client)
npm run dev           # API :4000 + Vite :5173 (proxy /api)  → http://localhost:5173
```

Produção (PWA completa, mesmo domínio):

```bash
npm run build         # build do cliente (incl. service worker)
npm start             # Express serve API + cliente em :4000
```

Testes de integração da API (14):

```bash
npm test
```

### Conta de demonstração

| Utilizador | Palavra-passe |
|---|---|
| `maria.silva` | `Estudante2026!` |
| (todas as contas seed) | `Estudante2026!` |

O seed cria 12 perfis de todo o país (incl. Açores e Madeira), 20 publicações, sondagens, grupos de estudo, DMs e o calendário 2025–2027. Recriar: `npm run seed` (ou `npm --prefix server run reset`).

## Stack

- **Cliente:** React 18 · Vite 5 · react-router 6 · CSS próprio com tokens (plano, claro/escuro) · vite-plugin-pwa (Workbox: precache, SWR, Background Sync, push)
- **Servidor:** Node.js 20+ · Express 4 · helmet · express-rate-limit · Zod · jsonwebtoken · bcryptjs · web-push
- **Dados:** SQLite via `node:sqlite` (WAL) — SQL standard, migração PostgreSQL documentada em [`docs/02`](docs/02-arquitetura.md#6-migração-para-postgresql-roadmap-de-produção)
- **Tempo real:** Server-Sent Events · **Push:** Web Push/VAPID

## Configuração (variáveis de ambiente)

| Variável | Descrição |
|---|---|
| `PORT`, `NODE_ENV`, `PUBLIC_URL` | Porta, modo e URL pública (cookies `secure`) |
| `JWT_SECRET` | Segredo JWT (dev: gerado e persistido em `server/data/`) |
| `DB_FILE` | Ficheiro SQLite (dev: `server/data/turma.db`) |
| `AI_PROVIDER`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Opcional: liga um LLM compatível OpenAI ao Explicador (por omissão usa o motor local offline) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Chaves Web Push (dev: geradas automaticamente) |

## Avisos da versão de demonstração

- Os registos de **greves** são dados de exemplo, rotulados na interface; o calendário escolar é uma **estimativa** do padrão típico (confirmar no despacho anual da DGEstE). Em produção, ambos passam a feed oficial moderado ([roadmap F1](docs/04-roadmap.md)).
- Os textos legais (Privacidade/Termos) são modelos de referência para revisão jurídica/DPO, incluindo **DPIA obrigatória** dado o público menor de idade.

## Estrutura

```
client/   PWA React (src/pages, components, store, styles, sw.js)
server/   API Express (src/routes, services, middleware, db)
docs/     Escopo · Arquitetura · Segurança/RGPD · Roadmap
```

Licença: uso educativo/demonstrativo. Feito por e para estudantes em Portugal 🇵🇹
