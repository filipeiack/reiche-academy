# Backend - Reiche Academy API

API REST desenvolvida com NestJS para o sistema Reiche Academy.

## 🚀 Tecnologias

- Node.js 20 LTS
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication (Argon2)
- Swagger/OpenAPI

## 📋 Pré-requisitos

```bash
node --version  # v20.x
npm --version   # v10.x
```

## 🔧 Instalação

```bash
# Instalar dependências
npm install

# Gerar Prisma Client
npm run prisma:generate

# Rodar migrations
npm run migration:dev
```

## 🏃 Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run start:prod
```

## 📚 Documentação API

Acesse: http://localhost:3000/api/docs

## 🗄️ Banco de Dados

```bash
# Criar nova migration
npm run prisma:migrate

# Abrir Prisma Studio
npm run prisma:studio

# Seed (popular dados iniciais)
npm run seed
```

## 📁 Estrutura

```
src/
├── modules/          # Módulos da aplicação
│   ├── auth/        # Autenticação JWT
│   ├── usuarios/    # Gestão de usuários
│   ├── empresas/    # Gestão de empresas
│   ├── pilares/     # Gestão de pilares
│   ├── rotinas/     # Gestão de rotinas
│   ├── diagnosticos/ # Gestão de diagnósticos
│   └── audit/       # Log de auditoria
├── common/          # Código compartilhado
│   └── prisma/      # Configuração Prisma
├── config/          # Configurações
├── app.module.ts    # Módulo raiz
└── main.ts          # Entry point
```

## 🔐 Autenticação

Todos os endpoints (exceto `/auth/login`) requerem JWT:

```bash
Authorization: Bearer <token>
```

## 🧪 Testes

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```
