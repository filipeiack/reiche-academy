# Variáveis de Ambiente - Reiche Academy

Este documento descreve todas as variáveis de ambiente utilizadas no projeto Reiche Academy.

## 📋 Índice

- [Arquivos de Ambiente](#arquivos-de-ambiente)
- [Desenvolvimento Local](#desenvolvimento-local)
- [Deploy VPS](#deploy-vps)
- [Variáveis Backend](#variáveis-backend)
- [Segurança](#segurança)

## 📁 Arquivos de Ambiente

O projeto possui três templates de ambiente versionados no git:

| Arquivo | Uso | Cópia para |
|---------|-----|------------|
| `.env.example` | Desenvolvimento local (root) | `.env` |
| `backend/.env.example` | Desenvolvimento backend standalone | `backend/.env` |
| `.env.vps.example` | Deploy em VPS (prod + staging) | `.env.vps` |

**⚠️ IMPORTANTE**: Os arquivos `.env`, `.env.vps` e `.env.*.local` são bloqueados pelo `.gitignore` e **NUNCA** devem ser commitados.

## 🔧 Desenvolvimento Local

### Passo a Passo

```bash
# 1. Copiar templates
cp .env.example .env
cp backend/.env.example backend/.env

# 2. (Opcional) Editar valores se necessário
# Os valores padrão funcionam out-of-the-box

# 3. Iniciar serviços
docker-compose up -d
```

### Variáveis Utilizadas (docker-compose.yml)

- `JWT_SECRET` - Chave secreta para tokens JWT access (default disponível)
- `JWT_ACCESS_EXPIRATION` - Tempo de expiração do token access (default: 2h)
- `JWT_REFRESH_SECRET` - Chave secreta para tokens JWT refresh (default disponível)
- `JWT_REFRESH_EXPIRATION` - Tempo de expiração do token refresh (default: 1d)
- `AUTO_ASSOCIAR_PILARES_PADRAO` - Auto-associar pilares ao criar empresa (default: true)

### Backend Standalone (sem Docker)

Se você rodar o backend fora do Docker:

```bash
cd backend
cp .env.example .env

# Edite backend/.env e defina:
DATABASE_URL=postgresql://reiche:reiche_dev_2024@localhost:5432/reiche_academy?schema=public
REDIS_URL=redis://localhost:6379
```

## 🚀 Deploy VPS

### Passo a Passo

```bash
# 1. Copiar template VPS
cp .env.vps.example .env.vps

# 2. Editar .env.vps com suas credenciais
nano .env.vps  # ou vim, code, etc.

# 3. Deploy
docker compose -f docker-compose.vps.yml up -d
```

### Variáveis Obrigatórias

**⚠️ ALTERE ESTAS VARIÁVEIS ANTES DO DEPLOY:**

#### Database
- `POSTGRES_USER` - Usuário PostgreSQL (exemplo: reiche)
- `POSTGRES_PASSWORD` - **Senha forte** para PostgreSQL

#### Redis
- `REDIS_PASSWORD` - **Senha forte** para Redis

#### JWT - Produção
- `JWT_SECRET_PROD` - Chave secreta JWT access (gerar com `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET_PROD` - Chave secreta JWT refresh (gerar com `openssl rand -base64 32`)

#### JWT - Staging
- `JWT_SECRET_STAGING` - Chave secreta JWT access (gerar com `openssl rand -base64 32`)
- `JWT_REFRESH_SECRET_STAGING` - Chave secreta JWT refresh (gerar com `openssl rand -base64 32`)

#### CORS
- `CORS_ORIGIN_PROD` - URL do frontend produção (exemplo: https://reiche.seudominio.com.br)
- `CORS_ORIGIN_STAGING` - URL do frontend staging (exemplo: https://staging.reiche.seudominio.com.br)

### Variáveis Opcionais (com defaults)

- `JWT_ACCESS_EXPIRATION` - Tempo expiração token access (default: 1h em prod)
- `JWT_REFRESH_EXPIRATION` - Tempo expiração token refresh (default: 7d em prod)
- `THROTTLE_TTL` - Rate limiting TTL em segundos (default: 60)
- `THROTTLE_LIMIT` - Rate limiting max requests (default: 100)
- `TZ` - Timezone (default: America/Sao_Paulo)
- `AUTO_ASSOCIAR_PILARES_PADRAO` - Auto-associar pilares (default: true)

## 📖 Variáveis Backend

### Database

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | Connection string PostgreSQL | `postgresql://user:pass@host:5432/db?schema=public` |

### Cache

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `REDIS_URL` | Connection string Redis | `redis://localhost:6379` ou `redis://:password@host:6379/0` |

### JWT Authentication

| Variável | Descrição | Default Dev | Produção |
|----------|-----------|-------------|----------|
| `JWT_SECRET` | Secret para access tokens | Tem default | **OBRIGATÓRIO** |
| `JWT_ACCESS_EXPIRATION` | Expiração access token | 2h | 1h |
| `JWT_REFRESH_SECRET` | Secret para refresh tokens | Tem default | **OBRIGATÓRIO** |
| `JWT_REFRESH_EXPIRATION` | Expiração refresh token | 1d | 7d |

**Formatos de tempo**: `15m`, `1h`, `2h`, `1d`, `7d`, `30d`

### Server

| Variável | Descrição | Default |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente Node | development |
| `PORT` | Porta do servidor | 3000 |
| `HOST` | Host binding | 0.0.0.0 (Docker) ou localhost |
| `API_PREFIX` | Prefixo das rotas | api |

### CORS

| Variável | Descrição | Default Dev |
|----------|-----------|-------------|
| `CORS_ORIGIN` | Origens permitidas | http://localhost:4200 |

### Rate Limiting

| Variável | Descrição | Default |
|----------|-----------|---------|
| `THROTTLE_TTL` | Janela de tempo (segundos) | 60 |
| `THROTTLE_LIMIT` | Max requests por janela | 10 (dev) / 100 (prod) |

### Business Rules

| Variável | Descrição | Default |
|----------|-----------|---------|
| `AUTO_ASSOCIAR_PILARES_PADRAO` | Auto-associar pilares ao criar empresa | true |

### Timezone

| Variável | Descrição | Default |
|----------|-----------|---------|
| `TZ` | Timezone da aplicação | America/Sao_Paulo |

## 🔐 Segurança

### Geração de Secrets

Use OpenSSL para gerar secrets fortes:

```bash
# Gerar um secret JWT
openssl rand -base64 32

# Gerar múltiplos (copiar e colar no .env.vps)
echo "JWT_SECRET_PROD=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET_PROD=$(openssl rand -base64 32)"
echo "JWT_SECRET_STAGING=$(openssl rand -base64 32)"
echo "JWT_REFRESH_SECRET_STAGING=$(openssl rand -base64 32)"
```

### Checklist de Segurança

Antes de fazer deploy em produção:

- [ ] Todos os secrets foram alterados dos valores de exemplo
- [ ] Senhas PostgreSQL e Redis são fortes (mínimo 16 caracteres)
- [ ] JWT secrets são únicos e gerados aleatoriamente
- [ ] JWT secrets de produção ≠ JWT secrets de staging
- [ ] CORS_ORIGIN aponta para o domínio correto (HTTPS)
- [ ] Arquivo `.env.vps` está no `.gitignore`
- [ ] Arquivo `.env.vps` tem permissões restritas no servidor (chmod 600)

### Rotação de Secrets

Para rotacionar secrets em produção:

1. **Gerar novos secrets** (nunca reutilize)
2. **Atualizar .env.vps** com novos valores
3. **Fazer deploy** com `docker compose -f docker-compose.vps.yml up -d`
4. **Revogar tokens antigos** (todos usuários precisarão fazer login novamente)

### Backup de Variáveis

**NUNCA** faça commit de `.env` ou `.env.vps` no git.

Para backup seguro:

1. Use um **gerenciador de senhas** (1Password, LastPass, Bitwarden)
2. Ou armazene em **vault** (HashiCorp Vault, AWS Secrets Manager)
3. Ou criptografe com **GPG** antes de armazenar

```bash
# Exemplo: backup criptografado com GPG
gpg --symmetric --cipher-algo AES256 .env.vps
# Gera .env.vps.gpg (este pode ser salvo em backup)

# Para restaurar:
gpg --decrypt .env.vps.gpg > .env.vps
```

## 🔍 Troubleshooting

### Backend não conecta no PostgreSQL

Verifique:
- `DATABASE_URL` está correto
- PostgreSQL está rodando (`docker ps`)
- Porta 5432 está acessível
- Credenciais estão corretas

### JWT tokens inválidos

Verifique:
- `JWT_SECRET` e `JWT_REFRESH_SECRET` estão definidos
- Secrets não foram alterados após login (invalidaria tokens)
- Tokens não expiraram

### CORS errors no frontend

Verifique:
- `CORS_ORIGIN` inclui a URL do frontend
- Não tem trailing slash na URL
- Protocolo correto (http/https)

### Rate limiting muito agressivo

Ajuste:
- `THROTTLE_TTL` - aumentar janela de tempo
- `THROTTLE_LIMIT` - aumentar limite de requests

## 📚 Referências

- [Docker Compose - Environment Variables](https://docs.docker.com/compose/environment-variables/)
- [NestJS - Configuration](https://docs.nestjs.com/techniques/configuration)
- [Prisma - Environment Variables](https://www.prisma.io/docs/concepts/more/environment-variables)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
