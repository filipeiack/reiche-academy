# Arquitetura do Backend

**Última atualização:** 2025-12-23  
**Status:** Factual (baseado em código existente)

---

## Propósito deste Documento

Descrever a arquitetura do backend da aplicação Reiche Academy,
baseando-se EXCLUSIVAMENTE no código existente em `backend/`.

Este documento é **descritivo**, não prescritivo.

---

## Stack Tecnológica

| Tecnologia | Versão/Detalhe | Onde aparece |
|------------|---------------|--------------|
| Runtime | Node.js | `backend/package.json` |
| Framework | NestJS | `backend/src/main.ts`, `backend/src/app.module.ts` |
| Linguagem | TypeScript | `backend/tsconfig.json` |
| ORM | Prisma | `backend/prisma/schema.prisma` |
| Banco de Dados | PostgreSQL | `backend/prisma/schema.prisma` (provider) |
| Autenticação | JWT (@nestjs/jwt) | Identificado nos módulos |
| Hash de Senhas | Argon2 | Identificado no contexto |
| Validação | class-validator + class-transformer | `backend/src/main.ts` (ValidationPipe) |
| Rate Limiting | @nestjs/throttler | `backend/src/app.module.ts` (ThrottlerModule) |
| Documentação | Swagger (@nestjs/swagger) | `backend/src/main.ts` |
| Segurança HTTP | Helmet | `backend/src/main.ts` |
| Compressão | compression | `backend/src/main.ts` |

**Onde aparece:** `backend/package.json`, `backend/src/main.ts`, `backend/src/app.module.ts`

---

## Entry Point

**Arquivo:** `backend/src/main.ts` (114 linhas)

### Configurações Aplicadas

```typescript
// Resumo factual do main.ts:

- ValidationPipe global:
  - whitelist: true
  - forbidNonWhitelisted: true
  - transform: true

- Middlewares de segurança:
  - Helmet (HTTP security headers)
  - CORS habilitado
  - Compression

- Swagger:
  - Rota: /api/docs
  - Título/descrição configurados

- Arquivos estáticos:
  - Path: /public
  - CORS habilitado para assets

- Servidor:
  - Host: 0.0.0.0
  - Porta: 3000 (padrão)
  - Global prefix: /api
```

**Onde aparece:** `backend/src/main.ts`

---

## Módulos Registrados

**Root Module:** `backend/src/app.module.ts`

| Módulo | Tipo | Responsabilidade Presumida |
|--------|------|---------------------------|
| ConfigModule | Infraestrutura | Gerenciamento de variáveis de ambiente |
| ThrottlerModule | Segurança | Rate limiting (60s, 10 req) |
| PrismaModule | Infraestrutura | Conexão com banco de dados |
| AuthModule | Negócio | Autenticação e autorização |
| UsuariosModule | Negócio | CRUD de usuários |
| EmpresasModule | Negócio | CRUD de empresas |
| PilaresModule | Negócio | CRUD de pilares |
| PilaresEmpresaModule | Negócio | Relação pilares-empresas |
| RotinasModule | Negócio | CRUD de rotinas |
| DiagnosticosModule | Negócio | Funcionalidade de diagnósticos |
| AuditModule | Negócio | Registro de auditoria |
| PerfisModule | Negócio | CRUD de perfis de usuário |

**ThrottlerModule configuração:**
- TTL: 60000ms (60 segundos)
- Limit: 10 requests

**Onde aparece:** `backend/src/app.module.ts`

---

## Estrutura de um Módulo de Negócio

Padrão identificado (consistente em todos os módulos):

```
backend/src/modules/{nome-modulo}/
├── {nome-modulo}.controller.ts    # Endpoints REST
├── {nome-modulo}.service.ts       # Lógica de negócio
└── dto/                           # Data Transfer Objects
    ├── create-{entidade}.dto.ts
    ├── update-{entidade}.dto.ts
    └── (outros DTOs conforme necessidade)
```

**Responsabilidades:**

- **Controller:** Define endpoints, aplica guards, chama services
- **Service:** Implementa regras de negócio, interage com Prisma
- **DTOs:** Definem contratos de entrada/saída com validações

**Onde aparece:** `backend/src/modules/` (estrutura de diretórios)

---

## Segurança

### Autenticação

**Mecanismo:** JWT (JSON Web Tokens)

**Não identificado no código:**
- Estratégia de refresh token
- Tempo de expiração do token
- Secret key (presumivelmente em variáveis de ambiente)

**Onde deveria aparecer:** `backend/src/modules/auth/`, variáveis de ambiente

### Autorização

**Guards presumidos:**
- JwtAuthGuard (autenticação)
- RolesGuard ou similar (controle de acesso por perfil)

**Perfis identificados no banco:**
- PerfilUsuario.nivel (tipo String, presumivelmente armazena papel/role)

**Onde aparece:**
- Controllers (decorators de guards)
- `backend/prisma/schema.prisma` (PerfilUsuario)

### Hash de Senhas

**Biblioteca:** Argon2

**Onde aparece:** Identificado no contexto de segurança (implementação presumida no AuthModule)

### Rate Limiting

**Configuração global:**
- 10 requisições por 60 segundos

**Onde aparece:** `backend/src/app.module.ts` (ThrottlerModule)

### Validação de Dados

