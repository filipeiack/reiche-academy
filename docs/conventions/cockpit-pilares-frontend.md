# Convenções Frontend — Cockpit de Pilares

**Baseado em:** diagnostico-notas component (extração de padrões)  
**Aplicável a:** Implementação do Cockpit de Pilares  
**Agente:** System Engineer + Business Rules Extractor  
**Data:** 2026-01-15  
**Última atualização:** 2026-01-27 (Mudança para drawer/offcanvas)  
**Status:** 📋 **NORMATIVO** (padrão obrigatório)

---

## 1. Visão Geral

Este documento extrai padrões **comprovados e funcionais** do componente `diagnostico-notas` para aplicação na implementação do **Cockpit de Pilares**.

**Propósito:**
- Garantir consistência de UX entre módulos
- Reutilizar soluções testadas (auto-save, feedback, RBAC)
- Evitar reinvenção de padrões já validados
- **Implementar drawer/offcanvas para adição e edição**

**Escopo:**
- Estrutura de componentes
- Injeção de dependências
- Auto-save com debounce (1000ms)
- Feedback visual (saving/saved/errors)
- RBAC frontend
- Drawer/offcanvas para adição e edição
- Gestão de estado (cache local)
- Controle de accordions/expansão

---

## 2. Estrutura de Componentes

### 2.1. Estrutura de Arquivos

**Padrão extraído:**
```
diagnostico-notas/
├── diagnostico-notas.component.ts      # 773 linhas
├── diagnostico-notas.component.html    # 320 linhas
├── diagnostico-notas.component.scss
├── diagnostico-notas.component.spec.ts
├── responsavel-pilar-modal/
│   ├── responsavel-pilar-modal.component.ts
│   ├── responsavel-pilar-modal.component.html
│   └── responsavel-pilar-modal.component.scss
├── nova-rotina-modal/
│   └── ...
└── rotinas-pilar-modal/
    └── ...
```

**Aplicação ao Cockpit:**
```
cockpit-pilares/
├── cockpit-dashboard/                  # Dashboard principal
│   ├── cockpit-dashboard.component.ts
│   ├── cockpit-dashboard.component.html
│   └── cockpit-dashboard.component.scss
├── matriz-indicadores/                 # Tabela de indicadores (jan-dez)
│   └── ...
├── grafico-indicadores/                # Gráficos de evolução
│   └── ...
├── matriz-processos/                   # Processos prioritários
│   └── ...
└── offcanvas/
    ├── criar-cockpit-offcanvas/
    ├── criar-indicador-offcanvas/
    └── ...
```

**Regras:**
- ✅ Componente principal + sub-componentes por responsabilidade
- ✅ Offcanvas em pasta separada (`offcanvas/`)
- ✅ Um arquivo por componente (`.ts`, `.html`, `.scss`, `.spec.ts`)
- ✅ Nomenclatura kebab-case

---

### 2.2. Componente Standalone

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 26-47)
@Component({
  selector: 'app-diagnostico-notas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbAlertModule,
    NgbDropdownModule,
    NgSelectModule,
    TranslatePipe,
    PilaresEmpresaModalComponent,
    ResponsavelPilarModalComponent,
    NovaRotinaModalComponent,
    RotinasPilarModalComponent,
    MediaBadgeComponent
  ],
  templateUrl: './diagnostico-notas.component.html',
  styleUrl: './diagnostico-notas.component.scss'
})
```

**Aplicação ao Cockpit:**
```typescript
@Component({
  selector: 'app-cockpit-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,               // ngModel
    NgbAlertModule,            // Alerts
    NgbDropdownModule,         // Dropdowns
    NgSelectModule,            // Selects customizados
    TranslatePipe,             // i18n
    MatrizIndicadoresComponent,
    GraficoIndicadoresComponent,
    MatrizProcessosComponent,
    CriarCockpitOffcanvasComponent,
    CriarIndicadorOffcanvasComponent
  ],
  templateUrl: './cockpit-dashboard.component.html',
  styleUrl: './cockpit-dashboard.component.scss'
})
```

**Regras:**
- ✅ `standalone: true` (padrão Angular 18+)
- ✅ Imports explícitos (CommonModule, FormsModule sempre)
- ✅ TranslatePipe para i18n
- ✅ NgBootstrap (offcanvas, dropdowns, alerts)
- ✅ NgSelectModule para selects customizados

---

## 3. Injeção de Dependências

### 3.1. Padrão inject()

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 48-52)
export class DiagnosticoNotasComponent implements OnInit, OnDestroy {
  private diagnosticoService = inject(DiagnosticoNotasService);
  private empresasService = inject(EmpresasService);
  private authService = inject(AuthService);
  private empresaContextService = inject(EmpresaContextService);
  private periodosService = inject(PeriodosAvaliacaoService);
```

**Aplicação ao Cockpit:**
```typescript
export class CockpitDashboardComponent implements OnInit, OnDestroy {
  private cockpitService = inject(CockpitPilaresService);
  private authService = inject(AuthService);
  private empresaContextService = inject(EmpresaContextService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
```

