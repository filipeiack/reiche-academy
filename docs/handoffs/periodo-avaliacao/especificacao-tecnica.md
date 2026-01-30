# Especificação Técnica: Período de Avaliação Trimestral

**Feature:** Período de Avaliação Trimestral  
**ADR:** [ADR-009](../../adr/009-periodo-avaliacao-trimestral.md)  
**Data:** 2026-01-13  
**Agente Responsável:** System Engineer  
**Próximo Agente:** Dev Agent  

---

## 1. Alterações no Schema Prisma

**Arquivo:** `backend/prisma/schema.prisma`

### 1.1. Adicionar Relação em `Empresa`

```prisma
model Empresa {
  id            String   @id @default(uuid())
  nome          String
  cnpj          String   @unique
  tipoNegocio   String?
  cidade        String
  estado        EstadoBrasil
  ativo         Boolean  @default(true)
  
  // Personalização
  logoUrl       String?
  loginUrl      String?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?
  updatedBy     String?
  
  // Relations
  usuarios            Usuario[]
  pilares             PilarEmpresa[]
  periodosAvaliacao   PeriodoAvaliacao[]  // ← NOVO
  
  @@map("empresas")
}
```

### 1.2. Criar Model `PeriodoAvaliacao`

**Posição:** Após `model PilarEmpresa` e antes de `model RotinaEmpresa`

```prisma
model PeriodoAvaliacao {
  id                String   @id @default(uuid())
  
  empresaId         String
  empresa           Empresa  @relation(fields: [empresaId], references: [id], onDelete: Cascade)
  
  // Período que está sendo avaliado
  trimestre         Int      // 1, 2, 3, 4
  ano               Int      // 2026
  dataReferencia    DateTime // Ex: 2026-03-31 (último dia do trimestre)
  
  // Controle do ciclo
  aberto            Boolean  @default(true)  // true = em avaliação, false = congelado
  dataInicio        DateTime @default(now()) // Quando admin iniciou
  dataCongelamento  DateTime? // Quando admin congelou (null se ainda aberto)
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String?
  updatedBy         String?
  
  // Relations
  snapshots         PilarEvolucao[]
  
  @@unique([empresaId, trimestre, ano]) // Evita duplicatas
  @@index([empresaId, aberto]) // Buscar período aberto rapidamente
  @@map("periodos_avaliacao")
}
```

### 1.3. Modificar Model `PilarEvolucao`

```prisma
model PilarEvolucao {
  id                  String             @id @default(uuid())

  pilarEmpresaId      String
  pilarEmpresa        PilarEmpresa       @relation(fields: [pilarEmpresaId], references: [id], onDelete: Cascade)

  // ✅ NOVO: Vínculo com período
  periodoAvaliacaoId  String
  periodoAvaliacao    PeriodoAvaliacao   @relation(fields: [periodoAvaliacaoId], references: [id], onDelete: Cascade)

  mediaNotas          Float              // 0-10 (não mais nullable)

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String?
  updatedBy         String?
  
  @@unique([pilarEmpresaId, periodoAvaliacaoId]) // ← NOVO: 1 snapshot por pilar por período
  @@index([periodoAvaliacaoId]) // ← NOVO
  @@map("pilares_evolucao")
}
```

---

## 2. Migration SQL

**Comando:** `npx prisma migrate dev --name add_periodo_avaliacao`

### 2.1. Migration UP

