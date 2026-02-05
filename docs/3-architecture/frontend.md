# Arquitetura do Frontend

**Última atualização:** 2026-02-04  
**Status:** Documentação consolidada (baseado em código existente)

---

## Propósito deste Documento

Descrever a arquitetura detalhada do frontend da aplicação Reiche Academy,
focando em implementação Angular, padrões de componentes e organização.

**Para stack tecnológico consolidado, consulte:** [overview.md](./overview.md#2-stack-tecnológico-consolidado)

---

## 1. Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.config.ts         # Configuração Angular standalone
│   │   ├── app.routes.ts         # Rotas principais
│   │   ├── app.component.ts      # Root component
│   │   ├── core/                 # Funcionalidades centrais
│   │   │   ├── services/         # Serviços globais
│   │   │   ├── guards/           # Route guards
│   │   │   ├── interceptors/     # HTTP interceptors
│   │   │   ├── models/           # Interfaces e tipos
│   │   │   └── pipes/            # Pipes personalizados
│   │   ├── shared/               # Componentes compartilhados
│   │   │   ├── components/       # UI reutilizáveis
│   │   │   ├── directives/       # Directives personalizadas
│   │   │   └── utils/            # Funções utilitárias
│   │   └── views/                # Páginas e layouts
│   │       ├── layout/           # Componentes de layout
│   │       ├── pages/            # Páginas principais
│   │       └── partials/         # Componentes parciais
│   ├── assets/
│   │   ├── i18n/                 # Traduções
│   │   ├── images/               # Imagens estáticas
│   │   └── styles/               # Estilos globais
│   ├── environments/             # Configurações de ambiente
├── e2e/                          # Testes E2E (Playwright)
├── angular.json                  # Configuração Angular CLI
├── package.json                  # Dependências e scripts
├── tsconfig.json                 # Configuração TypeScript
├── playwright.config.ts          # Configuração Playwright
└── Dockerfile                    # Build Docker
```

---

## 2. Arquitetura de Componentes

### Standalone Components (Angular 18+)

**Padrão adotado:**
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, OtherComponents],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss']
})
export class ExampleComponent {
  // Component logic
}
```

**Características:**
- Sem NgModules explícitos
- Imports diretos no componente
- Maior granularidade de dependências
- Melhor tree-shaking

### Organização por Feature

```
views/
├── layout/                       # Layout principal da aplicação
│   ├── base.component.ts        # Container com sidebar/navbar
│   ├── navbar.component.ts       # Barra de navegação superior
│   ├── sidebar.component.ts      # Menu lateral
│   └── footer.component.ts       # Rodapé
├── pages/                        # Páginas de negócio
│   ├── auth/                     # Autenticação
│   │   ├── login.component.ts
│   │   ├── register.component.ts
│   │   └── forgot-password.component.ts
│   ├── dashboard/                 # Dashboard principal
│   ├── usuarios/                 # Gestão de usuários
│   │   ├── usuarios-list.component.ts
│   │   ├── usuarios-form.component.ts
│   │   └── usuarios-details.component.ts
│   ├── empresas/                 # Gestão de empresas
│   └── pilares/                  # Gestão de pilares PDCA
└── partials/                     # Componentes reutilizáveis
    ├── user-avatar/              # Avatar de usuário
    ├── sortable-table/           # Tabela ordenável
    └── multi-select/             # Seleção múltipla
```

---

## 3. Routing e Navegação

### Configuração de Rotas

**Arquivo:** `src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  {
    path: '',
    component: BaseComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      
      // Rotas lazy loaded
      {
        path: 'usuarios',
        loadComponent: () => import('./pages/usuarios/usuarios-list.component').then(m => m.UsuariosListComponent),
        canActivate: [authGuard]
      },
      {
        path: 'usuarios/novo',
        loadComponent: () => import('./pages/usuarios/usuarios-form.component').then(m => m.UsuariosFormComponent),
        canActivate: [authGuard, adminGuard]
      }
    ]
  },
  
  // Rotas públicas
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent)
  },
  
  // Fallback
  { path: '**', redirectTo: '/dashboard' }
];
```

### Guards Implementados

**authGuard:**
```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }
  
  return true;
};
```

**adminGuard:**
```typescript
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  if (!authService.hasRole(['ADMINISTRADOR'])) {
    router.navigate(['/dashboard']);
    return false;
  }
  
  return true;
};
```

### Lazy Loading

**Benefícios implementados:**
- Redução do bundle inicial
- Carregamento sob demanda de features
- Melhor performance inicial

**Módulos lazy loaded:**
- `/usuarios` - Gestão de usuários
- `/empresas` - Gestão de empresas  
- `/pilares` - Gestão de pilares
- `/auth` - Fluxo de autenticação

---

## 4. Comunicação com Backend

### Services Pattern

**BaseService abstrato:**
```typescript
@Injectable({ providedIn: 'root' })
export abstract class BaseService<T> {
  protected http = inject(HttpClient);
  protected apiUrl = environment.apiUrl;

  abstract getEndpoint(): string;

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(`${this.apiUrl}/${this.getEndpoint()}`);
  }

  getById(id: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${this.getEndpoint()}/${id}`);
  }

  create(data: Partial<T>): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${this.getEndpoint()}`, data);
  }

  update(id: string, data: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${this.getEndpoint()}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${this.getEndpoint()}/${id}`);
  }
}
```

### AuthService

**Funcionalidades:**
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // JWT tokens
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        tap(response => this.setSession(response))
      );
  }

  logout(): void {
    this.clearSession();
    this.router.navigate(['/auth/login']);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return token && !this.isTokenExpired(token);
  }

  hasRole(roles: string[]): boolean {
    const user = this.getCurrentUser();
    return user ? roles.includes(user.perfil.codigo) : false;
  }

  // Storage management
  private setSession(authResponse: AuthResponse): void {
    const storage = authResponse.rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.TOKEN_KEY, authResponse.accessToken);
    storage.setItem(this.REFRESH_TOKEN_KEY, authResponse.refreshToken);
  }
}
```

