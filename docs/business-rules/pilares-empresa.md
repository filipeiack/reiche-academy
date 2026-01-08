# Regras de Negócio — PilaresEmpresa

**Módulo:** PilaresEmpresa  
**Backend:** `backend/src/modules/pilares-empresa/`  
**Frontend:** Não implementado  
**Última extração:** 08/01/2026  
**Agente:** Extractor de Regras  
**Padrão:** Snapshot Pattern

---

## 1. Visão Geral

O módulo PilaresEmpresa gerencia **instâncias snapshot** de pilares por empresa.

### Responsabilidades:

- Criar pilares por empresa (cópia de template OU customizado)
- Ordenação customizada per-company (independente do template)
- Reordenação de pilares dentro da empresa
- Edição de dados da instância (nome, descrição)
- Validação de acesso multi-tenant (isolamento de dados)
- Gestão de responsáveis por pilar

**Entidades principais:**
- PilarEmpresa (instância snapshot com dados copiados/customizados)

**Endpoints implementados:**
- `GET /empresas/:empresaId/pilares` — Listar pilares da empresa (todos perfis)
- `POST /empresas/:empresaId/pilares` — Criar pilar (cópia OU customizado) (ADMINISTRADOR, GESTOR)
- `POST /empresas/:empresaId/pilares/reordenar` — Reordenar pilares (ADMINISTRADOR, GESTOR)
- `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId` — Editar pilar da empresa (ADMINISTRADOR, GESTOR)
- `DELETE /empresas/:empresaId/pilares/:pilarEmpresaId` — Remover pilar (ADMINISTRADOR, GESTOR)
- `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/responsavel` — Definir responsável (ADMINISTRADOR, GESTOR)

**Características:**
- Multi-tenancy: Isolamento de dados por empresa
- Snapshot Pattern: Dados copiados de templates (customizáveis)
- RBAC: Validação de perfil por endpoint
- Auditoria: Registro de operações

---

## 2. Entidades

### 2.1. PilarEmpresa (Instância Snapshot)

**Localização:** `backend/prisma/schema.prisma`

**Descrição:** Instância snapshot de pilar por empresa. Contém cópia dos dados do template OU dados customizados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único da instância |
| pilarTemplateId | String? | FK para Pilar (null = customizado, uuid = cópia de template) |
| pilarTemplate | Pilar? | Relação com template de origem (se aplicável) |
| nome | String | Nome do pilar (SEMPRE preenchido, copiado OU customizado) |
| descricao | String? | Descrição (SEMPRE preenchido, copiado OU customizado) |
| empresaId | String | FK para Empresa (obrigatório) |
| empresa | Empresa | Relação com empresa dona da instância |
| ordem | Int | Ordem de exibição per-company (independente do template) |
| responsavelId | String? | FK para Usuario (responsável pelo pilar na empresa) |
| responsavel | Usuario? | Relação com usuário responsável |
| ativo | Boolean (default: true) | Soft delete flag |
| createdAt | DateTime | Data de criação da instância |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `pilarTemplate`: Pilar? (template de origem, se aplicável)
- `empresa`: Empresa (empresa dona)
- `responsavel`: Usuario? (usuário responsável)
- `rotinasEmpresa`: RotinaEmpresa[] (rotinas vinculadas ao pilar na empresa)
- `evolucao`: PilarEvolucao[] (histórico de evolução)

**Índices:**
- `@@unique([empresaId, nome])` — Nome único por empresa

**Regras de Negócio:**
- Cada empresa tem sua própria coleção de pilares (snapshots)
- Nome deve ser único dentro da empresa (permite customização)
- Ordem é obrigatória e determina exibição (independente do template)
- `pilarTemplateId = null` indica pilar customizado (não veio de template)
- `pilarTemplateId != null` indica cópia de template (origem rastreável)

