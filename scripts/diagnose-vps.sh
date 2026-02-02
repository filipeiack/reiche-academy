#!/bin/bash
# =============================================================
# DIAGNÓSTICO - Staging vs Produção no mesmo VPS
# Execute este script NO VPS para identificar problemas
# =============================================================

echo "========================================"
echo "🔍 DIAGNÓSTICO REICHE ACADEMY VPS"
echo "========================================"
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
docker network inspect reiche-network --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' 2>/dev/null || echo "❌ Rede reiche-network não existe!"
echo ""

# 4. Verificar logs do nginx
echo "📜 4. ÚLTIMOS LOGS DO NGINX (erros de upstream):"
echo "----------------------------------------"
docker logs reiche-nginx --tail 20 2>&1 | grep -E "(error|upstream|connect)" || echo "Nenhum erro recente"
echo ""

# 5. Testar conectividade interna
echo "🔗 5. TESTE DE CONECTIVIDADE (de dentro do nginx):"
echo "----------------------------------------"
echo "Testando backend-prod..."
docker exec reiche-nginx wget -q -O - http://backend-prod:3000/api/health 2>&1 || echo "❌ Falha ao conectar backend-prod"

echo "Testando backend-staging..."
docker exec reiche-nginx wget -q -O - http://backend-staging:3000/api/health 2>&1 || echo "❌ Falha ao conectar backend-staging"

echo "Testando frontend-prod..."
docker exec reiche-nginx wget -q -O - --spider http://frontend-prod:80 2>&1 && echo "✅ frontend-prod OK" || echo "❌ Falha ao conectar frontend-prod"

echo "Testando frontend-staging..."
docker exec reiche-nginx wget -q -O - --spider http://frontend-staging:80 2>&1 && echo "✅ frontend-staging OK" || echo "❌ Falha ao conectar frontend-staging"
echo ""

# 6. Verificar DATABASE_URL de cada backend
echo "🗄️ 6. DATABASE_URL DOS BACKENDS:"
echo "----------------------------------------"
echo "PROD:"
docker exec reiche-backend-prod printenv DATABASE_URL 2>/dev/null || echo "❌ Não conseguiu ler"
echo "STAGING:"
docker exec reiche-backend-staging printenv DATABASE_URL 2>/dev/null || echo "❌ Não conseguiu ler"
echo ""

# 7. Verificar certificados SSL
echo "🔒 7. CERTIFICADOS SSL:"
echo "----------------------------------------"
if docker exec reiche-nginx ls /etc/nginx/ssl/ 2>/dev/null; then
    echo "Arquivos encontrados:"
    docker exec reiche-nginx ls -la /etc/nginx/ssl/
else
    echo "❌ Pasta /etc/nginx/ssl/ não existe ou vazia"
fi
echo ""

# 8. Testar requisições externas
echo "🌍 8. TESTE DE REQUISIÇÕES EXTERNAS:"
echo "----------------------------------------"
echo "Testando app.reicheacademy.cloud..."
curl -sI https://app.reicheacademy.cloud 2>&1 | head -5
echo ""
echo "Testando staging.reicheacademy.cloud..."
curl -sI https://staging.reicheacademy.cloud 2>&1 | head -5
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
docker exec reiche-postgres psql -U ${POSTGRES_USER:-reiche} -d reiche_academy_prod -c "SELECT COUNT(*) as usuarios FROM usuarios;" 2>/dev/null || echo "❌ Erro ao consultar"

echo "STAGING (reiche_academy_staging):"
docker exec reiche-postgres psql -U ${POSTGRES_USER:-reiche} -d reiche_academy_staging -c "SELECT COUNT(*) as usuarios FROM usuarios;" 2>/dev/null || echo "❌ Erro ao consultar"
echo ""

echo "========================================"
echo "✅ DIAGNÓSTICO COMPLETO"
echo "========================================"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Se containers não estão rodando: docker compose -f docker-compose.vps.yml up -d"
echo "2. Se rede não existe: docker compose -f docker-compose.vps.yml down && up -d"
echo "3. Se SSL falha: verifique certificados em ./nginx/ssl/"
echo "4. Após ajustes: docker exec reiche-nginx nginx -t && docker exec reiche-nginx nginx -s reload"
