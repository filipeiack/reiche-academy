# Arquitetura de Dados

**Última atualização:** 2025-12-23  
**Status:** Factual (baseado em código existente)

---

## Propósito deste Documento

Descrever a arquitetura de dados da aplicação Reiche Academy,
baseando-se EXCLUSIVAMENTE no schema Prisma em `backend/prisma/schema.prisma`.

Este documento é **descritivo**, não prescritivo.

---

## SGBD e ORM

| Componente | Tecnologia | Onde aparece |
|------------|------------|--------------|
| SGBD | PostgreSQL | `backend/prisma/schema.prisma` (provider) |
| ORM | Prisma | `backend/prisma/schema.prisma` |
| Cache | Redis | `docker-compose.yml` (porta 6379) |

**Nota:** Redis configurado mas uso não mapeado no código.

**Onde aparece:**
- `backend/prisma/schema.prisma`
- `docker-compose.yml`

---

## Modelos de Dados

### PerfilUsuario

**Responsabilidade:** Perfis/Roles de usuários

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| codigo | String | | Código do perfil |
| nome | String | | Nome do perfil (ex: Admin, Usuário) |
| nivel | String | | Nível de permissão |
| ativo | Boolean | | Status do perfil |
| createdAt | DateTime | @default(now()) | Data de criação |
| updatedAt | DateTime | @updatedAt | Data de atualização |

**Relacionamentos:**
- 1:N com Usuario

**Onde aparece:** `backend/prisma/schema.prisma`

---

### Usuario

**Responsabilidade:** Usuários do sistema

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| email | String | @unique | Email (login único) |
| senha | String | | Hash Argon2 da senha |
| perfilId | String | | FK para PerfilUsuario |
| empresaId | String? | nullable | FK para Empresa (opcional) |
| fotoUrl | String? | nullable | URL da foto/avatar |
| createdAt | DateTime | @default(now()) | Data de criação |
| updatedAt | DateTime | @updatedAt | Data de atualização |

**Relacionamentos:**
- N:1 com PerfilUsuario
- N:1 com Empresa (nullable)
- 1:N com PasswordReset
- 1:N com LoginHistory

**Onde aparece:** `backend/prisma/schema.prisma`

---

### PasswordReset

**Responsabilidade:** Tokens de recuperação de senha

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| usuarioId | String | | FK para Usuario |
| token | String | | Token de reset |
| expiresAt | DateTime | | Data de expiração |
| used | Boolean | | Se foi utilizado |
| createdAt | DateTime | @default(now()) | Data de criação |

**Relacionamentos:**
- N:1 com Usuario

**Onde aparece:** `backend/prisma/schema.prisma`

---

### LoginHistory

**Responsabilidade:** Histórico de tentativas de login

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| email | String | | Email usado na tentativa |
| sucesso | Boolean | | Se login foi bem-sucedido |
| ipAddress | String? | nullable | IP do cliente |
| userAgent | String? | nullable | User-Agent do navegador |
| createdAt | DateTime | @default(now()) | Data da tentativa |

**Relacionamentos:** Nenhum (não possui FK)

**Onde aparece:** `backend/prisma/schema.prisma`

---

### Empresa

**Responsabilidade:** Empresas clientes

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| cnpj | String | @unique | CNPJ (único) |
| logoUrl | String? | nullable | URL do logo |
| loginUrl | String? | nullable | URL personalizada de login |
| estado | EstadoBrasil? | enum, nullable | Estado brasileiro |
| createdAt | DateTime | @default(now()) | Data de criação |
| updatedAt | DateTime | @updatedAt | Data de atualização |

**Relacionamentos:**
- 1:N com Usuario
- 1:N com PilarEmpresa

**Onde aparece:** `backend/prisma/schema.prisma`

---

### Pilar

