import { PartialType } from '@nestjs/swagger';
import { CreateAgendaReuniaoDto } from './create-agenda-reuniao.dto';

export class UpdateAgendaReuniaoDto extends PartialType(CreateAgendaReuniaoDto) {}
