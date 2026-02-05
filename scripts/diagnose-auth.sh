#!/bin/bash

# Script de Diagnóstico de Autenticação - Reiche Academy
# Uso: bash scripts/diagnose-auth.sh [staging|prod]
#
# Versão: 2.0
# Última atualização: 2026-02-05
#
# Changelog v2.0:
# - Corrigidos nomes de containers (reiche-backend-*)
# - Corrigida porta interna dos backends (3000)
# - Adicionado teste via rede Docker
# - Adicionado teste via Nginx (domínio público)
# - Melhoradas mensagens de erro
# - Adicionada verificação de conectividade

ENV=${1:-staging}

if [ "$ENV" = "staging" ]; then
    BACKEND_CONTAINER="reiche-backend-staging"
    DB_NAME="reiche_academy_staging"
    API_DOMAIN="staging.reicheacademy.cloud"
    BACKEND_INTERNAL="backend-staging:3000"
else
    BACKEND_CONTAINER="reiche-backend-prod"
    DB_NAME="reiche_academy_prod"
    API_DOMAIN="app.reicheacademy.cloud"
    BACKEND_INTERNAL="backend-prod:3000"
fi

echo "=========================================="
echo "🔍 DIAGNÓSTICO DE AUTENTICAÇÃO - $ENV"
echo "=========================================="
echo "Container: $BACKEND_CONTAINER"
echo "Database: $DB_NAME"
echo "Domain: $API_DOMAIN"
echo ""

