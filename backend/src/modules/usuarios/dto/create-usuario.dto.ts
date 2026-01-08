import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, IsUUID, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'joao.silva@reiche.com.br' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nome: string;

  @ApiProperty({ example: 'SenhaForte1@' })
  @IsString()
  @IsOptional()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)',
  })
  senha: string;

  @ApiProperty({ example: 'Diretor de Operações' })
  @IsString()
  @Length(2, 100)
  @IsOptional()
  cargo: string;

  @ApiPropertyOptional({ example: '(11) 98765-4321' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({ example: 'uuid-do-perfil', description: 'ID do perfil do usuário (ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA)' })
  @IsUUID()
  @IsNotEmpty()
  perfilId: string;

  @ApiPropertyOptional({ example: 'uuid-da-empresa' })
  @IsUUID()
  @IsOptional()
  empresaId?: string;
}
