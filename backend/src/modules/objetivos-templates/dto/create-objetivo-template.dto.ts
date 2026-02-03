import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateObjetivoTemplateDto {
  @ApiProperty({
    example: 'uuid-do-pilar-template',
    description: 'UUID do pilar template associado',
  })
  @IsNotEmpty({ message: 'pilarId é obrigatório' })
  @IsString({ message: 'pilarId deve ser uma string' })
  pilarId: string;

  @ApiProperty({
    example: 'Pedidos de clientes, solicitações de propostas comerciais',
    description: 'Descrição das entradas do pilar',
  })
  @IsNotEmpty({ message: 'entradas é obrigatório' })
  @IsString({ message: 'entradas deve ser uma string' })
  entradas: string;

  @ApiProperty({
    example: 'Propostas enviadas, contratos fechados',
    description: 'Descrição das saídas do pilar',
  })
  @IsNotEmpty({ message: 'saidas é obrigatório' })
  @IsString({ message: 'saidas deve ser uma string' })
  saidas: string;

  @ApiProperty({
    example: 'Maximizar faturamento via canal indireto',
    description: 'Missão do pilar',
  })
  @IsNotEmpty({ message: 'missao é obrigatório' })
  @IsString({ message: 'missao deve ser uma string' })
  missao: string;
}
