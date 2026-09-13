# Turma+ · Roadmap e funcionalidades adicionais propostas

> O briefing pediu para **consultar previamente** sobre funcionalidades extra. Este documento lista as sugestões priorizadas, com esforço estimado e valor para o público estudantil. **Nada aqui é adicionado sem aprovação** — a v1 entregue cobre apenas o âmbito do briefing.

## Fase F1 — Lançamento público (pré-requisitos)
| # | Funcionalidade | Valor | Esforço |
|---|---|---|---|
| 1.1 | **Feed oficial de greves moderado**: importação de pré-avisos sindicais/comunicados ME com validação editorial e selo de fonte | Confiança no calendário (hoje demo rotulada) | M |
| 1.2 | Sincronização automática do **calendário escolar** a partir do despacho anual da DGEstE (parser + revisão humana) | Remove "estimativa" | M |
| 1.3 | Denúncia de conteúdo + fila de moderação + bloqueio de utilizadores | Segurança da comunidade | M |
| 1.4 | Verificação de email no registo | Contas reais | S |
| 1.5 | DPIA + revisão jurídica dos textos RGPD | Conformidade | S |

## Fase F2 — Crescimento e engagement
| # | Funcionalidade | Valor | Esforço |
|---|---|---|---|
| 2.1 | **Horário escolar pessoal** com salas e alarmes de teste | Uso diário | M |
| 2.2 | **Flashcards com repetição espaçada** (SRS próprio, offline) ligada às fichas do Explicador | Estudo eficaz | M |
| 2.3 | Gamificação leve estilo Duolingo: streaks de estudo, conquistas de turma (sem pressão social excessiva) | Retenção saudável | M |
| 2.4 | Upload de imagens no feed (armazenamento S3-compatible + moderação de media) | Expressão | M |
| 2.5 | OAuth 2.0 (Google/Apple, PKCE) + "entrar com código da escola" | Onboarding | M |
| 2.6 | Refresh tokens rotativos + sessões ativas visíveis nas Definições | Segurança | S |
| 2.7 | Redis pub/sub para SSE multi-nó + PostgreSQL | Escala | M |

## Fase F3 — Ecossistema educativo
| # | Funcionalidade | Valor | Esforço |
|---|---|---|---|
| 3.1 | **Páginas de escola** verificadas (associações de estudantes publicam avisos/greves locais) | Voz às AE | M |
| 3.2 | Integração com plataformas das escolas (Moodle/Teams) via export iCal/CSV | Interoperabilidade | L |
| 3.3 | Mercado de apontamentos revisto por pares (licenças CC, sem monetização de material protegido) | Colaboração | L |
| 3.4 | Modo "foco/exame": silencia notificações em janelas definidas | Bem-estar | S |
| 3.5 | Acesso para encarregados de educação (consentimento 13-16 anos, RGPD art. 8.º) | Conformidade | M |

## Melhorias técnicas contínuas
- Testes E2E (Playwright) dos fluxos críticos (registo→publicar→mensagem→plano).
- i18n estruturada (hoje pt-PT hardcoded) se houver procura de outras regiões.
- Métricas de produto (ativação, retenção semanal) com privacidade por desenho (sem cookies de terceiros).

**Legenda de esforço:** S ≤ 1 semana · M 2-4 semanas · L > 1 mês (equipa pequena).
