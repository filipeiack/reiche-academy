# Dev Handoff: Plano de Ação Específico — Datas Previstas/Reais e Sumário

**Data:** 2026-02-02  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/cockpit-plano-acao-especifico.md](../../business-rules/cockpit-plano-acao-especifico.md)  
**Business Analyst Handoff:** [docs/handoffs/plano-acao-especifico/business-v3.md](business-v3.md)

---

## 1️⃣ Escopo Implementado

- Inclusão de datas previstas e reais no plano de ação (início/término) com validação de ordem.
- Status calculado por datas previstas/reais (A INICIAR, EM ANDAMENTO, ATRASADA, CONCLUÍDA).
- Remoção do combo manual de status no drawer e inclusão dos novos campos de datas.
- Sumário por status (quantidade e percentual) antes da grid.
- Botões rápidos na grid para marcar início e término reais.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- [backend/prisma/schema.prisma](backend/prisma/schema.prisma) — adiciona `inicioPrevisto` e `inicioReal` em `AcaoCockpit`.
- [backend/src/modules/cockpit-pilares/dto/create-acao-cockpit.dto.ts](backend/src/modules/cockpit-pilares/dto/create-acao-cockpit.dto.ts) — novos campos de datas previstas/reais.
- [backend/src/modules/cockpit-pilares/dto/update-acao-cockpit.dto.ts](backend/src/modules/cockpit-pilares/dto/update-acao-cockpit.dto.ts) — novos campos de datas previstas/reais.
- [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts) — cálculo de status e validações de datas.

### Frontend
- [frontend/src/app/core/interfaces/cockpit-pilares.interface.ts](frontend/src/app/core/interfaces/cockpit-pilares.interface.ts) — atualização de interfaces/DTOs.
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts) — sumário e ações rápidas de datas reais.
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html) — renderização do sumário e botões na grid.
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts) — remoção do combo de status e campos de datas.

## 3️⃣ Decisões Técnicas

- Mantidos `prazo` e `dataConclusao` como `terminoPrevisto` e `terminoReal`, conforme regra, evitando quebra de dados legados.
- Status permanece calculado no backend (não armazenado manualmente).
- Sumário calcula percentuais a partir de todas as ações do cockpit pilar.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores
- [x] Prisma com .select()
- [x] Soft delete respeitado (N/A)
- [x] Guards aplicados (N/A para alteração de service)
- [x] Audit logging implementado (já existente)

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] Translations aplicadas (mantido padrão existente no arquivo)
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- Nenhuma pendência.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Não foram criados testes de desenvolvimento.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Datas previstas/reais e status derivado por datas — [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts#L251-L281)
- Validação de término real após início real — [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts#L1439-L1575)
- Campos obrigatórios de início/término previstos — [backend/src/modules/cockpit-pilares/dto/create-acao-cockpit.dto.ts](backend/src/modules/cockpit-pilares/dto/create-acao-cockpit.dto.ts#L56-L76)
- Drawer sem combo de status e com campos de datas — [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts#L118-L260)
- Sumário por status e ações rápidas na grid — [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html#L21-L112)

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar status calculado em cenários de datas previstas e reais (atraso e conclusão).
- **Prioridade de testes:** marcação rápida de datas reais na grid e validação de ordem.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Migração de banco necessária para novos campos `inicioPrevisto` e `inicioReal`.

**Dependências externas:**
- Nenhuma.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
