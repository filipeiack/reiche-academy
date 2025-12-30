import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbAlertModule, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DiagnosticoNotasService, PilarEmpresa, RotinaEmpresa, UpdateNotaRotinaDto } from '../../../core/services/diagnostico-notas.service';
import { EmpresasService, Empresa } from '../../../core/services/empresas.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaBasic } from '@app/core/models/auth.model';

interface AutoSaveQueueItem {
  rotinaEmpresaId: string;
  data: UpdateNotaRotinaDto;
  retryCount: number;
}

@Component({
  selector: 'app-diagnostico-notas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbAlertModule,
    NgSelectModule,
    TranslatePipe
],
  templateUrl: './diagnostico-notas.component.html',
  styleUrl: './diagnostico-notas.component.scss'
})
export class DiagnosticoNotasComponent implements OnInit, OnDestroy {
  private diagnosticoService = inject(DiagnosticoNotasService);
  private empresasService = inject(EmpresasService);
  private authService = inject(AuthService);

  pilares: PilarEmpresa[] = [];
  empresas: Empresa[] = [];
  empresaLogada: EmpresaBasic | null = null;
  selectedEmpresaId: string | null = null;
  isAdmin = false;
  loading = false;
  error = '';
  
  // Controle de accordion manual
  pilarExpandido: { [key: number]: boolean } = {};

  // Auto-save
  private autoSaveSubject = new Subject<AutoSaveQueueItem>();
  private autoSaveSubscription?: Subscription;
  private readonly MAX_RETRIES = 3;
  savingCount = 0; // Contador de saves em andamento
  lastSaveTime: Date | null = null; // Timestamp do último salvamento bem-sucedido
  
  // Cache local de valores em edição (antes de salvar no backend)
  private notasCache = new Map<string, { nota: number | null, criticidade: string | null }>();

  // Opções de criticidade
  criticidadeOptions = [
    { value: 'BAIXO', label: 'Baixa' },
    { value: 'MEDIO', label: 'Média' },
    { value: 'ALTO', label: 'Alta' },
  ];

  ngOnInit(): void {
    this.checkUserPerfil();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
  }

  private checkUserPerfil(): void {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.error = 'Usuário não autenticado';
      return;
    }

    this.isAdmin = user.perfil?.codigo === 'ADMINISTRADOR';

    if (this.isAdmin) {
      // Admin: carregar lista de empresas para seleção
      this.loadEmpresas();
    } else if (user.empresaId) {
      // Perfil cliente: usar empresa do usuário logado
      this.selectedEmpresaId = user.empresaId;
      this.empresaLogada = user.empresa ?? null;
      this.loadDiagnostico();
    } else {
      // Usuário sem empresa associada
      this.error = 'Você não possui empresa associada';
    }
  }

