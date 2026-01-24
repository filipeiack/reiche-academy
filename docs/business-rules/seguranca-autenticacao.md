# Regra de Negócio: Autenticação e Segurança de Tokens

**ID:** RN-SEC-001  
**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Ativa  
**Prioridade:** 🔴 Crítica

---

## 📋 Contexto

Sistema Reiche Academy requer autenticação robusta com proteção contra ataques comuns (brute force, token theft, session hijacking).

---

## 🎯 Regras de Negócio

### RN-SEC-001.1: Autenticação por JWT

**Descrição:**  
> O sistema DEVE usar JWT (JSON Web Tokens) para autenticação de usuários.

**Implementação:**
- Access Token: vida útil de 1 hora
- Refresh Token: vida útil de 7 dias
- Tokens armazenados no cliente (localStorage ou sessionStorage)
- Refresh automático antes da expiração

**Justificativa:**  
Padrão de mercado para APIs RESTful, permite escalabilidade horizontal (stateless).

**Teste:**  
- E2E: Usuário faz login e recebe tokens válidos
- Unit: AuthService.login() retorna accessToken e refreshToken

---

### RN-SEC-001.2: Rotação de Refresh Tokens

**Descrição:**  
> Refresh tokens DEVEM ser rotacionados a cada uso (one-time use).

**Implementação:**
- Ao usar refresh token, sistema invalida o token antigo
- Novo refresh token é gerado e retornado
- Token antigo não pode ser reutilizado

**Justificativa:**  
Previne reutilização de tokens roubados. Se atacante rouba refresh token, só funciona uma vez.

**Teste:**
- E2E: `security-adversarial.spec.ts` - Token reuse test
- Unit: RefreshTokensService.rotateRefreshToken()

**Exceção:**  
Nenhuma.

---

### RN-SEC-001.3: Sessão Única por Usuário

**Descrição:**  
> Usuário PODE ter apenas 1 sessão ativa por vez.

**Implementação:**
- Ao fazer login, todos refresh tokens anteriores são invalidados
- Apenas 1 refresh token ativo por userId

**Justificativa:**  
- ✅ Reduz superfície de ataque (menos tokens ativos)
- ✅ Previne session hijacking distribuído
- ✅ Simplifica gestão de segurança
- ⚠️ **Trade-off:** Usuário não pode estar logado em múltiplos dispositivos simultaneamente

**Teste:**
- E2E: Login em 2 navegadores diferentes, segundo login invalida primeiro
- Unit: RefreshTokensService.createRefreshToken() invalida tokens anteriores

**Exceção:**  
ADMINISTRADOR pode ter política diferente (futuro: considerar múltiplas sessões gerenciadas).

**Documentação ADR:**  
Ver ADR-010 para justificativa completa desta decisão arquitetural.

---

### RN-SEC-001.4: Rastreamento de Dispositivos

**Descrição:**  
> Sistema DEVE rastrear IP, User-Agent e dispositivo de cada sessão.

**Implementação:**
- Tabela `refresh_tokens` armazena:
  - `ipAddress`: IP do cliente
  - `userAgent`: String do navegador/app
  - `dispositivo`: Tipo extraído (mobile/desktop/etc)
- Informações exibidas em "Dispositivos Ativos" (futuro)

**Justificativa:**  
Auditoria de segurança, detecção de sessões suspeitas.

**Teste:**
- Unit: RefreshTokensService armazena corretamente IP e userAgent
- E2E: Login registra informações de dispositivo

---

### RN-SEC-001.5: Logout Seguro

**Descrição:**  
> Logout DEVE invalidar refresh token no servidor.

**Implementação:**
- Endpoint `/auth/logout` recebe refresh token
- Token é marcado `isActive = false`
- Cliente remove tokens do storage
- Logout de todos dispositivos: `/auth/logout-all` invalida todos tokens do usuário

**Justificativa:**  
Logout apenas no cliente (remover localStorage) não é seguro - token ainda funciona até expirar.

**Teste:**
- E2E: Após logout, refresh token não funciona mais
- Unit: RefreshTokensService.invalidateToken()

