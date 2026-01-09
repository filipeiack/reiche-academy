import { PrismaClient, Criticidade } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Seed específico para testes E2E
 * 
 * Cria dados previsíveis e conhecidos para validar testes E2E:
 * - 2 empresas (Empresa A e Empresa B)
 * - 4 usuários (admin, gestor-a, gestor-b, colaborador-a)
 * - Pilares e rotinas padrão
 * - Alguns diagnósticos iniciais
 * 
 * Para executar: npm run seed:e2e
 */

async function main() {
  console.log('🧪 Starting E2E seed...');

  // ========================================
  // 1. PERFIS DE USUÁRIO
  // ========================================
  
  const perfis = [
    { codigo: 'ADMINISTRADOR', nome: 'Administrador', descricao: 'Acesso total', nivel: 1 },
    { codigo: 'GESTOR', nome: 'Gestor', descricao: 'Gerencia empresa', nivel: 2 },
    { codigo: 'COLABORADOR', nome: 'Colaborador', descricao: 'Acessa diagnósticos', nivel: 3 },
    { codigo: 'LEITURA', nome: 'Leitura', descricao: 'Apenas visualização', nivel: 4 },
  ];

  for (const perfil of perfis) {
    await prisma.perfilUsuario.upsert({
      where: { codigo: perfil.codigo },
      update: {},
      create: perfil,
    });
  }
  console.log(`✅ ${perfis.length} perfis criados`);

  const perfilAdmin = await prisma.perfilUsuario.findUnique({ where: { codigo: 'ADMINISTRADOR' } });
  const perfilGestor = await prisma.perfilUsuario.findUnique({ where: { codigo: 'GESTOR' } });
  const perfilColab = await prisma.perfilUsuario.findUnique({ where: { codigo: 'COLABORADOR' } });

  if (!perfilAdmin || !perfilGestor || !perfilColab) {
    throw new Error('Perfis não encontrados');
  }

  // ========================================
  // 2. EMPRESAS
  // ========================================

  const empresaA = await prisma.empresa.upsert({
    where: { cnpj: '12345678000190' },
    update: {},
    create: {
      cnpj: '12345678000190',
      nome: 'Empresa Teste A Ltda',
      tipoNegocio: 'Consultoria',
      cidade: 'São Paulo',
      estado: 'SP',
      loginUrl: 'empresa-a',
      ativo: true,
    },
  });

  const empresaB = await prisma.empresa.upsert({
    where: { cnpj: '98765432000111' },
    update: {},
    create: {
      cnpj: '98765432000111',
      nome: 'Empresa Teste B Ltda',
      tipoNegocio: 'Indústria',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      loginUrl: 'empresa-b',
      ativo: true,
    },
  });

  console.log(`✅ 2 empresas criadas: ${empresaA.nome}, ${empresaB.nome}`);

  // ========================================
  // 3. USUÁRIOS (senha padrão: Admin@123)
  // ========================================

  const senha = await argon2.hash('Admin@123');

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@reiche.com.br' },
    update: {},
    create: {
      email: 'admin@reiche.com.br',
      nome: 'Administrador Sistema',
      senha,
      perfilId: perfilAdmin.id,
      cargo: 'Administrador',
      ativo: true,
      empresaId: null, // Admin não tem empresa
    },
  });

  const gestorA = await prisma.usuario.upsert({
    where: { email: 'gestor@empresa-a.com' },
    update: {},
    create: {
      email: 'gestor@empresa-a.com',
      nome: 'Gestor Empresa A',
      senha,
      perfilId: perfilGestor.id,
      cargo: 'Gerente',
      ativo: true,
      empresaId: empresaA.id,
    },
  });

  const gestorB = await prisma.usuario.upsert({
    where: { email: 'gestor@empresa-b.com' },
    update: {},
    create: {
      email: 'gestor@empresa-b.com',
      nome: 'Gestor Empresa B',
      senha,
      perfilId: perfilGestor.id,
      cargo: 'Gerente',
      ativo: true,
      empresaId: empresaB.id,
    },
  });

  const colaboradorA = await prisma.usuario.upsert({
    where: { email: 'colab@empresa-a.com' },
    update: {},
    create: {
      email: 'colab@empresa-a.com',
      nome: 'Colaborador Empresa A',
      senha,
      perfilId: perfilColab.id,
      cargo: 'Analista',
      ativo: true,
      empresaId: empresaA.id,
    },
  });

  console.log(`✅ 4 usuários criados:`);
  console.log(`   - ${admin.email} (senha: Admin@123)`);
  console.log(`   - ${gestorA.email} (senha: Admin@123)`);
  console.log(`   - ${gestorB.email} (senha: Admin@123)`);
  console.log(`   - ${colaboradorA.email} (senha: Admin@123)`);

  // ========================================
  // 4. PILARES GLOBAIS
  // ========================================

  const pilaresData = [
    { nome: 'Comercial', ordem: 1 },
    { nome: 'Operacional', ordem: 2 },
    { nome: 'Financeiro', ordem: 3 },
    { nome: 'Pessoas', ordem: 4 },
    { nome: 'Estratégia', ordem: 5 },
  ];

  const pilaresCriados = [];
  for (const pilarData of pilaresData) {
    const pilar = await prisma.pilar.upsert({
      where: { nome: pilarData.nome },
      update: {},
      create: {
        nome: pilarData.nome,
        ordem: pilarData.ordem,
        ativo: true,
      },
    });
    pilaresCriados.push(pilar);
  }

  console.log(`✅ ${pilaresCriados.length} pilares globais criados`);

  // ========================================
  // 5. ROTINAS GLOBAIS (3 por pilar)
  // ========================================

  let rotinasCriadas = 0;
  for (const pilar of pilaresCriados) {
    const rotinas = [
      { nome: `${pilar.nome} - Planejamento`, ordem: 1 },
      { nome: `${pilar.nome} - Execução`, ordem: 2 },
      { nome: `${pilar.nome} - Controle`, ordem: 3 },
    ];

    for (const rotinaData of rotinas) {
      const existingRotina = await prisma.rotina.findFirst({
        where: {
          pilarId: pilar.id,
          nome: rotinaData.nome,
        },
      });

      if (!existingRotina) {
        await prisma.rotina.create({
          data: {
            nome: rotinaData.nome,
            ordem: rotinaData.ordem,
            pilarId: pilar.id,
            ativo: true,
          },
        });
        rotinasCriadas++;
      }
    }
  }

  console.log(`✅ ${rotinasCriadas} rotinas globais criadas`);

  // ========================================
  // 6. VINCULAR PILARES ÀS EMPRESAS
  // ========================================

  const pilaresEmpresaA = [];
  const pilaresEmpresaB = [];

  for (const pilar of pilaresCriados) {
    // Empresa A
    const pilarEmpA = await prisma.pilarEmpresa.upsert({
      where: {
        empresaId_nome: {
          empresaId: empresaA.id,
          nome: pilar.nome,
        },
      },
      update: {},
      create: {
        empresaId: empresaA.id,
        pilarTemplateId: pilar.id,
        nome: pilar.nome,
        ordem: pilar.ordem,
        responsavelId: gestorA.id,
        ativo: true,
      },
    });
    pilaresEmpresaA.push(pilarEmpA);

    // Empresa B
    const pilarEmpB = await prisma.pilarEmpresa.upsert({
      where: {
        empresaId_nome: {
          empresaId: empresaB.id,
          nome: pilar.nome,
        },
      },
      update: {},
      create: {
        empresaId: empresaB.id,
        pilarTemplateId: pilar.id,
        nome: pilar.nome,
        ordem: pilar.ordem,
        responsavelId: gestorB.id,
        ativo: true,
      },
    });
    pilaresEmpresaB.push(pilarEmpB);
  }

  console.log(`✅ Pilares vinculados às empresas`);

  // ========================================
  // 7. VINCULAR ROTINAS ÀS EMPRESAS
  // ========================================

  let rotinasEmpresaCriadas = 0;

  for (const pilarEmpA of pilaresEmpresaA) {
    const rotinasGlobais = await prisma.rotina.findMany({
      where: { pilarId: pilarEmpA.pilarTemplateId! },
      orderBy: { ordem: 'asc' },
    });

    for (const rotinaGlobal of rotinasGlobais) {
      await prisma.rotinaEmpresa.upsert({
        where: {
          pilarEmpresaId_nome: {
            pilarEmpresaId: pilarEmpA.id,
            nome: rotinaGlobal.nome,
          },
        },
        update: {},
        create: {
          pilarEmpresaId: pilarEmpA.id,
          rotinaTemplateId: rotinaGlobal.id,
          nome: rotinaGlobal.nome,
          ordem: rotinaGlobal.ordem!,
          ativo: true,
        },
      });
      rotinasEmpresaCriadas++;
    }
  }

  for (const pilarEmpB of pilaresEmpresaB) {
    const rotinasGlobais = await prisma.rotina.findMany({
      where: { pilarId: pilarEmpB.pilarTemplateId! },
      orderBy: { ordem: 'asc' },
    });

    for (const rotinaGlobal of rotinasGlobais) {
      await prisma.rotinaEmpresa.upsert({
        where: {
          pilarEmpresaId_nome: {
            pilarEmpresaId: pilarEmpB.id,
            nome: rotinaGlobal.nome,
          },
        },
        update: {},
        create: {
          pilarEmpresaId: pilarEmpB.id,
          rotinaTemplateId: rotinaGlobal.id,
          nome: rotinaGlobal.nome,
          ordem: rotinaGlobal.ordem!,
          ativo: true,
        },
      });
      rotinasEmpresaCriadas++;
    }
  }

  console.log(`✅ ${rotinasEmpresaCriadas} rotinas vinculadas às empresas`);

  // ========================================
  // 8. CRIAR ALGUNS DIAGNÓSTICOS INICIAIS
  // ========================================

  // Preencher algumas notas na Empresa A
  const rotinasEmpresaA = await prisma.rotinaEmpresa.findMany({
    where: {
      pilarEmpresa: {
        empresaId: empresaA.id,
      },
    },
    take: 5, // Apenas primeiras 5
  });

  for (const rotinaEmp of rotinasEmpresaA) {
    // Buscar ou criar NotaRotina
    const existingNota = await prisma.notaRotina.findFirst({
      where: { rotinaEmpresaId: rotinaEmp.id },
    });

    if (!existingNota) {
      await prisma.notaRotina.create({
        data: {
          rotinaEmpresaId: rotinaEmp.id,
          nota: Math.floor(Math.random() * 11), // 0-10
          criticidade: ['ALTO', 'MEDIO', 'BAIXO'][Math.floor(Math.random() * 3)] as Criticidade,
        },
      });
    }
  }

  console.log(`✅ Diagnósticos iniciais criados para Empresa A`);

  // ========================================
  // 9. RESUMO FINAL
  // ========================================

  console.log('\n🎉 E2E Seed completed!');
  console.log('\n📊 Resumo:');
  console.log(`   - 4 perfis`);
  console.log(`   - 2 empresas`);
  console.log(`   - 4 usuários`);
  console.log(`   - ${pilaresCriados.length} pilares globais`);
  console.log(`   - ${rotinasCriadas} rotinas globais`);
  console.log(`   - ${pilaresEmpresaA.length + pilaresEmpresaB.length} pilares vinculados`);
  console.log(`   - ${rotinasEmpresaCriadas} rotinas vinculadas`);
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Email: admin@reiche.com.br | Senha: Admin@123');
  console.log('   Email: gestor@empresa-a.com | Senha: Admin@123');
  console.log('   Email: gestor@empresa-b.com | Senha: Admin@123');
  console.log('   Email: colab@empresa-a.com | Senha: Admin@123');
}

main()
  .catch((e) => {
    console.error('❌ E2E Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
