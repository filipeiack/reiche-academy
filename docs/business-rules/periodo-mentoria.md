# Regras de Negócio — Período de Mentoria

**Módulo:** Períodos de Mentoria  
**Backend:** `backend/src/modules/periodos-mentoria/`  
**Frontend:** `frontend/src/app/views/pages/empresas/` e componentes de cockpit  
**Última atualização:** 2026-01-21  
**Agente:** Business Rules Extractor  
**Ref:** ADR-007 (Período de Mentoria de 1 Ano)

---

## 1. Visão Geral

O módulo Períodos de Mentoria é responsável por:
- **Gerenciar ciclos anuais** de consultoria Reiche contratados por empresas
- **Estabelecer âncora temporal** para todo o sistema (dashboard, trimestres, indicadores)
- **Validar edição de valores mensais** dentro do período de 1 ano
- **Suportar renovações** com separação histórica de dados
- **Rastrear histórico completo** de mentorias por empresa
- **Controlar período ativo único** por empresa

**Entidade principal:**
- PeriodoMentoria (ciclo anual de consultoria com controle de início/fim)

**Entidades relacionadas:**
- **Empresa** → Dona dos períodos de mentoria
- **PeriodoAvaliacao** → Trimestres vinculados ao período
- **IndicadorMensal** → Valores mensais vinculados ao período

**Integração:**
- Períodos de mentoria definem QUANDO trimestres podem ser criados
- Valores mensais são validados contra dataInicio/dataFim do período
- Frontend filtra dados por período selecionado (dropdown)

**Endpoints a implementar:**
- `POST /empresas/:id/periodos-mentoria` — Criar período (ADMINISTRADOR)
- `GET /empresas/:id/periodos-mentoria` — Listar histórico de períodos
- `GET /empresas/:id/periodos-mentoria/ativo` — Buscar período ativo
- `POST /empresas/:id/periodos-mentoria/:periodoId/renovar` — Renovar mentoria (ADMINISTRADOR)

**Status do módulo:** ⏳ **A IMPLEMENTAR**

---

## 2. Arquitetura do Módulo

### 2.1. Backend

**Arquivos a criar:**
- `periodos-mentoria.service.ts` — Lógica de negócio
- `periodos-mentoria.controller.ts` — Endpoints REST
- `periodos-mentoria.module.ts` — Módulo NestJS
- `create-periodo-mentoria.dto.ts` — DTO de criação
- `renovar-periodo-mentoria.dto.ts` — DTO de renovação

**Integrações:**
- PrismaService — Acesso ao banco de dados
- AuditService — Registro de operações CREATE/UPDATE
- date-fns — Cálculo de dataFim (dataInicio + 1 ano)

### 2.2. Frontend

**Componentes afetados:**
- `empresas-form.component.ts` — **Etapa 2 do wizard:** criar/editar período de mentoria
- `empresas-list.component.ts` — Exibir status do período ativo na coluna
- `edicao-valores-mensais.component.ts` — Sempre exibe último período (vigente)
- `grafico-indicadores.component.ts` — Dropdown de seleção de período + cálculo dinâmico de meses
- `periodos-mentoria.service.ts` — Service Angular (a criar)

**Funcionalidades:**

**1. Wizard de Empresas (Etapa 2):**
- Campo "Data de Início da Mentoria" (date picker)
- Exibição automática de "Data de Fim" (dataInicio + 1 ano)
- Validação: não permitir período ativo duplicado
- Ao criar empresa → criar período de mentoria automaticamente
- Ao editar empresa → permitir editar data de início OU renovar período

**2. Lista de Empresas:**
- Coluna "Mentoria" exibindo status:
  - 🟢 **Período X Ativo** (Mai/26 - Abr/27)
  - 🔴 **Sem mentoria** (se nunca teve período)
  - 📅 **Encerrado** (se teve período mas está inativo)

**3. Edição de Valores Mensais:**
- Sempre exibe valores do **último período de mentoria** (vigente)
- Cálculo de meses baseado no período ativo
- Headers de tabela fixos para o período vigente

**4. Gráfico de Indicadores:**
- Dropdown de seleção: "Período 1 (Mai/26 - Abr/27)", "Período 2 (Mai/27 - Abr/28)"
- Cálculo dinâmico de meses baseado em dataInicio/dataFim do período selecionado
- Headers de gráfico dinâmicos (Mai/26, Jun/26... Abr/27)
- Filtro de indicadores por periodoMentoriaId

