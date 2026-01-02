# Regras de Negócio — Rotinas

**Módulo:** Rotinas  
**Backend:** `backend/src/modules/rotinas/`  
**Frontend:** `frontend/src/app/views/pages/rotinas/`  
**Última extração:** 02/01/2026  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Rotinas é responsável por:
- Gerenciar rotinas do sistema (CRUD completo)
- Ordenação customizável de rotinas dentro de cada pilar
- Validação de dependência com pilares
- Validação de uso por empresas antes de desativar
- Auditoria de operações em rotinas
- Filtragem de rotinas por pilar
- Criação com vínculo automático a empresa (via pilarEmpresaId)
- Reordenação de rotinas por pilar

**Entidades principais:**
- Rotina (rotinas vinculadas a pilares)
- RotinaEmpresa (vínculo rotina-empresa via PilarEmpresa)

**Endpoints implementados:**
- `POST /rotinas` — Criar rotina (ADMINISTRADOR, GESTOR)
- `GET /rotinas?pilarId=uuid` — Listar rotinas ativas (todos, filtro opcional)
- `GET /rotinas/:id` — Buscar rotina por ID (todos)
- `PATCH /rotinas/:id` — Atualizar rotina (ADMINISTRADOR)
- `DELETE /rotinas/:id` — Desativar rotina (ADMINISTRADOR)
- `POST /rotinas/pilar/:pilarId/reordenar` — Reordenar rotinas de um pilar (ADMINISTRADOR)

---

## 2. Entidades

### 2.1. Rotina

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| nome | String | Nome da rotina (ex: "Planejamento Estratégico Anual") |
| descricao | String? | Descrição detalhada da rotina |
| ordem | Int | Ordem de exibição dentro do pilar |
| modelo | Boolean (default: false) | Indica se é rotina modelo (template) |
| ativo | Boolean (default: true) | Soft delete flag |
| pilarId | String | FK para Pilar (obrigatório) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `pilar`: Pilar (pilar ao qual a rotina pertence)
- `rotinaEmpresas`: RotinaEmpresa[] (vinculação com empresas via PilarEmpresa)

**Características:**
- Rotina sempre pertence a um pilar
- Não há constraint de nome único (pode haver rotinas com mesmo nome em pilares diferentes)

---

### 2.2. RotinaEmpresa

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| pilarEmpresaId | String | FK para PilarEmpresa (obrigatório) |
| rotinaId | String | FK para Rotina (obrigatório) |
| observacao | String? | Observação específica da empresa sobre a rotina |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `pilarEmpresa`: PilarEmpresa (vínculo pilar-empresa)
- `rotina`: Rotina (rotina template)
- `notas`: NotaRotina[] (avaliações da rotina)

**Índices:**
- `[pilarEmpresaId, rotinaId]` (unique)

**Características:**
- Rotina só pode ser vinculada uma vez por PilarEmpresa
- Permite observações customizadas por empresa

---

## 3. Regras Implementadas

### R-ROT-001: Criação de Rotina com Validação de Pilar e Vínculo Automático

**Descrição:** Sistema valida que o pilar existe antes de criar rotina. Opcionalmente, pode criar o vínculo RotinaEmpresa automaticamente se `pilarEmpresaId` for fornecido.

**Implementação:**
- **Endpoint:** `POST /rotinas` (restrito a ADMINISTRADOR, GESTOR)
- **Método:** `RotinasService.create()`
- **DTO:** CreateRotinaDto

**Validações:**

1. **Validação de Pilar:**
```typescript
const pilar = await this.prisma.pilar.findUnique({
  where: { id: createRotinaDto.pilarId },
});

if (!pilar) {
  throw new NotFoundException('Pilar não encontrado');
}
```

2. **Validação Multi-Tenant (se pilarEmpresaId fornecido):**
```typescript
if (createRotinaDto.pilarEmpresaId) {
  const pilarEmpresa = await this.prisma.pilarEmpresa.findUnique({
    where: { id: createRotinaDto.pilarEmpresaId },
    include: { empresa: true },
  });

  if (!pilarEmpresa) {
    throw new NotFoundException('PilarEmpresa não encontrado');
  }

  // GESTOR só pode criar rotinas para sua própria empresa
  if (user.perfil === 'GESTOR' && pilarEmpresa.empresaId !== user.empresaId) {
    throw new NotFoundException('PilarEmpresa não encontrado');
  }
}
```

3. **Criação Transacional:**
```typescript
const created = await this.prisma.$transaction(async (tx) => {
  const rotina = await tx.rotina.create({
    data: {
      ...rotinaData,
      createdBy: user.id,
    },
  });

  // Se pilarEmpresaId foi fornecido, criar também o vínculo RotinaEmpresa
  if (pilarEmpresaId) {
    const ultimaRotina = await tx.rotinaEmpresa.findFirst({
      where: { pilarEmpresaId },
      orderBy: { ordem: 'desc' },
    });

    const proximaOrdem = ultimaRotina ? ultimaRotina.ordem + 1 : 1;

    await tx.rotinaEmpresa.create({
      data: {
        pilarEmpresaId,
        rotinaId: rotina.id,
        ordem: proximaOrdem,
        createdBy: user.id,
      },
    });
  }

  return rotina;
});
```

**Validação de DTO:**
- `nome`: string, required, 2-200 caracteres
- `descricao`: string, optional, 0-500 caracteres
- `ordem`: number, optional, >= 1
- `modelo`: boolean, optional (default: false)
- `pilarId`: UUID, required
- `pilarEmpresaId`: UUID, optional (se fornecido, cria RotinaEmpresa automaticamente)

**Retorno:**
- Rotina criada com pilar incluído

**Auditoria:**
- Registra criação em tabela de auditoria
- Ação: CREATE
- Dados completos da rotina criada + pilarEmpresaId (se fornecido)

**Perfis autorizados:** ADMINISTRADOR, GESTOR (com restrição multi-tenant)

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L11-L88)

---

### R-ROT-002: Listagem de Rotinas Ativas com Filtro por Pilar

