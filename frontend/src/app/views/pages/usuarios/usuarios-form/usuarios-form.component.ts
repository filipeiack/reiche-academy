import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
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
  error = '';
  success = '';
  uploadingAvatar = false;
  
  currentUsuario: Usuario | null = null;
  fotoUrl: string | null = null;
  previewUrl: string | null = null;

  perfis = [
    { value: 'CONSULTOR', label: 'Consultor' },
    { value: 'GESTOR', label: 'Gestor' },
    { value: 'COLABORADOR', label: 'Colaborador' },
    { value: 'LEITURA', label: 'Leitura' }
  ];

  get senhaRequired(): boolean {
    return !this.isEditMode;
  }

  ngOnInit(): void {
    this.usuarioId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.usuarioId;

    if (this.isEditMode && this.usuarioId) {
      this.loadUsuario(this.usuarioId);
    } else {
      // No modo criação, senha é obrigatória
      this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.form.get('senha')?.updateValueAndValidity();
    }
  }

  loadUsuario(id: string): void {
    this.loading = true;
    this.usersService.getById(id).subscribe({
      next: (usuario) => {
        console.log('Usuario carregado:', usuario);
        console.log('FotoUrl do usuario:', usuario.fotoUrl);
        this.currentUsuario = usuario;
        this.fotoUrl = usuario.fotoUrl || null;
        console.log('FotoUrl setado no componente:', this.fotoUrl);
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
        this.error = err?.error?.message || 'Erro ao carregar usuário';
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
    this.error = '';
    this.success = '';

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
          this.success = 'Usuário atualizado com sucesso!';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
          }, 1500);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erro ao atualizar usuário';
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
        next: () => {
          this.success = 'Usuário criado com sucesso!';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/usuarios']);
          }, 1500);
        },
        error: (err) => {
          this.error = err?.error?.message || 'Erro ao criar usuário';
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

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.error = 'Por favor, selecione uma imagem em formato JPG, PNG ou WebP';
      return;
    }

    // Validar tamanho (máx 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      this.error = 'A imagem não pode exceder 5MB';
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
      // Caso contrário, armazenar o arquivo para upload após criação do usuário
      this.uploadingAvatar = true;
    }

    // Limpar o input
    input.value = '';
  }

  uploadAvatar(file: File): void {
    if (!this.usuarioId) return;

    this.uploadingAvatar = true;
    this.error = '';

    console.log('Iniciando upload de avatar para usuário:', this.usuarioId);
    
    this.userProfileService.uploadProfilePhoto(this.usuarioId, file).subscribe({
      next: (response) => {
        console.log('Resposta do upload:', response);
        this.fotoUrl = response.fotoUrl;
        console.log('FotoUrl atualizado para:', this.fotoUrl);
        
        // Se for o usuário logado, atualizar AuthService
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id === this.usuarioId) {
          this.authService.updateCurrentUser({
            ...currentUser,
            fotoUrl: response.fotoUrl
          });
          console.log('Avatar do usuário logado atualizado na navbar');
        }
        
        this.success = 'Avatar atualizado com sucesso!';
        this.uploadingAvatar = false;
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (err) => {
        console.error('Erro ao fazer upload:', err);
        this.error = err?.error?.message || 'Erro ao fazer upload do avatar';
        this.uploadingAvatar = false;
      }
    });
  }

  removeAvatar(): void {
    if (!this.usuarioId) return;

    if (!confirm('Tem certeza que deseja remover o avatar?')) return;

    this.uploadingAvatar = true;
    this.error = '';
    this.userProfileService.deleteProfilePhoto(this.usuarioId).subscribe({
      next: () => {
        this.fotoUrl = null;
        this.previewUrl = null;
        
        // Se for o usuário logado, atualizar AuthService
        const currentUser = this.authService.getCurrentUser();
        if (currentUser && currentUser.id === this.usuarioId) {
          this.authService.updateCurrentUser({
            ...currentUser,
            fotoUrl: null
          });
          console.log('Avatar do usuário logado removido da navbar');
        }
        
        this.success = 'Avatar removido com sucesso!';
        this.uploadingAvatar = false;
        setTimeout(() => {
          this.success = '';
        }, 3000);
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao remover avatar';
        this.uploadingAvatar = false;
      }
    });
  }
}