**ValidationPipe global:**
- `whitelist: true` — Remove propriedades não definidas no DTO
- `forbidNonWhitelisted: true` — Rejeita requisições com propriedades extras
- `transform: true` — Transforma payloads para tipos do DTO

**Onde aparece:** `backend/src/main.ts`

---

## Persistência de Dados

### ORM: Prisma

**Schema location:** `backend/prisma/schema.prisma`

**Database provider:** PostgreSQL

**Funcionalidades identificadas:**
- Migrations em `backend/prisma/migrations/`
- Seed script em `backend/prisma/seed.ts`

### PrismaService

**Presumivelmente:**
- Módulo global (PrismaModule) injetado nos services
- Gerencia conexão com banco
- Expõe client Prisma para queries

**Onde aparece:** `backend/src/app.module.ts` (PrismaModule importado)

---

## API REST

### Estrutura de Endpoints

**Base URL:** `/api`

**Padrão presumido por módulo:**

```
GET    /api/{recurso}          # Listar todos
GET    /api/{recurso}/:id      # Buscar por ID
POST   /api/{recurso}          # Criar
PATCH  /api/{recurso}/:id      # Atualizar parcialmente
DELETE /api/{recurso}/:id      # Deletar
```

**Exceções/Endpoints específicos:** Não mapeados neste documento (ver API_ENDPOINTS.md)

**Onde aparece:**
- `backend/src/main.ts` (global prefix)
- Controllers de cada módulo

---

## Documentação da API

**Ferramenta:** Swagger (OpenAPI)

**URL:** `http://localhost:3000/api/docs`

**Configuração:**
- Título e descrição definidos
- Geração automática via decorators do @nestjs/swagger

**Onde aparece:** `backend/src/main.ts`

---

## Arquivos Estáticos

**Path público:** `/public`

**Uso identificado:**
- Imagens (logos, avatares)
- Diretório: `backend/public/images/`

**CORS:** Habilitado para assets estáticos

**Onde aparece:**
- `backend/src/main.ts` (configuração de serving)
- `backend/public/images/`

---

## Scripts Utilitários

Identificados em `backend/scripts/`:

| Script | Finalidade Presumida |
|--------|---------------------|
| check-empresas.ts | Verificação de dados de empresas |
| check-user.ts | Verificação de dados de usuários |

**Não identificado:**
- Como executar esses scripts
- Dependências específicas

**Onde aparece:** `backend/scripts/`

---

## Auditoria

**Módulo:** AuditModule

**Modelo de dados:** AuditLog (identificado em `backend/prisma/schema.prisma`)

**Campos presumidos:**
- Usuário que realizou ação
- Tipo de ação
- Timestamp
- Detalhes adicionais

**Implementação:** Não mapeada neste documento

**Onde aparece:**
- `backend/src/app.module.ts` (AuditModule)
- `backend/prisma/schema.prisma` (modelo AuditLog)

---

## Configuração de Ambiente

**ConfigModule:** Importado como global no AppModule

**Não identificado:**
- Arquivo `.env` ou `.env.example`
- Variáveis de ambiente específicas
- Validação de env vars

**Onde deveria aparecer:** `backend/.env`, `backend/src/config/`

---

## Build e Execução

**TypeScript configs:**
- `backend/tsconfig.json` — Configuração base
- `backend/tsconfig.build.json` — Configuração de build

**NestJS CLI config:**
- `backend/nest-cli.json`

**Scripts presumidos (não verificados):**
- `npm run start` — Execução dev
- `npm run build` — Build para produção
- `npm run start:prod` — Execução produção

**Onde aparecem:**
- `backend/package.json` (scripts)
- Arquivos de configuração TypeScript e NestJS

---

## Testes

**Framework:** Jest (padrão NestJS)

**Estrutura presumida:**
- Testes unitários: `*.spec.ts` junto aos arquivos de código
- Testes E2E: `test/` directory (padrão NestJS)

**Não identificado:**
- Cobertura de testes atual
- Configuração de testes

**Onde deveria aparecer:**
- `backend/package.json` (scripts de teste)
- `backend/test/`
- Arquivos `*.spec.ts`

---

## Diagramas

**Localização:** `backend/diagrams/`

**Conteúdo identificado:**
- `erd.mmd` — Entity Relationship Diagram (Mermaid)
- `README.md` — Documentação dos diagramas

**Onde aparece:** `backend/diagrams/`

---

## Limitações deste Documento

Este documento NÃO cobre:

- Implementação detalhada de cada módulo de negócio
- Lógica específica de services
- Detalhes de DTOs e validações específicas
- Estratégias de cache (Redis configurado, mas uso não mapeado)
- Logging e monitoramento
- Processamento assíncrono (jobs, queues)
- Integração com serviços externos
- Configurações de ambiente (variáveis não mapeadas)
- Estratégia de migrations e versionamento de schema
- Testes (estrutura e cobertura)
- Deploy e CI/CD

Para informações específicas de endpoints e contratos, ver:
- `backend/API_ENDPOINTS.md`

Para modelo de dados detalhado, ver:
- [Data Architecture](data.md)
- `backend/DATA_MODEL.md`

---

## Documentos Relacionados

- [Architecture Overview](architecture.md)
- [Data Architecture](data.md)
- [Backend Conventions](../conventions/backend.md)
- `backend/API_ENDPOINTS.md`
- `backend/DATA_MODEL.md`

---

**Princípio:** Este documento reflete o código existente. Não prescreve arquitetura ideal.
