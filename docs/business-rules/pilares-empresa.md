# Regras de Negócio — PilaresEmpresa

**Módulo:** PilaresEmpresa  
**Backend:** `backend/src/modules/pilares-empresa/`  
**Frontend:** Não implementado  
**Última extração:** 22/12/2024  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo PilaresEmpresa é responsável por:
- Gerenciar vinculação de pilares a empresas (multi-tenant)
- Ordenação customizada de pilares por empresa
- Reordenação de pilares dentro de uma empresa específica
- Validação de acesso multi-tenant (isolamento de dados)
- Filtro de cascata lógica (pilares inativos invisíveis)

**Entidades principais:**
- PilarEmpresa (vinculação pilar-empresa com ordenação per-company)

**Endpoints implementados:**
- `GET /empresas/:empresaId/pilares` — Listar pilares da empresa (todos perfis)
- `POST /empresas/:empresaId/pilares/reordenar` — Reordenar pilares da empresa (ADMINISTRADOR, GESTOR)

**Características:**
- Multi-tenancy: Isolamento de dados por empresa
- RBAC: Validação de perfil por endpoint
- Auditoria: Registro de reordenações
- Cascata lógica: Pilar inativo = invisível automaticamente

---

## 2. Entidades

### 2.1. PilarEmpresa

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| empresaId | String | FK para Empresa |
| pilarId | String | FK para Pilar |
| ordem | Int | Ordem de exibição do pilar na empresa (per-company) |
| ativo | Boolean (default: true) | Soft delete flag |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `empresa`: Empresa (empresa associada)
- `pilar`: Pilar (pilar associado)
- `rotinasEmpresa`: RotinaEmpresa[] (rotinas vinculadas ao pilar na empresa)
- `evolucao`: PilarEvolucao[] (histórico de evolução do pilar)

**Índices:**
- `[empresaId, pilarId]` (unique)

**Regras de Negócio:**
- Um pilar só pode ser vinculado uma vez por empresa (unique constraint)
- Ordem é obrigatória e determina exibição na interface
- Cada empresa tem sua própria ordenação independente

---

## 3. Regras Implementadas

### R-PILEMP-001: Listagem de Pilares por Empresa (Multi-Tenant)

**Descrição:** Endpoint retorna pilares ativos de uma empresa específica, ordenados por `PilarEmpresa.ordem`.

**Implementação:**
- **Endpoint:** `GET /empresas/:empresaId/pilares`
- **Método:** `PilaresEmpresaService.findByEmpresa()`
- **Perfis autorizados:** Todos (com validação multi-tenant)

**Validação Multi-Tenant:**
```typescript
private validateTenantAccess(empresaId: string, user: RequestUser) {
  if (user.perfil?.codigo === 'ADMINISTRADOR') {
    return; // Admin tem acesso global
  }

  if (user.empresaId !== empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }
}
```

**Filtro de Cascata Lógica:**
```typescript
where: {
  empresaId,
  ativo: true,
  pilar: { ativo: true }, // Pilar desativado = invisível
}
```

**Ordenação:**
```typescript
orderBy: { ordem: 'asc' } // PilarEmpresa.ordem (per-company)
```

**Include:**
```typescript
include: {
  pilar: {
    include: {
      _count: {
        select: {
          rotinas: true,
          empresas: true,
        },
      },
    },
  },
}
```

**Retorno:**
- Array de PilarEmpresa com Pilar incluído
- Contadores: `pilar._count.rotinas` e `pilar._count.empresas`
- Ordenado por `ordem` da empresa (não ordem global)

**Exceções:**
- HTTP 403 Forbidden se usuário tentar acessar outra empresa
- ADMINISTRADOR ignora validação multi-tenant

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L31-L56)

---

### R-PILEMP-002: Reordenação de Pilares por Empresa

**Descrição:** Endpoint permite reordenar pilares de uma empresa específica (atualiza `PilarEmpresa.ordem`).

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares/reordenar`
- **Método:** `PilaresEmpresaService.reordenar()`
- **Perfis autorizados:** ADMINISTRADOR, GESTOR
- **DTO:** ReordenarPilaresDto

**Input:**
```typescript
{
  "ordens": [
    { "id": "uuid-pilar-empresa-1", "ordem": 1 },
    { "id": "uuid-pilar-empresa-2", "ordem": 2 },
    { "id": "uuid-pilar-empresa-3", "ordem": 3 }
  ]
}
```

**Validação Multi-Tenant:**
```typescript
this.validateTenantAccess(empresaId, user);
```

**Validação de IDs:**
```typescript
const idsToUpdate = ordens.map(item => item.id);

