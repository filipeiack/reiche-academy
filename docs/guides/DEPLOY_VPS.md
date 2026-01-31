# Guia de Deploy no VPS

## 🚀 Deploy Rápido

### Staging
```bash
cd /opt/reiche-academy
git pull origin staging
bash scripts/deploy-vps.sh staging
```

### Produção
```bash
cd /opt/reiche-academy
git pull origin main
bash scripts/deploy-vps.sh prod
```

---

## 📋 Comandos Úteis

### Ver logs
```bash
# Todos os serviços
docker compose -f docker-compose.vps.yml logs -f

# Apenas staging
docker compose -f docker-compose.vps.yml logs -f backend-staging

# Apenas produção
docker compose -f docker-compose.vps.yml logs -f backend-prod
```

### Status dos containers
```bash
docker compose -f docker-compose.vps.yml ps
```

### Rodar migrations manualmente
```bash
# Staging
docker compose -f docker-compose.vps.yml exec -T backend-staging npm run migration:prod

# Produção
docker compose -f docker-compose.vps.yml exec -T backend-prod npm run migration:prod
```

### Rodar seed manualmente
```bash
# Staging
docker compose -f docker-compose.vps.yml exec -T backend-staging npm run seed

# Produção
docker compose -f docker-compose.vps.yml exec -T backend-prod npm run seed
```

### Manutenção por ambiente
```bash
# Health check (staging)
bash scripts/maintenance-vps.sh health staging

# Backup (produção)
bash scripts/maintenance-vps.sh backup prod

# Logs (todos)
bash scripts/maintenance-vps.sh logs all

# Update (staging)
bash scripts/maintenance-vps.sh update staging
```

### Reiniciar serviços
```bash
# Apenas staging
docker compose -f docker-compose.vps.yml restart backend-staging

# Apenas produção
docker compose -f docker-compose.vps.yml restart backend-prod

# Todos
docker compose -f docker-compose.vps.yml restart
```

### Acessar shell do container
```bash
# Staging
docker compose -f docker-compose.vps.yml exec backend-staging sh

# Produção
docker compose -f docker-compose.vps.yml exec backend-prod sh
```

---

## 🔧 Troubleshooting

### Container unhealthy
```bash
# Ver logs detalhados
docker compose -f docker-compose.vps.yml logs backend-staging --tail=100

# Verificar healthcheck
docker inspect reiche-backend-staging | grep -A 10 Health
```

### Rebuild forçado
```bash
# Staging
docker compose -f docker-compose.vps.yml build --no-cache backend-staging
cp nginx/nginx.staging.conf nginx/nginx.conf
docker compose -f docker-compose.vps.yml up -d backend-staging

# Produção
docker compose -f docker-compose.vps.yml build --no-cache backend-prod
cp nginx/nginx.prod.conf nginx/nginx.conf
docker compose -f docker-compose.vps.yml up -d backend-prod
```

### Limpar tudo e recomeçar
```bash
docker compose -f docker-compose.vps.yml down
docker system prune -a --volumes -f
bash scripts/deploy-vps.sh staging
```

---

## ⚙️ Variáveis de Ambiente

Arquivo: `/opt/reiche-academy/.env`

**Obrigatórias:**
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET_PROD`
- `JWT_REFRESH_SECRET_PROD`
- `JWT_SECRET_STAGING`
- `JWT_REFRESH_SECRET_STAGING`
- `CORS_ORIGIN_PROD`
- `CORS_ORIGIN_STAGING`

Gerar secrets JWT:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📊 Monitoramento

### Recursos
```bash
docker stats
```

### Disco
```bash
df -h
docker system df
```

### Processos PostgreSQL
```bash
docker compose -f docker-compose.vps.yml exec postgres psql -U reiche -c "SELECT * FROM pg_stat_activity;"
```

---

## 🔐 Backup

### Backup manual do banco
```bash
# Staging
docker compose -f docker-compose.vps.yml exec postgres pg_dump -U reiche -d reiche_academy_staging > backup-staging-$(date +%Y%m%d).sql

# Produção
docker compose -f docker-compose.vps.yml exec postgres pg_dump -U reiche -d reiche_academy_prod > backup-prod-$(date +%Y%m%d).sql
```

### Restore
```bash
docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche -d reiche_academy_staging < backup.sql
```