**📝 Mudanças do Snapshot Pattern:**
- ✅ Campo `pilarTemplateId` (nullable) substitui `pilarId` (obrigatório)
- ✅ Campos `nome` e `descricao` adicionados (SEMPRE preenchidos)
- ✅ Constraint `@@unique([empresaId, pilarId])` substituída por `@@unique([empresaId, nome])`
- ✅ Empresa pode editar `nome` e `descricao` sem afetar outras empresas
- ✅ Template pode ser atualizado sem propagar mudanças (snapshot congelado)

---

## 3. Regras Implementadas

### R-PILEMP-001: Criação de Pilar a partir de Template (Snapshot)

**Descrição:** Sistema copia dados de um template global para criar instância snapshot por empresa.

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares` (ADMINISTRADOR, GESTOR)
- **Método:** `PilaresEmpresaService.create()`
- **DTO:** CreatePilarEmpresaDto

**Input:**
```typescript
{
  "pilarTemplateId": "uuid-template-estrategia",
  // nome e descricao NÃO são fornecidos (serão copiados)
}
```

**Comportamento:**
```typescript
// 1. Buscar template
const template = await this.prisma.pilar.findUnique({
  where: { id: dto.pilarTemplateId, ativo: true },
});

if (!template) {
  throw new NotFoundException('Template de pilar não encontrado');
}

// 2. Calcular próxima ordem
const maxOrdem = await this.prisma.pilarEmpresa.findFirst({
  where: { empresaId },
  orderBy: { ordem: 'desc' },
});

const proximaOrdem = (maxOrdem?.ordem ?? 0) + 1;

// 3. Criar snapshot (CÓPIA)
const pilarEmpresa = await this.prisma.pilarEmpresa.create({
  data: {
    pilarTemplateId: template.id,      // Referência ao template
    nome: template.nome,                // CÓPIA
    descricao: template.descricao,      // CÓPIA
    empresaId,
    ordem: proximaOrdem,
    createdBy: user.id,
  },
});
```

**Validações:**
- Template existe e está ativo?
- Empresa existe?
- Multi-tenant (GESTOR só cria para própria empresa)
- Nome não duplicado na empresa (constraint `@@unique([empresaId, nome])`)

**Retorno:**
- PilarEmpresa criado com dados copiados

**Auditoria:**
- Ação: CREATE
- Entidade: pilares_empresa
- Dados: pilarTemplateId + dados copiados

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts) (a implementar)

---

### R-PILEMP-002: Criação de Pilar Customizado (Sem Template)

**Descrição:** Sistema cria pilar customizado (específico da empresa) sem vínculo com template.

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares` (ADMINISTRADOR, GESTOR)
- **Método:** `PilaresEmpresaService.create()`
- **DTO:** CreatePilarEmpresaDto

**Input:**
```typescript
{
  "pilarTemplateId": null,          // Indica customizado
  "nome": "Pilar Específico XYZ",   // Obrigatório se null
  "descricao": "Descrição custom"   // Opcional
}
```

**Comportamento:**
```typescript
// 1. Validar campos obrigatórios
if (!dto.pilarTemplateId && !dto.nome) {
  throw new BadRequestException(
    'Nome é obrigatório para pilares customizados'
  );
}

// 2. Calcular próxima ordem
const proximaOrdem = (await getMaxOrdem(empresaId)) + 1;

// 3. Criar customizado
const pilarEmpresa = await this.prisma.pilarEmpresa.create({
  data: {
    pilarTemplateId: null,             // SEM template
    nome: dto.nome,                    // Fornecido pelo usuário
    descricao: dto.descricao ?? null,  // Opcional
    empresaId,
    ordem: proximaOrdem,
    createdBy: user.id,
  },
});
```

**Validações:**
- Se `pilarTemplateId = null`, `nome` é obrigatório
- Nome não duplicado na empresa
- Multi-tenant (GESTOR só cria para própria empresa)

**Retorno:**
- PilarEmpresa customizado

