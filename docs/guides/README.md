# 📚 Guias de Configuração - Reiche Academy

## 🗺️ Navegação Rápida

### Desenvolvimento Local (Windows)

Você está **desenvolvendo localmente** no seu computador Windows:

1. **Primeira vez?** → [QUICK_START_WINDOWS.md](QUICK_START_WINDOWS.md)
   - Setup inicial para iniciantes
   - PostgreSQL + Redis via Docker
   - Backend e Frontend localmente

2. **Já tem Docker?** → [DOCKER_GUIDE.md](DOCKER_GUIDE.md)
   - Comandos Docker detalhados
   - Troubleshooting
   - Gerenciamento de containers

### Deploy em Produção (VPS)

Você vai **fazer deploy no servidor** (VPS Ubuntu):

1. **Primeira vez?** → [DEPLOY_VPS_QUICKSTART.md](DEPLOY_VPS_QUICKSTART.md)
   - 3 passos para deploy rápido
   - Comandos essenciais
   - Links para guia completo

2. **Precisa de detalhes?** → [VPS_SETUP_GUIDE.md](VPS_SETUP_GUIDE.md)
   - Setup completo e detalhado
   - Documentação dos scripts automatizados
   - Configuração SSL, DNS, backups
   - Troubleshooting avançado

---

## 📊 Comparação de Guias

| Guia | Propósito | Público | Tempo |
|------|-----------|---------|-------|
| **QUICK_START_WINDOWS.md** | Dev local - Iniciantes | Desenvolvedores Windows | 15 min |
| **DOCKER_GUIDE.md** | Dev local - Referência | Desenvolvedores | Consulta |
| **DOCKER_FILES_REFERENCE.md** | Arquivos Docker por ambiente | Desenvolvedores/DevOps | Consulta |
| **GIT_WORKFLOW.md** | Estratégia de branches | Desenvolvedores | Consulta |
| **GIT_BRANCH_SETUP.md** | Setup inicial de branches | DevOps/Setup | 10 min |
| **DEPLOY_VPS_QUICKSTART.md** | Deploy VPS - Rápido | DevOps/Deploy | 5 min |
| **VPS_SETUP_GUIDE.md** | Deploy VPS - Completo | DevOps/Sysadmin | 1-2h |

---

## 🎯 Fluxo Recomendado

```
┌─────────────────────────────────────────┐
│     1. DESENVOLVIMENTO LOCAL            │
│  ↓  QUICK_START_WINDOWS.md              │
│  ↓  DOCKER_GUIDE.md (referência)        │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     2. TESTES NO VPS STAGING            │
│  ↓  DEPLOY_VPS_QUICKSTART.md            │
│     (deploy rápido)                     │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     3. PRODUÇÃO NO VPS                  │
│  ↓  VPS_SETUP_GUIDE.md                  │
│     (configuração completa + SSL)       │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│     4. MANUTENÇÃO CONTÍNUA              │
│  ↓  scripts/maintenance-vps.sh          │
│     (health checks, backups)            │
└─────────────────────────────────────────┘
```

---

## 🔧 Scripts Disponíveis

- **scripts/deploy-vps.sh** - Deploy automático completo
- **scripts/maintenance-vps.sh** - Manutenção interativa (health, backup, logs)
- **scripts/init-databases.sh** - Inicializa databases no PostgreSQL
- **scripts/init-timezone.sql** - Configura timezone America/Sao_Paulo

Ver documentação completa em [VPS_SETUP_GUIDE.md](VPS_SETUP_GUIDE.md#-scripts-automatizados)

---

## 🆘 Preciso de Ajuda

### **Erro durante desenvolvimento local**
→ [DOCKER_GUIDE.md - Troubleshooting](DOCKER_GUIDE.md#troubleshooting)

### **Erro no deploy VPS**
→ [VPS_SETUP_GUIDE.md - Troubleshooting](VPS_SETUP_GUIDE.md#-troubleshooting)

### **Como fazer backup?**
→ `bash scripts/maintenance-vps.sh backup`

### **Como atualizar código no VPS?**
→ `bash scripts/maintenance-vps.sh update`

---

## 📁 Estrutura de Documentação

```
docs/guides/
├── README.md                      ← VOCÊ ESTÁ AQUI
├── QUICK_START_WINDOWS.md         ← Início rápido (dev local)
├── DOCKER_GUIDE.md                ← Referência Docker
├── DOCKER_FILES_REFERENCE.md      ← Arquivos Docker por ambiente
├── GIT_WORKFLOW.md                ← Estratégia de branches
├── GIT_BRANCH_SETUP.md            ← Setup inicial de branches
├── DEPLOY_VPS_QUICKSTART.md       ← Deploy rápido (VPS)
└── VPS_SETUP_GUIDE.md             ← Guia completo (VPS)

docs/reference/
├── README.md                      ← Índice de referências técnicas
├── CONTEXT.md                     ← Contexto do projeto
└── frontend/                      ← Documentação técnica frontend
    ├── I18N.md
    ├── LOGIN_CUSTOMIZATION.md
    ├── MULTI_SELECT_BATCH_DELETE.md
    ├── ROUTE_PROTECTION.md
    ├── SORTABLE_DIRECTIVE.md
    ├── USER_AVATAR.md
    └── USER_DETAILS_OFFCANVAS.md

scripts/
├── deploy-vps.sh                  ← Deploy automático
├── maintenance-vps.sh             ← Manutenção interativa
├── init-databases.sh              ← Setup databases
└── init-timezone.sql              ← Timezone config
```

---

**Última atualização**: Janeiro 2026
