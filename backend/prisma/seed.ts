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
 * - 6 pilares completos (ESTRATÉGICO, MARKETING, VENDAS, PESSOAS, FINANCEIRO, COMPRAS/ESTOQUE)
 * - 60 rotinas profissionais (10 por pilar)
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

  const pilaresData = [
    {
      nome: 'ESTRATÉGICO',
      descricao: 'Pilar responsável por planejamento e estratégias empresariais',
      ordem: 1,
      rotinas: [
        {
          nome: 'DEFINIÇÃO E ALINHAMENTO COM O TIME DE MISSÃO, VISÃO E VALORES (DO CEO ATÉ A OPERAÇÃO)',
          descricao: 'Estabelecimento e comunicação dos princípios fundamentais da empresa',
          ordem: 1,
        },
        {
          nome: 'GESTÃO DO ORGANOGRAMA DA EMPRESA E MAPEAMENTO DOS CARGOS E FUNÇÕES',
          descricao: 'Organização e definição clara da estrutura hierárquica e responsabilidades',
          ordem: 2,
        },
        {
          nome: 'ELABORAÇÃO E APRESENTAÇÃO DO REGULAMENTO INTERNO PARA GARANTIR REGRAS E PADRÕES DA EMPRESA',
          descricao: 'Criação e divulgação de normas internas para manter a ordem e a conformidade',
          ordem: 3,
        },
        {
          nome: 'DEFINIÇÃO DE METAS ANUAIS E DESDOBRAMENTO DE METAS MÊS A MÊS',
          descricao: 'Estabelecimento de objetivos anuais e seu detalhamento mensal para acompanhamento',
          ordem: 4,
        },
        {
          nome: 'ROTINA DE REUNIÃO MENSAL: PARA ANÁLISE DOS RESULTADOS (POR ÁREA E INDICADOR)',
          descricao: 'Encontros mensais para avaliação de desempenho e indicadores por setor',
          ordem: 5,
        },
        {
          nome: 'ROTINA DE REUNIÃO SEMANAL: PARA ALINHAMENTO 1 A 1 (COM LÍDERES DE CADA ÁREA)',
          descricao: 'Reuniões semanais individuais para alinhamento entre líderes e suas equipes',
          ordem: 6,
        },
        {
          nome: 'ROTINA DE REUNIÃO DIÁRIA: PARA ALINHAMENTO DO TIME (FOCO NAS ROTINAS E PADRÕES)',
          descricao: 'Reuniões diárias para alinhamento rápido e foco nas rotinas e padrões',
          ordem: 7,
        },
        {
          nome: 'ROTINA DE TREINAMENTO E FORMAÇÃO DE NOVAS LIDERANÇAS PARA AS POSIÇÕES CRÍTICAS',
          descricao: 'Programas de treinamento e desenvolvimento para preparar novas lideranças',
          ordem: 8,
        },
        {
          nome: 'AÇÕES DE DESENVOLVIMENTO E FORTALECIMENTO DA CULTURA ORGANIZACIONAL',
          descricao: 'Iniciativas para fortalecer e desenvolver a cultura da empresa',
          ordem: 9,
        },
        {
          nome: 'ROTINA DE ANÁLISE DE CONCORRENTES E TENDÊNCIAS DE MERCADO PARA O SETOR (RISCOS E OPORTUNIDADES)',
          descricao: 'Monitoramento e análise de concorrentes e tendências para identificar riscos e oportunidades',
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
          descricao: 'Análise detalhada do perfil do cliente ideal, estudo de concorrentes e tendências do mercado',
          ordem: 1,
        },
        {
          nome: 'GESTÃO DE PÁGINAS, SITES, GOOGLE MEU NEGÓCIO',
          descricao: 'Gerenciamento e manutenção de páginas web, sites corporativos e perfil do Google Meu Negócio',
          ordem: 2,
        },
        {
          nome: 'GESTÃO DAS REDES SOCIAIS E CRIAÇÃO DE CONTEÚDOS ORGÂNICOS/VIRAIS',
          descricao: 'Administração de redes sociais e produção de conteúdo orgânico com potencial viral',
          ordem: 3,
        },
        {
          nome: 'ROTINAS DE SOCIAL SELLER (PROSPECÇÃO ATIVA NAS REDES SOCIAIS)',
          descricao: 'Estratégias de vendas sociais e prospecção ativa através das redes sociais',
          ordem: 4,
        },
        {
          nome: 'GESTÃO DE TRÁFEGO PAGO/ANÚNCIOS ONLINE',
          descricao: 'Planejamento, execução e otimização de campanhas pagas em plataformas digitais',
          ordem: 5,
        },
        {
          nome: 'PARCERIAS COM EMPRESAS E NEGÓCIOS ESTRATÉGICOS',
          descricao: 'Desenvolvimento e gestão de parcerias comerciais estratégicas',
          ordem: 6,
        },
        {
          nome: 'GESTÃO DE GRUPO VIP NO WHATSAPP/MENSAGENS VIA LISTA DE TRANSMISSÃO',
          descricao: 'Gerenciamento de grupos VIP e listas de transmissão para comunicação segmentada',
          ordem: 7,
        },
        {
          nome: 'ROTINA DE LIVES SHOP PARA DIVULGAÇÃO DE PRODUTOS/OFERTAS ESPECIAIS',
          descricao: 'Planejamento e execução de transmissões ao vivo para vendas e promoções',
          ordem: 8,
        },
        {
          nome: 'PARCERIAS COM INFLUENCERS E PROFISSIONAIS DO NICHO',
          descricao: 'Desenvolvimento de parcerias com influenciadores digitais e especialistas do setor',
          ordem: 9,
        },
        {
          nome: 'ELABORAÇÃO DE MATERIAIS, FOLDERS, PANFLETOS INSTITUCIONAIS, CARTAZES, ETC',
          descricao: 'Criação de materiais gráficos e institucionais para comunicação offline',
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
          nome: 'EXECUÇÃO DIÁRIA DA AMPULHETA DE VENDAS (DA PROSPECÇÃO ATÉ A VENDA E INDICAÇÕES)',
          descricao: 'Processo completo de vendas desde a prospecção até pós-venda e indicações',
          ordem: 1,
        },
        {
          nome: 'GESTÃO CONTÍNUA DA BASE DE CLIENTES (ATIVOS E INATIVOS)',
          descricao: 'Gerenciamento e acompanhamento da carteira de clientes ativos e inativos',
          ordem: 2,
        },
        {
          nome: 'ROTINA/SCRIPT DE ATENDIMENTO PRESENCIAL EM LOJA OU VIA WHATSAPP',
          descricao: 'Padronização do atendimento ao cliente nos canais presenciais e digitais',
          ordem: 3,
        },
        {
          nome: 'DIAGNÓSTICO DO CLIENTE E MAPEAMENTO DAS NECESSIDADES (AMPULHETA DE VENDAS)',
          descricao: 'Identificação e análise das necessidades do cliente para propostas personalizadas',
          ordem: 4,
        },
        {
          nome: 'ROTINA DE COLETA E DIVULGAÇÃO DE PROVAS SOCIAIS',
          descricao: 'Coleta de depoimentos, avaliações e cases de sucesso para divulgação',
          ordem: 5,
        },
        {
          nome: 'ROTINA DE FOLLOWUP DE PROPOSTAS EM ABERTO PARA CLIENTES',
          descricao: 'Acompanhamento e follow-up de propostas comerciais pendentes',
          ordem: 6,
        },
        {
          nome: 'ELABORAÇÃO E CONSTRUÇÃO DE ORÇAMENTOS PARA O CLIENTE',
          descricao: 'Criação de orçamentos e propostas comerciais customizadas',
          ordem: 7,
        },
        {
          nome: 'ROTINA DE QUEBRA DE OBJEÇÕES E USO DE GATILHOS MENTAIS',
          descricao: 'Técnicas de vendas para superar objeções e aplicar gatilhos mentais',
          ordem: 8,
        },
        {
          nome: 'ROTINA DE UPSELL, DOWNSELL, CROSSELL E COMBOS NAS NEGOCIAÇÕES',
          descricao: 'Estratégias de maximização de vendas através de ofertas complementares',
          ordem: 9,
        },
        {
          nome: 'GESTÃO DE FERRAMENTAS DE AUTOMAÇÃO E I.A. (INTELIGÊNCIA ARTIFICIAL)',
          descricao: 'Utilização de ferramentas tecnológicas para otimizar o processo de vendas',
          ordem: 10,
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
          descricao: 'Processos de atração, seleção e contratação de novos talentos',
          ordem: 1,
        },
        {
          nome: 'TREINAMENTO INTRODUTÓRIO NA CULTURA E REG. INTERNO PARA NOVOS FUNCIONÁRIOS',
          descricao: 'Onboarding e integração de novos colaboradores na cultura organizacional',
          ordem: 2,
        },
        {
          nome: 'TREINAMENTO E CAPACITAÇÃO DE COLABORADORES NAS SUAS FUNÇÕES (COM FLUXOGRAMAS)',
          descricao: 'Desenvolvimento de competências técnicas e comportamentais dos colaboradores',
          ordem: 3,
        },
        {
          nome: 'AVALIAÇÃO DE DESEMPENHO DOS FUNCIONÁRIOS',
          descricao: 'Processo estruturado de avaliação de performance e resultados',
          ordem: 4,
        },
        {
          nome: 'ROTINA DE FEEDBACKS COM FUNCIONÁRIOS (1 A 1) LÍDERES E LIDERADOS',
          descricao: 'Conversas individuais de feedback e desenvolvimento entre líderes e liderados',
          ordem: 5,
        },
        {
          nome: 'ROTINAS TREINAMENTO E CAPACITAÇÃO DAS LIDERANÇAS DA EMPRESA',
          descricao: 'Desenvolvimento e formação de líderes e gestores',
          ordem: 6,
        },
        {
          nome: 'GESTÃO DA FOLHA DE PAGAMENTO E DA REMUNERAÇÃO VARIÁVEL',
          descricao: 'Administração de salários, benefícios e programas de remuneração variável',
          ordem: 7,
        },
        {
          nome: 'AÇÕES DE PREMIAÇÃO, BONIFICAÇÃO E DE PROMOÇÃO DA MERITOCRACIA',
          descricao: 'Programas de reconhecimento e recompensa por resultados e desempenho',
          ordem: 8,
        },
        {
          nome: 'PESQUISA DE CLIMA ORGANIZACIONAL PARA PADRONIZAÇÃO DE BOAS PRÁTICAS E AÇÕES CORRETIVAS',
          descricao: 'Avaliação do ambiente de trabalho e implementação de melhorias',
          ordem: 9,
        },
        {
          nome: 'ROTINAS DE PROCESSO DEMISSIONAL E ENTREVISTA DE DESLIGAMENTO (SE APLICÁVEL)',
          descricao: 'Gestão de desligamentos e coleta de feedbacks de saída',
          ordem: 10,
        },
      ],
    },
    {
      nome: 'FINANCEIRO',
      descricao: 'Pilar responsável por gestão financeira e controles econômicos',
      ordem: 5,
      rotinas: [
        {
          nome: 'ROTINAS DE CONTAS A PAGAR (GESTÃO DE MULTAS E JUROS EM DIA)',
          descricao: 'Gerenciamento de pagamentos e controle de vencimentos para evitar multas',
          ordem: 1,
        },
        {
          nome: 'ROTINAS DE CONTAS A RECEBER (GESTÃO DA CONSTRUÇÃO DE UM CAIXA FORTE)',
          descricao: 'Controle de recebimentos e estratégias para fortalecimento do caixa',
          ordem: 2,
        },
        {
          nome: 'GESTÃO DO FLUXO DE CAIXA (GESTÃO DA PREVISIBILIDADE DA EMPRESA MÊS A MÊS E PRÓ LABORE DOS SÓCIOS)',
          descricao: 'Projeção e controle do fluxo de caixa incluindo retirada dos sócios',
          ordem: 3,
        },
        {
          nome: 'FECHAMENTO MENSAL DOS RESULTADOS E ANÁLISE DA DRE DA EMPRESA',
          descricao: 'Análise das demonstrações financeiras e resultados mensais',
          ordem: 4,
        },
        {
          nome: 'ROTINAS DE PRECIFICAÇÃO E ANÁLISE DAS MARGENS DE LUCRO',
          descricao: 'Definição de preços e monitoramento de rentabilidade dos produtos/serviços',
          ordem: 5,
        },
        {
          nome: 'GESTÃO MATRICIAL DE CUSTOS E DESPESAS (CONTROLE LINHA A LINHA DE TODOS OS GASTOS)',
          descricao: 'Controle detalhado e categorizado de todos os custos e despesas',
          ordem: 6,
        },
        {
          nome: 'GESTÃO MATRICIAL DE RECEITAS E VENDAS (CONTROLE DE VOLUME E LUCRO)',
          descricao: 'Acompanhamento detalhado das receitas por categoria e produto/serviço',
          ordem: 7,
        },
        {
          nome: 'ROTINA DE EMISSÃO DE NOTAS FISCAIS',
          descricao: 'Processo de emissão e gestão de documentos fiscais',
          ordem: 8,
        },
        {
          nome: 'GESTÃO DE INADIMPLENTES',
          descricao: 'Controle e cobrança de clientes com pagamentos em atraso',
          ordem: 9,
        },
        {
          nome: 'GESTÃO DO FUNDO DE RESERVA E PRÓ-LABORE DOS SÓCIOS',
          descricao: 'Administração de reservas financeiras e distribuição de lucros aos sócios',
          ordem: 10,
        },
      ],
    },
    {
      nome: 'COMPRAS/ESTOQUE',
      descricao: 'Pilar responsável por compras, estoque e logística',
      ordem: 6,
      rotinas: [
        {
          nome: 'ANÁLISE E CADASTRO DE FORNECEDORES',
          descricao: 'Avaliação, seleção e cadastro de fornecedores estratégicos',
          ordem: 1,
        },
        {
          nome: 'ROTINA DE COTAÇÃO DE PREÇOS',
          descricao: 'Processo de pesquisa e comparação de preços entre fornecedores',
          ordem: 2,
        },
        {
          nome: 'ROTINA DE EXECUÇÃO DE COMPRAS',
          descricao: 'Processo de efetivação de pedidos e compras',
          ordem: 3,
        },
        {
          nome: 'RECEBIMENTO E CONFERÊNCIA DE MERCADORIAS',
          descricao: 'Verificação e validação de produtos recebidos',
          ordem: 4,
        },
        {
          nome: 'GESTÃO DO ESTOQUE E ANÁLISE DE NÍVEIS CRÍTICOS',
          descricao: 'Controle de inventário e monitoramento de níveis mínimos',
          ordem: 5,
        },
        {
          nome: 'ROTINAS DE ESTOCAGEM',
          descricao: 'Organização e armazenamento adequado de produtos',
          ordem: 6,
        },
        {
          nome: 'ROTINAS DE TROCAS E DEVOLUÇÕES',
          descricao: 'Processo de gestão de devoluções e trocas de produtos',
          ordem: 7,
        },
        {
          nome: 'COMPRAS DE MATERIAL ADMINISTRATIVO',
          descricao: 'Aquisição de materiais de escritório e suprimentos',
          ordem: 8,
        },
        {
          nome: 'ROTINAS DE ALMOXARIFADO',
          descricao: 'Gestão e controle do almoxarifado e materiais',
          ordem: 9,
        },
        {
          nome: 'ROTINA DE LIMPEZA DO ESTOQUE',
          descricao: 'Processo de eliminação de produtos obsoletos ou com baixo giro',
          ordem: 10,
        },
      ],
    },
  ];

  const pilaresCriados = [];
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
      const rotinaExistente = await prisma.rotina.findFirst({
        where: {
          nome: rotinaData.nome,
          pilarId: pilar.id,
        },
      });

      if (!rotinaExistente) {
        await prisma.rotina.create({
          data: {
            nome: rotinaData.nome,
            descricao: rotinaData.descricao,
            ordem: rotinaData.ordem,
            ativo: true,
            pilarId: pilar.id,
          },
        });
        totalRotinasCriadas++;
      }
    }
  }

  console.log(`✅ ${pilaresCriados.length} pilares criados`);
  console.log(`✅ ${totalRotinasCriadas} rotinas criadas`);

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
      } else if (rotinaEmp.pilarEmpresa.nome === 'COMPRAS/ESTOQUE') {
        notaBase = 3; // Fraco em compras/estoque
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

  // Criar Cockpit de Marketing
  const cockpitMarketing = await prisma.cockpitPilar.upsert({
    where: {
      pilarEmpresaId: pilarMarketingA.id,
    },
    update: {},
    create: {
      pilarEmpresaId: pilarMarketingA.id,
    },
  });

  console.log(`✅ Cockpit de Marketing criado - ID: ${cockpitMarketing.id}`);

  // Criar 5 indicadores para o cockpit de Marketing
  const indicadoresData = [
    {
      nome: 'Leads Gerados',
      descricao: 'Total de leads captados através de todas as fontes de marketing',
      tipoMedida: 'QUANTIDADE' as const,
      statusMedicao: 'MEDIDO_CONFIAVEL' as const,
      melhor: 'MAIOR' as const,
      ordem: 1,
    },
    {
      nome: 'Taxa de Conversão',
      descricao: 'Percentual de leads que se tornam clientes',
      tipoMedida: 'PERCENTUAL' as const,
      statusMedicao: 'MEDIDO_CONFIAVEL' as const,
      melhor: 'MAIOR' as const,
      ordem: 2,
    },
    {
      nome: 'CAC (Custo de Aquisição de Cliente)',
      descricao: 'Investimento médio necessário para conquistar um novo cliente',
      tipoMedida: 'REAL' as const,
      statusMedicao: 'MEDIDO_CONFIAVEL' as const,
      melhor: 'MENOR' as const,
      ordem: 3,
    },
    {
      nome: 'ROI de Campanhas',
      descricao: 'Retorno sobre investimento das campanhas de marketing',
      tipoMedida: 'PERCENTUAL' as const,
      statusMedicao: 'MEDIDO_CONFIAVEL' as const,
      melhor: 'MAIOR' as const,
      ordem: 4,
    },
    {
      nome: 'Engajamento nas Redes Sociais',
      descricao: 'Média de interações (curtidas, comentários, compartilhamentos) nas redes sociais',
      tipoMedida: 'QUANTIDADE' as const,
      statusMedicao: 'MEDIDO_CONFIAVEL' as const,
      melhor: 'MAIOR' as const,
      ordem: 5,
    },
  ];

  // Responsáveis para os indicadores (distribuindo entre gestorA e colaboradorA)
  const responsaveisIndicadores = [gestorA, colaboradorA, gestorA, colaboradorA, gestorA];

  const indicadoresCriados = [];
  for (let i = 0; i < indicadoresData.length; i++) {
    const indData = indicadoresData[i];
    const responsavel = responsaveisIndicadores[i];

    const indicador = await prisma.indicadorCockpit.upsert({
      where: {
        cockpitPilarId_nome: {
          cockpitPilarId: cockpitMarketing.id,
          nome: indData.nome,
        },
      },
      update: {
        responsavelMedicaoId: responsavel.id,
      },
      create: {
        cockpitPilarId: cockpitMarketing.id,
        nome: indData.nome,
        descricao: indData.descricao,
        tipoMedida: indData.tipoMedida,
        statusMedicao: indData.statusMedicao,
        melhor: indData.melhor,
        ordem: indData.ordem,
        responsavelMedicaoId: responsavel.id,
        ativo: true,
      },
    });
    indicadoresCriados.push(indicador);
  }

  console.log(`✅ ${indicadoresCriados.length} indicadores criados para Cockpit de Marketing`);
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

  // Dados específicos por indicador (ajustados para a realidade de cada métrica)
  const indicadoresValores = [
    {
      nome: 'Leads Gerados',
      valores: todosMesesData, // Quantidade
    },
    {
      nome: 'Taxa de Conversão',
      valores: [
        { mes: 3, ano: 2025, meta: 12.0, realizado: 11.5, historico: 10.0 },
        { mes: 4, ano: 2025, meta: 12.5, realizado: 13.0, historico: 10.5 },
        { mes: 5, ano: 2025, meta: 13.0, realizado: 12.8, historico: 11.0 },
        { mes: 6, ano: 2025, meta: 13.5, realizado: 13.2, historico: 11.5 },
        { mes: 7, ano: 2025, meta: 14.0, realizado: 14.5, historico: 12.0 },
        { mes: 8, ano: 2025, meta: 14.0, realizado: 13.8, historico: 12.5 },
        { mes: 9, ano: 2025, meta: 14.5, realizado: 14.2, historico: 13.0 },
        { mes: 10, ano: 2025, meta: 15.0, realizado: 15.5, historico: 13.5 },
        { mes: 11, ano: 2025, meta: 15.5, realizado: 15.8, historico: 14.0 },
        { mes: 12, ano: 2025, meta: 16.0, realizado: 16.2, historico: 14.5 },
        { mes: 1, ano: 2026, meta: 16.5, realizado: 16.8, historico: 15.0 },
        { mes: 2, ano: 2026, meta: 17.0, realizado: 17.3, historico: 15.5 },
      ], // Percentual
    },
    {
      nome: 'CAC (Custo de Aquisição de Cliente)',
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
      nome: 'ROI de Campanhas',
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
      ], // Percentual
    },
    {
      nome: 'Engajamento nas Redes Sociais',
      valores: [
        { mes: 3, ano: 2025, meta: 1200, realizado: 1100, historico: 800 },
        { mes: 4, ano: 2025, meta: 1300, realizado: 1400, historico: 900 },
        { mes: 5, ano: 2025, meta: 1400, realizado: 1350, historico: 1000 },
        { mes: 6, ano: 2025, meta: 1500, realizado: 1550, historico: 1100 },
        { mes: 7, ano: 2025, meta: 1600, realizado: 1650, historico: 1200 },
        { mes: 8, ano: 2025, meta: 1600, realizado: 1580, historico: 1300 },
        { mes: 9, ano: 2025, meta: 1700, realizado: 1750, historico: 1400 },
        { mes: 10, ano: 2025, meta: 1700, realizado: 1680, historico: 1500 },
        { mes: 11, ano: 2025, meta: 1800, realizado: 1850, historico: 1600 },
        { mes: 12, ano: 2025, meta: 1900, realizado: 1920, historico: 1700 },
        { mes: 1, ano: 2026, meta: 2000, realizado: 2050, historico: 1800 },
        { mes: 2, ano: 2026, meta: 2100, realizado: 2150, historico: 1900 },
      ], // Quantidade
    },
  ];

  // Criar valores mensais para TODOS os 5 indicadores
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

      if (!existing) {
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
  console.log(`   - ${pilaresCriados.length} pilares globais (ESTRATÉGICO, MARKETING, VENDAS, PESSOAS, FINANCEIRO, COMPRAS/ESTOQUE)`);
  console.log(`   - ${totalRotinasCriadas} rotinas globais (10 por pilar)`);
  console.log(`   - ${pilaresEmpresaA.length + pilaresEmpresaB.length} pilares vinculados às empresas`);
  console.log(`   - ${rotinasEmpresaCriadas} rotinas vinculadas às empresas`);
  console.log(`   - ${notasCriadas} diagnósticos criados`);
  console.log(`   - ${trimestres.length} períodos de avaliação`);
  console.log(`   - ${evoluçõesCriadas} registros de evolução`);
  console.log(`   - 1 cockpit de Marketing`);
  console.log(`   - 5 indicadores de Marketing (com responsáveis vinculados)`);
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
