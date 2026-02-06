# Regra de Negócio: Período de Avaliação com Janela Temporal Automática

**ID:** R-PEVOL-JANELA  
**Módulo:** Períodos de Avaliação  
**Versão:** 2.0  
**Data:** 2026-02-05  
**Tipo:** Proposta - Aguardando Implementação  
**Aprovado por:** Usuário (decisão verbal)  
**Prioridade:** Alta  

---

## 1. Contexto

Substituir o modelo atual de criação manual de períodos por um sistema **automático baseado em janelas temporais** de 90 dias.

**Mudanças principais:**
- Remover botão "Iniciar Avaliação Trimestral" da tela de notas
- Adicionar badge informativo (período atual + próximos 4 períodos)
- Criar modal de primeira data de referência na tela de evolução
- Permitir recongelamento ilimitado dentro da janela temporal
- Validar janela estritamente (não permite congelar períodos passados)

---

## 2. Descrição da Regra

### 2.1. Primeira Data de Referência

**Quando:** Empresa ainda não possui nenhum período de avaliação criado.

**Onde:** Tela Evolução → Botão "Adicionar Avaliação Trimestral"

**Comportamento:**
1. Sistema detecta ausência de períodos (`count(PeriodoAvaliacao) == 0`)
2. Exibe modal solicitando **data de referência inicial**
3. Usuário escolhe qualquer data (sem restrições)
4. Sistema cria primeiro período com:
   - `dataReferencia = dataEscolhida`
   - `trimestre = calculado via getQuarter(dataEscolhida)`
   - `ano = calculado via getYear(dataEscolhida)`
   - `aberto = true` (janela ativa)
   - `dataInicio = now()`
   - `dataCongelamento = now()`
   - Snapshots de médias de todos pilares

**Exemplo:**
- Usuário escolhe: **15/02/2026**
- Sistema cria: Período 1 (Q1/2026, dataRef: 15/02/2026)
- Janela temporal: 15/02/2026 a 15/05/2026 (90 dias)

---

### 2.2. Cálculo de Próximos Períodos (Regularidade)

**Fórmula:**
```typescript
dataReferenciaPeriodoN = primeiradata + (90 * numeroPeriodo)

// Exemplo: primeira = 15/02/2026
// Período 1: 15/02/2026 + (90 * 0) = 15/02/2026
// Período 2: 15/02/2026 + (90 * 1) = 16/05/2026
// Período 3: 15/02/2026 + (90 * 2) = 14/08/2026
// Período 4: 15/02/2026 + (90 * 3) = 12/11/2026
// Período 5: 15/02/2026 + (90 * 4) = 10/02/2027
```

**Características:**
- ✅ Regularidade preservada (sempre 90 dias exatos)
- ✅ Independente da data de hoje
- ✅ Previsível para 12 meses futuros

---

### 2.3. Janela Temporal Ativa

**Conceito:** Cada período possui uma janela de 90 dias onde pode ser criado/atualizado.

**Regra:**
```typescript
janelaPeriodoN = {
  inicio: primeiradata + (90 * (N - 1)),
  fim: primeiradata + (90 * N) - 1 dia
}

// Exemplo: Período 2
// inicio: 16/05/2026
// fim: 14/08/2026 (16/05 + 90 - 1)
```

**Status do período:**
```typescript
const hoje = new Date();
const periodoAtual = periodos.find(p => 
  hoje >= p.janelaInicio && hoje <= p.janelaFim
);

if (periodoAtual) {
  periodoAtual.aberto = true; // Dentro da janela
} else {
  periodoAtual.aberto = false; // Fora da janela (encerrado)
}
```

---

### 2.4. Congelamento e Recongelamento

**Comportamento:**

#### Primeiro Congelamento (Período Ainda Não Existe)
1. Usuário clica "Adicionar Avaliação Trimestral"
2. Backend valida:
   - Hoje está dentro da janela do próximo período esperado?
   - Se sim: cria período + snapshots
   - Se não: erro "Fora da janela temporal permitida"
3. Período criado com `aberto = true`, `dataCongelamento = now()`

