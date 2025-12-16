import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export type Role = 'ADMINISTRADOR' | 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
