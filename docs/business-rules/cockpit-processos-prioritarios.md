# Regra: Processos Prioritários - Auto-vinculação e Status de Execução

## Contexto
Módulo Cockpit de Pilares - Matriz de Processos Prioritários
Frontend: Componente `matriz-processos`
Backend: `createCockpit()` e `updateProcessoPrioritario()`

## Descrição
Ao criar um cockpit, o sistema automaticamente vincula todas as rotinas ativas do pilar como processos prioritários, permitindo acompanhar status de mapeamento e treinamento. Exibe nota e criticidade mais recente de cada rotina.

## Condição
Aplicada quando:
- **Cockpit é criado:** Auto-vincula rotinas do pilar
- **Status de mapeamento é alterado:** Atualiza via ng-select
- **Status de treinamento é alterado:** Atualiza via ng-select
- **Processos são listados:** Exibe nota e criticidade mais recentes

## Comportamento Implementado

### 1. Auto-vinculação de Rotinas ao Criar Cockpit

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `createCockpit()`

**Regra:**
- Após criar registro `CockpitPilar`, busca todas as **rotinas ativas** do pilar
- Filtro: `pilarEmpresaId` + `ativo = true`
- Ordenação: `ordem ASC` (mantém ordem original do pilar)
- **Cria registros `ProcessoPrioritario`** para cada rotina encontrada:
  - `cockpitPilarId`: ID do cockpit recém-criado
  - `rotinaEmpresaId`: ID da rotina vinculada
  - `ordem`: Sequencial (1, 2, 3, ...)
  - `statusMapeamento`: null (pendente por padrão)
  - `statusTreinamento`: null (pendente por padrão)
- **Batch insert:** `createMany()` para otimização
- **Auditoria:** Registra quantidade de processos vinculados

**Código implementado:**
```typescript
async createCockpit(dto: CreateCockpitPilarDto, user: RequestUser) {
  // ... validações ...

  // Criar cockpit
  const cockpit = await this.prisma.cockpitPilar.create({
    data: {
      pilarEmpresaId: dto.pilarEmpresaId,
      entradas: dto.entradas,
      saidas: dto.saidas,
      missao: dto.missao,
      createdBy: user.id,
      updatedBy: user.id,
    },
  });

  // Auto-vincular rotinas ativas do pilar como processos prioritários
  const rotinas = await this.prisma.rotinaEmpresa.findMany({
    where: {
      pilarEmpresaId: dto.pilarEmpresaId,
      ativo: true,
    },
    orderBy: { ordem: 'asc' },
  });

  if (rotinas.length > 0) {
    const processos = rotinas.map((rotina, index) => ({
      cockpitPilarId: cockpit.id,
      rotinaEmpresaId: rotina.id,
      ordem: index + 1,
      createdBy: user.id,
      updatedBy: user.id,
    }));

    await this.prisma.processoPrioritario.createMany({
      data: processos,
    });
  }

  // Auditoria
  await this.audit.log({
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioEmail: user.email ?? '',
    entidade: 'CockpitPilar',
    entidadeId: cockpit.id,
    acao: 'CREATE',
    dadosDepois: { 
      cockpitId: cockpit.id, 
      pilarNome: pilarEmpresa.nome, 
      processosVinculados: rotinas.length 
    },
  });

  // Retornar cockpit completo
  return this.prisma.cockpitPilar.findUnique({
    where: { id: cockpit.id },
    include: {
      pilarEmpresa: {
        include: {
          pilarTemplate: true,
        },
      },
      indicadores: {
        where: { ativo: true },
        orderBy: { ordem: 'asc' },
        include: {
          responsavelMedicao: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      },
      processosPrioritarios: {
        orderBy: { ordem: 'asc' },
        include: {
          rotinaEmpresa: true,
        },
      },
    },
  });
}
```

---

### 2. Listagem de Processos com Nota Mais Recente

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `getProcessosPrioritarios()`

**Regra:**
- Busca processos prioritários do cockpit
- **Inclui `rotinaEmpresa` completa**
- **Inclui `notas` da rotina:**
  - Ordenação: `createdAt DESC` (mais recente primeiro)
  - Limite: `take: 1` (apenas última nota)
- Ordenação de processos: `ordem ASC`

**⚠️ Nota Dinâmica:**
- Processo **NÃO tem snapshot de nota** (não armazena nota fixa)
- Exibe sempre a **nota atual da rotina** (referência direta)
- Se rotina receber nova avaliação, processo mostra nota atualizada automaticamente