---

## 3. Entidades

### 3.1. PeriodoMentoria

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| empresaId | String | FK para Empresa |
| numero | Int | Sequencial por empresa (1, 2, 3...) |
| dataInicio | DateTime | Data de início da mentoria (ex: 2026-05-01) |
| dataFim | DateTime | Data de término (calculado: dataInicio + 1 ano) |
| ativo | Boolean | true = período ativo, false = encerrado |
| dataContratacao | DateTime | Quando foi contratado (default: now()) |
| dataEncerramento | DateTime? | Quando foi encerrado (renovação ou cancelamento) |
| createdAt | DateTime | Data de criação do registro |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `empresa`: Empresa (dona do período)
- `periodosAvaliacao`: PeriodoAvaliacao[] (trimestres vinculados)
- `indicadoresMensais`: IndicadorMensal[] (valores mensais vinculados)

**Índices:**
- `@@unique([empresaId, numero])` — Evita duplicatas de número
- `@@index([empresaId, ativo])` — Buscar período ativo rapidamente

**Comportamento:**
- Sistema permite apenas 1 período ativo por empresa
- Duração fixa de 1 ano (dataFim = dataInicio + 365 dias)
- Ao renovar, período anterior é encerrado (`ativo = false`)
- Histórico completo de todos os períodos fica registrado

---

### 3.2. PeriodoAvaliacao (Modificado)

**Alteração:** Adicionado campo `periodoMentoriaId` (nullable para retrocompatibilidade)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| periodoMentoriaId | String? | FK para PeriodoMentoria |
| periodoMentoria | PeriodoMentoria? | Período de mentoria ao qual este trimestre pertence |

**Constraint adicional:**
- Validação: `dataReferencia` deve estar entre `periodoMentoria.dataInicio` e `dataFim`

**Comportamento:**
- Novos trimestres DEVEM estar vinculados a um período de mentoria ativo
- Ao deletar período de mentoria, trimestres são deletados em cascata (onDelete: Cascade)

---

### 3.3. IndicadorMensal (Modificado)

**Alteração:** Adicionado campo `periodoMentoriaId` (nullable para retrocompatibilidade)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| periodoMentoriaId | String? | FK para PeriodoMentoria |
| periodoMentoria | PeriodoMentoria? | Período de mentoria ao qual este valor pertence |

**Constraint alterada:**
- `@@unique([indicadorCockpitId, ano, mes, periodoMentoriaId])` — Permite mesmos meses em períodos diferentes

**Comportamento:**
- Valores de `meta` e `realizado` DEVEM estar dentro do período de mentoria
- Campo `historico` é **EXCEÇÃO** (pode conter dados anteriores ao período)
- Ao deletar período de mentoria, valores são deletados em cascata (onDelete: Cascade)

---

## 4. Regras Implementadas

### R-MENT-001: Criar Período de Mentoria

**Descrição:** ADMINISTRADOR cria período de mentoria de 1 ano para empresa.

**Implementação:**
- **Endpoint:** `POST /empresas/:id/periodos-mentoria` (ADMINISTRADOR)
- **Método:** `PeriodosMentoriaService.create()`

**Validações:**

1. **Apenas ADMINISTRADOR:**
```typescript
@UseGuards(JwtAuthGuard, PerfilGuard)
@RequirePerfil('ADMINISTRADOR')
```

2. **Empresa não possui período ativo:**
```typescript
const periodoAtivo = await this.prisma.periodoMentoria.findFirst({
  where: {
    empresaId,
    ativo: true,
  },
});

if (periodoAtivo) {
  throw new BadRequestException(
    'Empresa já possui período de mentoria ativo. Encerre o período atual antes de criar novo.'
  );
}
```

3. **Calcular dataFim (1 ano):**
```typescript
const dataInicio = new Date(dto.dataInicio);
const dataFim = addYears(dataInicio, 1); // dataInicio + 365 dias
```

4. **Calcular numero sequencial:**
```typescript
const ultimoPeriodo = await this.prisma.periodoMentoria.findFirst({
  where: { empresaId },
  orderBy: { numero: 'desc' },
});

const numero = ultimoPeriodo ? ultimoPeriodo.numero + 1 : 1;
```

