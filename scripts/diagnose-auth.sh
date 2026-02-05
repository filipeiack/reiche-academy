#!/bin/bash

# Script de Diagnóstico de Autenticação - Reiche Academy
# Uso: bash scripts/diagnose-auth.sh [staging|prod]

ENV=${1:-staging}

if [ "$ENV" = "staging" ]; then
    BACKEND_CONTAINER="backend-staging"
    DB_NAME="reiche_academy_staging"
    API_PORT="3002"
else
    BACKEND_CONTAINER="backend-prod"
    DB_NAME="reiche_academy_prod"
    API_PORT="3001"
fi

echo "=========================================="
echo "🔍 DIAGNÓSTICO DE AUTENTICAÇÃO - $ENV"
echo "=========================================="
echo ""

# Função helper para tentar localhost e fallback para 127.0.0.1
function try_curl() {
    local url_path="$1"
    shift
    local curl_args="$@"
    
    # Tenta com localhost primeiro
    local response=$(curl -s --connect-timeout 2 $curl_args "http://localhost:$API_PORT$url_path" 2>/dev/null)
    if [ $? -eq 0 ] && [ -n "$response" ]; then
        echo "$response"
        return 0
    fi
    
    # Se falhou, tenta com 127.0.0.1
    response=$(curl -s --connect-timeout 2 $curl_args "http://127.0.0.1:$API_PORT$url_path" 2>/dev/null)
    echo "$response"
    return $?
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
HEALTH_RESPONSE=$(try_curl "/api/health")
if [ "$HEALTH_RESPONSE" = '{"status":"ok"}' ]; then
    echo "✅ API está respondendo: $HEALTH_RESPONSE"
else
    echo "❌ API não está respondendo corretamente: $HEALTH_RESPONSE"
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
LOGIN_RESPONSE=$(try_curl "/api/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"admin@reiche.com.br","senha":"Admin@123"}')

echo "Resposta:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
    echo "✅ Login funcionou!"
else
    echo "❌ Login falhou!"
fi
echo ""

# 9. Testar com usuário gestor (se for staging/test)
if [ "$ENV" = "staging" ]; then
    echo "9️⃣ TESTE DE LOGIN (gestor@empresa1.com)"
    echo "----------------------------------------"
    LOGIN_RESPONSE_GESTOR=$(try_curl "/api/auth/login" -X POST -H "Content-Type: application/json" -d '{"email":"gestor@empresa1.com","senha":"Admin@123"}')
    
    echo "Resposta:"
    echo "$LOGIN_RESPONSE_GESTOR" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE_GESTOR"
    
    if echo "$LOGIN_RESPONSE_GESTOR" | grep -q "accessToken"; then
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

# 11. Resumo Final
echo "=========================================="
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "=========================================="
echo "Backend Status: $BACKEND_STATUS"
echo "API Health: $HEALTH_RESPONSE"
echo "Ambiente: $ENV"
echo ""
echo "🔧 PRÓXIMOS PASSOS:"
echo "----------------------------------------"
echo "1. Se backend estiver down: docker compose -f docker-compose.vps.yml up -d $BACKEND_CONTAINER"
echo "2. Se JWT_SECRET estiver errado: verificar .env e reiniciar backend"
echo "3. Se hash não for Argon2: executar seed novamente"
echo "4. Se login falhar via cURL mas frontend funciona: problema de CORS/rede"
echo "5. Se nenhum usuário existir: executar seed"
echo ""
echo "Para executar seed novamente:"
echo "docker compose -f docker-compose.vps.yml exec $BACKEND_CONTAINER npm run seed"
echo ""
echo "Para ver logs em tempo real:"
echo "docker compose -f docker-compose.vps.yml logs -f $BACKEND_CONTAINER"
echo ""
