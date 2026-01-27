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

// ✅ CRIAR MESES PARA TODOS OS INDICADORES EXISTENTES
const indicadoresExistentes = await this.prisma.indicadorCockpit.findMany({
  where: {
    cockpitPilar: {
      pilarEmpresa: {
        empresaId,
      },
    },
    ativo: true,
  },
});

const anoInicio = dataInicio.getUTCFullYear();
const mesesParaCriar = [];

for (const indicador of indicadoresExistentes) {
  // Criar 12 meses + resumo anual
  for (let mes = 1; mes <= 12; mes++) {
    mesesParaCriar.push({
      indicadorCockpitId: indicador.id,
      mes,
      ano: anoInicio,
      periodoMentoriaId: periodo.id,
      createdBy: user.id,
      updatedBy: user.id,
    });
  }
  // Resumo anual
  mesesParaCriar.push({
    indicadorCockpitId: indicador.id,
    mes: null,
    ano: anoInicio,
    periodoMentoriaId: periodo.id,
    createdBy: user.id,
    updatedBy: user.id,
  });
}

if (mesesParaCriar.length > 0) {
  await this.prisma.indicadorMensal.createMany({
    data: mesesParaCriar,
  });
}
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

### R-MENT-006: Criação Automática de Meses para Indicadores

**🔄 STATUS:** **TRANSFERIDO** - Esta funcionalidade foi movida para o módulo Cockpit

**Descrição Original:** Ao criar ou renovar período de mentoria, sistema criaria automaticamente 13 meses (jan-dez + resumo anual) para todos os indicadores existentes da empresa.

**Implementação Atual:**
- **📍 Localização:** `CockpitPilaresService.createIndicador()` e `criarNovoCicloMeses()`
- **🔄 Responsabilidade:** Módulo Cockpit agora controla criação de meses
- **⚙️ Trigger:** Ao criar indicador ou clicar em "Novo ciclo de 12 meses"

**Motivo da Transferência:**
- Maior flexibilidade para o usuário controlar quando criar novos ciclos
- Elimina criação automática desnecessária
- Alinhamento com fluxo de trabalho real das empresas

**Referência:**
- ✅ **Novo Sistema:** [cockpit-indicadores-mensais.md](./cockpit-indicadores-mensais.md)
- ✅ **Handoff:** `docs/handoffs/cockpit-indicadores-mensais/dev-v1.md`
- ❌ **Removido:** `PeriodosMentoriaService.create()` e `renovar()`

> ⚠️ **IMPORTANTE:** Esta regra está documentada aqui para histórico, mas a implementação real foi transferida. Para detalhes da nova implementação, consultar `cockpit-indicadores-mensais.md`.

---

### R-MENT-007: Validação de Trimestres

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

### R-MENT-008: Validação de Valores Mensais

**🔄 STATUS:** **REMOVIDO** - Funcionalidade não implementada

**Descrição Original:** Ao criar/editar `IndicadorMensal`, validar que `mes/ano` está dentro do período de mentoria ativo.

**Situação Atual:**
- ❌ **NÃO IMPLEMENTADO** - Validação foi removida do código
- ❌ **Frontend não tem dropdown** de seleção de período
- ❌ **Schema não tem campo** `periodoMentoriaId` em `IndicadorMensal`
- ✅ **Novo sistema:** Criação controlada por ciclos manuais conforme [cockpit-indicadores-mensais.md](./cockpit-indicadores-mensais.md)

**Motivo da Remoção:**
- Transferência de responsabilidade para controle manual de ciclos
- Maior flexibilidade para usuários gerenciarem períodos
- Simplificação do schema e validações

**Referência:**
- ✅ **Implementado:** Botão "Novo ciclo de 12 meses" no cockpit
- ✅ **Documentado:** [cockpit-indicadores-mensais.md](./cockpit-indicadores-mensais.md)
- ❌ **Removido:** Validação automática de período em `updateValoresMensais()`

---

### R-MENT-009: Gestão de Período no Wizard de Empresas

**🔄 STATUS:** **IMPLEMENTADO PARCIALMENTE**

**Descrição:** Etapa 2 do wizard de empresas permite criar/editar período de mentoria.

