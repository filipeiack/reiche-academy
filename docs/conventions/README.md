# Convenções do Projeto Reiche Academy

Este documento descreve **EXCLUSIVAMENTE** os padrões e convenções observados no código atual do projeto. Nenhuma recomendação genérica ou idealização foi incluída.

## Sobre Esta Documentação

- **Fonte de Verdade**: Código existente (backend, frontend, testes), estrutura de pastas e README files
- **Objetivo**: Registrar o estado atual das convenções reais em uso
- **Escopo**: Fase 1 do projeto (Diagnóstico)

## Arquivos desta Seção

| Arquivo | Conteúdo |
|---------|----------|
| [backend.md](./backend.md) | Padrões NestJS, módulos, controllers, services, DTOs, validações |
| [frontend.md](./frontend.md) | Padrões Angular, componentes, serviços, formulários, rotas |
| [testing.md](./testing.md) | Padrões de testes e2e, frameworks, organização |
| [naming.md](./naming.md) | Convenções de nomes para classes, arquivos, métodos, DTOs |
| [git.md](./git.md) | Padrões de branches, commits e versionamento |

## Grau de Consistência - Legenda

- **CONSISTENTE**: Padrão aparece sempre em todo o codebase
- **PARCIAL**: Padrão aparece na maioria dos casos (70-90%)
- **INCONSISTENTE**: Padrão aparece raramente (<50%)
- **NÃO CONSOLIDADO**: Padrão não existe ou é contraditório no código

## Stack Tecnológico Confirmado

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS 10+
- **Linguagem**: TypeScript
- **Banco**: PostgreSQL + Prisma ORM
- **Autenticação**: JWT (Argon2 para senhas)
- **Segurança**: Guards (JwtAuthGuard, RolesGuard)
- **Documentação**: Swagger/OpenAPI
- **Validação**: class-validator com DTOs

### Frontend
- **Framework**: Angular 18+
- **Template**: NobleUI Angular v3.0
- **Estilização**: Bootstrap 5 + SCSS
- **Estado**: RxJS (BehaviorSubject para estado local)
- **Formulários**: Reactive Forms
- **Testes E2E**: Playwright

### Segurança & Autenticação
- **Perfis RBAC**: ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA (sem CONSULTOR ativo no schema atual)
- **Armazenamento de Tokens**: localStorage/sessionStorage (frontend)
- **Soft Delete**: Campo `ativo: boolean` (usuários inativados, não deletados)
- **Auditoria**: Logs registram usuário, email, entidade, ação e mudanças antes/depois

## Limitações das Convenções Atuais

Veja a seção final de cada documento com "Limitações e Gaps" para questões não consolidadas.
