# ADR-007: Período de Mentoria de 1 Ano com Suporte a Renovações

**Data:** 2026-01-21  
**Status:** ✅ Aprovado  
**Decisor:** System Engineer + Product Owner  
**Agente:** System Engineer

---

## Contexto

### Requisito do Cliente

O cliente informou que a consultoria Reiche é contratada por empresas pelo período de **1 ano de mentoria**. Este período de 1 ano deve ser o âncora temporal para todo o sistema:

**Requisitos identificados:**
1. Dashboard do cliente é montado a partir da data de contratação (início da mentoria)
2. Períodos de avaliação (trimestres) devem ocorrer **dentro do período de 1 ano**
3. Edição de valores mensais de indicadores deve ser limitada ao **período de 1 ano** (ex: se contratou em maio/2026 → edição vai de maio/2026 a abril/2027)
4. Congelamento de notas e trimestres deve respeitar o período de mentoria
5. **Empresas podem renovar** a consultoria por mais 1 ano após término do período anterior
6. **Ao renovar, deve haver separação/filtro** para exibir dados de cada período (evitar mistura de 2+ anos de dados)
7. Campo `historico` em indicadores pode conter dados **anteriores** ao período de mentoria

### Problema Atual

Estrutura existente **não possui conceito de período de mentoria**:

```prisma
model Empresa {
  id          String @id @default(uuid())
  nome        String
  cnpj        String @unique
  // ... sem controle de período de mentoria
  
  periodosAvaliacao PeriodoAvaliacao[]
}

model IndicadorMensal {
  id String @id @default(uuid())
  indicadorCockpitId String
  mes Int?  // 1-12 (qualquer mês/ano sem restrição)
  ano Int
  meta       Float?
  realizado  Float?
  historico  Float?
  // ... sem vínculo com período de mentoria
}
```

**Limitações identificadas:**
- ❌ Não há controle de quando a mentoria inicia/termina
- ❌ Edição de indicadores permite qualquer mês/ano (sem âncora temporal)
- ❌ Períodos de avaliação (trimestres) podem ser criados fora do escopo de mentoria
- ❌ Impossível separar dados de múltiplas renovações (Ano 1 vs Ano 2)
- ❌ Não há rastreabilidade de histórico de mentorias anteriores

---

## Decisão

Criar tabela **`PeriodoMentoria`** para gerenciar ciclos de 1 ano de consultoria por empresa, com suporte a renovações e separação histórica.

### Estrutura de Dados

```prisma
model PeriodoMentoria {
  id String @id @default(uuid())

  empresaId String
  empresa   Empresa @relation(fields: [empresaId], references: [id], onDelete: Cascade)

  // Identificação do período
  numero         Int      // 1, 2, 3... (sequencial por empresa)
  dataInicio     DateTime // Ex: 2026-05-01 (quando contratou)
  dataFim        DateTime // Ex: 2027-04-30 (calculado: dataInicio + 1 ano)
  
  // Controle
  ativo          Boolean  @default(true) // Apenas 1 ativo por empresa
  dataContratacao DateTime @default(now()) // Quando foi contratado
  dataEncerramento DateTime? // Quando foi encerrado (renovação ou cancelamento)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?

  // Relations
  periodosAvaliacao PeriodoAvaliacao[] // Trimestres vinculados
  indicadoresMensais IndicadorMensal[] // Valores mensais vinculados

  @@unique([empresaId, numero]) // Evita duplicatas
  @@index([empresaId, ativo]) // Buscar período ativo rapidamente
  @@map("periodos_mentoria")
}

model Empresa {
  // ... campos existentes
  
  // Relations
  periodosMentoria PeriodoMentoria[] // ✅ NOVO
}

model PeriodoAvaliacao {
  // ... campos existentes
  
  // ✅ NOVO: vínculo com período de mentoria
  periodoMentoriaId String?
  periodoMentoria   PeriodoMentoria? @relation(fields: [periodoMentoriaId], references: [id], onDelete: Cascade)
  
  // VALIDAÇÃO: dataReferencia deve estar entre periodoMentoria.dataInicio e dataFim
}

model IndicadorMensal {
  // ... campos existentes
  
  // ✅ NOVO: vínculo com período de mentoria
  periodoMentoriaId String?
  periodoMentoria   PeriodoMentoria? @relation(fields: [periodoMentoriaId], references: [id], onDelete: Cascade)
  
  // VALIDAÇÃO: mes/ano devem estar entre periodoMentoria.dataInicio e dataFim
  
  @@unique([indicadorCockpitId, ano, mes, periodoMentoriaId]) // ✅ ALTERADO
}
```

### Regras de Negócio