**Código implementado:**
```typescript
async getProcessosPrioritarios(cockpitId: string, user: RequestUser) {
  await this.validateCockpitAccess(cockpitId, user);

  return this.prisma.processoPrioritario.findMany({
    where: {
      cockpitPilarId: cockpitId,
    },
    include: {
      rotinaEmpresa: {
        include: {
          notas: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Pega apenas a nota mais recente
          },
        },
      },
    },
    orderBy: { ordem: 'asc' },
  });
}
```

---

### 3. Atualização de Status (Mapeamento e Treinamento)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `updateProcessoPrioritario()`

**Regra:**
- Validação de existência do processo
- Validação de acesso ao cockpit (multi-tenant)
- Atualiza `statusMapeamento` e/ou `statusTreinamento`
- Aceita valores: `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDO`, `null`
- Registra auditoria
- Retorna processo atualizado com `rotinaEmpresa` incluída

**Código implementado:**
```typescript
async updateProcessoPrioritario(
  processoId: string,
  dto: UpdateProcessoPrioritarioDto,
  user: RequestUser,
) {
  const processo = await this.prisma.processoPrioritario.findUnique({
    where: { id: processoId },
    include: {
      rotinaEmpresa: true,
    },
  });

  if (!processo) {
    throw new NotFoundException('Processo prioritário não encontrado');
  }

  await this.validateCockpitAccess(processo.cockpitPilarId, user);

  const updated = await this.prisma.processoPrioritario.update({
    where: { id: processoId },
    data: {
      statusMapeamento: dto.statusMapeamento,
      statusTreinamento: dto.statusTreinamento,
      updatedBy: user.id,
    },
    include: {
      rotinaEmpresa: true,
    },
  });

  // Auditoria
  await this.audit.log({
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioEmail: user.email ?? '',
    entidade: 'ProcessoPrioritario',
    entidadeId: processoId,
    acao: 'UPDATE',
    dadosDepois: dto,
  });

  return updated;
}
```

---

### 4. Auto-save de Status no Frontend

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.ts`

**Método:** `onStatusMapeamentoChange()`, `onStatusTreinamentoChange()`

**Regra:**
- **Debounce de 1000ms** após alteração no ng-select
- **Atualização local imediata** (UX responsiva)
- **Envio via Subject** com `distinctUntilChanged` (evita duplicatas)
- **Feedback centralizado** (via `SaveFeedbackService`)
- Salva ambos os status no mesmo request (PATCH)

**Código implementado:**
```typescript
private setupAutoSave(): void {
  this.autoSaveSubscription = this.autoSaveSubject
    .pipe(
      debounceTime(1000),
      distinctUntilChanged((prev, curr) =>
        prev.processoId === curr.processoId && 
        prev.statusMapeamento === curr.statusMapeamento &&
        prev.statusTreinamento === curr.statusTreinamento
      )
    )
    .subscribe(({ processoId, statusMapeamento, statusTreinamento }) => {
      this.saveStatus(processoId, statusMapeamento, statusTreinamento);
    });
}

onStatusMapeamentoChange(processoId: string, newStatus: StatusProcesso | null): void {
  const processo = this.processos.find((p) => p.id === processoId);
  if (processo) {
    processo.statusMapeamento = newStatus;
  }

  this.autoSaveSubject.next({ 
    processoId, 
    statusMapeamento: newStatus,
    statusTreinamento: processo?.statusTreinamento || null
  });
}

onStatusTreinamentoChange(processoId: string, newStatus: StatusProcesso | null): void {
  const processo = this.processos.find((p) => p.id === processoId);
  if (processo) {
    processo.statusTreinamento = newStatus;
  }

  this.autoSaveSubject.next({ 
    processoId, 
    statusMapeamento: processo?.statusMapeamento || null,
    statusTreinamento: newStatus
  });
}

private saveStatus(
  processoId: string, 
  statusMapeamento: StatusProcesso | null,
  statusTreinamento: StatusProcesso | null
): void {
  this.savingCount++;
  if (this.savingCount === 1) {
    this.saveFeedbackService.startSaving('Status de processos');
  }

  const dto: UpdateProcessoPrioritarioDto = {
    statusMapeamento,
    statusTreinamento,
  };

  this.cockpitService
    .updateProcessoPrioritario(processoId, dto)
    .subscribe({
      next: () => {
        this.savingCount--;
        if (this.savingCount === 0) {
          this.saveFeedbackService.completeSaving();
        }
      },
      error: (err: unknown) => {
        console.error('Erro ao salvar status do processo:', err);
        this.savingCount--;
        if (this.savingCount === 0) {
          this.saveFeedbackService.reset();
        }
      },
    });
}
```

---

### 5. Exibição de Nota e Criticidade

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.html`

