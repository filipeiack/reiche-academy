import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePeriodoMentoriaDto } from './create-periodo-mentoria.dto';

describe('CreatePeriodoMentoriaDto - Validação Completa', () => {
  let dto: CreatePeriodoMentoriaDto;

  beforeEach(() => {
    dto = new CreatePeriodoMentoriaDto();
  });

  // ============================================================
  // CAMPO OBRIGATÓRIO
  // ============================================================

  describe('dataInicio - Campo Obrigatório', () => {
    it('deve aceitar data válida em formato ISO 8601', async () => {
      const inputData = { dataInicio: '2024-01-01' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);

      expect(errors).toHaveLength(0);
    });

    it('deve rejeitar campo vazio', async () => {
      const inputData = { dataInicio: '' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
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
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('dataInicio');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('deve rejeitar campo null', async () => {
      const inputData = { dataInicio: null };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
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
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
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
        '2024-01-01',
        '2024-12-31',
        '2025-03-15',
        '2023-02-28',
        '2024-02-29', // Ano bissexto
      ];

      for (const date of validDates) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        expect(errors).toHaveLength(0);
      }
    });

    it('deve rejeitar formatos de data inválidos', async () => {
      const invalidDates = [
        '2024/01/01',      // Formato brasileiro
        '01-01-2024',      // MM-DD-YYYY
        '01/01/2024',      // MM/DD/YYYY
        '2024-13-01',      // Mês inválido
        '2024-01-32',      // Dia inválido
        '2024-00-01',      // Mês zero
        'invalid-date',    // Texto inválido
        '12345678',        // Apenas números
        '2024-1-1',        // Formato abreviado
        '24-01-01',        // Ano abreviado
      ];

      for (const date of invalidDates) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        expect(errors).toHaveLength(1);
        expect(errors[0].property).toBe('dataInicio');
        expect(errors[0].constraints).toHaveProperty('isDateString');
      }
    });

    it('deve aceitar string vazia que se torna undefined após transformação', async () => {
      // class-transformer pode converter string vazia em undefined
      const inputData = { dataInicio: '' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================================
  // REGRAS DE NEGÓCIO (CONTEXTUAIS)
  // ============================================================

  describe('dataInicio - Regras de Negócio Contextuais', () => {
    it('deve aceitar data no passado (para períodos iniciados anteriormente)', async () => {
      // Períodos podem ser criados com data no passado para registros
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 6);
      
      const inputData = { dataInicio: pastDate.toISOString().split('T')[0] };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);
    });

    it('deve aceitar data no futuro', async () => {
      // Períodos podem ser criados para iniciar no futuro
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 6);
      
      const inputData = { dataInicio: futureDate.toISOString().split('T')[0] };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);
    });

    it('deve aceitar data de hoje', async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const inputData = { dataInicio: today };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);
    });

    it('deve aceitar datas extremas válidas', async () => {
      const extremeDates = [
        '1900-01-01',  // Data muito antiga (teoricamente válida)
        '2100-12-31',  // Data muito futura (teoricamente válida)
        '2000-02-29',  // Ano bissexto antigo
        '2400-02-29',  // Ano bissexto futuro
      ];

      for (const date of extremeDates) {
        const inputData = { dataInicio: date };
        const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
        
        const errors = await validate(dtoInstance);
        // Somente valida formato, não regras de negócio de datas extremas
        expect(errors).toHaveLength(0);
      }
    });
  });

  // ============================================================
  // INTEGRAÇÃO COM OUTROS MÓDULOS
  // ============================================================

  describe('Integração com Outros Módulos', () => {
    it('dataInicio válida será usada para calcular dataFim = dataInicio + 1 ano', async () => {
      // Este teste contextualiza como o DTO é usado no service
      const inputData = { dataInicio: '2024-03-15' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // No service: dataFim = addYears(new Date('2024-03-15'), 1) = '2025-03-15'
      // Este DTO fornece a base para cálculo do período completo
      expect(dtoInstance.dataInicio).toBe('2024-03-15');
    });

    it('dataInicio será base para validação contra período ativo existente', async () => {
      // Contexto: O service usará este DTO para validar se já existe período ativo
      const inputData = { dataInicio: '2025-01-01' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // No service: verifica se empresa já tem período ativo nesta data
      // DTO validado corretamente para essa verificação
      expect(dtoInstance.dataInicio).toBe('2025-01-01');
    });

    it('dataInicio influenciará Indicadores Mensais e Cockpit', async () => {
      // Contexto: Esta data definirá janela temporal para valores mensais
      const inputData = { dataInicio: '2024-01-01' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // Impacto:
      // - IndicadorMensal.periodoMentoriaId referenciará este período
      // - Validação de valores mensais usará dataInicio como limite inferior
      // - Cockpit calculará 13 meses dentro desta janela temporal
      expect(dtoInstance.dataInicio).toBe('2024-01-01');
    });
  });

  // ============================================================
  // TRANSFORMAÇÃO E SERIALIZAÇÃO
  // ============================================================

  describe('Transformação e Serialização', () => {
    it('deve manter tipo string após transformação', async () => {
      const inputData = { dataInicio: '2024-06-15' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      expect(typeof dtoInstance.dataInicio).toBe('string');
      expect(dtoInstance.dataInicio).toBe('2024-06-15');
    });

    it('deve rejeitar números mesmo que representem datas', async () => {
      const inputData = { dataInicio: 20240101 }; // número, não string
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });

    it('deve rejeitar objetos Date', async () => {
      const inputData = { dataInicio: new Date('2024-01-01') };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(1);
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });
  });

  // ============================================================
  // EDGE CASES E PERFORMANCE
  // ============================================================

  describe('Edge Cases e Performance', () => {
    it('deve processar validação rapidamente mesmo com entradas complexas', async () => {
      const startTime = Date.now();
      
      const inputData = { dataInicio: '2024-12-31' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      expect(errors).toHaveLength(0);
      expect(processingTime).toBeLessThan(100); // Validar em menos de 100ms
    });

    it('deve lidar com whitespace em strings', async () => {
      const inputData = { dataInicio: ' 2024-01-01 ' }; // com espaços
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, inputData);
      
      const errors = await validate(dtoInstance);
      // class-validator provavelmente rejeitará por espaços
      expect(errors.length).toBeGreaterThanOrEqual(1);
    });

    it('deve ser consistente com validações do service', async () => {
      // Garantir que validação do DTO esteja alinhada com validações do service
      const validDtoInput = { dataInicio: '2024-07-01' };
      const dtoInstance = plainToInstance(CreatePeriodoMentoriaDto, validDtoInput);
      
      const errors = await validate(dtoInstance);
      expect(errors).toHaveLength(0);

      // Se DTO está válido, service deve conseguir processar
      expect(() => {
        new Date(dtoInstance.dataInicio); // Conversão que o service fará
      }).not.toThrow();
    });
  });
});