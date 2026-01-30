import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, Min, Max, IsEnum, IsOptional } from 'class-validator';
import { Criticidade } from '@prisma/client';

export class CreateNotaRotinaDto {
  @ApiProperty({ example: 'uuid-da-rotina-empresa' })
  @IsUUID()
  @IsNotEmpty()
  rotinaEmpresaId: string;

  @ApiProperty({ example: 8.5, description: 'Nota de 0 a 10' })
  @IsNumber()
  @IsNotEmpty({ message: 'A nota é obrigatória' })
  @Min(0, { message: 'A nota mínima é 0' })
  @Max(10, { message: 'A nota máxima é 10' })
  nota: number;

  @ApiProperty({ example: 'MEDIA', enum: Criticidade })
  @IsEnum(Criticidade, { message: 'Criticidade deve ser ALTA, MEDIA ou BAIXA' })
  @IsNotEmpty({ message: 'A criticidade é obrigatória' })
  criticidade: Criticidade;
}
