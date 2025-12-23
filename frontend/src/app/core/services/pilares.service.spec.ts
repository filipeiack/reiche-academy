import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PilaresService, Pilar, CreatePilarDto, UpdatePilarDto } from './pilares.service';
import { environment } from '../../../environments/environment';

/**
 * QA UNITÁRIO ESTRITO - PilaresService (Frontend)
 * Valida service CRUD, interfaces, HTTP calls
 */
describe('PilaresService', () => {
  let service: PilaresService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/pilares`;

  const mockPilarPadrao: Pilar = {
    id: 'pilar-1',
    nome: 'Estratégia',
    descricao: 'Pilar estratégico',
    ordem: 1,
    modelo: true,
    ativo: true,
    createdAt: '2024-12-22T00:00:00Z',
    updatedAt: '2024-12-22T00:00:00Z',
    createdBy: 'admin-id',
    _count: { rotinas: 5, empresas: 3 },
  };

  const mockPilarCustomizado: Pilar = {
    id: 'pilar-2',
    nome: 'Inovação',
    descricao: 'Pilar customizado',
    modelo: false,
    ativo: true,
    createdAt: '2024-12-22T00:00:00Z',
    updatedAt: '2024-12-22T00:00:00Z',
    _count: { rotinas: 2, empresas: 1 },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PilaresService],
    });

    service = TestBed.inject(PilaresService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ============================================================
  // CRUD Operations
  // ============================================================

  describe('findAll()', () => {
    it('deve retornar lista de pilares', () => {
      const mockPilares = [mockPilarPadrao, mockPilarCustomizado];

      service.findAll().subscribe((pilares) => {
        expect(pilares).toEqual(mockPilares);
        expect(pilares.length).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockPilares);
    });

    it('deve retornar array vazio se nenhum pilar', () => {
      service.findAll().subscribe((pilares) => {
        expect(pilares).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });

    it('deve incluir contadores _count em cada pilar', () => {
      service.findAll().subscribe((pilares) => {
        expect(pilares[0]._count).toBeDefined();
        expect(pilares[0]._count?.rotinas).toBe(5);
        expect(pilares[0]._count?.empresas).toBe(3);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([mockPilarPadrao]);
    });
  });

  describe('findOne()', () => {
    it('deve retornar pilar por ID', () => {
      service.findOne('pilar-1').subscribe((pilar) => {
        expect(pilar).toEqual(mockPilarPadrao);
        expect(pilar.id).toBe('pilar-1');
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPilarPadrao);
    });

    it('deve lidar com erro 404', () => {
      service.findOne('pilar-999').subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-999`);
      req.flush({ message: 'Pilar não encontrado' }, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('create()', () => {
    it('deve criar pilar padrão (GAP-1)', () => {
      const dto: CreatePilarDto = {
        nome: 'Marketing',
        descricao: 'Pilar de marketing',
        ordem: 2,
        modelo: true, // GAP-1: Campo modelo
      };

      service.create(dto).subscribe((pilar) => {
        expect(pilar.nome).toBe('Marketing');
        expect(pilar.modelo).toBe(true);
        expect(pilar.ordem).toBe(2);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockPilarPadrao, nome: 'Marketing', ordem: 2 });
    });

    it('deve criar pilar customizado', () => {
      const dto: CreatePilarDto = {
        nome: 'Sustentabilidade',
        descricao: 'Pilar sustentável',
        modelo: false,
      };

      service.create(dto).subscribe((pilar) => {
        expect(pilar.modelo).toBe(false);
        expect(pilar.ordem).toBeUndefined();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.body).toEqual(dto);
      req.flush(mockPilarCustomizado);
    });

    it('deve lidar com erro 409 (nome duplicado)', () => {
      const dto: CreatePilarDto = {
        nome: 'Estratégia', // Nome já existe
      };

      service.create(dto).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
        },
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush({ message: 'Nome já cadastrado' }, { status: 409, statusText: 'Conflict' });
    });
  });

  describe('update()', () => {
    it('deve atualizar pilar (GAP-2)', () => {
      const dto: UpdatePilarDto = {
        nome: 'Estratégia Atualizada',
        modelo: false, // GAP-2: Pode alterar modelo
      };

      service.update('pilar-1', dto).subscribe((pilar) => {
        expect(pilar.nome).toBe('Estratégia Atualizada');
        expect(pilar.modelo).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-1`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockPilarPadrao, nome: 'Estratégia Atualizada', modelo: false });
    });

    it('deve atualizar apenas descrição', () => {
      const dto: UpdatePilarDto = {
        descricao: 'Nova descrição',
      };

      service.update('pilar-2', dto).subscribe((pilar) => {
        expect(pilar.descricao).toBe('Nova descrição');
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-2`);
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockPilarCustomizado, descricao: 'Nova descrição' });
    });

    it('deve atualizar campo ativo (reativação manual)', () => {
      const dto: UpdatePilarDto = {
        ativo: true,
      };

      service.update('pilar-inativo', dto).subscribe((pilar) => {
        expect(pilar.ativo).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-inativo`);
      expect(req.request.body).toEqual(dto);
      req.flush({ ...mockPilarPadrao, ativo: true });
    });
  });

  describe('remove()', () => {
    it('deve desativar pilar (soft delete)', () => {
      service.remove('pilar-1').subscribe((pilar) => {
        expect(pilar.ativo).toBe(false);
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-1`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ ...mockPilarPadrao, ativo: false });
    });

    it('deve lidar com erro 409 (rotinas ativas)', () => {
      service.remove('pilar-com-rotinas').subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
        },
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-com-rotinas`);
      req.flush(
        { message: 'Não é possível desativar pilar com rotinas ativas' },
        { status: 409, statusText: 'Conflict' },
      );
    });
  });

  describe('reativar()', () => {
    it('deve reativar pilar inativo', () => {
      service.reativar('pilar-inativo').subscribe((pilar) => {
        expect(pilar.ativo).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-inativo`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual({ ativo: true });
      req.flush({ ...mockPilarPadrao, ativo: true });
    });
  });

  // ============================================================
  // Interfaces & Types
  // ============================================================

  describe('Interfaces Pilar', () => {
    it('deve ter todos os campos obrigatórios', () => {
      const pilar: Pilar = mockPilarPadrao;

      expect(pilar.id).toBeDefined();
      expect(pilar.nome).toBeDefined();
      expect(pilar.modelo).toBeDefined();
      expect(pilar.ativo).toBeDefined();
      expect(pilar.createdAt).toBeDefined();
      expect(pilar.updatedAt).toBeDefined();
    });

    it('deve ter campos opcionais', () => {
      const pilar: Pilar = {
        ...mockPilarCustomizado,
        descricao: undefined,
        ordem: undefined,
        createdBy: undefined,
        updatedBy: undefined,
        _count: undefined,
        rotinas: undefined,
        empresas: undefined,
      };

      expect(pilar.descricao).toBeUndefined();
      expect(pilar.ordem).toBeUndefined();
    });

    it('campo modelo deve ser boolean', () => {
      expect(typeof mockPilarPadrao.modelo).toBe('boolean');
      expect(typeof mockPilarCustomizado.modelo).toBe('boolean');
    });

    it('campo ordem deve ser number ou undefined', () => {
      expect(typeof mockPilarPadrao.ordem).toBe('number');
      expect(mockPilarCustomizado.ordem).toBeUndefined();
    });

    it('_count deve ter rotinas e empresas', () => {
      expect(mockPilarPadrao._count).toBeDefined();
      expect(mockPilarPadrao._count?.rotinas).toBe(5);
      expect(mockPilarPadrao._count?.empresas).toBe(3);
    });
  });

  describe('Interface CreatePilarDto', () => {
    it('deve ter nome obrigatório', () => {
      const dto: CreatePilarDto = {
        nome: 'Teste',
      };

      expect(dto.nome).toBe('Teste');
    });

    it('deve ter campos opcionais', () => {
      const dto: CreatePilarDto = {
        nome: 'Teste',
        descricao: 'Descrição',
        ordem: 5,
        modelo: true,
      };

      expect(dto.descricao).toBe('Descrição');
      expect(dto.ordem).toBe(5);
      expect(dto.modelo).toBe(true);
    });
  });

  describe('Interface UpdatePilarDto', () => {
    it('deve ter todos os campos opcionais', () => {
      const dto: UpdatePilarDto = {};

      expect(Object.keys(dto).length).toBe(0);
    });

    it('deve permitir atualizar apenas modelo (GAP-2)', () => {
      const dto: UpdatePilarDto = {
        modelo: false,
      };

      expect(dto.modelo).toBe(false);
      expect(dto.nome).toBeUndefined();
    });

    it('deve permitir atualizar campo ativo', () => {
      const dto: UpdatePilarDto = {
        ativo: false,
      };

      expect(dto.ativo).toBe(false);
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('deve lidar com pilar sem ordem (undefined)', () => {
      service.findOne('pilar-2').subscribe((pilar) => {
        expect(pilar.ordem).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-2`);
      req.flush(mockPilarCustomizado);
    });

    it('deve lidar com _count undefined', () => {
      const pilarSemCount = { ...mockPilarPadrao, _count: undefined };

      service.findOne('pilar-sem-count').subscribe((pilar) => {
        expect(pilar._count).toBeUndefined();
      });

      const req = httpMock.expectOne(`${apiUrl}/pilar-sem-count`);
      req.flush(pilarSemCount);
    });

    it('deve lidar com array vazio de pilares', () => {
      service.findAll().subscribe((pilares) => {
        expect(pilares).toEqual([]);
        expect(pilares.length).toBe(0);
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush([]);
    });

    it('deve validar URL correta para cada método', () => {
      service.findAll().subscribe();
      httpMock.expectOne(apiUrl).flush([]);

      service.findOne('id-123').subscribe();
      httpMock.expectOne(`${apiUrl}/id-123`).flush(mockPilarPadrao);

      service.create({ nome: 'Teste' }).subscribe();
      httpMock.expectOne(apiUrl).flush(mockPilarPadrao);

      service.update('id-456', { nome: 'Update' }).subscribe();
      httpMock.expectOne(`${apiUrl}/id-456`).flush(mockPilarPadrao);

      service.remove('id-789').subscribe();
      httpMock.expectOne(`${apiUrl}/id-789`).flush(mockPilarPadrao);

      service.reativar('id-000').subscribe();
      httpMock.expectOne(`${apiUrl}/id-000`).flush(mockPilarPadrao);
    });
  });
});