const existingPilaresEmpresa = await this.prisma.pilarEmpresa.findMany({
  where: {
    id: { in: idsToUpdate },
    empresaId, // Garante que IDs pertencem à empresa
  },
  select: { id: true },
});

if (existingPilaresEmpresa.length !== idsToUpdate.length) {
  const foundIds = existingPilaresEmpresa.map(p => p.id);
  const missingIds = idsToUpdate.filter(id => !foundIds.includes(id));
  throw new NotFoundException(
    `Pilares não encontrados nesta empresa: ${missingIds.join(', ')}`,
  );
}
```

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
```typescript
await this.audit.log({
  usuarioId: user.id,
  usuarioNome: userRecord?.nome ?? '',
  usuarioEmail: userRecord?.email ?? '',
  entidade: 'pilares_empresa',
  entidadeId: empresaId,
  acao: 'UPDATE',
  dadosAntes: null,
  dadosDepois: ordens,
});
```

**Atomicidade:**
- Todas as atualizações ocorrem em transação
- Se uma falhar, todas são revertidas (rollback)

**Retorno:**
- Lista completa de pilares reordenados (via `findByEmpresa()`)

**Exceções:**
- HTTP 403 Forbidden se usuário tentar reordenar outra empresa
- HTTP 404 Not Found se algum ID não pertencer à empresa
- ADMINISTRADOR tem acesso global (pode reordenar qualquer empresa)

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L58-L118)

---

### R-PILEMP-003: Vinculação Manual de Pilares (Adição Incremental)

**Descrição:** Endpoint permite adicionar pilares existentes a uma empresa sem remover vínculos atuais.

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares/vincular`
- **Método:** `PilaresEmpresaService.vincularPilares()`
- **Perfis autorizados:** ADMINISTRADOR, GESTOR
- **DTO:** VincularPilaresDto

**Input:**
```typescript
{
  "pilaresIds": [
    "uuid-pilar-1",
    "uuid-pilar-2",
    "uuid-pilar-3"
  ]
}
```

**Comportamento:**
```typescript
// 1. Validar acesso multi-tenant
this.validateTenantAccess(empresaId, user);

// 2. Filtrar pilares já vinculados (evitar duplicatas)
const jaVinculados = await this.prisma.pilarEmpresa.findMany({
  where: {
    empresaId,
    pilarId: { in: pilaresIds },
  },
  select: { pilarId: true },
});

const idsJaVinculados = jaVinculados.map(v => v.pilarId);
const novosIds = pilaresIds.filter(id => !idsJaVinculados.includes(id));

// 3. Validar que pilares existem e estão ativos
const pilares = await this.prisma.pilar.findMany({
  where: {
    id: { in: novosIds },
    ativo: true,
  },
});

if (pilares.length !== novosIds.length) {
  const foundIds = pilares.map(p => p.id);
  const invalidIds = novosIds.filter(id => !foundIds.includes(id));
  throw new NotFoundException(
    `Pilares não encontrados ou inativos: ${invalidIds.join(', ')}`
  );
}

// 4. Calcular próxima ordem disponível
const maxOrdem = await this.prisma.pilarEmpresa.findFirst({
  where: { empresaId },
  orderBy: { ordem: 'desc' },
  select: { ordem: true },
});

const proximaOrdem = (maxOrdem?.ordem ?? 0) + 1;

// 5. Criar novos vínculos (INCREMENTAL - não remove existentes)
const novosVinculos = novosIds.map((pilarId, index) => ({
  empresaId,
  pilarId,
  ordem: proximaOrdem + index,
  createdBy: user.id,
}));

await this.prisma.pilarEmpresa.createMany({
  data: novosVinculos,
});
```

**Validações:**
1. Multi-tenant: Usuário pode acessar empresaId?
2. Pilares existem e estão ativos?
3. Evitar duplicatas (pilares já vinculados são ignorados)
4. Calcular ordem sequencial após última existente

