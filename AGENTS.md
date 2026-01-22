# AGENTS.md - Reiche Academy Development Guide

**For**: AI coding agents working in this codebase  
**Last Updated**: 2026-01-22  
**Agent System Version**: 2.0 (4 agentes consolidados)

---

## 🎯 Project Overview

Reiche Academy is a PDCA management system with:
- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Frontend**: Angular 18+ standalone components + RxJS
- **Auth**: JWT (access + refresh tokens), Argon2 password hashing
- **RBAC**: 4 profiles (ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA)

---

## 🛠️ Build, Test & Lint Commands

### Backend (NestJS)

```bash
# Development
cd backend
npm run dev                    # Start with watch mode
npm run start:debug            # Start with debugger

# Build & Production
npm run build                  # Compile to dist/
npm run start:prod             # Run production build

# Linting & Formatting
npm run lint                   # ESLint (auto-fix enabled)
npm run format                 # Prettier format

# Testing
npm test                       # Run all unit tests (Jest)
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Run with coverage report
npm run test:debug             # Run tests with debugger
npm run test:e2e               # Run E2E tests

# Run a single test file
npm test -- usuarios.service.spec.ts
npm test -- --testPathPattern=usuarios

# Database
npm run prisma:generate        # Generate Prisma client
npm run prisma:migrate         # Run migrations (dev)
npm run migration:dev          # Alias for prisma migrate dev
npm run migration:prod         # Deploy migrations (prod)
npm run prisma:studio          # Open Prisma Studio GUI
npm run seed                   # Run seed script
```

### Frontend (Angular)

```bash
# Development
cd frontend
npm start                      # ng serve (http://localhost:4200)
ng serve --open                # Serve and open browser

# Build
npm run build                  # Production build
ng build --configuration=production
npm run watch                  # Build in watch mode

# Linting & Testing
ng test                        # Run Jasmine/Karma tests
ng test --include='**/usuarios/**/*.spec.ts'  # Run specific tests
ng test --code-coverage        # With coverage

# E2E Tests (Playwright)
npm run test:e2e               # Run all E2E tests
npm run test:e2e:ui            # Run with Playwright UI
npm run test:e2e:headed        # Run with browser visible
npm run test:e2e:debug         # Debug mode

# Run specific E2E test
npx playwright test usuarios.spec.ts
npx playwright test --grep "criar novo usuário"
```

---

## 📁 Project Structure

```
reiche-academy/
├── backend/
│   ├── src/
│   │   ├── modules/          # Business modules (usuarios, empresas, auth, etc.)
│   │   │   └── {module}/
│   │   │       ├── {module}.module.ts
│   │   │       ├── {module}.controller.ts
│   │   │       ├── {module}.service.ts
│   │   │       └── dto/
│   │   ├── common/           # Shared code (guards, decorators, interfaces)
│   │   └── prisma/           # Prisma service
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   └── migrations/       # Versioned migrations
│   └── test/                 # E2E tests
├── frontend/
│   ├── src/app/
│   │   ├── core/             # Services, guards, models, pipes
│   │   ├── shared/           # Reusable components, directives
│   │   └── views/            # Pages (layout, pages, partials)
│   ├── assets/i18n/          # Translation files (pt-BR.json, en-US.json)
│   └── e2e/                  # Playwright E2E tests
└── docs/                     # Project documentation
```

---

## 🎨 Code Style Guidelines

### Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| **Classes** | PascalCase | `UsuariosService`, `CreateUsuarioDto` |
| **Files** | kebab-case | `usuarios.service.ts`, `create-usuario.dto.ts` |
| **Variables/Properties** | camelCase | `selectedUsuarios`, `loadingDetails` |
| **Constants** | UPPER_SNAKE_CASE | `API_URL`, `TOKEN_KEY` |
| **Enums** | UPPER_CASE | `ADMINISTRADOR`, `GESTOR` |
| **Methods** | camelCase + verbs | `findById()`, `loadUsuarios()`, `onSubmit()` |
| **Interfaces** | PascalCase (no `I` prefix) | `Usuario`, `RequestUser`, `LoginRequest` |
| **Routes** | kebab-case | `/usuarios`, `/usuarios/:id` |

