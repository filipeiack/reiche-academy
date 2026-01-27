import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { StatusAcao } from '@prisma/client';

export class UpdateAcaoCockpitDto {
  @ApiPropertyOptional({ example: 'uuid-indicador-mensal' })
  @IsOptional()
  @IsUUID()
  indicadorMensalId?: string;

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

  @ApiPropertyOptional({ example: 'Revisar funil com equipe comercial' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  acaoProposta?: string;

  @ApiPropertyOptional({ example: 'uuid-usuario-responsavel' })
  @IsOptional()
  @IsUUID()
  responsavelId?: string;

  @ApiPropertyOptional({ enum: StatusAcao, example: StatusAcao.EM_ANDAMENTO })
  @IsOptional()
  @IsEnum(StatusAcao)
  status?: StatusAcao;

  @ApiPropertyOptional({ example: '2026-02-28T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  prazo?: string;
}
