# Regras de Negócio Consolidadas: Autenticação e Segurança

**Módulo:** Autenticação (Auth)  
**Data de Consolidação:** 2025-02-04  
**Fontes:** auth.md (882 regras), seguranca-autenticacao.md (294 regras)  
**Status:** ✅ Consolidado  

---

## 1. Visão Geral

O sistema de autenticação é responsável por:
- Autenticação de usuários (login/logout)
- Geração e gerenciamento de tokens JWT
- Recuperação de senha (forgot/reset password)
- Auditoria de tentativas de login e acesso
- Proteção de rotas por autenticação e perfis (RBAC)
- Prevenção contra ataques comuns (brute force, token theft)

**Arquitetura:** Stateless com JWT + Refresh Tokens  
**Hash de Senhas:** Argon2  
**Multi-tenant:** Suporte a empresaId  
**RBAC:** 4 perfis (ADMINISTRADOR > GESTOR > COLABORADOR > LEITURA)

---

## 2. Entidades Principais

### 2.1. PasswordReset

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| token | String (unique) | Token criptográfico de reset |
| expiresAt | DateTime | Data/hora de expiração |
| used | Boolean @default(false) | Indica se token foi utilizado |
| usuarioId | String (FK) | Referência ao usuário |
| createdAt | DateTime | Data de criação |

**Relações:** usuario (onDelete: Cascade)  
**Índices:** token (único), usuarioId

---

### 2.2. LoginHistory

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| usuarioId | String? (FK) | Referência ao usuário (nullable) |
| email | String | Email usado na tentativa |
| sucesso | Boolean | Indica se login foi bem-sucedido |
| motivoFalha | String? | Descrição da falha |
| ipAddress | String? | IP da requisição |
| userAgent | String? | User-Agent do cliente |
| dispositivo | String? | Tipo (Desktop/Mobile/Tablet) |
| navegador | String? | Navegador identificado |
| createdAt | DateTime | Data da tentativa |

**Relações:** usuario? (onDelete: SetNull)  
**Índices:** usuarioId, email, createdAt, sucesso

---

### 2.3. RefreshTokens (Planejado - RN-SEC-001)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| token | String (unique) | Refresh token hasheado |
| userId | String (FK) | Referência ao usuário |
| isActive | Boolean @default(true) | Token ativo/inativo |
| ipAddress | String | IP do login |
| userAgent | String | User-Agent do login |
| dispositivo | String | Dispositivo identificado |
| expiresAt | DateTime | Data de expiração |
| createdAt | DateTime | Data de criação |

**Status:** ⚠️ **FUTURO** - Implementar refresh tokens persistentes

---

## 3. Regras de Autenticação

### R-AUTH-001: Autenticação com Email e Senha

**Descrição:** Usuário deve fornecer email e senha válidos para autenticar.

**Implementação:**
- Endpoint: `POST /auth/login`
- DTO: `LoginDto` (email válido obrigatório, senha obrigatória)
- Estratégia: Passport Local Strategy

**Comportamento:**
1. LocalStrategy recebe email e senha
2. Busca usuário por email
3. Se usuário não existe ou inativo → UnauthorizedException
4. Verifica senha com argon2.verify()
5. Se senha incorreta → UnauthorizedException
6. Se sucesso → retorna usuário sem senha

---

### R-AUTH-002: Validar Usuário Ativo

**Descrição:** Apenas usuários com `ativo: true` podem autenticar.

**Implementação:**
- Validação em `validateUser()`: `if (!usuario || !usuario.ativo)`
- Se inativo → UnauthorizedException("Credenciais inválidas")
- Não revela que usuário existe mas está inativo (segurança)

---

### RN-SEC-001.8: Hash Seguro de Senhas

**Descrição:** Senhas DEVEM ser hasheadas com Argon2 (NUNCA bcrypt ou MD5).

**Implementação:**
- Biblioteca: `argon2`
- Uso: Criação de usuário e reset de senha
- Configuração: Padrão (salt automático, iterações adequadas)

**Justificativa:** Argon2 é vencedor do Password Hashing Competition (2015), resistente a ataques GPU/ASIC.

---

### R-AUTH-009: Validação de Senha Forte

