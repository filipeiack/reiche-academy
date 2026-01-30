# Dev Handoff: Diagnóstico Evolução — Filtro (Ano + Últimos 12 Meses)

**Data:** 2026-01-29  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/pilar-evolucao.md](../../business-rules/pilar-evolucao.md)  
**Business Analyst Handoff:** [docs/handoffs/diagnostico-evolucao-filtro/business-v1.md](business-v1.md)

---

## 1️⃣ Escopo Implementado

- Ajuste do filtro de evolução para sempre incluir “Últimos 12 meses” (padrão) + anos disponíveis.
- Filtro aplicado client-side por “Últimos 12 meses” e por ano.
- Estilo de borda primária no `ng-select` do filtro.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- [frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts](../../../frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts) - Lógica de opções do filtro, padrão “Últimos 12 meses” e aplicação do filtro no histórico.
- [frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.html](../../../frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.html) - `ng-select` com bindLabel/bindValue e classe de borda primária.
- [frontend/src/styles/_custom.scss](../../../frontend/src/styles/_custom.scss) - Classe global `ng-select-primary-border`.

## 3️⃣ Decisões Técnicas

- Filtro e lista de anos gerados a partir do histórico de períodos retornado por `PeriodosAvaliacaoService.getHistorico()`, evitando novos endpoints.
- Valor padrão do filtro segue o padrão já usado em `grafico-indicadores` (`ultimos-12-meses`).

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Frontend
- [x] Standalone components
- [x] `inject()` function usado
- [x] Control flow moderno
- [x] Translations aplicadas (sem mudanças de texto existentes)
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] A regra pede anos distintos por `PilarEvolucao.createdAt`; atualmente o filtro usa `PeriodoAvaliacao.ano`/`dataReferencia` provenientes do histórico. Se necessário, expor `createdAt` dos snapshots no backend para ajustar a origem dos anos.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [UI-EVOL-006] Filtro “Últimos 12 meses” + anos disponíveis — Arquivo: [frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts](../../../frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts)

**Regras NÃO implementadas:**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar que o filtro usa anos corretos com base em dados reais da empresa (snapshots existentes).
- **Prioridade de testes:** UI-EVOL-006 (filtro e estado vazio).

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Divergência entre ano derivado de `PeriodoAvaliacao` e ano de `PilarEvolucao.createdAt`, se houver recongelamentos fora do período.

**Dependências externas:**
- Nenhuma.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
