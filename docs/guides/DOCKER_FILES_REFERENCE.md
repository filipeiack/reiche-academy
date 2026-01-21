# 📋 Guia de Arquivos Docker - Reiche Academy

Este documento explica qual arquivo usar em cada situação.

## 🎯 Estrutura de Arquivos

### **Para SUA situação (1 VPS Hostinger):**

```
📁 Reiche Academy
├── 🏠 DESENVOLVIMENTO (Sua máquina Windows)
│   ├── docker-compose.yml        ✅ USAR
│   └── .env                      ✅ USAR
│
└── 🏢 PRODUÇÃO (VPS Hostinger)
    ├── docker-compose.vps.yml    ✅ USAR
    └── .env.vps                  ✅ USAR
```

---

## 📂 Arquivos por Ambiente

### **1. Desenvolvimento Local (Sua Máquina)**

**Arquivos:**
- `docker-compose.yml`
- `.env`
- `docs/guides/DOCKER_GUIDE.md`

**Como usar:**
```powershell
# Na pasta do projeto (Windows)
docker-compose up -d
```

**Acesso:**
- Frontend: http://localhost:4200
- Backend: http://localhost:3000

---

### **2. VPS Único - Staging + Produção (Hostinger)**

**Arquivos:**
- `docker-compose.vps.yml`
- `.env.vps`
- `docs/guides/VPS_SETUP_GUIDE.md`

**Como usar:**
```bash
# No servidor VPS (SSH)
docker compose -f docker-compose.vps.yml up -d
```

**Acesso:**
- Produção: https://app.reicheacademy.com.br
- Staging: https://staging.reicheacademy.com.br

---

## 🗑️ Arquivos que VOCÊ NÃO PRECISA

Estes arquivos foram criados para cenário de **2 servidores separados**.  
Como você tem **1 VPS**, pode deletá-los:

```
❌ docker-compose.staging.yml   (para servidor staging dedicado)
❌ docker-compose.prod.yml      (para servidor produção dedicado)
❌ .env.staging                 (para servidor staging dedicado)
❌ .env.production              (para servidor produção dedicado)
❌ DEPLOYMENT_GUIDE.md          (para deploy em 2 servidores)
```

**Comando para deletar (opcional):**
```powershell
# No Windows (PowerShell)
Remove-Item docker-compose.staging.yml
Remove-Item docker-compose.prod.yml
Remove-Item .env.staging
Remove-Item .env.production
Remove-Item DEPLOYMENT_GUIDE.md
```

**OU** simplesmente ignore esses arquivos - não atrapalham!

---

## 🎓 Quando Usar Cada Cenário

### **Cenário 1: VPS Único (SEU CASO)**

✅ **Use quando:**
- Você tem 1 servidor VPS
- Quer economizar (1 servidor = mais barato)
- Projeto pequeno/médio (até 500 usuários)
- Quer staging e produção no mesmo lugar

📁 **Arquivos:**
- `docker-compose.vps.yml`
- `.env.vps`

---

### **Cenário 2: Servidores Separados**

✅ **Use quando:**
- Você tem 2+ servidores
- Projeto grande (1000+ usuários)
- Requisitos de compliance (isolamento total)
- Budget para infraestrutura maior

📁 **Arquivos:**
- `docker-compose.staging.yml` (servidor 1)
- `docker-compose.prod.yml` (servidor 2)
- `.env.staging` (servidor 1)
- `.env.production` (servidor 2)

---

## 📊 Resumo Rápido

| Ambiente | Onde Roda | Arquivo Docker Compose | Arquivo .env |
|----------|-----------|------------------------|--------------|
| **Desenvolvimento** | Sua máquina Windows | `docker-compose.yml` | `.env` |
| **Staging** | VPS Hostinger | `docker-compose.vps.yml` | `.env.vps` |
| **Produção** | VPS Hostinger | `docker-compose.vps.yml` | `.env.vps` |

**Nota**: No VPS, staging e produção usam o **MESMO arquivo** `docker-compose.vps.yml` porque estão juntos!

---

## 🚀 Comandos por Ambiente

### **Desenvolvimento (Sua Máquina)**
```powershell
# Subir
docker-compose up -d

# Parar
docker-compose down

# Logs
docker-compose logs -f
```

### **VPS (Staging + Produção)**
```bash
# Subir tudo
docker compose -f docker-compose.vps.yml up -d

# Parar tudo
docker compose -f docker-compose.vps.yml down

# Logs produção
docker compose -f docker-compose.vps.yml logs -f backend-prod

# Logs staging
docker compose -f docker-compose.vps.yml logs -f backend-staging
```

---

## 🎯 Migração Futura

Se no futuro você quiser **separar em 2 servidores**, basta:

1. Usar `docker-compose.staging.yml` no servidor de staging
2. Usar `docker-compose.prod.yml` no servidor de produção
3. Configurar `.env.staging` e `.env.production`

Os arquivos já estão prontos! Mas por enquanto, **ignore-os**.

---

## ❓ FAQ

**P: Posso deletar os arquivos que não uso?**  
R: Sim! Ou pode deixar lá - não atrapalham e servem como referência futura.

**P: Qual guia seguir?**  
R: Use o **docs/guides/VPS_SETUP_GUIDE.md** para configurar seu VPS Hostinger.

**P: E o docs/guides/DOCKER_GUIDE.md?**  
R: Esse é para desenvolvimento local na sua máquina. Útil!

**P: E o DEPLOYMENT_GUIDE.md?**  
R: Criado para cenário de 2 servidores. Você não precisa agora.

---

## 📚 Documentação por Caso de Uso

| Documento | Para Que Serve | Você Precisa? |
|-----------|----------------|---------------|
| `docs/guides/DOCKER_GUIDE.md` | Desenvolvimento local | ✅ SIM |
| `docs/guides/VPS_SETUP_GUIDE.md` | Deploy no VPS único | ✅ SIM |
| `DEPLOYMENT_GUIDE.md` | Deploy em 2 servidores | ❌ NÃO (por enquanto) |
| Este arquivo (`FILE_STRUCTURE.md`) | Entender estrutura | ✅ SIM |

---

## 🎯 Próximos Passos

1. ✅ Ignore ou delete arquivos de "2 servidores"
2. ✅ Use `docker-compose.yml` na sua máquina
3. ✅ Use `docker-compose.vps.yml` no VPS
4. ✅ Siga o **docs/guides/VPS_SETUP_GUIDE.md** para deploy

---

**Última atualização:** Janeiro 2026  
**Para dúvidas:** Consulte docs/guides/VPS_SETUP_GUIDE.md

