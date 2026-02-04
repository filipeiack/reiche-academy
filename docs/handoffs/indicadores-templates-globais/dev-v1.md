# Dev Handoff: Indicadores Templates Globais + Ordenação Submenu Cockpits

**Data:** 2026-02-02  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [../../business-rules/indicadores-templates-globais.md](../../business-rules/indicadores-templates-globais.md), [../../business-rules/sidebar-cockpit-submenu-ordenacao.md](../../business-rules/sidebar-cockpit-submenu-ordenacao.md)  
**Business Analyst Handoff:** [./business-v1.md](./business-v1.md)

---

## 1️⃣ Escopo Implementado

- CRUD backend de Indicadores Templates globais (ADMIN-only) com validações, soft delete e auditoria.
- Nova entidade `IndicadorTemplate` no Prisma e relacionamento com `Pilar`.
- Snapshot Pattern: cópia automática de indicadores templates para `IndicadorCockpit` na criação de cockpit (com 12 meses).
- CRUD frontend (lista + formulário) baseado na tela de rotinas.
- Novo item de menu para Indicadores Templates e rota protegida por admin.
- Ordenação alfabética do submenu de Cockpits no menu lateral.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- `backend/prisma/schema.prisma` - modelo `IndicadorTemplate` e relação com `Pilar`.
- `backend/src/app.module.ts` - import do módulo `IndicadoresTemplatesModule`.
- `backend/src/modules/indicadores-templates/dto/create-indicador-template.dto.ts` - DTO de criação com validações.
- `backend/src/modules/indicadores-templates/dto/update-indicador-template.dto.ts` - DTO de atualização.
- `backend/src/modules/indicadores-templates/indicadores-templates.controller.ts` - endpoints admin-only.
- `backend/src/modules/indicadores-templates/indicadores-templates.service.ts` - regras de CRUD, unicidade, soft delete e auditoria.
- `backend/src/modules/indicadores-templates/indicadores-templates.module.ts` - módulo do Nest.
- `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` - cópia de templates para cockpit + criação de 12 meses.

### Frontend
- `frontend/src/app/core/services/indicadores-templates.service.ts` - client HTTP do CRUD.
- `frontend/src/app/views/pages/indicadores-templates/indicadores-templates.routes.ts` - rotas protegidas por admin.
- `frontend/src/app/views/pages/indicadores-templates/indicadores-templates-list/indicadores-templates-list.component.ts` - lista com filtros e ações.
- `frontend/src/app/views/pages/indicadores-templates/indicadores-templates-list/indicadores-templates-list.component.html` - layout da lista.
- `frontend/src/app/views/pages/indicadores-templates/indicadores-templates-list/indicadores-templates-list.component.scss` - estilos (vazio).
- `frontend/src/app/views/pages/indicadores-templates/indicador-template-form/indicador-template-form.component.ts` - formulário de criação/edição.
- `frontend/src/app/views/pages/indicadores-templates/indicador-template-form/indicador-template-form.component.html` - layout do formulário.
- `frontend/src/app/views/pages/indicadores-templates/indicador-template-form/indicador-template-form.component.scss` - estilos (vazio).
- `frontend/src/app/views/layout/sidebar/menu.ts` - item de menu Indicadores Templates.
- `frontend/src/app/core/services/menu.service.ts` - ordenação alfabética do submenu Cockpits.
- `frontend/src/app/app.routes.ts` - rota `/indicadores-templates`.
- `frontend/src/assets/i18n/pt-BR.json` - traduções pt-BR.
- `frontend/src/assets/i18n/en-US.json` - traduções en-US.

## 3️⃣ Decisões Técnicas

- `IndicadorTemplate` usa unicidade por (`pilarId`, `nome`) e soft delete via `ativo` para manter consistência com demais catálogos.
- Snapshot Pattern implementado em transação para garantir cópia atômica de indicadores + criação de 12 meses.
- Ordenação do submenu usa `localeCompare` simples (sem normalização especial), conforme regra.
- Em `IndicadoresTemplatesService` foi usado `(this.prisma as any).indicadorTemplate` para contornar tipagem do PrismaService. Requer revisão quando tipos estiverem atualizados.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores
- [x] Prisma com `.select()`/`include` explícito sem dados sensíveis
- [x] Soft delete respeitado
- [x] Guards aplicados
- [x] Audit logging implementado

### Frontend
- [x] Standalone components
- [x] `inject()` function usado
- [x] Control flow moderno (`@if`, `@for`)
- [x] Translations aplicadas
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Revisar tipagem do `PrismaService` para expor `indicadorTemplate` sem `any`.
- [ ] Executar migração do Prisma para criar tabela `indicadores_templates` em ambiente real.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [BR-IND-001] CRUD global de Indicadores Templates com validações e soft delete - Arquivo: `backend/src/modules/indicadores-templates/indicadores-templates.service.ts:15-190`
- [BR-IND-002] CRUD admin-only (RBAC) - Arquivo: `backend/src/modules/indicadores-templates/indicadores-templates.controller.ts:22-76`
- [BR-IND-003] Snapshot Pattern: cópia de templates e criação de 12 meses - Arquivo: `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts:340-380`
- [BR-SID-001] Ordenação alfabética do submenu de Cockpits - Arquivo: `frontend/src/app/core/services/menu.service.ts:126`

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar fluxo de migração Prisma e remoção do `any` em `PrismaService`.
- **Prioridade de testes:** cópia de templates no cockpit e CRUD admin-only.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Tipagem do Prisma ainda bypassada com `any`.
- Migração do banco ainda não executada no ambiente.

**Dependências externas:**
- Prisma Client (regeneração e migração de schema).

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
