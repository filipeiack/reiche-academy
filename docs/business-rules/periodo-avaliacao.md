# Regras de Negócio — Período de Avaliação

**Módulo:** Períodos de Avaliação  
**Backend:** `backend/src/modules/periodos-avaliacao/`  
**Frontend:** `frontend/src/app/views/pages/diagnostico-notas/` e `diagnostico-evolucao/`  
**Última atualização:** 2026-01-14  
**Agente:** Dev Agent (implementação) + Business Rules Extractor (documentação)  

---

## 1. Visão Geral

O módulo Períodos de Avaliação é responsável por:
- **Gerenciar ciclos trimestrais** de avaliação empresarial
- **Calcular trimestre automaticamente** baseado na data de referência escolhida
- **Validar intervalo mínimo** de 90 dias entre datas de referência
- **Criar snapshots históricos** de médias de pilares ao congelar período
- **Rastrear abertura e fechamento** de períodos com auditoria completa
- **Permitir filtro por ano** no histórico de evolução

**Entidade principal:**
- PeriodoAvaliacao (ciclo trimestral com controle de abertura/fechamento)

**Entidades relacionadas:**
- **PilarEvolucao** → Snapshots de médias vinculados a períodos
- **Empresa** → Dona dos períodos de avaliação
- **PilarEmpresa** → Pilares que têm médias calculadas

**Integração:**
- Períodos controlam QUANDO snapshots são criados
- Snapshots sempre pertencem a um período específico
- Histórico agrupado por trimestre/ano

**Endpoints implementados:**
- `POST /empresas/:id/periodos-avaliacao` — Criar novo período
- `POST /periodos-avaliacao/:id/congelar` — Congelar médias (criar snapshots)
- `GET /empresas/:id/periodos-avaliacao/atual` — Buscar período aberto
- `GET /empresas/:id/periodos-avaliacao` — Listar histórico

**Status do módulo:** ✅ **IMPLEMENTADO** (v1.1.0 - Data de referência flexível)

---

## 2. Arquitetura do Módulo

### 2.1. Backend

**Arquivos principais:**
- `periodos-avaliacao.service.ts` — Lógica de negócio
- `periodos-avaliacao.controller.ts` — Endpoints REST
- `periodos-avaliacao.module.ts` — Módulo NestJS
- DTOs de validação (create-periodo-avaliacao.dto.ts)

**Integrações:**
- PrismaService — Acesso ao banco de dados
- AuditService — Registro de operações CREATE/UPDATE
- date-fns — Validações de data (trimestre, intervalo, etc)

### 2.2. Frontend

**Arquivos principais:**
- `diagnostico-notas.component.ts` — Botão "Iniciar Avaliação" + Badge
- `diagnostico-evolucao.component.ts` — Botão "Congelar Médias" + Filtro de Ano
- `periodos-avaliacao.service.ts` — Service Angular

**Funcionalidades:**
- Badge exibindo período ativo (Q1/2026, Q2/2026, etc)
- Modal de criação de período (date picker - aceita qualquer data)
- Cálculo automático de trimestre pelo backend
- Confirmação antes de congelar (SweetAlert2)
- Filtro de ano no histórico de evolução (opcional, mostra todos se vazio)
- Gráfico exibindo mês/ano da dataReferencia real (ex: 01/2026, 05/2026)

---

## 3. Entidades

### 3.1. PeriodoAvaliacao

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| empresaId | String | FK para Empresa |
| trimestre | Int | 1, 2, 3 ou 4 |
| ano | Int | Ano do período (ex: 2026) |
| dataReferencia | DateTime | Data de referência do período (qualquer data, trimestre calculado automaticamente) |
| aberto | Boolean | true = em avaliação, false = congelado |
| dataInicio | DateTime | Quando admin iniciou o período |
| dataCongelamento | DateTime? | Quando admin congelou (null se ainda aberto) |
| createdAt | DateTime | Data de criação do registro |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `empresa`: Empresa (dona do período)
- `snapshots`: PilarEvolucao[] (snapshots criados ao congelar)

**Índices:**
- `[empresaId, aberto]` — Buscar período aberto rapidamente
- `@@unique([empresaId, trimestre, ano])` — Evita duplicatas

