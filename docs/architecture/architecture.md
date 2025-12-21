# Arquitetura - Reiche Academy (AS-IS)

Documentação gerada exclusivamente a partir do código presente no projeto. Não há inferências, sugestões ou padrões ideais.

## Visão Geral

- Sistema web para gestão empresarial PDCA
- Estrutura modular: backend, frontend, data, infraestrutura

## Decisões Arquiteturais Identificadas

### Backend
- Framework: NestJS + TypeScript ([backend/README.md](backend/README.md), [backend/src/main.ts](backend/src/main.ts))
- ORM: Prisma ([backend/README.md](backend/README.md), [backend/prisma/schema.prisma](backend/prisma/schema.prisma))
- Autenticação: JWT, Argon2 ([backend/README.md](backend/README.md), [backend/src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts))
- Documentação: Swagger/OpenAPI ([backend/README.md](backend/README.md), [backend/src/main.ts](backend/src/main.ts))
- Módulos: Auth, Usuarios, Empresas, Pilares, Rotinas, Diagnosticos, Audit, Perfis ([backend/src/app.module.ts](backend/src/app.module.ts))
- Validação: class-validator ([backend/README.md](backend/README.md))
- Observabilidade: Não identificado no código

### Frontend
- Framework: Angular 18+ ([frontend/README.md](frontend/README.md))
- Template: NobleUI ([frontend/README.md](frontend/README.md))
- Estado: RxJS ([frontend/README.md](frontend/README.md))
- Autenticação: JWT ([frontend/README.md](frontend/README.md))
- Design System: Bootstrap 5 + SCSS ([frontend/README.md](frontend/README.md))
- Componentização: Standalone ([frontend/README.md](frontend/README.md), [frontend/src/app/app.component.ts](frontend/src/app/app.component.ts))
- Validação: Reactive Forms ([frontend/README.md](frontend/README.md))

### Data
- Banco: PostgreSQL ([backend/README.md](backend/README.md), [docker-compose.yml](docker-compose.yml))
- Migrations: Prisma ([backend/README.md](backend/README.md), [backend/prisma/schema.prisma](backend/prisma/schema.prisma))
- Modelos: Empresa, Usuario, Pilar, Rotina, Diagnostico, Criticidade, PerfilUsuario, etc ([backend/prisma/schema.prisma](backend/prisma/schema.prisma), [backend/DATA_MODEL.md](backend/DATA_MODEL.md))

### Infraestrutura
- Docker Compose ([docker-compose.yml](docker-compose.yml))
- Redis ([docker-compose.yml](docker-compose.yml))
- Nginx: Não identificado no código
- CI/CD: Não identificado no código
- Storage S3: Não identificado no código

## Observações
- Decisões não identificadas explicitamente no código foram marcadas como "Não identificado no código".
