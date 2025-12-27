export interface Empresa {
  id: string;
  nome: string;
  cnpj: string;
  tipoNegocio: string;
  ativo: boolean;
  logoUrl?: string;
  backgroundUrl?: string;
  corPrimaria?: string;
  corSecundaria?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmpresaCustomization {
  logoUrl: string;
  backgroundUrl: string;
  corPrimaria?: string;
  corSecundaria?: string;
}
