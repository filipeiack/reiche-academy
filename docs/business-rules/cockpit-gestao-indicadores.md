# Regra: Gestão de Indicadores no Cockpit

## Contexto
Módulo Cockpit de Pilares - CRUD completo de Indicadores
Frontend: Gestão Indicadores Component
Backend: CockpitPilaresService

> ⚙️ Regras recentes sobre ciclos e exibição dos meses mensais estão centralizadas em [cockpit-indicadores-mensais](cockpit-indicadores-mensais.md).

## Descrição
Implementa criação, edição, exclusão e reordenação de indicadores customizados com validações de unicidade, auto-criação de estrutura mensal e persistência automática.

## Condição
Aplicada quando usuário:
- Adiciona novo indicador
- Edita propriedades de indicador existente
- Remove indicador
- Reordena indicadores via drag-and-drop
- Altera campo individual (trigger auto-save)

## Comportamento Implementado

### 1. Criação de Indicador + Meses Condicionais por Referência

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `createIndicador()`

**Regra:**
- Validação de nome único por cockpit (case-sensitive)
- Se nome já existe (ativo): lança `ConflictException` "Já existe um indicador com este nome neste cockpit"
- Cálculo automático de ordem: `maxOrdem + 1` (ou 1 se primeiro)
- **Criação condicional de `IndicadorMensal`:**
  - Se o `CockpitPilar` já tiver `dataReferencia` definida, criar 12 meses consecutivos a partir do mês/ano da referência
  - Se não houver referência definida, **não** criar meses automaticamente
  - Sem criação de resumo anual (`mes = null`)
  - Valores vazios: `meta`, `realizado`, `historico` = null
- Retorna indicador completo com `mesesIndicador[]` incluídos

**Código implementado:**
```typescript
async createIndicador(
  cockpitId: string,
  dto: CreateIndicadorCockpitDto,
  user: RequestUser,
) {
  const cockpit = await this.validateCockpitAccess(cockpitId, user);

  // Validar nome único por cockpit
  const existing = await this.prisma.indicadorCockpit.findFirst({
    where: {
      cockpitPilarId: cockpitId,
      nome: dto.nome,
      ativo: true,
    },
  });

  if (existing) {
    throw new ConflictException(
      'Já existe um indicador com este nome neste cockpit',
    );
  }

  // Calcular ordem
  const maxOrdem = await this.prisma.indicadorCockpit.findFirst({
    where: {
      cockpitPilarId: cockpitId,
      ativo: true,
    },
    orderBy: { ordem: 'desc' },
    select: { ordem: true },
  });

  const ordem = dto.ordem ?? (maxOrdem ? maxOrdem.ordem + 1 : 1);

  // Criar indicador
  const indicador = await this.prisma.indicadorCockpit.create({
    data: {
      cockpitPilarId: cockpitId,
      nome: dto.nome,
      descricao: dto.descricao,
      tipoMedida: dto.tipoMedida,
      statusMedicao: dto.statusMedicao,
      responsavelMedicaoId: dto.responsavelMedicaoId,
      melhor: dto.melhor,
      ordem,
      createdBy: user.id,
      updatedBy: user.id,
    },
  });

  // Criar meses apenas se houver referencia definida no cockpit
  if (cockpit?.dataReferencia) {
    const dataReferencia = new Date(cockpit.dataReferencia);
    const mesReferencia = dataReferencia.getMonth() + 1;
    const anoReferencia = dataReferencia.getFullYear();
    const meses = [];

    for (let i = 0; i < 12; i++) {
      let mes = mesReferencia + i;
      let ano = anoReferencia;

      if (mes > 12) {
        mes = mes - 12;
        ano++;
      }

      meses.push({
        indicadorCockpitId: indicador.id,
        mes,
        ano,
        createdBy: user.id,
        updatedBy: user.id,
      });
    }

    await this.prisma.indicadorMensal.createMany({
      data: meses,
    });
  }

  // Retornar indicador com meses
  return this.prisma.indicadorCockpit.findUnique({
    where: { id: indicador.id },
    include: {
      responsavelMedicao: {
        select: {
          id: true,
          nome: true,
          email: true,
        },
      },
      mesesIndicador: {
        orderBy: [{ ano: 'desc' }, { mes: 'asc' }],
      },
    },
  });
}
```

