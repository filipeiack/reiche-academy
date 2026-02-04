import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, IsDateString, IsInt, Min, IsOptional, Length, IsUrl } from 'class-validator';

export class CreateAgendaReuniaoDto {
  @ApiProperty({ example: 'Reunião de Diagnóstico PDCA' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 200)
  titulo: string;

  @ApiPropertyOptional({ example: 'Reunião para apresentação do diagnóstico empresarial' })
  @IsString()
  @IsOptional()
  @Length(0, 1000)
  descricao?: string;

  @ApiProperty({ example: '2025-12-10T14:00:00-03:00' })
  @IsDateString()
  @IsNotEmpty()
  dataHora: string;

  @ApiPropertyOptional({ example: 120, description: 'Duração em minutos' })
  @IsInt()
  @IsOptional()
  @Min(1)
  duracao?: number;

  @ApiPropertyOptional({ example: 'Sala de Reuniões - 3º Andar' })
  @IsString()
  @IsOptional()
  @Length(0, 200)
  local?: string;

  @ApiPropertyOptional({ example: 'https://meet.google.com/abc-defg-hij' })
  @IsUrl()
  @IsOptional()
  link?: string;

  @ApiProperty({ example: 'uuid-do-usuario' })
  @IsUUID()
  @IsNotEmpty()
  usuarioId: string;
}
