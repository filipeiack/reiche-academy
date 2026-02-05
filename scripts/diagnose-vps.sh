#!/bin/bash
# =============================================================
# DIAGNÓSTICO COMPLETO - VPS Reiche Academy
# Execute este script NO VPS para identificar problemas
#
# Versão: 3.0
# Última atualização: 2026-02-05
#
# Changelog v3.0:
# - Adicionada verificação de IP e DNS
# - Adicionada verificação de recursos (CPU, memória, disco)
# - Adicionada verificação de volumes Docker
# - Melhorada conectividade (usando curl em vez de wget)
# - Adicionada verificação de firewall
# - Adicionada verificação de portas abertas
# - Melhoradas mensagens e formatação
# - Corrigido acesso ao PostgreSQL
# =============================================================

echo "========================================"
echo "🔍 DIAGNÓSTICO REICHE ACADEMY VPS"
echo "========================================"
echo "Data: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 0. Informações do Sistema
echo "🖥️ 0. INFORMAÇÕES DO SISTEMA:"
echo "----------------------------------------"
echo "Hostname: $(hostname)"
echo "IP VPS (privado): $(hostname -I | awk '{print $1}')"
VPS_IP_PUBLIC=$(curl -s --max-time 3 ifconfig.me 2>/dev/null || echo "N/A")
echo "IP VPS (público): $VPS_IP_PUBLIC"
echo "Sistema Operacional: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo 'N/A')"
echo "Kernel: $(uname -r)"
echo "Uptime: $(uptime -p 2>/dev/null || uptime)"
echo ""

# 0.1 Recursos do Sistema
echo "📊 0.1. RECURSOS DO SISTEMA:"
echo "----------------------------------------"
echo "CPU:"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "  Uso: " 100 - $1 "%"}'
echo "Memória:"
free -h | awk 'NR==2{printf "  Total: %s, Usado: %s (%.2f%%), Livre: %s\n", $2, $3, $3*100/$2, $4}'
echo "Disco:"
df -h / | awk 'NR==2{printf "  Total: %s, Usado: %s (%s), Livre: %s\n", $2, $3, $5, $4}'
echo ""

# 0.2 Verificar IP e DNS
echo "🌐 0.2. VERIFICAÇÃO DE DNS:"
echo "----------------------------------------"
VPS_IP=$(hostname -I | awk '{print $1}')
DNS_APP=$(nslookup app.reicheacademy.cloud 2>/dev/null | grep -A1 "Non-authoritative answer:" | grep "Address:" | awk '{print $2}' | head -1)
DNS_STAGING=$(nslookup staging.reicheacademy.cloud 2>/dev/null | grep -A1 "Non-authoritative answer:" | grep "Address:" | awk '{print $2}' | head -1)

echo "app.reicheacademy.cloud resolve para: $DNS_APP"
if [ "$DNS_APP" = "$VPS_IP" ] || [ "$DNS_APP" = "$VPS_IP_PUBLIC" ]; then
    echo "  ✅ DNS correto"
else
    echo "  ❌ DNS incorreto! Deveria ser: $VPS_IP"
fi

echo "staging.reicheacademy.cloud resolve para: $DNS_STAGING"
if [ "$DNS_STAGING" = "$VPS_IP" ] || [ "$DNS_STAGING" = "$VPS_IP_PUBLIC" ]; then
    echo "  ✅ DNS correto"
else
    echo "  ❌ DNS incorreto! Deveria ser: $VPS_IP"
fi
echo ""

# 0.3 Portas abertas
echo "🔌 0.3. PORTAS ABERTAS:"
echo "----------------------------------------"
echo "Portas em LISTEN:"
ss -tuln | grep LISTEN | awk '{print "  " $5}' | sort -u
echo ""

# 0.4 Firewall
echo "🔥 0.4. FIREWALL:"
echo "----------------------------------------"
if command -v ufw &> /dev/null; then
    echo "UFW Status:"
    ufw status | head -10
else
    echo "UFW não instalado"
fi
echo ""

# 1. Verificar containers rodando
echo "📦 1. CONTAINERS RODANDO:"
echo "----------------------------------------"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# 2. Verificar se TODOS containers esperados estão UP
echo "📋 2. VERIFICANDO CONTAINERS NECESSÁRIOS:"
echo "----------------------------------------"
REQUIRED_CONTAINERS=("reiche-nginx" "reiche-backend-prod" "reiche-backend-staging" "reiche-frontend-prod" "reiche-frontend-staging" "reiche-postgres" "reiche-redis")

for container in "${REQUIRED_CONTAINERS[@]}"; do
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "✅ ${container} - RUNNING"
    else
        echo "❌ ${container} - NOT RUNNING"
    fi