### HTTP Interceptor

**JWT Interceptor:**
```typescript
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();
    
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
```

---

## 5. Gerenciamento de Estado

### Approach: Services + BehaviorSubject

**Estado global com Subjects:**
```typescript
@Injectable({ providedIn: 'root' })
export class StateService {
  // Usuário atual
  private currentUser$$ = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUser$$.asObservable();

  // Estado de loading global
  private loading$$ = new BehaviorSubject<boolean>(false);
  loading$ = this.loading$$.asObservable();

  // Estado de notificações
  private notifications$$ = new BehaviorSubject<Notification[]>([]);
  notifications$ = this.notifications$$.asObservable();

  updateUser(user: User): void {
    this.currentUser$$.next(user);
  }

  setLoading(loading: boolean): void {
    this.loading$$.next(loading);
  }

  addNotification(notification: Notification): void {
    const current = this.notifications$$.value;
    this.notifications$$.next([...current, notification]);
  }
}
```

### Quando usar BehaviorSubject

- **Estado do usuário:** Dados de autenticação e perfil
- **Loading states:** Indicadores de carregamento
- **Notificações:** Sistema de toast/alerts
- **Form state:** Dados de formulários complexos
- **UI state:** Estado de componentes compartilhados

### Padrão RxJS

**Unsubscribe automático:**
```typescript
export class ExampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Destroy();

  ngOnInit() {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
  }
}
```

---

## 6. Formulários e Validação

### Reactive Forms Pattern

**FormBuilder approach:**
```typescript
export class UsuarioFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private usuariosService = inject(UsuariosService);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    perfilId: ['', Validators.required],
    empresaId: [null],
    senha: ['', [Validators.minLength(6)]],
    ativo: [true]
  });

  ngOnInit() {
    if (this.isEditMode) {
      this.loadUsuario();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.markAllAsTouched();
      return;
    }

    const operation = this.isEditMode 
      ? this.usuariosService.update(this.usuarioId, this.form.value)
      : this.usuariosService.create(this.form.value);

    operation.subscribe({
      next: () => this.handleSuccess(),
      error: (err) => this.handleError(err)
    });
  }

  private markAllAsTouched(): void {
    Object.values(this.form.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
```

### Validações Customizadas

**Exemplo - Senha forte:**
```typescript
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const isValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

    return isValid ? null : { strongPassword: true };
  };
}
```

---

## 7. Componentes de UI Reutilizáveis

### UserAvatar Component