**Descrição:** Nova senha em reset deve cumprir critérios de complexidade.

**Validações:**
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial (`@$!%*?&`)

**Regex:** `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]`

**Status:** ✅ Implementado em reset, ⚠️ inconsistente em criação de usuário

---

## 4. Regras de Tokens JWT

### RN-SEC-001.1: Autenticação por JWT

**Descrição:** Sistema DEVE usar JWT para autenticação stateless.

**Tokens Gerados:**
1. **Access Token:**
   - Secret: `JWT_SECRET`
   - Expiração: 1 hora (configurável)
   - Payload: `{ sub, email, perfil, empresaId }`

2. **Refresh Token:**
   - Secret: `JWT_REFRESH_SECRET`
   - Expiração: 7 dias (configurável)
   - Atualmente sem persistência (aprotado para implementação)

---

### RN-SEC-001.2: Rotação de Refresh Tokens

**Descrição:** Refresh tokens DEVEM ser rotacionados a cada uso (one-time use).

**Status:** ⚠️ **FUTURO** - Requer implementação de `RefreshTokens` entity

**Comportamento Planejado:**
- Ao usar refresh token, sistema invalida o token antigo
- Novo refresh token é gerado e retornado
- Token antigo não pode ser reutilizado

**Justificativa:** Previne reutilização de tokens roubados.

---

### RN-SEC-001.3: Sessão Única por Usuário

**Descrição:** Usuário PODE ter apenas 1 sessão ativa por vez.

**Status:** ⚠️ **FUTURO** - Requer `RefreshTokens` entity

**Comportamento:**
- Ao fazer login, todos refresh tokens anteriores são invalidados
- Apenas 1 refresh token ativo por userId

**Trade-off:** Usuário não pode estar logado em múltiplos dispositivos simultaneamente.

**ADR:** Ver ADR-010 para justificativa completa.

---

## 5. Regras de Segurança

### RN-SEC-001.7: Proteção contra Brute Force

**Descrição:** Endpoints de autenticação DEVEM ter rate limiting agressivo.

**Status:** ❌ **NÃO IMPLEMENTADO**

