import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { StatusAcao } from '@prisma/client';

export class CreateAcaoCockpitDto {
  @ApiProperty({ example: 'uuid-indicador-mensal' })
  @IsUUID()
  indicadorMensalId: string;

  @ApiProperty({ example: 'Causa 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  causa1: string;

  @ApiProperty({ example: 'Causa 2' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  causa2: string;

  @ApiProperty({ example: 'Causa 3' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  causa3: string;

  @ApiProperty({ example: 'Causa 4' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  causa4: string;

  @ApiProperty({ example: 'Causa 5' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  causa5: string;

  @ApiProperty({ example: 'Revisar funil com equipe comercial' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  acaoProposta: string;

  @ApiPropertyOptional({ example: 'uuid-usuario-responsavel' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;

  @ApiPropertyOptional({ enum: StatusAcao, example: StatusAcao.PENDENTE })
  @IsOptional()
  @IsEnum(StatusAcao)
  status?: StatusAcao;

  @ApiPropertyOptional({ example: '2026-02-28T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  prazo?: string;
}
