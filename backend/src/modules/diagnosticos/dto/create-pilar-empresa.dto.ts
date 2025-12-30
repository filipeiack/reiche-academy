import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreatePilarEmpresaDto {
  @ApiProperty({ example: 'uuid-da-empresa' })
  @IsUUID()
  @IsNotEmpty()
  empresaId: string;

  @ApiProperty({ example: 'uuid-do-pilar' })
  @IsUUID()
  @IsNotEmpty()
  pilarId: string;

  @ApiProperty({ example: 'uuid-do-usuario-responsavel', required: false })
  @IsUUID()
  @IsOptional()
  responsavelId?: string;
}
