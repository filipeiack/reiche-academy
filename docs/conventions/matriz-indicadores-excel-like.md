# Especificação Técnica: Matriz de Indicadores (Excel-like)

**Baseado em:** ADR-005 (UX Excel-like para Indicadores)  
**Para:** Dev Agent (implementação)  
**Agente:** System Engineer (Modo Documentação)  
**Data:** 2026-01-15  
**Status:** 📋 **NORMATIVO** (especificação para implementação)

---

## 📋 Sumário Executivo

Este documento especifica **TODOS os detalhes técnicos** para implementação do componente `matriz-indicadores` com UX Excel-like.

**Decisão aprovada:** ADR-005  
**Contexto:** Usuários vêm de planilhas Excel e esperam edição inline rápida  
**Setup inicial:** ~10 indicadores criados de uma vez  

---

## 🎯 Requisitos Funcionais

### RF-01: Adicionar Nova Linha
**Como:** Botão "+ Nova Linha"  
**Comportamento:**
- Adiciona linha vazia ao final da grid
- Linha entra em modo edição automaticamente
- Foco automático no campo "Nome" (100ms delay)
- Drag handle (☰) oculto enquanto linha está em edição
- Botão "+ Nova Linha" desabilitado se já houver linha em edição

**Validação:**
- Apenas UMA linha em edição por vez
- Linha nova tem borda azul à esquerda (`border-left: 3px solid #0d6efd`)

---

### RF-02: Habilitar Edição de Linha Existente
**Como:** Ícone ✏️ (editar) em cada linha

**Comportamento:**
- Clicar ✏️ habilita edição inline
- Campos ficam editáveis (background branco, bordas visíveis)
- Drag handle (☰) desaparece
- Ícone ✏️ vira ✓ (confirmar)
- Linha anterior em edição é salva automaticamente (se válida)

**Validação:**
- Apenas UMA linha em edição por vez
- Linha em edição tem background amarelo (`#fff3cd`)

---

### RF-03: Confirmar Edição
**Como:** Ícone ✓ (confirmar)

**Comportamento:**
- Valida campos obrigatórios (nome, tipo, melhor)
- Se válido: sai do modo edição
- Se inválido: mostra toast "Preencha os campos obrigatórios"
- Campos voltam para modo leitura (background transparente)
- Drag handle (☰) reaparece

---

### RF-04: Auto-Save ao Perder Foco
**Como:** Evento `(blur)` em cada campo

**Comportamento:**
1. Campo perde foco
2. Validação: `isValidForSave()` verifica campos obrigatórios
3. Se inválido: não salva
4. Se válido: envia para Subject (debounce 1000ms)
5. Após 1000ms sem novo evento: chama `saveIndicador()`
6. Status vira "saving" → Spinner aparece
7. Sucesso: Status vira "saved" → ✓ verde (2s)
8. Erro: Status vira "error" → ✗ vermelho + toast

**Validação:**
- Debounce EXATAMENTE 1000ms (padrão do projeto)
- Usar `distinctUntilChanged` para evitar salvamentos duplicados
- Linha nova (`isNew: true`) → POST
- Linha existente → PATCH

---

### RF-05: Navegação Tab/Enter (Excel-like)
**Como:** Teclado (Tab, Enter, Shift+Tab)

**Comportamento:**
- **Tab** ou **Enter**: Próximo campo (mesma linha) ou primeiro campo da próxima linha
- **Shift+Tab**: Campo anterior (mesma linha) ou último campo da linha anterior
- **Bordas**: Não sai da grid (primeiro/último campo não navega)

**Ordem dos campos:**
1. Nome
2. Tipo Medida
3. Status Medição
4. Responsável
5. Melhor

**Implementação:**
- IDs únicos: `nome-1`, `tipoMedida-1`, etc.
- `event.preventDefault()` para evitar comportamento padrão do Tab
- `setTimeout(50)` para focar próximo campo

---

### RF-06: Remover Indicador
**Como:** Ícone 🗑️ (remover)

