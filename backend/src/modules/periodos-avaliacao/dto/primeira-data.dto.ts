import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PrimeiraDataDto {
  @ApiProperty({
    description: 'Data de referência inicial do primeiro período de avaliação',
    example: '2026-02-15',
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de referência é obrigatória' })
  dataReferencia: string; // ISO 8601
}
