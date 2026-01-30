import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Serviço para gerenciar o contexto de empresa selecionada globalmente.
 * 
 * Permite que administradores "assumam" temporariamente uma empresa,
 * fazendo com que todas as telas do sistema operem no contexto daquela empresa.
 * 
 * Usuários com perfil de cliente sempre operam no contexto da própria empresa.
 */
@Injectable({
  providedIn: 'root'
})
export class EmpresaContextService {
  private authService = inject(AuthService);
  
  private readonly SELECTED_EMPRESA_KEY = 'selected_empresa_context';
  
  private selectedEmpresaIdSubject = new BehaviorSubject<string | null>(null);
  public selectedEmpresaId$ = this.selectedEmpresaIdSubject.asObservable();

  constructor() {
    this.loadStoredEmpresa();
  }

  /**
   * Define a empresa selecionada pelo administrador.
   * Persiste no localStorage para manter entre navegações.
   * 
   * @param empresaId ID da empresa a ser selecionada
   */
  setSelectedEmpresa(empresaId: string | null): void {
    if (empresaId) {
      localStorage.setItem(this.SELECTED_EMPRESA_KEY, empresaId);
    } else {
      localStorage.removeItem(this.SELECTED_EMPRESA_KEY);
    }
    this.selectedEmpresaIdSubject.next(empresaId);
  }

  /**
   * Retorna o ID da empresa no contexto atual.
   * 
   * Para administradores: retorna a empresa selecionada manualmente.
   * Para usuários cliente: retorna a empresa associada ao usuário.
   * 
   * @returns ID da empresa ou null
   */
  getEmpresaId(): string | null {
    const user = this.authService.getCurrentUser();
    
    // Se não há usuário autenticado, retorna null
    if (!user) {
      return null;
    }

    const isAdmin = user.perfil?.codigo === 'ADMINISTRADOR';

    if (isAdmin) {
      // Admin usa empresa selecionada manualmente
      return this.selectedEmpresaIdSubject.value;
    } else {
      // Cliente usa empresa associada ao usuário
      return user.empresaId || null;
    }
  }

  /**
   * Limpa a seleção de empresa.
   * Deve ser chamado no logout.
   */
  clearSelectedEmpresa(): void {
    localStorage.removeItem(this.SELECTED_EMPRESA_KEY);
    this.selectedEmpresaIdSubject.next(null);
  }

  /**
   * Carrega a empresa selecionada do localStorage (apenas para admin).
   */
  private loadStoredEmpresa(): void {
    const user = this.authService.getCurrentUser();
    const isAdmin = user?.perfil?.codigo === 'ADMINISTRADOR';

    if (isAdmin) {
      const storedEmpresaId = localStorage.getItem(this.SELECTED_EMPRESA_KEY);
      if (storedEmpresaId) {
        this.selectedEmpresaIdSubject.next(storedEmpresaId);
      }
    }
  }

  /**
   * Verifica se o usuário atual é administrador.
   */
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.perfil?.codigo === 'ADMINISTRADOR';
  }

  /**
   * Sincroniza a empresa selecionada na combo com a empresa de um recurso específico.
   * Usado quando admin acessa URL direta de recurso vinculado a empresa (ex: cockpit).
   * 
   * @param empresaId ID da empresa do recurso acessado
   */
  syncEmpresaFromResource(empresaId: string): void {
    const user = this.authService.getCurrentUser();
    const isAdmin = user?.perfil?.codigo === 'ADMINISTRADOR';

    // Apenas admin pode ter empresa selecionada diferente
    if (!isAdmin) {
      return;
    }

    const currentSelected = this.selectedEmpresaIdSubject.value;
    
    // Se a empresa do recurso é diferente da selecionada, atualiza
    if (currentSelected !== empresaId) {
      this.setSelectedEmpresa(empresaId);
    }
  }
}
