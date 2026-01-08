import {
  IsOptional,
  IsNotEmpty,
  IsUUID,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePilarEmpresaDto {
  @ApiPropertyOptional({ 
    example: 'uuid-do-pilar-template',
    description: 'UUID do template de pilar. Se fornecido, copia nome e descrição do template. Null para pilar customizado.'
  })
  @IsOptional()
  @IsUUID('4', { message: 'pilarTemplateId deve ser um UUID válido' })
  pilarTemplateId?: string;

  @ApiPropertyOptional({ 
    example: 'Gestão Financeira',
    description: 'Nome do pilar. Obrigatório se pilarTemplateId não for fornecido (pilar customizado).'
  })
  @ValidateIf((o) => !o.pilarTemplateId)
  @IsNotEmpty({ message: 'Nome é obrigatório para pilares customizados' })
  @Length(2, 200, { message: 'Nome deve ter entre 2 e 200 caracteres' })
  nome?: string;
}
