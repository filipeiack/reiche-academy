# Business Analysis: Plano de Ação Específico — Campos Obrigatórios, Data de Conclusão e Status

**Data:** 2026-01-28  
**Analista:** Business Analyst  
**Regras Documentadas:** [cockpit-plano-acao-especifico.md](../business-rules/cockpit-plano-acao-especifico.md)

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta (atualização de regra existente)
- **Regras documentadas:** 1 arquivo atualizado
- **Status:** ✅ APROVADO

## 2️⃣ Regras Documentadas

### Regras Propostas
- [cockpit-plano-acao-especifico.md](../business-rules/cockpit-plano-acao-especifico.md) - Ajuste de obrigatoriedade dos campos, inclusão de `dataConclusao` e regras de status derivado; listagem exibe apenas campos preenchidos.

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Campos obrigatórios: Indicador, Mês de Análise, Prazo e Ação Proposta.
- Inclusão de `dataConclusao` (opcional) com prioridade na regra de status.
- Regra de status derivado: CONCLUÍDA > ATRASADA > A INICIAR.
- Listagem exibe somente campos existentes (causas individuais apenas se preenchidas).

### ⚠️ O que está ausente/ambíguo
- Nenhuma lacuna crítica restante.

### 🔴 Riscos Identificados
- **Segurança:** sem novos riscos diretos, mas lógica deve permanecer sob RBAC existente.
- **RBAC:** garantir que CRUD de ações continue restrito a ADMINISTRADOR/GESTOR.
- **Multi-tenant:** validação de `empresaId` deve ser mantida nas operações.
- **LGPD:** dados pessoais (responsável) continuam expostos na listagem; garantir escopo por empresa.

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

- Nenhuma recomendação adicional.

## 7️⃣ Decisão e Próximos Passos

- [x] Prosseguir para: **Dev Agent Enhanced**
- [x] Dev Agent deve implementar regras documentadas em `/docs/business-rules/cockpit-plano-acao-especifico.md`.
- [ ] Atenção especial para: consistência do status derivado com timezone São Paulo.

---

**Handoff criado automaticamente pelo Business Analyst**
