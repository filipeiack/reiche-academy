import { PartialType } from '@nestjs/swagger';
import { CreateRotinaEmpresaDto } from './create-rotina-empresa.dto';

export class UpdateRotinaEmpresaDto extends PartialType(CreateRotinaEmpresaDto) {}
