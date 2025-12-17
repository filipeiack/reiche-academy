import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches, IsEnum, IsOptional } from 'class-validator';
import { EstadoBrasil } from '@prisma/client';

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

  @ApiProperty({ example: 'Consultoria Empresarial', required: false })
  @IsString()
  @IsOptional()
  @Length(2, 100)
  tipoNegocio?: string;

  @ApiProperty({ example: 'São Paulo' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  cidade: string;

  @ApiProperty({ example: 'SP', enum: EstadoBrasil })
  @IsEnum(EstadoBrasil)
  @IsNotEmpty()
  estado: EstadoBrasil;

  @ApiProperty({ example: 'reiche-consultoria', required: false })
  @IsString()
  @IsOptional()
  @Length(3, 100)
  @Matches(/^\S+$/, {
    message: 'loginUrl não pode conter espaços em branco',
  })
  loginUrl?: string;
}
