import { Module } from '@nestjs/common';
import { PeriodosMentoriaService } from './periodos-mentoria.service';
import { PeriodosMentoriaController } from './periodos-mentoria.controller';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [AuthModule, UsuariosModule],
  controllers: [PeriodosMentoriaController],
  providers: [PeriodosMentoriaService],
  exports: [PeriodosMentoriaService],
})
export class PeriodosMentoriaModule {}