### Backend Conventions (NestJS)

**Controllers**:
- Thin controllers, delegate to services
- Use `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()` for Swagger
- Apply `@UseGuards(JwtAuthGuard, RolesGuard)` at controller level
- Use `@Roles()` decorator per endpoint
- HTTP verbs: GET (findAll/findOne), POST (create), PATCH (update), DELETE (remove)

**Services**:
- All methods `async/await`
- Constructor injection with `private readonly`
- Use Prisma with explicit `.select()` (NEVER return password fields)
- Throw NestJS exceptions: `NotFoundException`, `ConflictException`, `ForbiddenException`
- Logger: `private readonly logger = new Logger(ServiceName.name)`
- Soft delete: `remove()` sets `ativo: false`
- Hard delete: `hardDelete()` uses `.delete()`

**DTOs**:
- Use `class-validator` decorators (`@IsEmail()`, `@IsNotEmpty()`, `@MinLength()`)
- Use `@ApiProperty()` for required, `@ApiPropertyOptional()` for optional
- Include `example` in Swagger annotations
- Pattern: `CreateXDto`, `UpdateXDto` (extends `PartialType(CreateXDto)`)

**Error Handling**:
```typescript
if (!usuario) {
  throw new NotFoundException('Usuário não encontrado');
}
if (existingEmail) {
  throw new ConflictException('Email já cadastrado');
}
```

**Prisma Queries**:
```typescript
return this.prisma.usuario.findMany({
  select: {
    id: true,
    email: true,
    nome: true,
    ativo: true,
    perfil: {
      select: { id: true, codigo: true, nome: true }
    }
  }
});
```

### Frontend Conventions (Angular)

**Components**:
- Standalone: `standalone: true` in `@Component()`
- Inject dependencies with `inject()` function (not constructor DI)
- Use modern control flow: `@if`, `@for`, `@else` (not `*ngIf`, `*ngFor`)
- Selector prefix: `app-`

**Services**:
- `@Injectable({ providedIn: 'root' })`
- Return `Observable<T>` (never Promise)
- Method names: `getAll()`, `getById()`, `create()`, `update()`, `delete()`, `inactivate()`
- API URL: `environment.apiUrl + '/endpoint'`

**Forms**:
- Reactive forms with `FormBuilder`
- Pattern: `form = this.fb.group({ ... })`
- Validators: `Validators.required`, `Validators.email`, `Validators.minLength()`
- Edit mode: `isEditMode` flag + `usuarioId`
- Loading: `loading` boolean flag

**Templates**:
- Use `{{ 'KEY.SUBKEY' | translate }}` for all text
- Track by in loops: `@for (item of items; track item.id)`
- Icons: Feather Icons (`<i class="feather icon-{name}"></i>`)
- SweetAlert2 for feedback: `Swal.fire({ icon: 'success', ... })`

**Dependency Injection**:
```typescript
export class UsuariosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private usersService = inject(UsersService);
}
```

**RxJS Subscriptions**:
```typescript
this.usersService.create(data).subscribe({
  next: (result) => {
    Swal.fire({ icon: 'success', title: 'Salvo!' });
    this.router.navigate(['/usuarios']);
  },
  error: (err) => {
    Swal.fire({ icon: 'error', text: err?.error?.message || 'Erro' });
  }
});
```

---

## 🔐 Security & Auth

- JWT tokens stored in `localStorage` (remember me) or `sessionStorage`
- Passwords hashed with **Argon2** (never bcrypt)
- RBAC with 4 profiles: ADMINISTRADOR > GESTOR > COLABORADOR > LEITURA
- Multi-tenant: Users belong to `empresaId`, ADMINISTRADOR has global access
- Profile elevation protection: Users cannot create/edit users with equal/higher profile level

