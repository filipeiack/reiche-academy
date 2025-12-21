# Regras de Negócio — Módulo AUTH

**Data de extração**: 2025-12-21  
**Escopo**: Autenticação, autorização e gerenciamento de sessão

---

## 1. Visão Geral

O módulo AUTH implementa:
- Autenticação local por email/senha com validação de credenciais
- Geração e renovação de tokens JWT (access + refresh)
- Reset de senha por email com tokens temporários
- Auditoria de tentativas de login (sucesso e falha)
- Autorização baseada em perfil (RBAC)

---

## 2. Entidades

### 2.1 LoginHistory
```
- id: UUID (PK)
- usuarioId: UUID (FK, nullable) — permite registrar tentativas com usuário não encontrado
- email: String — email utilizado na tentativa
- sucesso: Boolean — indica se autenticação foi bem-sucedida
- motivoFalha: String (nullable) — descrição do erro se sucesso=false
- ipAddress: String (nullable) — IP origem da tentativa
- userAgent: String (nullable) — navegador/dispositivo origem
- dispositivo: String (nullable) — tipo detectado (Mobile, Tablet, Desktop)
- navegador: String (nullable) — navegador detectado (Chrome, Firefox, Edge, Safari, Opera, Outro)
- createdAt: DateTime — momento da tentativa
```

### 2.2 PasswordReset
```
- id: UUID (PK)
- token: String (UNIQUE) — token aleatório de 256 bits em hex
- expiresAt: DateTime — momento de expiração
- used: Boolean (default: false) — marca reutilização de token
- usuarioId: UUID (FK) — usuário associado
- createdAt: DateTime — momento de criação
```

---

## 3. Regras Implementadas

### 3.1 Autenticação (Login)

**R-AUTH-001**: Validação de credenciais
- Email e senha são obrigatórios
- Email deve ser válido (formato de email)
- Sistema busca usuário por email

**R-AUTH-002**: Rejeição de usuários inativos
- Se usuário não encontrado → lança `UnauthorizedException` com mensagem genérica: "Credenciais inválidas"
- Se usuário inativo → lança `UnauthorizedException` com mensagem genérica
- Motivo real registrado em `LoginHistory` com `motivoFalha = "Credenciais inválidas"`

**R-AUTH-003**: Validação de senha com Argon2
- Senha armazenada utiliza hash Argon2
- Validação usa `argon2.verify(hashArmazenado, senhaDigitada)`
- Se senha inválida → lança `UnauthorizedException` com mensagem genérica
- Motivo real: `motivoFalha = "Senha incorreta"`

**R-AUTH-004**: Geração de tokens JWT
- **Access Token**: payload contém `{ sub: usuarioId, email, perfil, empresaId }`
- **Refresh Token**: mesmo payload, assinado com `JWT_REFRESH_SECRET`, validade em `JWT_REFRESH_EXPIRATION` (padrão: 7 dias)
- Ambos assinados com algoritmo configurado (padrão: HS256)
- Tokens retornados ao cliente após sucesso de autenticação

**R-AUTH-005**: Captura de contexto de login
- IP origem extraído de `request.ip` ou header `x-forwarded-for` ou `socket.remoteAddress`
- User-Agent extraído de header de mesmo nome
- Dispositivo detectado automaticamente:
  - "Mobile" se UA contiver: mobile, android, iphone
  - "Tablet" se UA contiver: tablet, ipad
  - "Desktop" caso contrário
- Navegador detectado automaticamente:
  - Edge se contiver: edg/, edge/
  - Chrome se contiver: chrome/ (excluindo edge)
  - Firefox se contiver: firefox/
  - Safari se contiver: safari/ (excluindo chrome)
  - Opera se contiver: opera/, opr/
  - Outro caso contrário

**R-AUTH-006**: Registra TODAS as tentativas de login
- Sucesso: `sucesso=true`, `motivoFalha=null`
- Falha: `sucesso=false`, `motivoFalha` preenchido
- Se falhar registro de auditoria → não bloqueia login (trata com try-catch)
- Erros de auditoria apenas logados no console

### 3.2 Renovação de Token (Refresh)

