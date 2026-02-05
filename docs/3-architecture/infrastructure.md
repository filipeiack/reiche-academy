# Arquitetura de Infraestrutura

**Última atualização:** 2026-02-04  
**Status:** Documentação consolidada (baseado em configurações existentes)

---

## Propósito deste Documento

Descrever a arquitetura de infraestrutura da aplicação Reiche Academy,
incluindo Docker, deployments, ambientes e configurações de CI/CD.

---

## 1. Visão Geral da Infraestrutura

### Arquitetura de Deploy

```
┌─────────────────────────────────────────────────────────────┐
│                    Ambiente Local                           │
│  Docker Compose → PostgreSQL + Redis + Backend + Frontend   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ambiente Produção                        │
│  VPS/Cloud → Docker Containers → Load Balancer → Banco    │
└─────────────────────────────────────────────────────────────┘
```

### Componentes de Infraestrutura

| Componente | Tecnologia | Finalidade | Configuração |
|------------|------------|------------|--------------|
| **Orquestração** | Docker Compose | Ambiente local/dev | `docker-compose.yml` |
| **Containerização** | Docker | Build e deploy | Multi-stage Dockerfiles |
| **Banco Principal** | PostgreSQL | Dados persistentes | Volume persistente |
| **Cache** | Redis | Cache de dados | Volume persistente |
| **Web Server** | NestJS | API REST | Porta 3000 |
| **SPA Server** | Angular CLI | Frontend dev | Porta 4200 |
| **Network** | Bridge | Comunicação containers | `reiche-network` |

---

## 2. Docker Compose Configurations

### Múltiplos Ambientes

O projeto utiliza diferentes arquivos Docker Compose para cada ambiente:

| Arquivo | Ambiente | Finalidade |
|---------|----------|------------|
| `docker-compose.yml` | Desenvolvimento completo | Backend + Frontend em containers |
| `docker-compose.dev.yml` | Desenvolvimento local | Apenas serviços (PostgreSQL + Redis) |
| `docker-compose.vps.yml` | Produção/Staging | Multi-databases no mesmo VPS |

### Arquivo Principal: `docker-compose.yml` (Desenvolvimento Completo)

**Serviços configurados:**

#### PostgreSQL Database
```yaml
postgres:
  image: postgres:16-alpine
  container_name: reiche-academy-postgres
  restart: unless-stopped
  environment:
    POSTGRES_USER: reiche
    POSTGRES_PASSWORD: reiche_dev_2024
    POSTGRES_DB: reiche_academy
    TZ: America/Sao_Paulo
  ports:
    - "5432:5432"
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./scripts/init-timezone.sql:/docker-entrypoint-initdb.d/01-timezone.sql
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U reiche"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - reiche-network
```

#### Redis Cache
```yaml
redis:
  image: redis:7-alpine
  container_name: reiche-academy-redis
  restart: unless-stopped
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  healthcheck:
    test: ["CMD", "redis-cli", "ping"]
    interval: 10s
    timeout: 5s
    retries: 5
  networks:
    - reiche-network
```

#### Backend API
```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile
    target: development
  container_name: reiche-academy-backend
  restart: unless-stopped
  environment:
    DATABASE_URL: postgresql://reiche:reiche_dev_2024@postgres:5432/reiche_academy?schema=public
    REDIS_URL: redis://redis:6379
    JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}
    JWT_ACCESS_EXPIRATION: ${JWT_ACCESS_EXPIRATION:-2h}
    JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:-your-super-secret-refresh-key-change-in-production}
    JWT_REFRESH_EXPIRATION: ${JWT_REFRESH_EXPIRATION:-1d}
    NODE_ENV: development
    PORT: 3000
    API_PREFIX: api
    CORS_ORIGIN: http://localhost:4200
    THROTTLE_TTL: 60
    THROTTLE_LIMIT: 10
    TZ: America/Sao_Paulo
  ports:
    - "3000:3000"
  volumes:
    - ./backend:/app
    - backend_node_modules:/app/node_modules
    - backend_dist:/app/dist
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
networks:
  reiche-network:
    driver: bridge
```

