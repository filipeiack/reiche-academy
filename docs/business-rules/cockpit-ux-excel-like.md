# Regra: Comportamentos de Interface Excel-like e UX do Cockpit

## Contexto
Módulo Cockpit de Pilares - Todos os componentes de edição
Frontend: Gestão Indicadores, Edição Valores Mensais, Matriz Processos
UX: Navegação por teclado, feedback visual, auto-save

## Descrição
Implementa padrões de interface inspirados em planilhas Excel, com navegação por Tab/Enter, auto-save transparente, feedback visual em tempo real e edição inline sem modais.

## Condição
Aplicada quando usuário:
- Navega entre campos com Tab/Enter
- Altera valores e aguarda salvamento automático
- Arrasta e solta para reordenar
- Visualiza feedback de salvamento
- Edita campos inline sem abrir modais

## Comportamento Implementado

### 1. Navegação por Teclado (Gestão Indicadores)

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`

**Método:** `onKeyDown()`

**Regra:**
- **Campos navegáveis:** `nome`, `tipoMedida`, `statusMedicao`, `responsavel`, `melhor`
- **Tab (sem Shift):** Próximo campo na mesma linha → Se último campo, vai para primeiro da próxima linha
- **Shift + Tab:** Campo anterior na mesma linha → Se primeiro campo, vai para último da linha anterior
- **Enter:** Mesma coluna, próxima linha (similar ao Excel)
- **preventDefault():** Impede comportamento padrão do navegador

**Código implementado:**
```typescript
onKeyDown(
  event: KeyboardEvent,
  rowIndex: number,
  field: string
): void {
  const fields = ['nome', 'tipoMedida', 'statusMedicao', 'responsavel', 'melhor'];
  const currentFieldIndex = fields.indexOf(field);

  if (event.key === 'Tab' && !event.shiftKey) {
    // Tab → próximo campo
    event.preventDefault();

    if (currentFieldIndex < fields.length - 1) {
      // Próximo campo na mesma linha
      const nextField = fields[currentFieldIndex + 1];
      const nextInput = document.getElementById(`${nextField}-${rowIndex}`);
      nextInput?.focus();
    } else if (rowIndex < this.indicadores.length - 1) {
      // Primeira célula da próxima linha
      const nextInput = document.getElementById(`nome-${rowIndex + 1}`);
      nextInput?.focus();
    }
  } else if (event.key === 'Tab' && event.shiftKey) {
    // Shift+Tab → campo anterior
    event.preventDefault();

    if (currentFieldIndex > 0) {
      // Campo anterior na mesma linha
      const prevField = fields[currentFieldIndex - 1];
      const prevInput = document.getElementById(`${prevField}-${rowIndex}`);
      prevInput?.focus();
    } else if (rowIndex > 0) {
      // Último campo da linha anterior
      const prevInput = document.getElementById(`melhor-${rowIndex - 1}`);
      prevInput?.focus();
    }
  } else if (event.key === 'Enter') {
    // Enter → próxima linha, mesmo campo
    event.preventDefault();

    if (rowIndex < this.indicadores.length - 1) {
      const nextInput = document.getElementById(`${field}-${rowIndex + 1}`);
      nextInput?.focus();
    }
  }
}
```

---

### 2. Auto-save com Debounce (Padrão Global)

**Arquivos:** Todos os componentes de edição

**Regra:**
- **Debounce de 1000ms** (1 segundo) após última alteração
- **distinctUntilChanged:** Evita salvamentos duplicados
- **Atualização local imediata:** Valor aparece alterado instantaneamente
- **Feedback centralizado:** `SaveFeedbackService` exibe ícone/mensagem única
- **Contador de operações:** Evita múltiplos toasts simultâneos

**Implementação padrão:**
```typescript
private setupAutoSave(): void {
  this.autoSaveSubscription = this.autoSaveSubject
    .pipe(
      debounceTime(1000),
      distinctUntilChanged()
    )
    .subscribe((data) => {
      this.executeSave(data);
    });
}

