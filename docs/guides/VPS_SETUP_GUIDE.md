# 🏢 Guia VPS Único - Staging + Produção

Este guia explica como rodar **staging e produção no mesmo VPS** (Ubuntu com Docker).

## 🌿 Estratégia de Branches Git

O projeto utiliza **GitFlow simplificado** com 3 branches principais:

```
develop  ← Desenvolvimento ativo (local)
   ↓ merge
staging  ← Homologação (VPS staging)
   ↓ merge  
main     ← Produção (VPS produção)
```

| Branch | Ambiente | URL | Uso |
|--------|----------|-----|-----|
| **develop** | Local | localhost:4200 | Desenvolvimento diário |
| **staging** | VPS Staging | staging.reicheacademy.cloud | Testes e validação |
| **main** | VPS Produção | app.reicheacademy.cloud | Usuários finais |

> **Importante**: Nunca faça commit direto em `main` ou `staging`. Sempre faça merge de `develop → staging → main`.

---

## 📋 Dados de Acesso ao VPS

```
🌐 IP:       76.13.66.10
👤 Usuário:  root
🔑 Senha:    Reiche@c@d3m1
🐧 SO:       Ubuntu
🐳 Docker:   Instalado
```

## 📊 Recursos do VPS

```
CPU:  2 cores
RAM:  8GB
SSD:  100GB
Banda: Ilimitada
```

**Status**: ✅ Suficiente para ambos ambientes!

---

## 🏗️ Arquitetura no VPS

```
                    INTERNET
                       │
                       ▼
              ┌────────────────┐
              │  Nginx Master  │ (Porta 80/443)
              │  Routing       │
              └────────┬───────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐            ┌───────────────┐
│   PRODUÇÃO    │            │    STAGING    │
│               │            │               │
│ Frontend:80   │            │ Frontend:80   │
│ Backend:3000  │            │ Backend:3000  │
└───────┬───────┘            └───────┬───────┘
        │                            │
        └──────────┬─────────────────┘
                   ▼
        ┌──────────────────┐
        │   PostgreSQL     │ (2 databases)
        │   - prod         │
        │   - staging      │
        └──────────────────┘
                   │
        ┌──────────────────┐
        │      Redis       │ (2 databases)
        │   - db 0 (prod)  │
        │   - db 1 (stag)  │
        └──────────────────┘
```

---

## 🎯 Routing por Subdomínio

| Domínio | Vai Para | Uso |
|---------|----------|-----|
| `app.reicheacademy.cloud` | Frontend Produção → Backend Produção | Usuários finais |
| `staging.reicheacademy.cloud` | Frontend Staging → Backend Staging | Testes |

---

## 📦 Componentes Criados

1. **[docker-compose.vps.yml](../../docker-compose.vps.yml)** - Orquestração completa (staging + prod)
2. **[nginx/nginx.conf](../../nginx/nginx.conf)** - Roteamento por subdomínio
3. **[scripts/init-databases.sh](../../scripts/init-databases.sh)** - Cria 2 databases automaticamente
4. **[.env.vps](../../.env.vps)** - Variáveis de ambiente para o VPS

---

## � Scripts Automatizados

Este projeto inclui scripts para facilitar deploy e manutenção:

### **deploy-vps.sh** - Deploy Automático

Realiza o setup completo do VPS em uma execução.

```bash
cd /opt/reiche-academy
bash scripts/deploy-vps.sh
```

**O que faz:**
- ✅ Atualiza sistema Ubuntu
- ✅ Instala Docker e Docker Compose (se necessário)
- ✅ Clona/atualiza repositório GitHub
- ✅ Configura variáveis de ambiente
- ✅ Faz build de todas as imagens
- ✅ Inicia todos os serviços
- ✅ Executa migrations
- ✅ Carrega dados iniciais (seeds)

**Tempo estimado**: 20-30 minutos (primeira execução)

### **maintenance-vps.sh** - Manutenção Contínua

Script interativo para monitorar e manter a saúde do VPS.

**Uso Interativo:**
```bash
bash scripts/maintenance-vps.sh
```

**Menu:**
```
1) 📊 Health Check        - Verifica saúde de todos os serviços
2) 💾 Backup Database     - Faz backup completo dos bancos
3) 📋 Verificar Logs      - Procura erros nos logs
4) 📥 Atualizar Código    - Puxa novo código e faz redeploy
5) 🔄 Reiniciar Serviços  - Reinicia containers específicos
6) 📊 Mostrar Status      - Mostra docker ps
7) 📈 Uso de Recursos     - Mostra docker stats
8) 🚪 Sair
```

