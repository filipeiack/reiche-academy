import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import {
  ObjetivosTemplatesService,
  CreateObjetivoTemplateDto,
  UpdateObjetivoTemplateDto,
} from '../../../../core/services/objetivos-templates.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-objetivo-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './objetivo-template-form.component.html',
  styleUrls: ['./objetivo-template-form.component.scss'],
})
export class ObjetivoTemplateFormComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private objetivosService = inject(ObjetivosTemplatesService);
  private pilaresService = inject(PilaresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('pilarIdSelect') pilarIdSelect!: ElementRef;

  form!: FormGroup;
  pilares: Pilar[] = [];

  objetivoId: string | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;

  ngOnInit(): void {
    this.buildForm();
    this.loadPilares();
    this.objetivoId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.objetivoId;

    if (this.isEditMode) {
      this.loadObjetivo();
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      if (this.pilarIdSelect?.nativeElement) {
        this.pilarIdSelect.nativeElement.focus();
      }
    }, 100);
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

  buildForm(): void {
    this.form = this.fb.group({
      pilarId: ['', [Validators.required]],
      entradas: ['', [Validators.required, Validators.maxLength(300)]],
      saidas: ['', [Validators.required, Validators.maxLength(300)]],
      missao: ['', [Validators.required, Validators.maxLength(300)]],
    });
  }

  loadPilares(): void {
    this.pilaresService.findAll().subscribe({
      next: (pilares) => {
        this.pilares = pilares.filter((p) => p.ativo);
      },
      error: (error: HttpErrorResponse) => {
        this.showToast(error?.error?.message || 'Erro ao carregar pilares', 'error');
        this.loading = false;
      },
    });
  }

  loadObjetivo(): void {
    if (!this.objetivoId) return;

    this.loading = true;
    this.objetivosService.findOne(this.objetivoId).subscribe({
      next: (objetivo) => {
        this.form.patchValue({
          pilarId: objetivo.pilarId,
          entradas: objetivo.entradas,
          saidas: objetivo.saidas,
          missao: objetivo.missao,
        });

        this.form.get('pilarId')?.disable();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 404) {
          this.showToast('Objetivo template não encontrado', 'error');
        } else {
          this.showToast(error?.error?.message || 'Erro ao carregar objetivo template', 'error');
        }
      },
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const formValue = this.form.getRawValue();

    const payload = {
      pilarId: formValue.pilarId,
      entradas: formValue.entradas.trim(),
      saidas: formValue.saidas.trim(),
      missao: formValue.missao.trim(),
    };

    if (this.isEditMode) {
      this.updateObjetivo(payload);
    } else {
      this.createObjetivo(payload);
    }
  }

  createObjetivo(data: CreateObjetivoTemplateDto): void {
    this.objetivosService.create(data).subscribe({
      next: () => {
        this.showToast('Objetivo template criado com sucesso', 'success');
        this.router.navigate(['/objetivos-templates']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.handleError(error);
      },
    });
  }

  updateObjetivo(data: UpdateObjetivoTemplateDto): void {
    if (!this.objetivoId) return;

    const updateData: UpdateObjetivoTemplateDto = {
      entradas: data.entradas,
      saidas: data.saidas,
      missao: data.missao,
    };

    this.objetivosService.update(this.objetivoId, updateData).subscribe({
      next: () => {
        this.showToast('Objetivo template atualizado com sucesso', 'success');
        this.router.navigate(['/objetivos-templates']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.handleError(error);
      },
    });
  }

  handleError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      const message = error?.error?.message || 'Já existe um objetivo template para este pilar';
      this.showToast(message, 'error');
    } else if (error.status === 404) {
      this.showToast('Objetivo template não encontrado', 'error');
    } else if (error.status === 400) {
      this.showToast(error?.error?.message || 'Dados inválidos. Verifique os campos.', 'error');
    } else {
      this.showToast(error?.error?.message || 'Erro ao salvar objetivo template. Tente novamente.', 'error');
    }
  }

  handleCancel(): void {
    this.router.navigate(['/objetivos-templates']);
  }

  get pilarIdInvalid(): boolean {
    const control = this.form.get('pilarId');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get entradasInvalid(): boolean {
    const control = this.form.get('entradas');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get saidasInvalid(): boolean {
    const control = this.form.get('saidas');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get missaoInvalid(): boolean {
    const control = this.form.get('missao');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