**Regras:**
- ✅ Usar `inject()` (não constructor injection)
- ✅ Declarar como `private` (convenção do projeto)
- ✅ Nome descritivo (xxxService, xxxContext)
- ✅ Importar `inject` de `@angular/core`

---

### 3.3. Injeção de NgbOffcanvasService

**Padrão aplicado:**
```typescript
export class CockpitDashboardComponent implements OnInit, OnDestroy {
  private cockpitService = inject(CockpitPilaresService);
  private authService = inject(AuthService);
  private empresaContextService = inject(EmpresaContextService);
  private offcanvasService = inject(NgbOffcanvasService);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
```

**Regras:**
- ✅ Injetar `NgbOffcanvasService` para abertura de drawers
- ✅ Declarar como `private`
- ✅ Usar para abrir componentes offcanvas

---

## 4. Auto-save com Debounce

### 4.1. Estrutura Básica

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts

// Linha 27: Interface de fila
interface AutoSaveQueueItem {
  rotinaEmpresaId: string;
  data: UpdateNotaRotinaDto;
  retryCount: number;
}

// Linhas 68-72: Controle de auto-save
private autoSaveSubject = new Subject<AutoSaveQueueItem>();
private autoSaveSubscription?: Subscription;
private readonly MAX_RETRIES = 3;
savingCount = 0; // Contador de saves em andamento
lastSaveTime: Date | null = null; // Timestamp do último salvamento

// Linha 74: Cache local
private notasCache = new Map<string, { nota: number | null, criticidade: string | null }>();
```

**Aplicação ao Cockpit:**
```typescript
// cockpit-dashboard.component.ts

interface AutoSaveQueueItem {
  indicadorMensalId: string;
  data: UpdateIndicadorMensalDto;
  retryCount: number;
}

// Controle de auto-save
private autoSaveSubject = new Subject<AutoSaveQueueItem>();
private autoSaveSubscription?: Subscription;
private readonly MAX_RETRIES = 3;
savingCount = 0;
lastSaveTime: Date | null = null;

// Cache local de valores em edição
private valoresMensaisCache = new Map<string, { meta: number | null, realizado: number | null }>();
```

**Regras:**
- ✅ Interface `AutoSaveQueueItem` com `retryCount`
- ✅ `Subject` para emitir mudanças
- ✅ Constante `MAX_RETRIES = 3`
- ✅ Variáveis públicas `savingCount` e `lastSaveTime` (usadas no template)
- ✅ `Map` para cache local (chave = ID, valor = dados)

---

### 4.2. Configuração do Debounce

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 348-361)
private setupAutoSave(): void {
  console.log('🔧 Configurando auto-save subject...');
  this.autoSaveSubscription = this.autoSaveSubject
    .pipe(
      debounceTime(1000), // Aguarda 1000ms após última alteração
      distinctUntilChanged((prev, curr) => 
        prev.rotinaEmpresaId === curr.rotinaEmpresaId &&
        prev.data.nota === curr.data.nota &&
        prev.data.criticidade === curr.data.criticidade
      )
    )
    .subscribe((item) => {
      console.log('⏰ Debounce completado, executando save...');
      this.executeSave(item);
    });
  console.log('✅ Auto-save configurado com sucesso');
}
```

**Aplicação ao Cockpit:**
```typescript
private setupAutoSave(): void {
  this.autoSaveSubscription = this.autoSaveSubject
    .pipe(
      debounceTime(1000), // SEMPRE 1000ms (padrão do sistema)
      distinctUntilChanged((prev, curr) => 
        prev.indicadorMensalId === curr.indicadorMensalId &&
        prev.data.meta === curr.data.meta &&
        prev.data.realizado === curr.data.realizado
      )
    )
    .subscribe((item) => {
      this.executeSave(item);
    });
}
```

**Regras:**
- ✅ `debounceTime(1000)` — FIXO 1000ms (não customizar)
- ✅ `distinctUntilChanged` para evitar duplicatas
- ✅ Comparação de todos campos relevantes
- ✅ Chamar `setupAutoSave()` no `ngOnInit()`

---

