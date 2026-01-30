import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { ThemeModeService } from '../../../../core/services/theme-mode.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private themeModeService = inject(ThemeModeService);

  loading = false;
  success = false;
  errorMessage = '';
  currentTheme = 'dark';
  logoUrl = 'assets/images/logo_reiche_academy_light.png';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  ngOnInit(): void {
    this.themeModeService.currentTheme.subscribe(theme => {
      this.currentTheme = theme;
      this.updateLogoByTheme();
    });
  }

  private updateLogoByTheme(): void {
    this.logoUrl = this.currentTheme === 'dark'
      ? 'assets/images/logo_reiche_academy_light.png'
      : 'assets/images/logo_reiche_academy_light.png';
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.form.value.email!).subscribe({
      next: () => {
        this.success = true;
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Erro ao enviar email de recuperação';
        this.loading = false;
      }
    });
  }
}
