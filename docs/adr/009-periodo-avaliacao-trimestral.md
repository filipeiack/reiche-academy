# ADR-009: Período de Avaliação Trimestral

**Data:** 2026-01-13  
**Status:** ✅ Aprovado  
**Decisor:** System Engineer + Product Owner  
**Agente:** System Engineer

---

## Contexto

### Requisito do Cliente

O cliente relatou que o sistema atual de evolução de diagnósticos não atende às necessidades de controle trimestral:

**Requisitos identificados:**
1. Períodos de avaliação devem ocorrer **a cada trimestre** (Q1, Q2, Q3, Q4)
2. Intervalo mínimo de **90 dias** entre congelamentos de médias
3. Durante o período de avaliação, usuários lançam/atualizam notas
4. Ao final do período, admin **congela médias** (cria snapshot histórico)
5. Gráfico de evolução mostra **até 4 barras por ano** (1 por trimestre)
6. Frontend deve permitir **filtro por ano** no histórico

### Problema Atual

Estrutura existente em `PilarEvolucao`:

```prisma
model PilarEvolucao {
  id             String @id @default(uuid())
  pilarEmpresaId String
  mediaNotas     Float?
  createdAt      DateTime @default(now())
  // ... sem conceito de período
}
```

**Limitações:**
- ❌ Não há conceito de "período de avaliação"
- ❌ Não há validação de intervalo mínimo (90 dias)
- ❌ Impossível agrupar snapshots por trimestre/ano
- ❌ Sem rastreabilidade de quando período foi aberto/fechado
- ❌ Usuário pode criar snapshots a qualquer momento (sem controle)

---

## Decisão

Criar tabela **`PeriodoAvaliacao`** para gerenciar ciclos trimestrais de avaliação empresarial.

### Estrutura de Dados

```prisma
model Empresa {
  // ... campos existentes
  periodosAvaliacao PeriodoAvaliacao[]
}

model PeriodoAvaliacao {
  id                String   @id @default(uuid())
  
  empresaId         String
  empresa           Empresa  @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  
  // Período que está sendo avaliado
  trimestre         Int      // 1, 2, 3, 4
  ano               Int      // 2026
  dataReferencia    DateTime // Ex: 2026-03-31 (último dia do trimestre)
  
  // Controle do ciclo
  aberto            Boolean  @default(true)  // true = em avaliação, false = congelado
  dataInicio        DateTime @default(now()) // Quando admin iniciou
  dataCongelamento  DateTime? // Quando admin congelou (null se ainda aberto)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String?
  updatedBy         String?
  
  // Relations
  snapshots         PilarEvolucao[]
  
  @@unique([empresaId, trimestre, ano]) // Evita duplicatas
  @@index([empresaId, aberto]) // Buscar período aberto rapidamente
  @@map("periodos_avaliacao")
}

model PilarEvolucao {
  id                  String             @id @default(uuid())
  pilarEmpresaId      String
  pilarEmpresa        PilarEmpresa       @relation(...)
  
  // ✅ NOVO: Vínculo com período (fonte única de verdade)
  periodoAvaliacaoId  String
  periodoAvaliacao    PeriodoAvaliacao   @relation(fields: [periodoAvaliacaoId], references: [id], onDelete: Cascade)
  
  mediaNotas          Float              // 0-10 (sempre preenchido ao criar)
  
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  createdBy           String?
  updatedBy           String?
  
  @@unique([pilarEmpresaId, periodoAvaliacaoId]) // 1 snapshot por pilar por período
  @@index([periodoAvaliacaoId])
  @@map("pilares_evolucao")
}
```

### Fluxo de UX (Cenário Simplificado)

**Opção escolhida:** Cenário 1 - Fluxo de 2 Ações

#### Tela: Diagnóstico Notas

**Estado 1: Sem período aberto**
- Botão "Iniciar Avaliação" → Admin clica
- Modal solicita `dataReferencia` (último dia do trimestre)
- Sistema valida intervalo de 90 dias
- Sistema cria `PeriodoAvaliacao { aberto: true }`
- Botão vira badge "Avaliação Q1/2026 em andamento"

