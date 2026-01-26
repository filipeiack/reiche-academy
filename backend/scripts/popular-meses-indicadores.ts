/**
 * Script para popular meses de indicadores para empresas com período de mentoria
 * 
 * Uso: npx ts-node scripts/popular-meses-indicadores.ts
 */

/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function popularMesesIndicadores() {
  console.log('🔍 Buscando empresas com período de mentoria ativo...\n');

  // Buscar todas as empresas com período ativo
  const empresas = await prisma.empresa.findMany({
    where: {
      ativo: true,
    },
    include: {
      periodosMentoria: {
        where: { ativo: true },
      },
    },
  });

  console.log(`✅ Encontradas ${empresas.length} empresas ativas\n`);

  for (const empresa of empresas) {
    const periodoAtivo = empresa.periodosMentoria[0];

    if (!periodoAtivo) {
      console.log(`⏭️  Empresa "${empresa.nome}" - Sem período de mentoria ativo\n`);
      continue;
    }

    console.log(`📊 Empresa: ${empresa.nome}`);
    console.log(`   Período ${periodoAtivo.numero}: ${periodoAtivo.dataInicio.toISOString().split('T')[0]} a ${periodoAtivo.dataFim.toISOString().split('T')[0]}`);

    // Buscar indicadores da empresa
    const indicadores = await prisma.indicadorCockpit.findMany({
      where: {
        cockpitPilar: {
          pilarEmpresa: {
            empresaId: empresa.id,
          },
        },
        ativo: true,
      },
      include: {
        mesesIndicador: {
          where: {
            periodoMentoriaId: periodoAtivo.id,
          },
        },
      },
    });

    console.log(`   Indicadores ativos: ${indicadores.length}`);

    const indicadoresSemMeses = indicadores.filter(
      (ind: any) => ind.mesesIndicador.length === 0
    );

    if (indicadoresSemMeses.length === 0) {
      console.log(`   ✅ Todos os indicadores já têm meses criados\n`);
      continue;
    }

    console.log(`   ⚠️  Indicadores sem meses: ${indicadoresSemMeses.length}`);

    // Criar meses para indicadores sem meses
    const anoInicio = periodoAtivo.dataInicio.getUTCFullYear();
    const mesesParaCriar = [];

    for (const indicador of indicadoresSemMeses) {
      console.log(`      - "${indicador.nome}"`);

      // Criar 12 meses + resumo anual
      for (let mes = 1; mes <= 12; mes++) {
        mesesParaCriar.push({
          indicadorCockpitId: indicador.id,
          mes,
          ano: anoInicio,
          periodoMentoriaId: periodoAtivo.id,
          createdBy: null,
          updatedBy: null,
        });
      }

      // Resumo anual
      mesesParaCriar.push({
        indicadorCockpitId: indicador.id,
        mes: null,
        ano: anoInicio,
        periodoMentoriaId: periodoAtivo.id,
        createdBy: null,
        updatedBy: null,
      });
    }

    // Inserir em lote
    if (mesesParaCriar.length > 0) {
      const resultado = await prisma.indicadorMensal.createMany({
        data: mesesParaCriar,
      });

      console.log(`   ✅ Criados ${resultado.count} meses para ${indicadoresSemMeses.length} indicadores\n`);
    }
  }

  console.log('✅ Processo concluído!');
}

popularMesesIndicadores()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