**Auditoria:**
- Ação: CREATE
- Entidade: pilares_empresa
- Dados: pilarTemplateId=null + nome customizado

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts) (a implementar)

---

### R-PILEMP-003: Listagem de Pilares por Empresa (Snapshot Pattern)

**Descrição:** Endpoint retorna pilares ativos de uma empresa específica, ordenados por `PilarEmpresa.ordem`. Dados são lidos da instância snapshot (não precisa JOIN com template).

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

**Filtro:**
```typescript
where: {
  empresaId,
  ativo: true,
  // ❌ NÃO precisa filtrar pilarTemplate.ativo (dados copiados)
}
```

**Ordenação:**
```typescript
orderBy: { ordem: 'asc' } // PilarEmpresa.ordem (per-company)
```

**Include (Opcional):**
```typescript
include: {
  pilarTemplate: true,  // Apenas para rastreabilidade (origem)
  responsavel: {
    select: { id: true, nome: true, email: true },
  },
  _count: {
    select: { rotinasEmpresa: true },
  },
}
```

**Retorno:**
- Array de PilarEmpresa com dados completos (nome, descrição na própria tabela)
- Não precisa `COALESCE` (dados sempre em `PilarEmpresa`)
- Ordenado por `ordem` da empresa (independente do template)

**📝 Mudança do Snapshot Pattern:**
- ✅ Dados lidos diretamente de `PilarEmpresa` (não JOIN obrigatório)
- ✅ `pilarTemplate` incluído apenas para rastreabilidade (opcional)
- ❌ NÃO precisa filtrar `pilarTemplate.ativo` (snapshot independente)

**Exceções:**
- HTTP 403 Forbidden se usuário tentar acessar outra empresa
- ADMINISTRADOR ignora validação multi-tenant

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L31-L56)

---

### R-PILEMP-004: Edição de Pilar da Empresa (Customização)

**Descrição:** Empresa pode editar nome e descrição de sua instância snapshot sem afetar outras empresas.

**Implementação:**
- **Endpoint:** `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId` (ADMINISTRADOR, GESTOR)
- **Método:** `PilaresEmpresaService.update()`
- **DTO:** UpdatePilarEmpresaDto

**Input:**
```typescript
{
  "nome": "Novo nome customizado",
  "descricao": "Nova descrição"
}
```

**Comportamento:**
```typescript
// 1. Validar acesso multi-tenant
this.validateTenantAccess(empresaId, user);

// 2. Validar nome único na empresa (se alterado)
if (dto.nome) {
  const existing = await this.prisma.pilarEmpresa.findFirst({
    where: {
      empresaId,
      nome: dto.nome,
      id: { not: pilarEmpresaId },
    },
  });
  
  if (existing) {
    throw new ConflictException('Já existe um pilar com este nome nesta empresa');
  }
}

// 3. Atualizar
const updated = await this.prisma.pilarEmpresa.update({
  where: { id: pilarEmpresaId },
  data: {
    nome: dto.nome,
    descricao: dto.descricao,
    updatedBy: user.id,
  },
});
```

**Validações:**
- Pilar pertence à empresa?
- Nome único dentro da empresa
- Multi-tenant (GESTOR só edita própria empresa)

**Auditoria:**
- Ação: UPDATE
- Dados antes e depois

**📝 Snapshot Pattern:**
- ✅ Empresa edita livremente SEM afetar outras empresas
- ✅ Mesmo pilares criados a partir do mesmo template podem ter nomes diferentes

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts) (a implementar)

---

### R-PILEMP-005: Reordenação de Pilares por Empresa

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

## 4. DTOs e Validações

### 4.1. CreatePilarEmpresaDto

**Localização:** `backend/src/modules/pilares-empresa/dto/create-pilar-empresa.dto.ts`

**Campos:**

