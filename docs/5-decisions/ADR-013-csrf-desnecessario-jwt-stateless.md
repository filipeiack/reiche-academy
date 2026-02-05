# ADR-013: CSRF é Desnecessário em Arquitetura JWT Stateless

## Status
**Aceita** — 2026-01-30

## Contexto

Durante testes de segurança adversariais (smoke suite), QA Engineer identificou ausência de proteção CSRF no sistema. Business Analyst avaliou a lacuna e recomendou decisão humana explícita sobre implementar ou documentar ausência.

**Arquitetura atual:**
- Backend: NestJS com autenticação JWT stateless
- Frontend: Angular SPA standalone
- Armazenamento de tokens: `localStorage` ou `sessionStorage` (flag "lembrar-me")
- Transmissão de tokens: Header HTTP `Authorization: Bearer {token}`
- Cookies: **Não são usados** para autenticação

**Por que a questão foi levantada:**
- CSRF (Cross-Site Request Forgery) é vulnerabilidade comum em aplicações web tradicionais
- OWASP Top 10 recomenda proteção CSRF
- Testes de segurança adversariais esperam proteção por padrão

**Controvérsia:**
- CSRF depende de navegador enviar **automaticamente** credenciais (cookies)
- JWT em headers requer **JavaScript explícito** para incluir token
- Site malicioso não pode forçar navegador a enviar header `Authorization`

## Decisão

**NÃO implementar proteção CSRF no sistema Reiche Academy.**

**Justificativa técnica:**

1. **Mecanismo de ataque CSRF é ineficaz:**
   - CSRF explora envio **automático** de cookies pelo navegador
   - `localStorage`/`sessionStorage` **não são enviados** automaticamente
   - Atacante em `https://site-malicioso.com` não pode:
     - Acessar `localStorage` de `https://reiche.academy` (mesma origem)
     - Forçar navegador a incluir header `Authorization` em fetch cross-origin
     - Burlar CORS para requisições autenticadas

2. **CORS já protege requisições cross-origin:**
   - Backend configura CORS com origens permitidas
   - Navegador bloqueia requisições de origens não autorizadas
   - Requisições preflight (OPTIONS) validam headers customizados

3. **JWT stateless simplifica arquitetura:**
   - Sem sessões server-side
   - Sem cookies httpOnly/secure
   - Sem sincronização de tokens CSRF entre cliente/servidor

4. **Overhead evitado:**
   - Sem geração de CSRF tokens por sessão
   - Sem validação em cada mutação (POST/PATCH/DELETE)
   - Sem complexidade adicional em guards/interceptors

**Precedentes:**
- Arquiteturas SPA modernas (React, Vue, Angular) com JWT raramente usam CSRF
- Auth0, Firebase, AWS Cognito usam JWT sem CSRF por padrão
- OWASP JWT Cheat Sheet confirma: "CSRF não é risco se token não está em cookie"

## Consequências

### Positivas
- ✅ Arquitetura mais simples (menos moving parts)
- ✅ Performance ligeiramente melhor (sem validação extra)
- ✅ Menos overhead em requisições (sem headers CSRF)
- ✅ Alinhamento com padrões modernos de SPA

### Negativas
- ❌ **Se migrarmos para cookies no futuro, CSRF volta a ser risco**
- ❌ Testes de conformidade automáticos podem falhar (esperam CSRF por padrão)
- ❌ Auditores sem contexto podem questionar ausência

### Neutras
- 🔵 Documentação explícita necessária (este ADR)
- 🔵 Testes E2E ajustados para refletir decisão
- 🔵 Treinamento de equipe sobre CSRF vs JWT

## Riscos Mitigados

**Risco 1: Mudança futura para cookies**
- **Mitigação:** ADR documenta trade-off. Se cookies forem introduzidos, CSRF DEVE ser implementado antes de deploy.
- **Ação:** Adicionar checklist em `/docs/conventions/backend.md` proibindo cookies de autenticação sem CSRF.

**Risco 2: XSS permite roubo de tokens**
- **Mitigação:** XSS é problema separado. Proteções:
  - Sanitização global (ADR-011)
  - Content Security Policy (CSP)
  - Angular DomSanitizer
