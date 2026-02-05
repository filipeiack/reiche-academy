# Dev Handoff: Filtro de Ano nos Gráficos

**Data:** 2026-02-04  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** N/A (ajuste de UX solicitado pelo usuário)  
**Business Analyst Handoff:** N/A

---

## 1️⃣ Escopo Implementado

- Alterado padrão dos filtros para o ano corrente.
- Reordenadas opções de filtro para exibir anos primeiro e Últimos 12 meses por último.
- Ajustado fallback quando não há dados ou ocorre erro de carregamento.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- [frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts](frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts) - filtro padrão e ordenação das opções.
- [frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts](frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts) - filtro padrão e ordenação das opções.

## 3️⃣ Decisões Técnicas

- Ano corrente calculado com base em São Paulo para consistência com o restante da aplicação.
- Inclusão do ano corrente nas opções mesmo quando não retornado pela API para garantir seleção padrão válida.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] Translations aplicadas
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma violação encontrada

## 5️⃣ Ambiguidades e TODOs

- [ ] Validar com o time se o ano corrente deve aparecer mesmo sem dados históricos.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Filtro padrão no ano corrente e Últimos 12 meses por último (Diagnóstico Evolução) - [frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts](frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts#L60-L660)
- Filtro padrão no ano corrente e Últimos 12 meses por último (Gráfico de Indicadores) - [frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts](frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts#L67-L479)

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar seleção padrão quando não há dados do ano corrente.
- **Prioridade de testes:** comportamento do filtro ao abrir a tela.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Se o backend não aceitar ano sem dados, o filtro padrão pode retornar vazio.

**Dependências externas:**
- API de anos disponíveis do cockpit.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
