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

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
    cargo?: string;
    perfil: PerfilUsuarioBasic | string;
    empresaId: string;
    fotoUrl?: string | null;
  };
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  perfil: PerfilUsuarioBasic | string;
  ativo: boolean;
  empresaId?: string;
  fotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
