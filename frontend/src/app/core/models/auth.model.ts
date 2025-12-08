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
    tipo: string;
    empresaId: string;
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
  createdAt: Date;
  updatedAt: Date;
}