| Campo | Tipo | Validações | Descrição |
|-------|------|-----------|-----------|
| pilarTemplateId | string? | `@IsOptional()`, `@IsUUID()` | UUID do template (null = customizado) |
| nome | string? | `@ValidateIf(o => !o.pilarTemplateId)`, `@IsNotEmpty()`, `@Length(2, 200)` | Obrigatório se pilarTemplateId=null |
| descricao | string? | `@IsOptional()`, `@MaxLength(500)` | Descrição opcional |

**Validação XOR:**
```typescript
import { ValidateIf, IsNotEmpty, IsOptional, IsUUID, Length, MaxLength } from 'class-validator';

export class CreatePilarEmpresaDto {
  @IsOptional()
  @IsUUID('4', { message: 'pilarTemplateId deve ser um UUID válido' })
  pilarTemplateId?: string;

  @ValidateIf(o => !o.pilarTemplateId)
  @IsNotEmpty({ message: 'Nome é obrigatório para pilares customizados' })
  @Length(2, 200, { message: 'Nome deve ter entre 2 e 200 caracteres' })
  nome?: string;

  @IsOptional()
  @MaxLength(500, { message: 'Descrição deve ter no máximo 500 caracteres' })
  descricao?: string;
}
```

**Lógica:**
- Se `pilarTemplateId` fornecido → copiar nome/descrição do template
- Se `pilarTemplateId = null` → `nome` é obrigatório (customizado)

---

### 4.2. UpdatePilarEmpresaDto

**Localização:** `backend/src/modules/pilares-empresa/dto/update-pilar-empresa.dto.ts`

**Campos:**

| Campo | Tipo | Validações | Descrição |
|-------|------|-----------|-----------|
| nome | string? | `@IsOptional()`, `@Length(2, 200)` | Nome customizado |
| descricao | string? | `@IsOptional()`, `@MaxLength(500)` | Descrição customizada |
| responsavelId | string? | `@IsOptional()`, `@IsUUID()` | UUID do usuário responsável |

**Validação:**
```typescript
export class UpdatePilarEmpresaDto {
  @IsOptional()
  @Length(2, 200)
  nome?: string;

  @IsOptional()
  @MaxLength(500)
  descricao?: string;

  @IsOptional()
  @IsUUID('4')
  responsavelId?: string;
}
```

**Regras:**
- Nome deve ser único dentro da empresa (validado no service)
- `pilarTemplateId` NÃO pode ser alterado (imutável após criação)

---

### 4.3. Exemplos de Erros

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": [
    "Nome é obrigatório para pilares customizados",
    "Nome deve ter entre 2 e 200 caracteres"
  ],
  "error": "Bad Request"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Template de pilar não encontrado",
  "error": "Not Found"
}
```

**409 Conflict:**
```json
{
  "statusCode": 409,
  "message": "Já existe um pilar com este nome nesta empresa",
  "error": "Conflict"
}
```

**403 Forbidden (Multi-tenant):**
```json
{
  "statusCode": 403,
  "message": "Você não pode acessar dados de outra empresa",
  "error": "Forbidden"
}
```

---

## 5. Regras de Deleção e Reordenação

### R-PILEMP-006: Deleção de Pilar da Empresa (Hard Delete com Validação)

**Descrição:** Sistema remove pilar da empresa (hard delete) apenas se não houver rotinas vinculadas. Deleção é auditada.

**Implementação:**
- **Endpoint:** `DELETE /empresas/:empresaId/pilares/:pilarEmpresaId` (ADMINISTRADOR, GESTOR)
- **Método:** `PilaresEmpresaService.delete()`

**Validações:**

1. **Multi-Tenant:**
```typescript
this.validateTenantAccess(empresaId, user);
```

2. **Validar Ausência de Rotinas:**
```typescript
const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
  where: { id: pilarEmpresaId },
  include: {
    _count: {
      select: { rotinasEmpresa: true }
    }
  }
});

if (!pilarEmpresa) {
  throw new NotFoundException('Pilar não encontrado nesta empresa');
}

