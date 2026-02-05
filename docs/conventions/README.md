# Convenções do Projeto Reiche Academy

**Status**: Documentação baseada em código existente  
**Última atualização**: 2025-12-23

---

## Sobre Esta Documentação

Esta seção documenta **EXCLUSIVAMENTE** os padrões e convenções observados no código atual do projeto.

### Princípios de Documentação

- **Fonte de Verdade**: Código existente (backend, frontend, testes)
- **Sem Idealização**: Nenhuma convenção genérica ou "boa prática" foi adicionada
- **Grau de Consistência**: Cada padrão indica se é CONSISTENTE, PARCIAL ou NÃO CONSOLIDADO
- **Limitações Explícitas**: Gaps e inconsistências documentados ao final de cada seção

---

## Arquivos desta Seção

| Arquivo | Conteúdo | Status |
|---------|----------|--------|
| [backend.md](./backend.md) | Padrões NestJS, módulos, controllers, services, DTOs, validações, autenticação, auditoria | ✅ Atualizado |
| [frontend.md](./frontend.md) | Padrões Angular standalone, componentes, serviços, formulários, CRUD, i18n, guards | ✅ Atualizado |
| [testing.md](./testing.md) | Padrões Jest, Jasmine, Playwright, mocking, nomenclatura de testes | ✅ Atualizado |
| [naming.md](./naming.md) | Convenções de nomes para classes, arquivos, métodos, DTOs, enums | ✅ Atualizado |
| [git.md](./git.md) | Padrões de commits (Conventional Commits parcial) | ✅ Atualizado |
| [handoff-template.md](./handoff-template.md) | Template para handoffs entre agentes | Existente |

---

## Grau de Consistência - Legenda

| Grau | Significado |
|------|-------------|
| **CONSISTENTE** | Padrão aparece sempre em todo o codebase (>90%) |
| **PARCIAL** | Padrão aparece na maioria dos casos (50-90%) |
| **INCONSISTENTE** | Padrão aparece raramente (<50%) |
| **NÃO CONSOLIDADO** | Padrão não existe ou é contraditório no código |

---

## Stack Tecnológico Confirmado

### Backend
- **Runtime**: Node.js
- **Framework**: NestJS 10+
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL
- **ORM**: Prisma
- **Autenticação**: JWT via Passport
- **Hash de Senha**: Argon2 (nunca bcrypt)
- **Guards**: JwtAuthGuard + RolesGuard
- **Documentação**: Swagger/OpenAPI via decorators
- **Validação**: class-validator com DTOs
- **Upload**: Multer com diskStorage
- **Rate Limiting**: ThrottlerModule (60s, 10 req)

### Frontend
- **Framework**: Angular 18+ (Standalone Components)
- **Template Base**: NobleUI Angular
- **Estilização**: Bootstrap 5 + SCSS
- **UI Components**: ng-bootstrap
- **Dropdowns**: ng-select
- **Formulários**: Reactive Forms (FormBuilder)
- **HTTP**: HttpClient + Observables (RxJS)
- **State Management**: Services + BehaviorSubject (sem NgRx)
- **Internacionalização**: Custom TranslatePipe + JSON files
- **Feedback**: SweetAlert2 (toasts e modals)
- **Icons**: Feather Icons
- **Detalhes**: NgbOffcanvas
- **Ordenação**: Custom SortableDirective
- **Paginação**: NgbPagination (frontend)
- **Guards**: Functional Guards (CanActivateFn)

### Testes
- **Backend Unit**: Jest + @nestjs/testing
- **Frontend Unit**: Jasmine + Karma (poucos testes)
- **E2E**: Playwright (configurado, sem testes implementados)
- **Coverage**: Sem threshold definido

### Segurança & Autorização
- **Perfis RBAC**: ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA
- **Hierarquia**: Baseada em campo `nivel` (1 = maior poder)
- **Multi-Tenant**: Isolamento por `empresaId` (exceto ADMINISTRADOR)
- **Soft Delete**: Campo `ativo: boolean` (padrão preferido)
- **Hard Delete**: Método separado `hardDelete()`
- **Auditoria**: AuditService registra CREATE, UPDATE, DELETE