```typescript
@Component({
  selector: 'app-user-avatar',
  standalone: true,
  imports: [CommonModule, NgIf],
  template: `
    <div class="user-avatar" [class.small]="size === 'small'">
      @if (imageUrl) {
        <img [src]="imageUrl" [alt]="name" class="avatar-img" />
      } @else {
        <div class="avatar-initials">{{ initials }}</div>
      }
    </div>
  `,
  styleUrls: ['./user-avatar.component.scss']
})
export class UserAvatarComponent {
  @Input() name: string = '';
  @Input() imageUrl: string | null = null;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  get initials(): string {
    return this.name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
```

### SortableDirective

**Diretiva de ordenação de tabelas:**
```typescript
@Directive({
  selector: '[appSortable]',
  standalone: true
})
export class SortableDirective implements OnInit {
  @Input() appSortable: string = '';
  @Output() sort = new EventEmitter<{ field: string; direction: 'asc' | 'desc' }>();

  private direction: 'asc' | 'desc' = 'asc';
  private el = inject(ElementRef);

  ngOnInit() {
    this.el.nativeElement.addEventListener('click', () => {
      this.direction = this.direction === 'asc' ? 'desc' : 'asc';
      this.sort.emit({
        field: this.appSortable,
        direction: this.direction
      });
    });
  }
}
```

### MultiSelect Component

```typescript
@Component({
  selector: 'app-multi-select',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule],
  template: `
    <ng-select
      [items]="items"
      [(ngModel)]="selectedItems"
      [bindLabel]="bindLabel"
      [bindValue]="bindValue"
      [multiple]="true"
      [placeholder]="placeholder"
      (change)="onChange.emit(selectedItems)"
    ></ng-select>
  `
})
export class MultiSelectComponent<T> {
  @Input() items: T[] = [];
  @Input() bindLabel: string = 'name';
  @Input() bindValue: string = 'id';
  @Input() placeholder: string = 'Selecione...';
  @Input() selectedItems: T[] = [];
  @Output() onChange = new EventEmitter<T[]>();
}
```

---

## 8. Internacionalização

### Implementação Custom

**TranslatePipe:**
```typescript
@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translations = new BehaviorSubject<Record<string, string>>({});
  private lang = 'pt-BR';

  constructor() {
    this.loadTranslations();
  }

  transform(key: string): string {
    const value = this.translations.value[key];
    return value || key;
  }

  private async loadTranslations(): Promise<void> {
    try {
      const translations = await fetch(`/assets/i18n/${this.lang}.json`).then(res => res.json());
      this.translations.next(translations);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  }
}
```

### Estrutura de Traduções

**`assets/i18n/pt-BR.json`:**
```json
{
  "auth": {
    "login": "Entrar",
    "logout": "Sair",
    "email": "E-mail",
    "password": "Senha",
    "forgot_password": "Esqueci minha senha"
  },
  "users": {
    "title": "Usuários",
    "create": "Novo Usuário",
    "edit": "Editar Usuário",
    "delete": "Excluir Usuário",
    "name": "Nome",
    "profile": "Perfil"
  },
  "common": {
    "save": "Salvar",
    "cancel": "Cancelar",
    "delete": "Excluir",
    "edit": "Editar",
    "loading": "Carregando...",
    "success": "Sucesso",
    "error": "Erro"
  }
}
```

---

## 9. Feedback Visual e UX

### SweetAlert2 Integration

**SwalService:**
```typescript
@Injectable({ providedIn: 'root' })
export class SwalService {
  success(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 3000,
      showConfirmButton: false
    });
  }

  error(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      icon: 'error',
      title,
      text
    });
  }

  confirm(title: string, text?: string): Promise<SweetAlertResult> {
    return Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: 'Não'
    });
  }

  toast(title: string, icon: 'success' | 'error' | 'warning' | 'info' = 'success'): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title,
      showConfirmButton: false,
      timer: 3000
    });
  }
}
```

### Uso em Componentes

```typescript
export class UsuariosListComponent {
  private swalService = inject(SwalService);
  private usuariosService = inject(UsuariosService);

  async deleteUsuario(id: string): Promise<void> {
    const result = await this.swalService.confirm(
      'Excluir Usuário',
      'Tem certeza que deseja excluir este usuário?'
    );

    if (result.isConfirmed) {
      this.usuariosService.delete(id).subscribe({
        next: () => {
          this.swalService.success('Usuário excluído com sucesso');
          this.loadUsuarios();
        },
        error: (err) => {
          this.swalService.error('Erro', err?.error?.message || 'Erro ao excluir usuário');
        }
      });
    }
  }
}
```

