# Dev Handoff: Descrição no select do gráfico de indicadores

**Data:** 2026-01-28  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md)  
**Business Analyst Handoff:** N/A (não localizado para este ajuste de UI)

---

## 1️⃣ Escopo Implementado

- Adicionado template de label e opções do `ng-select` para exibir `descricao` abaixo do nome do indicador em fonte pequena.
- Ajustada altura do seletor para evitar corte do texto em duas linhas.
- Aplicada a mesma exibição (nome + descrição) no seletor de indicador do drawer de ação.
- Ajustada altura do seletor de indicador do drawer para evitar corte do texto.
- Adicionado destaque visual para a aba ativa nas tabs do cockpit.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- `frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.html` - Templates do `ng-select` com nome + descrição.
- `frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.scss` - Ajuste de altura/alinhamento do seletor.
- `frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts` - Templates do `ng-select` com nome + descrição.
- `frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts` - Altura do `ng-select` ajustada.
- `frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.scss` - Estilo de destaque da aba ativa.

## 3️⃣ Decisões Técnicas

- Uso de `ng-label-tmp` e `ng-option-tmp` para manter o `bindLabel` e controlar a exibição em duas linhas.
- Renderização condicional da descrição para evitar exibir texto vazio.
- Ajuste de `min-height` e padding no container do `ng-select` para acomodar duas linhas.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [ ] Naming conventions seguidas (não aplicável)
- [ ] Estrutura de pastas correta (não aplicável)
- [ ] DTOs com validadores (não aplicável)
- [ ] Prisma com .select() (não aplicável)
- [ ] Soft delete respeitado (não aplicável)
- [ ] Guards aplicados (não aplicável)
- [ ] Audit logging implementado (não aplicável)

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] Translations aplicadas (não alterado)
- [x] ReactiveForms (não aplicável)
- [x] Error handling (não alterado)

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Confirmar se a descrição deve aparecer também quando não existir (atualmente ocultada se vazia).
- [ ] Confirmar se há necessidade de tradução do texto exibido (arquivo já usa strings diretas).

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Não aplicável.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Nenhuma regra de negócio específica; ajuste de UI no seletor de indicadores.

**Regras NÃO implementadas (se houver):**
- N/A.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** Validar renderização do dropdown e label selecionado com descrições longas.
- **Prioridade de testes:** UX do seletor (não funcional).

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Descrições longas podem quebrar layout do dropdown (verificação visual).

**Dependências externas:**
- ng-select templates.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
