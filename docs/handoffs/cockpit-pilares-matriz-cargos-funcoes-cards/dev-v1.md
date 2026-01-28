# Dev Handoff: Matriz Cargos e Funções - Cards Multiabertos

**Data:** 2026-01-28  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** /docs/business-rules/cockpit-pilares.md  
**Business Analyst Handoff:** N/A (ajuste de UI/UX)

---

## 1️⃣ Escopo Implementado

- Remoção do componente de accordion da seção “Funções por Cargo”.
- Implementação de cards customizados com toggle independente (multiabertos), semelhante ao comportamento da tela de diagnóstico.
- Botão “Adicionar Função” movido para dentro do card do cargo, acima da tabela de funções.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.html - substituição do accordion por cards com toggle.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.ts - estado de expansão por cargo.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.scss - estilos do botão de toggle.

## 3️⃣ Decisões Técnicas

- Estado de expansão por `cargo.id` para permitir múltiplos cards abertos ao mesmo tempo.
- Inicialização de estado com padrão “fechado”.
- Botão “Adicionar Função” no body para respeitar requisito de layout.

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

- [ ] Nenhuma

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Não aplicável (ajuste visual)

**Regras NÃO implementadas (se houver):**
- N/A

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** Verificar comportamento de expansão múltipla e acessibilidade do toggle.
- **Prioridade de testes:** UI de cards e ação de “Adicionar Função”.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Estado de expansão não persistido entre recarregamentos (comportamento atual).

**Dependências externas:**
- Bootstrap (estilos de card e botões)

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
