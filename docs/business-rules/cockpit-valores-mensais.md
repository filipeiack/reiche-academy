# Regra: Edição de Valores Mensais e Cálculos de Desempenho

## Contexto
Módulo Cockpit de Pilares - Edição de Valores Mensais
Frontend: Componente `edicao-valores-mensais`
Backend: Método `updateValoresMensais`

## Descrição
Implementa edição inline de meta, realizado e histórico para cada mês (jan-dez), com replicação automática de metas, cálculo de desvio e status visual de desempenho.

## Condição
Aplicada quando usuário:
- Altera valor de **meta**, **realizado** ou **histórico** em qualquer mês
- Preenche meta em um mês (trigger replicação para meses seguintes)
- Visualiza desvio e status calculados automaticamente

## Comportamento Implementado

### 1. Edição de Valores com Auto-save

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`

**Método:** `onValorChange()`, `executeSave()`

**Regra:**
- **Input type="number"** para cada campo (meta, realizado, histórico)
- **Debounce de 1000ms** após digitação
- **Cache local** de valores em edição (Map) para recálculo imediato
- **Atualização otimista:** valor atualizado localmente antes de salvar no backend
- **Persistência via PATCH** endpoint `/indicadores/:id/valores-mensais`
- **Feedback centralizado** (via `SaveFeedbackService`)

**Código implementado:**
```typescript
onValorChange(
  indicadorMensal: IndicadorMensal,
  campo: 'meta' | 'realizado' | 'historico',
  event: Event
): void {
  const input = event.target as HTMLInputElement;
  const valor = input.value ? parseFloat(input.value) : null;

  // Atualizar valor localmente para recálculo imediato
  indicadorMensal[campo] = valor ?? undefined;

  // Se for meta, replicar para meses seguintes
  if (campo === 'meta' && valor !== null) {
    this.replicarMetaParaMesesSeguintes(indicadorMensal, valor);
  }

  // Atualizar cache local
  const cacheKey = indicadorMensal.id;
  if (!this.valoresCache.has(cacheKey)) {
    this.valoresCache.set(cacheKey, {});
  }
  const cached = this.valoresCache.get(cacheKey)!;
  cached[campo] = valor ?? undefined;

  // Agendar auto-save
  this.autoSaveSubject.next({
    indicadorMensalId: indicadorMensal.id,
    campo,
    valor,
  });
}

private executeSave(
  indicadorMensalId: string,
  campo: 'meta' | 'realizado' | 'historico',
  valor: number | null
): void {
  this.savingCount++;
  if (this.savingCount === 1) {
    this.saveFeedbackService.startSaving('Valores mensais');
  }

  // Preparar payload com cache
  const cached = this.valoresCache.get(indicadorMensalId) || {};
  const payload = {
    valores: [
      {
        mes: mes.mes,
        ano: mes.ano,
        meta: cached.meta ?? mes.meta ?? undefined,
        realizado: cached.realizado ?? mes.realizado ?? undefined,
        historico: cached.historico ?? mes.historico ?? undefined,
      },
    ],
  };

  this.cockpitService.updateValoresMensais(indicadorId, payload).subscribe({
    next: () => {
      this.savingCount--;
      if (this.savingCount === 0) {
        this.saveFeedbackService.completeSaving();
      }
      this.valoresCache.delete(indicadorMensalId);
    },
    error: (err: unknown) => {
      console.error('Erro ao salvar valor mensal:', err);
      alert('Erro ao salvar. Tente novamente.');
      this.savingCount--;
      if (this.savingCount === 0) {
        this.saveFeedbackService.reset();
      }
    },
  });
}
```

---

### 2. Replicação Automática de Meta

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`

**Método:** `replicarMetaParaMesesSeguintes()`

**Regra:**
- **Trigger:** Quando usuário preenche campo **meta** em qualquer mês
- **Ação:** Copia o valor para **todos os meses seguintes** (mes > mesAtual)
- **Exemplo:** Preencher meta em JAN → copia para FEV, MAR, ABR... DEZ
- **Atualização em lote:** Um único request PATCH com array de valores
- **Atualização local imediata** (UX responsiva)
- **NÃO afeta:** Resumo anual (mes = null)

