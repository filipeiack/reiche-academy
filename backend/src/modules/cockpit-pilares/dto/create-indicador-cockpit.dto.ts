import {
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsInt,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoMedidaIndicador, StatusMedicaoIndicador, DirecaoIndicador } from '@prisma/client';

export class CreateIndicadorCockpitDto {
  @ApiProperty({
    example: 'FATURAMENTO TOTAL MENSAL',
    description: 'Nome do indicador',
  })
  @IsNotEmpty({ message: 'nome é obrigatório' })
  @IsString({ message: 'nome deve ser uma string' })
  @MaxLength(200, { message: 'nome deve ter no máximo 200 caracteres' })
  nome: string;

  @ApiPropertyOptional({
    example: 'TOTAL EM R$ VENDIDOS VIA CANAL INDIRETO',
    description: 'Descrição detalhada do indicador',
  })
  @IsOptional()
  @IsString({ message: 'descricao deve ser uma string' })
  @MaxLength(1000, { message: 'descricao deve ter no máximo 1000 caracteres' })
  descricao?: string;

  @ApiProperty({
    example: 'REAL',
    enum: TipoMedidaIndicador,
    description: 'Tipo de medida: REAL, QUANTIDADE, TEMPO, PERCENTUAL',
  })
  @IsNotEmpty({ message: 'tipoMedida é obrigatório' })
  @IsEnum(TipoMedidaIndicador, { message: 'tipoMedida deve ser REAL, QUANTIDADE, TEMPO ou PERCENTUAL' })
  tipoMedida: TipoMedidaIndicador;

  @ApiProperty({
    example: 'MEDIDO_CONFIAVEL',
    enum: StatusMedicaoIndicador,
    description: 'Status da medição: NAO_MEDIDO, MEDIDO_NAO_CONFIAVEL, MEDIDO_CONFIAVEL',
  })
  @IsNotEmpty({ message: 'statusMedicao é obrigatório' })
  @IsEnum(StatusMedicaoIndicador, { message: 'statusMedicao deve ser NAO_MEDIDO, MEDIDO_NAO_CONFIAVEL ou MEDIDO_CONFIAVEL' })
  statusMedicao: StatusMedicaoIndicador;

  @ApiPropertyOptional({
    example: 'uuid-do-usuario',
    description: 'UUID do usuário responsável pela medição',
  })
  @IsOptional()
  @IsUUID('4', { message: 'responsavelMedicaoId deve ser um UUID válido' })
  responsavelMedicaoId?: string;

  @ApiProperty({
    example: 'MAIOR',
    enum: DirecaoIndicador,
    description: 'Melhor direção: MAIOR (↑) ou MENOR (↓)',
  })
  @IsNotEmpty({ message: 'melhor é obrigatório' })
  @IsEnum(DirecaoIndicador, { message: 'melhor deve ser MAIOR ou MENOR' })
  melhor: DirecaoIndicador;

  @ApiPropertyOptional({
    example: 1,
    description: 'Ordem de exibição no cockpit',
  })
  @IsOptional()
  @IsInt({ message: 'ordem deve ser um número inteiro' })
  @Min(0, { message: 'ordem deve ser maior ou igual a 0' })
  ordem?: number;
}
