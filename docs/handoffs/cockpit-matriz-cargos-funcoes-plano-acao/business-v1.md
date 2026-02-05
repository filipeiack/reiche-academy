# Business Analysis: Matriz de Cargos e Funções + Plano de Ação Específico

**Data:** 2026-01-27  
**Analista:** Business Analyst  
**Regras Documentadas:**
- /docs/business-rules/cockpit-matriz-cargos-funcoes.md
- /docs/business-rules/cockpit-plano-acao-especifico.md

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta
- **Regras documentadas:** 2 arquivos criados
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Propostas
- /docs/business-rules/cockpit-matriz-cargos-funcoes.md - Cadastro de cargos com múltiplos responsáveis e funções com criticidade e avaliações.
- /docs/business-rules/cockpit-plano-acao-especifico.md - Plano de ação vinculado a indicador e mês com 5 porquês, status e prazo.

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Múltiplos responsáveis por cargo
- Hard delete de funções
- Status da ação e regra de atraso
- Vínculo ação ↔ indicadorMensalId
- Reuso de cadastro simplificado de usuários

### ⚠️ O que está ausente/ambíguo
- Mensagens de erro padronizadas e textos finais de UI

### 🔴 Riscos Identificados
- **Segurança:** necessidade de validação rigorosa de multi-tenant em associações (cargos, responsáveis, ações).
- **RBAC:** garantir que apenas ADMINISTRADOR/GESTOR executem CRUD.
- **Dados sensíveis:** avaliações devem respeitar visibilidade por perfil (não definido).

## 4️⃣ Checklist de Riscos Críticos

- [ ] RBAC documentado e aplicado?
- [ ] Isolamento multi-tenant garantido?
- [ ] Auditoria de ações sensíveis?
- [ ] Validações de input?
- [ ] Proteção contra OWASP Top 10?
- [ ] Dados sensíveis protegidos?

## 5️⃣ Bloqueadores

Nenhum bloqueador crítico identificado.

## 6️⃣ Recomendações

- Avaliar necessidade de auditoria para criação/edição/exclusão.

## 7️⃣ Decisão e Próximos Passos

- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar regras documentadas em `/docs/business-rules`
- [ ] Atenção especial para: multi-tenant, RBAC e vínculo indicador↔mês

---

**Handoff criado automaticamente pelo Business Analyst**
