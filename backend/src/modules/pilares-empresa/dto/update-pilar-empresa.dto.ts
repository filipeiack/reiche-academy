import { IsOptional, IsUUID, Length, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePilarEmpresaDto {
  @ApiPropertyOptional({ example: 'Gestão Financeira Avançada' })
  @IsOptional()
  @Length(2, 200)
  nome?: string;

  @ApiPropertyOptional({ example: 'Descrição atualizada do pilar' })
  @IsOptional()
  @MaxLength(500)
  descricao?: string;

  @ApiPropertyOptional({ example: 'uuid-do-usuario-responsavel' })
  @IsOptional()
  @IsUUID('4')
  responsavelId?: string;
}
