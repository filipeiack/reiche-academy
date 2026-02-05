# Convenções - Frontend (Angular 18+)

**Status**: Documentação baseada em código existente  
**Última atualização**: 2025-12-23

---

## 1. Estrutura de Pastas e Componentes

### Padrão Observado

**Estrutura geral**:
```
src/
├── app/
│   ├── app.component.ts/html/scss/spec.ts
│   ├── app.config.ts              # Configuração da aplicação
│   ├── app.routes.ts              # Rotas principais
│   ├── core/                      # Lógica compartilhada não visual
│   │   ├── guards/
│   │   ├── interceptors/
│   │   ├── models/
│   │   ├── pipes/
│   │   ├── services/
│   ├── shared/                    # Componentes reutilizáveis
│   │   ├── components/
│   │   └── directives/
│   └── views/                     # Telas (páginas)
│       ├── layout/
│       ├── pages/
│       └── partials/
├── assets/
│   └── i18n/                      # Arquivos de tradução
│       ├── pt-BR.json
│       └── en-US.json
├── environments/
├── index.html
├── main.ts
└── styles.scss
```

**Onde aparece**:
- `/frontend/src/app/views/pages/usuarios/`
- `/frontend/src/app/views/pages/empresas/`
- `/frontend/src/app/views/pages/pilares/`
- `/frontend/src/app/core/services/`
- `/frontend/src/app/core/guards/`
- `/frontend/src/app/shared/components/`

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Componentes | Standalone (`standalone: true` no @Component) |
| Estrutura | core (serviços, guards), shared (componentes), views (páginas) |
| Imports | Declarados explicitamente no array `imports: [...]` |
| Estilos | `.scss` (nunca .css) |
| Testes | `.spec.ts` por componente |
| Nomenclatura | kebab-case para arquivos, PascalCase para classes |

**Exemplo de componente standalone**:
```typescript
@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    TranslatePipe, 
    UserAvatarComponent, 
    NgSelectModule
  ],
  templateUrl: './usuarios-form.component.html',
  styleUrl: './usuarios-form.component.scss'
})
export class UsuariosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private usersService = inject(UsersService);
  
  // ...
}
```

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.ts` (473 linhas)
- `/frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.ts` (435 linhas)

**Grau de consistência**: CONSISTENTE

---

## 2. Injeção de Dependências

### Padrão Observado

**Onde aparece**: Todos os componentes e services observados

```typescript
export class UsuariosFormComponent implements OnInit {
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private perfisService = inject(PerfisService);
  private empresasService = inject(EmpresasService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  // NÃO usar constructor(private service: Service)
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Método | `inject()` function (Angular 14+) |
| Visibilidade | `private` para dependências |
| Nome da variável | camelCase, sem prefixo `_` |
| Posição | No início da classe, antes de properties |
| Constructor | Não usado para injeção (reservado para lógica mínima) |

**Exemplo real**:
```typescript
@Component({ /* ... */ })
export class UsuariosListComponent implements OnInit {
  private usersService = inject(UsersService);
  private offcanvasService = inject(NgbOffcanvas);

  usuarios: Usuario[] = [];
  loading = false;
  
  ngOnInit(): void {
    this.loadUsuarios();
  }
}
```

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.ts`
- `/frontend/src/app/core/services/users.service.ts`

**Grau de consistência**: CONSISTENTE

---

## 3. Services

### Padrão de Estrutura

**Onde aparece**: Todos os arquivos em `core/services/*.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  /**
   * Listar todos os usuários
   */
  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.API_URL);
  }

  /**
   * Buscar usuário por ID
   */
  getById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/${id}`);
  }

  /**
   * Criar novo usuário
   */
  create(data: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, data);
  }

  /**
   * Atualizar usuário
   */
  update(id: string, data: UpdateUsuarioRequest): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.API_URL}/${id}`, data);
  }

  /**
   * Deletar/Remover usuário permanentemente
   */
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  /**
   * Inativar usuário (soft delete)
   */
  inactivate(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/inativar`, {});
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Decorator | `@Injectable({ providedIn: 'root' })` sempre presente |
| Injeção | `private http = inject(HttpClient)` |
| URL Base | `environment.apiUrl + '/endpoint'` |
| Nomes de Métodos | `getAll()`, `getById()`, `create()`, `update()`, `delete()` |
| Retorno | `Observable<T>` (nunca Promise) |
| Soft Delete | Método `inactivate()` separado de `delete()` |
| Documentação | JSDoc para métodos públicos |
| Tipagem | Rigorosa com interfaces (request/response DTOs) |
| HTTP Methods | GET (.get), POST (.post), PATCH (.patch), DELETE (.delete) |

**Exemplos reais**:
- `/frontend/src/app/core/services/users.service.ts` (100 linhas)
- `/frontend/src/app/core/services/auth.service.ts` (166 linhas)
- `/frontend/src/app/core/services/perfis.service.ts`
- `/frontend/src/app/core/services/empresas.service.ts`

**Grau de consistência**: CONSISTENTE

---

## 4. State Management (AuthService Pattern)

### Padrão Observado

**Onde aparece**: `/frontend/src/app/core/services/auth.service.ts`

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  login(credentials: LoginRequest, remember = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        const storage = remember ? localStorage : sessionStorage;
        this.setSession(response, storage);
        this.currentUserSubject.next(response.usuario);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| State Container | `BehaviorSubject<T>` privado |
| Observable Público | `public currentUser$` exposto via `.asObservable()` |
| Atualização | `.next()` dentro de `.pipe(tap())` |
| Storage | localStorage para "remember me", sessionStorage para sessão |
| Constantes | `readonly` para keys de storage |
| Limpeza | Remover de ambos storages em logout |

**Exemplos reais**:
- `/frontend/src/app/core/services/auth.service.ts`

**Grau de consistência**: CONSISTENTE (padrão simples, sem NgRx)

---

## 5. Reactive Forms

### Padrão de Estrutura

**Onde aparece**: Todos os componentes de formulário (`*-form.component.ts`)

```typescript
export class UsuariosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    telefone: [''],
    email: ['', [Validators.required, Validators.email]],
    cargo: [''],
    perfilId: ['', Validators.required],
    empresaId: [''],
    senha: [''],
    ativo: [true]
  });

  isEditMode = false;
  usuarioId: string | null = null;
  loading = false;

  ngOnInit(): void {
    this.usuarioId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.usuarioId;

    if (this.isEditMode && this.usuarioId) {
      this.loadUsuario(this.usuarioId);
      this.form.get('senha')?.setValidators([Validators.minLength(6)]);
    } else {
      this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
    }
    
    this.form.get('senha')?.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.isEditMode && this.usuarioId) {
      this.usersService.update(this.usuarioId, formValue).subscribe({
        next: () => {
          this.showToast('Usuário atualizado com sucesso!', 'success');
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao atualizar', 'error');
          this.loading = false;
        }
      });
    } else {
      this.usersService.create(formValue).subscribe({
        next: () => {
          this.showToast('Usuário criado com sucesso!', 'success');
          this.router.navigate(['/usuarios']);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar', 'error');
          this.loading = false;
        }
      });
    }
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Construção | `fb.group({ campo: [default, validadores] })` |
| Validadores | `Validators.required`, `Validators.email`, `Validators.minLength()` |
| Campos Opcionais | Array vazio `[]` para validadores |
| Modo Edição | Flag `isEditMode` + `usuarioId` |
| Validação Condicional | `.setValidators()` + `.updateValueAndValidity()` em ngOnInit |
| Submit | `onSubmit()` verifica `.invalid` antes de prosseguir |
| Loading State | Flag `loading` para disable botão e spinner |
| Navegação | `router.navigate()` após sucesso |
| Feedback | SweetAlert2 toast para sucesso/erro |

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.ts` (473 linhas)

**Grau de consistência**: CONSISTENTE

---

## 6. List Components Pattern

### Padrão de Estrutura

**Onde aparece**: Todos os componentes de listagem (`*-list.component.ts`)

```typescript
export class UsuariosListComponent implements OnInit {
  private usersService = inject(UsersService);
  private offcanvasService = inject(NgbOffcanvas);