**Comportamento:**
- Sistema permite apenas 1 período aberto por empresa
- Ao congelar, sistema cria snapshots de todos os pilares ativos
- Períodos congelados não podem ser reabertos
- Histórico completo de todos os períodos fica registrado

---

### 3.2. PilarEvolucao (Modificado)

**Alteração:** Adicionado campo `periodoAvaliacaoId` (obrigatório)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| periodoAvaliacaoId | String | FK para PeriodoAvaliacao |
| periodoAvaliacao | PeriodoAvaliacao | Período ao qual este snapshot pertence |

**Constraint:**
- `@@unique([pilarEmpresaId, periodoAvaliacaoId])` — 1 snapshot por pilar por período

**Comportamento:**
- Snapshots agora SEMPRE pertencem a um período
- Não é possível criar snapshot sem período ativo
- Ao deletar período, snapshots são deletados em cascata (onDelete: Cascade)

---

## 4. Regras Implementadas

### R-PEVOL-001: Criar Novo Período de Avaliação

**Descrição:** Admin cria novo período trimestral fornecendo data de referência (qualquer data).

**Implementação:**
- **Endpoint:** `POST /empresas/:id/periodos-avaliacao` (ADMINISTRADOR, CONSULTOR, GESTOR)
- **Método:** `PeriodosAvaliacaoService.create()`

**Validações:**

1. **Multi-Tenant:**
```typescript
if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
  throw new ForbiddenException('Você não pode acessar dados de outra empresa');
}
```

2. **Data de Referência Obrigatória:**
```typescript
@IsDateString()
@IsNotEmpty({ message: 'Data de referência é obrigatória' })
dataReferencia: string;
```

3. **Cálculo Automático de Trimestre:**
```typescript
const dataRef = new Date(dto.dataReferencia);
const trimestre = getQuarter(dataRef); // jan-mar=1, abr-jun=2, jul-set=3, out-dez=4
const ano = getYear(dataRef);
```

4. **Período Único Aberto:**
```typescript
const periodoAberto = await prisma.periodoAvaliacao.findFirst({
  where: { empresaId, aberto: true },
});
if (periodoAberto) {
  throw new BadRequestException('Já existe período aberto');
}
```

5. **Intervalo Mínimo de 90 Dias:**
```typescript
const ultimoPeriodo = await prisma.periodoAvaliacao.findFirst({
  where: { empresaId },
  orderBy: { dataReferencia: 'desc' },
});

if (ultimoPeriodo) {
  const diffDays = differenceInDays(dataRef, ultimoPeriodo.dataReferencia);
  if (diffDays < 90) {
    throw new BadRequestException(
      `Intervalo mínimo de 90 dias não respeitado. Último período: ${format(
        ultimoPeriodo.dataReferencia,
        'dd/MM/yyyy',
      )}. Faltam ${90 - diffDays} dias.`
    );
  }
}
```

**Observação:** Intervalo calculado entre as `dataReferencia` escolhidas (não trimestres fixos).

**Lógica de Criação:**
```typescript
const trimestre = getQuarter(dataRef); // 1-4 (calculado automaticamente)
const ano = getYear(dataRef);

const periodo = await prisma.periodoAvaliacao.create({
  data: {
    empresaId,
    trimestre,
    ano,
    dataReferencia: dataRef,
    aberto: true,
    createdBy: userId,
  },
});
```

**Auditoria:**
```typescript
await auditService.log({
  entidade: 'PeriodoAvaliacao',
  entidadeId: periodo.id,
  acao: 'CREATE',
  dadosDepois: { trimestre, ano, dataReferencia }
});
```

**Retorno:**
```json
{
  "id": "uuid",
  "empresaId": "uuid",
  "trimestre": 1,
  "ano": 2026,
  "dataReferencia": "2026-03-31",
  "aberto": true,
  "dataInicio": "2026-01-15T10:00:00Z",
  "dataCongelamento": null
}
```