**R-MENT-001: Criar Período de Mentoria**
- Apenas ADMINISTRADOR pode criar período de mentoria
- Período tem duração fixa de 1 ano (dataFim = dataInicio + 365 dias)
- `numero` é calculado automaticamente (max(numero) + 1 por empresa)
- Ao criar, período é marcado como `ativo = true`

**R-MENT-002: Apenas 1 Período Ativo por Empresa**
- Sistema valida que empresa tem no máximo 1 período com `ativo = true`
- Ao renovar, período anterior é encerrado (`ativo = false`, `dataEncerramento = now()`)

**R-MENT-003: Renovação de Mentoria**
- Administrador pode renovar mentoria antes ou após término do período atual
- Renovação = encerrar período atual + criar novo período (numero + 1)
- Novo período inicia em `dataFim + 1 dia` do período anterior (continuidade)

**R-MENT-004: Validação de Trimestres**
- Ao criar `PeriodoAvaliacao`, validar que `dataReferencia` está dentro de `periodoMentoria.dataInicio` e `dataFim`
- Endpoint retorna erro se trimestre for criado fora do período de mentoria

**R-MENT-005: Validação de Valores Mensais**
- Ao criar/editar `IndicadorMensal`, validar que `mes/ano` está dentro de `periodoMentoria.dataInicio` e `dataFim`
- Campo `historico` é **exceção** (pode conter dados anteriores)

**R-MENT-006: Filtro de Período no Frontend**
- Frontend exibe dropdown de seleção de período de mentoria
- Exibição: "Período 1 (Mai/26 - Abr/27)", "Período 2 (Mai/27 - Abr/28)"
- Ao trocar período, recarrega indicadores e trimestres vinculados

**R-MENT-007: Cálculo Dinâmico de Meses**
- Frontend calcula quais meses exibir baseado em `periodoMentoria.dataInicio` e `dataFim`
- Se período inicia em maio/2026 → exibir: Mai/26, Jun/26, Jul/26... Abr/27
- Headers dinâmicos no formato compacto: "Mai/26" (mês/ano)

---

## Consequências

### ✅ Positivas

1. **Separação clara de renovações**
   - Cada período de mentoria tem seus próprios dados isolados
   - Histórico completo preservado (períodos anteriores ficam registrados)
   - UX intuitiva (dropdown "Período 1", "Período 2")

2. **Validações automáticas**
   - Sistema impede criação de trimestres fora do período de mentoria
   - Edição de indicadores limitada ao período selecionado
   - Erro claro ao tentar acessar dados fora do escopo

3. **Escalabilidade**
   - Suporta N renovações sem limitação
   - Estrutura pronta para relatórios comparativos (Período 1 vs Período 2)

4. **Rastreabilidade**
   - Auditoria completa de quando cada mentoria foi contratada/encerrada
   - Possibilidade de calcular métricas por período (ROI, evolução)

5. **Compatibilidade com estrutura existente**
   - Não quebra lógica de trimestres (ADR-009 permanece válido)
   - Apenas adiciona camada de governança temporal

### ⚠️ Negativas

1. **Complexidade adicional**
   - 1 tabela a mais no schema
   - Relações adicionais em `PeriodoAvaliacao` e `IndicadorMensal`
   - Migration para vincular dados existentes

2. **Mudança no fluxo de UX**
   - Usuário precisa selecionar período antes de ver indicadores
   - Componentes precisam gerenciar estado de período selecionado

3. **Seed/Migration de dados**
   - Empresas existentes precisam ter período retroativo criado
   - Valores mensais existentes precisam ser vinculados ao período correto

### 🔄 Neutras

1. **Endpoints adicionais**
   - `GET /empresas/:id/periodos-mentoria` (listar períodos)
   - `POST /empresas/:id/periodos-mentoria` (criar/renovar)
   - `GET /empresas/:id/periodos-mentoria/ativo` (buscar ativo)

2. **Alteração em endpoints existentes**
   - `POST /periodos-avaliacao` → validar vínculo com mentoria
   - `PATCH /indicadores/:id/valores-mensais` → validar mes/ano dentro do período
   - `GET /cockpit-pilares/:id` → filtrar por `periodoMentoriaId`

---

## Alternativas Consideradas

### Opção A: Campos na Tabela Empresa (REJEITADA)

```prisma
model Empresa {
  dataInicioMentoria DateTime?
  dataFimMentoria    DateTime?
}
```

**Por que foi rejeitada:**
- ❌ **Não suporta múltiplas renovações** de forma nativa (ao renovar, perde dados anteriores)
- ❌ **Filtro de período complexo** (frontend precisa calcular manualmente ranges de datas)
- ❌ **Sem separação clara** entre Período 1 e Período 2 (dados misturados)
- ❌ **Escalabilidade limitada** (após 3-4 renovações, estrutura vira caos)

**Vantagens que tinha:**
- ✅ Migration mais simples (apenas 2 campos)
- ✅ Sem nova tabela

