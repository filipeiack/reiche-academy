import { PartialType } from '@nestjs/swagger';
import { CreateProcessoFluxogramaDto } from './create-processo-fluxograma.dto';

export class UpdateProcessoFluxogramaDto extends PartialType(
  CreateProcessoFluxogramaDto,
) {}
