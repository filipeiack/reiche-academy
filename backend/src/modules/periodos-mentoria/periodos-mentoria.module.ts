import { Module } from '@nestjs/common';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { PeriodosMentoriaController } from './periodos-mentoria.controller';

@Module({
  imports: [],
  controllers: [PeriodosMentoriaController],
  providers: [PeriodosMentoriaService],
  exports: [PeriodosMentoriaService],
})
export class PeriodosMentoriaModule {}
