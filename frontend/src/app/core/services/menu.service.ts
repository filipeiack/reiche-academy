import { Injectable } from '@angular/core';
import { MenuItem } from '../../views/layout/sidebar/menu.model';
import { TranslateService } from './translate.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItems = new BehaviorSubject<MenuItem[]>([]);
  public menuItems$ = this.menuItems.asObservable();

  private baseMenu: MenuItem[] = [
    {
      label: 'MENU.MAIN',
      isTitle: true
    },
    {
      label: 'MENU.DASHBOARD',
      icon: 'home',
      link: '/dashboard'
    },
    {
      label: 'MENU.WEB_APPS',
      isTitle: true
    },
    {
      label: 'MENU.USER',
      icon: 'user'
    }
  ];

  constructor(private translateService: TranslateService) {
    // Update menu when language changes
    this.translateService.translations$.subscribe(() => {
      this.updateMenu();
    });
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
