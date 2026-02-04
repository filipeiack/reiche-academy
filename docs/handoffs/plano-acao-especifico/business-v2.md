# Business Analysis: Plano de Ação Específico — Datas Previstas/Reais, Status Derivado e Sumário

**Data:** 2026-02-02  
**Analista:** Business Analyst  
**Regras Documentadas:** [cockpit-plano-acao-especifico.md](../business-rules/cockpit-plano-acao-especifico.md)

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta (atualização de regra existente)
- **Regras documentadas:** 1 arquivo atualizado
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Propostas
- [cockpit-plano-acao-especifico.md](../business-rules/cockpit-plano-acao-especifico.md) - Inclusão de datas previstas/reais, status derivado por datas, remoção de combo de status, botões na grid para marcar datas e sumário por status.

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Novos campos de datas: início/termino previstos e início/termino reais.
- `prazo` mapeado para `terminoPrevisto` e `dataConclusao` para `terminoReal`.
- Status derivado por datas, sem seleção manual na UI.
- Datas previstas são obrigatórias.
- Sumário de status por cockpit pilar com quantidade e percentual.

### ⚠️ O que está ausente/ambíguo
- Escopo exato do sumário (todas as ações do cockpit pilar ou filtradas por indicador/mês atualmente selecionados).
- Quais datas exatamente devem ter botões de marcação rápida na grid (todas as quatro ou apenas datas reais).
- Regra de status quando `inicioPrevisto` está no futuro mas `inicioReal` já preenchida, ou quando `inicioReal` é posterior a `terminoPrevisto`.
- Regra explícita para cores (ex.: cor de EM ANDAMENTO) não foi confirmada.

### 🔴 Riscos Identificados
- **Segurança:** sem novos riscos diretos, mas lógica deve manter RBAC existente.
- **RBAC:** CRUD de ações deve permanecer restrito (ADMINISTRADOR/GESTOR).
- **Multi-tenant:** validação de `empresaId` deve continuar aplicada nas operações.
- **LGPD:** dados pessoais (responsável) permanecem expostos; garantir escopo por empresa.

## 4️⃣ Checklist de Riscos Críticos

- [ ] RBAC documentado e aplicado?
- [ ] Isolamento multi-tenant garantido?
- [ ] Auditoria de ações sensíveis?
- [ ] Validações de input?
- [ ] Proteção contra OWASP Top 10?
- [ ] Dados sensíveis protegidos?

## 5️⃣ Bloqueadores

- Nenhum bloqueador crítico identificado.

## 6️⃣ Recomendações

- Confirmar o escopo do sumário (com ou sem filtros de indicador/mês).
- Confirmar quais botões serão exibidos na grid para marcação rápida de datas.
- Validar regras de status em cenários-limite envolvendo datas previstas vs reais.

## 7️⃣ Decisão e Próximos Passos

- [x] Prosseguir para: **Dev Agent Enhanced**
- [x] Dev Agent deve implementar regras documentadas em `/docs/business-rules/cockpit-plano-acao-especifico.md`.
- [ ] Atenção especial para: consistência do status derivado com timezone São Paulo e cenários-limite de datas.

---

**Handoff criado automaticamente pelo Business Analyst**
