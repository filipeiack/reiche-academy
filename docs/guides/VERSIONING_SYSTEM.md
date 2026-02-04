# Sistema de Versionamento de Deploys - Reiche Academy

## Visão Geral

Este sistema implementa versionamento semântico (SemVer) para deploys no VPS, permitindo rastreamento completo de cada pacote implantado em produção e staging.

## Arquitetura

### Componentes

1. **version-manager.sh**: Script central de gerenciamento de versões
2. **VERSION.{env}**: Arquivos de versão atual por ambiente
3. **deploy-metadata/**: Histórico completo de deploys em JSON
4. **Docker Labels**: Metadata embutida nas imagens
5. **Endpoint /version**: API para consulta de versão em runtime

### Versionamento Semântico

Formato: `MAJOR.MINOR.PATCH`

- **MAJOR**: Mudanças incompatíveis (breaking changes)
- **MINOR**: Novas features (compatíveis)
- **PATCH**: Correções de bugs

Exemplo: `1.2.3` → `2.0.0` (breaking) | `1.3.0` (feature) | `1.2.4` (bugfix)

### Ambientes Independentes

Cada ambiente tem versionamento **independente**:

```
VERSION.staging  → 1.5.3
VERSION.prod     → 1.4.2
```

Staging pode estar em versões maiores durante testes.

## Uso

### 1. Deploy Normal (Auto-Incremento)

```bash
# Staging (default: patch bump)
bash scripts/deploy-vps.sh staging patch

# Produção (minor bump)
bash scripts/deploy-vps.sh prod minor

# Produção (major bump)
bash scripts/deploy-vps.sh prod major
```

**Tipos de bump:**
- `patch`: 1.0.0 → 1.0.1 (correções)
- `minor`: 1.0.5 → 1.1.0 (features)
- `major`: 1.9.2 → 2.0.0 (breaking changes)

### 2. Gerenciamento Manual de Versões

```bash
# Obter versão atual
bash scripts/version-manager.sh get staging
# Output: 1.0.0

# Incrementar versão manualmente
bash scripts/version-manager.sh bump patch staging
# Output: 1.0.1

# Definir versão específica
bash scripts/version-manager.sh set 2.0.0 prod
# Output: 2.0.0

# Ver informações da versão atual
bash scripts/version-manager.sh current staging
# Output: JSON com metadata completa

# Listar histórico de deploys
bash scripts/version-manager.sh history staging
bash scripts/version-manager.sh history          # Todos ambientes
```

### 3. Consultar Versão em Runtime

**Backend API:**

```bash
curl http://app.reicheacademy.cloud/api/version
```

**Resposta:**
```json
{
  "version": "1.2.3",
  "buildDate": "2026-02-04T15:30:00Z",
  "commit": "a3f2c1d",
  "environment": "production",
  "uptime": 86400,
  "timestamp": "2026-02-05T15:30:00Z"
}
```

**Frontend (arquivo estático):**

```bash
curl http://app.reicheacademy.cloud/version.json
```

**Resposta:**
```json
{
  "version": "1.2.3",
  "buildDate": "2026-02-04T15:30:00Z",
  "commit": "a3f2c1d",
  "environment": "production"
}
```

### 4. Inspecionar Imagens Docker

```bash
# Ver labels da imagem
docker inspect reiche-academy-backend-prod:1.2.3 | jq '.[0].Config.Labels'

# Output:
{
  "org.opencontainers.image.title": "Reiche Academy Backend",
  "org.opencontainers.image.version": "1.2.3",
  "org.opencontainers.image.created": "2026-02-04T15:30:00Z",
  "org.opencontainers.image.revision": "a3f2c1d",
  "org.opencontainers.image.environment": "production"
}
```

## Estrutura de Arquivos

```
reiche-academy/
├── VERSION.staging           # Versão atual em staging
├── VERSION.prod              # Versão atual em produção
├── deploy-metadata/          # Histórico de deploys
│   ├── deploy-staging-1.0.0-2026-02-04T10:00:00Z.json
│   ├── deploy-staging-1.0.1-2026-02-04T11:00:00Z.json
│   ├── deploy-prod-1.0.0-2026-02-04T12:00:00Z.json
│   ├── current-staging.json  # Link simbólico para última versão
│   └── current-prod.json     # Link simbólico para última versão
└── scripts/
    ├── version-manager.sh    # Gerenciador de versões
    └── deploy-vps.sh         # Script de deploy (modificado)
```

### Metadata de Deploy (JSON)

Cada deploy gera um arquivo JSON completo:

```json
{
  "version": "1.2.3",
  "environment": "production",
  "timestamp": "2026-02-04T15:30:00Z",
  "git": {
    "branch": "main",
    "commit": "a3f2c1d",
    "commitFull": "a3f2c1d8e9f0a1b2c3d4e5f6a7b8c9d0",
    "author": "Felipe Iack"
  },
  "system": {
    "user": "root",
    "hostname": "vps-reiche"
  }
}
```

## Workflow Recomendado

### Feature Release (Minor)

```bash
# 1. Desenvolver feature em staging
bash scripts/deploy-vps.sh staging patch  # Testes iterativos

# 2. Quando aprovado, promover para produção
bash scripts/deploy-vps.sh prod minor     # Nova feature
```

### Bugfix (Patch)

```bash
# 1. Testar fix em staging
bash scripts/deploy-vps.sh staging patch

# 2. Deploy em produção
bash scripts/deploy-vps.sh prod patch
```

### Breaking Change (Major)

```bash
# 1. Testar extensivamente em staging
bash scripts/deploy-vps.sh staging major

# 2. Após validação completa
bash scripts/deploy-vps.sh prod major
```

## Diferenciação de Pacotes

### Por Versão

```bash
# Staging está em testes avançados
VERSION.staging → 2.0.0-beta

# Produção está estável
VERSION.prod → 1.5.3
```

### Por Tags Docker

```bash
# Imagens staging
reiche-academy-backend-staging:2.0.0
reiche-academy-frontend-staging:2.0.0

# Imagens produção
reiche-academy-backend-prod:1.5.3
reiche-academy-frontend-prod:1.5.3
```

### Por Labels

```bash
# Staging
docker inspect backend-staging | grep environment
# "org.opencontainers.image.environment": "staging"

# Produção
docker inspect backend-prod | grep environment
# "org.opencontainers.image.environment": "production"
```

## Auditoria e Rastreamento

### Verificar Versão Implantada

```bash
# No servidor VPS
docker ps --format "table {{.Names}}\t{{.Image}}"

# Output:
reiche-backend-prod    reiche-academy-backend-prod:1.2.3
reiche-frontend-prod   reiche-academy-frontend-prod:1.2.3
```

### Rollback para Versão Anterior

```bash
# 1. Verificar versões disponíveis
docker images | grep reiche-academy-backend-prod

# 2. Editar docker-compose.vps.yml para usar tag específica
# backend-prod:
#   image: reiche-academy-backend-prod:1.2.2

# 3. Restart serviço
docker compose -f docker-compose.vps.yml up -d backend-prod
```

### Comparar Deploys

```bash
# Ver histórico
bash scripts/version-manager.sh history prod

# Output:
v1.2.3 | production | 2026-02-04T15:30:00Z | main@a3f2c1d
v1.2.2 | production | 2026-02-03T10:00:00Z | main@b1c2d3e
v1.2.1 | production | 2026-02-01T08:00:00Z | main@c4d5e6f

# Ver detalhes de um deploy específico
cat deploy-metadata/deploy-prod-1.2.3-2026-02-04T15:30:00Z.json | jq '.'
```

## Troubleshooting

### Versão não incrementa automaticamente

**Problema:** Deploy executa mas versão permanece a mesma

**Solução:**
```bash
# Verificar se version-manager.sh é executável
chmod +x scripts/version-manager.sh

# Executar manualmente
bash scripts/version-manager.sh bump patch staging
```

### Metadata não é criada

**Problema:** Diretório `deploy-metadata/` não existe

**Solução:**
```bash
mkdir -p deploy-metadata
```

### Tags Docker não aparecem

**Problema:** Imagens não têm tags de versão

**Solução:**
```bash
# Verificar logs do build
docker compose -f docker-compose.vps.yml build --no-cache backend-prod

# Tags são criadas automaticamente após build
docker images | grep reiche-academy
```

### Endpoint /version retorna "dev"

**Problema:** Variáveis de ambiente não foram passadas

**Solução:**

Verificar que docker-compose.vps.yml passa as env vars:

```yaml
environment:
  BUILD_VERSION: ${DEPLOY_VERSION}
  BUILD_DATE: ${BUILD_DATE}
  GIT_COMMIT: ${GIT_COMMIT}
```

## Integração com CI/CD (Futuro)

Para automação com GitHub Actions:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Bump version
        run: |
          VERSION=$(bash scripts/version-manager.sh bump minor prod)
          echo "VERSION=$VERSION" >> $GITHUB_ENV
      
      - name: Deploy to VPS
        run: |
          ssh vps "cd /opt/reiche-academy && bash deploy-vps.sh prod minor"
```

## Convenções

### Quando usar cada tipo de bump

| Mudança | Tipo | Exemplo |
|---------|------|---------|
| Hotfix crítico | `patch` | 1.2.3 → 1.2.4 |
| Correção de bug | `patch` | 1.2.3 → 1.2.4 |
| Nova feature (compatível) | `minor` | 1.2.3 → 1.3.0 |
| Melhoria de UX | `minor` | 1.2.3 → 1.3.0 |
| Breaking change na API | `major` | 1.9.3 → 2.0.0 |
| Mudança de schema DB incompatível | `major` | 1.9.3 → 2.0.0 |

### Nomear versões específicas

```bash
# Beta/RC antes de major release
bash scripts/version-manager.sh set 2.0.0-beta.1 staging
bash scripts/version-manager.sh set 2.0.0-rc.1 staging
bash scripts/version-manager.sh set 2.0.0 prod  # Final release
```

## Benefícios

✅ **Rastreabilidade completa**: Saber exatamente o que está em cada ambiente  
✅ **Rollback seguro**: Tags Docker permitem voltar a qualquer versão  
✅ **Auditoria**: Histórico completo em JSON  
✅ **Diferenciação clara**: Staging vs Produção  
✅ **Metadata embutida**: Informações acessíveis em runtime  
✅ **Versionamento semântico**: Comunicação clara de mudanças  

## Referências

- [Semantic Versioning 2.0.0](https://semver.org/)
- [OCI Image Spec - Annotations](https://github.com/opencontainers/image-spec/blob/main/annotations.md)
- [Docker Image Labels](https://docs.docker.com/config/labels-custom-metadata/)

---

**Versão deste documento:** 1.0  
**Última atualização:** 2026-02-04
