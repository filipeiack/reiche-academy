# QA Handoff: Auditoria — Governança 2026-01

**Data:** 2026-01-28  
**QA Engineer:** QA Engineer  
**Dev Handoff:** [docs/handoffs/auditoria-governanca/dev-v1.md](docs/handoffs/auditoria-governanca/dev-v1.md)  
**Regras Base:**
- [docs/business-rules/auditoria-periodos-mentoria.md](docs/business-rules/auditoria-periodos-mentoria.md)
- [docs/business-rules/auth-login-history-logout-reset.md](docs/business-rules/auth-login-history-logout-reset.md)
- [docs/business-rules/auditoria-padronizacao-entidade.md](docs/business-rules/auditoria-padronizacao-entidade.md)
- [docs/business-rules/auditoria-refresh-tokens-excluido.md](docs/business-rules/auditoria-refresh-tokens-excluido.md)
- [docs/business-rules/audit.md](docs/business-rules/audit.md)

---

## 1️⃣ Resumo da Validação

- **Tipo de testes:** Unitários (backend)
- **Status de execução:** ⚠️ FALHAS DETECTADAS
- **Resultado do comando:** `cd backend && npm test`
- **Falhas principais:** testes do PeriodosMentoriaService falham por falta de mock de `AuditService`
- **Regras validadas:** 0 de 4 (execução interrompida por erro de setup nos testes)

## 2️⃣ Testes Unitários Criados

Nenhum teste novo criado (somente execução).

## 3️⃣ Cobertura de Regras (Gaps Identificados)

**Regras sem cobertura de testes dedicada no backend:**
- [auditoria-periodos-mentoria.md](docs/business-rules/auditoria-periodos-mentoria.md) — não há testes garantindo `AuditService.log()` em CREATE/RENEW/UPDATE e nem fallback quando auditoria falha.
- [auth-login-history-logout-reset.md](docs/business-rules/auth-login-history-logout-reset.md) — não há testes para logout/logout-all/reset registrarem LoginHistory e não bloquearem fluxo.
- [auditoria-padronizacao-entidade.md](docs/business-rules/auditoria-padronizacao-entidade.md) — não há testes unitários para normalização de `entidade` no `AuditService`.
- [auditoria-refresh-tokens-excluido.md](docs/business-rules/auditoria-refresh-tokens-excluido.md) — não há teste que garanta ausência de auditoria em refresh tokens.

## 4️⃣ Falhas de Execução (Testes Não Rodam)

**Falha:** `Nest can't resolve dependencies of the PeriodosMentoriaService (PrismaService, ?)`.  
**Causa provável:** ausência de provider/mock de `AuditService` nos testes.

Arquivos afetados:
- [backend/src/modules/periodos-mentoria/periodos-mentoria.service.spec.ts](backend/src/modules/periodos-mentoria/periodos-mentoria.service.spec.ts#L68)
- [backend/src/modules/periodos-mentoria/periodos-mentoria.integration.simple.spec.ts](backend/src/modules/periodos-mentoria/periodos-mentoria.integration.simple.spec.ts#L50)

## 5️⃣ Recomendações

1. **Corrigir setup dos testes** adicionando mock de `AuditService` nos dois specs acima. Isso deve eliminar os 70 testes falhando por DI.
2. **Adicionar testes unitários** focados nas regras novas:
   - PeriodosMentoria: auditoria em CREATE/RENEW/UPDATE + “falha de auditoria não bloqueia”.
   - AuthService: login history para logout/logout-all/reset (incluindo IP/UA) + “falha não bloqueia”.
   - AuditService: normalização de `entidade` conforme padrão definido.
   - Refresh tokens: garantir que nenhuma auditoria é criada.

## 6️⃣ Status Final

⚠️ **FALHAS DETECTADAS** — testes não executam por falta de mock de `AuditService`.

---

**Handoff criado automaticamente pelo QA Engineer**
