import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { Criticidade } from '@prisma/client';

export class CreateFuncaoCargoDto {
  @ApiProperty({ example: 'REVISÃO DE VENDAS E PROPOSTAS EM ANDAMENTO' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  descricao: string;

  @ApiProperty({ enum: Criticidade, example: Criticidade.ALTA })
  @IsEnum(Criticidade)
  nivelCritico: Criticidade;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  autoAvaliacao?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  avaliacaoLideranca?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  ordem?: number;
}
