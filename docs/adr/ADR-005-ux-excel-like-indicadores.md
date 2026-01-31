# ADR-005: UX Excel-like para Indicadores do Cockpit

**Status:** ✅ Aprovado  
**Data:** 2026-01-15  
**Autor:** System Engineer  
**Decisores:** Product Owner, System Engineer  
**Contexto técnico:** Angular 18, Bootstrap 5, ng-select, auto-save pattern  
**Implementação:** Ver ADR-006 para arquitetura de componentes

---

## ⚠️ Nota de Implementação

Este ADR especifica a **UX e funcionalidades** do CRUD de indicadores.

Para **arquitetura de componentes e integração com código existente**, consulte:
→ **[ADR-006: Arquitetura de Componentes da Matriz de Indicadores](ADR-006-arquitetura-matriz-indicadores.md)**

**Componente implementado:** `gestao-indicadores.component` (não `matriz-indicadores`)

---

## Contexto

### Situação Atual
O módulo Cockpit de Pilares está em fase de especificação (ADR-003). A documentação inicial previa uso de **modais tradicionais** para criação de indicadores, seguindo padrão extraído do módulo `diagnostico-notas`.

### Problema
1. **Contexto de uso:** Usuários vêm de planilhas Excel (experiência familiar com edição inline)
2. **Setup inicial:** Criação de ~10 indicadores de uma vez (setup inicial do cockpit)
3. **Manutenção:** Adição de 1-2 indicadores ocasionalmente
4. **Velocidade:** Modal tradicional = 6 cliques por indicador (60 cliques para 10 indicadores)
5. **Desktop-first:** Uso predominante em desktop, mas mobile também será usado

### Campos Críticos vs Opcionais
**Obrigatórios para criar:**
- Nome do indicador
- Tipo de medida (R$, %, Quantidade, Tempo)
- Direção (Melhor = Maior ↑ / Menor ↓)

**Opcionais:**
- Descrição (campo longo, precisa de solução específica)
- Responsável pela medição
- Status de medição (default: NÃO_MEDIDO)

### Pergunta Central
Como permitir criação rápida de múltiplos indicadores mantendo familiaridade com Excel, sem sacrificar mobile experience?

---

## Decisão

Implementar **UX Excel-like com Grid Inline Editável** para desktop, com fallback para **Cards + Modal** em mobile.

### Características Principais

#### Desktop (Primário)
- **Grid editável** com células inline (estilo Excel)
- **Botão "+ Nova Linha"** adiciona linha vazia ao final (já em modo edição)
- **Navegação com Tab/Enter** (igual planilha)
- **Auto-save** ao perder foco (debounce 1000ms)
- **Ações por linha:** Ícone editar (habilita edição) + ícone remover
- **Drag & drop** para reordenar (desabilitado em modo edição)
- **Feedback visual:** Spinner (salvando) + ✓ verde (salvo) + ✗ vermelho (erro)

#### Mobile (Fallback)
- **Cards expansíveis** listando indicadores
- **Modal ou Side Panel** para criar/editar
- **Mesma lógica de auto-save**

#### Campo Descrição (Campo Longo)
- **Ícone 📝** na célula abre **modal pequeno** com textarea
- Modal salva ao fechar
- Descrição não bloqueia criação do indicador

#### Responsável
- **ng-select** compacto com search
- Busca por nome
- Permite ficar vazio

---

## Especificação Técnica

### Fluxo de Criação (Desktop)

```
1. Usuário clica [+ Nova Linha]
   ↓
2. Linha vazia adicionada ao final da grid
   ↓
3. Linha entra em modo edição (todos os campos editáveis)
   ↓
4. Foco automático no campo "Nome"
   ↓
5. Usuário preenche Nome + Tipo + Melhor (obrigatórios)
   ↓
6. Tab/Enter para navegar entre campos
   ↓
7. Ao perder foco (blur) + validação OK:
   ↓
8. Auto-save (POST /indicadores) com debounce 1000ms
   ↓
9. Spinner "salvando..." → ✓ "salvo" (2s) → linha sai do modo edição
   ↓
10. Backend cria automaticamente 13 registros mensais vazios
```

### Fluxo de Edição (Desktop)

```
1. Usuário clica no ícone ✏️ (editar)
   ↓
2. Linha entra em modo edição
   ↓
3. Drag handle (☰) desaparece temporariamente
   ↓
4. Usuário edita campos desejados
   ↓
5. Ao perder foco: Auto-save (PATCH /indicadores/:id)
   ↓
6. Ícone ✏️ vira ✓ para confirmar saída do modo edição
```

### Fluxo de Remoção

