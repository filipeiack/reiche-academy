# 🚀 Setup de Branches - Guia Rápido

Execute estes comandos para configurar as branches do projeto.

## 📋 Pré-requisitos

- Git instalado
- Repositório clonado
- Estar na pasta do projeto

---

## 🎯 Passo 1: Criar Branches

```powershell
# Garantir que está em main atualizado
git checkout main
git pull origin main

# Criar branch staging (homologação)
git checkout -b staging
git push -u origin staging

# Criar branch develop (desenvolvimento)
git checkout -b develop
git push -u origin develop

# Verificar branches criadas
git branch -a
```

**Resultado esperado:**
```
* develop
  main
  staging
  remotes/origin/develop
  remotes/origin/main
  remotes/origin/staging
```

---

## 🎯 Passo 2: Configurar Branch Padrão no GitHub

1. Abrir: https://github.com/filipeiack/reiche-academy
2. Settings → Branches
3. Default branch: trocar de `main` para **`develop`**
4. Clicar "Update"

**Por quê?** Agora quando alguém clonar o repo, começa em `develop` (desenvolvimento).

---

## 🎯 Passo 3: Proteger Branches no GitHub

### **Proteger `main` (Produção)**

1. GitHub → Settings → Branches
2. Add branch protection rule
3. Branch name pattern: `main`
4. Marcar:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings
5. Create

### **Proteger `staging` (Homologação)**

1. Add branch protection rule
2. Branch name pattern: `staging`
3. Marcar:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require branches to be up to date before merging
4. Create

### **Proteger `develop` (Desenvolvimento)**

1. Add branch protection rule
2. Branch name pattern: `develop`
3. Marcar:
   - ✅ Require a pull request before merging
   - ⚠️ Require approvals: (deixar desmarcado se trabalha sozinho)
4. Create

---

## 🎯 Passo 4: Testar Workflow

```powershell
# 1. Criar feature de teste
git checkout develop
git checkout -b feature/teste-workflow

# 2. Fazer uma mudança
echo "# Teste de workflow" >> TESTE.md
git add TESTE.md
git commit -m "feat: adiciona arquivo de teste"

# 3. Enviar para GitHub
git push -u origin feature/teste-workflow

# 4. Ir no GitHub e criar Pull Request
# feature/teste-workflow → develop

# 5. Após merge, deletar branch
git checkout develop
git pull origin develop
git branch -d feature/teste-workflow
git push origin --delete feature/teste-workflow

# 6. Limpar arquivo de teste
git rm TESTE.md
git commit -m "chore: remove arquivo de teste"
git push origin develop
```

---

## 🎯 Passo 5: Configurar .gitignore (se necessário)

Verificar se estes arquivos/pastas estão ignorados:

```gitignore
# Ambiente
.env
.env.local
.env.*.local

# Docker
docker-compose.override.yml

# Node
node_modules/
dist/
.angular/

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Build
build/
coverage/

# Backups
backups/*.sql
backups/*.sql.gz
```

---

## 📊 Estrutura Final

```
filipeiack/reiche-academy
├── main      (produção) 🔒
├── staging   (homologação) 🔒
└── develop   (desenvolvimento) 🔒 (default)
```

---

## ✅ Verificação

Confirme que:

- ✅ 3 branches criadas (main, staging, develop)
- ✅ `develop` é branch padrão
- ✅ Branches principais protegidas
- ✅ Pull Requests obrigatórios
- ✅ Workflow testado

---

## 🎯 Uso Diário

A partir de agora:

```powershell
# 1. Sempre começar do develop
git checkout develop
git pull origin develop

# 2. Criar feature
git checkout -b feature/nome-da-funcionalidade

# 3. Desenvolver, commitar, push

# 4. Pull Request no GitHub

# 5. Após merge, deletar branch
```

---

## 🚨 Troubleshooting

**Erro: "branch already exists"**
```powershell
git branch -d staging
git checkout -b staging
```

**Erro: "cannot push to protected branch"**
- Isso é esperado! Use Pull Requests.

**Erro: "merge conflict"**
```powershell
# Atualizar branch antes de mergear
git checkout develop
git pull origin develop
git checkout feature/sua-branch
git merge develop
# Resolver conflitos
git commit
git push
```

---

## 📚 Próximo Passo

Leia o **[GIT_WORKFLOW.md](GIT_WORKFLOW.md)** para entender o fluxo completo de trabalho!
