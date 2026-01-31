import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length, Matches, IsEnum, IsOptional } from 'class-validator';
import { EstadoBrasil } from '@prisma/client';

export class CreateEmpresaDto {
  @ApiProperty({ example: 'Reiche Consultoria Ltda' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  nome: string;

  @ApiProperty({ example: '12345678000190', description: 'CNPJ apenas números (14 dígitos)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{14}$/, {
    message: 'CNPJ deve conter exatamente 14 dígitos numéricos',
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
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'loginUrl não pode ser vazio' })
  @Length(3, 100)
  @Matches(/^\S+$/, {
    message: 'loginUrl não pode conter espaços em branco',
  })
  loginUrl?: string;
}
