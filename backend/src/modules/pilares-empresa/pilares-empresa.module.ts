import { Module } from '@nestjs/common';
import { PilaresEmpresaService } from './pilares-empresa.service';
import { PilaresEmpresaController } from './pilares-empresa.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PilaresEmpresaController],
  providers: [PilaresEmpresaService],
  exports: [PilaresEmpresaService],
})
export class PilaresEmpresaModule {}