- **Nota:** CSRF não protege contra XSS (são vetores diferentes).

**Risco 3: Conformidade regulatória**
- **Mitigação:** LGPD/GDPR não exigem CSRF especificamente. Exigem proteção de dados.
- **Ação:** Documentar decisão em relatórios de compliance.

## Alternativas Consideradas

### Alternativa 1: Implementar CSRF mesmo sendo desnecessário (belt-and-suspenders)
- **Pros:** Defesa em profundidade, passa auditorias automáticas
- **Cons:** Overhead desnecessário, complexidade sem benefício real
- **Rejeitada:** Violaria princípio de simplicidade (YAGNI - You Aren't Gonna Need It)

### Alternativa 2: Migrar JWT para cookies httpOnly
- **Pros:** Proteção contra XSS (cookies não acessíveis por JS)
- **Cons:** Requer CSRF, perde stateless backend, requer sincronização de tokens
- **Rejeitada:** Mudança arquitetural grande sem ganho claro (XSS precisa ser mitigado de qualquer forma)

### Alternativa 3: Usar SameSite cookies
- **Pros:** Proteção CSRF moderna sem tokens extras
- **Cons:** Ainda requer cookies (não alinha com JWT stateless)
- **Rejeitada:** Mesma razão que Alternativa 2

## Impacto em Documentação

### Criar:
- ✅ Este ADR (ADR-013)

### Atualizar:
- ✅ `/frontend/e2e/security/security-adversarial.smoke.spec.ts`
  - Remover testes `exige CSRF token em requisições POST`
  - Remover testes `valida CSRF token correto`
  - Adicionar comentário explicando decisão (referência a ADR-013)

- ✅ `/docs/business-rules/seguranca-autenticacao.md`
  - Adicionar seção explícita: "RN-SEC-001.X: CSRF não é implementado (ADR-013)"

- ✅ `/docs/conventions/backend.md`
  - Adicionar proibição: "NUNCA usar cookies para autenticação sem CSRF"

## Validação

**Critérios de sucesso:**
- [ ] Testes E2E ajustados (não esperam CSRF)
- [ ] Business rules atualizada (RN-SEC-001.X)
- [ ] Convenções backend atualizada (proibição de cookies)
- [ ] QA smoke suite passa (sem falhas CSRF)

**Teste de regressão:**
- Se qualquer cookie de autenticação for introduzido, CI DEVE falhar com erro explícito
- Documentação DEVE ser consultada antes de mudanças arquiteturais

## Referências

- **OWASP JWT Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html
  - Seção: "Token Storage on Client Side" — "CSRF is not possible when JWT is not stored in cookies"

- **OWASP CSRF Prevention Cheat Sheet**: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
  - Seção: "Use of Custom Request Headers" — "REST APIs using headers for authentication are not vulnerable to CSRF"

- **RFC 6750 (OAuth 2.0 Bearer Token)**: https://tools.ietf.org/html/rfc6750
  - Especifica uso de header `Authorization: Bearer` (não cookies)

- **ADR relacionados:**
  - ADR-011: Global Sanitization Pipe (proteção XSS)
  - ADR-010: Single Session Policy (gestão de tokens)

## Notas de Implementação

**Para desenvolvedores:**
- Continuar usando `Authorization: Bearer {token}` em TODOS os requests autenticados
- NUNCA armazenar JWT em cookies
- NUNCA aceitar autenticação via cookies
- Se precisar de cookies no futuro, DEVE:
  1. Criar ADR explicando necessidade
  2. Implementar CSRF (tokens + validação)
  3. Atualizar testes de segurança

**Para QA:**
- Testes CSRF removidos dos smoke suites
- Focar validação em:
  - JWT signature validation
  - Token expiration
  - CORS enforcement
  - XSS prevention (sanitização)

**Para auditores:**
- Apresentar este ADR como justificativa técnica
- Explicar diferença entre CSRF (cookies) e XSS (scripts maliciosos)
- Demonstrar proteção CORS em ambiente de teste

---

**Decisão tomada por:** Usuário (Human Authority)  
**Documentado por:** System Engineer (Modo Documentação)  
**Aprovação:** Aceita em 2026-01-30  
**Próxima revisão:** Antes de qualquer mudança em mecanismo de autenticação