### 4.3. Evento de Mudança

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 367-416)
onNotaChange(rotinaEmpresa: RotinaEmpresa, nota: any, criticidade: string | null): void {
  // 1. Converter tipos
  const notaConverted = nota === '' || nota === null || nota === undefined ? null : Number(nota);
  
  // 2. Atualizar cache
  const cached = this.notasCache.get(rotinaEmpresa.id) || { 
    nota: this.getNotaAtual(rotinaEmpresa), 
    criticidade: this.getCriticidadeAtual(rotinaEmpresa) 
  };
  
  if (notaConverted !== null && notaConverted !== undefined) {
    cached.nota = notaConverted;
  }
  if (criticidade !== null && criticidade !== undefined) {
    cached.criticidade = criticidade;
  }
  
  this.notasCache.set(rotinaEmpresa.id, cached);
  
  // 3. Validar campos obrigatórios (silenciosamente)
  if (cached.nota === null || !cached.criticidade) {
    return; // Aguardar usuário preencher ambos
  }

  // 4. Validar range
  if (cached.nota < 0 || cached.nota > 10) {
    this.showToast('Nota deve estar entre 0 e 10', 'error');
    return;
  }

  // 5. Montar DTO
  const dto: UpdateNotaRotinaDto = {
    nota: cached.nota,
    criticidade: cached.criticidade as 'ALTO' | 'MEDIO' | 'BAIXO',
  };

  // 6. Adicionar à fila
  this.autoSaveSubject.next({
    rotinaEmpresaId: rotinaEmpresa.id,
    data: dto,
    retryCount: 0,
  });
}
```

**Aplicação ao Cockpit:**
```typescript
onValorMensalChange(indicadorMensalId: string, mes: number, campo: 'meta' | 'realizado', valor: any): void {
  // 1. Converter tipo
  const valorConverted = valor === '' || valor === null ? null : Number(valor);
  
  // 2. Atualizar cache
  const cached = this.valoresMensaisCache.get(indicadorMensalId) || { meta: null, realizado: null };
  cached[campo] = valorConverted;
  this.valoresMensaisCache.set(indicadorMensalId, cached);
  
  // 3. Validar que ao menos um campo está preenchido
  if (cached.meta === null && cached.realizado === null) {
    return; // Aguardar usuário preencher ao menos um campo
  }

  // 4. Validar valores negativos (se aplicável)
  if (valorConverted !== null && valorConverted < 0) {
    this.showToast('Valor não pode ser negativo', 'error');
    return;
  }

  // 5. Montar DTO
  const dto: UpdateIndicadorMensalDto = {
    mes,
    meta: cached.meta,
    realizado: cached.realizado,
  };

  // 6. Adicionar à fila
  this.autoSaveSubject.next({
    indicadorMensalId,
    data: dto,
    retryCount: 0,
  });
}
```

**Regras:**
- ✅ Converter tipos (string → number)
- ✅ Atualizar cache ANTES de validar
- ✅ Validações silenciosas (não bloquear UX)
- ✅ Validações com feedback (toast de erro)
- ✅ Montar DTO apenas se válido
- ✅ `retryCount: 0` ao adicionar na fila

---

### 4.4. Execução do Save

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 422-438)
private executeSave(item: AutoSaveQueueItem): void {
  this.savingCount++;

  this.diagnosticoService.upsertNotaRotina(item.rotinaEmpresaId, item.data).subscribe({
    next: (response) => {
      this.savingCount--;
      this.lastSaveTime = new Date(); // Timestamp
      this.updateLocalNotaData(item.rotinaEmpresaId, response.nota); // Atualizar local
    },
    error: (err) => {
      this.savingCount--;
      this.handleSaveError(item, err);
    }
  });
}
```

**Aplicação ao Cockpit:**
```typescript
private executeSave(item: AutoSaveQueueItem): void {
  this.savingCount++;

  this.cockpitService.updateIndicadorMensal(item.indicadorMensalId, item.data).subscribe({
    next: (response) => {
      this.savingCount--;
      this.lastSaveTime = new Date();
      this.updateLocalIndicadorData(item.indicadorMensalId, response); // Sync local
    },
    error: (err) => {
      this.savingCount--;
      this.handleSaveError(item, err);
    }
  });
}
```

**Regras:**
- ✅ Incrementar `savingCount` ANTES de chamar serviço
- ✅ Decrementar `savingCount` em AMBOS next/error
- ✅ Atualizar `lastSaveTime` apenas em sucesso
- ✅ Atualizar dados locais para sincronizar com backend
- ✅ Delegar erro para `handleSaveError`

---

