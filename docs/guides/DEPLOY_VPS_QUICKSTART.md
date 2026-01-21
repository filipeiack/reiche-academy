# 🚀 Deploy VPS - Início Rápido

> **📖 Guia completo:** [VPS_SETUP_GUIDE.md](VPS_SETUP_GUIDE.md)

## ⚡ 3 Passos para Deploy

### **1. Conectar**
```bash
ssh root@76.13.66.10
# Senha: Reiche@c@d3m1
```

### **2. Deploy Automático**
```bash
mkdir -p /opt/reiche-academy && cd /opt/reiche-academy
git clone https://github.com/filipeiack/reiche-academy.git .
bash scripts/deploy-vps.sh
```

### **3. Configurar DNS**
```
app.reicheacademy.com.br      → 76.13.66.10
staging.reicheacademy.com.br  → 76.13.66.10
```

---

## 🔐 Pós-Deploy (Obrigatório)

### Gerar Senhas Seguras
```bash
# JWT Secrets (execute 4x)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Editar `.env`
```bash
nano /opt/reiche-academy/.env
```

Substitua:
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `JWT_SECRET_PROD`
- `JWT_REFRESH_SECRET_PROD`
- `JWT_SECRET_STAGING`
- `JWT_REFRESH_SECRET_STAGING`

### Configurar SSL
```bash
apt install certbot -y
docker compose -f docker-compose.vps.yml stop nginx

certbot certonly --standalone -d app.reicheacademy.com.br
certbot certonly --standalone -d staging.reicheacademy.com.br

# Copiar certificados (ver guia completo)
# Descomentar blocos HTTPS no nginx/nginx.conf
docker compose -f docker-compose.vps.yml up -d nginx
```

---

## 🔄 Manutenção

```bash
# Health check
bash scripts/maintenance-vps.sh health

# Backup
bash scripts/maintenance-vps.sh backup

# Atualizar código
bash scripts/maintenance-vps.sh update
```

---

## 📚 Documentação Completa

- **Setup detalhado**: [VPS_SETUP_GUIDE.md](VPS_SETUP_GUIDE.md)
- **Docker local**: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
- **Windows dev**: [QUICK_START_WINDOWS.md](QUICK_START_WINDOWS.md)

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
