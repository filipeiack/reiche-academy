import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMedidaIndicador, DirecaoIndicador } from '@prisma/client';

export class CreateIndicadorTemplateDto {
  @ApiProperty({
    example: 'FATURAMENTO TOTAL MENSAL',
    description: 'Nome do indicador template',
  })
  @IsNotEmpty({ message: 'nome é obrigatório' })
  @IsString({ message: 'nome deve ser uma string' })
  @MaxLength(200, { message: 'nome deve ter no máximo 200 caracteres' })
  nome: string;

  @ApiPropertyOptional({
    example: 'TOTAL EM R$ VENDIDOS VIA CANAL INDIRETO',
    description: 'Descrição detalhada do indicador template',
  })
  @IsOptional()
  @IsString({ message: 'descricao deve ser uma string' })
  @MaxLength(1000, { message: 'descricao deve ter no máximo 1000 caracteres' })
  descricao?: string;

  @ApiProperty({
    example: 'uuid-do-pilar-template',
    description: 'UUID do pilar template associado',
  })
  @IsNotEmpty({ message: 'pilarId é obrigatório' })
  @IsUUID('4', { message: 'pilarId deve ser um UUID válido' })
  pilarId: string;

  @ApiProperty({
    example: 'REAL',
    enum: TipoMedidaIndicador,
    description: 'Tipo de medida: REAL, QUANTIDADE, TEMPO, PERCENTUAL',
  })
  @IsNotEmpty({ message: 'tipoMedida é obrigatório' })
  @IsEnum(TipoMedidaIndicador, {
    message: 'tipoMedida deve ser REAL, QUANTIDADE, TEMPO ou PERCENTUAL',
  })
  tipoMedida: TipoMedidaIndicador;

  @ApiProperty({
    example: 'MAIOR',
    enum: DirecaoIndicador,
    description: 'Melhor direção: MAIOR (↑) ou MENOR (↓)',
  })
  @IsNotEmpty({ message: 'melhor é obrigatório' })
  @IsEnum(DirecaoIndicador, { message: 'melhor deve ser MAIOR ou MENOR' })
  melhor: DirecaoIndicador;

  @ApiPropertyOptional({
    example: 1,
    description: 'Ordem de exibição no catálogo de templates',
  })
  @IsOptional()
  @IsInt({ message: 'ordem deve ser um número inteiro' })
  @Min(1, { message: 'ordem deve ser maior ou igual a 1' })
  ordem?: number;
}
