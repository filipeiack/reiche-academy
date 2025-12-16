import { NgIf, NgStyle } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    NgStyle,
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

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    email: ['admin@reiche.com', [Validators.required, Validators.email]],
    senha: ['123456', [Validators.required, Validators.minLength(6)]],
    remember: [false]
  });

  ngOnInit(): void {
    console.log('[LoginComponent] ngOnInit called');
    console.log('[LoginComponent] Current URL:', window.location.href);
    console.log('[LoginComponent] Query params:', this.route.snapshot.queryParams);
    
    // Get the return URL from the route parameters, or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    
    console.log('[LoginComponent] Return URL set to:', this.returnUrl);
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
