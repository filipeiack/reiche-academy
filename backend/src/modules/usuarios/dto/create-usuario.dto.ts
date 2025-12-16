import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, IsUUID, IsOptional, MinLength } from 'class-validator';

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

  @ApiProperty({ example: 'uuid-do-perfil', description: 'ID do perfil do usuário (ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA)' })
  @IsUUID()
  @IsNotEmpty()
  perfilId: string;

  @ApiPropertyOptional({ example: 'uuid-da-empresa' })
  @IsUUID()
  @IsOptional()
  empresaId?: string;
}
