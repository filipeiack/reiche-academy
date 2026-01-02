# Regras de Negócio — Pilares

**Módulo:** Pilares  
**Backend:** `backend/src/modules/pilares/` e `backend/src/modules/pilares-empresa/`  
**Frontend:** `frontend/src/app/views/pages/pilares/` e `frontend/src/app/views/pages/empresas/pilares-empresa-*`  
**Última extração:** 02/01/2026  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Pilares é responsável por:
- Gerenciar catálogo global de pilares (CRUD admin)
- Gerenciar pilares por empresa (vinculação e ordenação per-company)
- Validação de dependências com rotinas ativas
- Auditoria de operações em pilares
- Auto-associação de pilares modelo a novas empresas
- Gestão de responsáveis por pilar em cada empresa
- Vinculação e ordenação de rotinas em pilares por empresa

**Entidades principais:**
- Pilar (catálogo global de pilares)
- PilarEmpresa (vínculo pilar-empresa com ordenação e responsável)
- RotinaEmpresa (vínculo rotina-pilar por empresa com ordenação)

**Módulo Pilares (Catálogo Global):**
- `POST /pilares` — Criar pilar (ADMINISTRADOR)
- `GET /pilares` — Listar pilares ativos (todos)
- `GET /pilares/:id` — Buscar pilar ativo com rotinas (todos)
- `PATCH /pilares/:id` — Atualizar pilar (ADMINISTRADOR)
- `DELETE /pilares/:id` — Desativar pilar (ADMINISTRADOR)

**Módulo PilaresEmpresa (Multi-Tenant):**
- `GET /empresas/:empresaId/pilares` — Listar pilares da empresa (todos)
- `POST /empresas/:empresaId/pilares/reordenar` — Reordenar pilares (ADMINISTRADOR, GESTOR)
- `POST /empresas/:empresaId/pilares/vincular` — Vincular pilares (ADMINISTRADOR, GESTOR)
- `DELETE /empresas/:empresaId/pilares/:pilarEmpresaId` — Remover pilar da empresa (ADMINISTRADOR, GESTOR)
- `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/responsavel` — Definir responsável (ADMINISTRADOR, GESTOR)
- `GET /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas` — Listar rotinas (todos)
- `POST /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas` — Vincular rotina (ADMINISTRADOR, GESTOR)
- `DELETE /empresas/:empresaId/pilares/rotinas/:rotinaEmpresaId` — Remover rotina (ADMINISTRADOR, GESTOR)
- `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas/reordenar` — Reordenar rotinas (ADMINISTRADOR, GESTOR)

---

## 2. Entidades

### 2.1. Pilar

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| nome | String (unique) | Nome do pilar (ex: "Estratégia e Governança") |
| descricao | String? | Descrição detalhada do pilar |
| ordem | Int? | Ordem de referência (opcional, apenas visual) |
| modelo | Boolean (default: false) | Se true, é auto-associado a novas empresas |
| ativo | Boolean (default: true) | Soft delete flag |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `rotinas`: Rotina[] (rotinas vinculadas ao pilar)
- `empresas`: PilarEmpresa[] (empresas que usam este pilar)

**Índices:**
- `nome` (unique)
- `ordem` (unique) ⚠️

**⚠️ Observação sobre constraint `@@unique([ordem])`:**
- Schema atual possui constraint de unicidade em `ordem`
- Pode causar erro se dois pilares tiverem mesma ordem
- Campo `ordem` é opcional (Int?) mas constraint exige valores únicos quando não-null
- **Recomendação futura:** Considerar remover constraint ou tornar ordem obrigatória
- **Comportamento atual:** Ordem null é permitida (não viola unique), mas valores duplicados não-null são bloqueados

---

### 2.2. PilarEmpresa

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| empresaId | String | FK para Empresa |
| pilarId | String | FK para Pilar |
| ordem | Int | Ordem de exibição do pilar na empresa (per-company) |
| responsavelId | String? | FK para Usuario (responsável pelo pilar na empresa) |
| ativo | Boolean (default: true) | Soft delete flag |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `empresa`: Empresa (empresa associada)
- `pilar`: Pilar (pilar associado)
- `responsavel`: Usuario? (usuário responsável pelo acompanhamento do pilar)
- `rotinasEmpresa`: RotinaEmpresa[] (rotinas vinculadas ao pilar na empresa)
- `evolucao`: PilarEvolucao[] (histórico de evolução do pilar)

**Índices:**
- `[empresaId, pilarId]` (unique)

---

## 3. Regras Implementadas

### R-PIL-001: Criação de Pilar com Nome Único

**Descrição:** Sistema valida que o nome do pilar é único antes de criar.

**Implementação:**
- **Endpoint:** `POST /pilares` (restrito a ADMINISTRADOR)
- **Método:** `PilaresService.create()`
- **DTO:** CreatePilarDto

**Validação:**
```typescript
const existingPilar = await this.prisma.pilar.findUnique({
  where: { nome: createPilarDto.nome },
});

if (existingPilar) {
  throw new ConflictException('Já existe um pilar com este nome');
}
```

**Validação de DTO:**
- `nome`: string, required, 2-100 caracteres
- `descricao`: string, optional, 0-500 caracteres
- `ordem`: number, optional, >= 1 (apenas referência, não obrigatório)
- `modelo`: boolean, optional (default: false)

**Auditoria:**
- Registra criação em tabela de auditoria
- Ação: CREATE
- Dados completos do pilar criado

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L11-L41)

---

### R-PIL-002: Listagem de Pilares Ativos com Contadores

**Descrição:** Endpoint retorna apenas pilares ativos, ordenados por `ordem`, incluindo contagem de rotinas e empresas.

**Implementação:**
- **Endpoint:** `GET /pilares` (autenticado, todos os perfis)
- **Método:** `PilaresService.findAll()`

**Filtro:**
```typescript
where: { ativo: true }
```

**Ordenação:**
```typescript
orderBy: { ordem: 'asc' }
```

**Include:**
```typescript
include: {
  _count: {
    select: {
      rotinas: true,
      empresas: true,
    },
  },
}
```

**Retorno:** Pilares ordenados com:
- Todos os campos do pilar
- `_count.rotinas`: Quantidade de rotinas vinculadas
- `_count.empresas`: Quantidade de empresas usando o pilar

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L43-L55)

---

### R-PIL-003: Busca de Pilar Ativo com Rotinas e Empresas

**Descrição:** Endpoint retorna pilar ativo completo com rotinas ativas vinculadas e empresas.

**Implementação:**
- **Endpoint:** `GET /pilares/:id` (autenticado, todos os perfis)
- **Método:** `PilaresService.findOne()`

**Filtro (ATUALIZADO):**
```typescript
where: { 
  id,
  ativo: true,  // Apenas pilares ativos
}
```

**Include:**
```typescript
include: {
  rotinas: {
    where: { ativo: true },
    orderBy: { ordem: 'asc' },
  },
  empresas: {
    include: {
      empresa: {
        select: {
          id: true,
          nome: true,
          cnpj: true,
        },
      },
    },
  },
}
```

**Retorno:**
- Dados completos do pilar
- Lista de rotinas ativas ordenadas
- Lista de empresas vinculadas (via PilarEmpresa)

**Exceção:**
- Lança `NotFoundException` se pilar não existir

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L57-L81)

---

### R-PIL-004: Atualização de Pilar com Validação de Nome Único

**Descrição:** Sistema valida unicidade do nome ao atualizar, excluindo o próprio pilar.

