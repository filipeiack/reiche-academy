import { IsArray, ValidateNested, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class OrdemRotinaItem {
  @ApiProperty({
    description: 'ID da RotinaEmpresa',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;

  @ApiProperty({
    description: 'Nova ordem da rotina',
    example: 1,
  })
  @IsInt()
  @Min(1)
  ordem: number;
}

export class ReordenarRotinasDto {
  @ApiProperty({
    description: 'Array de IDs e ordens para reordenação',
    type: [OrdemRotinaItem],
    example: [
      { id: '550e8400-e29b-41d4-a716-446655440000', ordem: 1 },
      { id: '660e8400-e29b-41d4-a716-446655440001', ordem: 2 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdemRotinaItem)
  ordens: OrdemRotinaItem[];
}
