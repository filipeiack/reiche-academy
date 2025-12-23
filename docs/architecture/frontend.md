# Arquitetura do Frontend

**Última atualização:** 2025-12-23  
**Status:** Factual (baseado em código existente)

---

## Propósito deste Documento

Descrever a arquitetura do frontend da aplicação Reiche Academy,
baseando-se EXCLUSIVAMENTE no código existente em `frontend/`.

Este documento é **descritivo**, não prescritivo.

---

## Stack Tecnológica

| Tecnologia | Versão/Detalhe | Onde aparece |
|------------|---------------|--------------|
| Framework | Angular 18+ | `frontend/angular.json`, `frontend/package.json` |
| Linguagem | TypeScript | `frontend/tsconfig.json` |
| Arquitetura | Standalone Components | Identificado na análise |
| Router | Angular Router | Guards e lazy loading identificados |
| Testes E2E | Playwright | `frontend/playwright.config.ts` |
| Testes Unit | Jasmine (presumido) | Padrão Angular |

**Não identificado:**
- Framework CSS específico (Bootstrap, Tailwind, Material, etc.)
- Biblioteca de componentes UI
- Gerenciamento de estado (NgRx, Akita, etc.)
- Biblioteca i18n específica

**Onde aparece:** `frontend/package.json`, `frontend/angular.json`, arquivos de configuração

---

## Tipo de Aplicação

**SPA (Single Page Application)**

Características identificadas:
- Routing modular com lazy loading
- Guards para controle de acesso
- Componentes standalone (Angular 18+)

**Onde aparece:** Estrutura de rotas e componentes

---

## Estrutura de Pastas

```
frontend/src/
├── core/                # Funcionalidades centrais
├── shared/              # Componentes/serviços compartilhados
├── views/
│   ├── layout/          # Componentes de layout
│   ├── pages/           # Páginas principais
│   └── partials/        # Componentes parciais/reutilizáveis
└── assets/
    └── i18n/
        └── pt-BR.json   # Traduções em português
```

**Onde aparece:** Estrutura de diretórios do workspace

---

## Arquitetura de Componentes

### Standalone Components

**Padrão:** Componentes standalone (sem NgModules)

**Características:**
- Imports explícitos em cada componente
- Maior granularidade de dependências
- Padrão Angular 18+

**Onde aparece:** Identificado na análise de estrutura

### Organização por Feature

Estrutura presumida baseada em pastas:

```
views/
├── layout/          # BaseComponent, navbar, sidebar, etc.
├── pages/           # Páginas de features (auth, usuarios, empresas, pilares)
└── partials/        # Subcomponentes reutilizáveis
```

**Onde aparece:** `frontend/src/views/`

---

## Routing e Navegação

### BaseComponent

**Componente de layout principal**

Características presumidas:
- Container de rotas autenticadas
- Inclui navbar, sidebar, footer
- Protegido por authGuard

**Onde aparece:** Identificado na análise (estrutura típica Angular)

### Guards Identificados

| Guard | Responsabilidade Presumida |
|-------|---------------------------|
| authGuard | Protege rotas autenticadas, verifica JWT |
| adminGuard | Restringe acesso a administradores |

**Onde aparece:** Documentação de route protection

### Lazy Loading

**Módulos/Rotas carregadas sob demanda:**
- auth (login, registro, recuperação de senha)
- usuarios (gestão de usuários)
- empresas (gestão de empresas)
- pilares (gestão de pilares)

**Vantagem:** Reduz tamanho do bundle inicial

**Onde aparece:** Estrutura de rotas identificada

---

## Segurança

### Autenticação

**Mecanismo:** JWT (armazenamento e envio presumidos)

**Não identificado:**
- Storage mechanism (localStorage, sessionStorage, cookie)
- Interceptor HTTP para adicionar token
- Estratégia de refresh token

**Onde deveria aparecer:**
- `frontend/src/core/` (auth service, interceptors)
- Guards

### Controle de Acesso

**Guards aplicados:**
- `authGuard` — Verifica autenticação
- `adminGuard` — Verifica nível de permissão

**Não identificado:**
- Lógica específica de verificação de perfis/roles
- Bloqueio de componentes/botões por permissão

**Onde aparece:** ROUTE_PROTECTION_GUIDE.md (documentação)

---

## Comunicação com Backend

**Base URL presumida:** `http://localhost:3000/api`

**Não identificado:**
- HttpClient interceptors
- Tratamento global de erros
- Loading states
- Retry logic

**Onde deveria aparecer:**
- `frontend/src/core/` (services, interceptors)

---

## Internacionalização

**Arquivo de tradução identificado:**
- `frontend/src/assets/i18n/pt-BR.json`

**Idioma padrão:** Português do Brasil (pt-BR)

**Não identificado:**
- Biblioteca i18n utilizada (ex: ngx-translate, @angular/localize)
- Outros idiomas disponíveis
- Estratégia de troca de idioma

**Onde aparece:**
- `frontend/src/assets/i18n/pt-BR.json`
- `frontend/I18N_GUIDE.md` (documentação)

---

## Funcionalidades Implementadas

Baseado em documentação e estrutura de pastas:

