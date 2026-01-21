# 🌿 Git Workflow - Reiche Academy

Estratégia de branches para desenvolvimento, homologação e produção.

## 🎯 Estrutura de Branches

```
main (produção)
  ├── staging (homologação)
  │     └── develop (desenvolvimento)
  │           ├── feature/nova-funcionalidade
  │           ├── feature/ajuste-layout
  │           └── bugfix/correcao-bug
  └── hotfix/urgente
```

---

## 📋 Branches Principais

### **`main`** - Produção 🚀
- Código **100% estável** em produção
- Apenas código testado e aprovado
- Protegida: só aceita merges de `staging` ou `hotfix/*`
- Sempre deployável
- **Deploy automático**: app.reicheacademy.cloud

### **`staging`** - Homologação 🔧
- Ambiente de testes pré-produção
- Código que passou pelos testes de desenvolvimento
- Validação final antes de produção
- **Deploy automático**: staging.reicheacademy.cloud

### **`develop`** - Desenvolvimento 🏗️
- Base para novas features
- Integração contínua de funcionalidades
- Pode ter bugs (ambiente de testes)
- **Deploy local**: sua máquina

---

## 🔄 Fluxo de Trabalho

### **1. Nova Funcionalidade**

```bash
# 1. Partir do develop
git checkout develop
git pull origin develop

# 2. Criar branch de feature
git checkout -b feature/nome-da-funcionalidade

# 3. Desenvolver e commitar
git add .
git commit -m "feat: adiciona nova funcionalidade"

# 4. Enviar para GitHub
git push origin feature/nome-da-funcionalidade

# 5. Criar Pull Request no GitHub
# feature/nome-da-funcionalidade → develop

# 6. Após aprovação, merge e deletar branch
git checkout develop
git merge feature/nome-da-funcionalidade
git push origin develop
git branch -d feature/nome-da-funcionalidade
git push origin --delete feature/nome-da-funcionalidade
```

---

### **2. Deploy para Homologação**

```bash
# Quando develop está estável
git checkout staging
git pull origin staging
git merge develop
git push origin staging

# Isso dispara deploy automático para staging.reicheacademy.cloud
```

---

### **3. Deploy para Produção**

```bash
# Após testes em staging OK
git checkout main
git pull origin main
git merge staging
git push origin main

# Isso dispara deploy automático para app.reicheacademy.cloud
```

---

### **4. Correção Urgente (Hotfix)**

```bash
# 1. Partir de main (código em produção)
git checkout main
git pull origin main
git checkout -b hotfix/correcao-urgente

# 2. Corrigir o bug
git add .
git commit -m "fix: corrige problema urgente"

# 3. Merge em main (produção)
git checkout main
git merge hotfix/correcao-urgente
git push origin main

# 4. Merge também em staging e develop
git checkout staging
git merge hotfix/correcao-urgente
git push origin staging

git checkout develop
git merge hotfix/correcao-urgente
git push origin develop

# 5. Deletar branch de hotfix
git branch -d hotfix/correcao-urgente
git push origin --delete hotfix/correcao-urgente
```

---

## 🏷️ Convenções de Nomenclatura

### **Tipos de Branches**

| Tipo | Prefixo | Exemplo | Quando Usar |
|------|---------|---------|-------------|
| **Feature** | `feature/` | `feature/login-google` | Nova funcionalidade |
| **Bugfix** | `bugfix/` | `bugfix/erro-login` | Correção de bug |
| **Hotfix** | `hotfix/` | `hotfix/seguranca-critica` | Correção urgente em produção |
| **Refactor** | `refactor/` | `refactor/auth-service` | Refatoração de código |
| **Docs** | `docs/` | `docs/api-documentation` | Documentação |
| **Test** | `test/` | `test/unit-tests-pilares` | Adicionar testes |
| **Chore** | `chore/` | `chore/update-dependencies` | Tarefas diversas |

### **Regras de Nome**

✅ **BOM:**
```
feature/adiciona-relatorio-cockpit
bugfix/corrige-validacao-empresa
hotfix/sql-injection
```

❌ **RUIM:**
```
feature/Feature1
minha-branch
fix
```

---

## 📝 Convenções de Commit

Seguir **Conventional Commits**: https://www.conventionalcommits.org/

### **Formato**
```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### **Tipos**

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `feat` | Nova funcionalidade | `feat(auth): adiciona login com Google` |
| `fix` | Correção de bug | `fix(empresas): corrige validação de CNPJ` |
| `docs` | Documentação | `docs(readme): atualiza instruções de deploy` |
| `style` | Formatação de código | `style(pilares): ajusta indentação` |
| `refactor` | Refatoração | `refactor(auth): simplifica validação JWT` |
| `test` | Testes | `test(usuarios): adiciona testes unitários` |
| `chore` | Tarefas diversas | `chore(deps): atualiza dependências` |
| `perf` | Performance | `perf(dashboard): otimiza queries` |
| `ci` | CI/CD | `ci(github): adiciona workflow de deploy` |

### **Exemplos**

```bash
# Feature
git commit -m "feat(pilares): adiciona filtro por status"

# Bugfix
git commit -m "fix(rotinas): corrige erro ao salvar data"

