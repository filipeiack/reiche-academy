# 🚀 Quick Start Deploy - VPS

## 📋 Dados do VPS

```
🌐 IP:       76.13.66.10
👤 Usuário:  root
🔑 Senha:    Reiche@c@d3m1
🐧 SO:       Ubuntu
🐳 Docker:   Já instalado
```

---

## ⚡ Deploy em 3 Passos

### **Passo 1: Conectar ao VPS**

```bash
ssh root@76.13.66.10
# Senha: Reiche@c@d3m1
```

### **Passo 2: Executar Deploy Automático**

```bash
# Clonar repositório
mkdir -p /opt/reiche-academy && cd /opt/reiche-academy
git clone https://github.com/filipeiack/reiche-academy.git .

# Executar script de deploy
bash scripts/deploy-vps.sh
```

O script vai:
- ✅ Atualizar o sistema
- ✅ Verificar Docker/Docker Compose
- ✅ Clonar/atualizar repositório
- ✅ Configurar variáveis de ambiente
- ✅ Fazer build das imagens
- ✅ Iniciar todos os serviços
- ✅ Executar migrations e seeds

### **Passo 3: Configurar DNS**

No painel do seu registrador, criar 2 registros A:

```
app.reicheacademy.com.br      → 76.13.66.10
staging.reicheacademy.com.br  → 76.13.66.10
```

---

## 🔐 Configuração de Segurança

Após o deploy automático, você precisará:

### **1. Editar Variáveis de Ambiente**

```bash
nano /opt/reiche-academy/.env
```

**Altere obrigatoriamente:**
- `POSTGRES_PASSWORD` - Senha do banco de dados
- `REDIS_PASSWORD` - Senha do Redis
- `JWT_SECRET_PROD` - Token secreto produção
- `JWT_REFRESH_SECRET_PROD` - Refresh token produção
- `JWT_SECRET_STAGING` - Token secreto staging
- `JWT_REFRESH_SECRET_STAGING` - Refresh token staging

**Gerar secrets seguros:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### **2. Configurar SSL (Let's Encrypt)**

```bash
# Instalar Certbot
apt install certbot -y

# Parar Nginx temporariamente
docker compose -f docker-compose.vps.yml stop nginx

# Gerar certificado Produção
certbot certonly --standalone -d app.reicheacademy.com.br

# Gerar certificado Staging
certbot certonly --standalone -d staging.reicheacademy.com.br

# Copiar certificados
mkdir -p /opt/reiche-academy/nginx/ssl

cp /etc/letsencrypt/live/app.reicheacademy.com.br/fullchain.pem \
   /opt/reiche-academy/nginx/ssl/app.reicheacademy.com.br.crt

cp /etc/letsencrypt/live/app.reicheacademy.com.br/privkey.pem \
   /opt/reiche-academy/nginx/ssl/app.reicheacademy.com.br.key

cp /etc/letsencrypt/live/staging.reicheacademy.com.br/fullchain.pem \
   /opt/reiche-academy/nginx/ssl/staging.reicheacademy.com.br.crt

cp /etc/letsencrypt/live/staging.reicheacademy.com.br/privkey.pem \
   /opt/reiche-academy/nginx/ssl/staging.reicheacademy.com.br.key

# Editar nginx/nginx.conf e descomentar blocos HTTPS
nano /opt/reiche-academy/nginx/nginx.conf

# Reiniciar Nginx
docker compose -f docker-compose.vps.yml up -d nginx
```

---

## 🏥 Health Checks

```bash
# Ver status dos containers
docker compose -f docker-compose.vps.yml ps

# Ver logs em tempo real
docker compose -f docker-compose.vps.yml logs -f

# Testar conectividade
curl http://76.13.66.10/api/health  # Produção
curl -H "Host: staging.reicheacademy.com.br" http://76.13.66.10/api/health  # Staging
```

---

## 🔄 Fluxo de Deploy Contínuo

Depois que o VPS está rodando:

```bash
# 1. Fazer código localmente
# ... desenvolvendo ...

# 2. Fazer push para GitHub
git push origin main

# 3. No VPS, atualizar e deploy
ssh root@76.13.66.10
cd /opt/reiche-academy
git pull origin main

docker compose -f docker-compose.vps.yml build backend-prod frontend-prod
docker compose -f docker-compose.vps.yml up -d --no-deps backend-prod frontend-prod

docker compose -f docker-compose.vps.yml exec backend-prod npm run migration:prod
```

---

## 📊 Monitoramento

```bash
# Uso de recursos em tempo real
docker stats

# Logs específicos
docker compose -f docker-compose.vps.yml logs -f backend-prod
docker compose -f docker-compose.vps.yml logs -f nginx

# Conectar ao banco de dados
docker compose -f docker-compose.vps.yml exec postgres \
  psql -U reiche_admin -d reiche_academy_prod

# Fazer backup
docker compose -f docker-compose.vps.yml exec -T postgres \
  pg_dump -U reiche_admin reiche_academy_prod | gzip > /opt/reiche-academy/backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

---

## 🆘 Troubleshooting

### **Containers não iniciam**
```bash
docker compose -f docker-compose.vps.yml logs
docker compose -f docker-compose.vps.yml down -v
docker compose -f docker-compose.vps.yml up -d
```

### **Porta 80 em uso**
```bash
netstat -tulpn | grep :80
kill -9 <PID>
```

### **Resetar tudo**
```bash
docker compose -f docker-compose.vps.yml down -v
docker system prune -a --volumes
# Depois executar deploy novamente
```

---

## ✅ Checklist Pós-Deploy

- [ ] DNS configurado (verifique com `nslookup app.reicheacademy.com.br`)
- [ ] Todos os containers rodando (`docker compose ps`)
- [ ] Health check passando (`curl /api/health`)
- [ ] SSL instalado e funcionando
- [ ] Backup configurado
- [ ] Logs verificados sem erros
- [ ] Dados de produção verificados
- [ ] Staging funcionando corretamente

---

## 📞 Suporte

Se algo não funcionar:

1. Verifique os logs: `docker compose logs -f`
2. Consulte [VPS_SETUP_GUIDE.md](VPS_SETUP_GUIDE.md) para detalhes completos
3. Verifique [DOCKER_GUIDE.md](DOCKER_GUIDE.md) para comandos Docker

---

**Versão**: 1.0  
**Data**: Janeiro 2026  
**VPS**: 76.13.66.10 (root)
