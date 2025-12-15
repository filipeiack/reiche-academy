# Frontend - Reiche Academy

Aplicação web SPA desenvolvida com **Angular 18+** para o sistema **Reiche Academy**. Sistema de gestão empresarial PDCA com autenticação JWT, personalização por empresa e design system oficial.

## 🚀 Stack Tecnológico

- **Framework**: Angular 18+ (standalone components)
- **Template Base**: NobleUI Angular v3.0 - demo1
- **Estilização**: Bootstrap 5 + SCSS
- **Estado**: RxJS (reactive programming)
- **Autenticação**: JWT (access + refresh tokens)
- **Validação**: Reactive Forms com class-validator
- **HTTP Client**: HttpClient com interceptors
- **TypeScript**: Tipagem rigorosa

## 🎨 Design System

- **Paleta Oficial (UIBakery Dark Theme)**:
  - Primary: `#C67A3D` (Orange/Copper)
  - Secondary: `#4E4E4E` (Gray)
  - Background: `#0A0A0A` (Deep)
  - Cards: `#1A1A1A`
  - Borders: `#2A2A2A`
  - Text: `#FFFFFF` (Primary), `#A0A0A0` (Secondary)
- **Tema Light**: Suporte completo com cores light theme
- **Bootstrap 5**: Dark mode nativo + custom overrides
- **Referência**: `DESIGN_SYSTEM_FINAL.md`

## 📋 Pré-requisitos

```bash
node --version  # v20+ LTS
npm --version   # v10+
```

## 🔧 Instalação

```bash
# Instalar dependências
npm install
```

## 🏃 Executar

```bash
# Desenvolvimento (hot reload)
ng serve

# Abrir no navegador automaticamente
ng serve --open

# Build produção
ng build --configuration production
```

Acesse: **http://localhost:4200**

## 📁 Estrutura de Diretórios

```
src/
├── app/
│   ├── core/                          # Serviços centrais
│   │   ├── dummy-datas/             # Dados fictícios
│   │   ├── feather-icon/            # Ícones Feather
│   │   ├── guards/                  # Guards de autenticação
│   │   └── services/                # Serviços (theme, auth, etc)
│   │
│   ├── views/                        # Páginas e layouts
│   │   ├── layout/                  # Layouts principais
│   │   │   ├── base/               # Layout base (com navbar/sidebar)
│   │   │   ├── navbar/             # Componente navbar
│   │   │   ├── sidebar/            # Componente sidebar
│   │   │   └── footer/             # Componente footer
│   │   │
│   │   ├── pages/                  # Páginas da aplicação
│   │   │   ├── auth/              # Autenticação
│   │   │   │   ├── login/        # Tela de login (NobleUI)
│   │   │   │   │   ├── login.component.ts
│   │   │   │   │   ├── login.component.html
│   │   │   │   │   └── login.component.scss
│   │   │   │   └── auth.routes.ts
│   │   │   └── dashboard/         # Dashboard
│   │   │
│   │   └── partials/              # Componentes compartilhados
│   │
│   ├── app.component.ts
│   ├── app.config.ts              # Providers e configurações globais
│   ├── app.routes.ts              # Routing principal
│   └── app.module.ts              # Root module (se necessário)
│
├── assets/
│   ├── images/                    # Imagens
│   └── scss/                      # SCSS compartilhados (se houver)
│
├── environments/
│   ├── environment.ts             # Desenvolvimento
│   └── environment.prod.ts        # Produção
│
├── styles/                        # Estilos NobleUI globais
│   ├── components/               # Estilos de componentes
│   ├── mixins/                   # Mixins SCSS
│   ├── plugin-overrides/         # Overrides de plugins
│   ├── rtl-css/                  # Estilos RTL
│   ├── _variables.scss
│   ├── _root.scss
│   ├── styles.scss               # Arquivo principal
│   └── ... (40+ arquivos SCSS)
│
└── styles.scss                   # Importador principal
```
│   ├── styles.scss                  # Estilos globais
│   └── variables.scss               # CSS Variables (cores, fontes)
│
└── index.html                       # HTML raiz
```

## 🎯 Features Implementadas (Fase 1)

- ✅ **Template NobleUI v3.0**
  - Layout completo (base, navbar, sidebar, footer)
  - Componentes prontos
  - SCSS globais e estilos
  - Fontes Feather icons

- ✅ **Autenticação**
  - Tela de login (NobleUI)
  - localStorage (isLoggedin)
  - Estrutura pronta para JWT

- ✅ **Tema Dark (UIBakery)**
  - Paleta UIBakery (#C67A3D, #4E4E4E, #0A0A0A, #1A1A1A, #2A2A2A)
  - Dark theme completo com Bootstrap 5
  - Custom styling para inputs, checkboxes, tables

- ✅ **Lista de Usuários (Usuarios-List)**
  - Multi-select com checkbox header
  - Sortable columns (nome, email)
  - Batch delete com confirmação SweetAlert2
  - Selection counter com ng-bootstrap alert
  - Dark theme styling com UIBakery colors

- ⏳ **Dashboard** (em progresso)
- ⏳ **Integrações com backend** (JWT, API calls)

## 🎯 Features Detalhadas

### Usuarios-List Component

Componente de listagem de usuários com recursos avançados de seleção e manipulação em lote.

**Localização**: `src/app/views/pages/usuarios/usuarios-list/`

**Features**:

#### 1. Multi-Select Checkboxes
```html
<!-- Header checkbox - marca/desmarcar todos -->
<input type="checkbox" [(ngModel)]="headerCheckboxChecked" (change)="toggleHeaderCheckbox()">