  usuarios: Usuario[] = [];
  filteredUsuarios: Usuario[] = [];
  searchQuery = '';
  loading = false;
  
  // Seleção múltipla
  selectedUsuariosIds: Set<string> = new Set();
  headerCheckboxChecked = false;

  // Ordenação
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Paginação
  currentPage = 1;
  pageSize = 10;

  // Offcanvas
  selectedUsuario: Usuario | null = null;
  loadingDetails = false;

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.loading = true;
    this.usersService.getAll().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.filterUsuarios();
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao carregar', 'error');
        this.loading = false;
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.filterUsuarios();
  }

  filterUsuarios(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsuarios = [...this.usuarios];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredUsuarios = this.usuarios.filter(u =>
        u.nome.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    }

    if (this.sortColumn) {
      this.applySorting();
    }
  }

  onSort(event: SortEvent): void {
    const column = event.column;
    
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = event.direction as 'asc' | 'desc';
    }
    
    this.applySorting();
  }

  private applySorting(): void {
    this.filteredUsuarios.sort((a, b) => {
      // Lógica de ordenação
    });
  }

  get paginatedUsuarios(): Usuario[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredUsuarios.slice(start, end);
  }

  toggleUsuarioSelection(usuarioId: string): void {
    if (this.selectedUsuariosIds.has(usuarioId)) {
      this.selectedUsuariosIds.delete(usuarioId);
    } else {
      this.selectedUsuariosIds.add(usuarioId);
    }
  }

  deleteSelectedUsuarios(): void {
    // Lógica de delete em lote
  }

  openDetailsOffcanvas(usuarioId: string, content: any): void {
    this.loadingDetails = true;
    this.selectedUsuario = null;
    
    this.offcanvasService.open(content, { position: 'end' });
    
    this.usersService.getById(usuarioId).subscribe({
      next: (usuario) => {
        this.selectedUsuario = usuario;
        this.loadingDetails = false;
      }
    });
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Arrays | `items`, `filteredItems` separados |
| Search | `searchQuery` + `onSearch()` + `filterItems()` |
| Ordenação | `sortColumn`, `sortDirection`, `applySorting()` |
| Paginação | `currentPage`, `pageSize`, getter `paginatedItems` |
| Seleção Múltipla | `Set<string>` para IDs, `headerCheckboxChecked` |
| Offcanvas | `selectedItem`, `loadingDetails`, `openDetailsOffcanvas()` |
| Loading | Flag `loading` durante carregamento inicial |
| Feedback | SweetAlert2 toast |

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.ts` (435 linhas)

**Grau de consistência**: CONSISTENTE

---

## 7. Templates HTML

### Padrão de Estrutura

**Onde aparece**: Todos os arquivos `*.component.html`

```html
<!-- Breadcrumbs -->
<div class="mb-2 align-items-center gap-2 d-flex justify-content-between flex-wrap">
  <nav aria-label="breadcrumb">
    <ol class="breadcrumb breadcrumb-arrow mb-1">
      <li class="breadcrumb-item">
        <i class="feather icon-users"></i>
      </li>
      <li class="breadcrumb-item active" aria-current="page">
        {{ "MENU.USUARIOS" | translate }}
      </li>
    </ol>
  </nav>

  <button type="button" class="btn btn-primary btn-icon-text btn-xs" 
    [routerLink]="['/usuarios/novo']">
    <i class="feather icon-plus btn-icon-prepend"></i>
    {{ 'USERS.ADD' | translate }}
  </button>
</div>

<!-- Search e Ações em Lote -->
<div class="row">
  <div class="col-md-6">
    <div class="input-icon search-inline">
      <span class="input-icon-addon">
        <i class="feather icon-search"></i>
      </span>
      <input type="text" class="form-control" 
        placeholder="{{ 'COMMON.SEARCH' | translate }}"
        [value]="searchQuery" (input)="onSearchInput($event)" />
    </div>
  </div>

  <div class="col-md-6 text-end">
    @if (selectedCount > 0) {
    <ngb-alert class="alert-custom-primary" [dismissible]="false">
      <button type="button" class="btn btn-xs btn-outline-danger" 
        (click)="deleteSelectedUsuarios()">
        {{ "BUTTONS.DELETE_SELECTED" | translate }} ({{ selectedCount }})
      </button>
    </ngb-alert>
    }
  </div>
</div>

<!-- Tabela -->
<table class="table table-hover table-striped">
  <thead>
    <tr>
      <th>
        <input class="form-check-input" type="checkbox" 
          [(ngModel)]="headerCheckboxChecked"
          (change)="toggleHeaderCheckbox()">
      </th>
      <th sortable="name" (sort)="onSort($event)">
        {{ 'USERS.NAME' | translate }}
      </th>
      <th sortable="email" (sort)="onSort($event)">
        {{ 'USERS.EMAIL' | translate }}
      </th>
      <th>{{ 'COMMON.ACTIONS' | translate }}</th>
    </tr>
  </thead>
  <tbody>
    @for (usuario of paginatedUsuarios; track usuario.id) {
    <tr>
      <td>
        <input class="form-check-input" type="checkbox" 
          [checked]="isUsuarioSelected(usuario.id)"
          (change)="toggleUsuarioSelection(usuario.id)">
      </td>
      <td>{{ usuario.nome }}</td>
      <td>{{ usuario.email }}</td>
      <td>
        <button class="btn btn-icon text-primary"
          (click)="openDetailsOffcanvas(usuario.id, detailsOffcanvas)">
          <i class="feather icon-info"></i>
        </button>
        <button class="btn btn-icon text-secondary" 
          [routerLink]="['/usuarios', usuario.id, 'editar']">
          <i class="feather icon-edit"></i>
        </button>
        <button class="btn btn-icon text-danger" 
          (click)="deleteUsuario(usuario.id, usuario.nome)">
          <i class="feather icon-trash-2"></i>
        </button>
      </td>
    </tr>
    }
  </tbody>
</table>

<!-- Paginação -->
<ngb-pagination 
  [collectionSize]="filteredUsuarios.length" 
  [(page)]="currentPage"
  [pageSize]="pageSize" 
  [boundaryLinks]="true">
</ngb-pagination>
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Control Flow | `@if`, `@for`, `@else` (Angular 17+, não `*ngIf`, `*ngFor`) |
| Interpolação | `{{ variable }}` e `{{ key \| translate }}` |
| Property Binding | `[property]="value"` |
| Event Binding | `(event)="method()"` |
| Two-way Binding | `[(ngModel)]="variable"` |
| Traduções | Pipe `translate` em todos os textos |
| Icons | Feather Icons via class `feather icon-{nome}` |
| Track By | `track item.id` em @for |
| Breadcrumbs | Sempre no topo |
| Botão Novo | Sempre ao lado do breadcrumb |
| Search | Input com ícone, placeholder traduzido |
| Tabelas | Bootstrap classes (`table`, `table-hover`, `table-striped`) |
| Botões | `btn-icon` para ações, `btn-primary` para ação principal |

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.html` (253 linhas)

**Grau de consistência**: CONSISTENTE

---

## 8. Modelos e Interfaces

### Padrão Observado

**Onde aparece**: Arquivos em `core/models/*.model.ts`

```typescript
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface PerfilUsuarioBasic {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
}

export interface EmpresaBasic {
  id: string;
  nomeFantasia: string;
  cnpj: string;
  logoUrl?: string | null;
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  telefone?: string;
  perfil: PerfilUsuarioBasic;
  ativo: boolean;
  empresaId?: string | null;
  empresa?: EmpresaBasic;
  fotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUsuarioDto {
  email: string;
  nome: string;
  senha: string;
  cargo: string;
  telefone?: string;
  perfilId: string;
  empresaId?: string;
}

export interface UpdateUsuarioDto {
  email?: string;
  nome?: string;
  senha?: string;
  cargo?: string;
  telefone?: string;
  perfilId?: string;
  ativo?: boolean;
  empresaId?: string | null;
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Arquivo | `models/{feature}.model.ts` (um por domínio) |
| Export | Named export (`export interface`) |
| Nomes | PascalCase para interfaces |
| Request DTOs | Sufixo `Request` |
| Response DTOs | Sufixo `Response` |
| Versões Reduzidas | Sufixo `Basic` |
| Nullable | `field?: string` (opcional) ou `field: string \| null` (explícito) |

**Exemplos reais**:
- `/frontend/src/app/core/services/users.service.ts` (interfaces de request/response)
- `/frontend/src/app/core/models/auth.model.ts`

**Grau de consistência**: CONSISTENTE

---

## 9. Internacionalização (i18n)

### Padrão Observado

**Onde aparece**:
- `/frontend/src/assets/i18n/pt-BR.json`
- `/frontend/src/assets/i18n/en-US.json`
- `/frontend/src/app/core/pipes/translate.pipe.ts`
- `/frontend/src/app/core/services/translate.service.ts`

**TranslatePipe**:
```typescript
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform {
  constructor(private translateService: TranslateService) {}

  transform(key: string): string {
    return this.translateService.instant(key);
  }
}
```

**Uso em template**:
```html
<button>{{ 'BUTTONS.SAVE' | translate }}</button>
<input placeholder="{{ 'COMMON.SEARCH' | translate }}" />
<th>{{ 'USERS.NAME' | translate }}</th>
```

**Arquivo de tradução** (`pt-BR.json`):
```json
{
  "MENU": {
    "USUARIOS": "Usuários",
    "EMPRESAS": "Empresas"
  },
  "USERS": {
    "NAME": "Nome",
    "EMAIL": "Email",
    "ADD": "Adicionar Usuário"
  },
  "BUTTONS": {
    "SAVE": "Salvar",
    "CANCEL": "Cancelar",
    "DELETE": "Deletar",
    "DELETE_SELECTED": "Deletar Selecionados"
  },
  "COMMON": {
    "SEARCH": "Pesquisar",
    "LOADING": "Carregando",
    "ACTIVE": "Ativo",
    "INACTIVE": "Inativo",
    "ACTIONS": "Ações"
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Pipe | Custom `translate` pipe |
| Service | `TranslateService.instant(key)` |
| Keys | UPPERCASE_SNAKE_CASE com namespaces (`MENU.USUARIOS`) |
| Estrutura JSON | Hierárquica por feature/contexto |
| Arquivos | Por locale em `/assets/i18n/{locale}.json` |
| Uso | Sempre via pipe em templates |
| Pure | `pure: false` (reage a mudanças de idioma) |

**Grau de consistência**: CONSISTENTE

---

## 10. Feedback ao Usuário (SweetAlert2)

### Padrão Observado

**Onde aparece**: Todos os componentes que executam ações (create, update, delete)

**Toast de Sucesso/Erro**:
```typescript
private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
  Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    title,
    icon,
  });
}

// Uso
this.showToast('Usuário criado com sucesso!', 'success');
this.showToast('Erro ao salvar', 'error');
```

**Confirmação de Delete**:
```typescript
deleteUsuario(usuarioId: string, nome: string): void {
  Swal.fire({
    title: '<strong>Deletar Usuário</strong>',
    html: `Tem certeza que deseja deletar <strong>${nome}</strong>?`,
    showCloseButton: true,
    showCancelButton: true,
    confirmButtonText: '<i class="feather icon-trash-2"></i> Deletar',
    cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
    allowOutsideClick: false
  }).then((result) => {
    if (!result.isConfirmed) return;
    this.confirmDelete(usuarioId);
  });
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Library | SweetAlert2 (`Swal.fire()`) |
| Toast | `toast: true`, `position: 'top-end'`, timer 3s |
| Confirmação | Modal com `showCancelButton`, HTML formatado |
| Icons | `'success'`, `'error'`, `'warning'`, `'info'` |
| Botões | Text com ícones Feather (`<i class="feather icon-{nome}"></i>`) |
| Callback | `.then((result) => { if (!result.isConfirmed) return; })` |

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.ts`
- `/frontend/src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.ts`

**Grau de consistência**: CONSISTENTE

---

## 11. Guards (Functional Guards)

### Padrão Observado

**Onde aparece**: `/frontend/src/app/core/guards/auth.guard.ts`

```typescript
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot, 
  state: RouterStateSnapshot
) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  if (authService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url.split('?')[0] } 
  });
  
  return false;
};
```

**Uso em rotas**:
```typescript
export const routes: Routes = [
  {
    path: 'usuarios',
    component: UsuariosListComponent,
    canActivate: [authGuard]
  }
];
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Tipo | `CanActivateFn` (functional guard, Angular 15+) |
| Injeção | `inject()` dentro da function |
| Nome | camelCase com sufixo `Guard` |
| Export | `export const` (não classe) |
| Retorno | `boolean` ou `UrlTree` |
| Redirect | `router.navigate()` com `queryParams: { returnUrl }` |

**Exemplos reais**:
- `/frontend/src/app/core/guards/auth.guard.ts`
- `/frontend/src/app/core/guards/admin.guard.ts`

**Grau de consistência**: CONSISTENTE

---

## 12. Directives (Sortable)

### Padrão Observado

**Onde aparece**: `/frontend/src/app/shared/directives/sortable.directive.ts`

```typescript
export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc' | '';
}

@Directive({
  selector: 'th[sortable]',
  standalone: true,
  host: {
    '[class.sortable]': 'true'
  }
})
export class SortableDirective {
  @Input() sortable: string = '';
  @Input() direction: 'asc' | 'desc' | '' = '';
  @Output() sort = new EventEmitter<SortEvent>();

  @HostBinding('class.asc') get asc() { 
    return this.direction === 'asc'; 
  }
  
  @HostBinding('class.desc') get desc() { 
    return this.direction === 'desc'; 
  }

  @HostListener('click') onClick() {
    this.rotate();
  }

  rotate() {
    if (this.direction === '') {
      this.direction = 'asc';
    } else if (this.direction === 'asc') {
      this.direction = 'desc';
    } else {
      this.direction = '';
    }

    this.sort.emit({ column: this.sortable, direction: this.direction });
  }
}
```

**Uso em template**:
```html
<th sortable="name" (sort)="onSort($event)">Nome</th>
<th sortable="email" (sort)="onSort($event)">Email</th>
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Selector | Attribute selector (`th[sortable]`) |
| Standalone | `standalone: true` |
| Host Bindings | Classes CSS dinâmicas via `@HostBinding` |
| Event Listeners | `@HostListener('click')` |
| Output | `@Output() sort = new EventEmitter<SortEvent>()` |
| Interface | Export de interfaces auxiliares (`SortEvent`) |

**Exemplos reais**:
- `/frontend/src/app/shared/directives/sortable.directive.ts`

**Grau de consistência**: CONSISTENTE

---

## 13. Componentes Reutilizáveis

### Padrão Observado

**Onde aparece**: `/frontend/src/app/shared/components/user-avatar/`

```typescript
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar">
      @if (usuario?.fotoUrl) {
        <img [src]="usuario.fotoUrl" [alt]="usuario.nome">
      } @else {
        <span class="avatar-initials">{{ getInitials() }}</span>
      }
    </div>
  `,
  styleUrl: './user-avatar.component.scss'
})
export class UserAvatarComponent {
  @Input() usuario: Usuario | null = null;
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  getInitials(): string {
    if (!this.usuario?.nome) return '?';
    const names = this.usuario.nome.split(' ');
    return names[0][0] + (names[1]?.[0] || '');
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Seletor | `app-{nome}` |
| Standalone | `standalone: true` |
| Inputs | `@Input()` tipados |
| Lógica | Métodos auxiliares simples (getInitials) |
| Template | Inline para componentes pequenos |
| Fallback | `@else` para estados sem dados |

**Exemplos reais**:
- `/frontend/src/app/shared/components/user-avatar/user-avatar.component.ts`

**Grau de consistência**: CONSISTENTE (poucos componentes compartilhados)

---

## 14. Offcanvas (Detalhes)

### Padrão Observado

**Onde aparece**: Componentes de lista

```typescript
export class UsuariosListComponent implements OnInit {
  private offcanvasService = inject(NgbOffcanvas);
  
  selectedUsuario: Usuario | null = null;
  loadingDetails = false;

  openDetailsOffcanvas(usuarioId: string, content: any): void {
    this.loadingDetails = true;
    this.selectedUsuario = null;
    
    this.offcanvasService.open(content, { 
      position: 'end',
      backdrop: true,
      keyboard: true,
      panelClass: 'offcanvas-large'
    });
    
    this.usersService.getById(usuarioId).subscribe({
      next: (usuario) => {
        this.selectedUsuario = usuario;
        this.loadingDetails = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao carregar detalhes', 'error');
        this.offcanvasService.dismiss();
      }
    });
  }
}
```

**Template**:
```html
<ng-template #detailsOffcanvas let-offcanvas>
  <div class="offcanvas-header">
    <h5>Detalhes do Usuário</h5>
    <button type="button" class="btn-close" (click)="offcanvas.dismiss()"></button>
  </div>
  <div class="offcanvas-body">
    @if (loadingDetails) {
      <div class="spinner-border"></div>
    } @else if (selectedUsuario) {
      <dl>
        <dt>Nome</dt>
        <dd>{{ selectedUsuario.nome }}</dd>
        <dt>Email</dt>
        <dd>{{ selectedUsuario.email }}</dd>
      </dl>
    }
  </div>
</ng-template>
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Service | NgbOffcanvas do ng-bootstrap |
| Template | `<ng-template>` com referência local |
| Position | `'end'` (direita) |
| Loading | Flag `loadingDetails` separado |
| Selected Item | Property `selectedUsuario` |
| Busca | Recarregar do backend ao abrir |
| Dismiss | Botão close e em caso de erro |

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.ts`

**Grau de consistência**: CONSISTENTE

---

## 15. Seleção Múltipla e Delete em Lote

### Padrão Observado

**Onde aparece**: Componentes de lista

```typescript
export class UsuariosListComponent {
  selectedUsuariosIds: Set<string> = new Set();
  headerCheckboxChecked = false;

  get selectedCount(): number {
    return this.selectedUsuariosIds.size;
  }

  toggleHeaderCheckbox(): void {
    if (this.headerCheckboxChecked) {
      this.paginatedUsuarios.forEach(u => this.selectedUsuariosIds.add(u.id));
    } else {
      this.paginatedUsuarios.forEach(u => this.selectedUsuariosIds.delete(u.id));
    }
  }

  toggleUsuarioSelection(usuarioId: string): void {
    if (this.selectedUsuariosIds.has(usuarioId)) {
      this.selectedUsuariosIds.delete(usuarioId);
    } else {
      this.selectedUsuariosIds.add(usuarioId);
    }
    this.updateHeaderCheckboxState();
  }

  private updateHeaderCheckboxState(): void {
    const total = this.paginatedUsuarios.length;
    const selected = this.paginatedUsuarios.filter(u => 
      this.selectedUsuariosIds.has(u.id)
    ).length;
    
    this.headerCheckboxChecked = total > 0 && selected === total;
  }

  deleteSelectedUsuarios(): void {
    if (this.selectedUsuariosIds.size === 0) return;

    Swal.fire({
      title: 'Deletar Usuários',
      html: `Deletar <strong>${this.selectedUsuariosIds.size}</strong> usuários?`,
      confirmButtonText: 'Deletar',
      cancelButtonText: 'Cancelar',
      showCancelButton: true
    }).then((result) => {
      if (!result.isConfirmed) return;
      
      const deleteRequests = Array.from(this.selectedUsuariosIds).map(id =>
        this.usersService.delete(id).toPromise()
      );

      Promise.all(deleteRequests).then(() => {
        this.showToast('Usuários deletados!', 'success');
        this.selectedUsuariosIds.clear();
        this.loadUsuarios();
      });
    });
  }
}
```

**Template**:
```html
<!-- Header checkbox -->
<th>
  <input type="checkbox" 
    [(ngModel)]="headerCheckboxChecked"
    (change)="toggleHeaderCheckbox()">
</th>

<!-- Row checkbox -->
<td>
  <input type="checkbox" 
    [checked]="isUsuarioSelected(usuario.id)"
    (change)="toggleUsuarioSelection(usuario.id)">
</td>

<!-- Botão de delete em lote -->
@if (selectedCount > 0) {
<button (click)="deleteSelectedUsuarios()">
  {{ "BUTTONS.DELETE_SELECTED" | translate }} ({{ selectedCount }})
</button>
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Storage | `Set<string>` para IDs selecionados |
| Header Checkbox | Seleciona/deseleciona página atual |
| Row Checkbox | `toggleSelection()` com `.has()`, `.add()`, `.delete()` |
| Sync | `updateHeaderCheckboxState()` após cada toggle |
| Count | Getter `selectedCount` |
| Batch Delete | `Promise.all()` de múltiplas requisições |
| Clear | `.clear()` após delete bem-sucedido |

**Exemplos reais**:
- `/frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.ts`

**Grau de consistência**: CONSISTENTE

---

## 16. Formulários com Modo Modal

### Padrão Observado

**Onde aparece**: Componentes de formulário

```typescript
export class UsuariosFormComponent implements OnInit {
  @Input() modalMode = false;
  @Input() presetEmpresaId?: string;
  @Output() onSave = new EventEmitter<Usuario>();
  @Output() onCancel = new EventEmitter<void>();

  handleCancel(): void {
    if (this.modalMode) {
      this.onCancel.emit();
    } else {
      this.router.navigate(['/usuarios']);
    }
  }

  onSubmit(): void {
    // Lógica de submit...
    
    if (this.modalMode) {
      this.onSave.emit(novoUsuario);
    } else {
      this.router.navigate(['/usuarios']);
    }
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Input Flag | `@Input() modalMode = false` |
| Preset Data | `@Input()` para valores pré-definidos |
| Events | `@Output() onSave`, `@Output() onCancel` |
| Navegação | Condicional: emite evento se modal, navega se não |

**Grau de consistência**: CONSISTENTE

---

## 17. Rotas

### Padrão Observado

**Onde aparece**: Arquivos `*.routes.ts`

```typescript
export const usuariosRoutes: Routes = [
  {
    path: '',
    component: UsuariosListComponent
  },
  {
    path: 'novo',
    component: UsuariosFormComponent
  },
  {
    path: ':id/editar',
    component: UsuariosFormComponent
  }
];
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Nome | `{feature}Routes` em camelCase |
| Rota Lista | Path vazio `''` |
| Rota Criar | Path `'novo'` |
| Rota Editar | Path `':id/editar'` |
| Parâmetros | `:id` para recursos dinâmicos |

**Grau de consistência**: CONSISTENTE

---

## 18. ng-select (Dropdowns)

### Padrão Observado

**Onde aparece**: Formulários com select de perfis, empresas, etc.

```typescript
// Component
perfis: PerfilUsuario[] = [];
empresas: Empresa[] = [];

ngOnInit(): void {
  this.loadPerfis();
  this.loadEmpresas();
}

private loadPerfis(): void {
  this.perfisService.findAll().subscribe({
    next: (perfis) => {
      this.perfis = perfis;
    }
  });
}
```

```html
<!-- Template -->
<ng-select 
  [items]="perfis"
  bindLabel="nome"
  bindValue="id"
  placeholder="{{ 'SELECT_PROFILE' | translate }}"
  formControlName="perfilId">
</ng-select>

<ng-select 
  [items]="empresas"
  bindLabel="nomeFantasia"
  bindValue="id"
  [clearable]="true"
  placeholder="{{ 'SELECT_COMPANY' | translate }}"
  formControlName="empresaId">
</ng-select>
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Library | `@ng-select/ng-select` (não `<select>` nativo) |
| Binding | `bindLabel` e `bindValue` para objetos |
| FormControl | Integrado com `formControlName` |
| Clearable | `[clearable]="true"` para campos opcionais |
| Placeholder | Sempre traduzido |

**Grau de consistência**: CONSISTENTE

---

## 19. Paginação

### Padrão Observado

**Onde aparece**: Componentes de lista

```typescript
currentPage = 1;
pageSize = 10;

get totalPages(): number {
  return Math.ceil(this.filteredItems.length / this.pageSize);
}

get paginatedItems(): Item[] {
  const start = (this.currentPage - 1) * this.pageSize;
  const end = start + this.pageSize;
  return this.filteredItems.slice(start, end);
}
```

```html
<ngb-pagination 
  [collectionSize]="filteredItems.length" 
  [(page)]="currentPage"
  [pageSize]="pageSize" 
  [boundaryLinks]="true">
</ngb-pagination>
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Component | `ngb-pagination` do ng-bootstrap |
| Properties | `currentPage`, `pageSize` |
| Getter | `paginatedItems` com `.slice()` |
| Two-way | `[(page)]="currentPage"` |

**Grau de consistência**: CONSISTENTE

---

## 20. Testes

### Testes Unitários

**Padrão Observado**: Poucos testes, apenas básicos

```typescript
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
```

**Grau de consistência**: INCONSISTENTE (poucos testes)

### Testes E2E (Playwright)

**Onde aparece**: `/frontend/e2e/usuarios.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('CRUD de Usuários', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/usuarios');
  });

  test('01 - Deve criar um novo usuário', async ({ page }) => {
    await page.click('[href="/usuarios/novo"]');
    await page.fill('#nome', 'Teste');
    await page.fill('#email', `teste${Date.now()}@test.com`);
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.swal2-toast')).toBeVisible();
  });
});
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Framework | Playwright |
| Setup | `test.beforeEach` com login helper |
| Nomeação | Numerados (`01 -`, `02 -`) |
| Seletores | CSS selectors (`#id`, `[attr="value"]`) |
| Dados Dinâmicos | `Date.now()` para unicidade |
| Assertions | `.toBeVisible()`, `.toContainText()` |

**Grau de consistência**: CONSISTENTE (E2E), INCONSISTENTE (unitários)

---

## Limitações e Inconsistências Atuais

### Áreas sem Padrão Consolidado ou Implementação Incompleta

1. **Testes Unitários**: 
   - Apenas testes básicos (create component) encontrados
   - Sem testes de services com `HttpClientTestingModule`
   - Sem testes de componentes complexos (forms, lists)
   - Sem mocks de dependências

2. **Unsubscribe de Observables**:
   - Nenhum componente faz `.unsubscribe()` ou usa `takeUntil()`
   - Potencial vazamento de memória em componentes destruídos

3. **HTTP Interceptor**:
   - Pasta `core/interceptors/` existe mas não há interceptor implementado
   - JWT não é injetado automaticamente nos headers
   - Sem tratamento global de erros HTTP

4. **Error Boundary Global**:
   - Sem `ErrorHandler` customizado
   - Cada componente trata seus próprios erros
   - Sem logger centralizado

5. **Logging**:
   - Sem Winston/Pino ou serviço de logging
   - `console.error()` não observado de forma consistente

6. **Lazy Loading**:
   - Todas as rotas são carregadas imediatamente
   - Sem code splitting por feature

7. **State Management**:
   - Apenas `BehaviorSubject` em `AuthService`
   - Sem NgRx ou Akita para estado global
   - Cada componente gerencia seu próprio estado local

8. **TypeScript Strict Mode**:
   - Configuração de `strict: true` não confirmada
   - Possível uso de `any` em alguns lugares

9. **Componentes Reutilizáveis**:
   - Poucos componentes em `shared/components/`
   - Lógica repetida entre componentes (ex: avatar upload)

10. **Guards em Rotas**:
    - Guards existem mas não estão aplicados em todas as rotas
    - Algumas rotas podem estar desprotegidas

### Pontos que Precisam Decisão Futura

- Implementar testes unitários completos?
- Adicionar `takeUntil()` para unsubscribe automático?
- Criar HTTP interceptor para JWT e error handling?
- Implementar ErrorHandler global?
- Adicionar serviço de logging?
- Implementar lazy loading por feature?
- Adotar NgRx para state management?
- Ativar TypeScript strict mode?
- Criar mais componentes reutilizáveis?
- Aplicar guards em todas as rotas protegidas?

---

**Grau de Consistência Geral**: CONSISTENTE em padrões de código, INCONSISTENTE em áreas de infraestrutura (testes, error handling, performance)
| **Guards** | **NÃO OBSERVADO** - Sem guards nas rotas | Potencial gap |
| **Lazy Loading** | **NÃO OBSERVADO** - Tudo importado direto | Sem lazy loading |

**Inconsistência**: Guards de rota **não consolidados** (sem verificação de autenticação nas rotas)

**Consistência**: **PARCIAL**

---

## 3. Serviços

### Padrão Observado

Services usam `HttpClient` para comunicação com API e `inject()` para dependency injection (Angular 14+).

**Arquivo**: `src/app/core/services/users.service.ts` (100 linhas)

```typescript
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/usuarios`;

  /**
   * Listar todos os usuários
   */
  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.API_URL);
  }

  /**
   * Buscar usuário por ID
   */
  getById(id: string): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/${id}`);
  }

  /**
   * Criar novo usuário
   */
  create(data: CreateUsuarioDto): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, data);
  }

  /**
   * Atualizar usuário
   */
  update(id: string, data: UpdateUsuarioDto): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.API_URL}/${id}`, data);
  }

  /**
   * Deletar/Remover usuário
   */
  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  /**
   * Inativar usuário
   */
  inactivate(id: string): Observable<any> {
    // Implementação...
  }
}
```

**Arquivo**: `src/app/core/services/auth.service.ts` (166 linhas)

```typescript
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  login(credentials: LoginRequest, remember = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        const storage = remember ? localStorage : sessionStorage;
        this.setSession(response, storage);
        this.initializeTokenRefresh();
      })
    );
  }

  logout(): void {
    // Remove tokens...
    this.currentUserSubject.next(null);
    this.clearTokenRefreshInterval();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Decorator** | `@Injectable({ providedIn: 'root' })` | Sempre para services |
| **Injeção** | `private http = inject(HttpClient)` | Moderna (sem constructor) |
| **URL Base** | `environment.apiUrl + '/endpoint'` | Via environment config |
| **Método CRUD** | `getAll()`, `getById()`, `create()`, `update()`, `delete()` | Nomes padronizados |
| **Retorno** | `Observable<T>` (nunca Promise) | RxJS sempre |
| **Inativação** | `inactivate()` separado de `delete()` | Soft delete awareness |
| **Estado Local** | `BehaviorSubject` para estado (auth service) | Simples, sem NgRx |
| **Armazenamento** | localStorage/sessionStorage com fallback | Dual storage |
| **Comentários** | JSDoc para métodos públicos | Documentação básica |
| **Tipagem** | Rigorosa com interfaces `DTO` | Sempre tipado |
| **Pipes** | `.pipe()` com `.tap()` para side effects | RxJS funcional |

**Padrões de AuthService específicos**:
- `login()` retorna Observable
- `.pipe(tap())` para atualizar estado após login
- `initializeTokenRefresh()` automático
- `clearTokenRefreshInterval()` em logout

**Consistência**: **CONSISTENTE**

---

## 4. Formulários Reativos

### Padrão Observado

**Arquivo**: `src/app/views/pages/usuarios/usuarios-form/usuarios-form.component.ts` (453 linhas)

```typescript
@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, UserAvatarComponent, NgSelectModule],
  templateUrl: './usuarios-form.component.html',
  styleUrl: './usuarios-form.component.scss'
})
export class UsuariosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private usersService = inject(UsersService);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    telefone: [''],
    email: ['', [Validators.required, Validators.email]],
    cargo: ['', []],
    perfilId: ['', Validators.required],
    empresaId: [''],
    senha: ['', []],
    ativo: [true]
  });

  @Input() modalMode = false;
  @Input() presetEmpresaId?: string;
  @Output() onSave = new EventEmitter<Usuario>();
  @Output() onCancel = new EventEmitter<void>();

  isEditMode = false;
  usuarioId: string | null = null;
  loading = false;
  uploadingAvatar = false;

  ngOnInit(): void {
    // Lógica de inicialização...
  }

  handleCancel(): void {
    if (this.modalMode) {
      this.onCancel.emit();
    } else {
      this.router.navigate([this.getRedirectUrl()]);
    }
  }

  // Método de submit
  handleSubmit(): void {
    if (this.form.invalid) return;
    
    const data = this.isEditMode 
      ? this.usersService.update(this.usuarioId!, this.form.value)
      : this.usersService.create(this.form.value);

    data.subscribe({
      next: (result) => {
        Swal.fire({
          icon: 'success',
          title: 'Sucesso',
          text: this.isEditMode ? 'Usuário atualizado' : 'Usuário criado'
        });
        // Navega ou emite evento
      },
      error: (error) => {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: error.error?.message || 'Erro ao salvar'
        });
      }
    });
  }
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Construção** | `fb.group({ campo: [default, validadores] })` | FormBuilder, não new FormGroup |
| **Validadores** | `Validators.required`, `Validators.email`, `Validators.minLength()` | Padrão Angular |
| **Campos Opcionais** | Array vazio `[]` como validadores | Sem validação = opcional |
| **Modo Modal** | `@Input() modalMode` com `@Output()` events | Formulário reutilizável |
| **Edição vs Criação** | `isEditMode` flag + `usuarioId` | Lógica condicional no submit |
| **Estado** | `loading`, `uploadingAvatar`, `showPassword` | Flags booleanas |
| **Navegação** | `router.navigate()` após sucesso | Sem redirecionamento automático |
| **Feedback** | SweetAlert2 (`Swal.fire()`) | Pop-up de sucesso/erro |
| **Observables** | `.subscribe()` com `.next()` e `.error()` | RxJS manual |
| **Tipagem** | Métodos tipados, inputs/outputs tipados | Rigorosa |

**Padrão de Avatar**:
- Campo `fotoUrl` no formulário
- Separado upload de arquivo com `FileInterceptor`
- Preview com `previewUrl`
- Input separado `avatarFile`

**Padrão de Perfis e Empresas**:
- Arrays carregados em `ngOnInit` via services
- Select dropdown com `ng-select` (não `<select>` nativo)
- Carregamento condicional (perfis sempre, empresas se não for cliente)

**Padrão de Validação Condicional**:
```typescript
get senhaRequired(): boolean {
  return !this.isEditMode; // Senha só obrigatória na criação
}

get isPerfilCliente(): boolean {
  // Lógica de verificação
}

get shouldDisableEmpresaField(): boolean {
  return this.isPerfilCliente && this.isEditingOwnUser;
}
```

**Consistência**: **CONSISTENTE**

---

## 5. Comunicação com Backend

### Padrão Observado

Toda comunicação passa por services que retornam Observables.

**Fluxo típico**:
1. Componente injeta service
2. Chama método do service (retorna Observable)
3. `.subscribe()` com `next`, `error`, `complete`
4. Atualiza estado local no `.next()`
5. Exibe erro com SweetAlert2 no `.error()`

**Exemplo**:
```typescript
this.usersService.create(data).subscribe({
  next: (result) => {
    this.currentUser = result;
    Swal.fire({ icon: 'success', title: 'Salvo' });
  },
  error: (error) => {
    Swal.fire({ icon: 'error', title: 'Erro', text: error.error?.message });
  }
});
```

**Interceptors**: Não observados no código (potencial gap para JWT injection)

**Tipagem de Respostas**: Interfaces em `core/models/auth.model.ts`

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **HTTP Library** | HttpClient (padrão Angular) | Injetado em services |
| **Methods** | `.get()`, `.post()`, `.patch()`, `.delete()` | RESTful |
| **Retorno** | `Observable<T>` | Nunca Promise convertida |
| **Tipagem** | `Observable<Usuario>`, `Observable<Empresa[]>` | Segura |
| **Erros** | `.error()` callback com `error.error.message` | Backend retorna message field |
| **Feedback** | SweetAlert2 para sucesso/erro | UI feedback imediata |
| **Loading Flag** | `loading = true/false` during requests | Disable buttons e mostrar spinner |
| **Unsubscribe** | **NÃO OBSERVADO** - Memory leak potencial | Sem takeUntil ou OnDestroy |

**Inconsistência**: Sem unsubscribe em componentes (potencial vazamento de memória)

**Consistência**: **PARCIAL**

---

## 6. Modelos e Interfaces

### Padrão Observado

**Arquivo**: `src/app/core/models/auth.model.ts`

```typescript
export interface LoginRequest {
  email: string;
  senha: string;
}

export interface PerfilUsuarioBasic {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
}

export interface EmpresaBasic {
  id: string;
  nome: string;
  cnpj: string;
  logoUrl?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
    cargo?: string;
    perfil: PerfilUsuarioBasic;
    empresaId: string;
    fotoUrl?: string | null;
  };
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  telefone?: string;
  perfil: PerfilUsuarioBasic;
  ativo: boolean;
  empresaId?: string;
  empresa?: EmpresaBasic;
  fotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Arquivo** | `models/auth.model.ts` (um por feature) | Centralizado por domínio |
| **Export** | Named export (interfaces, não classes) | `export interface X` |
| **Nomes** | PascalCase para interfaces | `Usuario`, `LoginRequest` |
| **Request DTOs** | Sufixo `Request` ou `Dto` | `LoginRequest`, `CreateUsuarioDto` |
| **Response DTOs** | Sufixo `Response` | `LoginResponse` |
| **Basic Models** | Sufixo `Basic` para versões reduzidas | `PerfilUsuarioBasic` |
| **Tipagem** | Campos exatos, sem generics | Simples e direto |
| **Nullable** | `?` para opcionais, `string | null` para explícito | Consistente |

**Consistência**: **CONSISTENTE**

---

## 7. Componentes Compartilhados

### Padrão Observado

Componentes reutilizáveis em `shared/components/`.

**Exemplo observado**: `user-avatar/` (componente de avatar do usuário)

```
frontend/src/app/shared/components/
└── user-avatar/
    ├── user-avatar.component.ts
    ├── user-avatar.component.html
    └── user-avatar.component.scss
```

**Padrão de uso**:
```typescript
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';

@Component({
  imports: [UserAvatarComponent],
  template: `<app-user-avatar [usuario]="usuario"></app-user-avatar>`
})
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Seletor** | `app-{nome}` | `app-user-avatar`, `app-button-group` |
| **Standalone** | `standalone: true` | Sempre |
| **Inputs** | `@Input() usuario: Usuario` | Prop-like |
| **Outputs** | `@Output() clicked = new EventEmitter()` | Event emitters |
| **Encapsulation** | ViewEncapsulation.None (default) | Sem isolamento CSS |

**Componentes observados no projeto**:
- `user-avatar/` - Display de avatar de usuário

**Consistência**: **CONSISTENTE** (poucos componentes reutilizáveis no código atual)

---

## 8. Testes

### Padrão Observado

**Arquivo**: `src/app/app.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestureTest({
      imports: [AppComponent],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'demo1' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('demo1');
  });
});
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Framework** | Jasmine (describe, it, expect) | Padrão Angular |
| **Fixture** | `TestBed.createComponent()` | Teste por componente |
| **Setup** | `beforeEach` async com `compileComponents()` | Padrão |
| **Assertions** | `expect(value).toBeTruthy()` | Jasmine matchers |
| **Mocks** | **NÃO OBSERVADO** em unit tests | HttpClientTestingModule não visto |