---

### 2. Atualização de Indicador

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `updateIndicador()`

**Regra:**
- Validação de existência do indicador
- Se alterando nome:
  - Validação de unicidade (excluindo próprio indicador: `id: { not: indicadorId }`)
  - Se nome já usado: lança `ConflictException`
- Validação de responsável (mesma empresa - já documentada em outro arquivo)
- Atualiza apenas campos fornecidos (partial update)
- Registra auditoria

**Código implementado:**
```typescript
async updateIndicador(
  indicadorId: string,
  dto: UpdateIndicadorCockpitDto,
  user: RequestUser,
) {
  const indicador = await this.prisma.indicadorCockpit.findUnique({
    where: { id: indicadorId },
    include: {
      cockpitPilar: {
        include: {
          pilarEmpresa: {
            include: {
              empresa: true,
            },
          },
        },
      },
    },
  });

  if (!indicador) {
    throw new NotFoundException('Indicador não encontrado');
  }

  await this.validateCockpitAccess(indicador.cockpitPilarId, user);

  // Validar nome único por cockpit (se alterando)
  if (dto.nome && dto.nome !== indicador.nome) {
    const existing = await this.prisma.indicadorCockpit.findFirst({
      where: {
        cockpitPilarId: indicador.cockpitPilarId,
        nome: dto.nome,
        ativo: true,
        id: { not: indicadorId },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Já existe um indicador com este nome neste cockpit',
      );
    }
  }

  const updated = await this.prisma.indicadorCockpit.update({
    where: { id: indicadorId },
    data: {
      ...dto,
      updatedBy: user.id,
    },
  });

  return updated;
}
```

---

### 3. Exclusão de Indicador (Soft Delete)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `deleteIndicador()`

**Regra:**
- Validação de existência e acesso
- **Soft delete:** define `ativo = false` (NÃO remove do banco)
- Valores mensais são preservados (podem ser recuperados)
- Registra auditoria
- Retorna mensagem de confirmação

**Código implementado:**
```typescript
async deleteIndicador(indicadorId: string, user: RequestUser) {
  const indicador = await this.prisma.indicadorCockpit.findUnique({
    where: { id: indicadorId },
  });

  if (!indicador) {
    throw new NotFoundException('Indicador não encontrado');
  }

  await this.validateCockpitAccess(indicador.cockpitPilarId, user);

  await this.prisma.indicadorCockpit.update({
    where: { id: indicadorId },
    data: {
      ativo: false,
      updatedBy: user.id,
    },
  });

  return { message: 'Indicador desativado com sucesso' };
}
```

---

### 4. Auto-save no Frontend

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`

**Método:** `setupAutoSave()`, `onCellBlur()`

**Regra:**
- **Debounce de 1000ms** após perda de foco (`blur`) em qualquer campo
- **Validação antes de salvar:** campos obrigatórios (`nome`, `tipoMedida`, `melhor`)
- **Operação determinada automaticamente:**
  - Se `indicador.isNew === true`: POST (criar)
  - Se `indicador.isNew === false`: PATCH (atualizar)
- **Feedback visual centralizado** (via `SaveFeedbackService`)
- **Mantém linha em edição** após auto-save (UX contínua)

**Código implementado:**
```typescript
private setupAutoSave(): void {
  this.autoSaveSubscription = this.autoSaveSubject
    .pipe(
      debounceTime(1000),
      distinctUntilChanged(
        (prev, curr) =>
          prev.indicador.id === curr.indicador.id && prev.field === curr.field
      )
    )
    .subscribe(({ indicador }) => {
      this.saveIndicador(indicador);
    });
}

