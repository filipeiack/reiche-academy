import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsInt, Min, IsOptional } from 'class-validator';

export class CreatePilarDto {
  @ApiProperty({ example: 'Estratégia e Governança' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nome: string;

  @ApiPropertyOptional({ example: 'Pilar focado em planejamento estratégico e governança corporativa' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  descricao?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  ordem: number;
}
