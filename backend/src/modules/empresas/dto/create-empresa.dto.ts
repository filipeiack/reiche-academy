import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class CreateEmpresaDto {
  @ApiProperty({ example: 'Reiche Consultoria Ltda' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  nome: string;

  @ApiProperty({ example: '12.345.678/0001-90' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato 00.000.000/0000-00',
  })
  cnpj: string;

  @ApiProperty({ example: 'Reiche Consultoria Empresarial Ltda' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  razaoSocial: string;
}