```
1. Usuário clica no ícone 🗑️ (remover)
   ↓
2. Confirmação: "Remover indicador e todos os dados mensais?"
   ↓
3. DELETE /indicadores/:id (backend remove cascade)
   ↓
4. Linha removida da grid com animação
```

### Drag & Drop (Reordenação)

```
1. Drag handle (☰) visível APENAS em linhas NÃO editáveis
   ↓
2. Usuário arrasta linha para nova posição
   ↓
3. Grid reordena visualmente
   ↓
4. Auto-save: PATCH /indicadores (atualiza campo "ordem")
   ↓
5. Feedback visual de sucesso
```

---

## Componentes e Estrutura

### Estrutura de Arquivos

```
frontend/src/app/views/pages/cockpit-pilares/
├── cockpit-dashboard/
│   ├── cockpit-dashboard.component.ts
│   ├── cockpit-dashboard.component.html
│   └── cockpit-dashboard.component.scss
├── matriz-indicadores/                    # ← Novo componente principal
│   ├── matriz-indicadores.component.ts
│   ├── matriz-indicadores.component.html
│   ├── matriz-indicadores.component.scss
│   └── matriz-indicadores.component.spec.ts
├── modals/
│   ├── descricao-indicador-modal/        # ← Modal pequeno para descrição
│   │   ├── descricao-indicador-modal.component.ts
│   │   ├── descricao-indicador-modal.component.html
│   │   └── descricao-indicador-modal.component.scss
│   └── indicador-mobile-modal/           # ← Modal/panel para mobile
│       └── ...
└── grafico-indicadores/
    └── ...
```

### Dependências do Componente

```typescript
// matriz-indicadores.component.ts
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-matriz-indicadores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgSelectModule,
    NgbModalModule,
    DragDropModule,
    TranslatePipe,
    DescricaoIndicadorModalComponent
  ],
  templateUrl: './matriz-indicadores.component.html',
  styleUrls: ['./matriz-indicadores.component.scss']
})
```

---

## Pseudo-código e Lógica

### TypeScript: matriz-indicadores.component.ts

