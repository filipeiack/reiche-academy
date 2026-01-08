# Pattern Enforcement Report — Snapshot Pattern (Pilares & Rotinas)

**Data:** 2026-01-08  
**Agente:** Pattern Enforcer  
**Contexto:** Validação de implementação do Snapshot Pattern conforme docs normativos

---

## Escopo

**Área:** Backend (NestJS + Prisma)

**Arquivos analisados:**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260108144705_snapshot_pattern_pilares_rotinas/migration.sql`
- `backend/src/modules/pilares-empresa/dto/create-pilar-empresa.dto.ts`
- `backend/src/modules/pilares-empresa/dto/update-pilar-empresa.dto.ts`
- `backend/src/modules/rotinas/dto/create-rotina-empresa.dto.ts`
- `backend/src/modules/rotinas/dto/update-rotina-empresa.dto.ts`
- `backend/src/modules/rotinas/dto/create-rotina.dto.ts`
- `backend/src/modules/pilares-empresa/pilares-empresa.service.ts`
- `backend/src/modules/pilares-empresa/pilares-empresa.controller.ts`

---

## ✅ Conformidades

### 1. Schema Prisma — Snapshot Pattern
- **[✔] Campos snapshot adicionados corretamente**
  - PilarEmpresa: `pilarTemplateId`, `nome`, `descricao` (conforme docs/business-rules/pilares-empresa.md seção 2.1)
  - RotinaEmpresa: `rotinaTemplateId`, `nome`, `descricao` (conforme docs/business-rules/rotinas.md seção 2.2)
  - Referência: docs/business-rules/pilares.md#snapshot-pattern

- **[✔] Campo `modelo` removido**
  - Removido de Pilar e Rotina conforme especificação
  - Referência: docs/business-rules/pilares.md seção 1.1

- **[✔] Constraints atualizadas**
  - PilarEmpresa: `@@unique([empresaId, nome])` ✅
  - RotinaEmpresa: `@@unique([pilarEmpresaId, nome])` ✅
  - Referência: docs/business-rules/pilares-empresa.md seção 2.1

- **[✔] Foreign keys nullable corretas**
  - `pilarTemplateId` e `rotinaTemplateId` com `onDelete: SetNull` ✅
  - Permite snapshots customizados (templateId = null)
  - Referência: docs/business-rules/pilares.md#snapshot-pattern

### 2. Migration SQL — Estratégia 4 Etapas
- **[✔] Estrutura de 4 etapas implementada**
  - Etapa 1: Preparação do schema ✅
  - Etapa 2: Migração de dados ✅
  - Etapa 3: Atualização de constraints ✅
  - Etapa 4: Ordem obrigatória ✅
  - Referência: docs/business-rules/pilares.md seção 1.1

- **[✔] Preservação de dados existentes**
  - Copia nome/descricao de templates para instâncias ✅
  - Usa templateId como referência histórica ✅
  - Referência: docs/business-rules/pilares.md seção 1.1 "Preservar dados históricos"

### 3. DTOs — Validação XOR
- **[✔] XOR validation implementada**
  - `@ValidateIf((o) => !o.pilarTemplateId)` em CreatePilarEmpresaDto ✅
  - `@ValidateIf((o) => !o.rotinaTemplateId)` em CreateRotinaEmpresaDto ✅
  - Referência: docs/business-rules/pilares-empresa.md seção 4.1

- **[✔] Class-validator decorators**
  - `@IsOptional()`, `@IsUUID()`, `@IsNotEmpty()`, `@Length()`, `@MaxLength()` ✅
  - Mensagens de erro customizadas ✅
  - Referência: docs/conventions/backend.md seção 4

- **[✔] Nomenclatura de DTOs**
  - `CreatePilarEmpresaDto`, `UpdatePilarEmpresaDto` (PascalCase + Dto) ✅
  - Arquivos: `create-pilar-empresa.dto.ts` (kebab-case) ✅
  - Referência: docs/conventions/naming.md seção 2

### 4. Services — Lógica de Negócio
- **[✔] Multi-tenant validation**
  - `this.validateTenantAccess(empresaId, user)` em todos métodos ✅
  - Referência: docs/conventions/backend.md seção 3

- **[✔] Validações antes de mutação**
  - Nome único por scope (ConflictException) ✅
  - Template existence check (NotFoundException) ✅
  - Rotinas count validation antes de delete ✅
  - Referência: docs/conventions/backend.md seção 3

- **[✔] Auto-increment ordem**
  - `MAX(ordem) + 1` pattern implementado ✅
  - Referência: docs/business-rules/pilares-empresa.md seção R-PILEMP-001

- **[✔] Auditoria completa**
  - Hard delete com cascade audit ✅
  - Log de pilares e rotinas deletadas em cascata ✅
  - `usuarioId`, `usuarioNome`, `usuarioEmail`, `entidade`, `acao` ✅
  - Referência: docs/business-rules/pilares-empresa.md seção R-PILEMP-006

- **[✔] Exception handling padrão**
  - `NotFoundException`, `ConflictException`, `ForbiddenException` ✅
  - Referência: docs/conventions/backend.md seção 3

- **[✔] Naming conventions**
  - Métodos: `createPilarEmpresa()`, `deletePilarEmpresa()` (camelCase) ✅
  - Referência: docs/conventions/naming.md seção 2

### 5. Regras de Negócio Implementadas
- **[✔] R-PILEMP-001: Criar de template**
  - XOR logic, copia nome/descricao do template ✅
  - Referência: docs/business-rules/pilares-empresa.md seção R-PILEMP-001

- **[✔] R-PILEMP-002: Criar customizado**
  - Nome obrigatório quando pilarTemplateId=null ✅
  - Referência: docs/business-rules/pilares-empresa.md seção R-PILEMP-002

- **[✔] R-PILEMP-006: Deletar com validação**
  - Valida ausência de rotinas, ConflictException se existirem ✅
  - Hard delete com cascade audit ✅
  - Referência: docs/business-rules/pilares-empresa.md seção R-PILEMP-006

- **[✔] R-ROTEMP-001: Criar snapshot de rotina**
  - XOR logic, copia nome/descricao do template ✅
  - Nome único no pilar ✅
  - Referência: docs/business-rules/rotinas.md seção R-ROTEMP-001

- **[✔] R-ROTEMP-004: Deletar rotina**
  - Hard delete com auditoria ✅
  - Referência: docs/business-rules/rotinas.md seção R-ROTEMP-004

---

## ❌ Violações

### VIOLAÇÃO 1: Drift Arquitetural — Métodos Obsoletos Não Removidos
**Gravidade:** ALTA

**Descrição:** Métodos `vincularPilares()` e `autoAssociarRotinasModelo()` ainda usam estrutura antiga (campo `modelo` boolean, relações `pilarId`/`rotinaId`).

**Regra violada:**  
- docs/conventions/backend.md seção 3 (consistência entre schema e código)
- docs/business-rules/pilares.md seção 1.1 (remoção de campo `modelo`)

**Local do código:**
- `backend/src/modules/pilares-empresa/pilares-empresa.service.ts:126-228` (vincularPilares)
- `backend/src/modules/pilares-empresa/pilares-empresa.service.ts:229-298` (autoAssociarRotinasModelo)

**Evidências:**
```typescript
// Linha 240-246: Busca rotinas com modelo=true (campo removido do schema)
rotinas: {
  where: {
    modelo: true,  // ❌ Campo não existe mais
    ativo: true,
  },
},

