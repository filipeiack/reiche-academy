import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DefinirResponsavelDto {
  @ApiPropertyOptional({ description: 'ID do usuário responsável pelo pilar (null para remover)' })
  @IsOptional()
  @IsString()
  responsavelId?: string | null;
}
