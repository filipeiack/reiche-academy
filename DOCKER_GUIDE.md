# 🐳 Guia Docker - Reiche Academy

Este guia explica como usar Docker para desenvolvimento local do Reiche Academy.

## 📋 Pré-requisitos

1. **Instalar Docker Desktop para Windows**
   - Download: https://www.docker.com/products/docker-desktop/
   - Execute o instalador e siga as instruções
   - Reinicie o computador se solicitado
   - Abra o Docker Desktop e aguarde iniciar

2. **Verificar instalação**
   ```powershell
   docker --version
   docker-compose --version
   ```

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────┐
│          Docker Compose                      │
├─────────────────────────────────────────────┤
│                                              │
│  📦 PostgreSQL:5432  (Banco de Dados)       │
│  📦 Redis:6379       (Cache)                │
│  📦 Backend:3000     (API NestJS)           │
│  📦 Frontend:4200    (Angular)              │
│                                              │
└─────────────────────────────────────────────┘
```

## 🚀 Comandos Essenciais

### Primeira Vez - Setup Completo

```powershell
# 1. Subir todos os serviços
docker-compose up -d

# 2. Verificar se estão rodando
docker-compose ps

# 3. Executar migrations do banco
docker-compose exec backend npm run migration:dev

# 4. Executar seed (dados iniciais)
docker-compose exec backend npm run seed

# 5. Acessar aplicação
# Frontend: http://localhost:4200
# Backend API: http://localhost:3000/api
```

### Uso Diário

```powershell
# Iniciar tudo
docker-compose up -d

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Parar tudo
docker-compose stop

# Parar e remover containers
docker-compose down

# Parar e remover containers + volumes (APAGA BANCO!)
docker-compose down -v
```

### Desenvolvimento

```powershell
# Recarregar um serviço específico
docker-compose restart backend
docker-compose restart frontend

# Reconstruir imagens após mudanças no Dockerfile
docker-compose build
docker-compose up -d --build

# Acessar shell dentro do container
docker-compose exec backend sh
docker-compose exec postgres psql -U reiche -d reiche_academy

# Executar comandos no backend
docker-compose exec backend npm run migration:dev
docker-compose exec backend npm run prisma:studio
docker-compose exec backend npm run seed

# Executar comandos no frontend
docker-compose exec frontend ng generate component exemplo
```

### Banco de Dados

```powershell
# Acessar PostgreSQL
docker-compose exec postgres psql -U reiche -d reiche_academy

# Dentro do psql:
\dt              # Listar tabelas
\d usuarios      # Ver estrutura da tabela
SELECT * FROM usuarios;
\q               # Sair

# Backup do banco
docker-compose exec postgres pg_dump -U reiche reiche_academy > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U reiche reiche_academy < backup.sql

# Reset completo (CUIDADO!)
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run migration:dev
docker-compose exec backend npm run seed
```

### Troubleshooting

```powershell
# Ver status de todos containers
docker-compose ps

# Ver uso de recursos
docker stats

# Limpar tudo (containers parados, imagens não usadas)
docker system prune -a

# Ver logs de erro
docker-compose logs backend | Select-String -Pattern "error"

# Verificar saúde dos containers
docker-compose ps
# Status deve ser "Up" e "healthy"

# Recriar um serviço do zero
docker-compose stop backend
docker-compose rm backend
docker-compose up -d backend
```

## 🔄 Migração do PostgreSQL Local para Docker

### 1. Backup do banco local

```powershell
# No PowerShell (Windows com PostgreSQL local instalado)
pg_dump -U reiche -d reiche_academy > backup_local.sql
```

### 2. Parar PostgreSQL local (opcional)

Para evitar conflito de porta 5432:

- **Opção A**: Parar o serviço Windows
  - Windows + R → `services.msc`
  - Localizar "PostgreSQL"
  - Botão direito → Parar

- **Opção B**: Mudar porta do Docker
  No `docker-compose.yml`, altere:
  ```yaml
  ports:
    - "5433:5432"  # Use 5433 no host
  ```
  E ajuste `DATABASE_URL` em `.env`

### 3. Restaurar no Docker

```powershell
# Subir Docker
docker-compose up -d postgres

# Aguardar banco ficar pronto
docker-compose logs postgres | Select-String -Pattern "ready"

# Restaurar backup
Get-Content backup_local.sql | docker-compose exec -T postgres psql -U reiche -d reiche_academy
```

### 4. Atualizar conexão do backend

Se estiver rodando backend FORA do Docker:

```env
# backend/.env
DATABASE_URL="postgresql://reiche:reiche_dev_2024@localhost:5432/reiche_academy?schema=public"
```

Se estiver rodando backend DENTRO do Docker (recomendado):

```env
# backend/.env (ou use variáveis do docker-compose.yml)
DATABASE_URL="postgresql://reiche:reiche_dev_2024@postgres:5432/reiche_academy?schema=public"
```

## 📊 Comparação: Local vs Docker

| Aspecto | PostgreSQL Local | PostgreSQL Docker |
|---------|------------------|-------------------|
| **Instalação** | Instalador Windows | `docker-compose up` |
| **Recursos** | Sempre rodando | Liga/desliga facilmente |
| **Múltiplas versões** | Difícil | Fácil (imagens diferentes) |
| **Compartilhamento** | Difícil replicar | `docker-compose.yml` compartilhável |
| **Reset** | Manual | `docker-compose down -v` |
| **Backup** | `pg_dump` | `pg_dump` ou volume copy |
| **Portabilidade** | Windows only | Windows/Mac/Linux |

## 🎯 Modos de Desenvolvimento

### Modo 1: Tudo no Docker (Recomendado para iniciantes)

```powershell
docker-compose up -d
# Backend, Frontend, Banco, Redis - tudo isolado
```

**Prós**: Ambiente completo, isolado, fácil compartilhar  
**Contras**: Hot reload pode ser mais lento

### Modo 2: Híbrido (Serviços no Docker, código local)

```powershell
# Apenas banco e redis no Docker
docker-compose up -d postgres redis

# Backend e Frontend rodando localmente
cd backend && npm run dev
cd frontend && ng serve
```

**Prós**: Hot reload instantâneo, debug mais fácil  
**Contras**: Precisa Node.js local instalado

### Modo 3: Desenvolvimento + Produção

```yaml
# Usar target diferente no docker-compose
docker-compose -f docker-compose.yml up -d          # Desenvolvimento
docker-compose -f docker-compose.prod.yml up -d     # Produção
```

## 🔐 Segurança

- **Nunca commite** `.env` com secrets reais
- Em produção, use secrets do Docker: `docker secret create`
- Mude todas as senhas padrão
- Use variáveis de ambiente específicas por ambiente

## 📚 Recursos

- [Docker Docs](https://docs.docker.com/)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Redis Docker Image](https://hub.docker.com/_/redis)

## ❓ FAQ

**P: Posso usar Docker e PostgreSQL local ao mesmo tempo?**  
R: Sim, mas mude a porta no `docker-compose.yml` (ex: 5433:5432)

**P: Os dados persistem após `docker-compose down`?**  
R: Sim, a menos que use `docker-compose down -v` (que remove volumes)

**P: Como ver os dados do banco?**  
R: Use Prisma Studio: `docker-compose exec backend npm run prisma:studio`

**P: O que fazer se a porta 5432 já está em uso?**  
R: Pare o PostgreSQL local ou mude a porta no docker-compose.yml

**P: Como debugar o código no Docker?**  
R: Exponha a porta de debug (9229) e conecte o VS Code. Ou use modo híbrido.