**Descrição:** Endpoint retorna apenas rotinas ativas, ordenadas por pilar e ordem, com filtro opcional por pilarId.

**Implementação:**
- **Endpoint:** `GET /rotinas?pilarId=uuid` (autenticado, todos os perfis)
- **Método:** `RotinasService.findAll(pilarId?)`

**Filtro:**
```typescript
where: {
  ativo: true,
  ...(pilarId && { pilarId }),
}
```

**Ordenação:**
```typescript
orderBy: [
  { pilar: { ordem: 'asc' } },  // Primeiro por ordem do pilar
  { ordem: 'asc' }              // Depois por ordem da rotina
]
```

**Include:**
```typescript
include: {
  pilar: {
    select: {
      id: true,
      nome: true,
      ordem: true,
    },
  },
}
```

**Comportamento:**
- Sem filtro: retorna todas as rotinas ativas de todos os pilares
- Com pilarId: retorna apenas rotinas do pilar especificado

**Retorno:**
- Rotinas ordenadas primeiro por ordem do pilar, depois por ordem da rotina
- Cada rotina inclui dados básicos do pilar

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L47-L62)

---

### R-ROT-003: Busca de Rotina com Pilar Completo

**Descrição:** Endpoint retorna rotina completa com dados do pilar.

**Implementação:**
- **Endpoint:** `GET /rotinas/:id` (autenticado, todos os perfis)
- **Método:** `RotinasService.findOne()`

**Include:**
```typescript
include: {
  pilar: true,  // Pilar completo
}
```

**Retorno:**
- Dados completos da rotina
- Dados completos do pilar vinculado

**Exceção:**
- Lança `NotFoundException` se rotina não existir

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L64-L76)

---

### R-ROT-004: Atualização de Rotina com Validação de Pilar

**Descrição:** Sistema valida que o novo pilar existe ao atualizar rotina (se pilarId for fornecido).

**Implementação:**
- **Endpoint:** `PATCH /rotinas/:id` (restrito a ADMINISTRADOR)
- **Método:** `RotinasService.update()`
- **DTO:** UpdateRotinaDto

**Validação:**
```typescript
if (updateRotinaDto.pilarId) {
  const pilar = await this.prisma.pilar.findUnique({
    where: { id: updateRotinaDto.pilarId },
  });

  if (!pilar) {
    throw new NotFoundException('Pilar não encontrado');
  }
}
```

**Validação de DTO:**
- Todos os campos de CreateRotinaDto como opcionais (PartialType)
- `ativo`: boolean, optional

**Retorno:**
- Rotina atualizada com pilar incluído

**Auditoria:**
- Registra estado antes e depois
- Ação: UPDATE
- Dados completos da mudança

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L78-L115)

---

### R-ROT-005: Desativação de Rotina com Validação de Uso

**Descrição:** Sistema desativa rotina (ativo: false) ao invés de deletar fisicamente. Valida se rotina está em uso por empresas antes de desativar.

**Implementação:**
- **Endpoint:** `DELETE /rotinas/:id` (restrito a ADMINISTRADOR)
- **Método:** `RotinasService.remove()`

**Validação de Uso por Empresas:**
```typescript
const rotinaEmpresasEmUso = await this.prisma.rotinaEmpresa.findMany({
  where: { rotinaId: id },
  include: {
    pilarEmpresa: {
      include: {
        empresa: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    },
  },
});

if (rotinaEmpresasEmUso.length > 0) {
  const empresasAfetadas = rotinaEmpresasEmUso.map(
    (re) => ({
      id: re.pilarEmpresa.empresa.id,
      nome: re.pilarEmpresa.empresa.nome,
    })
  );

  // Bloqueio rígido com 409 Conflict + lista de empresas
  throw new ConflictException({
    message: 'Não é possível desativar esta rotina pois está em uso por empresas',
    empresasAfetadas,
    totalEmpresas: empresasAfetadas.length,
  });
}
```

**Comportamento (se não houver uso):**
```typescript
const after = await this.prisma.rotina.update({
  where: { id },
  data: {
    ativo: false,
    updatedBy: userId,
  },
});
```

**Exceção:**
- HTTP 409 Conflict se rotina estiver em uso
- Retorna lista de empresas afetadas
- Mensagem clara do motivo do bloqueio

**Auditoria:**
- Registra estado antes e depois
- Ação: DELETE (mas operação é UPDATE)
- Dados completos da mudança

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L165-L220)

---

### R-ROT-006: Reordenação de Rotinas por Pilar

**Descrição:** Endpoint permite reordenar múltiplas rotinas de um pilar específico em uma única transação.

**Implementação:**
- **Endpoint:** `POST /rotinas/pilar/:pilarId/reordenar` (restrito a ADMINISTRADOR)
- **Método:** `RotinasService.reordenarPorPilar()`

**Input:**
```typescript
{
  "ordens": [
    { "id": "uuid-1", "ordem": 1 },
    { "id": "uuid-2", "ordem": 2 },
    { "id": "uuid-3", "ordem": 3 }
  ]
}
```

**Comportamento:**
```typescript
const updates = ordensIds.map((item) =>
  this.prisma.rotina.update({
    where: { id: item.id, pilarId },  // Valida que rotina pertence ao pilar
    data: {
      ordem: item.ordem,
      updatedBy: userId,
    },
  }),
);

await this.prisma.$transaction(updates);
```

**Retorno:**
- Lista de rotinas do pilar reordenadas (via `findAll(pilarId)`)

**Atomicidade:**
- Todas as atualizações ocorrem em transação
- Se uma falhar, todas falham (rollback)

**Segurança:**
- WHERE clause inclui `pilarId`, impedindo reordenação de rotinas de outro pilar

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L141-L157)

---

### RA-ROT-001: Restrição de CRUD a ADMINISTRADOR

**Descrição:** Apenas usuários com perfil ADMINISTRADOR podem criar, atualizar, deletar ou reordenar rotinas.