```sql
-- CreateTable
CREATE TABLE "periodos_avaliacao" (
    "id" TEXT NOT NULL,
    "empresa_id" TEXT NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "ano" INTEGER NOT NULL,
    "data_referencia" TIMESTAMP(3) NOT NULL,
    "aberto" BOOLEAN NOT NULL DEFAULT true,
    "data_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_congelamento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_by" TEXT,
    "updated_by" TEXT,

    CONSTRAINT "periodos_avaliacao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "periodos_avaliacao_empresa_id_aberto_idx" ON "periodos_avaliacao"("empresa_id", "aberto");

-- CreateIndex
CREATE UNIQUE INDEX "periodos_avaliacao_empresa_id_trimestre_ano_key" ON "periodos_avaliacao"("empresa_id", "trimestre", "ano");

-- AddForeignKey
ALTER TABLE "periodos_avaliacao" ADD CONSTRAINT "periodos_avaliacao_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Adicionar coluna periodo_avaliacao_id (nullable temporariamente)
ALTER TABLE "pilares_evolucao" ADD COLUMN "periodo_avaliacao_id" TEXT;

-- Data Migration: Criar períodos retroativos para snapshots existentes
INSERT INTO periodos_avaliacao (
  id, 
  empresa_id, 
  trimestre, 
  ano, 
  data_referencia, 
  aberto, 
  data_inicio, 
  data_congelamento, 
  created_at,
  updated_at,
  created_by
)
SELECT DISTINCT ON (pe.empresa_id, EXTRACT(QUARTER FROM pev.created_at), EXTRACT(YEAR FROM pev.created_at))
  gen_random_uuid() AS id,
  pe.empresa_id,
  EXTRACT(QUARTER FROM pev.created_at)::int AS trimestre,
  EXTRACT(YEAR FROM pev.created_at)::int AS ano,
  (DATE_TRUNC('quarter', pev.created_at) + INTERVAL '3 months' - INTERVAL '1 day')::date AS data_referencia,
  false AS aberto,
  DATE_TRUNC('quarter', pev.created_at)::timestamptz AS data_inicio,
  MAX(pev.created_at) OVER (PARTITION BY pe.empresa_id, EXTRACT(QUARTER FROM pev.created_at), EXTRACT(YEAR FROM pev.created_at)) AS data_congelamento,
  MIN(pev.created_at) OVER (PARTITION BY pe.empresa_id, EXTRACT(QUARTER FROM pev.created_at), EXTRACT(YEAR FROM pev.created_at)) AS created_at,
  MAX(pev.created_at) OVER (PARTITION BY pe.empresa_id, EXTRACT(QUARTER FROM pev.created_at), EXTRACT(YEAR FROM pev.created_at)) AS updated_at,
  NULL AS created_by
FROM pilares_evolucao pev
JOIN pilares_empresa pe ON pe.id = pev.pilar_empresa_id
WHERE pev.periodo_avaliacao_id IS NULL;

-- Data Migration: Vincular snapshots aos períodos criados
UPDATE pilares_evolucao pev
SET periodo_avaliacao_id = (
  SELECT pa.id
  FROM periodos_avaliacao pa
  JOIN pilares_empresa pe ON pe.empresa_id = pa.empresa_id
  WHERE pev.pilar_empresa_id = pe.id
    AND pa.trimestre = EXTRACT(QUARTER FROM pev.created_at)::int
    AND pa.ano = EXTRACT(YEAR FROM pev.created_at)::int
  LIMIT 1
)
WHERE pev.periodo_avaliacao_id IS NULL;

-- AlterTable: Tornar periodo_avaliacao_id NOT NULL
ALTER TABLE "pilares_evolucao" ALTER COLUMN "periodo_avaliacao_id" SET NOT NULL;

-- AlterTable: Tornar mediaNotas NOT NULL
ALTER TABLE "pilares_evolucao" ALTER COLUMN "media_notas" SET NOT NULL;

-- CreateIndex
CREATE INDEX "pilares_evolucao_periodo_avaliacao_id_idx" ON "pilares_evolucao"("periodo_avaliacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "pilares_evolucao_pilar_empresa_id_periodo_avaliacao_id_key" ON "pilares_evolucao"("pilar_empresa_id", "periodo_avaliacao_id");

-- AddForeignKey
ALTER TABLE "pilares_evolucao" ADD CONSTRAINT "pilares_evolucao_periodo_avaliacao_id_fkey" FOREIGN KEY ("periodo_avaliacao_id") REFERENCES "periodos_avaliacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 2.2. Migration DOWN (Rollback)

```sql
-- DropForeignKey
ALTER TABLE "pilares_evolucao" DROP CONSTRAINT "pilares_evolucao_periodo_avaliacao_id_fkey";