### 4.5. Retry Automático

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 444-469)
private handleSaveError(item: AutoSaveQueueItem, err: any): void {
  if (item.retryCount < this.MAX_RETRIES) {
    // Tentar novamente após 2 segundos
    setTimeout(() => {
      this.savingCount++;
      this.diagnosticoService.upsertNotaRotina(item.rotinaEmpresaId, item.data).subscribe({
        next: () => {
          this.savingCount--;
        },
        error: (retryErr) => {
          this.savingCount--;
          item.retryCount++;
          this.handleSaveError(item, retryErr);
        }
      });
    }, 2000);
  } else {
    // Erro persistente - informar ao usuário
    const message = err?.error?.message || 'Erro ao salvar informações';
    this.showToast(`${message}. Tente salvar novamente mais tarde.`, 'error', 5000);
  }
}
```

**Aplicação ao Cockpit:**
```typescript
private handleSaveError(item: AutoSaveQueueItem, err: any): void {
  if (item.retryCount < this.MAX_RETRIES) {
    setTimeout(() => {
      this.savingCount++;
      this.cockpitService.updateIndicadorMensal(item.indicadorMensalId, item.data).subscribe({
        next: () => {
          this.savingCount--;
        },
        error: (retryErr) => {
          this.savingCount--;
          item.retryCount++;
          this.handleSaveError(item, retryErr);
        }
      });
    }, 2000); // SEMPRE 2000ms
  } else {
    const message = err?.error?.message || 'Erro ao salvar valores mensais';
    this.showToast(`${message}. Tente novamente mais tarde.`, 'error', 5000);
  }
}
```

**Regras:**
- ✅ Retry até `MAX_RETRIES` (3)
- ✅ Delay de 2000ms entre retries
- ✅ Incrementar `retryCount` após falha
- ✅ Toast de erro persistente após 3 falhas
- ✅ Duração do toast de erro: 5000ms

---

## 5. Feedback Visual

### 5.1. Indicador de "Salvando..."

**Padrão extraído:**
```html
<!-- diagnostico-notas.component.html (linhas 16-22) -->
@if (savingCount > 0) {
<div class="saving-indicator">
    <div class="spinner-border spinner-border-sm" role="status">
        <span class="visually-hidden">{{ 'COMMON.SAVING' | translate }}...</span>
    </div>
    <span>{{ 'DIAGNOSTICO.SAVING_CHANGES' | translate }}</span>
</div>
}
```

**Aplicação ao Cockpit:**
```html
@if (savingCount > 0) {
<div class="saving-indicator">
    <div class="spinner-border spinner-border-sm"></div>
    <span>{{ 'COCKPIT.SAVING_CHANGES' | translate }}</span>
</div>
}
```

**Regras:**
- ✅ Exibir apenas se `savingCount > 0`
- ✅ Usar spinner Bootstrap (`spinner-border spinner-border-sm`)
- ✅ Texto i18n via TranslatePipe
- ✅ Classe CSS `.saving-indicator` (customizar no SCSS)

---

### 5.2. Timestamp do Último Save

**Padrão extraído:**
```html
<!-- diagnostico-notas.component.html (linhas 23-28) -->
} @else if (lastSaveTime) {
<div class="last-save-info">
    <i class="feather icon-check-circle text-success icon-sm"></i>
    <span class="text-muted small">Salvo por último às: {{ getLastSaveTimeFormatted() }}</span>
</div>
}
```

```typescript
// diagnostico-notas.component.ts (linhas 653-662)
getLastSaveTimeFormatted(): string {
  if (!this.lastSaveTime) return '';
  
  const hours = this.lastSaveTime.getHours().toString().padStart(2, '0');
  const minutes = this.lastSaveTime.getMinutes().toString().padStart(2, '0');
  const seconds = this.lastSaveTime.getSeconds().toString().padStart(2, '0');
  
  return `${hours}:${minutes}:${seconds}`;
}
```

**Aplicação ao Cockpit:**
```html
} @else if (lastSaveTime) {
<div class="last-save-info">
    <i class="feather icon-check-circle text-success"></i>
    <span class="text-muted small">Salvo às: {{ getLastSaveTimeFormatted() }}</span>
</div>
}
```

```typescript
getLastSaveTimeFormatted(): string {
  if (!this.lastSaveTime) return '';
  const h = this.lastSaveTime.getHours().toString().padStart(2, '0');
  const m = this.lastSaveTime.getMinutes().toString().padStart(2, '0');
  const s = this.lastSaveTime.getSeconds().toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}
```

**Regras:**
- ✅ Exibir apenas se `lastSaveTime !== null`
- ✅ Ícone de sucesso (`feather icon-check-circle text-success`)
- ✅ Formato de hora: `HH:MM:SS` com `padStart(2, '0')`
- ✅ Texto pequeno e discreto (`.text-muted .small`)

---

### 5.3. Toast de Feedback

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 717-727)
private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
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

**Aplicação ao Cockpit:**
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

**Regras:**
- ✅ Usar SweetAlert2 (já instalado no projeto)
- ✅ Configuração:
  - `toast: true`
  - `position: 'top-end'`
  - `showConfirmButton: false`
  - `timerProgressBar: true`
- ✅ Timer padrão: 3000ms (success/info)
- ✅ Timer de erro: 5000ms
- ✅ Importar: `import Swal from 'sweetalert2';`

---

## 6. RBAC Frontend

### 6.1. Getter de Permissões

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 76-82)
get isReadOnlyPerfil(): boolean {
  const user = this.authService.getCurrentUser();
  if (!user?.perfil) return false;
  const perfilCodigo = typeof user.perfil === 'object' ? user.perfil.codigo : user.perfil;
  // Apenas COLABORADOR e LEITURA são somente leitura, GESTOR pode editar
  return ['COLABORADOR', 'LEITURA'].includes(perfilCodigo);
}
```

