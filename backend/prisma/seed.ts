import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Criar perfis de usuário
  const perfis = [
    { codigo: 'ADMINISTRADOR', nome: 'Administrador', descricao: 'Acesso total ao sistema', nivel: 1 },
    { codigo: 'CONSULTOR', nome: 'Consultor', descricao: 'Gerencia estrutura (pilares, rotinas, empresas)', nivel: 2 },
    { codigo: 'GESTOR', nome: 'Gestor', descricao: 'Gerencia empresa e colaboradores', nivel: 3 },
    { codigo: 'COLABORADOR', nome: 'Colaborador', descricao: 'Acessa dados da empresa', nivel: 4 },
    { codigo: 'LEITURA', nome: 'Leitura', descricao: 'Apenas visualização', nivel: 5 },
  ];

  for (const perfil of perfis) {
    await prisma.perfilUsuario.upsert({
      where: { codigo: perfil.codigo },
      update: {},
      create: perfil,
    });
  }
  console.log(`✅ ${perfis.length} perfis de usuário criados`);

  // Buscar perfil CONSULTOR para usar no admin
  const perfilConsultor = await prisma.perfilUsuario.findUnique({
    where: { codigo: 'CONSULTOR' },
  });

  if (!perfilConsultor) {
    throw new Error('Perfil CONSULTOR não encontrado');
  }

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
      perfilId: perfilConsultor.id,
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
