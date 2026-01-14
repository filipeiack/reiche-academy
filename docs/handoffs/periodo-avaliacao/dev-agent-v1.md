# Handoff: Implementação de Período de Avaliação Trimestral

**De:** System Engineer  
**Para:** Dev Agent  
**Data:** 2026-01-13  
**Feature:** Período de Avaliação Trimestral  
**Prioridade:** Alta  

---

## 📋 Contexto

Cliente solicitou sistema de períodos de avaliação trimestrais para controlar quando snapshots de médias de pilares são criados.

**Documentos de referência:**
- ✅ [ADR-009](../../adr/009-periodo-avaliacao-trimestral.md) - Decisão arquitetural aprovada
- ✅ [Especificação Técnica](./especificacao-tecnica.md) - Detalhes completos de implementação

---

## 🎯 Objetivo

Implementar sistema completo de períodos de avaliação trimestral, incluindo:

1. **Schema Prisma** + Migration
2. **Backend NestJS** (módulo completo)
3. **Frontend Angular** (2 telas modificadas)
4. **Testes** (unitários backend)
5. **Documentação** de regras de negócio

---

## 📦 Artefatos de Entrada

### 1. ADR Aprovado
- Localização: `/docs/adr/009-periodo-avaliacao-trimestral.md`
- Status: ✅ Aprovado
- Decisão: Criar tabela `PeriodoAvaliacao` com fluxo simplificado (2 ações)

### 2. Especificação Técnica Completa
- Localização: `/docs/handoffs/periodo-avaliacao/especificacao-tecnica.md`
- Conteúdo:
  - Schema Prisma detalhado
  - Migration SQL completa (UP + DOWN)
  - 4 endpoints REST especificados
  - Service methods com lógica completa
  - DTOs de validação
  - Interfaces TypeScript frontend
  - Checklist de implementação

### 3. Contexto do Sistema Existente
- `backend/src/modules/diagnosticos/` - Módulo atual de diagnósticos
- `frontend/src/app/views/pages/diagnostico-notas/` - Tela de lançamento de notas
- `frontend/src/app/views/pages/diagnostico-evolucao/` - Tela de histórico

---

## 🛠️ Tarefas de Implementação

### Fase 1: Backend - Schema e Migration

**Prioridade:** CRÍTICA (bloqueia tudo)

#### Tarefa 1.1: Modificar Schema Prisma
**Arquivo:** `backend/prisma/schema.prisma`

**Ações:**
1. Adicionar relação `periodosAvaliacao` em `model Empresa`
2. Criar `model PeriodoAvaliacao` (após `PilarEmpresa`)
3. Modificar `model PilarEvolucao` (adicionar `periodoAvaliacaoId`)

