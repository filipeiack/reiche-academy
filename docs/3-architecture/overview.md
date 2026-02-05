# Visão Geral da Arquitetura

**Última atualização:** 2026-02-04  
**Status:** Documentação consolidada (baseado em código existente)

---

## Propósito deste Documento

Apresentar uma visão unificada e de alto nível da arquitetura do sistema Reiche Academy,
servindo como fonte única da verdade para decisões arquitetônicas e stack tecnológico.

Este documento é **descritivo**, refletindo o estado atual do código, e serve como
ponto de entrada para documentações específicas mais detalhadas.

---

## 1. Visão Geral do Sistema

Reiche Academy é um sistema PDCA (Plan-Do-Check-Act) de gestão organizacional
implementado como aplicação web com arquitetura cliente-servidor tradicional.

### Arquitetura de Alto Nível

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Angular)                        │
│  • SPA com Standalone Components                             │
│  • Guards: authGuard, adminGuard                            │
│  • Lazy Loading de módulos                                  │
│  • Estado: Services + BehaviorSubject                       │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST + JWT
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (NestJS)                          │
│  • API REST com Swagger                                     │
│  • Controllers → Services → Prisma ORM                      │
│  • Autenticação JWT + Argon2                                 │
│  • Rate Limiting (10 req/60s)                               │
│  • Validação global (ValidationPipe)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │ Prisma ORM
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  BANCO DE DADOS                              │
│  • PostgreSQL (principal)                                   │
│  • Redis (cache)                                            │
└─────────────────────────────────────────────────────────────┘
```

### Contexto de Negócio

- **Multi-tenant**: Isolamento por `empresaId`
- **RBAC**: 4 perfis hierárquicos (ADMINISTRADOR > GESTOR > COLABORADOR > LEITURA)
- **PDCA**: Ciclo de gestão contínua através de Pilares → Rotinas → Ações
- **Auditoria**: Registro completo de ações do usuário

---

## 2. Stack Tecnológico Consolidado

### Backend (NestJS)

| Componente | Tecnologia | Versão/Detalhes | Onde aparece |
|------------|------------|----------------|--------------|
| Runtime | Node.js | LTS | `backend/package.json` |
| Framework | NestJS | 10+ | `backend/src/main.ts`, `backend/src/app.module.ts` |
| Linguagem | TypeScript | 5.x | `backend/tsconfig.json` |
| ORM | Prisma | Client | `backend/prisma/schema.prisma` |
| Banco de Dados | PostgreSQL | 16 (via Docker) | `docker-compose.yml` |
| Autenticação | JWT | Access + Refresh | `backend/src/modules/auth/` |
| Hash de Senhas | Argon2 | - | AuthModule |
| Validação | class-validator | Global ValidationPipe | `backend/src/main.ts` |
| Rate Limiting | @nestjs/throttler | 10 req/60s | `backend/src/app.module.ts` |
| Documentação | Swagger | OpenAPI 3.0 | `backend/src/main.ts` |
| Segurança HTTP | Helmet | Middleware | `backend/src/main.ts` |
| Compressão | compression | Middleware | `backend/src/main.ts` |
| Cache | Redis | 7-alpine | `docker-compose.yml` |

### Frontend (Angular)

| Componente | Tecnologia | Versão/Detalhes | Onde aparece |
|------------|------------|----------------|--------------|
| Framework | Angular | 18+ | `frontend/package.json`, `frontend/angular.json` |
| Linguagem | TypeScript | 5.x | `frontend/tsconfig.json` |
| Arquitetura | Standalone Components | - | Estrutura de componentes |
| Template Base | NobleUI Angular | Bootstrap 5 | `frontend/package.json` |
| UI Components | ng-bootstrap | - | `frontend/package.json` |
| Forms | Reactive Forms | FormBuilder | Componentes de formulário |
| HTTP | HttpClient | RxJS Observables | Services |
| Estado | Services | BehaviorSubject | Sem NgRx |
| Internacionalização | Custom | JSON + Pipe | `frontend/src/assets/i18n/` |
| Feedback | SweetAlert2 | Toasts/Modals | Componentes |
| Ícones | Feather Icons | - | Templates |
| Detalhes | NgbOffcanvas | - | Componentes |
| Testes E2E | Playwright | - | `frontend/playwright.config.ts` |

### Dados e Cache

| Componente | Tecnologia | Configuração | Onde aparece |
|------------|------------|--------------|--------------|
| SGBD Principal | PostgreSQL | Porta 5432 | `docker-compose.yml` |
| Cache | Redis | Porta 6379 | `docker-compose.yml` |
| ORM | Prisma | Type-safe queries | `backend/prisma/schema.prisma` |
| Migrations | Prisma | Versionamento | `backend/prisma/migrations/` |

### Infraestrutura

| Componente | Tecnologia | Finalidade | Onde aparece |
|------------|------------|------------|--------------|
| Orquestração | Docker Compose | Dev local | `docker-compose.yml` |
| Build | Docker | Multi-stage | `backend/Dockerfile`, `frontend/Dockerfile` |
| Volumes | Named volumes | Persistência | `docker-compose.yml` |
| Rede | Bridge | Comunicação | `docker-compose.yml` |

---

## 3. Integrações Frontend/Backend

### Comunicação HTTP

**Base URL:** `http://localhost:3000/api` (desenvolvimento)

**Padrão de Endpoints:**
```
GET    /api/{recurso}          # Listar todos
GET    /api/{recurso}/:id      # Buscar por ID
POST   /api/{recurso}          # Criar
PATCH  /api/{recurso}/:id      # Atualizar parcialmente
DELETE /api/{recurso}/:id      # Soft delete (ativo: false)
```

