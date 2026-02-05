# Dev Handoff: Sistema de Versionamento de Deploys VPS

**Data:** 2026-02-04  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** N/A (iniciativa técnica)  
**Business Analyst Handoff:** N/A (melhoria de DevOps)

---

## 1️⃣ Escopo Implementado

Sistema completo de versionamento semântico para deploys no VPS, permitindo:

- **Versionamento independente** para staging e produção
- **Incremento automático** de versão durante deploy (patch/minor/major)
- **Metadata completa** de cada deploy em JSON
- **Tags Docker** com informações de versão
- **Labels OCI** para inspeção de imagens
- **Endpoint API** para consulta de versão em runtime
- **Arquivo estático** de versão no frontend
- **Histórico auditável** de todos os deploys

---

## 2️⃣ Arquivos Criados/Alterados

### Scripts

- **`scripts/version-manager.sh`** - Gerenciador central de versionamento (254 linhas)
  - Comandos: get, bump, set, current, history
  - Criação de metadata em JSON
  - Links simbólicos para versão atual

### Deploy

- **`scripts/deploy-vps.sh`** - Modificado para integrar versionamento
  - Aceita parâmetro de bump (patch/minor/major)
  - Gera versão automaticamente antes do build
  - Passa build args para Docker
  - Tageia imagens com versão
  - Exibe versão implantada no final

### Backend

- **`backend/src/modules/version/version.controller.ts`** - Endpoint /api/version
  - GET /api/version retorna metadata completa
  - Inclui uptime, commit, build date, environment
  
- **`backend/src/modules/version/version.module.ts`** - Módulo do endpoint

- **`backend/src/app.module.ts`** - Registra VersionModule

- **`backend/Dockerfile`** - Modificado para aceitar build args
  - ARG: BUILD_VERSION, BUILD_DATE, GIT_COMMIT, ENVIRONMENT
  - ENV vars para runtime
  - Labels OCI para metadata

### Frontend

- **`frontend/Dockerfile`** - Modificado para aceitar build args
  - ARG: BUILD_VERSION, BUILD_DATE, GIT_COMMIT, ENVIRONMENT
  - Labels OCI para metadata
  - Gera version.json estático em /usr/share/nginx/html

### Versionamento

- **`VERSION.staging`** - Versão atual de staging (1.0.0 inicial)
- **`VERSION.prod`** - Versão atual de produção (1.0.0 inicial)
- **`deploy-metadata/README.md`** - Documentação da estrutura de metadata

### Documentação

- **`docs/guides/VERSIONING_SYSTEM.md`** - Guia completo do sistema (420 linhas)
  - Conceitos de versionamento semântico
  - Uso do sistema
  - Comandos disponíveis
  - Workflow recomendado
  - Troubleshooting

### Configuração

