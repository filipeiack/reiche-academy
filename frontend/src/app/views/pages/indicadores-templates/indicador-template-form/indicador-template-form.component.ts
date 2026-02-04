import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

import {
  IndicadoresTemplatesService,
  CreateIndicadorTemplateDto,
  UpdateIndicadorTemplateDto,
  TipoMedidaIndicador,
} from '../../../../core/services/indicadores-templates.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-indicador-template-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './indicador-template-form.component.html',
  styleUrls: ['./indicador-template-form.component.scss'],
})
export class IndicadorTemplateFormComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private indicadoresService = inject(IndicadoresTemplatesService);
  private pilaresService = inject(PilaresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('pilarIdSelect') pilarIdSelect!: ElementRef;

  form!: FormGroup;
  pilares: Pilar[] = [];

  indicadorId: string | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;

  tipoMedidaOptions: { value: TipoMedidaIndicador; labelKey: string }[] = [
    { value: 'REAL', labelKey: 'INDICADORES_TEMPLATES.TIPO_MEDIDA.REAL' },
    { value: 'QUANTIDADE', labelKey: 'INDICADORES_TEMPLATES.TIPO_MEDIDA.QUANTIDADE' },
    { value: 'TEMPO', labelKey: 'INDICADORES_TEMPLATES.TIPO_MEDIDA.TEMPO' },
    { value: 'PERCENTUAL', labelKey: 'INDICADORES_TEMPLATES.TIPO_MEDIDA.PERCENTUAL' },
  ];

  direcaoIndicador = {
    MAIOR: 'MAIOR',
    MENOR: 'MENOR',
  } as const;

  ngOnInit(): void {
    this.buildForm();
    this.loadPilares();
    this.indicadorId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.indicadorId;

    if (this.isEditMode) {
      this.loadIndicador();
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
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      descricao: ['', [Validators.maxLength(1000)]],
      pilarId: ['', [Validators.required]],
      tipoMedida: ['', [Validators.required]],
      melhor: ['', [Validators.required]],
      ordem: [null, [Validators.min(1)]],
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

  loadIndicador(): void {
    if (!this.indicadorId) return;

    this.loading = true;
    this.indicadoresService.findOne(this.indicadorId).subscribe({
      next: (indicador) => {
        this.form.patchValue({
          nome: indicador.nome,
          descricao: indicador.descricao || '',
          pilarId: indicador.pilarId,
          tipoMedida: indicador.tipoMedida,
          melhor: indicador.melhor,
          ordem: indicador.ordem,
        });

        this.form.get('pilarId')?.disable();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 404) {
          this.showToast('Indicador template não encontrado', 'error');
        } else {
          this.showToast(error?.error?.message || 'Erro ao carregar indicador template', 'error');
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

    formValue.nome = formValue.nome.trim();

    if (!formValue.descricao || formValue.descricao.trim() === '') {
      delete formValue.descricao;
    } else {
      formValue.descricao = formValue.descricao.trim();
    }

    if (formValue.ordem === null || formValue.ordem === undefined || formValue.ordem === '') {
      delete formValue.ordem;
    }

    if (this.isEditMode) {
      this.updateIndicador(formValue);
    } else {
      this.createIndicador(formValue);
    }
  }

  createIndicador(data: CreateIndicadorTemplateDto): void {
    this.indicadoresService.create(data).subscribe({
      next: () => {
        this.showToast('Indicador template criado com sucesso', 'success');
        this.router.navigate(['/indicadores-templates']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.handleError(error);
      },
    });
  }

  updateIndicador(data: UpdateIndicadorTemplateDto): void {
    if (!this.indicadorId) return;

    const updateData: UpdateIndicadorTemplateDto = {
      nome: data.nome,
      descricao: data.descricao,
      tipoMedida: data.tipoMedida,
      melhor: data.melhor,
      ordem: data.ordem,
    };

    this.indicadoresService.update(this.indicadorId, updateData).subscribe({
      next: () => {
        this.showToast('Indicador template atualizado com sucesso', 'success');
        this.router.navigate(['/indicadores-templates']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.handleError(error);
      },
    });
  }

  handleError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      const message = error?.error?.message || 'Já existe um indicador template com este nome';
      this.showToast(message, 'error');
    } else if (error.status === 404) {
      this.showToast('Indicador template não encontrado', 'error');
    } else if (error.status === 400) {
      this.showToast(error?.error?.message || 'Dados inválidos. Verifique os campos.', 'error');
    } else {
      this.showToast(error?.error?.message || 'Erro ao salvar indicador template. Tente novamente.', 'error');
    }
  }

  handleCancel(): void {
    this.router.navigate(['/indicadores-templates']);
  }

  get nomeInvalid(): boolean {
    const control = this.form.get('nome');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get descricaoInvalid(): boolean {
    const control = this.form.get('descricao');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get pilarIdInvalid(): boolean {
    const control = this.form.get('pilarId');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get tipoMedidaInvalid(): boolean {
    const control = this.form.get('tipoMedida');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get melhorInvalid(): boolean {
    const control = this.form.get('melhor');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  get ordemInvalid(): boolean {
    const control = this.form.get('ordem');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