**Implementação:**
- **Endpoint:** `PATCH /pilares/:id` (restrito a ADMINISTRADOR)
- **Método:** `PilaresService.update()`
- **DTO:** UpdatePilarDto

**Validação:**
```typescript
if (updatePilarDto.nome) {
  const existingPilar = await this.prisma.pilar.findFirst({
    where: {
      nome: updatePilarDto.nome,
      id: { not: id },
    },
  });

  if (existingPilar) {
    throw new ConflictException('Já existe um pilar com este nome');
  }
}
```

**Validação de DTO:**
- `nome`: string, optional, 2-100 caracteres
- `descricao`: string, optional, 0-500 caracteres
- `ordem`: number, optional, >= 1
- `ativo`: boolean, optional

**Auditoria:**
- Registra estado antes e depois
- Ação: UPDATE
- Dados completos da mudança

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L83-L117)

---

### R-PIL-005: Desativação de Pilar (Soft Delete)

**Descrição:** Sistema desativa pilar (ativo: false) ao invés de deletar fisicamente.

**Implementação:**
- **Endpoint:** `DELETE /pilares/:id` (restrito a ADMINISTRADOR)
- **Método:** `PilaresService.remove()`

**Comportamento:**
```typescript
const after = await this.prisma.pilar.update({
  where: { id },
  data: {
    ativo: false,
    updatedBy: userId,
  },
});
```

**Auditoria:**
- Registra estado antes e depois
- Ação: DELETE (mas operação é UPDATE)
- Dados completos da mudança

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L119-L151)

---

### RA-PIL-001: Validação de Rotinas Ativas Antes de Desativar

**Descrição:** Sistema impede desativação de pilar se houver rotinas ativas vinculadas.

**Implementação:**
- **Método:** `PilaresService.remove()`

**Validação:**
```typescript
const rotiasCount = await this.prisma.rotina.count({
  where: {
    pilarId: id,
    ativo: true,
  },
});

if (rotiasCount > 0) {
  throw new ConflictException(
    'Não é possível desativar um pilar que possui rotinas ativas',
  );
}
```

**Exceção:**
- HTTP 409 Conflict se houver rotinas ativas
- Mensagem clara do motivo do bloqueio

**Justificativa:**
- Integridade referencial lógica
- Impede quebra de dependências ativas

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L122-L134)

---

### RA-PIL-002: Restrição de CRUD a ADMINISTRADOR

**Descrição:** Apenas usuários com perfil ADMINISTRADOR podem criar, atualizar ou deletar pilares no catálogo global.

**Implementação:**
- **Decorator:** `@Roles('ADMINISTRADOR')`
- **Guard:** RolesGuard
- **Endpoints protegidos:**
  - POST /pilares
  - PATCH /pilares/:id
  - DELETE /pilares/:id

**Exceção:**
- GET /pilares e GET /pilares/:id são liberados para todos os perfis autenticados

**Arquivo:** [pilares.controller.ts](../../backend/src/modules/pilares/pilares.controller.ts#L29-L79)

---

### RA-PIL-003: Auditoria Completa de Operações

**Descrição:** Todas as operações CUD (Create, Update, Delete) são auditadas.

**Implementação:**
- **Serviço:** AuditService
- **Entidade:** 'pilares'

**Dados auditados:**
- usuarioId, usuarioNome, usuarioEmail
- entidade: 'pilares'
- entidadeId: ID do pilar
- acao: CREATE | UPDATE | DELETE
- dadosAntes (em update/delete)
- dadosDepois (em create/update/delete)

**Cobertura:**
- ✅ CREATE (criação de pilar)
- ✅ UPDATE (atualização de pilar)
- ✅ DELETE (desativação de pilar)

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L32-L40)

---

### R-EMP-004: Auto-Associação de Pilares Padrão a Novas Empresas

**Descrição:** Ao criar uma empresa, pilares com `modelo: true` são automaticamente vinculados via PilarEmpresa.

**Implementação:**
- **Módulo:** EmpresasService
- **Método:** `create()`
- **Configuração:** `AUTO_ASSOCIAR_PILARES_PADRAO` (env var)

**Comportamento:**
```typescript
const autoAssociate = process.env.AUTO_ASSOCIAR_PILARES_PADRAO !== 'false';

if (autoAssociate) {
  const pilaresModelo = await this.prisma.pilar.findMany({
    where: { 
      modelo: true, 
      ativo: true 
    },
    orderBy: { ordem: 'asc' },
  });
  
  if (pilaresModelo.length > 0) {
    await this.prisma.pilarEmpresa.createMany({
      data: pilaresModelo.map((pilar, index) => ({
        empresaId: created.id,
        pilarId: pilar.id,
        ordem: pilar.ordem ?? (index + 1),
        createdBy: userId,
      })),
    });
  }
}
```

**Configuração:**
- `AUTO_ASSOCIAR_PILARES_PADRAO="true"` (padrão): Associa automaticamente
- `AUTO_ASSOCIAR_PILARES_PADRAO="false"`: Não associa (manual)

**Justificativa:**
- Onboarding rápido de novas empresas
- Padronização inicial
- Admin pode desvincular pilares não utilizados depois

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L26-L51)

---

### R-PILEMP-001: Listagem de Pilares por Empresa (Multi-Tenant)

**Descrição:** Endpoint retorna pilares ativos de uma empresa específica, ordenados por `PilarEmpresa.ordem`.

**Implementação:**
- **Endpoint:** `GET /empresas/:empresaId/pilares` (autenticado)
- **Módulo:** PilaresEmpresaService
- **Método:** `findByEmpresa()`

**Validação Multi-Tenant:**
```typescript
if (user.perfil?.codigo !== 'ADMINISTRADOR') {
  if (user.empresaId !== empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }
}
```

**Filtro (Cascata Lógica):**
```typescript
where: {
  empresaId,
  ativo: true,
  pilar: { ativo: true },  // Pilar desativado = invisível para empresa
}
```

**Ordenação:**
```typescript
orderBy: { ordem: 'asc' }  // PilarEmpresa.ordem (per-company)
```

**Retorno:**
- Array de PilarEmpresa com Pilar incluido
- `_count.rotinas` e `_count.empresas` do Pilar
- Ordenado por ordem da empresa (não ordem global)

**Perfis autorizados:** Todos (com validação multi-tenant)

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L31-L56)

---

### R-PILEMP-002: Reordenação de Pilares por Empresa

**Descrição:** Endpoint permite reordenar pilares de uma empresa específica (atualiza `PilarEmpresa.ordem`).

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares/reordenar` (ADMINISTRADOR, GESTOR)
- **Módulo:** PilaresEmpresaService
- **Método:** `reordenar()`

**Input:**
```typescript
{
  "ordens": [
    { "id": "uuid-pilar-empresa-1", "ordem": 1 },
    { "id": "uuid-pilar-empresa-2", "ordem": 2 }
  ]
}
```

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. IDs pertencem à empresa especificada?
3. Ordem >= 1?

**Comportamento:**
```typescript
const updates = ordens.map((item) =>
  this.prisma.pilarEmpresa.update({
    where: { id: item.id },
    data: {
      ordem: item.ordem,
      updatedBy: user.id,
    },
  }),
);

