#!/bin/bash

# ============================================================================
# Maintenance Script - VPS Reiche Academy
# ============================================================================
# Uso: bash maintenance-vps.sh
# Monitora saúde do VPS e realiza manutenções rotineiras
# ============================================================================

set -e

VPS_DIR="/opt/reiche-academy"
BACKUP_DIR="$VPS_DIR/backups"
LOG_FILE="$VPS_DIR/maintenance.log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log com timestamp
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

# ============================================================================
# HEALTH CHECK
# ============================================================================
health_check() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}📊 HEALTH CHECK${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    
    cd "$VPS_DIR"
    
    # Verificar containers
    log "Verificando status dos containers..."
    if docker compose -f docker-compose.vps.yml ps | grep -q "Exit"; then
        log_error "Algum container está em estado EXIT!"
        docker compose -f docker-compose.vps.yml ps
        return 1
    fi
    log_success "Todos os containers estão rodando"
    
    # Verificar disco
    log "Verificando espaço em disco..."
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$DISK_USAGE" -gt 80 ]; then
        log_warning "Disco com ${DISK_USAGE}% de uso"
    else
        log_success "Disco OK: ${DISK_USAGE}% de uso"
    fi
    
    # Verificar RAM
    log "Verificando memória..."
    FREE_RAM=$(free -h | awk 'NR==2 {print $7}')
    log_success "RAM disponível: $FREE_RAM"
    
    # Health check do backend
    log "Verificando saúde do backend..."
    if curl -s http://localhost/api/health > /dev/null; then
        log_success "Backend respondendo corretamente"
    else
        log_error "Backend não está respondendo!"
        return 1
    fi
    
    # Verificar conectividade do banco
    log "Verificando conectividade do banco de dados..."
    if docker compose -f docker-compose.vps.yml exec -T postgres pg_isready -U reiche_admin > /dev/null; then
        log_success "PostgreSQL respondendo"
    else
        log_error "PostgreSQL não está respondendo!"
        return 1
    fi
    
    # Verificar Redis
    log "Verificando Redis..."
    REDIS_PASS=$(grep REDIS_PASSWORD .env | cut -d= -f2)
    if docker compose -f docker-compose.vps.yml exec -T redis redis-cli -a "$REDIS_PASS" ping > /dev/null 2>&1; then
        log_success "Redis respondendo"
    else
        log_error "Redis não está respondendo!"
        return 1
    fi
    
    echo -e "${GREEN}✅ Health check concluído - Tudo OK!${NC}"
}

# ============================================================================
# BACKUP DO BANCO DE DADOS
# ============================================================================
backup_database() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}💾 BACKUP DATABASE${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    
    cd "$VPS_DIR"
    
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    
    # Backup Produção
    log "Fazendo backup do banco PRODUÇÃO..."
    BACKUP_PROD="$BACKUP_DIR/prod_$TIMESTAMP.sql.gz"
    docker compose -f docker-compose.vps.yml exec -T postgres \
        pg_dump -U reiche_admin reiche_academy_prod | gzip > "$BACKUP_PROD"
    
    SIZE=$(du -h "$BACKUP_PROD" | cut -f1)
    log_success "Backup PRODUÇÃO criado: prod_$TIMESTAMP.sql.gz (Size: $SIZE)"
    
    # Backup Staging
    log "Fazendo backup do banco STAGING..."
    BACKUP_STAGING="$BACKUP_DIR/staging_$TIMESTAMP.sql.gz"
    docker compose -f docker-compose.vps.yml exec -T postgres \
        pg_dump -U reiche_admin reiche_academy_staging | gzip > "$BACKUP_STAGING"
    
    SIZE=$(du -h "$BACKUP_STAGING" | cut -f1)
    log_success "Backup STAGING criado: staging_$TIMESTAMP.sql.gz (Size: $SIZE)"
    
    # Limpar backups antigos (manter últimos 7 dias)
    log "Limpando backups antigos (manter últimos 7 dias)..."
    find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
    
    # Listar backups
    log "Backups disponíveis:"
    ls -lh "$BACKUP_DIR" | tail -5
    
    echo -e "${GREEN}✅ Backup concluído com sucesso!${NC}"
}

# ============================================================================
# VERIFICAR LOGS
# ============================================================================
check_logs() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}📋 ÚLTIMOS ERROS NOS LOGS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    
    cd "$VPS_DIR"
    
    log "Procurando por erros nos últimos 100 linhas de logs..."
    
    # Backend Produção
    echo ""
    echo -e "${YELLOW}Backend Produção:${NC}"
    docker compose -f docker-compose.vps.yml logs --tail=50 backend-prod | grep -i error || echo "Nenhum erro encontrado"
    
    # Backend Staging
    echo ""
    echo -e "${YELLOW}Backend Staging:${NC}"
    docker compose -f docker-compose.vps.yml logs --tail=50 backend-staging | grep -i error || echo "Nenhum erro encontrado"
    
    # Nginx
    echo ""
    echo -e "${YELLOW}Nginx:${NC}"
    docker compose -f docker-compose.vps.yml logs --tail=50 nginx | grep -i error || echo "Nenhum erro encontrado"
}

