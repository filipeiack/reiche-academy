# Regras de Negócio — Auth

**Módulo:** Auth (Autenticação e Recuperação de Senha)  
**Backend:** `backend/src/modules/auth/`  
**Frontend:** Não implementado  
**Última extração:** 21/12/2024  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Auth é responsável por:
- Autenticação de usuários (login/logout)
- Geração e renovação de tokens JWT
- Recuperação de senha (forgot/reset password)
- Auditoria de tentativas de login
- Proteção de rotas por autenticação e perfis

**Entidades principais:**
- Usuario (referência de `modules/usuarios`)
- PasswordReset (tokens de recuperação de senha)
- LoginHistory (auditoria de tentativas de login)

**Endpoints implementados:**
- `POST /auth/login` — Autenticação de usuário
- `POST /auth/refresh` — Renovação de access token
- `POST /auth/forgot-password` — Solicitação de reset de senha
- `POST /auth/reset-password` — Reset de senha com token

---

## 2. Entidades

### 2.1. PasswordReset

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| token | String (unique) | Token criptográfico de reset |
| expiresAt | DateTime | Data/hora de expiração do token |
| used | Boolean | Indica se token já foi utilizado |
| usuarioId | String (FK) | Referência ao usuário |
| createdAt | DateTime | Data de criação do token |

**Relações:**
- `usuario`: Usuario (onDelete: Cascade)

**Índices:**
- `token` (busca rápida por token)
- `usuarioId` (busca por usuário)

---

### 2.2. LoginHistory

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| usuarioId | String? (FK) | Referência ao usuário (nullable) |
| email | String | Email usado na tentativa de login |
| sucesso | Boolean | Indica se login foi bem-sucedido |
| motivoFalha | String? | Descrição da falha (se aplicável) |
| ipAddress | String? | Endereço IP da requisição |
| userAgent | String? | User-Agent do navegador/cliente |
| dispositivo | String? | Tipo de dispositivo (Desktop/Mobile/Tablet) |
| navegador | String? | Navegador identificado (Chrome/Edge/Firefox/Safari/Opera/Outro) |
| createdAt | DateTime | Data da tentativa de login |

**Relações:**
- `usuario`: Usuario? (onDelete: SetNull)

**Índices:**
- `usuarioId`
- `email`
- `createdAt`
- `sucesso`

---

## 3. Regras Implementadas

### R-AUTH-001: Autenticação com Email e Senha

**Descrição:** Usuário deve fornecer email e senha válidos para autenticar.

**Implementação:**
- **Endpoint:** `POST /auth/login`
- **DTO:** `LoginDto` (email obrigatório e válido, senha obrigatória)
- **Método:** `AuthService.validateUser()`
- **Estratégia:** Passport Local Strategy

**Comportamento:**
1. LocalStrategy recebe email e senha
2. AuthService.validateUser() busca usuário por email
3. Se usuário não existe ou inativo → UnauthorizedException
4. Verifica senha com argon2.verify()
5. Se senha incorreta → UnauthorizedException
6. Se sucesso → retorna usuário sem senha

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L22-L39)

---

### R-AUTH-002: Validar Usuário Ativo

**Descrição:** Apenas usuários com `ativo: true` podem autenticar.

**Implementação:**
- Validação em `validateUser()`: `if (!usuario || !usuario.ativo)`
- Se inativo → UnauthorizedException("Credenciais inválidas")

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L24-L28)

---

### R-AUTH-003: Hash de Senha com Argon2

**Descrição:** Senhas são armazenadas com hash argon2 (não plaintext).

**Implementação:**
- **Método:** `AuthService.hashPassword()`
- **Biblioteca:** `argon2`
- **Uso:** Criação de usuário e reset de senha

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L93-L95)

---

### R-AUTH-004: Geração de Access Token e Refresh Token

**Descrição:** Ao autenticar, sistema gera access token (JWT) e refresh token.

**Implementação:**
- **Endpoint:** `POST /auth/login`
- **Método:** `AuthService.login()`

**Payload do JWT:**
```typescript
{
  sub: usuario.id,
  email: usuario.email,
  perfil: usuario.perfil.codigo || usuario.perfil,
  empresaId: usuario.empresaId
}
```

**Tokens gerados:**
1. **Access Token:**
   - Secret: `JWT_SECRET`
   - Expiração: configurável (padrão: 15m)
   
2. **Refresh Token:**
   - Secret: `JWT_REFRESH_SECRET`
   - Expiração: configurável (padrão: 7d)

