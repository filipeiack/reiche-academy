import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { PilaresService, Pilar, CreatePilarDto, UpdatePilarDto } from '../../../../core/services/pilares.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-pilares-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './pilares-form.component.html',
  styleUrl: './pilares-form.component.scss'
})
export class PilaresFormComponent implements OnInit {
  private pilaresService = inject(PilaresService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // UI-PIL-005: Formulário de Criação/Edição
  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    descricao: ['', [Validators.maxLength(500)]],
    ordem: [null as number | null, [Validators.min(1)]],
    ativo: [true]
  });

  isEditMode = false;
  pilarId: string | null = null;
  loading = false;
  submitting = false;
  
  currentPilar: Pilar | null = null;

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.pilarId = params.get('id');
      this.isEditMode = !!this.pilarId;

      if (this.isEditMode && this.pilarId) {
        this.loadPilar(this.pilarId);
      }
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
      icon,
    });
  }

  loadPilar(id: string): void {
    this.loading = true;
    this.pilaresService.findOne(id).subscribe({
      next: (pilar) => {
        this.currentPilar = pilar;
        this.form.patchValue({
          nome: pilar.nome,
          descricao: pilar.descricao || '',
          ordem: pilar.ordem ?? null,
          ativo: pilar.ativo
        });
        this.loading = false;
      },
      error: (err) => {
        this.showToast('Erro ao carregar pilar', 'error');
        this.loading = false;
        this.router.navigate(['/pilares']);
      }
    });
  }

  suggestNextOrdem(): void {
    // Buscar todos os pilares para calcular próxima ordem
    this.pilaresService.findAll().subscribe({
      next: (pilares) => {
        const maxOrdem = pilares
          .filter(p => p.ordem !== null && p.ordem !== undefined)
          .reduce((max, p) => Math.max(max, p.ordem!), 0);
        
        this.form.patchValue({ ordem: maxOrdem + 1 });
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const formValue = this.form.value;
    
    if (this.isEditMode && this.pilarId) {
      this.updatePilar(this.pilarId, formValue);
    } else {
      this.createPilar(formValue);
    }
  }

  createPilar(data: any): void {
    const dto: CreatePilarDto = {
      nome: data.nome!,
      descricao: data.descricao || undefined,
      ordem: data.ordem ?? undefined,
      modelo: data.modelo ?? false
    };

    this.pilaresService.create(dto).subscribe({
      next: () => {
        this.showToast('Pilar criado com sucesso', 'success');
        this.router.navigate(['/pilares']);
      },
      error: (err) => {
        const message = err?.error?.message || 'Erro ao criar pilar';
        this.showToast(message, 'error');
        this.submitting = false;
      }
    });
  }

  updatePilar(id: string, data: any): void {
    const dto: UpdatePilarDto = {
      nome: data.nome || undefined,
      descricao: data.descricao || undefined,
      ordem: data.ordem === null || data.ordem === '' ? null : data.ordem,
      modelo: data.modelo ?? undefined,
      ativo: data.ativo ?? undefined
    };

    this.pilaresService.update(id, dto).subscribe({
      next: () => {
        this.showToast('Pilar atualizado com sucesso', 'success');
        this.router.navigate(['/pilares']);
      },
      error: (err) => {
        const message = err?.error?.message || 'Erro ao atualizar pilar';
        this.showToast(message, 'error');
        this.submitting = false;
      }
    });
  }

  handleCancel(): void {
    this.router.navigate(['/pilares']);
  }

  // Validação auxiliar
  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return 'Campo obrigatório';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
    if (field.errors['email']) return 'E-mail inválido';

    return 'Campo inválido';
  }
}