**Conclusão:** Vantagens não compensam limitações para requisito de renovação com separação.

---

### Opção B: Criar PeriodoMentoria[] (ESCOLHIDA)

**Por que foi escolhida:**
- ✅ **Suporta N renovações** de forma nativa e escalável
- ✅ **Filtro de período nativo** (dropdown simples no frontend)
- ✅ **Separação clara** de dados por período (isolamento completo)
- ✅ **Rastreabilidade histórica** (todos os períodos preservados)
- ✅ **Lógica de validação simplificada** (vínculo direto via FK)

**Desvantagens aceitas:**
- ⚠️ Migration um pouco mais complexa (1 tabela + relações)
- ⚠️ Componentes frontend precisam gerenciar período selecionado

**Conclusão:** Impacto adicional é aceitável dado os benefícios para o requisito de renovação.

---

## Impacto em Agentes Existentes

### Módulos Afetados

1. **Empresas**
   - Adicionar relação `periodosMentoria PeriodoMentoria[]`
   - Sem alteração em regras existentes

2. **Períodos de Avaliação**
   - Adicionar campo `periodoMentoriaId` (nullable para retrocompatibilidade)
   - Adicionar validação: `dataReferencia` deve estar dentro do período de mentoria
   - Atualizar `/docs/business-rules/periodo-avaliacao.md`

3. **Cockpit - Valores Mensais**
   - Adicionar campo `periodoMentoriaId` em `IndicadorMensal`
   - Adicionar validação: `mes/ano` deve estar dentro do período (exceto campo `historico`)
   - Atualizar `/docs/business-rules/cockpit-valores-mensais.md`

4. **Frontend - Gestão de Período no Wizard de Empresas**
   - **Etapa 2 do wizard:** incluir seção de Período de Mentoria
   - Campo date picker para `dataInicio` (obrigatório ao criar empresa)
   - Exibição automática de `dataFim` (calculado: dataInicio + 1 ano)
   - Modo edição: exibir período ativo + botão "Renovar Mentoria"
   - Ao finalizar wizard: criar empresa + criar período de mentoria

5. **Frontend - Lista de Empresas**
   - Coluna "Mentoria" exibindo status do período ativo
   - Badge: "Período X (Mai/26 - Abr/27)" ou "Sem mentoria ativa"

6. **Frontend - Edição de Valores Mensais**
   - Adicionar dropdown de seleção de período
   - Calcular meses dinamicamente baseado em `dataInicio/dataFim` do período
   - Headers dinâmicos (Mai/26, Jun/26... Abr/27)
   - Atualizar `/docs/conventions/matriz-indicadores-excel-like.md`

### Documentos a Criar/Atualizar

**Criar:**
- ✅ `/docs/business-rules/periodo-mentoria.md` (novo módulo)
- ✅ Este ADR

**Atualizar:**
- ⚠️ `/docs/business-rules/periodo-avaliacao.md` (adicionar R-PEVOL-XXX sobre validação de mentoria)
- ⚠️ `/docs/business-rules/cockpit-valores-mensais.md` (adicionar R-VLM-XXX sobre validação de mentoria)
- ⚠️ `/docs/architecture/backend.md` (incluir PeriodoMentoria no diagrama)
- ⚠️ `/docs/architecture/data.md` (atualizar ERD com nova tabela)
- ⚠️ `/docs/conventions/matriz-indicadores-excel-like.md` (UX de filtro de período)

---

## Migração/Transição

### Estratégia de Migração de Dados

**Fase 1: Criar tabela e relações**
```sql
-- Migration: criar periodos_mentoria
CREATE TABLE periodos_mentoria (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  data_inicio TIMESTAMP NOT NULL,
  data_fim TIMESTAMP NOT NULL,
  ativo BOOLEAN DEFAULT true,
  data_contratacao TIMESTAMP DEFAULT NOW(),
  data_encerramento TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (empresa_id, numero)
);

-- Migration: adicionar periodoMentoriaId em periodos_avaliacao
ALTER TABLE periodos_avaliacao 
ADD COLUMN periodo_mentoria_id UUID REFERENCES periodos_mentoria(id) ON DELETE CASCADE;

-- Migration: adicionar periodoMentoriaId em indicadores_mensais
ALTER TABLE indicadores_mensais 
ADD COLUMN periodo_mentoria_id UUID REFERENCES periodos_mentoria(id) ON DELETE CASCADE;

-- Migration: atualizar unique constraint em indicadores_mensais
ALTER TABLE indicadores_mensais DROP CONSTRAINT indicadores_mensais_indicador_cockpit_id_ano_mes_key;
ALTER TABLE indicadores_mensais 
ADD CONSTRAINT indicadores_mensais_unique 
UNIQUE (indicador_cockpit_id, ano, mes, periodo_mentoria_id);
```

