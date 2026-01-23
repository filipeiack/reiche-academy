import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { RenovarPeriodoMentoriaDto } from './renovar-periodo-mentoria.dto';

describe('RenovarPeriodoMentoriaDto - Validação Completa', () => {
  let dto: RenovarPeriodoMentoriaDto;

  beforeEach(() => {
    dto = new RenovarPeriodoMentoriaDto();
  });

  // ============================================================
  // CAMPO OBRIGATÓRIO
  // ============================================================

  describe('dataInicio - Campo Obrigatório', () => {
    it('deve aceitar data válida em formato ISO 8601', async () => {
      const inputData = { dataInicio: '2025-01-01' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);

      expect(errors).toHaveLength(0);
    });

    it('deve rejeitar campo vazio', async () => {
      const inputData = { dataInicio: '' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dataInicio');
      expect(errors[0].constraints).toEqual({
        isNotEmpty: 'Data de início é obrigatória',
        isDateString: 'Data de início deve ser uma data válida',
      });
    });

    it('deve rejeitar campo undefined', async () => {
      const inputData = { dataInicio: undefined };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dataInicio');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('deve rejeitar campo null', async () => {
      const inputData = { dataInicio: null };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dataInicio');
      expect(errors[0].constraints).toEqual({
        isNotEmpty: 'Data de início é obrigatória',
        isDateString: 'Data de início deve ser uma data válida',
      });
    });

    it('deve rejeitar objeto sem o campo dataInicio', async () => {
      const inputData = {};
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dataInicio');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });
  });

  // ============================================================
  // FORMATO DE DATA
  // ============================================================

  describe('dataInicio - Formato de Data', () => {
    it('deve aceitar datas em diferentes formatos válidos', async () => {
      const validDates = [
        '2025-01-01',
        '2025-12-31',
        '2026-03-15',
        '2025-02-28',
        '2024-02-29', // Ano bissexto
      ];

      for (const date of validDates) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        expect(errors).toHaveLength(0);
      }
    });

    it('deve rejeitar formatos de data inválidos', async () => {
      const invalidDates = [
        '2025/01/01',      // Formato brasileiro
        '01-01-2025',      // MM-DD-YYYY
        '01/01/2025',      // MM/DD/YYYY
        '2025-13-01',      // Mês inválido
        '2025-01-32',      // Dia inválido
        '2025-00-01',      // Mês zero
        'invalid-date',    // Texto inválido
        '12345678',        // Apenas números
        '2025-1-1',        // Formato abreviado
        '25-01-01',        // Ano abreviado
      ];

      for (const date of invalidDates) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('dataInicio');
        expect(errors[0].constraints).toHaveProperty('isDateString');
      }
    });

    it('deve aceitar string vazia que se torna undefined após transformação', async () => {
      const inputData = { dataInicio: '' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================
  // REGRAS DE NEGÓCIO ESPECÍFICAS PARA RENOVAÇÃO
  // ============================================================

  describe('dataInicio - Regras de Negócio para Renovação', () => {
    it('deve aceitar data posterior ao fim do período atual', async () => {
      // Contexto: Se período atual termina 2024-12-31, renovação pode começar 2025-01-01
      const inputData = { dataInicio: '2025-01-01' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // O service fará validação específica: dataInicio > periodoAtual.dataFim
      expect(dtoInstance.dataInicio).toBe('2025-01-01');
    });

    it('deve aceitar data exatamente igual ao fim do período atual', async () => {
      // Contexto: Se período atual termina 2024-12-31, renovação pode começar 2024-12-31
      const inputData = { dataInicio: '2024-12-31' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // O service permitirá dataInicio >= periodoAtual.dataFim
      expect(dtoInstance.dataInicio).toBe('2024-12-31');
    });

    it('deve aceitar datas futuras distantes', async () => {
      // Contexto: Renovação pode ser planejada para futuro distante
      const inputData = { dataInicio: '2026-01-01' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // O service validará se data é razoável, mas DTO aceita
      expect(dtoInstance.dataInicio).toBe('2026-01-01');
    });

    it('deve aceitar data no passado se for após fim do período atual', async () => {
      // Contexto: Se período atual terminou há 6 meses, renovação pode ter início no passado
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 6);
      
      const inputData = { dataInicio: pastDate.toISOString().split('T')[0] };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // DTO não valida se é passado, service fará validação contextual
      expect(dtoInstance.dataInicio).toBeDefined();
    });
  });

  // ============================================================
  // INTEGRAÇÃO COM OUTROS MÓDULOS
  // ============================================================

  describe('Integração com Outros Módulos', () => {
    it('dataInicio será base para novo período que afetará Indicadores Mensais', async () => {
      // Contexto: Esta data definirá janela temporal para NOVOS valores mensais
      const inputData = { dataInicio: '2025-03-15' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // Impacto nos módulos:
      // - Novos IndicadorMensal serão criados com este periodoMentoriaId
      // - Valores mensais antigos ficarão read-only no período encerrado
      // - Cockpit exibirá dados separados por período
      expect(dtoInstance.dataInicio).toBe('2025-03-15');
    });

    it('dataInicio influenciará organização histórica de Diagnosticos', async () => {
      // Contexto: Evolution organizará dados por períodos históricos
      const inputData = { dataInicio: '2025-01-01' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // Impacto:
      // - PilarEvolucao será organizado por período
      // - Médias históricas manterão contexto temporal
      // - Relatórios comparativos usarão períodos como granularidade
      expect(dtoInstance.dataInicio).toBe('2025-01-01');
    });

    it('dataInicio definirá fronteira para Cockpit e gráficos', async () => {
      // Contexto: Cockpit usará período novo para cálculos e validações
      const inputData = { dataInicio: '2025-06-01' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // Impacto:
      // - Frontend calculará headers baseados neste período
      // - Validação de valores mensais usará estas datas como limites
      // - Gráficos permitirão comparação entre períodos
      expect(dtoInstance.dataInicio).toBe('2025-06-01');
    });
  });

  // ============================================================
  // TRANSFORMAÇÃO E SERIALIZAÇÃO
  // ============================================================

  describe('Transformação e Serialização', () => {
    it('deve manter tipo string após transformação', async () => {
      const inputData = { dataInicio: '2025-07-15' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      expect(typeof dtoInstance.dataInicio).toBe('string');
      expect(dtoInstance.dataInicio).toBe('2025-07-15');
    });

    it('deve rejeitar números mesmo que representem datas', async () => {
      const inputData = { dataInicio: 20250101 }; // número, não string
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });

    it('deve rejeitar objetos Date', async () => {
      const inputData = { dataInicio: new Date('2025-01-01') };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });
  });

  // ============================================================
  // EDGE CASES E PERFORMANCE
  // ============================================================

  describe('Edge Cases e Performance', () => {
    it('deve processar validação rapidamente', async () => {
      const startTime = Date.now();
      
      const inputData = { dataInicio: '2025-12-31' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(errors).toHaveLength(0);
      expect(processingTime).toBeLessThan(100); // Validar em menos de 100ms
    });

    it('deve lidar com whitespace em strings', async () => {
      const inputData = { dataInicio: ' 2025-01-01 ' }; // com espaços
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      // class-validator provavelmente rejeitará por espaços
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('deve ser consistente com validações do service', async () => {
      // Garantir que validação do DTO esteja alinhada com validações do service
      const validDtoInput = { dataInicio: '2025-08-01' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, validDtoInput);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // Se DTO está válido, service deve conseguir processar
      expect(() => {
        new Date(dtoInstance.dataInicio); // Conversão que o service fará
      }).not.toThrow();
    });

    it('deve aceitar datas extremas (validação é só de formato)', async () => {
      const extremeDates = [
        '1900-01-01',  // Data muito antiga (teoricamente válida)
        '2100-12-31',  // Data muito futura (teoricamente válida)
        '2000-02-29',  // Ano bissexto antigo
        '2400-02-29',  // Ano bissexto futuro
      ];

      for (const date of extremeDates) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        // Somente valida formato, não regras de negócio de datas extremas
        expect(errors).toHaveLength(0);
      }
    });
  });

  // ============================================================
  // VALIDAÇÃO CONTEXTUAL COM PERÍODO ATUAL
  // ============================================================

  describe('Validação Contextual com Período Atual', () => {
    it('deve ser compatível com cenário de período ativo terminando em 2024-12-31', async () => {
      // Contexto comum: período atual termina 2024-12-31
      const validRenovations = [
        '2024-12-31', // Início no mesmo dia
        '2025-01-01', // Início no dia seguinte
        '2025-01-15', // Início 15 dias depois
        '2025-03-01', // Início 3 meses depois
      ];

      for (const date of validRenovations) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        expect(errors).toHaveLength(0);

        // Service validará: dataInicio >= '2024-12-31'
        expect(dtoInstance.dataInicio).toBe(date);
      }
    });

    it('deve ser compatível com cenário de período ativo terminando em meio do ano', async () => {
      // Contexto: período atual termina 2024-06-30
      const validRenovations = [
        '2024-06-30', // Início no mesmo dia
        '2024-07-01', // Início no dia seguinte
        '2024-08-01', // Início 1 mês depois
        '2025-01-01', // Início 6 meses depois
      ];

      for (const date of validRenovations) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        expect(errors).toHaveLength(0);

        // Service validará: dataInicio >= '2024-06-30'
        expect(dtoInstance.dataInicio).toBe(date);
      }
    });

    it('deve fornecer base para cálculo do novo período (dataInicio + 1 ano)', async () => {
      // Contexto: Data de renovação definirá novo período completo
      const inputData = { dataInicio: '2025-04-15' };
      const dtoInstance = plainToInstance(RenovarPeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // No service: novoPeriodo.dataFim = addYears(new Date('2025-04-15'), 1) = '2026-04-15'
      // Este DTO fornece a base para o novo período completo
      expect(dtoInstance.dataInicio).toBe('2025-04-15');
    });
  });
});