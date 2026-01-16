#!/bin/bash

# VPS CHEAT SHEET - Comandos Mais Usados
# =========================================
# Colar no terminal do VPS para executar rapidamente

# =========================================
# SETUP INICIAL (primeira vez)
# =========================================

# Conectar ao VPS
ssh root@76.13.66.10
# Senha: Reiche@c@d3m1

# Clonar repositório
mkdir -p /opt/reiche-academy && cd /opt/reiche-academy
git clone https://github.com/filipeiack/reiche-academy.git .

# Deploy automático
bash scripts/deploy-vps.sh

# Editar variáveis de ambiente (IMPORTANTE!)
nano .env

# =========================================
# MONITORAMENTO DIÁRIO
# =========================================

# Health check rápido
bash scripts/maintenance-vps.sh health

# Ver status dos containers
docker compose -f docker-compose.vps.yml ps

# Ver logs em tempo real
docker compose -f docker-compose.vps.yml logs -f

# Ver logs apenas do backend
docker compose -f docker-compose.vps.yml logs -f backend-prod

# Ver uso de recursos
docker stats --no-stream

# =========================================
# MANUTENÇÃO
# =========================================

# Fazer backup do banco
bash scripts/maintenance-vps.sh backup

# Atualizar código do GitHub
bash scripts/maintenance-vps.sh update

# Reiniciar um serviço específico
docker compose -f docker-compose.vps.yml restart backend-prod
docker compose -f docker-compose.vps.yml restart nginx

# Reiniciar tudo
docker compose -f docker-compose.vps.yml restart

# =========================================
# BANCO DE DADOS
# =========================================

# Conectar ao PostgreSQL produção
docker compose -f docker-compose.vps.yml exec postgres \
  psql -U reiche_admin -d reiche_academy_prod

# Conectar ao PostgreSQL staging
docker compose -f docker-compose.vps.yml exec postgres \
  psql -U reiche_admin -d reiche_academy_staging

# Fazer backup manual
docker compose -f docker-compose.vps.yml exec -T postgres \
  pg_dump -U reiche_admin reiche_academy_prod | gzip > \
  /opt/reiche-academy/backups/backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Ver lista de backups
ls -lh /opt/reiche-academy/backups/

# =========================================
# TROUBLESHOOTING
# =========================================

# Ver todos os logs (últimas 100 linhas)
docker compose -f docker-compose.vps.yml logs --tail=100

# Ver logs com erro
docker compose -f docker-compose.vps.yml logs | grep -i error

# Parar todos os serviços
docker compose -f docker-compose.vps.yml stop

# Parar e remover containers (CUIDADO!)
docker compose -f docker-compose.vps.yml down

# Parar e remover TUDO incluindo volumes (APAGA BANCO! BACKUP ANTES!)
docker compose -f docker-compose.vps.yml down -v

# Reiniciar tudo do zero
docker compose -f docker-compose.vps.yml down -v
docker compose -f docker-compose.vps.yml build --no-cache
docker compose -f docker-compose.vps.yml up -d

# =========================================
# VERIFICAÇÕES RÁPIDAS
# =========================================

# Verificar se porta 80 está em uso
netstat -tulpn | grep :80

# Verificar espaço em disco
df -h

# Verificar RAM disponível
free -h

# Verificar CPU
top -bn1 | head -20

# =========================================
# SSL / CERTIFICADOS
# =========================================

# Instalar Certbot
apt install certbot -y

# Gerar certificado (para um domínio)
certbot certonly --standalone -d app.reicheacademy.com.br

# Ver certificados instalados
certbot certificates

# Renovar certificados (teste)
certbot renew --dry-run

# =========================================
# GIT
# =========================================

# Ver status do repositório
git status

# Ver commits recentes
git log --oneline -10

# Atualizar código (pull)
git fetch origin main
git reset --hard origin/main

# Ver branch atual
git branch -a

# =========================================
# DOCKER AVANÇADO
# =========================================

# Executar comando dentro de um container
docker compose -f docker-compose.vps.yml exec backend-prod npm run migration:prod