---

### RN-SEC-001.6: Limpeza Automática de Tokens

**Descrição:**  
> Tokens expirados DEVEM ser removidos automaticamente do banco.

**Implementação:**
- Job agendado (cron): diário às 3h da manhã
- Remove tokens onde `expiresAt < NOW()` ou `isActive = false` há mais de 30 dias

**Justificativa:**  
Higiene de dados, performance do banco.

**Teste:**
- Unit: RefreshTokensService.cleanupExpiredTokens()

**Status:** ⚠️ **FUTURO** - Implementar cron job

---

## 🛡️ Rate Limiting

### RN-SEC-001.7: Proteção contra Brute Force

**Descrição:**  
> Endpoints de autenticação DEVEM ter rate limiting agressivo.

**Limites Definidos:**

| Endpoint | Limite | Janela | Justificativa |
|----------|--------|--------|---------------|
| `/auth/login` | 5 tentativas | 15 minutos | Previne brute force de senha |
| `/auth/forgot-password` | 3 tentativas | 1 hora | Previne spam de emails |
| `/auth/reset-password` | 3 tentativas | 1 hora | Previne brute force de token |
| Endpoints gerais | 100 requisições | 1 minuto | Uso normal |

**Implementação:**
- `@nestjs/throttler` com limites customizados via `@Throttle()` decorator
- Headers retornados:
  - `X-RateLimit-Limit`: Limite total
  - `X-RateLimit-Remaining`: Tentativas restantes
  - `X-RateLimit-Reset`: Timestamp de reset

**Justificativa:**  
Padrão de mercado (GitHub, Stripe, etc usam rate limiting similar).

**Teste:**
- E2E: `security-adversarial.spec.ts` - Multiple login attempts
- Unit: ThrottlerGuard bloqueia após limite

---

## 🔐 Armazenamento de Senhas

### RN-SEC-001.8: Hash Seguro de Senhas

**Descrição:**  
> Senhas DEVEM ser hasheadas com Argon2 (NUNCA bcrypt ou MD5).

**Implementação:**
- `argon2` biblioteca oficial
- Configuração padrão (salt automático, iterações adequadas)

**Justificativa:**  
Argon2 é vencedor do Password Hashing Competition (2015), resistente a ataques GPU/ASIC.

**Teste:**
- Unit: UsuariosService.hashPassword() usa argon2
- E2E: Senha nunca retornada em responses

---

## 📊 Validação e Testes

### Cobertura Obrigatória:

- ✅ **Unit Tests:** AuthService, RefreshTokensService, JwtAuthGuard
- ✅ **E2E Tests:** `security-adversarial.spec.ts` (16 testes)
- ✅ **Manual Tests:** Penetration testing antes de produção

### Cenários Críticos:

1. ✅ Token theft (token roubado não funciona após rotação)
2. ✅ Brute force (bloqueado após 5 tentativas)
3. ✅ Session hijacking (sessão única previne)
4. ✅ Token reuse (refresh token one-time use)

---

## 🚨 Exceções e Edge Cases

### Caso 1: Token Revogado Durante Uso

**Cenário:** Usuário está usando sistema, admin revoga acesso.

**Comportamento:**  
- Access token continua válido até expirar (máx 1h)
- Ao tentar refresh, recebe 401 Unauthorized
- Sistema força logout

**Justificativa:** JWT é stateless - não é possível invalidar access token sem lista negra (complexidade adicional).

### Caso 2: Múltiplos Logins Simultâneos (Familia Compartilhada)

**Cenário:** Empresa compartilha 1 conta entre funcionários.

**Comportamento:**  
- Último login invalida sessões anteriores
- Funcionários são deslogados

**Solução:** Criar usuários individuais (boa prática de segurança).

---

## 📚 Referências

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Argon2 Specification](https://github.com/P-H-C/phc-winner-argon2)
- **ADR-010:** Justificativa de Single Session Policy

---

**Aprovado por:** Business Analyst  
**Implementado em:** 2026-01-24  
**Próxima Revisão:** 2026-04-24 (trimestral)