**Referência:** [Especificação Técnica - Seção 1](./especificacao-tecnica.md#1-alterações-no-schema-prisma)

**Validação:**
```bash
npx prisma format
npx prisma validate
```

#### Tarefa 1.2: Criar e Executar Migration
**Comando:**
```bash
cd backend
npx prisma migrate dev --name add_periodo_avaliacao
```

**Validações pós-migration:**
```sql
-- Verificar tabela criada
SELECT * FROM periodos_avaliacao LIMIT 1;

-- Verificar snapshots migrados
SELECT COUNT(*) FROM pilares_evolucao WHERE periodo_avaliacao_id IS NULL;
-- Deve retornar 0
```

**Referência:** [Especificação Técnica - Seção 2](./especificacao-tecnica.md#2-migration-sql)

---

### Fase 2: Backend - Módulo NestJS

**Prioridade:** ALTA

#### Tarefa 2.1: Criar Estrutura de Módulo
**Pasta:** `backend/src/modules/periodos-avaliacao/`

**Arquivos a criar:**
```
periodos-avaliacao/
├── periodos-avaliacao.module.ts
├── periodos-avaliacao.controller.ts
├── periodos-avaliacao.service.ts
├── dto/
│   ├── create-periodo-avaliacao.dto.ts
│   └── periodo-avaliacao-response.dto.ts
└── tests/
    └── periodos-avaliacao.service.spec.ts
```

#### Tarefa 2.2: Implementar DTOs
**Arquivos:**
- `dto/create-periodo-avaliacao.dto.ts`
- `dto/periodo-avaliacao-response.dto.ts`

**Validações obrigatórias:**
- `dataReferencia`: IsDateString, IsNotEmpty
- Decorators Swagger (@ApiProperty)

**Referência:** [Especificação Técnica - Seção 3.2 e 3.3](./especificacao-tecnica.md#32-dto-create-periodo-avaliacaodtots)

#### Tarefa 2.3: Implementar Service
**Arquivo:** `periodos-avaliacao.service.ts`

**Métodos obrigatórios:**
1. `create()` - Criar período (validar 90 dias, último dia trimestre, período único)
2. `congelar()` - Criar snapshots + fechar período (transação atômica)
3. `findAtual()` - Buscar período aberto
4. `findAll()` - Listar histórico (com filtro opcional por ano)
5. `calcularMediaPilar()` - Helper privado

**Dependências:**
- PrismaService
- AuditService
- date-fns (getQuarter, getYear, differenceInDays, endOfQuarter, isSameDay, format)

**Validações críticas:**
- ✅ Multi-tenant em todos os métodos
- ✅ Intervalo mínimo 90 dias
- ✅ Período único por empresa
- ✅ Transação atômica ao congelar
- ✅ Auditoria completa (CREATE + UPDATE)

**Referência:** [Especificação Técnica - Seção 4](./especificacao-tecnica.md#4-backend-service)

#### Tarefa 2.4: Implementar Controller
**Arquivo:** `periodos-avaliacao.controller.ts`

**Endpoints obrigatórios:**
1. `POST /empresas/:empresaId/periodos-avaliacao` - Criar período
2. `POST /periodos-avaliacao/:id/congelar` - Congelar médias
3. `GET /empresas/:empresaId/periodos-avaliacao/atual` - Buscar período aberto
4. `GET /empresas/:empresaId/periodos-avaliacao` - Listar histórico

**Guards:**
- JwtAuthGuard (todos)
- PerfisGuard (todos)
- @Perfis('ADMINISTRADOR', 'CONSULTOR', 'GESTOR') - endpoints POST

**Referência:** [Especificação Técnica - Seção 5](./especificacao-tecnica.md#5-backend-controller)

#### Tarefa 2.5: Registrar Módulo
**Arquivo:** `backend/src/app.module.ts`

```typescript
import { PeriodosAvaliacaoModule } from './modules/periodos-avaliacao/periodos-avaliacao.module';

@Module({
  imports: [
    // ... outros módulos
    PeriodosAvaliacaoModule,
  ],
})
```

#### Tarefa 2.6: Testes Unitários
**Arquivo:** `tests/periodos-avaliacao.service.spec.ts`

**Casos de teste obrigatórios:**
- ✅ Deve criar período com data válida
- ✅ Deve rejeitar se já houver período aberto
- ✅ Deve rejeitar se intervalo < 90 dias
- ✅ Deve rejeitar se data não for último dia do trimestre
- ✅ Deve congelar período e criar snapshots (mock transaction)
- ✅ Deve rejeitar congelar período já congelado
- ✅ Deve retornar período aberto se existir
- ✅ Deve filtrar histórico por ano

**Referência:** [Especificação Técnica - Seção 9.1](./especificacao-tecnica.md#91-backend-jest)

---

### Fase 3: Frontend - Angular

**Prioridade:** ALTA

#### Tarefa 3.1: Criar Models e Service
**Arquivos:**
- `frontend/src/app/core/models/periodo-avaliacao.model.ts`
- `frontend/src/app/core/services/periodos-avaliacao.service.ts`

**Interfaces obrigatórias:**
- `PeriodoAvaliacao`
- `PeriodoComSnapshots`

**Métodos do service:**
- `create(empresaId, dataReferencia)`
- `congelar(periodoId)`
- `getAtual(empresaId)`
- `getHistorico(empresaId, ano?)`

**Referência:** [Especificação Técnica - Seções 6 e 7](./especificacao-tecnica.md#6-frontend-interfaces-typescript)

#### Tarefa 3.2: Modificar DiagnosticoNotasComponent
**Arquivo:** `frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts`

**Alterações:**
1. Adicionar propriedade `periodoAtual: PeriodoAvaliacao | null`
2. Injetar `PeriodosAvaliacaoService`
3. Chamar `loadPeriodoAtual()` no `ngOnInit` (após `loadMedias`)
4. Criar método `abrirModalIniciarAvaliacao()`
5. Exibir badge condicional no template (se `periodoAtual` existir)

**Template (HTML):**
```html
<!-- Badge: Período em andamento -->
<div *ngIf="periodoAtual" class="alert alert-info mb-3">
  <i class="bi bi-info-circle"></i>
  <strong>Avaliação Q{{ periodoAtual.trimestre }}/{{ periodoAtual.ano }} em andamento</strong>
  <small class="d-block">Iniciada em: {{ periodoAtual.dataInicio | date:'dd/MM/yyyy HH:mm' }}</small>
</div>

<!-- Botão: Iniciar Avaliação -->
<button 
  *ngIf="!periodoAtual && isAdmin" 
  class="btn btn-primary" 
  (click)="abrirModalIniciarAvaliacao()">
  <i class="bi bi-play-circle"></i> Iniciar Avaliação
</button>
```

**Modal de criação:**
- Date picker para `dataReferencia`
- Validação: último dia do trimestre
- Sugestões: 31/03, 30/06, 30/09, 31/12
- Confirmação com SweetAlert2

#### Tarefa 3.3: Modificar DiagnosticoEvolucaoComponent
**Arquivo:** `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts`

**Alterações:**
1. Adicionar propriedades:
   - `periodoAtual: PeriodoAvaliacao | null`
   - `anoFiltro: number = new Date().getFullYear()`
2. Injetar `PeriodosAvaliacaoService`
3. Modificar `loadAllHistorico()`:
   - Buscar `periodoAtual`
   - Buscar `getHistorico(empresaId, anoFiltro)`
   - Mapear para formato do gráfico
4. Modificar método `congelarMedias()`:
   - Usar `periodoAtual.id`
   - Chamar `service.congelar(periodoId)`
   - Recarregar após sucesso
5. Adicionar filtro de ano no template

**Template (HTML):**
```html
<!-- Alert: Período ativo -->
<div *ngIf="periodoAtual" class="alert alert-success">
  <strong>Período Q{{ periodoAtual.trimestre }}/{{ periodoAtual.ano }} ativo</strong>
  (iniciado em {{ periodoAtual.dataInicio | date:'dd/MM/yyyy' }})
</div>

<!-- Botão: Congelar Médias -->
<button 
  class="btn btn-primary btn-lg" 
  [disabled]="!periodoAtual || !canCongelar"
  (click)="congelarMedias()">
  <i class="bi bi-archive"></i> 
  Congelar Médias{{ periodoAtual ? ' do Q' + periodoAtual.trimestre + '/' + periodoAtual.ano : '' }}
</button>

<!-- Filtro: Ano -->
<div class="mb-3">
  <label>Filtrar por ano:</label>
  <select class="form-select" [(ngModel)]="anoFiltro" (change)="loadAllHistorico()">
    <option [value]="2024">2024</option>
    <option [value]="2025">2025</option>
    <option [value]="2026">2026</option>
  </select>
</div>
```

**Modificar `renderBarChart()`:**
- Labels: manter pilares no eixo X
- Datasets: criar 1 dataset por trimestre (não por data)
- Legend: `Q1/2026`, `Q2/2026`, etc

---

### Fase 4: Documentação

**Prioridade:** MÉDIA

#### Tarefa 4.1: Criar Regras de Negócio
**Arquivo:** `docs/business-rules/periodo-avaliacao.md`

**Estrutura:**
```markdown
# Regras de Negócio — Período de Avaliação

## 1. Visão Geral
## 2. Entidades
## 3. Regras Implementadas
  - R-PEVOL-001: Validação de Intervalo Mínimo
  - R-PEVOL-002: Unicidade de Período
  - R-PEVOL-003: Atomicidade ao Congelar
## 4. Endpoints
## 5. Validações
## 6. Comportamentos Condicionais
## 7. Sumário de Regras
```

#### Tarefa 4.2: Atualizar CHANGELOG
**Arquivo:** `CHANGELOG.md`

```markdown
## [Unreleased]

### Added
- Sistema de Período de Avaliação Trimestral
  - Validação de intervalo mínimo (90 dias)
  - Congelamento de médias por trimestre
  - Histórico de evolução com filtro por ano
  - Auditoria completa de criação/congelamento
```

---

## ✅ Critérios de Aceitação

### Backend
- [ ] Migration executada com sucesso (sem erros)
- [ ] Todos os snapshots antigos vinculados a períodos
- [ ] 4 endpoints funcionando e testados
- [ ] Validação de 90 dias implementada
- [ ] Transação atômica ao congelar
- [ ] Auditoria registrada em AuditLog
- [ ] Testes unitários passando (>80% coverage)

### Frontend
- [ ] Badge aparece quando há período aberto
- [ ] Botão "Iniciar Avaliação" funciona (modal + validação)
- [ ] Botão "Congelar Médias" habilitado apenas com período aberto
- [ ] Filtro de ano funciona no histórico
- [ ] Gráfico mostra até 4 barras por ano
- [ ] SweetAlert2 confirma ações críticas

### Documentação
- [ ] `/docs/business-rules/periodo-avaliacao.md` criado
- [ ] CHANGELOG.md atualizado
- [ ] Comentários no código (métodos complexos)

---

## 🚨 Pontos de Atenção

### 1. Migration de Dados Retroativos
**Problema:** Snapshots antigos sem `periodoAvaliacaoId`.

**Solução:** Migration cria períodos retroativos baseados em `createdAt`.

**Validação obrigatória:**
```sql
SELECT COUNT(*) FROM pilares_evolucao WHERE periodo_avaliacao_id IS NULL;
-- Deve retornar 0
```

### 2. Transação Atômica ao Congelar
**Problema:** Falha no meio da criação de snapshots.

**Solução:** `prisma.$transaction` garante rollback automático.

**Teste obrigatório:** Simular erro no meio da transação (mock).

### 3. Validação de Último Dia do Trimestre
**Problema:** Usuário pode enviar data inválida.

**Solução:** Backend valida com `isSameDay(dataRef, endOfQuarter(dataRef))`.

**Teste obrigatório:** Tentar criar período com data 30/03 (deve falhar).

### 4. Multi-Tenant em Todos os Endpoints
**Problema:** Vazamento de dados entre empresas.

**Solução:** Validação em todos os métodos do service.

**Teste obrigatório:** Tentar acessar período de outra empresa (deve retornar 403).

---

## 📊 Estimativa de Tempo

| Fase | Tarefa | Tempo Estimado |
|------|--------|----------------|
| 1 | Schema + Migration | 1h |
| 2.1-2.2 | DTOs | 30min |
| 2.3 | Service | 2h |
| 2.4 | Controller | 1h |
| 2.5 | Registro módulo | 10min |
| 2.6 | Testes backend | 2h |
| 3.1 | Models + Service frontend | 1h |
| 3.2 | DiagnosticoNotas | 2h |
| 3.3 | DiagnosticoEvolucao | 2h |
| 4 | Documentação | 1h |
| **TOTAL** | **≈ 13h** |

---

## 🔄 Fluxo de Entrega

1. **Backend Completo** → Testar no Postman
2. **Frontend Completo** → Testar fluxo no navegador
3. **Documentação** → Revisar com Tech Writer
4. **QA Agent** → Validar testes end-to-end
5. **Merge** → Pull Request para `develop`

---

## 📞 Contato e Dúvidas

**Em caso de ambiguidade ou bloqueio:**
- Consultar [ADR-009](../../adr/009-periodo-avaliacao-trimestral.md) para contexto
- Consultar [Especificação Técnica](./especificacao-tecnica.md) para detalhes
- Reportar bloqueio ao System Engineer

**Não improvisar:**
- Não alterar estrutura do schema sem ADR
- Não remover validações especificadas
- Não bypassar transação atômica

---

## ✅ Checklist Final (Dev Agent)

Antes de marcar como concluído:

- [ ] Migration executada sem erros
- [ ] `npm run start:dev` (backend) roda sem erros
- [ ] `npm run start` (frontend) roda sem erros
- [ ] Testes unitários passando (`npm test`)
- [ ] Endpoints testados manualmente (Postman/Insomnia)
- [ ] Fluxo completo testado no navegador:
  - [ ] Admin pode iniciar período
  - [ ] Badge aparece na tela de notas
  - [ ] Admin pode congelar médias
  - [ ] Histórico mostra períodos congelados
  - [ ] Filtro de ano funciona
- [ ] Código commitado com mensagem clara
- [ ] Documentação criada/atualizada
- [ ] Handoff para QA Agent criado (se necessário)

---

**Status:** ⏳ Aguardando Dev Agent  
**Versão:** 1.0  
**Última Atualização:** 2026-01-13
