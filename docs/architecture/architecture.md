# Arquitetura do Sistema — Visão Geral

**Última atualização:** 2025-12-23  
**Status:** Factual (baseado em código existente)

---

## Propósito deste Documento

Apresentar a visão de alto nível da arquitetura do sistema Reiche Academy,
incluindo stack tecnológica, estrutura de camadas e principais componentes.

Este documento é **descritivo**, refletindo o estado atual do código.

---

## Stack Tecnológica

### Backend

| Componente | Tecnologia | Onde aparece |
|------------|------------|--------------|
| Runtime | Node.js | `backend/package.json` |
| Framework | NestJS | `backend/src/main.ts`, `backend/src/app.module.ts` |
| Linguagem | TypeScript | `backend/tsconfig.json` |
| ORM | Prisma | `backend/prisma/schema.prisma` |
| Validação | class-validator, class-transformer | `backend/src/main.ts` (ValidationPipe global) |
| Autenticação | JWT (via @nestjs/jwt) | Módulos de autenticação |
| Hash de Senhas | Argon2 | Identificado no contexto de segurança |
| Rate Limiting | ThrottlerModule | `backend/src/app.module.ts` |
| Documentação API | Swagger | `backend/src/main.ts` (configurado em `/api/docs`) |

### Frontend

| Componente | Tecnologia | Onde aparece |
|------------|------------|--------------|
| Framework | Angular 18+ | `frontend/angular.json`, `frontend/package.json` |
| Arquitetura | Standalone Components | Estrutura de componentes identificada |
| Linguagem | TypeScript | `frontend/tsconfig.json` |
| Routing | Angular Router | Guards e lazy loading identificados |
| Estilização | (Não identificado framework específico) | — |
| Testes E2E | Playwright | `frontend/playwright.config.ts` |

### Banco de Dados

| Componente | Tecnologia | Onde aparece |
|------------|------------|--------------|
| SGBD | PostgreSQL | `backend/prisma/schema.prisma` |
| Cache | Redis | `docker-compose.yml` (porta 6379) |

### Infraestrutura

| Componente | Tecnologia | Onde aparece |
|------------|------------|--------------|
| Orquestração | Docker Compose | `docker-compose.yml` |
| Volumes | redis_data | `docker-compose.yml` |

**Nota:** PostgreSQL aparece comentado no `docker-compose.yml`. Não está claro se é executado via Docker ou ambiente externo.

---

## Arquitetura de Camadas

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Angular SPA)            │
│  - Standalone Components                    │
│  - Guards: authGuard, adminGuard            │
│  - Lazy Loading de rotas                    │
└─────────────────┬───────────────────────────┘
                  │ HTTP/REST
                  ▼
┌─────────────────────────────────────────────┐
│         BACKEND (NestJS API)                │
│  - Controllers                              │
│  - Services                                 │
│  - DTOs + Validation                        │
│  - Guards JWT                               │
│  - ThrottlerModule (rate limiting)          │
│  - Swagger docs (/api/docs)                 │
└─────────────────┬───────────────────────────┘
                  │ Prisma ORM
                  ▼
┌─────────────────────────────────────────────┐
│        BANCO DE DADOS (PostgreSQL)          │
│  - Models: Usuario, Empresa, Pilar, etc.    │
│  - Migrations (Prisma)                      │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│            CACHE (Redis)                    │
│  - Porta 6379                               │
│  - Volume persistente: redis_data           │
└─────────────────────────────────────────────┘
```

**Onde aparece:**
- Estrutura de pastas: `backend/src/modules/`, `frontend/src/`
- Configurações: `backend/src/main.ts`, `docker-compose.yml`

---

## Módulos de Negócio

Identificados em `backend/src/app.module.ts`:

| Módulo | Responsabilidade Presumida |
|--------|---------------------------|
| AuthModule | Autenticação e autorização |
| UsuariosModule | Gerenciamento de usuários |
| EmpresasModule | Gerenciamento de empresas |
| PilaresModule | Gerenciamento de pilares |
| PilaresEmpresaModule | Relação pilares-empresas |
| RotinasModule | Gerenciamento de rotinas |
| DiagnosticosModule | Funcionalidade de diagnósticos |
| AuditModule | Registro de auditoria |
| PerfisModule | Gerenciamento de perfis de usuário |

Cada módulo possui:
- Controller (endpoint REST)
- Service (lógica de negócio)
- DTOs (validação de entrada/saída)

**Onde aparece:** `backend/src/app.module.ts`, `backend/src/modules/`

---

## Segurança

### Backend

| Mecanismo | Implementação | Onde aparece |
|-----------|--------------|--------------|
| CORS | Habilitado | `backend/src/main.ts` |
| Helmet | Middleware de segurança HTTP | `backend/src/main.ts` |
| Compression | Compressão de respostas | `backend/src/main.ts` |
| Validation Pipe | Global, whitelist, forbidNonWhitelisted | `backend/src/main.ts` |
| Rate Limiting | ThrottlerModule (60s, 10 req) | `backend/src/app.module.ts` |
| Hash de Senha | Argon2 | Identificado no contexto |
| Autenticação | JWT | Módulos de autenticação |

### Frontend

| Mecanismo | Implementação | Onde aparece |
|-----------|--------------|--------------|
| Route Guards | authGuard, adminGuard | Estrutura de rotas identificada |
| Lazy Loading | Módulos carregados sob demanda | Estrutura de rotas identificada |

**Onde aparece:**
- `backend/src/main.ts` (configuração de segurança)
- Frontend: guards identificados na análise

---

## API REST

**Base URL:** `http://localhost:3000/api`

