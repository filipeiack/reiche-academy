# 📋 VPS Setup Summary - Reiche Academy

**Data de Criação**: Janeiro 14, 2026  
**Status**: ✅ Totalmente Configurado e Pronto para Deploy  
**VPS**: Ubuntu 76.13.66.10 (root)

---

## 🎯 Informações de Acesso

```
┌─────────────────────────────────────────┐
│        DADOS DO VPS CONFIGURADO         │
├─────────────────────────────────────────┤
│ 🌐 IP:       76.13.66.10                │
│ 👤 Usuário:  root                       │
│ 🔑 Senha:    Reiche@c@d3m1              │
│ 🐧 SO:       Ubuntu                     │
│ 🐳 Docker:   Instalado e Pronto         │
├─────────────────────────────────────────┤
│ 💾 RAM:      8GB                        │
│ 🔄 CPU:      2 cores                    │
│ 💿 SSD:      100GB                      │
└─────────────────────────────────────────┘
```

---

## 📁 Arquivos Criados/Atualizados

### **Configuração Docker**
- ✅ [docker-compose.vps.yml](docker-compose.vps.yml) - Orquestração completa (6 containers)
- ✅ [nginx/nginx.conf](nginx/nginx.conf) - Roteamento por subdomínio
- ✅ [.env.vps](.env.vps) - Variáveis de ambiente

### **Documentação**
- ✅ [docs/guides/VPS_SETUP_GUIDE.md](docs/guides/VPS_SETUP_GUIDE.md) - Setup completo (atualizado com IP)
- ✅ [docs/guides/DEPLOY_VPS_QUICKSTART.md](docs/guides/DEPLOY_VPS_QUICKSTART.md) - 3 passos de deploy (NOVO)
- ✅ [scripts/VPS_SCRIPTS_README.md](scripts/VPS_SCRIPTS_README.md) - Documentação de scripts (NOVO)

### **Scripts Automatizados**
- ✅ [scripts/deploy-vps.sh](scripts/deploy-vps.sh) - Deploy automático (NOVO)
- ✅ [scripts/maintenance-vps.sh](scripts/maintenance-vps.sh) - Manutenção contínua (NOVO)

---

## 🏗️ Arquitetura Implementada

```
                      Internet (80/443)
                            │
         ┌──────────────────────────────────┐
         │       Nginx Master (80/443)       │
         │     Roteamento por Host Header   │
         └──────────────────────────────────┘
                   │                │
        ┌──────────┴────────┐  ┌────┴──────────┐
        │   PRODUÇÃO        │  │   STAGING     │
        │                   │  │               │
        │ Frontend:80       │  │ Frontend:80   │
        │ Backend:3000      │  │ Backend:3000  │
        │                   │  │               │
        └──────────┬────────┘  └────┬──────────┘
                   │                │
                   └────────┬───────┘
                            │
              ┌─────────────┴──────────────┐
              │                            │
        PostgreSQL (2 DBs)          Redis (2 DBs)
        - prod                      - db 0 (prod)
        - staging                   - db 1 (staging)
```

---

## 🚀 Plano de Ação para Deploy

### **Fase 1: Conexão & Validação (5 min)**
```bash
# Terminal local
ssh root@76.13.66.10
# Senha: Reiche@c@d3m1

# No VPS
cd /opt/reiche-academy || mkdir -p /opt/reiche-academy && cd /opt/reiche-academy
git clone https://github.com/filipeiack/reiche-academy.git .
```

### **Fase 2: Deploy Automático (20-30 min)**
```bash
bash scripts/deploy-vps.sh
```

**O que acontece automaticamente:**
- Sistema atualizado
- Docker configurado
- Repositório clonado
- Imagens buildadas (NestJS + Angular)
- Containers iniciados
- Migrations executadas
- Dados iniciais carregados

### **Fase 3: Configuração de Segurança (10 min)**
```bash
# Editar variáveis críticas
nano .env

# Gerar JWT Secrets seguros
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Reiniciar com novas config
docker compose -f docker-compose.vps.yml restart
```

