# Arquitetura do Sistema Reiche Academy

**Última atualização:** 2026-02-04  
**Status:** Documentação consolidada e organizada

---

## Visão Geral

Esta seção contém a documentação completa da arquitetura do sistema Reiche Academy, organizada de forma hierárquica para eliminar duplicações e proporcionar uma fonte única da verdade para decisões arquitetônicas.

### Organização dos Documentos

```
docs/3-architecture/
├── README.md              # Este arquivo - guia de navegação
├── overview.md            # Visão geral, stack tecnológico consolidado
├── backend.md             # Arquitetura detalhada do backend (NestJS)
├── frontend.md            # Arquitetura detalhada do frontend (Angular)
├── data.md                # Arquitetura de dados (Prisma, PostgreSQL)
└── infrastructure.md       # Docker, deploy, CI/CD, monitoramento
```

### Como Usar Esta Documentação

#### 1. **Para Visão Geral Rápida**
- Leia [overview.md](./overview.md) → Stack tecnológico, integrações, princípios

#### 2. **Para Implementação Específica**
- Backend development → [backend.md](./backend.md)
- Frontend development → [frontend.md](./frontend.md)
- Database queries → [data.md](./data.md)
- Deploy/Operations → [infrastructure.md](./infrastructure.md)

#### 3. **Para Onboarding**
1. Comece com [overview.md](./overview.md) para entender o sistema
2. Leia [backend.md](./backend.md) ou [frontend.md](./frontend.md) conforme sua área
3. Consulte [infrastructure.md](./infrastructure.md) para setup do ambiente
4. Use [data.md](./data.md) para entender o modelo de dados

---

## Stack Tecnológico Consolidado

### Backend (NestJS)
- **Runtime**: Node.js 18+
- **Framework**: NestJS 10+
- **Database**: PostgreSQL 16 + Prisma ORM
- **Auth**: JWT (Access + Refresh) + Argon2
- **Cache**: Redis 7
- **Validation**: class-validator + ValidationPipe
- **Documentation**: Swagger/OpenAPI
- **Rate Limiting**: @nestjs/throttler

### Frontend (Angular)
- **Framework**: Angular 18+ (Standalone Components)
- **Template**: NobleUI (Bootstrap 5)
- **Forms**: Reactive Forms + FormBuilder
- **HTTP**: HttpClient + RxJS Observables
- **State**: Services + BehaviorSubject
- **UI Components**: ng-bootstrap, ng-select
- **Feedback**: SweetAlert2
- **Tests**: Playwright (E2E)

### Infrastructure
- **Containerização**: Docker + Docker Compose
- **Database**: PostgreSQL (volume persistente)
- **Cache**: Redis (volume persistente)
- **Network**: Bridge network isolada
- **Build**: Multi-stage Dockerfiles
- **CI/CD**: GitHub Actions

---

## Integrações e Fluxos

### Comunicação Frontend/Backend
```
Component Angular → HTTP Service → NestJS Controller → Service → Prisma → PostgreSQL
```

### Autenticação e Autorização
```
Login → JWT (Access + Refresh) → Guards (auth + roles) → Multi-tenant (empresaId)
```

### Deploy Pipeline
```
Git Push → CI/CD → Docker Build → Testes → Deploy → Health Checks → Monitoring
```

---

## Padrões e Convenções

### Backend Patterns
- **Modules**: Controller → Service → DTO pattern
- **Validation**: Global ValidationPipe + class-validator
- **Security**: JWT + Argon2 + Rate limiting
- **Error Handling**: NestJS exceptions + audit logging
- **Database**: Soft delete padrão (ativo: false)

### Frontend Patterns
- **Components**: Standalone + lazy loading
- **Forms**: Reactive forms com FormBuilder
- **State**: Services + BehaviorSubject (sem NgRx)
- **Routing**: Functional guards + lazy loading
- **UI**: Bootstrap 5 + ng-bootstrap + SweetAlert2

### Infrastructure Patterns
- **Containers**: Multi-stage Docker builds
- **Volumes**: Named volumes para persistência
- **Network**: Bridge networks isoladas
- **Health**: Health checks para serviços críticos
- **Environment**: Environment variables + .env files

---