**Lógica de Criação:**
```typescript
const periodo = await this.prisma.periodoMentoria.create({
  data: {
    empresaId,
    numero,
    dataInicio,
    dataFim,
    ativo: true,
    dataContratacao: new Date(),
    createdBy: user.id,
  },
});
```

**Auditoria:**
```typescript
await this.auditService.log({
  entidade: 'PeriodoMentoria',
  entidadeId: periodo.id,
  acao: 'CREATE',
  dadosDepois: { empresaId, numero, dataInicio, dataFim },
  usuarioId: user.id,
});
```

**Retorno:**
```json
{
  "id": "uuid",
  "empresaId": "uuid",
  "numero": 1,
  "dataInicio": "2026-05-01T00:00:00Z",
  "dataFim": "2027-04-30T23:59:59Z",
  "ativo": true,
  "dataContratacao": "2026-01-21T10:00:00Z",
  "dataEncerramento": null
}
```

**Perfis autorizados:** ADMINISTRADOR

**Arquivo:** `backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts` (método `create`)

---

### R-MENT-002: Apenas 1 Período Ativo por Empresa

**Descrição:** Sistema garante que empresa tenha no máximo 1 período com `ativo = true`.

**Implementação:**
- **Validação:** Em todos os métodos que criam ou ativam período
- **Constraint:** Índice `@@index([empresaId, ativo])` otimiza busca

**Comportamento:**

```typescript
// Buscar período ativo
const periodoAtivo = await this.prisma.periodoMentoria.findFirst({
  where: {
    empresaId,
    ativo: true,
  },
});

if (periodoAtivo) {
  throw new BadRequestException(
    'Empresa já possui período de mentoria ativo'
  );
}
```

**Aplicado em:**
- `create()` — Criar novo período
- `renovar()` — Renovar período (encerra anterior antes)

**Arquivo:** `backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts`

---

### R-MENT-003: Renovação de Mentoria

**Descrição:** Administrador pode renovar mentoria antes ou após término do período atual.

**Implementação:**
- **Endpoint:** `POST /empresas/:id/periodos-mentoria/:periodoId/renovar` (ADMINISTRADOR)
- **Método:** `PeriodosMentoriaService.renovar()`

**Validações:**

1. **Período existe e pertence à empresa:**
```typescript
const periodoAtual = await this.prisma.periodoMentoria.findUnique({
  where: { id: periodoId },
});

if (!periodoAtual || periodoAtual.empresaId !== empresaId) {
  throw new NotFoundException('Período de mentoria não encontrado');
}
```

2. **Período ainda está ativo:**
```typescript
if (!periodoAtual.ativo) {
  throw new BadRequestException('Período já está encerrado');
}
```

**Lógica de Renovação:**

```typescript
// 1. Encerrar período atual
await this.prisma.periodoMentoria.update({
  where: { id: periodoId },
  data: {
    ativo: false,
    dataEncerramento: new Date(),
    updatedBy: user.id,
  },
});

// 2. Calcular datas do novo período
const novaDataInicio = addDays(periodoAtual.dataFim, 1); // Continuidade
const novaDataFim = addYears(novaDataInicio, 1);

// 3. Criar novo período
const novoPeriodo = await this.prisma.periodoMentoria.create({
  data: {
    empresaId,
    numero: periodoAtual.numero + 1,
    dataInicio: novaDataInicio,
    dataFim: novaDataFim,
    ativo: true,
    dataContratacao: new Date(),
    createdBy: user.id,
  },
});
```

**Auditoria:**
```typescript
// Auditoria de encerramento
await this.auditService.log({
  entidade: 'PeriodoMentoria',
  entidadeId: periodoId,
  acao: 'UPDATE',
  dadosDepois: { ativo: false, dataEncerramento: new Date() },
  usuarioId: user.id,
});

// Auditoria de criação do novo
await this.auditService.log({
  entidade: 'PeriodoMentoria',
  entidadeId: novoPeriodo.id,
  acao: 'CREATE',
  dadosDepois: { numero: novoPeriodo.numero, dataInicio, dataFim },
  usuarioId: user.id,
});
```

**Retorno:**
```json
{
  "periodoAnterior": {
    "id": "uuid",
    "numero": 1,
    "ativo": false,
    "dataEncerramento": "2026-01-21T10:00:00Z"
  },
  "novoPeriodo": {
    "id": "uuid",
    "numero": 2,
    "dataInicio": "2027-05-01T00:00:00Z",
    "dataFim": "2028-04-30T23:59:59Z",
    "ativo": true
  }
}
```

