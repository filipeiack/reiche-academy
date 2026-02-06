# AGENTS.md - Reiche Academy Agent Playbook
**Audience:** AI coding agents for this mono-repo (NestJS backend, Angular frontend).
**Last Refresh:** 2026-02-06 (target length ~150 lines).

## 1. Mission & Environment
- Reiche Academy delivers PDCA workflows with NestJS + Prisma + PostgreSQL backend, Angular 18 standalone frontend, JWT (access + refresh) using Argon2, and RBAC (ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA).
- Repository root: `reiche-academy/`; follow `/docs/FLOW.md` and `/docs/DOCUMENTATION_AUTHORITY.md` before coding.
- No Cursor rule files exist; Copilot guardrails live in `.github/copilot-instructions.md` (section 6).
- TypeScript strict everywhere; backend favors async/await, frontend favors Observables; never invent undocumented rules.
- Safe failure: stop, explain missing input, cite the document or agent needed.

## 2. Build · Lint · Test Commands
**Backend (NestJS)**
```bash
cd backend
npm install
npm run dev                   # watch API (TZ=America/Sao_Paulo)
npm run start:debug           # debugger
npm run build && npm run start:prod
npm run lint                  # ESLint with autofix
npm run format                # Prettier
npm test                      # Jest
npm run test:watch            # Jest watch
npm run test:cov              # coverage
npm run test:e2e              # e2e config
npm test -- usuarios.service.spec.ts
npm test -- --testPathPattern=auth
npm run prisma:generate
npm run migration:dev         # prisma migrate dev
npm run migration:prod        # deploy migrations
npm run prisma:studio
npm run seed                  # tsx prisma/seed.ts
```
**Frontend (Angular + Playwright)**
```bash
cd frontend
npm install
npm start                                  # ng serve via proxy (4200)
ng serve --open                            # alt dev
npm run build                              # production build
npm run watch                              # build watch
npm test                                   # Karma/Jasmine
ng test --include='**/usuarios/**/*.spec.ts'
ng test --code-coverage
npm run test:e2e                           # Playwright
npm run test:e2e:ui | npm run test:e2e:headed | npm run test:e2e:debug
npx playwright test usuarios.spec.ts       # single file
npx playwright test --grep "criar novo usuário"
npm run optimize:images && npm run convert:webp  # asset hygiene
```

## 3. Code Style & Patterns
### 3.1 Shared Fundamentals
- Files use kebab-case; classes/interfaces PascalCase; variables/methods camelCase; consts/enums UPPER_SNAKE; routes kebab-case.
- Strict TS: no implicit any/returns, strict null checks; include explicit return types and prefer `readonly` injections.
- Import order (backend): NestJS core → third-party → Prisma → project modules → DTOs/types; frontend: Angular core/common → RxJS → third-party → `@core`/`@shared` → environments → models.
- Prefer named exports; only default-export Angular route arrays when needed.
- Formatting enforced by Prettier + ESLint; keep imports sorted, avoid unused symbols.
- Errors/exceptions in Portuguese; log via Nest `Logger`, show UI errors via SweetAlert2.

