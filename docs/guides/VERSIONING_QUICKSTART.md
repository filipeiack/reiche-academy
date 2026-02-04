# Guia Rápido: Sistema de Versionamento de Deploys

## Uso Básico

### Deploy Normal

```bash
# Staging (incremento patch: 1.0.0 → 1.0.1)
bash scripts/deploy-vps.sh staging patch

# Produção (nova feature: 1.0.5 → 1.1.0)
bash scripts/deploy-vps.sh prod minor

# Breaking change (1.9.2 → 2.0.0)
bash scripts/deploy-vps.sh prod major
```

### Consultar Versões

```bash
# Ver versão atual
bash scripts/version-manager.sh get staging
bash scripts/version-manager.sh get prod

# Histórico de deploys
bash scripts/version-manager.sh history

# Detalhes da versão atual
bash scripts/version-manager.sh current prod
```

### Verificar Versão em Produção

```bash
# API
curl https://app.reicheacademy.cloud/api/version

# Frontend
curl https://app.reicheacademy.cloud/version.json

# Docker
docker inspect reiche-academy-backend-prod | jq '.[0].Config.Labels'
```

## Guia Completo

Ver [VERSIONING_SYSTEM.md](VERSIONING_SYSTEM.md) para documentação completa.