**Implementação:**
- **Decorator:** `@Roles('ADMINISTRADOR')`
- **Guard:** RolesGuard
- **Endpoints protegidos:**
  - POST /rotinas
  - PATCH /rotinas/:id
  - DELETE /rotinas/:id
  - POST /rotinas/pilar/:pilarId/reordenar

**Exceção:**
- GET /rotinas e GET /rotinas/:id são liberados para todos os perfis autenticados

**Arquivo:** [rotinas.controller.ts](../../backend/src/modules/rotinas/rotinas.controller.ts#L31-L86)

---

### RA-ROT-002: Auditoria Completa de Operações

**Descrição:** Todas as operações CUD (Create, Update, Delete) são auditadas.

**Implementação:**
- **Serviço:** AuditService
- **Entidade:** 'rotinas'

**Dados auditados:**
- usuarioId, usuarioNome, usuarioEmail
- entidade: 'rotinas'
- entidadeId: ID da rotina
- acao: CREATE | UPDATE | DELETE
- dadosAntes (em update/delete)
- dadosDepois (em create/update/delete)

**Cobertura:**
- ✅ CREATE (criação de rotina)
- ✅ UPDATE (atualização de rotina)
- ✅ DELETE (desativação de rotina)
- ✅ REORDENAÇÃO (implementado 25/12/2024)

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L34-L42)

---

### RA-ROT-003: Validação de Escopo em Reordenação

**Descrição:** Sistema garante que apenas rotinas do pilar especificado sejam reordenadas.

**Implementação:**
- **WHERE clause em update:**
  ```typescript
  where: { id: item.id, pilarId }
  ```

**Comportamento:**
- Se tentar reordenar rotina de outro pilar, Prisma lança erro (record not found)
- Impede manipulação cruzada entre pilares

**Justificativa:**
- Segurança adicional contra erros de frontend
- Garante isolamento de ordenação por pilar

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L149-L154)

---

## 4. Validações

### 4.1. CreateRotinaDto

**Campos:**
- `nome`: @IsString(), @IsNotEmpty(), @Length(2, 200)
- `descricao`: @IsString(), @IsOptional(), @Length(0, 500)
- `ordem`: @IsInt(), @IsOptional(), @Min(1)
- `pilarId`: @IsUUID(), @IsNotEmpty()

**Validações implementadas:**
- Nome obrigatório, entre 2 e 200 caracteres
- Descrição opcional, máximo 500 caracteres
- Ordem opcional, mínimo 1 se valor fornecido
- PilarId obrigatório e deve ser UUID válido

**Arquivo:** [create-rotina.dto.ts](../../backend/src/modules/rotinas/dto/create-rotina.dto.ts)

---

### 4.2. UpdateRotinaDto

**Campos:**
- Herda todos os campos de CreateRotinaDto como opcionais (PartialType)
- `ativo`: @IsBoolean(), @IsOptional()

**Validações implementadas:**
- Todos os campos opcionais
- Ativo permite ativação/desativação manual (além do soft delete)

**Arquivo:** [update-rotina.dto.ts](../../backend/src/modules/rotinas/dto/update-rotina.dto.ts)

---

## 5. Comportamentos Condicionais

### 5.1. Rotinas Inativas Não Aparecem em Listagem

**Condição:** `rotina.ativo === false`

**Comportamento:**
- Rotinas inativas não são retornadas em `findAll()`
- Não aparecem em interfaces de seleção

**Exceção:**
- `findOne()` não filtra por ativo (retorna rotina mesmo se inativa)

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L49-L50)

---

### 5.2. Ordenação por Pilar e Ordem

**Condição:** Sempre em listagem

**Comportamento:**
- Rotinas ordenadas primeiro por `pilar.ordem` (ascendente)
- Depois por `rotina.ordem` (ascendente)

**Justificativa:**
- Exibir rotinas agrupadas por pilar
- Ordem lógica dentro de cada pilar

**Exemplo:**
```
Pilar 1 (ordem: 1)
  ├─ Rotina A (ordem: 1)
  ├─ Rotina B (ordem: 2)
Pilar 2 (ordem: 2)
  ├─ Rotina C (ordem: 1)
  └─ Rotina D (ordem: 2)
```

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L59)

---

### 5.3. Filtro Opcional por Pilar

**Condição:** Query param `pilarId` fornecido

**Comportamento:**
- Com pilarId: retorna apenas rotinas do pilar especificado
- Sem pilarId: retorna rotinas de todos os pilares

**Uso:**
```
GET /rotinas              → Todas as rotinas
GET /rotinas?pilarId=uuid → Apenas rotinas do pilar uuid
```

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L49-L51)

---

### 5.4. Validação de Pilar em Update Apenas se Fornecido

**Condição:** `updateRotinaDto.pilarId` existe

**Comportamento:**
- Validação de pilar só ocorre se pilarId for fornecido no update
- Se pilarId não mudar, validação não é executada

**Otimização:**
- Evita query desnecessária ao banco

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L81-L91)

---

### 5.5. Reordenação Retorna Rotinas do Pilar

**Condição:** Após reordenação bem-sucedida

**Comportamento:**
- Sistema retorna lista completa de rotinas do pilar reordenadas
- Facilita atualização de interface frontend

**Justificativa:**
- Evita request adicional para obter estado atualizado

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L156)

---

## 6. Ausências ou Ambiguidades

### 6.1. Campo `modelo` Não Utilizado

**Status:** ⚠️ NÃO UTILIZADO

**Descrição:**
- Modelo Rotina possui campo `modelo: Boolean`
- Nenhum endpoint ou lógica utiliza este campo
- Provável intenção: marcar rotinas padrão do sistema (templates)

**TODO:**
- Implementar lógica de "rotina modelo" (templates)
- Ou remover campo do schema se não for necessário
- Documentar diferença entre rotina normal e rotina modelo

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (campo modelo)

---

### 6.2. Reordenação Sem Auditoria

**Status:** ✅ RESOLVIDO (25/12/2024)

