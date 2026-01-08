import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { AuditModule } from '../audit/audit.module';
import { PilaresEmpresaModule } from '../pilares-empresa/pilares-empresa.module';

@Module({
  imports: [AuditModule, PilaresEmpresaModule],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