**Uso Direto:**
```bash
bash scripts/maintenance-vps.sh health    # Health check
bash scripts/maintenance-vps.sh backup    # Fazer backup
bash scripts/maintenance-vps.sh logs      # Ver logs com erros
bash scripts/maintenance-vps.sh update    # Atualizar código
bash scripts/maintenance-vps.sh restart   # Reiniciar serviços
```

**Automação com Cron:**
```bash
# Backup automático (3h da manhã)
0 3 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh backup >> maintenance.log 2>&1

# Health check diário (9h da manhã)
0 9 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh health >> maintenance.log 2>&1
```

---

## �🚀 Deploy Passo a Passo

### **1. Configurar DNS**

No painel do seu registrador de domínios, criar 2 registros A:

```
app.reicheacademy.cloud      → 76.13.66.10
staging.reicheacademy.cloud  → 76.13.66.10
```

⏱️ **Nota**: Propagação de DNS pode levar até 48h.

### **2. Conectar ao VPS via SSH**

```bash
# Conectar ao VPS
ssh root@76.13.66.10

# Quando solicitado, fornecer a senha:
# Reiche@c@d3m1
```

### **3. Preparar Servidor**

```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar
docker --version
docker compose version

# Instalar Git
apt install git -y

# Criar diretório
mkdir -p /opt/reiche-academy
cd /opt/reiche-academy
```

### **4. Fazer Deploy**

```bash
# Clonar repositório (branch develop por padrão)
git clone https://github.com/filipeiack/reiche-academy.git .

# Configurar branches no VPS
# O VPS precisa dos branches staging e main para os ambientes correspondentes

# Copiar e configurar ambiente
cp .env.vps .env
nano .env

# IMPORTANTE: Editar .env e trocar TODAS as senhas!
# Gerar JWT secrets com:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **Nota sobre branches no VPS:**
> - Mantenha o VPS sincronizado com `staging` para o ambiente de staging
> - Mude para `main` antes de fazer deploy de produção
> - Use `git fetch origin` + `git checkout <branch>` para trocar entre ambientes

### **5. Build e Start**

```bash
# Build de todas as imagens
docker compose -f docker-compose.vps.yml build

# Subir serviços
docker compose -f docker-compose.vps.yml up -d

# Verificar status
docker compose -f docker-compose.vps.yml ps

# Ver logs
docker compose -f docker-compose.vps.yml logs -f
```

### **6. Criar Databases (se necessário)**

```bash
# Verificar se databases existem
docker compose -f docker-compose.vps.yml exec postgres psql -U reiche_admin -d postgres -c "\l"

# Se NÃO existirem, criar manualmente:
docker compose -f docker-compose.vps.yml exec postgres psql -U reiche_admin -d postgres -c "CREATE DATABASE reiche_academy_prod;"
docker compose -f docker-compose.vps.yml exec postgres psql -U reiche_admin -d postgres -c "CREATE DATABASE reiche_academy_staging;"

# Reiniciar backends para reconectar
docker compose -f docker-compose.vps.yml restart backend-prod backend-staging
```

> **Nota**: O script `init-databases.sh` executa automaticamente apenas na **primeira vez** que o PostgreSQL é criado. Se o volume já existia, é necessário criar manualmente.

### **7. Executar Migrations e Seeds**

```bash
# PRODUÇÃO - Migrations
docker compose -f docker-compose.vps.yml exec backend-prod npm run migration:prod

# PRODUÇÃO - Seed
docker compose -f docker-compose.vps.yml exec backend-prod npm run seed

# STAGING - Migrations
docker compose -f docker-compose.vps.yml exec backend-staging npm run migration:prod

# STAGING - Seed (dados de teste)
docker compose -f docker-compose.vps.yml exec backend-staging npm run seed
```

### **8. Configurar SSL (Let's Encrypt - Grátis)**

```bash
# Instalar Certbot
apt install certbot -y

# Parar Nginx temporariamente
docker compose -f docker-compose.vps.yml stop nginx

# Gerar certificados (fazer 2x, um para cada domínio)
certbot certonly --standalone -d app.reicheacademy.cloud
certbot certonly --standalone -d staging.reicheacademy.cloud

# Copiar certificados
mkdir -p nginx/ssl

# Produção
cp /etc/letsencrypt/live/app.reicheacademy.cloud/fullchain.pem \
   nginx/ssl/app.reicheacademy.cloud.crt
cp /etc/letsencrypt/live/app.reicheacademy.cloud/privkey.pem \
   nginx/ssl/app.reicheacademy.cloud.key

# Staging
cp /etc/letsencrypt/live/staging.reicheacademy.cloud/fullchain.pem \
   nginx/ssl/staging.reicheacademy.cloud.crt
cp /etc/letsencrypt/live/staging.reicheacademy.cloud/privkey.pem \
   nginx/ssl/staging.reicheacademy.cloud.key

# Editar nginx.conf e descomentar seções HTTPS
nano nginx/nginx.conf

