import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { NgSelectModule } from '@ng-select/ng-select';

import { RotinasService, CreateRotinaDto, UpdateRotinaDto } from '../../../../core/services/rotinas.service';
import { PilaresService, Pilar } from '../../../../core/services/pilares.service';
import { TranslatePipe } from "../../../../core/pipes/translate.pipe";

@Component({
  selector: 'app-rotina-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgSelectModule, TranslatePipe],
  templateUrl: './rotina-form.component.html',
  styleUrls: ['./rotina-form.component.scss']
})
export class RotinaFormComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private rotinasService = inject(RotinasService);
  private pilaresService = inject(PilaresService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild('pilarIdSelect') pilarIdSelect!: ElementRef;

  form!: FormGroup;
  pilares: Pilar[] = [];
  
  rotinaId: string | null = null;
  isEditMode = false;
  loading = false;
  submitting = false;

  ngOnInit(): void {
    this.buildForm();
    this.loadPilares();
    this.rotinaId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.rotinaId;
    
    if (this.isEditMode) {
      this.loadRotina();
    }
  }

  ngAfterViewInit(): void {
    // Dar foco ao campo pilarId após a view estar inicializada
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
        this.showToast('Erro ao carregar pilares', 'error');
        this.loading = false;
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
          this.showToast('Rotina não encontrada', 'error');
        } else {
          this.showToast('Erro ao carregar rotina', 'error');
        }
        
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const formValue = this.form.getRawValue(); // getRawValue inclui campos desabilitados
    
    // Trim nome
    formValue.nome = formValue.nome.trim();
    
    // Remover descricao se vazia
    if (!formValue.descricao || formValue.descricao.trim() === '') {
      delete formValue.descricao;
    } else {
      formValue.descricao = formValue.descricao.trim();
    }

    // Remover ordem se null/undefined
    if (formValue.ordem === null || formValue.ordem === undefined || formValue.ordem === '') {
      delete formValue.ordem;
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
        this.showToast('Rotina criada com sucesso', 'success');
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
        this.showToast('Rotina atualizada com sucesso', 'success');
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
      this.showToast('Erro de validação. Verifique os dados.', 'error');
    } else if (error.status === 404) {
      this.showToast('Rotina não encontrada', 'error');
    } else if (error.status === 400) {
      this.showToast('Dados inválidos. Verifique os campos.', 'error');
    } else {
      this.showToast('Erro ao salvar rotina. Tente novamente.', 'error');
    }
  }

  handleCancel(): void {
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