**Código implementado:**
```typescript
private replicarMetaParaMesesSeguintes(
  mesAtual: IndicadorMensal,
  valorMeta: number
): void {
  // Encontrar o indicador que contém este mês
  const indicador = this.indicadores.find(ind => 
    ind.mesesIndicador?.some(m => m.id === mesAtual.id)
  );

  if (!indicador || !indicador.mesesIndicador) return;

  // Coletar todos os meses seguintes
  const mesesSeguintes = indicador.mesesIndicador
    .filter(m => m.mes !== null && m.mes! > mesAtual.mes!);

  if (mesesSeguintes.length === 0) return;

  // Atualizar valores localmente
  mesesSeguintes.forEach(m => {
    m.meta = valorMeta;
  });

  // Preparar payload com todos os meses
  const valores = mesesSeguintes.map(m => ({
    mes: m.mes!,
    ano: m.ano!,
    meta: valorMeta,
    realizado: m.realizado ?? undefined,
  }));

  // Salvar todos de uma vez
  this.cockpitService.updateValoresMensais(indicador.id, { valores }).subscribe({
    next: () => {
      this.saveFeedbackService.completeSaving();
    },
    error: (err: unknown) => {
      console.error('Erro ao replicar meta:', err);
      alert('Erro ao replicar meta. Tente novamente.');
    },
  });
}
```

---

### 3. Atualização Simplificada de Valores Mensais

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `updateValoresMensais()`

**Regra Atualizada:**
- **Valores mensais (meta, realizado)** podem ser atualizados sem validação de período de mentoria
- **Campo historico** aceita qualquer valor (inclusive dados anteriores)
- **Frontend exibe valores dos últimos 13 meses** independente de período

> ⚠️ **IMPORTANTE:** Esta seção foi atualizada para refletir a implementação real. A validação com período de mentoria (R-MENT-008) foi removida conforme documentado em [cockpit-indicadores-mensais.md](./cockpit-indicadores-mensais.md). O controle de períodos agora é feito através do botão "Novo ciclo de 12 meses".

**Implementação Atual:**

```typescript
async updateValoresMensais(
  indicadorId: string,
  dto: UpdateValoresMensaisDto,
  user: RequestUser,
): Promise<IndicadorCockpit> {
  // 1. Validar indicador e acesso
  const indicador = await this.prisma.indicadorCockpit.findUnique({
    where: { id: indicadorId },
  });

  if (!indicador) {
    throw new NotFoundException('Indicador não encontrado');
  }

  await this.validateCockpitAccess(indicador.cockpitPilarId, user);

  // 2. Atualizar cada valor mensal (sem validação de período)
  const updates = dto.valores.map(async (valor) => {
    // Buscar ou criar mês
    const mes = await this.prisma.indicadorMensal.findFirst({
      where: {
        indicadorCockpitId: indicadorId,
        ano: valor.ano,
        mes: valor.mes,
      },
    });

    if (mes) {
      // Atualizar existente
      return this.prisma.indicadorMensal.update({
        where: { id: mes.id },
        data: {
          meta: valor.meta,
          realizado: valor.realizado,
          historico: valor.historico,
          updatedBy: user.id,
        },
      });
    } else {
      // Criar novo
      return this.prisma.indicadorMensal.create({
        data: {
          indicadorCockpitId: indicadorId,
          ano: valor.ano,
          mes: valor.mes,
          meta: valor.meta,
          realizado: valor.realizado,
          historico: valor.historico,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
    }
  });

  await Promise.all(updates);

  // Retornar meses atualizados
  return this.prisma.indicadorCockpit.findMany({
    where: {
      indicadorCockpitId: indicadorId,
    },
    orderBy: [{ ano: 'desc' }, { mes: 'asc' }],
  });
}
```

**Frontend - Exibição de Meses:**
- Componente `edicao-valores-mensais` exibe **últimos 13 meses** disponíveis
- Não há dropdown de seleção de período
- Controle de períodos feito através do botão "Novo ciclo de 12 meses"