**Documentação:** Swagger disponível em `http://localhost:3000/api/docs`

**Configuração:**
- Prefix global: `/api`
- Host: `0.0.0.0`
- Porta: `3000`

**Onde aparece:** `backend/src/main.ts`

---

## Arquivos Estáticos

**Backend serve arquivos estáticos:**
- Path: `/public`
- CORS habilitado para assets
- Uso: imagens (ex: logos, avatares)

**Onde aparece:**
- `backend/src/main.ts`
- `backend/public/images/`

---

## Estrutura de Pastas

### Backend

```
backend/
├── src/
│   ├── main.ts              # Entry point, configuração global
│   ├── app.module.ts        # Root module
│   ├── common/              # Recursos compartilhados
│   ├── config/              # Configurações
│   └── modules/             # Módulos de negócio
├── prisma/
│   ├── schema.prisma        # Definição do modelo de dados
│   ├── seed.ts              # Seed de dados
│   └── migrations/          # Migrations do Prisma
├── public/                  # Arquivos estáticos (imagens)
└── scripts/                 # Scripts utilitários
```

### Frontend

```
frontend/
└── src/
    ├── core/                # Funcionalidades centrais
    ├── shared/              # Componentes/serviços compartilhados
    └── views/
        ├── layout/          # Componentes de layout
        ├── pages/           # Páginas principais
        └── partials/        # Componentes parciais
```

**Onde aparece:** Estrutura de diretórios do workspace

---

## Internacionalização

**Frontend:**
- Arquivo de tradução identificado: `frontend/src/assets/i18n/pt-BR.json`
- Idioma padrão: Português do Brasil

**Não identificado:**
- Biblioteca i18n específica (ex: ngx-translate)
- Outros idiomas disponíveis

---

## Testes

| Tipo | Tecnologia | Onde aparece |
|------|------------|--------------|
| Backend Unit/Integration | Jest (presumido) | Padrão NestJS |
| Frontend Unit | Jasmine (presumido) | Padrão Angular |
| Frontend E2E | Playwright | `frontend/playwright.config.ts` |

**Task disponível:**
- `frontend:e2e`: executa testes Playwright

**Onde aparece:**
- `frontend/playwright.config.ts`
- Task definition no workspace

---

## Build e Deploy

**Não identificado no código:**
- Scripts de build para produção
- Configurações de CI/CD
- Estratégia de deploy
- Variáveis de ambiente

**Onde deveria aparecer:** `package.json` (scripts), `.github/workflows/`, `.env`

---

## Limitações deste Documento

- Não descreve fluxos de dados específicos entre módulos
- Não detalha estratégias de cache (Redis configurado, mas uso não mapeado)
- Não cobre configuração de ambientes (dev/staging/prod)
- Não descreve estratégia de logging
- Não detalha processamento assíncrono (filas, workers)
- PostgreSQL no Docker Compose está comentado (ambiente de execução real não claro)

---

## Documentos Relacionados

- [Backend Architecture](backend.md) — Detalhes do NestJS, módulos e endpoints
- [Frontend Architecture](frontend.md) — Detalhes do Angular, componentes e rotas
- [Data Architecture](data.md) — Detalhes do modelo de dados Prisma
- [Backend Conventions](../conventions/backend.md) — Padrões de código backend
- [Frontend Conventions](../conventions/frontend.md) — Padrões de código frontend

---

**Princípio:** Este documento reflete o código existente. Não prescreve arquitetura ideal.
