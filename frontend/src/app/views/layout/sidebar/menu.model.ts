
export interface MenuItem {
  id?: number;
  label?: string;
  icon?: string;
  iconType?: 'feather' | 'bootstrap'; // Se não especificado, detecta automaticamente
  link?: string;
  expanded?: boolean;
  subItems?: any;
  isTitle?: boolean;
  badge?: any;
  parentId?: number;
}
