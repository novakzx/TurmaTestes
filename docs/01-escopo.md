# Turma+ · Documento de Escopo (v1.0)

> Plataforma PWA para estudantes em Portugal — comunicação, organização e suporte educativo num só lugar.
> Estado: **implementado e funcional** (versão 1.0.0 de demonstração). Este documento descreve o escopo construído, os critérios de aceitação e o que fica fora (com registo de decisões).

---

## 1. Visão e público-alvo

**Problema:** os estudantes portugueses dispersam-se por dezenas de apps (grupos de WhatsApp, calendários da escola em PDF, dúvidas resolvidas em vídeos aleatórios). Não existe um espaço próprio, gratuito e pensado para o contexto escolar português.

**Solução (Turma+):** uma PWA instalável que concentra:
1. **Feed** comunitário de conteúdos estudantis;
2. **Calendário oficial** (feriados nacionais/regionais/municipais, calendário escolar, greves e exames);
3. **Mensagens** diretas e grupos de turma/estudo;
4. **Apoio ao estudo** (fichas, ferramentas e planos) — gratuito, offline e sem estética de "chatbot de IA";
5. **Perfil pessoal** com publicações, interações, apontamentos e privacidade.

**Público:** estudantes do 2.º/3.º ciclo, secundário e ensino superior em Portugal (continente, Açores e Madeira). Idade mínima 13 anos (RGPD art. 8.º + Lei 58/2019).

**Personas de referência** (refletidas nos dados de demonstração):
- *Maria, 12.º ano, Lisboa (Ciências)* — prepara exames nacionais, lidera grupo de estudo;
- *Pedro, 10.º ano, Braga (Humanidades)* — chegada ao secundário, precisa de orientação;
- *Sofia, 11.º ano, Funchal* — precisa que feriados regionais e municipais sejam respeitados;
- *Equipa Turma+* (conta oficial/admin) — comunica novidades e valida avisos de calendário.

---

## 2. Funcionalidades implementadas (critérios de aceitação)

### 2.1 Feed de conteúdos
| Requisito | Implementação | Aceitação |
|---|---|---|
| Feed dinâmico | Coluna central estilo Twitter/Instagram; publicação de texto com tema por disciplina, `#hashtags` clicáveis e sondagens (até 4 opções) | Publicar → aparece no topo; votar → barras com % |
| Filtros | Separadores **Para ti / A seguir**; filtro por tema e por hashtag (via URL partilhável) | `/?hashtag=matematicaa` mostra só essas publicações |
| Interações | Gosto, comentários aninhados por post, guardar (marcador, em Apontamentos), partilhar (Web Share API / clipboard), apagar (próprio ou admin) | Contagens atualizam sem reload |
| Descoberta | Barra lateral (desktop) com tendências (hashtags 7 dias), próximos eventos do calendário e sugestões de pessoas | Clique navega/filtra |
| Paginação | Cursor + scroll infinito (IntersectionObserver) | Carrega +15 ao aproximar do fim |

### 2.2 Calendário oficial
| Requisito | Implementação | Aceitação |
|---|---|---|
| Feriados nacionais | 13 feriados legais + Carnaval (facultativo), com **cálculo de móveis** (Páscoa pelo algoritmo gregoriano anónimo) | Páscoa 2026 = 5 abr; Corpo de Deus 2026 = 4 jun |
| Feriados regionais | Açores (2.ª feira do Espírito Santo), Madeira (1 jul + Primeira Oitava) | Ativados pelo distrito do perfil |
| Feriados municipais | Lista curada de 24 municípios (Lisboa 13 jun, Porto 24 jun, Coimbra 4 jul, …) com origem identificada | Seletor no calendário; escolha grava-se no perfil |
| Calendário escolar | Períodos letivos, interrupções (Natal/Páscoa) e exames (1.ª/2.ª fase) — **marcados como estimativa** | Badge "estimativa" visível; aviso permanente |
| Greves escolares | Registo tipado `strike` com âmbito nacional/distrito; CRUD admin | **Dados de demonstração rotulados**; em produção, feed oficial moderado (ver roadmap) |
| UI | Grelha mensal (semanas a começar à segunda), pontos por tipo, painel do dia, filtros por tipo, "próximos 45 dias" | Mobile: detalhe sob a grelha; desktop: coluna lateral |
| Integração | Exportação **iCalendar (.ics)** por ano + região | Importa no Google/Apple Calendar |
| Lembretes | Agendador horário: na véspera de feriado/greve do âmbito do utilizador → notificação in-app + push, com deduplicação | Push mesmo com a app fechada |