**Perfis autorizados:** ADMINISTRADOR

**Arquivo:** `backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts` (método `renovar`)

---

### R-MENT-004: Validação de Trimestres

**Descrição:** Ao criar `PeriodoAvaliacao`, validar que `dataReferencia` está dentro do período de mentoria ativo.

**Implementação:**
- **Endpoint:** `POST /empresas/:id/periodos-avaliacao`
- **Método:** `PeriodosAvaliacaoService.create()`

**Validações adicionais:**

```typescript
// 1. Buscar período de mentoria ativo
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

// 2. Validar dataReferencia dentro do período
const dataReferencia = new Date(dto.dataReferencia);

if (
  dataReferencia < periodoMentoria.dataInicio ||
  dataReferencia > periodoMentoria.dataFim
) {
  throw new BadRequestException(
    `Data de referência (${format(dataReferencia, 'dd/MM/yyyy')}) deve estar dentro do período de mentoria ativo (${format(periodoMentoria.dataInicio, 'dd/MM/yyyy')} - ${format(periodoMentoria.dataFim, 'dd/MM/yyyy')})`
  );
}

// 3. Vincular ao período de mentoria
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

**Ref:** R-PEVOL-XXX em [periodo-avaliacao.md](periodo-avaliacao.md)

---

### R-MENT-005: Validação de Valores Mensais

**Descrição:** Ao criar/editar `IndicadorMensal`, validar que `mes/ano` está dentro do período de mentoria ativo.

**Implementação:**
- **Endpoint:** `PATCH /indicadores/:id/valores-mensais`
- **Método:** `CockpitPilaresService.updateValoresMensais()`

**Exceção:** Campo `historico` pode conter dados anteriores ao período.

**Validações adicionais:**

```typescript
// 1. Buscar indicador com empresa e período ativo
const indicador = await this.prisma.indicadorCockpit.findUnique({
  where: { id: indicadorId },
  include: {
    cockpitPilar: {
      include: {
        pilarEmpresa: {
          include: {
            empresa: {
              include: {
                periodosMentoria: {
                  where: { ativo: true },
                },
              },
            },
          },
        },
      },
    },
  },
});

const periodoMentoria = indicador.cockpitPilar.pilarEmpresa.empresa.periodosMentoria[0];

if (!periodoMentoria) {
  throw new BadRequestException(
    'Empresa não possui período de mentoria ativo'
  );
}

// 2. Validar cada valor mensal
for (const valorDto of dto.valores) {
  if (valorDto.mes === null) continue; // Resumo anual não valida

  const dataValor = new Date(valorDto.ano, valorDto.mes - 1, 1);

  // Validar meta e realizado (historico é exceção)
  if (
    (valorDto.meta !== undefined || valorDto.realizado !== undefined) &&
    (dataValor < periodoMentoria.dataInicio ||
      dataValor > periodoMentoria.dataFim)
  ) {
    throw new BadRequestException(
      `Mês ${valorDto.mes}/${valorDto.ano} está fora do período de mentoria ativo (${format(periodoMentoria.dataInicio, 'MM/yyyy')} - ${format(periodoMentoria.dataFim, 'MM/yyyy')})`
    );
  }
}

