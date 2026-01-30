import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreateCargoCockpitDto {
  @ApiProperty({ example: 'COORDENADOR COMERCIAL' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  cargo: string;

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