# Breaking change
git commit -m "feat(api)!: altera formato de resposta" -m "BREAKING CHANGE: endpoint /api/empresas agora retorna array"

# Com escopo e corpo
git commit -m "feat(diagnostico): adiciona wizard passo 3" -m "Implementa validações de negócio e integração com backend"
```

---

## 🔒 Proteção de Branches (Configurar no GitHub)

### **Branch `main`**
- ✅ Require pull request antes de merge
- ✅ Require approvals (1+)
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Do not allow bypassing

### **Branch `staging`**
- ✅ Require pull request
- ✅ Require approvals (1)
- ✅ Require status checks

### **Branch `develop`**
- ✅ Require pull request
- ⚠️ Approvals (opcional)

---

## 🚀 Configuração Inicial

### **1. Criar Branches Localmente**

```bash
# Criar staging a partir de main
git checkout main
git pull origin main
git checkout -b staging
git push -u origin staging

# Criar develop a partir de staging
git checkout staging
git checkout -b develop
git push -u origin develop
```

### **2. Definir Branch Padrão (GitHub)**

- GitHub → Settings → Branches
- Default branch: `develop`

### **3. Proteger Branches (GitHub)**

- GitHub → Settings → Branches → Add rule
- Configurar proteções conforme acima

---

## 📊 Fluxo Visual Completo

```
┌─────────────────────────────────────────────────────────┐
│                   DESENVOLVIMENTO                       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
    ┌──────────────────────────────────┐
    │  feature/nova-funcionalidade     │
    └──────────────┬───────────────────┘
                   │ PR + Review
                   ▼
    ┌──────────────────────────────────┐
    │         develop                   │ (ambiente local)
    └──────────────┬───────────────────┘
                   │ Quando estável
                   ▼
┌─────────────────────────────────────────────────────────┐
│                    HOMOLOGAÇÃO                          │
└─────────────────────────────────────────────────────────┘
                   │
    ┌──────────────────────────────────┐
    │         staging                   │ (staging.reicheacademy.cloud)
    └──────────────┬───────────────────┘
                   │ Após testes OK
                   ▼
┌─────────────────────────────────────────────────────────┐
│                     PRODUÇÃO                            │
└─────────────────────────────────────────────────────────┘
                   │
    ┌──────────────────────────────────┐
    │          main                     │ (app.reicheacademy.cloud)
    └───────────────────────────────────┘
```

---

## 🎯 Integração com Docker

| Branch | Docker Compose | Deploy | URL |
|--------|----------------|--------|-----|
| `develop` | `docker-compose.yml` | Local | http://localhost:4200 |
| `staging` | `docker-compose.vps.yml` | VPS (auto) | https://staging.reicheacademy.cloud |
| `main` | `docker-compose.vps.yml` | VPS (auto) | https://app.reicheacademy.cloud |

---

## 🔄 Sincronização de Branches

### **Manter develop atualizado com staging**

```bash
git checkout develop
git merge staging
git push origin develop
```

### **Manter staging atualizado com main (após hotfix)**

```bash
git checkout staging
git merge main
git push origin staging
```

---

## 📚 Comandos Úteis

```bash
# Ver branch atual
git branch

# Ver todas branches (local + remote)
git branch -a

# Trocar de branch
git checkout <branch>

# Criar e trocar para nova branch
git checkout -b <branch>

# Atualizar branch com remote
git pull origin <branch>

# Ver histórico de commits
git log --oneline --graph --all

# Deletar branch local
git branch -d <branch>

# Deletar branch remote
git push origin --delete <branch>

# Ver diferenças entre branches
git diff develop..staging
```

---

## ❓ FAQ

**P: Posso commitar direto em `main`?**  
R: ❌ Não! Sempre via Pull Request de `staging`.

**P: Como testar uma feature antes de mergear?**  
R: Faça checkout da branch de feature localmente: `git checkout feature/nome`

**P: E se eu esquecer de criar branch de feature?**  
R: Crie a branch agora: `git checkout -b feature/nome` (commits vão junto)

**P: Posso ter várias features ao mesmo tempo?**  
R: ✅ Sim! Cada uma em sua própria branch.

**P: Como reverter um commit em produção?**  
R: `git revert <commit-hash>` e fazer novo deploy.

---

## 🎓 Boas Práticas

✅ Sempre partir de `develop` para features  
✅ Commits pequenos e frequentes  
✅ Mensagens descritivas  
✅ Testar antes de mergear  
✅ Code review em Pull Requests  
✅ Deletar branches após merge  
✅ Manter branches principais atualizadas  
✅ Usar conventional commits  

❌ Commitar direto em `main` ou `staging`  
❌ Commits genéricos ("fix", "update")  
❌ Features muito grandes  
❌ Código não testado  
❌ Deixar branches antigas abertas  

---

## 🚀 Próximos Passos (Avançado)

1. **GitHub Actions** para CI/CD automático
2. **Semantic Release** para versionamento automático
3. **Changesets** para changelogs
4. **Husky** para hooks de pre-commit
5. **Commitlint** para validar mensagens

---

**Última atualização:** Janeiro 2026
