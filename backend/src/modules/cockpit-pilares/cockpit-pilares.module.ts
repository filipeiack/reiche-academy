import { Module } from '@nestjs/common';
import { CockpitPilaresController } from './cockpit-pilares.controller';
import { CockpitPilaresService } from './cockpit-pilares.service';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [CockpitPilaresController],
  providers: [CockpitPilaresService],
  exports: [CockpitPilaresService],
})
export class CockpitPilaresModule {}
