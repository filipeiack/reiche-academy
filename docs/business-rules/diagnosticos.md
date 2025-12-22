# Regras de Negócio — Diagnosticos

**Módulo:** Diagnosticos  
**Backend:** `backend/src/modules/diagnosticos/`  
**Frontend:** Não implementado  
**Última extração:** 22/12/2024  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Diagnosticos é responsável por:
- **Gerenciar estruturas de dados** para diagnóstico empresarial
- **DTOs definidos** para validação de entrada
- **Sem implementação de lógica de negócio** (apenas definições de estrutura)

**Entidades principais:**
- PilarEmpresa (vinculação empresa-pilar)
- RotinaEmpresa (vinculação empresa-rotina via pilar)
- NotaRotina (avaliação de rotinas)
- PilarEvolucao (evolução histórica de pilares)
- AgendaReuniao (agendamento de reuniões)

**Endpoints implementados:**
- ❌ NENHUM (módulo sem controller ou service)

**Status do módulo:** 🚧 **STUB** (apenas estrutura, sem implementação)

---

## 2. Visão Geral do Status

⚠️ **IMPORTANTE:** Este módulo possui **APENAS DTOs** definidos.

**Arquivos existentes:**
- ✅ `diagnosticos.module.ts` (módulo vazio)
- ✅ DTOs de criação e atualização (5 entidades)
- ❌ **NÃO existe** `diagnosticos.service.ts`
- ❌ **NÃO existe** `diagnosticos.controller.ts`

**Implicações:**
- DTOs estão prontos para validação
- Nenhuma lógica de negócio implementada
- Nenhum endpoint disponível
- Estruturas existem no Prisma schema
- Módulo planejado mas não implementado

---

## 3. Entidades (Definidas no Schema)

### 3.1. PilarEmpresa

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
- `rotinasEmpresa`: RotinaEmpresa[] (rotinas vinculadas)
- `evolucao`: PilarEvolucao[] (histórico de evolução)

**Índices:**
- `[empresaId, pilarId]` (unique)

**Observação:** Já mencionado em empresas.md e pilares.md, mas sem implementação CRUD.

---

### 3.2. RotinaEmpresa

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| pilarEmpresaId | String | FK para PilarEmpresa |
| rotinaId | String | FK para Rotina |
| observacao | String? | Observação customizada da empresa |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizado |

**Relações:**
- `pilarEmpresa`: PilarEmpresa (vínculo pilar-empresa)
- `rotina`: Rotina (rotina template)
- `notas`: NotaRotina[] (avaliações da rotina)

**Índices:**
- `[pilarEmpresaId, rotinaId]` (unique)

**Observação:** Permite vinculação de rotinas específicas a empresas via pilar.

---

### 3.3. NotaRotina

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| rotinaEmpresaId | String | FK para RotinaEmpresa |
| nota | Float? | Avaliação de 0 a 10 |
| criticidade | Criticidade? | Nível de criticidade (ALTO, MEDIO, BAIXO) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Enum Criticidade:**
- ALTO
- MEDIO
- BAIXO

**Relações:**
- `rotinaEmpresa`: RotinaEmpresa (rotina avaliada)

**Índices:**
- `[rotinaEmpresaId]`

**Observação:** Permite múltiplas avaliações de uma mesma rotina (histórico de evolução).

---

### 3.4. PilarEvolucao

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| pilarEmpresaId | String | FK para PilarEmpresa |
| mediaNotas | Float? | Média das notas das rotinas do pilar (0-10) |
| createdAt | DateTime | Data de criação (snapshot temporal) |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `pilarEmpresa`: PilarEmpresa (pilar avaliado)

**Observação:** Permite rastrear evolução histórica da avaliação de um pilar ao longo do tempo.

---

### 3.5. AgendaReuniao

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| titulo | String | Título da reunião |
| descricao | String? | Descrição detalhada |
| dataHora | DateTime | Data e hora da reunião |
| duracao | Int? | Duração em minutos |
| local | String? | Local físico da reunião |
| link | String? | Link para reunião online |
| usuarioId | String | FK para Usuario (organizador) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |

**Relações:**
- `usuario`: Usuario (organizador da reunião)

**Índices:**
- `[usuarioId]`

**Observação:** Agenda de reuniões relacionadas ao processo de diagnóstico.

---

## 4. DTOs Implementados

### 4.1. CreatePilarEmpresaDto

**Campos:**
- `empresaId`: @IsUUID(), @IsNotEmpty()
- `pilarId`: @IsUUID(), @IsNotEmpty()