```typescript
export class MatrizIndicadoresComponent implements OnInit {
  // Estado
  indicadores: IndicadorCockpit[] = [];
  usuarios: Usuario[] = [];
  cockpitId: string;
  
  // Controle de edição
  editingRowId: string | null = null;
  
  // Auto-save
  private autoSaveSubject = new Subject<{indicador: IndicadorCockpit, field: string}>();
  
  // Enums
  tiposMedida = [
    { value: 'REAL', label: 'R$ (Reais)' },
    { value: 'QUANTIDADE', label: 'Quantidade' },
    { value: 'TEMPO', label: 'Tempo' },
    { value: 'PERCENTUAL', label: '% (Percentual)' }
  ];
  
  statusMedicao = [
    { value: 'NAO_MEDIDO', label: 'Não Medido' },
    { value: 'MEDIDO_NAO_CONFIAVEL', label: 'Não Confiável' },
    { value: 'MEDIDO_CONFIAVEL', label: 'Confiável' }
  ];
  
  constructor(
    private cockpitService: CockpitPilaresService,
    private usuarioService: UsuarioService,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {}
  
  ngOnInit() {
    this.loadIndicadores();
    this.loadUsuarios();
    this.setupAutoSave();
  }
  
  // Setup auto-save com debounce
  setupAutoSave() {
    this.autoSaveSubject.pipe(
      debounceTime(1000),
      distinctUntilChanged((prev, curr) => 
        prev.indicador.id === curr.indicador.id && 
        prev.field === curr.field
      )
    ).subscribe(({indicador, field}) => {
      this.saveIndicador(indicador);
    });
  }
  
  // Carregar indicadores
  async loadIndicadores() {
    try {
      this.indicadores = await this.cockpitService
        .getIndicadores(this.cockpitId)
        .toPromise();
    } catch (error) {
      this.toastr.error('Erro ao carregar indicadores');
    }
  }
  
  // Carregar usuários para ng-select
  async loadUsuarios() {
    try {
      this.usuarios = await this.usuarioService
        .getUsuariosDaEmpresa()
        .toPromise();
    } catch (error) {
      console.error('Erro ao carregar usuários', error);
    }
  }
  
  // Adicionar nova linha
  addNewRow() {
    const newIndicador: IndicadorCockpit = {
      id: null, // Flag de "não salvo"
      nome: '',
      descricao: null,
      tipoMedida: null,
      statusMedicao: 'NAO_MEDIDO',
      responsavelMedicaoId: null,
      melhor: 'MAIOR',
      ordem: this.indicadores.length + 1,
      ativo: true,
      isEditing: true,
      isNew: true,
      saveStatus: null
    };
    
    this.indicadores.push(newIndicador);
    this.editingRowId = 'new-' + Date.now();
    
    // Auto-focus no campo nome após render
    setTimeout(() => {
      const input = document.getElementById(`nome-${newIndicador.ordem}`);
      input?.focus();
    }, 100);
  }
  
  // Habilitar edição de linha existente
  enableEdit(indicador: IndicadorCockpit) {
    // Salvar linha anterior se houver
    if (this.editingRowId && this.editingRowId !== indicador.id) {
      const previousEditing = this.indicadores.find(i => i.id === this.editingRowId);
      if (previousEditing) {
        previousEditing.isEditing = false;
      }
    }
    
    indicador.isEditing = true;
    this.editingRowId = indicador.id;
  }
  
  // Desabilitar edição (confirmar)
  disableEdit(indicador: IndicadorCockpit) {
    if (this.isValidForSave(indicador)) {
      indicador.isEditing = false;
      this.editingRowId = null;
    } else {
      this.toastr.warning('Preencha os campos obrigatórios');
    }
  }
  
  // Validação mínima para salvar
  isValidForSave(indicador: IndicadorCockpit): boolean {
    return !!(
      indicador.nome?.trim() &&
      indicador.tipoMedida &&
      indicador.melhor
    );
  }
  
  // Auto-save ao perder foco
  onCellBlur(indicador: IndicadorCockpit, field: string) {
    if (!this.isValidForSave(indicador)) {
      return; // Não salva se inválido
    }
    
    // Envia para subject (debounce 1000ms)
    this.autoSaveSubject.next({indicador, field});
  }
  
  // Salvar indicador (CREATE ou UPDATE)
  async saveIndicador(indicador: IndicadorCockpit) {
    indicador.saveStatus = 'saving';
    
    try {
      if (indicador.isNew) {
        // POST /cockpits/:id/indicadores
        const created = await this.cockpitService.createIndicador(
          this.cockpitId,
          {
            nome: indicador.nome,
            descricao: indicador.descricao,
            tipoMedida: indicador.tipoMedida,
            statusMedicao: indicador.statusMedicao,
            responsavelMedicaoId: indicador.responsavelMedicaoId,
            melhor: indicador.melhor,
            ordem: indicador.ordem
          }
        ).toPromise();
        
        // Atualizar com dados do backend (id + timestamps)
        Object.assign(indicador, created);
        indicador.isNew = false;
        indicador.isEditing = false;
        this.editingRowId = null;
        
        this.toastr.success('Indicador criado com sucesso');
        
      } else {
        // PATCH /indicadores/:id
        await this.cockpitService.updateIndicador(indicador.id, {
          nome: indicador.nome,
          descricao: indicador.descricao,
          tipoMedida: indicador.tipoMedida,
          statusMedicao: indicador.statusMedicao,
          responsavelMedicaoId: indicador.responsavelMedicaoId,
          melhor: indicador.melhor
        }).toPromise();
      }
      
      // Feedback visual: ✓ salvo
      indicador.saveStatus = 'saved';
      setTimeout(() => indicador.saveStatus = null, 2000);
      
    } catch (error) {
      indicador.saveStatus = 'error';
      this.toastr.error('Erro ao salvar indicador');
      console.error(error);
    }
  }
  
  // Toggle Melhor (Maior ↔ Menor)
  toggleMelhor(indicador: IndicadorCockpit) {
    indicador.melhor = indicador.melhor === 'MAIOR' ? 'MENOR' : 'MAIOR';
    this.onCellBlur(indicador, 'melhor');
  }
  
  // Abrir modal de descrição
  openDescricaoModal(indicador: IndicadorCockpit) {
    const modalRef = this.modalService.open(DescricaoIndicadorModalComponent, {
      size: 'lg',
      centered: true
    });
    
    modalRef.componentInstance.descricao = indicador.descricao || '';
    
    modalRef.result.then((descricao: string) => {
      indicador.descricao = descricao;
      this.onCellBlur(indicador, 'descricao');
    }).catch(() => {
      // Modal fechado sem salvar
    });
  }
  
  // Remover indicador
  async deleteIndicador(indicador: IndicadorCockpit) {
    const confirmado = confirm(
      `Remover indicador "${indicador.nome}"?\n\nTodos os dados mensais serão perdidos.`
    );
    
    if (!confirmado) return;
    
    try {
      await this.cockpitService.deleteIndicador(indicador.id).toPromise();
      
      // Remover da lista
      const index = this.indicadores.findIndex(i => i.id === indicador.id);
      if (index > -1) {
        this.indicadores.splice(index, 1);
      }
      
      // Reajustar ordem
      this.indicadores.forEach((ind, idx) => {
        ind.ordem = idx + 1;
      });
      
      this.toastr.success('Indicador removido');
      
    } catch (error) {
      this.toastr.error('Erro ao remover indicador');
      console.error(error);
    }
  }
  
  // Drag & Drop para reordenar
  onDrop(event: CdkDragDrop<IndicadorCockpit[]>) {
    // Mover no array local
    moveItemInArray(this.indicadores, event.previousIndex, event.currentIndex);
    
    // Atualizar campo "ordem"
    this.indicadores.forEach((ind, idx) => {
      ind.ordem = idx + 1;
    });
    
    // Auto-save batch (atualizar ordem de todos)
    this.saveOrdem();
  }
  
  // Salvar nova ordem (batch update)
  async saveOrdem() {
    try {
      await this.cockpitService.updateOrdemIndicadores(
        this.cockpitId,
        this.indicadores.map(ind => ({ id: ind.id, ordem: ind.ordem }))
      ).toPromise();
      
      this.toastr.success('Ordem atualizada');
      
    } catch (error) {
      this.toastr.error('Erro ao atualizar ordem');
      console.error(error);
    }
  }
  
  // Navegação com Tab/Enter (Excel-like)
  onKeyDown(event: KeyboardEvent, rowIndex: number, field: string) {
    const fields = ['nome', 'tipoMedida', 'statusMedicao', 'responsavel', 'melhor'];
    
    if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault();
      
      let nextField: string;
      let nextRow = rowIndex;
      
      if (event.shiftKey) {
        // Shift+Tab: campo anterior
        const currentIndex = fields.indexOf(field);
        if (currentIndex > 0) {
          nextField = fields[currentIndex - 1];
        } else if (rowIndex > 0) {
          nextRow = rowIndex - 1;
          nextField = fields[fields.length - 1];
        } else {
          return;
        }
      } else {
        // Tab/Enter: próximo campo
        const currentIndex = fields.indexOf(field);
        if (currentIndex < fields.length - 1) {
          nextField = fields[currentIndex + 1];
        } else if (rowIndex < this.indicadores.length - 1) {
          nextRow = rowIndex + 1;
          nextField = fields[0];
        } else {
          return;
        }
      }
      
      // Focar próximo campo
      setTimeout(() => {
        const nextElement = document.getElementById(
          `${nextField}-${this.indicadores[nextRow].ordem}`
        );
        nextElement?.focus();
      }, 50);
    }
  }
}
```