// 3. Vincular ao período de mentoria ao criar/atualizar
await this.prisma.indicadorMensal.upsert({
  where: {
    indicadorCockpitId_ano_mes_periodoMentoriaId: {
      indicadorCockpitId: indicadorId,
      ano: valorDto.ano,
      mes: valorDto.mes,
      periodoMentoriaId: periodoMentoria.id,
    },
  },
  update: {
    meta: valorDto.meta,
    realizado: valorDto.realizado,
    historico: valorDto.historico, // ✅ Não valida
    updatedBy: user.id,
  },
  create: {
    indicadorCockpitId: indicadorId,
    ano: valorDto.ano,
    mes: valorDto.mes,
    meta: valorDto.meta,
    realizado: valorDto.realizado,
    historico: valorDto.historico,
    periodoMentoriaId: periodoMentoria.id, // ✅ VÍNCULO
    createdBy: user.id,
  },
});
```

**Arquivos afetados:**
- `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`
- `backend/prisma/schema.prisma` (campo `periodoMentoriaId`)

**Ref:** Seção 3 em [cockpit-valores-mensais.md](cockpit-valores-mensais.md)

---

### R-MENT-006: Gestão de Período no Wizard de Empresas

**Descrição:** Etapa 2 do wizard de empresas permite criar/editar período de mentoria.

**Implementação:**
- **Componente:** `empresas-form.component.ts` (wizardStep = 2)
- **Service:** `PeriodosMentoriaService.create()`, `PeriodosMentoriaService.renovar()`

**Comportamento:**

**Modo Criação (Nova Empresa):**

1. **Etapa 2 do wizard exibe:**
```html
<div class="periodo-mentoria-section">
  <h4>Período de Mentoria</h4>
  <div class="form-group">
    <label>Data de Início da Mentoria *</label>
    <input type="date" [(ngModel)]="dataInicioMentoria" class="form-control">
  </div>
  <div class="form-group">
    <label>Data de Fim (calculado automaticamente)</label>
    <input type="date" [ngModel]="calcularDataFim(dataInicioMentoria)" disabled class="form-control">
    <small class="text-muted">1 ano após o início</small>
  </div>
</div>
```

2. **Ao salvar empresa (finalizar wizard):**
```typescript
finalizarCadastro() {
  // 1. Criar empresa
  this.empresasService.create(empresaData).subscribe(empresa => {
    // 2. Criar período de mentoria automaticamente
    this.periodosMentoriaService.create(empresa.id, {
      dataInicio: this.dataInicioMentoria
    }).subscribe(() => {
      this.router.navigate(['/empresas']);
    });
  });
}
```

**Modo Edição (Empresa Existente):**

1. **Carregar período ativo:**
```typescript
ngOnInit() {
  if (this.isEditMode && this.empresaId) {
    this.periodosMentoriaService.getPeriodoAtivo(this.empresaId).subscribe(periodo => {
      if (periodo) {
        this.periodoAtivo = periodo;
        this.dataInicioMentoria = periodo.dataInicio;
      }
    });
  }
}
```

2. **Exibir status e permitir renovação:**
```html
<div *ngIf="periodoAtivo" class="alert alert-info">
  <strong>Período Ativo:</strong> Período {{periodoAtivo.numero}}<br>
  <small>{{periodoAtivo.dataInicio | date:'dd/MM/yyyy'}} - {{periodoAtivo.dataFim | date:'dd/MM/yyyy'}}</small>
  <button (click)="renovarPeriodo()" class="btn btn-sm btn-warning mt-2">
    Renovar Mentoria
  </button>
</div>

<div *ngIf="!periodoAtivo" class="alert alert-warning">
  Nenhum período de mentoria ativo.
  <button (click)="criarPeriodo()" class="btn btn-sm btn-primary">
    Criar Período
  </button>
</div>
```

**Validações:**
- Data de início é obrigatória ao criar empresa
- Não permitir período ativo duplicado
- Ao renovar, encerrar período anterior automaticamente

**Arquivos afetados:**
- frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.ts
- frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.html
- frontend/src/app/core/services/periodos-mentoria.service.ts

**Ref:** ADR-007 (Período de Mentoria de 1 Ano)

---

### R-MENT-007: Exibição de Status na Lista de Empresas

**Descrição:** Lista de empresas exibe coluna com status do período de mentoria ativo.

**Implementação:**
- **Componente:** `empresas-list.component.ts`
- **Service:** `EmpresasService.getAll()` (retorna empresa com periodoMentoriaAtivo)

**Comportamento:**

1. **Backend incluir período ativo no response:**
```typescript
// EmpresasService.findAll()
const empresas = await this.prisma.empresa.findMany({
  include: {
    periodosMentoria: {
      where: { ativo: true },
      take: 1,
    },
  },
});