**Estado 2: Com período aberto**
- Badge exibe trimestre/ano e data de início
- Usuários lançam/atualizam notas normalmente
- Notas ficam vinculadas ao período ativo implicitamente

#### Tela: Diagnóstico Evolução

**Estado 1: Sem período aberto**
- Botão "Congelar Médias" desabilitado
- Alert: "Nenhum período de avaliação ativo"

**Estado 2: Com período aberto**
- Botão "Congelar Médias do Q1/2026" habilitado
- Admin clica → Sistema cria snapshots de todos os pilares
- Sistema atualiza `PeriodoAvaliacao { aberto: false, dataCongelamento: now() }`
- Badge desaparece na tela de Diagnóstico Notas
- Botão "Iniciar Avaliação" volta (permite Q2/2026)

---

## Alternativas Consideradas

### Opção A: Guardar Controle na Empresa

```prisma
model Empresa {
  periodoAvaliacaoAberto  Boolean   @default(false)
  trimestreAvaliacao      Int?
  anoAvaliacao            Int?
  dataReferenciaAvaliacao DateTime?
}
```

**Descartado porque:**
- ❌ Campos ficam null após congelamento (perde histórico)
- ❌ Sem rastreabilidade de quando período iniciou/terminou
- ❌ Dificulta auditoria ("quando foi Q1/2025?")
- ❌ Empresa "é" período (semântica ruim) vs "tem" períodos

### Opção B: Fluxo com 3 Estados (aberto → encerrado → congelado)

```prisma
model PeriodoAvaliacao {
  aberto           Boolean
  encerrado        Boolean
  dataEncerramento DateTime?
  dataCongelamento DateTime?
}
```

**Descartado porque:**
- ❌ Mais complexo para UX (usuários não entendem diferença entre "encerrar" e "congelar")
- ❌ Mais cliques sem benefício claro
- ❌ Estado intermediário desnecessário

### Opção C: Controle por Pilar (boolean em PilarEmpresa)

```prisma
model PilarEmpresa {
  periodoAvaliacaoAberto Boolean @default(false)
}
```

**Descartado porque:**
- ❌ Período é empresarial, não por pilar
- ❌ Cada pilar pode ficar em estado diferente (sincronização difícil)
- ❌ Validação de 90 dias ambígua (comparar com qual pilar?)
- ❌ Snapshots podem ser criados em momentos diferentes

---

## Consequências

### Positivas ✅

1. **Histórico Completo**  
   Todos os períodos ficam registrados permanentemente. Possível consultar "quando foi Q1/2025?", "quem congelou?", etc.

2. **Validação Clara**  
   Intervalo de 90 dias validado ao **iniciar** período (não ao congelar). Impede períodos inválidos.

3. **Auditoria Completa**  
   Timestamps precisos: `dataInicio` (quando começou), `dataCongelamento` (quando finalizou).

4. **Relatórios Fáceis**  
   Consultar histórico: `WHERE ano = 2025` → retorna 4 períodos (Q1-Q4).

5. **UX Simples**  
   Apenas 2 ações: "Iniciar Avaliação" e "Congelar Médias". Não confunde usuários.

6. **Semântica Correta**  
   Empresa **tem** períodos de avaliação (coleção), não **é** um estado temporário.

7. **Atomicidade**  
   Congelamento usa transação: todos os snapshots criados juntos ou nenhum.

8. **Fonte Única de Verdade**  
   Trimestre/ano/dataReferencia ficam em `PeriodoAvaliacao`, não duplicados em cada snapshot.

### Negativas ⚠️

1. **Complexidade do Schema**  
   +1 tabela no modelo de dados. Aumenta curva de aprendizado.

2. **Migration Complexa**  
   Dados existentes em `PilarEvolucao` precisam migrar (criar períodos retroativos).