**E2E Tests**: Playwright (não Protractor/Cypress)

**Arquivo**: `frontend/e2e/usuarios.spec.ts` (360 linhas)

```typescript
import { test, expect, Page } from '@playwright/test';

const TEST_USER = {
  nome: 'Usuário Teste E2E',
  email: `teste.e2e.${Date.now()}@reiche.com`,
  cargo: 'Tester Automation',
  perfil: 'COLABORADOR',
  senha: 'senha123456'
};

test.describe('CRUD de Usuários', () => {
  test.beforeEach(async ({ page }) => {
    // Login helper
    await login(page);
    await page.goto('http://localhost:4200/usuarios');
  });

  test('01 - Deve criar um novo usuário', async ({ page }) => {
    await page.click('a[href="/usuarios/novo"]');
    await page.fill('input#nome', TEST_USER.nome);
    await page.fill('input#email', TEST_USER.email);
    // ... preenche form
    await page.click('button[type="submit"]');
    
    // Assertion
    await expect(page.locator('.swal2-toast')).toBeVisible();
  });

  test('02 - Deve buscar usuários na lista', async ({ page }) => {
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    // ...
  });
});
```

**Padrões Playwright observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Framework** | Playwright (browser automation) | Não Cypress, não Protractor |
| **Setup** | Global auth helper function | Login antes de cada teste |
| **Seletores** | CSS selectors diretos | `input#email`, `a[href="/usuarios/novo"]` |
| **Waits** | `.waitForURL()`, `.waitForTimeout()`, `.toBeVisible()` | Explícitos |
| **Assertions** | `expect(locator).toBeVisible()` | Playwright assertions |
| **Nomes** | Numerados (`01 -`, `02 -`) | Ordem de execução clara |
| **Data** | TEST_USER com timestamp no email | Dados dinâmicos |
| **Comandos** | `.fill()`, `.click()`, `.selectOption()` | Ações simples e diretas |
| **Feedback** | Verifica toast de sucesso | UI feedback validation |
| **Location** | `frontend/e2e/` | Pasta própria |