## Arquitetura de Dados

### Modelo Principal
- **Multi-tenant**: Isolamento por `empresaId`
- **RBAC**: 4 perfis hierárquicos (ADMINISTRADOR > GESTOR > COLABORADOR > LEITURA)
- **PDCA**: Empresa → Pilares → Rotinas → Ações
- **Auditoria**: Logs completos com timestamps
- **Soft Delete**: Padrão `ativo: false`

### Relacionamentos Chave
```
PerfilUsuario 1 ── N Usuario N ── 1 Empresa
                                    │
                                    │ N
                                    │
                                    │ 1
                               PilarEmpresa N ── 1 Pilar 1 ── N Rotina
```

---

## Ambientes e Deploy

### Desenvolvimento Local
```bash
# Start all services
docker-compose up -d

# Run migrations
cd backend && npm run migration:dev

# Start development servers
npm run dev  # Backend (porta 3000)
npm start    # Frontend (porta 4200)
```

### Produção
- **Containers**: Multi-stage builds otimizados
- **Networks**: Isoladas e seguras
- **Volumes**: Persistência garantida
- **Health Checks**: Monitoramento contínuo
- **Backup**: Automatizado com retention policy

---

## Documentação Complementar

### Convenções de Código
- [../conventions/backend.md](../conventions/backend.md) - Padrões NestJS
- [../conventions/frontend.md](../conventions/frontend.md) - Padrões Angular
- [../conventions/naming.md](../conventions/naming.md) - Nomenclatura

### Regras de Negócio
- [../business-rules/](../business-rules/) - Regras específicas do PDCA e RBAC

### Processos
- [../FLOW.md](../FLOW.md) - Processo de desenvolvimento
- [../DOCUMENTATION_AUTHORITY.md](../DOCUMENTATION_AUTHORITY.md) - Hierarquia da documentação

---

## Evolução da Documentação

### v2.0 (Consolidada) - 2026-02-04
✅ Eliminada duplicação de stack tecnológico  
✅ Organização hierárquica clara  
✅ Fonte única da verdade para arquitetura  
✅ Referências cruzadas consistentes  

### v1.0 (Fragmentada) - 2025-12-23
❌ Stack duplicado em múltiplos arquivos  
❌ Informações inconsistentes entre documentos  
❌ Falta de visão geral unificada  
❌ Dificuldade de navegação  

---

## Guia de Navegação Rápida

| O que você procura? | Onde ler? |
|---------------------|-----------|
| **Stack tecnológico completo** | [overview.md](./overview.md#2-stack-tecnológico-consolidado) |
| **Como criar novo endpoint** | [backend.md](./backend.md#8-api-rest-patterns) |
| **Como criar novo componente** | [frontend.md](./frontend.md#2-arquitetura-de-componentes) |
| **Modelo de dados completo** | [data.md](./data.md#33-modelos-de-dados) |
| **Setup de ambiente local** | [infrastructure.md](./infrastructure.md#2-docker-compose-configurations) |
| **Padrões de código** | [../conventions/](../conventions/) |
| **Deploy em produção** | [infrastructure.md](./infrastructure.md#8-ci-cd-pipeline) |

---

## Responsabilidades

### Documentação Mantida por:
- **System Engineer** - Governança e organização
- **Dev Agent Enhanced** - Detalhes de implementação
- **QA Engineer** - Padrões de teste e validação

### Atualizações:
- **Stack tecnológico** → [overview.md](./overview.md)
- **Novas funcionalidades** → [backend.md](./backend.md) ou [frontend.md](./frontend.md)
- **Schema changes** → [data.md](./data.md)
- **Infraestrutura** → [infrastructure.md](./infrastructure.md)

---

## Feedback e Contribuições

Esta documentação é viva e evolui com o sistema. Para sugestões:

1. **Issues**: Abrir issue no repositório
2. **PRs**: Contribuir diretamente nos arquivos
3. **Handoffs**: Usar templates em [../conventions/handoff-template.md](../conventions/handoff-template.md)

---

**Princípio:** Esta seção serve como a fonte central e consolidada para toda a arquitetura do sistema Reiche Academy, eliminando redundâncias e proporcionando navegação clara e eficiente.