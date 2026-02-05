 # Session and Token Policy

**ID:** RN-SEC-001  
**Versão:** 1.2  
**Data:** 2026-02-04  
**Status:** ✅ Ativa  
**Prioridade:** 🔴 Crítica (CVSS 9.0 se violada)

---

## 📋 Visão Geral

Sistema Reiche Academy requer autenticação robusta com proteção contra ataques comuns (brute force, token theft, session hijacking). Implementa JWT com refresh tokens, sessão única por usuário e rotação automática de tokens.

**Risco:** Account takeover, session hijacking, unauthorized access.

---

## 🎯 Regras de Sessão

### RN-SEC-001.1: Autenticação por JWT

**Descrição:**  
> O sistema DEVE usar JWT (JSON Web Tokens) para autenticação stateless.

**Implementação:**
- **Access Token:** Vida útil de 1 hora
- **Refresh Token:** Vida útil de 7 dias
- **Algoritmo:** HS256 com segredos separados
- **Storage:** Local (localStorage/sessionStorage) - não em cookies

**Payload do Access Token:**
```typescript
{
  sub: usuario.id,           // User ID
  email: usuario.email,      // User email
  perfil: usuario.perfil,     // User profile code
  empresaId: usuario.empresaId, // Tenant ID
  iat: issuedAt,            // Issued at
  exp: expiration           // Expiration (1h)
}
```

**Payload do Refresh Token:**
```typescript
{
  sub: usuario.id,
  type: 'refresh',
  iat: issuedAt,
  exp: expiration           // Expiration (7d)
}
```

**Segregação de Segredos:**
- `JWT_SECRET`: Access tokens (curta duração)
- `JWT_REFRESH_SECRET`: Refresh tokens (longa duração)

---

### RN-SEC-001.2: Rotação de Refresh Tokens

**Descrição:**  
> Refresh tokens DEVEM ser rotacionados a cada uso (one-time use).

**Implementação:**
```typescript
// RefreshTokensService.rotateRefreshToken()
async rotateRefreshToken(oldRefreshToken: string) {
  // 1. Validar token antigo
  const payload = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
  
  // 2. Invalidar token antigo
  await this.prisma.refreshToken.update({
    where: { token: oldRefreshToken },
    data: { isActive: false }
  });
  
  // 3. Gerar novo refresh token
  const newRefreshToken = jwt.sign(
    { sub: payload.sub, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  // 4. Salvar novo token
  await this.prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: payload.sub,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
  
  return newRefreshToken;
}
```

**Justificativa:**  
Previne reutilização de tokens roubados. Se atacante rouba refresh token, só funciona uma vez.

---

### RN-SEC-001.3: Sessão Única por Usuário

**Descrição:**  
> Usuário PODE ter apenas 1 sessão ativa por vez (single session policy).

**Implementação:**
```typescript
// Ao fazer login, invalidar tokens anteriores
async createRefreshToken(userId: string) {
  // 1. Invalidar todos refresh tokens anteriores do usuário
  await this.prisma.refreshToken.updateMany({
    where: { 
      userId,
      isActive: true 
    },
    data: { isActive: false }
  });
  
  // 2. Criar novo refresh token
  const refreshToken = jwt.sign(/* ... */);
  
  await this.prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: /* 7 dias */,
      isActive: true
    }
  });
  
  return refreshToken;
}
```

**Justificativa:**
- ✅ Reduz superfície de ataque (menos tokens ativos)
- ✅ Previne session hijacking distribuído
- ✅ Simplifica gestão de segurança
- ⚠️ Trade-off: Usuário não pode estar logado em múltiplos dispositivos

**Exceção:**  
ADMINISTRADOR pode ter política diferente (futuro: considerar múltiplas sessões gerenciadas).

---

### RN-SEC-001.4: Rastreamento de Dispositivos

**Descrição:**  
> Sistema DEVE rastrear IP, User-Agent e dispositivo de cada sessão.

**Tabela refresh_tokens:**
```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY,
  token STRING UNIQUE,
  userId UUID REFERENCES usuarios(id),
  ipAddress STRING,           -- IP do cliente
  userAgent STRING,           -- String completa
  dispositivo STRING,        -- mobile/desktop/tablet
  navegador STRING,          -- chrome/firefox/etc
  isActive BOOLEAN DEFAULT true,
  expiresAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT now()
);
```

**Extração de Dispositivo:**
```typescript
private extractDeviceInfo(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Dispositivo
  let dispositivo = 'Desktop';
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    dispositivo = 'Mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    dispositivo = 'Tablet';
  }
  
  // Navegador
  let navegador = 'Outro';
  if (ua.includes('edg/') || ua.includes('edge/')) navegador = 'Edge';
  else if (ua.includes('chrome/')) navegador = 'Chrome';
  else if (ua.includes('firefox/')) navegador = 'Firefox';
  else if (ua.includes('safari/')) navegador = 'Safari';
  else if (ua.includes('opera/') || ua.includes('opr/')) navegador = 'Opera';
  
  return { dispositivo, navegador };
}
```

---

### RN-SEC-001.5: Logout Seguro

**Descrição:**  
> Logout DEVE invalidar refresh token no servidor.

**Implementação:**
```typescript
// POST /auth/logout
@Post('logout')
async logout(@Body() logoutDto: LogoutDto) {
  // 1. Invalidar refresh token no banco
  await this.prisma.refreshToken.update({
    where: { token: logoutDto.refreshToken },
    data: { isActive: false }
  });
  
  // 2. Opcional: adicionar à blacklist (se implementado)
  // await this.blacklistService.add(logoutDto.accessToken);
  
  return { message: 'Logout realizado com sucesso' };
}

// POST /auth/logout-all (logout todos dispositivos)
@Post('logout-all')
async logoutAll(@Request() req) {
  const userId = req.user.sub;
  
  // Invalidar TODOS refresh tokens do usuário
  await this.prisma.refreshToken.updateMany({
    where: { userId },
    data: { isActive: false }
  });
  
  return { message: 'Todos dispositivos desconectados' };
}
```

