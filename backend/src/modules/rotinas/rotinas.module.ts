import { Module } from '@nestjs/common';
import { RotinasService } from './rotinas.service';
import { RotinasController } from './rotinas.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [AuditModule, AuthModule, UsuariosModule],
  controllers: [RotinasController],
  providers: [RotinasService],
  exports: [RotinasService],
})
export class RotinasModule {}