**Descrição:**
- ~~Método `reordenarPorPilar()` não registra auditoria~~
- ~~Mudanças de ordem não ficam rastreadas~~
- ~~Não é possível saber quem reordenou ou quando~~

**ATUALIZAÇÃO:** Auditoria implementada com dados completos

**Implementação:**
```typescript
// Auditoria registrada após transação de reordenação
await this.audit.log({
  usuarioId: userId,
  usuarioNome: user?.nome ?? '',
  usuarioEmail: user?.email ?? '',
  entidade: 'rotinas',
  entidadeId: pilarId,
  acao: 'UPDATE',
  dadosAntes: null,
  dadosDepois: { acao: 'reordenacao', ordens: ordensIds },
});
```

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L193-L202)

---

### 6.3. Validação de Ordem Duplicada

**Status:** ⚠️ NÃO VALIDADA

**Descrição:**
- Sistema permite criar/atualizar rotinas com mesma ordem dentro do mesmo pilar
- Não há constraint unique em `[pilarId, ordem]`
- Pode haver conflitos em exibição

**TODO:**
- Decidir se ordem deve ser única por pilar
- Ou permitir ordens duplicadas e ordenar por outro critério secundário (ex: nome)
- Adicionar validação/constraint se necessário

---

### 6.4. Reordenação Sem Validação de IDs Existentes

**Status:** ⚠️ SEM VALIDAÇÃO CLARA

**Descrição:**
- Endpoint `reordenarPorPilar()` valida indiretamente via WHERE clause
- Se ID inválido ou de outro pilar, Prisma lança erro genérico
- Não há validação prévia com mensagem clara

**TODO:**
- Validar IDs antes de iniciar transação
- Lançar NotFoundException se algum ID não existir ou não pertencer ao pilar
- Retornar mensagem clara de qual ID é inválido

---

### 6.5. Paginação Ausente em Listagem

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Endpoint `GET /rotinas` retorna todas as rotinas ativas
- Com filtro por pilar, retorna todas as rotinas do pilar
- Não há paginação, apenas filtro básico

**TODO:**
- Implementar paginação (skip, take, cursor-based)
- Adicionar filtros adicionais (busca por nome)
- Considerar se número de rotinas justifica paginação

---

### 6.6. Validação de Nome Único Não Implementada

**Status:** ❌ NÃO VALIDADO

**Descrição:**
- Sistema NÃO valida unicidade de nome de rotina
- Possível criar múltiplas rotinas com mesmo nome
- Não há constraint unique em `nome`

**Comportamento atual:**
- Rotinas podem ter nomes duplicados (mesmo dentro do mesmo pilar)

**TODO:**
- Decidir se nome deve ser único globalmente
- Ou único por pilar: `@@unique([pilarId, nome])`
- Ou permitir duplicatas (pode ser intencional para templates)

---

### 6.7. Soft Delete Inconsistente

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- `findAll()` filtra por `ativo: true`
- `findOne()` NÃO filtra por ativo (retorna rotina inativa)
- Comportamento inconsistente com módulo Pilares

**Comportamento atual:**
- Pode buscar rotina inativa diretamente por ID
- Mas não aparece em listagens

**TODO:**
- Decidir se `findOne()` deve filtrar por ativo
- Ou documentar que busca por ID ignora flag ativo (para auditoria)

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L64-L76)

---

### 6.8. Desativação Sem Validação de RotinaEmpresa

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- Sistema permite desativar rotina sem verificar se está em uso por empresas
- RotinaEmpresa pode continuar referenciando rotina inativa
- Pode causar inconsistência em interfaces de empresas

**TODO:**
- Decidir se deve bloquear desativação se houver RotinaEmpresa ativas
- Ou desativar automaticamente RotinaEmpresa relacionadas
- Ou permitir e documentar comportamento (cascata soft delete)

---

### 6.9. Reordenação Pode Causar Ordens Negativas ou Zero

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- DTO de reordenação não valida valores de ordem
- Possível enviar ordem negativa ou zero
- CreateRotinaDto exige ordem >= 1, mas reordenação não valida

**TODO:**
- Adicionar validação em DTO de reordenação
- Ou validar dentro do método `reordenarPorPilar()`
- Garantir ordem sempre >= 1

---

### 6.10. findOne() Usado Internamente Pode Lançar NotFoundException

**Status:** ⚠️ EFEITO COLATERAL

**Descrição:**
- `update()` e `remove()` chamam `findOne()` internamente
- `findOne()` lança NotFoundException se rotina não existir
- Comportamento correto, mas não documentado

**Comportamento:**
- Update/Delete de ID inválido retorna 404 (correto)
- Mas lógica está "escondida" em `findOne()`

**Observação:**
- Não é bug, mas pode confundir manutenção futura