**Aplicação ao Cockpit:**
```typescript
get canEdit(): boolean {
  const user = this.authService.getCurrentUser();
  if (!user?.perfil) return false;
  const perfilCodigo = typeof user.perfil === 'object' ? user.perfil.codigo : user.perfil;
  return ['ADMINISTRADOR', 'GESTOR'].includes(perfilCodigo);
}

get canEditValoresMensais(): boolean {
  const user = this.authService.getCurrentUser();
  if (!user?.perfil) return false;
  const perfilCodigo = typeof user.perfil === 'object' ? user.perfil.codigo : user.perfil;
  return ['ADMINISTRADOR', 'GESTOR', 'COLABORADOR'].includes(perfilCodigo);
}

get isReadOnly(): boolean {
  const user = this.authService.getCurrentUser();
  if (!user?.perfil) return false;
  const perfilCodigo = typeof user.perfil === 'object' ? user.perfil.codigo : user.perfil;
  return perfilCodigo === 'LEITURA';
}
```

**Regras:**
- ✅ Getter público (usado no template)
- ✅ Validar `user?.perfil` (nullish check)
- ✅ Tratar `perfil` como objeto OU string (compatibilidade)
- ✅ Usar array `.includes()` para múltiplos perfis
- ✅ Nome descritivo (canEdit, canDelete, isReadOnly)

---

### 6.2. Uso no Template

**Padrão extraído:**
```html
<!-- diagnostico-notas.component.html (linha 41) -->
@if (selectedEmpresaId && !isReadOnlyPerfil) {
<div class="ms-2">
    <div ngbDropdown class="mb-2">
        <a class="no-dropdown-toggle-icon" ngbDropdownToggle>
            <i class="feather icon-more-horizontal icon-xl"></i>
        </a>
        <div ngbDropdownMenu>
            <a ngbDropdownItem (click)="abrirModalIniciarPeriodo()">
                <span>Iniciar Avaliação</span>
            </a>
        </div>
    </div>
</div>
}

<!-- linha 134 -->
@if (pilarExpandido[i] && !isReadOnlyPerfil) {
<div ngbDropdown>
    <a ngbDropdownToggle>...</a>
    <div ngbDropdownMenu>
        <a ngbDropdownItem (click)="abrirModalResponsavel(pilar)">
            <span>Definir Responsável</span>
        </a>
    </div>
</div>
}
```

**Aplicação ao Cockpit:**
```html
@if (canEdit) {
<button class="btn btn-primary" (click)="abrirOffcanvasCriarIndicador()">
    <i class="feather icon-plus"></i>
    Adicionar Indicador
</button>
}

@if (canEditValoresMensais) {
<input type="number" [(ngModel)]="valorMeta" (input)="onValorMensalChange(...)">
} @else {
<span class="text-muted">{{ valorMeta }}</span>
}

@if (isReadOnly) {
<div class="alert alert-info">
    Você possui permissão apenas de leitura.
</div>
}
```

**Regras:**
- ✅ Usar `@if (getter)` (sintaxe Angular 18+)
- ✅ Ocultar botões de ação se não autorizado
- ✅ Substituir inputs por texto se read-only
- ✅ Mostrar feedback visual de permissões limitadas

---

## 7. Drawer/Offcanvas para Adição e Edição

### 7.1. Abertura do Offcanvas

**Padrão aplicado:**
```typescript
// cockpit-dashboard.component.ts
abrirOffcanvasCriarIndicador(): void {
  if (this.cockpitId) {
    const offcanvasRef = this.offcanvasService.open(CriarIndicadorOffcanvasComponent, {
      position: 'end', // Drawer lateral direito
      backdrop: true,
      scroll: false
    });
    
    // Passar dados via componentInstance
    offcanvasRef.componentInstance.cockpitId = this.cockpitId;
    
    // Callback após fechamento
    offcanvasRef.result.then(
      (result) => {
        if (result === 'saved') {
          this.loadIndicadores(this.cockpitId);
        }
      },
      (reason) => {
        // Dismissed
      }
    );
  }
}
```

**Regras:**
- ✅ Usar `NgbOffcanvasService` (injetado)
- ✅ Configurar `position: 'end'` para drawer lateral direito
- ✅ `backdrop: true` para escurecer fundo
- ✅ `scroll: false` para impedir scroll da página
- ✅ Passar dados via `componentInstance`
- ✅ Tratar resultado com `.then()` para callbacks

---

### 7.2. Componente do Offcanvas

**Estrutura do componente:**
```typescript
// criar-indicador-offcanvas.component.ts
@Component({
  selector: 'app-criar-indicador-offcanvas',
  standalone: true,
  templateUrl: './criar-indicador-offcanvas.component.html',
  styleUrl: './criar-indicador-offcanvas.component.scss'
})
export class CriarIndicadorOffcanvasComponent implements OnInit {
  @Input() cockpitId!: string;
  
  constructor(
    private activeOffcanvas: NgbActiveOffcanvas,
    private cockpitService: CockpitPilaresService
  ) {}

  salvar(): void {
    // Lógica de salvar
    this.activeOffcanvas.close('saved');
  }

  cancelar(): void {
    this.activeOffcanvas.dismiss('cancelled');
  }
}
```

