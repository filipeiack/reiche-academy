# Regras de Negócio — Módulo DIAGNÓSTICOS

**Data de extração**: 2025-12-21  
**Escopo**: Execução de rotinas por empresa, notas e evolução de pilares, agenda de reuniões

---

## 1. Visão Geral

O módulo DIAGNÓSTICOS implementa:
- Execução de rotinas por empresa (`RotinaEmpresa`) a partir de vínculos `PilarEmpresa`
- Atribuição de notas e criticidade às rotinas (`NotaRotina`)
- Cálculo/armazenamento de evolução por pilar (`PilarEvolucao`)
- Agenda de reuniões dos usuários (`AgendaReuniao`)

Observação: O módulo expõe apenas DTOs e o schema Prisma. Os controllers/services específicos não estão presentes no workspace, então as regras mapeadas refletem o que está implementado em DTOs e banco.

---

## 2. Entidades

### 2.1 RotinaEmpresa
```
- id: UUID (PK)
- pilarEmpresaId: UUID (FK) — vínculo empresa-pilar
- pilarEmpresa: PilarEmpresa — relação (cascade on delete)
- rotinaId: UUID (FK) — referência à rotina
- rotina: Rotina — relação
- observacao: String (nullable)
- createdAt, updatedAt
- createdBy, updatedBy (nullable)
- notas: NotaRotina[] — notas associadas
- Unique: (pilarEmpresaId, rotinaId)
- Índices: pilarEmpresaId, rotinaId
```

### 2.2 NotaRotina
```
- id: UUID (PK)
- rotinaEmpresaId: UUID (FK) — referência à execução de rotina
- rotinaEmpresa: RotinaEmpresa — relação (cascade on delete)
- nota: Float (0-10, opcional)
- criticidade: Criticidade (ENUM: ALTO, MEDIO, BAIXO, opcional)
- createdAt, updatedAt
- createdBy, updatedBy (nullable)
- Índice: rotinaEmpresaId
```

### 2.3 PilarEvolucao
```
- id: UUID (PK)
- pilarEmpresaId: UUID (FK)
- pilarEmpresa: PilarEmpresa — relação (cascade on delete)
- mediaNotas: Float (0-10, opcional)
- createdAt, updatedAt
- createdBy, updatedBy (nullable)
```

### 2.4 AgendaReuniao
```
- id: UUID (PK)
- titulo: String
- descricao: String (nullable)
- dataHora: DateTime
- duracao: Int (nullable) — em minutos
- local: String (nullable)
- link: String (nullable)
- usuarioId: UUID (FK)
- usuario: Usuario — relação
- createdAt, updatedAt
- createdBy, updatedBy (nullable)
- Índice: usuarioId
```

---

## 3. Regras Implementadas

### 3.1 Execução de Rotina (RotinaEmpresa)

**R-DIAG-001**: Criação de execução
- `pilarEmpresaId`: obrigatório, UUID
- `rotinaId`: obrigatório, UUID
- `observacao`: opcional, 0-1000 caracteres
- Não pode existir duplicata de (`pilarEmpresaId`, `rotinaId`) — enforced por UNIQUE

**R-DIAG-002**: Atualização
- Mesmos campos da criação, todos opcionais

**R-DIAG-003**: Integridade referencial
- Se `PilarEmpresa` é deletado, `RotinaEmpresa` é apagado (cascade)
- Se `Rotina` é deletada, relação é removida (sem cascade explícito)

### 3.2 Notas de Rotina (NotaRotina)

**R-DIAG-004**: Criação de nota
- `rotinaEmpresaId`: obrigatório, UUID
- `nota`: opcional, número entre 0 e 10
- `criticidade`: opcional, enum { ALTO, MEDIO, BAIXO }

**R-DIAG-005**: Atualização de nota
- Mesmos campos da criação, todos opcionais

**R-DIAG-006**: Integridade
- Notas vinculadas a `RotinaEmpresa` são apagadas em cascata se a execução for removida

### 3.3 Evolução por Pilar (PilarEvolucao)

**R-DIAG-007**: Criação
- `pilarEmpresaId`: obrigatório, UUID
- `mediaNotas`: opcional, número entre 0 e 10

