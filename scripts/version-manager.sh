#!/bin/bash

# ============================================================================
# Version Manager - Reiche Academy
# ============================================================================
# Gerencia versionamento semântico para deploys (Staging + Produção)
# Uso: bash version-manager.sh [get|bump|set] [patch|minor|major] [staging|prod]
# ============================================================================

set -e

VERSION_FILE="VERSION"
DEPLOY_METADATA_DIR="deploy-metadata"
ENV_FILE=".env"

# Garantir que diretório de metadata existe
mkdir -p "$DEPLOY_METADATA_DIR"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Função: Atualizar BUILD_VERSION no .env (CONSOLIDADO - Opção B)
# ============================================================================
update_build_version_in_env() {
    local new_version=$1
    
    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠️  Arquivo $ENV_FILE não encontrado, criando...${NC}"
        echo "BUILD_VERSION=\"${new_version}\"" >> "$ENV_FILE"
    else
        # Usar sed para substituir BUILD_VERSION (funciona em Linux/Mac)
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/BUILD_VERSION=.*/BUILD_VERSION=\"${new_version}\"/" "$ENV_FILE"
        else
            # Linux
            sed -i "s/BUILD_VERSION=.*/BUILD_VERSION=\"${new_version}\"/" "$ENV_FILE"
        fi
    fi
    echo -e "${GREEN}✅ .env atualizado com BUILD_VERSION=${new_version}${NC}"
}

# ============================================================================
# Função: Obter versão atual
# ============================================================================
get_version() {
    local env=$1
    local version_file="${VERSION_FILE}.${env}"
    
    if [ -f "$version_file" ]; then
        cat "$version_file"
    else
        echo "1.0.0"
    fi
}

# ============================================================================
# Função: Salvar versão
# ============================================================================
save_version() {
    local env=$1
    local version=$2
    local version_file="${VERSION_FILE}.${env}"
    
    echo "$version" > "$version_file"
    echo -e "${GREEN}✅ Versão $version salva em $version_file${NC}"
}

# ============================================================================
# Função: Incrementar versão (semver)
# ============================================================================
bump_version() {
    local current=$1
    local bump_type=$2
    
    # Separar major.minor.patch
    IFS='.' read -r major minor patch <<< "$current"
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}❌ Tipo inválido: $bump_type (use: major, minor, patch)${NC}"
            exit 1
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

# ============================================================================
# Função: Criar metadata do deploy
# ============================================================================
create_deploy_metadata() {
    local env=$1
    local version=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local git_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    local git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local git_commit_full=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local git_author=$(git log -1 --pretty=format:'%an' 2>/dev/null || echo "unknown")
    local metadata_file="${DEPLOY_METADATA_DIR}/deploy-${env}-${version}-${timestamp}.json"
    
    cat > "$metadata_file" <<EOF
{
  "version": "${version}",
  "environment": "${env}",
  "timestamp": "${timestamp}",
  "buildUrl": "Consolidated in .env (BUILD_VERSION)",
  "git": {
    "branch": "${git_branch}",
    "commit": "${git_commit}",
    "commitFull": "${git_commit_full}",
    "author": "${git_author}"
  },
  "system": {
    "user": "${USER:-unknown}",
    "hostname": "${HOSTNAME:-unknown}"
  }
}
EOF
    
    # Criar link simbólico para versão atual
    ln -sf "$(basename "$metadata_file")" "${DEPLOY_METADATA_DIR}/current-${env}.json"
    
    echo -e "${GREEN}✅ Metadata criada: $metadata_file${NC}"
    echo "$metadata_file"
}

# ============================================================================
# Função: Listar histórico de deploys
# ============================================================================
list_deploys() {
    local env=$1
    
    echo -e "${BLUE}📋 Histórico de deploys - ${env^^}${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -z "$env" ]; then
        pattern="${DEPLOY_METADATA_DIR}/deploy-*.json"
    else
        pattern="${DEPLOY_METADATA_DIR}/deploy-${env}-*.json"
    fi
    
    for file in $pattern; do
        if [ -f "$file" ] && [ ! -L "$file" ]; then
            local version=$(jq -r '.version' "$file")
            local timestamp=$(jq -r '.timestamp' "$file")
            local branch=$(jq -r '.git.branch' "$file")
            local commit=$(jq -r '.git.commit' "$file")
            local environment=$(jq -r '.environment' "$file")
            
            echo -e "${GREEN}v${version}${NC} | ${YELLOW}${environment}${NC} | ${timestamp} | ${branch}@${commit}"
        fi
    done | sort -r
}

# ============================================================================
# Função: Obter informações da versão atual
# ============================================================================
show_current_version() {
    local env=$1
    local current_file="${DEPLOY_METADATA_DIR}/current-${env}.json"
    
    if [ -f "$current_file" ]; then
        echo -e "${BLUE}📦 Versão atual - ${env^^}${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        jq '.' "$current_file"
    else
        echo -e "${YELLOW}⚠️  Nenhum deploy encontrado para ${env}${NC}"
    fi
}