### Ambiente Desenvolvimento Local: `docker-compose.dev.yml`

**Uso:** Apenas serviços de infraestrutura para desenvolvimento local no Windows

**Serviços disponíveis:**
- PostgreSQL (porta 5432)
- Redis (porta 6379)

```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: reiche
      POSTGRES_PASSWORD: reiche_dev_2024
      POSTGRES_DB: reiche_academy
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-timezone.sql:/docker-entrypoint-initdb.d/01-timezone.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U reiche"]

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
```

**Como usar:**
```bash
# Apenas serviços (backend/frontend rodam localmente)
docker-compose -f docker-compose.dev.yml up -d

# Backend local
cd backend
npm run dev

# Frontend local  
cd frontend
npm start
```

### Ambiente Produção: `docker-compose.vps.yml`

**Uso:** Staging e Produção no mesmo VPS com bancos de dados separados

**Características:**
- Banco compartilhado com múltiplos databases
- Resource limits configurados
- Password protection para Redis
- Ports apenas para localhost

**PostgreSQL compartilhado:**
```yaml
postgres:
  environment:
    POSTGRES_USER: ${POSTGRES_USER}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
  ports:
    - "127.0.0.1:5432:5432"  # Apenas localhost
  volumes:
    - postgres_data:/var/lib/postgresql/data
    - ./scripts/init-databases.sh:/docker-entrypoint-initdb.d/init-databases.sh
    - ./backups:/backups
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 1G
```

**Redis com senha e limits:**
```yaml
redis:
  command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 256mb --maxmemory-policy allkeys-lru
  ports:
    - "127.0.0.1:6379:6379"  # Apenas localhost
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 256M
```

**Backend produção com staging:**
```yaml
backend-prod:
  environment:
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/reiche_academy_prod?schema=public
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/0
    JWT_SECRET: ${JWT_SECRET_PROD}
    NODE_ENV: production

backend-staging:
  environment:
    DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/reiche_academy_staging?schema=public
    REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379/1
    JWT_SECRET: ${JWT_SECRET_STAGING}
    NODE_ENV: staging
```

**Frontend produção com staging:**
```yaml
frontend-prod:
  environment:
    API_URL: https://api.reicheacademy.com
    NODE_ENV: production

frontend-staging:
  environment:
    API_URL: https://api-staging.reicheacademy.com
    NODE_ENV: staging
```

### Volumes e Rede

```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  backend_node_modules:
    driver: local
  backend_dist:
    driver: local
  frontend_node_modules:
    driver: local
  frontend_angular:
    driver: local

networks:
  reiche-network:
    driver: bridge
```

---

## 3. Dockerfiles

### Backend Dockerfile

**Multi-stage build:**

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Development
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 3: Build
FROM development AS build
RUN npm run build

# Stage 4: Production
FROM node:18-alpine AS production
WORKDIR /app

# Copy dist and node_modules
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs

EXPOSE 3000

CMD ["node", "dist/main"]
```

### Frontend Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Stage 2: Development
FROM node:18-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 3: Build
FROM development AS build
RUN npm run build

# Stage 4: Production (nginx)
FROM nginx:alpine AS production
COPY --from=build /app/dist/frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Config (Produção)

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Enable gzip compression
        gzip on;
        gzip_vary on;
        gzip_min_length 1024;
        gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

        # Handle Angular routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

---

## 4. Configurações de Ambiente

### Ambiente Desenvolvimento

**docker-compose.yml:**
- Bind mounts para hot reload
- Portas expostas para debug
- Environment variables com defaults
- Serviços com restart: unless-stopped

### Ambiente Produção

**docker-compose.prod.yml (exemplo):**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    networks:
      - app-network

  backend:
    image: reiche-academy/backend:latest
    restart: always
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      NODE_ENV: production
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  frontend:
    image: reiche-academy/frontend:latest
    restart: always
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

### Environment Variables

**.env.example:**
```bash
# Database
POSTGRES_USER=reiche
POSTGRES_PASSWORD=secure_password_change_me
POSTGRES_DB=reiche_academy

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Token Expiration
JWT_ACCESS_EXPIRATION=2h
JWT_REFRESH_EXPIRATION=1d