**Perfis autorizados:** ADMINISTRADOR, CONSULTOR, GESTOR

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts` (método `create`)

---

### R-PEVOL-002: Congelar Médias do Período

**Descrição:** Admin congela período ativo, criando snapshots de todos os pilares e fechando o período.

**Implementação:**
- **Endpoint:** `POST /periodos-avaliacao/:id/congelar` (ADMINISTRADOR, CONSULTOR, GESTOR)
- **Método:** `PeriodosAvaliacaoService.congelar()`

**Validações:**

1. **Período Existe:**
```typescript
const periodo = await prisma.periodoAvaliacao.findUnique({
  where: { id: periodoId },
  include: { empresa: { include: { pilares: { /* ... */ } } } }
});
if (!periodo) throw new NotFoundException('Período não encontrado');
```

2. **Multi-Tenant:**
```typescript
if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== periodo.empresaId) {
  throw new ForbiddenException('Você não pode acessar dados de outra empresa');
}
```

3. **Período Deve Estar Aberto:**
```typescript
if (!periodo.aberto) {
  throw new BadRequestException('Período já está congelado');
}
```

**Lógica de Congelamento (Transação Atômica):**
```typescript
return prisma.$transaction(async (tx) => {
  // 1. Criar snapshots de todos os pilares ativos
  const snapshots = await Promise.all(
    periodo.empresa.pilares
      .filter(p => p.ativo)
      .map(pilar => {
        const media = calcularMediaPilar(pilar);
        
        return tx.pilarEvolucao.create({
          data: {
            pilarEmpresaId: pilar.id,
            periodoAvaliacaoId: periodo.id,
            mediaNotas: media,
            createdBy: userId,
          },
        });
      })
  );
  
  // 2. Fechar período
  const periodoAtualizado = await tx.periodoAvaliacao.update({
    where: { id: periodoId },
    data: {
      aberto: false,
      dataCongelamento: new Date(),
      updatedBy: userId,
    },
  });
  
  return { periodo: periodoAtualizado, snapshots };
});
```

**Cálculo de Média (Helper):**
```typescript
private calcularMediaPilar(pilar: any): number {
  const rotinasComNota = pilar.rotinasEmpresa.filter(
    (rotina) => rotina.notas.length > 0 && rotina.notas[0].nota !== null,
  );

  if (rotinasComNota.length === 0) return 0;

  const somaNotas = rotinasComNota.reduce(
    (acc, rotina) => acc + rotina.notas[0].nota,
    0,
  );

  return somaNotas / rotinasComNota.length;
}
```

**Auditoria:**
```typescript
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
```

**Retorno:**
```json
{
  "message": "Médias congeladas com sucesso",
  "periodo": { /* ... */ },
  "snapshots": [
    { "id": "uuid", "pilarEmpresaId": "uuid", "mediaNotas": 7.5 },
    { "id": "uuid", "pilarEmpresaId": "uuid", "mediaNotas": 8.2 }
  ]
}
```

**Perfis autorizados:** ADMINISTRADOR, CONSULTOR, GESTOR

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts` (método `congelar`)

---

### R-PEVOL-003: Validação com Período de Mentoria

**Descrição:** Trimestres devem ser criados dentro do período de mentoria ativo.

**Implementação:**
- **Endpoint:** `POST /empresas/:id/periodos-avaliacao`
- **Método:** `PeriodosAvaliacaoService.create()`

**Validações adicionais:**

1. **Buscar período de mentoria ativo:**
```typescript
const periodoMentoria = await this.prisma.periodoMentoria.findFirst({
  where: {
    empresaId,
    ativo: true,
  },
});

if (!periodoMentoria) {
  throw new BadRequestException(
    'Empresa não possui período de mentoria ativo'
  );
}
```

2. **Validar dataReferencia dentro do período:**
```typescript
const dataReferencia = new Date(dto.dataReferencia);

if (
  dataReferencia < periodoMentoria.dataInicio ||
  dataReferencia > periodoMentoria.dataFim
) {
  throw new BadRequestException(
    `Data de referência (${format(dataReferencia, 'dd/MM/yyyy')}) deve estar dentro do período de mentoria ativo (${format(periodoMentoria.dataInicio, 'dd/MM/yyyy')} - ${format(periodoMentoria.dataFim, 'dd/MM/yyyy')})`
  );
}
```