---

## Template HTML

### Desktop Grid (Simplificado)

```html
<!-- Desktop: Grid estilo Excel -->
<div class="table-responsive d-none d-lg-block">
  
  <table class="table table-hover table-bordered">
    <thead class="table-light">
      <tr>
        <th width="40" class="text-center"></th>
        <th width="50" class="text-center">#</th>
        <th width="300">Nome *</th>
        <th width="140">Tipo *</th>
        <th width="160">Status Medição</th>
        <th width="200">Responsável</th>
        <th width="120" class="text-center">Melhor *</th>
        <th width="60" class="text-center">📝</th>
        <th width="100" class="text-center">Ações</th>
      </tr>
    </thead>
    
    <tbody cdkDropList (cdkDropListDropped)="onDrop($event)">
      <tr *ngFor="let ind of indicadores; let i = index" 
          [class.row-editing]="ind.isEditing"
          [class.row-new]="ind.isNew"
          [class.row-saved]="ind.saveStatus === 'saved'"
          [class.row-error]="ind.saveStatus === 'error'"
          cdkDrag
          [cdkDragDisabled]="ind.isEditing">
        
        <!-- Drag Handle (apenas se NÃO estiver editando) -->
        <td class="text-center drag-handle" cdkDragHandle>
          <span *ngIf="!ind.isEditing" class="text-muted">☰</span>
        </td>
        
        <!-- Ordem -->
        <td class="text-center text-muted">
          {{ ind.ordem }}
        </td>
        
        <!-- Nome (inline edit) -->
        <td>
          <input type="text"
                 [(ngModel)]="ind.nome"
                 (blur)="onCellBlur(ind, 'nome')"
                 (keydown)="onKeyDown($event, i, 'nome')"
                 [id]="'nome-' + ind.ordem"
                 class="form-control form-control-sm"
                 [class.is-invalid]="!ind.nome && ind.isEditing"
                 [disabled]="!ind.isEditing"
                 placeholder="Ex: FATURAMENTO TOTAL MENSAL">
          <div *ngIf="!ind.nome && ind.isEditing" class="invalid-feedback">
            Campo obrigatório
          </div>
        </td>
        
        <!-- Tipo Medida (select inline) -->
        <td>
          <select [(ngModel)]="ind.tipoMedida"
                  (blur)="onCellBlur(ind, 'tipoMedida')"
                  (keydown)="onKeyDown($event, i, 'tipoMedida')"
                  [id]="'tipoMedida-' + ind.ordem"
                  class="form-select form-select-sm"
                  [class.is-invalid]="!ind.tipoMedida && ind.isEditing"
                  [disabled]="!ind.isEditing">
            <option value="">Selecione</option>
            <option *ngFor="let tipo of tiposMedida" [value]="tipo.value">
              {{ tipo.label }}
            </option>
          </select>
          <div *ngIf="!ind.tipoMedida && ind.isEditing" class="invalid-feedback">
            Campo obrigatório
          </div>
        </td>
        
        <!-- Status Medição -->
        <td>
          <select [(ngModel)]="ind.statusMedicao"
                  (blur)="onCellBlur(ind, 'statusMedicao')"
                  [id]="'statusMedicao-' + ind.ordem"
                  class="form-select form-select-sm"
                  [disabled]="!ind.isEditing">
            <option *ngFor="let status of statusMedicao" [value]="status.value">
              {{ status.label }}
            </option>
          </select>
        </td>
        
        <!-- Responsável (ng-select com search) -->
        <td>
          <ng-select [(ngModel)]="ind.responsavelMedicaoId"
                     [items]="usuarios"
                     bindLabel="nome"
                     bindValue="id"
                     (blur)="onCellBlur(ind, 'responsavel')"
                     [id]="'responsavel-' + ind.ordem"
                     [disabled]="!ind.isEditing"
                     [searchable]="true"
                     [clearable]="true"
                     placeholder="Selecione">
          </ng-select>
        </td>
        
        <!-- Melhor (toggle button) -->
        <td class="text-center">
          <button class="btn btn-sm w-100"
                  [class.btn-success]="ind.melhor === 'MAIOR'"
                  [class.btn-danger]="ind.melhor === 'MENOR'"
                  [disabled]="!ind.isEditing"
                  (click)="toggleMelhor(ind)">
            <span *ngIf="ind.melhor === 'MAIOR'">↑ Maior</span>
            <span *ngIf="ind.melhor === 'MENOR'">↓ Menor</span>
          </button>
        </td>
        
        <!-- Descrição (modal pequeno) -->
        <td class="text-center">
          <button class="btn btn-sm btn-link"
                  (click)="openDescricaoModal(ind)"
                  [title]="ind.descricao || 'Adicionar descrição'">
            📝
          </button>
        </td>
        
        <!-- Ações (editar/remover/confirmar) -->
        <td class="text-center">
          <!-- Modo NÃO editando -->
          <div *ngIf="!ind.isEditing" class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary"
                    (click)="enableEdit(ind)"
                    title="Editar">
              ✏️
            </button>
            <button class="btn btn-outline-danger"
                    (click)="deleteIndicador(ind)"
                    title="Remover">
              🗑️
            </button>
          </div>
          
          <!-- Modo editando -->
          <div *ngIf="ind.isEditing">
            <button class="btn btn-sm btn-success"
                    (click)="disableEdit(ind)"
                    [disabled]="!isValidForSave(ind)"
                    title="Confirmar">
              ✓
            </button>
          </div>
          
          <!-- Feedback de salvamento -->
          <div *ngIf="ind.saveStatus === 'saving'" class="text-muted small">
            <span class="spinner-border spinner-border-sm"></span>
          </div>
          <div *ngIf="ind.saveStatus === 'saved'" class="text-success small">
            ✓ Salvo
          </div>
          <div *ngIf="ind.saveStatus === 'error'" class="text-danger small">
            ✗ Erro
          </div>
        </td>
      </tr>
      
      <!-- Linha vazia se não houver indicadores -->
      <tr *ngIf="indicadores.length === 0">
        <td colspan="9" class="text-center text-muted py-4">
          Nenhum indicador cadastrado. Clique em "+ Nova Linha" para começar.
        </td>
      </tr>
    </tbody>
  </table>
  
  <!-- Botão adicionar nova linha -->
  <div class="mt-3">
    <button class="btn btn-outline-primary btn-sm" 
            (click)="addNewRow()"
            [disabled]="editingRowId !== null">
      <i class="bi bi-plus-circle"></i> Nova Linha
    </button>
    <small class="text-muted ms-2" *ngIf="editingRowId !== null">
      Finalize a edição antes de adicionar nova linha
    </small>
  </div>
</div>

<!-- Mobile: Cards + Modal -->
<div class="d-block d-lg-none">
  <div class="card mb-2" *ngFor="let ind of indicadores">
    <div class="card-body" (click)="openMobileEdit(ind)">
      <h6 class="mb-1">{{ ind.nome || 'Novo Indicador' }}</h6>
      <small class="text-muted">
        <span class="badge bg-secondary">{{ getTipoLabel(ind.tipoMedida) }}</span>
        <span class="badge" 
              [class.bg-success]="ind.melhor === 'MAIOR'"
              [class.bg-danger]="ind.melhor === 'MENOR'">
          {{ ind.melhor === 'MAIOR' ? '↑ Maior' : '↓ Menor' }}
        </span>
      </small>
      <div *ngIf="ind.responsavel" class="mt-1">
        <small><i class="bi bi-person"></i> {{ ind.responsavel.nome }}</small>
      </div>
    </div>
  </div>
  
  <button class="btn btn-primary w-100 mt-2" (click)="openMobileCreate()">
    + Novo Indicador
  </button>
</div>
```