**Retorno do login:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1...",
  "refreshToken": "eyJhbGciOiJIUzI1...",
  "usuario": {
    "id": "uuid",
    "email": "user@example.com",
    "nome": "Nome Usuario",
    "cargo": "Cargo",
    "perfil": { ... },
    "empresaId": "uuid",
    "empresa": { ... },
    "fotoUrl": "url"
  }
}
```

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L41-L71)

---

### R-AUTH-005: Renovação de Token (Refresh)

**Descrição:** Cliente pode renovar access token usando refresh token válido.

**Implementação:**
- **Endpoint:** `POST /auth/refresh`
- **DTO:** `RefreshTokenDto` (refreshToken obrigatório)
- **Método:** `AuthService.refreshToken()`

**Comportamento:**
1. Verifica refresh token com `JWT_REFRESH_SECRET`
2. Extrai payload (userId, email, perfil, empresaId)
3. Busca usuário por ID
4. Se usuário não existe ou inativo → UnauthorizedException
5. Gera novo par de tokens (access + refresh)
6. Retorna mesma estrutura do login

**Exceções:**
- Token inválido → UnauthorizedException("Token inválido ou expirado")
- Usuário inativo → UnauthorizedException("Token inválido")

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L73-L89)

---

### R-AUTH-006: Solicitar Reset de Senha (Forgot Password)

**Descrição:** Usuário pode solicitar reset de senha fornecendo email.

**Implementação:**
- **Endpoint:** `POST /auth/forgot-password`
- **DTO:** `ForgotPasswordDto` (email obrigatório e válido)
- **Método:** `AuthService.forgotPassword()`

**Comportamento:**
1. Busca usuário por email
2. Se usuário não existe → retorna sucesso genérico (segurança)
3. Se usuário inativo → BadRequestException("Usuário inativo")
4. Gera token aleatório (32 bytes hex)
5. Define expiração: 15 minutos
6. Salva registro em `password_resets`
7. Monta link de reset: `{FRONTEND_URL}/auth/reset-password?token={token}`
8. Envia email via `EmailService.sendPasswordResetEmail()`
9. Retorna mensagem genérica

**Mensagem padrão (segurança):**
```
"Se o email existir, você receberá instruções para redefinir sua senha."
```

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L100-L139)

---

### R-AUTH-007: Token de Reset Expira em 15 Minutos

**Descrição:** Tokens de recuperação de senha expiram após 15 minutos.

**Implementação:**
```typescript
const expiresAt = new Date();
expiresAt.setMinutes(expiresAt.getMinutes() + 15);
```

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L118-L119)

---

### R-AUTH-008: Reset de Senha com Token

**Descrição:** Usuário pode redefinir senha fornecendo token válido e nova senha.

**Implementação:**
- **Endpoint:** `POST /auth/reset-password`
- **DTO:** `ResetPasswordDto` (token + novaSenha)
- **Método:** `AuthService.resetPassword()`

**Comportamento:**
1. Busca registro de `password_resets` por token (include usuario)
2. Se não existe → BadRequestException("Token inválido ou expirado")
3. Verifica se já foi usado (`used: true`) → BadRequestException("Este link já foi utilizado")
4. Verifica expiração (`new Date() > expiresAt`) → BadRequestException("Token expirado...")
5. Faz hash da nova senha com argon2
6. Atualiza `usuario.senha` no banco
7. Marca token como usado (`used: true`)
8. Envia email de confirmação via `EmailService.sendPasswordChangedEmail()`
9. Retorna `{ message: "Senha alterada com sucesso!" }`

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L144-L186)

---

### R-AUTH-009: Validação de Senha Forte (Reset)

**Descrição:** Nova senha em reset deve cumprir critérios de complexidade.

**Implementação:**
- **DTO:** `ResetPasswordDto`
- **Validações:**
  - Mínimo 8 caracteres (`@MinLength(8)`)
  - Pelo menos 1 letra maiúscula
  - Pelo menos 1 letra minúscula
  - Pelo menos 1 número
  - Pelo menos 1 caractere especial (`@$!%*?&`)

**Regex:**
```typescript
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)',
})
```

**Arquivo:** [reset-password.dto.ts](../../backend/src/modules/auth/dto/reset-password.dto.ts#L10-L17)

---

### R-AUTH-010: Auditoria de Login (Sucesso e Falha)

**Descrição:** Sistema registra TODAS as tentativas de login (sucesso e falha) para auditoria.

**Implementação:**
- **Método privado:** `AuthService.registrarLogin()`
- **Tabela:** `login_history`

**Chamadas:**
1. Usuário não existe/inativo → registra falha
2. Senha incorreta → registra falha
3. Login bem-sucedido → registra sucesso

**Dados registrados:**
- `usuarioId`: ID do usuário (null se não existe)
- `email`: Email usado na tentativa
- `sucesso`: true/false
- `motivoFalha`: "Credenciais inválidas" | "Senha incorreta" | null
- `ipAddress`: IP da requisição (req.ip ou x-forwarded-for)
- `userAgent`: User-Agent do cliente
- `dispositivo`: "Desktop" | "Mobile" | "Tablet"
- `navegador`: "Chrome" | "Edge" | "Firefox" | "Safari" | "Opera" | "Outro"
- `createdAt`: Timestamp da tentativa

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L191-L245)

---

### R-AUTH-011: Detecção de Dispositivo e Navegador

**Descrição:** Sistema identifica dispositivo e navegador via User-Agent.

**Implementação:**
- Parse básico em `registrarLogin()`

**Dispositivo:**
- Contém "mobile", "android", "iphone" → "Mobile"
- Contém "tablet", "ipad" → "Tablet"
- Caso contrário → "Desktop"

**Navegador:**
- Contém "edg/" ou "edge/" → "Edge"
- Contém "chrome/" (exceto Edge) → "Chrome"
- Contém "firefox/" → "Firefox"
- Contém "safari/" (exceto Chrome) → "Safari"
- Contém "opera/" ou "opr/" → "Opera"
- Caso contrário → "Outro"

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L209-L231)

---

### R-AUTH-012: Envio de Email de Recuperação (Mock)

**Descrição:** Sistema "envia" email de recuperação de senha (atualmente apenas log).

**Implementação:**
- **Serviço:** `EmailService.sendPasswordResetEmail()`
- **Comportamento atual:** Registra no console (Logger)
- **Produção (TODO):** Integrar com SendGrid/AWS SES/Nodemailer

**Dados do email:**
- Para: `to` (email do usuário)
- Nome: `nome` (nome do usuário)
- Link: `resetLink` (URL com token)
- Expira em: 15 minutos (informativo)

**Arquivo:** [email.service.ts](../../backend/src/modules/auth/email.service.ts#L14-L41)

---

### R-AUTH-013: Envio de Email de Confirmação de Troca (Mock)

**Descrição:** Sistema "envia" email confirmando troca de senha.

**Implementação:**
- **Serviço:** `EmailService.sendPasswordChangedEmail()`
- **Comportamento atual:** Registra no console (Logger)
- **Produção (TODO):** Integrar com provedor de email

**Dados do email:**
- Para: `to` (email do usuário)
- Nome: `nome` (nome do usuário)
- Mensagem: "Sua senha foi alterada com sucesso!"

**Arquivo:** [email.service.ts](../../backend/src/modules/auth/email.service.ts#L47-L59)

---

### R-AUTH-014: Proteção de Rotas com JWT

**Descrição:** Rotas protegidas exigem JWT válido no header Authorization.

**Implementação:**
- **Guard:** `JwtAuthGuard` (extends AuthGuard('jwt'))
- **Strategy:** `JwtStrategy` (Passport JWT)
- **Uso:** `@UseGuards(JwtAuthGuard)` em controllers

**Extração do token:**
- Header: `Authorization: Bearer {token}`
- Strategy: `ExtractJwt.fromAuthHeaderAsBearerToken()`

**Validação:**
- Verifica assinatura com `JWT_SECRET`
- Verifica expiração (`ignoreExpiration: false`)
- Extrai payload e injeta em `req.user`:
  ```typescript
  {
    id: payload.sub,
    email: payload.email,
    perfil: payload.perfil,
    empresaId: payload.empresaId
  }
  ```

**Arquivo:** [jwt.strategy.ts](../../backend/src/modules/auth/strategies/jwt.strategy.ts)

---

### R-AUTH-015: Proteção de Rotas por Perfil (Roles)

**Descrição:** Rotas podem exigir perfis específicos para acesso.

**Implementação:**
- **Decorator:** `@Roles(...roles: Role[])`
- **Guard:** `RolesGuard`
- **Perfis disponíveis:** ADMINISTRADOR | CONSULTOR | GESTOR | COLABORADOR | LEITURA

**Uso:**
```typescript
@Roles('ADMINISTRADOR', 'GESTOR')
@UseGuards(JwtAuthGuard, RolesGuard)
@Get('rota-protegida')
metodo() { ... }
```

**Comportamento:**
1. RolesGuard extrai perfis exigidos via Reflector
2. Se nenhum perfil exigido → permite acesso
3. Extrai perfil do `req.user` (injetado por JwtAuthGuard)
4. Se usuário não tem perfil → bloqueia
5. Se perfil do usuário está na lista de exigidos → permite
6. Caso contrário → bloqueia

**Arquivo:** [roles.guard.ts](../../backend/src/modules/auth/guards/roles.guard.ts)

---

### R-AUTH-016: Local Strategy com IP e User-Agent

**Descrição:** Estratégia de autenticação local captura IP e User-Agent para auditoria.

**Implementação:**
- **Strategy:** `LocalStrategy` (Passport Local)
- **Config:** `passReqToCallback: true` (acessa req no validate)
- **Campos:** `usernameField: 'email'`, `passwordField: 'senha'`

**Comportamento:**
1. Extrai IP: `req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress`
2. Extrai User-Agent: `req.headers['user-agent']`
3. Chama `AuthService.validateUser(email, senha, ip, userAgent)`
4. Se validação falha → UnauthorizedException
5. Se sucesso → retorna usuário (injetado em req.user)

**Arquivo:** [local.strategy.ts](../../backend/src/modules/auth/strategies/local.strategy.ts)

---

### R-AUTH-017: Falha de Auditoria Não Bloqueia Login

**Descrição:** Se registro de auditoria falhar, login continua normalmente.

**Implementação:**
- Método `registrarLogin()` é try/catch
- Em caso de erro → loga no console, mas não lança exceção

**Justificativa:** Auditoria é importante, mas não crítica ao ponto de bloquear autenticação.

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L237-L244)

---

## 4. Validações

### 4.1. LoginDto

**Arquivo:** [login.dto.ts](../../backend/src/modules/auth/dto/login.dto.ts)

| Campo | Validações |
|-------|-----------|
| email | `@IsEmail()`, `@IsNotEmpty()` |
| senha | `@IsString()`, `@IsNotEmpty()` |

---

### 4.2. ForgotPasswordDto

**Arquivo:** [forgot-password.dto.ts](../../backend/src/modules/auth/dto/forgot-password.dto.ts)

| Campo | Validações |
|-------|-----------|
| email | `@IsEmail()`, `@IsNotEmpty()` |

**Mensagens customizadas:**
- Email inválido: "Email inválido"
- Email obrigatório: "Email é obrigatório"

---

### 4.3. ResetPasswordDto

**Arquivo:** [reset-password.dto.ts](../../backend/src/modules/auth/dto/reset-password.dto.ts)

| Campo | Validações |
|-------|-----------|
| token | `@IsNotEmpty()`, `@IsString()` |
| novaSenha | `@IsNotEmpty()`, `@MinLength(8)`, `@Matches(regex)` |

**Regex de senha forte:**
- `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]`
- Exige: minúscula, maiúscula, número, caractere especial

---

### 4.4. RefreshTokenDto

**Arquivo:** [refresh-token.dto.ts](../../backend/src/modules/auth/dto/refresh-token.dto.ts)

| Campo | Validações |
|-------|-----------|
| refreshToken | `@IsString()`, `@IsNotEmpty()` |

---

## 5. Comportamentos Condicionais

### 5.1. Login de Usuário Inativo

**Condição:** `usuario.ativo === false`

**Comportamento:**
1. Registra tentativa falhada com motivo "Credenciais inválidas"
2. Lança UnauthorizedException("Credenciais inválidas")
3. Não revela que usuário existe mas está inativo (segurança)

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L24-L28)

---

### 5.2. Email Não Existe em Forgot Password

**Condição:** Email fornecido não está cadastrado

**Comportamento:**
1. NÃO revela que email não existe (segurança)
2. Retorna mensagem genérica de sucesso
3. Não envia email (obvio)

**Mensagem:**
```
"Se o email existir, você receberá instruções para redefinir sua senha."
```

**Justificativa:** Previne enumeração de emails cadastrados.

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L107-L109)

---

### 5.3. Usuário Inativo em Forgot Password

**Condição:** Email existe, mas `usuario.ativo === false`

**Comportamento:**
1. Lança BadRequestException("Usuário inativo")
2. NÃO gera token
3. NÃO envia email

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L111-L113)

---

### 5.4. Token de Reset Já Usado

**Condição:** `passwordReset.used === true`

**Comportamento:**
1. Lança BadRequestException("Este link já foi utilizado")
2. NÃO permite reutilização de token

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L155-L157)

---

### 5.5. Token de Reset Expirado

**Condição:** `new Date() > passwordReset.expiresAt`

**Comportamento:**
1. Lança BadRequestException("Token expirado. Solicite um novo link de recuperação.")
2. NÃO permite reset com token expirado

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L160-L162)

---

### 5.6. Refresh Token com Usuário Inativo

**Condição:** Token válido, mas `usuario.ativo === false`

**Comportamento:**
1. Lança UnauthorizedException("Token inválido")
2. NÃO revela que usuário está inativo
3. NÃO renova token

**Arquivo:** [auth.service.ts](../../backend/src/modules/auth/auth.service.ts#L80-L82)

---

### 5.7. RolesGuard sem Roles Exigidos

**Condição:** Rota não usa decorator `@Roles(...)` ou array vazio

**Comportamento:**
1. Permite acesso (não restringe)
2. Assume que apenas autenticação JWT é suficiente

**Arquivo:** [roles.guard.ts](../../backend/src/modules/auth/guards/roles.guard.ts#L11-L13)

---

## 6. Ausências ou Ambiguidades

### 6.1. Email Não Implementado (Mock)

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- `EmailService` apenas loga no console
- Produção exige integração com provedor real (SendGrid, AWS SES, Nodemailer)

**TODO:**
- Configurar SMTP ou serviço de terceiros
- Implementar templates HTML para emails
- Adicionar retry em caso de falha

**Arquivo:** [email.service.ts](../../backend/src/modules/auth/email.service.ts)

---

### 6.2. Rate Limiting em Login

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema não limita tentativas de login
- Vulnerável a brute force

**TODO:**
- Implementar rate limiting (ex: 5 tentativas por IP/15min)
- Usar throttler do NestJS ou biblioteca externa
- Registrar bloqueios em LoginHistory

---

### 6.3. Bloqueio de Conta Após N Tentativas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Usuário não é bloqueado automaticamente após múltiplas falhas
- Auditoria está disponível (LoginHistory), mas sem ação automática

**TODO:**
- Implementar lógica de bloqueio temporário
- Adicionar campo `blockedUntil` em Usuario
- Notificar usuário via email em caso de bloqueio

---

### 6.4. Logout (Invalidação de Token)

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Não existe endpoint de logout
- Tokens não são invalidados centralmente
- Cliente deve descartar tokens localmente

**TODO:**
- Implementar blacklist de tokens (Redis)
- Criar endpoint `POST /auth/logout`
- Invalidar refresh token no banco

---

### 6.5. Two-Factor Authentication (2FA)

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema não suporta autenticação em dois fatores

**TODO:**
- Implementar TOTP (Time-based One-Time Password)
- Adicionar campos `twoFactorEnabled`, `twoFactorSecret` em Usuario
- Criar endpoint de verificação de código

---

### 6.6. FRONTEND_URL Configurável

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- Link de reset usa variável de ambiente `FRONTEND_URL`
- Padrão: `http://localhost:4200`
- Documentação não especifica comportamento em múltiplos ambientes