**Fase 2: Seed de períodos retroativos**
```typescript
// Criar período inicial para empresas existentes
for (const empresa of empresas) {
  const dataInicio = empresa.createdAt; // Usar data de criação como início
  const dataFim = addYears(dataInicio, 1); // 1 ano depois
  
  await prisma.periodoMentoria.create({
    data: {
      empresaId: empresa.id,
      numero: 1,
      dataInicio,
      dataFim,
      ativo: true, // Período atual ativo
      dataContratacao: empresa.createdAt,
      createdBy: empresa.createdBy,
    }
  });
}
```

**Fase 3: Vincular dados existentes**
```typescript
// Vincular PeriodosAvaliacao ao período de mentoria correto
for (const periodoAvaliacao of periodosAvaliacao) {
  const periodoMentoria = await prisma.periodoMentoria.findFirst({
    where: {
      empresaId: periodoAvaliacao.empresaId,
      dataInicio: { lte: periodoAvaliacao.dataReferencia },
      dataFim: { gte: periodoAvaliacao.dataReferencia },
    }
  });
  
  if (periodoMentoria) {
    await prisma.periodoAvaliacao.update({
      where: { id: periodoAvaliacao.id },
      data: { periodoMentoriaId: periodoMentoria.id }
    });
  }
}

// Vincular IndicadorMensal ao período de mentoria correto
for (const indicador of indicadoresMensais) {
  const dataIndicador = new Date(indicador.ano, indicador.mes - 1);
  
  const periodoMentoria = await prisma.periodoMentoria.findFirst({
    where: {
      empresa: { cockpitPilares: { some: { indicadores: { some: { id: indicador.indicadorCockpitId } } } } },
      dataInicio: { lte: dataIndicador },
      dataFim: { gte: dataIndicador },
    }
  });
  
  if (periodoMentoria) {
    await prisma.indicadorMensal.update({
      where: { id: indicador.id },
      data: { periodoMentoriaId: periodoMentoria.id }
    });
  }
}
```

### Compatibilidade com Dados Existentes

**Empresas sem período de mentoria:**
- Ao acessar indicadores, sistema cria período retroativo automaticamente
- `dataInicio = empresa.createdAt`, `dataFim = createdAt + 1 ano`, `numero = 1`, `ativo = true`

**Indicadores com mês/ano fora do período:**
- Campo `historico` **não valida** (pode ter dados anteriores)
- Campos `meta` e `realizado` **validam** (apenas dentro do período)

---

## Riscos de Governança

### Risco 1: Dados Órfãos Após Migration
**Problema:** Indicadores mensais ou trimestres sem vínculo com período de mentoria

**Mitigação:**
- Migration incluir script de vinculação automática
- Validação pós-migration: listar registros com `periodoMentoriaId = null`
- Criar período retroativo se necessário

---

### Risco 2: Empresas com Múltiplos Períodos Ativos
**Problema:** Bug na lógica permitir `ativo = true` em múltiplos períodos

**Mitigação:**
- Unique index em `periodos_mentoria` → `(empresaId, ativo)` WHERE ativo = true (PostgreSQL partial index)
- Validação no service antes de criar período
- Teste unitário específico para esta regra

---

### Risco 3: Confusão entre Trimestre e Período de Mentoria
**Problema:** Usuários confundirem "Período de Avaliação" (trimestre) com "Período de Mentoria" (1 ano)

**Mitigação:**
- Naming claro: "Período de Mentoria", "Trimestre de Avaliação"
- UX: dropdown separado e bem rotulado
- Documentação de usuário final (fora do escopo técnico)

---

## Próximos Passos

1. ✅ **ADR aprovado** (este documento)
2. ⏭️ **Business Rules Extractor** → criar `/docs/business-rules/periodo-mentoria.md`
3. ⏭️ **Business Rules Extractor** → atualizar regras de `periodo-avaliacao.md` e `cockpit-valores-mensais.md`
4. ⏭️ **Dev Agent** → implementar backend (migration + service + controller + DTOs)
5. ⏭️ **Dev Agent** → implementar frontend (componentes + filtro de período)
6. ⏭️ **Pattern Enforcer** → validar convenções
7. ⏭️ **QA Unitário** → testar regras de validação
8. ⏭️ **QA E2E** → testar fluxo completo de renovação e filtro

---

## Referências

- **ADR-009:** Período de Avaliação Trimestral (estrutura de trimestres mantida)
- **ADR-003:** Cockpit Pilares Architecture (estrutura de indicadores mantida)
- **ADR-006:** Arquitetura Matriz Indicadores (UX de edição mantida, adicionado filtro)

---

**Versão:** 1.0  
**Criado em:** 2026-01-21  
**Última atualização:** 2026-01-21  
**Revisores:** Product Owner  
**Implementado:** Pendente
