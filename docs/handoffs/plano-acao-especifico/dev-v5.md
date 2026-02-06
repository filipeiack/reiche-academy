# Dev Handoff: Plano de Acao Especifico — Scroll ao clicar KPI

**Data:** 2026-02-05  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/cockpit-plano-acao-especifico.md](../../business-rules/cockpit-plano-acao-especifico.md)  
**Business Analyst Handoff:** [docs/handoffs/plano-acao-especifico/business-v3.md](business-v3.md)

---

## 1️⃣ Escopo Implementado

- Ao clicar no KPI, a tela rola ate a lista de acoes.
- Mantida a aplicacao do filtro de status ao clicar no KPI.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts) - adiciona metodo `scrollToListaAcoes()` e usa `ViewChild`.
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html) - adiciona referencia `#listaAcoes` no card da lista.

## 3️⃣ Decisoes Tecnicas

- Scroll usa `scrollIntoView` com `behavior: 'smooth'` apos aplicar filtros.
- `setTimeout(0)` evita corrida com renderizacao do DOM.

## 4️⃣ Auto-Validacao de Padroes

### Frontend
- [x] Standalone components
- [x] `inject()` function usado
- [x] Control flow moderno
- [x] Translations aplicadas
- [x] ReactiveForms (nao alterado)
- [x] Error handling (nao alterado)

**Violacoes encontradas durante auto-validacao:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- Nenhuma.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitarios finais sao responsabilidade do QA Engineer.

**Testes basicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderencia a Regras de Negocio

**Regras implementadas:**
- N/A (ajuste de UX sem impacto em regras).

**Regras NAO implementadas:**
- N/A.

## 8️⃣ Status para Proximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atencao:** validar scroll com KPI e estado de filtros.
- **Prioridade de testes:** interacao KPI -> lista com filtros combinados.

## 9️⃣ Riscos Identificados

**Riscos tecnicos:**
- Nenhum identificado.

**Dependencias externas:**
- Nenhuma.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