**Responsabilidade:** Pilares do modelo de gestão

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| nome | String | @unique | Nome do pilar (único) |
| ordem | Int | @unique | Ordem de exibição (único) |
| modelo | String | | Modelo/categoria |
| ativo | Boolean | | Status do pilar |
| createdAt | DateTime | @default(now()) | Data de criação |
| updatedAt | DateTime | @updatedAt | Data de atualização |

**Relacionamentos:**
- 1:N com Rotina
- 1:N com PilarEmpresa

**Onde aparece:** `backend/prisma/schema.prisma`

---

### Rotina

**Responsabilidade:** Rotinas dentro de um pilar

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| nome | String | | Nome da rotina |
| pilarId | String | | FK para Pilar |
| modelo | String | | Modelo/categoria |
| ativo | Boolean | | Status da rotina |
| createdAt | DateTime | @default(now()) | Data de criação |
| updatedAt | DateTime | @updatedAt | Data de atualização |

**Relacionamentos:**
- N:1 com Pilar
- 1:N com NotaRotina (presumido, não mapeado completamente)

**Onde aparece:** `backend/prisma/schema.prisma`

---

### PilarEmpresa

**Responsabilidade:** Relação N:N entre Pilar e Empresa

| Campo | Tipo | Constraints | Descrição Presumida |
|-------|------|------------|---------------------|
| id | String | @id | Identificador único |
| empresaId | String | | FK para Empresa |
| pilarId | String | | FK para Pilar |
| createdAt | DateTime | @default(now()) | Data de criação |
| updatedAt | DateTime | @updatedAt | Data de atualização |

**Relacionamentos:**
- N:1 com Empresa
- N:1 com Pilar

**Onde aparece:** `backend/prisma/schema.prisma`

---

### NotaRotina

**Responsabilidade:** (Presumido) Avaliações/notas de rotinas

**Detalhes:** Modelo mencionado mas não completamente mapeado

**Onde deveria aparecer:** `backend/prisma/schema.prisma`

---

### AgendaReuniao

**Responsabilidade:** (Presumido) Agendamento de reuniões

**Detalhes:** Modelo mencionado mas não completamente mapeado

**Onde deveria aparecer:** `backend/prisma/schema.prisma`

---

### AuditLog

**Responsabilidade:** Registro de auditoria de ações

**Detalhes:** Modelo identificado mas campos não completamente mapeados

**Campos presumidos:**
- Usuário que realizou ação
- Tipo de ação
- Timestamp
- Detalhes/metadata

**Onde aparece:** `backend/prisma/schema.prisma`

---

## Enums

### Criticidade

**Valores:**
- ALTO
- MEDIO
- BAIXO

**Uso presumido:** Classificação de criticidade (ex: ações, diagnósticos)

**Onde aparece:** `backend/prisma/schema.prisma`

---

### StatusAcao

**Detalhes:** Enum identificado mas valores não mapeados

**Uso presumido:** Status de ações/tarefas

**Onde aparece:** `backend/prisma/schema.prisma`

---

### EstadoBrasil

**Detalhes:** Enum identificado mas valores não mapeados

**Uso presumido:** Estados brasileiros (AC, AL, AM, ..., TO)

**Uso:** Campo `Empresa.estado`

**Onde aparece:** `backend/prisma/schema.prisma`

---

## Relacionamentos Principais

```
PerfilUsuario 1 ──────────── N Usuario
                                 │
                                 │ N
                                 │
                                 │ 1
Empresa 1 ───────────────────────┘
    │
    │ 1
    │
    │ N
PilarEmpresa N ────────────── 1 Pilar
                                 │
                                 │ 1
                                 │
                                 │ N
                              Rotina
```

**Observações:**
- Usuario.empresaId é **nullable** (usuários podem não ter empresa vinculada)
- PilarEmpresa é tabela de junção explícita (não apenas N:N implícito)

**Onde aparece:** Relações definidas em `backend/prisma/schema.prisma`

---

## Migrations

**Localização:** `backend/prisma/migrations/`

**Funcionamento:**
- Migrations geradas pelo Prisma CLI
- Versionamento do schema
- Aplicação incremental

