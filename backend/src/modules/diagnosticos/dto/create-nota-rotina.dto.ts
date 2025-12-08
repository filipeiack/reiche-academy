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

  @ApiPropertyOptional({ example: 8.5, description: 'Nota de 0 a 10' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  nota?: number;

  @ApiPropertyOptional({ example: 'ALTO', enum: Criticidade })
  @IsEnum(Criticidade)
  @IsOptional()
  criticidade?: Criticidade;
}
