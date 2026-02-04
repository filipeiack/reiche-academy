import { Injectable, inject } from '@angular/core';
import { MenuItem } from '../../views/layout/sidebar/menu.model';
import { MENU } from '../../views/layout/sidebar/menu';
import { TranslateService } from './translate.service';
import { AuthService } from './auth.service';
import { CockpitPilaresService } from './cockpit-pilares.service';
import { EmpresaContextService } from './empresa-context.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private translateService = inject(TranslateService);
  private authService = inject(AuthService);
  private cockpitService = inject(CockpitPilaresService);
  private empresaContextService = inject(EmpresaContextService);
  
  private menuItems = new BehaviorSubject<MenuItem[]>([]);
  public menuItems$ = this.menuItems.asObservable();

  // Use MENU from sidebar/menu.ts as the single source of truth
  private baseMenu: MenuItem[] = MENU;

  // Links que devem ser ocultados para perfis de cliente
  private readonly ADMIN_ONLY_LINKS = [
    '/usuarios',
    '/empresas',
    '/pilares',
    '/rotinas',
    '/indicadores-templates',
    '/objetivos-templates'
  ];

  constructor() {
    // Update menu when language, user, or empresa context changes
    combineLatest([
      this.translateService.translations$,
      this.authService.currentUser$,
      this.empresaContextService.selectedEmpresaId$
    ]).subscribe(() => {
      this.updateMenu();
    });
    // Initialize menu on service creation
    this.updateMenu();
  }

  private async updateMenu(): Promise<void> {
    const currentUser = this.authService.getCurrentUser();
    const isAdministrador = currentUser?.perfil?.codigo === 'ADMINISTRADOR';
    const empresaId = this.empresaContextService.getEmpresaId();
    
    // Filtrar menu baseado no perfil
    let filteredMenu = [...this.baseMenu];
    
    if (!isAdministrador && currentUser) {
      // Perfis de cliente (GESTOR, COLABORADOR, LEITURA) não veem cadastros
      filteredMenu = [];
      
      for (let i = 0; i < this.baseMenu.length; i++) {
        const item = this.baseMenu[i];
        
        // Pular links administrativos
        if (item.link && this.ADMIN_ONLY_LINKS.includes(item.link)) {
          continue;
        }
        
        // Se for um título, verificar se há itens visíveis após ele
        if (item.isTitle) {
          // Verificar se o próximo item não-título é visível
          let hasVisibleItems = false;
          for (let j = i + 1; j < this.baseMenu.length; j++) {
            const nextItem = this.baseMenu[j];
            // Se encontrar outro título, parar
            if (nextItem.isTitle) break;
            // Se encontrar um item visível (não administrativo)
            if (!nextItem.link || !this.ADMIN_ONLY_LINKS.includes(nextItem.link)) {
              hasVisibleItems = true;
              break;
            }
          }
          // Só adicionar o título se houver itens visíveis
          if (hasVisibleItems) {
            filteredMenu.push(item);
          }
        } else {
          filteredMenu.push(item);
        }
      }
    }
    
    // Buscar cockpits da empresa e adicionar submenus dinamicamente
    if (empresaId) {
      filteredMenu = await this.addCockpitSubmenus(filteredMenu, empresaId);
    }
    
    const translatedMenu = this.translateMenu(filteredMenu);
    this.menuItems.next(translatedMenu);
  }

  /**
   * Adiciona submenus dinâmicos ao item "Cockpits" baseado nos cockpits da empresa
   */
  private async addCockpitSubmenus(menu: MenuItem[], empresaId: string): Promise<MenuItem[]> {
    try {
      const cockpits = await this.cockpitService.getCockpitsByEmpresa(empresaId).toPromise();
      
      if (!cockpits || cockpits.length === 0) {
        return menu;
      }

      // Encontrar o item "Cockpits" no menu
      const cockpitIndex = menu.findIndex(item => item.id === 999);
      
      if (cockpitIndex === -1) {
        return menu;
      }

      // Criar submenus para cada cockpit
      const cockpitSubItems: MenuItem[] = cockpits.map((cockpit, index) => ({
        id: 1000 + index, // IDs únicos começando de 1000
        label: cockpit.pilarEmpresa?.nome.charAt(0).toUpperCase() + cockpit.pilarEmpresa?.nome.slice(1).toLowerCase(),
        link: `/cockpits/${cockpit.id}/dashboard`
      }));

      cockpitSubItems.sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));

      // Atualizar o item de cockpits com os submenus
      menu[cockpitIndex] = {
        ...menu[cockpitIndex],
        subItems: cockpitSubItems,
        expanded: true // Manter sempre expandido
      };

      return menu;
    } catch (error) {
      console.error('Erro ao carregar cockpits para menu:', error);
      return menu;
    }
  }

  /**
   * Força atualização do menu (útil após criar/deletar cockpits)
   */
  public refreshMenu(): void {
    this.updateMenu();
  }

  private translateMenu(items: MenuItem[]): MenuItem[] {
    return items.map(item => ({
      ...item,
      label: item.label ? this.translateService.instant(item.label) : '',
      subItems: item.subItems ? this.translateMenu(item.subItems) : undefined
    }));
  }

  getMenuItems(): Observable<MenuItem[]> {
    return this.menuItems$;
  }
}
