# Regras de Negócio — Módulo PILARES

**Data de extração**: 2025-12-21  
**Escopo**: Definição de pilares de gestão e sua estrutura

---

## 1. Visão Geral

O módulo PILARES implementa:
- CRUD de pilares (eixos temáticos de gestão)
- Associação de pilares com empresas
- Vinculação de rotinas a pilares
- Ordenação hierárquica de pilares
- Validação de dependências antes de deletar
- Suporte a soft delete (desativação)

**Conceito**: Um "Pilar" é um tema de gestão (ex: "Estratégia e Governança"), que contém múltiplas "Rotinas" (ações/tarefas).

---

## 2. Entidades

### 2.1 Pilar
```
- id: UUID (PK)
- nome: String (UNIQUE) — nome do pilar (ex: "Estratégia e Governança")
- descricao: String (nullable) — descrição detalhada
- ordem: Int — posição na hierarquia (1, 2, 3, ...)
- modelo: Boolean (default: false) — marca pilares template/modelo
- ativo: Boolean (default: true) — marca soft delete
- createdAt: DateTime — data de criação
- updatedAt: DateTime — data da última atualização
- createdBy: String (nullable) — ID do usuário que criou
- updatedBy: String (nullable) — ID do usuário que atualizou
- rotinas: Rotina[] — rotinas vinculadas
- empresas: PilarEmpresa[] — relacionamento com empresas
```

### 2.2 Rotina
```
- id: UUID (PK)
- nome: String — nome da rotina
- descricao: String (nullable) — descrição
- ordem: Int — posição dentro do pilar
- modelo: Boolean (default: false) — marca como template
- ativo: Boolean (default: true) — marca soft delete
- pilarId: UUID (FK) — pilar ao qual pertence
- pilar: Pilar — referência de relacionamento
- createdAt: DateTime
- updatedAt: DateTime
- createdBy: String (nullable)
- updatedBy: String (nullable)
- rotinaEmpresas: RotinaEmpresa[] — execuções por empresa
```

### 2.3 PilarEmpresa (Join Table)
```
- id: UUID (PK)
- empresaId: UUID (FK) — empresa
- empresa: Empresa — referência
- pilarId: UUID (FK) — pilar
- pilar: Pilar — referência
- ativo: Boolean (default: true) — soft delete
- createdAt: DateTime
- updatedAt: DateTime
- createdBy: String (nullable)
- updatedBy: String (nullable)
- rotinasEmpresa: RotinaEmpresa[] — execuções das rotinas deste pilar em esta empresa
- evolucao: PilarEvolucao[] — histórico de evolução
- UNIQUE constraint: (empresaId, pilarId)
```

---

## 3. Regras Implementadas

### 3.1 Criação de Pilar

**R-PIL-001**: Validação de nome
- Nome obrigatório, string, 2-100 caracteres
- Deve ser ÚNICO no sistema
- Se nome já existe → `ConflictException("Já existe um pilar com este nome")`

**R-PIL-002**: Dados obrigatórios
- `nome`: obrigatório
- `ordem`: obrigatório, inteiro, mínimo 1
- Descricao: opcional

**R-PIL-003**: Acesso restrito
- Apenas `ADMINISTRADOR` pode criar pilar
- Requer autenticação JWT + `JwtAuthGuard` + `RolesGuard`

**R-PIL-004**: Auditoria
- `createdBy` registra ID do usuário
- `createdAt` preenchido automaticamente
- `AuditService.log()` chamado com `acao: CREATE`

**R-PIL-005**: Modelo de pilar
- Campo `modelo` permite marcar pilar como template
- Usado para cópia/clonagem em outras empresas
- Não há endpoint de cópia (apenas flag armazenada)

### 3.2 Leitura de Pilar

**R-PIL-006**: Listagem com filtro
- Endpoint `GET /pilares` retorna apenas pilares ativos
- Ordenado por `ordem ASC`
- Inclui contagem de rotinas e empresas associadas

**R-PIL-007**: Acesso de leitura
- Permitido para: ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA
- Requer autenticação JWT

