import { Module } from '@nestjs/common';
import { RotinasService } from './rotinas.service';
import { RotinasController } from './rotinas.controller';

@Module({
  controllers: [RotinasController],
  providers: [RotinasService],
  exports: [RotinasService],
})
export class RotinasModule {}