---

## 🗄️ Database (Prisma)

- UUIDs for all IDs (`@default(uuid())`)
- Timestamps: `createdAt`, `updatedAt` (always include)
- Soft delete: `ativo Boolean @default(true)`
- Table names: snake_case plural (`@@map("usuarios")`)
- Enums: UPPER_CASE, no accents (`MEDIO` not `MÉDIO`)

**Migrations**:
```bash
npx prisma migrate dev --name add_campo_x
npx prisma migrate deploy  # Production
```

---

## 📝 Import Order

### Backend (NestJS)
1. NestJS core (`@nestjs/common`, `@nestjs/core`)
2. Third-party libraries
3. Prisma client
4. Project modules (relative imports)
5. DTOs, interfaces, types

### Frontend (Angular)
1. Angular core (`@angular/core`, `@angular/common`)
2. RxJS
3. Third-party libraries
4. Project modules (`@core/`, `@shared/`)
5. Environment config
6. Models, interfaces

---

## 🧪 Testing Patterns

### Backend (Jest)
```typescript
describe('UsuariosService', () => {
  let service: UsuariosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsuariosService, PrismaService],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should find all usuarios', async () => {
    const result = await service.findAll();
    expect(result).toBeDefined();
  });
});
```

### Frontend E2E (Playwright)
```typescript
test('criar novo usuário', async ({ page }) => {
  await page.goto('/usuarios');
  await page.click('[href="/usuarios/novo"]');
  await page.fill('#nome', 'Teste User');
  await page.fill('#email', `teste${Date.now()}@test.com`);
  await page.click('button[type="submit"]');
  await expect(page.locator('.swal2-toast')).toBeVisible();
});
```

---

## ⚠️ Common Pitfalls

1. **Never return password fields** in API responses
2. **Always use `.select()`** in Prisma queries to avoid leaking data
3. **Validate multi-tenant access** in services (check `empresaId`)
4. **Don't use `*ngIf`/`*ngFor`** - use Angular 17+ control flow (`@if`, `@for`)
5. **No constructor DI** in Angular - use `inject()` function
6. **Soft delete aware**: Filter `ativo: true` when needed
7. **Audit logging**: Call `auditService.log()` after CREATE/UPDATE/DELETE
8. **TypeScript strict**: `strict: true` enabled - handle nulls properly

---

## 📚 Workflow & Agent Governance (v2.0)

**IMPORTANT**: This project follows **agent-based governance**. Before making changes:

1. Read `/docs/FLOW.md` - Official development workflow (v2.0)
2. Check `/docs/DOCUMENTATION_AUTHORITY.md` - Hierarchy of authority
3. Consult `/.github/agents/` - Specialized agent definitions (4 agents)
4. Review `/docs/business-rules/` - Source of truth for behavior
5. Follow `/docs/conventions/` - Code patterns (backend, frontend, naming, testing, git)

**Never**:
- Invent business rules not in `/docs/business-rules/`
- Mix responsibilities across agent boundaries
- Alter production code during validation/QA
- Improvise or "assume" requirements

**When in doubt**:
- Stop execution
- Reference the appropriate documentation
- Ask for human clarification

---

## 🤖 Agent System v2.0 (4 Agentes)

### System Overview

**v2.0 (Current)**: 4 specialized agents with 3 handoffs per feature  
**v1.0 (Archived)**: 7 agents with 6 handoffs - see `/docs/history/agents-v1/`  
**ADR**: ADR-008 (consolidation rationale)

### Official Agents

| # | Agent | Activation | Responsibility |
|---|-------|------------|----------------|
| **0** | **System Engineer** | `"Atue como System Engineer"` | Meta-governance (3 modes) |
| **1** | **Business Analyst** | `"Atue como Business Analyst"` | Document + validate business rules |
| **2** | **Dev Agent Enhanced** | `"Atue como Dev Agent Enhanced"` | Implement + self-validate patterns |
| **3** | **QA Engineer** | `"Atue como QA Engineer"` | Independent testing (unit + E2E) |