onCellBlur(indicador: IndicadorExtended, field: string): void {
  if (!this.isValidForSave(indicador)) {
    return; // Não salva se inválido
  }

  // Envia para subject (debounce 1000ms)
  this.autoSaveSubject.next({ indicador, field });
}

isValidForSave(indicador: IndicadorExtended): boolean {
  return !!(indicador.nome?.trim() && indicador.tipoMedida && indicador.melhor);
}
```

---

### 5. Reordenação via Drag-and-Drop

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`

**Método:** `onDrop()`, `saveOrdem()`

**Regra:**
- Usa Angular CDK Drag-Drop
- Move item no array local: `moveItemInArray()`
- **Recalcula campo `ordem`** sequencialmente (1, 2, 3, ...)
- **Salva nova ordem automaticamente** para todos os indicadores afetados
- Atualiza via PATCH individual para cada indicador
- Feedback de sucesso/erro via toast

**Código implementado:**
```typescript
onDrop(event: CdkDragDrop<IndicadorExtended[]>): void {
  if (event.previousIndex !== event.currentIndex) {
    moveItemInArray(this.indicadores, event.previousIndex, event.currentIndex);

    // Atualizar campo ordem
    this.indicadores.forEach((ind, idx) => {
      ind.ordem = idx + 1;
    });

    // Salvar nova ordem automaticamente
    this.saveOrdem();
  }
}

private async saveOrdem(): Promise<void> {
  try {
    // Atualizar ordem de cada indicador que já foi salvo no backend
    const updatePromises = this.indicadores
      .filter(ind => !ind.isNew && ind.id) // Apenas indicadores já salvos
      .map(ind => 
        this.cockpitService.updateIndicador(ind.id, { ordem: ind.ordem }).toPromise()
      );

    await Promise.all(updatePromises);
    
    this.showToast('Ordem dos indicadores atualizada com sucesso.', 'success');
    this.indicadorAtualizado.emit();
  } catch (error) {
    console.error('Erro ao atualizar ordem:', error);
    this.showToast('Erro ao reordenar indicadores', 'error');
  }
}
```

---

### 6. Criação de Usuário On-the-Fly (Tag Customizada)

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`

**Método:** `addUsuarioTag()`

**Regra:**
- Permite criar novo usuário diretamente do ng-select (campo Responsável)
- Validação: nome deve conter **nome + sobrenome** (≥2 palavras)
- **Perfil automático:** COLABORADOR
- **Empresa automática:** mesma do cockpit (`this.empresaId`)
- Retorna Promise para integração com ng-select
- Adiciona usuário à lista local após criação
- Feedback via toast de sucesso/erro

**Código implementado:**
```typescript
addUsuarioTag = (nome: string): Usuario | Promise<Usuario> => {
  if (!this.perfilColaboradorId) {
    this.showToast('Perfil COLABORADOR não foi carregado. Tente novamente.', 'error');
    return Promise.reject('Perfil COLABORADOR não disponível');
  }

  const nomeParts = nome.trim().split(/\s+/);
  if (nomeParts.length < 2) {
    this.showToast('Por favor, informe nome e sobrenome', 'error');
    return Promise.reject('Nome e sobrenome são obrigatórios');
  }

  const novoUsuario: CreateUsuarioDto = {
    nome: nome,
    empresaId: this.empresaId!,
    perfilId: this.perfilColaboradorId
  };

  return new Promise((resolve, reject) => {
    this.usersService.create(novoUsuario).subscribe({
      next: (usuario) => {
        this.showToast(`Usuário "${nome}" criado com sucesso!`, 'success');
        this.usuarios.push(usuario);
        resolve(usuario);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao criar usuário', 'error');
        reject(err);
      }
    });
  });
};
```

---

## Restrições

1. **Nome único:** Por cockpit, case-sensitive
2. **Ordem automática:** Calculada sequencialmente
3. **Meses condicionais:** Somente cria meses quando `dataReferencia` estiver definida no cockpit
4. **Soft delete:** Indicadores desativados, não removidos fisicamente
5. **Auto-save:** Debounce 1s, valida campos obrigatórios antes de persistir
6. **Novo usuário:** Requer nome + sobrenome, perfil COLABORADOR fixo

---

## Fonte no Código

- **Backend Service:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`
  - Linhas: 321-444 (`createIndicador`)
  - Linhas: 446-532 (`updateIndicador`)
  - Linhas: 534-566 (`deleteIndicador`)