| Funcionalidade | Documento de Referência |
|---------------|------------------------|
| Customização de Login | LOGIN_CUSTOMIZATION.md, LOGIN_CUSTOMIZATION_IMPLEMENTATION.md |
| Proteção de Rotas | ROUTE_PROTECTION_GUIDE.md |
| Diretiva de Ordenação | SORTABLE_DIRECTIVE_GUIDE.md |
| Seleção e Deleção em Lote | MULTI_SELECT_BATCH_DELETE_GUIDE.md |
| Avatar de Usuário | USER_AVATAR_GUIDE.md |
| Detalhes de Usuário (Offcanvas) | USER_DETAILS_OFFCANVAS_GUIDE.md |

**Onde aparece:** `frontend/*.md` (guias de implementação)

---

## Componentes de UI

### Layout

**Componentes identificados:**
- BaseComponent (container principal)
- Navbar
- Sidebar

**Não identificado:**
- Footer
- Breadcrumbs
- Loader/Spinner global

**Onde aparece:** `frontend/src/views/layout/`

### Componentes Reutilizáveis

**Diretivas:**
- Sortable (ordenação de tabelas)

**Componentes:**
- User Avatar
- User Details Offcanvas
- Multi-Select (para batch delete)

**Não identificado:**
- Biblioteca de componentes (tabelas, modals, forms, etc.)
- Sistema de design

**Onde aparecem:** Guias de implementação em `frontend/*.md`

---

## Formulários

**Não identificado:**
- Uso de Reactive Forms vs Template-Driven Forms
- Validações customizadas
- Tratamento de erros de validação

**Onde deveria aparecer:**
- Componentes de páginas
- `frontend/src/shared/` (validators, directives)

---

## Estado e Dados

**Não identificado:**
- Gerenciamento de estado (NgRx, Signals, Services com BehaviorSubject)
- Cache de dados
- Sincronização offline

**Onde deveria aparecer:**
- `frontend/src/core/` (stores, state management)

---

## Testes

### Testes Unitários

**Framework:** Jasmine + Karma (padrão Angular)

**Não identificado:**
- Cobertura de testes
- Configuração específica

**Onde deveria aparecer:**
- Arquivos `*.spec.ts`
- `frontend/karma.conf.js`

### Testes E2E

**Framework:** Playwright

**Configuração:** `frontend/playwright.config.ts`

**Task disponível:**
- `frontend:e2e` — Executa testes Playwright

**Output de testes:** `frontend/test-results/`, `frontend/test-output.txt`

**Onde aparece:**
- `frontend/playwright.config.ts`
- Task definition no workspace

---

## Build e Deploy

**Configuração:** `frontend/angular.json`

**Scripts presumidos (não verificados):**
- `ng build` — Build de produção
- `ng serve` — Servidor de desenvolvimento
- `ng test` — Testes unitários

**Não identificado:**
- Configurações de ambientes (dev, staging, prod)
- Estratégia de deploy
- CI/CD

**Onde aparecem:**
- `frontend/package.json` (scripts)
- `frontend/angular.json` (build configurations)

---

## Estilos e Temas

**Não identificado:**
- Framework CSS utilizado
- Sistema de temas
- Variáveis de design (cores, tipografia)
- Responsividade (breakpoints)

**Onde deveria aparecer:**
- `frontend/src/styles.css` ou `styles.scss`
- `frontend/src/assets/` (temas, ícones)

---

## Acessibilidade

**Não identificado:**
- Práticas de acessibilidade (ARIA, semântica)
- Suporte a leitores de tela
- Navegação por teclado

**Onde deveria aparecer:**
- Componentes (atributos ARIA, roles)

---

## Performance

**Lazy Loading:** Implementado para rotas de features

**Não identificado:**
- Code splitting strategies
- Preloading strategies
- Bundle optimization
- Service Workers / PWA

**Onde deveria aparecer:**
- `frontend/angular.json` (optimization configs)
- Routing configuration (preload strategies)

---

## Limitações deste Documento

Este documento NÃO cobre:

- Implementação detalhada de cada componente
- Lógica de services específicos
- Validações de formulários
- Gerenciamento de estado
- Framework CSS e sistema de design
- Estratégias de cache e otimização
- Configurações de ambiente
- Integração com serviços externos
- PWA capabilities
- Analytics e monitoramento
- Tratamento global de erros
- Loading states e feedback visual

Para informações específicas de implementação, consultar:
- Guias em `frontend/*.md`
- Código em `frontend/src/`

---

## Documentos Relacionados

- [Architecture Overview](architecture.md)
- [Frontend Conventions](../conventions/frontend.md)
- `frontend/I18N_GUIDE.md`
- `frontend/ROUTE_PROTECTION_GUIDE.md`
- `frontend/SORTABLE_DIRECTIVE_GUIDE.md`
- `frontend/MULTI_SELECT_BATCH_DELETE_GUIDE.md`
- `frontend/USER_AVATAR_GUIDE.md`
- `frontend/USER_DETAILS_OFFCANVAS_GUIDE.md`
- `frontend/LOGIN_CUSTOMIZATION.md`

---

**Princípio:** Este documento reflete o código existente. Não prescreve arquitetura ideal.
