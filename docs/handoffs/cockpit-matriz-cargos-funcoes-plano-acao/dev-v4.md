# Dev Handoff: Matriz de Cargos e Funções + Plano de Ação Específico

**Data:** 2026-01-30  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**
- /docs/business-rules/cockpit-matriz-cargos-funcoes.md
- /docs/business-rules/cockpit-plano-acao-especifico.md  
**Business Analyst Handoff:** /docs/handoffs/cockpit-matriz-cargos-funcoes-plano-acao/business-v1.md

---

## 1️⃣ Escopo Implementado

- Frontend: normalização global de erro 403 para garantir mensagem clara de permissão também em handlers locais.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- frontend/src/app/core/interceptors/forbidden.interceptor.ts - normaliza HttpErrorResponse de 403 com mensagem padrão.

## 3️⃣ Decisões Técnicas

- Em 403, mantém toast global e reemite HttpErrorResponse com `error.message` preenchido para handlers locais que exibem `err?.error?.message`.

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

- [ ] Mensagens de erro padronizadas continuam não formalizadas nas regras; mantido padrão de permissão para 403.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados:**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Feedback de permissão em erro 403 (demanda do usuário) - Arquivo: frontend/src/app/core/interceptors/forbidden.interceptor.ts

**Regras NÃO implementadas:**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar 403 com e sem mensagem do backend.
- **Prioridade de testes:** qualquer tentativa de CRUD sem permissão.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Possível duplicidade de toasts em telas que já mostram erro genérico.

**Dependências externas:**
- SweetAlert2.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