3. **Validação Extra no Frontend**  
   Frontend precisa buscar período aberto antes de habilitar ações.

4. **Dependência de Estado**  
   Sistema depende de admin lembrar de "Iniciar" antes e "Congelar" depois.

### Riscos 🔴

1. **Período Órfão (Admin Esquece de Congelar)**  
   - **Cenário:** Admin inicia Q1/2026 mas esquece de congelar. Período fica aberto indefinidamente.  
   - **Mitigação:** Implementar endpoint DELETE para cancelar período sem criar snapshots.  
   - **Mitigação Futura:** Alert automático se período aberto > 120 dias.

2. **Falha de Transação ao Congelar**  
   - **Cenário:** Erro no meio da criação de snapshots (ex: 5 de 10 pilares criados).  
   - **Mitigação:** Usar `prisma.$transaction` para atomicidade. Rollback automático em caso de erro.

3. **Validação de 90 Dias Bypass**  
   - **Cenário:** Admin muda data de referência para burlar validação.  
   - **Mitigação:** Backend valida baseado em último período **congelado** (não em dataReferencia fornecida).

4. **Conflito de Dados Retroativos**  
   - **Cenário:** Migration falha ao criar períodos para snapshots antigos.  
   - **Mitigação:** Script de rollback incluído na migration. Testar em ambiente de staging antes de produção.

---

## Migração de Dados Existentes

### Estratégia

Snapshots já existentes em `PilarEvolucao` (sem `periodoAvaliacaoId`) precisam ser vinculados a períodos retroativos.

### Script SQL

```sql
-- 1. Criar períodos retroativos baseados em createdAt dos snapshots
INSERT INTO periodos_avaliacao (
  id, 
  empresa_id, 
  trimestre, 
  ano, 
  data_referencia, 
  aberto, 
  data_inicio, 
  data_congelamento, 
  created_at,
  updated_at
)
SELECT DISTINCT ON (pe.empresa_id, EXTRACT(QUARTER FROM pev.created_at), EXTRACT(YEAR FROM pev.created_at))
  gen_random_uuid() AS id,
  pe.empresa_id,
  EXTRACT(QUARTER FROM pev.created_at)::int AS trimestre,
  EXTRACT(YEAR FROM pev.created_at)::int AS ano,
  (DATE_TRUNC('quarter', pev.created_at) + INTERVAL '3 months' - INTERVAL '1 day')::date AS data_referencia,
  false AS aberto, -- Todos os períodos antigos são considerados congelados
  DATE_TRUNC('quarter', pev.created_at)::timestamptz AS data_inicio,
  MAX(pev.created_at) AS data_congelamento, -- Último snapshot do trimestre
  MIN(pev.created_at) AS created_at,
  MAX(pev.created_at) AS updated_at
FROM pilares_evolucao pev
JOIN pilares_empresa pe ON pe.id = pev.pilar_empresa_id
WHERE pev.periodo_avaliacao_id IS NULL -- Apenas snapshots antigos
GROUP BY 
  pe.empresa_id, 
  EXTRACT(QUARTER FROM pev.created_at), 
  EXTRACT(YEAR FROM pev.created_at),
  DATE_TRUNC('quarter', pev.created_at);

-- 2. Vincular snapshots antigos aos períodos criados
UPDATE pilares_evolucao pev
SET periodo_avaliacao_id = (
  SELECT pa.id
  FROM periodos_avaliacao pa
  JOIN pilares_empresa pe ON pe.empresa_id = pa.empresa_id
  WHERE pev.pilar_empresa_id = pe.id
    AND pa.trimestre = EXTRACT(QUARTER FROM pev.created_at)::int
    AND pa.ano = EXTRACT(YEAR FROM pev.created_at)::int
  LIMIT 1
)
WHERE pev.periodo_avaliacao_id IS NULL;

-- 3. Verificar integridade (não deve retornar registros)
SELECT * FROM pilares_evolucao WHERE periodo_avaliacao_id IS NULL;
```

### Rollback

