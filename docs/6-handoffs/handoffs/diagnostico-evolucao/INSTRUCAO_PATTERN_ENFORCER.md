# Instrução para Pattern Enforcer

**Data:** 2025-01-14  
**Origem:** Dev Agent (dev-v1.md)  
**Feature:** Período de Avaliação Trimestral  

---

## 🎯 Objetivo

Validar se a implementação do Dev Agent está em conformidade com:
- `/docs/conventions/` (padrões de código, naming, estrutura)
- Padrões NestJS (modules, controllers, services, DTOs)
- Padrões Angular (standalone components, dependency injection)
- Convenções de banco de dados (Prisma schema, migrations)

---

## 📋 Checklist de Validação

### Backend - NestJS

#### 1. Schema Prisma (`backend/prisma/schema.prisma`)
- [ ] Modelo `PeriodoAvaliacao` segue naming PascalCase
- [ ] Campos seguem camelCase: `periodoAvaliacaoId`, `dataReferencia`, `dataCongelamento`
- [ ] Nome da tabela em snake_case: `@@map("periodos_avaliacao")`
- [ ] Constraints nomeadas corretamente: `@@unique([empresaId, trimestre, ano])`
- [ ] Relations configuradas com onDelete/onUpdate apropriados

#### 2. Migration (`backend/prisma/migrations/.../migration.sql`)
- [ ] Nomes de tabelas em snake_case: `periodos_avaliacao`
- [ ] Nomes de colunas em snake_case: `periodo_avaliacao_id`, `data_referencia`
- [ ] Foreign keys nomeadas: `fk_pilares_evolucao_periodo`
- [ ] Indexes criados para FKs
- [ ] Data migration usa transações (BEGIN/COMMIT)

#### 3. DTOs (`backend/src/modules/periodos-avaliacao/dto/`)
- [ ] Naming: `create-periodo-avaliacao.dto.ts` (kebab-case)
- [ ] Class naming: `CreatePeriodoAvaliacaoDto` (PascalCase)
- [ ] Decorators class-validator: `@IsDateString()`, `@IsNotEmpty()`
- [ ] Decorators Swagger: `@ApiProperty()` com description
- [ ] Campos em camelCase: `dataReferencia`

#### 4. Service (`backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts`)
- [ ] Naming: `periodos-avaliacao.service.ts` (kebab-case)
- [ ] Class: `PeriodosAvaliacaoService` (PascalCase)
- [ ] Decorator `@Injectable()`
- [ ] Constructor injection: `constructor(private readonly prisma: PrismaService)`
- [ ] Métodos em camelCase: `findAtual()`, `calcularMediaPilar()`
- [ ] Métodos privados prefixados adequadamente
- [ ] Error handling com BadRequestException, NotFoundException
- [ ] Validações de negócio antes de persistência
- [ ] Uso de transações onde necessário (`prisma.$transaction`)

#### 5. Controller (`backend/src/modules/periodos-avaliacao/periodos-avaliacao.controller.ts`)
- [ ] Naming: `periodos-avaliacao.controller.ts` (kebab-case)
- [ ] Class: `PeriodosAvaliacaoController` (PascalCase)
- [ ] Decorator `@Controller('periodos-avaliacao')` ou sem prefixo
- [ ] Routes seguem padrão REST:
  - `POST /empresas/:empresaId/periodos-avaliacao`
  - `POST /periodos-avaliacao/:id/congelar`
  - `GET /empresas/:empresaId/periodos-avaliacao/atual`
  - `GET /empresas/:empresaId/periodos-avaliacao`
- [ ] Guards aplicados: `@UseGuards(JwtAuthGuard, PerfisGuard)`
- [ ] Perfis corretos: `@Perfis('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')`
- [ ] Swagger tags: `@ApiTags('Períodos de Avaliação')`
- [ ] Response decorators: `@ApiResponse({ type: PeriodoAvaliacaoResponseDto })`
- [ ] Param decorators: `@Param('empresaId')`, `@Body()`

#### 6. Module (`backend/src/modules/periodos-avaliacao/periodos-avaliacao.module.ts`)
- [ ] Naming: `periodos-avaliacao.module.ts` (kebab-case)
- [ ] Class: `PeriodosAvaliacaoModule` (PascalCase)
- [ ] Decorator `@Module({...})`
- [ ] Imports: `[PrismaModule, AuditModule]`
- [ ] Controllers: `[PeriodosAvaliacaoController]`
- [ ] Providers: `[PeriodosAvaliacaoService]`
- [ ] Exports: `[PeriodosAvaliacaoService]` (se outros módulos usarem)

#### 7. App Module (`backend/src/app.module.ts`)
- [ ] Import statement no topo: `import { PeriodosAvaliacaoModule } from './modules/periodos-avaliacao/periodos-avaliacao.module'`
- [ ] Registro em imports: array inclui `PeriodosAvaliacaoModule`
- [ ] Ordenação alfabética mantida (se convenção existir)

---

### Frontend - Angular

#### 8. Models (`frontend/src/app/core/models/periodo-avaliacao.model.ts`)
- [ ] Naming: `periodo-avaliacao.model.ts` (kebab-case)
- [ ] Interfaces em PascalCase: `PeriodoAvaliacao`, `PeriodoComSnapshots`
- [ ] Campos em camelCase: `periodoAvaliacaoId`, `dataReferencia`
- [ ] Export explícito de cada interface