**Validações:**
- Ambos os campos obrigatórios
- Devem ser UUIDs válidos

**Arquivo:** [create-pilar-empresa.dto.ts](../../backend/src/modules/diagnosticos/dto/create-pilar-empresa.dto.ts)

---

### 4.2. CreateRotinaEmpresaDto

**Campos:**
- `pilarEmpresaId`: @IsUUID(), @IsNotEmpty()
- `rotinaId`: @IsUUID(), @IsNotEmpty()
- `observacao`: @IsString(), @IsOptional(), @Length(0, 1000)

**Validações:**
- IDs obrigatórios e devem ser UUIDs válidos
- Observação opcional, máximo 1000 caracteres

**Arquivo:** [create-rotina-empresa.dto.ts](../../backend/src/modules/diagnosticos/dto/create-rotina-empresa.dto.ts)

---

### 4.3. CreateNotaRotinaDto

**Campos:**
- `rotinaEmpresaId`: @IsUUID(), @IsNotEmpty()
- `nota`: @IsNumber(), @IsOptional(), @Min(0), @Max(10)
- `criticidade`: @IsEnum(Criticidade), @IsOptional()

**Validações:**
- rotinaEmpresaId obrigatório e UUID válido
- Nota opcional, entre 0 e 10
- Criticidade opcional, valores: ALTO, MEDIO, BAIXO

**Enum local:**
```typescript
enum Criticidade {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAIXO = 'BAIXO',
}
```

**Arquivo:** [create-nota-rotina.dto.ts](../../backend/src/modules/diagnosticos/dto/create-nota-rotina.dto.ts)

---

### 4.4. CreatePilarEvolucaoDto

**Campos:**
- `pilarEmpresaId`: @IsUUID(), @IsNotEmpty()
- `mediaNotas`: @IsNumber(), @IsOptional(), @Min(0), @Max(10)

**Validações:**
- pilarEmpresaId obrigatório e UUID válido
- mediaNotas opcional, entre 0 e 10

**Arquivo:** [create-pilar-evolucao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-pilar-evolucao.dto.ts)

---

### 4.5. CreateAgendaReuniaoDto

**Campos:**
- `titulo`: @IsString(), @IsNotEmpty(), @Length(2, 200)
- `descricao`: @IsString(), @IsOptional(), @Length(0, 1000)
- `dataHora`: @IsDateString(), @IsNotEmpty()
- `duracao`: @IsInt(), @IsOptional(), @Min(1)
- `local`: @IsString(), @IsOptional(), @Length(0, 200)
- `link`: @IsUrl(), @IsOptional()
- `usuarioId`: @IsUUID(), @IsNotEmpty()

**Validações:**
- Título obrigatório, 2-200 caracteres
- Descrição opcional, máximo 1000 caracteres
- dataHora obrigatória, deve ser ISO 8601 válido
- Duração opcional, mínimo 1 minuto
- Local opcional, máximo 200 caracteres
- Link opcional, deve ser URL válida
- usuarioId obrigatório e UUID válido

**Arquivo:** [create-agenda-reuniao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-agenda-reuniao.dto.ts)

---

### 4.6. DTOs de Update

Todos os DTOs de update usam `PartialType`:

- `UpdatePilarEmpresaDto`
- `UpdateRotinaEmpresaDto`
- `UpdateNotaRotinaDto`
- `UpdatePilarEvolucaoDto`
- `UpdateAgendaReuniaoDto`

**Comportamento:**
- Todos os campos tornam-se opcionais
- Mantêm as mesmas validações quando fornecidos

---

## 5. Regras Implementadas

⚠️ **NENHUMA REGRA IMPLEMENTADA**

**Motivo:** Módulo não possui service ou controller.

**DTOs prontos para:**
- ✅ Validação de entrada
- ✅ Documentação Swagger
- ❌ Sem lógica de negócio

---

## 6. Validações

### 6.1. Validações de DTO Prontas

**Prontas mas não usadas:**
- ✅ Validação de UUIDs
- ✅ Validação de ranges (nota 0-10)
- ✅ Validação de enum (criticidade)
- ✅ Validação de datas (ISO 8601)
- ✅ Validação de URLs
- ✅ Validação de comprimento de strings

**Sem validação de lógica de negócio:**
- ❌ Validação de existência de empresaId/pilarId
- ❌ Validação de unicidade [empresaId, pilarId]
- ❌ Validação de existência de pilarEmpresaId/rotinaId
- ❌ Validação de múltiplas notas para mesma rotinaEmpresa
- ❌ Validação de reunião no passado

