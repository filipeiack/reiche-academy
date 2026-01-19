import {
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StatusProcesso } from '@prisma/client';

export class UpdateProcessoPrioritarioDto {
  @ApiProperty({
    example: 'EM_ANDAMENTO',
    enum: StatusProcesso,
    description: 'Status do mapeamento: PENDENTE, EM_ANDAMENTO, CONCLUIDO',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(StatusProcesso, { message: 'statusMapeamento deve ser PENDENTE, EM_ANDAMENTO ou CONCLUIDO' })
  statusMapeamento: StatusProcesso | null;

  @ApiProperty({
    example: 'PENDENTE',
    enum: StatusProcesso,
    description: 'Status do treinamento: PENDENTE, EM_ANDAMENTO, CONCLUIDO',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsEnum(StatusProcesso, { message: 'statusTreinamento deve ser PENDENTE, EM_ANDAMENTO ou CONCLUIDO' })
  statusTreinamento: StatusProcesso | null;
}