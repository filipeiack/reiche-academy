import { MenuItem } from './menu.model';

// Single source of truth for raw menu definitions (translation keys)
// The MenuService will import this and apply translations dynamically.
export const MENU: MenuItem[] = [
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
    label: 'MENU.USUARIOS',
    icon: 'users',
    link: '/usuarios'
  }
];
