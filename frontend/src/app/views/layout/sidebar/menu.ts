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
    label: 'MENU.CALENDAR',
    icon: 'calendar',
    link: '/calendario'
  },
  {
    label: 'MENU.WEB_APPS',
    isTitle: true
  },
  {
    label: 'MENU.USUARIOS',
    icon: 'users',
    link: '/usuarios'
  },
  {
    label: 'MENU.EMPRESAS',
    icon: 'briefcase',
    link: '/empresas',
    // subItems: [
    //   {
    //     label: 'COMPANIES.ADD',
    //     link: '/empresas/nova'
    //   }
    // ]
  },
  {
    label: 'MENU.PILARES',
    icon: 'layers',
    link: '/pilares'
  },
  {
    label: 'MENU.ROTINAS',
    icon: 'activity',
    link: '/rotinas'
  },
  {
    label: 'MENU.DIAGNOSTICOS',
    isTitle: true
  },
  {
    label: 'MENU.NOTAS',
    icon: 'folder-plus',
    link: '/notas'
  },

  
  {
    label: 'MENU.DOCS',
    isTitle: true
  },
  {
    label: 'MENU.DOCUMENTATION',
    icon: 'hash',
    link: '/documentos'
  }
];
