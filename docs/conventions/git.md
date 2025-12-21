# Convenções - Git

⚠️ Este documento descreve padrões observados, não obrigatórios.

## 1. Branches

### Padrão Observado

**Analisando repositório**: Branch principal é `main`

**Estrutura de branch observada**:
```
main (default branch)
```

**Padrão esperado** (não consolidado no código):
- Feature branches: `feature/{nome}`
- Bugfix branches: `bugfix/{nome}` ou `fix/{nome}`
- Release branches: `release/{versão}`
- Hotfix branches: `hotfix/{nome}`

**Obs**: Apenas `main` foi confirmado via attachment (repositório info)

**Consistência**: **NÃO CONSOLIDADO** - Sem documentação ou evidência de padrão de branches no repositório

---

## 2. Commits

### Padrão Observado

**Sem acesso ao histórico de commits** (não foi analisado o log do git)

**Padrão esperado** (baseado em README ou docs):
- Conventional Commits format: `type(scope): message`
- Ex: `feat(usuarios): adicionar upload de avatar`

**Convenções observadas em documentação**:

Nenhuma documentação explícita de commit messages foi encontrada em:
- `README.md` (frontend e backend)
- Documentação em `/docs/`

**Padrão potencial**:
```
feat(modulo): descrição curta
fix(modulo): descrição curta
docs(docs): descrição curta
chore(devops): descrição curta
test(modulo): descrição curta
refactor(modulo): descrição curta
```

**Observação**: Stack de projeto inclui commit linting (não visível), sugere padrão bem-definido

**Consistência**: **NÃO CONSOLIDADO** - Sem documentação de padrão de commits

---

## 3. Tags e Versionamento

### Padrão Observado

**Não observado** (sem arquivo CHANGELOG detalhado ou git tags analisadas)

**Arquivo**: `docs/CHANGELOG.md` (existe mas não foi analisado completamente)

**Padrão potencial**: Semantic Versioning (v1.0.0, v1.1.0)

**Package.json versions**:
```json
"@reiche-academy/frontend": "1.0.0"
"@reiche-academy/backend": "1.0.0"
```

**Padrão**: Ambos em 1.0.0 (fase 1 em desenvolvimento)

**Consistência**: **NÃO CONSOLIDADO**

---

## 4. Pull Requests / Merge Requests

### Padrão Observado

**Não observado** (sem template de PR ou documentação)

**Padrão esperado** (convenção comum):
```markdown
## Descrição
Explica o que foi implementado/corrigido

## Tipo de Mudança
- [ ] Feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation

## Como testar
Descrever os passos para validar as mudanças

## Checklist
- [ ] Código segue as convenções
- [ ] Testes adicionados/atualizados
- [ ] Documentação atualizada
```

**Consistência**: **NÃO CONSOLIDADO** - Sem template observado

---

## 5. Conventional Commits

### Possível Padrão

Baseado no package.json e estrutura de projeto, o padrão pode ser:

```
<type>(<scope>): <message>

[optional body]

[optional footer]
```

**Types potenciais**:
- `feat` - Nova feature
- `fix` - Bug fix
- `docs` - Apenas documentação
- `style` - Formatação (sem mudança lógica)
- `refactor` - Refatoração de código
- `test` - Adição ou atualização de testes
- `chore` - Build, dependências, etc

**Scopes potenciais**:
- `usuarios` - Módulo de usuários
- `auth` - Autenticação
- `empresas` - Gestão de empresas
- `diagnosticos` - Diagnóstico
- `frontend` - Frontend em geral
- `backend` - Backend em geral
- `docs` - Documentação
- `devops` - Infraestrutura/Docker

**Exemplo esperado**:
```
feat(usuarios): adicionar upload de avatar de usuário

- Implementa FileInterceptor para upload
- Armazena em /public/images/avatars/
- Atualiza URL no banco de dados

Fixes #123
```

**Consistência**: **NÃO CONSOLIDADO** - Inferido, não documentado

---

## 6. Code Review

### Padrão Observado

**Não documentado** (nenhum README ou guia de code review)

**Padrão esperado** (convenção comum):
- Requer 1-2 aprovações antes de merge
- CI/CD deve passar
- Sem merge commits (rebase or squash)

**Consistência**: **NÃO CONSOLIDADO**

---

## 7. Integração Contínua (CI/CD)

### GitHub Actions

**Estrutura esperada**: `.github/workflows/`

**Não analisado completamente** (não foi encontrado nos arquivos)

**Package.json scripts** (evidência de CI):

Backend:
```json
"test": "jest",
"test:cov": "jest --coverage",
"lint": "eslint ...",
"build": "nest build"
```

Frontend:
```json
"test": "ng test",
"test:e2e": "playwright test",
"build": "ng build"
```

**Padrão esperado** (baseado em estrutura):
1. Lint (ESLint + Prettier)
2. Test (Testes unitários)
3. Build (Compilação)
4. E2E (Testes end-to-end)
5. Deploy (se main)

**Consistência**: **NÃO CONSOLIDADO** - Configurado (provável), não documentado

---

## 8. .gitignore

### Padrão Observado