# Application
NODE_ENV=production
PORT=3000
API_PREFIX=api
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Timezone
TZ=America/Sao_Paulo
```

---

## 5. Scripts de Deploy

### Docker Scripts

**deploy.sh:**
```bash
#!/bin/bash

# Build images
docker build -t reiche-academy/backend:latest ./backend
docker build -t reiche-academy/frontend:latest ./frontend

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Start new containers
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migration:prod

# Health check
sleep 30
docker-compose -f docker-compose.prod.yml ps
```

**backup.sh:**
```bash
#!/bin/bash

# Create database backup
docker-compose exec postgres pg_dump -U reiche reiche_academy > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql

# Upload to cloud storage (exemplo)
# aws s3 cp backup_*.sql.gz s3://your-backup-bucket/
```

### Migration Scripts

**scripts/migrate-and-seed.sh:**
```bash
#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
until docker-compose exec postgres pg_isready -U reiche; do
  sleep 2
done

echo "Running migrations..."
docker-compose exec backend npm run migration:prod

echo "Running seed..."
docker-compose exec backend npm run seed

echo "Migration completed!"
```

---

## 6. CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/ci-cd.yml:**
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: backend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd backend
        npm ci
    
    - name: Run tests
      run: |
        cd backend
        npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run linting
      run: |
        cd backend
        npm run lint

  test-frontend:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm test -- --watch=false --browsers=ChromeHeadless
    
    - name: Build
      run: |
        cd frontend
        npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: |
        cd backend && npm ci
        cd ../frontend && npm ci
        cd ../ && npm ci
    
    - name: Start services
      run: |
        docker-compose up -d
        sleep 60
    
    - name: Run E2E tests
      run: |
        cd frontend
        npm run test:e2e
    
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: frontend/test-results/

  deploy:
    runs-on: ubuntu-latest
    needs: [e2e-tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        # Deploy commands
        echo "Deploying to production..."
        # ssh user@server "cd /path/to/app && ./deploy.sh"
```

---

## 7. Monitoramento e Logs

### Health Checks

**Backend:**
```typescript
// src/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService
  ) {}

  @Get()
  async check() {
    const db = await this.prisma.$queryRaw`SELECT 1`;
    const cache = await this.redis.ping();
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: db ? 'connected' : 'disconnected',
      cache: cache ? 'connected' : 'disconnected'
    };
  }
}
```

### Logging Strategy

**Docker logging:**
```yaml
# docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**Application logging:**
```typescript
// main.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('Bootstrap');

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});
```

---

## 8. Segurança de Infraestrutura

### Docker Security

**Non-root containers:**
```dockerfile
# Backend Dockerfile
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001
USER nestjs
```

**Image scanning:**
```bash
# Trivy vulnerability scan
trivy image reiche-academy/backend:latest
trivy image reiche-academy/frontend:latest
```

### Network Security

**Docker network isolation:**
```yaml
# Production network setup
networks:
  frontend-network:
    driver: bridge
    internal: true  # No external access
  
  backend-network:
    driver: bridge
  
  database-network:
    driver: bridge
    internal: true  # Database only accessible internally
```

### Secrets Management

**Docker secrets (production):**
```yaml
# docker-compose.prod.yml
secrets:
  jwt_secret:
    external: true
  db_password:
    external: true

services:
  backend:
    secrets:
      - jwt_secret
      - db_password
    environment:
      JWT_SECRET_FILE: /run/secrets/jwt_secret
      POSTGRES_PASSWORD_FILE: /run/secrets/db_password
```

---

## 9. Performance e Escalabilidade

### Database Optimization

**PostgreSQL tuning:**
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Application Scaling

**Horizontal scaling:**
```yaml
# docker-compose.scale.yml
services:
  backend:
    image: reiche-academy/backend:latest
    deploy:
      replicas: 3
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - backend
```

**Load Balancer (nginx):**
```nginx
upstream backend {
    server backend_1:3000;
    server backend_2:3000;
    server backend_3:3000;
}

