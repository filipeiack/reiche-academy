import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicates() {
  console.log('🔍 Verificando duplicatas...\n');

  // Check pilares
  const pilares = await prisma.pilar.groupBy({
    by: ['nome'],
    _count: {
      nome: true,
    },
    having: {
      nome: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (pilares.length > 0) {
    console.log('❌ Pilares com nomes duplicados:');
    for (const pilar of pilares) {
      console.log(`  - "${pilar.nome}" aparece ${pilar._count.nome} vezes`);
      
      const duplicados = await prisma.pilar.findMany({
        where: { nome: pilar.nome },
        orderBy: { createdAt: 'asc' },
      });
      
      console.log('    IDs:', duplicados.map(p => p.id).join(', '));
    }
    console.log();
  } else {
    console.log('✅ Nenhum pilar duplicado encontrado\n');
  }

  // Check rotinas
  const rotinas = await prisma.rotina.groupBy({
    by: ['nome'],
    _count: {
      nome: true,
    },
    having: {
      nome: {
        _count: {
          gt: 1,
        },
      },
    },
  });

  if (rotinas.length > 0) {
    console.log('❌ Rotinas com nomes duplicados:');
    for (const rotina of rotinas) {
      console.log(`  - "${rotina.nome}" aparece ${rotina._count.nome} vezes`);
      
      const duplicados = await prisma.rotina.findMany({
        where: { nome: rotina.nome },
        orderBy: { createdAt: 'asc' },
      });
      
      console.log('    IDs:', duplicados.map(r => r.id).join(', '));
    }
    console.log();
  } else {
    console.log('✅ Nenhuma rotina duplicada encontrada\n');
  }

  await prisma.$disconnect();
}

checkDuplicates()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
