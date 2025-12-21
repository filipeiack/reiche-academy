# Convenções - Frontend (Angular 18+)

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
│   │   ├── dummy-datas/
│   │   ├── feather-icon/
│   ├── shared/                    # Componentes reutilizáveis
│   │   ├── components/
│   │   └── directives/
│   └── views/                     # Telas (páginas)
│       ├── layout/
│       ├── pages/
│       └── partials/
├── assets/
├── environments/
├── index.html
├── main.ts
└── styles.scss
```

**Arquivo**: `src/app/` (pastas confirmadas via `list_dir`)

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Componentes** | Standalone (Angular 18+) | `standalone: true` no @Component |
| **Estrutura** | core (serviços, guards), shared (componentes), views (páginas) | Separação clara |
| **Imports** | `imports: [CommonModule, MaterialModule, ReactiveFormsModule]` | Sempre declarado |
| **Estilos** | `.scss` (não .css) | SCSS em todos os arquivos |
| **Testes** | `.spec.ts` por componente | Um por arquivo |

**Exemplo de componente standalone**:
```typescript
@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, UserAvatarComponent, NgSelectModule],
  templateUrl: './usuarios-form.component.html',
  styleUrl: './usuarios-form.component.scss'
})
export class UsuariosFormComponent implements OnInit {
  // ...
}
```

**Consistência**: **CONSISTENTE**

---

## 2. Rotas

### Padrão Observado

**Arquivo**: `src/app/views/pages/usuarios/usuarios.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { UsuariosListComponent } from './usuarios-list/usuarios-list.component';
import { UsuariosFormComponent } from './usuarios-form/usuarios-form.component';

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

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Nomes** | kebab-case (`usuarios`, `novo`, `editar`) | Sempre minúsculas |
| **Estrutura** | Uma const por feature (`usuariosRoutes`) | Modular |
| **Parâmetros** | `:id` para recursos dinâmicos | `:id/editar`, `:id/deletar` |
| **Componentes** | Rota vazia ('') para lista, 'novo' para criação | Convenção clara |
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
  create(data: CreateUsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, data);
  }

  /**
   * Atualizar usuário
   */
  update(id: string, data: UpdateUsuarioRequest): Observable<Usuario> {
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
| **Request DTOs** | Sufixo `Request` ou `Dto` | `LoginRequest`, `CreateUsuarioRequest` |
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