---

### RN-SEC-001.6: Limpeza Automática de Tokens

**Descrição:**  
> Tokens expirados DEVEM ser removidos automaticamente do banco.

**Implementação (Cron Job):**
```typescript
// Job diário às 3h da manhã
@Cron('0 3 * * *')
async cleanupExpiredTokens() {
  const result = await this.prisma.refreshToken.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },           // Expirados
        { 
          isActive: false,
          updatedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Inativos há 30 dias
        }
      ]
    }
  });
  
  this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
}
```

**Status:** ⚠️ **FUTURO** - Implementar cron job.

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
```typescript
// @nestjs/throttler
@Throttle(5, 15) // 5 requests por 15 minutos
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Implementation
}
```

**Headers Retornados:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1640995200
```

---

## 🔐 Segurança de Senhas

### RN-SEC-001.8: Hash Seguro de Senhas

**Descrição:**  
> Senhas DEVEM ser hasheadas com Argon2 (NUNCA bcrypt ou MD5).

**Implementação:**
```typescript
import * as argon2 from 'argon2';

async hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16,    // 64MB
    timeCost: 3,            // 3 iterations
    parallelism: 1,        // 1 thread
    hashLength: 32          // 32 bytes
  });
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}
```

**Justificativa:**  
Argon2 é vencedor do Password Hashing Competition (2015), resistente a ataques GPU/ASIC.

---

### RN-SEC-001.9: Validação de Senha Forte

**Descrição:**  
> Senha deve atender requisitos mínimos de complexidade.

**Critérios:**
- ✅ Mínimo 8 caracteres
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 letra minúscula  
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial (@$!%*?&)

**Implementação:**
```typescript
// reset-password.dto.ts
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)'
})
novaSenha: string;
```

---

## 📊 Validação e Testes

### Cobertura Obrigatória

**Unit Tests:**
- ✅ AuthService.login() gera tokens válidos
- ✅ RefreshTokensService.rotateRefreshToken() one-time use
- ✅ Password hashing/verification com Argon2
- ✅ Validação de senha forte

**E2E Tests (security-adversarial.spec.ts):**
- ✅ Token reuse test (refresh token não pode ser reutilizado)
- ✅ Multiple login attempts (rate limiting)
- ✅ Session hijacking prevention (sessão única)
- ✅ Logout invalida refresh token

### Cenários Críticos

1. ✅ Token theft (roubado não funciona após rotação)
2. ✅ Brute force (bloqueado após 5 tentativas)
3. ✅ Session hijacking (sessão única previne)
4. ✅ Token reuse (refresh token one-time use)
5. ✅ Password security (Argon2 + complexidade)

---

## 🚨 Exceções e Edge Cases

### Caso 1: Token Revogado Durante Uso

**Cenário:** Usuário está usando sistema, admin revoga acesso.  
**Comportamento:**  
- Access token continua válido até expirar (máx 1h) - JWT stateless
- Ao tentar refresh, recebe 401 Unauthorized
- Sistema força logout automaticamente

**Justificativa:** JWT stateless não permite invalidação imediata sem blacklist complexa.

### Caso 2: Múltiplos Logins Simultâneos

**Cenário:** Empresa compartilha 1 conta entre funcionários.  
**Comportamento:**  
- Último login invalida sessões anteriores
- Funcionários são deslogados

**Solução:** Criar usuários individuais (boa prática de segurança).

### Caso 3: Conexão Móvel Instável

**Cenário:** Usuário em conexão móvel com perda frequente.  
**Comportamento:**  
- Refresh automático funciona em background
- Sessão única mantida
- Se refresh falhar por timeout, usuário precisa login novamente

---

## 🔧 Configurações de Ambiente

### Variáveis de Ambiente

```bash
# JWT Configuration
JWT_SECRET=super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=super-secret-refresh-key-min-32-chars
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Security
BCRYPT_ROUNDS=12          # Se fallback para bcrypt
FRONTEND_URL=http://localhost:4200
```

### Headers de Segurança

```typescript
// main.ts - Helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Angular exige inline
      styleSrc: ["'self'", "'unsafe-inline'"],  // Angular exige inline
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## 🔄 Melhorias Futuras

### Roadmap de Segurança

**Curto Prazo (1-2 meses):**
- ✅ Implementar cron job de limpeza de tokens
- ✅ Adicionar 2FA (TOTP) opcional
- ✅ Implementar blacklist de access tokens

**Médio Prazo (3-6 meses):**
- 🔄 Multi-factor authentication (TOTP obrigatório para ADMIN)
- 🔄 Device fingerprinting
- 🔄 Anomaly detection (login de localização incomum)

**Longo Prazo (6+ meses):**
- 🔄 Hardware security keys (WebAuthn)
- 🔄 Zero-trust architecture
- 🔄 Passwordless authentication

---

## 📚 Referências

- **OWASP:** Authentication Cheat Sheet
- **JWT:** RFC 8725 - Best Practices
- **Argon2:** Password Hashing Competition Winner
- **Multi-Tenant:** [RN-SEC-002](./multi-tenant.md)
- **RBAC:** [RN-SEC-003](./rbac.md)
- **CORS:** Configuração de origens permitidas

---

**Aprovado por:** Business Analyst  
**Implementado em:** 2026-01-24 (v1.0)  
**Consolidado em:** 2026-02-04 (v1.2)  
**Próxima Revisão:** 2026-05-04 (trimestral - alta criticidade)