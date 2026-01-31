import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class UpdateCargoCockpitDto {
  @ApiPropertyOptional({ example: 'COORDENADOR COMERCIAL' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  cargo?: string;

  @ApiPropertyOptional({
    example: ['uuid-usuario-1', 'uuid-usuario-2'],
    description: 'Lista de responsáveis pelo cargo',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  responsavelIds?: string[];

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  ordem?: number;
}