### Typical Workflow

```bash
# 1. Document business rules
"Atue como Business Analyst, documente regras de autenticação JWT"
# Creates: /docs/business-rules/auth-*.md
# Creates: /docs/handoffs/auth/business-v1.md

# 2. Implement feature
"Atue como Dev Agent Enhanced, implemente autenticação JWT"
# Implements code + self-validates patterns
# Creates: /docs/handoffs/auth/dev-v1.md

# 3. Create tests
"Atue como QA Engineer, crie testes para autenticação JWT"
# Creates unit + E2E tests based on RULES
# Executes tests iteratively
# Creates: /docs/handoffs/auth/qa-v1.md

# 4. Ready for PR
# All handoffs created, tests passing
```

### Agent Responsibilities

#### 0. System Engineer (Meta-Level)

**Modes:**
1. **Governance**: Create/modify agents, update FLOW.md, ADRs (requires human approval)
2. **Consultive**: Explain FLOW, recommend agents, pre-flight checks (no execution)
3. **Documentation**: Create ADRs post-merge, update /docs/architecture (approved decisions only)

**Activation**: `"Atue como System Engineer [modo]"`

**Never**: Acts on production code, defines business rules, validates features

---

#### 1. Business Analyst

**Consolidates**: Extractor + Reviewer (v1.0)

**Responsibilities:**
- Extract rules from existing code (reverse engineering)
- Document proposed rules formally
- Validate completeness and risks (RBAC, multi-tenant, LGPD)
- Identify critical gaps

**Output**: 
- `/docs/business-rules/*.md` (formal rule documents)
- `/docs/handoffs/<feature>/business-v1.md`

**Status:** ✅ APPROVED | ⚠️ APPROVED WITH CAVEATS | ❌ BLOCKED

**Activation**: `"Atue como Business Analyst, [extraia regras | documente regra | valide regras]"`

**Never**: Implements code, creates tests, decides alone (exposes risks only)

---

#### 2. Dev Agent Enhanced

**Consolidates**: Dev Agent + Pattern Enforcer (v1.0)

**Responsibilities:**
- Implement code following documented rules
- **Self-validate patterns** (checklist: naming, structure, DTOs, guards, soft delete)
- Document technical decisions
- Create handoff with self-validation results

**Output**: `/docs/handoffs/<feature>/dev-v<N>.md`

**Self-Validation Checklist (Backend):**
- [ ] Naming conventions (PascalCase, camelCase, kebab-case)
- [ ] Folder structure correct
- [ ] DTOs with validators
- [ ] Prisma with `.select()`
- [ ] Guards applied
- [ ] Soft delete respected
- [ ] Audit logging

**Self-Validation Checklist (Frontend):**
- [ ] Standalone components
- [ ] `inject()` function (not constructor DI)
- [ ] Modern control flow (`@if`, `@for`)
- [ ] Translations (`| translate`)
- [ ] ReactiveForms
- [ ] Error handling (SweetAlert2)

**Activation**: `"Atue como Dev Agent Enhanced, implemente [feature]"`

**Never**: Creates final tests (QA does), validates business rules independently (QA does)

**Important**: Self-validates **patterns** (objective checklist), but QA validates **rules** (adversarial)

---

#### 3. QA Engineer

**Consolidates**: QA Unitário + QA E2E (v1.0)

**Responsibilities:**
- Create unit tests based on **documented RULES** (not code)
- Create E2E tests (Playwright) validating complete user flows
- Think adversarially (as attacker)
- Execute tests iteratively until passing
- Fix **tests only** (never production code)

**Output**: `/docs/handoffs/<feature>/qa-v<N>.md`

