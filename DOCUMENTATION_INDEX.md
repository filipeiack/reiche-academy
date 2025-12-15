# 📚 Documentação do Reiche Academy - Índice Completo

Guia de navegação para toda a documentação do projeto.

## 🎯 Documentação Principal

### Frontend

| Documento | Descrição | Link |
|-----------|-----------|------|
| **README.md** | Guia completo do frontend, stack, estrutura e features | [frontend/README.md](frontend/README.md) |
| **DESIGN_SYSTEM_FINAL.md** | Sistema de cores, temas light/dark, UIBakery palette | [DESIGN_SYSTEM_FINAL.md](DESIGN_SYSTEM_FINAL.md) |
| **SORTABLE_DIRECTIVE_GUIDE.md** | Documentação da diretiva para colunas ordenáveis | [frontend/SORTABLE_DIRECTIVE_GUIDE.md](frontend/SORTABLE_DIRECTIVE_GUIDE.md) |
| **MULTI_SELECT_BATCH_DELETE_GUIDE.md** | Multi-select checkboxes e delete em lote | [frontend/MULTI_SELECT_BATCH_DELETE_GUIDE.md](frontend/MULTI_SELECT_BATCH_DELETE_GUIDE.md) |
| **LOGIN_CUSTOMIZATION.md** | Guia de customização do login (logos, backgrounds) | [frontend/LOGIN_CUSTOMIZATION.md](frontend/LOGIN_CUSTOMIZATION.md) |
| **USER_AVATAR_GUIDE.md** | Implementação de avatares de usuários | [frontend/USER_AVATAR_GUIDE.md](frontend/USER_AVATAR_GUIDE.md) |
| **I18N_GUIDE.md** | Internacionalização e traduções (i18n) | [frontend/I18N_GUIDE.md](frontend/I18N_GUIDE.md) |
| **ROUTE_PROTECTION_GUIDE.md** | Guards de autenticação e proteção de rotas | [frontend/ROUTE_PROTECTION_GUIDE.md](frontend/ROUTE_PROTECTION_GUIDE.md) |

### Backend

| Documento | Descrição | Link |
|-----------|-----------|------|
| **README.md** | Guia completo do backend, stack, arquitetura | [backend/README.md](backend/README.md) |
| **API_ENDPOINTS.md** | Lista completa de endpoints da API | [backend/API_ENDPOINTS.md](backend/API_ENDPOINTS.md) |
| **DATA_MODEL.md** | Modelo de dados, ERD, relações | [backend/DATA_MODEL.md](backend/DATA_MODEL.md) |

### Geral/Projeto

| Documento | Descrição | Link |
|-----------|-----------|------|
| **README.md** | Visão geral do projeto Reiche Academy | [README.md](README.md) |
| **GETTING_STARTED.md** | Guia de início rápido (instalação, setup) | [GETTING_STARTED.md](GETTING_STARTED.md) |
| **CONTEXT.md** | Contexto completo do projeto, arquivo de referência | [CONTEXT.md](CONTEXT.md) |

---

## 🎨 Features Implementadas

### Frontend - Tema Dark (UIBakery)

**Paleta de Cores**:
- Primary: `#C67A3D` (Orange/Copper)
- Secondary: `#4E4E4E` (Gray)
- Background: `#0A0A0A` (Deep)
- Cards: `#1A1A1A`
- Borders: `#2A2A2A`
- Text: `#FFFFFF` / `#A0A0A0`