**R-AUTH-007**: Validação de refresh token
- Token deve ter sido assinado com `JWT_REFRESH_SECRET`
- Se inválido ou expirado → lanza `UnauthorizedException("Token inválido ou expirado")`

**R-AUTH-008**: Validação de estado do usuário no refresh
- Após validar JWT, sistema busca usuário por ID
- Se usuário não existe ou está inativo → lança `UnauthorizedException("Token inválido")`

**R-AUTH-009**: Emissão de novo par de tokens
- Ao renovar, sistema chama `login()` novamente
- Novos access + refresh tokens são gerados
- Não realiza auditoria no refresh (auditoria ocorre apenas no login inicial)

### 3.3 Reset de Senha

**R-AUTH-010**: Solicitar reset (forgot-password)
- Email obrigatório e em formato válido
- Se usuário não encontrado → retorna mensagem genérica: "Se o email existir, você receberá instruções"
- Não diferencia email existente de não existente (segurança contra enumeração)

**R-AUTH-011**: Token de reset
- Gerado com `randomBytes(32).toString('hex')` — 256 bits em hexadecimal
- Válido por **15 minutos** a partir da criação
- Armazenado em `PasswordReset` com `used=false`
- Campo `token` tem índice UNIQUE para evitar duplicatas

**R-AUTH-012**: Envio de email com link de reset
- Link construído como: `${FRONTEND_URL}/auth/reset-password?token=${token}`
- Email contém nome do usuário e link de reset
- Se falhar envio de email → erro propagado (operação não completada)

**R-AUTH-013**: Rejeição se usuário inativo
- Se usuário existe mas está inativo → lanza `BadRequestException("Usuário inativo")`

**R-AUTH-014**: Validação e aplicação do reset (reset-password)
- Token obrigatório
- Nova senha obrigatória com validações (ver seção 4)
- Token deve existir em `PasswordReset`
- Se não encontrado → `BadRequestException("Token inválido ou expirado")`

**R-AUTH-015**: Detecção de reutilização de token
- Se `used=true` → `BadRequestException("Este link já foi utilizado")`

**R-AUTH-016**: Validação de expiração
- Se `now() > expiresAt` → `BadRequestException("Token expirado. Solicite um novo link de recuperação.")`

**R-AUTH-017**: Atualização de senha
- Nova senha é hasheada com Argon2 antes de persistir
- Campo `senha` do usuário é atualizado
- Token marcado como `used=true`
- Email de confirmação enviado ao usuário

**R-AUTH-018**: Fallback em falha de notificação
- Se email de confirmação falhar → erro propagado (não silencia a falha)

### 3.4 Autorização (RBAC)

**R-AUTH-019**: Guard de roles
- `RolesGuard` valida se usuário possui perfil requerido
- Se rota não tem `@Roles()` → acesso permitido (sem restrição)
- Se usuário não autenticado (`!user`) → acesso negado
- Se perfil do usuário não está na lista de roles requeridos → acesso negado

**R-AUTH-020**: Extração de perfil do token
- Perfil extraído do JWT payload como `payload.perfil`
- Comparação case-sensitive com roles requeridas

### Frontend (Implementado)

**F-AUTH-001**: Armazenamento de sessão
- Login salva `accessToken`, `refreshToken` e `usuario` em `localStorage` se "remember" for true; caso contrário, em `sessionStorage`
- Chaves: `access_token`, `refresh_token`, `current_user`
- `currentUser$`: `BehaviorSubject<Usuario|null>` mantido pelo `AuthService`

**F-AUTH-002**: Renovação automática do token
- Timer de 110 minutos renova token chamando `POST /auth/refresh`
- Em falha de refresh, executa `logout()` e limpa armazenamento

**F-AUTH-003**: Customização de login por empresa
- Rota `auth/login/:loginUrl` carrega empresa via `GET /empresas/by-login-url/:loginUrl`
- Se `logoUrl` inicia com `/`, concatena `environment.backendUrl` para exibir
- Em erro, mantém logo padrão `assets/images/logo_reiche_academy.png`

