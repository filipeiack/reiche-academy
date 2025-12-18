import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { EmpresasService, Empresa, CreateEmpresaRequest, UpdateEmpresaRequest, EstadoBrasil } from '../../../../core/services/empresas.service';
import { UsersService } from '../../../../core/services/users.service';
import { Usuario } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { environment } from '../../../../../environments/environment';
import { NgSelectModule } from '@ng-select/ng-select';
import { UsuarioModalComponent } from '../../usuarios/usuario-modal/usuario-modal.component';
import { UserAvatarComponent } from '../../../../shared/components/user-avatar/user-avatar.component';

@Component({
  selector: 'app-empresas-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterLink, TranslatePipe, NgSelectModule, UsuarioModalComponent, UserAvatarComponent],
  templateUrl: './empresas-form.component.html',
  styleUrl: './empresas-form.component.scss'
})
export class EmpresasFormComponent implements OnInit {
  private service = inject(EmpresasService);
  private usersService = inject(UsersService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  @ViewChild(UsuarioModalComponent) usuarioModal!: UsuarioModalComponent;

  readonly estadosList: EstadoBrasil[] = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
  tiposNegocioList: string[] = [];
  usuariosDisponiveis: Usuario[] = [];
  usuariosAssociados: Usuario[] = [];
  usuariosPendentesAssociacao: Usuario[] = []; // Usuários a serem associados após criar a empresa

  currentLoggedUser: Usuario | null = null;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    cnpj: ['', [Validators.required]],
    tipoNegocio: [''],
    loginUrl: ['', [Validators.minLength(3), Validators.pattern(/^\S+$/)]],
    cidade: ['', [Validators.required, Validators.minLength(2)]],
    estado: ['', [Validators.required]],
    ativo: [true]
  });

  isEditMode = false;
  empresaId: string | null = null;
  loading = false;
  uploadingLogo = false;

  currentEmpresa: Empresa | null = null;
  logoUrl: string | null = null;
  previewUrl: string | null = null;
  logoFile: File | null = null;

  get isPerfilCliente(): boolean {
    if (!this.currentLoggedUser?.perfil) return false;
    const perfilCodigo = typeof this.currentLoggedUser.perfil === 'object' 
      ? this.currentLoggedUser.perfil.codigo 
      : this.currentLoggedUser.perfil;
    return ['GESTOR', 'COLABORADOR', 'LEITURA'].includes(perfilCodigo);
  }

  ngOnInit(): void {
    // Carregar usuário logado
    this.authService.currentUser$.subscribe(user => {
      this.currentLoggedUser = user;
    });

    this.empresaId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.empresaId;
    this.loadTiposNegocio();
    
    // Perfis de cliente não carregam usuários disponíveis para associação
    if (!this.isPerfilCliente) {
      this.loadUsuariosDisponiveis();
    }
    
    if (this.isEditMode && this.empresaId) {
      this.loadEmpresa(this.empresaId);
      this.loadUsuariosAssociados(this.empresaId);
    }
  }

  private getRedirectUrl(): string {
    // Perfis de cliente vão para o dashboard
    return this.isPerfilCliente ? '/dashboard' : '/empresas';
  }

  handleCancel(): void {
    this.router.navigate([this.getRedirectUrl()]);
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
    Swal.fire({ toast: true, position: 'top-end', showConfirmButton: false, timer, timerProgressBar: true, title, icon });
  }

  loadTiposNegocio(): void {
    this.service.getTiposNegocio().subscribe({
      next: (tipos) => {
        this.tiposNegocioList = tipos;
      },
      error: (err) => {
        // Erro não é crítico - usuário pode digitar manualmente
        console.warn('Não foi possível carregar tipos de negócio. Certifique-se que o backend está rodando.', err.message);
        this.tiposNegocioList = [];
      }
    });
  }

  loadEmpresa(id: string): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (empresa) => {
        this.currentEmpresa = empresa;
        this.logoUrl = this.withCacheBuster(empresa.logoUrl || null);
        this.form.patchValue({
          nome: empresa.nome,
          cnpj: empresa.cnpj,
          tipoNegocio: empresa.tipoNegocio || '',
          loginUrl: empresa.loginUrl || '',
          cidade: empresa.cidade,
          estado: empresa.estado,
          ativo: empresa.ativo
        });
        this.loading = false;
      },
      error: (err) => { this.showToast(err?.error?.message || 'Erro ao carregar empresa', 'error'); this.loading = false; }
    });
  }

  private withCacheBuster(url: string | null): string | null {
    if (!url) return null;
    // Se a URL não começar com http, adicionar o backendUrl
    const fullUrl = url.startsWith('http') ? url : `${environment.backendUrl}${url}`;
    const separator = fullUrl.includes('?') ? '&' : '?';
    return `${fullUrl}${separator}cb=${Date.now()}`;
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    const v = this.form.value;

    if (this.isEditMode && this.empresaId) {
      const updateData: UpdateEmpresaRequest = {
        nome: v.nome || '',
        cnpj: v.cnpj || '',
        tipoNegocio: v.tipoNegocio || undefined,
        loginUrl: v.loginUrl || undefined,
        cidade: v.cidade || '',
        estado: v.estado as EstadoBrasil,
        ativo: v.ativo || true
      };
      this.service.update(this.empresaId, updateData).subscribe({
        next: () => { this.showToast('Empresa atualizada com sucesso!', 'success'); this.loading = false; setTimeout(() => this.router.navigate([this.getRedirectUrl()]), 1500); },
        error: (err) => { this.showToast(err?.error?.message || 'Erro ao atualizar empresa', 'error'); this.loading = false; }
      });
    } else {
      const createData: CreateEmpresaRequest = {
        nome: v.nome || '',
        cnpj: v.cnpj || '',
        tipoNegocio: v.tipoNegocio || undefined,
        loginUrl: v.loginUrl || undefined,
        cidade: v.cidade || '',
        estado: v.estado as EstadoBrasil
      };
      this.service.create(createData).subscribe({
        next: (novaEmpresa) => {
          console.log('Empresa criada com sucesso:', novaEmpresa);
          console.log('logoFile existe?', !!this.logoFile);
          
          this.showToast('Empresa criada com sucesso!', 'success');
          this.loading = false;

          // Associar usuários pendentes
          if (this.usuariosPendentesAssociacao.length > 0 && novaEmpresa.id) {
            this.associarUsuariosPendentes(novaEmpresa.id);
          }

          if (this.logoFile && novaEmpresa.id) {
            console.log('Iniciando upload do logo para empresa recém-criada');
            this.uploadLogo(this.logoFile, novaEmpresa.id);
          } else {
            console.log('Sem logo para upload, redirecionando');
            setTimeout(() => this.router.navigate([this.getRedirectUrl()]), 1500);
          }
        },
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

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    console.log('onLogoSelected chamado');
    console.log('Arquivo selecionado:', file);
    console.log('isEditMode:', this.isEditMode);
    console.log('empresaId:', this.empresaId);

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
      console.log('Preview criado com sucesso');
    };
    reader.readAsDataURL(file);

    // Se estiver em modo edição, fazer upload imediatamente
    if (this.isEditMode && this.empresaId) {
      console.log('Modo edição - fazendo upload imediato');
      this.uploadLogo(file);
    } else {
      console.log('Modo criação - armazenando arquivo para upload posterior');
      this.logoFile = file;
      this.showToast('Logo será enviado quando você criar a empresa', 'info');
    }

    input.value = '';
  }

  uploadLogo(file: File, empresaId?: string): void {
    const idToUse = empresaId || this.empresaId;
    if (!idToUse) {
      console.error('ID da empresa não encontrado para upload');
      return;
    }

    console.log('Iniciando upload de logo para empresa:', idToUse);
    console.log('Arquivo:', file.name, file.type, file.size);

    this.uploadingLogo = true;

    this.service.uploadLogo(idToUse, file).subscribe({
      next: (response) => {
        console.log('Upload bem-sucedido:', response);
        const refreshedUrl = this.withCacheBuster(response.logoUrl);
        this.logoUrl = refreshedUrl;
        this.previewUrl = null;
        this.logoFile = null;

        this.showToast('Logo atualizado com sucesso!', 'success');
        this.uploadingLogo = false;

        if (empresaId && !this.isEditMode) {
          setTimeout(() => {
            this.router.navigate([this.getRedirectUrl()]);
          }, 1500);
        }
      },
      error: (err) => {
        console.error('Erro no upload:', err);
        this.showToast(err?.error?.message || 'Erro ao fazer upload do logo', 'error');
        this.uploadingLogo = false;
      }
    });
  }

  removeLogo(): void {
    if (!this.empresaId) return;

    Swal.fire({
      title: '<strong>Remover Logo</strong>',
      html: 'Tem certeza que deseja remover o logotipo?<br>Esta ação não pode ser desfeita.',
      showCloseButton: true,
      showCancelButton: true,
      focusConfirm: false,
      confirmButtonText: '<i class="feather icon-check"></i> Remover',
      confirmButtonAriaLabel: 'Remover logo',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
      cancelButtonAriaLabel: 'Cancelar remoção',
      allowOutsideClick: false
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.confirmRemoveLogo();
    });
  }

  private confirmRemoveLogo(): void {
    if (!this.empresaId) return;

    this.uploadingLogo = true;
    this.service.deleteLogo(this.empresaId).subscribe({
      next: () => {
        this.logoUrl = null;
        this.previewUrl = null;

        this.showToast('Logo removido com sucesso!', 'success');
        this.uploadingLogo = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao remover logo', 'error');
        this.uploadingLogo = false;
      }
    });
  }

  // ===== GESTÃO DE USUÁRIOS =====

  loadUsuariosDisponiveis(): void {
    this.usersService.getDisponiveis().subscribe({
      next: (usuarios) => {
        this.usuariosDisponiveis = usuarios;
      },
      error: (err) => {
        console.error('Erro ao carregar usuários disponíveis:', err);
      }
    });
  }

  loadUsuariosAssociados(empresaId: string): void {
    this.usersService.getAll().subscribe({
      next: (usuarios) => {
        this.usuariosAssociados = usuarios.filter(u => u.empresaId === empresaId);
      },
      error: (err) => {
        console.error('Erro ao carregar usuários associados:', err);
      }
    });
  }

  associarUsuario(usuario: Usuario): void {
    if (!this.empresaId) {
      // Modo criação: acumular em memória
      if (this.usuariosPendentesAssociacao.find(u => u.id === usuario.id)) {
        this.showToast('Usuário já está na lista de associação', 'info');
        return;
      }
      this.usuariosPendentesAssociacao.push(usuario);
      this.usuariosDisponiveis = this.usuariosDisponiveis.filter(u => u.id !== usuario.id);
      this.showToast(`Usuário ${usuario.nome} será associado ao salvar a empresa`, 'info');
      return;
    }

    // Modo edição: associar imediatamente
    this.usersService.update(usuario.id, { empresaId: this.empresaId } as any).subscribe({
      next: () => {
        this.showToast(`Usuário ${usuario.nome} associado com sucesso!`, 'success');
        this.usuariosAssociados.push(usuario);
        this.usuariosDisponiveis = this.usuariosDisponiveis.filter(u => u.id !== usuario.id);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao associar usuário', 'error');
      }
    });
  }

  desassociarUsuario(usuario: Usuario): void {
    Swal.fire({
      title: 'Desassociar Usuário',
      html: `Deseja desassociar <strong>${usuario.nome}</strong> desta empresa?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sim, desassociar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        if (!this.empresaId) {
          // Modo criação: remover da lista pendente
          this.usuariosPendentesAssociacao = this.usuariosPendentesAssociacao.filter(u => u.id !== usuario.id);
          this.usuariosDisponiveis.push(usuario);
          this.showToast(`Usuário ${usuario.nome} removido da lista`, 'success');
        } else {
          // Modo edição: desassociar do banco
          this.confirmarDesassociacao(usuario);
        }
      }
    });
  }

  private confirmarDesassociacao(usuario: Usuario): void {
    this.usersService.update(usuario.id, { empresaId: null } as any).subscribe({
      next: () => {
        this.showToast(`Usuário ${usuario.nome} desassociado com sucesso!`, 'success');
        this.usuariosAssociados = this.usuariosAssociados.filter(u => u.id !== usuario.id);
        this.usuariosDisponiveis.push(usuario);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao desassociar usuário', 'error');
      }
    });
  }

  abrirModalNovoUsuario(): void {
    this.usuarioModal.open();
  }

  onUsuarioCriado(usuario: Usuario): void {
    this.showToast(`Usuário ${usuario.nome} criado com sucesso!`, 'success');
    
    if (!this.empresaId) {
      // Modo criação: adicionar à lista pendente
      this.usuariosPendentesAssociacao.push(usuario);
    } else {
      // Modo edição: já foi associado automaticamente pelo modal
      this.usuariosAssociados.push(usuario);
    }
    
    // Atualizar lista de disponíveis
    this.loadUsuariosDisponiveis();
  }

  // Método auxiliar para associar usuários pendentes após criar empresa
  private associarUsuariosPendentes(empresaId: string): void {
    const promises = this.usuariosPendentesAssociacao.map(usuario => {
      return this.usersService.update(usuario.id, { empresaId } as any).toPromise();
    });

    Promise.all(promises).then(
      () => {
        const count = this.usuariosPendentesAssociacao.length;
        this.showToast(`${count} usuário(s) associado(s) com sucesso!`, 'success');
        this.usuariosPendentesAssociacao = [];
      },
      (err) => {
        console.error('Erro ao associar usuários pendentes:', err);
        this.showToast('Erro ao associar alguns usuários. Verifique em modo edição.', 'warning');
      }
    );
  }

  isPerfilObject(perfil: any): perfil is { id: string; codigo: string; nome: string; nivel: number } {
    return perfil && typeof perfil === 'object' && 'nome' in perfil;
  }
}