**Referências:**
- ✅ **Removido:** Validação R-MENT-008 (período de mentoria)
- ✅ **Novo Sistema:** [cockpit-indicadores-mensais.md](./cockpit-indicadores-mensais.md)
- ✅ **Implementado:** Botão "Novo ciclo de 12 meses"

---

### 4. Cálculo de Desvio (Absoluto e Percentual)

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`

**Método:** `calcularDesvio()`, `calcularDesvioAbsoluto()`

**Regra:**
- **Condição:** Requer meta E realizado preenchidos
- **Fórmula depende de `indicador.melhor`:**

#### Para `melhor = MAIOR` (quanto maior, melhor):
- **Desvio %:** `((realizado - meta) / meta) * 100`
- **Desvio Absoluto:** `realizado - meta`
- **Exemplo:**
  - Meta: 100, Realizado: 120 → Desvio: **+20%** (positivo = bom)
  - Meta: 100, Realizado: 80 → Desvio: **-20%** (negativo = ruim)

#### Para `melhor = MENOR` (quanto menor, melhor):
- **Desvio %:** `((meta - realizado) / meta) * 100`
- **Desvio Absoluto:** `meta - realizado`
- **Exemplo:**
  - Meta: 10, Realizado: 8 → Desvio: **+20%** (positivo = bom)
  - Meta: 10, Realizado: 12 → Desvio: **-20%** (negativo = ruim)

**Código implementado:**
```typescript
calcularDesvio(indicador: IndicadorCockpit, mes: IndicadorMensal): number {
  const meta = this.getValorAtualizado(mes, 'meta');
  const realizado = this.getValorAtualizado(mes, 'realizado');
  
  if (!meta || !realizado) return 0;

  if (indicador.melhor === DirecaoIndicador.MAIOR) {
    return ((realizado - meta) / meta) * 100;
  } else {
    return ((meta - realizado) / meta) * 100;
  }
}

calcularDesvioAbsoluto(indicador: IndicadorCockpit, mes: IndicadorMensal): number {
  const meta = this.getValorAtualizado(mes, 'meta');
  const realizado = this.getValorAtualizado(mes, 'realizado');
  
  if (!meta || !realizado) return 0;

  if (indicador.melhor === DirecaoIndicador.MAIOR) {
    return realizado - meta;
  } else {
    return meta - realizado;
  }
}
```

---

### 5. Cálculo de Status Visual

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`

**Método:** `calcularStatus()`

**Regra:**
- **Condição:** Requer meta E realizado preenchidos
- **Lógica simplificada implementada:**

#### Para `melhor = MAIOR`:
- Se `realizado ≥ meta` → **success** (verde)
- Se `realizado < meta` → **danger** (vermelho)

#### Para `melhor = MENOR`:
- Se `realizado ≤ meta` → **success** (verde)
- Se `realizado > meta` → **danger** (vermelho)

**⚠️ Observação:** Código atual **NÃO implementa** status "warning" (amarelo) para desempenho intermediário (≥80% meta). Apenas verde/vermelho.

**Código implementado:**
```typescript
calcularStatus(
  indicador: IndicadorCockpit,
  mes: IndicadorMensal
): 'success' | 'warning' | 'danger' | null {
  const meta = this.getValorAtualizado(mes, 'meta');
  const realizado = this.getValorAtualizado(mes, 'realizado');
  
  if (!meta || !realizado) return null;

  const percentual = (realizado / meta) * 100;

  if (indicador.melhor === DirecaoIndicador.MAIOR) {
    if (percentual >= 100) return 'success';
    return 'danger';
  } else {
    // Para MENOR, quanto menor melhor
    if (percentual <= 100) return 'success';
    return 'danger';
  }
}
```

---

### 6. Persistência no Backend (Batch Update)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `updateValoresMensais()`

**Regra:**
- **Aceita array de valores** (`UpdateValoresMensaisDto.valores[]`)
- Para cada valor no array:
  - **Busca** `IndicadorMensal` por `indicadorCockpitId + ano + mes`
  - **Se existe:** atualiza (PATCH)
  - **Se não existe:** cria (POST)
