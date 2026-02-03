import { PartialType } from '@nestjs/swagger';
import { CreateObjetivoTemplateDto } from './create-objetivo-template.dto';

export class UpdateObjetivoTemplateDto extends PartialType(CreateObjetivoTemplateDto) {}
