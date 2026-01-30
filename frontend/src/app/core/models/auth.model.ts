import { EstadoBrasil, PeriodoMentoria } from "../services/empresas.service";

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface PerfilUsuarioBasic {
  id: string;
  codigo: string;
  nome: string;
  nivel: number;
}

export interface EmpresaBasic {
  id: string;
  nome: string;
  cnpj: string;
  cidade?: string;
  estado?: EstadoBrasil;
  periodoMentoriaAtivo?: PeriodoMentoria | null;
  logoUrl?: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface Usuario {
  id: string;
  nome: string;
  perfil: PerfilUsuarioBasic;
  ativo: boolean;
  email?: string;
  cargo?: string;
  telefone?: string;
  empresaId?: string;
  empresa?: EmpresaBasic;
  fotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
