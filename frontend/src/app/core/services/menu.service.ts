import { Injectable, inject } from '@angular/core';
import { MenuItem } from '../../views/layout/sidebar/menu.model';
import { MENU } from '../../views/layout/sidebar/menu';
import { TranslateService } from './translate.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private translateService = inject(TranslateService);
  private authService = inject(AuthService);
  
  private menuItems = new BehaviorSubject<MenuItem[]>([]);
  public menuItems$ = this.menuItems.asObservable();

  // Use MENU from sidebar/menu.ts as the single source of truth
  private baseMenu: MenuItem[] = MENU;

  // Links que devem ser ocultados para perfis de cliente
  private readonly ADMIN_ONLY_LINKS = [
    '/usuarios',
    '/empresas',
    '/pilares',
    '/rotinas'
  ];

  constructor() {
    // Update menu when language or user changes
    combineLatest([
      this.translateService.translations$,
      this.authService.currentUser$
    ]).subscribe(() => {
      this.updateMenu();
    });
    // Initialize menu on service creation
    this.updateMenu();
  }

  private updateMenu(): void {
    const currentUser = this.authService.getCurrentUser();
    const isAdministrador = currentUser?.perfil?.codigo === 'ADMINISTRADOR';
    
    // Filtrar menu baseado no perfil
    let filteredMenu = this.baseMenu;
    
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
    
    const translatedMenu = this.translateMenu(filteredMenu);
    this.menuItems.next(translatedMenu);
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