await this.prisma.$transaction(updates);
```

**Auditoria:**
- Entidade: `pilares_empresa`
- Acao: `UPDATE`
- EntidadeId: empresaId

**Atomicidade:** Transação (rollback se falhar)

**Perfis autorizados:** ADMINISTRADOR, GESTOR

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L58-L118)

---

### R-PILEMP-003: Vinculação Incremental de Pilares à Empresa

**Descrição:** Endpoint permite vincular novos pilares a uma empresa sem remover os existentes (adição incremental).

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares/vincular` (ADMINISTRADOR, GESTOR)
- **Módulo:** PilaresEmpresaService
- **Método:** `vincularPilares()`

**Input:**
```typescript
{
  "pilaresIds": ["uuid-pilar-1", "uuid-pilar-2"]
}
```

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. Pilares existem e estão ativos?
3. Filtra IDs já vinculados (evita duplicatas)

**Comportamento:**
```typescript
// Filtrar pilares já vinculados
const jaVinculados = await this.prisma.pilarEmpresa.findMany({
  where: {
    empresaId,
    pilarId: { in: pilaresIds },
  },
});

const novosIds = pilaresIds.filter(id => !jaVinculados.includes(id));

// Calcular próxima ordem disponível
const maxOrdem = await this.prisma.pilarEmpresa.findFirst({
  where: { empresaId },
  orderBy: { ordem: 'desc' },
});

const proximaOrdem = (maxOrdem?.ordem ?? 0) + 1;

// Criar novos vínculos (INCREMENTAL)
await this.prisma.pilarEmpresa.createMany({
  data: novosIds.map((pilarId, index) => ({
    empresaId,
    pilarId,
    ordem: proximaOrdem + index,
    createdBy: user.id,
  })),
});
```

**Auditoria:**
- Entidade: `pilares_empresa`
- Acao: `UPDATE`
- EntidadeId: empresaId

**Retorno:**
```typescript
{
  vinculados: number,       // Quantidade de novos vínculos
  ignorados: string[],      // IDs já vinculados
  pilares: PilarEmpresa[]   // Lista atualizada
}
```

**Perfis autorizados:** ADMINISTRADOR, GESTOR

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L120-L203)

---

### RA-PILEMP-001: Cascata Lógica em Desativação de Pilar

**Descrição:** Quando um pilar é desativado (Pilar.ativo = false), ele automaticamente some de todas empresas via filtro de cascata.

**Implementação:**
- PilarEmpresa.ativo continua `true` (histórico preservado)
- Filtro em queries: `WHERE pilar.ativo = true AND pilarEmpresa.ativo = true`
- Efeito: Pilar inativo = invisível em todas empresas

**Justificativa:**
- Preserva histórico de vinculação
- Permite reativação do pilar (restaura visibilidade automaticamente)
- Sem necessidade de desativar PilarEmpresa manualmente

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L41)

---

### R-PILEMP-004: Auto-Associação de Rotinas Modelo

**Descrição:** Ao vincular um pilar a uma empresa, rotinas com `modelo: true` desse pilar são automaticamente associadas.

**Implementação:**
- **Módulo:** PilaresEmpresaService
- **Método:** `autoAssociarRotinasModelo()`
- **Trigger:** Após criar `PilarEmpresa` (em `vincularPilares`)

**Comportamento:**
```typescript
const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
  where: { id: pilarEmpresaId },
  include: {
    pilar: {
      include: {
        rotinas: {
          where: {
            modelo: true,
            ativo: true,
          },
        },
      },
    },
  },
});

const rotinaEmpresaData = rotinasModelo.map((rotina, index) => ({
  pilarEmpresaId: pilarEmpresa.id,
  rotinaId: rotina.id,
  ordem: rotina.ordem ?? (index + 1),
  createdBy: user.id,
}));

await this.prisma.rotinaEmpresa.createMany({
  data: rotinaEmpresaData,
  skipDuplicates: true,
});
```

**Auditoria:**
- Entidade: `pilares_empresa`
- Ação: `UPDATE`
- Dados: rotinas associadas automaticamente

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L205-L272)

---

### R-PILEMP-005: Remoção de Pilar da Empresa (Hard Delete)

**Descrição:** Endpoint remove completamente o vínculo PilarEmpresa, cascateando automaticamente RotinaEmpresa e NotaRotina.

**Implementação:**
- **Endpoint:** `DELETE /empresas/:empresaId/pilares/:pilarEmpresaId` (ADMINISTRADOR, GESTOR)
- **Módulo:** PilaresEmpresaService
- **Método:** `remover()`

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. PilarEmpresa pertence à empresa especificada?

**Comportamento:**
```typescript
// Hard delete (cascata automática via Prisma)
const deleted = await this.prisma.pilarEmpresa.delete({
  where: { id: pilarEmpresaId }
});
```

**Cascata Automática (via Schema):**
- `RotinaEmpresa` → `onDelete: Cascade`
- `NotaRotina` (via RotinaEmpresa) → `onDelete: Cascade`
- `PilarEvolucao` → `onDelete: Cascade`

**Auditoria:**
- Entidade: `pilares_empresa`
- Ação: `DELETE`
- Dados: nome do pilar removido

**Retorno:**
```typescript
{
  message: 'Pilar "Marketing" removido com sucesso',
  pilarEmpresa: deleted
}
```

**Perfis autorizados:** ADMINISTRADOR, GESTOR

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L274-L321)

---

### R-PILEMP-006: Definir ou Remover Responsável de Pilar

**Descrição:** Endpoint permite definir ou remover o usuário responsável pelo acompanhamento de um pilar em uma empresa.

**Implementação:**
- **Endpoint:** `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/responsavel` (ADMINISTRADOR, GESTOR)
- **Módulo:** PilaresEmpresaService
- **Método:** `definirResponsavel()`

**Input:**
```typescript
{
  "responsavelId": "uuid-usuario" | null
}
```

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. PilarEmpresa pertence à empresa especificada?
3. Se `responsavelId` fornecido:
   - Usuário existe?
   - Usuário pertence à mesma empresa?

**Comportamento:**
```typescript
// Se responsavelId for fornecido, validar
if (responsavelId) {
  const responsavel = await this.prisma.usuario.findUnique({
    where: { id: responsavelId },
  });

  if (!responsavel) {
    throw new NotFoundException('Usuário responsável não encontrado');
  }

  if (responsavel.empresaId !== empresaId) {
    throw new ForbiddenException(
      'O responsável deve pertencer à mesma empresa do pilar',
    );
  }
}

// Atualizar responsável
const updated = await this.prisma.pilarEmpresa.update({
  where: { id: pilarEmpresaId },
  data: {
    responsavelId: responsavelId || null,
    updatedBy: user.id,
  },
});
```

**Auditoria:**
- Entidade: `pilares_empresa`
- Ação: `UPDATE`
- Dados: antes e depois do responsavelId

**Perfis autorizados:** ADMINISTRADOR, GESTOR

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L323-L376)

---

### R-PILEMP-007: Listar Rotinas de Pilar da Empresa

**Descrição:** Endpoint retorna rotinas vinculadas a um pilar específico de uma empresa, ordenadas por `RotinaEmpresa.ordem`.

**Implementação:**
- **Endpoint:** `GET /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas` (todos os perfis)
- **Módulo:** PilaresEmpresaService
- **Método:** `listarRotinas()`

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. PilarEmpresa pertence à empresa especificada?

**Filtro:**
```typescript
where: { pilarEmpresaId }
```

**Ordenação:**
```typescript
orderBy: { ordem: 'asc' }
```

