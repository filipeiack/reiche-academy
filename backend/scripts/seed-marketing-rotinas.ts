import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Inserindo rotinas padrão do pilar MARKETING...');

  // Verificar se o pilar MARKETING já existe
  let pilarMarketing = await prisma.pilar.findFirst({
    where: { nome: 'MARKETING' },
  });

  // Se não existir, criar o pilar
  if (!pilarMarketing) {
    pilarMarketing = await prisma.pilar.create({
      data: {
        nome: 'MARKETING',
        descricao: 'Pilar responsável por estratégias de marketing e comunicação',
        ordem: 2, // Ajuste conforme necessário
        modelo: true, // Define como modelo padrão
        ativo: true,
      },
    });
    console.log(`✅ Pilar MARKETING criado: ${pilarMarketing.id}`);
  } else {
    console.log(`ℹ️  Pilar MARKETING já existe: ${pilarMarketing.id}`);
  }

  // Definir as rotinas padrão do pilar MARKETING
  const rotinasMarketing = [
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
  ];

  // Inserir as rotinas
  let rotinasCriadas = 0;
  let rotinasExistentes = 0;

  for (const rotinaData of rotinasMarketing) {
    const rotinaExistente = await prisma.rotina.findFirst({
      where: {
        nome: rotinaData.nome,
        pilarId: pilarMarketing.id,
      },
    });

    if (!rotinaExistente) {
      await prisma.rotina.create({
        data: {
          nome: rotinaData.nome,
          descricao: rotinaData.descricao,
          ordem: rotinaData.ordem,
          modelo: true, // Define como modelo padrão
          ativo: true,
          pilarId: pilarMarketing.id,
        },
      });
      rotinasCriadas++;
    } else {
      rotinasExistentes++;
    }
  }

  console.log(`✅ ${rotinasCriadas} rotinas criadas para o pilar MARKETING`);
  console.log(`ℹ️  ${rotinasExistentes} rotinas já existiam`);
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
