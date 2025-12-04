import { PartialType } from '@nestjs/swagger';
import { CreateRotinaDto } from './create-rotina.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateRotinaDto extends PartialType(CreateRotinaDto) {
  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
