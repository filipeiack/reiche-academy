import { IsDateString, IsNotEmpty } from 'class-validator';

export class CreatePeriodoMentoriaDto {
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  @IsDateString({}, { message: 'Data de início deve ser uma data válida' })
  dataInicio!: string; // ISO 8601 format
}