**Retorno:**
```typescript
{
  vinculados: number,        // Quantidade de novos vínculos criados
  ignorados: string[],       // IDs já vinculados (duplicatas)
  pilares: PilarEmpresa[],   // Lista completa atualizada
}
```

**Auditoria:**
```typescript
await this.audit.log({
  usuarioId: user.id,
  usuarioNome: userRecord?.nome ?? '',
  usuarioEmail: userRecord?.email ?? '',
  entidade: 'pilares_empresa',
  entidadeId: empresaId,
  acao: 'UPDATE',
  dadosAntes: { pilaresAnteriores: jaVinculados.length },
  dadosDepois: { novosVinculos: novosVinculos.length, pilaresIds: novosIds },
});
```

**Diferença de `vincularPilares()` (Empresas module):**
- **Método antigo (EmpresasService):** Remove TODOS vínculos existentes e recria
- **Método novo (PilaresEmpresaService):** Adiciona NOVOS vínculos sem remover

**Casos de uso:**
- Admin quer adicionar "Sustentabilidade" em empresa que já tem 5 pilares
- Gestor quer vincular pilar customizado "Inovação" criado recentemente
- Não precisa reenviar IDs de todos pilares existentes

**Exceções:**
- HTTP 403 Forbidden se tentar vincular em outra empresa
- HTTP 404 Not Found se pilar não existir ou estiver inativo
- HTTP 200 OK mesmo se todos pilares já estiverem vinculados (idempotente)

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts) (a implementar)

---

### RA-PILEMP-001: Cascata Lógica em Desativação de Pilar

**Descrição:** Quando um pilar é desativado globalmente (Pilar.ativo = false), ele automaticamente some de todas empresas via filtro de cascata.

**Implementação:**
- PilarEmpresa.ativo **NÃO** é alterado (continua `true`)
- Filtro em queries: `WHERE pilar.ativo = true AND pilarEmpresa.ativo = true`
- Efeito: Pilar inativo = invisível para todas empresas

**Vantagens:**
- Preserva histórico de vinculação
- Permite reativação sem precisar revincular manualmente
- Comportamento automático (sem lógica adicional)

**Comportamento:**
```typescript
// Busca pilares da empresa
where: {
  empresaId,
  ativo: true,
  pilar: { ativo: true }, // ← Cascata lógica
}
```

**Cenário:**
1. Admin desativa pilar "Marketing" globalmente (`DELETE /pilares/:id`)
2. `Pilar.ativo` vira `false`
3. `PilarEmpresa.ativo` continua `true` (preserva histórico)
4. Pilar "Marketing" some automaticamente de todas empresas (filtro)
5. Se Admin reativar pilar (`PATCH /pilares/:id { ativo: true }`), volta a aparecer automaticamente

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L41)

---

### RA-PILEMP-002: Validação de Acesso Multi-Tenant

**Descrição:** Usuários só podem acessar dados da própria empresa (exceto ADMINISTRADOR).

**Implementação:**
- Validação aplicada em todos endpoints
- ADMINISTRADOR tem acesso global
- Outros perfis: `user.empresaId === empresaId`

**Validação:**
```typescript
private validateTenantAccess(empresaId: string, user: RequestUser) {
  // ADMINISTRADOR tem acesso global
  if (user.perfil?.codigo === 'ADMINISTRADOR') {
    return;
  }

  // GESTOR/COLABORADOR só pode acessar sua própria empresa
  if (user.empresaId !== empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }
}
```

**Exceções:**
- HTTP 403 Forbidden se tentar acessar outra empresa
- Mensagem clara do motivo do bloqueio

**Aplicado em:**
- `findByEmpresa()`
- `reordenar()`

**Justificativa:**
- Isolamento de dados entre empresas
- Segurança multi-tenant
- ADMINISTRADOR gerencia múltiplas empresas

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L19-L28)

---

### RA-PILEMP-003: Auditoria de Reordenação

**Descrição:** Reordenações de pilares são auditadas com detalhes.

**Implementação:**
- **Serviço:** AuditService
- **Entidade:** 'pilares_empresa'

**Dados auditados:**
- usuarioId, usuarioNome, usuarioEmail
- entidade: 'pilares_empresa'
- entidadeId: empresaId
- acao: 'UPDATE'
- dadosAntes: null
- dadosDepois: Array de ordens aplicadas

