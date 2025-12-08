import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsString, IsOptional, Length } from 'class-validator';

export class CreateRotinaEmpresaDto {
  @ApiProperty({ example: 'uuid-do-pilar-empresa' })
  @IsUUID()
  @IsNotEmpty()
  pilarEmpresaId: string;

  @ApiProperty({ example: 'uuid-da-rotina' })
  @IsUUID()
  @IsNotEmpty()
  rotinaId: string;

  @ApiPropertyOptional({ example: 'Observação adicional sobre esta rotina' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  observacao?: string;
}
