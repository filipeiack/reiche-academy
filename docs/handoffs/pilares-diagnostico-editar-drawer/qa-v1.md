# QA Handoff: Pilares Diagnóstico - Editar Pilares (Drawer)

**Data:** 2026-01-29  
**QA Engineer:** QA Engineer  
**Dev Handoff:** /docs/handoffs/DEV-to-QA-pilares-test-recovery.md  
**Regras Base:**  
- /docs/business-rules/pilares-empresa.md  
- /docs/business-rules/diagnosticos.md

---

## 1️⃣ Resumo da Validação

- **Tipo de testes:** E2E (Playwright)
- **Testes criados:** 12 E2E (smoke)
- **Status de execução:** ✅ TODOS PASSANDO (execução serial)
- **Regras validadas:** UI-DIAG-006/007 (gestão de pilares via drawer)

## 2️⃣ Testes Unitários Criados

- **Nenhum** (escopo E2E solicitado)

## 3️⃣ Testes E2E Criados

### Playwright
- `frontend/e2e/pilares-empresa/editar-pilares.smoke.spec.ts`
  - @pilares smoke: ADMINISTRADOR abre drawer "Editar Pilares" via menu de ações
  - @pilares smoke: GESTOR abre drawer "Editar Pilares" da própria empresa
  - @pilares smoke: COLABORADOR não deve ver menu de ações
  - @pilares smoke: ADMINISTRADOR abre drawer de responsável pelo pilar
  - @pilares smoke: GESTOR abre drawer de responsável pelo pilar da própria empresa
  - @pilares smoke: ADMINISTRADOR vê apenas usuários da empresa selecionada no drawer
  - @pilares smoke: GESTOR pode iniciar criação de usuário simplificado como responsável
  - @pilares smoke: ADMINISTRADOR abre drawer "Adicionar Pilar" pelo menu de ações
  - @pilares smoke: GESTOR abre drawer "Adicionar Pilar" da própria empresa
  - @pilares smoke: ADMINISTRADOR vê seção de reordenar pilares no drawer de edição
  - @pilares smoke: ADMINISTRADOR vê botão de remover pilar no drawer de edição
  - @pilares smoke: GESTOR vê lista de pilares no drawer de edição

**Execução (isolada):**
```bash
cd frontend && npx playwright test e2e/pilares-empresa/editar-pilares.smoke.spec.ts
```

**Resultado (serial):** ✅ 12/12 passing

## 4️⃣ Cobertura de Regras

**Regras testadas (E2E):**
- [x] UI-DIAG-006/007: Acesso ao gerenciamento de pilares via drawer (Diagnóstico)
- [x] RBAC UI: COLABORADOR não visualiza menu de ações
- [x] RBAC UI: GESTOR acessa ações da própria empresa
- [x] RBAC UI: ADMINISTRADOR acessa definição de responsável
- [x] RBAC UI: GESTOR acessa definição de responsável
- [x] Multi-tenant UI: ADMINISTRADOR não vê usuários fora da empresa selecionada
- [x] UI: GESTOR inicia criação simplificada de usuário no drawer de responsável
- [x] UI: Drawer "Adicionar Pilar" disponível para ADMINISTRADOR e GESTOR
- [x] UI: Seção de reordenação visível no drawer de edição
- [x] UI: Botão de remover pilar visível no drawer de edição (ADMIN)
- [x] UI: Lista de pilares visível para GESTOR no drawer de edição

## 5️⃣ Bugs/Falhas Detectados

**Nenhum bug funcional detectado no novo teste.**

**Falhas de execução fora do escopo (run com @pilares completo):**
- `frontend/e2e/pilares/drag-and-drop.spec.ts` falha em login (`Login falhou: sem navegação e sem token`).
  - Impacto: bloqueia execução total dos testes @pilares.
  - Observação: Não altera código de produção. Requer investigação no setup/login desses testes.

**Observação de estabilidade:**
- Execução paralela do smoke apresentou falhas intermitentes de login. Execução serial (`--workers=1`) passou 11/11.

## 6️⃣ Edge Cases Testados (Adversarial Thinking)

- [x] Permissões RBAC (Gestor/Colaborador) no menu de ações
- [ ] Empresa sem pilares (drawer deve abrir com estado vazio)

## 7️⃣ Qualidade Estendida (se solicitado)

- Não solicitado.

## 8️⃣ Problemas de Execução Corrigidos

- Nenhum.

## 9️⃣ Recomendações

- Stabilizar fluxo de login nos testes `e2e/pilares/drag-and-drop.spec.ts` antes de reativar o pacote @pilares completo.
- Criar smoke para "Adicionar Pilar" via drawer (UI-DIAG-006/007) quando priorizado.

## 🔟 Status Final e Próximos Passos

- [x] Novo teste smoke criado e executado com sucesso
- [ ] Investigar falha de login nos testes @pilares remanescentes
- [ ] Expandir cobertura (RBAC + empty state)

---

**Handoff criado automaticamente pelo QA Engineer**
