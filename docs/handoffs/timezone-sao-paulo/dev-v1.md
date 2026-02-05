# Dev Handoff: Timezone São Paulo (Datas)

**Data:** 2026-02-03  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/timezone-sao-paulo.md](../../business-rules/timezone-sao-paulo.md), [docs/business-rules/periodo-mentoria.md](../../business-rules/periodo-mentoria.md)  
**Business Analyst Handoff:** [docs/handoffs/timezone-sao-paulo/business-v1.md](business-v1.md)

---

## 1️⃣ Escopo Implementado

- Normalização e formatação de datas no backend para America/Sao_Paulo.
- Substituição de conversões UTC em regras de período de mentoria/avaliação.
- Padronização de timestamps de auditoria/health para ISO com offset de São Paulo.
- Formatação de datas no frontend em America/Sao_Paulo (inputs, exibição e comparações).

## 2️⃣ Arquivos Criados/Alterados

### Backend
- [backend/src/common/utils/timezone.ts](backend/src/common/utils/timezone.ts) — utilitário de parsing/formatting em São Paulo.
- [backend/package.json](backend/package.json) — dependência date-fns-tz.
- [backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts](backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts) — parsing e mensagens com fuso São Paulo.
- [backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts](backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts) — parsing e validações com fuso São Paulo.
- [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts) — parsing de datas em ações e comparação de status com agora São Paulo.
- [backend/src/modules/usuarios/usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts) — auditoria com timestamp São Paulo.
- [backend/src/modules/health/health.controller.ts](backend/src/modules/health/health.controller.ts) — timestamp de health em São Paulo.
- [backend/src/modules/diagnosticos/dto/create-agenda-reuniao.dto.ts](backend/src/modules/diagnosticos/dto/create-agenda-reuniao.dto.ts) — exemplo com offset -03:00.

### Frontend
- [frontend/src/app/core/utils/date-time.ts](frontend/src/app/core/utils/date-time.ts) — utilitários de data em São Paulo.
- [frontend/src/app/core/services/periodos-mentoria.service.ts](frontend/src/app/core/services/periodos-mentoria.service.ts) — envio de datas com formato São Paulo.
- [frontend/src/app/core/services/save-feedback.service.ts](frontend/src/app/core/services/save-feedback.service.ts) — timestamps normalizados em São Paulo.
- [frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts](frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts) — inputs e horários com São Paulo.
- [frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts](frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts) — comparações e exibição com São Paulo.
- [frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.ts](frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.ts) — parsing/format em São Paulo.
- [frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.html](frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.html) — date pipe em São Paulo.
- [frontend/src/app/views/pages/empresas/empresas-list/empresas-list.component.ts](frontend/src/app/views/pages/empresas/empresas-list/empresas-list.component.ts) — formatação de período em São Paulo.
- [frontend/src/app/views/layout/navbar/navbar.component.ts](frontend/src/app/views/layout/navbar/navbar.component.ts) — intervalo de mentoria em São Paulo.
- [frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.html](frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.html) — date pipe em São Paulo.
- [frontend/src/app/views/pages/cockpit-pilares/lista-cockpits/lista-cockpits.component.html](frontend/src/app/views/pages/cockpit-pilares/lista-cockpits/lista-cockpits.component.html) — date pipe em São Paulo.
- [frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts](frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts) — labels de mês/ano em São Paulo.
- [frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.html](frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.html) — date pipe em São Paulo.

## 3️⃣ Decisões Técnicas

- Backend usa date-fns-tz para parse/format consistente em America/Sao_Paulo.
- Frontend usa Intl.DateTimeFormat com timezone fixo para evitar fuso do browser.
- Datas em inputs são padronizadas no formato YYYY-MM-DD considerando São Paulo.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores (existentes)
- [x] Prisma com .select() (mantido)
- [x] Soft delete respeitado (N/A)
- [x] Guards aplicados (N/A)
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

- [ ] Definir contrato oficial de API para formatos de data (ISO com offset explícito de São Paulo).
- [ ] Atualizar specs que ainda usam UTC/toISOString para refletir novo padrão.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Não foram criados testes de desenvolvimento.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Uso obrigatório de America/Sao_Paulo para persistência/comparação/exibição — [docs/business-rules/timezone-sao-paulo.md](../../business-rules/timezone-sao-paulo.md)
- Período de mentoria com fuso São Paulo — [docs/business-rules/periodo-mentoria.md](../../business-rules/periodo-mentoria.md)

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar comparações de datas em cenários com offset -03:00 e entradas sem timezone.
- **Prioridade de testes:** criação/renovação de mentoria, criação de período de avaliação e exibição de datas na UI.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Testes existentes podem falhar por ainda usarem UTC/toISOString.

**Dependências externas:**
- date-fns-tz (backend)

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
