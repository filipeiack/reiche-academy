import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { NgSelectModule } from '@ng-select/ng-select';
import Swal from 'sweetalert2';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { DiagnosticoNotasService, PilarEmpresa, RotinaEmpresa, UpdateNotaRotinaDto } from '../../../core/services/diagnostico-notas.service';
import { EmpresasService, Empresa } from '../../../core/services/empresas.service';
import { AuthService } from '../../../core/services/auth.service';

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
    TranslatePipe,
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
        if (this.empresas.length > 0 && !this.selectedEmpresaId) {
          // Auto-selecionar primeira empresa
          this.selectedEmpresaId = this.empresas[0].id;
          this.loadDiagnostico();
        }
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao carregar empresas';
      }
    });
  }

  onEmpresaChange(empresaId: string | null): void {
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
   * Configura o auto-save com debounce de 800ms
   */
  private setupAutoSave(): void {
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(
        debounceTime(800), // Aguarda 800ms após última alteração
        distinctUntilChanged((prev, curr) => 
          prev.rotinaEmpresaId === curr.rotinaEmpresaId &&
          prev.data.nota === curr.data.nota &&
          prev.data.criticidade === curr.data.criticidade
        )
      )
      .subscribe((item) => {
        this.executeSave(item);
      });
  }

  /**
   * Chamado quando nota ou criticidade é alterada
   */
  onNotaChange(rotinaEmpresa: RotinaEmpresa, nota: number | null, criticidade: string | null): void {
    // Validar campos obrigatórios
    if (nota === null || nota === undefined || !criticidade) {
      return; // Não salvar se campos não estiverem preenchidos
    }

    // Validar range de nota
    if (nota < 1 || nota > 10) {
      this.showToast('Nota deve estar entre 1 e 10', 'error');
      return;
    }

    const dto: UpdateNotaRotinaDto = {
      nota: Number(nota),
      criticidade: criticidade as 'ALTO' | 'MEDIO' | 'BAIXO',
    };

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
    this.savingCount++;

    this.diagnosticoService.upsertNotaRotina(item.rotinaEmpresaId, item.data).subscribe({
      next: (response) => {
        this.savingCount--;
        // Auto-save silencioso - não mostrar toast de sucesso
      },
      error: (err) => {
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
      const message = err?.error?.message || 'Erro ao salvar nota';
      this.showToast(`${message}. Tente novamente mais tarde.`, 'error', 5000);
    }
  }

  /**
   * Retorna a nota atual de uma rotina (última registrada)
   */
  getNotaAtual(rotinaEmpresa: RotinaEmpresa): number | null {
    return rotinaEmpresa.notas?.[0]?.nota ?? null;
  }

  /**
   * Retorna a criticidade atual de uma rotina
   */
  getCriticidadeAtual(rotinaEmpresa: RotinaEmpresa): string | null {
    return rotinaEmpresa.notas?.[0]?.criticidade ?? null;
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
