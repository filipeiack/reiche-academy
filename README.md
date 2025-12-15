# Reiche Academy - Sistema de Gestão Empresarial PDCA

Sistema web para gestão empresarial baseado na metodologia PDCA, desenvolvido para substituir planilhas Excel de Diagnóstico e Cockpit.

## 🚀 Tecnologias

### Backend
- Node.js 20 LTS
- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- JWT Authentication
- Swagger/OpenAPI

### Frontend
- Angular 18+
- Angular Material
- NobleUI Template
- RxJS + NgRx

### Infraestrutura
- Docker + Docker Compose
- PostgreSQL 16
- Redis 7
- Nginx

## 📋 Pré-requisitos

- Node.js 20 LTS
- Docker Desktop
- Angular CLI (`npm install -g @angular/cli`)
- NestJS CLI (`npm install -g @nestjs/cli`)

## 🔧 Configuração

### 1. Iniciar serviços Docker

```bash
docker-compose up -d
```

### 2. Backend

```bash
cd backend
npm install
npm run migration:dev
npm run dev
```

O backend estará disponível em `http://localhost:3000`
API Docs (Swagger): `http://localhost:3000/api`

### 3. Frontend

```bash
cd frontend
npm install
ng serve
```

O frontend estará disponível em `http://localhost:4200`

## 📁 Estrutura do Projeto

```
reiche-academy/
├── backend/              # API NestJS
│   ├── src/
│   │   ├── modules/     # Módulos da aplicação
│   │   ├── common/      # Código compartilhado
│   │   └── prisma/      # Configuração Prisma
│   └── prisma/          # Schema e migrations
├── frontend/            # App Angular
│   ├── src/
│   │   ├── app/        # Componentes e módulos
│   │   ├── assets/     # Recursos estáticos
│   │   └── environments/
├── planilhas/          # Planilhas de referência
└── docker-compose.yml  # Serviços Docker

```

## 🎯 Módulos - Fase 1

- ✅ Cadastros Essenciais (Empresa, Usuário, Pilares, Rotinas)
- ✅ Wizard de Diagnóstico
- ✅ Perfis e Permissões (RBAC)
- ✅ Log de Auditoria

## 📝 Convenções

- **Backend**: Clean Architecture, DTOs validados, Swagger em todos endpoints
- **Frontend**: Componentes standalone (Angular 18+), tipagem rigorosa
- **Database**: Migrations versionadas, auditoria obrigatória
- **Nomenclatura**: PascalCase (classes), camelCase (variáveis), kebab-case (rotas)

## 🔐 Segurança

- Autenticação JWT (access + refresh tokens)
- Senhas com Argon2
- RBAC: 4 perfis (Consultor, Gestor, Colaborador, Leitura)
- Proteção CSRF, XSS, SQL Injection
- Compliance LGPD

## 📚 Documentação

- [Contexto do Projeto](CONTEXT.md)
- [Instruções Copilot](.github/copilot-instructions.md)
- [Planilhas Originais](planilhas/)

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

## 📄 Licença

Propriedade de Reiche Consultoria. Todos os direitos reservados.