# ============================================================================
# MAIN
# ============================================================================

ACTION=${1:-get}
PARAM2=${2:-patch}
PARAM3=${3:-staging}

case $ACTION in
    get)
        ENV=${2:-staging}
        VERSION=$(get_version "$ENV")
        echo "$VERSION"
        ;;
    
    bump)
        BUMP_TYPE=$PARAM2
        ENV=$PARAM3
        
        CURRENT=$(get_version "$ENV")
        NEW_VERSION=$(bump_version "$CURRENT" "$BUMP_TYPE")
        
        # Enviar logs para stderr (>&2) para não poluir stdout
        echo -e "${BLUE}📈 Incrementando versão - ${ENV^^}${NC}" >&2
        echo -e "  Atual:  ${YELLOW}v${CURRENT}${NC}" >&2
        echo -e "  Nova:   ${GREEN}v${NEW_VERSION}${NC}" >&2
        echo -e "  Tipo:   ${BUMP_TYPE}" >&2
        
        save_version "$ENV" "$NEW_VERSION" >&2
        update_build_version_in_env "$NEW_VERSION" >&2
        create_deploy_metadata "$ENV" "$NEW_VERSION" >&2
        
        # Apenas a versão vai para stdout (capturada pelo script)
        echo "$NEW_VERSION"
        ;;
    
    set)
        VERSION=$PARAM2
        ENV=$PARAM3
        
        # Validar formato semver
        if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}❌ Versão inválida: $VERSION (use formato: X.Y.Z)${NC}" >&2
            exit 1
        fi
        
        echo -e "${BLUE}🔧 Definindo versão - ${ENV^^}${NC}" >&2
        echo -e "  Versão: ${GREEN}v${VERSION}${NC}" >&2
        
        save_version "$ENV" "$VERSION" >&2
        update_build_version_in_env "$VERSION" >&2
        create_deploy_metadata "$ENV" "$VERSION" >&2
        
        echo "$VERSION"
        ;;
    
    current)
        ENV=${2:-staging}
        show_current_version "$ENV"
        ;;
    
    history)
        ENV=${2:-}
        list_deploys "$ENV"
        ;;
    
    *)
        echo -e "${RED}❌ Ação inválida: $ACTION${NC}"
        echo ""
        echo "Uso:"
        echo "  bash version-manager.sh get [staging|prod]"
        echo "  bash version-manager.sh bump [patch|minor|major] [staging|prod]"
        echo "  bash version-manager.sh set <version> [staging|prod]"
        echo "  bash version-manager.sh current [staging|prod]"
        echo "  bash version-manager.sh history [staging|prod]"
        echo ""
        echo "Exemplos:"
        echo "  bash version-manager.sh get staging          # Obter versão atual"
        echo "  bash version-manager.sh bump patch prod      # Incrementar patch (1.0.0 → 1.0.1)"
        echo "  bash version-manager.sh bump minor staging   # Incrementar minor (1.0.5 → 1.1.0)"
        echo "  bash version-manager.sh set 2.0.0 prod       # Definir versão específica"
        echo "  bash version-manager.sh current staging      # Mostrar info da versão atual"
        echo "  bash version-manager.sh history              # Listar todos deploys"
        exit 1
        ;;
esac


# Garantir que diretório de metadata existe
mkdir -p "$DEPLOY_METADATA_DIR"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Função: Obter versão atual
# ============================================================================
get_version() {
    local env=$1
    local version_file="${VERSION_FILE}.${env}"
    
    if [ -f "$version_file" ]; then
        cat "$version_file"
    else
        echo "1.0.0"
    fi
}

# ============================================================================
# Função: Salvar versão
# ============================================================================
save_version() {
    local env=$1
    local version=$2
    local version_file="${VERSION_FILE}.${env}"
    
    echo "$version" > "$version_file"
    echo -e "${GREEN}✅ Versão $version salva em $version_file${NC}"
}

# ============================================================================
# Função: Incrementar versão (semver)
# ============================================================================
bump_version() {
    local current=$1
    local bump_type=$2
    
    # Separar major.minor.patch
    IFS='.' read -r major minor patch <<< "$current"
    
    case $bump_type in
        major)
            major=$((major + 1))
            minor=0
            patch=0
            ;;
        minor)
            minor=$((minor + 1))
            patch=0
            ;;
        patch)
            patch=$((patch + 1))
            ;;
        *)
            echo -e "${RED}❌ Tipo inválido: $bump_type (use: major, minor, patch)${NC}"
            exit 1
            ;;
    esac
    
    echo "${major}.${minor}.${patch}"
}

