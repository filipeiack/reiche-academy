#!/bin/bash

# Script de Recuperação de Autenticação - Reiche Academy
# Uso: bash scripts/fix-auth.sh [staging|prod] [acao]
# Ações: reset-password | reseed | restart | check-env

ENV=${1:-staging}
ACTION=${2:-menu}

if [ "$ENV" = "staging" ]; then
    BACKEND_CONTAINER="backend-staging"
    DB_NAME="reiche_academy_staging"
    SEED_COMMAND="npm run seed"
else
    BACKEND_CONTAINER="backend-prod"
    DB_NAME="reiche_academy_prod"
    SEED_COMMAND="npm run seed"
fi

echo "=========================================="
echo "🔧 RECUPERAÇÃO DE AUTENTICAÇÃO - $ENV"
echo "=========================================="
echo ""

# Função: Resetar senha do admin manualmente
reset_admin_password() {
    echo "🔑 RESETANDO SENHA DO ADMIN"
    echo "----------------------------------------"
    echo "Gerando novo hash Argon2 para senha: Reiche@2024"
    
    # Executar script Node.js dentro do container para gerar hash
    NEW_HASH=$(docker compose -f docker-compose.vps.yml exec -T $BACKEND_CONTAINER node -e "
    const argon2 = require('argon2');
    (async () => {
        const hash = await argon2.hash('Reiche@2024');
        console.log(hash);
    })();
    ")
    
    if [ -z "$NEW_HASH" ]; then
        echo "❌ Falha ao gerar hash!"
        return 1
    fi
    
    echo "✅ Hash gerado: ${NEW_HASH:0:30}..."
    echo ""
    echo "Atualizando senha no banco..."
    
    docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche_admin -d $DB_NAME << EOSQL
UPDATE usuarios 
SET senha = '$NEW_HASH',
    ativo = true,
    "updatedAt" = NOW()
WHERE email = 'admin@reiche.com.br';
EOSQL
    
    echo "✅ Senha resetada com sucesso!"
    echo ""
    echo "Tente fazer login com:"
    echo "  Email: admin@reiche.com.br"
    echo "  Senha: Reiche@2024"
    echo ""
}

# Função: Executar seed novamente
reseed_database() {
    echo "🌱 REEXECUTANDO SEED"
    echo "----------------------------------------"
    read -p "⚠️ Isso vai APAGAR todos os dados! Continuar? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelado."
        return 0
    fi
    
    echo "Resetando banco de dados..."
    docker compose -f docker-compose.vps.yml exec -T $BACKEND_CONTAINER npx prisma migrate reset --force
    
    echo "✅ Seed executado com sucesso!"
    echo ""
}

# Função: Reiniciar backend
restart_backend() {
    echo "🔄 REINICIANDO BACKEND"
    echo "----------------------------------------"
    docker compose -f docker-compose.vps.yml restart $BACKEND_CONTAINER
    echo "Aguardando 5 segundos..."
    sleep 5
    
    # Verificar se subiu
    STATUS=$(docker compose -f docker-compose.vps.yml ps $BACKEND_CONTAINER --format json | jq -r '.State')
    if [ "$STATUS" = "running" ]; then
        echo "✅ Backend reiniciado com sucesso!"
    else
        echo "❌ Backend falhou ao reiniciar! Status: $STATUS"
        echo "Logs:"
        docker compose -f docker-compose.vps.yml logs --tail=20 $BACKEND_CONTAINER
    fi
    echo ""
}

# Função: Verificar variáveis de ambiente
check_environment() {
    echo "🔍 VERIFICANDO VARIÁVEIS DE AMBIENTE"
    echo "----------------------------------------"
    
    echo "Arquivo .env no VPS:"
    if [ -f .env ]; then
        echo "✅ .env existe"
        echo ""
        echo "Variáveis importantes (sem valores sensíveis):"
        grep -E "^(DATABASE_URL|JWT_SECRET|JWT_REFRESH_SECRET|NODE_ENV)=" .env | sed 's/=.*/=***/' || echo "⚠️ Algumas variáveis podem estar faltando"
    else
        echo "❌ .env NÃO existe!"
        echo "   Execute: cp .env.vps .env"
    fi
    echo ""
    
    echo "Variáveis carregadas no container:"
    docker compose -f docker-compose.vps.yml exec -T $BACKEND_CONTAINER printenv | grep -E "^(DB_|JWT_|NODE_ENV)" | sed 's/=.*/=***/'
    echo ""
}

# Função: Criar usuário admin de emergência
create_emergency_admin() {
    echo "🚨 CRIANDO ADMIN DE EMERGÊNCIA"
    echo "----------------------------------------"
    echo "Email: emergency@reiche.com.br"
    echo "Senha: Emergency@2024"
    echo ""
    
    # Gerar hash
    EMERGENCY_HASH=$(docker compose -f docker-compose.vps.yml exec -T $BACKEND_CONTAINER node -e "
    const argon2 = require('argon2');
    (async () => {
        const hash = await argon2.hash('Emergency@2024');
        console.log(hash);
    })();
    ")
    
    # Buscar ID do perfil ADMINISTRADOR
    PERFIL_ADMIN_ID=$(docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche_admin -d $DB_NAME -t -c "SELECT id FROM perfis WHERE codigo='ADMINISTRADOR' LIMIT 1;" | xargs)
    
    if [ -z "$PERFIL_ADMIN_ID" ]; then
        echo "❌ Perfil ADMINISTRADOR não encontrado no banco!"
        return 1
    fi
    
    # Criar usuário
    docker compose -f docker-compose.vps.yml exec -T postgres psql -U reiche_admin -d $DB_NAME << EOSQL
INSERT INTO usuarios (id, email, senha, nome, ativo, "perfilId", "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'emergency@reiche.com.br',
    '$EMERGENCY_HASH',
    'Admin Emergencial',
    true,
    '$PERFIL_ADMIN_ID',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET senha = EXCLUDED.senha,
    ativo = true,
    "updatedAt" = NOW();
EOSQL
    
    echo "✅ Admin de emergência criado/atualizado!"
    echo ""
    echo "Use para fazer login:"
    echo "  Email: emergency@reiche.com.br"
    echo "  Senha: Emergency@2024"
    echo ""
    echo "⚠️ IMPORTANTE: Delete este usuário após recuperar acesso!"
    echo ""
}

# Menu interativo
show_menu() {
    echo "Escolha uma ação:"
    echo ""
    echo "  1) 🔑 Resetar senha do admin@reiche.com.br"
    echo "  2) 🚨 Criar admin de emergência (emergency@reiche.com.br)"
    echo "  3) 🌱 Reexecutar seed (APAGA TODOS OS DADOS)"
    echo "  4) 🔄 Reiniciar backend"
    echo "  5) 🔍 Verificar variáveis de ambiente"
    echo "  6) 📊 Executar diagnóstico completo"
    echo "  7) 🚪 Sair"
    echo ""
    read -p "Digite o número da opção: " choice
    
    case $choice in
        1) reset_admin_password ;;
        2) create_emergency_admin ;;
        3) reseed_database ;;
        4) restart_backend ;;
        5) check_environment ;;
        6) bash scripts/diagnose-auth.sh $ENV ;;
        7) echo "Saindo..."; exit 0 ;;
        *) echo "Opção inválida!"; exit 1 ;;
    esac
}

# Executar ação
case $ACTION in
    reset-password) reset_admin_password ;;
    emergency-admin) create_emergency_admin ;;
    reseed) reseed_database ;;
    restart) restart_backend ;;
    check-env) check_environment ;;
    menu) show_menu ;;
    *) 
        echo "Uso: bash scripts/fix-auth.sh [staging|prod] [acao]"
        echo ""
        echo "Ações disponíveis:"
        echo "  reset-password   - Resetar senha do admin"
        echo "  emergency-admin  - Criar admin de emergência"
        echo "  reseed          - Reexecutar seed (apaga dados)"
        echo "  restart         - Reiniciar backend"
        echo "  check-env       - Verificar variáveis de ambiente"
        echo "  menu            - Menu interativo (padrão)"
        exit 1
        ;;
esac