// Response
{
  id: "uuid",
  nome: "Empresa Teste",
  periodoMentoriaAtivo: {
    numero: 1,
    dataInicio: "2026-05-01",
    dataFim: "2027-04-30",
    ativo: true
  }
}
```

2. **Frontend exibir coluna:**
```html
<table>
  <thead>
    <tr>
      <th>Nome</th>
      <th>CNPJ</th>
      <th>Mentoria</th> <!-- Nova coluna -->
      <th>Ações</th>
    </tr>
  </thead>
  <tbody>
    <tr *ngFor="let empresa of empresas">
      <td>{{ empresa.nome }}</td>
      <td>{{ empresa.cnpj | cnpj }}</td>
      <td>
        <span *ngIf="empresa.periodoMentoriaAtivo" class="badge bg-success">
          Período {{ empresa.periodoMentoriaAtivo.numero }}<br>
          <small>{{ empresa.periodoMentoriaAtivo.dataInicio | date:'MMM/yy' }} - {{ empresa.periodoMentoriaAtivo.dataFim | date:'MMM/yy' }}</small>
        </span>
        <span *ngIf="!empresa.periodoMentoriaAtivo" class="badge bg-secondary">
          Sem mentoria ativa
        </span>
      </td>
      <td>
        <!-- Botões de ação existentes -->
      </td>
    </tr>
  </tbody>
</table>
```

**Arquivos afetados:**
- frontend/src/app/views/pages/empresas/empresas-list/empresas-list.component.html
- backend/src/modules/empresas/empresas.service.ts

**Ref:** ADR-007 (Período de Mentoria de 1 Ano)

---

### R-MENT-008: Filtro de Período em Gráfico de Indicadores

**Descrição:** Frontend exibe dropdown de seleção de período de mentoria no componente de gráfico de indicadores, permitindo visualizar histórico de diferentes períodos.

**Implementação:**
- **Componente:** `grafico-indicadores.component.ts`
- **Service:** `periodos-mentoria.service.ts`

**Observação:** O componente `edicao-valores-mensais` sempre exibe valores do **último período de mentoria** (teoricamente o vigente), sem necessidade de seleção manual.

**Funcionalidades:**

1. **Dropdown de Seleção:**
```typescript
// Buscar períodos da empresa
this.periodosMentoria = await this.periodosMentoriaService
  .listarPorEmpresa(this.empresaId)
  .toPromise();

// Exibir no formato: "Período 1 (Mai/26 - Abr/27)"
getPeriodoLabel(periodo: PeriodoMentoria): string {
  const inicio = format(periodo.dataInicio, 'MMM/yy', { locale: ptBR });
  const fim = format(periodo.dataFim, 'MMM/yy', { locale: ptBR });
  return `Período ${periodo.numero} (${inicio} - ${fim})`;
}
```

2. **Filtro de Indicadores:**
```typescript
// Ao trocar período no dropdown
onPeriodoChange(periodoId: string): void {
  this.periodoSelecionado = periodoId;
  this.carregarIndicadores();
}

carregarIndicadores(): void {
  this.cockpitService
    .listarIndicadores(this.cockpitPilarId, {
      periodoMentoriaId: this.periodoSelecionado,
    })
    .subscribe((indicadores) => {
      this.indicadores = indicadores;
    });
}
```

3. **Persistir Seleção:**
```typescript
// LocalStorage para manter período selecionado entre navegações
localStorage.setItem(
  `periodoSelecionado_${this.empresaId}`,
  periodoId
);
```

**Template HTML:**
```html
<select [(ngModel)]="periodoSelecionado" (change)="onPeriodoChange($event)">
  <option *ngFor="let periodo of periodosMentoria" [value]="periodo.id">
    {{ getPeriodoLabel(periodo) }}
  </option>
</select>
```

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts

---

### R-MENT-009: Cálculo Dinâmico de Meses

**Descrição:** Frontend calcula quais meses exibir baseado em `periodoMentoria.dataInicio` e `dataFim`.

**Implementação:**
- **Componente:** `grafico-indicadores.component.ts`

**Observação:** Este cálculo é usado no gráfico de indicadores para exibir headers dinâmicos baseados no período selecionado. Em `edicao-valores-mensais`, sempre usa o último período (vigente).

**Lógica:**

```typescript
calcularMesesPeriodo(periodo: PeriodoMentoria): { mes: number; ano: number; label: string }[] {
  const meses: { mes: number; ano: number; label: string }[] = [];
  
  let dataAtual = new Date(periodo.dataInicio);
  const dataFinal = new Date(periodo.dataFim);
  
  while (dataAtual <= dataFinal) {
    const mes = dataAtual.getMonth() + 1; // 1-12
    const ano = dataAtual.getFullYear();
    const label = format(dataAtual, 'MMM/yy', { locale: ptBR }); // "Mai/26"
    
    meses.push({ mes, ano, label });
    
    dataAtual = addMonths(dataAtual, 1);
  }
  
  return meses;
}
```

**Exemplo:**
- Período: 01/05/2026 - 30/04/2027
- Meses gerados:
  - Mai/26 (mes: 5, ano: 2026)
  - Jun/26 (mes: 6, ano: 2026)
  - Jul/26 (mes: 7, ano: 2026)
  - ...
  - Abr/27 (mes: 4, ano: 2027)

**Headers Dinâmicos:**
```html
<th *ngFor="let mes of mesesPeriodo">{{ mes.label }}</th>
```

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts`

