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
- **Testes criados:** 9 E2E (smoke)
- **Status de execução:** ⚠️ FALHA DETECTADA
- **Regras validadas:** Autenticação JWT + isolamento multi-tenant + XSS

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

**Resultado:** ⚠️ 1/9 falhando

## 4️⃣ Cobertura de Regras

**Regras testadas (E2E):**
- [x] Autenticação: token expirado deve ser rejeitado
- [x] Autenticação: token com algoritmo none deve ser rejeitado
- [x] Autenticação: token com assinatura inválida deve ser rejeitado
- [x] Multi-tenant: headers maliciosos não podem alterar tenant
- [x] Multi-tenant: endpoints admin bloqueados via API direta
- [ ] Multi-tenant: acesso direto por ID inválido deve ser bloqueado **(FALHOU)**
- [x] Multi-tenant: parameter pollution em empresaId deve ser ignorado
- [x] Input validation: payload XSS não deve executar

## 5️⃣ Bug/Falha Detectada

### **[ALTA]** Acesso direto por ID inválido permite acesso a formulário
- **Regra violada:** isolamento multi-tenant / validação de acesso a recursos
- **Teste:** `security-adversarial.smoke.spec.ts` → "bloqueia acesso direto por ID sequencial"
- **Sintoma:** ao acessar `/usuarios/00000000-0000-0000-0000-000000000000/editar`, a página de edição é renderizada e o formulário fica visível.
- **Impacto:** possível bypass de validação de recurso (ID inválido não deveria abrir edição).
- **Severidade:** Alta (segurança / exposição de dados).

## 6️⃣ Evidência

- Playwright run falhou no teste acima (1/9). 
- URL de reprodução: `/usuarios/00000000-0000-0000-0000-000000000000/editar`

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