**Comportamento:**
1. Clique no ícone
2. Confirmação: "Remover indicador 'NOME'? Todos os dados mensais (jan-dez) serão perdidos."
3. Se confirmado: DELETE /indicadores/:id
4. Sucesso: Remove linha da grid + toast "Indicador removido"
5. Reajusta campo "ordem" de todos os indicadores restantes

**Validação:**
- Confirmação obrigatória (usar `confirm()` nativo)
- Backend faz cascade delete (remove 13 registros mensais)

---

### RF-07: Drag & Drop para Reordenar
**Como:** Drag handle (☰) à esquerda de cada linha

**Comportamento:**
1. Usuário arrasta linha para nova posição
2. Grid reordena visualmente
3. Atualiza campo "ordem" de TODOS os indicadores
4. Chama `saveOrdem()` → PATCH /cockpits/:id/indicadores/ordem (batch update)
5. Toast: "Ordem atualizada"

**Validação:**
- Drag handle VISÍVEL APENAS em linhas NÃO editáveis
- `[cdkDragDisabled]="ind.isEditing"` obrigatório
- Cursor muda para `grab` ao hover, `grabbing` ao arrastar

---

### RF-08: Descrição (Modal Pequeno)
**Como:** Ícone 📝 na coluna "Descrição"

**Comportamento:**
1. Clique no ícone
2. Abre modal (tamanho `lg`, centrado)
3. Textarea com 5 linhas
4. Botões: Cancelar | Salvar
5. Salvar: Fecha modal + auto-save (blur)

**Validação:**
- Modal NÃO bloqueia criação do indicador (descrição é opcional)
- Placeholder: "Ex: TOTAL EM R$ VENDIDOS VIA CANAL INDIRETO"

---

### RF-09: Responsável (ng-select com Search)
**Como:** Dropdown com busca

**Comportamento:**
- Campo `ng-select` compacto
- Busca por nome (`[searchable]="true"`)
- Pode ficar vazio (`[clearable]="true"`)
- Carrega lista de usuários da empresa

**Validação:**
- Opcional (pode ficar vazio)
- Apenas usuários da mesma empresa (multi-tenant)

---

### RF-10: Mobile (Cards + Modal Fullscreen)
**Como:** Breakpoint `d-none d-lg-block` (grid) + `d-block d-lg-none` (cards)

**Comportamento:**
- Desktop (>= 992px): Grid inline
- Mobile (< 992px): Cards clicáveis
- Clique em card: Abre modal fullscreen (apenas em mobile)
- Botão "+ Novo Indicador": Abre modal fullscreen

**Modal mobile:**
- Formulário vertical com todos os campos
- `fullscreen: 'sm'` (fullscreen apenas < 576px)
- Salvar: POST ou PATCH + fecha modal

---

## 🛠️ Especificação Técnica

### Estrutura de Arquivos

```
frontend/src/app/views/pages/cockpit-pilares/
├── matriz-indicadores/
│   ├── matriz-indicadores.component.ts       # ← Componente principal
│   ├── matriz-indicadores.component.html     # ← Grid desktop + Cards mobile
│   ├── matriz-indicadores.component.scss     # ← Estilos + estados visuais
│   └── matriz-indicadores.component.spec.ts  # ← Testes

modals/
├── descricao-indicador-modal/
│   ├── descricao-indicador-modal.component.ts
│   ├── descricao-indicador-modal.component.html
│   └── descricao-indicador-modal.component.scss
└── indicador-mobile-modal/
    ├── indicador-mobile-modal.component.ts
    ├── indicador-mobile-modal.component.html
    └── indicador-mobile-modal.component.scss
```

---

### Dependências (Imports)

```typescript
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslatePipe } from '@ngx-translate/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { inject } from '@angular/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

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

### Interface e Tipos

```typescript
// Enum de tipos (frontend)
const TIPOS_MEDIDA = [
  { value: 'REAL', label: 'R$ (Reais)' },
  { value: 'QUANTIDADE', label: 'Quantidade' },
  { value: 'TEMPO', label: 'Tempo (horas/dias)' },
  { value: 'PERCENTUAL', label: '% (Percentual)' }
];

