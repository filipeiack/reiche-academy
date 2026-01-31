import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateCockpitPilarDto } from './update-cockpit-pilar.dto';

describe('UpdateCockpitPilarDto', () => {
  describe('Validação de DTO Vazio', () => {
    it('should validate with no fields provided (all optional)', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validação de Campo Entradas', () => {
    it('should accept valid entradas field', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Pedidos de clientes, leads gerados',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept empty string for entradas', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept null for entradas (treated as undefined)', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept undefined for entradas', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject entradas with non-string value', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 123 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entradas');
      expect(errors[0].constraints?.isString).toBe('entradas deve ser uma string');
    });

    it('should reject entradas with boolean value', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: true as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entradas');
      expect(errors[0].constraints?.isString).toBe('entradas deve ser uma string');
    });

    it('should reject entradas with array value', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: ['not', 'valid'] as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entradas');
      expect(errors[0].constraints?.isString).toBe('entradas deve ser uma string');
    });

    it('should reject entradas with object value', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: { not: 'valid' } as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entradas');
      expect(errors[0].constraints?.isString).toBe('entradas deve ser uma string');
    });

    it('should reject entradas exceeding max length', async () => {
      const longString = 'a'.repeat(1001);
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: longString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entradas');
      expect(errors[0].constraints?.maxLength).toBe('entradas deve ter no máximo 1000 caracteres');
    });

    it('should accept entradas exactly at max length', async () => {
      const maxLengthString = 'a'.repeat(1000);
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: maxLengthString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validação de Campo Saidas', () => {
    it('should accept valid saidas field', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        saidas: 'Propostas comerciais, contratos assinados',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject saidas with non-string value', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        saidas: 456 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('saidas');
      expect(errors[0].constraints?.isString).toBe('saidas deve ser uma string');
    });

    it('should reject saidas exceeding max length', async () => {
      const longString = 'b'.repeat(1001);
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        saidas: longString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('saidas');
      expect(errors[0].constraints?.maxLength).toBe('saidas deve ter no máximo 1000 caracteres');
    });

    it('should accept saidas exactly at max length', async () => {
      const maxLengthString = 'b'.repeat(1000);
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        saidas: maxLengthString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validação de Campo Missao', () => {
    it('should accept valid missao field', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        missao: 'Garantir crescimento sustentável via canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missao with non-string value', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        missao: 789 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('missao');
      expect(errors[0].constraints?.isString).toBe('missao deve ser uma string');
    });

    it('should reject missao exceeding max length', async () => {
      const longString = 'c'.repeat(1001);
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        missao: longString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('missao');
      expect(errors[0].constraints?.maxLength).toBe('missao deve ter no máximo 1000 caracteres');
    });

    it('should accept missao exactly at max length', async () => {
      const maxLengthString = 'c'.repeat(1000);
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        missao: maxLengthString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validação de Múltiplos Campos', () => {
    it('should validate with all optional fields provided and valid', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Pedidos de clientes, leads gerados, demandas de parceiros',
        saidas: 'Propostas comerciais, contratos assinados, relatórios de vendas',
        missao: 'Garantir crescimento sustentável via canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with some optional fields provided', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Novas entradas',
        missao: 'Nova missão',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accumulate multiple validation errors', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 123 as any,
        saidas: 'a'.repeat(1001),
        missao: 456 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(3);
      
      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('entradas');
      expect(errorProperties).toContain('saidas');
      expect(errorProperties).toContain('missao');
    });

    it('should handle valid and invalid fields mixed', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Valid entradas',
        saidas: 'b'.repeat(1001), // Invalid
        missao: 'Valid missao',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('saidas');
      expect(errors[0].constraints?.maxLength).toBe('saidas deve ter no máximo 1000 caracteres');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only string values', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: '   ',
        saidas: '\t\n',
        missao: '  \r\n  ',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // Whitespace strings are valid for string fields
    });

    it('should handle special characters in string fields', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Pedidos @ clientes, leads # gerados',
        saidas: 'Propostas $ comerciais, contratos & assinados',
        missao: 'Garantir crescimento | canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle unicode characters in string fields', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Pedidos de clientes, leads gerados',
        saidas: 'Propostas comerciais, contratos assinados',
        missao: 'Garantir crescimento sustentável via canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle HTML tags in string fields (allowed)', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: '<p>Pedidos de clientes</p>',
        saidas: '<div>Propostas comerciais</div>',
        missao: '<strong>Garantir crescimento</strong>',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // HTML tags are valid strings
    });

    it('should handle emoji characters in string fields', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Pedidos de clientes 📊, leads gerados 📈',
        saidas: 'Propostas comerciais 📝, contratos assinados ✅',
        missao: 'Garantir crescimento sustentável 🚀 via canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Cenários de Update Parcial', () => {
    it('should allow update with only entradas', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Updated entradas only',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow update with only saidas', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        saidas: 'Updated saidas only',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow update with only missao', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        missao: 'Updated missao only',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should allow update with two fields only', async () => {
      const dto = plainToInstance(UpdateCockpitPilarDto, {
        entradas: 'Updated entradas',
        saidas: 'Updated saidas',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});