- **Atomicidade:** `Promise.all()` garante que todos sejam processados
- **Retorna:** Array completo de `IndicadorMensal` atualizado

**Código implementado:**
```typescript
async updateValoresMensais(
  indicadorId: string,
  dto: UpdateValoresMensaisDto,
  user: RequestUser,
) {
  const indicador = await this.prisma.indicadorCockpit.findUnique({
    where: { id: indicadorId },
  });

  if (!indicador) {
    throw new NotFoundException('Indicador não encontrado');
  }

  await this.validateCockpitAccess(indicador.cockpitPilarId, user);

  // Atualizar cada valor mensal
  const updates = dto.valores.map(async (valor) => {
    // Buscar ou criar mês
    const mes = await this.prisma.indicadorMensal.findFirst({
      where: {
        indicadorCockpitId: indicadorId,
        ano: valor.ano,
        mes: valor.mes,
      },
    });

    if (mes) {
      // Atualizar existente
      return this.prisma.indicadorMensal.update({
        where: { id: mes.id },
        data: {
          meta: valor.meta,
          realizado: valor.realizado,
          historico: valor.historico,
          updatedBy: user.id,
        },
      });
    } else {
      // Criar novo
      return this.prisma.indicadorMensal.create({
        data: {
          indicadorCockpitId: indicadorId,
          ano: valor.ano,
          mes: valor.mes,
          meta: valor.meta,
          realizado: valor.realizado,
          historico: valor.historico,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
    }
  });

  await Promise.all(updates);

  // Retornar meses atualizados
  return this.prisma.indicadorMensal.findMany({
    where: {
      indicadorCockpitId: indicadorId,
    },
    orderBy: [{ ano: 'desc' }, { mes: 'asc' }],
  });
}
```

---

### 7. Exibição Visual no Template

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html`

**Elementos visuais:**

- **Ícone Melhor:** ↑ (MAIOR) ou ↓ (MENOR)
- **Inputs numéricos:** Meta, Realizado, Histórico
- **Badge de Desvio:**
  - Exibe desvio absoluto e percentual
  - Cor baseada em status: `bg-success`, `bg-warning`, `bg-danger`
- **Ícone de Status:**
  - ✓ (verde) = Meta atingida
  - ⚠ (amarelo) = Desempenho intermediário (NÃO implementado no cálculo atual)
  - ✗ (vermelho) = Abaixo da meta

---

## Restrições

1. **Valores numéricos:** Meta, realizado, histórico aceitam apenas números
2. **Replicação de meta:** Apenas para meses **seguintes** (mes > atual)
3. **Cálculo de desvio:** Requer meta E realizado preenchidos
4. **Status visual:** Implementado como binário (verde/vermelho) sem faixa intermediária
5. **Auto-save:** Debounce 1s, salvamento individual por campo alterado
6. **Batch update:** Backend aceita múltiplos valores em um request

---

## Fonte no Código

- **Frontend Edição Valores:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`
  - Linhas: 86-113 (`onValorChange`)
  - Linhas: 115-168 (`executeSave`)
  - Linhas: 170-214 (`replicarMetaParaMesesSeguintes`)
  - Linhas: 216-268 (`calcularDesvio`, `calcularDesvioAbsoluto`, `calcularStatus`)

- **Backend Service:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`
  - Linhas: 568-644 (`updateValoresMensais`)

- **Template HTML:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html`
  - Inputs numéricos, badges de desvio, ícones de status

---

## Observações

-  **Regra extraída por engenharia reversa**
- Lógica de cálculo difere conforme `indicador.melhor` (MAIOR vs MENOR)
- Replicação de meta otimiza preenchimento de valores projetados
- Status visual binário (verde/vermelho) - NÃO há amarelo implementado no cálculo
- Cache local garante recálculo imediato sem esperar backend
- Backend usa upsert (update se existe, create se não existe)
- **🔄 ATUALIZAÇÃO IMPORTANTE (2026-01-27):** Validação com período de mentoria (R-MENT-008) foi removida. Controle de períodos agora através de ciclos manuais conforme [cockpit-indicadores-mensais.md](./cockpit-indicadores-mensais.md)
