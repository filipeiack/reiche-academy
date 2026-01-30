# Dev Handoff: Matriz de Cargos e Funções + Plano de Ação Específico

**Data:** 2026-01-27  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**
- /docs/business-rules/cockpit-matriz-cargos-funcoes.md
- /docs/business-rules/cockpit-plano-acao-especifico.md  
**Business Analyst Handoff:** /docs/handoffs/cockpit-matriz-cargos-funcoes-plano-acao/business-v1.md

---

## 1️⃣ Escopo Implementado

- Backend: CRUD de cargos, responsáveis (N:N), funções e ações do plano específico.
- Backend: validações multi-tenant e RBAC (ADMINISTRADOR/GESTOR) nas operações de escrita.
- Backend: cálculo de status ATRASADA no retorno do plano de ação.
- Frontend: novas abas no cockpit (Cargos e Funções, Plano de Ação).
- Frontend: matriz de cargos com reordenação; funções em accordion com reordenação e médias no footer.
- Frontend: plano de ação com seleção de indicador/mês, 5 porquês, ação proposta, responsável e status.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- backend/prisma/schema.prisma - relação N:N de responsáveis e vínculo `indicadorMensalId` em ações.
- backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts - CRUD e validações de cargos/funções/ações.
- backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts - endpoints de cargos/funções/ações.
- backend/src/modules/cockpit-pilares/dto/create-cargo-cockpit.dto.ts - DTO de cargo.
- backend/src/modules/cockpit-pilares/dto/update-cargo-cockpit.dto.ts - DTO de cargo.
- backend/src/modules/cockpit-pilares/dto/create-funcao-cargo.dto.ts - DTO de função.
- backend/src/modules/cockpit-pilares/dto/update-funcao-cargo.dto.ts - DTO de função.
- backend/src/modules/cockpit-pilares/dto/create-acao-cockpit.dto.ts - DTO de ação.
- backend/src/modules/cockpit-pilares/dto/update-acao-cockpit.dto.ts - DTO de ação.

### Frontend
- frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.ts - novas abas.
- frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.html - novas abas.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.ts - matriz de cargos/funções.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.html - layout conforme matriz de indicadores.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.scss - estilos básicos.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/cargo-form-drawer/cargo-form-drawer.component.ts - drawer de cargos com cadastro simplificado.
- frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/funcao-form-drawer/funcao-form-drawer.component.ts - drawer de funções.
- frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts - plano de ação.
- frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html - formulário e lista.
- frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.scss - estilos básicos.
- frontend/src/app/core/interfaces/cockpit-pilares.interface.ts - novas interfaces/DTOs/enums.
- frontend/src/app/core/services/cockpit-pilares.service.ts - novos endpoints.

## 3️⃣ Decisões Técnicas

- Status ATRASADA calculado no backend e exposto como `statusCalculado`.
- Reordenação de cargos/funções feita via múltiplos PATCH (mesmo padrão usado em indicadores).
- Fluxo de cadastro simplificado de usuários replicado via `NgSelect` com `addTag`.

## 4️⃣ Auto-Validação de Padrões

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores
- [x] Prisma com .select() onde aplicável
- [x] Guards aplicados (controller)
- [x] Soft delete respeitado onde aplicável
- [x] Audit logging implementado

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] ReactiveForms
- [x] Error handling com SweetAlert2

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Mensagens de erro padronizadas e textos finais de UI não definidos no business rules.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados:**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [RN-CARGO-001] Múltiplos responsáveis por cargo (N:N) - Arquivo: backend/prisma/schema.prisma
- [RN-CARGO-002] Reordenação de cargos na matriz - Arquivo: frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.ts
- [RN-FUNCAO-001] Hard delete de funções - Arquivo: backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts
- [RN-FUNCAO-002] Criticidade com cores - Arquivo: frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.html
- [RN-ACAO-001] Vínculo de ação com `indicadorMensalId` - Arquivo: backend/prisma/schema.prisma
- [RN-ACAO-002] Status ATRASADA calculado no backend - Arquivo: backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts

**Regras NÃO implementadas:**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar multi-tenant e RBAC em todos os endpoints novos.
- **Prioridade de testes:** cálculo de ATRASADA, hard delete de funções, vínculo indicador↔mês.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Dependência de `toPromise()` no frontend para reordenação (RxJS deprecado, mas usado no padrão atual).

**Dependências externas:**
- Nenhuma nova.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
