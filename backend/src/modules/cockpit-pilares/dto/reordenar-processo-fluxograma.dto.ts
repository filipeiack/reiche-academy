import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

class OrdemProcessoFluxogramaDto {
  @ApiProperty({ example: 'uuid-1' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  ordem: number;
}

export class ReordenarProcessoFluxogramaDto {
  @ApiProperty({
    example: [
      { id: 'uuid-1', ordem: 1 },
      { id: 'uuid-2', ordem: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdemProcessoFluxogramaDto)
  ordens: OrdemProcessoFluxogramaDto[];
}