server {
    listen 80;
    
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 10. Backup e Recuperação

### Database Backup Strategy

**Automated backups:**
```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="reiche_academy"

# Create backup
docker-compose exec -T postgres pg_dump -U reiche "$DB_NAME" > "$BACKUP_DIR/backup_$DATE.sql"

# Compress
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Remove old backups (keep last 7 days)
find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to cloud (optional)
# aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" s3://your-backup-bucket/
```

### Disaster Recovery

**Restore procedure:**
```bash
#!/bin/bash
# restore-database.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

# Stop application
docker-compose stop backend

# Restore database
gunzip -c "$BACKUP_FILE" | docker-compose exec -T postgres psql -U reiche reiche_academy

# Start application
docker-compose start backend

echo "Database restored from $BACKUP_FILE"
```

---

## 11. Manutenção e Operações

### Rotine Maintenance

**Weekly tasks:**
- Backup completo do banco
- Limpeza de logs antigos
- Update de segurança dos containers
- Monitoramento de espaço em disco
- Verificação de performance

**Monthly tasks:**
- Análise de vulnerabilidades
- Update de dependências
- Teste de restore de backup
- Otimização de consultas SQL

### Monitoring Stack

**Prometheus + Grafana setup:**
```yaml
# monitoring/docker-compose.yml
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
  
  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  grafana_data:
```

---

## 12. Limitações e Melhorias Futuras

### Limitações Atuais

- **CI/CD:** Pipeline básico, sem ambiente de staging
- **Monitoring:** Sem stack completo de monitoramento
- **Scaling:** Horizontal scaling não implementado
- **Security:** Secrets management básico
- **Backups:** Manuais, sem automação completa
- **Load Testing:** Sem testes de carga implementados

### Roadmap de Infraestrutura

**Curto prazo (1-2 meses):**
- Implementar ambiente de staging
- Configurar stack de monitoramento (Prometheus/Grafana)
- Automatizar backups com upload para cloud
- Implementar secrets management (Docker Secrets)

**Médio prazo (3-6 meses):**
- Implementar horizontal scaling com load balancer
- Adicionar testes de carga automatizados
- Configurar CI/CD completo com múltiplos ambientes
- Implementar logging estruturado centralizado

**Longo prazo (6+ meses):**
- Kubernetes para orquestração avançada
- Service mesh para comunicação entre serviços
- Auto-scaling baseado em métricas
- Multi-region deployment para alta disponibilidade

---

## 13. Troubleshooting Comum

### Problemas Freqüentes

**Container não inicia:**
```bash
# Verificar logs
docker-compose logs <service>

# Verificar status
docker-compose ps

# Verificar rede
docker network ls
docker network inspect reiche-network
```

**Database connection issues:**
```bash
# Verificar se PostgreSQL está healthy
docker-compose exec postgres pg_isready -U reiche

# Verificar variáveis de ambiente
docker-compose exec backend env | grep DATABASE_URL
```

**Volume issues:**
```bash
# Verificar volumes
docker volume ls

# Limpar volumes não utilizados
docker volume prune
```

### Debug Commands

**Backend debug:**
```bash
# Entrar no container backend
docker-compose exec backend sh

# Verificar processos
docker-compose exec backend ps aux

# Verificar conexões de rede
docker-compose exec backend netstat -tlnp
```

**Frontend debug:**
```bash
# Verificar build
docker-compose exec frontend ls -la /usr/share/nginx/html

# Verificar nginx config
docker-compose exec frontend cat /etc/nginx/nginx.conf
```

---

## 14. Documentos Relacionados

- **Visão Geral:** [overview.md](./overview.md)
- **Backend:** [backend.md](./backend.md) - Serviços e APIs
- **Frontend:** [frontend.md](./frontend.md) - Aplicação web
- **Dados:** [data.md](./data.md) - Schema e migrações
- **Convenções:** [../conventions/](../conventions/) - Padrões de infra

---

**Princípio:** Esta documentação reflete a configuração atual da infraestrutura. Para decisões arquitetônicas gerais, consulte [overview.md](./overview.md).