#### 9. Service (`frontend/src/app/core/services/periodos-avaliacao.service.ts`)
- [ ] Naming: `periodos-avaliacao.service.ts` (kebab-case)
- [ ] Class: `PeriodosAvaliacaoService` (PascalCase)
- [ ] Decorator `@Injectable({ providedIn: 'root' })`
- [ ] Dependency injection via `inject()` (Angular 14+): `private http = inject(HttpClient)`
- [ ] Métodos retornam `Observable<T>`
- [ ] URLs usam `environment.apiUrl`
- [ ] Métodos em camelCase: `getAtual()`, `iniciar()`, `congelar()`, `getHistorico()`
- [ ] Parâmetros tipados: `empresaId: string`, `ano?: number`

#### 10. Components - TypeScript

**DiagnosticoNotasComponent:**
- [ ] Imports organizados (CommonModule, FormsModule, services, models)
- [ ] Dependency injection via `inject()`: `private periodosService = inject(PeriodosAvaliacaoService)`
- [ ] Propriedades tipadas: `periodoAtual: PeriodoAvaliacao | null`
- [ ] Métodos privados prefixados: `private loadPeriodoAtual()`
- [ ] Métodos públicos expostos ao template
- [ ] Subscription cleanup no `ngOnDestroy()`

**DiagnosticoEvolucaoComponent:**
- [ ] Mesmas validações do componente anterior
- [ ] Array tipado: `anosDisponiveis: number[]`
- [ ] Default values adequados: `anoFiltro = new Date().getFullYear()`

#### 11. Components - HTML Templates

**DiagnosticoNotasComponent:**
- [ ] Uso de control flow Angular 17+: `@if`, `@for`
- [ ] Event binding: `(click)="metodo()"`
- [ ] Property binding: `[disabled]="condicao"`
- [ ] Two-way binding: `[(ngModel)]="propriedade"`
- [ ] Interpolation: `{{ expressao }}`
- [ ] CSS classes condicionais: `[class.disabled]="condicao"`

**DiagnosticoEvolucaoComponent:**
- [ ] Mesmas validações do template anterior
- [ ] Tooltips: `ngbTooltip="texto"`
- [ ] Options de select dentro de `@for`

---

## 🔍 Pontos de Atenção Específicos

### Validações de Negócio
1. **Service - create()**:
   - Validar se `isSameDay(dataRef, endOfQuarter(dataRef))` está correto
   - Verificar cálculo de `differenceInDays()` para intervalo de 90 dias
   - Confirmar query `findFirst({ where: { empresaId, aberto: true } })`

2. **Service - congelar()**:
   - Validar uso de `prisma.$transaction()` para atomicidade
   - Verificar se todos os pilares ativos são incluídos
   - Confirmar atualização de `aberto = false` e `dataCongelamento`

3. **Service - calcularMediaPilar()**:
   - Validar filtro `rotinasComNota.length > 0 && nota !== null`
   - Confirmar retorno de `null` quando sem notas

### Frontend - Validações Client-Side
1. **DiagnosticoNotasComponent - confirmarIniciarPeriodo()**:
   - Validar cálculo correto do último dia do trimestre
   - Verificar comparação de `getDate()` e `getMonth()`
   - Confirmar mensagem de erro clara

2. **DiagnosticoEvolucaoComponent - renderBarChart()**:
   - Validar extração de trimestres únicos (`Set<string>`)
   - Confirmar ordenação numérica (`parseInt(trimestre.substring(1))`)
   - Verificar mapeamento correto de dados para cada trimestre

---

## ⚠️ Possíveis Problemas a Verificar

### Backend
- [ ] Import circular entre módulos
- [ ] Uso de `any` em tipagens (deveria ser evitado)
- [ ] Queries Prisma sem tratamento de erro
- [ ] Validações de DTO incompletas
- [ ] Guards ausentes em endpoints sensíveis

### Frontend
- [ ] Memory leaks (subscriptions não destruídas)
- [ ] Uso de `any` em tipagens
- [ ] Propriedades públicas desnecessárias
- [ ] Falta de null checks em templates (`periodoAtual?.propriedade`)
- [ ] Imports não utilizados

### Migration
- [ ] Falta de índices em foreign keys
- [ ] Data migration sem tratamento de casos extremos
- [ ] Reversão (rollback) não contemplada

---

## 📊 Critérios de Aprovação

Para passar na validação do Pattern Enforcer:

✅ **CONFORME**: Todos os checkboxes marcados, nenhuma violação crítica  
⚠️ **CONFORME COM RESSALVAS**: Pequenos desvios (naming inconsistente, falta de comentários)  
❌ **NÃO CONFORME**: Violações de padrões arquiteturais, falta de guards, tipagem incorreta

---

## 🎬 Ação Esperada

1. **Executar validação completa** usando este checklist
2. **Gerar relatório** em formato:
   ```
   /docs/handoffs/diagnostico-evolucao/pattern-enforcer-v1.md
   ```
3. **Classificar resultado**: CONFORME | CONFORME COM RESSALVAS | NÃO CONFORME
4. **Se NÃO CONFORME**: listar correções obrigatórias e devolver ao Dev Agent
5. **Se CONFORME**: aprovar handoff para QA Unitário

---

## 📚 Documentos de Referência

- `/docs/conventions/` - Convenções gerais do projeto
- `/docs/architecture/` - Padrões arquiteturais
- `/docs/FLOW.md` - Fluxo de desenvolvimento
- `/docs/DOCUMENTATION_AUTHORITY.md` - Hierarquia de autoridade

---

**Arquivo criado pelo Dev Agent para orientar Pattern Enforcer**  
**Próxima ação:** Ativar Pattern Enforcer com comando "Atue como Pattern Enforcer"
