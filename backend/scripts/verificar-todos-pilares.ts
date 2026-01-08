import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verificar() {
  const pilares = await prisma.pilar.findMany({
    where: {
      nome: {
        in: ['MARKETING', 'VENDAS', 'PESSOAS', 'FINANCEIRO', 'COMPRAS/ESTOQUE'],
      },
    },
    include: {
      rotinas: {
        orderBy: { ordem: 'asc' },
      },
    },
    orderBy: { ordem: 'asc' },
  });

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║         VERIFICAÇÃO DE PILARES E ROTINAS CADASTRADOS         ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  let totalRotinas = 0;

  pilares.forEach((pilar) => {
    console.log(`\n${'═'.repeat(65)}`);
    console.log(`📊 PILAR: ${pilar.nome}`);
    console.log(`   Ordem: ${pilar.ordem} | Total de rotinas: ${pilar.rotinas.length}`);
    console.log(`${'─'.repeat(65)}`);
    
    pilar.rotinas.forEach((rotina, index) => {
      console.log(`${String(index + 1).padStart(2, '0')}. ${rotina.nome}`);
      totalRotinas++;
    });
    console.log(`${'═'.repeat(65)}`);
  });

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log(`║  TOTAL GERAL: ${pilares.length} pilares | ${totalRotinas} rotinas cadastradas       ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');
}

verificar()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