**Referência**: [DESIGN_SYSTEM_FINAL.md](DESIGN_SYSTEM_FINAL.md#-paleta-uibakery-dark-theme-implementada)

### Frontend - Usuarios-List Component

**Features**:
1. ✅ Multi-select checkboxes com header sync
2. ✅ Sortable columns (nome, email)
3. ✅ Batch delete com confirmação
4. ✅ Selection counter + alert bar
5. ✅ Dark theme styling completo

**Documentação**:
- Multi-select: [MULTI_SELECT_BATCH_DELETE_GUIDE.md](frontend/MULTI_SELECT_BATCH_DELETE_GUIDE.md)
- Sorting: [SORTABLE_DIRECTIVE_GUIDE.md](frontend/SORTABLE_DIRECTIVE_GUIDE.md)
- Overview: [frontend/README.md](frontend/README.md#-features-detalhadas)

---

## 📂 Estrutura de Diretórios

```
reiche-academy/
├── README.md                          # Visão geral
├── GETTING_STARTED.md                 # Início rápido
├── CONTEXT.md                         # Contexto completo
├── DESIGN_SYSTEM_FINAL.md             # Sistema de cores e componentes
│
├── backend/                           # NestJS + Prisma
│   ├── README.md
│   ├── API_ENDPOINTS.md
│   ├── DATA_MODEL.md
│   ├── package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       └── modules/
│           ├── auth/
│           ├── usuarios/
│           ├── empresas/
│           ├── diagnosticos/
│           ├── pilares/
│           ├── rotinas/
│           └── audit/
│
├── frontend/                          # Angular 18+
│   ├── README.md
│   ├── SORTABLE_DIRECTIVE_GUIDE.md
│   ├── MULTI_SELECT_BATCH_DELETE_GUIDE.md
│   ├── LOGIN_CUSTOMIZATION.md
│   ├── USER_AVATAR_GUIDE.md
│   ├── I18N_GUIDE.md
│   ├── ROUTE_PROTECTION_GUIDE.md
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── core/
│       │   ├── views/
│       │   │   ├── pages/
│       │   │   │   ├── auth/
│       │   │   │   └── usuarios/
│       │   │   │       └── usuarios-list/
│       │   │   └── layout/
│       │   └── shared/
│       │       └── directives/
│       │           └── sortable.directive.ts
│       └── styles/
│           ├── _variables.scss
│           ├── _variables-dark.scss
│           ├── _custom.scss
│           └── styles.scss
│
├── planilhas/                         # Planilhas originais (Excel)
│   ├── DIAGNOSTICO.xlsx
│   └── COCKPIT.xlsx
│
└── docker-compose.yml                 # PostgreSQL + stack
```

---

## 🚀 Quick Start

### Instalação
```bash
# Clone
git clone <repo-url>
cd reiche-academy

# Backend
cd backend && npm install && npm run migration:dev && npm run dev

# Frontend (outro terminal)
cd frontend && npm install && ng serve --open
```

**Referência**: [GETTING_STARTED.md](GETTING_STARTED.md)

### Estrutura Frontend
```bash
# Componente usuarios-list
src/app/views/pages/usuarios/usuarios-list/
├── usuarios-list.component.ts        # Lógica (multi-select, sort, delete)
├── usuarios-list.component.html      # Template (tabela, checkboxes, alert)
└── usuarios-list.component.scss      # Estilos (dark theme, UIBakery)
```

### Design System
```bash
# Cores e temas
src/styles/
├── _variables.scss                   # Light theme
├── _variables-dark.scss              # Dark theme (UIBakery)
├── _custom.scss                      # Overrides (checkboxes, tables)
└── styles.scss                       # Import principal
```

---

## 📖 Guias Temáticos

### Design & Estilo

1. **Sistema de Cores**: [DESIGN_SYSTEM_FINAL.md](DESIGN_SYSTEM_FINAL.md)
   - Paleta UIBakery
   - Tema Light/Dark
   - WCAG Acessibilidade
   - Custom styling

2. **Customização de Login**: [frontend/LOGIN_CUSTOMIZATION.md](frontend/LOGIN_CUSTOMIZATION.md)
   - Logos por empresa
   - Backgrounds customizados
   - Fallbacks

3. **Avatares de Usuário**: [frontend/USER_AVATAR_GUIDE.md](frontend/USER_AVATAR_GUIDE.md)
   - Exibição de avatares
   - Upload de imagens
   - Fallbacks

### Features

1. **Multi-Select & Batch Delete**: [frontend/MULTI_SELECT_BATCH_DELETE_GUIDE.md](frontend/MULTI_SELECT_BATCH_DELETE_GUIDE.md)
   - Checkboxes com sincronização
   - Alert bar condicional
   - Confirmação SweetAlert2
   - Delete em lote

2. **Sortable Columns**: [frontend/SORTABLE_DIRECTIVE_GUIDE.md](frontend/SORTABLE_DIRECTIVE_GUIDE.md)
   - Diretiva standalone
   - Indicadores visuais (▲/▼)
   - Ciclo de ordenação

3. **Proteção de Rotas**: [frontend/ROUTE_PROTECTION_GUIDE.md](frontend/ROUTE_PROTECTION_GUIDE.md)
   - Auth guards
   - Role-based access
   - Redirecionamentos

### Internacionalização

1. **i18n (Traduções)**: [frontend/I18N_GUIDE.md](frontend/I18N_GUIDE.md)
   - Configuração
   - Traduções
   - Pipe de tradução

---

## 🔒 Segurança & Autenticação

### Backend
- JWT (access + refresh tokens)
- Argon2 password hashing
- RBAC (4 perfis: Consultor, Gestor, Colaborador, Leitura)
- CORS, CSRF, XSS protection
- Auditoria completa

**Referência**: [backend/README.md](backend/README.md#-segurança)

### Frontend
- Route guards
- Token storage (localStorage)
- Interceptors HTTP
- Redirecionamento automático

**Referência**: [frontend/ROUTE_PROTECTION_GUIDE.md](frontend/ROUTE_PROTECTION_GUIDE.md)

---

## 📊 Modelo de Dados

**ERD (Entity Relationship Diagram)**: [backend/DATA_MODEL.md](backend/DATA_MODEL.md)

Tabelas principais:
- `Usuario` - Usuários do sistema
- `Empresa` - Empresas/clientes
- `Pilares` - PDCA pillars
- `Rotinas` - Rotinas/processos
- `Diagnosticos` - Resultados de diagnósticos
- `AuditLog` - Logs de alterações

---

## 🧪 Testes

### E2E Tests
```bash
# Frontend
cd frontend && npx playwright test

# Specs
e2e/usuarios.spec.ts
```

### Unit Tests
```bash
# Frontend
ng test

# Backend
npm run test
```

---

## 📱 Responsividade

Todos os componentes são responsivos:
- Mobile: 320px+
- Tablet: 768px+
- Desktop: 1024px+

Dark theme mantém consistência em todos os breakpoints.

---

## 🎓 Stack Tecnológico

### Frontend
- Angular 18+ (standalone components)
- Bootstrap 5 + SCSS
- RxJS (reactive)
- ng-bootstrap
- SweetAlert2
- Feather Icons

### Backend
- NestJS + TypeScript
- Prisma ORM
- PostgreSQL
- JWT Auth
- Swagger/OpenAPI
- Winston logging

### DevOps
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Nginx proxy

---

## 👥 Contribuição

### Padrões de Código
- **Backend**: DTOs com class-validator, injeção de dependência
- **Frontend**: Componentes standalone, reactive forms, tipagem rigorosa
- **Banco**: Migrations versionadas, auditoria obrigatória

### Commits
```bash
git commit -m "feat(usuarios): implementar multi-select"
git commit -m "fix(dark-theme): corrigir cor de hover"
git commit -m "docs(README): atualizar guias"
```

---

## 📞 Suporte

Para dúvidas ou problemas:

1. **Documentação**: Consulte os guias específicos
2. **Código**: Verifique exemplos em componentes existentes
3. **Issues**: Abra issue no repositório

---

## 📋 Checklist de Setup

- [ ] Clone repositório
- [ ] Instale dependências (backend + frontend)
- [ ] Configure PostgreSQL (docker-compose up)
- [ ] Rode migrations (npm run migration:dev)
- [ ] Inicie backend (npm run dev)
- [ ] Inicie frontend (ng serve)
- [ ] Acesse http://localhost:4200
- [ ] Teste login (admin@reiche.com:123456)
- [ ] Navegue até Usuários
- [ ] Teste multi-select, sorting, delete

---

## 🔄 Última Atualização

**Data**: 09/12/2024  
**Mudanças**: Documentação completa de features UIBakery Dark, Multi-Select, Sorting  
**Status**: ✅ Pronto para produção

---

**Desenvolvido com ❤️ para Reiche Academy**

