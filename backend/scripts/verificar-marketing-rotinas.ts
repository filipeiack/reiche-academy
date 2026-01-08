import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificar() {
  const pilar = await prisma.pilar.findFirst({
    where: { nome: 'MARKETING' },
    include: {
      rotinas: {
        orderBy: { ordem: 'asc' },
      },
    },
  });

  if (pilar) {
    console.log('\n📊 Pilar:', pilar.nome);
    console.log('📝 Total de rotinas:', pilar.rotinas.length);
    console.log('\n✅ Rotinas cadastradas:\n');
    
    pilar.rotinas.forEach((rotina, index) => {
      console.log(`${index + 1}. ${rotina.nome}`);
    });
  } else {
    console.log('❌ Pilar MARKETING não encontrado');
  }
}

verificar()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