#### Recongelamento (Período Já Existe, Janela Ativa)
1. Usuário clica "Atualizar Avaliação Trimestral"
2. Backend valida:
   - Período existe?
   - Hoje está dentro da janela deste período?
   - Se sim: deleta snapshots antigos, cria novos com médias atuais
   - Se não: erro "Período já encerrado"
3. Atualiza `dataCongelamento = now()`, mantém `aberto = true`

**Recongelamento ilimitado:** Enquanto data de hoje estiver dentro da janela (90 dias), usuário pode clicar infinitas vezes e atualizar snapshots.

---

### 2.5. Encerramento Automático de Período

**Quando:** Data de hoje ultrapassa o fim da janela temporal.

**Exemplo:**
- Período 1: 15/02/2026 a 15/05/2026
- Hoje: 16/05/2026 (1 dia após fim da janela)
- Sistema marca: `aberto = false`
- Comportamento:
  - Não permite mais atualizar snapshots do Período 1
  - Botão passa a criar Período 2 (janela: 16/05 a 14/08)

**Lógica:**
```typescript
// Backend ao receber POST congelar
const periodoAtual = calcularPeriodoAtivo(hoje, primeiradata);
const periodoExistente = await findPeriodo(periodoAtual.dataReferencia);

if (periodoExistente && hoje > periodoExistente.janelaFim) {
  throw new BadRequestException(
    `Período ${periodoExistente.trimestre}/${periodoExistente.ano} já encerrado. ` +
    `Janela válida: ${format(periodoExistente.janelaInicio)} a ${format(periodoExistente.janelaFim)}`
  );
}
```

---

### 2.6. Badge Informativo (Tela de Notas)

**Localização:** Tela Diagnóstico Notas → Header (lado direito)

**Substituir botão "Iniciar Avaliação Trimestral" por:**

```html
<div class="badge bg-light text-dark d-flex flex-column align-items-start px-3 py-2">
  <div class="d-flex align-items-center gap-2 mb-1">
    <i class="feather icon-calendar icon-sm"></i>
    <strong>Período atual: 02/2026</strong>
  </div>
  <small class="text-muted">
    Próximos: 05/2026, 08/2026, 11/2026, 02/2027
  </small>
</div>
```

**Cálculo:**
```typescript
// Frontend
const primeiradata = getPrimeiraDataReferencia(); // da API
const hoje = new Date();
const periodoAtualCalculado = calcularPeriodo(hoje, primeiradata);

const proximosPeriodos = [];
for (let i = 1; i <= 4; i++) {
  const dataProximo = addDays(primeiradata, 90 * (numeroAtual + i));
  proximosPeriodos.push(format(dataProximo, 'MM/yyyy'));
}

// Exibir: "Próximos: 05/2026, 08/2026, 11/2026, 02/2027"
```

**Regras:**
- Sempre exibe 4 próximos períodos (cobre aprox. 12 meses)
- Formato: MM/AAAA
- Se não existir primeira data: badge oculto ou mensagem "Configure primeiro período na tela Evolução"

---

### 2.7. Botão na Tela de Evolução

**Texto dinâmico:**

```typescript
const periodo = await getPeriodoAtivo(hoje);

if (!periodo) {
  // Próximo período ainda não criado
  botaoTexto = "Adicionar Avaliação Trimestral";
  botaoClasse = "btn-primary";
} else if (periodo.aberto) {
  // Período existe e janela ativa
  botaoTexto = "Atualizar Avaliação Trimestral";
  botaoClasse = "btn-warning";
} else {
  // Período encerrado (fora da janela)
  botaoTexto = "Adicionar Avaliação Trimestral";
  botaoClasse = "btn-primary";
  // Ao clicar, cria próximo período automaticamente
}
```

---

## 3. Validações Implementadas

### V-PEVOL-JANELA-001: Primeira Data Obrigatória
**Condição:** `count(PeriodoAvaliacao WHERE empresaId = X) == 0`  
**Ação:** Exibir modal de escolha de data  
**Validação:** Data não pode ser vazia  

---