---

## SCSS Styles

```scss
// matriz-indicadores.component.scss

// Grid
.table {
  font-size: 0.9rem;
  
  th {
    background-color: #f8f9fa;
    font-weight: 600;
    position: sticky;
    top: 0;
    z-index: 10;
  }
  
  td {
    vertical-align: middle;
  }
}

// Estados da linha
.row-editing {
  background-color: #fff3cd !important; // Amarelo claro
  
  input, select, ng-select {
    background-color: white !important;
  }
}

.row-new {
  border-left: 3px solid #0d6efd; // Azul
}

.row-saved {
  background-color: #d1e7dd !important; // Verde claro
  transition: background-color 2s ease;
}

.row-error {
  background-color: #f8d7da !important; // Vermelho claro
}

// Drag handle
.drag-handle {
  cursor: grab;
  user-select: none;
  
  &:active {
    cursor: grabbing;
  }
}

// CDK Drag Preview
.cdk-drag-preview {
  opacity: 0.8;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}

.cdk-drag-placeholder {
  opacity: 0.4;
  background-color: #e9ecef;
}

.cdk-drag-animating {
  transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
}

// Campos inline
input.form-control-sm,
select.form-select-sm {
  &:disabled {
    background-color: transparent;
    border-color: transparent;
    cursor: default;
  }
  
  &:not(:disabled) {
    border-color: #ced4da;
  }
}

// ng-select customização
::ng-deep {
  .ng-select.ng-select-disabled {
    .ng-select-container {
      background-color: transparent !important;
      border-color: transparent !important;
    }
  }
  
  .ng-select.ng-select-focused {
    .ng-select-container {
      border-color: #86b7fe !important;
      box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
    }
  }
}

// Botões de ação
.btn-group-sm {
  white-space: nowrap;
}

// Feedback visual
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}

// Mobile cards
.card {
  cursor: pointer;
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
}

// Validações
.is-invalid {
  border-color: #dc3545 !important;
  
  &:focus {
    box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25) !important;
  }
}

.invalid-feedback {
  display: block;
  font-size: 0.75rem;
}
```