---

## 5. Validações de Integridade

### 5.1. Período Único Ativo

**Constraint:** `@@index([empresaId, ativo])`

**Validação:**
- Ao criar ou ativar período, verificar que não existe outro com `ativo = true` para mesma empresa
- Erro: `BadRequestException('Empresa já possui período de mentoria ativo')`

---

### 5.2. Número Sequencial Único

**Constraint:** `@@unique([empresaId, numero])`

**Validação:**
- Sistema calcula `numero` automaticamente (max(numero) + 1)
- Impossível criar período com número duplicado

---

### 5.3. Vínculo de Trimestres

**Constraint:** FK `periodoMentoriaId` em `PeriodoAvaliacao`

**Validação:**
- `dataReferencia` deve estar entre `dataInicio` e `dataFim` do período
- Erro: `BadRequestException('Data de referência deve estar dentro do período de mentoria ativo')`

---

### 5.4. Vínculo de Valores Mensais

**Constraint:** FK `periodoMentoriaId` em `IndicadorMensal`

**Validação:**
- `mes/ano` deve estar entre `dataInicio` e `dataFim` do período
- **Exceção:** Campo `historico` não valida (permite dados anteriores)
- Erro: `BadRequestException('Mês X/YYYY está fora do período de mentoria ativo')`

---

## 6. Exemplos de Uso

### Exemplo 1: Criar Primeiro Período

**Request:**
```http
POST /empresas/abc-123/periodos-mentoria
Authorization: Bearer <token-admin>
Content-Type: application/json

{
  "dataInicio": "2026-05-01"
}
```

**Response:**
```json
{
  "id": "periodo-uuid",
  "empresaId": "abc-123",
  "numero": 1,
  "dataInicio": "2026-05-01T00:00:00Z",
  "dataFim": "2027-04-30T23:59:59Z",
  "ativo": true,
  "dataContratacao": "2026-01-21T10:00:00Z",
  "dataEncerramento": null
}
```

---

### Exemplo 2: Renovar Período

**Request:**
```http
POST /empresas/abc-123/periodos-mentoria/periodo-uuid/renovar
Authorization: Bearer <token-admin>
```

**Response:**
```json
{
  "periodoAnterior": {
    "id": "periodo-uuid",
    "numero": 1,
    "ativo": false,
    "dataEncerramento": "2027-04-30T23:59:59Z"
  },
  "novoPeriodo": {
    "id": "novo-periodo-uuid",
    "numero": 2,
    "dataInicio": "2027-05-01T00:00:00Z",
    "dataFim": "2028-04-30T23:59:59Z",
    "ativo": true
  }
}
```

---

### Exemplo 3: Listar Períodos (Histórico)

**Request:**
```http
GET /empresas/abc-123/periodos-mentoria
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": "periodo-1-uuid",
    "numero": 1,
    "dataInicio": "2026-05-01T00:00:00Z",
    "dataFim": "2027-04-30T23:59:59Z",
    "ativo": false,
    "dataEncerramento": "2027-04-30T23:59:59Z"
  },
  {
    "id": "periodo-2-uuid",
    "numero": 2,
    "dataInicio": "2027-05-01T00:00:00Z",
    "dataFim": "2028-04-30T23:59:59Z",
    "ativo": true,
    "dataEncerramento": null
  }
]
```

---

### Exemplo 4: Buscar Período Ativo

**Request:**
```http
GET /empresas/abc-123/periodos-mentoria/ativo
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": "periodo-2-uuid",
  "numero": 2,
  "dataInicio": "2027-05-01T00:00:00Z",
  "dataFim": "2028-04-30T23:59:59Z",
  "ativo": true
}
```

---

## 7. Tratamento de Erros

### 7.1. Período Ativo Duplicado