**F-AUTH-004**: Fluxos de Forgot/Reset Password
- Forgot: formulário valida `email` (required + email) e chama `POST /auth/forgot-password`
- Reset: obtém `token` de `queryParams`; valida `novaSenha` com regex idêntica ao backend e confirmação de senha; exibe indicador de força (fraca/média/forte)
- Em sucesso do reset, navega para `/auth/login` após 3s

---

## 4. Validações

### 4.1 LoginDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| email | string | IsEmail() | ✓ |
| senha | string | IsString() | ✓ |

### 4.2 ResetPasswordDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| token | string | IsString() | ✓ |
| novaSenha | string | MinLength(8), Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/) | ✓ |

**Requisitos de nova senha**:
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial (@$!%*?&)

### 4.5 Frontend Forms
- Login: `email` (required + email), `senha` (required + minLength(6)), `remember` (boolean)
- Forgot Password: `email` (required + email)
- Reset Password: `novaSenha` (required + minLength(8) + regex de complexidade), `confirmarSenha` (required), validação de mismatch manual

### 4.3 ForgotPasswordDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| email | string | IsEmail() | ✓ |

### 4.4 RefreshTokenDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| refreshToken | string | IsString() | ✓ |

---

## 5. Comportamentos Condicionais

### 5.1 Fluxo de Login

```
POST /auth/login (email, senha)
  ↓
  ├─ Email válido? (format)
  │  └─ Não → erro de validação
  ├─ Usuário existe com email?
  │  └─ Não → registra LoginHistory (motivoFalha="Credenciais inválidas")
  │        → retorna UnauthorizedException
  ├─ Usuário está ativo?
  │  └─ Não → registra LoginHistory (motivoFalha="Credenciais inválidas")
  │        → retorna UnauthorizedException
  ├─ Senha válida (Argon2)?
  │  └─ Não → registra LoginHistory (motivoFalha="Senha incorreta")
  │        → retorna UnauthorizedException
  └─ ✓ Login bem-sucedido
     ├─ Gera access token
     ├─ Gera refresh token
     ├─ Registra LoginHistory (sucesso=true)
     └─ Retorna { accessToken, refreshToken, usuario }
```

### 5.2 Fluxo de Forgot Password

```
POST /auth/forgot-password (email)
  ↓
  ├─ Email válido?
  │  └─ Não → erro de validação
  ├─ Usuário existe?
  │  └─ Não → retorna mensagem genérica
  ├─ Usuário está ativo?
  │  └─ Não → BadRequestException("Usuário inativo")
  └─ ✓ Token criado e email enviado
     ├─ Gera token aleatório (256 bits hex)
     ├─ Define expiração em +15 minutos
     ├─ Salva PasswordReset
     ├─ Envia email com link
     └─ Retorna mensagem genérica
```

### 5.3 Fluxo de Reset Password

```
POST /auth/reset-password (token, novaSenha)
  ↓
  ├─ Token e senha obrigatórios?
  │  └─ Não → erro de validação
  ├─ Senha válida (política)?
  │  └─ Não → erro de validação
  ├─ Token existe?
  │  └─ Não → BadRequestException
  ├─ Token já foi usado?
  │  └─ Sim → BadRequestException("Este link já foi utilizado")
  ├─ Token expirou?
  │  └─ Sim → BadRequestException("Token expirado...")
  └─ ✓ Senha atualizada
     ├─ Hash nova senha com Argon2
     ├─ Atualiza usuario.senha
     ├─ Marca PasswordReset.used = true
     ├─ Envia email de confirmação
     └─ Retorna mensagem de sucesso
```

### 5.4 Fluxo de Refresh Token

```
POST /auth/refresh (refreshToken)
  ↓
  ├─ Token presente no corpo?
  │  └─ Não → erro de validação
  ├─ JWT assinatura válida (JWT_REFRESH_SECRET)?
  │  └─ Não → UnauthorizedException
  ├─ JWT expirado?
  │  └─ Sim → UnauthorizedException
  ├─ Usuário existe?
  │  └─ Não → UnauthorizedException("Token inválido")
  ├─ Usuário está ativo?
  │  └─ Não → UnauthorizedException("Token inválido")
  └─ ✓ Novo par gerado
     ├─ Chama login(usuario)
     ├─ Gera novo access + refresh
     └─ Retorna nova sessão

### 5.5 Frontend: Renovação Automática

```
AuthService.initializeTokenRefresh()
  ├─ setInterval(110 min)
  ├─ isLoggedIn && refreshToken presente?
  │  └─ Sim → POST /auth/refresh e setSession()
  └─ Em erro → logout()