---

## Modal de Descrição

### Template: descricao-indicador-modal.component.html

```html
<div class="modal-header">
  <h5 class="modal-title">Descrição do Indicador</h5>
  <button type="button" class="btn-close" (click)="activeModal.dismiss()"></button>
</div>

<div class="modal-body">
  <textarea class="form-control" 
            [(ngModel)]="descricao"
            rows="5"
            placeholder="Ex: TOTAL EM R$ VENDIDOS VIA CANAL INDIRETO"
            autofocus></textarea>
  <small class="text-muted mt-2 d-block">
    Descrição detalhada opcional do indicador
  </small>
</div>

<div class="modal-footer">
  <button type="button" class="btn btn-secondary" (click)="activeModal.dismiss()">
    Cancelar
  </button>
  <button type="button" class="btn btn-primary" (click)="save()">
    Salvar
  </button>
</div>
```

### TypeScript: descricao-indicador-modal.component.ts

```typescript
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-descricao-indicador-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './descricao-indicador-modal.component.html'
})
export class DescricaoIndicadorModalComponent {
  @Input() descricao: string = '';
  
  constructor(public activeModal: NgbActiveModal) {}
  
  save() {
    this.activeModal.close(this.descricao);
  }
}
```

---

## Mobile: Modal/Side Panel

### Opção Recomendada: NgbModal (Fullscreen em Mobile)