### V-PEVOL-JANELA-002: Cálculo Automático de Período
**Entrada:** Data de hoje  
**Saída:** Número do período esperado  
```typescript
const diasDesdePrimeiro = differenceInDays(hoje, primeiradata);
const numeroPeriodo = Math.floor(diasDesdePrimeiro / 90) + 1;
const dataRefEsperada = addDays(primeiradata, 90 * (numeroPeriodo - 1));
```

---

### V-PEVOL-JANELA-003: Validação Estrita de Janela
**Condição:** Usuário tenta congelar período fora da janela  
```typescript
const periodo = calcularPeriodoAtivo(hoje, primeiradata);
if (hoje < periodo.janelaInicio || hoje > periodo.janelaFim) {
  throw new BadRequestException(
    `Hoje (${format(hoje)}) está fora da janela do período ` +
    `${periodo.numero} (${format(periodo.janelaInicio)} - ${format(periodo.janelaFim)}). ` +
    `Aguarde próximo período.`
  );
}
```

---

### V-PEVOL-JANELA-004: Intervalo Mínimo de 90 Dias (Primeira Data)
**Condição:** Ao escolher primeira data de referência  
**Validação:** Data deve respeitar período de mentoria ativo  
```typescript
if (primeiradata < periodoMentoria.dataInicio || 
    primeiradata > periodoMentoria.dataFim) {
  throw new BadRequestException(
    `Data de referência deve estar dentro do período de mentoria ativo`
  );
}
```

---

## 4. Cenários de Uso

### Cenário 1: Empresa Nova (Sem Períodos)

**Passo 1:** Admin acessa tela Evolução  
**Passo 2:** Clica "Adicionar Avaliação Trimestral"  
**Passo 3:** Modal abre solicitando primeira data  
**Passo 4:** Admin escolhe: 15/02/2026  
**Passo 5:** Sistema cria Período 1 com snapshots  
**Resultado:**
- Período criado: 15/02/2026 (Q1/2026)
- Janela: 15/02 a 15/05 (aberto = true)
- Badge na tela notas: "Período atual: 02/2026 | Próximos: 05/2026, 08/2026, 11/2026, 02/2027"

---

### Cenário 2: Atualizar Médias Dentro da Janela

**Estado:** Período 1 já criado (15/02/2026)  
**Hoje:** 10/03/2026 (dentro da janela 15/02 a 15/05)  
**Ação:** Admin lança novas notas e clica "Atualizar Avaliação Trimestral"  
**Resultado:**
- Backend deleta 8 snapshots antigos do Período 1
- Cria 8 novos snapshots com médias atuais
- `dataCongelamento` atualizado para 10/03/2026 12:30
- Período continua `aberto = true`

---

### Cenário 3: Tentativa de Congelamento Fora da Janela

**Estado:** Período 1 criado (15/02/2026, janela: 15/02 a 15/05)  
**Hoje:** 17/05/2026 (2 dias APÓS fim da janela)  
**Ação:** Admin clica "Adicionar Avaliação Trimestral"  
**Resultado:**
- Backend calcula: hoje está na janela do Período 2 (16/05 a 14/08)
- Cria Período 2 (16/05/2026) com snapshots atuais
- Período 1 fica `aberto = false` (encerrado)
- Badge atualiza: "Período atual: 05/2026 | Próximos: 08/2026, 11/2026, 02/2027, 05/2027"

---

### Cenário 4: Regularidade Ao Longo do Ano

**Primeira data:** 15/02/2026

| Período | Data Ref Calculada | Janela Ativa | Trimestre |
|---------|-------------------|--------------|-----------|
| 1 | 15/02/2026 | 15/02 a 15/05 | Q1/2026 |
| 2 | 16/05/2026 | 16/05 a 14/08 | Q2/2026 |
| 3 | 14/08/2026 | 14/08 a 12/11 | Q3/2026 |
| 4 | 12/11/2026 | 12/11 a 10/02/2027 | Q4/2026 |
| 5 | 10/02/2027 | 10/02 a 11/05/2027 | Q1/2027 |