<!-- Row checkboxes - seleção individual -->
<input type="checkbox" [checked]="isUsuarioSelected(usuario.id)" (change)="toggleUsuarioSelection(usuario.id)">
```

**Dados**:
```typescript
selectedUsuariosIds: Set<string> = new Set();

toggleUsuarioSelection(id: string): void {
  if (this.selectedUsuariosIds.has(id)) {
    this.selectedUsuariosIds.delete(id);
  } else {
    this.selectedUsuariosIds.add(id);
  }
}

toggleHeaderCheckbox(): void {
  if (this.headerCheckboxChecked) {
    this.filteredUsuarios.forEach(u => this.selectedUsuariosIds.add(u.id));
  } else {
    this.selectedUsuariosIds.clear();
  }
}

get selectedCount(): number {
  return this.selectedUsuariosIds.size;
}
```

#### 2. Sortable Columns
```html
<th sortable="name" (sort)="onSort($event)">Nome</th>
<th sortable="email" (sort)="onSort($event)">Email</th>
```

**Diretiva** (`sortable.directive.ts`):
```typescript
@Directive({
  selector: 'th[sortable]',
  standalone: true
})
export class SortableDirective {
  @HostBinding('class.asc') asc = false;
  @HostBinding('class.desc') desc = false;
  
  @Output() sort = new EventEmitter<SortEvent>();
  
  rotate(): void {
    // Cicla entre: '' → 'asc' → 'desc' → ''
  }
}
```

**Lógica de Sorting**:
```typescript
sortColumn: string = '';
sortDirection: 'asc' | 'desc' = 'asc';

onSort(event: SortEvent): void {
  this.sortColumn = event.column;
  this.sortDirection = event.direction || 'asc';
  this.applySorting();
}

applySorting(): void {
  if (!this.sortColumn) return;
  
  this.filteredUsuarios.sort((a, b) => {
    const aVal = a[this.sortColumn];
    const bVal = b[this.sortColumn];
    const comparison = aVal.localeCompare(bVal);
    return this.sortDirection === 'asc' ? comparison : -comparison;
  });
}
```

**Estilos**:
```scss
th[sortable] {
  cursor: pointer;
  user-select: none;
  
  &:hover {
    color: #C67A3D;
  }
  
  &.asc::after {
    content: ' ▲';
    color: #C67A3D;
  }
  
  &.desc::after {
    content: ' ▼';
    color: #C67A3D;
  }
}
```

#### 3. Batch Delete with Confirmation
```html
<!-- Alert bar condicional -->
<ngb-alert *ngIf="selectedCount > 0" type="warning">
  {{ selectedCount }} usuário(s) selecionado(s)
  <button (click)="deleteSelectedUsuarios()">Deletar</button>
</ngb-alert>
```

**Lógica**:
```typescript
deleteSelectedUsuarios(): void {
  Swal.fire({
    title: 'Confirmar exclusão?',
    text: `${this.selectedCount} usuário(s) serão removidos`,
    icon: 'warning',
    confirmButtonText: 'Deletar',
    confirmButtonColor: '#C67A3D',
    showCancelButton: true
  }).then((result) => {
    if (result.isConfirmed) {
      const idsToDelete = Array.from(this.selectedUsuariosIds);
      this.usersService.deleteMultiple(idsToDelete).subscribe({
        next: () => {
          this.selectedUsuariosIds.clear();
          this.loadUsuarios();
          Swal.fire('Sucesso!', 'Usuários deletados', 'success');
        },
        error: (err) => {
          Swal.fire('Erro!', err.error.message, 'error');
        }
      });
    }
  });
}
```

#### 4. Selection Counter & Alert
```html
<ngb-alert *ngIf="selectedCount > 0" type="info" class="alert-custom-primary">
  <strong>{{ selectedCount }}</strong> usuário(s) selecionado(s)
  <button class="btn btn-sm btn-danger" (click)="deleteSelectedUsuarios()">
    Deletar Selecionados
  </button>