done
echo ""

# 3. Verificar rede Docker
echo "🌐 3. REDE DOCKER (reiche-network):"
echo "----------------------------------------"
if docker network inspect reiche-network &>/dev/null; then
    echo "Rede reiche-network existe ✅"
    echo ""
    echo "Containers conectados:"
    docker network inspect reiche-network --format '{{range .Containers}}  {{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' 2>/dev/null
else
    echo "❌ Rede reiche-network não existe!"
fi
echo ""

# 3.1 Verificar volumes Docker
echo "💾 3.1. VOLUMES DOCKER:"
echo "----------------------------------------"
echo "Volumes do projeto:"
docker volume ls | grep reiche || echo "Nenhum volume 'reiche' encontrado"
echo ""
echo "Espaço usado pelos volumes:"
docker system df -v | grep -A 20 "Local Volumes" | head -15 || echo "N/A"
echo ""

# 4. Verificar logs do nginx
echo "📜 4. ÚLTIMOS LOGS DO NGINX (erros de upstream):"
echo "----------------------------------------"
docker logs reiche-nginx --tail 20 2>&1 | grep -E "(error|upstream|connect)" || echo "Nenhum erro recente"
echo ""

# 5. Testar conectividade interna
echo "🔗 5. TESTE DE CONECTIVIDADE (de dentro do nginx):"
echo "----------------------------------------"
echo "Instalando curl no nginx (se necessário)..."
docker exec reiche-nginx sh -c "apk add --no-cache curl 2>/dev/null" > /dev/null 2>&1

