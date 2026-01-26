import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgbAlertModule, NgbProgressbar, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '@environments/environment';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DiagnosticoNotasService, PilarEmpresa, RotinaEmpresa, UpdateNotaRotinaDto } from '../../../core/services/diagnostico-notas.service';
import { EmpresasService, Empresa } from '../../../core/services/empresas.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresaContextService } from '../../../core/services/empresa-context.service';
import { EmpresaBasic } from '@app/core/models/auth.model';
import { PeriodosAvaliacaoService } from '../../../core/services/periodos-avaliacao.service';
import { PeriodoAvaliacao } from '../../../core/models/periodo-avaliacao.model';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { PilaresEmpresaModalComponent } from './pilares-empresa-modal/pilares-empresa-modal.component';
import { ResponsavelPilarModalComponent } from './responsavel-pilar-modal/responsavel-pilar-modal.component';
import { NovaRotinaModalComponent } from './nova-rotina-modal/nova-rotina-modal.component';
import { RotinasPilarModalComponent } from './rotinas-pilar-modal/rotinas-pilar-modal.component';
import { MediaBadgeComponent } from '../../../shared/components/media-badge/media-badge.component';
import { CriarCockpitModalComponent } from '../cockpit-pilares/criar-cockpit-modal/criar-cockpit-modal.component';

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
    NgbDropdownModule,
    NgSelectModule,
    TranslatePipe,
    //NgbProgressbar,
    PilaresEmpresaModalComponent,
    ResponsavelPilarModalComponent,
    NovaRotinaModalComponent,
    RotinasPilarModalComponent,
    MediaBadgeComponent,
    // CriarCockpitModalComponent (não usado no template)
],
  templateUrl: './diagnostico-notas.component.html',
  styleUrl: './diagnostico-notas.component.scss'
})
export class DiagnosticoNotasComponent implements OnInit, OnDestroy {
  private diagnosticoService = inject(DiagnosticoNotasService);
  private empresasService = inject(EmpresasService);
  private authService = inject(AuthService);
  private empresaContextService = inject(EmpresaContextService);
  private periodosService = inject(PeriodosAvaliacaoService);
  private router = inject(Router);
  private modalService = inject(NgbModal);

  @ViewChild(PilaresEmpresaModalComponent) pilaresModal!: PilaresEmpresaModalComponent;
  @ViewChild(ResponsavelPilarModalComponent) responsavelModal!: ResponsavelPilarModalComponent;
  @ViewChild(NovaRotinaModalComponent) novaRotinaModal!: NovaRotinaModalComponent;
  @ViewChild(RotinasPilarModalComponent) rotinasPilarModal!: RotinasPilarModalComponent;

  pilares: PilarEmpresa[] = [];
  empresaLogada: EmpresaBasic | null = null;
  selectedEmpresaId: string | null = null;
  isAdmin = false;
  loading = false;
  error = '';
  periodoAtual: PeriodoAvaliacao | null = null;
  showIniciarPeriodoModal = false;
  dataReferenciaPeriodo: string = '';
  
  private empresaContextSubscription?: Subscription;
  private savedScrollPosition: number = 0;