const STATUS_MEDICAO = [
  { value: 'NAO_MEDIDO', label: 'Não Medido' },
  { value: 'MEDIDO_NAO_CONFIAVEL', label: 'Não Confiável' },
  { value: 'MEDIDO_CONFIAVEL', label: 'Confiável' }
];

// Interface estendida (com campos de controle)
interface IndicadorCockpit {
  // Campos do backend
  id: string | null;
  nome: string;
  descricao: string | null;
  tipoMedida: 'REAL' | 'QUANTIDADE' | 'TEMPO' | 'PERCENTUAL' | null;
  statusMedicao: 'NAO_MEDIDO' | 'MEDIDO_NAO_CONFIAVEL' | 'MEDIDO_CONFIAVEL';
  responsavelMedicaoId: string | null;
  melhor: 'MAIOR' | 'MENOR';
  ordem: number;
  ativo: boolean;
  createdAt?: string;
  updatedAt?: string;
  
  // Campos de controle (frontend only - não enviar para backend)
  isEditing?: boolean;
  isNew?: boolean;
  saveStatus?: 'saving' | 'saved' | 'error' | null;
}
```

---

### Propriedades do Componente

```typescript
export class MatrizIndicadoresComponent implements OnInit {
  // Dados
  indicadores: IndicadorCockpit[] = [];
  usuarios: Usuario[] = [];
  @Input() cockpitId!: string;
  
  // Controle de edição
  editingRowId: string | null = null;
  
  // Auto-save
  private autoSaveSubject = new Subject<{
    indicador: IndicadorCockpit;
    field: string;
  }>();
  
  // Enums
  tiposMedida = TIPOS_MEDIDA;
  statusMedicao = STATUS_MEDICAO;
  