```sql
-- Reverter migração
DELETE FROM periodos_avaliacao 
WHERE created_by IS NULL; -- Períodos criados pela migration

UPDATE pilares_evolucao 
SET periodo_avaliacao_id = NULL;
```

---

## Endpoints Backend (Especificação)

### 1. POST `/empresas/:empresaId/periodos-avaliacao`

**Descrição:** Criar novo período de avaliação trimestral.

**Autenticação:** ADMINISTRADOR, CONSULTOR, GESTOR

**Body:**
```json
{
  "dataReferencia": "2026-03-31" // ISO 8601 (último dia do trimestre)
}
```

**Validações:**
- `dataReferencia` obrigatória
- Deve ser último dia de trimestre (31/03, 30/06, 30/09, 31/12)
- Empresa não pode ter período aberto
- Intervalo mínimo de 90 dias desde último período congelado

**Lógica:**
```typescript
// 1. Calcular trimestre/ano a partir da data
const trimestre = getQuarter(dataReferencia); // 1-4
const ano = getYear(dataReferencia);

// 2. Validar período aberto
const periodoAberto = await prisma.periodoAvaliacao.findFirst({
  where: { empresaId, aberto: true }
});
if (periodoAberto) throw BadRequestException('Já existe período aberto');

// 3. Validar intervalo 90 dias
const ultimoPeriodo = await prisma.periodoAvaliacao.findFirst({
  where: { empresaId },
  orderBy: { dataReferencia: 'desc' }
});
if (ultimoPeriodo) {
  const diffDays = differenceInDays(dataReferencia, ultimoPeriodo.dataReferencia);
  if (diffDays < 90) throw BadRequestException('Intervalo mínimo de 90 dias');
}

// 4. Criar período
const periodo = await prisma.periodoAvaliacao.create({
  data: {
    empresaId,
    trimestre,
    ano,
    dataReferencia,
    aberto: true,
    createdBy: userId
  }
});

// 5. Auditar
await auditService.log({
  entidade: 'PeriodoAvaliacao',
  entidadeId: periodo.id,
  acao: 'CREATE',
  dadosDepois: { trimestre, ano, dataReferencia }
});

return periodo;
```

**Response 201:**
```json
{
  "id": "uuid",
  "empresaId": "uuid",
  "trimestre": 1,
  "ano": 2026,
  "dataReferencia": "2026-03-31",
  "aberto": true,
  "dataInicio": "2026-01-15T10:00:00Z",
  "dataCongelamento": null,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

---

### 2. POST `/periodos-avaliacao/:periodoId/congelar`

**Descrição:** Congelar médias do período (criar snapshots + fechar).

**Autenticação:** ADMINISTRADOR, CONSULTOR, GESTOR

**Validações:**
- Período deve estar aberto (`aberto === true`)
- Empresa deve ter pilares ativos

**Lógica:**
```typescript
// 1. Buscar período com empresa e pilares
const periodo = await prisma.periodoAvaliacao.findUnique({
  where: { id: periodoId },
  include: {
    empresa: {
      include: {
        pilares: {
          where: { ativo: true },
          include: {
            rotinasEmpresa: {
              where: { ativo: true },
              include: {
                notas: {
                  orderBy: { createdAt: 'desc' },
                  take: 1
                }
              }
            }
          }
        }
      }
    }
  }
});

if (!periodo.aberto) throw BadRequestException('Período já está congelado');

