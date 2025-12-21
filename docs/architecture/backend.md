# Backend - Arquitetura (AS-IS)

Documentação baseada exclusivamente no código presente.

## Frameworks e Ferramentas
- NestJS + TypeScript ([backend/README.md](backend/README.md), [backend/src/main.ts](backend/src/main.ts))
- Prisma ORM ([backend/README.md](backend/README.md), [backend/prisma/schema.prisma](backend/prisma/schema.prisma))
- JWT + Argon2 ([backend/README.md](backend/README.md), [backend/src/modules/auth/auth.service.ts](backend/src/modules/auth/auth.service.ts))
- Swagger/OpenAPI ([backend/README.md](backend/README.md), [backend/src/main.ts](backend/src/main.ts))

## Estrutura Modular
- Módulos: Auth, Usuarios, Empresas, Pilares, Rotinas, Diagnosticos, Audit, Perfis ([backend/src/app.module.ts](backend/src/app.module.ts))
- Cada módulo possui controller, service e DTOs (exemplo: [backend/src/modules/empresas/empresas.service.ts](backend/src/modules/empresas/empresas.service.ts))

## Segurança
- Autenticação JWT
- Senhas com Argon2
- Proteção CORS e Helmet ([backend/src/main.ts](backend/src/main.ts))

## Validação
- DTOs validados (class-validator)

## Documentação
- Swagger configurado ([backend/src/main.ts](backend/src/main.ts))

## Observabilidade
- Não identificado no código

## Auditoria
- AuditModule presente ([backend/src/app.module.ts](backend/src/app.module.ts)), detalhes não identificados

## Outras Dependências
- ConfigModule, ThrottlerModule ([backend/src/app.module.ts](backend/src/app.module.ts))

## Observações
- Apenas decisões presentes no código foram documentadas.
