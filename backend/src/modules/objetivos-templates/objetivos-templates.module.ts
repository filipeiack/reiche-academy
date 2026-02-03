import { Module } from '@nestjs/common';
import { ObjetivosTemplatesService } from './objetivos-templates.service';
import { ObjetivosTemplatesController } from './objetivos-templates.controller';
import { AuthModule } from '../auth/auth.module';
import { UsuariosModule } from '../usuarios/usuarios.module';

@Module({
  imports: [AuthModule, UsuariosModule],
  controllers: [ObjetivosTemplatesController],
  providers: [ObjetivosTemplatesService],
})
export class ObjetivosTemplatesModule {}
