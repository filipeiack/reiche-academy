# System Engineer (Consultivo): Rate Limit por Ambiente (Opção 1)

**Data:** 2026-02-03  
**Solicitante:** Usuário  
**Objetivo:** Permitir execução de E2E em develop sem bloqueio de rate limit, mantendo restrição em produção.

---

## ✅ Solução Recomendada (Opção 1): Configuração por Ambiente

### Princípio
- Em **develop**: aumentar limites ou desativar rate limit de login.
- Em **production**: manter limites atuais (segurança intacta).

### Estratégia Técnica
Adicionar flags e valores via variáveis de ambiente e ler no backend:

**Env sugeridas:**
- `RATE_LIMIT_ENABLED` (boolean)
- `RATE_LIMIT_MAX` (número de requisições)
- `RATE_LIMIT_WINDOW_MS` (janela em ms)

**Exemplo de configuração:**
- `.env.development`
  - `RATE_LIMIT_ENABLED=false`
  - `RATE_LIMIT_MAX=1000`
  - `RATE_LIMIT_WINDOW_MS=60000`

- `.env.production`
  - `RATE_LIMIT_ENABLED=true`
  - `RATE_LIMIT_MAX=<valor atual>`
  - `RATE_LIMIT_WINDOW_MS=<valor atual>`

### Ponto de aplicação
Aplicar na camada onde o rate limit de login foi implementado (guard/interceptor/middleware do backend). O rate limit deve:
- Ler `RATE_LIMIT_ENABLED`; se `false`, bypass.
- Se `true`, usar `RATE_LIMIT_MAX` e `RATE_LIMIT_WINDOW_MS`.

---

## 🎯 Tarefas para Dev Agent Enhanced

1. **Localizar** o código de rate limit atual no backend.
2. **Introduzir** leitura das variáveis de ambiente.
3. **Implementar** fallback seguro (se env não existir → manter comportamento atual).
4. **Documentar** em README/backend ou docs operacionais.
5. **Garantir** que produção mantém limites.

---

## ✅ Critérios de Aceite

- E2E em develop não bloqueia login por rate limit.
- Produção continua com rate limit ativo e valores atuais.
- Valores podem ser ajustados via `.env` sem alterar código.

---

## Observações de Governança

- Mudança é **técnica**, não altera regras de negócio.
- Deve seguir FLOW: **Dev Agent Enhanced** implementa; **QA Engineer** valida.

---

**Próximo passo sugerido:**
> "Atue como Dev Agent Enhanced, implemente configuração de rate limit por ambiente (develop vs production)"