**Include:**
```typescript
include: {
  rotina: {
    include: {
      pilar: true,
    },
  },
}
```

**Retorno:** Array de `RotinaEmpresa` com rotina e pilar incluídos

**Perfis autorizados:** Todos (com validação multi-tenant)

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L378-L404)

---

### R-PILEMP-008: Vincular Rotina a Pilar da Empresa

**Descrição:** Endpoint permite vincular uma rotina a um pilar da empresa, criando `RotinaEmpresa`.

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas` (ADMINISTRADOR, GESTOR)
- **Módulo:** PilaresEmpresaService
- **Método:** `vincularRotina()`

**Input:**
```typescript
{
  "rotinaId": "uuid-rotina",
  "ordem": 1  // opcional
}
```

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. PilarEmpresa pertence à empresa especificada?
3. Rotina existe e está ativa?
4. Rotina pertence ao mesmo pilar?
5. Rotina já não está vinculada?

**Comportamento:**
```typescript
// Validar que a rotina pertence ao mesmo pilar
if (rotina.pilarId !== pilarEmpresa.pilarId) {
  throw new BadRequestException('A rotina não pertence a este pilar');
}

// Verificar se já existe vínculo
const existente = await this.prisma.rotinaEmpresa.findUnique({
  where: {
    pilarEmpresaId_rotinaId: { pilarEmpresaId, rotinaId },
  },
});

if (existente) {
  throw new BadRequestException('Esta rotina já está vinculada a este pilar');
}

// Calcular ordem se não fornecida
let ordemFinal = ordem;
if (!ordemFinal) {
  const ultimaRotina = await this.prisma.rotinaEmpresa.findFirst({
    where: { pilarEmpresaId },
    orderBy: { ordem: 'desc' },
  });
  ordemFinal = ultimaRotina ? ultimaRotina.ordem + 1 : 1;
}

// Criar vínculo
await this.prisma.rotinaEmpresa.create({
  data: { pilarEmpresaId, rotinaId, ordem: ordemFinal, createdBy: user.id },
});
```

**Auditoria:**
- Entidade: `rotinas_empresa`
- Ação: `CREATE`

**Perfis autorizados:** ADMINISTRADOR, GESTOR

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L406-L478)

---

### R-PILEMP-009: Remover Rotina de Pilar da Empresa

**Descrição:** Endpoint remove `RotinaEmpresa` e reordena automaticamente as rotinas restantes.

**Implementação:**
- **Endpoint:** `DELETE /empresas/:empresaId/pilares/rotinas/:rotinaEmpresaId` (ADMINISTRADOR, GESTOR)
- **Módulo:** PilaresEmpresaService
- **Método:** `removerRotina()`

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. RotinaEmpresa pertence à empresa especificada?

**Comportamento:**
```typescript
// Deletar (cascata automática de NotaRotina via schema)
const deleted = await this.prisma.rotinaEmpresa.delete({
  where: { id: rotinaEmpresaId },
});

// Reordenar rotinas restantes
const rotinasRestantes = await this.prisma.rotinaEmpresa.findMany({
  where: { pilarEmpresaId: rotinaEmpresa.pilarEmpresaId },
  orderBy: { ordem: 'asc' },
});

const updates = rotinasRestantes.map((r, index) =>
  this.prisma.rotinaEmpresa.update({
    where: { id: r.id },
    data: { ordem: index + 1, updatedBy: user.id },
  }),
);

await this.prisma.$transaction(updates);
```

**Cascata Automática (via Schema):**
- `NotaRotina` → `onDelete: Cascade`

**Auditoria:**
- Entidade: `rotinas_empresa`
- Ação: `DELETE`

**Reordenação Automática:**
- Rotinas restantes são renumeradas sequencialmente (1, 2, 3...)
- Mantém consistência da ordenação

**Perfis autorizados:** ADMINISTRADOR, GESTOR

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L480-L535)

---

### R-PILEMP-010: Reordenar Rotinas de Pilar da Empresa

**Descrição:** Endpoint permite reordenar rotinas de um pilar específico, atualizando `RotinaEmpresa.ordem`.

**Implementação:**
- **Endpoint:** `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas/reordenar` (ADMINISTRADOR, GESTOR)
- **Módulo:** PilaresEmpresaService
- **Método:** `reordenarRotinas()`

**Input:**
```typescript
{
  "ordens": [
    { "id": "uuid-rotina-empresa-1", "ordem": 1 },
    { "id": "uuid-rotina-empresa-2", "ordem": 2 }
  ]
}
```

**Validação:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. PilarEmpresa pertence à empresa especificada?
3. Todos os IDs pertencem ao pilarEmpresaId?

**Comportamento:**
```typescript
// Validar que todos os IDs pertencem ao pilarEmpresa
const existingRotinas = await this.prisma.rotinaEmpresa.findMany({
  where: {
    id: { in: idsToUpdate },
    pilarEmpresaId,
  },
});

if (existingRotinas.length !== idsToUpdate.length) {
  throw new NotFoundException('Rotinas não encontradas neste pilar');
}

// Atualizar ordens em transação
const updates = ordens.map((item) =>
  this.prisma.rotinaEmpresa.update({
    where: { id: item.id },
    data: { ordem: item.ordem, updatedBy: user.id },
  }),
);

await this.prisma.$transaction(updates);
```

**Auditoria:**
- Entidade: `rotinas_empresa`
- Ação: `UPDATE`

**Atomicidade:** Transação (rollback se falhar)

**Perfis autorizados:** ADMINISTRADOR, GESTOR

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L537-L582)

---

## 4. Validações

### 4.1. CreatePilarDto

**Campos:**
- `nome`: @IsString(), @IsNotEmpty(), @Length(2, 100)
- `descricao`: @IsString(), @IsOptional(), @Length(0, 500)
- `ordem`: @IsInt(), @Min(1), @IsOptional() ← ATUALIZADO
- `modelo`: @IsBoolean(), @IsOptional()

**Validações implementadas:**
- Nome obrigatório, entre 2 e 100 caracteres
- Descrição opcional, máximo 500 caracteres
- Ordem opcional, mínimo 1 se fornecido
- Modelo opcional (default: false)

**Arquivo:** [create-pilar.dto.ts](../../backend/src/modules/pilares/dto/create-pilar.dto.ts)

---

### 4.2. UpdatePilarDto

**Campos:**
- Herda todos os campos de CreatePilarDto como opcionais (PartialType)
- `ativo`: @IsBoolean(), @IsOptional()

**Validações implementadas:**
- Todos os campos opcionais
- Ativo permite ativação/desativação manual (além do soft delete)

**Arquivo:** [update-pilar.dto.ts](../../backend/src/modules/pilares/dto/update-pilar.dto.ts)

---

### 4.3. ReordenarPilaresDto

**Descrição:** DTO para reordenação de pilares por empresa.

**Campos:**
- `ordens`: Array de objetos OrdemPilarEmpresaDto

**OrdemPilarEmpresaDto:**
- `id`: @IsUUID() — ID do PilarEmpresa
- `ordem`: @IsInt(), @Min(1) — Nova ordem (mínimo 1)

**Validações implementadas:**
- Array obrigatório com validação aninhada
- ID deve ser UUID válido
- Ordem obrigatória, inteiro >= 1
- Cada item do array validado individualmente

**Implementação:**
```typescript
export class OrdemPilarEmpresaDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(1)
  ordem: number;
}