**Cobertura:**
- ✅ Reordenação de pilares

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L103-L114)

---

## 4. Validações

### 4.1. ReordenarPilaresDto

**Campos:**
```typescript
{
  ordens: OrdemPilarEmpresaDto[]
}
```

**Validações implementadas:**
- `ordens`: array obrigatório, não vazio
- Cada item validado por `OrdemPilarEmpresaDto`

**Arquivo:** [reordenar-pilares.dto.ts](../../backend/src/modules/pilares-empresa/dto/reordenar-pilares.dto.ts)

---

### 4.2. OrdemPilarEmpresaDto

**Campos:**
- `id`: @IsUUID() (ID do PilarEmpresa)
- `ordem`: @IsInt(), @Min(1)

**Validações implementadas:**
- ID deve ser UUID válido
- Ordem obrigatória, mínimo 1
- Impede ordens negativas ou zero

**Arquivo:** [reordenar-pilares.dto.ts](../../backend/src/modules/pilares-empresa/dto/reordenar-pilares.dto.ts)

---

## 5. Comportamentos Condicionais

### 5.1. Filtro de Cascata Lógica

**Condição:** Sempre em `findByEmpresa()`

**Comportamento:**
- Pilar desativado (`pilar.ativo = false`) automaticamente some
- PilarEmpresa.ativo não precisa ser alterado
- Filtro: `pilar: { ativo: true }`

**Justificativa:**
- Preserva histórico de vinculação
- Permite reativação automática

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L41)

---

### 5.2. Ordenação Per-Company

**Condição:** Sempre

**Comportamento:**
- Cada empresa tem sua própria ordenação independente
- Empresa A pode ter ordem [1, 2, 3] (Marketing, Vendas, Estratégico)
- Empresa B pode ter ordem [1, 2, 3] (Estratégico, Marketing, Pessoas)
- Ordem global (`Pilar.ordem`) é apenas referência visual

**Justificativa:**
- Empresas diferentes priorizam pilares diferentes
- Customização por empresa (multi-tenant)

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L50)

---

### 5.3. Validação Multi-Tenant Automática

**Condição:** Sempre (exceto ADMINISTRADOR)

**Comportamento:**
- Sistema valida `user.empresaId === empresaId`
- Lança ForbiddenException se não coincidir
- ADMINISTRADOR ignora validação

**Justificativa:**
- Isolamento de dados entre empresas
- Segurança multi-tenant

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L19-L28)

---

### 5.4. Validação de IDs Pertencentes à Empresa

**Condição:** Sempre em `reordenar()`

**Comportamento:**
- Sistema valida que IDs pertencem à empresa especificada
- Query: `WHERE id IN (...) AND empresaId = :empresaId`
- Lança NotFoundException com lista de IDs inválidos

**Justificativa:**
- Impede manipulação de dados de outras empresas
- Mensagem clara de quais IDs são inválidos

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L70-L83)

---

### 5.5. Reordenação em Transação Atômica

**Condição:** Sempre em reordenação

**Comportamento:**
- Todas as atualizações de ordem ocorrem em transação
- Se uma falhar, todas são revertidas (rollback)

**Justificativa:**
- Garantir consistência de ordem (evitar estado parcial)

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L96)

---

## 6. Fluxo de Operações

### 6.1. Listagem de Pilares da Empresa

```
1. Usuário envia GET /empresas/:empresaId/pilares
2. Service valida acesso multi-tenant
3. Se user.empresaId !== empresaId E não é ADMIN → 403 Forbidden
4. Busca PilarEmpresa com filtros:
   - empresaId = :empresaId
   - ativo = true
   - pilar.ativo = true (cascata)
5. Ordena por PilarEmpresa.ordem (per-company)
6. Inclui Pilar com contadores
7. Retorna array ordenado (200)
```

---

### 6.2. Reordenação de Pilares da Empresa