// Em cada campo editável:
onFieldChange(value: any): void {
  // Atualizar valor local imediatamente
  this.localObject.field = value;
  
  // Agendar salvamento
  this.autoSaveSubject.next({ field: 'field', value });
}
```

---

### 3. Feedback Visual de Salvamento

**Arquivo:** `SaveFeedbackService` (serviço compartilhado)

**Regra:**
- **startSaving(entityName):** Exibe ícone/spinner de salvamento
- **completeSaving():** Exibe checkmark verde (salvamento confirmado)
- **reset():** Remove feedback em caso de erro
- **Contador interno:** Evita que múltiplas operações sobreescrevam feedback

**Estados visuais:**
1. **Salvando:** Spinner rotativo + mensagem "Salvando {entidade}..."
2. **Salvo:** Checkmark verde + mensagem "Salvo"
3. **Erro:** Ícone de erro + alerta/toast (geralmente via SweetAlert2)

**Uso:**
```typescript
// Início
this.saveFeedbackService.startSaving('Indicadores');

// Sucesso
this.saveFeedbackService.completeSaving();

// Erro
this.saveFeedbackService.reset();
alert('Erro ao salvar');
```

---

### 4. Drag-and-Drop para Reordenação

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`

**Biblioteca:** Angular CDK Drag-Drop

**Regra:**
- **cdkDrag** em cada linha da tabela
- **cdkDropList** no container
- **moveItemInArray():** Move item no array local
- **Recalcula ordem:** Sequencial (1, 2, 3...) após drop
- **Salva automaticamente:** PATCH para cada indicador afetado
- **Feedback:** Toast de sucesso/erro

**Template:**
```html
<tbody cdkDropList (cdkDropListDropped)="onDrop($event)">
  @for (indicador of indicadores; track indicador.id) {
  <tr cdkDrag>
    <!-- células -->
  </tr>
  }
</tbody>
```

---

### 5. Edição Inline sem Modais

**Arquivo:** Gestão Indicadores e Edição Valores Mensais

**Regra:**
- **NÃO usa modais** para edição de valores
- **Edição inline:** Clique habilita campo, blur salva automaticamente
- **Toggle direto:** Campo `melhor` alterna entre ↑/↓ com um clique
- **Ng-select inline:** Responsável, tipo, status editados diretamente na tabela
- **Exceção:** Descrição longa usa modal (única exceção)

**Exemplo - Toggle Melhor:**
```typescript
toggleMelhor(indicador: IndicadorExtended): void {
  indicador.melhor =
    indicador.melhor === DirecaoIndicador.MAIOR
      ? DirecaoIndicador.MENOR
      : DirecaoIndicador.MAIOR;
  this.onCellBlur(indicador, 'melhor');
}
```

---

### 6. Validação Visual em Tempo Real

**Arquivo:** Edição Valores Mensais

**Regra:**
- **Badge de Desvio:** Atualiza cores dinamicamente conforme valores
  - Verde (`bg-success`): Meta atingida
  - Vermelho (`bg-danger`): Abaixo da meta
- **Ícones de Status:**
  - ✓ Verde: Meta batida
  - ✗ Vermelho: Meta não atingida
- **Recálculo imediato:** Usa cache local (`valoresCache`) para calcular sem esperar backend

---

### 7. Criação de Nova Linha (Gestão Indicadores)

**Arquivo:** `gestao-indicadores.component.ts`

**Método:** `addNewRow()`

**Regra:**
- **Botão "Adicionar":** Insere nova linha vazia ao final da tabela
- **Auto-focus:** Campo `nome` recebe foco automaticamente (timeout 100ms)
- **Modo de edição:** Linha criada já vem com `isEditing = true`
- **Validação antes de salvar:** Campos obrigatórios devem estar preenchidos
- **Salva automaticamente:** Ao perder foco em campo válido

**Código implementado:**
```typescript
addNewRow(): void {
  // Desabilitar edição de linha anterior
  if (this.editingRowId) {
    const previous = this.indicadores.find(
      (i) => i.id === this.editingRowId || 'new-' + i.ordem === this.editingRowId
    );
    if (previous) {
      previous.isEditing = false;
    }
  }

  const newIndicador: IndicadorExtended = {
    id: '',
    nome: '',
    descricao: null,
    tipoMedida: null as any,
    statusMedicao: StatusMedicaoIndicador.NAO_MEDIDO,
    responsavelMedicaoId: null,
    melhor: DirecaoIndicador.MAIOR,
    ordem: this.indicadores.length + 1,
    ativo: true,
    isEditing: true,
    isNew: true,
    saveStatus: null,
  } as any;

  this.indicadores.push(newIndicador);
  this.editingRowId = 'new-' + newIndicador.ordem;

  // Auto-focus no campo nome
  setTimeout(() => {
    const input = document.getElementById(`nome-${newIndicador.ordem}`);
    input?.focus();
  }, 100);
}
```

