import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inserindo rotinas padrão dos pilares...\n');

  // Definir pilares e suas rotinas
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

  let totalPilaresCriados = 0;
  let totalPilaresExistentes = 0;
  let totalRotinasCriadas = 0;
  let totalRotinasExistentes = 0;

  for (const pilarData of pilaresData) {
    // Verificar se o pilar já existe
    let pilar = await prisma.pilar.findFirst({
      where: { nome: pilarData.nome },
    });

    // Se não existir, criar o pilar
    if (!pilar) {
      pilar = await prisma.pilar.create({
        data: {
          nome: pilarData.nome,
          descricao: pilarData.descricao,
          ordem: pilarData.ordem,
          modelo: true,
          ativo: true,
        },
      });
      totalPilaresCriados++;
      console.log(`✅ Pilar ${pilarData.nome} criado`);
    } else {
      totalPilaresExistentes++;
      console.log(`ℹ️  Pilar ${pilarData.nome} já existe`);
    }

    // Inserir as rotinas do pilar
    let rotinasCriadas = 0;
    let rotinasExistentes = 0;

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
            modelo: true,
            ativo: true,
            pilarId: pilar.id,
          },
        });
        rotinasCriadas++;
        totalRotinasCriadas++;
      } else {
        rotinasExistentes++;
        totalRotinasExistentes++;
      }
    }

    console.log(`   📝 ${rotinasCriadas} rotinas criadas, ${rotinasExistentes} já existiam\n`);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 RESUMO FINAL:');
  console.log(`   Pilares criados: ${totalPilaresCriados}`);
  console.log(`   Pilares já existentes: ${totalPilaresExistentes}`);
  console.log(`   Rotinas criadas: ${totalRotinasCriadas}`);
  console.log(`   Rotinas já existentes: ${totalRotinasExistentes}`);
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 Processo concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao inserir rotinas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
