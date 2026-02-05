# QA Handoff: Rotinas por Empresa (Smoke)

**Data:** 2026-01-29  
**QA Engineer:** QA Engineer  
**Dev Handoff:** N/A (migração de testes legacy)  
**Regras Base:**  
- /docs/business-rules/rotinas-empresa.md

---

## 1️⃣ Resumo da Validação

- **Tipo de testes:** E2E (Playwright)
- **Testes criados:** 10 E2E (smoke)
- **Status de execução:** ✅ 10 passed
- **Regras validadas:** Criação/validação/cancelamento de rotina + RBAC (admin/gestor/colaborador)

## 2️⃣ Testes Unitários Criados

- **Nenhum** (escopo E2E solicitado)

## 3️⃣ Testes E2E Criados

### Playwright
- `frontend/e2e/rotinas-empresa/gestao-rotinas.smoke.spec.ts`
  - ADMINISTRADOR abre drawer de adicionar rotina
  - ADMINISTRADOR cria rotina customizada com sucesso
  - GESTOR cria rotina customizada com sucesso
  - ADMINISTRADOR valida nome mínimo de 3 caracteres
  - COLABORADOR não vê botão adicionar rotina
  - GESTOR valida nome mínimo de 3 caracteres
  - ADMINISTRADOR cancela criação de rotina
  - GESTOR cancela criação de rotina
  - ADMINISTRADOR abre drawer Gerenciar Rotinas
  - GESTOR abre drawer Gerenciar Rotinas

**Execução (isolada):**
```bash
cd frontend && npx playwright test e2e/rotinas-empresa/gestao-rotinas.smoke.spec.ts --workers=1
```

**Resultado:** ✅ 10/10 passing

## 4️⃣ Cobertura de Regras

**Regras testadas (E2E):**
- [x] R-ROTEMP-002: Criação de rotina customizada (ADMINISTRADOR)
- [x] R-ROTEMP-002: Criação de rotina customizada (GESTOR)
- [x] R-ROTEMP-002: Validação de nome obrigatório (mín. 3 caracteres) (ADMIN/GESTOR)
- [x] R-ROTEMP-002: Cancelamento do fluxo de criação (ADMIN/GESTOR)
- [x] RBAC: COLABORADOR não pode gerenciar rotinas
- [x] R-ROTEMP-003: Acesso ao drawer de edição de rotinas (ADMIN/GESTOR)

## 5️⃣ Bugs/Falhas Detectados

Nenhum bug funcional detectado.

## 6️⃣ Edge Cases Testados (Adversarial Thinking)

- [ ] Tentativa de criação com nome duplicado no mesmo pilar
- [ ] Criação sem pilares disponíveis (estado vazio)

## 7️⃣ Qualidade Estendida (se solicitado)

- Não solicitado.

## 8️⃣ Problemas de Execução Corrigidos

- Nenhum.

## 9️⃣ Recomendações

- Garantir seed com pilares/rotinas para reduzir skips em ambientes futuros.

## 🔟 Status Final e Próximos Passos

- [x] Migração dos 5 testes legacy concluída

---

**Handoff criado automaticamente pelo QA Engineer**
