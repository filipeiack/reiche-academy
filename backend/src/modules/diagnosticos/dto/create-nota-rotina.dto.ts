import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, Min, Max, IsEnum, IsOptional } from 'class-validator';

enum Criticidade {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAIXO = 'BAIXO',
}

export class CreateNotaRotinaDto {
  @ApiProperty({ example: 'uuid-da-rotina-empresa' })
  @IsUUID()
  @IsNotEmpty()
  rotinaEmpresaId: string;

  @ApiProperty({ example: 8.5, description: 'Nota de 1 a 10' })
  @IsNumber()
  @IsNotEmpty({ message: 'A nota é obrigatória' })
  @Min(1, { message: 'A nota mínima é 1' })
  @Max(10, { message: 'A nota máxima é 10' })
  nota: number;

  @ApiProperty({ example: 'MEDIO', enum: Criticidade })
  @IsEnum(Criticidade, { message: 'Criticidade deve ser ALTO, MEDIO ou BAIXO' })
  @IsNotEmpty({ message: 'A criticidade é obrigatória' })
  criticidade: Criticidade;
}