**Limites Definidos:**
| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/auth/login` | 5 tentativas | 15 minutos |
| `/auth/forgot-password` | 3 tentativas | 1 hora |
| `/auth/reset-password` | 3 tentativas | 1 hora |
| Endpoints gerais | 100 requisições | 1 minuto |

**Implementação Planejada:** `@nestjs/throttler` com decorator `@Throttle()`

---

### R-AUTH-014: Proteção de Rotas com JWT

**Descrição:** Rotas protegidas exigem JWT válido no header Authorization.

**Implementação:**
- Guard: `JwtAuthGuard` (extends AuthGuard('jwt'))
- Strategy: `JwtStrategy` (Passport JWT)
- Header: `Authorization: Bearer {token}`
- Validação: Assinatura + expiração
- Payload injetado em `req.user`

---

### R-AUTH-015: Proteção de Rotas por Perfil (RBAC)

**Descrição:** Rotas podem exigir perfis específicos para acesso.

**Implementação:**
- Decorator: `@Roles(...roles: Role[])`
- Guard: `RolesGuard`
- Perfis: ADMINISTRADOR > GESTOR > COLABORADOR > LEITURA
- Multi-tenant: Validar `empresaId` (ADMINISTRADOR global)

---

### RN-SEC-001.8: CSRF Não Implementado

**Descrição:** Sistema NÃO implementa proteção CSRF.

**Justificativa:**
- JWT armazenado em localStorage/sessionStorage (não cookies)
- JWT enviado via header Authorization (requer JavaScript explícito)
- CSRF explora envio automático de cookies — não aplicável
- CORS já protege requisições cross-origin

**Proteções Equivalentes:**
- ✅ CORS: Bloqueia requisições não autorizadas
- ✅ JWT Signature: Valida autenticidade
- ✅ XSS Prevention: Sanitização global (ADR-011)

**ADR:** Ver ADR-013 para análise completa.

---

## 6. Auditoria e Rastreamento

### R-AUTH-010: Auditoria de Login

**Descrição:** Sistema registra TODAS as tentativas de login (sucesso e falha).

**Dados Registrados:**
- usuarioId (null se não existe)
- email utilizado
- sucesso (true/false)
- motivoFalha (se aplicável)
- ipAddress (req.ip ou x-forwarded-for)
- userAgent (completo)
- dispositivo (Desktop/Mobile/Tablet)
- navegador (Chrome/Edge/Firefox/Safari/Opera/Outro)
- createdAt (timestamp)

**Importante:** Falha na auditoria NÃO bloqueia login (try/catch).

---

### R-AUTH-011: Detecção de Dispositivo e Navegador

**Descrição:** Sistema identifica dispositivo e navegador via User-Agent.

**Dispositivo:**
- "mobile", "android", "iphone" → "Mobile"
- "tablet", "ipad" → "Tablet"
- Caso contrário → "Desktop"

**Navegador:**
- "edg/", "edge/" → "Edge"
- "chrome/" (exceto Edge) → "Chrome"
- "firefox/" → "Firefox"
- "safari/" (exceto Chrome) → "Safari"
- "opera/", "opr/" → "Opera"
- Caso contrário → "Outro"

---

### RN-SEC-001.4: Rastreamento de Dispositivos

**Descrição:** Sistema DEVE rastrear IP, User-Agent e dispositivo de cada sessão.

**Status:** ⚠️ **PARCIAL** - Apenas em LoginHistory

**Planejado:** Tabela `refresh_tokens` com tracking persistente.

---

## 7. Recuperação de Senha

### R-AUTH-006: Solicitar Reset de Senha

**Descrição:** Usuário pode solicitar reset fornecendo email.

**Comportamento:**
1. Busca usuário por email
2. Se não existe → retorna sucesso genérico (segurança)
3. Se inativo → BadRequestException("Usuário inativo")
4. Gera token aleatório (32 bytes hex)
5. Define expiração: 15 minutos
6. Salva em `password_resets`
7. Monta link: `{FRONTEND_URL}/auth/reset-password?token={token}`
8. Envia email (atualmente mock)

---

### R-AUTH-007: Token Expira em 15 Minutos

**Descrição:** Tokens de recuperação expiram após 15 minutos.

**Implementação:**
```typescript
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 15);
```

---

### R-AUTH-008: Reset de Senha com Token

**Descrição:** Usuário pode redefinir senha com token válido.

**Validações:**
1. Token existe em `password_resets`
2. Token não foi usado (`used: false`)
3. Token não expirou (`expiresAt > now`)
4. Nova senha cumpre regras de complexidade

**Comportamento:**
1. Faz hash da nova senha com argon2
2. Atualiza `usuario.senha`
3. Marca token como `used: true`
4. Envia email de confirmação (mock)

---

## 8. Logout e Sessão

### RN-SEC-001.5: Logout Seguro

**Descrição:** Logout DEVE invalidar refresh token no servidor.

**Status:** ❌ **NÃO IMPLEMENTADO**

**Endpoints Planejados:**
- `POST /auth/logout` - Invalida token atual
- `POST /auth/logout-all` - Invalida todos tokens do usuário

**Comportamento Atual:** Cliente apenas remove tokens localmente.

---

### RN-SEC-001.6: Limpeza Automática de Tokens

**Descrição:** Tokens expirados DEVEM ser removidos automaticamente.

**Status:** ❌ **NÃO IMPLEMENTADO**

**Planejado:** Job diário (3h da manhã) para limpar:
- `password_resets` com `expiresAt < NOW()`
- `refresh_tokens` expirados ou inativos há > 30 dias

---

## 9. Validações (DTOs)

### 9.1. LoginDto
| Campo | Validações |
|-------|-----------|
| email | `@IsEmail()`, `@IsNotEmpty()` |
| senha | `@IsString()`, `@IsNotEmpty()` |

### 9.2. ForgotPasswordDto
| Campo | Validações |
|-------|-----------|
| email | `@IsEmail()`, `@IsNotEmpty()` |

### 9.3. ResetPasswordDto
| Campo | Validações |
|-------|-----------|
| token | `@IsNotEmpty()`, `@IsString()` |
| novaSenha | `@IsNotEmpty()`, `@MinLength(8)`, `@Matches(regex)` |

### 9.4. RefreshTokenDto
| Campo | Validações |
|-------|-----------|
| refreshToken | `@IsString()`, `@IsNotEmpty()` |

---

## 10. Comportamentos Condicionais

### 10.1. Login com Usuário Inativo
- Registra falha com motivo "Credenciais inválidas"
- Retorna UnauthorizedException (não revela status)

### 10.2. Forgot Password com Email Inexistente
- Retorna sucesso genérico: "Se o email existir, você receberá instruções..."
- Previne enumeração de emails

### 10.3. Reset com Token Já Usado
- BadRequestException("Este link já foi utilizado")
- Não permite reutilização

### 10.4. Refresh Token com Usuário Inativo
- UnauthorizedException("Token inválido")
- Não revela status do usuário

---

## 11. Ausências e Melhorias Futuras

### 11.1. Email Production Ready
**Status:** ❌ Mock apenas (console.log)
**TODO:** Integrar SendGrid/AWS SES/Nodemailer com templates HTML

### 11.2. Rate Limiting
**Status:** ❌ Não implementado
**TODO:** Implementar `@nestjs/throttler` com limites específicos

### 11.3. Refresh Tokens Persistentes
**Status:** ❌ Não implementado
**TODO:** Criar entity `RefreshTokens` com rotação e sessão única

### 11.4. Logout Endpoint
**Status:** ❌ Não implementado
**TODO:** Implementar `/auth/logout` e `/auth/logout-all`

### 11.5. Two-Factor Authentication (2FA)
**Status:** ❌ Não implementado
**TODO:** Considerar TOTP para usuários de alto risco

### 11.6. Account Locking
**Status:** ❌ Não implementado
**TODO:** Bloqueio temporário após N falhas (configurável)

### 11.7. Limpeza Automática
**Status:** ❌ Não implementado
**TODO:** Cron job diário para limpar tokens expirados

---

## 12. Referências Cruzadas

**ADRs Relacionados:**
- **ADR-010:** Justificativa de Single Session Policy
- **ADR-011:** XSS Prevention e CSP
- **ADR-013:** CSRF Desnecessário em Arquitetura JWT Stateless

**Documentação OWASP:**
- [Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Request_Forgery_Prevention_Cheat_Sheet.html)

---

## 13. Sumário de Implementação

| ID | Descrição | Status |
|----|-----------|--------|
| **R-AUTH-001** | Autenticação com email e senha | ✅ Implementado |
| **R-AUTH-002** | Validar usuário ativo | ✅ Implementado |
| **R-AUTH-003** | Hash Argon2 | ✅ Implementado |
| **R-AUTH-004** | Geração de tokens | ✅ Implementado |
| **R-AUTH-005** | Renovação de token | ✅ Implementado |
| **R-AUTH-006** | Solicitar reset | ✅ Implementado |
| **R-AUTH-007** | Token expira 15min | ✅ Implementado |
| **R-AUTH-008** | Reset com token | ✅ Implementado |
| **R-AUTH-009** | Senha forte | ⚠️ Reset apenas |
| **R-AUTH-010** | Auditoria de login | ✅ Implementado |
| **R-AUTH-011** | Detecção dispositivo | ✅ Implementado |
| **R-AUTH-014** | Proteção JWT | ✅ Implementado |
| **R-AUTH-015** | RBAC | ✅ Implementado |
| **RN-SEC-001.1** | JWT padrão | ✅ Implementado |
| **RN-SEC-001.2** | Rotação refresh | ⚠️ Futuro |
| **RN-SEC-001.3** | Sessão única | ⚠️ Futuro |
| **RN-SEC-001.4** | Tracking | ⚠️ Parcial |
| **RN-SEC-001.5** | Logout seguro | ❌ Não implementado |
| **RN-SEC-001.6** | Limpeza auto | ❌ Não implementado |
| **RN-SEC-001.7** | Rate limiting | ❌ Não implementado |
| **RN-SEC-001.8** | CSRF não implementado | ✅ Decisão documentada |

---

**Consolidado por:** Business Analyst  
**Data:** 2025-02-04  
**Próxima Revisão:** 2025-05-04 (trimestral)