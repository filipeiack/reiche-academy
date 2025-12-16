import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { UsersService, Usuario, CreateUsuarioRequest, UpdateUsuarioRequest } from '../../../../core/services/users.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-usuarios-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe, UserAvatarComponent],
  templateUrl: './usuarios-form.component.html',
  styleUrl: './usuarios-form.component.scss'
})
export class UsuariosFormComponent implements OnInit {
  private usersService = inject(UsersService);
  private userProfileService = inject(UserProfileService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    cargo: ['', []],
    perfil: ['COLABORADOR', Validators.required],
    senha: ['', []],
    ativo: [true]
  });

  isEditMode = false;
  usuarioId: string | null = null;
  loading = false;
  uploadingAvatar = false;
  showPassword = false;
  
  currentUsuario: Usuario | null = null;
  fotoUrl: string | null = null;
  previewUrl: string | null = null;
  avatarFile: File | null = null;

  perfis = [
    { value: 'CONSULTOR', label: 'Consultor' },
    { value: 'GESTOR', label: 'Gestor' },
    { value: 'COLABORADOR', label: 'Colaborador' },
    { value: 'LEITURA', label: 'Leitura' }
  ];

  get senhaRequired(): boolean {
    return !this.isEditMode;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnInit(): void {
    this.usuarioId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.usuarioId;

    if (this.isEditMode && this.usuarioId) {
      this.loadUsuario(this.usuarioId);
      this.form.get('senha')?.setValidators([Validators.minLength(6)]);
      this.form.get('senha')?.updateValueAndValidity();
    } else {
      this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('senha')?.updateValueAndValidity();
    }
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
          email: usuario.email,
          cargo: usuario.cargo,
          perfil: usuario.perfil,
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
        email: formValue.email || '',
        cargo: formValue.cargo || '',
        perfil: (formValue.perfil || 'COLABORADOR') as any,
        ativo: formValue.ativo || true
      };

      this.usersService.update(this.usuarioId, updateData).subscribe({
        next: () => {
          this.showToast('Usuário atualizado com sucesso!', 'success');
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
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
        email: formValue.email || '',
        cargo: formValue.cargo || '',
        perfil: (formValue.perfil || 'COLABORADOR') as any,
        senha: formValue.senha || ''
      };

      this.usersService.create(createData).subscribe({
        next: (novoUsuario) => {
          this.showToast('Usuário criado com sucesso!', 'success');
          this.loading = false;
          
          if (this.avatarFile && novoUsuario.id) {
            this.uploadAvatar(this.avatarFile, novoUsuario.id);
          } else {
            setTimeout(() => {
              this.router.navigate(['/usuarios']);
            }, 2000);
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
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
          }, 2000);
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
}
