import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    
    // Garantir que todas as conexões usem timezone de São Paulo
    try {
      const result = await this.$queryRaw`SET timezone TO 'America/Sao_Paulo'`;
      const tzCheck = await this.$queryRaw`SELECT NOW() as now, current_setting('timezone') as tz`;
      console.log('✅ Timezone configurado:', tzCheck);
    } catch (error) {
      console.error('❌ Erro ao configurar timezone:', error);
    }
    
    console.log('✅ Database connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('❌ Database disconnected');
  }
}
