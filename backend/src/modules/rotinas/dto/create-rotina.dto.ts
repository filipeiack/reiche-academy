import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, IsInt, Min, IsOptional, IsUUID, IsBoolean } from 'class-validator';

export class CreateRotinaDto {
  @ApiProperty({ example: 'Planejamento Estratégico Anual' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  nome: string;

  @ApiPropertyOptional({ example: 'Elaboração do planejamento estratégico da empresa' })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  descricao?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  ordem?: number;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  modelo?: boolean;

  @ApiProperty({ example: 'uuid-do-pilar' })
  @IsUUID()
  @IsNotEmpty()
  pilarId: string;
}