---

## 7. Comportamentos Condicionais

⚠️ **NENHUM COMPORTAMENTO IMPLEMENTADO**

**Comportamentos esperados (não implementados):**
- Soft delete em PilarEmpresa
- Histórico de NotaRotina
- Cálculo automático de mediaNotas em PilarEvolucao
- Validação de conflito de horários em AgendaReuniao

---

## 8. Ausências ou Ambiguidades

### 8.1. Módulo Não Implementado

**Status:** 🚧 **CRÍTICO**

**Descrição:**
- Módulo possui apenas DTOs
- Nenhum service ou controller
- Entidades existem no schema mas não são gerenciadas

**Impacto:**
- Empresas não podem vincular pilares
- Rotinas não podem ser avaliadas
- Evolução não é rastreada
- Reuniões não podem ser agendadas

**TODO:**
- Implementar DiagnosticosService
- Implementar DiagnosticosController
- Implementar endpoints CRUD para todas as entidades
- Adicionar auditoria

---

### 8.2. Vinculação de Pilares a Empresas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- PilarEmpresa existe no schema
- DTO pronto
- Sem endpoint para vincular

**Endpoints esperados:**
```
POST /empresas/:empresaId/pilares
GET /empresas/:empresaId/pilares
DELETE /empresas/:empresaId/pilares/:pilarId
```

**TODO:**
- Implementar vinculação de pilares
- Validar existência de empresa e pilar
- Validar unicidade [empresaId, pilarId]
- Auditar vinculação

---

### 8.3. Vinculação de Rotinas a Empresas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- RotinaEmpresa existe no schema
- DTO pronto (com observação customizável)
- Sem endpoint para vincular

**Endpoints esperados:**
```
POST /empresas/:empresaId/pilares/:pilarId/rotinas
GET /empresas/:empresaId/pilares/:pilarId/rotinas
PATCH /empresas/:empresaId/rotinas/:rotinaId
DELETE /empresas/:empresaId/rotinas/:rotinaId
```

**TODO:**
- Implementar vinculação de rotinas via pilar
- Validar existência de PilarEmpresa e Rotina
- Permitir observações customizadas
- Validar unicidade [pilarEmpresaId, rotinaId]

---

### 8.4. Avaliação de Rotinas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- NotaRotina existe no schema
- DTO pronto (nota + criticidade)
- Sem endpoint para avaliar

**Endpoints esperados:**
```
POST /empresas/:empresaId/rotinas/:rotinaId/notas
GET /empresas/:empresaId/rotinas/:rotinaId/notas (histórico)
PATCH /notas/:notaId
```

**Comportamento esperado:**
- Múltiplas notas por rotina (histórico)
- Cálculo de média automático
- Atualização de PilarEvolucao

**TODO:**
- Implementar criação de notas
- Implementar histórico de avaliações
- Implementar cálculo de média por pilar
- Atualizar PilarEvolucao automaticamente

---

### 8.5. Evolução de Pilares

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- PilarEvolucao existe no schema
- DTO pronto
- Sem endpoint para consultar evolução

**Endpoints esperados:**
```
GET /empresas/:empresaId/pilares/:pilarId/evolucao
POST /empresas/:empresaId/pilares/:pilarId/evolucao (snapshot manual?)
```

**Comportamento esperado:**
- Snapshots temporais de média de notas
- Histórico de evolução ao longo do tempo
- Gráficos de evolução

**Dúvidas:**
- Snapshot é manual ou automático?
- Quando criar novo registro de evolução?
- Como calcular mediaNotas (agregação de NotaRotina)?

**TODO:**
- Definir estratégia de snapshot (manual vs automático)
- Implementar cálculo de mediaNotas
- Implementar consulta de histórico

---

### 8.6. Agenda de Reuniões

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- AgendaReuniao existe no schema
- DTO pronto
- Sem endpoint para agendar

**Endpoints esperados:**
```
POST /reunioes
GET /reunioes (filtrar por usuário/data)
GET /reunioes/:id
PATCH /reunioes/:id
DELETE /reunioes/:id
```

**Comportamento esperado:**
- CRUD completo de reuniões
- Filtro por usuário (minhas reuniões)
- Filtro por data (próximas reuniões)
- Validação de conflito de horários (?)

**TODO:**
- Implementar CRUD de reuniões
- Adicionar filtros (usuário, data)
- Validar reunião no futuro
- Considerar notificações/lembretes

