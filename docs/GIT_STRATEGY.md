# 🌿 Estratégia de Branches - Reiche Academy

## 📋 Visão Geral

O projeto utiliza **GitFlow Simplificado** com 3 branches principais:

```
develop  → Desenvolvimento local
   ↓ merge
staging  → Homologação no VPS
   ↓ merge
main     → Produção no VPS
```

---

## 🌿 Branches

### **develop** - Desenvolvimento
- **Ambiente**: Local (localhost:4200)
- **Uso**: Desenvolvimento diário
- **Commits**: Diretos permitidos
- **Deploy**: Não faz deploy automático

### **staging** - Homologação
- **Ambiente**: VPS Staging
- **URL**: https://staging.reicheacademy.com.br
- **Uso**: Testes e validação QA
- **Commits**: Apenas via merge de `develop`
- **Deploy**: Manual no VPS
- **Database**: `reiche_academy_staging`
- **Redis**: db 1

### **main** - Produção
- **Ambiente**: VPS Produção
- **URL**: https://app.reicheacademy.com.br
- **Uso**: Usuários finais
- **Commits**: Apenas via merge de `staging`
- **Deploy**: Manual no VPS (com backup obrigatório)
- **Database**: `reiche_academy_prod`
- **Redis**: db 0

---

## 🔄 Workflow Completo

### **1. Desenvolvimento Local**

```bash
# Trabalhar sempre em develop
git checkout develop
git pull origin develop

# Fazer alterações
# ... código ...

# Commit e push
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop
```

### **2. Deploy para Staging**

```bash
# Local: Merge develop → staging
git checkout staging
git pull origin staging
git merge develop

# Resolver conflitos (se houver)
git push origin staging

# VPS: Deploy staging
ssh root@76.13.66.10
cd /opt/reiche-academy
bash scripts/deploy-vps.sh staging
```

**Ou manualmente:**
```bash
ssh root@76.13.66.10
cd /opt/reiche-academy

git fetch origin
git checkout staging
git pull origin staging

docker compose -f docker-compose.vps.yml build backend-staging frontend-staging
docker compose -f docker-compose.vps.yml up -d --no-deps backend-staging frontend-staging
docker compose -f docker-compose.vps.yml exec backend-staging npm run migration:prod
```

### **3. Testes em Staging**

```bash
# Acessar https://staging.reicheacademy.com.br
# Executar testes manuais
# Validar funcionalidades
# QA sign-off
```

### **4. Deploy para Produção**

```bash
# Local: Merge staging → main
git checkout main
git pull origin main
git merge staging

# Verificar se está tudo OK
git push origin main

# VPS: BACKUP primeiro!
ssh root@76.13.66.10
cd /opt/reiche-academy
bash scripts/maintenance-vps.sh backup

# Deploy produção
bash scripts/deploy-vps.sh prod
```

**Ou manualmente:**
```bash
ssh root@76.13.66.10
cd /opt/reiche-academy

# BACKUP OBRIGATÓRIO!
docker compose -f docker-compose.vps.yml exec postgres \
  pg_dump -U reiche_admin reiche_academy_prod | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

git fetch origin
git checkout main
git pull origin main

docker compose -f docker-compose.vps.yml build backend-prod frontend-prod
docker compose -f docker-compose.vps.yml up -d --no-deps backend-prod frontend-prod
docker compose -f docker-compose.vps.yml exec backend-prod npm run migration:prod
```

---

## 🚨 Hotfix (Correção Urgente)

Para correções críticas em produção:

```bash
# Criar branch de hotfix a partir de main
git checkout main
git pull origin main
git checkout -b hotfix/descricao-do-problema

# Fazer correção
# ... código ...
git add .
git commit -m "fix: correção urgente"

# Merge de volta para TODAS as branches
git checkout main
git merge hotfix/descricao-do-problema
git push origin main

git checkout staging
git merge hotfix/descricao-do-problema
git push origin staging

git checkout develop
git merge hotfix/descricao-do-problema
git push origin develop

# Deletar branch de hotfix
git branch -d hotfix/descricao-do-problema

# Deploy imediato em produção
ssh root@76.13.66.10
cd /opt/reiche-academy
bash scripts/maintenance-vps.sh backup
bash scripts/deploy-vps.sh prod
```

---

## 🎯 Features Branches (Opcional)

Para features grandes ou experimentais:

```bash
# Criar feature branch a partir de develop
git checkout develop
git pull origin develop
git checkout -b feature/nome-da-feature

# Desenvolver
# ... código ...
git add .
git commit -m "feat: implementação da feature"
git push origin feature/nome-da-feature

# Quando pronto, merge de volta para develop
git checkout develop
git merge feature/nome-da-feature
git push origin develop

# Deletar feature branch
git branch -d feature/nome-da-feature
git push origin --delete feature/nome-da-feature
```

---

## ⚠️ Regras Importantes

### **NUNCA faça:**
- ❌ Commit direto em `staging` ou `main`
- ❌ `git push --force` em branches principais
- ❌ Deploy em produção sem testar em staging
- ❌ Deploy em produção sem backup
- ❌ Merge de `main` de volta para `develop` (exceto hotfixes)

### **SEMPRE faça:**
- ✅ Merge sequencial: `develop → staging → main`
- ✅ Testes em staging antes de produção
- ✅ Backup antes de deploy em produção
- ✅ Pull antes de fazer merge
- ✅ Resolver conflitos com cuidado

---

## 📊 Comandos Úteis

### **Ver branch atual**
```bash
git branch --show-current
```

### **Ver status**
```bash
git status
```

### **Ver diferenças entre branches**
```bash
# Ver o que tem em develop que não está em staging
git log staging..develop --oneline

# Ver o que tem em staging que não está em main
git log main..staging --oneline
```

### **Trocar de branch**
```bash
git checkout develop
git checkout staging
git checkout main
```

### **Atualizar branch**
```bash
git pull origin develop
git pull origin staging
git pull origin main
```

### **Ver histórico**
```bash
git log --oneline --graph --all
```

---

## 🔍 Troubleshooting

### **Conflitos no merge**
```bash
# Ao fazer merge, se houver conflitos:
git merge develop
# CONFLICT em arquivo.ts

# Editar arquivo.ts e resolver manualmente
# Remover marcadores <<<<<<, =======, >>>>>>>

git add arquivo.ts
git commit -m "Merge develop into staging"
git push origin staging
```

### **Abandonar merge com conflitos**
```bash
git merge --abort
```

### **Ver quais arquivos têm conflitos**
```bash
git status
```

### **Resetar branch para estado remoto**
```bash
# CUIDADO: perde alterações locais!
git fetch origin
git reset --hard origin/develop
```

---

## 📚 Referências

- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)
- [Atlassian Git Tutorial](https://www.atlassian.com/git/tutorials)
- [GitHub Flow](https://guides.github.com/introduction/flow/)

---

**Última atualização**: Janeiro 2026
