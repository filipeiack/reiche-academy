import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { RotinasService, CreateRotinaDto, UpdateRotinaDto } from '../../../../core/services/rotinas.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';

@Component({
  selector: 'app-rotina-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './rotina-form.component.html',
  styleUrls: ['./rotina-form.component.scss']
})
export class RotinaFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private rotinasService = inject(RotinasService);
  private pilaresService = inject(PilaresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form!: FormGroup;
  pilares: Pilar[] = [];
  
  rotinaId: string | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;
  error: string | null = null;

  ngOnInit(): void {
    this.buildForm();
    this.loadPilares();
    
    this.rotinaId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.rotinaId;
    
    if (this.isEditMode) {
      this.loadRotina();
    }
  }

  buildForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      descricao: ['', [Validators.maxLength(500)]],
      pilarId: ['', [Validators.required]],
      ordem: [null, [Validators.min(1)]],
      modelo: [false],
    });
  }

  loadPilares(): void {
    this.pilaresService.findAll().subscribe({
      next: (pilares) => {
        this.pilares = pilares.filter(p => p.ativo);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Erro ao carregar pilares:', error);
        this.error = 'Erro ao carregar pilares';
      }
    });
  }

  loadRotina(): void {
    if (!this.rotinaId) return;
    
    this.loading = true;
    this.rotinasService.findOne(this.rotinaId).subscribe({
      next: (rotina) => {
        this.form.patchValue({
          nome: rotina.nome,
          descricao: rotina.descricao || '',
          pilarId: rotina.pilarId,
          ordem: rotina.ordem,
          modelo: rotina.modelo,
        });
        
        // Desabilitar pilarId em modo de edição (conforme regra UI-ROT-005)
        this.form.get('pilarId')?.disable();
        
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        if (error.status === 404) {
          this.error = 'Rotina não encontrada';
        } else {
          this.error = 'Erro ao carregar rotina';
        }
        console.error('Erro ao carregar rotina:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const formValue = this.form.getRawValue(); // getRawValue inclui campos desabilitados
    
    // Trim nome
    formValue.nome = formValue.nome.trim();
    
    // Remover descricao se vazia
    if (!formValue.descricao || formValue.descricao.trim() === '') {
      delete formValue.descricao;
    } else {
      formValue.descricao = formValue.descricao.trim();
    }

    if (this.isEditMode) {
      this.updateRotina(formValue);
    } else {
      this.createRotina(formValue);
    }
  }

  createRotina(data: CreateRotinaDto): void {
    this.rotinasService.create(data).subscribe({
      next: () => {
        this.showSuccessToast('Rotina criada com sucesso');
        this.router.navigate(['/rotinas']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.handleError(error);
      }
    });
  }

  updateRotina(data: UpdateRotinaDto): void {
    if (!this.rotinaId) return;
    
    // Remover pilarId do update (não editável) - getRawValue pode incluí-lo
    const updateData: UpdateRotinaDto = {
      nome: data.nome,
      descricao: data.descricao,
      ordem: data.ordem,
      modelo: data.modelo,
    };
    
    this.rotinasService.update(this.rotinaId, updateData).subscribe({
      next: () => {
        this.showSuccessToast('Rotina atualizada com sucesso');
        this.router.navigate(['/rotinas']);
      },
      error: (error: HttpErrorResponse) => {
        this.submitting = false;
        this.handleError(error);
      }
    });
  }

  handleError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      this.error = 'Erro de validação. Verifique os dados.';
    } else if (error.status === 404) {
      this.error = 'Rotina não encontrada';
    } else if (error.status === 400) {
      this.error = 'Dados inválidos. Verifique os campos.';
    } else {
      this.error = 'Erro ao salvar rotina. Tente novamente.';
    }
    console.error('Erro ao salvar:', error);
  }

  showSuccessToast(message: string): void {
    alert(message);
  }

  cancel(): void {
    this.router.navigate(['/rotinas']);
  }

  // Getters para validação
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

  get ordemInvalid(): boolean {
    const control = this.form.get('ordem');
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
