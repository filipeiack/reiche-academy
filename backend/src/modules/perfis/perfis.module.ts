import { Module } from '@nestjs/common';
import { PerfisService } from './perfis.service';
import { PerfisController } from './perfis.controller';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [UsuariosModule],
  controllers: [PerfisController],
  providers: [PerfisService],
  exports: [PerfisService],
})
export class PerfisModule {}