# ============================================================================
# UPDATE DO CÓDIGO
# ============================================================================
update_code() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}📥 ATUALIZAR CÓDIGO${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    
    cd "$VPS_DIR"
    
    log "Verificando atualizações do repositório..."
    git fetch origin main
    
    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)
    
    if [ "$LOCAL" != "$REMOTE" ]; then
        log_warning "Há atualizações disponíveis"
        log "Local:  $LOCAL"
        log "Remote: $REMOTE"
        
        read -p "Deseja atualizar e fazer redeploy? (s/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Ss]$ ]]; then
            log "Fazendo backup antes da atualização..."
            backup_database
            
            log "Atualizando código..."
            git reset --hard origin/main
            
            log "Fazendo rebuild dos containers..."
            docker compose -f docker-compose.vps.yml build
            
            log "Reiniciando serviços..."
            docker compose -f docker-compose.vps.yml up -d
            
            sleep 10
            
            log "Executando migrations..."
            docker compose -f docker-compose.vps.yml exec -T backend-prod npm run migration:prod
            docker compose -f docker-compose.vps.yml exec -T backend-staging npm run migration:prod
            
            log_success "Atualização concluída!"
        else
            log "Atualização cancelada pelo usuário"
        fi
    else
        log_success "Código está atualizado (no updates available)"
    fi
}

# ============================================================================
# RESTART SERVIÇOS
# ============================================================================
restart_services() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🔄 REINICIAR SERVIÇOS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    
    cd "$VPS_DIR"
    
    read -p "Qual serviço deseja reiniciar? (all/backend-prod/backend-staging/frontend-prod/frontend-staging/nginx/postgres/redis): " service
    
    case $service in
        all)
            log "Reiniciando todos os serviços..."
            docker compose -f docker-compose.vps.yml restart
            ;;
        *)
            log "Reiniciando $service..."
            docker compose -f docker-compose.vps.yml restart "$service"
            ;;
    esac
    
    sleep 5
    health_check
}

# ============================================================================
# MENU
# ============================================================================
show_menu() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo -e "${BLUE}🛠️  MAINTENANCE MENU - Reiche Academy VPS${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════${NC}"
    echo ""
    echo "1) 📊 Health Check"
    echo "2) 💾 Backup Database"
    echo "3) 📋 Verificar Logs"
    echo "4) 📥 Atualizar Código"
    echo "5) 🔄 Reiniciar Serviços"
    echo "6) 📊 Mostrar Status (docker ps)"
    echo "7) 📈 Mostrar Uso de Recursos (docker stats)"
    echo "8) 🚪 Sair"
    echo ""
    read -p "Escolha uma opção (1-8): " option
    
    case $option in
        1) health_check ;;
        2) backup_database ;;
        3) check_logs ;;
        4) update_code ;;
        5) restart_services ;;
        6) 
            echo ""
            docker compose -f docker-compose.vps.yml ps
            ;;
        7)
            echo ""
            docker stats --no-stream
            ;;
        8)
            echo "Saindo..."
            exit 0
            ;;
        *)
            log_error "Opção inválida!"
            ;;
    esac
    
    # Voltar ao menu
    read -p "Pressione ENTER para continuar..."
    clear
    show_menu
}

# ============================================================================
# MAIN
# ============================================================================
if [ ! -d "$VPS_DIR" ]; then
    log_error "Diretório $VPS_DIR não encontrado!"
    exit 1
fi

mkdir -p "$BACKUP_DIR"

# Se não houver argumentos, mostrar menu interativo
if [ $# -eq 0 ]; then
    show_menu
else
    # Executar comando específico
    case $1 in
        health) health_check ;;
        backup) backup_database ;;
        logs) check_logs ;;
        update) update_code ;;
        restart) restart_services ;;
        *) 
            echo "Uso: $0 {health|backup|logs|update|restart}"
            echo ""
            echo "Exemplos:"
            echo "  $0 health          - Health check"
            echo "  $0 backup          - Fazer backup"
            echo "  $0 logs            - Ver logs"
            echo "  $0 update          - Atualizar código"
            echo "  $0 restart         - Reiniciar serviços"
            echo "  $0                 - Menu interativo"
            exit 1
            ;;
    esac
fi