// 2. Transação atômica
return prisma.$transaction(async (tx) => {
  // Criar snapshots de todos os pilares
  const snapshots = await Promise.all(
    periodo.empresa.pilares.map(pilar => {
      const media = calcularMediaPilar(pilar); // Lógica de cálculo
      
      return tx.pilarEvolucao.create({
        data: {
          pilarEmpresaId: pilar.id,
          periodoAvaliacaoId: periodo.id,
          mediaNotas: media,
          createdBy: userId
        }
      });
    })
  );
  
  // Fechar período
  const periodoAtualizado = await tx.periodoAvaliacao.update({
    where: { id: periodoId },
    data: {
      aberto: false,
      dataCongelamento: new Date(),
      updatedBy: userId
    }
  });
  
  // Auditar
  await auditService.log({
    entidade: 'PeriodoAvaliacao',
    entidadeId: periodoId,
    acao: 'UPDATE',
    dadosAntes: { aberto: true },
    dadosDepois: { 
      aberto: false, 
      dataCongelamento: periodoAtualizado.dataCongelamento,
      snapshotsCriados: snapshots.length 
    }
  });
  
  return { periodo: periodoAtualizado, snapshots };
});
```

**Response 200:**
```json
{
  "message": "Médias congeladas com sucesso",
  "periodo": { /* ... */ },
  "snapshots": [
    { "id": "uuid", "pilarEmpresaId": "uuid", "mediaNotas": 7.5 },
    // ...
  ]
}
```

---

### 3. GET `/empresas/:empresaId/periodos-avaliacao/atual`

**Descrição:** Buscar período aberto (se existir).

**Autenticação:** Todos os perfis

**Response 200 (com período aberto):**
```json
{
  "id": "uuid",
  "trimestre": 1,
  "ano": 2026,
  "dataReferencia": "2026-03-31",
  "aberto": true,
  "dataInicio": "2026-01-15T10:00:00Z"
}
```

**Response 200 (sem período aberto):**
```json
null
```

---

### 4. GET `/empresas/:empresaId/periodos-avaliacao`

**Descrição:** Listar histórico de períodos congelados.

**Autenticação:** Todos os perfis

**Query Params:**
- `ano` (opcional): Filtrar por ano (ex: `?ano=2025`)

**Response 200:**
```json
[
  {
    "id": "uuid",
    "trimestre": 1,
    "ano": 2025,
    "dataReferencia": "2025-03-31",
    "aberto": false,
    "dataInicio": "2025-01-10T08:00:00Z",
    "dataCongelamento": "2025-04-05T15:30:00Z",
    "snapshots": [
      { "pilarEmpresaId": "uuid", "mediaNotas": 7.2 },
      // ...
    ]
  },
  // ... Q2, Q3, Q4
]
```

---

## Ajustes Frontend (Especificação)

### Diagnóstico Notas Component

**Arquivo:** `frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts`

#### Novo Estado
```typescript
periodoAtual: PeriodoAvaliacao | null = null;
```

#### Novo Método (OnInit)
```typescript
async loadPeriodoAtual(): Promise<void> {
  if (!this.selectedEmpresaId) return;
  
  this.periodoAtual = await firstValueFrom(
    this.diagnosticoService.getPeriodoAtual(this.selectedEmpresaId)
  );
}
```

#### Novo Método (Modal)
```typescript
abrirModalIniciarAvaliacao(): void {
  // Abrir modal com date picker
  // Validar data (último dia de trimestre)
  // Chamar POST /empresas/:id/periodos-avaliacao
  // Recarregar periodoAtual
}
```

#### Template
```html
<!-- Badge: Período em andamento -->
<div *ngIf="periodoAtual" class="alert alert-info">
  <i class="bi bi-info-circle"></i>
  <strong>Avaliação Q{{ periodoAtual.trimestre }}/{{ periodoAtual.ano }} em andamento</strong>
  <small class="d-block">Iniciada em: {{ periodoAtual.dataInicio | date:'dd/MM/yyyy HH:mm' }}</small>
</div>

<!-- Botão: Iniciar Avaliação -->
<button 
  *ngIf="!periodoAtual" 
  class="btn btn-primary" 
  (click)="abrirModalIniciarAvaliacao()">
  <i class="bi bi-play-circle"></i> Iniciar Avaliação
