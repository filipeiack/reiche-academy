import { Module } from '@nestjs/common';
import { PilaresService } from './pilares.service';
import { PilaresController } from './pilares.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [AuditModule, AuthModule, UsuariosModule],
  controllers: [PilaresController],
  providers: [PilaresService],
  exports: [PilaresService],
})
export class PilaresModule {}
