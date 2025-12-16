import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { EmpresasService, Empresa, CreateEmpresaRequest, UpdateEmpresaRequest } from '../../../../core/services/empresas.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-empresas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './empresas-form.component.html',
  styleUrl: './empresas-form.component.scss'
})
export class EmpresasFormComponent implements OnInit {
  private service = inject(EmpresasService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    cnpj: ['', [Validators.required]],
    razaoSocial: ['', [Validators.required, Validators.minLength(2)]],
    tipoNegocio: ['', [Validators.required, Validators.minLength(2)]],
    ativo: [true]
  });

  isEditMode = false;
  empresaId: string | null = null;
  loading = false;

  ngOnInit(): void {
    this.empresaId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.empresaId;
    if (this.isEditMode && this.empresaId) this.loadEmpresa(this.empresaId);
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer, timerProgressBar: true, title, icon });
  }

  loadEmpresa(id: string): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (empresa) => {
        this.form.patchValue({
          nome: empresa.nome,
          cnpj: empresa.cnpj,
          razaoSocial: empresa.razaoSocial,
          tipoNegocio: empresa.tipoNegocio,
          ativo: empresa.ativo
        });
        this.loading = false;
      },
      error: (err) => { this.showToast(err?.error?.message || 'Erro ao carregar empresa', 'error'); this.loading = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const v = this.form.value;

    if (this.isEditMode && this.empresaId) {
      const updateData: UpdateEmpresaRequest = {
        nome: v.nome || '',
        cnpj: v.cnpj || '',
        razaoSocial: v.razaoSocial || '',
        tipoNegocio: v.tipoNegocio || '',
        ativo: v.ativo || true
      };
      this.service.update(this.empresaId, updateData).subscribe({
        next: () => { this.showToast('Empresa atualizada com sucesso!', 'success'); this.loading = false; setTimeout(() => this.router.navigate(['/empresas']), 1500); },
        error: (err) => { this.showToast(err?.error?.message || 'Erro ao atualizar empresa', 'error'); this.loading = false; }
      });
    } else {
      const createData: CreateEmpresaRequest = {
        nome: v.nome || '',
        cnpj: v.cnpj || '',
        razaoSocial: v.razaoSocial || '',
        tipoNegocio: v.tipoNegocio || ''
      };
      this.service.create(createData).subscribe({
        next: () => { this.showToast('Empresa criada com sucesso!', 'success'); this.loading = false; setTimeout(() => this.router.navigate(['/empresas']), 1500); },
        error: (err) => { this.showToast(err?.error?.message || 'Erro ao criar empresa', 'error'); this.loading = false; }
      });
    }
  }

  onCnpjInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = (input.value || '').replace(/\D/g, '').slice(0, 14);
    let formatted = digits;
    if (digits.length > 2) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}`;
    if (digits.length > 5) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}`;
    if (digits.length > 8) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}`;
    if (digits.length > 12) formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    this.form.get('cnpj')?.setValue(formatted, { emitEvent: false });
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';
    if (field.hasError('required')) return `${fieldName} é obrigatório`;
    if (field.hasError('minlength')) {
      const minLength = field.getError('minlength').requiredLength;
      return `${fieldName} deve ter no mínimo ${minLength} caracteres`;
    }
    return 'Campo inválido';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