**Arquivo:** [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts#L79)

---

### 6.11. Mudança de Pilar Não Valida Empresas

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- Sistema permite mudar rotina de um pilar para outro
- Não valida impacto em RotinaEmpresa existentes
- RotinaEmpresa fica vinculada a PilarEmpresa que pode não ter o novo pilar

**Cenário problemático:**
```
1. Rotina A pertence a Pilar 1
2. Empresa X tem PilarEmpresa(Pilar 1)
3. RotinaEmpresa vincula Rotina A → PilarEmpresa(Pilar 1)
4. Atualiza Rotina A para Pilar 2
5. RotinaEmpresa continua apontando para Pilar 1 (inconsistência)
```

**TODO:**
- Bloquear mudança de pilar se houver RotinaEmpresa
- Ou migrar automaticamente RotinaEmpresa para novo PilarEmpresa
- Ou deletar RotinaEmpresa órfãs

---

## 7. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-ROT-001** | Criação com validação de pilar | ✅ Implementado |
| **R-ROT-002** | Listagem com filtro por pilar | ✅ Implementado |
| **R-ROT-003** | Busca com pilar completo | ✅ Implementado |
| **R-ROT-004** | Atualização com validação de pilar | ✅ Implementado |
| **R-ROT-005** | Soft delete | ✅ Implementado |
| **R-ROT-006** | Reordenação por pilar | ✅ Implementado |
| **RA-ROT-001** | Restrição a ADMINISTRADOR | ✅ Implementado |
| **RA-ROT-002** | Auditoria de operações | ✅ Implementado |
| **RA-ROT-003** | Validação de escopo em reordenação | ✅ Implementado |

**Ausências críticas:**
- ❌ Paginação em listagem
- ❌ Validação de nome único
- ⚠️ Mudança de pilar sem validação de impacto
- ⚠️ Desativação sem validação de RotinaEmpresa
- ⚠️ Campo `modelo` não utilizado
- ⚠️ Soft delete inconsistente (findOne não filtra)

---

## 8. Fluxo de Operações

### 8.1. Criação de Rotina

```
1. ADMINISTRADOR envia POST /rotinas
2. DTO valida campos (nome, descricao, ordem, pilarId)
3. Service valida existência do pilar
4. Se pilar não existe → 404 Not Found
5. Cria rotina com createdBy
6. Registra auditoria (CREATE)
7. Retorna rotina criada com pilar incluído (201)
```

---

### 8.2. Listagem de Rotinas

```
1. Usuário autenticado envia GET /rotinas?pilarId=uuid (opcional)
2. Service filtra por ativo: true
3. Se pilarId fornecido, filtra também por pilarId
4. Ordena por pilar.ordem ASC, depois rotina.ordem ASC
5. Inclui dados básicos do pilar
6. Retorna lista ordenada (200)
```

---

### 8.3. Reordenação de Rotinas de um Pilar

```
1. ADMINISTRADOR envia POST /rotinas/pilar/:pilarId/reordenar
2. Service recebe array de {id, ordem}
3. Cria array de updates com WHERE id + pilarId
4. Executa em transação atômica
5. Se algum ID inválido ou de outro pilar → rollback + erro Prisma
6. Retorna lista de rotinas do pilar reordenadas (200)
7. ❌ Não registra auditoria
```

---

### 8.4. Mudança de Pilar

```
1. ADMINISTRADOR envia PATCH /rotinas/:id { pilarId: "novo-uuid" }
2. Service busca rotina (findOne)
3. Valida existência do novo pilar
4. Se pilar não existe → 404 Not Found
5. Atualiza rotina (pilarId + updatedBy)
6. Registra auditoria (UPDATE)
7. Retorna rotina atualizada com novo pilar (200)
8. ⚠️ Não valida impacto em RotinaEmpresa
```

---

## 9. Relacionamentos

### 9.1. Rotina → Pilar (N:1)

**Descrição:**
- Rotina pertence a um único pilar (obrigatório)
- Pilar pode ter várias rotinas

**Comportamento:**
- Criação valida existência do pilar (R-ROT-001)
- Update valida existência do novo pilar (R-ROT-004)
- Pilar incluído em retorno de criação/update/busca

**Cascata:**
- Não implementado (o que acontece se pilar for deletado?)

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation pilar)

---

### 9.2. Rotina → RotinaEmpresa → PilarEmpresa (1:N)

**Descrição:**
- Rotina pode ser vinculada a múltiplas empresas via RotinaEmpresa
- Cada RotinaEmpresa pertence a um PilarEmpresa específico

**Comportamento:**
- Desativação de rotina NÃO valida RotinaEmpresa (6.8)
- Mudança de pilar NÃO valida impacto (6.11)

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation rotinaEmpresas)

---

## 10. Comparação com Módulo Pilares

### Semelhanças:
- ✅ CRUD completo com soft delete
- ✅ Reordenação em lote com transação
- ✅ Auditoria de create/update/delete
- ✅ Restrição de CRUD a ADMINISTRADOR
- ✅ Listagem pública para todos os perfis autenticados

### Diferenças:
- ❌ Pilares validam rotinas ativas antes de desativar → Rotinas NÃO validam RotinaEmpresa
- ❌ Pilares têm nome único → Rotinas NÃO têm validação de unicidade
- ✅ Rotinas validam pilar → Pilares não têm dependência obrigatória
- ✅ Rotinas têm filtro por pilar → Pilares não têm filtro similar
- ✅ Rotinas reordenam por pilar → Pilares reordenam globalmente
- ✅ Rotinas ordenam por pilar.ordem + rotina.ordem → Pilares ordenam apenas por ordem

---

## 11. Regras de Interface (Frontend)

**Status:** ✅ **APROVADAS** - Decisão em 25/12/2024

**Última atualização:** 25/12/2024  
**Agente:** Extractor de Regras (Mode B - Rule Proposal)  
**Aprovação:** Usuário (25/12/2024)

---

### UI-ROT-001: Listagem de Rotinas Ativas

**Descrição:** Sistema exibe apenas rotinas ativas, ordenadas por pilar e campo `ordem`.

**Acesso:** Todos os perfis autenticados  
**Rota:** `/rotinas`  
**Guard:** `AuthGuard`

**Localização:** `frontend/src/app/modules/rotinas/components/rotinas-list/`

**Campos Exibidos na Tabela:**

| Coluna | Origem | Formato |
|--------|--------|---------|
| Nome | `rotina.nome` | Texto |
| Descrição | `rotina.descricao` | Texto truncado (50 chars) + tooltip |
| Pilar | `rotina.pilar.nome` | Texto |
| Tipo | `rotina.modelo` | Badge (Modelo/Customizada) |
| Ordem | `rotina.ordem` | Número (nullable) |
| Ações | - | Botões (apenas ADMINISTRADOR) |

**Funcionalidades:**
- Agrupamento visual por pilar
- Filtro por pilar (dropdown)
- Contador: "X rotinas encontradas no pilar Y"
- Ordenação automática: `pilar.ordem ASC`, depois `rotina.ordem ASC`
- Badge "Modelo" para `modelo: true`

**Cenários:**
- **Happy Path:** Lista carregada com rotinas ativas de todos os pilares
- **Vazio:** Mensagem "Nenhuma rotina cadastrada"
- **Erro API:** Mensagem de erro com botão retry

