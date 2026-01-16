import { Module } from '@nestjs/common';
import { PeriodosAvaliacaoController } from './periodos-avaliacao.controller';
import { PeriodosAvaliacaoService } from './periodos-avaliacao.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PeriodosAvaliacaoController],
  providers: [PeriodosAvaliacaoService],
  exports: [PeriodosAvaliacaoService],
})
export class PeriodosAvaliacaoModule {}
