import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreatePilarEvolucaoDto {
  @ApiProperty({ example: 'uuid-do-pilar-empresa' })
  @IsUUID()
  @IsNotEmpty()
  pilarEmpresaId: string;

  @ApiPropertyOptional({ example: 7.5, description: 'Média das notas de 0 a 10' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(10)
  mediaNotas?: number;
}