**Template:**
```html
<!-- criar-indicador-offcanvas.component.html -->
<div class="offcanvas-header">
  <h5 class="offcanvas-title">Criar Indicador</h5>
  <button type="button" class="btn-close" (click)="cancelar()"></button>
</div>

<div class="offcanvas-body">
  <!-- Formulário -->
  <form [formGroup]="form">
    <!-- Campos -->
  </form>
</div>

<div class="offcanvas-footer">
  <button class="btn btn-secondary" (click)="cancelar()">Cancelar</button>
  <button class="btn btn-primary" (click)="salvar()">Salvar</button>
</div>
```

**Regras:**
- ✅ Injetar `NgbActiveOffcanvas` para controle
- ✅ Usar `@Input()` para receber dados
- ✅ Fechar com `.close(result)` em sucesso
- ✅ Dispensar com `.dismiss(reason)` em cancelamento
- ✅ Estrutura: header, body, footer (Bootstrap offcanvas)
- ✅ Formulário reativo com validações

---

### 7.3. Callback após Modificação

**Padrão:**
```typescript
// cockpit-dashboard.component.ts
abrirOffcanvasEditarIndicador(indicador: Indicador): void {
  const offcanvasRef = this.offcanvasService.open(EditarIndicadorOffcanvasComponent, {
    position: 'end'
  });
  
  offcanvasRef.componentInstance.indicador = indicador;
  
  offcanvasRef.result.then(
    (result) => {
      if (result === 'updated') {
        this.loadIndicadores(this.cockpitId);
      }
    }
  );
}
```

**Regras:**
- ✅ Tratar resultado no `.then()` do offcanvas
- ✅ Recarregar dados apenas se operação foi bem-sucedida
- ✅ Usar `result` para identificar tipo de ação (saved, updated, etc.)

---

## 8. Gestão de Estado (Cache Local)

### 8.1. Map para Cache de Valores

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linha 74)
private notasCache = new Map<string, { nota: number | null, criticidade: string | null }>();
```

**Aplicação ao Cockpit:**
```typescript
private valoresMensaisCache = new Map<string, { 
  meta: number | null, 
  realizado: number | null 
}>();
```

**Regras:**
- ✅ Usar `Map<string, objeto>` (chave = ID)
- ✅ Valores podem ser `null` (não preenchido)
- ✅ Atualizar cache ANTES de validar/salvar
- ✅ Cache é fonte de verdade durante edição

---

### 8.2. Getters de Valores com Fallback

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 475-485)
getNotaAtual(rotinaEmpresa: RotinaEmpresa): number | null {
  // Priorizar cache local (valores em edição)
  const cached = this.notasCache.get(rotinaEmpresa.id);
  if (cached?.nota !== undefined && cached?.nota !== null) {
    return cached.nota;
  }
  // Fallback: valor salvo no backend
  return rotinaEmpresa.notas?.[0]?.nota ?? null;
}
```

**Aplicação ao Cockpit:**
```typescript
getValorMeta(indicadorMensalId: string, indicadorMensal: IndicadorMensal): number | null {
  const cached = this.valoresMensaisCache.get(indicadorMensalId);
  if (cached?.meta !== undefined && cached?.meta !== null) {
    return cached.meta;
  }
  return indicadorMensal.meta ?? null;
}
```

**Regras:**
- ✅ Getter público (usado no template via `[(ngModel)]`)
- ✅ Priorizar cache (valores em edição)
- ✅ Fallback para dados do backend
- ✅ Retornar `null` se não houver valor (não `undefined`)
- ✅ Usar nullish coalescing `??`

---

### 8.3. Limpeza de Cache

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 210-215)
private loadDiagnostico(preserveScroll: boolean = false): void {
  // ...
  
  // Limpar cache e timestamp ao carregar novos dados
  this.notasCache.clear();
  this.lastSaveTime = null;
  
  // ...
}
```

**Aplicação ao Cockpit:**
```typescript
private loadIndicadores(cockpitId: string): void {
  this.loading = true;
  
  // Limpar cache ao recarregar
  this.valoresMensaisCache.clear();
  this.lastSaveTime = null;
  
  this.cockpitService.getIndicadores(cockpitId).subscribe({
    next: (data) => {
      this.indicadores = data;
      this.loading = false;
    },
    error: (err) => {
      this.error = err?.error?.message || 'Erro ao carregar indicadores';
      this.loading = false;
    }
  });
}
```

**Regras:**
- ✅ Limpar cache ao recarregar dados (`notasCache.clear()`)
- ✅ Resetar `lastSaveTime = null`
- ✅ Evitar exibir valores obsoletos

---

## 9. Controle de Acordeões (Expansão)

### 9.1. Estado de Expansão

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 83-84)
// Controle de accordion manual
pilarExpandido: { [key: number]: boolean } = {};
```

```typescript
// Linhas 253-256
togglePilar(index: number): void {
  this.pilarExpandido[index] = !this.pilarExpandido[index];
  this.saveExpandedState();
}
```

**Aplicação ao Cockpit:**
```typescript
// Estado de expansão de seções
secaoExpandida: { [key: string]: boolean } = {
  'indicadores': true,
  'processos': false,
  'cargos': false
};

toggleSecao(secao: string): void {
  this.secaoExpandida[secao] = !this.secaoExpandida[secao];
  this.saveExpandedState();
}
```

