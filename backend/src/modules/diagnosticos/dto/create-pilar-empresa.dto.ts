import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreatePilarEmpresaDto {
  @ApiProperty({ example: 'uuid-da-empresa' })
  @IsUUID()
  @IsNotEmpty()
  empresaId: string;

  @ApiProperty({ example: 'uuid-do-pilar' })
  @IsUUID()
  @IsNotEmpty()
  pilarId: string;
}
