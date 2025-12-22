# Regras de Negócio — Pilares

**Módulo:** Pilares  
**Backend:** `backend/src/modules/pilares/`  
**Frontend:** Não implementado  
**Última extração:** 21/12/2024  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Pilares é responsável por:
- Gerenciar pilares do sistema (CRUD completo)
- Ordenação customizável de pilares
- Validação de dependências com rotinas ativas
- Auditoria de operações em pilares
- Vinculação de pilares a empresas (via PilarEmpresa)

**Entidades principais:**
- Pilar (pilares do sistema)
- PilarEmpresa (vínculo pilar-empresa)

**Endpoints implementados:**
- `POST /pilares` — Criar pilar (ADMINISTRADOR)
- `GET /pilares` — Listar pilares ativos (todos)
- `GET /pilares/:id` — Buscar pilar com rotinas (todos)
- `PATCH /pilares/:id` — Atualizar pilar (ADMINISTRADOR)
- `DELETE /pilares/:id` — Desativar pilar (ADMINISTRADOR)
- `POST /pilares/reordenar` — Reordenar pilares (ADMINISTRADOR)

---

## 2. Entidades

### 2.1. Pilar

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| nome | String (unique) | Nome do pilar (ex: "Estratégia e Governança") |
| descricao | String? | Descrição detalhada do pilar |
| ordem | Int | Ordem de exibição do pilar |
| modelo | Boolean (default: false) | Indica se é pilar modelo (template) |
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

---

### 2.2. PilarEmpresa

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| empresaId | String | FK para Empresa |
| pilarId | String | FK para Pilar |
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
- `ordem`: number, required, >= 1

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

### R-PIL-003: Busca de Pilar com Rotinas e Empresas

**Descrição:** Endpoint retorna pilar completo com rotinas ativas vinculadas e empresas.

**Implementação:**
- **Endpoint:** `GET /pilares/:id` (autenticado, todos os perfis)
- **Método:** `PilaresService.findOne()`

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

### R-PIL-006: Reordenação de Pilares em Lote

**Descrição:** Endpoint permite reordenar múltiplos pilares em uma única transação.

**Implementação:**
- **Endpoint:** `POST /pilares/reordenar` (restrito a ADMINISTRADOR)
- **Método:** `PilaresService.reordenar()`

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
  this.prisma.pilar.update({
    where: { id: item.id },
    data: {
      ordem: item.ordem,
      updatedBy: userId,
    },
  }),
);