-- DropIndex
DROP INDEX "pilares_evolucao_periodo_avaliacao_id_idx";

-- DropIndex
DROP INDEX "pilares_evolucao_pilar_empresa_id_periodo_avaliacao_id_key";

-- AlterTable
ALTER TABLE "pilares_evolucao" ALTER COLUMN "media_notas" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pilares_evolucao" DROP COLUMN "periodo_avaliacao_id";

-- DropForeignKey
ALTER TABLE "periodos_avaliacao" DROP CONSTRAINT "periodos_avaliacao_empresa_id_fkey";

-- DropTable
DROP TABLE "periodos_avaliacao";
```

---

## 3. Backend: Estrutura de Módulo

### 3.1. Criar Módulo NestJS

**Estrutura de pastas:**

```
backend/src/modules/periodos-avaliacao/
├── periodos-avaliacao.module.ts
├── periodos-avaliacao.controller.ts
├── periodos-avaliacao.service.ts
├── dto/
│   ├── create-periodo-avaliacao.dto.ts
│   └── periodo-avaliacao-response.dto.ts
└── tests/
    ├── periodos-avaliacao.service.spec.ts
    └── periodos-avaliacao.controller.spec.ts
```

### 3.2. DTO: `create-periodo-avaliacao.dto.ts`

```typescript
import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePeriodoAvaliacaoDto {
  @ApiProperty({
    description: 'Data de referência (último dia do trimestre)',
    example: '2026-03-31',
  })
  @IsDateString()
  @IsNotEmpty({ message: 'Data de referência é obrigatória' })
  dataReferencia: string; // ISO 8601
}
```

### 3.3. DTO: `periodo-avaliacao-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class PeriodoAvaliacaoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  empresaId: string;

  @ApiProperty()
  trimestre: number;

  @ApiProperty()
  ano: number;

  @ApiProperty()
  dataReferencia: Date;

  @ApiProperty()
  aberto: boolean;

  @ApiProperty()
  dataInicio: Date;

  @ApiProperty({ nullable: true })
  dataCongelamento: Date | null;

  @ApiProperty()
  createdAt: Date;
}
```

---

## 4. Backend: Service

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts`

### 4.1. Método: `create()`

```typescript
async create(
  empresaId: string,
  dto: CreatePeriodoAvaliacaoDto,
  user: UsuarioAuth,
): Promise<PeriodoAvaliacao> {
  // 1. Validar multi-tenant
  if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }

  // 2. Calcular trimestre e ano
  const dataRef = new Date(dto.dataReferencia);
  const trimestre = getQuarter(dataRef); // date-fns
  const ano = getYear(dataRef);

  // 3. Validar se é último dia do trimestre
  const ultimoDiaTrimestre = endOfQuarter(dataRef);
  if (!isSameDay(dataRef, ultimoDiaTrimestre)) {
    throw new BadRequestException(
      'A data de referência deve ser o último dia do trimestre',
    );
  }

  // 4. Validar se já existe período aberto
  const periodoAberto = await this.prisma.periodoAvaliacao.findFirst({
    where: { empresaId, aberto: true },
  });

  if (periodoAberto) {
    throw new BadRequestException(
      `Já existe um período de avaliação aberto (Q${periodoAberto.trimestre}/${periodoAberto.ano})`,
    );
  }

  // 5. Validar intervalo de 90 dias
  const ultimoPeriodo = await this.prisma.periodoAvaliacao.findFirst({
    where: { empresaId },
    orderBy: { dataReferencia: 'desc' },
  });

  if (ultimoPeriodo) {
    const diffDays = differenceInDays(dataRef, ultimoPeriodo.dataReferencia);
    if (diffDays < 90) {
      throw new BadRequestException(
        `Intervalo mínimo de 90 dias não respeitado. Último período: ${format(
          ultimoPeriodo.dataReferencia,
          'dd/MM/yyyy',
        )}. Faltam ${90 - diffDays} dias.`,
      );
    }
  }

  // 6. Criar período
  const periodo = await this.prisma.periodoAvaliacao.create({
    data: {
      empresaId,
      trimestre,
      ano,
      dataReferencia: dataRef,
      aberto: true,
      createdBy: user.id,
    },
  });

  // 7. Auditar
  await this.auditService.log({
    usuarioId: user.id,
    usuarioNome: user.nome,
    usuarioEmail: user.email || undefined,
    entidade: 'PeriodoAvaliacao',
    entidadeId: periodo.id,
    acao: 'CREATE',
    dadosDepois: { trimestre, ano, dataReferencia: dto.dataReferencia },
  });

  return periodo;
}
```

