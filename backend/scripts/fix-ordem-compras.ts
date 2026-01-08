import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function corrigirOrdem() {
  await prisma.pilar.update({
    where: { nome: 'COMPRAS/ESTOQUE' },
    data: { ordem: 6 },
  });
  
  console.log('✅ Ordem do pilar COMPRAS/ESTOQUE atualizada para 6');
}

corrigirOrdem()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
