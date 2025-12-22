import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class VincularPilaresDto {
  @ApiProperty({
    type: [String],
    example: ['uuid-pilar-1', 'uuid-pilar-2', 'uuid-pilar-3'],
    description: 'IDs dos pilares a serem vinculados à empresa'
  })
  @IsArray()
  @IsUUID('4', { each: true })
  pilaresIds: string[];
}
