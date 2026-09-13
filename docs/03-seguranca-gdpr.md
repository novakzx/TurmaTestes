# Turma+ · Segurança e RGPD (v1.0)

> Política técnica de segurança. Cada secção indica o que está **implementado** e o que é **recomendação de produção**.

## 1. Modelo de ameaças (resumo)

| Ameaça | Mitigação implementada |
|---|---|
| Roubo de sessão (XSS a ler token) | JWT em cookie **httpOnly + SameSite=Lax + Secure em produção**; modo fallback Bearer em `localStorage` documentado com o trade-off (acessível a XSS de script — aceitável apenas como fallback de compatibilidade; o modo cookie é o preferido) |
| CSRF | Modo cookie: dupla submissão (`x-csrf-token` == cookie `tm_csrf`) **+** verificação de `Origin`. Modo Bearer: isento por natureza (header não forjável cross-origin sem CORS). Login/registo: Origin + rate limiting |
| XSS armazenado | Conteúdo renderizado **sempre como texto/React nodes** (zero `dangerouslySetInnerHTML`); CSP `script-src 'self'`; sanitização de controlo/zero-width no servidor |
| SQL injection | 100% de consultas parametrizadas (`prepare(...).run(...)`) + validação Zod de toda a entrada |
| Força bruta / credential stuffing | `authLimiter` 25 tentativas/15 min por IP+conta; resposta de login idêntica para utilizador inexistente e palavra-passe errada |
| Enumeração de contas | Resposta genérica 401; pesquisa de utilizadores apenas autenticada |
| Spam / abuso de API | Rate limits em camadas: global 900/15 min/IP, auth 25, tutor 60/h, mensagens 30/min |
| Payload bombs | `express.json({limit:'64kb'})`; limites de tamanho por campo (Zod) |
| Clickjacking / framing | CSP `frame-ancestors 'none'` + `X-Frame-Options` |
| Sniffing / MIME confusion | `X-Content-Type-Options: nosniff` (helmet) |
| Downgrade HTTP | `Strict-Transport-Security` (1 ano, includeSubDomains) em produção; `upgrade-insecure-requests` |
| Fuga de segredos | Segredos por env em produção; em dev gerados em `server/data/*.secret` com modo 0600 e ignorados pelo Git |
| Erros a revelar internals | Handler de erros único: mensagens genéricas pt-PT; stack só no log do servidor |
| Abuso de upload de media | Sem upload de ficheiros na v1 (fora de escopo, ver roadmap) |

## 2. Autenticação e gestão de sessão

- **Palavras-passe:** bcrypt custo 12; política mínima 8 carateres com letras e números (Zod); alteração exige confirmação da atual; auditoria de tentativas.
- **Tokens:** JWT HS256, TTL 12 h com **renovação deslizante** (reemite cookie a meio do TTL). Em produção recomenda-se o par *access 15 min + refresh 30 d com rotação e deteção de reuso* (roadmap F2).
- **Cookies de sessão:** `httpOnly`, `sameSite=lax`, `secure` quando `NODE_ENV=production` ou `PUBLIC_URL` https, `path=/`.
- **Modo duplo de transporte do token (resiliência):**
  1. *Cookie httpOnly* (preferido) + **CSRF por dupla submissão** (`x-csrf-token` == cookie `tm_csrf`) e verificação de `Origin`;
  2. *Bearer token* em `localStorage` (fallback automático quando o browser bloqueia cookies — ex.: preview embebido em iframe com cookies de terceiros bloqueados). Neste modo o CSRF não se aplica: um site atacante não consegue definir o header `Authorization` sem CORS. O login/registo também devolve o token no corpo para bootstrap deste modo; esses dois endpoints são isentos de dupla-submissão mas mantêm **verificação de Origin + rate limiting** (mitigação de login CSRF).
- **OAuth 2.0:** não incluído na v1; o desenho de produção prevê Google/Apple com PKCE e ligação a conta existente (roadmap F2).

## 3. Cabeçalhos de segurança (produção)

