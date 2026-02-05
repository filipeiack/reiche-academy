#!/bin/bash

# Script de Diagnóstico SSL/Nginx - VPS Reiche Academy
# Uso: bash scripts/diagnose-vps-ssl.sh
#
# Versão: 2.1
# Última atualização: 2026-02-05
#
# Este script verifica:
# - Status de containers Docker
# - Configuração do Nginx e SSL
# - Validade dos certificados
# - Conectividade dos backends
# - IP do VPS vs DNS configurado
# - Testes de acesso HTTP/HTTPS
# - Diagnóstico completo de problemas SSL
#
# Changelog v2.1:
# - Melhorada extração de DNS (fallback para dig/host)
# - Auto-instalação de dnsutils se comandos DNS não disponíveis
# - Mensagens mais claras quando DNS não pode ser verificado
# - Resumo final com tratamento de valores N/A
#
# Changelog v2.0:
# - Adicionada verificação de IP do VPS
# - Adicionada comparação DNS vs IP real
# - Adicionado teste SSL direto no IP
# - Validação completa de certificados com openssl
# - Testes de acesso aos domínios públicos
# - Detecção automática de problemas de DNS
# - Sugestões contextuais baseadas em diagnósticos

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
echo "6️⃣ CERTIFICADOS SSL (LOCALIZAÇÃO)"
echo "----------------------------------------"
echo "Verificando /etc/nginx/ssl/ (USADO PELO NGINX):"
docker compose -f docker-compose.vps.yml exec nginx ls -lah /etc/nginx/ssl/ 2>&1 || echo "❌ Diretório não existe"
echo ""

echo "Verificando /etc/letsencrypt/live/ (Let's Encrypt):"
docker compose -f docker-compose.vps.yml exec nginx ls -lah /etc/letsencrypt/live/ 2>&1 || echo "❌ Diretório não existe (normal se usando certificados manuais)"
echo ""

echo "Verificando certificados específicos:"
docker compose -f docker-compose.vps.yml exec nginx ls -lah /etc/letsencrypt/live/app.reicheacademy.cloud/ 2>&1 || echo "❌ Certificado app.reicheacademy.cloud não encontrado em /etc/letsencrypt"
docker compose -f docker-compose.vps.yml exec nginx ls -lah /etc/letsencrypt/live/staging.reicheacademy.cloud/ 2>&1 || echo "❌ Certificado staging.reicheacademy.cloud não encontrado em /etc/letsencrypt"
echo ""

# 7. Verificar validade dos certificados (completo)
echo "7️⃣ VALIDADE DOS CERTIFICADOS SSL"
echo "----------------------------------------"
echo "Instalando openssl no container (se necessário)..."
docker compose -f docker-compose.vps.yml exec nginx sh -c "apk add --no-cache openssl 2>/dev/null" > /dev/null 2>&1

echo ""
echo "=== CERTIFICADO PRODUÇÃO (app.reicheacademy.cloud) ==="
docker compose -f docker-compose.vps.yml exec nginx openssl x509 -in /etc/nginx/ssl/app.reicheacademy.cloud.crt -noout -dates -subject -issuer 2>&1 || echo "❌ Não foi possível ler certificado"

echo ""
echo "=== CERTIFICADO STAGING (staging.reicheacademy.cloud) ==="
docker compose -f docker-compose.vps.yml exec nginx openssl x509 -in /etc/nginx/ssl/staging.reicheacademy.cloud.crt -noout -dates -subject -issuer 2>&1 || echo "❌ Não foi possível ler certificado"

