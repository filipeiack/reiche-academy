import { PrismaClient, Criticidade } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Seed completo para testes E2E
 * 
 * Cria dados previsíveis e conhecidos para validar testes E2E:
 * - 4 perfis de usuário (ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA)
 * - 2 empresas (Empresa A e Empresa B)
 * - 4 usuários (admin, gestor-a, gestor-b, colaborador-a)
 * - 7 pilares completos (ESTRATÉGICO, MARKETING, VENDAS, PESSOAS, FINANCEIRO, COMPRAS, GESTÃO DO ESTOQUE)
 * - Rotinas profissionais por pilar (conforme catálogo)
 * - Vinculação de pilares e rotinas às empresas
 * - Diagnósticos iniciais para Empresa A
 * 
 * Para executar: npm run seed
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
  // 2.1. PERÍODOS DE MENTORIA (retroativo)
  // ========================================

  const { addYears } = await import('date-fns');

  // Data de início padrão: 01/03/2025
  const dataInicioDefault = new Date(2025, 2, 1); // Março de 2025

  // Criar período de mentoria retroativo para Empresa A
  const periodoMentoriaA = await prisma.periodoMentoria.upsert({
    where: {
      empresaId_numero: {
        empresaId: empresaA.id,
        numero: 1,
      },
    },
    update: {},
    create: {
      empresaId: empresaA.id,
      numero: 1,
      dataInicio: dataInicioDefault,
      dataFim: addYears(dataInicioDefault, 1),
      ativo: true,
      createdBy: null, // Seed não tem usuário
    },
  });

  // Criar período de mentoria retroativo para Empresa B
  const periodoMentoriaB = await prisma.periodoMentoria.upsert({
    where: {
      empresaId_numero: {
        empresaId: empresaB.id,
        numero: 1,
      },
    },
    update: {},
    create: {
      empresaId: empresaB.id,
      numero: 1,
      dataInicio: dataInicioDefault,
      dataFim: addYears(dataInicioDefault, 1),
      ativo: true,
      createdBy: null, // Seed não tem usuário
    },
  });

  console.log(`✅ 2 períodos de mentoria criados:`);
  console.log(`   - Empresa A: Período ${periodoMentoriaA.numero} (${periodoMentoriaA.dataInicio.toISOString().split('T')[0]} - ${periodoMentoriaA.dataFim.toISOString().split('T')[0]})`);
  console.log(`   - Empresa B: Período ${periodoMentoriaB.numero} (${periodoMentoriaB.dataInicio.toISOString().split('T')[0]} - ${periodoMentoriaB.dataFim.toISOString().split('T')[0]})`);

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
      nome: 'Flavio Gestor Empresa A',
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
      nome: 'Bruno Gestor Empresa B',
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
      nome: 'Carlos Colaborador Empresa A',
      senha,
      perfilId: perfilColab.id,
      cargo: 'Analista',
      ativo: true,
      empresaId: empresaA.id,
    },
  });

  const perfilLeitura = await prisma.perfilUsuario.findUnique({ where: { codigo: 'LEITURA' } });
  const leituraA = await prisma.usuario.upsert({
    where: { email: 'leitura@empresa-a.com' },
    update: {},
    create: {
      email: 'leitura@empresa-a.com',
      nome: 'Marina Leitura Empresa A',
      senha,
      perfilId: perfilLeitura!.id,
      cargo: 'Consultor',
      ativo: true,
      empresaId: empresaA.id,
    },
  });

  console.log(`✅ 5 usuários criados:`);
  console.log(`   - ${admin.email} (senha: Admin@123)`);
  console.log(`   - ${gestorA.email} (senha: Admin@123)`);
  console.log(`   - ${gestorB.email} (senha: Admin@123)`);
  console.log(`   - ${colaboradorA.email} (senha: Admin@123)`);
  console.log(`   - ${leituraA.email} (senha: Admin@123)`);


  // ========================================
  // 4. PILARES GLOBAIS COMPLETOS
  // ========================================

  type RotinaSeed = {
    nome: string;
    criticidade: Criticidade;
    ordem: number;
    descricao?: string;
  };

  type PilarSeed = {
    nome: string;
    descricao: string;
    ordem: number;
    rotinas: RotinaSeed[];
  };

  const pilaresData: PilarSeed[] = [
    {
      nome: 'ESTRATÉGICO',
      descricao: 'Pilar responsável por planejamento e estratégias empresariais',
      ordem: 1,
      rotinas: [
        {
          nome: 'DEFINIÇÃO E ALINHAMENTO COM O TIME DE  MISSÃO, VISÃO E VALORES (DO CEO ATÉ A OPERAÇÃO)',
          criticidade: 'ALTA',
          ordem: 1,
        },
        {
          nome: 'GESTÃO DO ORGANOGRAMA DA EMPRESA  E MAPEAMENTO DOS CARGOS E FUNÇÕES',
          criticidade: 'ALTA',
          ordem: 2,
        },
        {
          nome: 'ELABORAÇÃO E APRESENTAÇÃO DO REGULAMENTO INTERNO PARA GARANTIR REGRAS E PADRÕES DA EMPRESA',
          criticidade: 'ALTA',
          ordem: 3,
        },
        {
          nome: 'DEFINIÇÃO DE METAS ANUAIS E  DESDOBRAMENTO DE METAS MÊS A MÊS',
          criticidade: 'ALTA',
          ordem: 4,
        },
        {
          nome: 'ROTINA DE REUNIÃO MENSAL: PARA ANÁLISE DOS RESULTADOS (POR ÁREA E INDICADOR)',
          criticidade: 'ALTA',
          ordem: 5,
        },
        {
          nome: 'ROTINA DE REUNIÃO SEMANAL:PARA ALINHAMENTO 1 A 1 (COM LÍDERES DE CADA ÁREA)',
          criticidade: 'ALTA',
          ordem: 6,
        },
        {
          nome: 'ROTINA DE REUNIÃO DIÁRIA:PARA ALINHAMENTO DO TIME (FOCO NAS ROTINAS E PADRÕES)',
          criticidade: 'ALTA',
          ordem: 7,
        },
        {
          nome: 'ROTINA DE TREINAMENTO E FORMAÇÃO DE NOVAS LIDERANÇAS PARA AS POSIÇÕES CRÍTICAS',
          criticidade: 'MEDIA',
          ordem: 8,
        },
        {
          nome: 'AÇÕES DE DESENOLVIMENTO E FORTALECIMENTO DA CULTURA ORGANIZACIONAL',
          criticidade: 'BAIXA',
          ordem: 9,
        },
        {
          nome: 'ROTINA DE ANÁLISE DE CONCORRENTES E TENDÊNCIAS DE MERCADO PARA O SETOR (RISCOS E OPORTUNIDADES)',
          criticidade: 'BAIXA',
          ordem: 10,
        },
      ],
    },
    {
      nome: 'MARKETING',
      descricao: 'Pilar responsável por marketing e geração de leads',
      ordem: 2,
      rotinas: [
        {
          nome: 'RAIO-X DO CLIENTE DOS SONHOS, ANÁLISE DA CONCORRÊNCIA E ESTUDO DE MERCADO',
          criticidade: 'ALTA',
          ordem: 1,
        },
        {
          nome: 'GESTÃO DE PÁGINAS, SITES, GOOGLE MEU NEGÓCIO',
          criticidade: 'ALTA',
          ordem: 2,
        },
        {
          nome: 'GESTÃO DAS REDES SOCIAIS E  CRIAÇÃO DE CONTEÚDOS ORGÂNICOS/VIRAIS',
          criticidade: 'ALTA',
          ordem: 3,
        },
        {
          nome: 'ROTINAS DE SOCIAL SELLER (PROSPECÇÃO ATIVA NAS REDES SOCIAIS)',
          criticidade: 'ALTA',
          ordem: 4,
        },
        {
          nome: 'GESTÃO DE TRÁFEGO PAGO/ANÚNCIOS ONLINE',
          criticidade: 'ALTA',
          ordem: 5,
        },
        {
          nome: 'PARCERIAS COM EMPRESAS E NEGÓCIOS ESTRATÉGICOS',
          criticidade: 'MEDIA',
          ordem: 6,
        },
        {
          nome: 'GESTÃO DE GRUPO VIP NO WHATSAPP/ MENSAGENS VIA LISTA DE TRANSMISSÃO',
          criticidade: 'MEDIA',
          ordem: 7,
        },
        {
          nome: 'LIVES SHOP PARA DIVULGAÇÃO DE PRODUTOS, OFERTAS E GERAÇÃO DE AUTORIDADE',
          criticidade: 'MEDIA',
          ordem: 8,
        },
        {
          nome: 'PARCERIAS COM INFLUENCERS E PROFISSIONAIS DO SEU NICHO',
          criticidade: 'BAIXA',
          ordem: 9,
        },
        {
          nome: 'ELABORAÇÃO DE MATERIAIS, FOLDERS, PANFLETOS INSTITUCIONAIS, CARTAZES, ETC',
          criticidade: 'BAIXA',
          ordem: 10,
        },
      ],
    },
    {
      nome: 'VENDAS',
      descricao: 'Pilar responsável por vendas e relacionamento com clientes',
      ordem: 3,
      rotinas: [
        {
          nome: 'CONTROLE DE METAS E INDICADORES DA ÁREA',
          criticidade: 'ALTA',
          ordem: 1,
        },
        {
          nome: 'GESTÃO DA BASE DE LEADS PARA ATENDIMENTO',
          criticidade: 'ALTA',
          ordem: 2,
        },
        {
          nome: 'PROSPECÇÃO ATIVA DE NOVOS CLIENTES',
          criticidade: 'ALTA',
          ordem: 3,
        },
        {
          nome: 'ATENDIMENTO E DIAGNÓSTICO DAS NECESSIDADES DO CLIENTE',
          criticidade: 'ALTA',
          ordem: 4,
        },
        {
          nome: 'ELABORAÇÃO DE PROPOSTAS COMERCIAIS',
          criticidade: 'ALTA',
          ordem: 5,
        },
        {
          nome: 'GESTÃO DAS PROPOSTAS EM ABERTO E FOLLOW UP DAS NEGOCIAÇÕES',
          criticidade: 'ALTA',
          ordem: 6,
        },
        {
          nome: 'GESTÃO PÓS VENDA PARA ENCANTAMENTO DOS CLIENTES',
          criticidade: 'MEDIA',
          ordem: 7,
        },
        {
          nome: 'GESTÃO DA CARTEIRA DE CLIENTES PARA NOVAS OFERTAS (COMBOS, UPSELL, DOWNSELL)',
          criticidade: 'MEDIA',
          ordem: 8,
        },
      ],
    },
    {
      nome: 'PESSOAS',
      descricao: 'Pilar responsável por gestão de pessoas e recursos humanos',
      ordem: 4,
      rotinas: [
        {
          nome: 'ROTINAS DE RECRUTAMENTO E SELEÇÃO DE NOVOS COLABORADORES',
          criticidade: 'ALTA',
          ordem: 1,
        },
        {
          nome: 'TREINAMENTO INTRODUTÓRIO NA CULTURA E REG. INTERNO PARA NOVOS FUNCIONÁRIOS',
          criticidade: 'ALTA',
          ordem: 2,
        },
        {
          nome: 'TREINAMENTO E CAPACITAÇÃO DE COLABORADORES NAS SUAS FUNÇÕES (COM FLUXOGRAMAS)',
          criticidade: 'ALTA',
          ordem: 3,
        },
        {
          nome: 'AVALIAÇÃO DE DESEMPENHODOS FUNIONÁRIOS',
          criticidade: 'ALTA',
          ordem: 4,
        },
        {
          nome: 'ROTINA DE FEEDBACKS COM FUNCIONÁRIOS (1 A 1) LÍDERES E LIDERADOS',
          criticidade: 'ALTA',
          ordem: 5,
        },
        {
          nome: 'ROTINAS TREINAMENTO E CAPACITAÇÃO DAS LIDERANÇAS DA EMPRESA',
          criticidade: 'MEDIA',
          ordem: 6,
        },
        {
          nome: 'GESTÃO DA FOLHA DE PAGAMENTO E DA REMUNERAÇÃO VARIÁVEL',
          criticidade: 'MEDIA',
          ordem: 7,
        },
        {
          nome: 'AÇÕES DE PREMIAÇÃO, BONIFICAÇÃO E DE PROMOÇÃO DA MERITOCRACIA',
          criticidade: 'MEDIA',
          ordem: 8,
        },
        {
          nome: 'PESQUISA DE CLIMA ORGANIZACIONAL PARA PADRONIZAÇÃO DE BOAS PRÁTICAS E AÇÕES CORRETIVAS',
          criticidade: 'MEDIA',
          ordem: 9,
        },
        {
          nome: 'ROTINAS DE PROCESSO DEMISSIONAL E ENTREVISTA DE DESLIGAMENTO (SE APLICÁVEL)',
          criticidade: 'BAIXA',
          ordem: 10,
        },
      ],
    },
    {
      nome: 'FINANCEIRO',
      descricao: 'Pilar responsável por gestão financeira e controle de caixa',
      ordem: 5,
      rotinas: [
        {
          nome: 'ROTINAS DE CONTAS A PAGAR (GESTÃO DE MULTAS E JUROS EM DIA)',
          criticidade: 'ALTA',
          ordem: 1,
        },
        {
          nome: 'ROTINAS DE CONTAS A RECEBER (GESTÃO DA CONSTRUÇÃO DE UM CAIXA FORTE)',
          criticidade: 'ALTA',
          ordem: 2,
        },
        {
          nome: 'GESTÃO DO FLUXO DE CAIXA (GESTÃO DA PREVISIBILIDADE DA EMPRESA MÊS A MÊS E PRÓ LABORE DOS SÓCIOS)',
          criticidade: 'ALTA',
          ordem: 3,
        },
        {
          nome: 'FECHAMENTO MENSAL DOS RESULTADOS E ANÁLISE DA DRE DA EMPRESA',
          criticidade: 'ALTA',
          ordem: 4,
        },
        {
          nome: 'ROTINAS DE PRECIFICAÇÃO E ANÁLISE DAS MARGENS DE LUCRO',
          criticidade: 'ALTA',
          ordem: 5,
        },
        {
          nome: 'GESTÃO MATRICIAL DE CUSTOS E DESPESAS (CONTROLE LINHA A LINHA DE TODOS OS GASTOS)',
          criticidade: 'ALTA',
          ordem: 6,
        },
        {
          nome: 'GESTÃO MATRICIAL DE RECEITAS E VENDAS (CONTROLE DE VOLUME E LUCRO)',
          criticidade: 'ALTA',
          ordem: 7,
        },
        {
          nome: 'ROTINA DE EMISSÃO DE NOTAS FISCAIS',
          criticidade: 'MEDIA',
          ordem: 8,
        },
        {
          nome: 'GESTÃO DE INADIMPLENTES',
          criticidade: 'MEDIA',
          ordem: 9,
        },
        {
          nome: 'GESTÃO DO FUNDO DE RESERVA  E PRÓ-LABORE DOS SÓCIOS',
          criticidade: 'BAIXA',
          ordem: 10,
        },
      ],
    },
    {
      nome: 'COMPRAS',
      descricao: 'Pilar responsável por compras e fornecedores',
      ordem: 6,
      rotinas: [
        {
          nome: 'ANÁLISE E CADASTRO DE FORNECEDORES',
          criticidade: 'ALTA',
          ordem: 1,
        },
        {
          nome: 'ROTINA DE COTAÇÃO E COMPARAÇÃO DE PREÇOS',
          criticidade: 'ALTA',
          ordem: 2,
        },
        {
          nome: 'APROVAÇÃO E LIBERAÇÃO DE COMPRAS CONFORME ALÇADA',
          criticidade: 'ALTA',
          ordem: 3,
        },
        {
          nome: 'NEGOCIAÇÃO DE PREÇOS, PRAZOS E CONDIÇÕES ESPECIAIS',
          criticidade: 'ALTA',
          ordem: 4,
        },
        {
          nome: 'EXECUÇÃO DO PEDIDO DE COMPRAS',
          criticidade: 'ALTA',
          ordem: 5,
        },
        {
          nome: 'ACOMPANHAMENTO DE PEDIDOS E PRAZOS DE ENTREGA',
          criticidade: 'MEDIA',
          ordem: 6,
        },
        {
          nome: 'GESTÃO DE CONTRATOS E ACORDOS COMERCIAIS',
          criticidade: 'MEDIA',
          ordem: 7,
        },
        {
          nome: 'CONTROLE DE CUSTOS E ECONOMIAS GERADAS PELO SETOR',
          criticidade: 'BAIXA',
          ordem: 8,
        },
      ],
    },
    {
      nome: 'GESTÃO DO ESTOQUE',
      descricao: 'Pilar responsável por gestão do estoque',
      ordem: 7,
      rotinas: [
        {
          nome: 'RECEBIMENTO E CONFERENCIA DE MERCADORIAS',
          criticidade: 'ALTA',
          ordem: 1,
        },
        {
          nome: 'ENDEREÇAMENTO E ORGANIZAÇÃO DO ESTOQUE',
          criticidade: 'ALTA',
          ordem: 2,
        },
        {
          nome: 'CONTROLE DE ENTRADAS E SAÍDAS',
          criticidade: 'ALTA',
          ordem: 3,
        },
        {
          nome: 'GESTÃO DE NÍVEIS MÍNIMOS, MÁXIMOS E CRÍTICOS',
          criticidade: 'ALTA',
          ordem: 4,
        },
        {
          nome: 'SEPARAÇÃO E LIBERAÇÃO DE MATERIAIS PARA USO OU VENDA',
          criticidade: 'ALTA',
          ordem: 5,
        },
        {
          nome: 'EXECUÇÃO DE INVENTÁRIOS PARA AJUSTE DE DIVERGÊNCIAS',
          criticidade: 'MEDIA',
          ordem: 6,
        },
        {
          nome: 'GESTÃO DE TROCAS DEVOLUÇÕES E AVARIAS',
          criticidade: 'MEDIA',
          ordem: 7,
        },
        {
          nome: 'LIMPEZA E PADRONIZAÇÃO DO ESTOQUE',
          criticidade: 'BAIXA',
          ordem: 8,
        },
      ],
    },
  ] as const;

  const pilaresCriados: { id: string; nome: string; descricao: string | null; ativo: boolean; createdAt: Date; updatedAt: Date; createdBy: string | null; updatedBy: string | null; ordem: number; }[] = [];
  const criticidadePorPilarRotina = new Map<string, Criticidade>();
  let totalRotinasCriadas = 0;

  for (const pilarData of pilaresData) {
    // Criar ou encontrar pilar
    let pilar = await prisma.pilar.findFirst({
      where: { nome: pilarData.nome },
    });

    if (!pilar) {
      pilar = await prisma.pilar.create({
        data: {
          nome: pilarData.nome,
          descricao: pilarData.descricao,
          ordem: pilarData.ordem,
          ativo: true,
        },
      });
    }
    pilaresCriados.push(pilar);

    // Criar rotinas do pilar
    for (const rotinaData of pilarData.rotinas) {
      criticidadePorPilarRotina.set(
        `${pilarData.nome}::${rotinaData.nome}`,
        rotinaData.criticidade,
      );

      const rotinaExistente = await prisma.rotina.findFirst({
        where: {
          nome: {
            equals: rotinaData.nome,
            mode: 'insensitive',
          },
        },
      });

      if (!rotinaExistente) {
        await prisma.rotina.create({
          data: {
            nome: rotinaData.nome,
            descricao: rotinaData.descricao ?? null,
            ordem: rotinaData.ordem,
            criticidade: rotinaData.criticidade,
            ativo: true,
            pilarId: pilar.id,
          },
        });
        totalRotinasCriadas++;
      } else {
        await prisma.rotina.update({
          where: { id: rotinaExistente.id },
          data: {
            descricao: rotinaData.descricao ?? null,
            ordem: rotinaData.ordem,
            criticidade: rotinaData.criticidade,
            pilarId: pilar.id,
          },
        });
      }
    }
  }

  console.log(`✅ ${pilaresCriados.length} pilares criados`);
  console.log(`✅ ${totalRotinasCriadas} rotinas criadas`);

  // ========================================
  // 5.1. OBJETIVOS TEMPLATES (1 por pilar)
  // ========================================

  const objetivosTemplatesData = [
    {
      pilarNome: 'ESTRATÉGICO',
      entradas: 'Sonhos e alvos no médio e curto prazo por parte da liderança da empresa,',
      saidas: 'Ações, definições rotinas inegociáveis que fazem parte do dia a dia da empresa,',
      missao: 'Criar uma cultura forte com a visão de longo prazo da liderança através de ações que irão nortear a empresa,',
    },
    {
      pilarNome: 'MARKETING',
      entradas: 'Estudo do mercado e perfil de cliente dos sonhos,',
      saidas: 'Elaboração e execução de campanhar para captação de leads qualificados,',
      missao: 'Gerar leads qualificados que queiram ser atendidos pela nossa empresa,',
    },
    {
      pilarNome: 'VENDAS',
      entradas: 'Obter leads qualificados gerados pelo marketing,',
      saidas: 'Vendas realizadas para clientes antigos e novos clientes,',
      missao: 'Alavancar os resultados financeiros da empresa através das vendas,',
    },
    {
      pilarNome: 'PESSOAS',
      entradas: 'Mapeamento das necessidades internas e externas em relação a pessoas,',
      saidas: 'Equipe nova treinada e orientada e membros antigos desafiados diariamente e valorizados da forma correta,',
      missao: 'Otimizar os resultados da empresa através de um time bem orientado,',
    },
    {
      pilarNome: 'FINANCEIRO',
      entradas: 'Fatos e dados referentes à tudo que a empresa gasta ou recebe diariamente,',
      saidas: 'Números confiáveis para os principais indicadores que medem a saúde da empresa,',
      missao: 'Proporcionar à liderança da empresa, fatos e dados confiáveis para tomada de decisões,',
    },
    {
      pilarNome: 'COMPRAS',
      entradas: 'Gestão e execução das requisições internas e necessidades estratégicas,',
      saidas: 'Operação abastecida com custo e qualidade controlados,',
      missao: 'Comprar bem, no tempo certo, para sustentar a operação e proteger o resultado,',
    },
    {
      pilarNome: 'GESTÃO DO ESTOQUE',
      entradas: 'Gestão dos materiais, insumos e produtos adquiridos,',
      saidas: 'Produtos liberados para uso, venda ou produção dentro dos prazos necessários,',
      missao: 'Garantir disponibilidade sem excesso,',
    },
  ];

  let objetivosTemplatesCriados = 0;

  for (const objetivo of objetivosTemplatesData) {
    const pilar = pilaresCriados.find((item) => item.nome === objetivo.pilarNome);

    if (!pilar) {
      throw new Error(`Pilar não encontrado para objetivo template: ${objetivo.pilarNome}`);
    }

    await (prisma as any).objetivoTemplate.upsert({
      where: { pilarId: pilar.id },
      update: {
        entradas: objetivo.entradas,
        saidas: objetivo.saidas,
        missao: objetivo.missao,
      },
      create: {
        pilarId: pilar.id,
        entradas: objetivo.entradas,
        saidas: objetivo.saidas,
        missao: objetivo.missao,
      },
    });

    objetivosTemplatesCriados++;
  }

  console.log(`✅ ${objetivosTemplatesCriados} objetivos templates criados/atualizados`);

  // ========================================
  // 5.2. INDICADORES TEMPLATES (Pilares)
  // ========================================

  const upsertIndicadoresTemplates = async (
    pilarNome: string,
    indicadores: Array<{
      nome: string;
      tipoMedida: 'REAL' | 'QUANTIDADE' | 'TEMPO' | 'PERCENTUAL';
      statusMedicao: 'NAO_MEDIDO' | 'MEDIDO_NAO_CONFIAVEL' | 'MEDIDO_CONFIAVEL';
      melhor: 'MAIOR' | 'MENOR';
      descricao: string;
      ordem: number;
    }>
  ) => {
    const pilarTemplate = pilaresCriados.find((item) => item.nome === pilarNome);

    if (!pilarTemplate) {
      throw new Error(`Pilar ${pilarNome} não encontrado para indicadores templates`);
    }

    for (const indicador of indicadores) {
      const existente = await (prisma as any).indicadorTemplate.findFirst({
        where: {
          pilarId: pilarTemplate.id,
          nome: {
            equals: indicador.nome,
            mode: 'insensitive',
          },
        },
      });

      if (!existente) {
        await (prisma as any).indicadorTemplate.create({
          data: {
            pilarId: pilarTemplate.id,
            nome: indicador.nome,
            descricao: indicador.descricao,
            tipoMedida: indicador.tipoMedida,
            statusMedicao: indicador.statusMedicao,
            melhor: indicador.melhor,
            ordem: indicador.ordem,
            ativo: true,
          },
        });
      } else {
        await (prisma as any).indicadorTemplate.update({
          where: { id: existente.id },
          data: {
            descricao: indicador.descricao,
            tipoMedida: indicador.tipoMedida,
            statusMedicao: indicador.statusMedicao,
            melhor: indicador.melhor,
            ordem: indicador.ordem,
            ativo: true,
          },
        });
      }
    }
  };

  await upsertIndicadoresTemplates('MARKETING', [
    {
      nome: 'GASTO TOTAL COM ANUNCIOS',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TOTAL INVESTIDO EM ANUNCIOS NO MÊS',
      ordem: 1,
    },
    {
      nome: 'VOLUME DE LEADS QUALIFICADOS GERADOS',
      tipoMedida: 'QUANTIDADE',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: '# POTENCIAIS CLIENTES CAPTURADOS',
      ordem: 2,
    },
    {
      nome: 'CUSTO AQUISIÇÃO DO CLIENTE (CAC)',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: 'TOTAL GASTO/NÚMERO DE CLIENTES ADQUIRIDOS',
      ordem: 3,
    },
    {
      nome: 'ROI DE MARKETING',
      tipoMedida: 'QUANTIDADE',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: 'FATURAMENTO TOTAL',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('VENDAS', [
    {
      nome: 'FATURAMENTO GLOBAL',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: 'TOTAL FATURADO NO MÊS',
      ordem: 1,
    },
    {
      nome: '# VENDAS REALIZADAS',
      tipoMedida: 'QUANTIDADE',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: 'NÚMERO DE VENDAS REALIZADAS NO MÊS',
      ordem: 2,
    },
    {
      nome: 'TICKET MÉDIO DAS VENDAS REALIZADAS',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: 'TOTAL FATURADO NO MÊS/ NÚMERO DE VENDAS',
      ordem: 3,
    },
    {
      nome: 'TAXA DE CONVERSÃO',
      tipoMedida: 'PERCENTUAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: '# PROPOSTAS FECHADAS / TOTAL DE PROPOSTAS ENVIADAS',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('PESSOAS', [
    {
      nome: 'TURNOVER',
      tipoMedida: 'PERCENTUAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: '% DE COLABORADORES QUE ENTRAM E SAEM DA EMPRESA',
      ordem: 1,
    },
    {
      nome: 'ABSENTEÍSMO',
      tipoMedida: 'QUANTIDADE',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: '# DE FALTAS OU ATRASO NÃO JUSTIFICADOS',
      ordem: 2,
    },
    {
      nome: 'TEMPO MÉDIO DE CONTRATAÇÃO',
      tipoMedida: 'TEMPO',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TEMPO ENTRE A SOLICITAÇÃO DA PESSOA E A CHEGADA DO NOVO COLABORADOR',
      ordem: 3,
    },
    {
      nome: 'CUSTO TOTAL COM HORAS EXTRAS',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TOTAL GASTO COM HORAS EXTRAS DE FUNCIONÁRIOS',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('FINANCEIRO', [
    {
      nome: 'FATURAMENTO MENSAL',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: 'VALOR VENDIDO PELA EMPRESA NO MÊS',
      ordem: 1,
    },
    {
      nome: 'DESPESAS FIXAS MENSAIS',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'VALOR QUE A EMPRESA CUSTA POR MÊS',
      ordem: 2,
    },
    {
      nome: 'MARGEM DE LUCRO LÍQUIDA',
      tipoMedida: 'PERCENTUAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MAIOR',
      descricao: 'LUCRO LÍQUIDO / RECEITA BRUTA × 100',
      ordem: 3,
    },
    {
      nome: 'ENDIVIDAMENTO',
      tipoMedida: 'PERCENTUAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'ENDIVIDAMENTO (%) = PASSIVO TOTAL / ATIVO TOTAL × 100',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('COMPRAS', [
    {
      nome: 'GASTO TOTAL COM COMPRAS',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TOTAL INVESTIDO EM COMPRAS NO MÊS',
      ordem: 1,
    },
    {
      nome: '# COMPRAS REALIZADAS NO MÊS',
      tipoMedida: 'QUANTIDADE',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TOTAL DE COMPRAS REALIZADAS NO MÊS',
      ordem: 2,
    },
    {
      nome: 'ÍNDICE DE COMPRAS EMERGENCIAIS',
      tipoMedida: 'PERCENTUAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TOTAL DE COMPRAS EMERGENCIAIS/ TOTAL DE COMPRAS REALIZADAS',
      ordem: 3,
    },
    {
      nome: 'TEMPO MÉDIO DE COMPRA',
      tipoMedida: 'TEMPO',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TEMPO ENTRE A SOLICITAÇÃO DA COMPRA E A CHEGADA DO ITEM',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('GESTÃO DO ESTOQUE', [
    {
      nome: 'VALOR TOTAL DO ESTOQUE',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TOTAL EM R$ IMOBILIZADO EM ESTOQUE',
      ordem: 1,
    },
    {
      nome: 'RUPTURA DE ESTOQUE',
      tipoMedida: 'QUANTIDADE',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: '# DE VENDAS PERDIDAS POR FALTA DE PRODUTO',
      ordem: 2,
    },
    {
      nome: 'TOTAL EM PERDAS E AVARIAS',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: 'TOTAL GASTO COM PERDAS E AVARIAS',
      ordem: 3,
    },
    {
      nome: 'TOTAL DE TROCAS E DEVOLUÇÕES',
      tipoMedida: 'REAL',
      statusMedicao: 'NAO_MEDIDO',
      melhor: 'MENOR',
      descricao: '# DE TROCAS OU PRODUTOS DEVOLVIDOS',
      ordem: 4,
    },
  ]);

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
    const pilarNome = pilaresCriados.find((p) => p.id === pilarEmpA.pilarTemplateId)?.nome;
    const rotinasGlobais = await prisma.rotina.findMany({
      where: { pilarId: pilarEmpA.pilarTemplateId! },
      orderBy: { ordem: 'asc' },
    });

    for (const rotinaGlobal of rotinasGlobais) {
      const criticidade = pilarNome
        ? criticidadePorPilarRotina.get(`${pilarNome}::${rotinaGlobal.nome}`)
        : undefined;

      await prisma.rotinaEmpresa.upsert({
        where: {
          pilarEmpresaId_nome: {
            pilarEmpresaId: pilarEmpA.id,
            nome: rotinaGlobal.nome,
          },
        },
        update: {
          criticidade,
        },
        create: {
          pilarEmpresaId: pilarEmpA.id,
          rotinaTemplateId: rotinaGlobal.id,
          nome: rotinaGlobal.nome,
          ordem: rotinaGlobal.ordem!,
          criticidade,
          ativo: true,
        },
      });
      rotinasEmpresaCriadas++;
    }
  }

  for (const pilarEmpB of pilaresEmpresaB) {
    const pilarNome = pilaresCriados.find((p) => p.id === pilarEmpB.pilarTemplateId)?.nome;
    const rotinasGlobais = await prisma.rotina.findMany({
      where: { pilarId: pilarEmpB.pilarTemplateId! },
      orderBy: { ordem: 'asc' },
    });

    for (const rotinaGlobal of rotinasGlobais) {
      const criticidade = pilarNome
        ? criticidadePorPilarRotina.get(`${pilarNome}::${rotinaGlobal.nome}`)
        : undefined;

      await prisma.rotinaEmpresa.upsert({
        where: {
          pilarEmpresaId_nome: {
            pilarEmpresaId: pilarEmpB.id,
            nome: rotinaGlobal.nome,
          },
        },
        update: {
          criticidade,
        },
        create: {
          pilarEmpresaId: pilarEmpB.id,
          rotinaTemplateId: rotinaGlobal.id,
          nome: rotinaGlobal.nome,
          ordem: rotinaGlobal.ordem!,
          criticidade,
          ativo: true,
        },
      });
      rotinasEmpresaCriadas++;
    }
  }

  console.log(`✅ ${rotinasEmpresaCriadas} rotinas vinculadas às empresas`);

  // ========================================
  // 8. CRIAR DIAGNÓSTICOS INICIAIS (NOTAS EM TODOS OS PILARES)
  // ========================================

  // Buscar todas as rotinas de todos os pilares da Empresa A
  const todasRotinasEmpresaA = await prisma.rotinaEmpresa.findMany({
    where: {
      pilarEmpresa: {
        empresaId: empresaA.id,
      },
    },
    include: {
      pilarEmpresa: true,
    },
  });

  let notasCriadas = 0;

  for (const rotinaEmp of todasRotinasEmpresaA) {
    // Buscar ou criar NotaRotina
    const existingNota = await prisma.notaRotina.findFirst({
      where: { rotinaEmpresaId: rotinaEmp.id },
    });

    if (!existingNota) {
      // Criar notas variadas por pilar para simular diferentes níveis de maturidade
      let notaBase = 5;

      // Pilares com notas diferentes para simular realidade
      if (rotinaEmp.pilarEmpresa.nome === 'ESTRATÉGICO') {
        notaBase = 7; // Empresa mais madura no estratégico
      } else if (rotinaEmp.pilarEmpresa.nome === 'VENDAS') {
        notaBase = 8; // Boa em vendas
      } else if (rotinaEmp.pilarEmpresa.nome === 'MARKETING') {
        notaBase = 4; // Precisa melhorar marketing
      } else if (rotinaEmp.pilarEmpresa.nome === 'FINANCEIRO') {
        notaBase = 6; // Razoável no financeiro
      } else if (rotinaEmp.pilarEmpresa.nome === 'PESSOAS') {
        notaBase = 5; // Mediano em pessoas
      } else if (rotinaEmp.pilarEmpresa.nome === 'COMPRAS') {
        notaBase = 3; // Fraco em compras
      } else if (rotinaEmp.pilarEmpresa.nome === 'GESTÃO DO ESTOQUE') {
        notaBase = 3; // Fraco em estoque
      }

      // Adicionar variação de -2 a +2 à nota base
      const variacao = Math.floor(Math.random() * 5) - 2; // -2, -1, 0, 1, 2
      const notaFinal = Math.max(0, Math.min(10, notaBase + variacao));

      // Definir criticidade baseada na nota
      let criticidade: Criticidade;
      if (notaFinal >= 7) {
        criticidade = 'BAIXA';
      } else if (notaFinal >= 4) {
        criticidade = 'MEDIA';
      } else {
        criticidade = 'ALTA';
      }

      await prisma.notaRotina.create({
        data: {
          rotinaEmpresaId: rotinaEmp.id,
          nota: notaFinal,
          criticidade,
        },
      });
      notasCriadas++;
    }
  }

  console.log(`✅ ${notasCriadas} diagnósticos criados para Empresa A (todos os pilares)`);

  // ========================================
  // 9. CRIAR EVOLUÇÃO DOS PILARES (4 TRIMESTRES)
  // ========================================

  // Calcular médias atuais de cada pilar da Empresa A
  const pilaresComMedia = await Promise.all(
    pilaresEmpresaA.map(async (pilarEmp) => {
      // Buscar todas as notas das rotinas deste pilar
      const notas = await prisma.notaRotina.findMany({
        where: {
          rotinaEmpresa: {
            pilarEmpresaId: pilarEmp.id,
          },
        },
      });

      // Calcular média
      const somaNotas = notas.reduce((acc, n) => acc + (n.nota || 0), 0);
      const media = notas.length > 0 ? somaNotas / notas.length : 0;

      return {
        pilarEmpresaId: pilarEmp.id,
        nome: pilarEmp.nome,
        mediaAtual: media,
      };
    })
  );

  // Criar registros de evolução para 4 datas diferentes (trimestres)
  const hoje = new Date();
  const trimestres = [
    new Date(hoje.getFullYear(), hoje.getMonth() - 9, 1), // 3 trimestres atrás
    new Date(hoje.getFullYear(), hoje.getMonth() - 6, 1), // 2 trimestres atrás
    new Date(hoje.getFullYear(), hoje.getMonth() - 3, 1), // 1 trimestre atrás
    hoje, // trimestre atual
  ];

  // Criar períodos de avaliação para Empresa Teste A (um por trimestre)
  // Os 3 primeiros períodos são congelados (histórico), o último permanece aberto
  const periodosMap = new Map<string, string>();

  for (let i = 0; i < trimestres.length; i++) {
    const dataRef = trimestres[i];
    const trimestreNum = Math.floor(dataRef.getMonth() / 3) + 1; // 1-4
    const ano = dataRef.getFullYear();

    // Apenas o último período (atual) permanece aberto
    const isAberto = i === trimestres.length - 1;
    const dataCongelamento = isAberto
      ? null
      : new Date(dataRef.getFullYear(), dataRef.getMonth() + 3, 15, 10, 0, 0); // 15 dias após o fim do trimestre

    const periodo = await prisma.periodoAvaliacao.upsert({
      where: {
        empresaId_trimestre_ano: {
          empresaId: empresaA.id,
          trimestre: trimestreNum,
          ano,
        },
      },
      update: {
        dataReferencia: dataRef,
        aberto: isAberto,
        dataCongelamento,
      },
      create: {
        empresaId: empresaA.id,
        trimestre: trimestreNum,
        ano,
        dataReferencia: dataRef,
        aberto: isAberto,
        dataCongelamento,
      },
    });

    periodosMap.set(`${trimestreNum}-${ano}`, periodo.id);
  }

  console.log(`✅ ${trimestres.length} períodos de avaliação criados para ${empresaA.nome} (${trimestres.length - 1} congelados, 1 aberto)`);

  let evoluçõesCriadas = 0;

  for (const pilarComMedia of pilaresComMedia) {
    for (let i = 0; i < trimestres.length; i++) {
      const dataRegistro = trimestres[i];
      const trimestreNum = Math.floor(dataRegistro.getMonth() / 3) + 1;
      const periodoKey = `${trimestreNum}-${dataRegistro.getFullYear()}`;
      const periodoId = periodosMap.get(periodoKey);

      if (!periodoId) {
        throw new Error(`Período de avaliação não encontrado para chave ${periodoKey}`);
      }

      // Simular evolução gradual: começar com nota mais baixa e evoluir até a média atual
      // Por exemplo: se média atual é 7, começar em 4 e evoluir gradualmente
      const mediaFinal = pilarComMedia.mediaAtual;
      const evolucaoFactor = (i + 1) / trimestres.length; // 0.25, 0.5, 0.75, 1.0

      // Começar com 60% da nota final no primeiro trimestre e evoluir até 100%
      const mediaBase = mediaFinal * 0.6;
      const diferenca = mediaFinal - mediaBase;
      const mediaNoTrimestre = mediaBase + (diferenca * evolucaoFactor);

      // Adicionar pequena variação aleatória (-0.3 a +0.3)
      const variacao = (Math.random() - 0.5) * 0.6;
      const mediaComVariacao = Math.max(0, Math.min(10, mediaNoTrimestre + variacao));

      await prisma.pilarEvolucao.upsert({
        where: {
          pilarEmpresaId_periodoAvaliacaoId: {
            pilarEmpresaId: pilarComMedia.pilarEmpresaId,
            periodoAvaliacaoId: periodoId,
          },
        },
        update: {
          mediaNotas: parseFloat(mediaComVariacao.toFixed(2)),
          updatedAt: dataRegistro,
        },
        create: {
          pilarEmpresaId: pilarComMedia.pilarEmpresaId,
          periodoAvaliacaoId: periodoId,
          mediaNotas: parseFloat(mediaComVariacao.toFixed(2)),
          createdAt: dataRegistro,
          updatedAt: dataRegistro,
        },
      });
      evoluçõesCriadas++;
    }
  }

  console.log(`✅ ${evoluçõesCriadas} registros de evolução criados (${trimestres.length} trimestres para ${pilaresComMedia.length} pilares)`);

  // ========================================
  // 10. COCKPIT DE MARKETING + INDICADORES
  // ========================================

  // Encontrar o pilar de Marketing da Empresa A
  const pilarMarketingA = pilaresEmpresaA.find(p => p.nome === 'MARKETING');

  if (!pilarMarketingA) {
    throw new Error('Pilar de Marketing não encontrado para Empresa A');
  }

  const objetivoTemplateMarketing = pilarMarketingA.pilarTemplateId
    ? await (prisma as any).objetivoTemplate.findFirst({
      where: {
        pilarId: pilarMarketingA.pilarTemplateId,
      },
      orderBy: { createdAt: 'asc' },
    })
    : null;

  // Criar Cockpit de Marketing (respeitando template de objetivos)
  const cockpitMarketing = await prisma.cockpitPilar.upsert({
    where: {
      pilarEmpresaId: pilarMarketingA.id,
    },
    update: {
      entradas: objetivoTemplateMarketing?.entradas ?? null,
      saidas: objetivoTemplateMarketing?.saidas ?? null,
      missao: objetivoTemplateMarketing?.missao ?? null,
    },
    create: {
      pilarEmpresaId: pilarMarketingA.id,
      entradas: objetivoTemplateMarketing?.entradas ?? null,
      saidas: objetivoTemplateMarketing?.saidas ?? null,
      missao: objetivoTemplateMarketing?.missao ?? null,
    },
  });

  console.log(`✅ Cockpit de Marketing criado - ID: ${cockpitMarketing.id}`);

  // Criar indicadores a partir do template do pilar
  const indicadoresTemplates = pilarMarketingA.pilarTemplateId
    ? await (prisma as any).indicadorTemplate.findMany({
      where: {
        pilarId: pilarMarketingA.pilarTemplateId,
        ativo: true,
      },
      orderBy: { ordem: 'asc' },
    })
    : [];

  // Responsáveis para os indicadores (distribuindo entre gestorA e colaboradorA)
  const responsaveisIndicadores = [gestorA, colaboradorA];
  const anoAtual = new Date().getFullYear();

  const indicadoresCriados = [];
  for (let i = 0; i < indicadoresTemplates.length; i++) {
    const template = indicadoresTemplates[i];
    const responsavel = responsaveisIndicadores[i % responsaveisIndicadores.length];

    const indicador = await prisma.indicadorCockpit.upsert({
      where: {
        cockpitPilarId_nome: {
          cockpitPilarId: cockpitMarketing.id,
          nome: template.nome,
        },
      },
      update: {
        descricao: template.descricao,
        tipoMedida: template.tipoMedida,
        statusMedicao: template.statusMedicao,
        melhor: template.melhor,
        ordem: template.ordem,
        responsavelMedicaoId: responsavel.id,
        ativo: true,
      },
      create: {
        cockpitPilarId: cockpitMarketing.id,
        nome: template.nome,
        descricao: template.descricao,
        tipoMedida: template.tipoMedida,
        statusMedicao: template.statusMedicao,
        melhor: template.melhor,
        ordem: template.ordem,
        responsavelMedicaoId: responsavel.id,
        ativo: true,
      },
    });

    const mesesExistentes = await prisma.indicadorMensal.findMany({
      where: {
        indicadorCockpitId: indicador.id,
        ano: anoAtual,
      },
      select: { mes: true },
    });

    const mesesExistentesSet = new Set(mesesExistentes.map(m => m.mes));
    const meses = Array.from({ length: 12 }, (_, idx) => ({
      indicadorCockpitId: indicador.id,
      mes: idx + 1,
      ano: anoAtual,
    })).filter(mes => !mesesExistentesSet.has(mes.mes));

    if (meses.length > 0) {
      await prisma.indicadorMensal.createMany({ data: meses });
    }
    indicadoresCriados.push(indicador);
  }

  console.log(`✅ ${indicadoresCriados.length} indicadores criados para Cockpit de Marketing (templates)`);
  console.log(`   - Responsáveis vinculados: ${gestorA.nome}, ${colaboradorA.nome}`);

  // ========================================
  // 10.1. ASSOCIAR ROTINAS AOS PROCESSOS PRIORITÁRIOS
  // ========================================

  // Buscar todas as rotinas do pilar Marketing da Empresa A
  const rotinasMarketingA = await prisma.rotinaEmpresa.findMany({
    where: {
      pilarEmpresaId: pilarMarketingA.id,
      ativo: true,
    },
    orderBy: { ordem: 'asc' },
  });

  // Associar cada rotina como processo prioritário do cockpit
  let processosAssociados = 0;
  for (let i = 0; i < rotinasMarketingA.length; i++) {
    const rotina = rotinasMarketingA[i];

    const processo = await prisma.processoPrioritario.upsert({
      where: {
        cockpitPilarId_rotinaEmpresaId: {
          cockpitPilarId: cockpitMarketing.id,
          rotinaEmpresaId: rotina.id,
        },
      },
      update: {},
      create: {
        cockpitPilarId: cockpitMarketing.id,
        rotinaEmpresaId: rotina.id,
        ordem: i + 1,
      },
    });
    processosAssociados++;
  }

  console.log(`✅ ${processosAssociados} rotinas do Marketing associadas como processos prioritários`);

  // ========================================
  // 10.2. FLUXOGRAMA (1 rotina do Marketing)
  // ========================================

  const processoMarketing = await prisma.processoPrioritario.findFirst({
    where: { cockpitPilarId: cockpitMarketing.id },
    orderBy: { ordem: 'asc' },
  });

  if (processoMarketing) {
    const fluxoExistente = await prisma.processoFluxograma.findFirst({
      where: {
        processoPrioritarioId: processoMarketing.id,
        ordem: 1,
      },
    });

    if (!fluxoExistente) {
      await prisma.processoFluxograma.create({
        data: {
          processoPrioritarioId: processoMarketing.id,
          descricao: 'Mapear etapas do processo de marketing e pontos de controle.',
          ordem: 1,
        },
      });
    }
  }

  // ========================================
  // 10.3. CARGOS E FUNÇÕES (Marketing)
  // ========================================

  let cargoMarketing = await prisma.cargoCockpit.findFirst({
    where: {
      cockpitPilarId: cockpitMarketing.id,
      cargo: 'Analista de Marketing',
    },
  });

  if (!cargoMarketing) {
    cargoMarketing = await prisma.cargoCockpit.create({
      data: {
        cockpitPilarId: cockpitMarketing.id,
        cargo: 'Analista de Marketing',
        ordem: 1,
      },
    });
  }

  const funcoesData = [
    {
      descricao: 'Planejar campanhas e calendário editorial',
      nivelCritico: 'ALTA' as const,
      ordem: 1,
    },
    {
      descricao: 'Monitorar métricas e otimizar investimentos',
      nivelCritico: 'MEDIA' as const,
      ordem: 2,
    },
  ];

  for (const funcao of funcoesData) {
    const funcaoExistente = await prisma.funcaoCargo.findFirst({
      where: {
        cargoCockpitId: cargoMarketing.id,
        descricao: funcao.descricao,
      },
    });

    if (!funcaoExistente) {
      await prisma.funcaoCargo.create({
        data: {
          cargoCockpitId: cargoMarketing.id,
          descricao: funcao.descricao,
          nivelCritico: funcao.nivelCritico,
          ordem: funcao.ordem,
        },
      });
    }
  }

  // ========================================
  // 10.4. PLANOS DE AÇÃO (Marketing)
  // ========================================

  const hojeAcoes = new Date();
  const anoReferencia = hojeAcoes.getFullYear();
  const acoesData = [
    {
      acaoProposta: 'Revisar funil de leads e qualificação',
      indicadorNome: 'VOLUME DE LEADS QUALIFICADOS GERADOS',
      mesReferencia: 3,
      anoReferencia,
      causa1: 'Baixa aderência ao ICP nas campanhas atuais',
      causa2: 'Critérios de qualificação pouco claros para o time',
      causa3: 'Integração fraca entre formulários e CRM',
      causa4: 'Landing pages com baixa taxa de conversão',
      causa5: 'Segmentação de mídia paga desalinhada',
      status: 'PENDENTE' as const,
      responsavelId: gestorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 7),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 30),
    },
    {
      acaoProposta: 'Refinar qualificação e scoring de leads',
      indicadorNome: 'VOLUME DE LEADS QUALIFICADOS GERADOS',
      mesReferencia: 6,
      anoReferencia,
      causa1: 'Lead scoring baseado em dados incompletos',
      causa2: 'Baixa integração entre marketing e vendas',
      status: 'EM_ANDAMENTO' as const,
      responsavelId: colaboradorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() - 5),
      inicioReal: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() - 4),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 12),
    },
    {
      acaoProposta: 'Atualizar campanhas de tráfego pago',
      indicadorNome: 'GASTO TOTAL COM ANUNCIOS',
      mesReferencia: 4,
      anoReferencia,
      causa1: 'Criativos com fadiga e queda de CTR',
      causa2: 'Ajuste de público-alvo insuficiente',
      status: 'EM_ANDAMENTO' as const,
      responsavelId: colaboradorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() - 3),
      inicioReal: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() - 2),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 14),
    },
    {
      acaoProposta: 'Negociar mídia e otimizar orçamento mensal',
      indicadorNome: 'GASTO TOTAL COM ANUNCIOS',
      mesReferencia: 7,
      anoReferencia,
      causa1: 'Custos de mídia aumentaram acima do previsto',
      causa2: 'Distribuição de verba por canal sem revisão',
      status: 'PENDENTE' as const,
      responsavelId: gestorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 5),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 25),
    },
    {
      acaoProposta: 'Rever precificação e proposta de valor',
      indicadorNome: 'CUSTO AQUISIÇÃO DO CLIENTE (CAC)',
      mesReferencia: 5,
      anoReferencia,
      causa1: 'Ticket médio não cobre custo de aquisição',
      causa2: 'Pouca diferenciação percebida pelo cliente',
      status: 'PENDENTE' as const,
      responsavelId: gestorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 9),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 33),
    },
    {
      acaoProposta: 'Ajustar mix de canais para reduzir CAC',
      indicadorNome: 'CUSTO AQUISIÇÃO DO CLIENTE (CAC)',
      mesReferencia: 8,
      anoReferencia,
      causa1: 'Canais com baixa conversão ainda ativos',
      causa2: 'Remarketing sem segmentação adequada',
      status: 'EM_ANDAMENTO' as const,
      responsavelId: colaboradorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() - 2),
      inicioReal: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() - 1),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 18),
    },
    {
      acaoProposta: 'Implantar dashboard de ROI por canal',
      indicadorNome: 'ROI DE MARKETING',
      mesReferencia: 9,
      anoReferencia,
      causa1: 'Dados financeiros e de mídia dispersos',
      causa2: 'Ausência de visão consolidada por canal',
      status: 'EM_ANDAMENTO' as const,
      responsavelId: gestorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() - 1),
      inicioReal: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate()),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 20),
    },
    {
      acaoProposta: 'Auditar attribution e ROI por campanha',
      indicadorNome: 'ROI DE MARKETING',
      mesReferencia: 11,
      anoReferencia,
      causa1: 'Medição de conversões com janelas inconsistentes',
      causa2: 'UTMs e eventos sem padronização',
      status: 'PENDENTE' as const,
      responsavelId: gestorA.id,
      inicioPrevisto: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 12),
      prazo: new Date(hojeAcoes.getFullYear(), hojeAcoes.getMonth(), hojeAcoes.getDate() + 40),
    },
  ];

  for (const acao of acoesData) {
    const acaoExistente = await prisma.acaoCockpit.findFirst({
      where: {
        cockpitPilarId: cockpitMarketing.id,
        acaoProposta: acao.acaoProposta,
      },
    });

    if (!acaoExistente) {
      const indicador = indicadoresCriados.find(ind => ind.nome === acao.indicadorNome) ?? null;
      const indicadorMensal = indicador
        ? await prisma.indicadorMensal.findFirst({
          where: {
            indicadorCockpitId: indicador.id,
            ano: acao.anoReferencia,
            mes: acao.mesReferencia,
          },
        })
        : null;

      await prisma.acaoCockpit.create({
        data: {
          cockpitPilarId: cockpitMarketing.id,
          indicadorCockpitId: indicador?.id ?? null,
          indicadorMensalId: indicadorMensal?.id ?? null,
          causa1: acao.causa1,
          causa2: acao.causa2,
          causa3: acao.causa3,
          causa4: acao.causa4,
          causa5: acao.causa5,
          acaoProposta: acao.acaoProposta,
          responsavelId: acao.responsavelId,
          status: acao.status,
          inicioPrevisto: acao.inicioPrevisto,
          inicioReal: acao.inicioReal,
          prazo: acao.prazo,
          dataConclusao: acao.dataConclusao,
        },
      });
    }
  }

  // Dados de março/2025 a fevereiro/2026 (12 meses) para cada indicador
  const todosMesesData = [
    { mes: 3, ano: 2025, meta: 80, realizado: 75, historico: 65 },
    { mes: 4, ano: 2025, meta: 85, realizado: 90, historico: 70 },
    { mes: 5, ano: 2025, meta: 90, realizado: 88, historico: 72 },
    { mes: 6, ano: 2025, meta: 95, realizado: 92, historico: 75 },
    { mes: 7, ano: 2025, meta: 100, realizado: 105, historico: 80 },
    { mes: 8, ano: 2025, meta: 100, realizado: 98, historico: 82 },
    { mes: 9, ano: 2025, meta: 105, realizado: 110, historico: 85 },
    { mes: 10, ano: 2025, meta: 105, realizado: 102, historico: 87 },
    { mes: 11, ano: 2025, meta: 110, realizado: 115, historico: 90 },
    { mes: 12, ano: 2025, meta: 115, realizado: 118, historico: 92 },
    { mes: 1, ano: 2026, meta: 120, realizado: 122, historico: 95 },
    { mes: 2, ano: 2026, meta: 125, realizado: 130, historico: 98 },
  ];

  const gastoAnunciosData = [
    { mes: 3, ano: 2025, meta: 12000, realizado: 11000, historico: 10000 },
    { mes: 4, ano: 2025, meta: 12500, realizado: 12800, historico: 10500 },
    { mes: 5, ano: 2025, meta: 13000, realizado: 12700, historico: 11000 },
    { mes: 6, ano: 2025, meta: 13500, realizado: 13800, historico: 11500 },
    { mes: 7, ano: 2025, meta: 14000, realizado: 14500, historico: 12000 },
    { mes: 8, ano: 2025, meta: 14000, realizado: 13900, historico: 12500 },
    { mes: 9, ano: 2025, meta: 14500, realizado: 15000, historico: 13000 },
    { mes: 10, ano: 2025, meta: 15000, realizado: 14800, historico: 13500 },
    { mes: 11, ano: 2025, meta: 15500, realizado: 15800, historico: 14000 },
    { mes: 12, ano: 2025, meta: 16000, realizado: 16500, historico: 14500 },
    { mes: 1, ano: 2026, meta: 16500, realizado: 17000, historico: 15000 },
    { mes: 2, ano: 2026, meta: 17000, realizado: 17200, historico: 15500 },
  ];

  // Dados específicos por indicador (ajustados para a realidade de cada métrica)
  const indicadoresValores = [
    {
      nome: 'GASTO TOTAL COM ANUNCIOS',
      valores: gastoAnunciosData, // Real (R$)
    },
    {
      nome: 'VOLUME DE LEADS QUALIFICADOS GERADOS',
      valores: todosMesesData, // Quantidade
    },
    {
      nome: 'CUSTO AQUISIÇÃO DO CLIENTE (CAC)',
      valores: [
        { mes: 3, ano: 2025, meta: 450, realizado: 480, historico: 500 },
        { mes: 4, ano: 2025, meta: 440, realizado: 420, historico: 490 },
        { mes: 5, ano: 2025, meta: 430, realizado: 450, historico: 480 },
        { mes: 6, ano: 2025, meta: 420, realizado: 410, historico: 470 },
        { mes: 7, ano: 2025, meta: 410, realizado: 390, historico: 460 },
        { mes: 8, ano: 2025, meta: 400, realizado: 405, historico: 450 },
        { mes: 9, ano: 2025, meta: 390, realizado: 380, historico: 440 },
        { mes: 10, ano: 2025, meta: 380, realizado: 385, historico: 430 },
        { mes: 11, ano: 2025, meta: 370, realizado: 360, historico: 420 },
        { mes: 12, ano: 2025, meta: 360, realizado: 350, historico: 410 },
        { mes: 1, ano: 2026, meta: 350, realizado: 340, historico: 400 },
        { mes: 2, ano: 2026, meta: 340, realizado: 330, historico: 390 },
      ], // Real (R$)
    },
    {
      nome: 'ROI DE MARKETING',
      valores: [
        { mes: 3, ano: 2025, meta: 250, realizado: 240, historico: 200 },
        { mes: 4, ano: 2025, meta: 260, realizado: 280, historico: 210 },
        { mes: 5, ano: 2025, meta: 270, realizado: 265, historico: 220 },
        { mes: 6, ano: 2025, meta: 280, realizado: 290, historico: 230 },
        { mes: 7, ano: 2025, meta: 290, realizado: 310, historico: 240 },
        { mes: 8, ano: 2025, meta: 300, realizado: 295, historico: 250 },
        { mes: 9, ano: 2025, meta: 310, realizado: 320, historico: 260 },
        { mes: 10, ano: 2025, meta: 320, realizado: 315, historico: 270 },
        { mes: 11, ano: 2025, meta: 330, realizado: 340, historico: 280 },
        { mes: 12, ano: 2025, meta: 340, realizado: 350, historico: 290 },
        { mes: 1, ano: 2026, meta: 350, realizado: 360, historico: 300 },
        { mes: 2, ano: 2026, meta: 360, realizado: 370, historico: 310 },
      ], // Quantidade
    },
  ];

  // Criar valores mensais para TODOS os indicadores do template
  let totalValoresCriados = 0;
  for (const indicadorData of indicadoresValores) {
    const indicador = indicadoresCriados.find(ind => ind.nome === indicadorData.nome);
    if (!indicador) continue;

    for (const mesData of indicadorData.valores) {
      // Verificar se já existe registro
      const existing = await prisma.indicadorMensal.findFirst({
        where: {
          indicadorCockpitId: indicador.id,
          ano: mesData.ano,
          mes: mesData.mes,
        },
      });

      if (existing) {
        await prisma.indicadorMensal.update({
          where: { id: existing.id },
          data: {
            meta: mesData.meta,
            realizado: mesData.realizado,
            historico: mesData.historico,
          },
        });
        totalValoresCriados++;
      } else {
        await prisma.indicadorMensal.create({
          data: {
            indicadorCockpitId: indicador.id,
            ano: mesData.ano,
            mes: mesData.mes,
            meta: mesData.meta,
            realizado: mesData.realizado,
            historico: mesData.historico,
          },
        });
        totalValoresCriados++;
      }
    }

    const countMeses = indicadorData.valores.length;
    console.log(`✅ ${countMeses} valores mensais criados para "${indicadorData.nome}"`);
  }

  console.log(`\n✅ Total de ${totalValoresCriados} valores mensais criados para todos os indicadores da Empresa A`);

  // ========================================
  // 11. RESUMO FINAL
  // ========================================

  console.log('\n🎉 E2E Seed completed!');
  console.log('\n📊 Resumo:');
  console.log(`   - 4 perfis de usuário`);
  console.log(`   - 2 empresas`);
  console.log(`   - 2 períodos de mentoria`);
  console.log(`   - 5 usuários`);
  console.log(`   - ${pilaresCriados.length} pilares globais (ESTRATÉGICO, MARKETING, VENDAS, PESSOAS, FINANCEIRO, COMPRAS, GESTÃO DO ESTOQUE)`);
  console.log(`   - ${totalRotinasCriadas} rotinas globais (total)`);
  console.log(`   - ${pilaresEmpresaA.length + pilaresEmpresaB.length} pilares vinculados às empresas`);
  console.log(`   - ${rotinasEmpresaCriadas} rotinas vinculadas às empresas`);
  console.log(`   - ${notasCriadas} diagnósticos criados`);
  console.log(`   - ${trimestres.length} períodos de avaliação`);
  console.log(`   - ${evoluçõesCriadas} registros de evolução`);
  console.log(`   - 1 cockpit de Marketing`);
  console.log(`   - ${indicadoresCriados.length} indicadores de Marketing (com responsáveis vinculados)`);
  console.log(`   - ${processosAssociados} processos prioritários (rotinas do Marketing associadas)`);
  console.log(`   - ${totalValoresCriados} valores mensais (meta, realizado, histórico para 12 meses em cada indicador)`);
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Email: admin@reiche.com.br | Senha: Admin@123 (ADMINISTRADOR)');
  console.log('   Email: gestor@empresa-a.com | Senha: Admin@123 (GESTOR - Empresa A)');
  console.log('   Email: colab@empresa-a.com | Senha: Admin@123 (COLABORADOR - Empresa A)');
  console.log('   Email: leitura@empresa-a.com | Senha: Admin@123 (LEITURA - Empresa A)');
  console.log('   Email: gestor@empresa-b.com | Senha: Admin@123 (GESTOR - Empresa B)');
}

main()
  .catch((e) => {
    console.error('❌ E2E Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
