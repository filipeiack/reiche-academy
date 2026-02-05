# Dev Handoff: Rate Limit por Ambiente (develop vs production)

**Data:** 2026-02-03  
**Dev Agent Enhanced:** Dev Agent Enhanced  
**System Engineer Handoff:** [docs/handoffs/rate-limit-env/system-engineer-v1.md](docs/handoffs/rate-limit-env/system-engineer-v1.md)

---

## 1️⃣ Escopo Implementado

- Configuração de rate limit por ambiente via `RATE_LIMIT_ENABLED`.
- Suporte opcional a overrides globais (`RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_MS`).
- Bypass completo do rate limit quando desabilitado.

---

## 2️⃣ Arquivos Alterados

### Backend
- [backend/src/common/services/rate-limit.service.ts](backend/src/common/services/rate-limit.service.ts)
  - Leitura de env com `ConfigService`.
  - `isEnabled()` para toggle do rate limit.
  - Overrides globais opcionais.
- [backend/src/common/interceptors/rate-limiting.interceptor.ts](backend/src/common/interceptors/rate-limiting.interceptor.ts)
  - Bypass quando `RATE_LIMIT_ENABLED=false`.
  - Uso de limites configurados via service.
- [backend/.env](backend/.env)
  - `RATE_LIMIT_ENABLED=false` (dev)
- [backend/.env.vps](backend/.env.vps)
  - `RATE_LIMIT_ENABLED=true` (produção/staging)

---

## 3️⃣ Decisões Técnicas

- Toggle global evita throttling em E2E sem afetar produção.
- Overrides globais opcionais permitem aumentar limites sem alterar código.

---

## 4️⃣ Auto-Validação de Padrões

### Backend
- [x] Naming conventions mantidas
- [x] Estrutura e injeção via `ConfigService`
- [x] Sem alteração de regra de negócio

---

## 5️⃣ Ambiguidades/TODOs

- [ ] Se necessário, definir envs específicas por endpoint (login/register/forgot/reset).

---

## 6️⃣ Testes de Suporte

- Não executados.

---

## 7️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Observação:** testar E2E com `RATE_LIMIT_ENABLED=false` em develop.
