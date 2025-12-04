import { PartialType } from '@nestjs/swagger';
import { CreatePilarDto } from './create-pilar.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePilarDto extends PartialType(CreatePilarDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