```typescript
// matriz-indicadores.component.ts (método mobile)

openMobileCreate() {
  const modalRef = this.modalService.open(IndicadorMobileModalComponent, {
    size: 'lg',
    fullscreen: 'sm', // Fullscreen apenas em mobile
    centered: true
  });
  
  modalRef.componentInstance.cockpitId = this.cockpitId;
  modalRef.componentInstance.usuarios = this.usuarios;
  modalRef.componentInstance.isNew = true;
  
  modalRef.result.then((indicador: IndicadorCockpit) => {
    this.indicadores.push(indicador);
    this.toastr.success('Indicador criado');
  }).catch(() => {
    // Modal fechado sem salvar
  });
}

openMobileEdit(indicador: IndicadorCockpit) {
  const modalRef = this.modalService.open(IndicadorMobileModalComponent, {
    size: 'lg',
    fullscreen: 'sm',
    centered: true
  });
  
  modalRef.componentInstance.indicador = { ...indicador };
  modalRef.componentInstance.usuarios = this.usuarios;
  modalRef.componentInstance.isNew = false;
  
  modalRef.result.then((updated: IndicadorCockpit) => {
    Object.assign(indicador, updated);
    this.toastr.success('Indicador atualizado');
  }).catch(() => {
    // Modal fechado sem salvar
  });
}
```

---

## Validações e Regras

### Validações Frontend

| Campo | Obrigatório | Validação | Feedback |
|-------|-------------|-----------|----------|
| Nome | ✅ Sim | `.trim().length > 0` | Borda vermelha + "Campo obrigatório" |
| Tipo Medida | ✅ Sim | Enum válido | Borda vermelha + "Campo obrigatório" |
| Melhor | ✅ Sim | MAIOR ou MENOR | Sempre válido (toggle) |
| Descrição | ❌ Não | Opcional | - |
| Responsável | ❌ Não | UUID válido | - |
| Status Medição | ❌ Não | Enum válido (default: NAO_MEDIDO) | - |

### Regras de Negócio

1. **Criação:**
   - Backend cria automaticamente 13 registros `IndicadorMensal` (jan-dez + resumo anual)
   - Campo `ordem` é auto-incrementado
   - Multi-tenancy: indicador pertence ao cockpit da empresa

2. **Edição:**
   - Apenas campos do indicador são editáveis
   - Meses são editados em componente separado (matriz-meses)

3. **Remoção:**
   - Cascade delete: remove automaticamente os 13 registros mensais
   - Confirmação obrigatória

4. **Reordenação:**
   - Atualiza campo `ordem` de todos os indicadores
   - Endpoint batch: `PATCH /cockpits/:id/indicadores/ordem`

---

## Endpoints Backend (Referência)

| Endpoint | Método | Descrição | Body |
|----------|--------|-----------|------|
| `POST /cockpits/:id/indicadores` | POST | Criar indicador | `{nome, tipoMedida, melhor, descricao?, responsavelId?, statusMedicao?}` |
| `PATCH /indicadores/:id` | PATCH | Atualizar indicador | `{nome?, descricao?, tipoMedida?, ...}` |
| `DELETE /indicadores/:id` | DELETE | Remover indicador | - |
| `PATCH /cockpits/:id/indicadores/ordem` | PATCH | Atualizar ordem | `[{id, ordem}, ...]` |

---

## Gráficos (Integração)

### Mostrar Gráfico Vazio Após Criação

```typescript
// Após criar indicador, carregar componente de gráfico
async saveIndicador(indicador: IndicadorCockpit) {
  // ... código de salvamento ...
  
  if (indicador.isNew && created) {
    // Renderizar gráfico vazio para o indicador
    this.graficoService.initChart(created.id, {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
               'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      tipo: created.tipoMedida
    });
  }
}
```

**Visual esperado:**
- Gráfico de linha vazio (sem dados)
- Eixo X: Jan-Dez
- Eixo Y: 0
- Mensagem: "Preencha os valores mensais para visualizar o gráfico"

---

## Padrões Extraídos (Consistência com Projeto)

### Auto-Save com Debounce (Padrão do Projeto)

```typescript
// diagnostico-notas.component.ts (referência)
private setupAutoSave() {
  this.autoSaveSubject.pipe(
    debounceTime(1000), // 1000ms como padrão
    distinctUntilChanged()
  ).subscribe(data => {
    this.save(data);
  });
}
```

### Feedback Visual (Toast + Spinner)

```typescript
// Padrão do projeto
this.toastr.success('Operação realizada com sucesso');
this.toastr.error('Erro ao realizar operação');
this.toastr.warning('Preencha os campos obrigatórios');
```

### RBAC Frontend

```typescript
// Validação de perfil
canEdit(): boolean {
  const perfil = this.authService.getPerfilUsuario();
  return perfil === 'ADMINISTRADOR' || perfil === 'GESTOR';
}

// Aplicar no template
<button [disabled]="!canEdit()">Editar</button>
```

---

## Checklist de Implementação (Dev Agent)

### Fase 1: Componente Base
- [ ] Criar `matriz-indicadores.component.ts/html/scss`
- [ ] Implementar estrutura do grid (desktop)
- [ ] Implementar cards (mobile)
- [ ] Configurar imports e dependências

