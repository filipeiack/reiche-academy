# Business Analysis: Cargo do Usuário via Cockpit

**Data:** 2026-01-29  
**Analista:** Business Analyst  
**Regras Documentadas:**
- [docs/business-rules/usuarios-cargo-cockpit-exibicao.md](../../business-rules/usuarios-cargo-cockpit-exibicao.md)

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta
- **Regras documentadas:** 1 arquivo criado
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Propostas
- [usuarios-cargo-cockpit-exibicao.md](../../business-rules/usuarios-cargo-cockpit-exibicao.md) — Exibir cargo do usuário via CargoCockpit/CargoCockpitResponsavel

## 3️⃣ Análise de Completude

### ✅ O que está claro
- O usuário pode ser criado antes da associação de cargo.
- Quando não houver associação, o campo deve informar associação posterior.
- Quando houver associação, deve exibir nome do cargo e nome do pilar.

### ⚠️ O que está ausente/ambíguo
- Impacto em telas que hoje exibem `Usuario.cargo` (listagem e formulários) e cronograma de deprecação.

### 🔴 Riscos Identificados
- **Segurança:** risco baixo, mas exige respeitar RBAC/empresa ao resolver associações.
- **RBAC:** associação de responsáveis já deve respeitar perfil adequado no Cockpit.
- **Multi-tenant:** necessidade de garantir que cargo exibido pertence à mesma empresa do usuário.
- **LGPD:** sem dados sensíveis adicionais.

## 4️⃣ Checklist de Riscos Críticos

- [ ] RBAC documentado e aplicado?
- [ ] Isolamento multi-tenant garantido?
- [ ] Auditoria de ações sensíveis?
- [ ] Validações de input?
- [ ] Proteção contra OWASP Top 10?
- [ ] Dados sensíveis protegidos?

## 5️⃣ Bloqueadores

**Regras ausentes que IMPEDEM continuidade:**

- Nenhum bloqueador ativo após decisões registradas.

## 6️⃣ Recomendações

- Usar **relacionamento como fonte de verdade** para evitar inconsistência e permitir múltiplos cargos.
- Manter `Usuario.cargo` apenas como **campo legado** temporário, se ainda usado por telas/relatórios antigos.

## 7️⃣ Decisão e Próximos Passos

**Status atual:** ⚠️ APROVADO COM RESSALVAS

- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar regras documentadas em `/docs/business-rules`
- [ ] Atenção especial para: impacto da deprecação de `Usuario.cargo` nas telas existentes

---

**Handoff criado automaticamente pelo Business Analyst**
