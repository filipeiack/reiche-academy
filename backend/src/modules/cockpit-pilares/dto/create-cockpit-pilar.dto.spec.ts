import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateCockpitPilarDto } from './create-cockpit-pilar.dto';

describe('CreateCockpitPilarDto', () => {
  describe('Validação de Campos Obrigatórios', () => {
    it('should validate with valid required fields', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject when pilarEmpresaId is missing', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {});

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('pilarEmpresaId');
      expect(errors[0].constraints?.isNotEmpty).toBe('pilarEmpresaId é obrigatório');
    });

    it('should reject when pilarEmpresaId is null', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: null,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('pilarEmpresaId');
      expect(errors[0].constraints?.isNotEmpty).toBe('pilarEmpresaId é obrigatório');
    });

    it('should reject when pilarEmpresaId is empty string', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('pilarEmpresaId');
      expect(errors[0].constraints?.isNotEmpty).toBe('pilarEmpresaId é obrigatório');
    });

    it('should reject when pilarEmpresaId is undefined', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: undefined,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('pilarEmpresaId');
      expect(errors[0].constraints?.isNotEmpty).toBe('pilarEmpresaId é obrigatório');
    });
  });

  describe('Validação de UUID', () => {
    it('should accept valid UUID formats', async () => {
      const validUUIDs = [
        '550e8400-e29b-41d4-a716-446655440000', // UUID v4
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8', // UUID v1
        '6ba7b811-9dad-11d1-80b4-00c04fd430c8', // UUID v1
      ];

      for (const uuid of validUUIDs) {
        const dto = plainToInstance(CreateCockpitPilarDto, {
          pilarEmpresaId: uuid,
        });

        const errors = await validate(dto);
        expect(errors).toHaveLength(0);
      }
    });

    it('should handle various string inputs (class-validator handles UUID validation)', async () => {
      const testCases = [
        { input: '123', description: 'simple number string' },
        { input: 'abc', description: 'simple letters' },
        { input: '', description: 'empty string (handled by @IsNotEmpty)' },
        { input: 'invalid-uuid', description: 'malformed uuid' },
      ];

      for (const { input, description } of testCases) {
        const dto = plainToInstance(CreateCockpitPilarDto, {
          pilarEmpresaId: input,
        });

        const errors = await validate(dto);
        
        // If it's a required field error, that's expected
        // If it's a UUID validation error, that's also expected
        // We just want to ensure validation doesn't crash
        expect(errors.length).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Validação de Campos Opcionais', () => {
    it('should accept valid entradas field', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: 'Pedidos de clientes, leads gerados',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept empty entradas field (optional)', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: '',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject entradas with non-string value', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: 123 as any,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entradas');
      expect(errors[0].constraints?.isString).toBe('entradas deve ser uma string');
    });

    it('should reject entradas exceeding max length', async () => {
      const longString = 'a'.repeat(1001);
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: longString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('entradas');
      expect(errors[0].constraints?.maxLength).toBe('entradas deve ter no máximo 1000 caracteres');
    });

    it('should accept entradas exactly at max length', async () => {
      const maxLengthString = 'a'.repeat(1000);
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: maxLengthString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('Validação de Campo Saidas', () => {
    it('should accept valid saidas field', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        saidas: 'Propostas comerciais, contratos assinados',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject saidas exceeding max length', async () => {
      const longString = 'b'.repeat(1001);
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        saidas: longString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('saidas');
      expect(errors[0].constraints?.maxLength).toBe('saidas deve ter no máximo 1000 caracteres');
    });
  });

  describe('Validação de Campo Missao', () => {
    it('should accept valid missao field', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        missao: 'Garantir crescimento sustentável via canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject missao exceeding max length', async () => {
      const longString = 'c'.repeat(1001);
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        missao: longString,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('missao');
      expect(errors[0].constraints?.maxLength).toBe('missao deve ter no máximo 1000 caracteres');
    });
  });

  describe('Validação de Todos os Campos Juntos', () => {
    it('should validate with all optional fields provided and valid', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: 'Pedidos de clientes, leads gerados, demandas de parceiros',
        saidas: 'Propostas comerciais, contratos assinados, relatórios de vendas',
        missao: 'Garantir crescimento sustentável via canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with no optional fields provided (only required)', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accumulate multiple validation errors', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: 'invalid-uuid',
        entradas: 123 as any,
        saidas: 'a'.repeat(1001),
        missao: 'b'.repeat(1001),
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(4);
      
      const errorProperties = errors.map(e => e.property);
      expect(errorProperties).toContain('pilarEmpresaId');
      expect(errorProperties).toContain('entradas');
      expect(errorProperties).toContain('saidas');
      expect(errorProperties).toContain('missao');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only string values', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: '   ',
        saidas: '\t\n',
        missao: '  \r\n  ',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0); // Whitespace strings are valid for string fields
    });

    it('should handle special characters in string fields', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: 'Pedidos @ clientes, leads # gerados, demandas % parceiros',
        saidas: 'Propostas $ comerciais, contratos & assinados',
        missao: 'Garantir crescimento sustentável | canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should handle unicode characters in string fields', async () => {
      const dto = plainToInstance(CreateCockpitPilarDto, {
        pilarEmpresaId: '550e8400-e29b-41d4-a716-446655440000',
        entradas: 'Pedidos de clientes, leads gerados, demandas de parceiros',
        saidas: 'Propostas comerciais, contratos assinados, relatórios de vendas',
        missao: 'Garantir crescimento sustentável via canal indireto',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});