**Regras:**
- ✅ Objeto com chave = índice/nome, valor = booleano
- ✅ Método `toggle` inverte estado
- ✅ Salvar estado (sessionStorage ou local)

---

### 9.2. Persistência em SessionStorage

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 90-98)
private getSessionStorageKey(): string {
  return `diagnostico_pilares_expandidos_${this.selectedEmpresaId}`;
}

private saveExpandedState(): void {
  if (!this.selectedEmpresaId) return;
  try {
    sessionStorage.setItem(this.getSessionStorageKey(), JSON.stringify(this.pilarExpandido));
  } catch (error) {
    console.warn('Erro ao salvar estado de expansão:', error);
  }
}
```

**Aplicação ao Cockpit:**
```typescript
private getSessionStorageKey(): string {
  return `cockpit_secoes_expandidas_${this.cockpitId}`;
}

private saveExpandedState(): void {
  if (!this.cockpitId) return;
  try {
    sessionStorage.setItem(this.getSessionStorageKey(), JSON.stringify(this.secaoExpandida));
  } catch (error) {
    console.warn('Erro ao salvar estado de expansão:', error);
  }
}

private restoreExpandedState(): void {
  if (!this.cockpitId) return;
  try {
    const saved = sessionStorage.getItem(this.getSessionStorageKey());
    if (saved) {
      this.secaoExpandida = JSON.parse(saved);
    }
  } catch (error) {
    console.warn('Erro ao restaurar estado:', error);
  }
}
```

**Regras:**
- ✅ Chave única por contexto (empresaId, cockpitId)
- ✅ Serializar como JSON
- ✅ Try/catch para erros de quota/parsing
- ✅ Chamar `restoreExpandedState()` no `ngOnInit()`
- ✅ Limpar no `ngOnDestroy()` (opcional)

---

## 10. Ciclo de Vida do Componente

### 10.1. ngOnInit

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 153-166)
ngOnInit(): void {
  this.checkUserPerfil();
  this.setupAutoSave();
  
  // Subscrever às mudanças no contexto de empresa
  this.empresaContextSubscription = this.empresaContextService.selectedEmpresaId$.subscribe(empresaId => {
    if (this.isAdmin && empresaId !== this.selectedEmpresaId) {
      if (this.selectedEmpresaId) {
        this.clearExpandedState();
      }
      
      this.selectedEmpresaId = empresaId;
      if (empresaId) {
        this.loadDiagnostico();
      } else {
        this.pilares = [];
      }
    }
  });
}
```

**Aplicação ao Cockpit:**
```typescript
ngOnInit(): void {
  this.checkUserPerfil(); // Validar perfil RBAC
  this.setupAutoSave(); // Configurar debounce
  this.restoreExpandedState(); // Restaurar acordeões
  
  // Obter ID do cockpit da rota
  this.cockpitId = this.activatedRoute.snapshot.paramMap.get('cockpitId');
  
  if (this.cockpitId) {
    this.loadCockpit(this.cockpitId);
  }
}
```

**Regras:**
- ✅ Ordem: RBAC → Auto-save → Estado → Dados
- ✅ Validar perfil ANTES de carregar dados
- ✅ Configurar auto-save no início
- ✅ Subscrever contextos globais (empresa, usuário)

---

### 10.2. ngOnDestroy

**Padrão extraído:**
```typescript
// diagnostico-notas.component.ts (linhas 168-173)
ngOnDestroy(): void {
  this.autoSaveSubscription?.unsubscribe();
  this.empresaContextSubscription?.unsubscribe();
  // Limpar estado de expansão ao sair da tela
  this.clearExpandedState();
}
```

**Aplicação ao Cockpit:**
```typescript
ngOnDestroy(): void {
  this.autoSaveSubscription?.unsubscribe(); // Sempre
  this.clearExpandedState(); // Opcional
}
```

**Regras:**
- ✅ SEMPRE unsubscribe de Observables manuais
- ✅ Usar `?.` (optional chaining) para segurança
- ✅ Limpar estados temporários (opcional)

---

## 11. Checklist de Implementação

### Antes de Começar
- [ ] Ler este documento completo
- [ ] Ler `/docs/conventions/frontend.md`
- [ ] Analisar `diagnostico-notas.component.ts` na íntegra

### Durante Desenvolvimento
- [ ] Componente standalone com imports explícitos
- [ ] Injeção via `inject()`
- [ ] Auto-save com `debounceTime(1000)`
- [ ] Cache local via `Map`
- [ ] Feedback visual (saving/saved/errors)
- [ ] RBAC frontend com getters
- [ ] Modais NgBootstrap com callbacks
- [ ] SessionStorage para estado de UI
- [ ] Limpar subscriptions no ngOnDestroy