**Observação:** Intervalos perfeitamente regulares de 90 dias.

---

## 5. Comportamento Esperado (Frontend)

### Tela Diagnóstico Notas

**Remover:**
- ❌ Botão "Iniciar Avaliação Trimestral"
- ❌ Modal de iniciar período

**Adicionar:**
- ✅ Badge: "Período atual: MM/AAAA | Próximos: MM/AAAA, ..." (decisão GAP C: **oculto se não tem primeira data**)
- ✅ Cálculo frontend de períodos futuros (próximos 4)

**Lançamento de notas:**
- ✅ Sempre permitido (Opção B da pergunta 3)
- ✅ Não bloquear edição mesmo sem período criado
- ✅ Notas ficam armazenadas em RotinaEmpresa (independente de período)

**Badge sem primeira data (GAP C - Opção 1):**
```typescript
// Frontend
get temPrimeiraData(): boolean {
  return this.primeiroPeriodo !== null;
}
```
```html
<!-- Template -->
@if (temPrimeiraData) {
  <div class="badge bg-light text-dark">
    Período atual: {{ periodoAtualMes }}/{{ periodoAtualAno }}
    <small>Próximos: {{ proximosPeriodos.join(', ') }}</small>
  </div>
}
<!-- Badge completamente oculto se empresa não tem períodos -->
```

---

### Tela Diagnóstico Evolução

**Modificar botão:**
```typescript
// Lógica do botão
async congelarMedias(): Promise<void> {
  const primeiradata = await this.getPrimeiraDataReferencia();
  
  if (!primeiradata) {
    // Nenhum período existe, abrir modal de primeira data
    this.abrirModalPrimeiraData();
    return;
  }
  
  // Período já existe, fazer congelamento/recongelamento
  const periodoAtivo = this.calcularPeriodoAtivo(new Date(), primeiradata);
  
  // Chamar API para congelar
  this.periodosService.congelarOuAtualizar(this.empresaId, periodoAtivo).subscribe(...);
}
```

**Modal de primeira data (GAP A - Opção 1):**
```html
<div class="modal-body">
  <p>Esta é a primeira avaliação da empresa. Escolha a data de referência inicial:</p>
  <input type="date" [(ngModel)]="primeiraDataReferencia" />
  <small class="text-muted">
    Esta data definirá o ritmo trimestral (90 dias) de todas as avaliações futuras.
    Ao confirmar, o primeiro período será criado imediatamente com as médias atuais.
  </small>
</div>
```

**Comportamento ao confirmar (GAP A):**
1. Usuário clica "Confirmar"
2. Frontend chama `POST /empresas/:id/periodos-avaliacao/primeira-data`
3. **Backend cria período + snapshots imediatamente** (não aguarda segundo clique)
4. Modal fecha, gráfico já exibe primeiro ponto
5. Badge aparece automaticamente

---

## 6. Comportamento Esperado (Backend)

### Novo Endpoint: POST /empresas/:id/periodos-avaliacao/congelar-auto

**Body:** vazio (sistema calcula tudo automaticamente)