### Fase 2: CRUD Inline
- [ ] Implementar `addNewRow()`
- [ ] Implementar `enableEdit()` e `disableEdit()`
- [ ] Implementar `saveIndicador()` (CREATE + UPDATE)
- [ ] Implementar `deleteIndicador()` com confirmação

### Fase 3: Auto-Save
- [ ] Configurar Subject + debounceTime(1000)
- [ ] Implementar `onCellBlur()`
- [ ] Implementar validação `isValidForSave()`
- [ ] Adicionar feedback visual (spinner, ✓, ✗)

### Fase 4: Navegação Excel-like
- [ ] Implementar `onKeyDown()` (Tab/Enter)
- [ ] Configurar foco automático ao criar linha
- [ ] Testar navegação bidirecional (Shift+Tab)

### Fase 5: Drag & Drop
- [ ] Configurar CDK Drag Drop
- [ ] Implementar `onDrop()`
- [ ] Implementar `saveOrdem()` (batch update)
- [ ] Desabilitar drag durante edição

### Fase 6: Modais
- [ ] Criar `descricao-indicador-modal.component`
- [ ] Criar `indicador-mobile-modal.component`
- [ ] Implementar `openDescricaoModal()`
- [ ] Implementar `openMobileCreate()` e `openMobileEdit()`

### Fase 7: Integração
- [ ] Conectar com `CockpitPilaresService`
- [ ] Carregar usuários para ng-select
- [ ] Integrar com componente de gráficos
- [ ] Testar multi-tenancy (filtros por empresa)

### Fase 8: Estilos e UX
- [ ] Aplicar estilos SCSS
- [ ] Testar responsividade (breakpoints)
- [ ] Validar cores de status (editing, saved, error)
- [ ] Testar em mobile real

### Fase 9: Validação e Testes
- [ ] Testes unitários (criação, edição, remoção)
- [ ] Testes de validação (campos obrigatórios)
- [ ] Testes de auto-save (debounce)
- [ ] Testes de drag & drop

---

## Consequências

### Positivas
✅ **Velocidade:** Setup inicial de 10 indicadores ~70% mais rápido que modais  
✅ **Familiaridade:** UX alinhada com Excel (contexto do usuário)  
✅ **Contexto:** Visão completa de todos os indicadores ao criar/editar  
✅ **Escalabilidade:** Funciona para 5-50 indicadores sem perda de UX  
✅ **Consistência:** Mantém padrões do projeto (auto-save, RBAC, toast)  
✅ **Mobile:** Fallback adequado (cards + modal fullscreen)  
✅ **Manutenção:** Adicionar 1-2 indicadores depois é trivial  

### Negativas
⚠️ **Complexidade frontend:** Mais estados (editing, saving, saved, error)  
⚠️ **Validação:** Feedback inline pode confundir usuários inexperientes  
⚠️ **Responsividade:** Grid não funciona em mobile (exige fallback)  
⚠️ **Drag & drop:** Precisa desabilitar em modo edição (controle extra)  
⚠️ **Testes:** Mais casos de teste (navegação Tab, drag, auto-save)  

### Neutras
🔵 **Descrição em modal:** Solução intermediária (não inline, não fullscreen)  
🔵 **Gráfico vazio:** Decisão de mostrar imediatamente vs aguardar dados  
🔵 **ng-select:** Depende de biblioteca externa (já usada no projeto)  

---

## Alternativas Consideradas e Rejeitadas

### 1. Modal Tradicional (Original)
**Rejeitada:** Setup de 10 indicadores = 60 cliques (lento, interruptivo)

### 2. Side Panel Exclusivo
**Rejeitada:** Ocupa espaço lateral permanentemente (mobile fica ruim)

### 3. Stepper/Wizard Inline
**Rejeitada:** Over-engineering para indicador simples

### 4. Descrição inline (textarea na grid)
**Rejeitada:** Quebra layout, especialmente com múltiplas linhas

---

## Referências

- **Padrão auto-save:** [diagnostico-notas.component.ts](diagnostico-notas.component.ts) (linhas 215-228)
- **RBAC frontend:** `/docs/conventions/frontend.md`
- **ADR-003:** Arquitetura de Cockpit de Pilares
- **Business Rules:** `/docs/business-rules/cockpit-pilares.md`
- **Angular CDK Drag Drop:** https://material.angular.io/cdk/drag-drop/overview
- **ng-select:** https://github.com/ng-select/ng-select

---

**Decisão aprovada em:** 2026-01-15  
**Para implementação por:** Dev Agent  
**Revisão prevista:** Após feedback de usuários beta (Fase 1)