  get isReadOnlyPerfil(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user?.perfil) return false;
    const perfilCodigo = typeof user.perfil === 'object' ? user.perfil.codigo : user.perfil;
    // Apenas COLABORADOR e LEITURA são somente leitura, GESTOR pode editar
    return ['COLABORADOR', 'LEITURA'].includes(perfilCodigo);
  }
  
  // Controle de accordion manual
  pilarExpandido: { [key: number]: boolean } = {};

  /**
   * Retorna a chave do sessionStorage para o estado de expansão
   */
  private getSessionStorageKey(): string {
    return `diagnostico_pilares_expandidos_${this.selectedEmpresaId}`;
  }

  /**
   * Salva o estado de expansão no sessionStorage
   */
  private saveExpandedState(): void {
    if (!this.selectedEmpresaId) return;
    try {
      sessionStorage.setItem(this.getSessionStorageKey(), JSON.stringify(this.pilarExpandido));
    } catch (error) {
      console.warn('Erro ao salvar estado de expansão:', error);
    }
  }

  /**
   * Restaura o estado de expansão do sessionStorage
   */
  private restoreExpandedState(): void {
    if (!this.selectedEmpresaId) return;
    try {
      const savedState = sessionStorage.getItem(this.getSessionStorageKey());
      if (savedState) {
        this.pilarExpandido = JSON.parse(savedState);
      }
    } catch (error) {
      console.warn('Erro ao restaurar estado de expansão:', error);
      this.pilarExpandido = {};
    }
  }

  /**
   * Limpa o estado de expansão do sessionStorage
   */
  private clearExpandedState(): void {
    if (!this.selectedEmpresaId) return;
    try {
      sessionStorage.removeItem(this.getSessionStorageKey());
    } catch (error) {
      console.warn('Erro ao limpar estado de expansão:', error);
    }
  }

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
    { value: 'BAIXA', label: 'BAIXA' },
    { value: 'MEDIA', label: 'MÉDIA' },
    { value: 'ALTA', label: 'ALTA' },
  ];

  ngOnInit(): void {
    this.checkUserPerfil();
    this.setupAutoSave();
    
    // Subscrever às mudanças no contexto de empresa
    this.empresaContextSubscription = this.empresaContextService.selectedEmpresaId$.subscribe(empresaId => {
      if (this.isAdmin && empresaId !== this.selectedEmpresaId) {
        // Limpar estado de expansão da empresa anterior
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

  ngOnDestroy(): void {
    this.autoSaveSubscription?.unsubscribe();
    this.empresaContextSubscription?.unsubscribe();
    // Limpar estado de expansão ao sair da tela
    this.clearExpandedState();
  }

  private checkUserPerfil(): void {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.error = 'Usuário não autenticado';
      return;
    }

    this.isAdmin = user.perfil?.codigo === 'ADMINISTRADOR';

    if (this.isAdmin) {
      // Admin: usar empresa do contexto global (selecionada no navbar)
      this.selectedEmpresaId = this.empresaContextService.getEmpresaId();
      if (this.selectedEmpresaId) {
        this.loadDiagnostico();
      }
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

  private loadDiagnostico(preserveScroll: boolean = false): void {
    if (!this.selectedEmpresaId) return;

    // Salvar posição de scroll se solicitado
    if (preserveScroll) {
      this.savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    }

    this.loading = true;
    this.error = '';
    
    // Limpar cache e timestamp ao carregar novos dados
    this.notasCache.clear();
    this.lastSaveTime = null;

    this.diagnosticoService.getDiagnosticoByEmpresa(this.selectedEmpresaId).subscribe({
      next: (data) => {
        this.pilares = data;
        
        // Restaurar estado de expansão salvo ou inicializar todos como encolhidos
        const savedState = this.pilarExpandido;
        this.restoreExpandedState();
        
        // Se não há estado salvo, inicializar todos como fechados
        if (Object.keys(this.pilarExpandido).length === 0) {
          this.pilarExpandido = {};
          data.forEach((_, index) => {
            this.pilarExpandido[index] = false;
          });
        }
        
        this.loading = false;
        
        // Carregar período atual após carregar pilares
        this.loadPeriodoAtual();
        
        // Restaurar posição de scroll se foi salva
        if (preserveScroll && this.savedScrollPosition > 0) {
          setTimeout(() => {
            window.scrollTo({
              top: this.savedScrollPosition,
              behavior: 'auto'
            });
            this.savedScrollPosition = 0;
          }, 50);
        }
      },
      error: (err: any) => {
        this.error = err?.error?.message || 'Erro ao carregar dashboard da empresa';
        this.loading = false;
      }
    });
  }

  /**
   * Toggle de expansão do painel de pilar
   */
  togglePilar(index: number): void {
    this.pilarExpandido[index] = !this.pilarExpandido[index];
    this.saveExpandedState();
  }

  /**
   * Abre o modal de gerenciamento de pilares
   */
  abrirModalPilares(): void {
    if (this.pilaresModal && this.selectedEmpresaId) {
      this.pilaresModal.open();
    }
  }

  /**
   * Callback quando pilares são modificados no modal
   */
  onPilaresModificados(): void {
    // Recarregar dashboard da empresa para refletir mudanças nos pilares
    if (this.selectedEmpresaId) {
      this.loadDiagnostico(true);
    }
  }

  /**
   * Abre o modal de definição de responsável
   */
  abrirModalResponsavel(pilarEmpresa: PilarEmpresa): void {
    if (this.responsavelModal) {
      this.responsavelModal.open(pilarEmpresa);
    }
  }

  /**
   * Callback quando responsável é atualizado
   */
  onResponsavelAtualizado(): void {
    // Recarregar dashboard da empresa para refletir mudanças no responsável
    if (this.selectedEmpresaId) {
      this.loadDiagnostico(true);
    }
  }

  /**
   * Abre o modal de nova rotina customizada
   */
  abrirModalNovaRotina(pilarEmpresa: PilarEmpresa): void {
    if (this.novaRotinaModal) {
      this.novaRotinaModal.open(pilarEmpresa);
    }
  }

  /**
   * Abre o modal de gerenciamento de rotinas do pilar
   */
  abrirModalEditarRotinas(pilarEmpresa: PilarEmpresa): void {
    if (this.rotinasPilarModal && this.selectedEmpresaId) {
      this.rotinasPilarModal.empresaId = this.selectedEmpresaId;
      this.rotinasPilarModal.pilarEmpresaId = pilarEmpresa.id;
      this.rotinasPilarModal.pilarNome = pilarEmpresa.nome;
      this.rotinasPilarModal.pilarId = pilarEmpresa.pilarTemplateId ?? '';
      this.rotinasPilarModal.rotinasEmpresa = [...pilarEmpresa.rotinasEmpresa];
      this.rotinasPilarModal.open();
    }
  }

  /**
   * Callback quando rotina é criada
   */
  onRotinaCriada(): void {
    // Recarregar dashboard da empresa para refletir nova rotina
    if (this.selectedEmpresaId) {
      this.loadDiagnostico(true);
    }
  }

  /**
   * Callback quando rotinas do pilar são modificadas
   */
  onRotinasModificadas(): void {
    // Recarregar dashboard da empresa para refletir mudanças
    if (this.selectedEmpresaId) {
      this.loadDiagnostico(true);
    }
  }

  /**
   * Configura o auto-save com debounce configurado
   */
  private setupAutoSave(): void {
    console.log('🔧 Configurando auto-save subject...');
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(
        debounceTime(environment.debounceTime), // Aguarda após última alteração
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
    if (notaNum < 0 || notaNum > 10) {
      this.showToast('Nota deve estar entre 0 e 10', 'error');
      return;
    }

    const dto: UpdateNotaRotinaDto = {
      nota: notaNum,
      criticidade: criticidadeFinal as 'ALTA' | 'MEDIA' | 'BAIXA',
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
      case 'ALTA':
        return 'bg-danger';
      case 'MEDIA':
        return 'bg-warning';
      case 'BAIXA':
        return 'bg-success';
      default:
        return '';
    }
  }

  /**
   * Retorna a classe CSS baseada no valor da nota
   */
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

  /**
   * Calcula o percentual de progresso de um pilar
   * - Se rotina tem nota E criticidade = 100% daquela rotina
   * - Se rotina tem apenas nota OU criticidade = 50% daquela rotina
   * - Se rotina não tem nada = 0% daquela rotina
   */
  getPilarProgress(pilar: PilarEmpresa): number {
    if (!pilar.rotinasEmpresa || pilar.rotinasEmpresa.length === 0) {
      return 0;
    }

    let totalProgress = 0;
    const totalRotinas = pilar.rotinasEmpresa.length;

    pilar.rotinasEmpresa.forEach(rotina => {
      const nota = this.getNotaAtual(rotina);
      const criticidade = this.getCriticidadeAtual(rotina);

      const hasNota = nota !== null && nota !== undefined;
      const hasCriticidade = criticidade !== null && criticidade !== undefined && criticidade !== '';

      if (hasNota && hasCriticidade) {
        // Ambos preenchidos = 100% da rotina
        totalProgress += 1;
      } else if (hasNota || hasCriticidade) {
        // Apenas um preenchido = 50% da rotina
        totalProgress += 0.5;
      }
      // Se nenhum preenchido, não adiciona nada (0%)
    });

    // Retorna o percentual total do pilar
    return (totalProgress / totalRotinas) * 100;
  }

  /**
   * Calcula a média de notas das rotinas de um pilar
   */
  getPilarMediaNotas(pilar: PilarEmpresa): number {
    if (!pilar.rotinasEmpresa || pilar.rotinasEmpresa.length === 0) {
      return 0;
    }

    const rotinasComNota = pilar.rotinasEmpresa.filter(rotina => {
      const nota = this.getNotaAtual(rotina);
      return nota !== null && nota !== undefined;
    });

    if (rotinasComNota.length === 0) {
      return 0;
    }

    const somaNotas = rotinasComNota.reduce((soma, rotina) => {
      const nota = this.getNotaAtual(rotina) || 0;
      return soma + nota;
    }, 0);

    return somaNotas / rotinasComNota.length;
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
            criticidade: value.criticidade as 'ALTA' | 'MEDIA' | 'BAIXA'
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

  // ====================================================
  // Métodos de Período de Avaliação
  // ====================================================

  /**
   * Carrega o período de avaliação atual (aberto) da empresa
   */
  private loadPeriodoAtual(): void {
    if (!this.selectedEmpresaId) return;

    this.periodosService.getAtual(this.selectedEmpresaId).subscribe({
      next: (periodo) => {
        this.periodoAtual = periodo;
      },
      error: (err) => {
        console.error('Erro ao carregar período atual:', err);
        this.periodoAtual = null;
      }
    });
  }

  /**
   * Abre modal para iniciar novo período de avaliação
   */
  abrirModalIniciarPeriodo(): void {
    // Sugerir data atual como referência
    const hoje = new Date();
    
    // Formatar como YYYY-MM-DD para input type="date"
    this.dataReferenciaPeriodo = hoje.toISOString().split('T')[0];
    this.showIniciarPeriodoModal = true;
  }

  /**
   * Fecha modal de iniciar período
   */
  fecharModalIniciarPeriodo(): void {
    this.showIniciarPeriodoModal = false;
    this.dataReferenciaPeriodo = '';
  }

  /**
   * Confirma criação do novo período de avaliação
   */
  confirmarIniciarPeriodo(): void {
    if (!this.selectedEmpresaId || !this.dataReferenciaPeriodo) {
      this.showToast('Data de referência é obrigatória', 'error');
      return;
    }

    // Backend calculará trimestre e ano baseado na dataReferencia
    this.periodosService.iniciar(this.selectedEmpresaId, this.dataReferenciaPeriodo).subscribe({
      next: (periodo) => {
        this.periodoAtual = periodo;
        this.fecharModalIniciarPeriodo();
        const dataRef = new Date(periodo.dataReferencia);
        const mes = (dataRef.getMonth() + 1).toString().padStart(2, '0');
        const ano = dataRef.getFullYear();
        this.showToast(`Período ${mes}/${ano} iniciado com sucesso!`, 'success');
      },
      error: (err) => {
        const mensagem = err?.error?.message || 'Erro ao iniciar período de avaliação';
        this.showToast(mensagem, 'error', 5000);
      }
    });
  }

  /**
   * Retorna texto formatado do período atual para exibição no badge
   */
  getPeriodoAtualTexto(): string {
    if (!this.periodoAtual) return '';
    const dataRef = new Date(this.periodoAtual.dataReferencia);
    const mes = (dataRef.getMonth() + 1).toString().padStart(2, '0');
    const ano = dataRef.getFullYear();
    return `Avaliação ${mes}/${ano} em andamento`;
  }

  /**
   * Navegar para cockpit do pilar (criar se não existir)
   */
  async navegarParaCockpit(pilar: PilarEmpresa): Promise<void> {
    // Verificar se cockpit já existe
    if (pilar.cockpit?.id) {
      // Se existe, redirecionar para dashboard
      this.router.navigate(['/cockpits', pilar.cockpit.id, 'dashboard']);
    } else {
      // Se não existe, abrir modal de criação
      const modalRef = this.modalService.open(CriarCockpitModalComponent, {
        size: 'lg',
        backdrop: 'static',
        centered: true,
      });

      modalRef.componentInstance.pilar = pilar;

      try {
        const result = await modalRef.result;
        if (result) {
          // Após criar, redirecionar para dashboard
          this.showToast('Cockpit criado com sucesso!', 'success');
          this.router.navigate(['/cockpits', result.id, 'dashboard']);
        }
      } catch (error) {
        // Modal foi fechado/cancelado
        console.log('Modal de criar cockpit cancelado');
      }
    }
  }
}
