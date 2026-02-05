#!/bin/bash

# Script de Diagnóstico SSL/Nginx - VPS Reiche Academy
# Uso: bash diagnose-vps-ssl.sh

echo "=========================================="
echo "🔍 DIAGNÓSTICO SSL/NGINX - VPS"
echo "=========================================="
echo ""

# 1. Status dos Containers
echo "1️⃣ STATUS DOS CONTAINERS"
echo "----------------------------------------"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Verificar se Nginx está rodando
echo "2️⃣ DETALHES DO NGINX CONTAINER"
echo "----------------------------------------"
NGINX_STATUS=$(docker compose -f docker-compose.vps.yml ps nginx --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
if [ "$NGINX_STATUS" = "running" ]; then
    echo "✅ Nginx está rodando"
else
    echo "❌ Nginx NÃO está rodando! Status: $NGINX_STATUS"
    echo "   Execute: docker compose -f docker-compose.vps.yml up -d nginx"
fi
echo ""

# 3. Logs recentes do Nginx (erros)
echo "3️⃣ ÚLTIMOS ERROS DO NGINX"
echo "----------------------------------------"
docker compose -f docker-compose.vps.yml logs --tail=100 nginx | grep -i "error\|fail\|ssl\|certificate" | tail -20 || echo "✅ Nenhum erro encontrado"
echo ""

# 4. Testar sintaxe do Nginx
echo "4️⃣ TESTE DE SINTAXE DO NGINX"
echo "----------------------------------------"
docker compose -f docker-compose.vps.yml exec nginx nginx -t 2>&1
echo ""

# 5. Verificar configuração ativa
echo "5️⃣ CONFIGURAÇÃO ATIVA DO NGINX"
echo "----------------------------------------"
echo "Arquivo: nginx.conf (primeiras 30 linhas)"
docker compose -f docker-compose.vps.yml exec nginx cat /etc/nginx/nginx.conf | head -30
echo ""

# 6. Verificar certificados SSL
echo "6️⃣ CERTIFICADOS SSL"
echo "----------------------------------------"
echo "Listando /etc/letsencrypt/live/:"
docker compose -f docker-compose.vps.yml exec nginx ls -lah /etc/letsencrypt/live/ 2>&1
echo ""
echo "Verificando certificado app.reiche.com.br:"
docker compose -f docker-compose.vps.yml exec nginx ls -lah /etc/letsencrypt/live/app.reiche.com.br/ 2>&1
echo ""

# 7. Verificar validade do certificado
echo "7️⃣ VALIDADE DO CERTIFICADO SSL"
echo "----------------------------------------"
CERT_FILE="/etc/letsencrypt/live/app.reiche.com.br/cert.pem"
docker compose -f docker-compose.vps.yml exec nginx openssl x509 -in $CERT_FILE -noout -dates 2>&1 || echo "❌ Não foi possível ler certificado"
echo ""

# 8. Verificar portas abertas no host
echo "8️⃣ PORTAS ABERTAS NO HOST"
echo "----------------------------------------"
echo "Portas 80 e 443:"
ss -tuln | grep ':80\|:443' || netstat -tuln | grep ':80\|:443'
echo ""

# 9. Verificar se Nginx está escutando dentro do container
echo "9️⃣ NGINX ESCUTANDO (dentro do container)"
echo "----------------------------------------"
docker compose -f docker-compose.vps.yml exec nginx netstat -tuln 2>&1 | grep ':80\|:443' || echo "⚠️ netstat não disponível"
echo ""

# 10. Verificar backends
echo "🔟 STATUS DOS BACKENDS"
echo "----------------------------------------"
echo "Backend PROD (porta 3001):"
PROD_STATUS=$(docker compose -f docker-compose.vps.yml ps backend-prod --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
echo "Status: $PROD_STATUS"

echo ""
echo "Backend STAGING (porta 3002):"
STAGING_STATUS=$(docker compose -f docker-compose.vps.yml ps backend-staging --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
echo "Status: $STAGING_STATUS"
echo ""

# 11. Testar conectividade interna
echo "1️⃣1️⃣ TESTES DE CONECTIVIDADE INTERNA"
echo "----------------------------------------"
echo "Testando backend PROD (http://localhost:3001/api/health):"
curl -s -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" http://localhost:3001/api/health || echo "❌ Falhou"

echo ""
echo "Testando backend STAGING (http://localhost:3002/api/health):"
curl -s -o /dev/null -w "HTTP %{http_code} - Tempo: %{time_total}s\n" http://localhost:3002/api/health || echo "❌ Falhou"
echo ""

# 12. Verificar logs de acesso e erro do Nginx
echo "1️⃣2️⃣ LOGS DO NGINX (últimas 20 linhas)"
echo "----------------------------------------"
echo "=== ERROR LOG ==="
docker compose -f docker-compose.vps.yml exec nginx tail -20 /var/log/nginx/error.log 2>&1 || echo "Arquivo não encontrado"
echo ""
echo "=== ACCESS LOG ==="
docker compose -f docker-compose.vps.yml exec nginx tail -20 /var/log/nginx/access.log 2>&1 || echo "Arquivo não encontrado"
echo ""

# 13. Verificar firewall
echo "1️⃣3️⃣ FIREWALL"
echo "----------------------------------------"
echo "UFW Status:"
ufw status 2>&1 || echo "UFW não instalado"
echo ""
echo "iptables (portas 80 e 443):"
iptables -L -n 2>&1 | grep -E "80|443" || echo "Sem regras específicas"
echo ""

# 14. Testar SSL externamente
echo "1️⃣4️⃣ TESTE SSL EXTERNO"
echo "----------------------------------------"
echo "Testando HTTPS (app.reiche.com.br):"
timeout 5 curl -Iv https://app.reiche.com.br 2>&1 | head -15 || echo "❌ Timeout ou erro"
echo ""

# 15. Verificar docker-compose.vps.yml
echo "1️⃣5️⃣ CONFIGURAÇÃO DOCKER COMPOSE"
echo "----------------------------------------"
echo "Seção nginx em docker-compose.vps.yml:"
grep -A 20 "nginx:" docker-compose.vps.yml 2>&1 || echo "Arquivo não encontrado"
echo ""

# Resumo Final
echo "=========================================="
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo "Nginx Status: $NGINX_STATUS"
echo "Backend PROD: $PROD_STATUS"
echo "Backend STAGING: $STAGING_STATUS"
echo ""

echo "🔧 PRÓXIMOS PASSOS (baseado em problemas comuns):"
echo "----------------------------------------"
echo ""
echo "❌ ERR_SSL_PROTOCOL_ERROR pode ser causado por:"
echo ""
echo "1. CERTIFICADO AUSENTE/EXPIRADO:"
echo "   - Verificar se existe: /etc/letsencrypt/live/app.reiche.com.br/"
echo "   - Renovar: certbot renew --nginx"
echo "   - Ou gerar novo: certbot --nginx -d app.reiche.com.br"
echo ""
echo "2. NGINX NÃO CONFIGURADO PARA SSL:"
echo "   - Verificar se nginx.conf tem: listen 443 ssl;"
echo "   - Verificar paths dos certificados"
echo "   - Trocar de nginx.conf para nginx.prod.conf:"
echo "     docker compose -f docker-compose.vps.yml down nginx"
echo "     # Editar docker-compose.vps.yml: nginx/nginx.prod.conf"
echo "     docker compose -f docker-compose.vps.yml up -d nginx"
echo ""
echo "3. NGINX NÃO ESTÁ RODANDO:"
echo "   docker compose -f docker-compose.vps.yml up -d nginx"
echo ""
echo "4. PORTA 443 BLOQUEADA:"
echo "   ufw allow 443/tcp"
echo "   ufw allow 80/tcp"
echo ""
echo "5. BACKENDS NÃO RESPONDENDO:"
echo "   docker compose -f docker-compose.vps.yml restart backend-prod backend-staging"
echo ""
echo "6. LOGS EM TEMPO REAL:"
echo "   docker compose -f docker-compose.vps.yml logs -f nginx"
echo ""
echo "=========================================="
echo "✅ DIAGNÓSTICO COMPLETO"
echo "=========================================="