if (pilarEmpresa._count.rotinasEmpresa > 0) {
  throw new ConflictException(
    `Não é possível remover pilar com ${pilarEmpresa._count.rotinasEmpresa} rotina(s) vinculada(s)`
  );
}
```

3. **Buscar Rotinas Antes de Deletar (para auditoria):**
```typescript
const rotinasVinculadas = await this.prisma.rotinaEmpresa.findMany({
  where: { pilarEmpresaId },
  select: { id: true, nome: true }
});
```

4. **Hard Delete em Cascata:**
```typescript
// Prisma já deleta rotinasEmpresa automaticamente (onDelete: Cascade)
await this.prisma.pilarEmpresa.delete({
  where: { id: pilarEmpresaId }
});
```

**Auditoria (Pilar Deletado):**
```typescript
await this.audit.log({
  usuarioId: user.id,
  usuarioNome: user.nome,
  usuarioEmail: user.email,
  entidade: 'pilares_empresa',
  entidadeId: pilarEmpresaId,
  acao: 'DELETE',
  dadosAntes: {
    id: pilarEmpresa.id,
    nome: pilarEmpresa.nome,
    empresaId: pilarEmpresa.empresaId,
    pilarTemplateId: pilarEmpresa.pilarTemplateId,
  },
  dadosDepois: null,
});
```

**Auditoria (Rotinas Deletadas em Cascata):**
```typescript
for (const rotina of rotinasVinculadas) {
  await this.audit.log({
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioEmail: user.email,
    entidade: 'rotinas_empresa',
    entidadeId: rotina.id,
    acao: 'DELETE',
    dadosAntes: { id: rotina.id, nome: rotina.nome, pilarEmpresaId },
    dadosDepois: null,
  });
}
```

**Retorno:** HTTP 204 No Content

**Exceções:**
- HTTP 404: Pilar não encontrado
- HTTP 409: Pilar possui rotinas vinculadas
- HTTP 403: Usuário tentando deletar pilar de outra empresa

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts) (a implementar)

---

### R-PILEMP-007: Reordenação de Pilares (Já Implementada)

**Descrição:** Endpoint permite reordenar pilares de uma empresa específica (atualiza `PilarEmpresa.ordem`).

**Implementação:**
- **Endpoint:** `POST /empresas/:empresaId/pilares/reordenar`
- **Método:** `PilaresEmpresaService.reordenar()`
- **DTO:** ReordenarPilaresDto

**Input:**
```typescript
{
  "ordens": [
    { "id": "uuid-pilar-empresa-1", "ordem": 1 },
    { "id": "uuid-pilar-empresa-2", "ordem": 2 }
  ]
}
```

**Validações:**
- Multi-tenant
- IDs pertencem à empresa
- Transação atômica

**Auditoria:**
- Ação: UPDATE
- Entidade: pilares_empresa
- Dados: lista completa de reordenação

**Arquivo:** [pilares-empresa.service.ts](../../backend/src/modules/pilares-empresa/pilares-empresa.service.ts#L58-L118)

---

## 6. Validação de Pilares Inativos

### R-PILEMP-008: Validação de Ativação ao Criar Rotina

**Descrição:** Ao adicionar rotina a um pilar, sistema valida se `PilarEmpresa.ativo = true`.

**Implementação:**
- **Módulo:** RotinaEmpresaService (ao vincular rotina)
- **Método:** `create()`

**Validação:**
```typescript
const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
  where: { id: pilarEmpresaId },
  select: { ativo: true, empresaId: true }
});

if (!pilarEmpresa) {
  throw new NotFoundException('Pilar não encontrado nesta empresa');
}

if (!pilarEmpresa.ativo) {
  throw new ConflictException('Não é possível adicionar rotinas a pilares inativos');
}
```

**Exceção:**
- HTTP 409 Conflict: "Não é possível adicionar rotinas a pilares inativos"

**Justificativa:**
- Prevenir vinculação a pilares desativados
- Manter integridade lógica

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