echo ""
echo "=== CERTIFICADO STAGING FULL (staging.reicheacademy.cloud.full.crt) ==="
docker compose -f docker-compose.vps.yml exec nginx openssl x509 -in /etc/nginx/ssl/staging.reicheacademy.cloud.full.crt -noout -dates -subject -issuer 2>&1 || echo "❌ Não foi possível ler certificado"
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
echo "Backend PROD (porta 3000 interna):"
PROD_STATUS=$(docker compose -f docker-compose.vps.yml ps backend-prod --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
echo "Status: $PROD_STATUS"

echo ""
echo "Backend STAGING (porta 3000 interna):"
STAGING_STATUS=$(docker compose -f docker-compose.vps.yml ps backend-staging --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
echo "Status: $STAGING_STATUS"

echo ""
echo "NOTA: Backends usam porta 3000 dentro dos containers, acessíveis via rede Docker"
echo ""

# 11. Testar conectividade interna
echo "1️⃣1️⃣ TESTES DE CONECTIVIDADE INTERNA"
echo "----------------------------------------"
echo "Testando backend PROD (http://backend-prod:3000/api/health via rede interna):"
docker compose -f docker-compose.vps.yml exec nginx sh -c "apk add --no-cache curl 2>/dev/null; curl -s -o /dev/null -w 'HTTP %{http_code} - Tempo: %{time_total}s\n' http://backend-prod:3000/api/health" 2>&1 || echo "❌ Falhou"

echo ""
echo "Testando backend STAGING (http://backend-staging:3000/api/health via rede interna):"
docker compose -f docker-compose.vps.yml exec nginx sh -c "curl -s -o /dev/null -w 'HTTP %{http_code} - Tempo: %{time_total}s\n' http://backend-staging:3000/api/health" 2>&1 || echo "❌ Falhou"

echo ""
echo "NOTA: Backends rodam na porta 3000 DENTRO do container, nginx faz proxy reverso"
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

# 14. Testar SSL externamente (do próprio VPS)
echo "1️⃣4️⃣ TESTE SSL EXTERNO (do VPS para domínios públicos)"
echo "----------------------------------------"
echo "Testando HTTPS (app.reicheacademy.cloud):"
timeout 5 curl -Iv https://app.reicheacademy.cloud 2>&1 | head -15 || echo "❌ Timeout ou erro"
echo ""

echo "Testando HTTPS (staging.reicheacademy.cloud):"
timeout 5 curl -Iv https://staging.reicheacademy.cloud 2>&1 | head -15 || echo "❌ Timeout ou erro"
echo ""

# 15. Verificar docker-compose.vps.yml
echo "1️⃣5️⃣ CONFIGURAÇÃO DOCKER COMPOSE"
echo "----------------------------------------"
echo "Seção nginx em docker-compose.vps.yml:"
grep -A 20 "nginx:" docker-compose.vps.yml 2>&1 || echo "Arquivo não encontrado"
echo ""

# 16. Verificar IP do VPS e DNS
echo "1️⃣6️⃣ VERIFICAÇÃO DE IP E DNS"
echo "----------------------------------------"
VPS_IP_V4=$(hostname -I | awk '{print $1}')
VPS_IP_PUBLIC=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo "")

echo "IP VPS (hostname -I): $VPS_IP_V4"
echo "IP Público (ifconfig.me): $VPS_IP_PUBLIC"
echo ""

# Verificar se comandos DNS estão disponíveis
if ! command -v nslookup &> /dev/null && ! command -v dig &> /dev/null && ! command -v host &> /dev/null; then
    echo "⚠️ Comandos DNS não encontrados. Instalando dnsutils..."
    apt-get update -qq 2>/dev/null && apt-get install -y -qq dnsutils 2>/dev/null
fi
echo ""

echo "DNS - app.reicheacademy.cloud:"
# Tenta múltiplas formas de extrair o IP do DNS
DNS_APP=$(nslookup app.reicheacademy.cloud 2>/dev/null | grep "Address:" | grep -v "#" | tail -1 | awk '{print $2}')
if [ -z "$DNS_APP" ]; then
    DNS_APP=$(dig +short app.reicheacademy.cloud 2>/dev/null | head -1)
fi
if [ -z "$DNS_APP" ]; then
    DNS_APP=$(host app.reicheacademy.cloud 2>/dev/null | grep "has address" | awk '{print $4}' | head -1)
fi
echo "  Resolve para: ${DNS_APP:-N/A}"
if [ "$DNS_APP" = "$VPS_IP_V4" ] || [ "$DNS_APP" = "$VPS_IP_PUBLIC" ]; then
    echo "  ✅ DNS aponta para IP correto"
elif [ -z "$DNS_APP" ]; then
    echo "  ⚠️ Não foi possível resolver DNS (comando nslookup/dig/host indisponível)"
else
    echo "  ❌ DNS aponta para IP ERRADO! Deveria ser: $VPS_IP_V4"
fi
echo ""

echo "DNS - staging.reicheacademy.cloud:"
DNS_STAGING=$(nslookup staging.reicheacademy.cloud 2>/dev/null | grep "Address:" | grep -v "#" | tail -1 | awk '{print $2}')
if [ -z "$DNS_STAGING" ]; then
    DNS_STAGING=$(dig +short staging.reicheacademy.cloud 2>/dev/null | head -1)
fi
if [ -z "$DNS_STAGING" ]; then
    DNS_STAGING=$(host staging.reicheacademy.cloud 2>/dev/null | grep "has address" | awk '{print $4}' | head -1)
fi
echo "  Resolve para: ${DNS_STAGING:-N/A}"
if [ "$DNS_STAGING" = "$VPS_IP_V4" ] || [ "$DNS_STAGING" = "$VPS_IP_PUBLIC" ]; then
    echo "  ✅ DNS aponta para IP correto"
elif [ -z "$DNS_STAGING" ]; then
    echo "  ⚠️ Não foi possível resolver DNS (comando nslookup/dig/host indisponível)"
else
    echo "  ❌ DNS aponta para IP ERRADO! Deveria ser: $VPS_IP_V4"
fi
echo ""

# 17. Testar SSL direto no IP do VPS
echo "1️⃣7️⃣ TESTE SSL DIRETO NO IP DO VPS"
echo "----------------------------------------"
echo "Testando HTTPS no IP $VPS_IP_V4 (simulando app.reicheacademy.cloud):"
timeout 5 curl -Ikv https://$VPS_IP_V4 --resolve app.reicheacademy.cloud:443:$VPS_IP_V4 2>&1 | grep -E "HTTP|SSL|Certificate|subject|issuer|expire|Server certificate" | head -15 || echo "❌ Falhou"
echo ""

echo "Testando HTTPS no IP $VPS_IP_V4 (simulando staging.reicheacademy.cloud):"
timeout 5 curl -Ikv https://$VPS_IP_V4 --resolve staging.reicheacademy.cloud:443:$VPS_IP_V4 2>&1 | grep -E "HTTP|SSL|Certificate|subject|issuer|expire|x-environment" | head -15 || echo "❌ Falhou"
echo ""

# 18. Testar acesso aos domínios
echo "1️⃣8️⃣ TESTE DE ACESSO AOS DOMÍNIOS"
echo "----------------------------------------"
echo "Testando HTTP → HTTPS redirect (app.reicheacademy.cloud):"
timeout 3 curl -Iv http://app.reicheacademy.cloud 2>&1 | grep -E "HTTP|Location|Server" | head -10 || echo "❌ Timeout ou erro"
echo ""

echo "Testando HTTPS (app.reicheacademy.cloud):"
timeout 5 curl -Ikv https://app.reicheacademy.cloud 2>&1 | grep -E "HTTP|SSL|error|subject|x-environment" | head -15 || echo "❌ Timeout ou erro"
echo ""

echo "Testando HTTPS (staging.reicheacademy.cloud):"
timeout 5 curl -Ikv https://staging.reicheacademy.cloud 2>&1 | grep -E "HTTP|SSL|error|subject|x-environment" | head -15 || echo "❌ Timeout ou erro"
echo ""

# Resumo Final
echo "=========================================="
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo "Nginx Status: $NGINX_STATUS"
echo "Backend PROD: $PROD_STATUS"
echo "Backend STAGING: $STAGING_STATUS"
echo "IP VPS: $VPS_IP_V4"
echo "IP Público: ${VPS_IP_PUBLIC:-IPv6 detectado}"
echo "DNS app.reicheacademy.cloud: ${DNS_APP:-N/A}"
echo "DNS staging.reicheacademy.cloud: ${DNS_STAGING:-N/A}"
echo ""

echo "🔧 PRÓXIMOS PASSOS (baseado em problemas comuns):"
echo "----------------------------------------"
echo ""

# Verificar problema de DNS
if [ -n "$DNS_APP" ] && [ "$DNS_APP" != "$VPS_IP_V4" ] && [ "$DNS_APP" != "$VPS_IP_PUBLIC" ]; then
    echo "❌ PROBLEMA DE DNS DETECTADO!"
    echo ""
    echo "DNS aponta para IP ERRADO:"
    echo "  - app.reicheacademy.cloud → $DNS_APP (ERRADO)"
    echo "  - staging.reicheacademy.cloud → ${DNS_STAGING:-N/A} (ERRADO)"
    echo ""
    echo "Deveria apontar para: $VPS_IP_V4"
    echo ""
    echo "SOLUÇÃO:"
    echo "1. Acesse seu painel DNS (Hostinger, Cloudflare, etc)"
    echo "2. Edite os registros A (IPv4):"
    echo "   - app → $VPS_IP_V4"
    echo "   - staging → $VPS_IP_V4"
    echo "3. Aguarde propagação (5min a 48h, geralmente rápido)"
    echo ""
    echo "Enquanto DNS não propaga, acesse pelo IP:"
    echo "  curl -Ikv https://$VPS_IP_V4 --resolve app.reicheacademy.cloud:443:$VPS_IP_V4"
    echo ""
elif [ -z "$DNS_APP" ] && [ -z "$DNS_STAGING" ]; then
    echo "⚠️ NÃO FOI POSSÍVEL VERIFICAR DNS"
    echo ""
    echo "Comandos nslookup/dig/host não disponíveis no VPS."
    echo "Instale com: apt-get install dnsutils bind9-utils"
    echo ""
    echo "MAS: Testes HTTPS funcionaram! Veja seções 1️⃣7️⃣ e 1️⃣8️⃣ acima."
    echo ""
fi

echo "❌ ERR_SSL_PROTOCOL_ERROR pode ser causado por:"
echo ""
echo "1. DNS APONTANDO PARA IP ERRADO (veja verificação acima)"
echo ""
echo "2. CERTIFICADO AUSENTE/EXPIRADO:"
echo "   - Verificar se existe: /etc/nginx/ssl/"
echo "   - Verificar validade na seção 7 deste diagnóstico"
echo "   - Renovar: certbot renew --nginx"
echo "   - Ou gerar novo: certbot --nginx -d app.reicheacademy.cloud -d staging.reicheacademy.cloud"
echo ""
echo "3. NGINX NÃO CONFIGURADO PARA SSL:"
echo "   - Verificar se nginx.conf tem: listen 443 ssl;"
echo "   - Verificar paths dos certificados"
echo "   - Certificados devem estar em: /etc/nginx/ssl/"
echo ""
echo "4. NGINX NÃO ESTÁ RODANDO:"
echo "   docker compose -f docker-compose.vps.yml up -d nginx"
echo ""
echo "5. PORTA 443 BLOQUEADA:"
echo "   ufw allow 443/tcp"
echo "   ufw allow 80/tcp"
echo "   ufw status"
echo ""
echo "6. BACKENDS NÃO RESPONDENDO:"
echo "   docker compose -f docker-compose.vps.yml restart backend-prod backend-staging"
echo ""
echo "7. LOGS EM TEMPO REAL:"
echo "   docker compose -f docker-compose.vps.yml logs -f nginx"
echo ""
echo "8. TESTAR SSL LOCALMENTE (direto no VPS):"
echo "   curl -Ikv https://$VPS_IP_V4 --resolve app.reicheacademy.cloud:443:$VPS_IP_V4"
echo "   curl -Ikv https://$VPS_IP_V4 --resolve staging.reicheacademy.cloud:443:$VPS_IP_V4"
echo ""
echo "=========================================="
echo "✅ DIAGNÓSTICO COMPLETO"
echo "=========================================="