**Principles:**
1. **Test RULES, not implementation**
2. **Adversarial thinking** (find edge cases Dev didn't think of)
3. **Independent validation** (don't trust Dev's tests)
4. **Test must FAIL when rule fails**

**Test Execution:**

Backend (Jest):
```bash
# ❌ DON'T use runTests (rootDir issue)
# ✅ ALWAYS use bash:
cd backend && npm test
```

Frontend E2E (Playwright):
```bash
cd frontend && npm run test:e2e
cd frontend && npm run test:e2e:ui  # Debug mode
```

**Activation**: `"Atue como QA Engineer, crie testes para [feature]"`

**Never**: Alters production code, trusts Dev's tests, tests undocumented behavior

**Critical**: QA is **independent validator** of business rules - separation from Dev is essential

---

### Handoff System

**Structure**: `/docs/handoffs/<feature>/<agent>-v<N>.md`

**Examples:**
```
/docs/handoffs/autenticacao-login/business-v1.md
/docs/handoffs/autenticacao-login/dev-v1.md
/docs/handoffs/autenticacao-login/qa-v1.md
```

**Versioning**: Increments when QA detects critical bugs requiring reimplementation

**Complete documentation**: `/docs/handoffs/README.md`

---

### Why v2.0? (Consolidation Rationale)

**Problems with v1.0 (7 agents):**
- 6 handoffs per feature (overhead)
- 6 different sessions (incompatible with OpenCode's continuous sessions)
- Unnecessary separations (Extractor+Reviewer, Dev+Pattern, QA Unit+QA E2E)

**v2.0 Benefits:**
- 50% less handoffs (3 vs 6)
- Continuous sessions in OpenCode
- **Dev/QA separation preserved** (critical for quality)
- Speed without losing quality

**Key preservation**: Dev self-validates **patterns** (checklist), but QA validates **rules** independently (adversarial)

---

### Integration with OpenCode Native Agents

OpenCode has internal agents (Plan, Build) accessible via TAB:
- **Plan**: Task planning
- **Build**: Code implementation

**Relationship with our custom agents:**
- **Complementary, not replacement**
- Our agents have **domain-specific rules + governance**
- Plan/Build are generic helpers
- Our agents ensure **traceability + rule compliance**

**Combined usage:**
```
User activates: "Atue como Dev Agent Enhanced"
    ↓
OpenCode assumes Dev Agent Enhanced role
    ↓
Internally, OpenCode may use Plan/Build for subtasks
    ↓
But follows restrictions/outputs of Dev Agent Enhanced
```

**Example:**
```
User: "Atue como Dev Agent Enhanced, implemente CRUD de empresas"

OpenCode (as Dev Agent Enhanced):
1. [Internally uses Plan] - breaks down CRUD into tasks
2. [Internally uses Build] - implements each file
3. [Follows Dev Agent rules] - self-validates patterns
4. [Creates handoff] - dev-v1.md with checklist

Result: Fast implementation (Plan+Build) within governance (Dev Agent Enhanced)
```

**Key**: OpenCode's Plan/Build are **tools**, our agents are **roles with responsibilities**

---

## 📖 Key Documentation

- **[FLOW.md](docs/FLOW.md)**: Development workflow and agent responsibilities
- **[Backend Conventions](docs/conventions/backend.md)**: NestJS patterns (1162 lines)
- **[Frontend Conventions](docs/conventions/frontend.md)**: Angular patterns (1570+ lines)
- **[Naming Conventions](docs/conventions/naming.md)**: Naming standards (1053 lines)
- **[Copilot Instructions](.github/copilot-instructions.md)**: AI guardrails

---

## 🚀 Quick Start for Agents

```bash
# 1. Start Docker services
docker-compose up -d

# 2. Backend setup
cd backend
npm install
npm run migration:dev
npm run dev

# 3. Frontend setup (in new terminal)
cd frontend
npm install
npm start
```

Backend: http://localhost:3000 (Swagger: /api)  
Frontend: http://localhost:4200

---

**Remember**: Code quality > speed. Follow conventions, write tests, document changes.
