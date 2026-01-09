import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function checkUser() {
  const user = await prisma.usuario.findUnique({
    where: { email: 'admin@reiche.com' },
  });

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:', user.email);
  console.log('User ID:', user.id);
  console.log('User Name:', user.nome);
  console.log('User Active:', user.ativo);
  
  if (!user.senha) {
    console.log('❌ User has no password set');
    await prisma.$disconnect();
    return;
  }
  
  console.log('Password Hash:', user.senha.substring(0, 50) + '...');

  // Test password verification
  const testPassword = '123456';
  const isValid = await argon2.verify(user.senha, testPassword);
  console.log(`\nPassword '${testPassword}' verification:`, isValid ? '✅ VALID' : '❌ INVALID');

  await prisma.$disconnect();
}

checkUser();
