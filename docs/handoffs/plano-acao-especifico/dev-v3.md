# Dev Handoff: Plano de Ação Específico — Ajustes de Migração e UI

**Data:** 2026-02-02  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/cockpit-plano-acao-especifico.md](../../business-rules/cockpit-plano-acao-especifico.md)  
**Business Analyst Handoff:** [docs/handoffs/plano-acao-especifico/business-v3.md](business-v3.md)

---

## 1️⃣ Escopo Implementado

- Adicionada migração para novos campos `inicioPrevisto` e `inicioReal` em `acoes_cockpit`.
- Ajustada condição do botão de término real para exigir início real e não concluído.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- [backend/prisma/migrations/20260202213000_add_datas_previstas_reais_acao_cockpit/migration.sql](backend/prisma/migrations/20260202213000_add_datas_previstas_reais_acao_cockpit/migration.sql) — adiciona colunas `inicioPrevisto` e `inicioReal`.

### Frontend
- [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html) — corrige condição do botão de término real.

## 3️⃣ Decisões Técnicas

- Migração manual compatível com padrão existente para evitar erro de coluna inexistente.
- UI evita tentativa de concluir ação sem início real.

## 4️⃣ Auto-Validação de Padrões

### Backend
- [x] Estrutura de migração conforme padrão Prisma.

### Frontend
- [x] Control flow moderno mantido.

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- Nenhuma.

## 6️⃣ Testes de Suporte

- Não executados.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Não permitir término real antes de início real — [frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html](frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html#L92-L110)

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** aplicar migração no banco local antes de testar endpoints.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Banco sem migração pode continuar retornando erro 500 em atualizações.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
