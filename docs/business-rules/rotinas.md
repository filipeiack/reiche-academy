# Regras de Negócio — Módulo ROTINAS

**Data de extração**: 2025-12-21  
**Escopo**: Definição e gerenciamento de rotinas (tarefas) dentro de pilares

---

## 1. Visão Geral

O módulo ROTINAS implementa:
- CRUD de rotinas vinculadas a pilares
- Validação de existência do pilar antes de criar/atualizar
- Ordenação de rotinas por pilar e ordem
- Suporte a soft delete (desativação)
- Reordenação transacional de rotinas dentro de um pilar
- Auditoria de todas as operações

---

## 2. Entidades

### 2.1 Rotina
```
- id: UUID (PK)
- nome: String — nome da rotina
- descricao: String (nullable)
- ordem: Int — posição dentro do pilar
- modelo: Boolean (default: false)
- ativo: Boolean (default: true)
- pilarId: UUID (FK) — referência ao pilar
- pilar: Pilar — relação
- createdAt: DateTime
- updatedAt: DateTime
- createdBy: String (nullable)
- updatedBy: String (nullable)
- rotinaEmpresas: RotinaEmpresa[] — execuções por empresa
```

---

## 3. Regras Implementadas

### 3.1 Criação de Rotina

**R-ROT-001**: Validação de pilar
- Antes de criar, verifica se `pilarId` existe
- Se não existe → `NotFoundException("Pilar não encontrado")`

**R-ROT-002**: Validação de campos
- `nome`: obrigatório, 2-200 caracteres
- `ordem`: obrigatório, inteiro, mínimo 1
- `descricao`: opcional, até 500 caracteres
- `pilarId`: obrigatório, UUID

**R-ROT-003**: Acesso restrito
- Apenas `ADMINISTRADOR` pode criar

**R-ROT-004**: Auditoria
- `createdBy` recebe ID do usuário
- `AuditService.log()` com `acao: CREATE`

### 3.2 Leitura de Rotinas

**R-ROT-005**: Listagem com filtro opcional
- Endpoint `GET /rotinas` retorna apenas rotinas ativas
- Pode filtrar por `pilarId`
- Join com `pilar` para retornar `id, nome, ordem`
- Ordenação: por `pilar.ordem ASC` e `rotina.ordem ASC`

**R-ROT-006**: Busca por ID
- Inclui `pilar` completo
- Se não encontrado → `NotFoundException("Rotina não encontrada")`

### 3.3 Atualização de Rotina

**R-ROT-007**: Validação de pilar em update
- Se `pilarId` presente no DTO, valida que pilar existe
- Se não → `NotFoundException("Pilar não encontrado")`

**R-ROT-008**: Auditoria
- `updatedBy` recebe ID do usuário
- `AuditService.log()` com estado antes/depois

**R-ROT-009**: Acesso restrito
- Apenas `ADMINISTRADOR` pode atualizar

### 3.4 Soft Delete de Rotina

**R-ROT-010**: Desativação
- `DELETE /rotinas/:id` marca `ativo=false`
- Não remove fisicamente

**R-ROT-011**: Auditoria
- Registra `acao: DELETE` com estado antes/depois

**R-ROT-012**: Acesso restrito
- Apenas `ADMINISTRADOR` pode deletar

### 3.5 Reordenação

**R-ROT-013**: Endpoint
- `POST /rotinas/pilar/:pilarId/reordenar` com `{ ordens: [{ id, ordem }] }`

**R-ROT-014**: Validação
- Atualiza apenas rotinas que pertencem ao `pilarId` informado
- Garante consistência: `where: { id, pilarId }`

**R-ROT-015**: Transação
- Usa `prisma.$transaction()` para aplicar todas as mudanças juntas
- Retorna `findAll(pilarId)` após concluir

**R-ROT-016**: Acesso
- Apenas `ADMINISTRADOR`

---

## 4. Validações