**Lógica:**
```typescript
async congelarAutomatico(empresaId: string, user: RequestUser) {
  // 1. Buscar primeira data de referência
  const primeiroPeriodo = await this.prisma.periodoAvaliacao.findFirst({
    where: { empresaId },
    orderBy: { dataReferencia: 'asc' }
  });

  if (!primeiroPeriodo) {
    throw new BadRequestException(
      'Nenhum período encontrado. Configure a primeira data de referência.'
    );
  }

  const primeiradata = primeiroPeriodo.dataReferencia;
  const hoje = nowInSaoPaulo();

  // 2. Calcular período ativo
  const diasDesdePrimeiro = differenceInDays(hoje, primeiradata);
  const numeroPeriodo = Math.floor(diasDesdePrimeiro / 90) + 1;
  const dataRefEsperada = addDays(primeiradata, 90 * (numeroPeriodo - 1));
  const janelaInicio = dataRefEsperada;
  const janelaFim = addDays(dataRefEsperada, 89); // 90 dias - 1

  // 3. Validar janela
  if (hoje < janelaInicio || hoje > janelaFim) {
    throw new BadRequestException(
      `Hoje (${format(hoje, 'dd/MM/yyyy')}) está fora da janela do período ${numeroPeriodo}. ` +
      `Janela válida: ${format(janelaInicio, 'dd/MM/yyyy')} a ${format(janelaFim, 'dd/MM/yyyy')}`
    );
  }

  // 4. Buscar ou criar período
  const trimestre = getQuarter(dataRefEsperada);
  const ano = getYear(dataRefEsperada);
  
  let periodo = await this.prisma.periodoAvaliacao.findFirst({
    where: { 
      empresaId, 
      trimestre, 
      ano,
      dataReferencia: dataRefEsperada 
    }
  });

  if (!periodo) {
    // Primeiro congelamento deste período
    periodo = await this.prisma.periodoAvaliacao.create({
      data: {
        empresaId,
        trimestre,
        ano,
        dataReferencia: dataRefEsperada,
        aberto: true,
        dataInicio: hoje,
        dataCongelamento: hoje,
        createdBy: user.id
      }
    });
  } else {
    // Recongelamento
    // Deletar snapshots antigos
    await this.prisma.pilarEvolucao.deleteMany({
      where: { periodoAvaliacaoId: periodo.id }
    });
     (GAP B - Opção 2: pula pilares sem média)
  const pilares = await this.getPilaresComMedias(empresaId);
  const pilaresComNotas = pilares.filter(p => p.mediaCalculada !== null && p.mediaCalculada > 0);
  
  if (pilaresComNotas.length === 0) {
    throw new BadRequestException('Nenhuma nota foi lançada. Não é possível criar período sem médias.');
  }
  
  const snapshots = await Promise.all(
    pilaresComNotas.map(pilar => 
      this.prisma.pilarEvolucao.create({
        data: {
          pilarEmpresaId: pilar.id,
          periodoAvaliacaoId: periodo.id,
          mediaNotasovos snapshots
  const pilares = await this.getPilaresComMedias(empresaId);
  const snapshots = await Promise.all(
    pilares.map(pilar => 
      this.prisma.pilarEvolucao.create({
        data: {
          pilarEmpresaId: pilar.id,
          periodoAvaliacaoId: periodo.id,
          media: pilar.mediaCalculada,
          createdBy: user.id
        }
      })
    )
  );

  return { periodo, snapshots };
}
```

---

### Endpoint: POST /empresas/:id/periodos-avaliacao/primeira-data

**Body:** `{ dataReferencia: "2026-02-15" }`

**Lógica:**
```typescript
async criarPrimeiraData(empresaId: string, dto: PrimeiraDataDto, user: RequestUser) {
  // Validar que não existe período
  const count = await this.prisma.periodoAvaliacao.count({ where: { empresaId } });
  if (count > 0) {
    throw new BadRequestException('Empresa já possui períodos cadastrados');
  }

  // Validar período de mentoria
  const periodoMentoria = await this.prisma.periodoMentoria.findFirst({
    where: { empresaId, ativo: true }
  });

  if (!periodoMentoria) {
    throw new BadRequestException('Empresa não possui período de mentoria ativo');
  }

  const dataRef = parseDateInSaoPaulo(dto.dataReferencia);
  
  if (dataRef < periodoMentoria.dataInicio || dataRef > periodoMentoria.dataFim) {
    throw new BadRequestException(
      `Data de referência deve estar dentro do período de mentoria ativo`
    );
  }

  // Criar primeiro período imediatamente (como se fosse congelamento)
  const trimestre = getQuarter(dataRef);
  const ano = getYear(dataRef);
  const hoje = nowInSaoPaulo();

  const periodo = await this.prisma.periodoAvaliacao.create({
    data: {
      empresaId,
      periodoMentoriaId: periodoMentoria.id,
      trimestre,
      ano,
      dataReferencia: dataRef,
      aberto: true,
      dataInicio: hoje,médias atuais (GAP B - Opção 2: apenas pilares com notas)
  const pilares = await this.getPilaresComMedias(empresaId);
  const pilaresComNotas = pilares.filter(p => p.mediaCalculada !== null && p.mediaCalculada > 0);
  
  if (pilaresComNotas.length === 0) {
    throw new BadRequestException(
      'Nenhuma nota foi lançada ainda. Lance ao menos uma nota antes de criar o primeiro período.'
    );
  }
  
  const snapshots = await Promise.all(
    pilaresComNotas.map(pilar => 
      this.prisma.pilarEvolucao.create({
        data: {
          pilarEmpresaId: pilar.id,
          periodoAvaliacaoId: periodo.id,
          mediaNotasts = await Promise.all(
    pilares.map(pilar => 
      this.prisma.pilarEvolucao.create({
        data: {
          pilarEmpresaId: pilar.id,
          periodoAvaliacaoId: periodo.id,
          media: pilar.mediaCalculada,
          createdBy: user.id
        }
      })
    )
  );

  return { periodo, snapshots };
}
```

