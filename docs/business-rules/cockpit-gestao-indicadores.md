# Regra: Gestão de Indicadores no Cockpit

## Contexto
Módulo Cockpit de Pilares - CRUD completo de Indicadores
Frontend: Gestão Indicadores Component
Backend: CockpitPilaresService

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

### 1. Criação de Indicador + Auto-criação de 13 Meses

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `createIndicador()`

**Regra:**
- Validação de nome único por cockpit (case-sensitive)
- Se nome já existe (ativo): lança `ConflictException` "Já existe um indicador com este nome neste cockpit"
- Cálculo automático de ordem: `maxOrdem + 1` (ou 1 se primeiro)
- **Auto-criação de 13 registros `IndicadorMensal`:**
  - 12 meses (jan-dez) com `mes = 1..12`
  - 1 resumo anual com `mes = null`
  - Ano atual (`new Date().getFullYear()`)
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

  // Auto-criar 13 meses (jan-dez + anual)
  const anoAtual = new Date().getFullYear();
  const meses = [
    ...Array.from({ length: 12 }, (_, i) => ({
      indicadorCockpitId: indicador.id,
      mes: i + 1,
      ano: anoAtual,
      createdBy: user.id,
      updatedBy: user.id,
    })),
    {
      indicadorCockpitId: indicador.id,
      mes: null, // Resumo anual
      ano: anoAtual,
      createdBy: user.id,
      updatedBy: user.id,
    },
  ];

  await this.prisma.indicadorMensal.createMany({
    data: meses,
  });

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
3. **13 meses criados:** Sempre jan-dez + anual, mesmo que vazios
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

-  **Regra extraída por engenharia reversa**
- Validações no backend garantem integridade
- Frontend implementa UX Excel-like com auto-save
- Criação de usuário on-the-fly facilita fluxo sem interrupções
- Ordem mantida automaticamente via drag-and-drop