</button>
```

---

### Diagnóstico Evolução Component

**Arquivo:** `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts`

#### Novo Estado
```typescript
periodoAtual: PeriodoAvaliacao | null = null;
anoFiltro: number = new Date().getFullYear();
```

#### Modificar `loadAllHistorico()`
```typescript
private async loadAllHistorico(): Promise<void> {
  // 1. Buscar período atual
  this.periodoAtual = await firstValueFrom(
    this.diagnosticoService.getPeriodoAtual(this.selectedEmpresaId!)
  );
  
  // 2. Buscar histórico de períodos congelados (filtrado por ano)
  const periodos = await firstValueFrom(
    this.diagnosticoService.getHistoricoPeriodos(this.selectedEmpresaId!, this.anoFiltro)
  );
  
  // 3. Mapear para formato do gráfico
  this.historico = periodos.map(p => ({
    trimestre: p.trimestre,
    ano: p.ano,
    dataReferencia: p.dataReferencia,
    snapshots: p.snapshots
  }));
  
  this.renderBarChart();
}
```

#### Novo Método
```typescript
congelarMedias(): void {
  if (!this.periodoAtual) return;
  
  Swal.fire({
    title: `Congelar Médias do Q${this.periodoAtual.trimestre}/${this.periodoAtual.ano}?`,
    html: `Esta ação criará snapshots de ${this.medias.length} pilares e finalizará o período.`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, congelar'
  }).then(result => {
    if (result.isConfirmed && this.periodoAtual) {
      this.diagnosticoService.congelarMedias(this.periodoAtual.id).subscribe({
        next: (response) => {
          Swal.fire('Sucesso!', response.message, 'success');
          this.loadAllHistorico();
        },
        error: (err) => Swal.fire('Erro', err.error.message, 'error')
      });
    }
  });
}
```

#### Template
```html
<!-- Alert: Período ativo -->
<div *ngIf="periodoAtual" class="alert alert-success">
  <strong>Período Q{{ periodoAtual.trimestre }}/{{ periodoAtual.ano }} ativo</strong>
</div>

<!-- Botão: Congelar Médias -->
<button 
  class="btn btn-primary btn-lg" 
  [disabled]="!periodoAtual"
  (click)="congelarMedias()">
  <i class="bi bi-archive"></i> Congelar Médias
</button>

<!-- Filtro: Ano -->
<select [(ngModel)]="anoFiltro" (change)="loadAllHistorico()">
  <option [value]="2025">2025</option>
  <option [value]="2026">2026</option>
  <!-- Gerar dinamicamente anos disponíveis -->
</select>
```

---

## Regras de Negócio

### R-PEVOL-001: Validação de Intervalo Mínimo

**Descrição:** Intervalo mínimo de 90 dias entre períodos de avaliação.

**Implementação:** Backend valida ao criar `PeriodoAvaliacao`.

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts`

---

### R-PEVOL-002: Unicidade de Período

**Descrição:** Empresa não pode ter 2 períodos para mesmo trimestre/ano.

**Implementação:** Constraint `@@unique([empresaId, trimestre, ano])`

---

### R-PEVOL-003: Atomicidade ao Congelar

**Descrição:** Snapshots devem ser criados em transação atômica.

**Implementação:** `prisma.$transaction` ao congelar.

---

## Próximos Passos

1. **Dev Agent:** Implementar schema + migration
2. **Dev Agent:** Criar módulo backend `PeriodosAvaliacaoModule`
3. **Dev Agent:** Implementar endpoints
4. **Dev Agent:** Ajustar frontend (ambas telas)
5. **QA Agent:** Testar fluxo completo
6. **Tech Writer:** Atualizar `/docs/business-rules/periodo-avaliacao.md`

---

## Referências

- [Schema Prisma](../../backend/prisma/schema.prisma)
- [Diagnóstico Notas Component](../../frontend/src/app/views/pages/diagnostico-notas/)
- [Diagnóstico Evolução Component](../../frontend/src/app/views/pages/diagnostico-evolucao/)
- [FLOW.md](../FLOW.md)

---

**Versão:** 1.0  
**Aprovado por:** System Engineer  
**Data de Aprovação:** 2026-01-13