export class ReordenarPilaresDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdemPilarEmpresaDto)
  ordens: OrdemPilarEmpresaDto[];
}
```

**Arquivo:** [reordenar-pilares.dto.ts](../../backend/src/modules/pilares-empresa/dto/reordenar-pilares.dto.ts)

---

### 4.4. VincularPilaresDto

**Descrição:** DTO para vincular pilares a uma empresa.

**Campos:**
- `pilaresIds`: @IsArray(), @IsUUID({ each: true })

**Validações implementadas:**
- Array obrigatório de UUIDs
- Cada ID validado como UUID
- Array pode estar vazio (mas deve ser fornecido)

**Arquivo:** [vincular-pilares.dto.ts](../../backend/src/modules/pilares-empresa/dto/vincular-pilares.dto.ts)

---

## 5. Comportamentos Condicionais

### 5.1. Pilares Inativos Não Aparecem em Listagem ou Busca

**Condição:** `pilar.ativo === false`

**Comportamento:**
- Pilares inativos não são retornados em `findAll()`
- **ATUALIZADO:** `findOne()` também filtra por `ativo: true`
- Pilares inativos retornam 404 Not Found
- Não aparecem em interfaces de seleção

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L44-L45)

---

### 5.2. Ordenação Por Empresa (Multi-Tenant)

**Condição:** Sempre em `GET /empresas/:empresaId/pilares`

**Comportamento:**
- Pilares retornados ordenados por `PilarEmpresa.ordem` (per-company)
- Cada empresa tem sua própria ordenação independente
- Ordem pode ser personalizada via `/empresas/:empresaId/pilares/reordenar`

**Justificativa:**
- Empresas diferentes priorizam pilares diferentes
- Ordenação global (`Pilar.ordem`) é apenas referência visual

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L50)

---

### 5.3. Rotinas Ativas Filtradas em Busca de Pilar

**Condição:** `GET /pilares/:id`

**Comportamento:**
- Apenas rotinas com `ativo: true` são incluídas
- Rotinas inativas existem mas não aparecem

**Justificativa:**
- Ocultar rotinas desativadas de usuários finais
- Manter dados históricos sem poluir interface

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L63-L66)

---

### 5.4. Validação de Nome Única Apenas se Nome Fornecido

**Condição:** `updatePilarDto.nome` existe

**Comportamento:**
- Validação de unicidade só ocorre se nome for fornecido no update
- Se nome não mudar, validação não é executada

**Otimização:**
- Evita query desnecessária ao banco

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L85-L97)

---

### 5.5. Bloqueio de Desativação com Rotinas Ativas

**Condição:** Pilar possui rotinas ativas

**Comportamento:**
- Sistema lança ConflictException
- Desativação é bloqueada
- Mensagem clara do motivo

**Exceção:**
- Se todas as rotinas estiverem inativas, desativação é permitida

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L122-L134)

---

### 5.6. Auto-Associação de Pilares Padrão

**Condição:** Criação de nova empresa + `AUTO_ASSOCIAR_PILARES_PADRAO=true`

**Comportamento:**
- Sistema busca pilares com `modelo: true` e `ativo: true`
- Cria PilarEmpresa automaticamente para cada pilar encontrado
- Preserva ordem original do catálogo global

**Configuração:**
- Env var: `AUTO_ASSOCIAR_PILARES_PADRAO`
- Default: `true`
- Para desabilitar: `AUTO_ASSOCIAR_PILARES_PADRAO="false"`

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L26-L51)

---

### 5.7. Cascata Lógica em Desativação de Pilar

**Condição:** Pilar desativado (`pilar.ativo = false`)

**Comportamento:**
- PilarEmpresa.ativo **NÃO** é alterado (continua `true`)
- Filtro de cascata: `WHERE pilar.ativo = true AND pilarEmpresa.ativo = true`
- Pilar inativo automaticamente some de todas empresas
- Se pilar for reativado, volta a aparecer automaticamente

**Justificativa:**
- Preserva histórico de vinculação
- Permite reativação sem precisar revincular manualmente

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L41)

---

## 6. Ausências ou Ambiguidades (ATUALIZADO)

### 6.1. Campo `modelo` Implementado

**Status:** ✅ IMPLEMENTADO

**Descrição:**
- Campo `modelo` agora controla auto-associação de pilares
- Pilares com `modelo: true` são automaticamente vinculados a novas empresas
- Configurável via `AUTO_ASSOCIAR_PILARES_PADRAO`

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L26-L51)

---

### 6.2. Reordenação de Pilar Global Removida

**Status:** ✅ RESOLVIDO

**Descrição:**
- Endpoint `POST /pilares/reordenar` foi **removido**
- Campo `Pilar.ordem` agora é **opcional** (apenas referência visual)
- Ordenação funcional acontece em `PilarEmpresa.ordem` (per-company)
- Endpoint de reordenação movido para `/empresas/:id/pilares/reordenar`

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L58-L118)

---

### 6.3. Validação de Ordem Duplicada

**Status:** ✅ NÃO APLICÁVEL

**Descrição:**
- Campo `Pilar.ordem` é opcional e apenas referência
- Não há necessidade de validar duplicatas
- Ordenação funcional usa `PilarEmpresa.ordem` (validado por empresa)

---

### 6.4. Validação de IDs em Reordenação

**Status:** ✅ IMPLEMENTADO

**Descrição:**
- Módulo PilaresEmpresa valida IDs antes de reordenar
- Lança `NotFoundException` com mensagem clara se ID inválido
- Valida que IDs pertencem à empresa especificada

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L70-L83)

---

### 6.5. Paginação Ausente em Listagem

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Endpoint `GET /pilares` retorna todos os pilares ativos
- Não há paginação, filtros ou busca
- Pode ser problemático com muitos pilares

**TODO:**
- Implementar paginação (skip, take, cursor-based)
- Adicionar filtros (busca por nome, modelo)
- Considerar se número de pilares justifica paginação

---

### 6.6. Cascata Lógica em Desativação

**Status:** ✅ IMPLEMENTADO

**Descrição:**
- Desativar pilar NÃO altera `PilarEmpresa.ativo`
- Filtro de cascata: `pilar.ativo = true AND pilarEmpresa.ativo = true`
- Pilar desativado automaticamente some de todas empresas
- Preserva histórico de vinculação

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L41)

---

### 6.7. Multi-Tenancy Implementado

**Status:** ✅ IMPLEMENTADO

**Descrição:**
- Módulo PilaresEmpresa implementa isolamento multi-tenant
- Validação: `user.empresaId === empresaId` (exceto ADMINISTRADOR)
- Cada empresa tem ordenação independente via `PilarEmpresa.ordem`
- Pilares são catálogo global, vinculação é per-company

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L19-L28)

---

### 6.8. Soft Delete Consistente

**Status:** ✅ IMPLEMENTADO

**Descrição:**
- `findAll()` filtra por `ativo: true`
- `findOne()` filtra por `ativo: true`
- Pilares inativos retornam 404 Not Found
- Comportamento consistente em toda a aplicação

**Implementação:**
```typescript
async findOne(id: string) {
  const pilar = await this.prisma.pilar.findFirst({
    where: { 
      id,
      ativo: true,  // ✅ FILTRA POR ATIVO
    },
    // ...
  });

  if (!pilar) {
    throw new NotFoundException('Pilar não encontrado');
  }

  return pilar;
}
```

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L57-L81)

---

### 6.9. Reordenação Pode Causar Ordens Negativas ou Zero

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- DTO de reordenação não valida valores de ordem
- Possível enviar ordem negativa ou zero
- CreatePilarDto exige ordem >= 1, mas reordenação não valida

**TODO:**
- Adicionar validação em DTO de reordenação
- Ou validar dentro do método `reordenar()`
- Garantir ordem sempre >= 1

---

### 6.10. findOne() Usado Internamente Pode Lançar NotFoundException

**Status:** ⚠️ EFEITO COLATERAL

**Descrição:**
- `update()` e `remove()` chamam `findOne()` internamente
- `findOne()` lança NotFoundException se pilar não existir
- Comportamento correto, mas não documentado

**Comportamento:**
- Update/Delete de ID inválido retorna 404 (correto)
- Mas lógica está "escondida" em `findOne()`

**Observação:**
- Não é bug, mas pode confundir manutenção futura

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L85)

---

## 7. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-PIL-001** | Criação com nome único | ✅ Implementado |
| **R-PIL-002** | Listagem de ativos com contadores | ✅ Implementado |
| **R-PIL-003** | Busca com rotinas e empresas | ✅ Implementado |
| **R-PIL-004** | Atualização com validação de nome | ✅ Implementado |
| **R-PIL-005** | Soft delete | ✅ Implementado |
| **RA-PIL-001** | Bloqueio por rotinas ativas | ✅ Implementado |
| **RA-PIL-002** | Restrição a ADMINISTRADOR | ✅ Implementado |
| **RA-PIL-003** | Auditoria de operações CUD | ✅ Implementado |

**Módulo Empresas (Auto-Associação):**

| ID | Descrição | Status |
|----|-----------|--------|
| **R-EMP-004** | Auto-associação de pilares padrão | ✅ Implementado |

**Módulo PilaresEmpresa (Multi-Tenant):**

| ID | Descrição | Status |
|----|-----------|--------|
| **R-PILEMP-001** | Listagem de pilares por empresa | ✅ Implementado |
| **R-PILEMP-002** | Reordenação per-company | ✅ Implementado |
| **R-PILEMP-003** | Vinculação incremental de pilares | ✅ Implementado |
| **RA-PILEMP-001** | Cascata lógica em desativação | ✅ Implementado |

**Melhorias implementadas:**
- ✅ Campo `modelo` com auto-associação
- ✅ Reordenação movida para PilaresEmpresa
- ✅ Validação de IDs em reordenação
- ✅ Multi-tenancy implementado
- ✅ Soft delete consistente (findOne filtra ativo)
- ✅ Ordem com validação >= 1 em DTOs

---

## 8. Fluxo de Operações (ATUALIZADO)

### 8.1. Criação de Pilar

```
1. ADMINISTRADOR envia POST /pilares
2. DTO valida campos (nome obrigatório, descrição e ordem opcionais)
3. Service valida unicidade de nome
4. Se nome duplicado → 409 Conflict
5. Cria pilar com createdBy
6. Registra auditoria (CREATE)
7. Retorna pilar criado (201)
```

---

### 8.2. Criação de Empresa (com Auto-Associação)

```
1. ADMINISTRADOR envia POST /empresas
2. Service cria empresa
3. Se AUTO_ASSOCIAR_PILARES_PADRAO=true:
   a. Busca pilares com modelo:true e ativo:true
   b. Cria PilarEmpresa para cada pilar encontrado
   c. Preserva ordem original (Pilar.ordem)
