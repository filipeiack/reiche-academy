import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { ThemeModeService } from '../../../core/services/theme-mode.service';
import { TranslateService, LanguageOption } from '../../../core/services/translate.service';
import { AuthService } from '../../../core/services/auth.service';
import { EmpresasService, Empresa } from '../../../core/services/empresas.service';
import { EmpresaContextService } from '../../../core/services/empresa-context.service';
import { TranslatePipe } from '../../../core/pipes/translate.pipe';
import { CnpjPipe } from '../../../core/pipes/cnpj.pipe';
import { UserAvatarComponent } from '../../../shared/components/user-avatar/user-avatar.component';
import { Usuario } from '../../../core/models/auth.model';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    CommonModule,
    NgbDropdownModule,
    RouterLink,
    FormsModule,
    NgSelectModule,
    TranslatePipe,
    CnpjPipe,
    UserAvatarComponent
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent implements OnInit {

  currentTheme: string = 'dark';
  translateService = inject(TranslateService);
  authService = inject(AuthService);
  empresasService = inject(EmpresasService);
  empresaContextService = inject(EmpresaContextService);
  languages: LanguageOption[] = [];
  currentLanguage: LanguageOption | undefined;
  currentUser: Usuario | null = null;
  
  // Empresa context
  empresas: Empresa[] = [];
  selectedEmpresaId: string | null = null;
  selectedEmpresa: Empresa | null = null;
  isAdmin = false;

  get hasEmpresa(): boolean {
    return !!this.currentUser?.empresaId;
  }

  getPerfilNome(): string | null {
    if (!this.currentUser?.perfil) return null;
    if (typeof this.currentUser.perfil === 'object') {
      return this.currentUser.perfil.nome;
    }
    return null;
  }

  getEmpresaNome(): string | null {
    if (!this.currentUser?.empresa) return null;
    if (typeof this.currentUser.empresa === 'object') {
      return this.currentUser.empresa.nome;
    }
    return null;
  }

  isPerfilCliente(): boolean {
    if (!this.currentUser?.perfil) return false;
    const perfilCodigo = typeof this.currentUser.perfil === 'object' 
      ? this.currentUser.perfil.codigo 
      : this.currentUser.perfil;
    return ['GESTOR', 'COLABORADOR', 'LEITURA'].includes(perfilCodigo);
  }

  constructor(private router: Router, private themeModeService: ThemeModeService) {}

  ngOnInit(): void {
    this.themeModeService.currentTheme.subscribe( (theme) => {
      this.currentTheme = theme;
      this.showActiveTheme(this.currentTheme);
    });

    // Initialize language
    this.languages = this.translateService.languages;
    this.translateService.currentLang$.subscribe(lang => {
      this.currentLanguage = this.languages.find(l => l.code === lang);
    });

    // Subscribe to current user
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAdmin = user?.perfil?.codigo === 'ADMINISTRADOR';
      
      // Carregar empresas se for admin
      if (this.isAdmin) {
        this.loadEmpresas();
      }
    });

    // Subscribe to empresa context
    this.empresaContextService.selectedEmpresaId$.subscribe(empresaId => {
      this.selectedEmpresaId = empresaId;
      this.updateSelectedEmpresa();
    });

    // Subscribe to empresa changes (criação/atualização)
    this.empresasService.empresaChanged$.subscribe(() => {
      if (this.isAdmin) {
        this.loadEmpresas();
      }
    });
  }

  showActiveTheme(theme: string) {
    const themeSwitcher = document.querySelector('#theme-switcher') as HTMLInputElement;
    const box = document.querySelector('.box') as HTMLElement;

    if (!themeSwitcher) {
      return;
    }

    // Toggle the custom checkbox based on the theme
    if (theme === 'dark') {
      themeSwitcher.checked = true;
      box.classList.remove('light');
      box.classList.add('dark');
    } else if (theme === 'light') {
      themeSwitcher.checked = false;
      box.classList.remove('dark');
      box.classList.add('light');
    }
  }

  /**
   * Change the theme on #theme-switcher checkbox changes 
   */
  onThemeCheckboxChange(e: Event) {
    const checkbox = e.target as HTMLInputElement;
    const newTheme: string = checkbox.checked ? 'dark' : 'light';
    this.themeModeService.toggleTheme(newTheme);
    this.showActiveTheme(newTheme);
  }

  /**
   * Toggle the sidebar when the hamburger button is clicked
   */
  toggleSidebar(e: Event) {
    e.preventDefault();
    document.body.classList.add('sidebar-open');
    document.querySelector('.sidebar .sidebar-toggler')?.classList.add('active');
  }

  /**
   * Change language
   */
  changeLanguage(lang: LanguageOption, e: Event) {
    e.preventDefault();
    this.translateService.use(lang.code);
  }

  /**
   * Carrega lista de empresas ativas (apenas para admin)
   */
  private loadEmpresas(): void {
    this.empresasService.getAll().subscribe({
      next: (data) => {
        this.empresas = data.filter(e => e.ativo);
        
        // Se já havia empresa selecionada no contexto, manter
        const empresaContextId = this.empresaContextService.getEmpresaId();
        if (empresaContextId) {
          this.selectedEmpresaId = empresaContextId;
        }

        this.updateSelectedEmpresa();
      },
      error: (err) => {
        console.error('Erro ao carregar empresas:', err);
      }
    });
  }

  private updateSelectedEmpresa(): void {
    if (!this.selectedEmpresaId) {
      this.selectedEmpresa = null;
      return;
    }

    this.selectedEmpresa = this.empresas.find(empresa => empresa.id === this.selectedEmpresaId) || null;
  }

  /**
   * Quando admin seleciona uma empresa ou limpa seleção
   */
  onEmpresaChange(event: any): void {
    const empresaId = typeof event === 'string' ? event : event?.id || this.selectedEmpresaId;
    
    // Se empresaId for null/undefined, limpar contexto
    if (!empresaId) {
      this.empresaContextService.clearSelectedEmpresa();
      return;
    }
    
    // Atualizar contexto de empresa
    this.empresaContextService.setSelectedEmpresa(empresaId);
    
    // Se já está na página de diagnósticos, NÃO navegar
    // O componente reage automaticamente ao contexto via selectedEmpresaId$
    const currentUrl = this.router.url;
    
    if (!currentUrl.includes('/diagnostico-notas')) {
      // Navegar para a página de diagnósticos
      setTimeout(() => {
        this.router.navigate(['/diagnostico-notas']).catch(err => {
          console.error('[NAVBAR] Erro ao navegar para diagnósticos:', err);
        });
      }, 100);
    }
  }

  /**
   * Retorna o nome da empresa do usuário logado (para perfis cliente)
   */
  getEmpresaNomeUsuario(): string {
    if (!this.currentUser?.empresa) return '';
    return typeof this.currentUser.empresa === 'object' 
      ? this.currentUser.empresa.nome 
      : '';
  }

  getEmpresaCnpj(): string {
    if (!this.currentUser?.empresa) return '';
    return typeof this.currentUser.empresa === 'object' 
      ? this.currentUser.empresa.cnpj
      : '';
  }

  getEmpresaLocalizacao(): string {
    if (!this.currentUser?.empresa) return '';
    if (typeof this.currentUser.empresa !== 'object') return '';
    
    const { cidade, estado } = this.currentUser.empresa;
    if (!cidade && !estado) return '';
    if (!cidade) return estado || '';
    if (!estado) return cidade;
    
    return `${cidade}/${estado}`;
  }

  getSelectedEmpresaCnpj(): string {
    return this.selectedEmpresa?.cnpj || '';
  }

  getSelectedEmpresaLocalizacao(): string {
    if (!this.selectedEmpresa) return '';

    const { cidade, estado } = this.selectedEmpresa;
    if (!cidade && !estado) return '';
    if (!cidade) return estado || '';
    if (!estado) return cidade;

    return `${cidade}/${estado}`;
  }

  getSelectedEmpresaPeriodoMentoriaLabel(): string {
    if (!this.selectedEmpresa) return '';
    if (!this.selectedEmpresa.periodoMentoriaAtivo) return 'Sem mentoria';

    return `Período ${this.selectedEmpresa.periodoMentoriaAtivo.numero} Ativo`;
  }

  getSelectedEmpresaPeriodoMentoriaInterval(): string {
    if (!this.selectedEmpresa?.periodoMentoriaAtivo) return '';

    const dataInicio = new Date(this.selectedEmpresa.periodoMentoriaAtivo.dataInicio);
    const dataFim = new Date(this.selectedEmpresa.periodoMentoriaAtivo.dataFim);
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

    const mesInicio = meses[dataInicio.getMonth()];
    const anoInicio = dataInicio.getFullYear().toString().slice(-2);
    const mesFim = meses[dataFim.getMonth()];
    const anoFim = dataFim.getFullYear().toString().slice(-2);

    return `${mesInicio}/${anoInicio} - ${mesFim}/${anoFim}`;
  }

  /**
   * Logout
   */
  onLogout(e: Event) {
    e.preventDefault();
    
    const currentUser = this.authService.getCurrentUser();
    
    // Limpar contexto de empresa
    this.empresaContextService.clearSelectedEmpresa();
    
    // Se o usuário tem empresa, buscar a loginUrl e redirecionar
    if (currentUser?.empresaId) {
      this.empresasService.getById(currentUser.empresaId).subscribe({
        next: (empresa) => {
          this.authService.logout();
          if (empresa.loginUrl) {
            // Redireciona para URL customizada da empresa
            this.router.navigate([`/${empresa.loginUrl}`]);
          } else {
            // Empresa sem loginUrl, vai para login padrão
            this.router.navigate(['/auth/login']);
          }
        },
        error: () => {
          // Em caso de erro, faz logout e vai para login padrão
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }
      });
    } else {
      // Usuário sem empresa (ex: Administrador), vai para login padrão
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    }
  }

}
