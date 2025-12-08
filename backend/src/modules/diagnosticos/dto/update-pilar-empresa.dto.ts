import { PartialType } from '@nestjs/swagger';
import { CreatePilarEmpresaDto } from './create-pilar-empresa.dto';

export class UpdatePilarEmpresaDto extends PartialType(CreatePilarEmpresaDto) {}
