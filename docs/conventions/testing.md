# Convenções - Testes

## 1. Testes Unitários (Frontend)

### Framework

**Arquivo**: `frontend/package.json`

```json
"devDependencies": {
  "jasmine-core": "~5.2.0",
  "karma": "~6.4.0",
  "karma-chrome-launcher": "~3.2.0",
  "@types/jasmine": "~5.1.0"
}
```

**Framework**: Jasmine 5.2 + Karma 6.4 (padrão Angular)

### Padrão Observado

**Arquivo**: `src/app/app.component.spec.ts`

```typescript
import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';

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

  it(`should have the 'demo1' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('demo1');
  });

  it('should render title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, demo1');
  });
});
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Describe** | `describe('ComponentName', () => {})` | Agrupa testes |
| **Setup** | `beforeEach(async () => { })` com `TestBed.configureTestingModule()` | Padrão |
| **Fixture** | `TestBed.createComponent(Component)` | Cria instância do componente |
| **Assertions** | `expect(value).toBeTruthy()`, `expect(value).toEqual('string')` | Jasmine matchers |
| **Detection de Mudanças** | `fixture.detectChanges()` | Trigger change detection |
| **Nomes de Testes** | `it('should criar/deletar/atualizar...')` | BDD-style |
| **Nativo DOM** | `fixture.nativeElement` | Acesso ao DOM |
| **Mocks** | **NÃO OBSERVADO** | HttpClientTestingModule não visto |
| **Async** | `async/await` em beforeEach | Para componentes com async |

**Consistência**: **CONSISTENTE** (poucos testes, padrão claro)

### Backend - Testes Unitários

**Arquivo**: `backend/package.json`

```json
"devDependencies": {
  "jest": "^29.7.0",
  "@types/jest": "^29.5.8",
  "ts-jest": "^29.1.1",
  "@nestjs/testing": "^10.3.0"
}
```

**Framework**: Jest (não Jasmine)

**Padrão esperado** (não observado em código):

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsuariosService } from './usuarios.service';
import { PrismaService } from '../../common/prisma/prisma.service';

