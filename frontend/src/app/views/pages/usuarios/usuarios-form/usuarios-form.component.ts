import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UsersService, CreateUsuarioRequest, UpdateUsuarioRequest } from '../../../../core/services/users.service';
import { Usuario } from '../../../../core/models/auth.model';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PerfisService, PerfilUsuario } from '../../../../core/services/perfis.service';
import { EmpresasService, Empresa } from '../../../../core/services/empresas.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, UserAvatarComponent, NgSelectModule],
  templateUrl: './usuarios-form.component.html',
  styleUrl: './usuarios-form.component.scss'
})
export class UsuariosFormComponent implements OnInit {
  private usersService = inject(UsersService);
  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);
  private perfisService = inject(PerfisService);
  private empresasService = inject(EmpresasService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Modo modal: quando true, não navega e emite evento onSave
  @Input() modalMode = false;
  @Input() presetEmpresaId?: string;
  @Output() onSave = new EventEmitter<Usuario>();
  @Output() onCancel = new EventEmitter<void>();

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    telefone: [''],
    email: ['', [Validators.required, Validators.email]],
    cargo: ['', []],
    perfilId: ['', Validators.required],
    empresaId: [''],
    senha: ['', []],
    ativo: [true]
  });

  isEditMode = false;
  usuarioId: string | null = null;
  loading = false;
  uploadingAvatar = false;
  showPassword = false;
  loadingEmpresas = false;
  
  currentUsuario: Usuario | null = null;
  currentLoggedUser: Usuario | null = null;
  fotoUrl: string | null = null;
  previewUrl: string | null = null;
  avatarFile: File | null = null;

  perfis: PerfilUsuario[] = [];
  empresas: Empresa[] = [];

  get senhaRequired(): boolean {
    return !this.isEditMode;
  }

  get isPerfilCliente(): boolean {
    if (!this.currentLoggedUser?.perfil) return false;
    const perfilCodigo = typeof this.currentLoggedUser.perfil === 'object' 
      ? this.currentLoggedUser.perfil.codigo 
      : this.currentLoggedUser.perfil;
    return ['GESTOR', 'COLABORADOR', 'LEITURA'].includes(perfilCodigo);
  }

  get isEditingOwnUser(): boolean {
    return this.isEditMode && this.currentLoggedUser?.id === this.usuarioId;
  }

  get shouldDisableEmpresaField(): boolean {
    // Perfis de cliente não podem alterar a associação com empresa ao editar seus próprios dados
    return this.isPerfilCliente && this.isEditingOwnUser;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  private getRedirectUrl(): string {
    // Perfis de cliente vão para o dashboard
    return this.isPerfilCliente ? '/dashboard' : '/usuarios';
  }

  handleCancel(): void {
    if (this.modalMode) {
      this.onCancel.emit();
    } else {
      this.router.navigate([this.getRedirectUrl()]);
    }
  }

  ngOnInit(): void {
    // Carregar usuário logado
    this.authService.currentUser$.subscribe(user => {
      this.currentLoggedUser = user;
    });

    this.loadPerfis();
    this.loadEmpresas();
    
    // Se tiver empresaId preset, preencher o campo
    if (this.presetEmpresaId) {
      this.form.patchValue({ empresaId: this.presetEmpresaId });
    }
    
    if (!this.modalMode) {
      this.usuarioId = this.route.snapshot.paramMap.get('id');
      this.isEditMode = !!this.usuarioId;
    }

    if (this.isEditMode && this.usuarioId) {
      this.loadUsuario(this.usuarioId);
      this.form.get('senha')?.setValidators([Validators.minLength(6)]);
      this.form.get('senha')?.updateValueAndValidity();
    } else {
      this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('senha')?.updateValueAndValidity();
    }
  }

  private loadEmpresas(): void {
    this.loadingEmpresas = true;
    this.empresasService.getAll().subscribe({
      next: (empresas) => {
        this.empresas = empresas;
        this.loadingEmpresas = false;
      },
      error: (error) => {
        console.error('Erro ao carregar empresas:', error);
        this.loadingEmpresas = false;
      }
    });
  }

  private loadPerfis(): void {
    this.perfisService.findAll().subscribe({
      next: (perfis) => {
        this.perfis = perfis;
        // Set default to COLABORADOR if not in edit mode
        if (!this.isEditMode && perfis.length > 0) {
          const colaborador = perfis.find(p => p.codigo === 'COLABORADOR');
          if (colaborador) {
            this.form.patchValue({ perfilId: colaborador.id });
          }
        }
      },
      error: (error) => {
        console.error('Erro ao carregar perfis:', error);
        this.showToast('Erro ao carregar perfis', 'error');
      }
    });
  }

  private withCacheBuster(url: string | null): string | null {
    if (!url) return null;
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}cb=${Date.now()}`;
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

  loadUsuario(id: string): void {
    this.loading = true;
    this.usersService.getById(id).subscribe({
      next: (usuario) => {
        this.currentUsuario = usuario;
        this.fotoUrl = this.withCacheBuster(usuario.fotoUrl || null);
        this.form.patchValue({
          nome: usuario.nome,
          telefone: usuario.telefone || '',
          email: usuario.email,
          cargo: usuario.cargo,
          perfilId: typeof usuario.perfil === 'object' ? usuario.perfil.id : usuario.perfil,
          empresaId: usuario.empresaId || null,
          ativo: usuario.ativo
        });
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao carregar usuário', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;

    const formValue = this.form.value;

    if (this.isEditMode && this.usuarioId) {
      // Atualizar usuário
      const updateData: UpdateUsuarioRequest = {
        nome: formValue.nome || '',
        telefone: formValue.telefone || '',
        email: formValue.email || '',
        cargo: formValue.cargo || '',
        empresaId: formValue.empresaId || null,
        perfilId: formValue.perfilId || '',
        ativo: formValue.ativo || true
      };

      // Incluir senha somente se foi preenchida
      if (formValue.senha && formValue.senha.trim()) {
        updateData.senha = formValue.senha;
      }

      this.usersService.update(this.usuarioId, updateData).subscribe({
        next: () => {
          this.showToast('Usuário atualizado com sucesso!', 'success');
          this.loading = false;
          setTimeout(() => {
            this.router.navigate([this.getRedirectUrl()]);
          }, 2000);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao atualizar usuário', 'error');
          this.loading = false;
        }
      });
    } else {
      // Criar novo usuário
      const createData: CreateUsuarioRequest = {
        nome: formValue.nome || '',
        telefone: formValue.telefone || '',
        email: formValue.email || '',
        cargo: formValue.cargo || '',
        perfilId: formValue.perfilId || '',
        senha: formValue.senha || '',
        empresaId: formValue.empresaId || undefined
      };

      this.usersService.create(createData).subscribe({
        next: (novoUsuario) => {
          this.showToast('Usuário criado com sucesso!', 'success');
          this.loading = false;
          
          if (this.avatarFile && novoUsuario.id) {
            this.uploadAvatar(this.avatarFile, novoUsuario.id);
          } else {
            if (this.modalMode) {
              this.onSave.emit(novoUsuario);
            } else {
              setTimeout(() => {
                this.router.navigate([this.getRedirectUrl()]);
              }, 2000);
            }
          }
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar usuário', 'error');
          this.loading = false;
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.hasError('required')) {
      return `${fieldName} é obrigatório`;
    }
    if (field.hasError('minlength')) {
      const minLength = field.getError('minlength').requiredLength;
      return `${fieldName} deve ter no mínimo ${minLength} caracteres`;
    }
    if (field.hasError('email')) {
      return 'Email inválido';
    }

    return 'Campo inválido';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.showToast('Por favor, selecione uma imagem em formato JPG, PNG ou WebP', 'error');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.showToast('A imagem não pode exceder 5MB', 'error');
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = () => {
      this.previewUrl = reader.result as string;
    };
    reader.readAsDataURL(file);

    // Se estiver em modo edição, fazer upload imediatamente
    if (this.isEditMode && this.usuarioId) {
      this.uploadAvatar(file);
    } else {
      this.avatarFile = file;
      this.showToast('Avatar será enviado quando você criar o usuário', 'info');
    }

    input.value = '';
  }

  uploadAvatar(file: File, usuarioId?: string): void {
    const idToUse = usuarioId || this.usuarioId;
    if (!idToUse) return;

    this.uploadingAvatar = true;
    
    this.userProfileService.uploadProfilePhoto(idToUse, file).subscribe({
      next: (response) => {
        const refreshedUrl = this.withCacheBuster(response.fotoUrl);
        this.fotoUrl = refreshedUrl;
        this.previewUrl = null;
        this.avatarFile = null;
        
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id === idToUse) {
          this.authService.updateCurrentUser({
            ...currentUser,
            fotoUrl: refreshedUrl
          });
        }
        
        this.showToast('Avatar atualizado com sucesso!', 'success');
        this.uploadingAvatar = false;
        
        if (usuarioId && !this.isEditMode) {
          if (this.modalMode) {
            // Em modo modal, emitir evento onSave com usuário completo
            this.usersService.getById(usuarioId).subscribe({
              next: (usuario) => this.onSave.emit(usuario)
            });
          } else {
            setTimeout(() => {
              this.router.navigate(['/usuarios']);
            }, 2000);
          }
        }
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao fazer upload do avatar', 'error');
        this.uploadingAvatar = false;
      }
    });
  }

  removeAvatar(): void {
    if (!this.usuarioId) return;

    Swal.fire({
      title: '<strong>Remover Avatar</strong>',
      html: 'Tem certeza que deseja remover o avatar?<br>Esta ação não pode ser desfeita.',
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: '<i class="feather icon-check"></i> Remover',
      confirmButtonAriaLabel: 'Remover avatar',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
      cancelButtonAriaLabel: 'Cancelar remoção',
      allowOutsideClick: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.confirmRemoveAvatar();
    });
  }

  private confirmRemoveAvatar(): void {
    if (!this.usuarioId) return;

    this.uploadingAvatar = true;
    this.userProfileService.deleteProfilePhoto(this.usuarioId).subscribe({
      next: () => {
        this.fotoUrl = null;
        this.previewUrl = null;
        
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id === this.usuarioId) {
          this.authService.updateCurrentUser({
            ...currentUser,
            fotoUrl: null
          });
        }
        
        this.showToast('Avatar removido com sucesso!', 'success');
        this.uploadingAvatar = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao remover avatar', 'error');
        this.uploadingAvatar = false;
      }
    });
  }

  // Máscara de telefone brasileiro
  applyPhoneMask(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    
    if (value.length <= 10) {
      // Telefone fixo: (11) 3333-4444
      value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else {
      // Celular: (11) 98765-4321
      value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    }
    
    this.form.patchValue({ telefone: value }, { emitEvent: false });
  }
}