**R-PIL-008**: Busca por ID
- Inclui relacionamentos:
  - `rotinas` (apenas ativas, ordenadas por ordem)
  - `empresas` (com dados da empresa)
- Se não encontrado → `NotFoundException("Pilar não encontrado")`

**R-PIL-009**: Contagem de referências
- Retorna `_count` com totais de:
  - `rotinas`: número de rotinas vinculadas
  - `empresas`: número de empresas que usam este pilar

### 3.3 Atualização de Pilar

**R-PIL-010**: Validação de nome em update
- Se novo nome fornecido, valida unicidade
- Permite nome do próprio pilar (self)
- Se nome duplicado em outro pilar → `ConflictException`

**R-PIL-011**: Campos atualizáveis
- `nome`, `descricao`, `ordem`, `modelo`, `ativo`

**R-PIL-012**: Acesso restrito
- Apenas `ADMINISTRADOR` pode atualizar

**R-PIL-013**: Auditoria
- `updatedBy` registra ID do usuário
- `updatedAt` preenchido automaticamente
- Estado antes e depois registrado

### 3.4 Soft Delete de Pilar

**R-PIL-014**: Validação de dependências
- Verifica se pilar tem rotinas ATIVAS
- Se sim → `ConflictException("Não é possível desativar um pilar que possui rotinas ativas")`
- Permite desativar pilar com rotinas inativas

**R-PIL-015**: Operação de delete
- Apenas marca `ativo: false`
- Não remove registro fisicamente
- Após delete, pilar não aparece em listagem

**R-PIL-016**: Acesso restrito
- Apenas `ADMINISTRADOR` pode deletar

**R-PIL-017**: Auditoria
- Registra como `acao: DELETE` no audit log

### 3.5 Reordenação de Pilares

**R-PIL-018**: Endpoint de reordenação
- `POST /pilares/reordenar` com payload: `{ ordens: [{ id, ordem }, ...] }`
- Atualiza campo `ordem` para cada pilar
- Transação atômica (tudo ou nada)

**R-PIL-019**: Acesso
- Apenas `ADMINISTRADOR`

**R-PIL-020**: Atomicidade
- Usa `prisma.$transaction()` para garantir consistência
- Se falhar, nenhuma atualização é confirmada

**R-PIL-021**: Retorno
- Retorna lista completa de pilares após reordenação

### 3.6 Relacionamento Pilar-Empresa

**R-PIL-022**: Vinculação via tabela join
- Empresa pode ter múltiplos pilares
- Pilar pode estar em múltiplas empresas
- Relacionamento através de `PilarEmpresa`

**R-PIL-023**: Unique constraint
- Não pode haver duplicata de (empresaId, pilarId)
- Garante um-para-um em nível de par

**R-PIL-024**: Soft delete no relacionamento
- `PilarEmpresa.ativo` permite "desvinculação" sem deletar
- Mas usado em tabela join, não na tabela de pilares

---

## 4. Validações

### 4.1 CreatePilarDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| nome | string | IsString(), IsNotEmpty(), Length(2,100) | ✓ |
| descricao | string | IsString(), IsOptional(), Length(0,500) | ✗ |
| ordem | integer | IsInt(), Min(1) | ✓ |

### 4.2 UpdatePilarDto
Mesmos campos que CreatePilarDto (todos opcionais) + `ativo` (IsBoolean, IsOptional).

---

## 5. Comportamentos Condicionais

### 5.1 Fluxo de Criação

```
POST /pilares (requer ADMINISTRADOR)
  ├─ Valida DTO
  ├─ Nome já existe?
  │  └─ Sim → ConflictException
  ├─ Cria no banco
  ├─ Log audit (acao: CREATE)
  └─ Retorna pilar criado
```

### 5.2 Fluxo de Atualização

```
PATCH /pilares/:id (requer ADMINISTRADOR)
  ├─ Pilar existe?
  │  └─ Não → NotFoundException
  ├─ Se novo nome fornecido, valida unicidade
  ├─ Atualiza no banco
  ├─ Log audit (acao: UPDATE)
  └─ Retorna pilar atualizado
```