**Restrições:**
- Rotinas inativas não aparecem
- Apenas rotinas de pilares ativos são exibidas

**Endpoint:** `GET /rotinas?pilarId=uuid`

**Referência Backend:** [R-ROT-002](#r-rot-002-listagem-de-rotinas-ativas)

---

### UI-ROT-002: Filtro de Rotinas por Pilar

**Descrição:** Interface permite filtrar rotinas por pilar específico.

**Componente:** `RotinaFilterComponent`

**Interface:**
- Dropdown com lista de pilares ativos
- Opção "Todos os Pilares" (padrão)
- Ao selecionar: recarregar lista via API
- Contador dinâmico: "X rotinas encontradas"

**Endpoints:**
- `GET /pilares` (popular dropdown)
- `GET /rotinas?pilarId=uuid` (filtrar)

**Cenários:**
- **Happy Path:** Filtro aplicado, lista atualizada
- **Sem resultados:** "Nenhuma rotina neste pilar"
- **Erro API:** Toast de erro, manter estado anterior

**Referência Backend:** [R-ROT-002](#r-rot-002-listagem-de-rotinas-ativas)

---

### UI-ROT-003: Badge Visual "Modelo"

**Descrição:** Rotinas com `modelo: true` exibem badge distintivo.

**Lógica:**
```typescript
if (rotina.modelo === true) {
  badge = 'Modelo'
  classe = 'bg-primary' // azul
  tooltip = 'Rotina padrão do sistema'
} else {
  // Sem badge
}
```

**Renderização:**
```html
<span class="badge bg-primary" 
      [tooltip]="'Rotina padrão do sistema'">
  Modelo
</span>
```

**Arquivo:** `rotina-badge.component.ts` (reutilizável)

---

### UI-ROT-004: Formulário de Criação de Rotina

**Descrição:** ADMINISTRADOR pode criar nova rotina vinculada a um pilar.

**Acesso:** Apenas ADMINISTRADOR  
**Rota:** `/rotinas/novo`  
**Guard:** `AdminGuard`

**Localização:** `frontend/src/app/modules/rotinas/components/rotina-form/`

**Campos:**

**Nome** (obrigatório)
- Validação: required, minLength(2), maxLength(200)
- Trim automático

**Pilar** (obrigatório)
- Dropdown com pilares ativos
- Endpoint: `GET /pilares`

**Descrição** (opcional)
- Textarea, maxLength(500)

**Ordem** (opcional)
- Input numérico, min(1)
- Help text: "Ordem de exibição dentro do pilar"

**Modelo** (checkbox)
- Default: false
- Help text: "Rotinas modelo são auto-associadas a novas empresas"

**Botões:**
- Cancelar → `/rotinas`
- Salvar → `POST /rotinas` + redirect

**Cenários:**
- **Happy Path:** Toast "Rotina criada com sucesso" → redirect
- **Erro validação:** Mensagens inline
- **Erro backend (409):** Toast "Erro ao criar rotina"
- **Erro rede:** Toast "Erro de conexão"

**Endpoint:** `POST /rotinas`

**Referência Backend:** [R-ROT-001](#r-rot-001-criação-de-rotina-com-validação-de-pilar)

---

### UI-ROT-005: Edição de Rotina Existente

**Descrição:** ADMINISTRADOR pode editar rotina (exceto pilarId).

**Acesso:** Apenas ADMINISTRADOR  
**Rota:** `/rotinas/editar/:id`  
**Guard:** `AdminGuard`

**Interface:**
- Modal ou página de edição
- Campos editáveis: nome, descrição, ordem, modelo
- Campo **não editável**: Pilar (apenas exibição)
- Validações idênticas à criação

**Cenários:**
- **Happy Path:** Toast "Rotina atualizada" → fechar modal
- **Erro 404:** "Rotina não encontrada"
- **Erro 403:** "Sem permissão"

**Endpoint:** `PATCH /rotinas/:id`

**Referência Backend:** [R-ROT-004](#r-rot-004-atualização-de-rotina)

---

### UI-ROT-006: Desativação de Rotina (Soft Delete)

**Descrição:** ADMINISTRADOR pode desativar rotina.

**Acesso:** Apenas ADMINISTRADOR  
**Trigger:** Botão "Desativar" ou ícone lixeira

**Modal de Confirmação:**
```
⚠️ Desativar rotina?

A rotina "[nome]" será desativada.
Esta ação pode ser revertida.

[Cancelar]  [Desativar]
```

**Se rotina em uso por empresas (validação backend):**
```
⚠️ Rotina em Uso

Esta rotina está em uso por X empresa(s):
- Empresa A
- Empresa B

Deseja desativar mesmo assim?

[Cancelar]  [Ainda assim desativar]
```

**Cenários:**
- **Happy Path:** Toast "Rotina desativada" → remove da lista
- **Erro 409:** "Não é possível desativar" (se backend bloquear)
- **Erro 404:** "Rotina não encontrada"

**Endpoint:** `DELETE /rotinas/:id`

**Decisão:** ✅ Backend bloqueia desativação se rotina em uso (409 Conflict)

**Referência Backend:** [R-ROT-BE-002](#r-rot-be-002-validação-de-dependência-em-desativação), [R-ROT-006](#r-rot-006-desativação-de-rotina-soft-delete)

---

### UI-ROT-007: Reordenação de Rotinas (Drag-and-Drop)

**Descrição:** ADMINISTRADOR pode reordenar rotinas dentro do mesmo pilar.

**Acesso:** Apenas ADMINISTRADOR  
**Condição:** Filtro por pilar ativo

**Interface:**
- Ícone arrastar (⋮⋮) ao lado de cada rotina
- Feedback visual ao arrastar (cursor, placeholder)
- Ao soltar: chamada API automática
- Toast: "Ordem atualizada com sucesso"

**Cenários:**
- **Happy Path:** Ordem salva, lista atualizada
- **Erro API:** Reverter ordem, toast "Erro ao reordenar"
- **Sem filtro:** Reordenação desabilitada, tooltip "Selecione um pilar"

**Restrições:**
- Apenas dentro do mesmo pilar (não move entre pilares)
- Apenas ADMINISTRADOR vê controles

**Endpoint:** `POST /rotinas/pilar/:pilarId/reordenar`  
**Body:** `{ ordemRotinas: [{ id, ordem }] }`

**Referência Backend:** [R-ROT-007](#r-rot-007-reordenação-de-rotinas-por-pilar)

---

### UI-ROT-008: Proteção de Acesso por Perfil (RBAC)

**Descrição:** Apenas ADMINISTRADOR pode entrar na tela de Rotinas e visualizar/criar/editar/desativar/reordenar.

**Route Guard:**
```typescript
{
  path: 'rotinas',
  canActivate: [AuthGuard],
  children: [
    { path: '', component: RotinasListComponent },
    { 
      path: 'novo', 
      component: RotinaFormComponent,
      canActivate: [AdminGuard] 
    },
    { 
      path: 'editar/:id', 
      component: RotinaFormComponent,
      canActivate: [AdminGuard] 
    }
  ]
}
```

**Comportamento Visual:**
- **ADMINISTRADOR:** Vê botões "Nova Rotina", "Editar", "Desativar", drag-and-drop
- **Outros perfis:** Não acessa a tela.
- **Tentativa acesso direto:** Redirect ou mensagem "Acesso negado"

**Menu Lateral:**
- Item "Rotinas" visível para todos
- Submenu "Nova Rotina" apenas para ADMINISTRADOR

**Referência Backend:** Guards ADMINISTRADOR em todos endpoints de escrita

---

## 12. Regras Backend Complementares

**Status:** ✅ **APROVADAS** - Decisão em 25/12/2024

---

### R-ROT-BE-001: Auto-associação de Rotinas Modelo

**Descrição:** Quando empresa vincular PilarEmpresa, rotinas com `modelo: true` devem ser auto-criadas em RotinaEmpresa.

**Condição:** Novo registro em PilarEmpresa (empresa vincula pilar).

**Comportamento Esperado:**
1. **Método explícito:** `PilaresEmpresaService.vincularPilares()` deve chamar método auxiliar `autoAssociarRotinasModelo(pilarEmpresaId, pilarId)`
2. Query: `SELECT * FROM rotinas WHERE pilarId = :pilarId AND modelo = true AND ativo = true`
3. Para cada rotina modelo:
   ```typescript
   createMany({
     data: rotinas.map((r, index) => ({
       pilarEmpresaId: novoPilarEmpresaId,
       rotinaId: r.id,
       ordem: r.ordem ?? index + 1,
       ativo: true
     }))
   })
   ```
4. Auditoria: registrar criação em batch

**Cenários:**
- **Happy Path:** Rotinas modelo auto-associadas
- **Sem rotinas modelo:** Apenas PilarEmpresa criado
- **Duplicata:** Ignorar (constraint unique)

**Impacto Técnico:**
- Módulo: `PilaresEmpresaService`
- Método principal: `vincularPilares()`
- Método auxiliar: `autoAssociarRotinasModelo(pilarEmpresaId, pilarId)` (CRIAR)
- Tabelas: `rotinas`, `rotinas_empresa`

**Decisão:** ✅ **APROVADO** - Implementar auto-associação via método explícito

**Observação:** Evitar uso de triggers de banco de dados para facilitar rastreabilidade e manutenção futura.

**Referência Similar:** [empresas.md](empresas.md#R-EMP-004) (auto-associação de pilares)

---

### R-ROT-BE-002: Validação de Dependência em Desativação

**Descrição:** Sistema valida se rotina possui RotinaEmpresa ativa antes de desativar e bloqueia a operação se houver uso ativo.

**Condição:** ADMINISTRADOR tenta `DELETE /rotinas/:id`.

**Comportamento Implementado (Bloqueio Rígido):**
1. Query: `SELECT COUNT(*) FROM rotinas_empresa WHERE rotinaId = :id AND ativo = true`
2. Se count > 0:
   - `409 Conflict`
   - Mensagem: `"Não é possível desativar rotina em uso por X empresa(s)"`
   - Body: `{ empresasAfetadas: [{ id, nome }] }`
3. Query detalhada para listar empresas:
   ```typescript
   const empresasAfetadas = await prisma.rotinaEmpresa.findMany({
     where: { rotinaId: id, ativo: true },
     include: {
       pilarEmpresa: {
         include: { empresa: { select: { id: true, nome: true } } }
       }
     }
   })
   ```

**Cenários:**
- **Sem uso:** Desativa normalmente (soft delete)
- **Em uso:** Bloqueia com erro 409 + lista de empresas
- **Erro query:** 500 Internal Server Error

**Decisão:** ✅ **APROVADO** - Bloqueio rígido (Opção 1)

**Impacto Técnico:**
- Módulo: `RotinasService`
- Método: `remove()` (modificar para adicionar validação)
- Query: JOIN com empresas para listar nomes
- Exceptions: ConflictException

**Referência Similar:** [pilares.md](pilares.md#R-PIL-006)

---

## 13. Estrutura Frontend Proposta

```
frontend/src/app/modules/rotinas/
├── rotinas.module.ts
├── rotinas-routing.module.ts
├── components/
│   ├── rotinas-list/
│   │   ├── rotinas-list.component.ts
│   │   ├── rotinas-list.component.html
│   │   └── rotinas-list.component.scss
│   ├── rotina-form/
│   │   ├── rotina-form.component.ts
│   │   ├── rotina-form.component.html
│   │   └── rotina-form.component.scss
│   └── rotina-filter/
│       ├── rotina-filter.component.ts
│       ├── rotina-filter.component.html
│       └── rotina-filter.component.scss
├── services/
│   └── rotinas.service.ts
├── models/
│   ├── rotina.model.ts
│   └── rotina-form.model.ts
└── guards/
    └── admin.guard.ts (ou reutilizar guard global)
```

---

## 14. Testes Frontend Sugeridos (E2E)

### Teste 1: Listagem de Rotinas
- **Dado** que existem 5 rotinas ativas no pilar "Estratégico"
- **Quando** acesso `/rotinas`
- **Então** devo ver 5 rotinas ordenadas por `ordem`

### Teste 2: Filtro por Pilar
- **Dado** que existem rotinas em 3 pilares diferentes
- **Quando** filtro por pilar "Financeiro"
- **Então** devo ver apenas rotinas do pilar "Financeiro"

### Teste 3: Criar Rotina (ADMINISTRADOR)
- **Dado** que sou ADMINISTRADOR
- **Quando** preencho formulário válido e salvo
- **Então** devo ver toast "Rotina criada com sucesso"
- **E** rotina aparece na listagem

### Teste 4: Editar Rotina (ADMINISTRADOR)
- **Dado** que sou ADMINISTRADOR
- **Quando** edito nome e salvo
- **Então** devo ver toast "Rotina atualizada"
- **E** nome atualizado na lista

### Teste 5: Desativar Rotina (ADMINISTRADOR)
- **Dado** que sou ADMINISTRADOR
- **Quando** clico em "Desativar" e confirmo
- **Então** rotina deve desaparecer da listagem

### Teste 6: Acesso Negado (GESTOR)
- **Dado** que sou GESTOR
- **Quando** acesso `/rotinas`
- **Então** devo ver apenas visualização
- **E** não devo ver botões de ação

### Teste 7: Reordenar Rotinas (ADMINISTRADOR)
- **Dado** que filtrei rotinas do pilar "Estratégico"
- **Quando** arrasto rotina da posição 3 para posição 1
- **Então** devo ver ordem atualizada
- **E** nova ordem deve persistir após reload

---

## 15. Referências

**Arquivos Backend:**
- [rotinas.service.ts](../../backend/src/modules/rotinas/rotinas.service.ts)
- [rotinas.controller.ts](../../backend/src/modules/rotinas/rotinas.controller.ts)
- [create-rotina.dto.ts](../../backend/src/modules/rotinas/dto/create-rotina.dto.ts)
- [update-rotina.dto.ts](../../backend/src/modules/rotinas/dto/update-rotina.dto.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (Rotina, RotinaEmpresa)

**Arquivos Frontend (A Implementar):**
- [rotinas.module.ts](../../frontend/src/app/modules/rotinas/rotinas.module.ts)
- [rotinas.service.ts](../../frontend/src/app/modules/rotinas/services/rotinas.service.ts)
- [rotinas-list.component.ts](../../frontend/src/app/modules/rotinas/components/rotinas-list/)

**Dependências:**
- AuditService (auditoria de operações)
- PrismaService (acesso ao banco)
- JwtAuthGuard (autenticação)
- RolesGuard (autorização por perfil)

**Módulos relacionados:**
- Pilares (rotina pertence a pilar)
- Empresas (via RotinaEmpresa e PilarEmpresa)

**Padrões a seguir:**
- [docs/conventions/frontend.md](../conventions/frontend.md)
- [docs/business-rules/pilares.md](pilares.md#11-regras-de-interface-frontend) (referência)

---

## 16. Status de Implementação

**Backend:**
- ✅ CRUD completo implementado
- ✅ Validações de segurança (RBAC)
- ✅ Auditoria de operações CUD (incluindo reordenação)
- ✅ Soft delete consistente
- ✅ Reordenação por pilar
- ✅ Filtro por pilar
- ✅ Campo `modelo` implementado

**Frontend:**
- ✅ **IMPLEMENTADO** (25/12/2024) - Todas as regras UI-ROT-001 a 008
- ✅ Listagem de rotinas (UI-ROT-001)
- ✅ Filtro por pilar (UI-ROT-002)
- ✅ Badge "Modelo" (UI-ROT-003)
- ✅ Formulário criar/editar (UI-ROT-004, UI-ROT-005)
- ✅ Desativação com validação 409 (UI-ROT-006)
- ✅ Drag-and-drop reordenação (UI-ROT-007)
- ✅ RBAC guards (UI-ROT-008)

**Backend Complementar:**
- ✅ **IMPLEMENTADO** (25/12/2024) - Todas as regras complementares
- ✅ R-ROT-BE-001: Auto-associação de rotinas modelo via método explícito
- ✅ R-ROT-BE-002: Validação de dependência com bloqueio rígido (409)

**Decisões Aprovadas (25/12/2024):**
- ✅ R-ROT-BE-001: Implementar auto-associação via método explícito (evitar triggers)
- ✅ R-ROT-BE-002: Bloqueio rígido - erro 409 se rotina em uso

---

**Data de extração:** 21/12/2024  
**Data de atualização:** 25/12/2024  
**Data de aprovação:** 25/12/2024  
**Data de implementação:** 25/12/2024  
**Agente:** Business Rules Extractor (Modo A + Modo B)  
**Status:** ✅ Backend completo | ✅ Frontend completo | ✅ Backend complementar completo | ✅ IMPLEMENTAÇÃO CONCLUÍDA

---

**Observação final:**  
Este documento reflete:
- **Backend base:** Código IMPLEMENTADO ✅ (extração modo A)
- **Frontend:** Código IMPLEMENTADO ✅ (25/12/2024)
- **Backend complementar:** Código IMPLEMENTADO ✅ (R-ROT-BE-001 e R-ROT-BE-002)
- **Decisões tomadas:** Auto-associação via método explícito + Bloqueio rígido em desativação

Frontend implementado seguindo padrão estabelecido em [pilares.md](pilares.md#11-regras-de-interface-frontend).  

**Próximo passo:** Seguir fluxo oficial:  
1. ✅ Dev Agent → Frontend e backend complementar implementados
2. ✅ Pattern Enforcer → Conformidade validada (100%)
3. ⏳ QA Unitário → Criar testes independentes  
4. ⏳ E2E Agent → Validar fluxo completo
