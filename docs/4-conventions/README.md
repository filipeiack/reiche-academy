# 4. Conventions

**Diretório de convenções do projeto Reiche Academy**  
**Padrões obrigatórios para desenvolvimento Backend e Frontend**  
**Atualizado**: 2026-02-04  

---

## 📁 Estrutura

```
4-conventions/
├── README.md                      # Este guia
├── backend-patterns.md            # Padrões NestJS (1162 linhas)
├── frontend-patterns.md           # Padrões Angular (1570+ linhas)
├── naming.md                      # Convenções de nomes (1053 linhas)
├── testing.md                     # Padrões de testes (unit + E2E)
├── git.md                         # (removido - ver ../GIT_STRATEGY.md)
├── handoff-template.md            # Template para handoffs entre agentes
├── cockpit-pilares-frontend.md    # Padrões específicos Cockpit de Pilares
└── reports/                       # Relatórios históricos (somente leitura)
    ├── STYLE_AUDIT_REPORT.md
    ├── STYLE_IMPROVEMENTS_SUMMARY.md
    └── STYLE_MIGRATION_GUIDE.md
```

---

## 🎯 Objetivo

Estabelecer padrões **consistente e obrigatórios** para:
- **Backend**: NestJS + TypeScript + Prisma
- **Frontend**: Angular 18+ standalone components
- **Processos**: Versionamento, testes, handoffs
- **Qualidade**: Naming, estrutura, boas práticas

---

## 🚀 Guia Rápido

### Iniciando um novo módulo Backend
1. Leia **backend-patterns.md** → estrutura completa
2. Siga **naming.md** → nomes de arquivos/classes
3. Consulte **testing.md** → padrões de testes
4. Use **handoff-template.md** → documentar entrega

### Iniciando um novo componente Frontend
1. Leia **frontend-patterns.md** → padrões Angular 18+
2. Siga **naming.md** → convenções de nomes
3. Consulte **testing.md** → testes unit + E2E
4. Verifique **cockpit-pilares-frontend.md** → se for módulo similar

### Desenvolvimento dia a dia
- **[git.md](git.md)**: fluxo de branches, commits, PRs e deploy
- **[naming.md](naming.md)**: dúvidas de nomenclatura
- **[testing.md](testing.md)**: padrões de testes automatizados

---

## 📖 Documentos Principais

### [backend-patterns.md](./backend-patterns.md)
**Padrões NestJS completos**:
- Estrutura de módulos (`usuarios/`, `empresas/`, etc.)
- Controllers, Services, DTOs
- Prisma queries (sempre com `.select()`)
- Guards, RBAC, validação
- Autenticação JWT, soft delete
- Logger, exceptions, audit

### [frontend-patterns.md](./frontend-patterns.md)
**Padrões Angular 18+**:
- Standalone components (`standalone: true`)
- `inject()` function (não constructor DI)
- Control flow moderno (`@if`, `@for`)
- RxJS, ReactiveForms, tradução
- Services, models, pipes
- Componentes reutilizáveis

### [naming.md](./naming.md)
**Convenções universais**:
- Classes: PascalCase (`UsuariosService`)
- Arquivos: kebab-case (`usuarios.service.ts`)
- Variáveis: camelCase (`selectedUsuarios`)
- Constantes: UPPER_SNAKE_CASE (`API_URL`)
- Enums: UPPER_CASE (`ADMINISTRADOR`)

### [testing.md](./testing.md)
**Padrões de testes**:
- Backend: Jest + mocks
- Frontend: Jasmine/Karma (unit) + Playwright (E2E)
- Estrutura de arquivos de teste
- Mocks, fixtures, dados de teste
- Cobertura, relatórios

---

## 🔧 Processos

### [git.md](./git.md)
**Versionamento e fluxo**:
- GitFlow Simplificado (develop → staging → main)
- Conventional Commits obrigatórios
- Deploy em ambientes VPS (staging/produção)
- Scripts específicos do projeto
- URLs e databases por ambiente

### [handoff-template.md](./handoff-template.md)
**Entregas entre agentes**:
- Estrutura padrão de handoffs
- Status de aprovação
- Checklist de validação
- Documentação de decisões

---

## 📋 Específicos

### [cockpit-pilares-frontend.md](./cockpit-pilares-frontend.md)
**Padrões Cockpit de Pilares**:
- Extraído de componente `diagnostico-notas`
- Auto-save com debounce (1000ms)
- Drawer/offcanvas para CRUD
- Feedback visual (saving/saved/errors)
- RBAC frontend
- Accordions, estado local

---

## 📊 Relatórios Históricos

### Diretório `reports/`
Arquivos **somente leitura** para referência:
- **STYLE_AUDIT_REPORT.md**: Auditoria completa de código
- **STYLE_IMPROVEMENTS_SUMMARY.md**: Resumo de melhorias
- **STYLE_MIGRATION_GUIDE.md**: Guia de migração de padrões

⚠️ **Não modificar** - manter como histórico da evolução dos padrões.

---

## ✅ Como Usar

### Para Desenvolvedores
1. **Antes de codificar**: consulte padrões relevantes
2. **Durante desenvolvimento**: siga convenções estritamente
3. **Antes de PR**: verifique checklist em git.md
4. **Ao final**: documente decisões em handoffs

### Para QA
1. **Base para testes**: use regras em testing.md
2. **Validação**: verifique conformidade com padrões
3. **Relatórios**: siga estrutura de handoff-template.md

### Para System Engineer
1. **Evolução**: atualize documentos após mudanças aprovadas
2. **Governança**: mantenha consistência entre documentos
3. **Auditoria**: use relatórios em reports/ como referência

---

## 🚨 Regras Obrigatórias

❌ **Nunca**:
- Usar `*ngIf`/`*ngFor` → use `@if`/`@for`
- Constructor DI → use `inject()` function
- Retornar password fields → use `.select()`
- Ignorar naming conventions → siga naming.md

✅ **Sempre**:
- Standalone components
- Soft delete (`ativo: false`)
- Validators em DTOs
- Tradução (`| translate`)
- Testes unit + E2E

---

## 📚 Navegação Rápida

| Precisa de? | Documento |
|-------------|-----------|
| Criar módulo Backend? | → [backend-patterns.md](./backend-patterns.md) |
| Criar componente Frontend? | → [frontend-patterns.md](./frontend-patterns.md) |
| Dúvida de nome? | → [naming.md](./naming.md) |
| Escrever testes? | → [testing.md](./testing.md) |
| Fazer PR? | → [git.md](./git.md) |
| Documentar entrega? | → [handoff-template.md](./handoff-template.md) |

---

**Versão dos Padrões**: v2.0 (4-agentes)  
**Última Atualização**: 2026-02-04  
**Próxima Revisão**: 2026-03-04 (mensal)