// Linha 266: Usa rotinaId (campo renomeado para rotinaTemplateId)
rotinaId: rotina.id,  // ❌ Campo não existe mais
```

**Impacto:**
- CRÍTICO: Código compilará com erro após `npx prisma generate`
- Migration executada quebrará esses métodos
- Testes dependentes (`*.spec.ts`) também falharão

**Correção esperada:**
- **OPÇÃO A (Remover):** Deletar `vincularPilares()` e `autoAssociarRotinasModelo()` se não forem mais necessários
- **OPÇÃO B (Refatorar):** Adaptar para Snapshot Pattern (usar `rotinaTemplateId`, remover filtro `modelo: true`)

---

### VIOLAÇÃO 2: Controllers Não Atualizados
**Gravidade:** ALTA

**Descrição:** Novos métodos de service (`createPilarEmpresa`, `deletePilarEmpresa`, `createRotinaEmpresa`, `deleteRotinaEmpresa`) não possuem endpoints correspondentes no controller.

**Regra violada:**  
- docs/conventions/backend.md seção 2 (Controllers devem expor métodos de service)
- docs/FLOW.md seção 2 (implementação completa de features)

**Local do código:**
- `backend/src/modules/pilares-empresa/pilares-empresa.controller.ts` (endpoints ausentes)

**Endpoints esperados (não implementados):**
```typescript
// Ausente: POST /empresas/:empresaId/pilares
@Post()
create(@Param('empresaId') empresaId: string, @Body() dto: CreatePilarEmpresaDto) {
  return this.service.createPilarEmpresa(empresaId, dto, req.user);
}