- **Frontend Gestão:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`
  - Linhas: 104-117 (`setupAutoSave`)
  - Linhas: 304-314 (`onCellBlur`)
  - Linhas: 318-387 (`saveIndicador`)
  - Linhas: 457-493 (`onDrop` e `saveOrdem`)
  - Linhas: 164-192 (`addUsuarioTag`)

---

## Observações

-  **Regra extraída por engenharia reversa** (exceto seção 1, atualizada como proposta)
- Seção 1 depende de nova referência em `CockpitPilar` e aguarda implementação
- Validações no backend garantem integridade
- Criação de usuário on-the-fly facilita fluxo sem interrupções
- Ordem mantida automaticamente via drag-and-drop
---

## 7. Filtro de Gráficos por Ano e Últimos 12 Meses (R-GRAF-001)

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts`
**Backend:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Contexto:**
- Componente de gráfico de indicadores
- Filtro para visualização temporal dos dados

**Regra:**
O usuário pode filtrar os gráficos de indicadores por:
1. **Últimos 12 meses** (padrão) - Exibe os últimos 12 meses a partir do mês atual
2. **Ano específico** - Exibe todos os meses de um ano específico

**Comportamento:**

### Backend

**Endpoint 1: Buscar anos disponíveis**
- **Rota:** `GET /cockpits/:cockpitId/anos-disponiveis`
- **Descrição:** Retorna lista de anos em que existem meses criados (IndicadorMensal) para indicadores do cockpit
- **Query:** Busca anos distintos ordenados decrescente (mais recente primeiro)
- **Retorno:** Array de números `[2027, 2026, 2025]`

**Endpoint 2: Buscar dados para gráfico**
- **Rota:** `GET /cockpits/:cockpitId/graficos/dados?filtro={filtro}`
- **Parâmetro filtro:**
  - `'ultimos-12-meses'` - Últimos 12 meses a partir de hoje
  - `'{ano}'` - Ano específico (ex: `'2025'`)

**Lógica de filtro "Últimos 12 meses":**
```typescript
const hoje = new Date();
const mesAtual = hoje.getMonth() + 1; // 1-12
const anoAtual = hoje.getFullYear();

// Calcular mês/ano inicial (12 meses atrás)
let mesInicial = mesAtual - 11;
let anoInicial = anoAtual;

if (mesInicial <= 0) {
  mesInicial += 12;
  anoInicial -= 1;
}

// Exemplo: Se hoje é Jan/2026
// mesInicial = 1 - 11 = -10 → +12 = 2
// anoInicial = 2026 - 1 = 2025
// Resultado: Fev/2025 até Jan/2026
```

**Filtro Prisma aplicado:**
```typescript
{
  OR: [
    { ano: { gt: anoInicial } },
    { AND: [{ ano: anoInicial }, { mes: { gte: mesInicial } }] }
  ],
  AND: [
    { ano: { lte: anoAtual } },
    { OR: [{ ano: { lt: anoAtual } }, { mes: { lte: mesAtual } }] }
  ]
}
```

**Validação:**
- Se filtro não for `'ultimos-12-meses'` nem número válido: `BadRequestException`

### Frontend