### Antes de Pull Request
- [ ] Componente compilando sem erros
- [ ] Testes unitários básicos (spec.ts)
- [ ] RBAC validado com diferentes perfis
- [ ] Auto-save testado manualmente
- [ ] Toasts de erro funcionais
- [ ] Sem console.error em produção

---

## 12. Anti-Padrões (Evitar)

❌ **NÃO fazer:**
- Usar `constructor()` para injeção (usar `inject()`)
- Debounce diferente de 1000ms
- Retry delay diferente de 2000ms
- MAX_RETRIES diferente de 3
- Toast de erro com timer < 5000ms
- Cache sem fallback para backend
- Subscriptions sem unsubscribe
- Validações bloqueantes (mostrar erro, não bloquear UX)
- Feedback visual inconsistente (usar SweetAlert2)
- RBAC hardcoded no template (usar getters)

---

## 13. Exemplo Completo (Resumido)

```typescript
// cockpit-dashboard.component.ts

import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import Swal from 'sweetalert2';

interface AutoSaveQueueItem {
  indicadorMensalId: string;
  data: UpdateIndicadorMensalDto;
  retryCount: number;
}

@Component({
  selector: 'app-cockpit-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, /* ... */],
  templateUrl: './cockpit-dashboard.component.html',
  styleUrl: './cockpit-dashboard.component.scss'
})
export class CockpitDashboardComponent implements OnInit, OnDestroy {
  private cockpitService = inject(CockpitPilaresService);
  private authService = inject(AuthService);
  
  @ViewChild(CriarIndicadorModalComponent) criarIndicadorModal!: CriarIndicadorModalComponent;
  
  // Auto-save
  private autoSaveSubject = new Subject<AutoSaveQueueItem>();
  private autoSaveSubscription?: Subscription;
  private readonly MAX_RETRIES = 3;
  savingCount = 0;
  lastSaveTime: Date | null = null;
  
  // Cache
  private valoresMensaisCache = new Map<string, { meta: number | null, realizado: number | null }>();
  
  // RBAC
  get canEdit(): boolean {
    const user = this.authService.getCurrentUser();
    const perfil = typeof user?.perfil === 'object' ? user.perfil.codigo : user?.perfil;
    return ['ADMINISTRADOR', 'GESTOR'].includes(perfil);
  }
  
  ngOnInit(): void {
    this.setupAutoSave();
    this.loadCockpit();
  }
  
  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
  }
  
  private setupAutoSave(): void {
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(
        debounceTime(1000),
        distinctUntilChanged((prev, curr) => 
          prev.indicadorMensalId === curr.indicadorMensalId &&
          prev.data.meta === curr.data.meta &&
          prev.data.realizado === curr.data.realizado
        )
      )
      .subscribe((item) => this.executeSave(item));
  }
  
  onValorMensalChange(indicadorMensalId: string, campo: 'meta' | 'realizado', valor: any): void {
    const valorConverted = valor === '' || valor === null ? null : Number(valor);
    
    const cached = this.valoresMensaisCache.get(indicadorMensalId) || { meta: null, realizado: null };
    cached[campo] = valorConverted;
    this.valoresMensaisCache.set(indicadorMensalId, cached);
    
    const dto = { meta: cached.meta, realizado: cached.realizado };
    this.autoSaveSubject.next({ indicadorMensalId, data: dto, retryCount: 0 });
  }
  
  private executeSave(item: AutoSaveQueueItem): void {
    this.savingCount++;
    this.cockpitService.updateIndicadorMensal(item.indicadorMensalId, item.data).subscribe({
      next: () => {
        this.savingCount--;
        this.lastSaveTime = new Date();
      },
      error: (err) => {
        this.savingCount--;
        this.handleSaveError(item, err);
      }
    });
  }
  
  private handleSaveError(item: AutoSaveQueueItem, err: any): void {
    if (item.retryCount < this.MAX_RETRIES) {
      setTimeout(() => {
        this.savingCount++;
        this.cockpitService.updateIndicadorMensal(item.indicadorMensalId, item.data).subscribe({
          next: () => this.savingCount--,
          error: (retryErr) => {
            this.savingCount--;
            item.retryCount++;
            this.handleSaveError(item, retryErr);
          }
        });
      }, 2000);
    } else {
      this.showToast('Erro ao salvar. Tente novamente.', 'error', 5000);
    }
  }
  
  private showToast(title: string, icon: 'success' | 'error', timer: number = 3000): void {
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer, timerProgressBar: true, title, icon });
  }
  
  getLastSaveTimeFormatted(): string {
    if (!this.lastSaveTime) return '';
    const h = this.lastSaveTime.getHours().toString().padStart(2, '0');
    const m = this.lastSaveTime.getMinutes().toString().padStart(2, '0');
    const s = this.lastSaveTime.getSeconds().toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }
}
```

---

**Documento aprovado para uso normativo.**  
**Dev Agent DEVE seguir estes padrões ao implementar Cockpit de Pilares.**

**Criado por:** Business Rules Extractor  
**Baseado em:** `diagnostico-notas.component.ts` (773 linhas analisadas)  
**Status:** 📋 **NORMATIVO**
