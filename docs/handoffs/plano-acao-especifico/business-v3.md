# Business Analysis: Plano de Ação Específico — Ajustes de Sumário e Datas Reais

**Data:** 2026-02-02  
**Analista:** Business Analyst  
**Regras Documentadas:** [cockpit-plano-acao-especifico.md](../business-rules/cockpit-plano-acao-especifico.md)

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta (atualização de regra existente)
- **Regras documentadas:** 1 arquivo atualizado
- **Status:** ✅ APROVADO

## 2️⃣ Regras Documentadas

### Regras Propostas
- [cockpit-plano-acao-especifico.md](../business-rules/cockpit-plano-acao-especifico.md) - Escopo do sumário por cockpit pilar, botões apenas para datas reais, restrição de término real após início real, e regras de casos-limite de status.

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Sumário considera todas as ações do cockpit pilar, independente de indicador/mês.
- Botões de marcação rápida na grid apenas para datas reais.
- Restrição: não permitir `terminoReal` antes de `inicioReal`.
- Casos-limite de status definidos para início real dentro/fora do intervalo previsto.

### ⚠️ O que está ausente/ambíguo
- Nenhuma lacuna crítica restante.

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

- Nenhuma recomendação adicional.

## 7️⃣ Decisão e Próximos Passos

- [x] Prosseguir para: **Dev Agent Enhanced**
- [x] Dev Agent deve implementar regras documentadas em `/docs/business-rules/cockpit-plano-acao-especifico.md`.
- [ ] Atenção especial para: consistência do status derivado com timezone São Paulo.

---

**Handoff criado automaticamente pelo Business Analyst**
