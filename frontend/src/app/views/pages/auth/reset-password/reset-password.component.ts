import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss'
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loading = false;
  success = false;
  errorMessage = '';
  token = '';

  form = this.fb.group({
    novaSenha: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    ]],
    confirmarSenha: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
    
    if (!this.token) {
      this.errorMessage = 'Token inválido ou ausente';
    }
  }

  get passwordMismatch(): boolean {
    const senha = this.form.get('novaSenha')?.value;
    const confirmar = this.form.get('confirmarSenha')?.value;
    return !!(senha && confirmar && senha !== confirmar);
  }

  get passwordStrength(): string {
    const senha = this.form.get('novaSenha')?.value || '';
    
    if (senha.length < 8) return '';
    
    let strength = 0;
    if (/[a-z]/.test(senha)) strength++;
    if (/[A-Z]/.test(senha)) strength++;
    if (/\d/.test(senha)) strength++;
    if (/[@$!%*?&]/.test(senha)) strength++;
    
    if (strength <= 2) return 'fraca';
    if (strength === 3) return 'média';
    return 'forte';
  }

  onSubmit(): void {
    if (this.form.invalid || this.passwordMismatch || !this.token) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.resetPassword(this.token, this.form.value.novaSenha!).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erro ao redefinir senha';
        this.loading = false;
      }
    });
  }
}