---

## Organização dos Documentos

Cada documento de convenção segue a mesma estrutura:

1. **Status** e data de atualização
2. **Seções numeradas** com padrões observados
3. **Onde aparece** (arquivos/pastas de referência)
4. **Exemplos reais de código** extraídos do projeto
5. **Tabelas de convenções**
6. **Grau de consistência** para cada padrão
7. **Seção final**: "Limitações e Inconsistências Atuais"

---

## Limitações das Convenções Atuais

### Backend

**Áreas sem padrão consolidado**:
- Paginação (não implementada)
- Filtros dinâmicos (não implementados)
- Ordenação (feita no frontend)
- Logging estruturado (uso inconsistente)
- Internacionalização de mensagens de erro
- Versionamento de API
- Testes E2E

**Decisões futuras necessárias**:
- Implementar paginação padronizada?
- Adicionar filtros dinâmicos?
- Internacionalizar mensagens de erro?
- Versionar API (/v1, /v2)?
- Padronizar logs estruturados?

### Frontend

**Áreas sem padrão consolidado**:
- Testes unitários (poucos, sem padrão)
- Testes E2E (infraestrutura presente, sem testes)
- Error boundary global
- HTTP interceptor global (loading/erro)
- State management (apenas BehaviorSubject)
- Lazy loading de módulos
- Validações customizadas reutilizáveis
- Unsubscribe de Observables (risco de memory leak)

**Decisões futuras necessárias**:
- Implementar testes unitários?
- Adicionar interceptor global de HTTP?
- Criar error boundary component?
- Implementar state management (NgRx/Akita)?
- Adicionar lazy loading?
- Implementar PWA?

### Testes

**Áreas sem padrão consolidado**:
- Cobertura backend: apenas 4 modules com testes
- Cobertura frontend: apenas 1 service com testes
- Testes de components: nenhum
- Testes E2E: nenhum implementado
- Coverage threshold: não definido
- CI/CD: testes não integrados

**Decisões futuras necessárias**:
- Estabelecer threshold mínimo de cobertura?
- Implementar testes E2E com Playwright?
- Testar components Angular?
- Integrar testes ao CI/CD?
- Adicionar testes de integração (banco real)?

### Git

**Áreas sem padrão consolidado**:
- Conventional Commits: uso PARCIAL
- Branches: padrão não claro (main only?)
- Tags/Releases: não utilizadas
- PR Template: não existe
- Code Review: processo não documentado

**Decisões futuras necessárias**:
- Forçar Conventional Commits via hook?
- Definir estratégia de branches (GitFlow, trunk-based)?
- Implementar versionamento semântico?
- Criar template de PR?
- Definir processo de code review?

---

## Como Usar Esta Documentação

### Para Desenvolvedores
- Consulte antes de criar novos módulos/components
- Siga os padrões CONSISTENTES documentados
- Para áreas NÃO CONSOLIDADAS, discuta com a equipe

### Para Revisores
- Use como checklist durante code review
- Verifique aderência aos padrões CONSISTENTES
- Identifique desvios e discuta com o autor

### Para Agentes de IA
- Este documento define os padrões obrigatórios
- NÃO invente novos padrões
- Para lacunas, declare "Padrão não consolidado no código atual"
- Sempre indique grau de consistência ao criar código

---

## Evolução desta Documentação

Esta documentação reflete o estado atual do código (2025-12-23).

À medida que o projeto evolui:
- ✅ Novos padrões devem ser documentados APÓS implementação
- ✅ Padrões PARCIAIS podem se tornar CONSISTENTES
- ✅ Limitações podem ser resolvidas via ADRs
- ❌ NUNCA adicionar "recomendações" não implementadas

---

## Referências Cruzadas

- **Regras de Negócio**: `/docs/business-rules/`
- **Arquitetura**: `/docs/architecture/`
- **ADRs**: `/docs/adr/`
- **Fluxo Oficial**: `/docs/FLOW.md`
- **Autoridade Documental**: `/docs/DOCUMENTATION_AUTHORITY.md`
