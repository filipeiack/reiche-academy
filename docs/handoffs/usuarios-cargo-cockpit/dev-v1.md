# Dev Handoff: Usuarios Cargo Cockpit

**Data:** 2026-01-30  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/usuarios-cargo-cockpit-exibicao.md](../../business-rules/usuarios-cargo-cockpit-exibicao.md)  
**Business Analyst Handoff:** [docs/handoffs/usuarios-cargo-cockpit/business-v1.md](business-v1.md)

---

## 1️⃣ Escopo Implementado

- Endpoint backend para listar cargos do usuário via Cockpit.
- Campo “Cargo na Empresa” no usuarios-form agora é somente leitura.
- Exibição de lista de cargos/pilares ou mensagem de associação posterior.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- backend/src/modules/usuarios/usuarios.service.ts - método `getCargosCockpitByUsuario()`.
- backend/src/modules/usuarios/usuarios.controller.ts - endpoint GET `/usuarios/:id/cargos-cockpit`.

### Frontend
- frontend/src/app/core/services/users.service.ts - método `getCargosCockpitByUsuario()` e interface `UsuarioCargoCockpit`.
- frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.ts - carregar cargos e remover edição do campo.
- frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.html - renderizar lista/mensagem no campo.
- frontend/src/assets/i18n/pt-BR.json - chave `USERS.CARGO_PENDING`.
- frontend/src/assets/i18n/en-US.json - chave `USERS.CARGO_PENDING`.

## 3️⃣ Decisões Técnicas

- Endpoint dedicado por usuário para listar cargos, evitando sobrecarregar `GET /usuarios/:id`.
- Mantido `Usuario.cargo` como campo legado (não utilizado no form) conforme ressalva do BA.
- Mensagem de placeholder via i18n.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] Prisma com .select()
- [x] Guards aplicados
- [x] Soft delete respeitado (não aplicável)
- [x] Audit logging (não aplicável ao read)

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] Translations aplicadas
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma

## 5️⃣ Ambiguidades e TODOs

- [ ] Verificar impacto em telas que ainda exibem `Usuario.cargo` (listagem/resumo) conforme ressalva do BA.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Exibir mensagem quando não houver associação - frontend usuarios-form.
- Exibir lista de cargos com pilar - endpoint `/usuarios/:id/cargos-cockpit` + usuarios-form.

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar multi-tenant e RBAC no endpoint de cargos
- **Prioridade de testes:** cargo associado vs sem associação; erro quando referência inválida

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- `Usuario.cargo` ainda aparece em outras telas; possível inconsistência visual.

**Dependências externas:**
- Endpoint depende de relações Prisma CargoCockpitResponsavel → CargoCockpit → CockpitPilar → PilarEmpresa.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
