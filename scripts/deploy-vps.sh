#!/bin/bash

# ============================================================================
# Deploy Script para VPS - Reiche Academy (Staging + Produção)
# ============================================================================
# Uso: bash deploy-vps.sh [staging|prod]
# Executa em: root@76.13.66.10
# ============================================================================

set -e  # Para em qualquer erro

# Definir ambiente (padrão: staging)
ENVIRONMENT=${1:-staging}
VERSION_BUMP=${2:-patch}  # Tipo de bump: major, minor, patch

if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "prod" ]]; then
    echo "❌ Ambiente inválido: $ENVIRONMENT"
    echo "Uso: bash deploy-vps.sh [staging|prod] [patch|minor|major]"
    exit 1
fi

if [[ "$VERSION_BUMP" != "patch" && "$VERSION_BUMP" != "minor" && "$VERSION_BUMP" != "major" ]]; then
    echo "❌ Tipo de versionamento inválido: $VERSION_BUMP"
    echo "Uso: bash deploy-vps.sh [staging|prod] [patch|minor|major]"
    exit 1
fi

# Definir branch baseado no ambiente
if [ "$ENVIRONMENT" == "staging" ]; then
    BRANCH="staging"
    DOMAIN="staging.reicheacademy.cloud"
else
    BRANCH="main"
    DOMAIN="app.reicheacademy.cloud"
fi

echo "🚀 Iniciando Deploy do Reiche Academy no VPS..."
echo "📍 Ambiente: $ENVIRONMENT"
echo "🌿 Branch: $BRANCH"
echo "🌐 Domínio: $DOMAIN"

# Gerar nova versão
echo ""
echo "🏷️  Gerando versão de deploy..."
if [ -f "scripts/version-manager.sh" ]; then
    VERSION=$(bash scripts/version-manager.sh bump "$VERSION_BUMP" "$ENVIRONMENT")
    echo "📦 Versão: v$VERSION"
else
    VERSION="1.0.0"
    echo "⚠️  version-manager.sh não encontrado, usando versão padrão: v$VERSION"
fi

export DEPLOY_VERSION=$VERSION
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ============================================================================
# STEP 1: Atualizar sistema
# ============================================================================
echo ""
echo "📦 [1/8] Atualizando sistema..."
apt update && apt upgrade -y

# ============================================================================
# STEP 2: Instalar dependências
# ============================================================================
echo ""
echo "📦 [2/8] Instalando dependências..."
apt install -y git curl wget

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Verificar se Docker Compose está instalado
if ! command -v docker compose &> /dev/null; then
    echo "🐳 Docker Compose não encontrado. Instalando..."
    apt install -y docker-compose-plugin
fi

# ============================================================================
# STEP 3: Criar diretórios
# ============================================================================
echo ""
echo "📁 [3/8] Criando estrutura de diretórios..."
mkdir -p /opt/reiche-academy
mkdir -p /opt/reiche-academy/backups
mkdir -p /opt/reiche-academy/nginx/ssl

# ============================================================================
# STEP 4: Clonar repositório
# ============================================================================
echo ""
echo "📥 [4/8] Clonando repositório..."
cd /opt/reiche-academy

if [ -d ".git" ]; then
    echo "✅ Repositório já existe. Atualizando branch $BRANCH..."
    git fetch origin
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
else
    echo "📥 Clonando repositório pela primeira vez..."
    git clone -b "$BRANCH" https://github.com/filipeiack/reiche-academy.git .
fi

echo "✅ Usando branch: $(git branch --show-current)"

# ============================================================================
# STEP 5: Configurar variáveis de ambiente
# ============================================================================
echo ""
echo "🔧 [5/8] Configurando variáveis de ambiente..."

if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env a partir de .env.vps..."
    cp .env.vps .env
    
    echo ""
    echo "⚠️  IMPORTANTE: Edite o arquivo .env com suas senhas!"
    echo ""
    echo "PRÓXIMOS PASSOS:"
    echo "1. Edite o arquivo .env:"
    echo "   nano /opt/reiche-academy/.env"
    echo ""
    echo "2. Altere as seguintes variáveis:"
    echo "   - POSTGRES_PASSWORD (senha do banco)"
    echo "   - REDIS_PASSWORD (senha do Redis)"
    echo "   - JWT_SECRET_PROD (gerar com: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\")"
    echo "   - JWT_REFRESH_SECRET_PROD"
    echo "   - JWT_SECRET_STAGING"
    echo "   - JWT_REFRESH_SECRET_STAGING"
    echo ""
    echo "3. Depois execute novamente este script"
    echo ""
    exit 0
fi

# ============================================================================
# STEP 6: Build das imagens Docker (com versionamento)
# ============================================================================
echo ""
echo "🔨 [6/8] Fazendo build das imagens Docker ($ENVIRONMENT v$VERSION)..."
echo "⏳ Isto pode levar alguns minutos..."

