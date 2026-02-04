import { Module } from '@nestjs/common';
import { IndicadoresTemplatesService } from './indicadores-templates.service';
import { IndicadoresTemplatesController } from './indicadores-templates.controller';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [AuditModule, AuthModule, UsuariosModule],
  controllers: [IndicadoresTemplatesController],
  providers: [IndicadoresTemplatesService],
})
export class IndicadoresTemplatesModule {}
