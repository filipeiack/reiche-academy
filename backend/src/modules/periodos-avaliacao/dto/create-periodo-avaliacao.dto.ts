import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePeriodoAvaliacaoDto {
  @ApiProperty({
    description: 'Data de referência (último dia do trimestre)',
    example: '2026-03-31',
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de referência é obrigatória' })
  dataReferencia: string; // ISO 8601
}
