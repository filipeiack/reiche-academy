# Deploy Metadata Directory

Este diretório contém o histórico completo de todos os deploys realizados no VPS.

## Estrutura

Cada deploy gera um arquivo JSON com metadata completa:

```
deploy-{environment}-{version}-{timestamp}.json
```

Exemplo:
```
deploy-prod-1.2.3-2026-02-04T15:30:00Z.json
```

## Links Simbólicos

Os arquivos `current-{env}.json` apontam sempre para o deploy mais recente:

```
current-staging.json → deploy-staging-1.0.5-2026-02-04T16:00:00Z.json
current-prod.json → deploy-prod-1.0.3-2026-02-04T15:00:00Z.json
```

## Formato do Arquivo

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

## Consulta

```bash
# Listar todos deploys
ls -lah deploy-metadata/

# Ver deploy atual de staging
cat deploy-metadata/current-staging.json | jq '.'

# Histórico organizado
bash scripts/version-manager.sh history
```

## Retenção

**Não deletar arquivos deste diretório.** Eles fornecem auditoria completa do histórico de deploys.

Se necessário limpar versões antigas (após muito tempo):

```bash
# Manter apenas últimos 50 deploys de cada ambiente
cd deploy-metadata
ls -t deploy-staging-*.json | tail -n +51 | xargs rm -f
ls -t deploy-prod-*.json | tail -n +51 | xargs rm -f
```
