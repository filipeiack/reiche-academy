import { IsOptional, IsInt, Min, Max, Length, MaxLength, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Criticidade } from '@prisma/client';

export class UpdateRotinaEmpresaDto {
  @ApiPropertyOptional({ example: 'Planejamento Estratégico Anual Revisado' })
  @IsOptional()
  @Length(2, 200)
  nome?: string;

  @ApiPropertyOptional({ example: 'Observações específicas sobre a execução' })
  @IsOptional()
  @MaxLength(1000)
  observacao?: string;

  @ApiPropertyOptional({ example: 85, description: 'Avaliação percentual (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  avaliacao?: number;

  @ApiPropertyOptional({ example: 'MEDIA', enum: Criticidade })
  @IsEnum(Criticidade, { message: 'Criticidade deve ser ALTA, MEDIA ou BAIXA' })
  @IsOptional()
  criticidade?: Criticidade;
}
