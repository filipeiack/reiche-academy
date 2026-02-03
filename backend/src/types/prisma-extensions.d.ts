import { Prisma } from '@prisma/client';

declare module '@prisma/client' {
  interface PrismaClient {
    indicadorTemplate: Prisma.IndicadorTemplateDelegate<Prisma.DefaultArgs>;
  }

  interface AcaoCockpit {
    inicioPrevisto: Date | null;
    inicioReal: Date | null;
  }
}
