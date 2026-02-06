# Dev Handoff: Plano de Ação Específico — Filtro por KPI

**Data:** 2026-02-05  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/cockpit-plano-acao-especifico.md](../../business-rules/cockpit-plano-acao-especifico.md)  
**Business Analyst Handoff:** [docs/handoffs/plano-acao-especifico/business-v3.md](business-v3.md)

---

## 1️⃣ Escopo Implementado

- KPI cards do sumario agora aplicam filtro de status na lista ao clicar.
- Atalho de teclado (Enter) adicionado para acessibilidade no KPI card.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html) - adiciona handlers de clique e acessibilidade nos cards KPI.
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts) - adiciona metodo `aplicarFiltroStatus()` para atualizar filtro.

## 3️⃣ Decisões Técnicas

- O KPI de TOTAL limpa apenas o filtro de status, preservando o filtro por indicador.
- O KPI usa `role="button"` e `tabindex="0"` com `keyup.enter` para melhorar navegacao por teclado.

## 4️⃣ Auto-Validação de Padrões

### Frontend
- [x] Standalone components
- [x] `inject()` function usado
- [x] Control flow moderno
- [x] Translations aplicadas
- [x] ReactiveForms (nao alterado)
- [x] Error handling (nao alterado)

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- Nenhuma.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitarios finais sao responsabilidade do QA Engineer.

**Testes basicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Nenhuma regra nova (ajuste de UI dentro do escopo da listagem).

**Regras NÃO implementadas:**
- N/A.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar clique no KPI e combinacao com filtro por indicador.
- **Prioridade de testes:** interacao de filtro e estado visual da lista.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Nenhum identificado.

**Dependências externas:**
- Nenhuma.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