</ngb-alert>
```

**Estilo Custom Alert (Dark Theme)**:
```scss
.alert-custom-primary {
  background-color: rgba(198, 122, 61, 0.1);  // Orange 10%
  border-color: rgba(198, 122, 61, 0.3);      // Orange 30%
  color: #FFFFFF;
  border-radius: 8px;
}
```

#### 5. Table Hover Effect
```scss
.table-hover tbody tr:hover {
  background-color: rgba(198, 122, 61, 0.1) !important;  // UIBakery hover
}
```

### Design System Integration

**Cores Utilizadas**:
- Primary: `#C67A3D` (Orange/Copper) - Links, highlights, borders ativos
- Text: `#FFFFFF` - Texto principal em dark theme
- Borders: `#2A2A2A` - Separadores, inputs
- BG: `#0A0A0A` - Fundo principal
- Cards: `#1A1A1A` - Cards, sidebar

**Referência**: `DESIGN_SYSTEM_FINAL.md`

## 🔌 Integração com Backend

### Endpoints Prontos para Implementação
```http
# Autenticação
POST /api/auth/login
POST /api/auth/refresh

# Dados
GET /api/dashboard
GET /api/empresas
GET /api/usuarios
```

**Status**: Estrutura pronta, aguardando integração com NestJS backend

## 📚 Padrões de Código

### Componentes Standalone
```typescript
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
```

### Rotas com Lazy Loading
```typescript
export default [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component').then(c => c.LoginComponent)
  }
] as Routes;
```

### Services com Injeção de Dependência
```typescript
@Injectable({ providedIn: 'root' })
export class ThemeModeService {
  constructor() {}
}
```

## 🎨 Template NobleUI Angular v3.0

O projeto utiliza **100% do template NobleUI Angular v3.0 (demo1)**:

**Localização**: `C:\Users\filip\source\repos\templates\nobleui-angular\template\demo1\`

**O que foi migrado:**
- ✅ Componentes de layout (base, navbar, sidebar, footer)
- ✅ Sistema de estilos SCSS completo (`src/styles/`)
- ✅ Core services (theme-mode, theme-css-variable, feather-icon)
- ✅ Estrutura de rotas e lazy loading
- ✅ Partials compartilhados

**Estrutura preservada:**
- ✅ Classes Bootstrap 5 originais
- ✅ Ícones Feather
- ✅ Responsividade nativa
- ✅ Dark mode support

**Sem modificações:**
- ❌ Tailwind CSS
- ❌ Bootstrap customizado
- ❌ CSS utilitários fora do NobleUI

## 🧪 Testes

```bash
# Unit tests
ng test

# E2E tests
ng e2e
```

## 📦 Build

```bash
# Build para produção (otimizado)
ng build --configuration production

# Análise de bundle
ng build --stats-json
webpack-bundle-analyzer dist/reiche-academy/stats.json
```

## 🔒 Variáveis de Ambiente

```typescript
// src/environments/environment.ts (desenvolvimento)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'
};

// src/environments/environment.prod.ts (produção)
export const environment = {
  production: true,
  apiUrl: 'https://api.reiche-academy.com/api'
};
```

## 🚨 Troubleshooting

### Erro: `TS5103: Invalid value for '--ignoreDeprecations'`
**Solução**: Remover `ignoreDeprecations` do `tsconfig.json`

### Login não funciona
**Verificar:**
1. Backend rodando em `http://localhost:3000`
2. CORS habilitado no backend
3. Credenciais corretas (admin@reiche.com:123456)
4. JWT token sendo retornado

### Logo não carrega
**Verificar:**
1. Logo em `src/assets/images/logo_reiche_academy.png`
2. Background em `src/assets/images/login-bg.jpg` (se customizado)
3. Permissões do arquivo
4. Fallback acionado via `onLogoError()`

## 📖 Referências

- **Angular**: https://angular.io
- **Bootstrap 5**: https://getbootstrap.com
- **RxJS**: https://rxjs.dev
- **NobleUI**: https://nobleui.com
- **TypeScript**: https://www.typescriptlang.org
- **Design System**: `DESIGN_SYSTEM_COLORS.md`
- **Customização**: `LOGIN_CUSTOMIZATION.md`
- **Contexto Geral**: `CONTEXT.md`

## 📝 Commits

Padrão de commits:
```bash
git commit -m "feat(auth): implementar login com JWT"
git commit -m "fix(login): corrigir validação de email"
git commit -m "docs(README): atualizar documentação"
git commit -m "refactor(styles): organizar SCSS"
```

## 👨‍💻 Desenvolvedor

**Reiche Academy Development Team**
Desenvolvido com ❤️ para gestão empresarial PDCA

---

**Última atualização**: 08/12/2024  
**Versão**: 1.0.0-alpha  
**Status**: Desenvolvimento Fase 1