3. **Vincular período ao período de mentoria:**
```typescript
const periodo = await this.prisma.periodoAvaliacao.create({
  data: {
    empresaId,
    trimestre,
    ano,
    dataReferencia,
    periodoMentoriaId: periodoMentoria.id, // ✅ VÍNCULO
    aberto: true,
    dataInicio: new Date(),
    createdBy: user.id,
  },
});
```

**Arquivos afetados:**
- `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts`
- `backend/prisma/schema.prisma` (campo `periodoMentoriaId`)

**Ref:** ADR-007 (Período de Mentoria de 1 Ano) | [periodo-mentoria.md](periodo-mentoria.md)

---

### R-PEVOL-004: Buscar Período Aberto

**Descrição:** Retorna período ativo da empresa (se existir).

**Implementação:**
- **Endpoint:** `GET /empresas/:id/periodos-avaliacao/atual` (Todos os perfis)
- **Método:** `PeriodosAvaliacaoService.findAtual()`

**Validação Multi-Tenant:**
```typescript
if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
  throw new ForbiddenException('Você não pode acessar dados de outra empresa');
}
```

**Lógica:**
```typescript
return prisma.periodoAvaliacao.findFirst({
  where: { empresaId, aberto: true },
});
```

**Retorno (com período aberto):**
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

**Retorno (sem período aberto):**
```json
null
```

**Perfis autorizados:** Todos (ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA)

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts` (método `findAtual`)

---

### R-PEVOL-005: Listar Histórico de Períodos

**Descrição:** Retorna lista de períodos (abertos e congelados) com snapshots (filtro opcional por ano).

**Implementação:**
- **Endpoint:** `GET /empresas/:id/periodos-avaliacao?ano=2025` (Todos os perfis)
- **Método:** `PeriodosAvaliacaoService.findAll()`

**Query Params:**
- `ano` (opcional): Filtrar por ano (ex: `?ano=2025`)

**Validação Multi-Tenant:**
```typescript
if (user && user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
  throw new ForbiddenException('Você não pode acessar dados de outra empresa');
}
```

**Lógica:**
```typescript
return prisma.periodoAvaliacao.findMany({
  where: {
    empresaId,
    ano: ano || undefined, // Filtro opcional
  },
  include: {
    snapshots: {
      include: {
        pilarEmpresa: {
          select: { id: true, nome: true },
        },
      },
    },
  },
  orderBy: [{ ano: 'asc' }, { trimestre: 'asc' }],
});
```

**Retorno:**
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
      {
        "id": "uuid",
        "pilarEmpresaId": "uuid",
        "mediaNotas": 7.2,
        "pilarEmpresa": { "id": "uuid", "nome": "FINANCEIRO" }
      }
    ]
  },
  {
    "id": "uuid",
    "trimestre": 2,
    "ano": 2025,
    "dataReferencia": "2025-06-30",
    "aberto": true,
    "dataInicio": "2025-04-10T08:00:00Z",
    "dataCongelamento": null,
    "snapshots": []
  }
]
```

**Perfis autorizados:** Todos (ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA)

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts` (método `findAll`)

---

### RA-PEVOL-001: Auditoria Completa de Períodos

**Descrição:** Todas operações CREATE e UPDATE em PeriodoAvaliacao são auditadas.

**Implementação:**
- **Serviço:** AuditService
- **Entidade:** 'PeriodoAvaliacao'

**Dados auditados:**
- usuarioId, usuarioNome, usuarioEmail
- entidade: 'PeriodoAvaliacao'
- entidadeId: ID do período
- acao: CREATE | UPDATE
- dadosAntes (em UPDATE): { aberto }
- dadosDepois (sempre): { trimestre, ano, dataReferencia, snapshotsCriados (em UPDATE) }

**Cobertura:**
- ✅ CREATE (criação de período)
- ✅ UPDATE (congelamento de período)
- ❌ DELETE (não implementado — períodos não são deletados, apenas historico mantido)

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts` (métodos `create` e `congelar`)

---

## 5. Regras de Interface (Frontend)

### UI-PEVOL-001: Badge de Período Ativo (Diagnóstico Notas)