await this.prisma.$transaction(updates);
```

**Retorno:**
- Lista completa de pilares reordenados (via `findAll()`)

**Atomicidade:**
- Todas as atualizações ocorrem em transação
- Se uma falhar, todas falham (rollback)

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L153-L165)

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

**Descrição:** Apenas usuários com perfil ADMINISTRADOR podem criar, atualizar, deletar ou reordenar pilares.

**Implementação:**
- **Decorator:** `@Roles('ADMINISTRADOR')`
- **Guard:** RolesGuard
- **Endpoints protegidos:**
  - POST /pilares
  - PATCH /pilares/:id
  - DELETE /pilares/:id
  - POST /pilares/reordenar

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
- ❌ Reordenação NÃO é auditada

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L32-L40)

---

## 4. Validações

### 4.1. CreatePilarDto

**Campos:**
- `nome`: @IsString(), @IsNotEmpty(), @Length(2, 100)
- `descricao`: @IsString(), @IsOptional(), @Length(0, 500)
- `ordem`: @IsInt(), @Min(1)

**Validações implementadas:**
- Nome obrigatório, entre 2 e 100 caracteres
- Descrição opcional, máximo 500 caracteres
- Ordem obrigatória, mínimo 1

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

## 5. Comportamentos Condicionais

### 5.1. Pilares Inativos Não Aparecem em Listagem

**Condição:** `pilar.ativo === false`

**Comportamento:**
- Pilares inativos não são retornados em `findAll()`
- Não aparecem em interfaces de seleção

**Exceção:**
- `findOne()` não filtra por ativo (retorna pilar mesmo se inativo)

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L44-L45)

---

### 5.2. Ordenação Customizável

**Condição:** Sempre

**Comportamento:**
- Pilares sempre retornados ordenados por `ordem` (ascendente)
- Ordem pode ser personalizada via endpoint `/pilares/reordenar`

**Justificativa:**
- Permite organização lógica de pilares para exibição
- Manutenção de ordem consistente em interfaces

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L53)

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

### 5.6. Reordenação em Transação Atômica

**Condição:** Sempre em reordenação

**Comportamento:**
- Todas as atualizações de ordem ocorrem em transação
- Se uma falhar, todas são revertidas (rollback)

**Justificativa:**
- Garantir consistência de ordem (evitar ordens duplicadas ou gaps)

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L160)

---

## 6. Ausências ou Ambiguidades

### 6.1. Campo `modelo` Não Utilizado

**Status:** ⚠️ NÃO UTILIZADO

**Descrição:**
- Modelo Pilar possui campo `modelo: Boolean`
- Nenhum endpoint ou lógica utiliza este campo
- Provável intenção: marcar pilares padrão do sistema

**TODO:**
- Implementar lógica de "pilar modelo" (templates)
- Ou remover campo do schema se não for necessário
- Documentar diferença entre pilar normal e pilar modelo

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (campo modelo)

---

### 6.2. Reordenação Sem Auditoria

**Status:** ❌ NÃO AUDITADO

**Descrição:**
- Método `reordenar()` não registra auditoria
- Mudanças de ordem não ficam rastreadas
- Não é possível saber quem reordenou ou quando

**TODO:**
- Adicionar registro de auditoria em reordenação
- Considerar registrar apenas uma auditoria para toda a operação (não uma por pilar)

**Arquivo:** [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts#L153-L165)

---

### 6.3. Validação de Ordem Duplicada

**Status:** ⚠️ NÃO VALIDADA

**Descrição:**
- Sistema permite criar/atualizar pilares com mesma ordem
- Não há constraint unique em `ordem`
- Pode haver conflitos em exibição

**TODO:**
- Decidir se ordem deve ser única
- Ou permitir ordens duplicadas e ordenar por outro critério secundário (ex: nome)
- Adicionar validação de ordem única se necessário

---

### 6.4. Reordenação Sem Validação de IDs Existentes

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- Endpoint `reordenar()` não valida se IDs fornecidos existem
- Se ID inválido for enviado, transação falha sem mensagem clara
- Erro genérico do Prisma é retornado

**TODO:**
- Validar IDs antes de iniciar transação
- Lançar NotFoundException se algum ID não existir
- Retornar mensagem clara de qual ID é inválido

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

### 6.6. Empresas Vinculadas Não Verificadas em Desativação

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- Sistema verifica rotinas ativas antes de desativar
- NÃO verifica se há empresas ativas usando o pilar
- Pode desativar pilar em uso por empresas

**Comportamento atual:**
- PilarEmpresa continua existindo mesmo com pilar inativo
- Pode causar inconsistência em interfaces

**TODO:**
- Decidir se deve bloquear desativação se houver empresas ativas
- Ou permitir desativação e marcar PilarEmpresa como inativo automaticamente
- Documentar comportamento esperado

---

### 6.7. Multi-Tenancy Não Implementado

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Pilares são globais (não há empresaId em Pilar)
- Não há isolamento multi-tenant
- Todos os usuários veem os mesmos pilares

**Comportamento atual:**
- Pilares são compartilhados entre empresas via PilarEmpresa
- Empresa escolhe quais pilares usar (vinculação)

**Observação:**
- Design é intencional (pilares são "catálogo global")
- Não é bug, mas pode ser limitação futura

---

### 6.8. Soft Delete Inconsistente

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- `findAll()` filtra por `ativo: true`
- `findOne()` NÃO filtra por ativo (retorna pilar inativo)
- Comportamento inconsistente

**Comportamento atual:**
- Pode buscar pilar inativo diretamente por ID
- Mas não aparece em listagens

**TODO:**
- Decidir se `findOne()` deve filtrar por ativo
- Ou documentar que busca por ID ignora flag ativo (para auditoria)

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
| **R-PIL-006** | Reordenação em lote | ✅ Implementado |
| **RA-PIL-001** | Bloqueio por rotinas ativas | ✅ Implementado |
| **RA-PIL-002** | Restrição a ADMINISTRADOR | ✅ Implementado |
| **RA-PIL-003** | Auditoria de operações | ⚠️ Parcial (sem reordenação) |

**Ausências críticas:**
- ❌ Auditoria de reordenação
- ❌ Paginação em listagem
- ⚠️ Validação de empresas ativas em desativação
- ⚠️ Campo `modelo` não utilizado
- ⚠️ Reordenação sem validação de IDs
- ⚠️ Soft delete inconsistente (findOne não filtra)

---

## 8. Fluxo de Operações

### 8.1. Criação de Pilar

```
1. ADMINISTRADOR envia POST /pilares
2. DTO valida campos (nome, descricao, ordem)
3. Service valida unicidade de nome
4. Se nome duplicado → 409 Conflict
5. Cria pilar com createdBy
6. Registra auditoria (CREATE)
7. Retorna pilar criado (201)
```

---

### 8.2. Desativação de Pilar

```
1. ADMINISTRADOR envia DELETE /pilares/:id
2. Service busca pilar (findOne)
3. Se não existe → 404 Not Found
4. Conta rotinas ativas vinculadas
5. Se rotinas ativas > 0 → 409 Conflict
6. Atualiza ativo: false
7. Registra auditoria (DELETE)
8. Retorna pilar desativado (200)
```

---

### 8.3. Reordenação de Pilares

```
1. ADMINISTRADOR envia POST /pilares/reordenar
2. Service recebe array de {id, ordem}
3. Cria array de updates
4. Executa em transação atômica
5. Se algum ID inválido → rollback + erro Prisma
6. Retorna lista completa atualizada (findAll)
7. ❌ Não registra auditoria
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
- Empresas "escolhem" quais pilares usar
- PilarEmpresa permite customização por empresa

**Ausência:**
- Desativação de pilar NÃO verifica empresas ativas (6.6)

**Arquivo:** [schema.prisma](../../backend/prisma/schema.prisma) (relation empresas)

---

## 10. Referências

**Arquivos principais:**
- [pilares.service.ts](../../backend/src/modules/pilares/pilares.service.ts)
- [pilares.controller.ts](../../backend/src/modules/pilares/pilares.controller.ts)
- [create-pilar.dto.ts](../../backend/src/modules/pilares/dto/create-pilar.dto.ts)
- [update-pilar.dto.ts](../../backend/src/modules/pilares/dto/update-pilar.dto.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (Pilar, PilarEmpresa)

**Dependências:**
- AuditService (auditoria de operações)
- PrismaService (acesso ao banco)
- JwtAuthGuard (autenticação)
- RolesGuard (autorização por perfil)

---

**Observação final:**  
Este documento reflete APENAS o código IMPLEMENTADO.  
Módulo Pilares possui CRUD completo + reordenação customizável.  
Validações de dependência (rotinas ativas) garantem integridade.  
Auditoria completa exceto reordenação.
