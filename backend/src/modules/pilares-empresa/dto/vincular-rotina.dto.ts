import { IsUUID, IsNotEmpty, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VincularRotinaDto {
  @ApiProperty({
    description: 'ID da rotina a ser vinculada ao pilar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  rotinaId: string;

  @ApiProperty({
    description: 'Ordem da rotina no pilar (será calculada automaticamente se omitida)',
    example: 5,
    required: false,
  })
  @IsInt()
  @Min(1)
  ordem?: number;
}
