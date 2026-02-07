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

### 1. Variáveis de Ambiente

Antes de iniciar, configure as variáveis de ambiente:

#### Para desenvolvimento local:
```bash
# Copie os templates de exemplo
cp .env.example .env
cp backend/.env.example backend/.env

# Edite os arquivos .env se necessário
# Os valores padrão funcionam para desenvolvimento local
```

#### Para deploy em VPS:
```bash
# Copie o template VPS
cp .env.vps.example .env.vps

# IMPORTANTE: Edite .env.vps e altere:
# - POSTGRES_PASSWORD
# - REDIS_PASSWORD
# - JWT_SECRET_PROD e JWT_SECRET_STAGING
# - JWT_REFRESH_SECRET_PROD e JWT_REFRESH_SECRET_STAGING
# - CORS_ORIGIN_PROD e CORS_ORIGIN_STAGING
```

**Observação**: Nunca commite arquivos `.env`, `.env.vps` ou `.env.*.local` no git. Apenas os arquivos `.example` devem ser versionados.

### 2. Iniciar serviços Docker

```bash
docker-compose up -d
```

### 3. Backend

```bash
cd backend
npm install
npm run migration:dev
npm run dev
```

O backend estará disponível em `http://localhost:3000`
API Docs (Swagger): `http://localhost:3000/api`

### 4. Frontend

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

- **[Governança](docs/governance.md)** - Fluxo, autoridade e agentes
- **[Guias de Configuração](docs/guides/)** - Setup, Docker, Git, Deploy VPS
- **[Regras de Negócio](docs/business-rules/)** - Regras normativas do sistema
- **[Arquitetura](docs/architecture/)** - Estrutura técnica e diagramas
- **[Convenções](docs/conventions/)** - Padrões de código
  - [Backend](docs/conventions/backend.md)
  - [Frontend](docs/conventions/frontend.md)
  - [Testes](docs/conventions/testing.md)
  - [Naming](docs/conventions/naming.md)
  - [Git](docs/conventions/git.md)
- **[ADRs](docs/adr/)** - Decisões arquiteturais registradas
- **[FLOW.md](docs/flow.md)** - Legado (redirect para governança)
- **[Instruções Copilot](.github/copilot-instructions.md)**
- **[Planilhas Originais](planilhas/)**

## ⚠️ Limitações das Convenções Atuais

Este projeto está em fase de consolidação de padrões. Abaixo estão questões não consolidadas que precisam de decisão futura:

### Backend
- [ ] **Auditoria incompleta**: Service existe mas não é chamado em todos os endpoints
- [ ] **Error handler global**: Exceções NestJS sem filtro global centralizado
- [ ] **Repository pattern**: Não consolidado (services acessam Prisma diretamente)
- [ ] **Soft delete automático**: Consultas não filtram automaticamente usuários inativos
- [ ] **Testes unitários**: Nenhum teste com Jest encontrado no repositório
- [ ] **Custom validators**: Apenas class-validator padrão (sem validação customizada)

### Frontend
- [ ] **Guards de rota não integrados**: Estrutura existe, rotas sem autenticação obrigatória
- [ ] **Lazy loading**: Sem code splitting em rotas (todas carregadas imediatamente)
- [ ] **Interceptors não consolidados**: Sem injeção automática de JWT nas requisições
- [ ] **Memory leaks**: Componentes sem unsubscribe de Observables (sem takeUntil)
- [ ] **Error handler global**: Sem HttpErrorResponse centralizado
- [ ] **State management**: Apenas BehaviorSubject (sem NgRx)
- [ ] **Logger centralizado**: Sem Winston/Pino no frontend
- [ ] **TypeScript strict**: Não confirmado se `strict: true` está ativo

### Testes
- [ ] **Testes unitários backend**: Configurado (jest) mas não implementado
- [ ] **Mocks e fixtures**: Sem padrão consolidado (HttpClientTestingModule não usado)
- [ ] **E2E timing**: Waits fixos (`waitForTimeout`) em vez de waits específicos
- [ ] **CI/CD**: Workflows de GitHub Actions não documentados

### Git & DevOps
- [ ] **Padrão de branches**: Não documentado (apenas `main` confirmado)
- [ ] **Commit messages**: Sem guideline explícita (Conventional Commits inferido)
- [ ] **Pull request template**: Não existe
- [ ] **Versionamento inconstente**: Frontend usa `~`, backend usa `^`
- [ ] **Release process**: Não documentado
- [ ] **Code review guidelines**: Ausente

### Naming & Estrutura
- [ ] **Enum naming**: Inconsistente (`MEDIO` vs `EM_ANDAMENTO` com underscore)
- [ ] **Boolean fields**: Uns usam `ativo`, esperaria `isAtivo`
- [ ] **Nullable vs Optional**: Mistura `?` e `| null` sem padrão claro
- [ ] **Private methods**: Sem prefixo `_` (Angular convention)
- [ ] **Magic numbers**: Throttler hardcoded (10, 60000) sem constantes

Veja cada arquivo de convenção em `/docs/conventions/` para análise detalhada incluindo graus de consistência (CONSISTENTE, PARCIAL, INCONSISTENTE, NÃO CONSOLIDADO).

## 🤝 Contribuindo

1. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
2. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
3. Push para a branch (`git push origin feature/nova-feature`)
4. Abra um Pull Request

## 📄 Licença

Propriedade de Reiche Consultoria. Todos os direitos reservados.
