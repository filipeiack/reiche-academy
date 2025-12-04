import { Module } from '@nestjs/common';
import { PilaresService } from './pilares.service';
import { PilaresController } from './pilares.controller';

@Module({
  controllers: [PilaresController],
  providers: [PilaresService],
  exports: [PilaresService],
})
export class PilaresModule {}