# Reiniciar Nginx
docker compose -f docker-compose.vps.yml start nginx
```

### **9. Testar Acesso (Antes de Configurar DNS)**

```bash
# Testar Backends Diretamente (Produção e Staging)
curl http://localhost:3001/api/health  # Backend Produção
curl http://localhost:3002/api/health  # Backend Staging

# Testar via Nginx (usando header Host)
curl -H "Host: app.reicheacademy.cloud" http://localhost/api/health        # Produção
curl -H "Host: staging.reicheacademy.cloud" http://localhost/api/health    # Staging

# Se tudo retornar {"status":"ok"}, os serviços estão funcionando! ✅
```

> **Nota**: Os domínios `app.reicheacademy.cloud` e `staging.reicheacademy.cloud` só funcionarão **após configurar o DNS** (passo 1). Por enquanto, use localhost para testar.

---

## 📊 Uso de Recursos Estimado

```
┌─────────────────┬──────┬────────┬─────────┐
│   Serviço       │ CPU  │  RAM   │  Disco  │
├─────────────────┼──────┼────────┼─────────┤
│ PostgreSQL      │ 25%  │ 800MB  │  2GB    │
│ Redis           │ 5%   │ 200MB  │  50MB   │
│ Backend Prod    │ 15%  │ 600MB  │  100MB  │
│ Backend Staging │ 10%  │ 400MB  │  100MB  │
│ Frontend Prod   │ 5%   │ 150MB  │  50MB   │
│ Frontend Stag   │ 5%   │ 150MB  │  50MB   │
│ Nginx           │ 5%   │ 100MB  │  10MB   │
├─────────────────┼──────┼────────┼─────────┤
│ TOTAL           │ 70%  │ 2.4GB  │  ~3GB   │
│ DISPONÍVEL      │ 30%  │ 1.6GB  │  97GB   │
└─────────────────┴──────┴────────┴─────────┘
```

**Conclusão**: Sobra margem boa para crescimento! ✅

---

## 🔄 Fluxo de Trabalho

### **Estratégia de Branches**

```
develop  → Branch de desenvolvimento (local)
   ↓
staging  → Branch de homologação (staging.reicheacademy.cloud)
   ↓
main     → Branch de produção (app.reicheacademy.cloud)
```

### **Desenvolvimento → Staging → Produção**

#### **1. Desenvolvimento Local (branch develop)**
```bash
# Fazer alterações no código
git checkout develop
git add .
git commit -m "feat: nova funcionalidade"
git push origin develop
```

#### **2. Merge para Staging e Deploy**
```bash
# Mesclar develop → staging
git checkout staging
git merge develop
git push origin staging

# No VPS: Atualizar ambiente de staging
ssh root@76.13.66.10
cd /opt/reiche-academy

# Fazer checkout para staging
git fetch origin
git checkout staging
git pull origin staging

# Rebuild apenas staging
docker compose -f docker-compose.vps.yml build backend-staging frontend-staging
docker compose -f docker-compose.vps.yml up -d --no-deps backend-staging frontend-staging

# Migrations staging
docker compose -f docker-compose.vps.yml exec backend-staging npm run migration:prod
```

#### **3. Testar em Staging**
```bash
# Acessar https://staging.reicheacademy.cloud
# Executar testes manuais e validações
# Se tudo OK → prosseguir para produção
```

#### **4. Merge para Produção e Deploy**
```bash
# Local: Mesclar staging → main
git checkout main
git merge staging
git push origin main

# No VPS: Backup primeiro!
ssh root@76.13.66.10
cd /opt/reiche-academy

# Fazer backup do banco de produção
docker compose -f docker-compose.vps.yml exec postgres \
  pg_dump -U reiche_admin reiche_academy_prod | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Atualizar código para main
git fetch origin
git checkout main
git pull origin main

# Rebuild produção
docker compose -f docker-compose.vps.yml build backend-prod frontend-prod
docker compose -f docker-compose.vps.yml up -d --no-deps backend-prod frontend-prod

# Migrations produção
docker compose -f docker-compose.vps.yml exec backend-prod npm run migration:prod
```

#### **5. Hotfix (correção urgente em produção)**
```bash
# Criar hotfix a partir de main
git checkout main
git checkout -b hotfix/correcao-urgente

# Fazer correção
git add .
git commit -m "fix: correção urgente"

# Merge de volta para main E develop
git checkout main
git merge hotfix/correcao-urgente
git push origin main

git checkout develop
git merge hotfix/correcao-urgente
git push origin develop

git checkout staging
git merge hotfix/correcao-urgente
git push origin staging

# Deploy em produção (seguir passo 4)
```

---

## 🗄️ Gerenciamento de Databases

### **Acessar Databases**

```bash
# Produção
docker compose -f docker-compose.vps.yml exec postgres \
  psql -U reiche_admin -d reiche_academy_prod

