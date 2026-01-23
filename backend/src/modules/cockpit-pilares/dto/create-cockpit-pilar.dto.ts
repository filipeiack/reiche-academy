import {
  IsOptional,
  IsNotEmpty,
  IsUUID,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCockpitPilarDto {
  @ApiProperty({
    example: 'uuid-do-pilar-empresa',
    description: 'UUID do PilarEmpresa para criar o cockpit',
  })
  @IsNotEmpty({ message: 'pilarEmpresaId é obrigatório' })
  @IsUUID('all', { message: 'pilarEmpresaId deve ser um UUID válido' })
  pilarEmpresaId: string;

  @ApiPropertyOptional({
    example: 'Pedidos de clientes, leads gerados, demandas de parceiros',
    description: 'Descrição das entradas do pilar',
  })
  @IsOptional()
  @IsString({ message: 'entradas deve ser uma string' })
  @MaxLength(1000, { message: 'entradas deve ter no máximo 1000 caracteres' })
  entradas?: string;

  @ApiPropertyOptional({
    example: 'Propostas comerciais, contratos assinados, relatórios de vendas',
    description: 'Descrição das saídas do pilar',
  })
  @IsOptional()
  @IsString({ message: 'saidas deve ser uma string' })
  @MaxLength(1000, { message: 'saidas deve ter no máximo 1000 caracteres' })
  saidas?: string;

  @ApiPropertyOptional({
    example: 'Garantir crescimento sustentável via canal indireto',
    description: 'Missão do pilar',
  })
  @IsOptional()
  @IsString({ message: 'missao deve ser uma string' })
  @MaxLength(1000, { message: 'missao deve ter no máximo 1000 caracteres' })
  missao?: string;
}