# ============================================================================
# Função: Criar metadata do deploy
# ============================================================================
create_deploy_metadata() {
    local env=$1
    local version=$2
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local git_branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    local git_commit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    local git_commit_full=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
    local git_author=$(git log -1 --pretty=format:'%an' 2>/dev/null || echo "unknown")
    local metadata_file="${DEPLOY_METADATA_DIR}/deploy-${env}-${version}-${timestamp}.json"
    
    cat > "$metadata_file" <<EOF
{
  "version": "${version}",
  "environment": "${env}",
  "timestamp": "${timestamp}",
  "git": {
    "branch": "${git_branch}",
    "commit": "${git_commit}",
    "commitFull": "${git_commit_full}",
    "author": "${git_author}"
  },
  "system": {
    "user": "${USER:-unknown}",
    "hostname": "${HOSTNAME:-unknown}"
  }
}
EOF
    
    # Criar link simbólico para versão atual
    ln -sf "$(basename "$metadata_file")" "${DEPLOY_METADATA_DIR}/current-${env}.json"
    
    echo -e "${GREEN}✅ Metadata criada: $metadata_file${NC}"
    echo "$metadata_file"
}

# ============================================================================
# Função: Listar histórico de deploys
# ============================================================================
list_deploys() {
    local env=$1
    
    echo -e "${BLUE}📋 Histórico de deploys - ${env^^}${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -z "$env" ]; then
        pattern="${DEPLOY_METADATA_DIR}/deploy-*.json"
    else
        pattern="${DEPLOY_METADATA_DIR}/deploy-${env}-*.json"
    fi
    
    for file in $pattern; do
        if [ -f "$file" ] && [ ! -L "$file" ]; then
            local version=$(jq -r '.version' "$file")
            local timestamp=$(jq -r '.timestamp' "$file")
            local branch=$(jq -r '.git.branch' "$file")
            local commit=$(jq -r '.git.commit' "$file")
            local environment=$(jq -r '.environment' "$file")
            
            echo -e "${GREEN}v${version}${NC} | ${YELLOW}${environment}${NC} | ${timestamp} | ${branch}@${commit}"
        fi
    done | sort -r
}

# ============================================================================
# Função: Obter informações da versão atual
# ============================================================================
show_current_version() {
    local env=$1
    local current_file="${DEPLOY_METADATA_DIR}/current-${env}.json"
    
    if [ -f "$current_file" ]; then
        echo -e "${BLUE}📦 Versão atual - ${env^^}${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        jq '.' "$current_file"
    else
        echo -e "${YELLOW}⚠️  Nenhum deploy encontrado para ${env}${NC}"
    fi
}

# ============================================================================
# MAIN
# ============================================================================

ACTION=${1:-get}
PARAM2=${2:-patch}
PARAM3=${3:-staging}

case $ACTION in
    get)
        ENV=${2:-staging}
        VERSION=$(get_version "$ENV")
        echo "$VERSION"
        ;;
    
    bump)
        BUMP_TYPE=$PARAM2
        ENV=$PARAM3
        
        CURRENT=$(get_version "$ENV")
        NEW_VERSION=$(bump_version "$CURRENT" "$BUMP_TYPE")
        
        echo -e "${BLUE}📈 Incrementando versão - ${ENV^^}${NC}"
        echo -e "  Atual:  ${YELLOW}v${CURRENT}${NC}"
        echo -e "  Nova:   ${GREEN}v${NEW_VERSION}${NC}"
        echo -e "  Tipo:   ${BUMP_TYPE}"
        
        save_version "$ENV" "$NEW_VERSION"
        create_deploy_metadata "$ENV" "$NEW_VERSION"
        
        echo "$NEW_VERSION"
        ;;
    
    set)
        VERSION=$PARAM2
        ENV=$PARAM3
        
        # Validar formato semver
        if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
            echo -e "${RED}❌ Versão inválida: $VERSION (use formato: X.Y.Z)${NC}"
            exit 1
        fi
        
        echo -e "${BLUE}🔧 Definindo versão - ${ENV^^}${NC}"
        echo -e "  Versão: ${GREEN}v${VERSION}${NC}"
        
        save_version "$ENV" "$VERSION"
        create_deploy_metadata "$ENV" "$VERSION"
        
        echo "$VERSION"
        ;;
    
    current)
        ENV=${2:-staging}
        show_current_version "$ENV"
        ;;
    
    history)
        ENV=${2:-}
        list_deploys "$ENV"
        ;;
    
    *)
        echo -e "${RED}❌ Ação inválida: $ACTION${NC}"
        echo ""
        echo "Uso:"
        echo "  bash version-manager.sh get [staging|prod]"
        echo "  bash version-manager.sh bump [patch|minor|major] [staging|prod]"
        echo "  bash version-manager.sh set <version> [staging|prod]"
        echo "  bash version-manager.sh current [staging|prod]"
        echo "  bash version-manager.sh history [staging|prod]"
        echo ""
        echo "Exemplos:"
        echo "  bash version-manager.sh get staging          # Obter versão atual"
        echo "  bash version-manager.sh bump patch prod      # Incrementar patch (1.0.0 → 1.0.1)"
        echo "  bash version-manager.sh bump minor staging   # Incrementar minor (1.0.5 → 1.1.0)"
        echo "  bash version-manager.sh set 2.0.0 prod       # Definir versão específica"
        echo "  bash version-manager.sh current staging      # Mostrar info da versão atual"
        echo "  bash version-manager.sh history              # Listar todos deploys"
        exit 1
        ;;
esac