### 3.2 Backend (NestJS + Prisma)
- Controllers stay thin, decorated with `@ApiTags`, `@ApiBearerAuth`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles`; map HTTP verbs to CRUD semantics.
- Services inject dependencies as `private readonly`; every Prisma query uses explicit `.select()` to avoid leaking `senha` or metadata.
- DTOs use `class-validator` + Swagger decorators with `example`; update DTO extends `PartialType(CreateDto)`.
- Error handling: throw `NotFoundException`, `ConflictException`, `ForbiddenException`; do not return booleans for failure.
- Call `auditService.log()` after create/update/delete; include user and empresa context.
- Soft delete: `remove()` toggles `ativo=false`; `hardDelete()` reserved for permanent removal; queries listing entities must filter `ativo: true` when applicable.
- Enforce multi-tenant boundaries (`empresaId`) on reads/writes; ADMINISTRADOR bypass is explicit.
- Security: Argon2 hashing, JWT refresh + access, throttling via `@nestjs/throttler` when needed.

### 3.3 Frontend (Angular 18 standalone)
- Components declare `standalone: true`; use `inject()` rather than constructor DI; rely on Observables/signals per conventions.
- Templates must use Angular control flow (`@if`, `@for`, `@switch`) with `track` clauses; avoid legacy structural directives.
- All visible text goes through translations (`assets/i18n`, `translate` pipe) including alerts and placeholders.
- Forms: reactive `FormBuilder`, validators for required/email/min length; maintain `isEditMode`, `loading`, and entity id fields.
- Services return `Observable<T>` with methods `getAll`, `getById`, `create`, `update`, `delete`, `inactivate`; base URL `environment.apiUrl + '/path'`.
- SweetAlert2 handles success/error toasts; show backend message fallback `err?.error?.message || 'Erro'`.
- SCSS stays modular; use CSS variables defined globally; timeline styles live in `src/styles/components/_timeline.scss`.
- Manage subscriptions via `takeUntilDestroyed` or RxJS operators; never leave dangling subscriptions.
- Routes use selectors prefixed `app-`; lazy components declared in `.routes.ts` using `loadComponent`.

### 3.4 Testing Expectations
- Backend: Jest with `TestingModule`, mocked `PrismaService`; assert asynchronous results and thrown exceptions.
- Frontend: Karma + Jasmine; configure TestBed for standalone components; assert DOM using translation keys.
- Playwright: ensure RBAC and flows (e.g., criar usuário) fail when business rule fails; keep specs under `frontend/e2e`.

## 4. Security & Data Rules
- Passwords hashed with Argon2; never return or log.
- JWT tokens stored client-side (`localStorage` for remember-me, `sessionStorage` otherwise); refresh token endpoints protected with same guards.
- RBAC order enforced (ADMINISTRADOR > GESTOR > COLABORADOR > LEITURA); users cannot manage peers of equal/higher profile.
- Prisma schema: UUID ids, `createdAt`/`updatedAt` timestamps, `ativo Boolean @default(true)`, enums uppercase without accents.
- Sanitize HTML inputs via `isomorphic-dompurify`; validate `empresaId` on every mutation; throw `ForbiddenException` on mismatch.
- Return 404 for missing entities, 409 for duplicates, 400 for validation errors; never leak stack traces to clients.

## 5. Workflow & Documentation Order
1. `/docs/FLOW.md` – mandatory development sequence (Business Analyst → Dev Agent Enhanced → QA Engineer).
2. `/docs/DOCUMENTATION_AUTHORITY.md` – document precedence matrix.
3. `/.github/agents/` – agent capabilities and restrictions.
4. `/docs/business-rules/` – canonical behavior definitions.
5. `/docs/conventions/` – backend, frontend, naming, testing, git conventions.
6. `.github/copilot-instructions.md` – guardrails summarized below.
- Handoffs live under `/docs/handoffs/<feature>/<agent>-vN.md`; increment version when QA blocks release and capture Business→Dev→QA handoffs per feature.
- Do not mix agent responsibilities; Dev self-validates patterns, QA tests rules, Business Analyst documents before code while Plan/Build remain internal helpers.

## 6. Copilot Guardrails (Summary)
- AI has no implicit authority; cite normative docs before proposing behavior.
- Before acting, answer: stage in FLOW? responsible agent? required artifacts available?
- Missing info → stop, describe the gap, reference document/agent, await guidance.
- Forbidden: inventing rules, mixing agent scopes, editing production during QA, ignoring `/docs/conventions/`.
- Agents are activated explicitly (e.g., "Atue como Dev Agent Enhanced"); produce the artifacts each agent owes.
- Silence or explicit block is preferred over speculative output.

## 7. Agent Roles Snapshot
- **System Engineer** (`"Atue como System Engineer [modo]"`): governance, consultation, architecture docs; never edits product code.
- **Business Analyst** (`"Atue como Business Analyst, ..."`): extract and validate rules, assess RBAC/LGPD gaps, issue statuses ✅/⚠️/❌.
- **Dev Agent Enhanced** (`"Atue como Dev Agent Enhanced, ..."`): implement per rules, complete checklist (naming, structure, DTOs, guards, `.select()`, soft delete, audit logging).
- **QA Engineer** (`"Atue como QA Engineer, ..."`): craft unit + E2E tests from documented rules, run `cd backend && npm test` or `cd frontend && npm run test:e2e`, fix tests only.
- Handoffs per feature: `business-vN`, `dev-vN`, `qa-vN`; QA bumps version when defects persist.

## 8. Practical Tips & Pitfalls
- Always include `.select()` in Prisma queries; missing selects are QA blockers.
- Filter out soft-deleted data by default (`where: { ativo: true }`).
- Validate `empresaId` ownership on writes; throw `ForbiddenException` otherwise.
- In Angular, remove legacy `*ngIf/*ngFor`; migration debt is not accepted in new code.
- Use `takeUntilDestroyed` or `firstValueFrom` to avoid leaking subscriptions.
- Feather icons via `<i class="feather icon-{name}"></i>`; keep translation keys synced with assets/i18n.
- Run `npm run optimize:images` after adding large assets; commit optimized outputs.
- Centralize SCSS variables in `src/styles`; avoid inline colors or duplicated values.
- Use `Swal.fire({ icon: 'success', title: 'Salvo!' })` for confirmations; keep consistent error fallback text.
- Tests must fail when a documented rule fails; do not mock away validations or guards.

## 9. Reporting & Communication
- Document blockers referencing files and governing docs; propose remediation paths or questions.
- Always mention tests executed (e.g., `cd backend && npm test usuarios.service.spec.ts`).
- Reference files in responses with inline code paths (`backend/src/modules/...`).
- Keep responses concise; point to git diffs instead of dumping huge code blocks.
- Default to safer behavior (deny elevation, block action) when uncertain.

**Remember:** Ship carefully, respect governance, keep audit trails clear.