  // Injeções
  private cockpitService = inject(CockpitPilaresService);
  private usuarioService = inject(UsuarioService);
  private modalService = inject(NgbModal);
  private toastr = inject(ToastrService);
}
```

---

### Métodos Principais (Especificação Completa)

#### 1. `ngOnInit()`

```typescript
ngOnInit() {
  this.loadIndicadores();
  this.loadUsuarios();
  this.setupAutoSave();
}
```

---

#### 2. `setupAutoSave()`

```typescript
private setupAutoSave() {
  this.autoSaveSubject.pipe(
    debounceTime(1000), // ⚠️ OBRIGATÓRIO: 1000ms
    distinctUntilChanged((prev, curr) => 
      prev.indicador.id === curr.indicador.id && 
      prev.field === curr.field
    )
  ).subscribe(({indicador, field}) => {
    this.saveIndicador(indicador);
  });
}
```

**Validação:**
- Debounce EXATAMENTE 1000ms (padrão do projeto)
- `distinctUntilChanged` previne salvamentos duplicados

---

#### 3. `loadIndicadores()`

```typescript
async loadIndicadores() {
  try {
    this.indicadores = await this.cockpitService
      .getIndicadores(this.cockpitId)
      .toPromise();
  } catch (error) {
    this.toastr.error('Erro ao carregar indicadores');
    console.error(error);
  }
}
```

---

#### 4. `loadUsuarios()`

```typescript
async loadUsuarios() {
  try {
    this.usuarios = await this.usuarioService
      .getUsuariosDaEmpresa() // Multi-tenant: apenas empresa do usuário logado
      .toPromise();
  } catch (error) {
    console.error('Erro ao carregar usuários', error);
  }
}
```

---

#### 5. `addNewRow()`

```typescript
addNewRow() {
  // Validar se já existe linha em edição
  if (this.editingRowId !== null) {
    this.toastr.warning('Finalize a edição antes de adicionar nova linha');
    return;
  }
  
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
```

**Validação:**
- Impedir adição se `editingRowId !== null`
- ID temporário: `'new-' + Date.now()`
- Auto-focus com delay de 100ms

---

#### 6. `enableEdit(indicador)`

```typescript
enableEdit(indicador: IndicadorCockpit) {
  // Salvar linha anterior se houver
  if (this.editingRowId && this.editingRowId !== indicador.id) {
    const previousEditing = this.indicadores.find(i => i.id === this.editingRowId);
    if (previousEditing && this.isValidForSave(previousEditing)) {
      previousEditing.isEditing = false;
    }
  }
  
  indicador.isEditing = true;
  this.editingRowId = indicador.id;
}
```

**Validação:**
- Fechar edição anterior automaticamente
- Apenas UMA linha em edição por vez

---

#### 7. `disableEdit(indicador)`

```typescript
disableEdit(indicador: IndicadorCockpit) {
  if (this.isValidForSave(indicador)) {
    indicador.isEditing = false;
    this.editingRowId = null;
  } else {
    this.toastr.warning('Preencha os campos obrigatórios: Nome, Tipo e Melhor');
  }
}
```

---

#### 8. `isValidForSave(indicador)`

```typescript
isValidForSave(indicador: IndicadorCockpit): boolean {
  return !!(
    indicador.nome?.trim() &&
    indicador.tipoMedida &&
    indicador.melhor
  );
}
```

**Campos obrigatórios:**
- Nome (string não vazia)
- Tipo de Medida (enum)
- Melhor (enum: MAIOR ou MENOR)

---

#### 9. `onCellBlur(indicador, field)`

```typescript
onCellBlur(indicador: IndicadorCockpit, field: string) {
  if (!this.isValidForSave(indicador)) {
    return; // Não salva se inválido
  }
  
  // Envia para subject (debounce 1000ms aplicado)
  this.autoSaveSubject.next({indicador, field});
}
```

---

#### 10. `saveIndicador(indicador)`

```typescript
async saveIndicador(indicador: IndicadorCockpit) {
  indicador.saveStatus = 'saving';
  
  try {
    if (indicador.isNew) {
      // POST /cockpits/:cockpitId/indicadores
      const created = await this.cockpitService.createIndicador(
        this.cockpitId,
        {
          nome: indicador.nome,
          descricao: indicador.descricao,
          tipoMedida: indicador.tipoMedida!,
          statusMedicao: indicador.statusMedicao,
          responsavelMedicaoId: indicador.responsavelMedicaoId,
          melhor: indicador.melhor,
          ordem: indicador.ordem
        }
      ).toPromise();
      
      // Atualizar com dados do backend (id, timestamps)
      Object.assign(indicador, created);
      indicador.isNew = false;
      indicador.isEditing = false;
      this.editingRowId = null;
      
      this.toastr.success('Indicador criado com sucesso');
      
      // Inicializar gráfico vazio
      this.initGraficoVazio(created);
      
    } else {
      // PATCH /indicadores/:id
      await this.cockpitService.updateIndicador(indicador.id!, {
        nome: indicador.nome,
        descricao: indicador.descricao,
        tipoMedida: indicador.tipoMedida!,
        statusMedicao: indicador.statusMedicao,
        responsavelMedicaoId: indicador.responsavelMedicaoId,
        melhor: indicador.melhor
      }).toPromise();
    }
    
    // Feedback visual: ✓ salvo (2s)
    indicador.saveStatus = 'saved';
    setTimeout(() => indicador.saveStatus = null, 2000);
    
  } catch (error) {
    indicador.saveStatus = 'error';
    this.toastr.error('Erro ao salvar indicador');
    console.error(error);
  }
}
```

**Comportamento:**
- Linha nova → POST (backend cria 13 registros mensais automaticamente)
- Linha existente → PATCH
- Status: `saving` → `saved` (2s) → `null`

---

#### 11. `toggleMelhor(indicador)`

```typescript
toggleMelhor(indicador: IndicadorCockpit) {
  indicador.melhor = indicador.melhor === 'MAIOR' ? 'MENOR' : 'MAIOR';
  this.onCellBlur(indicador, 'melhor');
}
```

---

#### 12. `deleteIndicador(indicador)`

```typescript
async deleteIndicador(indicador: IndicadorCockpit) {
  const confirmado = confirm(
    `Remover indicador "${indicador.nome}"?\n\n` +
    `Todos os dados mensais (jan-dez) serão perdidos.`
  );
  
  if (!confirmado) return;
  
  try {
    await this.cockpitService.deleteIndicador(indicador.id!).toPromise();
    
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
```

---

#### 13. `onDrop(event)` (Drag & Drop)

```typescript
onDrop(event: CdkDragDrop<IndicadorCockpit[]>) {
  // Mover no array local
  moveItemInArray(this.indicadores, event.previousIndex, event.currentIndex);
  
  // Atualizar campo "ordem"
  this.indicadores.forEach((ind, idx) => {
    ind.ordem = idx + 1;
  });
  
  // Auto-save batch
  this.saveOrdem();
}
```

---

#### 14. `saveOrdem()`

```typescript
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
```

---

#### 15. `onKeyDown(event, rowIndex, field)` (Navegação Tab)

```typescript
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
        return; // Primeiro campo da primeira linha
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
        return; // Último campo da última linha
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
```

---

#### 16. `openDescricaoModal(indicador)`

```typescript
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
```

---

#### 17. `initGraficoVazio(indicador)` (Integração com Gráficos)

```typescript
private initGraficoVazio(indicador: IndicadorCockpit) {
  // Disparar evento ou chamar serviço de gráficos
  this.graficoService?.initChart(indicador.id!, {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
             'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    tipo: indicador.tipoMedida!,
    melhor: indicador.melhor
  });
}
```

---

#### 18. Mobile: `openMobileCreate()` e `openMobileEdit()`

```typescript
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
  }).catch(() => {});
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
  }).catch(() => {});
}