**Erro:** `BadRequestException`

**Mensagem:**
```
Empresa já possui período de mentoria ativo. Encerre o período atual antes de criar novo.
```

**Status HTTP:** 400

---

### 7.2. Período Não Encontrado

**Erro:** `NotFoundException`

**Mensagem:**
```
Período de mentoria não encontrado
```

**Status HTTP:** 404

---

### 7.3. Trimestre Fora do Período

**Erro:** `BadRequestException`

**Mensagem:**
```
Data de referência (15/12/2025) deve estar dentro do período de mentoria ativo (01/05/2026 - 30/04/2027)
```

**Status HTTP:** 400

---

### 7.4. Valor Mensal Fora do Período

**Erro:** `BadRequestException`

**Mensagem:**
```
Mês 3/2025 está fora do período de mentoria ativo (05/2026 - 04/2027)
```

**Status HTTP:** 400

---

### 7.5. Renovação de Período Inativo

**Erro:** `BadRequestException`

**Mensagem:**
```
Período já está encerrado. Não é possível renovar.
```

**Status HTTP:** 400

---

## 8. Testes Necessários

### 8.1. Testes Unitários (Service)

**Arquivo:** `periodos-mentoria.service.spec.ts`

**Casos de teste:**

1. ✅ Deve criar período com numero = 1 para primeira mentoria
2. ✅ Deve calcular dataFim = dataInicio + 1 ano
3. ✅ Deve calcular numero sequencial (2, 3, 4...)
4. ✅ Deve rejeitar criação se já existe período ativo
5. ✅ Deve renovar período (encerrar anterior + criar novo)
6. ✅ Deve vincular periodoMentoriaId ao criar trimestre
7. ✅ Deve validar dataReferencia dentro do período
8. ✅ Deve validar mes/ano de indicador dentro do período
9. ✅ NÃO deve validar campo historico (exceção)

---

### 8.2. Testes E2E (Controller)

**Arquivo:** `periodos-mentoria.e2e-spec.ts`

**Casos de teste:**

1. ✅ POST /empresas/:id/periodos-mentoria → 201 Created
2. ✅ POST /empresas/:id/periodos-mentoria (duplicado) → 400 Bad Request
3. ✅ POST /periodos-mentoria/:id/renovar → 200 OK
4. ✅ GET /empresas/:id/periodos-mentoria → 200 OK (lista histórico)
5. ✅ GET /empresas/:id/periodos-mentoria/ativo → 200 OK
6. ✅ POST /periodos-avaliacao (fora do período) → 400 Bad Request
7. ✅ PATCH /indicadores/:id/valores-mensais (fora do período) → 400 Bad Request
8. ✅ PATCH /indicadores/:id/valores-mensais (historico fora do período) → 200 OK

---

### 8.3. Testes Frontend (Component)

**Arquivo:** `edicao-valores-mensais.component.spec.ts`

**Casos de teste:**

1. ✅ Deve exibir dropdown de períodos
2. ✅ Deve formatar label: "Período 1 (Mai/26 - Abr/27)"
3. ✅ Deve calcular meses dinamicamente baseado em dataInicio/dataFim
4. ✅ Deve gerar headers: Mai/26, Jun/26... Abr/27
5. ✅ Deve filtrar indicadores por periodoMentoriaId selecionado
6. ✅ Deve persistir período selecionado em localStorage

---

## 9. Referências

### 9.1. Documentos Relacionados

- **ADR-007:** Período de Mentoria de 1 Ano (decisão arquitetural)
- [periodo-avaliacao.md](periodo-avaliacao.md) — R-PEVOL-XXX (validação com mentoria)
- [cockpit-valores-mensais.md](cockpit-valores-mensais.md) — Seção 3 (validação com mentoria)
- [empresas.md](empresas.md) — Entidade Empresa (relação com períodos)

### 9.2. Endpoints Backend

```
POST   /empresas/:id/periodos-mentoria           # Criar período
POST   /empresas/:id/periodos-mentoria/:id/renovar  # Renovar período
GET    /empresas/:id/periodos-mentoria           # Listar histórico
GET    /empresas/:id/periodos-mentoria/ativo     # Buscar ativo
```

### 9.3. Componentes Frontend

```
frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/
frontend/src/app/services/periodos-mentoria.service.ts
```

---

**Fim do documento.**
