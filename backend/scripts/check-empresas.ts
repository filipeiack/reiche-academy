import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.findMany({
    select: {
      id: true,
      nome: true,
      loginUrl: true,
      logoUrl: true,
      ativo: true
    }
  });

  console.log('=== Empresas Cadastradas ===');
  console.log(JSON.stringify(empresas, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