getTipoLabel(tipo: string | null): string {
  return this.tiposMedida.find(t => t.value === tipo)?.label || '-';
}
```

---

## 🎨 Template HTML (Completo)

### Desktop Grid

```html
<!-- Desktop: Grid Excel-like -->
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
        
        <!-- Drag Handle -->
        <td class="text-center drag-handle" cdkDragHandle>
          <span *ngIf="!ind.isEditing" class="text-muted">☰</span>
        </td>
        
        <!-- Ordem -->
        <td class="text-center text-muted">{{ ind.ordem }}</td>
        
        <!-- Nome -->
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
        
        <!-- Tipo Medida -->
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
        
        <!-- Responsável -->
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
        
        <!-- Melhor -->
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
        
        <!-- Descrição -->
        <td class="text-center">
          <button class="btn btn-sm btn-link"
                  (click)="openDescricaoModal(ind)"
                  [title]="ind.descricao || 'Adicionar descrição'">
            📝
          </button>
        </td>
        
        <!-- Ações -->
        <td class="text-center">
          <div *ngIf="!ind.isEditing" class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary"
                    (click)="enableEdit(ind)"
                    title="Editar">✏️</button>
            <button class="btn btn-outline-danger"
                    (click)="deleteIndicador(ind)"
                    title="Remover">🗑️</button>
          </div>
          
          <div *ngIf="ind.isEditing">
            <button class="btn btn-sm btn-success"
                    (click)="disableEdit(ind)"
                    [disabled]="!isValidForSave(ind)"
                    title="Confirmar">✓</button>
          </div>
          
          <!-- Feedback -->
          <div *ngIf="ind.saveStatus === 'saving'" class="text-muted small mt-1">
            <span class="spinner-border spinner-border-sm"></span>
          </div>
          <div *ngIf="ind.saveStatus === 'saved'" class="text-success small mt-1">
            ✓ Salvo
          </div>
          <div *ngIf="ind.saveStatus === 'error'" class="text-danger small mt-1">
            ✗ Erro
          </div>
        </td>
      </tr>
      
      <!-- Linha vazia -->
      <tr *ngIf="indicadores.length === 0">
        <td colspan="9" class="text-center text-muted py-4">
          Nenhum indicador cadastrado. Clique em "+ Nova Linha" para começar.
        </td>
      </tr>
    </tbody>
  </table>
  
  <button class="btn btn-outline-primary btn-sm mt-3" 
          (click)="addNewRow()"
          [disabled]="editingRowId !== null">
    <i class="bi bi-plus-circle"></i> Nova Linha
  </button>
  <small class="text-muted ms-2" *ngIf="editingRowId !== null">
    Finalize a edição antes de adicionar nova linha
  </small>
