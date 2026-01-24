import { Module } from '@nestjs/common';
import { PilaresEmpresaService } from './pilares-empresa.service';
import { RotinasEmpresaService } from './rotinas-empresa.service';
import { PilaresEmpresaController } from './pilares-empresa.controller';
import { RotinasEmpresaController } from './rotinas-empresa.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, UsuariosModule],
  controllers: [PilaresEmpresaController, RotinasEmpresaController],
  providers: [PilaresEmpresaService, RotinasEmpresaService],
  exports: [PilaresEmpresaService, RotinasEmpresaService],
})
export class PilaresEmpresaModule {}