### 5.3 Fluxo de Delete (Desativação)

```
DELETE /pilares/:id (requer ADMINISTRADOR)
  ├─ Pilar existe?
  │  └─ Não → NotFoundException
  ├─ Conta rotinas ativas
  │  └─ > 0 → ConflictException("...possui rotinas ativas")
  ├─ Marca ativo: false
  ├─ Log audit (acao: DELETE)
  └─ Retorna pilar desativado
```

### 5.4 Fluxo de Reordenação

```
POST /pilares/reordenar (requer ADMINISTRADOR)
  ├─ Para cada { id, ordem }:
  │  └─ UPDATE pilar.ordem = ordem
  ├─ Transação atômica
  ├─ Retorna findAll() (lista completa ordenada)
  └─ (sem log audit individual - melhoria possível)
```

---

## 6. Ausências ou Ambiguidades

### 6.1 Funcionalidades Não Implementadas

⚠️ **Clonagem de pilares**:
- Flag `modelo` existe mas não é usado
- Sem endpoint para clonar pilar modelo em nova empresa
- Sem "Pilar como template"

⚠️ **Gerenciamento de rotinas**:
- Rotinas são criadas via outro módulo (não em PILARES)
- Sem endpoint para criar/editar/deletar rotinas em pilares

⚠️ **Validação de ciclos**:
- Sem proteção contra pilar ser vinculado a si mesmo (na join table)

⚠️ **Audit em reordenação**:
- Reordenação não registra mudanças em auditoria
- Múltiplas atualizações sem tracking

### 6.2 Ambiguidades

⚠️ **Campo modelo**:
- Semântica não clara: é template para cópia? Apenas marcador?
- Como se cria um pilar modelo vs. pilar normal?
- Pode ser atualizado via DTO?

⚠️ **Ordenação vs. Reordenação**:
- Campo `ordem` pode ser atualizado via PATCH
- Ou precisa usar endpoint POST /reordenar?
- Ambos funcionam?

⚠️ **Cascata de soft delete**:
- Se pilar é desativado, rotinas não são desativadas automaticamente
- Apenas `ativo` do pilar muda
- Lógica inconsistente com relacionamento pilar-rotina

⚠️ **Multi-tenant isolation**:
- Pilares são globais (não por empresa)
- GESTOR pode ver todos os pilares?
- Sem validação de isolamento por tenant

---

## 7. Endpoints

| Método | Rota | Autenticação | Roles | Descrição |
|--------|------|--------------|-------|-----------|
| POST | `/pilares` | ✓ | ADMINISTRADOR | Criar novo pilar |
| GET | `/pilares` | ✓ | ADM, CONS, GEST, COLAB, LEIT | Listar pilares ativos |
| GET | `/pilares/:id` | ✓ | ADM, CONS, GEST, COLAB, LEIT | Buscar pilar com rotinas |
| PATCH | `/pilares/:id` | ✓ | ADMINISTRADOR | Atualizar pilar |
| DELETE | `/pilares/:id` | ✓ | ADMINISTRADOR | Soft delete (desativar) |
| POST | `/pilares/reordenar` | ✓ | ADMINISTRADOR | Reordenar múltiplos pilares |

---

## 8. Dependências

- **NestJS** (`@nestjs/common`)
- **Prisma** para ORM
- **AuditService** para logging
- **Módulo ROTINAS** (relacionamento)

---

## Resumo Executivo

✅ **CRUD completo** com validação de unicidade e dependências  
✅ **Soft delete** protegido contra pilares com rotinas ativas  
✅ **Reordenação transacional** para múltiplos pilares  
✅ **Auditoria integrada** de todas as operações  

⚠️ **Não implementado**: Clonagem de pilares, gerenciamento de rotinas  
⚠️ **Gap crítico**: Validação de isolamento multi-tenant não aplicada  
⚠️ **Ambiguidade**: Semântica do campo `modelo` não implementada