**TODO:**
- Documentar configuração de `FRONTEND_URL` por ambiente
- Validar se link está acessível antes de enviar email

---

### 6.7. Limpeza de Tokens Expirados

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Tokens expirados permanecem no banco indefinidamente
- Não há cron job de limpeza

**TODO:**
- Implementar job periódico (ex: diário)
- Deletar registros de `password_resets` com `expiresAt < now()`
- Considerar também limpar `login_history` antigo (ex: > 90 dias)

---

### 6.8. Validação de Senha Forte em Criação de Usuário

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- Reset de senha exige senha forte (R-AUTH-009)
- Criação de usuário NÃO valida complexidade (módulo usuarios)
- Inconsistência entre fluxos

**TODO:**
- Validar se `CreateUsuarioDto` também exige senha forte
- Aplicar mesmas regras de complexidade em ambos os fluxos

---

### 6.9. Tempo de Expiração de Tokens Configurável

**Status:** ⚠️ PARCIALMENTE DOCUMENTADO

**Descrição:**
- Access token e refresh token usam variáveis de ambiente
- Código mostra padrão: 7d para refresh
- Não documenta padrão de access token

**Variáveis esperadas:**
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRATION` (default: '7d')
- (Access token expiration — não explícito)

**TODO:**
- Documentar todas as variáveis de ambiente
- Especificar valor padrão de access token expiration

---

### 6.10. Tratamento de Erros em Parse de User-Agent

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- Parse de User-Agent assume formato padrão
- Sem tratamento de valores inesperados ou malformados

**Comportamento atual:**
- Se user-agent não identificado → dispositivo/navegador = null
- Não valida tamanho máximo do campo

**TODO:**
- Adicionar validação de tamanho máximo (prevenir overflow)
- Tratar user-agents maliciosos ou muito longos

---

### 6.11. Cascade Delete em PasswordReset

**Status:** ✅ IMPLEMENTADO (Observação)

**Descrição:**
- Se usuário é deletado, seus tokens de reset são deletados em cascata
- **Comportamento:** `onDelete: Cascade`

**Observação:**
- Usuários usam soft delete (`ativo: false`)
- Cascade só afeta delete físico (raro)

---

### 6.12. SetNull em LoginHistory

**Status:** ✅ IMPLEMENTADO (Observação)

**Descrição:**
- Se usuário é deletado, `loginHistory.usuarioId` vira null
- **Comportamento:** `onDelete: SetNull`

**Observação:**
- Mantém histórico mesmo após exclusão do usuário
- Permite auditoria de contas deletadas

---

## 7. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-AUTH-001** | Autenticação com email e senha | ✅ Implementado |
| **R-AUTH-002** | Validar usuário ativo | ✅ Implementado |
| **R-AUTH-003** | Hash de senha com argon2 | ✅ Implementado |
| **R-AUTH-004** | Geração de access/refresh tokens | ✅ Implementado |
| **R-AUTH-005** | Renovação de token | ✅ Implementado |
| **R-AUTH-006** | Solicitar reset de senha | ✅ Implementado |
| **R-AUTH-007** | Token expira em 15 minutos | ✅ Implementado |
| **R-AUTH-008** | Reset de senha com token | ✅ Implementado |
| **R-AUTH-009** | Validação de senha forte (reset) | ✅ Implementado |
| **R-AUTH-010** | Auditoria de login | ✅ Implementado |
| **R-AUTH-011** | Detecção de dispositivo/navegador | ✅ Implementado |
| **R-AUTH-012** | Envio de email de recuperação | ⚠️ Mock (TODO: produção) |
| **R-AUTH-013** | Envio de email de confirmação | ⚠️ Mock (TODO: produção) |
| **R-AUTH-014** | Proteção de rotas com JWT | ✅ Implementado |
| **R-AUTH-015** | Proteção de rotas por perfil | ✅ Implementado |
| **R-AUTH-016** | Local strategy com IP/User-Agent | ✅ Implementado |
| **R-AUTH-017** | Falha de auditoria não bloqueia login | ✅ Implementado |

**Ausências críticas:**
- ❌ Rate limiting em login
- ❌ Bloqueio de conta após N tentativas
- ❌ Logout (invalidação de token)
- ❌ Two-Factor Authentication (2FA)
- ❌ Limpeza de tokens expirados (cron)

---

## 8. Referências

**Arquivos principais:**
- [auth.service.ts](../../backend/src/modules/auth/auth.service.ts)
- [auth.controller.ts](../../backend/src/modules/auth/auth.controller.ts)
- [email.service.ts](../../backend/src/modules/auth/email.service.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (PasswordReset, LoginHistory)

**DTOs:**
- [login.dto.ts](../../backend/src/modules/auth/dto/login.dto.ts)
- [forgot-password.dto.ts](../../backend/src/modules/auth/dto/forgot-password.dto.ts)
- [reset-password.dto.ts](../../backend/src/modules/auth/dto/reset-password.dto.ts)
- [refresh-token.dto.ts](../../backend/src/modules/auth/dto/refresh-token.dto.ts)

**Guards e Strategies:**
- [jwt-auth.guard.ts](../../backend/src/modules/auth/guards/jwt-auth.guard.ts)
- [roles.guard.ts](../../backend/src/modules/auth/guards/roles.guard.ts)
- [local-auth.guard.ts](../../backend/src/modules/auth/guards/local-auth.guard.ts)
- [jwt.strategy.ts](../../backend/src/modules/auth/strategies/jwt.strategy.ts)
- [local.strategy.ts](../../backend/src/modules/auth/strategies/local.strategy.ts)

**Decorators:**
- [roles.decorator.ts](../../backend/src/modules/auth/decorators/roles.decorator.ts)

---

**Observação final:**  
Este documento reflete APENAS o código IMPLEMENTADO.  
Regras inferidas, comportamentos não documentados ou recursos futuros  
foram marcados como ausências/ambiguidades.
