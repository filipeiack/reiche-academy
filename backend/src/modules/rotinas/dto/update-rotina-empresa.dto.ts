import { IsOptional, IsInt, Min, Max, Length, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRotinaEmpresaDto {
  @ApiPropertyOptional({ example: 'Planejamento Estratégico Anual Revisado' })
  @IsOptional()
  @Length(2, 200)
  nome?: string;

  @ApiPropertyOptional({ example: 'Descrição atualizada da rotina' })
  @IsOptional()
  @MaxLength(500)
  descricao?: string;

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
}