```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:; connect-src 'self'; manifest-src 'self'; worker-src 'self' blob:;
  object-src 'none'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
Cross-Origin-Resource-Policy: same-site
(Referrer-Policy e X-Frame-Options via helmet)
```
Nota: `style-src 'unsafe-inline'` é necessário para estilos injetados pelo bundler; sem risco de script porque `script-src` é estrito.

## 4. Auditoria e monitorização

- Tabela `audit_log`: registos de registo/login/logout (ok e **fail**), alterações de palavra-passe, ações admin (criar/apagar eventos), exportação e eliminação de conta (RGPD), `access.denied` (401/403) com IP e user-agent.
- Retenção recomendada: 12 meses, depois anonimização (base jurídica: interesse legítimo, segurança).
- Recomendações de produção: alertas por volume de falhas de login por IP/conta; WAF/CDN (Cloudflare) à frente; backup testado; métricas RED por rota.

## 5. Proteção de dados pessoais (RGPD)

| Princípio | Implementação |
|---|---|
| Minimização | Registo pede apenas email, @utilizador, nome, palavra-passe + consensos; escola/região/ano são opcionais |
| Consentimento (art. 6.º/7.º) | Checkboxes explícitos de Termos e Privacidade com timestamp (`consent_terms_at/consent_privacy_at`); push só após permissão do browser e toggle |
| Idade (art. 8.º; Lei 58/2019) | Declaração de ≥13 anos no registo; entre 13-16 requer autorização do encarregado de educação (texto legal + verificação parental no roadmap) |
| Acesso/portabilidade (arts. 15/20) | `GET /api/gdpr/export` → JSON completo da conta (sem hash de password), descarregável |
| Apagamento (art. 17) | `DELETE /api/gdpr/account` com palavra-passe → cascata total (FK `ON DELETE CASCADE`) |
| Retenção | Conta ativa; auditoria 12 meses; caches do SW purgadas pelo utilizador |
| Segurança do tratamento (art. 32.º) | bcrypt, HTTPS obrigatório, CSP, rate limits, auditoria, segredos fora do código |
| Transparência (arts. 12-14) | Política de Privacidade e Termos dentro da app (`/privacidade`, `/termos`), com contacto de DPO e referência à CNPD |
| Subcontratantes (art. 28.º) | Sem partilhas na v1; push via serviço do browser do próprio utilizador |

## 6. Conteúdo e moderação

- Perfis privados (opt-in) limitam publicações a seguidores.
- Botões de denúncia e fila de moderação: **roadmap F1** (necessário antes de abertura pública).
- Avisos de greves/calendário: origem declarada por evento (`source`) e badge `oficial/estimativa/demonstração`; admin-only para publicar.

## 7. Segurança do Explicador ("IA")

- Motor local determinístico por omissão: **sem chamadas externas, sem envio de dados a terceiros**.
- Parser matemático próprio (sem `eval`/`Function`) — teste dedicado rejeita injeção de código.
- Se LLM externo for ativado: apenas por configuração de operador, com timeout 20 s, resposta validada por schema e **fallback automático** ao motor local; a pergunta do estudante só sai do servidor nesse modo (declarado na Política de Privacidade).

## 8. Checklist de endurecimento para produção

- [ ] Domínio próprio com TLS (HSTS preload), cookies `Secure` + `__Host-` prefix.
- [ ] Refresh tokens rotativos com deteção de reuso; logout de todas as sessões.
- [ ] PostgreSQL + encriptação em repouso; backups cifrados e testados.
- [ ] Segredos em gestor (Vault/Secrets Manager); rotação de JWT/VAPID programada.
- [ ] OAuth 2.0 PKCE (Google/Apple) + verificação de email.
- [ ] Fila de moderação de conteúdo + denúncia; rate limits por utilizador além de IP.
- [ ] Monitorização: Sentry (erros), Prometheus/Grafana (métricas), auditoria em storage imutável.
- [ ] Pentest externo e revisão de código antes do lançamento público; bug bounty educativo.
- [ ] Avaliação de impacto (DPIA) dado o público menor de idade — **obrigatória** antes de produção real.