echo "Testando backend-prod (http://backend-prod:3000/api/health)..."
RESPONSE_PROD=$(docker exec reiche-nginx curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 http://backend-prod:3000/api/health 2>/dev/null)
if [ "$RESPONSE_PROD" = "200" ]; then
    echo "  ✅ backend-prod OK (HTTP $RESPONSE_PROD)"
else
    echo "  ❌ backend-prod FALHA (HTTP $RESPONSE_PROD)"
fi

echo "Testando backend-staging (http://backend-staging:3000/api/health)..."
RESPONSE_STAGING=$(docker exec reiche-nginx curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 http://backend-staging:3000/api/health 2>/dev/null)
if [ "$RESPONSE_STAGING" = "200" ]; then
    echo "  ✅ backend-staging OK (HTTP $RESPONSE_STAGING)"
else
    echo "  ❌ backend-staging FALHA (HTTP $RESPONSE_STAGING)"
fi

echo "Testando frontend-prod (http://frontend-prod:80)..."
RESPONSE_FE_PROD=$(docker exec reiche-nginx curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 http://frontend-prod:80 2>/dev/null)
if [ "$RESPONSE_FE_PROD" = "200" ]; then
    echo "  ✅ frontend-prod OK (HTTP $RESPONSE_FE_PROD)"
else
    echo "  ❌ frontend-prod FALHA (HTTP $RESPONSE_FE_PROD)"
fi

echo "Testando frontend-staging (http://frontend-staging:80)..."
RESPONSE_FE_STAGING=$(docker exec reiche-nginx curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 http://frontend-staging:80 2>/dev/null)
if [ "$RESPONSE_FE_STAGING" = "200" ]; then
    echo "  ✅ frontend-staging OK (HTTP $RESPONSE_FE_STAGING)"
else
    echo "  ❌ frontend-staging FALHA (HTTP $RESPONSE_FE_STAGING)"
fi
echo ""

# 6. Verificar DATABASE_URL de cada backend
echo "🗄️ 6. DATABASE_URL DOS BACKENDS:"
echo "----------------------------------------"
echo "PROD:"
DB_PROD=$(docker exec reiche-backend-prod printenv DATABASE_URL 2>/dev/null)
if [ -n "$DB_PROD" ]; then
    # Ocultar senha na exibição
    echo "  $(echo $DB_PROD | sed 's/:.*@/:***@/')"
    # Verificar se aponta para banco correto
    if echo "$DB_PROD" | grep -q "reiche_academy_prod"; then
        echo "  ✅ Aponta para reiche_academy_prod"
    else
        echo "  ❌ NÃO aponta para reiche_academy_prod!"
    fi
else
    echo "  ❌ Não conseguiu ler DATABASE_URL"
fi

echo "STAGING:"
DB_STAGING=$(docker exec reiche-backend-staging printenv DATABASE_URL 2>/dev/null)
if [ -n "$DB_STAGING" ]; then
    echo "  $(echo $DB_STAGING | sed 's/:.*@/:***@/')"
    if echo "$DB_STAGING" | grep -q "reiche_academy_staging"; then
        echo "  ✅ Aponta para reiche_academy_staging"
    else
        echo "  ❌ NÃO aponta para reiche_academy_staging!"
    fi
else
    echo "  ❌ Não conseguiu ler DATABASE_URL"
fi
echo ""

# 7. Verificar certificados SSL
echo "🔒 7. CERTIFICADOS SSL:"
echo "----------------------------------------"
if docker exec reiche-nginx ls /etc/nginx/ssl/ &>/dev/null; then
    echo "Certificados em /etc/nginx/ssl/:"
    docker exec reiche-nginx ls -lh /etc/nginx/ssl/ | tail -n +2 | awk '{print "  " $9 " (" $5 ")"}'
    
    # Verificar validade dos certificados
    echo ""
    echo "Instalando openssl (se necessário)..."
    docker exec reiche-nginx sh -c "apk add --no-cache openssl 2>/dev/null" > /dev/null 2>&1
    
    echo "Validade dos certificados:"
    for cert in app.reicheacademy.cloud.crt staging.reicheacademy.cloud.crt; do
        if docker exec reiche-nginx test -f "/etc/nginx/ssl/$cert"; then
            echo "  $cert:"
            VALIDITY=$(docker exec reiche-nginx openssl x509 -in "/etc/nginx/ssl/$cert" -noout -dates 2>/dev/null)
            if [ -n "$VALIDITY" ]; then
                echo "$VALIDITY" | sed 's/^/    /'
            else
                echo "    ❌ Não foi possível ler certificado"
            fi
        fi
    done
else
    echo "❌ Pasta /etc/nginx/ssl/ não existe ou vazia"
fi
echo ""

# 8. Testar requisições externas
echo "🌍 8. TESTE DE REQUISIÇÕES EXTERNAS:"
echo "----------------------------------------"
echo "Testando HTTPS app.reicheacademy.cloud..."
HTTP_CODE_APP=$(curl -sk -o /dev/null -w '%{http_code}' --connect-timeout 5 https://app.reicheacademy.cloud 2>/dev/null)
if [ "$HTTP_CODE_APP" = "200" ]; then
    echo "  ✅ app.reicheacademy.cloud OK (HTTP $HTTP_CODE_APP)"
    curl -sIk https://app.reicheacademy.cloud 2>&1 | grep -E "HTTP|x-environment|server" | head -3 | sed 's/^/  /'
else
    echo "  ❌ app.reicheacademy.cloud FALHA (HTTP $HTTP_CODE_APP)"
    echo "  Detalhes:"
    curl -sIkv https://app.reicheacademy.cloud 2>&1 | head -10 | sed 's/^/    /'
fi

echo ""
echo "Testando HTTPS staging.reicheacademy.cloud..."
HTTP_CODE_STAGING=$(curl -sk -o /dev/null -w '%{http_code}' --connect-timeout 5 https://staging.reicheacademy.cloud 2>/dev/null)
if [ "$HTTP_CODE_STAGING" = "200" ]; then
    echo "  ✅ staging.reicheacademy.cloud OK (HTTP $HTTP_CODE_STAGING)"
    curl -sIk https://staging.reicheacademy.cloud 2>&1 | grep -E "HTTP|x-environment|server" | head -3 | sed 's/^/  /'
else
    echo "  ❌ staging.reicheacademy.cloud FALHA (HTTP $HTTP_CODE_STAGING)"
    echo "  Detalhes:"
    curl -sIkv https://staging.reicheacademy.cloud 2>&1 | head -10 | sed 's/^/    /'
fi
echo ""

# 9. Verificar header X-Environment
echo "🏷️ 9. VERIFICANDO HEADER X-Environment:"
echo "----------------------------------------"
echo "PROD:"
curl -sI https://app.reicheacademy.cloud 2>&1 | grep -i "x-environment" || echo "(não encontrado)"
echo "STAGING:"
curl -sI https://staging.reicheacademy.cloud 2>&1 | grep -i "x-environment" || echo "(não encontrado)"
echo ""

# 10. Comparar dados dos bancos
echo "🔢 10. CONTAGEM DE REGISTROS NOS BANCOS:"
echo "----------------------------------------"
echo "PROD (reiche_academy_prod):"
USER_COUNT_PROD=$(docker exec reiche-postgres psql -U reiche_admin -d reiche_academy_prod -t -c "SELECT COUNT(*) FROM usuarios;" 2>/dev/null | xargs)
if [ -n "$USER_COUNT_PROD" ]; then
    echo "  Usuários: $USER_COUNT_PROD"
    docker exec reiche-postgres psql -U reiche_admin -d reiche_academy_prod -t -c "SELECT COUNT(*) as empresas FROM empresas; SELECT COUNT(*) as pilares FROM pilares_empresa;" 2>/dev/null | xargs | awk '{print "  Empresas: " $1 "\n  Pilares: " $2}'
else
    echo "  ❌ Erro ao consultar (verifique se banco existe e usuário é 'reiche_admin')"
fi

echo ""
echo "STAGING (reiche_academy_staging):"
USER_COUNT_STAGING=$(docker exec reiche-postgres psql -U reiche_admin -d reiche_academy_staging -t -c "SELECT COUNT(*) FROM usuarios;" 2>/dev/null | xargs)
if [ -n "$USER_COUNT_STAGING" ]; then
    echo "  Usuários: $USER_COUNT_STAGING"
    docker exec reiche-postgres psql -U reiche_admin -d reiche_academy_staging -t -c "SELECT COUNT(*) as empresas FROM empresas; SELECT COUNT(*) as pilares FROM pilares_empresa;" 2>/dev/null | xargs | awk '{print "  Empresas: " $1 "\n  Pilares: " $2}'
else
    echo "  ❌ Erro ao consultar (verifique se banco existe e usuário é 'reiche_admin')"
fi
echo ""

# 11. Verificar logs recentes de erros
echo "📜 11. LOGS RECENTES DE ERROS:"
echo "----------------------------------------"
echo "Backend PROD (últimas 5 linhas com erro):"
docker logs reiche-backend-prod --tail 100 2>&1 | grep -iE "error|exception|fail" | tail -5 | sed 's/^/  /' || echo "  ✅ Nenhum erro recente"

echo ""
echo "Backend STAGING (últimas 5 linhas com erro):"
docker logs reiche-backend-staging --tail 100 2>&1 | grep -iE "error|exception|fail" | tail -5 | sed 's/^/  /' || echo "  ✅ Nenhum erro recente"

echo ""
echo "Nginx (últimas 5 linhas com erro):"
docker logs reiche-nginx --tail 100 2>&1 | grep -iE "error|warn|fail" | tail -5 | sed 's/^/  /' || echo "  ✅ Nenhum erro recente"
echo ""

echo "========================================"
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "========================================"
echo "IP VPS: $VPS_IP (público: $VPS_IP_PUBLIC)"
echo "DNS app.reicheacademy.cloud: $DNS_APP"
echo "DNS staging.reicheacademy.cloud: $DNS_STAGING"
echo "HTTP app.reicheacademy.cloud: $HTTP_CODE_APP"
echo "HTTP staging.reicheacademy.cloud: $HTTP_CODE_STAGING"
echo "Conectividade backend-prod: $RESPONSE_PROD"
echo "Conectividade backend-staging: $RESPONSE_STAGING"
echo "Usuários PROD: $USER_COUNT_PROD"
echo "Usuários STAGING: $USER_COUNT_STAGING"
echo ""
echo "========================================"
echo "✅ DIAGNÓSTICO COMPLETO"
echo "========================================"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "----------------------------------------"
echo ""
echo "1. Se DNS está errado:"
echo "   - Acesse painel DNS e atualize registros A para: $VPS_IP"
echo ""
echo "2. Se containers não estão rodando:"
echo "   docker compose -f docker-compose.vps.yml up -d"
echo ""
echo "3. Se rede não existe:"
echo "   docker compose -f docker-compose.vps.yml down"
echo "   docker compose -f docker-compose.vps.yml up -d"
echo ""
echo "4. Se SSL falha:"
echo "   - Verifique certificados em ./nginx/ssl/"
echo "   - Ou execute: bash scripts/diagnose-vps-ssl.sh"
echo ""
echo "5. Se conectividade interna falha:"
echo "   - Verificar se containers estão na mesma rede"
echo "   - docker network inspect reiche-network"
echo ""
echo "6. Se DATABASE_URL está errado:"
echo "   - Editar arquivo .env.prod ou .env.staging"
echo "   - Reiniciar backend correspondente"
echo ""
echo "7. Após ajustes:"
echo "   docker exec reiche-nginx nginx -t"
echo "   docker exec reiche-nginx nginx -s reload"
echo ""
echo "Outros scripts de diagnóstico:"
echo "----------------------------------------"
echo "bash scripts/diagnose-vps-ssl.sh     # Diagnóstico SSL completo"
echo "bash scripts/diagnose-auth.sh prod   # Diagnóstico de autenticação PROD"
echo "bash scripts/diagnose-auth.sh staging # Diagnóstico de autenticação STAGING"
echo ""
