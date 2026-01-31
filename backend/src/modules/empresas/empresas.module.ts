import { Module } from '@nestjs/common';
import { EmpresasService } from './empresas.service';
import { EmpresasController } from './empresas.controller';
import { AuditModule } from '../audit/audit.module';
import { PilaresEmpresaModule } from '../pilares-empresa/pilares-empresa.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [AuditModule, PilaresEmpresaModule, AuthModule, UsuariosModule],
  controllers: [EmpresasController],
  providers: [EmpresasService],
  exports: [EmpresasService],
})
export class EmpresasModule {}
