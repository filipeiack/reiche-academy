# Dev Handoff: Matriz de Cargos e Funções + Plano de Ação Específico

**Data:** 2026-01-30  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**
- /docs/business-rules/cockpit-matriz-cargos-funcoes.md
- /docs/business-rules/cockpit-plano-acao-especifico.md  
**Business Analyst Handoff:** /docs/handoffs/cockpit-matriz-cargos-funcoes-plano-acao/business-v1.md

---

## 1️⃣ Escopo Implementado

- Frontend: revisão de mensagens genéricas de erro para usar `err?.error?.message` quando disponível, garantindo mensagem clara de permissão (403) em todas as telas relevantes.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts - erro de salvar ação usa mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/funcao-form-drawer/funcao-form-drawer.component.ts - erro de salvar função usa mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.ts - erros de cargo/função e reordenação usam mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/rotinas/rotinas-list/rotinas-list.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/rotinas/rotina-form/rotina-form.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/pilares/pilares-list/pilares-list.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/pilares/pilares-form/pilares-form.component.ts - erro de carregar pilar usa mensagem do backend.
- frontend/src/app/views/pages/empresas/empresas-list/empresas-list.component.ts - erro de detalhes usa mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts - erro de remoção usa mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts - erros de carregamento usam mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.ts - erro de carregamento usa mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/lista-cockpits/lista-cockpits.component.ts - erro de carregamento usa mensagem do backend.
- frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts - erro de salvar usa mensagem do backend.
- frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.ts - erro de carregar perfis usa mensagem do backend.
- frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/diagnostico-notas/adicionar-pilar-modal/adicionar-pilar-modal.component.ts - erro de carregar pilares usa mensagem do backend.
- frontend/src/app/views/pages/diagnostico-notas/pilares-empresa-form/pilares-empresa-form.component.ts - erro de salvar ordem usa mensagem do backend.
- frontend/src/app/views/pages/diagnostico-notas/rotina-edit-drawer/rotina-edit-drawer.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/diagnostico-notas/responsavel-drawer/responsavel-drawer.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/diagnostico-notas/pilar-edit-drawer/pilar-edit-drawer.component.ts - erros genéricos usam mensagem do backend.
- frontend/src/app/views/pages/diagnostico-notas/pilar-add-drawer/pilar-add-drawer.component.ts - erro de carregar pilares usa mensagem do backend.
- frontend/src/app/views/pages/diagnostico-notas/criar-cockpit-drawer/criar-cockpit-drawer.component.ts - erro de criação usa mensagem do backend.
- frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts - erro de histórico usa mensagem do backend.

## 3️⃣ Decisões Técnicas

- Mantida a mensagem padrão do backend (`err?.error?.message`) com fallback local para erros genéricos.
- Preservado comportamento atual de toast/alert sem alterar fluxos de sucesso.

## 4️⃣ Auto-Validação de Padrões

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Textos padronizados de erro ainda não formalizados nas regras; mantido padrão baseado em `err?.error?.message`.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados:**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Feedback claro de permissão em erros 403 por uso consistente de mensagens do backend.

**Regras NÃO implementadas:**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar que 403 exibe mensagem clara em telas com toast e telas com `this.error`.
- **Prioridade de testes:** operações de CRUD sem permissão em módulos principais.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Mensagens de backend podem variar entre módulos.

**Dependências externas:**
- SweetAlert2.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