---

### 8. Confirmação de Exclusão (SweetAlert2)

**Arquivo:** Gestão Indicadores

**Método:** `deleteIndicador()`

**Regra:**
- **Modal de confirmação:** SweetAlert2 com título, texto explicativo
- **Botões:**
  - "Sim, remover" (vermelho)
  - "Cancelar" (cinza)
- **Ação apenas se confirmado:** `result.isConfirmed`
- **Feedback:** Toast de sucesso após exclusão

**Código implementado:**
```typescript
async deleteIndicador(indicador: IndicadorExtended): Promise<void> {
  const result = await Swal.fire({
    title: 'Remover Indicador',
    text: `Deseja remover o indicador "${indicador.nome}"? Todos os dados mensais serão perdidos.`,
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sim, remover',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  // ... lógica de exclusão ...
  
  this.showToast('Indicador removido com sucesso.', 'success');
}
```

---

### 9. Toast Notifications

**Arquivo:** Gestão Indicadores e outros componentes

**Método:** `showToast()`

**Regra:**
- **SweetAlert2 Toast mode:** Aparece no topo direito
- **Auto-fechamento:** Timer de 3 segundos (padrão)
- **Progress bar:** Mostra tempo restante
- **Tipos:** success, error, info, warning
- **Não bloqueia interface:** Usuário pode continuar trabalhando

**Código implementado:**
```typescript
private showToast(
  title: string, 
  icon: 'success' | 'error' | 'info' | 'warning', 
  timer: number = 3000
): void {
  Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    title,
    icon
  });
}
```

---

### 10. Cache Local para Performance

**Arquivo:** Edição Valores Mensais

**Regra:**
- **Map<string, objeto>:** Armazena valores em edição antes de salvar
- **Key:** ID do objeto (ex: `indicadorMensal.id`)
- **Uso:**
  - Recálculos usam cache se disponível (sem esperar backend)
  - Cache limpo após salvamento bem-sucedido
  - Evita race conditions entre digitação e salvamento

**Código implementado:**
```typescript
private valoresCache = new Map<string, { meta?: number; realizado?: number; historico?: number }>();

onValorChange(mes: IndicadorMensal, campo: 'meta' | 'realizado' | 'historico', event: Event): void {
  const valor = parseFloat((event.target as HTMLInputElement).value);
  
  // Atualizar cache
  const cacheKey = mes.id;
  if (!this.valoresCache.has(cacheKey)) {
    this.valoresCache.set(cacheKey, {});
  }
  const cached = this.valoresCache.get(cacheKey)!;
  cached[campo] = valor;
  
  // ... agendar salvamento ...
}

private getValorAtualizado(mes: IndicadorMensal, campo: 'meta' | 'realizado' | 'historico'): number | null {
  const cached = this.valoresCache.get(mes.id);
  if (cached && cached[campo] !== undefined) {
    return cached[campo] ?? null;
  }
  return mes[campo] ?? null;
}
```

---

## Restrições

1. **Navegação Tab/Enter:** Apenas em campos definidos no array `fields`
2. **Auto-save:** Debounce fixo de 1000ms (não configurável)
3. **Drag-and-drop:** Apenas reordena, não move entre cockpits diferentes
4. **Feedback visual:** Centralizado via serviço, não customizável por componente
5. **Modal:** Apenas para descrição longa, demais campos inline
6. **Cache:** Limpo após salvamento, não persiste entre reloads

---

## Fonte no Código

- **Frontend Gestão Indicadores:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`
  - Linhas: 495-549 (`onKeyDown`)
  - Linhas: 236-278 (`addNewRow`)
  - Linhas: 398-432 (`deleteIndicador`)
  - Linhas: 551-552 (`showToast`)

- **Frontend Edição Valores:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`
  - Linhas: 46-50 (`valoresCache`)
  - Linhas: 86-113 (`onValorChange`)
  - Linhas: 270-283 (`getValorAtualizado`)

- **Frontend Matriz Processos:** `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.ts`
  - Linhas: 84-100 (`setupAutoSave`)

---

## Observações

-  **Regra extraída por engenharia reversa**
- Padrões Excel-like melhoram produtividade em edição de dados tabulares
- Navegação por teclado permite preenchimento rápido sem mouse
- Auto-save reduz risco de perda de dados
- Feedback visual constante mantém usuário informado
- Cache local garante recálculos instantâneos sem latência de rede
- SweetAlert2 usado para modais e toasts com UX consistente