**Descrição:** Exibir badge informativo quando há período de avaliação aberto.

**Acesso:** Todos os perfis autenticados  
**Rota:** `/diagnostico/notas`

**Localização:** `frontend/src/app/views/pages/diagnostico-notas/`

**Comportamento:**

1. **Ao Carregar Tela:**
```typescript
async ngOnInit() {
  // ... código existente
  await this.loadPeriodoAtual();
}

async loadPeriodoAtual() {
  if (!this.selectedEmpresaId) return;
  
  this.periodoAtual = await firstValueFrom(
    this.periodosService.getAtual(this.selectedEmpresaId)
  );
}
```

2. **Exibição Condicional:**
```html
<div *ngIf="periodoAtual" class="alert alert-info mb-3">
  <i class="bi bi-info-circle"></i>
  <strong>Avaliação Q{{ periodoAtual.trimestre }}/{{ periodoAtual.ano }} em andamento</strong>
  <small class="d-block">Iniciada em: {{ periodoAtual.dataInicio | date:'dd/MM/yyyy HH:mm' }}</small>
</div>
```

3. **Botão "Iniciar Avaliação":**
```html
<button 
  *ngIf="!periodoAtual && isAdmin" 
  class="btn btn-primary" 
  (click)="abrirModalIniciarAvaliacao()">
  <i class="bi bi-play-circle"></i> Iniciar Avaliação
</button>
```

**Modal de Criação:**
- Date picker para selecionar `dataReferencia` (aceita qualquer data)
- Data sugerida: data atual
- Trimestre calculado automaticamente pelo backend baseado na data escolhida
- Confirmação com SweetAlert2 antes de criar

---

### UI-PEVOL-002: Botão "Congelar Médias" (Diagnóstico Evolução)

**Descrição:** Botão para finalizar período ativo e criar snapshots históricos.

**Acesso:** ADMINISTRADOR, CONSULTOR, GESTOR  
**Rota:** `/diagnostico/evolucao`

**Localização:** `frontend/src/app/views/pages/diagnostico-evolucao/`

**Comportamento:**

1. **Verificar Período Ativo:**
```typescript
async loadPeriodoAtual() {
  this.periodoAtual = await firstValueFrom(
    this.periodosService.getAtual(this.selectedEmpresaId!)
  );
}
```

2. **Habilitar/Desabilitar Botão:**
```html
<button 
  class="btn btn-primary btn-lg" 
  [disabled]="!periodoAtual || !canCongelar"
  (click)="congelarMedias()">
  <i class="bi bi-archive"></i> 
  Congelar Médias{{ periodoAtual ? ' do Q' + periodoAtual.trimestre + '/' + periodoAtual.ano : '' }}
</button>
```

