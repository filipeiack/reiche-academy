import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrdemPilarEmpresaDto {
  @ApiProperty({ example: 'uuid-do-pilar-empresa' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 1, description: 'Nova ordem do pilar na empresa' })
  @IsInt()
  @Min(1)
  ordem: number;
}

export class ReordenarPilaresDto {
  @ApiProperty({ 
    type: [OrdemPilarEmpresaDto],
    example: [
      { id: 'uuid-1', ordem: 1 },
      { id: 'uuid-2', ordem: 2 },
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdemPilarEmpresaDto)
  ordens: OrdemPilarEmpresaDto[];
}
