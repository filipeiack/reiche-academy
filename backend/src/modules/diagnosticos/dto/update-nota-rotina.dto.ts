import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Min, Max, IsEnum } from 'class-validator';

enum Criticidade {
  ALTA = 'ALTA',
  MÉDIA = 'MÉDIA',
  BAIXA = 'BAIXA',
}

export class UpdateNotaRotinaDto {
  @ApiProperty({ example: 8.5, description: 'Nota de 0 a 10' })
  @IsNumber()
  @IsNotEmpty({ message: 'A nota é obrigatória' })
  @Min(0, { message: 'A nota mínima é 0' })
  @Max(10, { message: 'A nota máxima é 10' })
  nota: number;

  @ApiProperty({ example: 'MÉDIA', enum: Criticidade })
  @IsEnum(Criticidade, { message: 'Criticidade deve ser ALTA, MÉDIA ou BAIXA' })
  @IsNotEmpty({ message: 'A criticidade é obrigatória' })
  criticidade: Criticidade;
}