**Não analisado** (arquivo não foi lido)

**Padrão esperado** (convencional):

Backend:
```
node_modules/
dist/
.env
.env.*.local
coverage/
.prisma/
```

Frontend:
```
node_modules/
dist/
build/
.angular/
coverage/
.env.local
```

**Consistência**: **NÃO ANALISADO**

---

## 9. Branching Strategy

### Fluxo Esperado

Baseado na estrutura do projeto, provável fluxo:

```
main (produção)
└── develop (desenvolvimento)
    └── feature/usuarios-crud
    └── feature/diagnostico-wizard
    └── bugfix/login-issue
```

**Ou alternativa** (trunk-based):
```
main (única branch)
└── feature branches (curta duração)
```

**Consistência**: **NÃO CONSOLIDADO** - Sem documentação

---

## 10. Release Process

### Padrão Observado

**Não documentado** (sem RELEASE.md ou procedimento claro)

**Padrão esperado**:
1. Criar branch `release/v{version}`
2. Atualizar versão em package.json
3. Atualizar CHANGELOG.md
4. Criar tag `v{version}`
5. Merge em main e develop
6. Deploy para produção

**Arquivo**: `docs/CHANGELOG.md` (existe, potencial rastreamento)

**Consistência**: **NÃO CONSOLIDADO**

---

## 11. Políticas de Merge

### Padrão Observado

**Não documentado**

**Padrão esperado**:
- Rebase and merge (manter histórico linear)
- Ou Squash and merge (commits limpos)
- Não usar Merge commits (evitar "Merge pull request #123")

**Consistência**: **NÃO CONSOLIDADO**

---

## 12. Versionamento de Dependências

### Frontend

```json
{
  "@angular/core": "^18.2.0",
  "rxjs": "~7.8.0",
  "@angular/material": "^18.2.0"
}
```

**Padrão**:
- `^` para minor/patch automático (18.2.x)
- `~` para patch automático (7.8.x)

### Backend

```json
{
  "@nestjs/common": "^10.4.20",
  "@prisma/client": "^5.7.1",
  "argon2": "^0.31.2"
}
```

**Padrão**: Sempre `^` (minor/patch automático)

**Obs**: Ambos permitem atualizações automáticas (não pinned versions)

**Consistência**: **INCONSISTENTE** (frontend misto com ~, backend sempre ^)

---

## Resumo - Consistência de Git

| Aspecto | Consistência | Notas |
|---------|--------------|-------|
| Branches | NÃO CONSOLIDADO | Apenas main visto |
| Commits | NÃO CONSOLIDADO | Sem documentação |
| Tags | NÃO CONSOLIDADO | 1.0.0 em package.json |
| Pull Requests | NÃO CONSOLIDADO | Sem template |
| Conventional Commits | NÃO CONSOLIDADO | Inferido, não documentado |
| Code Review | NÃO CONSOLIDADO | Sem documentação |
| CI/CD | NÃO CONSOLIDADO | Scripts existem, workflows não analisados |
| .gitignore | NÃO ANALISADO | Arquivo não lido |
| Branching Strategy | NÃO CONSOLIDADO | Sem documentação |
| Release Process | NÃO CONSOLIDADO | Sem documentação |
| Merge Policy | NÃO CONSOLIDADO | Sem documentação |
| Versionamento | INCONSISTENTE | Frontend ~ vs Backend ^ |

---

## Limitações e Gaps - Git

1. **Padrão de branches não documentado**: Sem guia de quando criar feature/bugfix/release branches

2. **Commit messages não documentadas**: Sem template ou convenção explícita (mesmo que usada na prática)

3. **Pull request template ausente**: Sem `.github/pull_request_template.md`

4. **Política de merge não definida**: Sem rebase/squash/merge strategy documentada

5. **CI/CD não documentado**: Workflows podem existir em `.github/workflows/` mas não foram encontrados

6. **Release checklist ausente**: Sem procedimento claro para releases

7. **Tag naming convention não definida**: v1.0.0 inferido, não documentado

8. **Code review guidelines ausentes**: Sem CONTRIBUTING.md com critérios de review

9. **Revert strategy não documentada**: Sem procedimento para reverter commits/PRs

10. **Blame/History guidelines não existem**: Sem documentação de como consultar histórico

11. **Squashing vs rebasing**: Sem política clara definida no projeto

12. **Branch protection rules não documentadas**: Sem README sobre regras de branch protection no GitHub

---

## Recomendação para Futuro Padrão

Baseado em convenções observadas no código (bem estruturado e organizado), sugerimos:

**Estrutura sugerida** (não implementada):
```markdown
## Commit Message Format
feat(usuarios): add avatar upload
fix(auth): jwt refresh token validation
docs(conventions): document git workflow
test(usuarios): add unit tests for service
refactor(frontend): extract form validation logic

## Branch Naming
feature/description
bugfix/issue-number
release/version
hotfix/critical-issue

## PR Title Format
[TYPE](SCOPE): Brief description - #issue

## Version Format
MAJOR.MINOR.PATCH (Semantic Versioning)
```

**Status Atual**: Nenhuma documentação oficial de Git workflow foi encontrada.
