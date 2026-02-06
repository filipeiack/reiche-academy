# Arquitetura do Sistema — visão consolidada

**Última atualização:** 2026-02-06

## Objetivo

Este documento resume a stack e as camadas da Reiche Academy. Os detalhes técnicos estão distribuídos nos documentos complementares listados ao final.

## Stack principal
- **Backend:** NestJS 10+ (Node.js + TypeScript + Prisma + JWT + Argon2 + Throttler).
- **Frontend:** Angular 18 standalone (Reactive Forms, SweetAlert2, Feather Icons, translate pipe).
- **Banco de dados:** PostgreSQL (migrado via Prisma), cache Redis (docker-compose).
- **Infra:** Docker Compose para ambiente local; CI/CD documentado em `docs/architecture/ci-cd.md`.

## Camadas e responsabilidades
- **Frontend SPA → Backend REST:** componentes standalone, guards funcionais, roteamento lazy.
- **Backend:** Controllers finos, Services focados em regras, DTOs com validação, Guards JWT/Roles.
- **Persistência:** Prisma com UUIDs, soft delete (`ativo`), `.select()` explicito e auditoria.
- **Segurança:** ValidationPipe global, Helmet, Compression, ThrottlerModule (10 req / 60s), audit logging.
- **Comunicação:** Swagger em `/api/docs`, CORS configurado, arquivos estáticos servidos de `public`.

## Módulos de negócio resumidos
- Auth & Perfis (JWT + roles).
- Usuários, Empresas, Pilar, Rotinas, Diagnósticos, Audit, Perfis, PilaresEmpresa.
- Cada módulo possui Controller → Service → DTOs → Guards.

## Testes & qualidade
- Backend: Jest (`backend/`), mocks do Prisma, foco em regras (não em implementações internas).
- Frontend: Jasmine/Karma (arquitetura mínima); E2E via Playwright (`frontend/playwright.config.ts`).
- A cobertura completa ainda precisa ser documentada (`docs/conventions/testing.md`).

## Infra & deploy
- `docker-compose.yml` orquestra API, Postgres (comentado) e Redis.
- Fluxo mínimo de CI/CD documentado em `docs/architecture/ci-cd.md`.

## Documentos correlatos
- [`docs/architecture/backend.md`](backend.md) — profundidade do NestJS.
- [`docs/architecture/frontend.md`](frontend.md) — padrões Angular.
- [`docs/architecture/data.md`](data.md) — esquema Prisma e dados.
- [`docs/architecture/ci-cd.md`](ci-cd.md) — fluxo mínimo de CI/CD.
- [`docs/conventions/backend.md`](../conventions/backend.md) — padrões complementares.

## Próximos passos recomendados
1. Formalizar a estratégia de CI/CD/Deploy em um ADR (ferramenta escolhida).
2. Documentar fluxos de dados entre frontend → backend → banco (`data.md`).
3. Sincronizar este resumo com `docs/governance.md` e `docs/handoffs/guidelines.md`.