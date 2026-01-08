import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class OrdemItemDto {
  @ApiProperty({ description: 'ID do pilar' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ description: 'Nova ordem do pilar' })
  @IsNumber()
  @IsNotEmpty()
  ordem: number;
}

export class ReordenarPilarDto {
  @ApiProperty({ description: 'Lista de pilares com novas ordens', type: [OrdemItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdemItemDto)
  ordens: OrdemItemDto[];
}
