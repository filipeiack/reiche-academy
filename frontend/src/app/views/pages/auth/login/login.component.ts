import { NgIf } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { EmpresasService, Empresa } from '../../../../core/services/empresas.service';
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

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private empresasService = inject(EmpresasService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['admin@reiche.com', [Validators.required, Validators.email]],
    senha: ['123456', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });

  ngOnInit(): void {
    // Get the return URL from the route parameters, or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Verificar se há uma empresa customizada na rota
    const loginUrl = this.route.snapshot.paramMap.get('loginUrl');
    if (loginUrl) {
      this.loadEmpresaCustomization(loginUrl);
    }
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
        }
      },
      error: (err) => {
        console.error('[LoginComponent] Erro ao carregar customização:', err);
        // Mantém logo padrão em caso de erro
      }
    });
  }

  onLoggedin(e: Event) {
    e.preventDefault();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, senha, remember } = this.form.value;

    this.authService.login({ email: email || '', senha: senha || '' }, !!remember).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate([this.returnUrl]);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Não foi possível fazer login. Verifique as credenciais.';
      }
    });
  }

}
