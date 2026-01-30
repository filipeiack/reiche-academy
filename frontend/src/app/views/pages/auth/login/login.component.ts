import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EmpresasService, Empresa } from '../../../../core/services/empresas.service';
import { ThemeModeService } from '../../../../core/services/theme-mode.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgIf,
    RouterLink,
    ReactiveFormsModule,
    TranslatePipe
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {

  returnUrl: any;
  loading = false;
  errorMessage = '';
  empresa: Empresa | null = null;
  logoUrl = 'assets/images/logo_reiche_academy.png'; // Logo padrão
  currentTheme = 'dark';
  showPassword = false;
  environmentLabel = (environment.environmentName || 'DESCONHECIDO').toUpperCase();

  private readonly REMEMBER_EMAIL_KEY = 'remember_email';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private empresasService = inject(EmpresasService);
  private themeModeService = inject(ThemeModeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });

  ngOnInit(): void {
    // Get the return URL from the route parameters, or default to '/diagnostico-notas'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/diagnostico-notas';

    // Carregar email salvo se "lembrar-me" estava ativo
    this.loadRememberedEmail();

    // Verificar se há uma empresa customizada na rota
    const loginUrl = this.route.snapshot.paramMap.get('loginUrl');
    if (loginUrl) {
      this.loadEmpresaCustomization(loginUrl);
    }

    // Assinar mudanças de tema para atualizar logo
    this.themeModeService.currentTheme.subscribe(theme => {
      this.currentTheme = theme;
      this.updateLogoByTheme();
    });
  }

  private loadEmpresaCustomization(loginUrl: string): void {
    this.empresasService.findByLoginUrl(loginUrl).subscribe({
      next: (empresa) => {
        if (empresa && empresa.logoUrl) {
          this.empresa = empresa;
          // Se logoUrl começa com /, adiciona a URL do backend
          this.logoUrl = empresa.logoUrl.startsWith('/')
            ? `${environment.backendUrl}${empresa.logoUrl}`
            : empresa.logoUrl;
        } else {
          // Sem logo customizada, usar logo padrão baseada no tema
          this.updateLogoByTheme();
        }
      },
      error: (err) => {
        console.error('[LoginComponent] Erro ao carregar customização:', err);
        // Mantém logo padrão em caso de erro
        this.updateLogoByTheme();
      }
    });
  }

  /**
   * Atualiza a logo padrão com base no tema atual
   * Só aplica se não houver logo customizada de empresa
   */
  private updateLogoByTheme(): void {
    if (this.empresa?.logoUrl) {
      // Empresa tem logo customizada, não alterar
      return;
    }

    this.logoUrl = this.currentTheme === 'dark'
      ? 'assets/images/logo_reiche_academy_light.png'
      : 'assets/images/logo_reiche_academy_light.png';
  }

  /**
   * Carrega email do localStorage se usuário marcou "lembrar-me"
   */
  private loadRememberedEmail(): void {
    const rememberedEmail = localStorage.getItem(this.REMEMBER_EMAIL_KEY);
    if (rememberedEmail) {
      this.form.patchValue({
        email: rememberedEmail,
        remember: true
      });
    }
  }

  /**
   * Salva ou remove email do localStorage baseado no checkbox
   */
  private handleRememberMe(email: string, remember: boolean): void {
    if (remember) {
      localStorage.setItem(this.REMEMBER_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(this.REMEMBER_EMAIL_KEY);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onLoggedin(e: Event) {
    e.preventDefault();

    console.log('[LoginComponent] Iniciando processo de login');
    console.log('[LoginComponent] Formulário válido:', !this.form.invalid);
    console.log('[LoginComponent] Valores do formulário:', this.form.value);

    if (this.form.invalid) {
      console.log('[LoginComponent] Formulário inválido, marcando campos');
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, senha, remember } = this.form.value;

    // Salvar ou remover email baseado no checkbox "lembrar-me"
    this.handleRememberMe(email || '', !!remember);

    console.log('[LoginComponent] Enviando requisição de login...');
    this.authService.login({ email: email || '', senha: senha || '' }, !!remember).subscribe({
      next: (response) => {
        console.log('[LoginComponent] Login bem-sucedido:', response);
        this.loading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        console.error('[LoginComponent] Erro no login:', err);
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Não foi possível fazer login. Verifique as credenciais.';
      }
    });
  }

}
