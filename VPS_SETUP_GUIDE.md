# 🏢 Guia VPS Único - Staging + Produção

Este guia explica como rodar **staging e produção no mesmo VPS** (Hostinger VPS KVM 2).

## 📊 Recursos do VPS KVM 2 (Hostinger)

```
CPU:  2 cores
RAM:  4GB
SSD:  100GB
Banda: Ilimitada

Custo: ~R$ 30-40/mês
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
| `app.reicheacademy.com.br` | Frontend Produção → Backend Produção | Usuários finais |
| `staging.reicheacademy.com.br` | Frontend Staging → Backend Staging | Testes |

---

## 📦 Componentes Criados

1. **[docker-compose.vps.yml](docker-compose.vps.yml)** - Orquestração completa (staging + prod)
2. **[nginx/nginx.vps.conf](nginx/nginx.vps.conf)** - Roteamento por subdomínio
3. **[scripts/init-databases.sh](scripts/init-databases.sh)** - Cria 2 databases automaticamente
4. **[.env.vps](.env.vps)** - Variáveis de ambiente para o VPS

---

## 🚀 Deploy Passo a Passo

### **1. Configurar DNS (na Hostinger)**

Criar 2 registros A:

```
app.reicheacademy.com.br      → IP_DO_SEU_VPS
staging.reicheacademy.com.br  → IP_DO_SEU_VPS
```

**Como encontrar IP do VPS:**
- Painel Hostinger → VPS → Detalhes → IP Address

### **2. Conectar ao VPS via SSH**

```bash
# SSH fornecido pela Hostinger
ssh root@SEU_IP_VPS

# Ou se tiver usuário customizado
ssh seu_usuario@SEU_IP_VPS
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
# Clonar repositório
git clone https://github.com/filipeiack/reiche-academy.git .

# Copiar e configurar ambiente
cp .env.vps .env
nano .env

# IMPORTANTE: Editar .env e trocar TODAS as senhas!
# Gerar JWT secrets com:
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

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

### **6. Configurar Databases**

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

### **7. Configurar SSL (Let's Encrypt - Grátis)**

```bash
# Instalar Certbot
apt install certbot -y

# Parar Nginx temporariamente
docker compose -f docker-compose.vps.yml stop nginx

# Gerar certificados (fazer 2x, um para cada domínio)
certbot certonly --standalone -d app.reicheacademy.com.br
certbot certonly --standalone -d staging.reicheacademy.com.br

# Copiar certificados
mkdir -p nginx/ssl

# Produção
cp /etc/letsencrypt/live/app.reicheacademy.com.br/fullchain.pem \
   nginx/ssl/app.reicheacademy.com.br.crt
cp /etc/letsencrypt/live/app.reicheacademy.com.br/privkey.pem \
   nginx/ssl/app.reicheacademy.com.br.key

# Staging
cp /etc/letsencrypt/live/staging.reicheacademy.com.br/fullchain.pem \
   nginx/ssl/staging.reicheacademy.com.br.crt
cp /etc/letsencrypt/live/staging.reicheacademy.com.br/privkey.pem \
   nginx/ssl/staging.reicheacademy.com.br.key

# Editar nginx.vps.conf e descomentar seções HTTPS
nano nginx/nginx.vps.conf

# Reiniciar Nginx
docker compose -f docker-compose.vps.yml start nginx
```

### **8. Testar Acesso**

```bash
# Produção
curl http://app.reicheacademy.com.br
curl http://app.reicheacademy.com.br/api/health

# Staging
curl http://staging.reicheacademy.com.br
curl http://staging.reicheacademy.com.br/api/health
```

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

### **Desenvolvimento → Staging → Produção**

```bash
# 1. Desenvolvimento local
# ... fazer alterações ...
git add .
git commit -m "feat: nova funcionalidade"
git push origin main

# 2. Deploy Staging (no VPS)
ssh usuario@VPS
cd /opt/reiche-academy
git pull origin main

# Rebuild apenas staging
docker compose -f docker-compose.vps.yml build backend-staging frontend-staging
docker compose -f docker-compose.vps.yml up -d --no-deps backend-staging frontend-staging

# Migrations staging
docker compose -f docker-compose.vps.yml exec backend-staging npm run migration:prod

# 3. Testar em staging.reicheacademy.com.br
# ... QA, testes manuais ...

# 4. Deploy Produção (se tudo OK)
# Backup primeiro!
docker compose -f docker-compose.vps.yml exec postgres \
  pg_dump -U reiche_admin reiche_academy_prod | gzip > backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Rebuild produção
docker compose -f docker-compose.vps.yml build backend-prod frontend-prod
docker compose -f docker-compose.vps.yml up -d --no-deps backend-prod frontend-prod

# Migrations produção
docker compose -f docker-compose.vps.yml exec backend-prod npm run migration:prod
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
curl -s -H "Host: staging.reicheacademy.com.br" http://localhost/api/health || echo "FALHOU!"
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