**Padrões E2E específicos**:
- Helpers de login para reutilização
- Testes por feature (CRUD de usuários)
- Validações visuais (toast, mensagens de sucesso)
- Foco em fluxos de usuário end-to-end

**Consistência**: **CONSISTENTE**

---

## 9. Tratamento de Erros

### Padrão Observado

Erros são capturados no `.error()` callback do subscribe.

```typescript
this.usersService.create(data).subscribe({
  next: (result) => { /* sucesso */ },
  error: (error) => {
    Swal.fire({
      icon: 'error',
      title: 'Erro ao salvar',
      text: error.error?.message || 'Erro desconhecido'
    });
  }
});
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Captura** | `.error()` callback | RxJS error handling |
| **Mensagem** | `error.error.message` fallback para genérica | Backend retorna message field |
| **UI Feedback** | SweetAlert2 (modal ou toast) | Sempre visual |
| **Log** | **NÃO OBSERVADO** - Sem console.error ou logger | Potencial gap |
| **Tratamento Global** | **NÃO OBSERVADO** - HttpErrorResponse não centralizado | Sem interceptor de erro |

**Inconsistência**: Sem error logging centralizado, sem interceptor global de erros

**Consistência**: **INCONSISTENTE**

---

## 10. Guards e Interceptors

### Padrão Observado

**Guards**: Existem em `core/guards/` mas **não consolidados em rotas**

**Arquivo estrutura**: `core/guards/` + `core/interceptors/`

**Observação**: Estes diretórios existem mas conteúdo não analisado (não encontrado em busca)

**Inconsistência**: Guards e interceptors definem mas não são usados em rotas observadas

**Padrão esperado (não observado)**:
```typescript
export const usuariosRoutes: Routes = [
  {
    path: 'usuarios',
    component: UsuariosListComponent,
    canActivate: [AuthGuard, RolesGuard]
  }
];
```

**Consistência**: **INCONSISTENTE** (estrutura existe, uso não consolidado)

---

## 11. Configuração de Ambiente

### Padrão Observado

**Arquivo**: `environments/environment.ts` (padrão Angular)

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api' // ou variável
};
```