**Inicialização:**
1. Ao carregar componente, busca anos disponíveis via `getAnosDisponiveis()`
2. Monta array de opções: `[{ value: 'ultimos-12-meses', label: 'Últimos 12 meses' }, ...]`
3. Verifica localStorage por filtro salvo: `filtroGrafico_{cockpitId}`
4. Se não houver, define padrão: `'ultimos-12-meses'`

**Interação do usuário:**
- Dropdown (ng-select) exibe opções: "Últimos 12 meses", "2027", "2026", "2025"...
- Ao selecionar: `onFiltroChange(filtro)`
- Salva no localStorage: `localStorage.setItem('filtroGrafico_{cockpitId}', filtro)`
- Recarrega gráfico com novo filtro via `getDadosGraficos(cockpitId, filtro)`

**Labels do gráfico:**
- Formato: `MMM/yy` (Jan/25, Fev/25, Mar/25...)
- Sempre exibe mês + ano para evitar ambiguidade em filtro de 12 meses

**Persistência:**
- Filtro selecionado é salvo por cockpit no localStorage
- Na próxima abertura, restaura último filtro usado

**Fallback:**
- Se erro ao buscar anos: Exibe apenas "Últimos 12 meses"
- Garante que usuário sempre tenha uma opção funcional

### Código implementado

**Backend:**
```typescript
// cockpit-pilares.service.ts
async getAnosDisponiveis(cockpitId: string, user: RequestUser) {
  await this.validateCockpitAccess(cockpitId, user);

  const anos = await this.prisma.indicadorMensal.findMany({
    where: {
      indicadorCockpit: {
        cockpitPilarId: cockpitId,
        ativo: true,
      },
    },
    select: { ano: true },
    distinct: ['ano'],
    orderBy: { ano: 'desc' },
  });

  return anos.map((item) => item.ano);
}

async getDadosGraficos(cockpitId: string, filtro: string, user: RequestUser) {
  // ... (ver código completo no arquivo)
}
```

**Frontend:**
```typescript
// grafico-indicadores.component.ts
private loadAnosDisponiveis(): void {
  this.cockpitService.getAnosDisponiveis(this.cockpitId).subscribe({
    next: (anos: number[]) => {
      this.opcoesAnos = [
        { value: 'ultimos-12-meses', label: 'Últimos 12 meses' },
        ...anos.map(ano => ({ value: ano.toString(), label: ano.toString() }))
      ];
      
      const filtroSalvo = localStorage.getItem(`filtroGrafico_${this.cockpitId}`);
      this.selectedFiltro = filtroSalvo || 'ultimos-12-meses';
    }
  });
}

onFiltroChange(filtro: string | null): void {
  this.selectedFiltro = filtro || 'ultimos-12-meses';
  localStorage.setItem(`filtroGrafico_${this.cockpitId}`, this.selectedFiltro);
  this.loadGrafico();
}
```

### Restrições

1. **Padrão sempre "Últimos 12 meses"**
2. **Anos listados em ordem decrescente** (mais recente primeiro)
3. **Filtro persistido por cockpit** (não global)
4. **Validação de filtro inválido** retorna BadRequestException
5. **Fallback resiliente** se não houver anos disponíveis

### Fonte no Código

- **Backend Controller:** `backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts` (linhas ~297-325)
- **Backend Service:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` (linhas ~850-950)
- **Frontend Component:** `frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts`
- **Frontend Service:** `frontend/src/app/core/services/cockpit-pilares.service.ts` (linhas ~137-146)
- **Frontend Template:** `frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.html` (linhas ~4-19)

### Observações

-  **Regra implementada para substituir filtro de Períodos de Mentoria**
- Independente de período de mentoria - baseado apenas em meses existentes
- UX simplificada: 1 dropdown ao invés de lógica complexa de períodos
- Performance otimizada: Query distinct em anos
- Compatível com múltiplos anos de histórico