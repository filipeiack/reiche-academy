import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR, APP_PIPE, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './common/prisma/prisma.module';
import { SecurityInterceptor } from './common/interceptors/security.interceptor';
import { RateLimitingInterceptor } from './common/interceptors/rate-limiting.interceptor';
import { SanitizationPipe } from './common/pipes/sanitization.pipe';
import { RateLimitService } from './common/services/rate-limit.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { EmpresasModule } from './modules/empresas/empresas.module';
import { PilaresModule } from './modules/pilares/pilares.module';
import { PilaresEmpresaModule } from './modules/pilares-empresa/pilares-empresa.module';
import { RotinasModule } from './modules/rotinas/rotinas.module';
import { DiagnosticosModule } from './modules/diagnosticos/diagnosticos.module';
import { AuditModule } from './modules/audit/audit.module';
import { PerfisModule } from './modules/perfis/perfis.module';
import { PeriodosAvaliacaoModule } from './modules/periodos-avaliacao/periodos-avaliacao.module';
import { CockpitPilaresModule } from './modules/cockpit-pilares/cockpit-pilares.module';
import { PeriodosMentoriaModule } from './modules/periodos-mentoria/periodos-mentoria.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // DEV: 100 requisições/minuto (PROD: ajustar para 30)
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
    PeriodosAvaliacaoModule,
    CockpitPilaresModule,
    PeriodosMentoriaModule,
  ],
  providers: [
    // Core services
    RateLimitService,
    // Security headers interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityInterceptor,
    },
    // Rate limiting interceptor (global + custom limits)
    {
      provide: APP_INTERCEPTOR,
      useClass: RateLimitingInterceptor,
    },
    // Rate limiting via ThrottlerGuard (endpoints específicos)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // Input sanitization
    {
      provide: APP_PIPE,
      useClass: SanitizationPipe,
    },
  ],
})
export class AppModule {}