---
- `seed.ts` (atualizar para usar janelas temporais regulares)
  
- **Novos endpoints:**
  - `POST /empresas/:id/periodos-avaliacao/congelar-auto`
  - `POST /empresas/:id/periodos-avaliacao/primeira-data`
  - `GET /empresas/:id/periodos-avaliacao/primeira` (retorna primeira data ref)

- **Lógica removida:**
  - Endpoint antigo: `POST /empresas/:id/periodos-avaliacao` (com body dataReferencia)
  - Validação de escolha manual de data em cada período

- **Decisão de Migração (GAP D):**
  - **Sem migration** para períodos irregulares existentes
  - Legado permanece como está (base de teste)
  - Apenas **seed.ts será atualizado** para gerar períodos regulares (90 dias)
  - Empresas futuras seguirão nova regra automaticamente
- **Novos endpoints:**
  - `POST /empresas/:id/periodos-avaliacao/congelar-auto`
  - `POST /empresas/:id/periodos-avaliacao/primeira-data`
  - `GET /empresas/:id/periodos-avaliacao/primeira` (retorna primeira data ref)

- **Lógica removida:**
  - Endpoint antigo: `POST /empresas/:id/periodos-avaliacao` (com body dataReferencia)
  - Validação de escolha manual de data em cada período

---

### Frontend
- **Arquivos afetados:**
  - `diagnostico-notas.component.ts/html` (remover botão, adicionar badge)
  - `diagnostico-evolucao.component.ts/html` (modificar lógica do botão)
  - `periodos-avaliacao.service.ts` (novos métodos)

- **Novos métodos:**
  - `getPrimeiraDataReferencia(): Observable<Date>`
  - `congelarAutomatico(empresaId): Observable<Resultado>`
  - `criarPrimeiraData(empresaId, data): Observable<Resultado>`
  - `calcularPeriodoAtivo(hoje, primeiradata): PeriodoCalculado`
  - `calcularProximosPeriodos(primeiradata, quantidade): Date[]`

---

## 8. Riscos Identificados

### 🔴 Segurança

**R-SEG-001: Criação Massiva de Períodos**
- **Cenário:** Usuário malicioso clica botão repetidamente
- **Risco:** Criar múltiplos períodos/snapshots desnecessários
- **Mitigação:** 
  - Rate limiting no endpoint (1 req/minuto)
  - Validação: período já existe para esta janela? → retornar 409 Conflict

---

### ⚠️ RBAC

**R-RBAC-001: Validação de Permissão**
- **Cenário:** Usuário COLABORADOR tenta congelar médias
- **Risco:** Alterar histórico sem autorização
- **Mitigação:** Guards aplicados (ADMINISTRADOR, CONSULTOR, GESTOR apenas)

---

### ⚠️ Multi-tenant

**R-MTENANT-001: Isolamento de Primeira Data**
- **Cenário:** Duas empresas com primeira data diferente
- **Risco:** Cálculo errado de janela usando primeira data de outra empresa
- **Mitigação:** 
  - Sempre filtrar por `empresaId` ao buscar primeira data
  - Validar `user.empresaId == empresaId` (não-admin)

