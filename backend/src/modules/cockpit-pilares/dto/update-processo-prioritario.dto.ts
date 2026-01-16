import {
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusProcesso } from '@prisma/client';

export class UpdateProcessoPrioritarioDto {
  @ApiProperty({
    example: 'EM_ANDAMENTO',
    enum: StatusProcesso,
    description: 'Status do mapeamento: PENDENTE, EM_ANDAMENTO, CONCLUIDO',
  })
  @IsNotEmpty({ message: 'statusMapeamento é obrigatório' })
  @IsEnum(StatusProcesso, { message: 'statusMapeamento deve ser PENDENTE, EM_ANDAMENTO ou CONCLUIDO' })
  statusMapeamento: StatusProcesso;

  @ApiProperty({
    example: 'PENDENTE',
    enum: StatusProcesso,
    description: 'Status do treinamento: PENDENTE, EM_ANDAMENTO, CONCLUIDO',
  })
  @IsNotEmpty({ message: 'statusTreinamento é obrigatório' })
  @IsEnum(StatusProcesso, { message: 'statusTreinamento deve ser PENDENTE, EM_ANDAMENTO ou CONCLUIDO' })
  statusTreinamento: StatusProcesso;
}
