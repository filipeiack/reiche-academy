# Dev Handoff: Rate Limit + E2E Execução Especial

**Data:** 2026-02-03  
**Dev Agent Enhanced:** Dev Agent Enhanced  
**Handoff anterior:** [docs/handoffs/rate-limit-env/dev-v1.md](docs/handoffs/rate-limit-env/dev-v1.md)

---

## 1️⃣ Escopo Implementado

- Tests de rate limit em E2E agora são executados **somente** quando `E2E_RATE_LIMIT_EXPECTED=true`.
- Ajuste em smoke de usuários removendo campo `cargo` (não editável no formulário).

---

## 2️⃣ Arquivos Alterados

### Frontend (E2E)
- [frontend/e2e/security/security-adversarial.smoke.spec.ts](frontend/e2e/security/security-adversarial.smoke.spec.ts)
  - Skip dos testes de rate limit quando `E2E_RATE_LIMIT_EXPECTED` não está ativo.
- [frontend/e2e/usuarios/usuarios.smoke.spec.ts](frontend/e2e/usuarios/usuarios.smoke.spec.ts)
  - Removido preenchimento de `cargo`.

---

## 3️⃣ Como executar teste especial (rate limit ativo)

1. **Backend**: definir `RATE_LIMIT_ENABLED=true` no `.env` (dev) antes de rodar.
2. **Playwright**: exportar variável para habilitar testes específicos:
   - `E2E_RATE_LIMIT_EXPECTED=true`

---

## 4️⃣ Auto-Validação de Padrões

### Frontend
- [x] Sem mudanças de arquitetura
- [x] Ajustes localizados em testes

---

## 5️⃣ Ambiguidades/TODOs

- [ ] Avaliar se outros testes de segurança devem respeitar `E2E_RATE_LIMIT_EXPECTED`.

---

## 6️⃣ Testes de Suporte

- Não executados.

---

## 7️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
