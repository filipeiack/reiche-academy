export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  usuario: {
    id: string;
    email: string;
    nome: string;
    cargo?: string;
    perfil: string;
    empresaId: string;
    fotoUrl?: string | null;
  };
}

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  perfil: 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
  ativo: boolean;
  empresaId?: string;
  fotoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
