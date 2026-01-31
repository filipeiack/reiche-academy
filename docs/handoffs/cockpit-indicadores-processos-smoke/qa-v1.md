# QA Handoff: Cockpit Pilares - Indicadores e Processos (Smoke)

**Data:** 2026-01-29  
**QA Engineer:** QA Engineer  
**Dev Handoff:** N/A (migração de testes legacy)  
**Regras Base:**  
- /docs/business-rules/cockpit-gestao-indicadores.md  
- /docs/business-rules/cockpit-processos-prioritarios.md

---

## 1️⃣ Resumo da Validação

- **Tipo de testes:** E2E (Playwright)
- **Testes criados:** 5 E2E (smoke)
- **Status de execução:** ⏳ pendente
- **Regras validadas:** CRUD básico de indicadores + atualização de status de processos

## 2️⃣ Testes Unitários Criados

- **Nenhum** (escopo E2E solicitado)

## 3️⃣ Testes E2E Criados

### Playwright
- `frontend/e2e/cockpit-pilares/indicadores-processos.smoke.spec.ts`
  - GESTOR cria indicador com campos obrigatórios
  - GESTOR valida nome único do indicador
  - GESTOR remove indicador (soft delete)
  - GESTOR atualiza status de mapeamento
  - GESTOR limpa status de mapeamento (valor vazio)

**Execução (isolada):**
```bash
cd frontend && npx playwright test e2e/cockpit-pilares/indicadores-processos.smoke.spec.ts --workers=1
```

**Resultado:** ⏳ pendente

## 4️⃣ Cobertura de Regras

**Regras testadas (E2E):**
- [x] Gestão de indicadores: criação com campos obrigatórios
- [x] Gestão de indicadores: nome único por cockpit
- [x] Gestão de indicadores: soft delete
- [x] Processos prioritários: atualização de status (mapeamento)
- [x] Processos prioritários: limpar status (valor vazio)

## 5️⃣ Bugs/Falhas Detectados

Nenhum bug funcional detectado.

## 6️⃣ Edge Cases Testados (Adversarial Thinking)

- [ ] Indicadores sem responsáveis disponíveis
- [ ] Processos sem rotinas associadas

## 7️⃣ Qualidade Estendida (se solicitado)

- Não solicitado.

## 8️⃣ Problemas de Execução Corrigidos

- Nenhum.

## 9️⃣ Recomendações

- Garantir seed com cockpit/pilares e processos para reduzir skips.

## 🔟 Status Final e Próximos Passos

- [ ] Executar smoke spec para confirmar estabilidade

---

**Handoff criado automaticamente pelo QA Engineer**
