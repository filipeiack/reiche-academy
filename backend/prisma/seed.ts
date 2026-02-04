import { PrismaClient, Criticidade } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

/**
 * Seed paar produção
 *
 * Cria dados base necessários para operação:
 * - 4 perfis de usuário (ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA)
 * - Usuário administrador padrão
 * - 7 pilares completos (ESTRATÉGICO, MARKETING, VENDAS, PESSOAS, FINANCEIRO, COMPRAS, GESTÃO DO ESTOQUE)
 * - Rotinas profissionais por pilar (conforme catálogo)
 *
 * Para executar: npm run seed
 */

async function main() {
  console.log('🚀 Starting production seed...');

  await prisma.$executeRaw`SET timezone TO 'America/Sao_Paulo'`;


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

  if (!perfilAdmin) {
    throw new Error('Perfis não encontrados');
  }

  // ========================================
  // 2. USUÁRIOS (senha padrão: Admin@123)
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

  console.log(`✅ 1 usuário administrador criado:`);
  console.log(`   - ${admin.email} (senha: Admin@123)`);

  // ========================================
  // 3. PILARES GLOBAIS COMPLETOS
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
      melhor: 'MENOR',
      descricao: 'TOTAL INVESTIDO EM ANUNCIOS NO MÊS',
      ordem: 1,
    },
    {
      nome: 'VOLUME DE LEADS QUALIFICADOS GERADOS',
      tipoMedida: 'QUANTIDADE',
      melhor: 'MAIOR',
      descricao: '# POTENCIAIS CLIENTES CAPTURADOS',
      ordem: 2,
    },
    {
      nome: 'CUSTO AQUISIÇÃO DO CLIENTE (CAC)',
      tipoMedida: 'REAL',
      melhor: 'MAIOR',
      descricao: 'TOTAL GASTO/NÚMERO DE CLIENTES ADQUIRIDOS',
      ordem: 3,
    },
    {
      nome: 'ROI DE MARKETING',
      tipoMedida: 'QUANTIDADE',
      melhor: 'MAIOR',
      descricao: 'FATURAMENTO TOTAL',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('VENDAS', [
    {
      nome: 'FATURAMENTO GLOBAL',
      tipoMedida: 'REAL',
      melhor: 'MAIOR',
      descricao: 'TOTAL FATURADO NO MÊS',
      ordem: 1,
    },
    {
      nome: '# VENDAS REALIZADAS',
      tipoMedida: 'QUANTIDADE',
      melhor: 'MAIOR',
      descricao: 'NÚMERO DE VENDAS REALIZADAS NO MÊS',
      ordem: 2,
    },
    {
      nome: 'TICKET MÉDIO DAS VENDAS REALIZADAS',
      tipoMedida: 'REAL',
      melhor: 'MAIOR',
      descricao: 'TOTAL FATURADO NO MÊS/ NÚMERO DE VENDAS',
      ordem: 3,
    },
    {
      nome: 'TAXA DE CONVERSÃO',
      tipoMedida: 'PERCENTUAL',
      melhor: 'MAIOR',
      descricao: '# PROPOSTAS FECHADAS / TOTAL DE PROPOSTAS ENVIADAS',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('PESSOAS', [
    {
      nome: 'TURNOVER',
      tipoMedida: 'PERCENTUAL',
      melhor: 'MENOR',
      descricao: '% DE COLABORADORES QUE ENTRAM E SAEM DA EMPRESA',
      ordem: 1,
    },
    {
      nome: 'ABSENTEÍSMO',
      tipoMedida: 'QUANTIDADE',
      melhor: 'MENOR',
      descricao: '# DE FALTAS OU ATRASO NÃO JUSTIFICADOS',
      ordem: 2,
    },
    {
      nome: 'TEMPO MÉDIO DE CONTRATAÇÃO',
      tipoMedida: 'TEMPO',
      melhor: 'MENOR',
      descricao: 'TEMPO ENTRE A SOLICITAÇÃO DA PESSOA E A CHEGADA DO NOVO COLABORADOR',
      ordem: 3,
    },
    {
      nome: 'CUSTO TOTAL COM HORAS EXTRAS',
      tipoMedida: 'REAL',
      melhor: 'MENOR',
      descricao: 'TOTAL GASTO COM HORAS EXTRAS DE FUNCIONÁRIOS',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('FINANCEIRO', [
    {
      nome: 'FATURAMENTO MENSAL',
      tipoMedida: 'REAL',
      melhor: 'MAIOR',
      descricao: 'VALOR VENDIDO PELA EMPRESA NO MÊS',
      ordem: 1,
    },
    {
      nome: 'DESPESAS FIXAS MENSAIS',
      tipoMedida: 'REAL',
      melhor: 'MENOR',
      descricao: 'VALOR QUE A EMPRESA CUSTA POR MÊS',
      ordem: 2,
    },
    {
      nome: 'MARGEM DE LUCRO LÍQUIDA',
      tipoMedida: 'PERCENTUAL',
      melhor: 'MAIOR',
      descricao: 'LUCRO LÍQUIDO / RECEITA BRUTA × 100',
      ordem: 3,
    },
    {
      nome: 'ENDIVIDAMENTO',
      tipoMedida: 'PERCENTUAL',
      melhor: 'MENOR',
      descricao: 'ENDIVIDAMENTO (%) = PASSIVO TOTAL / ATIVO TOTAL × 100',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('COMPRAS', [
    {
      nome: 'GASTO TOTAL COM COMPRAS',
      tipoMedida: 'REAL',
      melhor: 'MENOR',
      descricao: 'TOTAL INVESTIDO EM COMPRAS NO MÊS',
      ordem: 1,
    },
    {
      nome: '# COMPRAS REALIZADAS NO MÊS',
      tipoMedida: 'QUANTIDADE',
      melhor: 'MENOR',
      descricao: 'TOTAL DE COMPRAS REALIZADAS NO MÊS',
      ordem: 2,
    },
    {
      nome: 'ÍNDICE DE COMPRAS EMERGENCIAIS',
      tipoMedida: 'PERCENTUAL',
      melhor: 'MENOR',
      descricao: 'TOTAL DE COMPRAS EMERGENCIAIS/ TOTAL DE COMPRAS REALIZADAS',
      ordem: 3,
    },
    {
      nome: 'TEMPO MÉDIO DE COMPRA',
      tipoMedida: 'TEMPO',
      melhor: 'MENOR',
      descricao: 'TEMPO ENTRE A SOLICITAÇÃO DA COMPRA E A CHEGADA DO ITEM',
      ordem: 4,
    },
  ]);

  await upsertIndicadoresTemplates('GESTÃO DO ESTOQUE', [
    {
      nome: 'VALOR TOTAL DO ESTOQUE',
      tipoMedida: 'REAL',
      melhor: 'MENOR',
      descricao: 'TOTAL EM R$ IMOBILIZADO EM ESTOQUE',
      ordem: 1,
    },
    {
      nome: 'RUPTURA DE ESTOQUE',
      tipoMedida: 'QUANTIDADE',
      melhor: 'MENOR',
      descricao: '# DE VENDAS PERDIDAS POR FALTA DE PRODUTO',
      ordem: 2,
    },
    {
      nome: 'TOTAL EM PERDAS E AVARIAS',
      tipoMedida: 'REAL',
      melhor: 'MENOR',
      descricao: 'TOTAL GASTO COM PERDAS E AVARIAS',
      ordem: 3,
    },
    {
      nome: 'TOTAL DE TROCAS E DEVOLUÇÕES',
      tipoMedida: 'REAL',
      melhor: 'MENOR',
      descricao: '# DE TROCAS OU PRODUTOS DEVOLVIDOS',
      ordem: 4,
    },
  ]);

  // ========================================
  // 4. RESUMO FINAL
  // ========================================

  console.log('\n🎉 Production seed completed!');
  console.log('\n📊 Resumo:');
  console.log(`   - 4 perfis de usuário`);
  console.log(`   - 1 usuário administrador`);
  console.log(`   - ${pilaresCriados.length} pilares globais (ESTRATÉGICO, MARKETING, VENDAS, PESSOAS, FINANCEIRO, COMPRAS, GESTÃO DO ESTOQUE)`);
  console.log(`   - ${totalRotinasCriadas} rotinas globais (total)`);
  console.log(`   - ${objetivosTemplatesCriados} objetivos templates (1 por pilar)`);
  console.log('\n🔑 Credenciais de acesso:');
  console.log('   Email: admin@reiche.com.br | Senha: Admin@123 (ADMINISTRADOR)');
}

main()
  .catch((e) => {
    console.error('❌ Production seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
