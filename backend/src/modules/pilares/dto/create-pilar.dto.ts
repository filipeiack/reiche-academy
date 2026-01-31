import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsInt, Min, IsOptional, IsBoolean } from 'class-validator';

export class CreatePilarDto {
  @ApiProperty({ example: 'Estratégia e Governança' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 60)
  nome: string;

  @ApiPropertyOptional({ example: 'Pilar focado em planejamento estratégico e governança corporativa' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  descricao?: string;

  @ApiPropertyOptional({ example: 1, description: 'Ordem de exibição' })
  @IsInt()
  @Min(1)
  @IsOptional()
  ordem?: number;
}