---

### ⚠️ UX

**R-UX-001: Confusão sobre Períodos Futuros**
- **Cenário:** Badge mostra "Próximos: 05/2026, 08/2026..." mas usuário acha que pode clicar
- **Risco:** Usuário tentar congelar período futuro fora da janela
- **Mitigação:** 
  - Tooltip explicando: "Próximos períodos só estarão disponíveis nas datas indicadas"
  - Mensagem de erro clara quando fora da janela
Decisões Técnicas Finais

### ✅ DECISÃO 1: Armazenamento de Primeira Data (BLOQUEADOR 1 RESOLVIDO)

**Decisão:** Calcular dinamicamente usando `MIN(dataReferencia)` de PeriodoAvaliacao

**Implementação:**
```typescript
async getPrimeiraDataReferencia(empresaId: string): Promise<Date | null> {
  const primeiroPeriodo = await this.prisma.periodoAvaliacao.findFirst({
    where: { empresaId },
    orderBy: { dataReferencia: 'asc' }
  });
  
  return primeiroPeriodo?.dataReferencia || null;
}
```

**Justificativa:**
- ✅ Sem campo adicional no schema
- ✅ Fonte única de verdade (PeriodoAvaliacao)
- ⚠️ Query extra em cada cálculo (aceitável - não é operação frequente)

---

### ✅ DECISÃO 2: Tratamento de Períodos Irregulares (BLOQUEADOR 2 RESOLVIDO)

**Decisão:** Sem migration. Apenas atualizar seed.ts

**Implementação:**
- Base atual é de **teste** → períodos irregulares não são problema
- Migration **NÃO será criada** para dados existentes
- `seed.ts` será atualizado para gerar períodos regulares (primeira + 90*N)
- Empresas futuras seguirão nova regra automaticamente

**Seed atualizado:**
```typescript
// seed.ts
const primeiraData = new Date('2025-01-15');
const periodos = [
  { dataReferencia: addDays(primeiraData, 0), trimestre: 1, ano: 2025 },   // 15/01
  { dataReferencia: addDays(primeiraData, 90), trimestre: 2, ano: 2025 },  // 15/04
  { dataReferencia: addDays(primeiraData, 180), trimestre: 3, ano: 2025 }, // 14/07
  { dataReferencia: addDays(primeiraData, 270), trimestre: 4, ano: 2025 }, // 12/10
];
```

**Justificativa:**
- ✅ Simplicidade (sem complexidade de migration)
- ✅ Base de teste controlada
- ✅ Produção futura terá dados corretos desde início

---

### ✅ DECISÃO 3: Criação Imediata no Primeiro Período (GAP A)

**Decisão:** Opção 1 - Criar período + snapshots imediatamente

**Comportamento:**
1. Modal de primeira data exibido (empresa sem períodos)
2. Usuário escolhe data
3. **Backend cria período + snapshots** na mesma requisição
4. Não há "segundo passo" ou clique adicional

**Justificativa:** UX mais fluida (menos cliques)

---

### ✅ DECISÃO 4: Pilares Sem Média (GAP B)

**Decisão:** Opção 2 - Pular pilares sem média

**Comportamento:**
```typescript
const pilaresComNotas = pilares.filter(p => p.mediaCalculada !== null && p.mediaCalculada > 0);
// Cria snapshots apenas de pilares com notas lançadas
```

**Validação adicional:**
```typescript
if (pilaresComNotas.length === 0) {
  throw new BadRequestException('Nenhuma nota lançada. Não é possível criar período sem médias.');
}
```

**Justificativa:** Evita snapshots com média 0 (sem significado analítico)

---

### ✅ DECISÃO 5: Badge Sem Primeira Data (GAP C)

**Decisão:** Opção 1 - Badge completamente oculto

**Implementação:**
```html
@if (temPrimeiraData) {
  <div class="badge">...</div>
}
<!-- Nada renderizado se empresa não tem períodos -->
```

**Justificativa:** UI mais limpa (não exibe badge vazio ou placeholder)res (não seguem intervalo de 90 dias).