**Uso em services**:
```typescript
private readonly API_URL = `${environment.apiUrl}/usuarios`;
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Arquivo** | `environments/environment.ts` e `environment.prod.ts` | Angular standard |
| **Propriedades** | `production`, `apiUrl`, `apiKey` (observadas) | Configuráveis por ambiente |
| **Acesso** | Import direto em services | Nunca em template |
| **Base URL** | Centralizada em `apiUrl` | Evita hardcoding |

**Consistência**: **CONSISTENTE**

---

## 12. Package.json e Scripts

### Padrão Observado

**Arquivo**: `frontend/package.json`

```json
{
  "scripts": {
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Scripts** | Prefixo `test:` para testes | `test`, `test:e2e`, `test:e2e:ui` |
| **Desenvolvimento** | `start` (ng serve) | Padrão Angular |
| **Build** | Separado por config (`ng build --configuration production`) | Não há script explícito |
| **Testes E2E** | Múltiplas variações (ui, headed, debug) | Flexibilidade |

**Consistência**: **CONSISTENTE**

---

## 13. Padrão de Nomes de Arquivos

### Padrão Observado

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componente | `{nome}.component.ts/html/scss/spec.ts` | `usuarios-form.component.ts` |
| Serviço | `{nome}.service.ts` | `users.service.ts` |
| Modelo | `{nome}.model.ts` | `auth.model.ts` |
| Guard | `{nome}.guard.ts` | `auth.guard.ts` |
| Interceptor | `{nome}.interceptor.ts` | `http.interceptor.ts` |
| Diretiva | `{nome}.directive.ts` | `highlight.directive.ts` |
| Pipe | `{nome}.pipe.ts` | `translate.pipe.ts` |
| Rota | `{nome}.routes.ts` | `usuarios.routes.ts` |
| Módulo | `{nome}.module.ts` | `shared.module.ts` (legacy?) |

**Padrão de nomes**:
- **kebab-case** para arquivos (`usuarios-form.component.ts`)
- **PascalCase** para classes/interfaces (`UsuariosFormComponent`)
- **camelCase** para funções e variáveis

**Consistência**: **CONSISTENTE**

---

## Resumo - Consistência do Frontend

| Aspecto | Consistência | Notas |
|---------|--------------|-------|
| Estrutura de Componentes | CONSISTENTE | Standalone, bem organizado |
| Rotas | PARCIAL | Sem guards, sem lazy loading |
| Serviços | CONSISTENTE | HttpClient, Observables, injeção moderna |
| Formulários Reativos | CONSISTENTE | FormBuilder, validadores padrão |
| Comunicação com Backend | PARCIAL | Sem interceptors, sem unsubscribe |
| Modelos e Interfaces | CONSISTENTE | Bem tipados, organizados por feature |
| Componentes Compartilhados | CONSISTENTE | Poucos, mas bem feitos |
| Testes Unitários | INCONSISTENTE | Básicos, sem mocks completos |
| Testes E2E | CONSISTENTE | Playwright, bem estruturado |
| Tratamento de Erros | INCONSISTENTE | Sem logger global, sem interceptor |
| Guards e Interceptors | INCONSISTENTE | Estrutura existe, uso não consolidado |
| Configuração de Ambiente | CONSISTENTE | Padrão Angular |
| Nomes de Arquivos | CONSISTENTE | kebab-case, padrão claro |

---

## Limitações e Gaps - Frontend

1. **Guards não integrados**: Estrutura existe em `core/guards/` mas não são aplicados às rotas (sem autenticação obrigatória)

2. **Lazy Loading ausente**: Todas as rotas são carregadas imediatamente (sem code splitting)

3. **Interceptors não consolidados**: Estrutura existe mas não há integração com HttpClient (sem injeção automática de JWT)

4. **Memory Leaks potenciais**: Componentes não fazem unsubscribe de Observables (sem takeUntil/unsubscribe em OnDestroy)

5. **Error Handler global**: Não há tratamento centralizado de HttpErrorResponse (cada componente trata erro)

6. **Testes unitários básicos**: Só encontrados em app.component.spec.ts (sem testes em serviços/componentes)

7. **Testes de serviços**: HttpClientTestingModule não observado (sem mock de requisições em testes)

8. **Logger centralizado**: Sem Winston/Pino no frontend (potencial gap para debugging)

9. **State Management**: Sem NgRx (BehaviorSubject simples em AuthService apenas)

10. **TypeScript stricto**: Sem `strict: true` confirmado em tsconfig (potencial com loose typing)

11. **Componentes com lógica pesada**: Formulários com 453 linhas (potencial refactor)

12. **Armazenamento dual localStorage/sessionStorage**: Sem abstração (cada serviço implementa seu próprio)

13. **Validação de perfil em template**: Lógica "isPerfilCliente" está no componente (deveria ser directive ou pipe)

14. **Testes E2E timing**: Uso de `.waitForTimeout(500)` (flaky, deveria usar waits específicos)

15. **Avatar upload**: Padrão não consolidado (implementado em usuarios-form mas não reutilizável)