---

## 10. Offcanvas e Detalhes

### NgbOffcanvas Integration

**UserDetails Offcanvas:**
```typescript
@Component({
  selector: 'app-user-details-offcanvas',
  standalone: true,
  imports: [CommonModule, UserAvatarComponent],
  template: `
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">Detalhes do Usuário</h5>
      <button type="button" class="btn-close" (click)="dismiss()"></button>
    </div>
    <div class="offcanvas-body">
      <div class="text-center mb-3">
        <app-user-avatar [name]="user?.nome || ''" [imageUrl]="user?.fotoUrl" size="large"></app-user-avatar>
      </div>
      
      <div class="user-details">
        <p><strong>Nome:</strong> {{ user?.nome }}</p>
        <p><strong>E-mail:</strong> {{ user?.email }}</p>
        <p><strong>Perfil:</strong> {{ user?.perfil?.nome }}</p>
        <p><strong>Empresa:</strong> {{ user?.empresa?.nome || '-' }}</p>
        <p><strong>Status:</strong> <span class="badge" [class.bg-success]="user?.ativo" [class.bg-danger]="!user?.ativo">
          {{ user?.ativo ? 'Ativo' : 'Inativo' }}
        </span></p>
      </div>
    </div>
  `
})
export class UserDetailsOffcanvasComponent {
  user?: UserWithRelations;

  constructor(private offcanvasService: NgbOffcanvas) {}

  dismiss(): void {
    this.offcanvasService.dismiss();
  }
}
```

---

## 11. Modern Control Flow

### Angular 17+ Control Flow

**Substituindo *ngIf e *ngFor:**

```html
<!-- ✅ Modern control flow -->
@if (loading) {
  <div class="loading-spinner">Carregando...</div>
} @else if (usuarios.length === 0) {
  <div class="empty-state">Nenhum usuário encontrado</div>
} @else {
  <table class="table">
    <thead>
      <tr>
        <th>Nome</th>
        <th>E-mail</th>
        <th>Ações</th>
      </tr>
    </thead>
    <tbody>
      @for (usuario of usuarios; track usuario.id) {
        <tr>
          <td>{{ usuario.nome }}</td>
          <td>{{ usuario.email }}</td>
          <td>
            <button class="btn btn-sm btn-primary" (click)="edit(usuario)">Editar</button>
          </td>
        </tr>
      }
    </tbody>
  </table>
}

<!-- ❌ Legacy structural directives -->
<!-- *ngIf="loading; else content" -->
<!-- *ngFor="let usuario of usuarios; trackBy: trackById" -->
```

---

## 12. Estilos e Temas

### Template Base: NobleUI

**Configuração SCSS:**
```scss
// src/styles.scss
@import '~bootstrap/scss/bootstrap';
@import '~bootstrap-icons/font/bootstrap-icons';
@import '~ng-bootstrap/ng-bootstrap';

// Variáveis personalizadas
:root {
  --primary-color: #4e73df;
  --secondary-color: #858796;
  --success-color: #1cc88a;
  --danger-color: #e74a3b;
  --warning-color: #f6c23e;
  --info-color: #36b9cc;
}

// Classes utilitárias
.table-actions {
  white-space: nowrap;
  
  .btn {
    margin: 0 2px;
  }
}

.avatar-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: bold;
}
```

### Component Styling

**UserAvatar styles:**
```scss
.user-avatar {
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
  
  &.small {
    width: 32px;
    height: 32px;
  }
  
  &.medium {
    width: 48px;
    height: 48px;
  }
  
  &.large {
    width: 80px;
    height: 80px;
  }
  
  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-initials {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--primary-color);
    color: white;
    font-weight: bold;
    font-size: 14px;
  }
}
```

---

## 13. Testes E2E (Playwright)

### Configuração

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm start',
    port: 4200,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Exemplo de Teste

