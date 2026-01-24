import { Module } from '@nestjs/common';
import { DiagnosticosController } from './diagnosticos.controller';
import { DiagnosticosService } from './diagnosticos.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule, UsuariosModule],
  controllers: [DiagnosticosController],
  providers: [DiagnosticosService],
  exports: [DiagnosticosService],
})
export class DiagnosticosModule {}