# Staging
docker compose -f docker-compose.vps.yml exec postgres \
  psql -U reiche_admin -d reiche_academy_staging
```

### **Copiar Dados Produção → Staging**

```bash
# Útil para testar com dados reais
docker compose -f docker-compose.vps.yml exec postgres \
  pg_dump -U reiche_admin reiche_academy_prod | \
  docker compose -f docker-compose.vps.yml exec -T postgres \
  psql -U reiche_admin reiche_academy_staging
```

### **Backups Automatizados**

```bash
# Criar script de backup
cat > /opt/reiche-academy/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/reiche-academy/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup Produção
docker compose -f docker-compose.vps.yml exec -T postgres \
  pg_dump -U reiche_admin reiche_academy_prod | \
  gzip > $BACKUP_DIR/prod_$TIMESTAMP.sql.gz

# Limpar backups antigos (manter 7 dias)
find $BACKUP_DIR -name "prod_*.sql.gz" -mtime +7 -delete

echo "Backup completed: prod_$TIMESTAMP.sql.gz"
EOF

chmod +x /opt/reiche-academy/backup.sh

# Agendar (diariamente às 3h)
crontab -e
# Adicionar:
0 3 * * * /opt/reiche-academy/backup.sh >> /opt/reiche-academy/backup.log 2>&1
```

---

## 📊 Monitoramento

### **Status dos Serviços**

```bash
# Listar todos
docker compose -f docker-compose.vps.yml ps

# Uso de recursos
docker stats

# Logs em tempo real
docker compose -f docker-compose.vps.yml logs -f

# Logs específicos
docker compose -f docker-compose.vps.yml logs -f backend-prod
docker compose -f docker-compose.vps.yml logs -f nginx
```

### **Health Checks**

```bash
# Script de monitoramento
cat > /opt/reiche-academy/healthcheck.sh << 'EOF'
#!/bin/bash
echo "=== Health Check ==="
echo "Produção:"
curl -s http://localhost/api/health || echo "FALHOU!"
echo ""
echo "Staging:"
curl -s -H "Host: staging.reicheacademy.cloud" http://localhost/api/health || echo "FALHOU!"
EOF

chmod +x /opt/reiche-academy/healthcheck.sh
```

---

## 💡 Vantagens VPS Único

✅ **Economia**: 1 servidor ao invés de 2  
✅ **Simplicidade**: Gerenciar apenas 1 máquina  
✅ **Compartilhamento**: Database e Redis compartilhados (menos overhead)  
✅ **Rápido**: Staging e produção no mesmo hardware  
✅ **Isolamento**: Containers isolados, databases separados  

---

## ⚠️ Desvantagens (mas gerenciáveis)

❌ **Recurso compartilhado**: Staging pode afetar produção se consumir muito  
   → *Solução*: Limites de CPU/RAM configurados!

❌ **Deploy simultâneo**: Rebuild pode ser lento  
   → *Solução*: Fazer staging primeiro, produção depois

❌ **Single point of failure**: Se VPS cair, ambos caem  
   → *Solução*: Backups frequentes, plano de contingência

---

## 🎯 Quando Separar Servidores?

Considere 2 VPS quando:
- ⚠️ Mais de 500 usuários simultâneos
- ⚠️ Staging consumindo muitos recursos (testes pesados)
- ⚠️ Requisitos de compliance/segurança exigem isolamento total
- ⚠️ VPS atual com CPU > 80% constantemente

**Para fase inicial**: 1 VPS é mais que suficiente! 🎯

---

## 🚨 Troubleshooting

### Containers não iniciam

```bash
# Ver erros
docker compose -f docker-compose.vps.yml logs

# Verificar recursos
free -h
df -h
```

### Porta já em uso

```bash
# Ver o que usa porta 80
netstat -tulpn | grep :80

# Matar processo se necessário
kill -9 PID
```

### Rebuild após mudanças

```bash
# Rebuild tudo
docker compose -f docker-compose.vps.yml down
docker compose -f docker-compose.vps.yml build --no-cache
docker compose -f docker-compose.vps.yml up -d
```

### Reset completo (CUIDADO!)

```bash
# APAGA TUDO! Fazer backup antes!
docker compose -f docker-compose.vps.yml down -v
rm -rf backups/*  # CUIDADO!
docker system prune -a --volumes
# Depois reconstruir do zero
```

---

## 📚 Referências

- [Hostinger VPS](https://www.hostinger.com.br/vps)
- [Docker Compose](https://docs.docker.com/compose/)
- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Let's Encrypt](https://letsencrypt.org/)

---

**Próximos passos**: Configure DNS e faça o primeiro deploy! 🚀
