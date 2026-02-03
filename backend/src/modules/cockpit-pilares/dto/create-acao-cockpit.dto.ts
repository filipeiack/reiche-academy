import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateAcaoCockpitDto {
  @ApiProperty({ example: 'uuid-indicador-mensal' })
  @IsUUID()
  indicadorMensalId: string;

  @ApiPropertyOptional({ example: 'Causa 1' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  causa1?: string;

  @ApiPropertyOptional({ example: 'Causa 2' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  causa2?: string;

  @ApiPropertyOptional({ example: 'Causa 3' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  causa3?: string;

  @ApiPropertyOptional({ example: 'Causa 4' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  causa4?: string;

  @ApiPropertyOptional({ example: 'Causa 5' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  causa5?: string;

  @ApiProperty({ example: 'Revisar funil com equipe comercial' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  acaoProposta: string;

  @ApiPropertyOptional({ example: 'uuid-usuario-responsavel' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;

  @ApiProperty({ example: '2026-02-01T00:00:00.000-03:00' })
  @IsDateString()
  @IsNotEmpty()
  inicioPrevisto: string;

  @ApiProperty({ example: '2026-02-28T00:00:00.000-03:00' })
  @IsDateString()
  @IsNotEmpty()
  terminoPrevisto: string;

  @ApiPropertyOptional({ example: '2026-02-05T00:00:00.000-03:00' })
  @IsOptional()
  @IsDateString()
  inicioReal?: string;

  @ApiPropertyOptional({ example: '2026-03-15T00:00:00.000-03:00' })
  @IsOptional()
  @IsDateString()
  terminoReal?: string;
}