### 4.2. Método: `congelar()`

```typescript
async congelar(
  periodoId: string,
  user: UsuarioAuth,
): Promise<{ periodo: PeriodoAvaliacao; snapshots: PilarEvolucao[] }> {
  // 1. Buscar período com empresa e pilares
  const periodo = await this.prisma.periodoAvaliacao.findUnique({
    where: { id: periodoId },
    include: {
      empresa: {
        include: {
          pilares: {
            where: { ativo: true },
            include: {
              rotinasEmpresa: {
                where: { ativo: true },
                include: {
                  notas: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!periodo) {
    throw new NotFoundException('Período de avaliação não encontrado');
  }

  // 2. Validar multi-tenant
  if (
    user.perfil?.codigo !== 'ADMINISTRADOR' &&
    user.empresaId !== periodo.empresaId
  ) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }

  // 3. Validar se período está aberto
  if (!periodo.aberto) {
    throw new BadRequestException('Período já está congelado');
  }

  // 4. Transação atômica
  return this.prisma.$transaction(async (tx) => {
    // Criar snapshots de todos os pilares
    const snapshots = await Promise.all(
      periodo.empresa.pilares.map((pilar) => {
        const media = this.calcularMediaPilar(pilar);

        return tx.pilarEvolucao.create({
          data: {
            pilarEmpresaId: pilar.id,
            periodoAvaliacaoId: periodo.id,
            mediaNotas: media,
            createdBy: user.id,
          },
        });
      }),
    );

    // Fechar período
    const periodoAtualizado = await tx.periodoAvaliacao.update({
      where: { id: periodoId },
      data: {
        aberto: false,
        dataCongelamento: new Date(),
        updatedBy: user.id,
      },
    });

    // Auditar
    await this.auditService.log({
      usuarioId: user.id,
      usuarioNome: user.nome,
      usuarioEmail: user.email || undefined,
      entidade: 'PeriodoAvaliacao',
      entidadeId: periodoId,
      acao: 'UPDATE',
      dadosAntes: { aberto: true },
      dadosDepois: {
        aberto: false,
        dataCongelamento: periodoAtualizado.dataCongelamento,
        snapshotsCriados: snapshots.length,
      },
    });

    return { periodo: periodoAtualizado, snapshots };
  });
}

// Helper: Calcular média de um pilar
private calcularMediaPilar(pilar: any): number {
  const rotinasComNota = pilar.rotinasEmpresa.filter(
    (rotina) => rotina.notas.length > 0 && rotina.notas[0].nota !== null,
  );

  if (rotinasComNota.length === 0) return 0;

  const somaNotas = rotinasComNota.reduce(
    (acc, rotina) => acc + rotina.notas[0].nota,
    0,
  );

  return somaNotas / rotinasComNota.length;
}
```

### 4.3. Método: `findAtual()`

```typescript
async findAtual(empresaId: string, user: UsuarioAuth): Promise<PeriodoAvaliacao | null> {
  // Validar multi-tenant
  if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }

  return this.prisma.periodoAvaliacao.findFirst({
    where: { empresaId, aberto: true },
  });
}
```

### 4.4. Método: `findAll()`

