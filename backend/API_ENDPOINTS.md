# 🎉 Backend Reiche Academy - CRUDs Implementados

## ✅ Estrutura Completa Criada

### 📋 Resumo dos Módulos

| Módulo | Status | Endpoints | DTOs | Features |
|--------|--------|-----------|------|----------|
| **Auth** | ✅ 100% | 2 | ✅ | JWT + Refresh + Argon2 |
| **Usuários** | ✅ 100% | 5 | ✅ | CRUD completo |
| **Empresas** | ✅ 100% | 6 | ✅ | CRUD + vincular pilares |
| **Pilares** | ✅ 100% | 6 | ✅ | CRUD + reordenação |
| **Rotinas** | ✅ 100% | 6 | ✅ | CRUD + reordenação por pilar |

---

## 🔐 Autenticação

### **POST** `/api/auth/login`
Login com email e senha
```json
{
  "email": "admin@reiche.com.br",
  "senha": "senha123"
}
```
**Response:** `{ accessToken, refreshToken, usuario }`

### **POST** `/api/auth/refresh`
Renovar access token
```json
{
  "refreshToken": "..."
}
```

---

## 👤 Usuários

### **GET** `/api/usuarios`
Listar todos os usuários

### **GET** `/api/usuarios/:id`
Buscar usuário por ID

### **POST** `/api/usuarios`
Criar novo usuário
```json
{
  "email": "joao@reiche.com.br",
  "nome": "João Silva",
  "senha": "senha123",
  "perfil": "GESTOR",
  "empresaId": "uuid-opcional"
}
```
**Perfis disponíveis:** `ADMINISTRADOR`, `GESTOR`, `COLABORADOR`, `LEITURA`

### **PATCH** `/api/usuarios/:id`
Atualizar usuário (todos os campos são opcionais)

### **DELETE** `/api/usuarios/:id`
Desativar usuário (soft delete)

---

## 🏢 Empresas

### **GET** `/api/empresas`
Listar todas as empresas ativas (inclui contadores)

### **GET** `/api/empresas/:id`
Buscar empresa por ID (inclui usuários e pilares vinculados)

### **POST** `/api/empresas`
Criar nova empresa
```json
{
  "nome": "Reiche Consultoria Ltda",
  "cnpj": "12.345.678/0001-90",
  "cidade": "rio de janeiro"
}
```
**Validação:** CNPJ deve estar no formato `00.000.000/0000-00`

### **PATCH** `/api/empresas/:id`
Atualizar empresa

### **DELETE** `/api/empresas/:id`
Desativar empresa

### **POST** `/api/empresas/:id/pilares`
Vincular pilares à empresa
```json
{
  "pilaresIds": ["uuid-pilar-1", "uuid-pilar-2"]
}
```

---

## 📊 Pilares

### **GET** `/api/pilares`
Listar todos os pilares ativos (ordenados)

### **GET** `/api/pilares/:id`
Buscar pilar por ID (inclui rotinas e empresas vinculadas)

### **POST** `/api/pilares`
Criar novo pilar
```json
{
  "nome": "Estratégia e Governança",
  "descricao": "Planejamento estratégico e governança corporativa",
  "ordem": 1
}
```

### **PATCH** `/api/pilares/:id`
Atualizar pilar

### **DELETE** `/api/pilares/:id`
Desativar pilar (apenas se não tiver rotinas ativas)

### **POST** `/api/pilares/reordenar`
Reordenar pilares
```json
{
  "ordens": [
    { "id": "uuid-1", "ordem": 1 },
    { "id": "uuid-2", "ordem": 2 }
  ]
}
```

---

## 📝 Rotinas

### **GET** `/api/rotinas`
Listar todas as rotinas ativas (ordenadas por pilar e ordem)
**Query params:** `?pilarId=uuid` (opcional, para filtrar)

### **GET** `/api/rotinas/:id`
Buscar rotina por ID (inclui pilar)

### **POST** `/api/rotinas`
Criar nova rotina
```json
{
  "nome": "Planejamento Estratégico Anual",
  "descricao": "Elaboração do planejamento estratégico",
  "ordem": 1,
  "pilarId": "uuid-do-pilar"
}
```

### **PATCH** `/api/rotinas/:id`
Atualizar rotina

### **DELETE** `/api/rotinas/:id`
Desativar rotina

### **POST** `/api/rotinas/pilar/:pilarId/reordenar`
Reordenar rotinas de um pilar específico
```json
{
  "ordens": [
    { "id": "uuid-1", "ordem": 1 },
    { "id": "uuid-2", "ordem": 2 }
  ]
}
```

---

## 🔒 Segurança

### Autenticação
Todos os endpoints (exceto `/auth/login` e `/auth/refresh`) requerem autenticação via JWT:
```
Authorization: Bearer <access_token>
```

### Senhas
- Criptografadas com **Argon2** (mais seguro que bcrypt)
- Mínimo 6 caracteres

### Auditoria
Todos os CRUDs registram:
- `createdBy` - ID do usuário que criou
- `updatedBy` - ID do usuário que atualizou
- `createdAt` - Data de criação
- `updatedAt` - Data de última atualização

---

## 📚 Documentação Swagger

Acesse: **http://localhost:3000/api/docs**

Todas as rotas estão documentadas com:
- ✅ Descrições
- ✅ Exemplos de request/response
- ✅ Validações
- ✅ Status codes

---

## 🚀 Próximos Passos

1. **Instalar dependências:**
   ```bash
   cd backend
   npm install
   ```

2. **Iniciar Docker:**
   ```bash
   docker-compose up -d
   ```

3. **Gerar Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Criar migrations:**
   ```bash
   npm run migration:dev
   ```

5. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

6. **Testar no Swagger:**
   - Acesse: http://localhost:3000/api/docs
   - Faça login em `/auth/login`
   - Copie o `accessToken`
   - Clique em "Authorize" e cole o token
   - Teste os endpoints! 🎉

---

## ✨ Features Implementadas

- ✅ Autenticação JWT com access + refresh tokens
- ✅ Senhas com Argon2
- ✅ DTOs com validação class-validator
- ✅ Swagger completo em todas as rotas
- ✅ Soft delete (campo `ativo`)
- ✅ Auditoria (createdBy, updatedBy, timestamps)
- ✅ Validação de CNPJ
- ✅ Relacionamentos incluídos nos GETs
- ✅ Reordenação de pilares e rotinas
- ✅ Vincular pilares a empresas
- ✅ Guards JWT em todas as rotas protegidas
- ✅ Perfis de usuário (RBAC preparado)

---

**Todos os CRUDs estão prontos para uso! 🚀**
