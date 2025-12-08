import { PartialType } from '@nestjs/swagger';
import { CreateNotaRotinaDto } from './create-nota-rotina.dto';

export class UpdateNotaRotinaDto extends PartialType(CreateNotaRotinaDto) {}