```
```

---

## 6. Ausências ou Ambiguidades

### 6.1 Segurança

⚠️ **IMPLEMENTAÇÃO DETECTADA**:
- Armazenamento de senha: Argon2 ✓
- HTTPS/TLS: Não verificável em código (responsabilidade de infraestrutura)
- Rate limiting em tentativas de login: **NÃO IMPLEMENTADO**
- Rate limiting em forgot-password: **NÃO IMPLEMENTADO**
- Rate limiting em reset-password: **NÃO IMPLEMENTADO**

⚠️ **GAPS CRÍTICOS**:
1. Nenhuma proteção contra força bruta em login
2. Nenhuma proteção contra abuso de endpoints de reset (alguém pode solicitar reset para múltiplos emails)
3. Tokens não possuem mecanismo de revogação (logout não invalida tokens existentes)
4. Refresh token armazenado apenas em cliente (sem validação adicional no servidor)

### 6.2 Auditoria

**IMPLEMENTADO**:
- Registro de IP e User-Agent
- Detecção de navegador e dispositivo
- Histórico de sucessos e falhas

**NÃO IMPLEMENTADO**:
- Retenção de histórico (sem política de limpeza)
- Alertas para atividades suspeitas (múltiplas falhas, IPs diferentes, etc.)
- Logout (não cancela tokens ativos)

### 6.3 Email

**IMPLEMENTADO**:
- Envio de link de reset
- Envio de confirmação de mudança

**NÃO IMPLEMENTADO**:
- Confirmação de email na criação de conta
- Notificação de login em novo dispositivo
- Autenticação multi-fator (2FA)

### 6.4 Configurações

**EXIGIDAS MAS NÃO VALIDADAS**:
- `JWT_SECRET` — deve existir
- `JWT_REFRESH_SECRET` — deve existir
- `JWT_REFRESH_EXPIRATION` — padrão: 7d
- `FRONTEND_URL` — padrão: http://localhost:4200

Nenhuma validação se essas variáveis existem na inicialização do módulo.

### 6.5 Contexto Multi-tenant

**NÃO ABORDADO EM AUTH**:
- O campo `empresaId` é incluído no JWT mas não há validação de isolamento por tenant
- Qualquer usuário de tenant A pode acessar dados de tenant B se tiver o token
- Validação de multi-tenant deve ser implementada em módulos específicos (empresas, usuarios, etc.)

---

## 7. Endpoints

| Método | Rota | Autenticação | Roles | Descrição |
|--------|------|--------------|-------|-----------|
| POST | `/auth/login` | ❌ | — | Autenticar com email/senha |
| POST | `/auth/refresh` | ❌ | — | Renovar access token |
| POST | `/auth/forgot-password` | ❌ | — | Solicitar reset de senha |
| POST | `/auth/reset-password` | ❌ | — | Aplicar novo reset de senha |

---

## 8. Dependências

- **NestJS** (`@nestjs/common`, `@nestjs/jwt`, `@nestjs/config`)
- **Passport** (`@nestjs/passport`, `passport-jwt`, `passport-local`)
- **Argon2** para hashing de senha
- **Prisma** para persistência
- **EmailService** para notificações

---

## Resumo Executivo

✅ **Autenticação local robusta** com hashing Argon2 e validação forte de senha  
✅ **JWT com refresh tokens** para sessões estendidas  
✅ **Reset de senha seguro** com tokens temporários e expiração  
✅ **Auditoria de tentativas** com contexto de IP, dispositivo, navegador  

⚠️ **Não implementado**: Rate limiting, revogação de tokens, 2FA, confirmação de email  
⚠️ **Gap crítico**: Multi-tenant validation não ocorre em AUTH (delegada a outros módulos)
