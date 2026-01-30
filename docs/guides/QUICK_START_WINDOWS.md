# 🚀 QUICK START - Postgres + Redis no Windows

## ✅ PASSO 1: Verificar Docker Desktop

1. Procure no menu Iniciar: **Docker Desktop**
2. Abra e aguarde aparecer o ícone da baleia (2-3 minutos)
3. Clique no ícone da baleia → deve ter checkmark verde ✅

---

## ✅ PASSO 2: Abrir PowerShell

1. Clique com direita na barra de tarefas
2. Selecione **Windows PowerShell** ou **Terminal**
3. Navegue para o projeto:

```powershell
cd C:\Users\filip\source\repos\reiche-academy
```

---

## ✅ PASSO 3: Subir Postgres + Redis

Execute este comando:

```powershell
docker-compose -f docker-compose.minimal.yml up -d
```

**Resultado esperado:**
```
[+] Running 2/2
  ✔ Container reiche-postgres-dev  Started
  ✔ Container reiche-redis-dev     Started
```

---

## ✅ PASSO 4: Verificar Status

```powershell
docker-compose -f docker-compose.minimal.yml ps
```

**Resultado esperado (ambos com STATUS "Up"):**
```
NAME                COMMAND             STATUS              PORTS
reiche-postgres-dev "postgres"          Up 2 minutes        5432/tcp
reiche-redis-dev    "redis-server"      Up 2 minutes        6379/tcp
```

✅ **PRONTO!**

---

## 🔗 Testar Conexão

### PostgreSQL
```powershell
docker-compose -f docker-compose.minimal.yml exec postgres psql -U reiche -d reiche_academy
```

Se aparecer `reiche_academy=#` = funcionando! ✅

Saia com: `\q`

### Redis
```powershell
docker-compose -f docker-compose.minimal.yml exec redis redis-cli ping
```

Se aparecer `PONG` = funcionando! ✅

---

## 🔧 Instalar Backend Localmente

```powershell
# Terminal 1: manter Postgres + Redis rodando
# (já feito acima)

# Terminal 2: Backend
cd backend
npm install
npm run dev
```

Backend rodará em: `http://localhost:3000`

---

## 🎨 Instalar Frontend Localmente

```powershell
# Terminal 3: Frontend
cd frontend
npm install
npm start
```

Frontend rodará em: `http://localhost:4200`

---

## 🛑 Parar Serviços

```powershell
docker-compose -f docker-compose.minimal.yml stop
```

---

## 📊 Ver Logs

```powershell
# Últimas 20 linhas
docker-compose -f docker-compose.minimal.yml logs --tail=20

# Seguir logs em tempo real (nova saída aparece)
docker-compose -f docker-compose.minimal.yml logs -f

# Sair dos logs: Ctrl + C
```

---

## 🆘 Erro: "Port 5432 already in use"

```powershell
# Matar processo que usa porta 5432
netstat -ano | findstr :5432
taskkill /PID <NÚMERO> /F
```

Depois tente novamente.

---

## 🆘 Docker não inicia

1. Abra Docker Desktop
2. Aguarde o ícone ficar verde
3. Tente novamente

---

## 📚 Mais Informações

Ver: [DOCKER_GUIDE.md](DOCKER_GUIDE.md)

---

**Status**: ✅ Postgres e Redis prontos para usar!
