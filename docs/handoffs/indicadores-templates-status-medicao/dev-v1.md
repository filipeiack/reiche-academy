# Dev Handoff: Remoção de Status de Medição em Indicadores Templates

**Data:** 2026-02-04  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**
- /docs/business-rules/indicadores-templates-remover-status-medicao.md
- /docs/business-rules/indicadores-templates-globais.md
**Business Analyst Handoff:** /docs/handoffs/indicadores-templates-status-medicao/business-v1.md

---

## 1️⃣ Escopo Implementado

- Remoção de `statusMedicao` do CRUD de Indicadores Templates (backend + frontend).
- Ignorar payloads com `statusMedicao` nos endpoints de templates (via ValidationPipe local).
- Snapshot de templates para cockpit com `statusMedicao` inicial `null`.
- Seed ajustado para templates sem `statusMedicao`.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- `backend/prisma/schema.prisma` - removido `statusMedicao` de `IndicadorTemplate`.
- `backend/src/modules/indicadores-templates/dto/create-indicador-template.dto.ts` - removido campo/validação.
- `backend/src/modules/indicadores-templates/indicadores-templates.controller.ts` - ValidationPipe local para ignorar campos extra.
- `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` - snapshot com `statusMedicao: null`.
- `backend/prisma/seed.ts` - templates sem `statusMedicao` e snapshot com `null`.

### Frontend
- `frontend/src/app/core/services/indicadores-templates.service.ts` - remover `statusMedicao` de DTOs/interfaces.
- `frontend/src/app/views/pages/indicadores-templates/indicador-template-form/indicador-template-form.component.ts` - remover campo do form.
- `frontend/src/app/views/pages/indicadores-templates/indicador-template-form/indicador-template-form.component.html` - remover UI do status.
- `frontend/src/app/views/pages/indicadores-templates/indicadores-templates-list/indicadores-templates-list.component.html` - remover coluna/detalhe de status.
- `frontend/e2e/indicadores-templates/indicadores-templates.smoke.spec.ts` - remover expectativa do campo.

## 3️⃣ Decisões Técnicas

- Ignorar `statusMedicao` via `ValidationPipe` local nos endpoints de templates para respeitar `forbidNonWhitelisted` global.
- `statusMedicao` inicial definido como `null` ao copiar templates para cockpit, conforme regra atualizada.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores
- [x] Prisma com .select()
- [x] Soft delete respeitado
- [x] Guards aplicados
- [x] Audit logging implementado

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] Translations aplicadas
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Gerar migration Prisma para remover coluna `status_medicao` de `indicadores_templates` em banco.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Ajuste em smoke test E2E do frontend (remoção do campo).

**Cobertura preliminar:**
- Fluxo de UI: presença do formulário sem `statusMedicao`.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Remoção de `statusMedicao` do template (DTO/UI/persistência)
- Snapshot de templates com `statusMedicao = null`
- Ignorar payloads com `statusMedicao`

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar criação/edição de templates sem `statusMedicao` e snapshot com `null`.
- **Prioridade de testes:** endpoints de templates (payload com `statusMedicao`), criação de cockpit a partir de template.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Necessidade de migration para sincronizar schema do banco com a remoção da coluna.

**Dependências externas:**
- Prisma migrations / banco de dados.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
