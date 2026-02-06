import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreateCicloMesesDto {
  @ApiProperty({
    example: '2026-02-01T00:00:00-03:00',
    description: 'Data de referencia unica (normalizada para dia 1) para iniciar o ciclo de 12 meses',
  })
  @IsNotEmpty({ message: 'dataReferencia é obrigatória' })
  @IsDateString({}, { message: 'dataReferencia deve ser uma data válida' })
  dataReferencia: string;
}
