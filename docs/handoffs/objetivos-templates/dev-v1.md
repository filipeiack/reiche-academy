# Dev Handoff: Objetivos Templates

**Data:** 2026-02-03  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** /docs/business-rules/objetivos-templates-globais.md  
**Business Analyst Handoff:** /docs/handoffs/objetivos-templates/business-v1.md

---

## 1️⃣ Escopo Implementado

- CRUD completo de Objetivos Templates (ADMIN) no backend com hard delete.
- Endpoint de pré-preenchimento para criar cockpit com objetivo template por pilar.
- CRUD frontend (lista + formulário) baseado em Indicadores Templates e form baseado no criar-cockpit-drawer.
- Pré-preenchimento no criar-cockpit-drawer quando `pilarTemplateId` existe.
- Item de menu e rotas para Objetivos Templates.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- `backend/prisma/schema.prisma` - modelo `ObjetivoTemplate` e relação com `Pilar`.
- `backend/src/app.module.ts` - import do `ObjetivosTemplatesModule`.
- `backend/src/modules/objetivos-templates/objetivos-templates.module.ts` - módulo do Nest.
- `backend/src/modules/objetivos-templates/objetivos-templates.controller.ts` - endpoints CRUD admin-only.
- `backend/src/modules/objetivos-templates/objetivos-templates.service.ts` - regras de CRUD e hard delete.
- `backend/src/modules/objetivos-templates/dto/create-objetivo-template.dto.ts` - DTO de criação.
- `backend/src/modules/objetivos-templates/dto/update-objetivo-template.dto.ts` - DTO de atualização.
- `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` - endpoint auxiliar para buscar objetivo template por pilarEmpresa.
- `backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts` - rota para pré-preenchimento.

### Frontend
- `frontend/src/app/core/services/objetivos-templates.service.ts` - service de CRUD.
- `frontend/src/app/views/pages/objetivos-templates/objetivos-templates.routes.ts` - rotas do módulo.
- `frontend/src/app/views/pages/objetivos-templates/objetivos-templates-list/objetivos-templates-list.component.ts` - listagem.
- `frontend/src/app/views/pages/objetivos-templates/objetivos-templates-list/objetivos-templates-list.component.html` - template da listagem.
- `frontend/src/app/views/pages/objetivos-templates/objetivos-templates-list/objetivos-templates-list.component.scss` - estilos.
- `frontend/src/app/views/pages/objetivos-templates/objetivo-template-form/objetivo-template-form.component.ts` - formulário.
- `frontend/src/app/views/pages/objetivos-templates/objetivo-template-form/objetivo-template-form.component.html` - template do formulário.
- `frontend/src/app/views/pages/objetivos-templates/objetivo-template-form/objetivo-template-form.component.scss` - estilos.
- `frontend/src/app/core/services/cockpit-pilares.service.ts` - método `getObjetivoTemplate`.
- `frontend/src/app/views/pages/diagnostico-notas/criar-cockpit-drawer/criar-cockpit-drawer.component.ts` - pré-preenchimento dos campos.
- `frontend/src/app/app.routes.ts` - registro da rota `/objetivos-templates`.
- `frontend/src/app/views/layout/sidebar/menu.ts` - item de menu para objetivos templates.
- `frontend/src/app/core/services/menu.service.ts` - admin-only links atualizados.
- `frontend/src/assets/i18n/pt-BR.json` - novas chaves de tradução.
- `frontend/src/assets/i18n/en-US.json` - novas chaves de tradução.

## 3️⃣ Decisões Técnicas

- CRUD admin-only implementado no controller de Objetivos Templates.
- Hard delete aplicado no backend (sem `ativo` e sem auditoria), conforme regra.
- Pré-preenchimento feito via novo endpoint em Cockpit Pilares para manter permissões existentes.
- Frontend usa `maxlength=300` nos campos, alinhado ao criar-cockpit-drawer.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores
- [x] Prisma com .select() onde necessário
- [x] Soft delete respeitado (não aplicável: hard delete)
- [x] Guards aplicados
- [x] Audit logging implementado (não aplicável: sem auditoria)

### Frontend
- [x] Standalone components
- [x] `inject()` function usado
- [x] Control flow moderno
- [x] Translations aplicadas
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Limites de tamanho para `entradas`, `saidas`, `missao` não foram definidos nas regras; frontend usa 300 chars (UI), backend aceita sem limite explícito.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [BR-OBJ-001] CRUD global de Objetivos Templates (admin-only) - Arquivo: `backend/src/modules/objetivos-templates/objetivos-templates.controller.ts`
- [BR-OBJ-002] Hard delete sem auditoria - Arquivo: `backend/src/modules/objetivos-templates/objetivos-templates.service.ts`
- [BR-OBJ-003] Pré-preenchimento no criar-cockpit-drawer - Arquivo: `frontend/src/app/views/pages/diagnostico-notas/criar-cockpit-drawer/criar-cockpit-drawer.component.ts`
- [BR-OBJ-004] Endpoint de pré-preenchimento por pilar template - Arquivo: `backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts`
- [BR-OBJ-005] CRUD frontend admin (lista + form) - Arquivo: `frontend/src/app/views/pages/objetivos-templates/`

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** Validar limites de tamanho e sanitização de inputs.
- **Prioridade de testes:** CRUD admin-only, hard delete, pré-preenchimento no criar-cockpit-drawer.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Ausência de limite de tamanho no backend pode permitir payloads grandes.

**Dependências externas:**
- Prisma migration para novo modelo `ObjetivoTemplate`.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