**Não identificado:**
- Estratégia de rollback
- Migrações customizadas

**Onde aparece:** `backend/prisma/migrations/`

---

## Seed de Dados

**Arquivo:** `backend/prisma/seed.ts`

**Responsabilidade:** Popular banco com dados iniciais

**Não identificado:**
- Dados específicos seeded
- Estratégia de seed (dev vs prod)

**Onde aparece:** `backend/prisma/seed.ts`

---

## Índices e Performance

**Constraints únicos identificados:**
- Usuario.email
- Empresa.cnpj
- Pilar.nome
- Pilar.ordem

**Não identificado:**
- Índices compostos
- Índices para otimização de queries
- Estratégia de particionamento

**Onde aparecem:** Constraints definidas em `backend/prisma/schema.prisma`

---

## Soft Delete

**Padrão identificado:**
- Campos `ativo` (Boolean) em:
  - PerfilUsuario
  - Pilar
  - Rotina

**Interpretação:** Soft delete (desativar ao invés de deletar)

**Não identificado em:**
- Usuario
- Empresa
- Outros modelos

**Onde aparece:** Campos `ativo` nos modelos identificados

---

## Auditoria de Dados

**Timestamps automáticos:**

Todos os modelos principais possuem:
- `createdAt` — Data de criação
- `updatedAt` — Data de última atualização (auto-gerenciado pelo Prisma)

**AuditLog:**
- Modelo específico para registro de ações

**Onde aparece:** Campos `@default(now())` e `@updatedAt` em todos os modelos

---

## Validações e Constraints

### Nível de Banco

**Constraints identificadas:**
- UNIQUE: email, cnpj, nome de pilar, ordem de pilar
- NOT NULL: maioria dos campos (exceto nullable explícitos)

### Nível de Aplicação

**ValidationPipe:**
- Validação via DTOs (class-validator)
- Ver: [Backend Architecture](backend.md)

**Onde aparecem:**
- Schema: `backend/prisma/schema.prisma`
- DTOs: `backend/src/modules/*/dto/`

---

## Cache (Redis)

**Configuração:** Porta 6379, volume persistente `redis_data`

**Uso não mapeado:**
- Quais dados são cacheados
- TTL (Time To Live)
- Estratégias de invalidação

**Onde deveria aparecer:**
- Services que utilizam Redis
- Configuração de cache no backend

**Onde aparece:** `docker-compose.yml`

---

## Backup e Recuperação

**Não identificado:**
- Estratégia de backup
- Ponto de recuperação
- Replicação

**Onde deveria aparecer:** Documentação de operações, scripts de infra

---

## Limitações deste Documento

Este documento NÃO cobre:

- Queries específicas mais utilizadas
- Performance de queries (explain plans, otimizações)
- Tamanho de dados e crescimento esperado
- Estratégias de particionamento
- Detalhes completos dos modelos NotaRotina, AgendaReuniao
- Valores específicos de enums StatusAcao e EstadoBrasil
- Triggers ou stored procedures (se existirem)
- Políticas de retenção de dados
- Conformidade com LGPD/GDPR
- Estratégias de backup e disaster recovery

Para modelo de dados completo e atualizado, consultar:
- `backend/prisma/schema.prisma` (fonte primária)
- `backend/DATA_MODEL.md` (se disponível)
- Migrations em `backend/prisma/migrations/`

---

## Diagrama ERD

**Localização:** `backend/diagrams/erd.mmd`

**Formato:** Mermaid

**Documentação:** `backend/diagrams/README.md`

**Onde aparece:** `backend/diagrams/`

---

## Documentos Relacionados

- [Architecture Overview](architecture.md)
- [Backend Architecture](backend.md)
- `backend/DATA_MODEL.md`
- `backend/diagrams/erd.mmd`

---

**Princípio:** Este documento reflete o schema existente. Não prescreve modelo de dados ideal.
