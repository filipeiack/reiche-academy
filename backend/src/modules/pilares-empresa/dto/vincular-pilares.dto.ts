import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VincularPilaresDto {
  @ApiProperty({
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
    description: 'Array de UUIDs de templates de pilares para vincular à empresa',
    type: [String],
  })
  @IsArray({ message: 'pilaresIds deve ser um array' })
  @ArrayMinSize(1, { message: 'Deve fornecer pelo menos um pilar para vincular' })
  @IsUUID('4', { each: true, message: 'Cada pilarId deve ser um UUID válido' })
  pilaresIds: string[];
}
