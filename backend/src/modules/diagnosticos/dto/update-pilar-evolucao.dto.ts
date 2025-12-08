import { PartialType } from '@nestjs/swagger';
import { CreatePilarEvolucaoDto } from './create-pilar-evolucao.dto';

export class UpdatePilarEvolucaoDto extends PartialType(CreatePilarEvolucaoDto) {}
