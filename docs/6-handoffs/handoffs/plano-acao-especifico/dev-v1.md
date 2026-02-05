# Dev Handoff: Plano de Ação Específico — Campos Obrigatórios, Data de Conclusão e Status

**Data:** 2026-01-28  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/cockpit-plano-acao-especifico.md](../business-rules/cockpit-plano-acao-especifico.md)  
**Business Analyst Handoff:** [docs/handoffs/plano-acao-especifico/business-v1.md](../handoffs/plano-acao-especifico/business-v1.md)

---

## 1️⃣ Escopo Implementado

- Tornado obrigatório no cadastro: Indicador, Mês de Análise, Prazo e Ação Proposta.
- Tornado opcional: causas (5 porquês) e responsável.
- Adicionado campo `dataConclusao` na ação.
- Implementada regra de status derivado (CONCLUÍDA, ATRASADA, A INICIAR, SEM PRAZO) com base em `dataConclusao` e `prazo` usando timezone São Paulo.
- Listagem exibe apenas causas preenchidas.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- `backend/prisma/schema.prisma` - adiciona `dataConclusao` em `AcaoCockpit`.
- `backend/src/modules/cockpit-pilares/dto/create-acao-cockpit.dto.ts` - causas opcionais, `prazo` obrigatório, `dataConclusao` opcional.
- `backend/src/modules/cockpit-pilares/dto/update-acao-cockpit.dto.ts` - `dataConclusao` opcional.
- `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` - cálculo de status derivado, timezone São Paulo, persistência de `dataConclusao`.

### Frontend
- `frontend/src/app/core/interfaces/cockpit-pilares.interface.ts` - DTOs e `AcaoCockpit` atualizados.
- `frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/acao-form-drawer/acao-form-drawer.component.ts` - validações, campo `dataConclusao`, payload.
- `frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.ts` - status calculado no label/classe.
- `frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html` - causas exibidas somente quando preenchidas.

## 3️⃣ Decisões Técnicas

- Status exibido no frontend utiliza `statusCalculado` retornado pelo backend, garantindo regra única.
- Timezone São Paulo aplicado no backend via `toLocaleString` com `America/Sao_Paulo`.
- Manutenção do campo `status` no formulário, mas regra de exibição segue status derivado.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores
- [x] Prisma com .select() (não aplicável nesta alteração)
- [x] Soft delete respeitado (não aplicável)
- [x] Guards aplicados (sem mudança)
- [x] Audit logging implementado (mantido)

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] Translations aplicadas (sem mudança)
- [x] ReactiveForms
- [x] Error handling (mantido)

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Confirmar se o campo `status` do formulário deve permanecer editável ou somente informativo.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Não aplicável.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Campos obrigatórios (Indicador, Mês, Prazo, Ação) e opcionais (causas, responsável) — Front/Back
- `dataConclusao` opcional e status derivado — Backend
- Listagem exibe apenas causas preenchidas — Frontend

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar cálculo de status com timezone São Paulo e cenários sem prazo.
- **Prioridade de testes:** status CONCLUÍDA/ATRASADA/SEM PRAZO e validação de campos obrigatórios.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Comparação de datas baseada em timezone São Paulo pode divergir em ambientes com configuração local distinta.

**Dependências externas:**
- Prisma migrate para novo campo `dataConclusao`.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