- **`.gitignore`** - Atualizado para não versionar:
  - VERSION.staging / VERSION.prod (gerados em runtime)
  - deploy-metadata/*.json (histórico local)

- **`deploy-metadata/.gitignore`** - Ignora JSONs mas mantém README

---

## 3️⃣ Decisões Técnicas

### Versionamento Semântico (SemVer)

**Decisão:** Utilizar formato MAJOR.MINOR.PATCH

**Rationale:**
- Padrão da indústria (https://semver.org/)
- Comunicação clara de mudanças
- Compatível com Docker tags
- Fácil de entender e automatizar

### Ambientes Independentes

**Decisão:** Staging e produção têm versões separadas

**Rationale:**
- Staging pode estar em versões superiores durante testes
- Produção pode estar em versão estável enquanto staging testa breaking changes
- Permite rollback independente
- Clareza sobre estado de cada ambiente

### Metadata em JSON

**Decisão:** Criar arquivo JSON por deploy com informações completas

**Rationale:**
- Auditoria completa
- Fácil de parsear (jq)
- Histórico persistente
- Rastreabilidade de commits Git

### Docker Labels (OCI)

**Decisão:** Usar padrão OCI Image Spec para labels

**Rationale:**
- Padrão da indústria
- Compatível com registries Docker
- Inspeção fácil via `docker inspect`
- Metadata embutida na imagem (imutável)

### Endpoint /api/version

**Decisão:** Criar endpoint público (sem autenticação)

**Rationale:**
- Permite healthchecks externos
- Monitoramento pode verificar versão implantada
- Não expõe informações sensíveis
- Útil para debugging

### Build Args vs Runtime Env Vars

**Decisão:** Usar build args que se tornam env vars em runtime

**Rationale:**
- Build args permitem metadata em labels Docker
- Env vars permitem acesso em runtime (endpoint /version)
- Combinação oferece flexibilidade máxima

### Não Versionar Metadata

**Decisão:** Adicionar deploy-metadata/*.json ao .gitignore

**Rationale:**
- Metadata é específica de cada servidor VPS
- Histórico local é suficiente para auditoria
- Evita conflitos de merge
- README mantém documentação da estrutura

---

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas (PascalCase classes, camelCase métodos)
- [x] Estrutura de pastas correta (modules/version/)
- [x] Controller com @ApiTags, @ApiOperation
- [x] Módulo registrado em app.module.ts
- [x] Endpoint público (sem guards necessários)

### Frontend
- [x] Dockerfile segue padrão multi-stage
- [x] Labels OCI aplicados
- [x] version.json gerado em produção

### Scripts
- [x] Bash scripts com set -e (fail fast)
- [x] Validação de parâmetros
- [x] Output colorido e informativo
- [x] Tratamento de erros

### Docker
- [x] Build args declarados
- [x] ENV vars configuradas
- [x] Labels OCI conforme spec
- [x] Multi-stage builds preservados

**Violações encontradas durante auto-validação:**
- Nenhuma violação encontrada

---

## 5️⃣ Ambiguidades e TODOs

### Resolvidas durante implementação:

✅ **Onde armazenar metadata?** → `deploy-metadata/` no root  
✅ **Versionar ou não versionar metadata?** → Não versionar (local)  
✅ **Endpoint autenticado?** → Público (sem dados sensíveis)  
✅ **Como passar versão para containers?** → Build args + env vars  

### Pendentes (não bloqueantes):

- [ ] **Integração com CI/CD:** GitHub Actions pode usar version-manager.sh (exemplo no guide)
- [ ] **Changelog automático:** Gerar changelog a partir de commits entre versões
- [ ] **Notificações:** Webhook/Slack após deploy bem-sucedido
- [ ] **Monitoramento:** Integrar /api/version com sistema de monitoramento

---

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes manuais realizados:**

1. ✅ version-manager.sh get/bump/set funcionam
2. ✅ Metadata JSON é criada corretamente
3. ✅ Links simbólicos current-{env}.json são criados
4. ✅ VersionController compila sem erros
5. ✅ Dockerfiles compilam com build args

**Testes que QA deve criar:**

- **Unit:** VersionController retorna estrutura correta
- **E2E:** GET /api/version retorna 200 com JSON válido
- **Integration:** Deploy completo cria metadata correta
- **Smoke:** version.json existe no frontend após build

---

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**

N/A - Esta é uma feature de DevOps/infraestrutura, não envolve regras de negócio da aplicação.

**Convenções seguidas:**

- ✅ Naming conventions (backend/conventions.md)
- ✅ Estrutura de módulos (backend/conventions.md)
- ✅ Docker multi-stage (architecture/backend.md)
- ✅ API design patterns (RESTful, JSON response)

---

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
  
**Atenção:** QA deve validar com testes:
  
1. **Endpoint /api/version:**
   - Retorna JSON válido
   - Contém todos campos esperados
   - Uptime incrementa ao longo do tempo
   
2. **Scripts:**
   - version-manager.sh bump incrementa corretamente
   - Metadata JSON é criada com formato válido
   - Links simbólicos são criados
   
3. **Build Docker:**
   - Labels OCI são aplicados
   - Tags de versão são criadas
   - version.json existe no frontend

**Prioridade de testes:**
- **Alta:** Endpoint /api/version (usado para monitoramento)
- **Média:** version-manager.sh (usado em deploys)
- **Baixa:** Labels Docker (inspeção manual é suficiente)

---

## 9️⃣ Riscos Identificados

**Riscos técnicos:**

1. **Script bash em Windows:** version-manager.sh usa bash (WSL necessário)
   - **Mitigação:** VPS Linux executa normalmente
   
2. **jq não instalado:** version-manager.sh usa jq para JSON
   - **Mitigação:** Adicionar instalação ao deploy-vps.sh se necessário
   
3. **Links simbólicos em Windows:** Podem não funcionar corretamente
   - **Mitigação:** VPS Linux suporta perfeitamente

**Dependências externas:**

- **jq:** Para parsing JSON (comum em distros Linux)
- **git:** Para obter commit hash
- **Docker:** Para build e labels

**Impacto baixo:** Sistema degrada gracefully (versão "dev" se scripts falham)

---

## 🔧 Como Usar

### Deploy com Versionamento

```bash
# Staging (patch bump: 1.0.0 → 1.0.1)
bash scripts/deploy-vps.sh staging patch

# Produção (minor bump: 1.0.5 → 1.1.0)
bash scripts/deploy-vps.sh prod minor

# Major release (1.9.2 → 2.0.0)
bash scripts/deploy-vps.sh prod major
```

### Consultar Versões

```bash
# Versão atual de cada ambiente
bash scripts/version-manager.sh get staging
bash scripts/version-manager.sh get prod

# Histórico completo
bash scripts/version-manager.sh history

# Metadata da versão atual
bash scripts/version-manager.sh current prod
```

### Verificar Versão Implantada

```bash
# Via API (após deploy)
curl http://app.reicheacademy.cloud/api/version

# Via arquivo estático (frontend)
curl http://app.reicheacademy.cloud/version.json

# Via Docker labels
docker inspect reiche-academy-backend-prod:1.0.0 | jq '.[0].Config.Labels'
```

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
