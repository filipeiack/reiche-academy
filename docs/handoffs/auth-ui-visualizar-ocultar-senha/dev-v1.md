# Dev Handoff: Visualizar/Ocultar Senha (Login, Usuários, Reset)

**Data:** 2026-01-30  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/auth-ui-visualizar-ocultar-senha.md](../../business-rules/auth-ui-visualizar-ocultar-senha.md)  
**Business Analyst Handoff:** [docs/handoffs/auth-ui-visualizar-ocultar-senha/business-v1.md](business-v1.md)

---

## 1️⃣ Escopo Implementado

- Toggle de visualizar/ocultar senha no login.
- Toggle de visualizar/ocultar senha no reset de senha (nova senha e confirmação).
- Toggle de visualizar/ocultar senha no formulário de usuários (criação e edição).
- Remoção de script inline do template de login (substituído por binding Angular).

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- frontend/src/app/views/pages/auth/login/login.component.ts - estado e método `togglePasswordVisibility()`.
- frontend/src/app/views/pages/auth/login/login.component.html - input-group com botão de alternância e remoção de script inline.
- frontend/src/app/views/pages/auth/reset-password/reset-password.component.ts - estados e métodos para nova senha e confirmação.
- frontend/src/app/views/pages/auth/reset-password/reset-password.component.html - input-group com botões de alternância.
- frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.html - input-group com botão de alternância em criação e edição.

## 3️⃣ Decisões Técnicas

- Preferência por binding Angular e estado local (booleans) em vez de DOM API direta.
- Toggle independente por campo no reset de senha (nova e confirmação).
- Ícones: Bootstrap Icons nas telas auth, Feather Icons no formulário de usuários (mantém padrão visual local).

## 4️⃣ Auto-Validação de Padrões

### Frontend
- [x] Standalone components
- [x] `inject()` function usado
- [x] Control flow moderno preservado (sem mudanças estruturais)
- [x] Translations aplicadas (sem novas strings no template)
- [x] ReactiveForms mantidos
- [x] Error handling preservado

**Violações encontradas durante auto-validação:**
- Nenhuma

## 5️⃣ Ambiguidades e TODOs

- [ ] Padrão visual do controle (ícone/posição) não foi padronizado globalmente; mantido padrão local das telas.
- [ ] Acessibilidade: labels de aria adicionadas, mas tradução não foi incluída (texto em PT-BR fixo).

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados:** nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Visualizar/ocultar senha em login — arquivo: frontend/src/app/views/pages/auth/login/login.component.html
- Visualizar/ocultar senha em reset — arquivo: frontend/src/app/views/pages/auth/reset-password/reset-password.component.html
- Visualizar/ocultar senha em usuários-form — arquivo: frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.html

**Regras NÃO implementadas:**
- Nenhuma

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar interação em mobile e compatibilidade de ícones nas três telas.
- **Prioridade de testes:** alternância em ambos os campos do reset e persistência do valor digitado.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Inconsistência visual de ícones entre telas (Bootstrap vs Feather).

**Dependências externas:**
- Bootstrap Icons e Feather Icons (já usados no projeto).

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