**R-DIAG-008**: Atualização
- Mesmos campos da criação, todos opcionais

**R-DIAG-009**: Integridade
- Evolução é apagada em cascata se `PilarEmpresa` for removido

### 3.4 Agenda de Reuniões

**R-DIAG-010**: Estrutura de agenda
- Campos obrigatórios: `titulo`, `dataHora`, `usuarioId`
- Campos opcionais: `descricao`, `duracao`, `local`, `link`

**R-DIAG-011**: Integridade
- FK para `Usuario` (sem cascade explícito)

---

## 4. Validações

### 4.1 CreateRotinaEmpresaDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| pilarEmpresaId | string | IsUUID(), IsNotEmpty() | ✓ |
| rotinaId | string | IsUUID(), IsNotEmpty() | ✓ |
| observacao | string | IsString(), IsOptional(), Length(0,1000) | ✗ |

### 4.2 CreateNotaRotinaDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| rotinaEmpresaId | string | IsUUID(), IsNotEmpty() | ✓ |
| nota | number | IsNumber(), Min(0), Max(10), IsOptional() | ✗ |
| criticidade | enum | IsEnum(Criticidade), IsOptional() | ✗ |

### 4.3 CreatePilarEvolucaoDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| pilarEmpresaId | string | IsUUID(), IsNotEmpty() | ✓ |
| mediaNotas | number | IsNumber(), Min(0), Max(10), IsOptional() | ✗ |

### 4.4 CreateAgendaReuniaoDto
Campos não presentes no workspace (apenas classe definida); com base no schema, esperados: `titulo`, `dataHora`, `usuarioId` como obrigatórios.

---

## 5. Comportamentos Condicionais

### 5.1 Execução de Rotina

```
POST /diagnosticos/rotinas-empresa
  ├─ Valida DTO (pilarEmpresaId, rotinaId)
  ├─ UNIQUE (pilarEmpresaId, rotinaId) garante não duplicar
  ├─ Cria execução
  └─ Retorna execução
```

### 5.2 Atribuição de Nota

```
POST /diagnosticos/notas
  ├─ Valida rotinaEmpresaId
  ├─ Valida nota (0-10) e criticidade (ENUM)
  ├─ Cria nota
  └─ Retorna nota
```

### 5.3 Evolução do Pilar

```
POST /diagnosticos/evolucoes
  ├─ Valida pilarEmpresaId
  ├─ Calcula/atribui mediaNotas (opcional)
  ├─ Cria evolução
  └─ Retorna evolução
```

### 5.4 Agenda de Reuniões

```
POST /diagnosticos/agenda
  ├─ Valida titulo, dataHora, usuarioId
  ├─ Cria reunião
  └─ Retorna registro da agenda
```

---

## 6. Ausências ou Ambiguidades

### 6.1 Falta de Controllers/Services

⚠️ **NÃO IMPLEMENTADO NO WORKSPACE**:
- Controllers e Services do módulo não estão presentes
- As regras acima refletem DTOs e constraints do banco

### 6.2 Políticas de Negócio

⚠️ **NÃO DEFINIDO**:
- Cálculo automático de `mediaNotas`
- Regras de quem pode lançar nota (perfil)
- Regras de quem pode criar rotinas-empresa
- Regras de quem pode criar agenda de reuniões

### 6.3 Multi-tenant

⚠️ **NÃO ESPECIFICADO**:
- Todas entidades dependem de `PilarEmpresa` ou `Usuario`
- Isolamento por empresa deve ser garantido nos controllers (não disponíveis)

---

## 7. Endpoints

Não disponíveis no workspace. As operações esperadas dependem da implementação futura.

---

## 8. Dependências

- **Prisma** para ORM
- **NestJS** (DTOs)
- **Módulos**: PILARES, EMPRESAS, USUÁRIOS (relações)

---

## Resumo Executivo

✅ **Modelos e DTOs** para execuções, notas e evolução  
✅ **Constraints** garantem unicidade e integridade  

⚠️ **Não implementado**: Controllers/Services, regras de acesso, cálculos automáticos  
⚠️ **Ambiguidades**: Políticas de multi-tenant e perfis
