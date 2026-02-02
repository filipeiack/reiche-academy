import { MenuItem } from './menu.model';

// Single source of truth for raw menu definitions (translation keys)
// The MenuService will import this and apply translations dynamically.
export const MENU: MenuItem[] = [
  // {
  //   label: 'MENU.MAIN',
  //   isTitle: true
  // },
  // {
  //   label: 'MENU.DASHBOARD',
  //   icon: 'home',
  //   link: '/dashboard'
  // },
  // {
  //   label: 'MENU.CALENDAR',
  //   icon: 'calendar',
  //   link: '/calendario'
  // },
  {
    label: 'MENU.PAINEL_CONTROLE',
    isTitle: true
  },
  {
    label: 'MENU.NOTAS',
    icon: 'clipboard',
    link: '/diagnostico-notas'
  },
  {
    label: 'MENU.EVOLUCAO',
    icon: 'trending-up',
    link: '/diagnostico-evolucao'
  },
  {
    label: 'MENU.COCKPITS',
    icon: 'bi bi-speedometer2',
    id: 999,
    //subItems: [], // Será populado dinamicamente no MenuService
    //expanded: true // Manter sempre expandido
  },
{
    label: 'MENU.CADASTROS',
    isTitle: true
  },
  {
    label: 'MENU.USUARIOS',
    icon: 'users',
    link: '/usuarios'
  },
  {
    label: 'MENU.PILARES',
    icon: 'layers',
    link: '/pilares'
  },
  {
    label: 'MENU.ROTINAS',
    icon: 'repeat',
    link: '/rotinas'
  },
  {
    label: 'MENU.INDICADORES_TEMPLATES',
    icon: 'bar-chart-2',
    link: '/indicadores-templates'
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
  
  // {
  //   label: 'MENU.DOCS',
  //   isTitle: true
  // },
  // {
  //   label: 'MENU.DOCUMENTATION',
  //   icon: 'hash',
  //   link: '/documentos'
  // }
];