describe('UsuariosService', () => {
  let service: UsuariosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: PrismaService,
          useValue: {
            usuario: {
              findMany: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create', () => {
    expect(service).toBeDefined();
  });

  it('should find all usuarios', async () => {
    const mockUsuarios = [
      { id: '1', email: 'test@test.com', nome: 'Test' },
    ];
    jest.spyOn(prisma.usuario, 'findMany').mockResolvedValue(mockUsuarios);

    const result = await service.findAll();
    expect(result).toEqual(mockUsuarios);
  });
});
```

**Padrão observado em Jest**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Describe** | `describe('ServiceName', () => {})` | Agrupa testes |
| **Setup** | `beforeEach(async () => { await Test.createTestingModule() })` | NestJS Test utility |
| **Module** | `TestingModule` | Cria módulo testável |
| **Mocks** | `jest.fn()`, `jest.spyOn()` | Mockagem de dependências |
| **Async** | `async/await`, `jest.fn().mockResolvedValue()` | Promises |
| **Assertions** | `expect(value).toBeDefined()`, `expect(value).toEqual()` | Jest matchers |

**Nota**: Backend testes descritos em package.json mas **sem testes observados no repositório** (gap detectado)

**Consistência Backend**: **NÃO CONSOLIDADO**

---

## 2. Testes End-to-End (E2E)

### Framework

**Arquivo**: `frontend/package.json`

```json
"devDependencies": {
  "@playwright/test": "^1.48.0"
}
```

**Framework**: Playwright 1.48 (browser automation)

### Padrão Observado

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

const ADMIN_CREDENTIALS = {
  email: 'admin@reiche.com',
  senha: '123456'
};

// Helper function para login
async function login(page: Page) {
  try {
    await page.goto('http://localhost:4200/auth/login', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email, { timeout: 5000 });
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.senha, { timeout: 5000 });
    await page.click('button[type="submit"]', { timeout: 5000 });
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  } catch (error) {
    console.error('Erro durante login:', error);
    throw error;
  }
}

test.describe('CRUD de Usuários', () => {
  test.beforeEach(async ({ page }) => {
    try {
      console.log('[beforeEach] Iniciando login...');
      await login(page);
      console.log('[beforeEach] Login realizado, navegando para usuários...');
      await page.goto('http://localhost:4200/usuarios', { waitUntil: 'domcontentloaded' });
      console.log('[beforeEach] Página de usuários carregada');
    } catch (error) {
      console.error('[beforeEach] Erro:', error);
      throw error;
    }
  });

  test('01 - Deve criar um novo usuário', async ({ page }) => {
    // Clica no botão de novo
    await page.click('a[href="/usuarios/novo"]');
    await page.waitForURL('**/usuarios/novo');

    // Preenche o formulário
    await page.fill('input#nome', TEST_USER.nome);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#cargo', TEST_USER.cargo);
    await page.selectOption('select#perfil', TEST_USER.perfil);
    await page.fill('input#senha', TEST_USER.senha);

    // Submete
    await page.click('button[type="submit"]');

    // Verifica sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('criado com sucesso');

    // Volta para lista
    await page.waitForURL('**/usuarios');

    // Busca o usuário criado
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    await expect(userRow).toBeVisible();
  });

  test('02 - Deve buscar usuários na lista', async ({ page }) => {
    // Busca por "admin"
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    await page.waitForTimeout(500);

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();

    // Limpa a busca
    await page.fill('input[placeholder*="Procurar"]', '');
    await page.waitForTimeout(500);

    // Verifica que voltou a exibir todos
    await expect(rows.first()).toBeVisible();
  });

  test('03 - Deve exibir avatar do usuário na lista', async ({ page }) => {
    // Verifica que o componente de avatar está sendo renderizado
    const avatarComponents = page.locator('app-user-avatar');
    const count = await avatarComponents.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('04 - Deve selecionar usuário individual via checkbox', async ({ page }) => {
    // Lógica de teste...
  });
});
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Helper Function** | `async function login(page: Page)` | Reutilizável |
| **Teste Setup** | `test.beforeEach()` com login | Preparação comum |
| **Describe Block** | `test.describe('Feature Name', () => {})` | Agrupa testes |
| **Nome do Teste** | Numerado (`01 -`, `02 -`) e descritivo | BDD-style |
| **Navegação** | `page.goto()`, `page.waitForURL()` | Explícito |
| **Seletores** | CSS direto (`input#email`, `a[href="/usuarios/novo"]`) | Simples |
| **Preenchimento** | `page.fill()`, `page.selectOption()` | Ações básicas |
| **Clicks** | `page.click()` | Evento de clique |
| **Waits** | `page.waitForURL()`, `page.waitForTimeout()` | Timeouts explícitos |
| **Assertions** | `.toBeVisible()`, `.toContainText()` | Playwright matchers |
| **DOM Query** | `page.locator()` com CSS / XPath | Localizadores |
| **Count** | `.count()` para verificar quantidade | Múltiplos elementos |
| **Data Dinâmica** | Timestamp no email (`${Date.now()}`) | Evita duplicatas |
| **Feedback Visual** | Valida toast de sucesso (`.swal2-toast`) | UI assertions |
| **Logging** | `console.log()` e `console.error()` | Debug em CI |

### Configuração do Playwright

**Arquivo**: `frontend/playwright.config.ts`

```typescript
// Configuração padrão Playwright
// Não analisado completamente
```

### Padrão de Helpers

**Função reutilizável de login**:
```typescript
async function login(page: Page) {
  // 1. Navega para /auth/login
  // 2. Preenche credenciais
  // 3. Clica em submit
  // 4. Espera redirecionamento para /dashboard
}
```

**Padrão**: Helper é `async`, recebe `page` do Playwright, throw error se falhar

### Padrão de Testes por Feature

Testes organizados por feature (`CRUD de Usuários`, etc) com `test.describe()`

### Padrões de Waits

| Padrão | Observação |
|--------|-----------|
| `page.waitForURL('**/usuarios')` | Aguarda navegação (recomendado) |
| `page.waitForTimeout(500)` | Delay fixo (flaky, evitar) |
| `.toBeVisible({ timeout: 5000 })` | Wait com assertion |
| `waitUntil: 'domcontentloaded'` | Goto options |

**Inconsistência**: `.waitForTimeout(500)` é flaky, melhor usar waits específicos

**Consistência**: **PARCIAL** (boa estrutura, waits inconsistentes)

---

## 3. Scripts de Teste

### Frontend

**Arquivo**: `frontend/package.json`

```json
"scripts": {
  "test": "ng test",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug"
}
```

**Padrões observados**:

| Script | Comando | Uso |
|--------|---------|-----|
| `test` | `ng test` | Testes unitários via Karma |
| `test:e2e` | `playwright test` | E2E headless |
| `test:e2e:ui` | `playwright test --ui` | E2E com UI do Playwright |
| `test:e2e:headed` | `playwright test --headed` | E2E com navegador visível |
| `test:e2e:debug` | `playwright test --debug` | E2E com debugger |

**Consistência**: **CONSISTENTE**

### Backend

**Arquivo**: `backend/package.json`

```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:cov": "jest --coverage",
  "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
  "test:e2e": "jest --config ./test/jest-e2e.json"
}
```

