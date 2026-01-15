import {
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  Max,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValorMensalDto {
  @ApiProperty({
    example: 1,
    description: 'Mês (1-12) ou null para resumo anual',
  })
  @IsOptional()
  @IsInt({ message: 'mes deve ser um número inteiro' })
  @Min(1, { message: 'mes deve estar entre 1 e 12' })
  @Max(12, { message: 'mes deve estar entre 1 e 12' })
  mes: number | null;

  @ApiProperty({
    example: 2026,
    description: 'Ano',
  })
  @IsNotEmpty({ message: 'ano é obrigatório' })
  @IsInt({ message: 'ano deve ser um número inteiro' })
  @Min(2000, { message: 'ano deve ser maior ou igual a 2000' })
  ano: number;

  @ApiProperty({
    example: 1500000,
    description: 'Valor da meta',
  })
  @IsOptional()
  @IsNumber({}, { message: 'meta deve ser um número' })
  meta?: number;

  @ApiProperty({
    example: 1350000,
    description: 'Valor realizado',
  })
  @IsOptional()
  @IsNumber({}, { message: 'realizado deve ser um número' })
  realizado?: number;
}

export class UpdateValoresMensaisDto {
  @ApiProperty({
    type: [ValorMensalDto],
    description: 'Array com os valores mensais a atualizar',
  })
  @IsNotEmpty({ message: 'valores é obrigatório' })
  @IsArray({ message: 'valores deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ValorMensalDto)
  valores: ValorMensalDto[];
}
