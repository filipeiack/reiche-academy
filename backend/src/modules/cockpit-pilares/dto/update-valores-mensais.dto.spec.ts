import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateValoresMensaisDto, ValorMensalDto } from './update-valores-mensais.dto';

describe('UpdateValoresMensaisDto', () => {
  describe('Validação do DTO Principal', () => {
    it('should validate with valid array of valores', async () => {
      const dto = plainToInstance(UpdateValoresMensaisDto, {
        valores: [
          {
            mes: 1,
            ano: 2024,
            meta: 100000,
            realizado: 95000,
          },
          {
            mes: 2,
            ano: 2024,
            meta: 100000,
            realizado: 105000,
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with valores array containing null mes (anual)', async () => {
      const dto = plainToInstance(UpdateValoresMensaisDto, {
        valores: [
          {
            mes: null,
            ano: 2024,
            meta: 1200000,
            realizado: 1150000,
          },
        ],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject when valores is missing', async () => {
      const dto = plainToInstance(UpdateValoresMensaisDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('valores');
      expect(errors[0].constraints?.isNotEmpty).toBe('valores é obrigatório');
    });

    it('should reject when valores is null', async () => {
      const dto = plainToInstance(UpdateValoresMensaisDto, {
        valores: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('valores');
      expect(errors[0].constraints?.isNotEmpty).toBe('valores é obrigatório');
    });

    it('should accept when valores is empty array (business logic validation elsewhere)', async () => {
      const dto = plainToInstance(UpdateValoresMensaisDto, {
        valores: [],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      // Empty array validation should be handled in business logic
    });

    it('should reject when valores is not an array', async () => {
      const dto = plainToInstance(UpdateValoresMensaisDto, {
        valores: 'not-an-array',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('valores');
      expect(errors[0].constraints?.isArray).toBe('valores deve ser um array');
    });
  });
});

describe('ValorMensalDto', () => {
  describe('Validação de Campo Mês', () => {
    it('should accept valid month values', async () => {
      const validMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

      for (const mes of validMonths) {
        const dto = plainToInstance(ValorMensalDto, {
          mes,
          ano: 2024,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should accept null for mes (anual)', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: null,
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept undefined for mes', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject month less than 1', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 0,
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mes');
      expect(errors[0].constraints?.min).toBe('mes deve estar entre 1 e 12');
    });

    it('should reject month greater than 12', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 13,
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mes');
      expect(errors[0].constraints?.max).toBe('mes deve estar entre 1 e 12');
    });

    it('should reject non-integer month', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1.5,
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mes');
      expect(errors[0].constraints?.isInt).toBe('mes deve ser um número inteiro');
    });

    it('should reject string month', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 'jan' as any,
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('mes');
      expect(errors[0].constraints?.isInt).toBe('mes deve ser um número inteiro');
    });
  });

  describe('Validação de Campo Ano', () => {
    it('should accept valid year values', async () => {
      const validYears = [2000, 2020, 2024, 2025, 2030];

      for (const ano of validYears) {
        const dto = plainToInstance(ValorMensalDto, {
          mes: 1,
          ano,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should reject year less than 2000', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 1999,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ano');
      expect(errors[0].constraints?.min).toBe('ano deve ser maior ou igual a 2000');
    });

    it('should reject non-integer year', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024.5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ano');
      expect(errors[0].constraints?.isInt).toBe('ano deve ser um número inteiro');
    });

    it('should reject string year', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: '2024' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ano');
      expect(errors[0].constraints?.isInt).toBe('ano deve ser um número inteiro');
    });

    it('should reject missing year', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ano');
      expect(errors[0].constraints?.isNotEmpty).toBe('ano é obrigatório');
    });

    it('should reject null year', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ano');
      expect(errors[0].constraints?.isNotEmpty).toBe('ano é obrigatório');
    });

    it('should reject undefined year', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('ano');
      expect(errors[0].constraints?.isNotEmpty).toBe('ano é obrigatório');
    });
  });

  describe('Validação de Campo Meta', () => {
    it('should accept valid positive meta', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: 100000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept zero meta', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept negative meta', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: -1000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept decimal meta', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: 100.50,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept undefined meta', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept null meta', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject string meta', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: '100000' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('meta');
      expect(errors[0].constraints?.isNumber).toBe('meta deve ser um número');
    });
  });

  describe('Validação de Campo Realizado', () => {
    it('should accept valid positive realizado', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        realizado: 95000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept zero realizado', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        realizado: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept negative realizado', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        realizado: -500,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept decimal realizado', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        realizado: 95.75,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject string realizado', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        realizado: '95000' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('realizado');
      expect(errors[0].constraints?.isNumber).toBe('realizado deve ser um número');
    });
  });

  describe('Validação de Campo Histórico', () => {
    it('should accept valid positive historico', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        historico: 90000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept zero historico', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        historico: 0,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept negative historico', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        historico: -1000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject string historico', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        historico: '90000' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('historico');
      expect(errors[0].constraints?.isNumber).toBe('historico deve ser um número');
    });
  });

  describe('Validação de Múltiplos Campos', () => {
    it('should validate with all optional fields provided', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 6,
        ano: 2024,
        meta: 100000,
        realizado: 95000,
        historico: 90000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with only required fields', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        ano: 2024,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accumulate multiple validation errors', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 13,
        ano: 1999,
        meta: 'invalid' as any,
        realizado: 'invalid' as any,
        historico: 'invalid' as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(5);
      
      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('mes');
      expect(errorProperties).toContain('ano');
      expect(errorProperties).toContain('meta');
      expect(errorProperties).toContain('realizado');
      expect(errorProperties).toContain('historico');
    });
  });

  describe('Cenários Específicos de Período de Mentoria (R-MENT-008)', () => {
    it('should validate current month values (inside mentorship period)', async () => {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      const dto = plainToInstance(ValorMensalDto, {
        mes: currentMonth,
        ano: currentYear,
        meta: 100000,
        realizado: 95000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate future month values (potentially outside mentorship)', async () => {
      const futureMonth = 12;
      const futureYear = 2026;

      const dto = plainToInstance(ValorMensalDto, {
        mes: futureMonth,
        ano: futureYear,
        meta: 100000,
        realizado: 0, // Realizado would be 0 for future months
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      // Note: Business logic validation for mentorship period should be handled in service layer
    });

    it('should validate past month values (potentially read-only)', async () => {
      const pastMonth = 1;
      const pastYear = 2024;

      const dto = plainToInstance(ValorMensalDto, {
        mes: pastMonth,
        ano: pastYear,
        meta: 100000,
        realizado: 95000,
        historico: 90000, // Historical reference for past months
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
      // Note: Business logic validation for read-only historical data should be handled in service layer
    });
  });

  describe('Edge Cases', () => {
    it('should handle large number values', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: Number.MAX_SAFE_INTEGER,
        realizado: Number.MAX_SAFE_INTEGER,
        historico: Number.MAX_SAFE_INTEGER,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle very small decimal values', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: 0.01,
        realizado: 0.001,
        historico: -0.0001,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle scientific notation numbers', async () => {
      const dto = plainToInstance(ValorMensalDto, {
        mes: 1,
        ano: 2024,
        meta: 1e6,
        realizado: 9.5e5,
        historico: 9e5,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});