</div>

<!-- Mobile: Cards -->
<div class="d-block d-lg-none">
  <div class="card mb-2" *ngFor="let ind of indicadores" (click)="openMobileEdit(ind)">
    <div class="card-body">
      <h6 class="mb-1">{{ ind.nome || 'Novo Indicador' }}</h6>
      <small class="text-muted">
        <span class="badge bg-secondary">{{ getTipoLabel(ind.tipoMedida) }}</span>
        <span class="badge ms-1" 
              [class.bg-success]="ind.melhor === 'MAIOR'"
              [class.bg-danger]="ind.melhor === 'MENOR'">
          {{ ind.melhor === 'MAIOR' ? '↑ Maior' : '↓ Menor' }}
        </span>
      </small>
    </div>
  </div>
  
  <button class="btn btn-primary w-100 mt-2" (click)="openMobileCreate()">
    + Novo Indicador
  </button>
</div>
```

---

## 🎨 SCSS (Completo)

```scss
// matriz-indicadores.component.scss

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
  transition: background-color 2s ease; // Fade out em 2s
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

// CDK Drag Visual Feedback
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

// Feedback visual
.spinner-border-sm {
  width: 1rem;
  height: 1rem;
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

// Mobile cards
.card {
  cursor: pointer;
  transition: box-shadow 0.2s;
  
  &:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
}

// Botões de ação
.btn-group-sm {
  white-space: nowrap;
}
```

---

## 📝 Modal de Descrição

### TypeScript

```typescript
// descricao-indicador-modal.component.ts
import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-descricao-indicador-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './descricao-indicador-modal.component.html',
  styleUrls: ['./descricao-indicador-modal.component.scss']
})
export class DescricaoIndicadorModalComponent {
  @Input() descricao: string = '';
  
  constructor(public activeModal: NgbActiveModal) {}
  
  save() {
    this.activeModal.close(this.descricao);
  }
}
```

### HTML

```html
<!-- descricao-indicador-modal.component.html -->
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

---

## 🔗 Endpoints Backend (Referência)

| Endpoint | Método | Body | Response |
|----------|--------|------|----------|
| `POST /cockpits/:id/indicadores` | POST | `{nome, tipoMedida, melhor, descricao?, responsavelId?, statusMedicao?}` | `IndicadorCockpit + 13 meses vazios` |
| `PATCH /indicadores/:id` | PATCH | `{nome?, descricao?, tipoMedida?, statusMedicao?, responsavelId?, melhor?}` | `IndicadorCockpit` |
| `DELETE /indicadores/:id` | DELETE | - | `204 No Content` |
| `PATCH /cockpits/:id/indicadores/ordem` | PATCH | `[{id, ordem}, {id, ordem}, ...]` | `IndicadorCockpit[]` |

**Regras backend:**
- POST cria automaticamente 13 registros `IndicadorMensal` (jan-dez + resumo anual)
- DELETE faz cascade (remove 13 registros mensais)
- Multi-tenancy: validar empresa do usuário

---

## ✅ Checklist de Implementação (Dev Agent)

### Fase 1: Setup
- [ ] Criar pasta `matriz-indicadores/`
- [ ] Criar componente com CLI: `ng g c matriz-indicadores --standalone`
- [ ] Configurar imports (DragDropModule, NgSelectModule, NgbModalModule)
- [ ] Definir interface `IndicadorCockpit` estendida

