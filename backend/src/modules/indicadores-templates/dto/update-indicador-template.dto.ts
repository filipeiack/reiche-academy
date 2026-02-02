import { PartialType } from '@nestjs/swagger';
import { CreateIndicadorTemplateDto } from './create-indicador-template.dto';

export class UpdateIndicadorTemplateDto extends PartialType(CreateIndicadorTemplateDto) {}
