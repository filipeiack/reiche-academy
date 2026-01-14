import { ApiProperty } from '@nestjs/swagger';

export class PeriodoAvaliacaoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  empresaId: string;

  @ApiProperty()
  trimestre: number;

  @ApiProperty()
  ano: number;

  @ApiProperty()
  dataReferencia: Date;

  @ApiProperty()
  aberto: boolean;

  @ApiProperty()
  dataInicio: Date;

  @ApiProperty({ nullable: true })
  dataCongelamento: Date | null;

  @ApiProperty()
  createdAt: Date;
}
