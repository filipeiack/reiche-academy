# Dev Handoff: Criticidade em Rotinas (Template + Snapshot)

**Data:** 2026-02-03  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**
- /docs/business-rules/rotinas-criticidade-template-snapshot.md  
- /docs/business-rules/rotinas.md  
- /docs/business-rules/rotinas-empresa.md  
**Business Analyst Handoff:** /docs/handoffs/rotinas-criticidade/business-v1.md

---

## 1️⃣ Escopo Implementado

- Campo `criticidade` opcional em `Rotina` (template) e `RotinaEmpresa` (snapshot).
- Cópia de `criticidade` do template para snapshot ao criar `RotinaEmpresa`.
- Permissão de edição de `criticidade` em `RotinaEmpresa`.
- Exposição do campo no frontend (templates e rotinas da empresa).

## 2️⃣ Arquivos Criados/Alterados

### Backend
- backend/prisma/schema.prisma — adiciona `criticidade` em `Rotina` e `RotinaEmpresa`.
- backend/src/modules/rotinas/dto/create-rotina.dto.ts — validação `criticidade` opcional.
- backend/src/modules/rotinas/dto/update-rotina.dto.ts — mantém herança com `criticidade` opcional.
- backend/src/modules/rotinas/dto/create-rotina-empresa.dto.ts — validação `criticidade` opcional.
- backend/src/modules/rotinas/dto/update-rotina-empresa.dto.ts — validação `criticidade` opcional.
- backend/src/modules/pilares-empresa/rotinas-empresa.service.ts — copia/atualiza `criticidade` em snapshots.
- backend/src/modules/pilares-empresa/pilares-empresa.service.ts — copia `criticidade` ao vincular pilares.

### Frontend
- frontend/src/app/core/services/rotinas.service.ts — inclui `criticidade` nos DTOs/interfaces.
- frontend/src/app/views/pages/rotinas/rotina-form/rotina-form.component.ts — campo `criticidade` no form.
- frontend/src/app/views/pages/rotinas/rotina-form/rotina-form.component.html — select de `criticidade`.
- frontend/src/app/core/services/rotinas-empresa.service.ts — inclui `criticidade` nos DTOs/interfaces.
- frontend/src/app/views/pages/diagnostico-notas/rotina-add-drawer/rotina-add-drawer.component.ts — select de `criticidade`.
- frontend/src/app/views/pages/diagnostico-notas/rotina-edit-drawer/rotina-edit-drawer.component.ts — edição de `criticidade`.

## 3️⃣ Decisões Técnicas

- `criticidade` modelada como enum existente `Criticidade` (Prisma) para manter consistência.
- Snapshot pattern preservado: `RotinaEmpresa` copia `criticidade` do template e não propaga alterações futuras.
- UI do template e rotinas da empresa expõem `criticidade` como opcional.
- **Observação:** requer migration Prisma para persistir novas colunas.

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
- [x] Translations aplicadas (novos textos)
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Executar migration Prisma para criar colunas `criticidade` em `rotinas` e `rotinas_empresa`.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [Rotinas criticidade] Campo opcional e snapshot — backend/prisma/schema.prisma
- [Rotinas criticidade] Cópia no snapshot — backend/src/modules/pilares-empresa/rotinas-empresa.service.ts
- [Rotinas criticidade] Edição no frontend — frontend/src/app/views/pages/diagnostico-notas/rotina-edit-drawer/rotina-edit-drawer.component.ts

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** Validar persistência via migration e fluxos de criação/edição de `criticidade`.
- **Prioridade de testes:** criação template, criação rotinas empresa (template/custom), edição de criticidade.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Necessidade de migration Prisma para evitar falhas de persistência.

**Dependências externas:**
- Prisma migrations

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
