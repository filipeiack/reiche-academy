import {
  IsOptional,
  IsNotEmpty,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Criticidade } from '@prisma/client';

export class CreateRotinaEmpresaDto {
  @ApiPropertyOptional({ 
    example: 'uuid-da-rotina-template',
    description: 'UUID do template de rotina. Se fornecido, copia nome e descrição do template. Null para rotina customizada.'
  })
  @IsOptional()
  @IsUUID('4', { message: 'rotinaTemplateId deve ser um UUID válido' })
  rotinaTemplateId?: string;

  @ApiPropertyOptional({ 
    example: 'Planejamento Estratégico Trimestral',
    description: 'Nome da rotina. Obrigatório se rotinaTemplateId não for fornecido (rotina customizada).'
  })
  @ValidateIf((o) => !o.rotinaTemplateId)
  @IsNotEmpty({ message: 'Nome é obrigatório para rotinas customizadas' })
  @Length(2, 200, { message: 'Nome deve ter entre 2 e 200 caracteres' })
  nome?: string;

  @ApiPropertyOptional({ example: 'MEDIA', enum: Criticidade })
  @IsEnum(Criticidade, { message: 'Criticidade deve ser ALTA, MEDIA ou BAIXA' })
  @IsOptional()
  criticidade?: Criticidade;
}