4. Retorna empresa criada (201)
```

---

### 8.3. Desativação de Pilar (com Cascata Lógica)

```
1. ADMINISTRADOR envia DELETE /pilares/:id
2. Service busca pilar ativo (findOne com filtro ativo:true)
3. Se não existe ou inativo → 404 Not Found
4. Conta rotinas ativas vinculadas
5. Se rotinas ativas > 0 → 409 Conflict
6. Atualiza ativo: false
7. PilarEmpresa.ativo NÃO é alterado (cascata lógica)
8. Pilar some automaticamente de todas empresas (via filtro)
9. Registra auditoria (DELETE)
10. Retorna pilar desativado (200)
```

---

### 8.4. Reordenação de Pilares por Empresa

```
1. ADMINISTRADOR ou GESTOR envia POST /empresas/:empresaId/pilares/reordenar
2. Service valida acesso multi-tenant
3. Valida que IDs pertencem à empresa
4. Se algum ID não pertence → 404 Not Found com lista de IDs inválidos
5. DTO valida ordem >= 1
6. Cria array de updates em PilarEmpresa
7. Executa em transação atômica
8. Se falhar → rollback completo
9. Registra auditoria (UPDATE)
10. Retorna lista atualizada (200)
```

---

## 9. Relacionamentos

### 9.1. Pilar → Rotina (1:N)

**Descrição:**
- Um pilar pode ter várias rotinas
- Rotina pertence a um único pilar

**Comportamento:**
- Rotinas ativas impedem desativação do pilar (RA-PIL-001)
- Rotinas incluídas em findOne() (apenas ativas)

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation rotinas)

---

### 9.2. Pilar → PilarEmpresa → Empresa (N:N)

**Descrição:**
- Relação many-to-many entre Pilar e Empresa
- Mediada por tabela PilarEmpresa

**Comportamento:**
- Empresas "escolhem" quais pilares usar via vinculação
- PilarEmpresa permite ordenação customizada por empresa
- Cascata lógica: Pilar inativo = invisível para todas empresas

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation empresas)

---

## 10. Referências (ATUALIZADO)

**Módulo Pilares:**
- [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts)
- [pilares.controller.ts](../../backend/src/modules/pilares/pilares.controller.ts)
- [create-pilar.dto.ts](../../backend/src/modules/pilares/dto/create-pilar.dto.ts)
- [update-pilar.dto.ts](../../backend/src/modules/pilares/dto/update-pilar.dto.ts)
- [pilares.module.ts](../../backend/src/modules/pilares/pilares.module.ts)

**Módulo PilaresEmpresa:**
- [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts)
- [pilares-empresa.controller.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.controller.ts)
- [reordenar-pilares.dto.ts](../../backend/src/modules/pilares-empresa/dto/reordenar-pilares.dto.ts)
- [pilares-empresa.module.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.module.ts)

**Módulo Empresas (Auto-Associação):**
- [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts) (método create)

**Schema:**
- [schema.prisma](../../backend/prisma/schema.prisma) (Pilar, PilarEmpresa, RotinaEmpresa)

**Dependências:**
- AuditService (auditoria de operações)
- PrismaService (acesso ao banco)
- JwtAuthGuard (autenticação)
- RolesGuard (autorização por perfil)

**Configuração:**
- [.env](../../backend/.env) (`AUTO_ASSOCIAR_PILARES_PADRAO`)

---

## 11. Regras de Interface (Frontend)

### UI-PIL-001: Tela de Listagem de Pilares

**Descrição:** Interface administrativa para gerenciamento de pilares do sistema.

**Acesso:** Apenas ADMINISTRADOR  
**Rota:** `/pilares`  
**Guard:** `AdminGuard`

**Localização:** `frontend/src/app/views/pages/pilares/pilares-list/`

**Campos Exibidos na Tabela:**

| Coluna | Origem | Formato |
|--------|--------|---------|
| Nome | `pilar.nome` | Texto |
| Descrição | `pilar.descricao` | Texto truncado (50 chars) + tooltip completo |
| Tipo | `pilar.modelo` | Badge (Padrão/Customizado) |
| Rotinas | `pilar._count.rotinas` | Número |
| Empresas | `pilar._count.empresas` | Número |
| Status | `pilar.ativo` | Badge (Ativo/Inativo) |
| Ações | - | Botões Editar, Desativar/Reativar |

**Funcionalidades:**
- Busca em tempo real por nome (debounce 300ms)
- Filtro por Status (Todos/Ativos/Inativos)
- Filtro por Tipo (Todos/Padrão/Customizados)
- Paginação (10 itens por página)
- Ordenação automática (ver UI-PIL-004)
- Exclusão individual (sem multi-select)

**Endpoint:** `GET /pilares`

---

### UI-PIL-002: Badge de Tipo (Padrão vs Customizado)

**Descrição:** Indicador visual do tipo de pilar.

**Lógica:**
```typescript
if (pilar.modelo === true) {
  badge = 'Padrão'
  classe = 'bg-primary' // cor primária (azul)
} else {
  badge = 'Customizado'
  classe = 'bg-secondary' // cor secundária (cinza)
}
```

**Renderização:**
```html
<span class="badge bg-primary">Padrão</span>
<span class="badge bg-secondary">Customizado</span>
```

**Arquivo:** `pilar-badge.component.ts` (reutilizável)

---

### UI-PIL-003: Contadores de Relacionamentos

**Descrição:** Exibição de métricas de uso do pilar.

**Colunas:**
- **Rotinas:** `_count.rotinas` (quantidade de rotinas vinculadas)
- **Empresas:** `_count.empresas` (quantidade de empresas usando)

**Tooltip (hover):**
```
Marketing
├─ 8 rotinas vinculadas
└─ 5 empresas usando
```

**Utilidade:**
- Informar impacto antes de desativar
- Visibilidade de uso do pilar no sistema

---

### UI-PIL-004: Ordenação de Exibição

**Descrição:** Lógica de ordenação na listagem.

**Algoritmo:**
```typescript
pilares.sort((a, b) => {
  // 1. Padrões primeiro
  if (a.modelo && !b.modelo) return -1;
  if (!a.modelo && b.modelo) return 1;
  
  // 2. Entre padrões: por ordem (se definida)
  if (a.modelo && b.modelo) {
    const ordemA = a.ordem ?? 9999;
    const ordemB = b.ordem ?? 9999;
    return ordemA - ordemB;
  }
  
  // 3. Entre customizados: alfabético
  return a.nome.localeCompare(b.nome);
});
```

**Resultado esperado:**
1. Estratégico (padrão, ordem: 1)
2. Marketing (padrão, ordem: 2)
3. Vendas (padrão, ordem: 3)
4. Inovação (customizado, alfabético)
5. Sustentabilidade (customizado, alfabético)

---

### UI-PIL-005: Formulário de Criação/Edição

**Descrição:** Formulário para criar ou editar pilares.

**Rotas:**
- Criar: `/pilares/novo`
- Editar: `/pilares/editar/:id`

**Localização:** `frontend/src/app/views/pages/pilares/pilares-form/`

**Campos:**

**Nome** (obrigatório)
- Validação: required, minLength(2), maxLength(100)
- Validação assíncrona: nome único (debounce 300ms)
- Erro: "Nome já cadastrado"

**Descrição** (opcional)
- Validação: maxLength(500)
- Textarea com 3 linhas

**Ordem** (opcional)
- Validação: optional, min(1)
- Input numérico
- Help text: "Ordem de exibição (apenas para pilares padrão)"
- Comportamento:
  - Se `modelo === true`: sugerir próxima ordem disponível
  - Se `modelo === false`: pode deixar vazio (null)

**Pilar Padrão do Sistema** (boolean)
- Checkbox
- Help text: "Pilares padrão são auto-associados a novas empresas"
- Default: `false`

**Botões:**
- Cancelar → Volta para `/pilares`
- Salvar → POST (criar) ou PATCH (editar) + redirect

**Endpoints:**
- Criar: `POST /pilares`
- Editar: `PATCH /pilares/:id`

---

### UI-PIL-006: Modal de Confirmação de Desativação

**Descrição:** Confirmação antes de desativar pilar.

**Trigger:** Click em botão "Desativar"

**Validação Prévia:**
```typescript
const pilar = await GET /pilares/:id
```

**Se `_count.rotinas > 0`:**
```
❌ Não é possível desativar

