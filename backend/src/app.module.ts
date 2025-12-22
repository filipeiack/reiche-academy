import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { PilaresModule } from './modules/pilares/pilares.module';
import { PilaresEmpresaModule } from './modules/pilares-empresa/pilares-empresa.module';
import { RotinasModule } from './modules/rotinas/rotinas.module';
import { DiagnosticosModule } from './modules/diagnosticos/diagnosticos.module';
import { AuditModule } from './modules/audit/audit.module';
import { PerfisModule } from './modules/perfis/perfis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    EmpresasModule,
    PilaresModule,
    PilaresEmpresaModule,
    RotinasModule,
    DiagnosticosModule,
    AuditModule,
    PerfisModule,
  ],
})
export class AppModule {}
