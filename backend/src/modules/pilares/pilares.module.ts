import { Module } from '@nestjs/common';
import { PilaresService } from './pilares.service';
import { PilaresController } from './pilares.controller';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PilaresController],
  providers: [PilaresService],
  exports: [PilaresService],
})
export class PilaresModule {}