// Ausente: DELETE /empresas/:empresaId/pilares/:pilarEmpresaId
@Delete(':pilarEmpresaId')
remove(@Param('empresaId') empresaId: string, @Param('pilarEmpresaId') id: string) {
  return this.service.deletePilarEmpresa(empresaId, id, req.user);
}

// Ausente: POST /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas já existe, mas usa vincularRotina (antigo)
// Precisa ser atualizado para usar createRotinaEmpresa

// Ausente: DELETE /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas/:rotinaEmpresaId
@Delete(':pilarEmpresaId/rotinas/:rotinaEmpresaId')
removeRotina(...) {
  return this.service.deleteRotinaEmpresa(empresaId, rotinaEmpresaId, req.user);
}
```

**Impacto:**
- CRÍTICO: Snapshot Pattern implementado mas não exposto via HTTP
- Impossível criar pilares/rotinas via API com nova arquitetura
- Frontend não pode usar novas funcionalidades

**Correção esperada:**
- Adicionar 4 endpoints ao controller
- Atualizar endpoint existente `POST :pilarEmpresaId/rotinas` para usar `createRotinaEmpresa` (atualmente usa `vincularRotina`)

---

### VIOLAÇÃO 3: DTOs Ausentes de Swagger Decorators
**Gravidade:** BAIXA

**Descrição:** DTOs novos não possuem decorators `@ApiProperty` para documentação Swagger.

**Regra violada:**  
- docs/conventions/backend.md seção 4 (DTOs devem ter `@ApiProperty` com examples)

**Local do código:**
- `backend/src/modules/pilares-empresa/dto/create-pilar-empresa.dto.ts`
- `backend/src/modules/pilares-empresa/dto/update-pilar-empresa.dto.ts`
- `backend/src/modules/rotinas/dto/create-rotina-empresa.dto.ts`
- `backend/src/modules/rotinas/dto/update-rotina-empresa.dto.ts`

**Exemplo esperado:**
```typescript
export class CreatePilarEmpresaDto {
  @ApiPropertyOptional({ example: 'uuid-do-pilar-template' })  // ❌ Ausente
  @IsOptional()
  @IsUUID('4')
  pilarTemplateId?: string;

