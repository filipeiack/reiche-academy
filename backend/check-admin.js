// Script rápido para verificar se o admin existe
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.usuario.findUnique({
      where: { email: 'admin@reiche.com.br' },
      include: {
        perfil: true
      }
    });

    if (admin) {
      console.log('✅ Admin encontrado:');
      console.log('   Email:', admin.email);
      console.log('   Nome:', admin.nome);
      console.log('   Perfil:', admin.perfil.codigo);
      console.log('   Ativo:', admin.ativo);
      console.log('   Senha hash existe:', !!admin.senha);
    } else {
      console.log('❌ Admin NÃO encontrado no banco!');
      console.log('');
      console.log('Execute o seed para criar os dados:');
      console.log('   cd backend');
      console.log('   npm run seed');
    }

    // Listar todos os usuários
    const usuarios = await prisma.usuario.findMany({
      select: {
        email: true,
        nome: true,
        perfil: { select: { codigo: true } }
      }
    });

    console.log('');
    console.log('📋 Usuários no banco:', usuarios.length);
    usuarios.forEach(u => {
      console.log(`   - ${u.email} (${u.perfil.codigo})`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