### Fase 2: Estrutura HTML
- [ ] Template da tabela (thead + tbody)
- [ ] Breakpoint `d-none d-lg-block` (grid)
- [ ] Breakpoint `d-block d-lg-none` (cards)
- [ ] Aplicar `cdkDropList` no tbody

### Fase 3: Campos Editáveis
- [ ] Input Nome com `[(ngModel)]`
- [ ] Select Tipo Medida
- [ ] Select Status Medição
- [ ] ng-select Responsável (com search)
- [ ] Botão toggle Melhor (↑/↓)
- [ ] IDs únicos: `nome-1`, `tipoMedida-1`, etc.

### Fase 4: Estados Visuais (SCSS)
- [ ] `.row-editing` (amarelo)
- [ ] `.row-new` (borda azul)
- [ ] `.row-saved` (verde com fade)
- [ ] `.row-error` (vermelho)
- [ ] `.drag-handle` (cursor grab)
- [ ] Campos desabilitados transparentes

### Fase 5: CRUD
- [ ] Implementar `addNewRow()`
- [ ] Implementar `enableEdit()` e `disableEdit()`
- [ ] Implementar `saveIndicador()` (CREATE + UPDATE)
- [ ] Implementar `deleteIndicador()` com confirmação
- [ ] Implementar `isValidForSave()`

### Fase 6: Auto-Save
- [ ] Criar Subject `autoSaveSubject`
- [ ] Configurar `debounceTime(1000)`
- [ ] Implementar `setupAutoSave()`
- [ ] Implementar `onCellBlur()`
- [ ] Feedback visual (spinner, ✓, ✗)

### Fase 7: Navegação Tab
- [ ] Implementar `onKeyDown()`
- [ ] Aplicar `(keydown)` em todos os campos
- [ ] Testar Tab, Enter, Shift+Tab
- [ ] Auto-focus ao criar linha

### Fase 8: Drag & Drop
- [ ] Implementar `onDrop()`
- [ ] Implementar `saveOrdem()`
- [ ] Aplicar `[cdkDragDisabled]="ind.isEditing"`
- [ ] Ocultar handle durante edição
- [ ] Estilos CDK (preview, placeholder)

### Fase 9: Modais
- [ ] Criar `descricao-indicador-modal.component`
- [ ] Implementar `openDescricaoModal()`
- [ ] Criar `indicador-mobile-modal.component`
- [ ] Implementar `openMobileCreate()` e `openMobileEdit()`

### Fase 10: Mobile
- [ ] Template de cards
- [ ] `(click)` em cards abre modal
- [ ] Botão "+ Novo Indicador"
- [ ] Testar em telas < 992px

### Fase 11: Integração
- [ ] Conectar com `CockpitPilaresService`
- [ ] Implementar `loadIndicadores()`
- [ ] Implementar `loadUsuarios()`
- [ ] Integrar com componente de gráficos

### Fase 12: Testes
- [ ] Teste unitário: criação de linha
- [ ] Teste unitário: edição inline
- [ ] Teste unitário: validação
- [ ] Teste unitário: auto-save (debounce)
- [ ] Teste unitário: drag & drop
- [ ] Teste unitário: remoção
- [ ] Teste E2E: fluxo completo (criar 10 indicadores)

---

## 📚 Referências

- **ADR-005:** `/docs/adr/ADR-005-ux-excel-like-indicadores.md`
- **Business Rules:** `/docs/business-rules/cockpit-pilares.md`
- **Convenções Frontend:** `/docs/conventions/cockpit-pilares-frontend.md`
- **Angular CDK Drag Drop:** https://material.angular.io/cdk/drag-drop/overview
- **ng-select:** https://github.com/ng-select/ng-select
- **NgBootstrap:** https://ng-bootstrap.github.io/

---

**Documento criado:** 2026-01-15  
**Para implementação por:** Dev Agent  
**Status:** Pronto para desenvolvimento