**Padrões observados**:

| Script | Comando | Uso |
|--------|---------|-----|
| `test` | `jest` | Testes unitários |
| `test:watch` | `jest --watch` | Modo watch |
| `test:cov` | `jest --coverage` | Com cobertura |
| `test:debug` | Debug com inspector | Node debugger |
| `test:e2e` | Jest com config E2E | Testes E2E |

**Consistência**: **CONSISTENTE**

---

## 4. Organização de Pastas de Testes

### Frontend E2E

**Estrutura**:
```
frontend/e2e/
├── usuarios.spec.ts          # Testes de usuários
├── README.md                 # Documentação
└── fixtures/
    └── README.md
```

**Padrão**: Um arquivo `.spec.ts` por feature

### Backend E2E

**Estrutura**:
```
backend/test/
└── jest-e2e.json             # Config do Jest para E2E
```

**Padrão**: Configuração separada via jest-e2e.json

**Consistência**: **CONSISTENTE**

---

## 5. Coverage

### Frontend

**Não consolidado** (sem script de coverage observado além de `ng test`)

### Backend

**Script**: `npm run test:cov` (gera relatório de cobertura)

**Padrão**: Jest gera coverage no diretório `coverage/`

**Consistência**: **PARCIAL**

---

## 6. Mocks e Fixtures

### Frontend

**Padrão Observado**: Nenhum mock consolidado

**Não observado**:
- HttpClientTestingModule
- jasmine.spyOn
- fixture de dados reutilizáveis

**Inconsistência**: Testes manuais, sem mocks de HTTP

### Backend

**Diretório**: `backend/src/common/` (nenhum mock observado)

**Padrão esperado** (não consolidado):
```typescript
const mockPrisma = {
  usuario: {
    findMany: jest.fn().mockResolvedValue([...]),
    findUnique: jest.fn().mockResolvedValue({...}),
  },
};
```

**Inconsistência**: Sem padrão de mocks consolidado

**Consistência E2E**: **INCONSISTENTE**

---

## 7. CI/CD de Testes

### Observado

**Arquivo**: `.github/` (potencial workflows)

**Não analisado completamente** (sem workflows encontrados na busca)

**Padrão esperado**: GitHub Actions rodando testes em push/PR

**Consistência**: **NÃO CONSOLIDADO**

---

## 8. Configuração do Playwright

### Arquivo

**Localização**: `frontend/playwright.config.ts`

**Padrão esperado**:
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
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'ng serve',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Padrões esperados**:
- testDir: `e2e`
- baseURL: localhost:4200
- webServer: Inicia `ng serve` automaticamente
- retries: 2 em CI

**Consistência**: **NÃO ANALISADO** (arquivo não lido)

---

## Resumo - Consistência de Testes

| Aspecto | Consistência | Notas |
|---------|--------------|-------|
| Testes Unitários Frontend | CONSISTENTE | Jasmine + Karma, poucos testes |
| Testes Unitários Backend | NÃO CONSOLIDADO | Jest config existe, sem testes |
| Testes E2E | CONSISTENTE | Playwright bem estruturado |
| Mocks e Fixtures | INCONSISTENTE | Sem padrão consolidado |
| Coverage | PARCIAL | Backend tem script, frontend não |
| Scripts de Teste | CONSISTENTE | Bem nomeados e documentados |
| Organização de Testes | CONSISTENTE | Pastas apropriadas |
| CI/CD | NÃO CONSOLIDADO | Não observado |
| Configuração Playwright | NÃO ANALISADO | Arquivo existe, conteúdo não verificado |
| Padrão de Waits | INCONSISTENTE | Usa timeouts fixos (flaky) |

---

## Limitações e Gaps - Testes

1. **Testes unitários backend**: Nenhum teste observado apesar de jest estar configurado

2. **Mocks não padronizados**: HttpClientTestingModule não usado (sem testes de serviços)

3. **Fixtures reutilizáveis**: Sem padrão de dados de teste (cada teste cria seus próprios)

4. **E2E timing flaky**: `.waitForTimeout(500)` em vez de waits específicos

5. **Coverage não medido**: Frontend sem cobertura, backend sem evidência

6. **CI/CD não consolidado**: Sem workflows de GitHub Actions observados

7. **Retry logic**: Playwright config não analisado (provável sem retry)

8. **Padrão de dados de teste**: TEST_USER com timestamp, sem fixture builder

9. **Testes de erro**: Sem testes de fluxos de erro (validações, auth failures)

10. **Performance testing**: Nenhum teste de performance observado

11. **Accessibility testing**: Sem a11y checks em E2E

12. **Mobile testing**: Playwright config não especifica devices