  @ApiPropertyOptional({ example: 'Gestão Financeira' })  // ❌ Ausente
  @ValidateIf((o) => !o.pilarTemplateId)
  @IsNotEmpty()
  nome?: string;
}
```

**Impacto:**
- BAIXO: Swagger gerado sem exemplos/documentação
- Desenvolvedor frontend precisa adivinhar estrutura dos payloads

**Correção esperada:**
- Adicionar `@ApiProperty()` e `@ApiPropertyOptional()` com examples a todos campos

---

### VIOLAÇÃO 4: Imports Não Utilizados
**Gravidade:** BAIXA

**Descrição:** Service importa DTOs que não usa diretamente (CreateRotinaEmpresaDto, UpdateRotinaEmpresaDto).

**Regra violada:**  
- docs/conventions/backend.md seção 3 (imports limpos, apenas necessários)

**Local do código:**
- `backend/src/modules/pilares-empresa/pilares-empresa.service.ts:5-8`

```typescript
import { CreateRotinaEmpresaDto } from '../rotinas/dto/create-rotina-empresa.dto';  // ✅ Usado em createRotinaEmpresa
import { UpdateRotinaEmpresaDto } from '../rotinas/dto/update-rotina-empresa.dto';  // ❌ Não usado
```

**Impacto:**
- MÍNIMO: Apenas poluição de imports

**Correção esperada:**
- Remover import de `UpdateRotinaEmpresaDto` (não usado)

---

## ⚠️ Ambiguidades

### 1. Método `remover()` e `deletePilarEmpresa()` — Duplicação?

**Descrição:** Existe método `remover()` (linha ~300) e novo `deletePilarEmpresa()` (linha ~770). Ambos fazem hard delete de PilarEmpresa.

**Análise:**
- `remover()` parece ser implementação anterior
- `deletePilarEmpresa()` implementa R-PILEMP-006 com validação de rotinas
- **Possível conflito:** Dois métodos para mesma operação

**Recomendação:**
- Verificar se `remover()` deve ser **substituído** por `deletePilarEmpresa()`
- Ou se `remover()` é usado em outro contexto (reordenação, inativação)
- **Decisão humana necessária:** manter ambos ou consolidar?

---

### 2. Ordem de Execução da Migration

**Descrição:** Migration não foi executada conforme handoff. Schema atualizado mas banco ainda tem estrutura antiga.

**Análise:**
- Migration criada: ✅
- Migration aplicada: ❌ (conforme handoff)
- Risco: testes podem falhar se rodarem contra banco desatualizado

**Recomendação:**
- Executar `cd backend && npx prisma migrate dev` antes de testes
- Pattern Enforcer não valida estado do banco (fora de escopo)

---

## 📊 Conclusão

### Status Geral: **NÃO CONFORME**

**Justificativa:**
Apesar de 90% da implementação estar correta e aderente aos padrões, existem **2 violações críticas**:

1. **Drift arquitetural** — Métodos obsoletos (`vincularPilares`, `autoAssociarRotinasModelo`) usam schema antigo e quebrarão após migration
2. **Controllers incompletos** — Snapshot Pattern implementado mas não exposto via HTTP API

**Violações ALTAS impedem:**
- ✗ Execução da aplicação após migration (erro de compilação Prisma)
- ✗ Uso da API (endpoints ausentes)
- ✗ Testes E2E (endpoints não criados)

**Violações BAIXAS (não bloqueantes):**
- Swagger sem documentação (violação 3)
- Imports desnecessários (violação 4)

---

## 🔧 Ações Necessárias (DEV Agent)

### CRÍTICO (Bloqueia fluxo):
1. **Refatorar ou remover** `vincularPilares()` e `autoAssociarRotinasModelo()`
2. **Adicionar 4 endpoints** ao controller:
   - `POST /empresas/:empresaId/pilares` → createPilarEmpresa
   - `DELETE /empresas/:empresaId/pilares/:pilarEmpresaId` → deletePilarEmpresa
   - Atualizar `POST :pilarEmpresaId/rotinas` → usar createRotinaEmpresa
   - `DELETE :pilarEmpresaId/rotinas/:rotinaEmpresaId` → deleteRotinaEmpresa

### RECOMENDADO (Melhorias):
3. Adicionar `@ApiProperty` aos DTOs novos
4. Remover import não usado de `UpdateRotinaEmpresaDto`
5. Decidir sobre duplicação `remover()` vs `deletePilarEmpresa()`

---

## 🎯 Próximo Passo

**❌ BLOQUEADO** — Fluxo não pode prosseguir para QA Unitário Estrito.

**Ação obrigatória:**  
→ **Retornar para DEV Agent** corrigir violações 1 e 2 (ALTAS)

**Após correções:**  
→ **Pattern Enforcer** validar novamente  
→ Se CONFORME: **QA Unitário Estrito** criar testes

---

**Assinatura:** Pattern Enforcer - Conforme `/.github/agents/4-Pattern_Enforcer.md`