3. **Confirmação e Execução:**
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
    if (result.isConfirmed) {
      this.periodosService.congelar(this.periodoAtual!.id).subscribe({
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

---

### UI-PEVOL-003: Filtro de Ano (Diagnóstico Evolução)

**Descrição:** Permite filtrar histórico de períodos por ano.

**Comportamento:**

1. **Select de Ano:**
```html
<div class="mb-3">
  <label>Filtrar histórico por ano:</label>
  <select class="form-select" [(ngModel)]="anoFiltro" (change)="loadAllHistorico()">
    <option [value]="2024">2024</option>
    <option [value]="2025">2025</option>
    <option [value]="2026">2026</option>
  </select>
</div>
```

2. **Carregar Histórico Filtrado:**
```typescript
private async loadAllHistorico(): Promise<void> {
  const periodos = await firstValueFrom(
    this.periodosService.getHistorico(this.selectedEmpresaId!, this.anoFiltro)
  );
  
  // Mapear para formato do gráfico
  this.historico = periodos.map(p => ({ /* ... */ }));
  this.renderBarChart();
}
```

3. **Gráfico com Até 4 Barras:**
- Eixo X: Pilares
- Datasets: 1 por trimestre (Q1, Q2, Q3, Q4)
- Legend: "Q1/2026", "Q2/2026", etc
- Máximo de 4 barras por gráfico (1 ano = 4 trimestres)

---

## 6. Validações

### 6.1. CreatePeriodoAvaliacaoDto

**Campos:**
- `dataReferencia`: @IsDateString(), @IsNotEmpty()

**Validações implementadas:**
- Data obrigatória
- Formato ISO 8601
- Backend calcula trimestre automaticamente usando `getQuarter(dataRef)`
- Backend valida intervalo de 90 dias entre datas de referência

**Arquivo:** `backend/src/modules/periodos-avaliacao/dto/create-periodo-avaliacao.dto.ts`

---

## 7. Comportamentos Condicionais

### 7.1. Validação de Intervalo Mínimo

**Condição:** Último período da empresa

**Comportamento:**
- Se não há período anterior, permite criar imediatamente
- Se há período anterior, valida diferença de dias
- Exibe mensagem clara de quantos dias faltam

**Justificativa:** Garantir que empresa não crie períodos muito próximos

---

### 7.2. Transação Atômica ao Congelar

**Condição:** Criação de múltiplos snapshots

**Comportamento:**
- Usa `prisma.$transaction` para garantir atomicidade
- Se falhar criação de 1 snapshot, faz rollback de tudo
- Garante consistência: ou todos os pilares têm snapshot ou nenhum

**Justificativa:** Evitar estados inconsistentes no histórico

---

### 7.3. Cálculo de Média Ignora Rotinas Sem Nota

**Condição:** Pilar tem rotinas sem nota preenchida

**Comportamento:**
```typescript
const rotinasComNota = pilar.rotinasEmpresa.filter(
  (rotina) => rotina.notas.length > 0 && rotina.notas[0].nota !== null,
);
```

**Justificativa:** Evitar divisão por zero e cálculo incorreto de média

---

## 8. Ausências ou Ambiguidades

### 8.1. Cancelamento de Período Aberto

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Não há endpoint DELETE para cancelar período aberto
- Se admin abrir período por engano, não pode desfazer

**TODO:**
- Implementar `DELETE /periodos-avaliacao/:id` (apenas se `aberto === true`)
- Validar que não há snapshots vinculados
- Auditar cancelamento

---

### 8.2. Edição de Data de Referência

**Status:** ❌ NÃO PERMITIDO

**Descrição:**
- Após criar período, não é possível alterar `dataReferencia`
- Não há endpoint PATCH

**Justificativa:**
- Trimestre/ano são calculados a partir da data
- Alterar data quebraria integridade do histórico

---

## 9. Sumário de Regras

**Backend:**

| ID | Descrição | Status |
|----|-----------|--------|
| R-PEVOL-001 | Criar novo período trimestral | ✅ Implementado |
| R-PEVOL-002 | Congelar médias (criar snapshots) | ✅ Implementado |
| R-PEVOL-003 | Buscar período aberto | ✅ Implementado |
| R-PEVOL-004 | Listar histórico de períodos | ✅ Implementado |
| RA-PEVOL-001 | Auditoria completa de períodos | ✅ Implementado |

**Frontend:**

| ID | Descrição | Status |
|----|-----------|--------|
| UI-PEVOL-001 | Badge de período ativo | ✅ Implementado |
| UI-PEVOL-002 | Botão "Congelar Médias" | ✅ Implementado |
| UI-PEVOL-003 | Filtro de ano no histórico | ✅ Implementado |
| UI-PEVOL-004 | Gráfico com mês/ano da dataReferencia | ✅ Implementado |

**Validações:**

| ID | Descrição | Status |
|----|-----------|--------|
| V-PEVOL-001 | Data de referência obrigatória | ✅ Implementado |
| V-PEVOL-002 | Cálculo automático de trimestre | ✅ Implementado |
| V-PEVOL-003 | Intervalo mínimo 90 dias | ✅ Implementado |
| V-PEVOL-004 | Período único aberto | ✅ Implementado |
| V-PEVOL-005 | Multi-tenant em todos os endpoints | ✅ Implementado |

---

**Versão:** 1.1.0  
**Última Atualização:** 2026-01-14  
**Agente:** Dev Agent (implementação) + Business Rules Extractor (documentação)  
### R-PEVOL-006: Recongelar Período Congelado

**Descrição:** Permite reabrir período já congelado para atualizar médias com pilares esquecidos ou reavaliados, substituindo snapshots anteriores.

**Implementação:**
- **Endpoint:** `POST /periodos-avaliacao/:id/recongelar` (ADMINISTRADOR, CONSULTOR, GESTOR)
- **Método:** `PeriodosAvaliacaoService.recongelar()`

**Validações:**

1. **Período Existe e Está Congelado:**
```typescript
const periodo = await prisma.periodoAvaliacao.findUnique({
  where: { id: periodoId },
  include: { empresa: { include: { pilares: { where: { ativo: true } } } } }
});
if (!periodo) throw new NotFoundException('Período não encontrado');
if (periodo.aberto) {
  throw new BadRequestException('Período está aberto - use congelar()');
}
```

2. **Multi-Tenant:**
```typescript
if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== periodo.empresaId) {
  throw new ForbiddenException('Você não pode acessar dados de outra empresa');
}
```

3. **Permissões RBAC:**
```typescript
const perfisAutorizados = ['ADMINISTRADOR', 'CONSULTOR', 'GESTOR'];
if (!perfisAutorizados.includes(user.perfil?.codigo)) {
  throw new ForbiddenException('Perfil não autorizado para recongelar períodos');
}
```

**Lógica de Recongelamento (Transação Atômica):**
```typescript
return prisma.$transaction(async (tx) => {
  // 1. Coletar snapshots antigos para auditoria
  const snapshotsAntigos = await tx.pilarEvolucao.findMany({
    where: { periodoAvaliacaoId: periodoId },
    include: { pilarEmpresa: { select: { nome: true } } }
  });

  // 2. Deletar snapshots existentes
  await tx.pilarEvolucao.deleteMany({
    where: { periodoAvaliacaoId: periodoId }
  });

  // 3. Criar novos snapshots com médias atuais
  const snapshotsNovos = await Promise.all(
    periodo.empresa.pilares.map(pilar => {
      const media = this.calcularMediaPilar(pilar);
      
      return tx.pilarEvolucao.create({
        data: {
          pilarEmpresaId: pilar.id,
          periodoAvaliacaoId: periodo.id,
          mediaNotas: media,
          createdBy: userId,
        },
      });
    })
  );

  // 4. Atualizar timestamp do período (mantém aberto: false)
  const periodoAtualizado = await tx.periodoAvaliacao.update({
    where: { id: periodoId },
    data: {
      updatedAt: new Date(),
      updatedBy: userId,
    },
  });

  return { 
    periodo: periodoAtualizado, 
    snapshotsNovos,
    snapshotsAntigos // Para auditoria
  };
});
```

**Auditoria Completa:**
```typescript
await auditService.log({
  entidade: 'PeriodoAvaliacao',
  entidadeId: periodoId,
  acao: 'UPDATE', // RECONGELAR é um tipo de UPDATE
  dadosAntes: { 
    snapshots: snapshotsAntigos.map(s => ({
      pilarNome: s.pilarEmpresa.nome,
      mediaAntiga: s.mediaNotas
    }))
  },
  dadosDepois: { 
    snapshotsCriados: snapshotsNovos.length,
    snapshotsSubstituidos: snapshotsAntigos.length,
    operacao: 'RECONGELAMENTO'
  }
});
```

**Retorno:**
```json
{
  "message": "Período recongelado com sucesso",
  "operacao": "recongelamento",
  "periodo": {
    "id": "uuid",
    "trimestre": 2,
    "ano": 2026,
    "aberto": false,
    "updatedAt": "2026-01-24T15:30:00Z"
  },
  "snapshotsNovos": [
    { "id": "uuid", "pilarEmpresaId": "uuid", "mediaNotas": 7.8 },
    { "id": "uuid", "pilarEmpresaId": "uuid", "mediaNotas": 8.1 }
  ],
  "resumo": {
    "totalSnapshots": 5,
    "snapshotsSubstituidos": 5
  }
}
```

**Perfis autorizados:** ADMINISTRADOR, CONSULTOR, GESTOR

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts` (método `recongelar`)

---

**Status:** ✅ Implementado com flexibilização de data de referência + recongelamento