**Regra:**
- **Nota:** Exibe `rotinaEmpresa.notas[0].nota` (primeira = mais recente)
- **Badge colorido por faixa:**
  - 1-5: `bg-danger` (vermelho)
  - 6-8: `bg-warning` (amarelo)
  - 9-10: `bg-success` (verde)
- **Criticidade:** Exibe `rotinaEmpresa.notas[0].criticidade`
  - ALTA: badge vermelho
  - MEDIA: badge amarelo
  - BAIXA: badge verde
- **Fallback:** Se não há notas, exibe "-"

**Código implementado:**
```html
<td class="text-center">
  @if (processo.rotinaEmpresa?.notas && processo.rotinaEmpresa.notas.length > 0) {
  @switch (processo.rotinaEmpresa.notas[0].criticidade) {
  @case ('ALTA') {
  <span class="badge bg-danger">Alta</span>
  }
  @case ('MEDIA') {
  <span class="badge bg-warning">Média</span>
  }
  @case ('BAIXA') {
  <span class="badge bg-success">Baixa</span>
  }
  @default {
  <span class="text-muted">-</span>
  }
  }
  } @else {
  <span class="text-muted">-</span>
  }
</td>
<td class="text-center">
  @if (processo.rotinaEmpresa?.notas && processo.rotinaEmpresa.notas.length > 0) {
  <span class="badge" [class]="getNotaClass(processo.rotinaEmpresa.notas[0].nota)">
    {{ processo.rotinaEmpresa.notas[0].nota?.toFixed(1) || '-' }}
  </span>
  } @else {
  <span class="text-muted">-</span>
  }
</td>
```

**Método de cor:**
```typescript
getNotaClass(nota: number | null): string {
  if (nota === null || nota === undefined) {
    return '';
  }
  
  if (nota >= 1 && nota <= 5) {
    return 'bg-danger';
  } else if (nota >= 6 && nota <= 8) {
    return 'bg-warning';
  } else if (nota >= 9 && nota <= 10) {
    return 'bg-success';
  }
  
  return '';
}
```

---

### 6. Valores de Status Disponíveis

**Enum:** `StatusProcesso`

**Valores:**
- `PENDENTE`: Vermelho (⏰)
- `EM_ANDAMENTO`: Amarelo (⏳)
- `CONCLUIDO`: Verde (✓)
- `null`: Clearable (permite remover seleção)

**Badge classes:**
```typescript
getStatusBadgeClass(status: StatusProcesso): string {
  switch (status) {
    case 'PENDENTE':
      return 'bg-danger';
    case 'EM_ANDAMENTO':
      return 'bg-warning';
    case 'CONCLUIDO':
      return 'bg-success';
    default:
      return 'bg-primary';
  }
}
```

---

## Restrições

1. **Auto-vinculação:** Apenas rotinas **ativas** são vinculadas
2. **Ordem preservada:** Mantém ordem original do pilar
3. **NÃO é snapshot:** Nota exibida é sempre a **mais recente da rotina** (dinâmica)
4. **Status clearable:** Usuário pode remover status (voltar para null)
5. **Auto-save:** Debounce 1s, salva ambos status em um único request
6. **Criticidade e Nota:** Vêm da última avaliação da rotina (não do processo)

---

## Fonte no Código

- **Backend Service:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`
  - Linhas: 73-177 (`createCockpit` - auto-vinculação)
  - Linhas: 686-716 (`getProcessosPrioritarios`)
  - Linhas: 718-771 (`updateProcessoPrioritario`)

- **Frontend Matriz Processos:** `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.ts`
  - Linhas: 84-100 (`setupAutoSave`)
  - Linhas: 102-130 (`onStatusMapeamentoChange`, `onStatusTreinamentoChange`)
  - Linhas: 132-167 (`saveStatus`)
  - Linhas: 181-196 (`getNotaClass`)

- **Template HTML:** `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.html`
  - Exibição de nome, ordem, criticidade, nota e status

---

## Observações

-  **Regra extraída por engenharia reversa**
- Processos são **referências dinâmicas** às rotinas, não snapshots
- Se rotina for reavaliada, processo mostra nova nota automaticamente
- Auto-vinculação ocorre **apenas na criação** do cockpit (não sincroniza mudanças posteriores nas rotinas)
- Status de mapeamento e treinamento são independentes e opcionais
