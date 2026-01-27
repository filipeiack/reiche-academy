import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProcessoFluxogramaDto {
  @ApiProperty({
    example: 'Coletar dados iniciais do cliente',
    description: 'Descrição da ação do fluxograma (10 a 300 caracteres)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, {
    message: 'A descrição deve ter no mínimo 10 caracteres',
  })
  @MaxLength(300, {
    message: 'A descrição deve ter no máximo 300 caracteres',
  })
  descricao: string;
}