```
1. ADMINISTRADOR ou GESTOR envia POST /empresas/:empresaId/pilares/reordenar
2. DTO valida estrutura (array de {id, ordem})
3. Service valida acesso multi-tenant
4. Se user.empresaId !== empresaId E não é ADMIN → 403 Forbidden
5. Valida que IDs pertencem à empresa:
   - Busca PilarEmpresa WHERE id IN (...) AND empresaId = :empresaId
   - Se quantidade !== esperada → 404 Not Found com lista de IDs inválidos
6. DTO valida ordem >= 1 para cada item
7. Cria array de updates (PilarEmpresa.ordem)
8. Executa em transação atômica
9. Se falhar → rollback completo
10. Registra auditoria (UPDATE)
11. Busca lista atualizada (findByEmpresa)
12. Retorna lista ordenada (200)
```

---

## 7. Relacionamentos

### 7.1. PilarEmpresa → Pilar (N:1)

**Descrição:**
- Vários PilaresEmpresa podem apontar para o mesmo Pilar
- Pilar é catálogo global (shared)

**Comportamento:**
- Cascata lógica: Pilar inativo = PilarEmpresa invisível
- Include sempre traz dados do Pilar

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation pilar)

---

### 7.2. PilarEmpresa → Empresa (N:1)

**Descrição:**
- Vários PilaresEmpresa pertencem a uma Empresa
- Empresa pode ter múltiplos pilares vinculados

**Comportamento:**
- Multi-tenant: Isolamento por empresaId
- Ordenação independente por empresa

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation empresa)

---

### 7.3. PilarEmpresa → RotinaEmpresa (1:N)

**Descrição:**
- Um PilarEmpresa pode ter várias RotinaEmpresa
- RotinaEmpresa pertence a um único PilarEmpresa

**Comportamento:**
- Rotinas customizadas por empresa dentro de um pilar
- Ordenação de rotinas também per-company

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation rotinasEmpresa)

---

## 8. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-PILEMP-001** | Listagem por empresa (multi-tenant) | ✅ Implementado |
| **R-PILEMP-002** | Reordenação per-company | ✅ Implementado |
| **RA-PILEMP-001** | Cascata lógica em desativação | ✅ Implementado |
| **RA-PILEMP-002** | Validação multi-tenant | ✅ Implementado |
| **RA-PILEMP-003** | Auditoria de reordenação | ✅ Implementado |

**Características:**
- ✅ Multi-tenancy com isolamento estrito
- ✅ RBAC (ADMINISTRADOR, GESTOR)
- ✅ Auditoria completa
- ✅ Cascata lógica (sem lógica adicional)
- ✅ Validação de IDs por empresa
- ✅ Transações atômicas
- ✅ Mensagens de erro claras

---

## 9. Referências

**Arquivos principais:**
- [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts)
- [pilares-empresa.controller.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.controller.ts)
- [pilares-empresa.module.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.module.ts)
- [reordenar-pilares.dto.ts](../../backend/src/modules/pilares-empresa/dto/reordenar-pilares.dto.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (PilarEmpresa)

**Dependências:**
- AuditService (auditoria de operações)
- PrismaService (acesso ao banco)
- JwtAuthGuard (autenticação)
- RolesGuard (autorização por perfil)

**Módulos relacionados:**
- Pilares (catálogo global)
- Empresas (multi-tenant)
- Rotinas (vinculação de rotinas)

---

## 10. Status de Implementação

**Backend:**
- ✅ Service completo (listagem + reordenação)
- ✅ Controller com rotas RESTful
- ✅ DTOs com validação
- ✅ Module registrado em app.module
- ✅ Guards aplicados (JWT + Roles)
- ✅ Auditoria configurada
- ✅ Multi-tenancy validado
- ✅ Testes de compilação: PASSED

**Frontend:**
- ❌ Interface de listagem por empresa
- ❌ Interface de reordenação drag-and-drop
- ❌ Integração com módulo Empresas

**Schema:**
- ✅ Campo `ordem` adicionado em PilarEmpresa
- ✅ Migrations aplicadas
- ✅ Unique constraint [empresaId, pilarId]

---

**Data de extração:** 22/12/2024  
**Agente:** Business Rules Extractor (Modo A - Reverse Engineering)  
**Status:** ✅ Backend completo | ⏳ Frontend pendente

---

**Observação final:**  
Este documento reflete o código IMPLEMENTADO no módulo PilaresEmpresa.  
Módulo implementa multi-tenancy completo com validação estrita.  
Cascata lógica garante consistência sem lógica adicional.  
Reordenação per-company permite customização total por empresa.