```typescript
async findAll(
  empresaId: string,
  ano?: number,
  user?: UsuarioAuth,
): Promise<PeriodoAvaliacao[]> {
  // Validar multi-tenant
  if (user && user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }

  return this.prisma.periodoAvaliacao.findMany({
    where: {
      empresaId,
      ano: ano || undefined,
      aberto: false, // Apenas períodos congelados
    },
    include: {
      snapshots: {
        include: {
          pilarEmpresa: {
            select: { id: true, nome: true },
          },
        },
      },
    },
    orderBy: [{ ano: 'asc' }, { trimestre: 'asc' }],
  });
}
```

---

## 5. Backend: Controller

**Arquivo:** `backend/src/modules/periodos-avaliacao/periodos-avaliacao.controller.ts`

```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UsuarioAuth } from '../auth/interfaces/usuario-auth.interface';
import { PerfisGuard } from '../auth/guards/perfis.guard';
import { Perfis } from '../auth/decorators/perfis.decorator';
import { PeriodosAvaliacaoService } from './periodos-avaliacao.service';
import { CreatePeriodoAvaliacaoDto } from './dto/create-periodo-avaliacao.dto';

@ApiTags('Períodos de Avaliação')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PerfisGuard)
@Controller()
export class PeriodosAvaliacaoController {
  constructor(private readonly service: PeriodosAvaliacaoService) {}

  @Post('empresas/:empresaId/periodos-avaliacao')
  @Perfis('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar novo período de avaliação trimestral' })
  async create(
    @Param('empresaId') empresaId: string,
    @Body() dto: CreatePeriodoAvaliacaoDto,
    @CurrentUser() user: UsuarioAuth,
  ) {
    return this.service.create(empresaId, dto, user);
  }

  @Post('periodos-avaliacao/:id/congelar')
  @Perfis('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Congelar médias do período (criar snapshots)' })
  async congelar(
    @Param('id') periodoId: string,
    @CurrentUser() user: UsuarioAuth,
  ) {
    const result = await this.service.congelar(periodoId, user);
    return {
      message: 'Médias congeladas com sucesso',
      periodo: result.periodo,
      snapshots: result.snapshots,
    };
  }

  @Get('empresas/:empresaId/periodos-avaliacao/atual')
  @ApiOperation({ summary: 'Buscar período aberto (se existir)' })
  async findAtual(
    @Param('empresaId') empresaId: string,
    @CurrentUser() user: UsuarioAuth,
  ) {
    return this.service.findAtual(empresaId, user);
  }

  @Get('empresas/:empresaId/periodos-avaliacao')
  @ApiOperation({ summary: 'Listar histórico de períodos congelados' })
  async findAll(
    @Param('empresaId') empresaId: string,
    @Query('ano') ano?: string,
    @CurrentUser() user?: UsuarioAuth,
  ) {
    const anoNumber = ano ? parseInt(ano, 10) : undefined;
    return this.service.findAll(empresaId, anoNumber, user);
  }
}
```

---

## 6. Frontend: Interfaces TypeScript

**Arquivo:** `frontend/src/app/core/models/periodo-avaliacao.model.ts`

```typescript
export interface PeriodoAvaliacao {
  id: string;
  empresaId: string;
  trimestre: number; // 1-4
  ano: number;
  dataReferencia: string; // ISO 8601
  aberto: boolean;
  dataInicio: string;
  dataCongelamento: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodoComSnapshots extends PeriodoAvaliacao {
  snapshots: {
    id: string;
    pilarEmpresaId: string;
    mediaNotas: number;
    pilarEmpresa: {
      id: string;
      nome: string;
    };
  }[];
}
```

---

## 7. Frontend: Service