---

### 8.7. Multi-Tenancy em Diagnósticos

**Status:** ⚠️ NÃO IMPLEMENTADO

**Descrição:**
- PilarEmpresa vincula a empresaId
- Mas sem validação de acesso por usuário

**Comportamento esperado:**
- Usuário só acessa diagnósticos da própria empresa
- ADMINISTRADOR acessa todas as empresas
- GESTOR acessa apenas sua empresa

**TODO:**
- Implementar isolamento por empresaId
- Validar acesso em todos os endpoints
- Usar guard de multi-tenancy

---

### 8.8. Cálculo Automático de Média

**Status:** ⚠️ NÃO DEFINIDO

**Descrição:**
- PilarEvolucao.mediaNotas é opcional
- Não documenta se é calculado ou manual

**Estratégias possíveis:**
1. Calculado automaticamente ao criar NotaRotina
2. Calculado em query (não armazenado)
3. Calculado manualmente via endpoint

**TODO:**
- Definir estratégia de cálculo
- Implementar lógica de agregação
- Documentar comportamento

---

### 8.9. Histórico vs Estado Atual

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- NotaRotina permite múltiplos registros
- Não documenta qual é a "nota atual"

**Estratégias possíveis:**
1. Última nota criada é a atual
2. Média de todas as notas
3. Flag `atual: boolean` (apenas uma por vez)

**TODO:**
- Definir conceito de "nota atual"
- Implementar lógica de consulta
- Documentar comportamento

---

### 8.10. Relação AgendaReuniao com Diagnóstico

**Status:** ⚠️ SEM RELAÇÃO

**Descrição:**
- AgendaReuniao não referencia empresa ou diagnóstico
- Apenas usuarioId
- Não documenta propósito da reunião

**Comportamento atual:**
- Agenda genérica de reuniões
- Sem vínculo com processo de diagnóstico

**TODO:**
- Adicionar campo empresaId (?)
- Adicionar campo tipo (diagnóstico, follow-up, etc)
- Ou mover para módulo separado (não é específico de diagnóstico)

---

### 8.11. Enum Criticidade Duplicado

**Status:** ⚠️ DUPLICAÇÃO

**Descrição:**
- Enum Criticidade definido no schema.prisma
- Enum Criticidade redefinido em create-nota-rotina.dto.ts
- Duplicação de código

**TODO:**
- Usar enum do Prisma gerado
- Remover definição duplicada no DTO
- Centralizar enums

---

## 9. Sumário de Status

| Componente | Status | Descrição |
|------------|--------|-----------|
| **Module** | 🟡 Definido | Módulo vazio sem providers |
| **Service** | ❌ Ausente | Não existe |
| **Controller** | ❌ Ausente | Não existe |
| **DTOs** | ✅ Completos | 5 create + 5 update |
| **Entidades** | ✅ Schema | Definidas no Prisma |
| **Endpoints** | ❌ Nenhum | Zero implementados |
| **Lógica de Negócio** | ❌ Nenhuma | Módulo stub |
| **Auditoria** | ❌ Não implementada | Sem service |
| **Multi-tenancy** | ❌ Não implementado | Sem validação |

---

## 10. Roadmap Sugerido

### 10.1. Fase 1: Vinculação de Pilares

**Prioridade:** ALTA

**Implementar:**
1. Service para PilarEmpresa
2. Endpoints POST/GET/DELETE
3. Validação de existência empresa/pilar
4. Validação de unicidade
5. Auditoria
6. Multi-tenancy

---

### 10.2. Fase 2: Vinculação de Rotinas

**Prioridade:** ALTA

**Implementar:**
1. Service para RotinaEmpresa
2. Endpoints POST/GET/PATCH/DELETE
3. Validação de existência PilarEmpresa/Rotina
4. Observações customizadas
5. Auditoria

---

### 10.3. Fase 3: Avaliação de Rotinas

**Prioridade:** MÉDIA

**Implementar:**
1. Service para NotaRotina
2. Endpoints POST/GET (histórico)/PATCH
3. Validação de nota (0-10)
4. Cálculo de média
5. Atualização de PilarEvolucao

---

### 10.4. Fase 4: Evolução de Pilares

**Prioridade:** MÉDIA

**Implementar:**
1. Service para PilarEvolucao
2. Endpoint GET (histórico temporal)
3. Estratégia de snapshot (definir)
4. Cálculo de mediaNotas
5. Gráficos de evolução (frontend)