### 4.1 CreateRotinaDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| nome | string | IsString(), IsNotEmpty(), Length(2,200) | ✓ |
| descricao | string | IsString(), IsOptional(), Length(0,500) | ✗ |
| ordem | integer | IsInt(), Min(1) | ✓ |
| pilarId | string | IsUUID(), IsNotEmpty() | ✓ |

### 4.2 UpdateRotinaDto
Mesmos campos que CreateRotinaDto (todos opcionais) + `ativo` (IsBoolean, IsOptional).

---

## 5. Comportamentos Condicionais

### 5.1 Fluxo de Criação

```
POST /rotinas (requer ADMINISTRADOR)
  ├─ Valida DTO
  ├─ pilarId existe?
  │  └─ Não → NotFoundException
  ├─ Cria no banco
  ├─ Log audit (CREATE)
  └─ Retorna rotina criada
```

### 5.2 Fluxo de Atualização

```
PATCH /rotinas/:id (requer ADMINISTRADOR)
  ├─ Busca estado anterior
  ├─ Se pilarId no DTO, valida pilar
  ├─ Atualiza no banco
  ├─ Log audit (UPDATE)
  └─ Retorna rotina atualizada
```

### 5.3 Fluxo de Delete (Desativação)

```
DELETE /rotinas/:id (requer ADMINISTRADOR)
  ├─ Busca estado anterior
  ├─ Marca ativo: false
  ├─ Log audit (DELETE)
  └─ Retorna rotina desativada
```

### 5.4 Fluxo de Reordenação

```
POST /rotinas/pilar/:pilarId/reordenar (requer ADMINISTRADOR)
  ├─ Para cada { id, ordem }:
  │  └─ UPDATE rotina SET ordem = ordem WHERE id = id AND pilarId = pilarId
  ├─ Transação atômica
  ├─ Retorna findAll(pilarId)
  └─ (sem audit por rotina - possível melhoria)
```

---

## 6. Ausências ou Ambiguidades

### 6.1 Validações Faltantes

⚠️ **NÃO IMPLEMENTADO**:
1. Unicidade de nome por pilar (rotina.nome único dentro do pilar)
2. Validação de conflitos na reordenação (ordem duplicada)
3. Validação de limites máximos de ordem

### 6.2 Multi-tenant

⚠️ **NÃO IMPLEMENTADO**:
- Rotinas são globais por pilar, sem isolamento por empresa
- Reordenação não valida ownership por tenant

### 6.3 Auditoria

⚠️ **PARCIAL**:
- Criação, atualização e deleção auditadas
- Reordenação não gera audit logs individuais

---

## 7. Endpoints

| Método | Rota | Autenticação | Roles | Descrição |
|--------|------|--------------|-------|-----------|
| POST | `/rotinas` | ✓ | ADMINISTRADOR | Criar rotina |
| GET | `/rotinas` | ✓ | ADM, CONS, GEST, COLAB, LEIT | Listar rotinas |
| GET | `/rotinas/:id` | ✓ | ADM, CONS, GEST, COLAB, LEIT | Buscar rotina |
| PATCH | `/rotinas/:id` | ✓ | ADMINISTRADOR | Atualizar rotina |
| DELETE | `/rotinas/:id` | ✓ | ADMINISTRADOR | Soft delete |
| POST | `/rotinas/pilar/:pilarId/reordenar` | ✓ | ADMINISTRADOR | Reordenar rotinas do pilar |

---

## 8. Dependências

- **NestJS** (`@nestjs/common`)
- **Prisma** para ORM
- **AuditService** para logging
- **Módulo PILARES** (relacionamento)

---

## Resumo Executivo

✅ **CRUD com validações** e auditoria integrada  
✅ **Reordenação transacional** por pilar  

⚠️ **Não implementado**: Unicidade de nome por pilar, isolamento multi-tenant  
⚠️ **Ambiguidade**: Auditoria de reordenação não detalhada
