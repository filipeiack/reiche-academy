export interface RequestUser {
  id: string;
  perfil: { codigo: string; nivel: number };
  empresaId: string | null;
  nome: string;
  email: string;
}
