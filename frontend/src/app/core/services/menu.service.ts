import { Injectable } from '@angular/core';
import { MenuItem } from '../../views/layout/sidebar/menu.model';
import { MENU } from '../../views/layout/sidebar/menu';
import { TranslateService } from './translate.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItems = new BehaviorSubject<MenuItem[]>([]);
  public menuItems$ = this.menuItems.asObservable();

  // Use MENU from sidebar/menu.ts as the single source of truth
  private baseMenu: MenuItem[] = MENU;

  constructor(private translateService: TranslateService) {
    // Update menu when language changes
    this.translateService.translations$.subscribe(() => {
      this.updateMenu();
    });
    // Initialize menu on service creation
    this.updateMenu();
  }

  private updateMenu(): void {
    const translatedMenu = this.translateMenu(this.baseMenu);
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
