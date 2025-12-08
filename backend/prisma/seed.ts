import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create a default empresa
  const empresa = await prisma.empresa.upsert({
    where: { cnpj: '00000000000000' },
    update: {},
    create: {
      cnpj: '00000000000000',
      razaoSocial: 'Empresa Demo',
      nome: 'Demo',
      tipoNegocio: 'Consultoria',
      ativo: true,
    },
  });
  console.log(`✅ Empresa criada: ${empresa.nome}`);

  // Hash the password
  const hashedPassword = await argon2.hash('123456');

  // Create admin user
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@reiche.com' },
    update: {},
    create: {
      email: 'admin@reiche.com',
      nome: 'Administrador',
      senha: hashedPassword,
      perfil: 'CONSULTOR',
      cargo: 'Administrador',
      ativo: true,
      empresaId: empresa.id,
    },
  });
  console.log(`✅ Usuário admin criado: ${admin.email}`);

  // Create some pilares
  const pilares = [
    { nome: 'Comercial', ordem: 1, ativo: true },
    { nome: 'Operacional', ordem: 2, ativo: true },
    { nome: 'Financeiro', ordem: 3, ativo: true },
    { nome: 'Pessoas', ordem: 4, ativo: true },
    { nome: 'Estratégia', ordem: 5, ativo: true },
  ];

  for (const pilarData of pilares) {
    const existingPilar = await prisma.pilar.findFirst({
      where: { nome: pilarData.nome },
    });

    if (!existingPilar) {
      await prisma.pilar.create({
        data: pilarData,
      });
    }
  }
  console.log(`✅ ${pilares.length} pilares criados`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