**Implementação Atual:**
- **Componente:** `empresas-form.component.ts` (wizardStep = 2)
- **Service:** `PeriodosMentoriaService.create()`, `PeriodosMentoriaService.renovar()`
- **Funcionalidade:** ✅ **Criar períodos** está implementado e funcionando
- **Limitação:** ❌ **Sem criação automática de meses** (transferido para Cockpit)

**Comportamento Implementado:**

1. **Criação de empresa com período:** ✅ Funcional
2. **Edição de período existente:** ✅ Funcional  
3. **Renovação de período:** ✅ Funcional
4. **Validação de período único:** ✅ Funcional

**O que NÃO está implementado:**
- Criação automática de meses (removida em R-MENT-006)

**Motivo:** Sistema de ciclos manuais no cockpit oferece mais flexibilidade

**Status:** ✅ **Funcionalidade principal implementada**

---

### R-MENT-010: Exibição de Status na Lista de Empresas

**🔄 STATUS:** **IMPLEMENTADO E FUNCIONAL**

**Descrição:** Lista de empresas exibe coluna com status do período de mentoria ativo.

**Implementação:**
- **Componente:** `empresas-list.component.ts`
- **Service:** `EmpresasService.getAll()` (retorna empresa com periodoMentoriaAtivo)
- **Status:** ✅ **TOTALMENTE IMPLEMENTADO**

**Funcionalidades Disponíveis:**
1. ✅ **Backend inclui período ativo** no response
2. ✅ **Frontend exibe coluna "Mentoria"** com badges
3. ✅ **Visualização do número do período** (Período 1, Período 2...)
4. ✅ **Exibição das datas** (Mai/26 - Abr/27)
5. ✅ **Distinção visual** (ativo vs sem mentoria)

**Comportamento:**
- **Com período ativo:** Badge verde com número e datas
- **Sem período:** Badge cinza "Sem mentoria ativa"

**Status:** ✅ **IMPLEMENTADO CORRETAMENTE**

---

### R-MENT-011: Filtro de Período em Gráfico de Indicadores

**🔄 STATUS:** **NÃO IMPLEMENTADO**

**Descrição Original:** Frontend exibiria dropdown de seleção de período de mentoria no componente de gráfico de indicadores, permitindo visualizar histórico de diferentes períodos.

**Situação Atual:**
- ❌ **NÃO IMPLEMENTADO** - Componente `grafico-indicadores` não tem dropdown de período
- ❌ **Frontend não importa** `PeriodosMentoriaService`
- ❌ **Filtro atual** é apenas por anos (`opcoesAnos`), não por períodos
- ✅ **Alternativa:** Usuário pode filtrar por anos específicos

**Comportamento Atual:**
- **Filtro disponível:** Dropdown com anos (ex: 2027, 2026, 2025...)
- **Filtro ausente:** Seleção por períodos de mentoria
- **Justificativa:** Sistema usa filtro temporal por anos em vez de períodos

**Motivo da Não Implementação:**
- Complexidade adicional pode não agregar valor ao usuário
- Filtro por anos é mais simples e eficaz para análise histórica
- Períodos de mentoria podem ter sobreposição complicando UX

**Status:** ❌ **FUNCIONALIDADE NÃO IMPLEMENTADA**

---

### R-MENT-012: Cálculo Dinâmico de Meses

**🔄 STATUS:** **NÃO IMPLEMENTADO**

**Descrição Original:** Frontend calcularia quais meses exibir baseado em `periodoMentoria.dataInicio` e `dataFim`.

**Situação Atual:**
- ❌ **NÃO IMPLEMENTADO** - Cálculo dinâmico por período não existe
- ✅ **Alternativa implementada:** Filtro por anos nos gráficos
- ✅ **Filtro funcional:** Usuário seleciona ano específico (ex: 2027)
- ❌ **Cálculo por período:** Não existe pois dropdown de período não foi implementado

**Comportamento Atual:**
- **Gráfico de indicadores:** Usa filtro por anos (não por períodos)
- **Edição de valores:** Exibe últimos 13 meses disponíveis (independente de período)
- **Justificativa:** Simplificação da UX e redução de complexidade

**Motivo da Não Implementação:**
- Dependência de R-MENT-011 (dropdown de período) que não foi implementado
- Filtro por anos atende necessidades básicas de análise temporal
- Reduz complexidade sem perder funcionalidade essencial

**Status:** ❌ **FUNCIONALIDADE NÃO IMPLEMENTADA** (depende de R-MENT-011)

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