### Autenticação e Autorização

**Frontend:**
- Guards funcionais: `authGuard`, `adminGuard`
- Storage: `localStorage` (remember me) ou `sessionStorage`
- Interceptor HTTP para adicionar JWT

**Backend:**
- `JwtAuthGuard` + `RolesGuard`
- Profile elevation protection
- Multi-tenant validation por `empresaId`

### Fluxo de Dados Típico

```
Component (Angular) 
    ↓ HTTP (Observable)
Service (HttpClient)
    ↓ JWT Authorization
API Controller (NestJS)
    ↓ Business Rules
Service (NestJS)
    ↓ Prisma Client
PostgreSQL
```

---

## 4. Princípios e Decisões Arquitetônicas

### Decisões Chave

| Decisão | Racional | Impacto |
|---------|-----------|---------|
| **Standalone Components** | Angular 18+ pattern | Menos boilerplate, melhor tree-shaking |
| **Prisma ORM** | Type-safe, excelente DX | Menos erros SQL, migrations automatizadas |
| **JWT com Refresh** | Stateless, scalability | Auth sem sessão no servidor |
| **Argon2 vs Bcrypt** | Resistência a GPU/ASIC | Maior segurança para hashes |
| **Soft Delete Padrão** | Auditoria, recuperação | `ativo: false` em vez de DELETE |
| **Multi-tenant por empresaId** | Isolamento de dados | ADMINISTRADOR tem acesso global |
| **RBAC Hierárquico** | Simples de entender | Níveis fixos, sem herança complexa |
| **Docker Compose** | Consistência dev/prod | Ambiente replicável |
| **SweetAlert2** | UX consistente | Feedback visual uniforme |

### Princípios Orientadores

1. **Type Safety**: TypeScript + Prisma em todo o stack
2. **Convention over Configuration**: Padrões bem definidos
3. **Security First**: Helmet, rate limiting, Argon2, RBAC
4. **Developer Experience**: Hot reload, documentação automática
5. **Auditability**: Logs completos, soft delete, timestamps

---

## 5. Módulos de Negócio

### Backend Modules (NestJS)

```
AuthModule           # Autenticação, JWT, refresh tokens
UsuariosModule       # CRUD de usuários
EmpresasModule       # CRUD de empresas (multi-tenant)
PilaresModule        # PDCA: Pilares de gestão
RotinasModule        # PDCA: Rotinas dos pilares
DiagnosticosModule   # Avaliações e diagnósticos
AuditModule          # Auditoria de ações
PerfisModule         # Gestão de RBAC
```

### Frontend Features (Angular)

```
Auth                 # Login, register, forgot password
Dashboard            # Visão geral do PDCA
Usuários             # Gestão de usuários
Empresas             # Gestão de empresas
Pilares              # Configuração de pilares
Rotinas              # Gestão de rotinas
Relatórios           # Diagnósticos e métricas
```

---

## 6. Referências para Detalhes Específicos

### Documentação Detalhada

| Tópico | Documento | Descrição |
|--------|-----------|-----------|
| **Backend** | [backend.md](./backend.md) | Arquitetura NestJS, módulos, endpoints |
| **Frontend** | [frontend.md](./frontend.md) | Arquitetura Angular, componentes, rotas |
| **Dados** | [data.md](./data.md) | Modelo de dados, schema Prisma, relacionamentos |
| **Infraestrutura** | [infrastructure.md](./infrastructure.md) | Docker, deploy, CI/CD, ambientes |
| **Convenções** | [../conventions/](../conventions/) | Padrões de código, naming, git |
| **Regras de Negócio** | [../business-rules/](../business-rules/) | Regras específicas do PDCA e RBAC |

### Código Fonte

| Componente | Localização |
|------------|-------------|
| Backend API | `backend/src/` |
| Frontend SPA | `frontend/src/` |
| Schema Prisma | `backend/prisma/schema.prisma` |
| Docker Config | `docker-compose.yml` |
| Migrations | `backend/prisma/migrations/` |

---

## 7. Evolução e Manutenção

### Versionamento

- **Backend**: Semântico via package.json
- **Frontend**: Semântico via package.json
- **API**: Versionamento via path (`/api/v1/`)
- **Database**: Versionamento via Prisma migrations

### Ciclo de Vida

1. **Development**: Docker Compose local
2. **Testing**: Unit + Integration + E2E
3. **Staging**: Ambiente homologação
4. **Production**: Deploy via CI/CD

### Monitoramento

- **Logs**: NestJS Logger + Audit trails
- **Performance**: Redis cache + query optimization
- **Errors**: Global exception handlers

---

## Limitações deste Documento

Este documento NÃO substitui a documentação detalhada:

- Para implementação específica de módulos → [backend.md](./backend.md)
- Para detalhes de componentes → [frontend.md](./frontend.md)
- Para schema completo → [data.md](./data.md)
- Para setup de ambiente → [infrastructure.md](./infrastructure.md)
- Para regras de negócio → [../business-rules/](../business-rules/)

---

## Documentos Relacionados

- [Backend Architecture](./backend.md)
- [Frontend Architecture](./frontend.md)
- [Data Architecture](./data.md)
- [Infrastructure Architecture](./infrastructure.md)
- [Backend Conventions](../conventions/backend.md)
- [Frontend Conventions](../conventions/frontend.md)
- [Naming Conventions](../conventions/naming.md)
- [FLOW.md](../FLOW.md) (Processo de desenvolvimento)

---

**Princípio**: Este documento reflete o estado atual do sistema e serve como ponto central de entrada para a arquitetura do Reiche Academy.