# Função helper para tentar acessar API via Nginx (domínio público)
function try_curl_nginx() {
    local url_path="$1"
    shift
    local curl_args="$@"
    
    # Tenta via HTTPS primeiro (domínio público via Nginx)
    local response=$(curl -sk --connect-timeout 3 $curl_args "https://$API_DOMAIN$url_path" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo "$response"
        return 0
    fi
    
    # Se falhou, tenta via HTTP
    response=$(curl -s --connect-timeout 3 $curl_args "http://$API_DOMAIN$url_path" 2>/dev/null)
    echo "$response"
    return $?
}

# Função helper para testar via rede Docker (dentro do container nginx)
function try_curl_internal() {
    local url_path="$1"
    shift
    local curl_args="$@"
    
    # Testa via rede Docker interna
    docker compose -f docker-compose.vps.yml exec -T nginx sh -c "apk add --no-cache curl 2>/dev/null >/dev/null; curl -s --connect-timeout 2 $curl_args 'http://$BACKEND_INTERNAL$url_path'" 2>/dev/null
}

# 1. Status do Backend
echo "1️⃣ STATUS DO BACKEND"
echo "----------------------------------------"
BACKEND_STATUS=$(docker compose -f docker-compose.vps.yml ps $BACKEND_CONTAINER --format json 2>/dev/null | jq -r '.State' 2>/dev/null)
if [ "$BACKEND_STATUS" = "running" ]; then
    echo "✅ Backend está rodando"
else
    echo "❌ Backend NÃO está rodando! Status: $BACKEND_STATUS"
    echo "   Execute: docker compose -f docker-compose.vps.yml up -d $BACKEND_CONTAINER"
    exit 1
fi
echo ""

# 2. Logs Recentes do Backend (últimos 50 linhas)
echo "2️⃣ ÚLTIMOS LOGS DO BACKEND (procurando erros)"
echo "----------------------------------------"
docker compose -f docker-compose.vps.yml logs --tail=50 $BACKEND_CONTAINER | grep -i "error\|exception\|fail\|invalid" || echo "✅ Nenhum erro encontrado nos logs recentes"
echo ""

# 3. Health Check do Backend
echo "3️⃣ HEALTH CHECK DO BACKEND"
echo "----------------------------------------"
echo "Testando via rede Docker interna ($BACKEND_INTERNAL)..."
HEALTH_INTERNAL=$(try_curl_internal "/api/health")
if [ "$HEALTH_INTERNAL" = '{"status":"ok"}' ]; then
    echo "✅ API (rede interna): $HEALTH_INTERNAL"
else
    echo "❌ API (rede interna) não está respondendo: $HEALTH_INTERNAL"
fi

echo ""
echo "Testando via Nginx público ($API_DOMAIN)..."
HEALTH_PUBLIC=$(try_curl_nginx "/api/health")
if [ "$HEALTH_PUBLIC" = '{"status":"ok"}' ]; then
    echo "✅ API (Nginx público): $HEALTH_PUBLIC"
else
    echo "❌ API (Nginx público) não está respondendo: $HEALTH_PUBLIC"
fi
echo ""

# 4. Verificar Variáveis de Ambiente
echo "4️⃣ VARIÁVEIS DE AMBIENTE (JWT_SECRET)"
echo "----------------------------------------"
JWT_SECRET=$(docker compose -f docker-compose.vps.yml exec -T $BACKEND_CONTAINER printenv JWT_SECRET 2>/dev/null)
JWT_REFRESH_SECRET=$(docker compose -f docker-compose.vps.yml exec -T $BACKEND_CONTAINER printenv JWT_REFRESH_SECRET 2>/dev/null)

if [ -z "$JWT_SECRET" ]; then
    echo "❌ JWT_SECRET não está definido!"
else
    echo "✅ JWT_SECRET está definido (primeiros 10 chars): ${JWT_SECRET:0:10}..."
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
    echo "❌ JWT_REFRESH_SECRET não está definido!"
else
    echo "✅ JWT_REFRESH_SECRET está definido (primeiros 10 chars): ${JWT_REFRESH_SECRET:0:10}..."
fi
echo ""

# 5. Verificar Usuários no Banco
echo "5️⃣ USUÁRIOS NO BANCO DE DADOS"
echo "----------------------------------------"
docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche_admin -d $DB_NAME << 'EOSQL'
SELECT 
    id,
    email,
    nome,
    ativo,
    "perfilId",
    "empresaId",
    LEFT(senha, 20) as senha_hash_inicio,
    "createdAt"::date as criado_em
FROM usuarios
ORDER BY "createdAt" DESC
LIMIT 10;
EOSQL
echo ""

# 6. Contar Usuários Ativos
echo "6️⃣ CONTAGEM DE USUÁRIOS"
echo "----------------------------------------"
docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche_admin -d $DB_NAME << 'EOSQL'
SELECT 
    CASE WHEN ativo THEN 'Ativos' ELSE 'Inativos' END as status,
    COUNT(*) as total
FROM usuarios
GROUP BY ativo;
EOSQL
echo ""

# 7. Verificar Perfis
echo "7️⃣ PERFIS DISPONÍVEIS"
echo "----------------------------------------"
docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche_admin -d $DB_NAME << 'EOSQL'
SELECT id, codigo, nome FROM perfis_usuario ORDER BY nivel DESC;
EOSQL
echo ""

# 8. Testar Login com cURL
echo "8️⃣ TESTE DE LOGIN (admin@reiche.com.br)"
echo "----------------------------------------"
echo "Testando via rede Docker interna..."
LOGIN_INTERNAL=$(try_curl_internal "/api/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"admin@reiche.com.br","senha":"Admin@123"}')
echo "Resposta (interna):"
echo "$LOGIN_INTERNAL" | jq '.' 2>/dev/null || echo "$LOGIN_INTERNAL"
if echo "$LOGIN_INTERNAL" | grep -q "accessToken"; then
    echo "✅ Login (rede interna) funcionou!"
else
    echo "❌ Login (rede interna) falhou!"
fi

echo ""
echo "Testando via Nginx público ($API_DOMAIN)..."
LOGIN_PUBLIC=$(try_curl_nginx "/api/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"admin@reiche.com.br","senha":"Admin@123"}')
echo "Resposta (público):"
echo "$LOGIN_PUBLIC" | jq '.' 2>/dev/null || echo "$LOGIN_PUBLIC"
if echo "$LOGIN_PUBLIC" | grep -q "accessToken"; then
    echo "✅ Login (Nginx público) funcionou!"
else
    echo "❌ Login (Nginx público) falhou!"
fi
echo ""

# 9. Testar com usuário gestor (se for staging)
if [ "$ENV" = "staging" ]; then
    echo "9️⃣ TESTE DE LOGIN (gestor@empresa1.com)"
    echo "----------------------------------------"
    echo "Testando via Nginx público..."
    LOGIN_GESTOR=$(try_curl_nginx "/api/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"gestor@empresa1.com","senha":"Admin@123"}')
    
    echo "Resposta:"
    echo "$LOGIN_GESTOR" | jq '.' 2>/dev/null || echo "$LOGIN_GESTOR"
    
    if echo "$LOGIN_GESTOR" | grep -q "accessToken"; then
        echo "✅ Login gestor funcionou!"
    else
        echo "❌ Login gestor falhou!"
    fi
    echo ""
fi

# 10. Verificar Hash Argon2
echo "🔟 VERIFICAR ALGORITMO DE HASH"
echo "----------------------------------------"
SAMPLE_HASH=$(docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche_admin -d $DB_NAME -t -c "SELECT LEFT(senha, 10) FROM usuarios WHERE email='admin@reiche.com.br' LIMIT 1;" | xargs)

if [ -z "$SAMPLE_HASH" ]; then
    echo "❌ Não foi possível recuperar hash do admin!"
elif [[ "$SAMPLE_HASH" == \$argon2* ]]; then
    echo "✅ Hash está usando Argon2: $SAMPLE_HASH..."
else
    echo "⚠️ Hash NÃO parece ser Argon2: $SAMPLE_HASH..."
    echo "   Pode estar usando bcrypt ou outro algoritmo!"
fi
echo ""

# 11. Verificar conectividade de rede
echo "1️⃣1️⃣ CONECTIVIDADE DE REDE"
echo "----------------------------------------"
echo "Testando se backend está acessível via rede Docker..."
NETWORK_TEST=$(docker compose -f docker-compose.vps.yml exec -T nginx sh -c "apk add --no-cache curl 2>/dev/null >/dev/null; curl -s -o /dev/null -w '%{http_code}' --connect-timeout 2 http://$BACKEND_INTERNAL/api/health" 2>/dev/null)
if [ "$NETWORK_TEST" = "200" ]; then
    echo "✅ Backend acessível via rede Docker (HTTP $NETWORK_TEST)"
else
    echo "❌ Backend NÃO acessível via rede Docker (HTTP $NETWORK_TEST)"
fi

echo ""
echo "Testando se Nginx está configurado corretamente..."
NGINX_TEST=$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 3 -k https://$API_DOMAIN/api/health 2>/dev/null)
if [ "$NGINX_TEST" = "200" ]; then
    echo "✅ Nginx proxy reverso funcionando (HTTP $NGINX_TEST)"
else
    echo "❌ Nginx proxy reverso com problema (HTTP $NGINX_TEST)"
fi
echo ""

# 12. Resumo Final
echo "=========================================="
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo "Ambiente: $ENV"
echo "Backend Container: $BACKEND_CONTAINER"
echo "Backend Status: $BACKEND_STATUS"
echo "API Domain: $API_DOMAIN"
echo "API Health (interna): $HEALTH_INTERNAL"
echo "API Health (pública): $HEALTH_PUBLIC"
echo "Conectividade Docker: $NETWORK_TEST"
echo "Conectividade Nginx: $NGINX_TEST"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "----------------------------------------"
echo "1. Se backend estiver down:"
echo "   docker compose -f docker-compose.vps.yml up -d $BACKEND_CONTAINER"
echo ""
echo "2. Se JWT_SECRET estiver errado:"
echo "   - Verificar arquivo .env.$ENV"
echo "   - Reiniciar: docker compose -f docker-compose.vps.yml restart $BACKEND_CONTAINER"
echo ""
echo "3. Se hash não for Argon2:"
echo "   docker compose -f docker-compose.vps.yml exec $BACKEND_CONTAINER npm run seed"
echo ""
echo "4. Se login falhar internamente mas frontend funciona:"
echo "   - Problema de CORS/rede"
echo "   - Verificar configuração do Nginx"
echo ""
echo "5. Se nenhum usuário existir:"
echo "   docker compose -f docker-compose.vps.yml exec $BACKEND_CONTAINER npm run seed"
echo ""
echo "6. Se conectividade Docker falhar:"
echo "   - Verificar se containers estão na mesma rede"
echo "   - docker network inspect reiche-network"
echo ""
echo "7. Se conectividade Nginx falhar:"
echo "   - Verificar configuração nginx.conf"
echo "   - Verificar DNS (execute: bash scripts/diagnose-vps-ssl.sh)"
echo ""
echo "Comandos úteis:"
echo "----------------------------------------"
echo "Executar seed:"
echo "  docker compose -f docker-compose.vps.yml exec $BACKEND_CONTAINER npm run seed"
echo ""
echo "Ver logs em tempo real:"
echo "  docker compose -f docker-compose.vps.yml logs -f $BACKEND_CONTAINER"
echo ""
echo "Acessar container:"
echo "  docker compose -f docker-compose.vps.yml exec $BACKEND_CONTAINER sh"
echo ""
echo "Verificar variáveis de ambiente:"
echo "  docker compose -f docker-compose.vps.yml exec $BACKEND_CONTAINER env | grep JWT"
echo ""
echo "=========================================="
echo "✅ DIAGNÓSTICO COMPLETO"
echo "=========================================="