private loadEmpresas(): void {
    this.empresasService.getAll().subscribe({
        next: (data) => {
            this.empresas = data.filter(e => e.ativo);
        },
        error: (err) => {
            this.error = err?.error?.message || 'Erro ao carregar empresas';
        }
    });
}

  onEmpresaChange(event: any): void {
    // ng-select retorna o objeto inteiro ou apenas o ID dependendo do evento
    const empresaId = typeof event === 'string' ? event : event?.id || this.selectedEmpresaId;
    this.selectedEmpresaId = empresaId;
    if (empresaId) {
      this.loadDiagnostico();
    } else {
      this.pilares = [];
    }
  }

  private loadDiagnostico(): void {
    if (!this.selectedEmpresaId) return;

    this.loading = true;
    this.error = '';
    
    // Limpar cache e timestamp ao carregar novos dados
    this.notasCache.clear();
    this.lastSaveTime = null;

    this.diagnosticoService.getDiagnosticoByEmpresa(this.selectedEmpresaId).subscribe({
      next: (data) => {
        this.pilares = data;
        // Inicializar todos como expandidos
        this.pilarExpandido = {};
        data.forEach((_, index) => {
          this.pilarExpandido[index] = true;
        });
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Erro ao carregar diagnóstico';
        this.loading = false;
      }
    });
  }

  /**
   * Toggle de expansão do painel de pilar
   */
  togglePilar(index: number): void {
    this.pilarExpandido[index] = !this.pilarExpandido[index];
  }

  /**
   * Configura o auto-save com debounce de 1000ms
   */
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

  /**
   * Chamado quando nota ou criticidade é alterada
   */
  onNotaChange(rotinaEmpresa: RotinaEmpresa, nota: any, criticidade: string | null): void {
    console.log('🔄 onNotaChange chamado:', { 
      rotinaEmpresaId: rotinaEmpresa.id, 
      nota, 
      notaType: typeof nota,
      criticidade 
    });
    
    // Converter nota para número se vier como string
    const notaConverted = nota === '' || nota === null || nota === undefined ? null : Number(nota);
    
    // Buscar ou criar cache para esta rotina
    const cached = this.notasCache.get(rotinaEmpresa.id) || { nota: this.getNotaAtual(rotinaEmpresa), criticidade: this.getCriticidadeAtual(rotinaEmpresa) };
    
    // Atualizar cache com novo valor
    if (notaConverted !== null && notaConverted !== undefined) {
      cached.nota = notaConverted;
    }
    if (criticidade !== null && criticidade !== undefined) {
      cached.criticidade = criticidade;
    }
    
    // Salvar no cache
    this.notasCache.set(rotinaEmpresa.id, cached);
    
    const notaFinal = cached.nota;
    const criticidadeFinal = cached.criticidade;

    console.log('📊 Valores finais (com cache):', { notaFinal, criticidadeFinal, cached });

    // Validar campos obrigatórios (silenciosamente - aguarda usuário preencher ambos)
    if (notaFinal === null || notaFinal === undefined || !criticidadeFinal) {
      console.log('⏸️ Aguardando campos completos');
      return;
    }

    // Validar range de nota
    const notaNum = Number(notaFinal);
    if (notaNum < 1 || notaNum > 10) {
      this.showToast('Nota deve estar entre 1 e 10', 'error');
      return;
    }

    const dto: UpdateNotaRotinaDto = {
      nota: notaNum,
      criticidade: criticidadeFinal as 'ALTO' | 'MEDIO' | 'BAIXO',
    };

    console.log('➕ Adicionando à fila de auto-save:', dto);

    // Adicionar à fila de auto-save
    this.autoSaveSubject.next({
      rotinaEmpresaId: rotinaEmpresa.id,
      data: dto,
      retryCount: 0,
    });
  }

  /**
   * Executa o save no backend
   */
  private executeSave(item: AutoSaveQueueItem): void {
    console.log('💾 Salvando nota:', item);
    this.savingCount++;

    this.diagnosticoService.upsertNotaRotina(item.rotinaEmpresaId, item.data).subscribe({
      next: (response) => {
        console.log('✅ Nota salva com sucesso:', response);
        this.savingCount--;
        // Atualizar timestamp do último salvamento
        this.lastSaveTime = new Date();
        // Atualizar dados locais com resposta do backend
        this.updateLocalNotaData(item.rotinaEmpresaId, response.nota);
        // Manter cache (não limpar) para preservar valores na tela
        //this.showToast('Salvo', 'success', 1500);
      },
      error: (err) => {
        console.error('❌ Erro ao salvar nota:', err);
        this.savingCount--;
        this.handleSaveError(item, err);
      }
    });
  }

  /**
   * Trata erro no save com retry automático
   */
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
      const message = err?.error?.message || 'Erro ao salvar informações das notas';
      this.showToast(`${message}. Tente salvar novamente mais tarde.`, 'error', 5000);
    }
  }

  /**
   * Retorna a nota atual de uma rotina (última registrada ou em cache)
   */
  getNotaAtual(rotinaEmpresa: RotinaEmpresa): number | null {
    // Priorizar cache local (valores em edição)
    const cached = this.notasCache.get(rotinaEmpresa.id);
    if (cached?.nota !== undefined && cached?.nota !== null) {
      return cached.nota;
    }
    // Fallback: valor salvo no backend
    return rotinaEmpresa.notas?.[0]?.nota ?? null;
  }

  /**
   * Retorna a criticidade atual de uma rotina (última registrada ou em cache)
   */
  getCriticidadeAtual(rotinaEmpresa: RotinaEmpresa): string | null {
    // Priorizar cache local (valores em edição)
    const cached = this.notasCache.get(rotinaEmpresa.id);
    if (cached?.criticidade) {
      return cached.criticidade;
    }
    // Fallback: valor salvo no backend
    return rotinaEmpresa.notas?.[0]?.criticidade ?? null;
  }

  /**
   * Atualiza dados locais da rotina com resposta do backend
   */
  private updateLocalNotaData(rotinaEmpresaId: string, nota: any): void {
    // Encontrar a rotina no array de pilares e atualizar
    for (const pilar of this.pilares) {
      const rotina = pilar.rotinasEmpresa.find(r => r.id === rotinaEmpresaId);
      if (rotina) {
        // Atualizar ou adicionar nota no array
        if (rotina.notas && rotina.notas.length > 0) {
          rotina.notas[0] = nota;
        } else {
          rotina.notas = [nota];
        }
        console.log('🔄 Dados locais atualizados:', { rotinaEmpresaId, nota });
        break;
      }
    }
  }

  /**
   * Retorna a classe CSS baseada na criticidade
   */
  getCriticidadeClass(criticidade: string | null): string {
    switch (criticidade) {
      case 'ALTO':
        return 'badge bg-danger';
      case 'MEDIO':
        return 'badge bg-warning text-dark';
      case 'BAIXO':
        return 'badge bg-success';
      default:
        return 'badge bg-secondary';
    }
  }

  /**
   * Formata o horário do último salvamento
   */
  getLastSaveTimeFormatted(): string {
    if (!this.lastSaveTime) return '';
    
    const hours = this.lastSaveTime.getHours().toString().padStart(2, '0');
    const minutes = this.lastSaveTime.getMinutes().toString().padStart(2, '0');
    const seconds = this.lastSaveTime.getSeconds().toString().padStart(2, '0');
    
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Verifica se há mudanças não salvas no cache
   */
  hasUnsavedChanges(): boolean {
    return this.notasCache.size > 0;
  }

  /**
   * Força salvamento de todas as alterações pendentes no cache
   */
  forceSaveAll(): void {
    if (this.notasCache.size === 0) {
      this.showToast('Não há alterações pendentes', 'info', 2000);
      return;
    }

    console.log('💾 Forçando salvamento de todas as alterações pendentes...');
    
    // Coletar todos os itens do cache
    const itemsToSave: AutoSaveQueueItem[] = [];
    
    this.notasCache.forEach((value, rotinaEmpresaId) => {
      if (value.nota !== null && value.nota !== undefined && value.criticidade) {
        itemsToSave.push({
          rotinaEmpresaId,
          data: {
            nota: value.nota,
            criticidade: value.criticidade as 'ALTO' | 'MEDIO' | 'BAIXO'
          },
          retryCount: 0
        });
      }
    });

    if (itemsToSave.length === 0) {
      this.showToast('Não há alterações válidas para salvar', 'warning', 2000);
      return;
    }

    // Salvar todos os itens
    this.showToast(`Salvando ${itemsToSave.length} alteração(ões)...`, 'info', 2000);
    
    itemsToSave.forEach(item => {
      this.executeSave(item);
    });
  }

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
}