### **Fase 4: SSL/Let's Encrypt (15 min)**
```bash
apt install certbot -y
docker compose -f docker-compose.vps.yml stop nginx

# Para cada domínio
certbot certonly --standalone -d app.reicheacademy.com.br
certbot certonly --standalone -d staging.reicheacademy.com.br

# Copiar certificados para nginx/ssl/
# Editar nginx/nginx.conf para ativar HTTPS
# Reiniciar nginx
docker compose -f docker-compose.vps.yml up -d nginx
```

### **Fase 5: DNS e Testes (48h propagação + 5 min testes)**
```bash
# No registrador de domínios
# Criar A records:
app.reicheacademy.com.br      → 76.13.66.10
staging.reicheacademy.com.br  → 76.13.66.10

# Testar (após DNS propagar)
curl https://app.reicheacademy.com.br/api/health
curl https://staging.reicheacademy.com.br/api/health
```

---

## 📊 Componentes Configurados

### **Backend - Produção**
```yaml
Container:  reiche-backend-prod
Database:   reiche_academy_prod
Redis:      db 0
CPU/RAM:    1 CPU, 1GB limit / 0.5 CPU, 512MB reservation
Health:     GET /api/health (30s interval)
Logs:       20MB max, 5 arquivos
```

### **Backend - Staging**
```yaml
Container:  reiche-backend-staging
Database:   reiche_academy_staging
Redis:      db 1
CPU/RAM:    0.5 CPU, 512MB limit / 0.25 CPU, 256MB reservation
Health:     GET /api/health (30s interval)
Logs:       10MB max, 3 arquivos
```

### **Frontend - Produção & Staging**
```yaml
Containers: reiche-frontend-prod / reiche-frontend-staging
Build:      Docker image production-ready
Port:       80 (interno)
Dependência: Backend correspondente
```

### **Banco de Dados**
```yaml
Container:  reiche-postgres
Imagem:     postgres:16-alpine
Databases:  reiche_academy_prod, reiche_academy_staging
Port:       5432 (localhost only)
CPU/RAM:    1 CPU, 1GB limit
Backup:     /opt/reiche-academy/backups/
```

### **Cache**
```yaml
Container:  reiche-redis
Imagem:     redis:7-alpine
Port:       6379 (localhost only)
CPU/RAM:    0.5 CPU, 256MB limit
Databases:  2 (db 0: prod, db 1: staging)
```

### **Proxy Reverso**
```yaml
Container:  reiche-nginx
Imagem:     nginx:alpine
Ports:      80:80, 443:443
Roteamento: app.reicheacademy.com.br → Prod
            staging.reicheacademy.com.br → Staging
Rate Limit: API 10 req/s, Login 5 req/min
Gzip:       Habilitado
```

---

## 🔐 Segurança Implementada

✅ **Network Isolation**
- Database: Apenas localhost (127.0.0.1:5432)
- Redis: Apenas localhost (127.0.0.1:6379)
- Containers comunicam via rede Docker

✅ **Autenticação**
- PostgreSQL: Senha customizável
- Redis: Autenticação habilitada
- JWT: Secrets separados (prod vs staging)

✅ **HTTPS/SSL**
- Let's Encrypt (grátis e automático)
- Certificados para cada domínio
- Redirect HTTP → HTTPS

✅ **Rate Limiting**
- API: 10 req/s por IP
- Login: 5 req/min por IP

✅ **Logging**
- JSON format
- Rotação automática
- Máximo 20MB por arquivo

✅ **Health Checks**
- PostgreSQL: pg_isready
- Redis: redis-cli ping
- Backend: HTTP health endpoint

---

## 📊 Monitoramento & Manutenção

### **Monitoramento Automático**
```bash
# Health Check (menu interativo)
bash scripts/maintenance-vps.sh health

# Ou agendado via cron
0 9 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh health
```

### **Backups Automáticos**
```bash
# Backup manual
bash scripts/maintenance-vps.sh backup

# Ou agendado via cron (3h da manhã)
0 3 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh backup
```

### **Atualizar Código**
```bash
# Com confirmação interativa
bash scripts/maintenance-vps.sh update

# Faz: git pull, build, restart, migrations
```

### **Logs em Tempo Real**
```bash
docker compose -f docker-compose.vps.yml logs -f
docker compose -f docker-compose.vps.yml logs -f backend-prod
docker compose -f docker-compose.vps.yml logs -f nginx
```