# Executar sem solicitar TTY (background)
docker compose -f docker-compose.vps.yml exec -T backend-prod npm run seed

# Ver recursos de um container específico
docker stats reiche-backend-prod

# Inspecionar container
docker inspect reiche-backend-prod

# =========================================
# LIMPEZA / HOUSEKEEPING
# =========================================

# Remover imagens não utilizadas
docker image prune -a

# Remover volumes não utilizados
docker volume prune

# Remover tudo (CUIDADO!)
docker system prune -a --volumes

# Limpar logs antigos (manter últimos 7 dias)
find /opt/reiche-academy/backups -name "*.sql.gz" -mtime +7 -delete

# =========================================
# TESTES
# =========================================

# Testar health check (produção)
curl http://localhost/api/health

# Testar com host header específico (staging)
curl -H "Host: staging.reicheacademy.com.br" http://localhost/api/health

# Testar com DNS já configurado
curl https://app.reicheacademy.com.br/api/health
curl https://staging.reicheacademy.com.br/api/health

# Testar endpoint da API
curl https://app.reicheacademy.com.br/api/users

# =========================================
# MENU INTERATIVO
# =========================================

# Abrir menu de manutenção (recomendado para iniciantes)
bash scripts/maintenance-vps.sh

# =========================================
# VARIÁVEIS ÚTEIS
# =========================================

# Caminho da aplicação
/opt/reiche-academy

# Arquivo de configuração
/opt/reiche-academy/.env

# Arquivo de compose
/opt/reiche-academy/docker-compose.vps.yml

# Diretório de backups
/opt/reiche-academy/backups/

# Log de manutenção
/opt/reiche-academy/maintenance.log

# Configuração Nginx
/opt/reiche-academy/nginx/nginx.conf

# Certificados SSL
/opt/reiche-academy/nginx/ssl/

# =========================================
# EMERGÊNCIA
# =========================================

# Se tudo quebrou e você quer resetar:
cd /opt/reiche-academy

# Fazer backup primeiro!
docker compose -f docker-compose.vps.yml exec -T postgres \
  pg_dump -U reiche_admin reiche_academy_prod | \
  gzip > backups/EMERGENCY_BACKUP_$(date +%Y%m%d_%H%M%S).sql.gz

# Parar tudo
docker compose -f docker-compose.vps.yml down -v

# Limpar tudo
docker system prune -a --volumes

# Fazer deploy novamente
git pull origin main
bash scripts/deploy-vps.sh

# =========================================
# DICAS PRÁTICAS
# =========================================

# Para rodar comando e não ficar esperando:
docker compose -f docker-compose.vps.yml exec -T backend-prod npm run migration:prod &

# Para executar múltiplos comandos:
docker compose -f docker-compose.vps.yml exec -T backend-prod bash -c "npm run migration:prod && npm run seed"

# Para ver logs de um período específico:
docker compose -f docker-compose.vps.yml logs --since 2h backend-prod

# Para seguir logs com grep (apenas erros):
docker compose -f docker-compose.vps.yml logs -f | grep -i error

# =========================================
# GERADOR DE SECRETS
# =========================================

# Gerar JWT Secret seguro (copie e cole no .env)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# Ou sem Node.js:
openssl rand -hex 32

# =========================================
# AGENDADOR (CRON)
# =========================================

# Editar agendador
crontab -e

# Adicionar estas linhas para automação:

# Backup diário às 3h da manhã
0 3 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh backup >> maintenance.log 2>&1

# Health check diário às 9h da manhã
0 9 * * * cd /opt/reiche-academy && bash scripts/maintenance-vps.sh health >> maintenance.log 2>&1

# Renovar certificados SSL toda segunda às 3h
0 3 * * 1 certbot renew --quiet && cd /opt/reiche-academy && docker compose -f docker-compose.vps.yml restart nginx

# =========================================

echo "✅ Cheat sheet carregado!"
echo "Copie e cole os comandos acima conforme necessário"