Este pilar possui X rotinas ativas vinculadas.
Desative as rotinas primeiro.

[Entendi]
```

**Se `_count.rotinas === 0`:**
```
⚠️ Confirmar Desativação

Deseja desativar o pilar "Marketing"?

Obs: Y empresas estão usando este pilar.
Elas não poderão mais vê-lo após desativação.

[Cancelar]  [Desativar]
```

**Ação ao confirmar:**
```
PATCH /pilares/:id
{ ativo: false }
```

**Feedback:**
```
✅ Pilar desativado com sucesso
```

**Endpoint:** `PATCH /pilares/:id`

---

### UI-PIL-007: Filtros de Listagem

**Descrição:** Filtros disponíveis na tela de listagem.

**Status:**
- Todos (sem filtro)
- Ativos (`WHERE ativo = true`)
- Inativos (`WHERE ativo = false`)

**Tipo:**
- Todos (sem filtro)
- Padrão (`WHERE modelo = true`)
- Customizados (`WHERE modelo = false`)

**Busca:**
- Campo de texto
- Debounce 300ms
- Case-insensitive
- Busca no campo `nome`

**Implementação:**
- Filtragem client-side (após carregar dados)
- Ou via query params para backend (futuro)

---

### UI-PIL-008: Permissões e Guards

**Descrição:** Controle de acesso à funcionalidade.

**Route Guard:**
```typescript
{
  path: 'pilares',
  canActivate: [AdminGuard],
  children: [
    { path: '', component: PilaresListComponent },
    { path: 'novo', component: PilaresFormComponent },
    { path: 'editar/:id', component: PilaresFormComponent }
  ]
}
```

**Comportamento:**
- Se `perfil.codigo !== 'ADMINISTRADOR'`:
  - Redirect para `/dashboard`
  - Ou exibir: "Acesso negado. Apenas Administradores."

**Menu Lateral:**
- Item "Pilares" só visível se `perfil.codigo === 'ADMINISTRADOR'`

---

### UI-PIL-009: Ações por Linha da Tabela

**Descrição:** Botões de ação disponíveis em cada linha.

**Editar:**
- Ícone: pencil
- Ação: Navegar para `/pilares/editar/:id`
- Sempre visível

**Desativar:**
- Ícone: trash
- Ação: Abrir modal de confirmação (UI-PIL-006)
- Visível apenas se `ativo === true`

**Reativar:**
- Ícone: check-circle
- Ação: `PATCH /pilares/:id { ativo: true }`
- Visível apenas se `ativo === false`
- Feedback: "Pilar reativado com sucesso"

---

## 12. Mudanças Necessárias no Schema

### SCHEMA-PIL-001: Campo `ordem` em Pilar Opcional

**Situação Atual:**
```prisma
model Pilar {
  ordem Int  // obrigatório
}
```

**Mudança Necessária:**
```prisma
model Pilar {
  ordem Int?  // opcional
}
```

**Justificativa:**
- Campo `ordem` só faz sentido para pilares padrão (modelo: true)
- Pilares customizados não utilizam ordenação numérica
- Permite valor null para customizados

**Migration:**
```sql
ALTER TABLE pilares ALTER COLUMN ordem DROP NOT NULL;
```

**Impacto:**
- Backend: Ajustar queries que usam `ordem`
- Frontend: Tratar null no campo ordem
- Seed: Pilares padrão devem ter ordem definida

**Arquivo:** `backend/prisma/schema.prisma`

---

### SCHEMA-PIL-002: Adicionar Campo `ordem` em PilarEmpresa

**Mudança Necessária:**
```prisma
model PilarEmpresa {
  id          String   @id @default(uuid())
  empresaId   String
  pilarId     String
  ordem       Int      // NOVO - obrigatório
  ativo       Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?
  updatedBy   String?
  
  // Relations
  empresa     Empresa  @relation(...)
  pilar       Pilar    @relation(...)
  rotinasEmpresa RotinaEmpresa[]
  evolucao       PilarEvolucao[]
  
  @@unique([empresaId, pilarId])
  @@map("pilares_empresa")
}
```

**Justificativa:**
- Cada empresa pode ter ordem personalizada de pilares
- Empresa A: [Vendas=1, Marketing=2, Estratégico=3]
- Empresa B: [Estratégico=1, Pessoas=2, Marketing=3]
- Permite customização por empresa

**Migration:**
```sql
ALTER TABLE pilares_empresa ADD COLUMN ordem INT NOT NULL DEFAULT 1;