# Definir tags de build
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

# Build com labels e tags de versão
if [ "$ENVIRONMENT" == "staging" ]; then
    docker compose -f docker-compose.vps.yml build --no-cache \
        --build-arg BUILD_VERSION="$VERSION" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        --build-arg ENVIRONMENT="staging" \
        backend-staging frontend-staging
    
    # Tagear imagens com versão
    docker tag reiche-academy-backend-staging:latest reiche-academy-backend-staging:$VERSION
    docker tag reiche-academy-frontend-staging:latest reiche-academy-frontend-staging:$VERSION
else
    docker compose -f docker-compose.vps.yml build --no-cache \
        --build-arg BUILD_VERSION="$VERSION" \
        --build-arg BUILD_DATE="$BUILD_DATE" \
        --build-arg GIT_COMMIT="$GIT_COMMIT" \
        --build-arg ENVIRONMENT="production" \
        backend-prod frontend-prod
    
    # Tagear imagens com versão
    docker tag reiche-academy-backend-prod:latest reiche-academy-backend-prod:$VERSION
    docker tag reiche-academy-frontend-prod:latest reiche-academy-frontend-prod:$VERSION
fi

# ============================================================================
# STEP 7: Iniciar serviços
# ============================================================================
echo ""
echo "▶️  [7/8] Iniciando serviço ($ENVIRONMENT)..."

if [ "$ENVIRONMENT" == "staging" ]; then
    echo "🧩 Usando nginx config de STAGING..."
    cp nginx/nginx.staging.conf nginx/nginx.conf
else
    echo "🧩 Usando nginx config de PRODUÇÃO..."
    cp nginx/nginx.prod.conf nginx/nginx.conf
fi

if [ "$ENVIRONMENT" == "staging" ]; then
    docker compose -f docker-compose.vps.yml up -d --no-deps postgres redis backend-staging frontend-staging nginx
else
    docker compose -f docker-compose.vps.yml up -d --no-deps postgres redis backend-prod frontend-prod nginx
fi

# Aguardar serviços estarem prontos
echo "⏳ Aguardando serviços iniciarem..."
sleep 30

# ============================================================================
# STEP 8: Migrations e Seeds
# ============================================================================
echo ""
echo "💾 [8/8] Executando migrations e seeds ($ENVIRONMENT)..."

if [ "$ENVIRONMENT" == "staging" ]; then
    echo ""
    echo "📊 Migrando banco de STAGING..."
    docker compose -f docker-compose.vps.yml exec -T backend-staging npm run migration:prod
    
    echo ""
    echo "🌱 Seeding dados em STAGING..."
    docker compose -f docker-compose.vps.yml exec -T backend-staging npm run seed
else
    echo ""
    echo "📊 Migrando banco de PRODUÇÃO..."
    docker compose -f docker-compose.vps.yml exec -T backend-prod npm run migration:prod
    
    echo ""
    echo "🌱 Seeding dados em PRODUÇÃO..."
    docker compose -f docker-compose.vps.yml exec -T backend-prod npm run seed
fi

# ============================================================================
# VERIFICAÇÃO FINAL
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deploy concluído com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo "📊 Status dos serviços:"
docker compose -f docker-compose.vps.yml ps

echo ""
echo "🔗 URLs de acesso:"
echo "  Produção:  http://app.reicheacademy.cloud (após DNS configurado)"
echo "  Staging:   http://staging.reicheacademy.cloud (após DNS configurado)"
echo ""
� Versão implantada: v$VERSION"
echo "🏷️  Imagens Docker:"
if [ "$ENVIRONMENT" == "staging" ]; then
    echo "   - reiche-academy-backend-staging:$VERSION"
    echo "   - reiche-academy-frontend-staging:$VERSION"
else
    echo "   - reiche-academy-backend-prod:$VERSION"
    echo "   - reiche-academy-frontend-prod:$VERSION"
fi
echo ""
echo "📝 Para fazer deploy do outro ambiente, execute:"
if [ "$ENVIRONMENT" == "staging" ]; then
    echo "   bash deploy-vps.sh prod [patch|minor|major]"
else
    echo "   bash deploy-vps.sh staging [patch|minor|major]"
fi
echo ""
echo "📋 Para ver histórico de deploys:"
echo "   bash scripts/version-manager.sh history $ENVIRONMENT"ho ""

echo ""
echo "✨ Deploy de $ENVIRONMENT concluído!"
echo ""
echo "📝 Para fazer deploy do outro ambiente, execute:"
if [ "$ENVIRONMENT" == "staging" ]; then
    echo "   bash deploy-vps.sh prod"
else
    echo "   bash deploy-vps.sh staging"
fi
