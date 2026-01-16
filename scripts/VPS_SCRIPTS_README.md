# 🎯 VPS Scripts - Documentação

Este diretório contém scripts automatizados para gerenciar o VPS do Reiche Academy.

## 📋 Scripts Disponíveis

### 1. **deploy-vps.sh** - Deploy Automático
Realiza o deploy completo da aplicação no VPS.

**Uso:**
```bash
cd /opt/reiche-academy
bash scripts/deploy-vps.sh
```

**O que faz:**
- ✅ Atualiza o sistema Ubuntu
- ✅ Instala Docker e Docker Compose (se necessário)
- ✅ Clona/atualiza repositório do GitHub
- ✅ Configura variáveis de ambiente
- ✅ Faz build de todas as imagens
- ✅ Inicia todos os serviços
- ✅ Executa migrations do banco de dados
- ✅ Carrega dados iniciais (seeds)

**Tempo estimado:** 20-30 minutos (primeira execução)

---

### 2. **maintenance-vps.sh** - Manutenção Contínua
Script interativo para monitorar e manter a saúde do VPS.

**Uso Interativo (Menu):**
```bash
bash scripts/maintenance-vps.sh
```

**Uso Direto (Comandos):**
```bash
# Health check
bash scripts/maintenance-vps.sh health

# Fazer backup
bash scripts/maintenance-vps.sh backup

# Verificar logs com erros
bash scripts/maintenance-vps.sh logs

# Atualizar código e fazer redeploy
bash scripts/maintenance-vps.sh update

# Reiniciar serviços (com prompt interativo)
bash scripts/maintenance-vps.sh restart
```

**Menu Interativo:**
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

**Logs:** Todos os eventos são registrados em `/opt/reiche-academy/maintenance.log`

---

## 🚀 Fluxo Recomendado

### **Primeira Execução (Setup Completo)**
1. SSH no VPS
2. Executar `deploy-vps.sh`
3. Editar `.env` com senhas reais
4. Configurar SSL (Let's Encrypt)
5. Testar acesso

### **Uso Diário (Monitoramento)**
```bash
# Toda manhã, rodar health check
bash scripts/maintenance-vps.sh health

# Se houver atualizações no GitHub
bash scripts/maintenance-vps.sh update

# Backups automáticos (via cron)
0 3 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh backup >> maintenance.log 2>&1
```

### **Troubleshooting**
```bash
# Se algo não funcionar:
bash scripts/maintenance-vps.sh logs    # Ver erros
bash scripts/maintenance-vps.sh restart # Reiniciar serviços
bash scripts/maintenance-vps.sh health  # Verificar tudo novamente
```

---

## 🔄 Cron Jobs - Automação

### **Configurar Backup Automático (3h da manhã todos os dias)**
```bash
crontab -e
```

Adicione a linha:
```bash
0 3 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh backup >> maintenance.log 2>&1
```

### **Configurar Health Check Diário (9h da manhã)**
```bash
0 9 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh health >> maintenance.log 2>&1
```

### **Renovação Automática de SSL (Certbot)**
```bash
0 3 * * 1 certbot renew --quiet && docker compose -f docker-compose.vps.yml restart nginx
```

---

## 📊 Exemplo de Output

### Health Check Bem-Sucedido
```
[2026-01-14 09:30:00] ✅ Verificando status dos containers...
[2026-01-14 09:30:01] ✅ Todos os containers estão rodando
[2026-01-14 09:30:02] ✅ Disco OK: 35% de uso
[2026-01-14 09:30:03] ✅ RAM disponível: 4.2Gi
[2026-01-14 09:30:04] ✅ Backend respondendo corretamente
[2026-01-14 09:30:05] ✅ PostgreSQL respondendo
[2026-01-14 09:30:06] ✅ Redis respondendo
✅ Health check concluído - Tudo OK!
```

### Backup Realizado
```
[2026-01-14 03:00:00] Fazendo backup do banco PRODUÇÃO...
[2026-01-14 03:05:23] ✅ Backup PRODUÇÃO criado: prod_20260114_030000.sql.gz (Size: 425M)
[2026-01-14 03:06:15] ✅ Backup STAGING criado: staging_20260114_030000.sql.gz (Size: 120M)
[2026-01-14 03:06:20] Limpando backups antigos (manter últimos 7 dias)...
✅ Backup concluído com sucesso!
```

---

## 🆘 Troubleshooting

### **Script não executa (Permission Denied)**
```bash
chmod +x scripts/deploy-vps.sh
chmod +x scripts/maintenance-vps.sh
```

### **Docker command not found**
```bash
# Verificar se Docker está instalado
docker --version

# Se não estiver, instalar:
curl -fsSL https://get.docker.com | sh
```

### **Containers não iniciam**
```bash
# Ver erros detalhados
docker compose -f docker-compose.vps.yml logs

# Parar tudo e tentar novamente
docker compose -f docker-compose.vps.yml down
docker compose -f docker-compose.vps.yml up -d
```

### **Executar como root (se necessário)**
```bash
sudo bash scripts/deploy-vps.sh
sudo bash scripts/maintenance-vps.sh
```

---

## 📝 Informações Importantes

**Localização dos Arquivos:**
- Aplicação: `/opt/reiche-academy/`
- Backups: `/opt/reiche-academy/backups/`
- Logs: `/opt/reiche-academy/maintenance.log`
- Docker Compose: `/opt/reiche-academy/docker-compose.vps.yml`

**Variáveis de Ambiente:**
- Arquivo: `/opt/reiche-academy/.env`
- ⚠️ **NUNCA** fazer commit deste arquivo no Git!

**Dados Sensíveis:**
- JWT Secrets: Guardados no `.env`
- Senhas DB: Guardadas no `.env`
- Certificados SSL: `/opt/reiche-academy/nginx/ssl/`

---

## 🔗 Links Relacionados

- [docs/guides/VPS_SETUP_GUIDE.md](../docs/guides/VPS_SETUP_GUIDE.md) - Setup completo
- [docs/guides/DEPLOY_VPS_QUICKSTART.md](../docs/guides/DEPLOY_VPS_QUICKSTART.md) - Quick start
- [docs/guides/DOCKER_GUIDE.md](../docs/guides/DOCKER_GUIDE.md) - Docker local
- [docker-compose.vps.yml](../docker-compose.vps.yml) - Configuração

---

**Versão**: 1.0  
**Data**: Janeiro 2026  
**Status**: ✅ Pronto para uso