-- Atualizar ordem baseada no pilar padrão (se existir)
UPDATE pilares_empresa pe
SET ordem = COALESCE(
  (SELECT p.ordem FROM pilares p WHERE p.id = pe.pilar_id),
  ROW_NUMBER() OVER (PARTITION BY pe.empresa_id ORDER BY pe.created_at)
);
```

**Comportamento Default:**
- Ao associar pilar padrão: usar `pilar.ordem` (se existir)
- Ao criar pilar customizado: calcular próxima ordem disponível
- Admin/Gestor pode reordenar depois

**Impacto:**
- Nova funcionalidade: Reordenar pilares por empresa
- Endpoint futuro: `POST /empresas/:id/pilares/reordenar`

---

### SCHEMA-PIL-003: Adicionar Campo `ordem` em RotinaEmpresa

**Mudança Necessária:**
```prisma
model RotinaEmpresa {
  id            String      @id @default(uuid())
  pilarEmpresaId String
  rotinaId      String
  ordem         Int         // NOVO - obrigatório
  observacao    String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?
  updatedBy     String?
  
  // Relations
  pilarEmpresa   PilarEmpresa @relation(...)
  rotina        Rotina      @relation(...)
  notas         NotaRotina[]
  
  @@index([pilarEmpresaId])
  @@index([rotinaId])
  @@unique([pilarEmpresaId, rotinaId])
  @@map("rotinas_empresa")
}
```

**Justificativa:**
- Cada empresa pode ter ordem personalizada de rotinas dentro de um pilar
- Empresa A, Pilar Marketing: [Rotina1=1, Rotina2=2]
- Empresa B, Pilar Marketing: [Rotina2=1, Rotina3=2] (ordem diferente)
- Permite customização granular

**Migration:**
```sql
ALTER TABLE rotinas_empresa ADD COLUMN ordem INT NOT NULL DEFAULT 1;

-- Atualizar ordem baseada na rotina padrão (se existir)
UPDATE rotinas_empresa re
SET ordem = COALESCE(
  (SELECT r.ordem FROM rotinas r WHERE r.id = re.rotina_id),
  ROW_NUMBER() OVER (PARTITION BY re.pilar_empresa_id ORDER BY re.created_at)
);
```

**Comportamento Default:**
- Ao associar rotina padrão: usar `rotina.ordem` (se existir)
- Ao criar rotina customizada: calcular próxima ordem disponível
- Gestor pode reordenar depois

**Impacto:**
- Nova funcionalidade: Reordenar rotinas por empresa/pilar
- Endpoint futuro: `POST /empresas/:id/pilares/:pilarId/rotinas/reordenar`

---

## 13. Status de Implementação (ATUALIZADO - 23/12/2024)

**Backend - Módulo Pilares (Catálogo Global):**
- ✅ CRUD completo implementado
- ✅ Validações de segurança (RBAC)
- ✅ Auditoria de operações CUD
- ✅ Soft delete com filtro consistente (findAll + findOne)
- ✅ Validação de dependências (rotinas ativas)
- ✅ Campo `ordem` opcional
- ✅ Endpoint reordenar REMOVIDO (movido para PilaresEmpresa)

**Backend - Módulo Empresas:**
- ✅ Auto-associação de pilares padrão implementada
- ✅ Flag `AUTO_ASSOCIAR_PILARES_PADRAO` configurável
- ✅ Auditoria de criação

**Backend - Módulo PilaresEmpresa (Multi-Tenant):**
- ✅ Listagem de pilares por empresa (R-PILEMP-001)
- ✅ Reordenação per-company implementada (R-PILEMP-002)
- ✅ Vinculação incremental implementada (R-PILEMP-003)
- ✅ Validação multi-tenant
- ✅ Cascata lógica em desativação (RA-PILEMP-001)
- ✅ Auditoria completa
- ✅ DTOs com validação >= 1 (ReordenarPilaresDto, VincularPilaresDto)

**Backend - Schema:**
- ✅ `Pilar.ordem` → Int? (opcional)
- ✅ `Pilar.ordem` → @@unique (constraint pode causar conflitos - ver seção 2.1)
- ✅ `PilarEmpresa.ordem` → Int (obrigatório)
- ✅ `RotinaEmpresa.ordem` → Int (obrigatório)
- ✅ Migrations aplicadas

**Backend - Correções de Segurança:**
- ✅ Validação de IDs em reordenação
- ✅ findOne() filtra pilares inativos (comportamento consistente)
- ✅ Auditoria de reordenação (módulo PilaresEmpresa)
- ✅ Auditoria de vinculação (módulo PilaresEmpresa)
- ✅ Multi-tenancy com validação estrita

**Documentação:**
- ✅ Regra R-PIL-006 removida (não implementada)
- ✅ Duplicação CreatePilarDto corrigida
- ✅ Seção 6.8 atualizada (findOne filtra inativos)
- ✅ Regra R-PILEMP-003 adicionada (vincular pilares)
- ✅ Validação @Min(1) documentada em DTOs
- ✅ Constraint @@unique([ordem]) documentada com observação

**Frontend (Pendente):**
- ❌ Interface de listagem
- ❌ Formulário criar/editar
- ❌ Modal de confirmação
- ❌ Filtros e busca
- ❌ Guards de permissão
- ❌ Integração com `/empresas/:id/pilares`

---

**Data de extração:** 21/12/2024  
**Data de atualização:** 23/12/2024  
**Agente:** Business Rules Extractor (Modo A - Reverse Engineering)  
**Última revisão:** Reviewer de Regras (23/12/2024)  
**Status:** ✅ Backend completo (3 módulos) | ✅ Documentação atualizada | ⏳ Frontend pendente

---

**Observação final:**  
Este documento reflete o código IMPLEMENTADO nos módulos:
- **Pilares** (catálogo global)
- **PilaresEmpresa** (multi-tenant per-company)
- **Empresas** (auto-associação)

Todas as correções críticas de segurança foram implementadas.  
Documentação validada e atualizada conforme REVIEWER-REPORT-pilares.md.  
Frontend segue especificações UI-PIL-001 a UI-PIL-009.  
Schema changes completos conforme SCHEMA-PIL-001 a 003.