**Arquivo:** `frontend/src/app/core/services/periodos-avaliacao.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PeriodoAvaliacao, PeriodoComSnapshots } from '../models/periodo-avaliacao.model';

@Injectable({
  providedIn: 'root'
})
export class PeriodosAvaliacaoService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/empresas`;

  create(empresaId: string, dataReferencia: string): Observable<PeriodoAvaliacao> {
    return this.http.post<PeriodoAvaliacao>(
      `${this.apiUrl}/${empresaId}/periodos-avaliacao`,
      { dataReferencia }
    );
  }

  congelar(periodoId: string): Observable<{
    message: string;
    periodo: PeriodoAvaliacao;
    snapshots: any[];
  }> {
    return this.http.post<any>(
      `${environment.apiUrl}/periodos-avaliacao/${periodoId}/congelar`,
      {}
    );
  }

  getAtual(empresaId: string): Observable<PeriodoAvaliacao | null> {
    return this.http.get<PeriodoAvaliacao | null>(
      `${this.apiUrl}/${empresaId}/periodos-avaliacao/atual`
    );
  }

  getHistorico(empresaId: string, ano?: number): Observable<PeriodoComSnapshots[]> {
    const params = ano ? { ano: ano.toString() } : {};
    return this.http.get<PeriodoComSnapshots[]>(
      `${this.apiUrl}/${empresaId}/periodos-avaliacao`,
      { params }
    );
  }
}
```

---

## 8. Regras de Validação

### 8.1. Backend

- ✅ `dataReferencia` deve ser último dia do trimestre
- ✅ Não pode haver 2 períodos abertos simultaneamente
- ✅ Intervalo mínimo de 90 dias entre períodos
- ✅ Validação multi-tenant em todos os endpoints
- ✅ Período deve estar aberto para ser congelado
- ✅ Transação atômica ao criar snapshots

### 8.2. Frontend

- ✅ Date picker permite apenas datas futuras
- ✅ Sugestão de datas: 31/03, 30/06, 30/09, 31/12
- ✅ Botão "Congelar" desabilitado se não houver período aberto
- ✅ Confirmação antes de congelar (SweetAlert2)
- ✅ Feedback visual durante salvamento (loading)

---

## 9. Testes Obrigatórios

### 9.1. Backend (Jest)

**Arquivo:** `periodos-avaliacao.service.spec.ts`

- ✅ Deve criar período com data válida
- ✅ Deve rejeitar se já houver período aberto
- ✅ Deve rejeitar se intervalo < 90 dias
- ✅ Deve rejeitar se data não for último dia do trimestre
- ✅ Deve congelar período e criar snapshots
- ✅ Deve rejeitar congelar período já congelado
- ✅ Deve retornar período aberto se existir
- ✅ Deve filtrar histórico por ano

### 9.2. Frontend (Jest/Jasmine)

- ✅ Deve exibir badge quando houver período aberto
- ✅ Deve habilitar botão "Congelar" apenas com período aberto
- ✅ Deve validar data no modal de criação
- ✅ Deve filtrar histórico por ano

---

## 10. Checklist de Implementação

### Backend
- [ ] Modificar `schema.prisma`
- [ ] Executar migration
- [ ] Criar módulo `PeriodosAvaliacaoModule`
- [ ] Implementar `PeriodosAvaliacaoService`
- [ ] Implementar `PeriodosAvaliacaoController`
- [ ] Criar DTOs
- [ ] Escrever testes unitários
- [ ] Testar endpoints no Postman/Insomnia
- [ ] Registrar módulo em `AppModule`

### Frontend
- [ ] Criar model `PeriodoAvaliacao`
- [ ] Criar service `PeriodosAvaliacaoService`
- [ ] Modificar `DiagnosticoNotasComponent` (badge + modal)
- [ ] Modificar `DiagnosticoEvolucaoComponent` (botão + filtro)
- [ ] Criar modal `IniciarAvaliacaoModalComponent`
- [ ] Atualizar templates HTML
- [ ] Testar fluxo completo no navegador

### Documentação
- [ ] Atualizar `/docs/business-rules/periodo-avaliacao.md`
- [ ] Atualizar CHANGELOG.md
- [ ] Criar screenshots do fluxo (opcional)

---

**Próximo Passo:** Passar para **Dev Agent** implementar.

---

**Versão:** 1.0  
**Última Atualização:** 2026-01-13