**e2e/usuarios.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Gestão de Usuários', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('#email', 'admin@example.com');
    await page.fill('#password', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('deve criar novo usuário', async ({ page }) => {
    await page.goto('/usuarios');
    await page.click('a[href="/usuarios/novo"]');
    
    await page.fill('#nome', 'Novo Usuário Teste');
    await page.fill('#email', `novo${Date.now()}@test.com`);
    await page.selectOption('#perfilId', 'GESTOR');
    await page.fill('#senha', 'password123');
    
    await page.click('button[type="submit"]');
    
    // Verificar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible();
    await expect(page).toHaveURL('/usuarios');
  });

  test('deve excluir usuário', async ({ page }) => {
    await page.goto('/usuarios');
    
    // Encontrar primeiro usuário na tabela
    const firstRow = page.locator('tbody tr').first();
    const userName = await firstRow.locator('td').first().textContent();
    
    await firstRow.locator('button:has-text("Excluir")').click();
    await page.click('.swal2-confirm');
    
    // Verificar que usuário não está mais na lista
    await expect(page.locator('tbody tr:has-text("' + userName + '")')).not.toBeVisible();
  });
});
```

---

## 14. Build e Deploy

### Scripts npm

```json
{
  "scripts": {
    "ng": "ng",
    "start": "ng serve --host 0.0.0.0 --port 4200",
    "build": "ng build --configuration production",
    "watch": "ng build --watch --configuration development",
    "test": "ng test",
    "test:e2e": "npx playwright test",
    "test:e2e:ui": "npx playwright test --ui",
    "lint": "ng lint"
  }
}
```

### Angular.json Config

**Build optimization:**
```json
"architect": {
  "build": {
    "options": {
      "outputPath": "dist/frontend",
      "index": "src/index.html",
      "main": "src/main.ts",
      "polyfills": ["zone.js"],
      "tsConfig": "tsconfig.app.json",
      "inlineStyleLanguage": "scss",
      "assets": ["src/favicon.ico", "src/assets"],
      "styles": ["src/styles.scss"],
      "scripts": []
    },
    "configurations": {
      "production": {
        "budgets": [
          {
            "type": "initial",
            "maximumWarning": "2mb",
            "maximumError": "5mb"
          },
          {
            "type": "anyComponentStyle",
            "maximumWarning": "6kb",
            "maximumError": "10kb"
          }
        ],
        "outputHashing": "all"
      }
    }
  }
}
```

---

## 15. Performance e Otimização

### Lazy Loading Implementado

**Roteamento lazy:**
```typescript
{
  path: 'usuarios',
  loadComponent: () => import('./pages/usuarios/usuarios-list.component').then(m => m.UsuariosListComponent)
}
```

### Bundle Optimization

**Estratégias:**
- Standalone components (tree-shaking melhorado)
- Lazy loading de rotas
- Vendor chunks separados
- Imagens otimizadas e lazy carregadas

### Performance Metrics

**Objetivos:**
- First Contentful Paint < 1.5s
- Largest Contentful Paint < 2.5s
- Time to Interactive < 3.5s

---

## 16. Limitações e Próximos Passos

### Funcionalidades não implementadas

- **Service Workers/PWA:** Progressive Web App capabilities
- **Error Boundary:** Tratamento global de erros
- **HTTP Caching:** Estratégias de cache HTTP
- **Virtual Scrolling:** Para grandes listas
- **Accessibility:** ARIA labels e screen readers
- **Unit Testing:** Cobertura de testes unitários baixa

### Melhorias planejadas

- Implementar Service Worker para PWA
- Adicionar Error Boundary component
- Implementar HTTP caching interceptor
- Adicionar virtual scrolling para tabelas grandes
- Melhorar accessibility (ARIA, semântica)
- Aumentar cobertura de testes unitários
- Implementar state management mais robusto (NgRx Signals?)

---

## 17. Documentos Relacionados

- **Visão Geral:** [overview.md](./overview.md)
- **Backend:** [backend.md](./backend.md) - API e serviços
- **Dados:** [data.md](./data.md) - Modelo de dados
- **Infraestrutura:** [infrastructure.md](./infrastructure.md) - Deploy e Docker
- **Convenções:** [../conventions/frontend.md](../conventions/frontend.md) - Padrões de código
- **Business Rules:** [../business-rules/](../business-rules/) - Regras de negócio

---

**Princípio:** Este documento reflete a implementação atual do frontend. Para decisões arquitetônicas gerais, consulte [overview.md](./overview.md).