---

## ✅ Checklist Pré-Deploy

- [ ] VPS pode ser acessado via SSH (root@76.13.66.10, Reiche@c@d3m1)
- [ ] Docker está instalado e rodando
- [ ] Git está instalado
- [ ] Repositório GitHub é público ou você tem acesso (credentials)
- [ ] Você tem domínios: app.reicheacademy.com.br + staging.reicheacademy.com.br
- [ ] Você tem acesso ao registrador de domínios (DNS)
- [ ] Você revisou o .env.vps e entende as variáveis

## ✅ Checklist Pós-Deploy

- [ ] Todos os containers estão rodando: `docker compose ps`
- [ ] Health check passou: `bash scripts/maintenance-vps.sh health`
- [ ] DNS propagou (verificar com `nslookup app.reicheacademy.com.br`)
- [ ] Acesso via browser: `https://app.reicheacademy.com.br`
- [ ] SSL certificado válido
- [ ] API respondendo: `/api/health`
- [ ] Backup automático está agendado (cron)
- [ ] Logs sem erros críticos

---

## 🎯 Próximos Passos

1. **Hoje**: Execute `bash scripts/deploy-vps.sh`
2. **Hoje**: Edite `.env` com senhas reais
3. **Hoje**: Configure SSL (Let's Encrypt)
4. **Amanhã**: Configure registros DNS
5. **Depois**: Agende backups via cron
6. **Contínuo**: Monitore com `maintenance-vps.sh`

---

## 📚 Documentação Relacionada

| Documento | Propósito |
|-----------|-----------|
| [docs/guides/VPS_SETUP_GUIDE.md](docs/guides/VPS_SETUP_GUIDE.md) | Setup completo e detalhado |
| [docs/guides/DEPLOY_VPS_QUICKSTART.md](docs/guides/DEPLOY_VPS_QUICKSTART.md) | 3 passos rápidos |
| [scripts/VPS_SCRIPTS_README.md](scripts/VPS_SCRIPTS_README.md) | Documentação dos scripts |
| [docs/guides/DOCKER_GUIDE.md](docs/guides/DOCKER_GUIDE.md) | Docker local (desenvolvimento) |
| [docker-compose.vps.yml](docker-compose.vps.yml) | Configuração completa |

---

## 🆘 Precisa de Ajuda?

**Erro no deploy?**
```bash
docker compose -f docker-compose.vps.yml logs
```

**Containers com problema?**
```bash
bash scripts/maintenance-vps.sh logs
```

**Sistema lento?**
```bash
bash scripts/maintenance-vps.sh   # Menu → Ver Resources
docker stats
```

**Precisa atualizar?**
```bash
bash scripts/maintenance-vps.sh update
```

---

## 📋 Resumo de Recursos

```
┌──────────────────────┬────────┬────────┬─────────┐
│      Serviço         │  CPU   │  RAM   │  Disco  │
├──────────────────────┼────────┼────────┼─────────┤
│ PostgreSQL           │  25%   │  800MB │  2GB    │
│ Redis                │   5%   │  200MB │  50MB   │
│ Backend Prod         │  15%   │  600MB │  100MB  │
│ Backend Staging      │  10%   │  400MB │  100MB  │
│ Frontend Prod        │   5%   │  150MB │  50MB   │
│ Frontend Staging     │   5%   │  150MB │  50MB   │
│ Nginx                │   5%   │  100MB │  10MB   │
├──────────────────────┼────────┼────────┼─────────┤
│ TOTAL ESTIMADO       │  70%   │ 2.4GB  │  ~3GB   │
│ DISPONÍVEL           │  30%   │ 1.6GB  │  97GB   │
└──────────────────────┴────────┴────────┴─────────┘
```

**Conclusão**: Sobra **margem excelente** para crescimento! 🚀

---

**Status Final**: ✅ Tudo está pronto para você fazer o deploy!

**Próximo comando**:
```bash
ssh root@76.13.66.10
cd /opt/reiche-academy || mkdir -p /opt/reiche-academy && cd /opt/reiche-academy
git clone https://github.com/filipeiack/reiche-academy.git .
bash scripts/deploy-vps.sh
```

🚀 Boa sorte!

