import { Module } from '@nestjs/common';
import { RotinasService } from './rotinas.service';
import { RotinasController } from './rotinas.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [RotinasController],
  providers: [RotinasService],
  exports: [RotinasService],
})
export class RotinasModule {}