### 2.3 Sistema de mensagens
| Requisito | Implementação | Aceitação |
|---|---|---|
| DMs | 1-1 com deduplicação (par existente é reutilizado) | Abrir DM repetida não cria conversa nova |
| Grupos | Criação com título + pesquisa de membros; lista de membros; autor por mensagem | Grupos de turma e de estudo |
| Tempo real | **SSE** (`EventSource`) — mensagens e notificações instantâneas, reconexão automática | Mensagem chega <1 s entre separadores |
| Não lidas | Badges por conversa e total na navegação; leitura ao abrir | Badge limpa ao entrar na conversa |
| Offline | Envio em fila **Background Sync** (service worker) reenvia quando volta a rede | Mensagem pendente identificada no ecrã e entregue depois |
| Abusos | Rate limit 30 msg/min/utilizador; tamanho máx. 2000 carateres; só membros acedem | 403/429 corretos |

### 2.4 Apoio ao estudo ("IA" sem cara de IA)
Decisão de produto: **não é um chat**. É um *Explicador* que devolve **fichas de estudo** (documento estruturado), mais ferramentas determinísticas. Sem bolhas de conversa, sem "a escrever…", sem estética de assistente.

| Requisito | Implementação |
|---|---|
| Fichas de estudo | Pergunta (+disciplina) → ficha: resposta direta, passo a passo numerado, conceitos-chave, exemplo resolvido, exercícios com dica/solução reveláveis, recursos |
| Motor gratuito/offline | Base de conhecimento curada do currículo português (30+ fichas: Mat A, FQ A, BG, Português, História A, Geografia A, Filosofia, Inglês, Economia A, métodos de estudo) + ficha de método honesta quando não há correspondência |
| Extensível a LLM | Se `AI_PROVIDER=openai` + chave configuradas, perguntas sem match usam um LLM compatível OpenAI que devolve **o mesmo JSON de ficha** — a UI não muda e nunca depende da rede |
| Ferramentas | Calculadora científica (parser próprio, **sem `eval`**), resolvedor de equações do 2.º grau com passos e discriminante, derivadas de polinómios, **plano de estudo** faseado até à data do exame |
| Apontamentos | Guardar fichas (perfil → Apontamentos); histórico de dúvidas recentes |
| Limites | 60 pedidos/hora/utilizador (rate limit) |

### 2.5 Perfis de utilizador
- Perfil público/privado (toggle), avatar por iniciais com cor plana, bio, escola, distrito/município, ano, curso.
- Estatísticas (publicações, seguidores, a seguir), seguir/deixar de seguir, DM direta.
- Conta oficial (`role=admin`) com selo "Oficial".
- Separadores: Publicações · Apontamentos (fichas + posts guardados).
- Edição de perfil e definições (tema claro/escuro, push, privacidade, palavra-passe).

### 2.6 Notificações
- In-app (gostos, comentários, seguidores, mensagens, lembretes de calendário) com badge e centro de notificações.
- **Web Push (VAPID)** ativável nas Definições; atalhos de PWA (Calendário, Apoio, Mensagens).

### 2.7 PWA
- Manifest completo (pt-PT, ícones 192/512/maskable, atalhos), instalável em Android/iOS/desktop.
- Service worker Workbox: pré-cache do shell, navegações network-first, leituras de API stale-while-revalidate (feed/calendário offline), Background Sync de mensagens.
- Indicador "Sem ligação" e leitura offline do conteúdo em cache.

---

## 3. Fora de escopo desta versão (decisões registadas)

| Item | Motivo / plano |
|---|---|
| Upload de imagens/vídeo no feed | Armazenamento de ficheiros e moderação de media exigem infraestrutura própria; v1 foca-se em texto/sondagens (roadmap F2) |
| OAuth 2.0 (Google/Apple) | Autenticação por email+palavra-passe com JWT já cobre o caso; OAuth entra no roadmap F2 com fluxo de verificação de escola |
| Chat de voz/vídeo | Complexidade e custo; não pedido |
| App nativa (iOS/Android) | A PWA cobre a necessidade; wrapper Capacitor é opção futura |
| Feed de greves em tempo real oficial | Requer acordos com fontes oficiais e moderação; hoje é demo rotulada + CRUD admin (roadmap F1) |
| Multi-escola SSO | Depende de integração com plataformas das escolas (roadmap F3) |

---

## 4. Requisitos não funcionais cumpridos
- **Desempenho:** SPA ~83 kB gzip; pré-cache offline; SQLite com índices nas consultas quentes.
- **Acessibilidade:** landmarks, `aria-*` em navegação/modais/badges, foco visível, contraste AA nos dois temas, `prefers-reduced-motion`.
- **Internacionalização:** pt-PT em toda a UI e conteúdo; datas e tempos formatados com `Intl`.
- **Design:** sistema próprio **plano, sem gradientes**; claro/escuro; mobile-first (bottom nav) → desktop (sidebar + rails).
