# Dev Handoff: Matriz de Cargos e Funções + Plano de Ação Específico

**Data:** 2026-01-30  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**
- /docs/business-rules/cockpit-matriz-cargos-funcoes.md
- /docs/business-rules/cockpit-plano-acao-especifico.md  
**Business Analyst Handoff:** /docs/handoffs/cockpit-matriz-cargos-funcoes-plano-acao/business-v1.md

---

## 1️⃣ Escopo Implementado

- Frontend: tratamento global de erro 403 com mensagem clara de permissão em todas as telas via interceptor.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- frontend/src/app/core/interceptors/forbidden.interceptor.ts - interceptor global para exibir toast em 403.
- frontend/src/app/app.config.ts - registro do novo interceptor.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/cargo-form-drawer/cargo-form-drawer.component.ts - remoção do tratamento local específico de 403.

## 3️⃣ Decisões Técnicas

- Tratamento centralizado por interceptor para garantir cobertura em todas as telas.
- Throttle de 2s para evitar múltiplos toasts em sequência para 403.
- Mensagem padronizada: "Seu perfil não tem permissão para realizar esta ação."

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

- [ ] Textos padronizados de erro ainda não formalizados em regras; mensagem aplicada globalmente para 403.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados:**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Feedback de permissão em erro 403 (demanda do usuário) - Arquivos: frontend/src/app/core/interceptors/forbidden.interceptor.ts, frontend/src/app/app.config.ts

**Regras NÃO implementadas:**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar se mensagem aparece em operações 403 sem duplicação excessiva.
- **Prioridade de testes:** qualquer tentativa de CRUD sem permissão em módulos principais.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Possível duplicidade de toasts em telas que já exibem erros genéricos para 403.

**Dependências externas:**
- SweetAlert2.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
