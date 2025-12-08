import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, IsEnum, IsUUID, IsOptional, MinLength } from 'class-validator';

enum PerfilUsuario {
  CONSULTOR = 'CONSULTOR',
  GESTOR = 'GESTOR',
  COLABORADOR = 'COLABORADOR',
  LEITURA = 'LEITURA',
}

export class CreateUsuarioDto {
  @ApiProperty({ example: 'joao.silva@reiche.com.br' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nome: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  senha: string;

  @ApiProperty({ example: 'Diretor de Operações' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  cargo: string;

  @ApiProperty({ example: 'GESTOR', enum: PerfilUsuario })
  @IsEnum(PerfilUsuario)
  perfil: PerfilUsuario;

  @ApiPropertyOptional({ example: 'uuid-da-empresa' })
  @IsUUID()
  @IsOptional()
  empresaId?: string;
}