**Exemplo:**
- Período 1: 31/03/2025
- Período 2: 15/05/2025 (45 dias depois, não 90)
- Período 3: 30/09/2025 (138 dias depois)

**Impacto:** Lógica de janela temporal falhará ao tentar calcular próximo período.

**Solução necessária:**
- Migration para recalcular datas ou marcar empresa como "modo legacy"
- OU: sistema detecta irregularidade e exige redefinir primeira data (apagar períodos antigos?)

**Decisão humana:**
- Como tratar períodos pré-existentes irregulares?
- Permitir coexistência de dois modos (legacy + janela temporal)?

---

## 10. Recomendações (Não Vinculantes)
✅ **APROVADO - Pronto para Implementação**

**Decisões finalizadas:**
- ✅ Armazenamento de primeira data: `MIN(dataReferencia)` (sem campo adicional)
- ✅ Migração: apenas seed.ts (sem migration para legado)
- ✅ Criação imediata: período + snapshots no primeiro clique
- ✅ Pilares sem média: pula na criação de snapshots
- ✅ Badge sem dados: oculto completamente

**Aprovação:**
- ✅ Decisões de negócio confirmadas (10 perguntas + 4 gaps)
- ✅ Decisões técnicas finalizadas (bloqueadores 1-2 resolvidos)
- ✅ Todos os riscos identificados e mitigados

**Status de bloqueadores:**
- ✅ BLOQUEADOR 1: RESOLVIDO (cálculo dinâmico)
- ✅ BLOQUEADOR 2: RESOLVIDO (sem migration necessária)

**Próximo passo:** Dev Agent Enhanced → Implementação

---

**Versão:** 2.0  
**Última atualização:** 2026-02-05  
**Status:** Especificação completa e aprovada
**Benefício:** Análise de frequência de atualizações, compliance.

**Schema:**
```prisma
model HistoricoCongelamento {
  id                  String @id @default(uuid())
  periodoAvaliacaoId  String
  dataCongelamento    DateTime
  snapshotsSubstituidos Int
  userId              String
  createdAt           DateTime @default(now())
}
```

---

### 🟡 REC-003: Validação de Médias Zeradas

**Sugestão:** Impedir congelamento se todas as médias forem 0 (nenhuma nota lançada).

**Benefício:** Evitar snapshots inúteis.

**Implementação:**
```typescript
const mediasValidas = pilares.filter(p => p.mediaCalculada > 0);
if (mediasValidas.length === 0) {
  throw new BadRequestException('Nenhuma nota lançada. Congele apenas após lançar notas.');
}
```

---

## 11. Observações Importantes

1. **Regularidade absoluta:** Primeira data define ritmo para sempre. Modificar primeira data requer decisão gerencial.

2. **Lançamento livre de notas:** Notas podem ser lançadas a qualquer momento, independente de período criado (decisão 3B).

3. **Badge não-interativo:** Períodos futuros exibidos no badge são apenas informativos (não são clicáveis).

4. **Recongelamento ilimitado:** Não há limite de vezes que usuário pode atualizar snapshots dentro da janela (decisão 8A).

5. **Validação estrita:** Sistema não permite "voltar no tempo" e congelar período passado (decisão 10A).

6. **Trimestre calculado:** Campo `trimestre` continua sendo calculado via `getQuarter(dataReferencia)`, mas perde relevância funcional (serve apenas para exibição).

---

## 12. Status da Regra

**Atual:** ⏳ **Proposta - Aguardando Implementação**

**Bloqueadores pendentes:**
- [ ] Decisão sobre campo `primeiraDataReferenciaAvaliacao` em Empresa
- [ ] Estratégia de migração para períodos irregulares existentes

**Aprovação:**
- ✅ Decisões de negócio confirmadas (perguntas 1-10)
- ⏳ Decisões técnicas pendentes (bloqueadores 1-2)

**Próximo passo:** Decisão humana sobre bloqueadores → Dev Agent Enhanced

---

**Versão:** 2.0  
**Última atualização:** 2026-02-05  
**Próxima revisão:** Após decisão de bloqueadores
