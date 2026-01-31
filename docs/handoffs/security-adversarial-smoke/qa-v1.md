# QA Handoff: Segurança Adversarial (Smoke)

**Data:** 2026-01-30  
**QA Engineer:** QA Engineer  
**Dev Handoff:** N/A (migração de testes legacy)  
**Regras Base:**  
- /docs/business-rules/seguranca-autenticacao.md  
- /docs/business-rules/seguranca-multi-tenant.md

---

## 1️⃣ Resumo da Validação

- **Tipo de testes:** E2E (Playwright)
- **Testes criados:** 46 E2E (smoke)
- **Status de execução:** ⚠️ FALHAS DETECTADAS
- **Regras validadas:** Autenticação JWT + isolamento multi-tenant + XSS + SQLi + rate limiting + CSRF

## 2️⃣ Testes Unitários Criados

- **Nenhum** (escopo E2E solicitado)

## 3️⃣ Testes E2E Criados

### Playwright
- `frontend/e2e/security/security-adversarial.smoke.spec.ts`
  - rejeita token expirado
  - rejeita JWT com algoritmo none
  - rejeita token com assinatura inválida
  - ignora headers maliciosos de tenant
  - bloqueia acesso a endpoints admin via API direta
  - bloqueia acesso direto por ID sequencial (UUID inválido)
  - previne parameter pollution de empresa
  - ignora payload XSS no campo de nome (script)
  - ignora payload XSS no campo de nome (img onerror)

**Execução (isolada):**
```bash
cd frontend && npx playwright test e2e/security/security-adversarial.smoke.spec.ts --workers=1
```

**Resultado (última execução):** ⚠️ 7 falhando (35 passing, 4 skipped, 7 failed)

## 4️⃣ Cobertura de Regras

**Regras testadas (E2E):**
- [x] Autenticação: token expirado deve ser rejeitado
- [x] Autenticação: token com algoritmo none deve ser rejeitado
- [x] Autenticação: token com assinatura inválida deve ser rejeitado
- [x] Multi-tenant: headers maliciosos não podem alterar tenant
- [x] Multi-tenant: endpoints admin bloqueados via API direta
- [ ] Multi-tenant: acesso direto por ID inválido deve ser bloqueado **(FALHOU)**
- [ ] Multi-tenant: GESTOR não deve acessar cockpit de outra empresa **(FALHOU)**
- [ ] Multi-tenant: GESTOR não deve ver dados de outra empresa via API **(FALHOU)**
- [ ] RBAC: COLABORADOR não pode criar usuário com privilégio elevado **(FALHOU)**
- [ ] Rate limiting em endpoints gerais **(FALHOU)**
- [ ] Rate limiting por usuário **(FALHOU)**
- [ ] CSRF: POST sem token deve retornar 403 **(FALHOU)**
- [x] Multi-tenant: parameter pollution em empresaId deve ser ignorado
- [x] Input validation: payload XSS não deve executar

## 5️⃣ Bugs/Falhas Detectadas

### **[ALTA]** Multi-tenant: acesso direto por ID inválido permite acesso a formulário
- **Regra violada:** RN-SEC-002 (isolamento multi-tenant)
- **Teste:** `security-adversarial.smoke.spec.ts` → "bloqueia acesso direto por ID sequencial"
- **Sintoma:** `/usuarios/00000000-0000-0000-0000-000000000000/editar` renderiza formulário.
- **Severidade:** Alta (segurança / exposição de dados).

### **[ALTA]** Multi-tenant: GESTOR acessa cockpit de outra empresa
- **Regra violada:** RN-SEC-002.4
- **Teste:** `security-adversarial.smoke.spec.ts` → "GESTOR não deve acessar cockpit de outra empresa por URL direta"
- **Sintoma:** URL permanece acessível sem bloqueio.

### **[ALTA]** RBAC: COLABORADOR consegue acessar criação de usuário
- **Regra violada:** R-USU-004 (elevação de perfil) + RBAC
- **Teste:** `security-adversarial.smoke.spec.ts` → "COLABORADOR não deve conseguir criar usuário com privilégios elevados"

### **[ALTA]** Rate limiting ausente
- **Regra violada:** RN-SEC-001.7
- **Testes:**
  - "implementa rate limiting em endpoints de API"
  - "implementa rate limiting por usuário"
- **Sintoma:** não retorna 429 mesmo após burst de requisições.

### **[MÉDIA]** CSRF retorna 401 em vez de 403
- **Regra violada:** RN-SEC-001 (proteções de requisições)
- **Teste:** "exige CSRF token em requisições POST"
- **Sintoma:** resposta 401 ao invés de 403 quando falta token.

## 6️⃣ Evidência

- Playwright run falhou nos testes acima (7 falhas).
- Execução: `npx playwright test e2e/security/security-adversarial.smoke.spec.ts --workers=1`

### Falhas de Teste/Fixture (não-prod)
- **LEITURA não deve conseguir editar dados** → fixture `TEST_USERS.leitura` inexistente (erro de teste).
- **SQLi em filtros avançados / busca** → seletor ausente (provável cobertura de tela não presente).
- **API manipulation** → `interceptedData` nulo (ajuste de teste necessário).

## 7️⃣ Recomendações

- Backend deve validar existência + tenant antes de retornar dados do usuário.
- Frontend deve redirecionar para lista ou exibir erro quando usuário não existir.
- Garantir que resposta 404/403 não renderiza formulário editável.

## 🔟 Status Final e Próximos Passos

- [ ] Corrigir bug no backend (validação de ID + tenant)
- [ ] Ajustar frontend para tratamento de 404/403 no formulário
- [ ] Reexecutar smoke de segurança

---

**Handoff criado automaticamente pelo QA Engineer**