---

### 10.5. Fase 5: Agenda de Reuniões

**Prioridade:** BAIXA

**Implementar:**
1. Service para AgendaReuniao
2. CRUD completo
3. Filtros (usuário, data)
4. Validação de conflitos (?)
5. Notificações (?)

---

## 11. Dependências Externas

### 11.1. Dependências de Outros Módulos

**Para implementar Diagnosticos, é necessário:**
- ✅ Empresas (empresaId)
- ✅ Pilares (pilarId)
- ✅ Rotinas (rotinaId)
- ✅ Usuarios (usuarioId)
- ✅ Audit (auditoria)

**Todos os módulos dependentes JÁ estão implementados.**

---

### 11.2. Validações Necessárias

**Ao criar PilarEmpresa:**
```typescript
const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
if (!empresa) throw new NotFoundException('Empresa não encontrada');

const pilar = await prisma.pilar.findUnique({ where: { id: pilarId } });
if (!pilar) throw new NotFoundException('Pilar não encontrado');

const existing = await prisma.pilarEmpresa.findUnique({
  where: { empresaId_pilarId: { empresaId, pilarId } }
});
if (existing) throw new ConflictException('Pilar já vinculado');
```

**Ao criar RotinaEmpresa:**
```typescript
const pilarEmpresa = await prisma.pilarEmpresa.findUnique({ where: { id: pilarEmpresaId } });
if (!pilarEmpresa) throw new NotFoundException('PilarEmpresa não encontrado');

const rotina = await prisma.rotina.findUnique({ where: { id: rotinaId } });
if (!rotina) throw new NotFoundException('Rotina não encontrada');

// Validar que rotina pertence ao pilar
if (rotina.pilarId !== pilarEmpresa.pilarId) {
  throw new ConflictException('Rotina não pertence ao pilar');
}
```

---

## 12. Referências

**Arquivos existentes:**
- [diagnosticos.module.ts](../../backend/src/modules/diagnosticos/diagnosticos.module.ts) (vazio)
- [create-pilar-empresa.dto.ts](../../backend/src/modules/diagnosticos/dto/create-pilar-empresa.dto.ts)
- [create-rotina-empresa.dto.ts](../../backend/src/modules/diagnosticos/dto/create-rotina-empresa.dto.ts)
- [create-nota-rotina.dto.ts](../../backend/src/modules/diagnosticos/dto/create-nota-rotina.dto.ts)
- [create-pilar-evolucao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-pilar-evolucao.dto.ts)
- [create-agenda-reuniao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-agenda-reuniao.dto.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (PilarEmpresa, RotinaEmpresa, NotaRotina, PilarEvolucao, AgendaReuniao)

**Arquivos ausentes:**
- ❌ diagnosticos.service.ts
- ❌ diagnosticos.controller.ts

**Módulos relacionados:**
- Empresas (vinculação)
- Pilares (vinculação)
- Rotinas (avaliação)
- Usuarios (agenda)
- Audit (auditoria futura)

---

## 13. Fluxo Esperado (Não Implementado)

### 13.1. Processo de Diagnóstico Completo

```
1. ADMINISTRADOR cria empresa (módulo Empresas)
2. ADMINISTRADOR vincula pilares à empresa (Diagnosticos)
   → POST /empresas/:empresaId/pilares { pilarId }
   
3. ADMINISTRADOR/GESTOR vincula rotinas aos pilares (Diagnosticos)
   → POST /empresas/:empresaId/pilares/:pilarId/rotinas { rotinaId }
   
4. GESTOR/COLABORADOR avalia rotinas (Diagnosticos)
   → POST /empresas/:empresaId/rotinas/:rotinaId/notas { nota, criticidade }
   
5. Sistema calcula média automaticamente (Diagnosticos)
   → PilarEvolucao.mediaNotas atualizado
   
6. GESTOR agenda reunião para apresentação (Diagnosticos)
   → POST /reunioes { titulo, dataHora, ... }
   
7. GESTOR/COLABORADOR consulta evolução (Diagnosticos)
   → GET /empresas/:empresaId/pilares/:pilarId/evolucao
```

---

**Observação final:**  
Este documento reflete APENAS os DTOs DEFINIDOS.  
**Módulo Diagnosticos NÃO possui implementação.**  
Estruturas estão prontas no schema e validações nos DTOs.  
**Crítico:** Service e Controller precisam ser implementados.  
**Roadmap:** Implementar em 5 fases (pilares → rotinas → notas → evolução → reuniões).
