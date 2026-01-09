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
  console.log(`   - 4 perfis de usuário`);
  console.log(`   - 2 empresas`);
  console.log(`   - 4 usuários`);
  console.log(`   - ${pilaresCriados.length} pilares globais (ESTRATÉGICO, MARKETING, VENDAS, PESSOAS, FINANCEIRO, COMPRAS/ESTOQUE)`);
  console.log(`   - ${totalRotinasCriadas} rotinas globais (10 por pilar)`);
  console.log(`   - ${pilaresEmpresaA.length + pilaresEmpresaB.length} pilares vinculados às empresas`);
  console.log(`   - ${rotinasEmpresaCriadas} rotinas vinculadas às empresas`);
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
