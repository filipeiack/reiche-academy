# Instruções Completas — Dev Agent: Cockpit de Pilares

**Feature:** Cockpit de Pilares (MVP Fase 1)  
**Agente Responsável:** Dev Agent  
**Status:** 🟢 PRONTO PARA IMPLEMENTAÇÃO  
**Prioridade:** ALTA  
**Complexidade:** MÉDIA-ALTA  
**Data:** 2026-01-15

---

## 📋 Índice

1. [Visão Geral](#1-visão-geral)
2. [Documentação Normativa Obrigatória](#2-documentação-normativa-obrigatória)
3. [Pré-requisitos](#3-pré-requisitos)
4. [Checklist de Implementação](#4-checklist-de-implementação)
5. [Ordem de Execução](#5-ordem-de-execução)
6. [Validação e Testes](#6-validação-e-testes)
7. [Critérios de Aceitação](#7-critérios-de-aceitação)
8. [Handoff para QA](#8-handoff-para-qa)

---

## 1. Visão Geral

### O que você vai implementar?

Um **painel gerencial especializado por pilar** que permite:
- ✅ Criar cockpit para pilar específico
- ✅ Definir contexto (entradas, saídas, missão)
- ✅ Gestão de indicadores customizados com propriedades específicas
- ✅ Valores mensais (jan-dez + anual) com meta/realizado
- ✅ Vinculação automática de rotinas como processos prioritários
- ✅ Gráficos de evolução temporal (meta vs realizado)
- ✅ Backend completo (CRUD + validações)
- ✅ Frontend completo (dashboard + matriz + gráficos)

### Escopo do MVP (Fase 1)

**Incluído:**
- Cockpit + Indicadores + Processos Prioritários + Gráficos

**Excluído (fases futuras):**
- Matriz de cargos e funções (Fase 2)
- Plano de ação com 5 Porquês (Fase 3)
- Otimizações (export Excel/PDF, comparações) (Fase 4)

---

## 2. Documentação Normativa Obrigatória

### 📄 Documentos de Fonte de Verdade

**LEIA TODOS antes de começar. Ordem de precedência:**

#### 2.1. Regras de Negócio (System Engineer)
📄 **`/docs/business-rules/cockpit-pilares.md`** (743 linhas)

**O QUE CONTÉM:**
- 7 entidades completas (CockpitPilar, IndicadorCockpit, IndicadorMensal, ProcessoPrioritario, CargoCockpit, FuncaoCargo, AcaoCockpit)
- 4 enums (TipoMedidaIndicador, StatusMedicaoIndicador, DirecaoIndicador, StatusProcesso)
- 6 regras de negócio formalizadas (R-COCKPIT-001 a R-COCKPIT-006)
- Validações de multi-tenancy, RBAC, auditoria

**O QUE VOCÊ DEVE FAZER:**
- ✅ Implementar TODAS as regras exatamente como especificado
- ✅ Validar todos os campos conforme descrição
- ✅ Seguir validações de negócio (multi-tenant, RBAC, soft delete)
- ❌ NÃO inventar regras não documentadas
- ❌ NÃO pular validações

---

#### 2.2. Handoff Técnico (System Engineer)
📄 **`/docs/handoffs/cockpit-pilares/system-engineer-v1.md`** (838 linhas)

**O QUE CONTÉM:**
- Endpoints obrigatórios com método, path, perfis, DTOs
- Estrutura de arquivos backend/frontend
- DTOs com validações (class-validator)
- Exemplos de código (auto-vinculação, auto-criação de meses)
- Validações de negócio detalhadas
- Checklist de implementação
- Critérios de aceitação

**O QUE VOCÊ DEVE FAZER:**
- ✅ Criar TODOS os endpoints especificados
- ✅ Usar DTOs com validações exatas
- ✅ Implementar auto-vinculação de rotinas ao criar cockpit
- ✅ Implementar auto-criação de 13 meses ao criar indicador
- ✅ Seguir estrutura de arquivos sugerida
- ❌ NÃO criar endpoints não especificados
- ❌ NÃO usar DTOs sem validações

---

#### 2.3. Atualização v1.1 (System Engineer)
📄 **`/docs/handoffs/cockpit-pilares/ATUALIZACAO_v1.1.md`** (244 linhas)

**O QUE CONTÉM:**
- Esclarecimento: ProcessoPrioritario é VÍNCULO (não snapshot)
- Fase 2 (gráficos) integrada no MVP
- Terminologia corrigida ("auto-vinculação" vs "auto-importação")

**O QUE VOCÊ DEVE FAZER:**
- ✅ ProcessoPrioritario: apenas FK `rotinaEmpresaId` (não copiar nome/criticidade/nota)
- ✅ Nome, criticidade, nota da rotina vêm via JOIN no backend
- ✅ Apenas `statusMapeamento` e `statusTreinamento` são editáveis
- ✅ Implementar componente de gráficos no MVP (não deixar para depois)

---

#### 2.4. Relatório de Validação (Business Rules Extractor)
📄 **`/docs/handoffs/cockpit-pilares/EXTRACTOR_VALIDATION_REPORT.md`**

**O QUE CONTÉM:**
- ✅ Pontos conformes (modelo de dados, regras, handoff, consistência)
- ⚠️ Pontos de atenção (biblioteca de gráficos, validação de range, performance N+1)
- ❌ Inconsistências críticas (nenhuma)
- 📋 Lacunas identificadas (RBAC frontend, feedback visual, testes E2E)

**O QUE VOCÊ DEVE FAZER:**
- ✅ Verificar biblioteca de gráficos existente ANTES de instalar nova
- ✅ Validar range 0-10 em NotaRotina (se não existir, adicionar)
- ✅ Otimizar query de gráficos (usar `include` com `where` aninhado)
- ✅ Extrair padrões RBAC e auto-save de diagnostico-notas
- ⚠️ Considerar limite de indicadores por cockpit (opcional)

---

#### 2.5. Padrões Frontend (Business Rules Extractor)
📄 **`/docs/conventions/cockpit-pilares-frontend.md`** (1303 linhas)

**O QUE CONTÉM:**
- Estrutura de componentes standalone
- Injeção de dependências (inject(), ViewChild)
- Auto-save completo (debounce 1000ms, cache Map, retry 3x)
- Feedback visual (saving indicator, lastSaveTime, SweetAlert2)
- RBAC frontend (getters, condicionais @if)
- Modais NgBootstrap (abertura, callbacks)
- Gestão de estado (cache local, sessionStorage)
- Ciclo de vida (ngOnInit, ngOnDestroy)
- Exemplo completo resumido

**O QUE VOCÊ DEVE FAZER:**
- ✅ COPIAR padrão exato de diagnostico-notas
- ✅ Auto-save: debounceTime(1000ms), MAX_RETRIES=3, retry delay 2000ms
- ✅ Feedback: savingCount, lastSaveTime, SweetAlert2 toasts
- ✅ RBAC: getters (canEdit, canEditValoresMensais, isReadOnly)
- ✅ Cache: Map<string, objeto> para valores em edição
- ❌ NÃO inventar padrões novos (seguir diagnostico-notas)

---

#### 2.6. Mockup de Interface (Business Rules Extractor)
📄 **`/docs/handoffs/cockpit-pilares/UI_MOCKUP.md`**

**O QUE CONTÉM:**
- Layout completo da matriz de indicadores
- Card de propriedades do indicador (Tipo, Status, Responsável, Melhor)
- Tabela de valores mensais (jan-dez + anual)
- Modais de criar/editar indicador
- Comportamento de auto-save
- Fórmulas de cálculo (desvio, status)
- Exemplo de HTML/TypeScript

**O QUE VOCÊ DEVE FAZER:**
- ✅ Implementar layout EXATAMENTE como mockup
- ✅ Card de propriedades FORA da tabela mensal
- ✅ Campos: Tipo Medida, Status, Responsável, Melhor (editáveis no modal)
- ✅ Tabela mensal: Meta/Realizado editáveis inline, Desvio/Status calculados
- ✅ Seguir fórmulas de cálculo especificadas
- ✅ Cores: 🟢 atingiu meta, 🟡 ≥80%, 🔴 <80%

---

#### 2.7. Convenções Gerais

📄 **`/docs/conventions/backend.md`** (1162 linhas)  
📄 **`/docs/conventions/frontend.md`** (2307 linhas)  
📄 **`/docs/conventions/naming.md`**  

**O QUE VOCÊ DEVE FAZER:**
- ✅ Seguir padrões de módulos existentes (PilarEmpresa, RotinaEmpresa, Diagnosticos)
- ✅ Multi-tenancy: validar empresaId em TODOS os endpoints
- ✅ RBAC: Guards + @Roles em TODOS os controllers
- ✅ Auditoria: AuditService em TODAS operações CUD
- ✅ Soft delete: campo `ativo` (nunca deletar permanentemente)

---

#### 2.8. Modelos Relacionados (Contexto)

📄 **`/docs/business-rules/pilares-empresa.md`** (1240 linhas)  
📄 **`/docs/business-rules/rotinas-empresa.md`** (235 linhas)  
📄 **`/docs/business-rules/diagnosticos.md`**  

**O QUE VOCÊ DEVE FAZER:**
- ✅ Estudar padrão de snapshot (PilarEmpresa, RotinaEmpresa)
- ✅ Entender multi-tenancy via empresaId
- ✅ Entender RBAC existente (ADMINISTRADOR, GESTOR, COLABORADOR, CONSULTOR, LEITURA)

---

## 3. Pré-requisitos

### 3.1. Prisma Schema

✅ **JÁ IMPLEMENTADO** (196 linhas adicionadas)

**Arquivo:** `backend/prisma/schema.prisma`

**Modelos criados:**
- CockpitPilar (7 campos)
- IndicadorCockpit (11 campos)
- IndicadorMensal (7 campos)
- ProcessoPrioritario (8 campos)
- CargoCockpit (8 campos - Fase 2)
- FuncaoCargo (10 campos - Fase 2)
- AcaoCockpit (14 campos - Fase 3)

**Enums criados:**
- TipoMedidaIndicador (REAL, QUANTIDADE, TEMPO, PERCENTUAL)
- StatusMedicaoIndicador (NAO_MEDIDO, MEDIDO_NAO_CONFIAVEL, MEDIDO_CONFIAVEL)
- DirecaoIndicador (MAIOR, MENOR)
- StatusProcesso (PENDENTE, EM_ANDAMENTO, CONCLUIDO)

**Próximos passos:**
```bash
cd backend
npx prisma migrate dev --name add-cockpit-pilares
npx prisma generate
```

---

### 3.2. Biblioteca de Gráficos (Frontend)

⚠️ **VERIFICAR ANTES DE INSTALAR**

**Ação obrigatória:**
```bash
cd frontend
grep -i "chart\|graph\|plot" package.json
```

**Opções:**
1. **ng2-charts** (wrapper Angular para Chart.js) - Recomendado
2. **Chart.js puro** - Mais leve
3. **ApexCharts** - Alternativa moderna

**Se não existir:**
```bash
npm install ng2-charts chart.js
```

**IMPORTANTE:** Consultar Pattern Enforcer se houver dúvida sobre qual biblioteca usar.

---

## 4. Checklist de Implementação

### ✅ Fase 1A: Backend Base

- [ ] **1.1. Executar migration**
  ```bash
  cd backend
  npx prisma migrate dev --name add-cockpit-pilares
  npx prisma generate
  ```

- [ ] **1.2. Criar módulo NestJS**
  ```
  backend/src/modules/cockpit-pilares/
  ├── cockpit-pilares.module.ts
  ├── cockpit-pilares.controller.ts
  ├── cockpit-pilares.service.ts
  └── dto/
      ├── create-cockpit-pilar.dto.ts
      ├── update-cockpit-pilar.dto.ts
      ├── create-indicador-cockpit.dto.ts
      ├── update-indicador-cockpit.dto.ts
      ├── update-indicador-mensal.dto.ts
      └── update-processo-prioritario.dto.ts
  ```

- [ ] **1.3. Criar DTOs com validações**
  - Usar `class-validator` (@IsString, @IsNotEmpty, @IsEnum, @IsUUID, etc)
  - Seguir exemplos em `/docs/handoffs/cockpit-pilares/system-engineer-v1.md` (seção 6)
  - Validar enums (TipoMedidaIndicador, StatusMedicaoIndicador, DirecaoIndicador, StatusProcesso)

- [ ] **1.4. Implementar CockpitPilaresService**
  - [ ] `createCockpit()` - com auto-vinculação de rotinas
  - [ ] `getCockpitById()` - com joins (pilarEmpresa, indicadores, processos)
  - [ ] `getCockpitsByEmpresa()` - listar cockpits da empresa
  - [ ] `updateCockpit()` - editar entradas/saídas/missão
  - [ ] `deleteCockpit()` - soft delete (ativo = false)

- [ ] **1.5. Implementar auto-vinculação de rotinas**
  ```typescript
  // Ao criar cockpit:
  // 1. Buscar rotinas ativas do pilar
  const rotinas = await this.prisma.rotinaEmpresa.findMany({
    where: { pilarEmpresaId, ativo: true },
    orderBy: { ordem: 'asc' }
  });
  
  // 2. Criar vínculos (ProcessoPrioritario)
  const processos = rotinas.map((rotina, index) => ({
    cockpitPilarId: cockpit.id,
    rotinaEmpresaId: rotina.id,  // APENAS FK (não snapshot)
    statusMapeamento: 'PENDENTE',
    statusTreinamento: 'PENDENTE',
    ordem: index + 1
  }));
  
  await this.prisma.processoPrioritario.createMany({ data: processos });
  ```

- [ ] **1.6. Implementar CockpitPilaresController**
  - [ ] Guards: `@UseGuards(JwtAuthGuard, RolesGuard)`
  - [ ] Decorators: `@Roles('ADMINISTRADOR', 'GESTOR')`
  - [ ] POST `/empresas/:empresaId/pilares/:pilarEmpresaId/cockpit`
  - [ ] GET `/empresas/:empresaId/cockpits`
  - [ ] GET `/cockpits/:cockpitId`
  - [ ] PATCH `/cockpits/:cockpitId`
  - [ ] DELETE `/cockpits/:cockpitId`

- [ ] **1.7. Validações multi-tenant**
  ```typescript
  // CRÍTICO: Validar em TODOS os métodos do service
  if (usuario.perfil.codigo !== 'ADMINISTRADOR') {
    const cockpit = await this.prisma.cockpitPilar.findUnique({
      where: { id: cockpitId },
      include: { pilarEmpresa: { include: { empresa: true } } }
    });
    
    if (cockpit.pilarEmpresa.empresaId !== usuario.empresaId) {
      throw new ForbiddenException('Acesso negado');
    }
  }
  ```

- [ ] **1.8. Integrar AuditService**
  - Registrar CREATE, UPDATE, DELETE em todas operações
  - Usar campos `createdBy`, `updatedBy`

---

### ✅ Fase 1B: Backend - Indicadores

- [ ] **2.1. Implementar IndicadoresService (ou incluir em CockpitPilaresService)**
  - [ ] `createIndicador()` - com auto-criação de 13 meses
  - [ ] `updateIndicador()` - editar propriedades
  - [ ] `deleteIndicador()` - soft delete
  - [ ] `updateValoresMensais()` - batch update de meta/realizado

- [ ] **2.2. Implementar auto-criação de 13 meses**
  ```typescript
  // Ao criar indicador:
  const anoAtual = new Date().getFullYear();
  
  const meses = [
    ...Array.from({ length: 12 }, (_, i) => ({
      indicadorCockpitId: indicador.id,
      mes: i + 1,
      ano: anoAtual
    })),
    {
      indicadorCockpitId: indicador.id,
      mes: null, // Resumo anual
      ano: anoAtual
    }
  ];
  
  await this.prisma.indicadorMensal.createMany({ data: meses });
  ```

- [ ] **2.3. Implementar endpoints de indicadores**
  - [ ] POST `/cockpits/:cockpitId/indicadores`
  - [ ] PATCH `/indicadores/:indicadorId`
  - [ ] DELETE `/indicadores/:indicadorId`
  - [ ] PATCH `/indicadores/:indicadorId/meses` (batch update)
  - [ ] GET `/indicadores/:indicadorId/meses?ano=2026`

- [ ] **2.4. Validações específicas**
  - Nome único por cockpit (constraint `@@unique([cockpitPilarId, nome])`)
  - Responsável deve ser usuário da mesma empresa
  - Enums válidos (TipoMedidaIndicador, StatusMedicaoIndicador, DirecaoIndicador)
  - Mês entre 1-12 ou null (resumo anual)

---

### ✅ Fase 1C: Backend - Processos Prioritários

- [ ] **3.1. Implementar endpoint de atualização de status**
  - [ ] PATCH `/processos-prioritarios/:processoId`
  - Body: `{ "statusMapeamento": "CONCLUIDO", "statusTreinamento": "EM_ANDAMENTO" }`

- [ ] **3.2. Endpoint de listagem com JOIN**
  ```typescript
  // GET /cockpits/:cockpitId/processos
  await this.prisma.processoPrioritario.findMany({
    where: { cockpitPilarId },
    include: {
      rotinaEmpresa: {
        include: {
          notas: { orderBy: { createdAt: 'desc' }, take: 1 }
        }
      }
    },
    orderBy: { ordem: 'asc' }
  });
  
  // Frontend receberá: nome, criticidade, nota (via join - read-only)
  // Apenas statusMapeamento e statusTreinamento são editáveis
  ```

---

### ✅ Fase 1D: Backend - Gráficos

- [ ] **4.1. Endpoint de dados agregados**
  ```typescript
  // GET /cockpits/:cockpitId/graficos/dados?ano=2026
  
  @Get(':cockpitId/graficos/dados')
  async getDadosGraficos(
    @Param('cockpitId') cockpitId: string,
    @Query('ano') ano: string
  ) {
    const anoNum = parseInt(ano) || new Date().getFullYear();
    
    // CRÍTICO: Otimizar query (usar include com where aninhado)
    const indicadores = await this.prisma.indicadorCockpit.findMany({
      where: { cockpitPilarId: cockpitId, ativo: true },
      include: {
        mesesIndicador: {
          where: { ano: anoNum },
          orderBy: { mes: 'asc' }
        },
        responsavelMedicao: { select: { nome: true } }
      },
      orderBy: { ordem: 'asc' }
    });
    
    return { ano: anoNum, indicadores };
  }
  ```

- [ ] **4.2. Considerar índice composto**
  ```prisma
  // prisma/schema.prisma
  model IndicadorMensal {
    // ...
    @@index([indicadorCockpitId, ano, mes])
  }
  ```

---

### ✅ Fase 1E: Backend - Testes Unitários

- [ ] **5.1. Criar `cockpit-pilares.service.spec.ts`**
  - [ ] Teste: Deve criar cockpit e importar rotinas automaticamente
  - [ ] Teste: Deve validar multi-tenant (GESTOR só acessa própria empresa)
  - [ ] Teste: Deve criar indicador com 13 meses vazios
  - [ ] Teste: Deve atualizar valores mensais (batch)
  - [ ] Teste: Deve validar responsável pertence à empresa
  - [ ] Teste: Deve validar nome de indicador único por cockpit

- [ ] **5.2. Cobertura mínima: 80%**
  ```bash
  npm run test:cov
  ```

---

### ✅ Fase 1F: Frontend Base

- [ ] **6.1. Verificar biblioteca de gráficos**
  ```bash
  grep -i "chart\|graph" frontend/package.json
  ```
  - Se não existir: `npm install ng2-charts chart.js`

- [ ] **6.2. Criar estrutura de componentes**
  ```
  frontend/src/app/views/pages/cockpit-pilares/
  ├── cockpit-dashboard/
  │   ├── cockpit-dashboard.component.ts
  │   ├── cockpit-dashboard.component.html
  │   └── cockpit-dashboard.component.scss
  ├── matriz-indicadores/
  │   └── ...
  ├── grafico-indicadores/
  │   └── ...
  ├── matriz-processos/
  │   └── ...
  └── modals/
      ├── criar-cockpit-modal/
      ├── criar-indicador-modal/
      └── editar-indicador-modal/
  ```

- [ ] **6.3. Criar service Angular**
  ```typescript
  // frontend/src/app/core/services/cockpit-pilares.service.ts
  
  @Injectable({ providedIn: 'root' })
  export class CockpitPilaresService {
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;
    
    createCockpit(empresaId: string, pilarEmpresaId: string, dto: CreateCockpitDto): Observable<CockpitPilar> {
      return this.http.post<CockpitPilar>(
        `${this.apiUrl}/empresas/${empresaId}/pilares/${pilarEmpresaId}/cockpit`,
        dto
      );
    }
    
    getCockpitById(cockpitId: string): Observable<CockpitPilar> {
      return this.http.get<CockpitPilar>(`${this.apiUrl}/cockpits/${cockpitId}`);
    }
    
    // ... outros métodos conforme endpoints do backend
  }
  ```

- [ ] **6.4. Adicionar ao menu lateral (sidebar)**
  ```typescript
  // Adicionar em menu.service.ts ou similar
  {
    label: 'Cockpits',
    icon: 'feather icon-target',
    link: '/cockpits',
    roles: ['ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'CONSULTOR']
  }
  ```

---

### ✅ Fase 1G: Frontend - Dashboard e Lista

- [ ] **7.1. Componente de lista de cockpits**
  - Card grid com nome do pilar, total de indicadores, total de processos
  - Botão "Abrir Dashboard"

- [ ] **7.2. Componente dashboard do cockpit**
  - Estrutura em abas: Contexto | Indicadores | Gráficos | Processos
  - Botão "Voltar para Diagnóstico" ou "Voltar para Lista"

- [ ] **7.3. Adicionar botão em Diagnóstico de Pilares**
  ```html
  <!-- diagnostico-notas.component.html -->
  <!-- Dentro do dropdown de ações do pilar -->
  
  <a ngbDropdownItem (click)="abrirCockpit(pilar); $event.preventDefault()">
    @if (pilar.cockpit) {
      <i class="feather icon-target"></i>
      <span>Abrir Cockpit</span>
    } @else {
      <i class="feather icon-plus-circle"></i>
      <span>Criar Cockpit</span>
    }
  </a>
  ```

- [ ] **7.4. Modal de criar cockpit**
  - Campos: entradas (opcional), saídas (opcional), missão (opcional)
  - Após criar: redirecionar para dashboard do cockpit

---

### ✅ Fase 1H: Frontend - Matriz de Indicadores

**⚠️ CRÍTICO: Seguir EXATAMENTE o mockup em `/docs/handoffs/cockpit-pilares/UI_MOCKUP.md`**

- [ ] **8.1. Estrutura do componente**
  ```typescript
  // matriz-indicadores.component.ts
  
  @Component({
    selector: 'app-matriz-indicadores',
    standalone: true,
    imports: [CommonModule, FormsModule, NgSelectModule, /* ... */],
    templateUrl: './matriz-indicadores.component.html',
    styleUrl: './matriz-indicadores.component.scss'
  })
  export class MatrizIndicadoresComponent implements OnInit, OnDestroy {
    @Input() cockpitId: string;
    
    indicadores: IndicadorCockpit[] = [];
    
    // Auto-save (COPIAR de diagnostico-notas)
    private autoSaveSubject = new Subject<AutoSaveQueueItem>();
    private autoSaveSubscription?: Subscription;
    private readonly MAX_RETRIES = 3;
    savingCount = 0;
    lastSaveTime: Date | null = null;
    
    // Cache local
    private valoresMensaisCache = new Map<string, { meta: number | null, realizado: number | null }>();
    
    // RBAC
    get canEdit(): boolean {
      const user = this.authService.getCurrentUser();
      const perfil = typeof user?.perfil === 'object' ? user.perfil.codigo : user?.perfil;
      return ['ADMINISTRADOR', 'GESTOR'].includes(perfil);
    }
    
    get canEditValoresMensais(): boolean {
      const user = this.authService.getCurrentUser();
      const perfil = typeof user?.perfil === 'object' ? user.perfil.codigo : user?.perfil;
      return ['ADMINISTRADOR', 'GESTOR', 'COLABORADOR'].includes(perfil);
    }
  }
  ```

- [ ] **8.2. Layout do indicador**
  - Cabeçalho: # | Nome | Descrição | [Editar] [🗑️]
  - Card de propriedades (FORA da tabela):
    - Tipo Medida: R$ | # | h | %
    - Status: 🟢🟡🔴
    - Responsável: Nome do usuário
    - Melhor: ↑ ou ↓
  - Tabela mensal: Mês | Melhor | Meta | Realizado | Desvio | Status

- [ ] **8.3. Auto-save de meta/realizado**
  ```typescript
  // COPIAR padrão EXATO de diagnostico-notas
  
  private setupAutoSave(): void {
    this.autoSaveSubscription = this.autoSaveSubject
      .pipe(
        debounceTime(1000), // FIXO 1000ms
        distinctUntilChanged((prev, curr) => 
          prev.indicadorMensalId === curr.indicadorMensalId &&
          prev.data.meta === curr.data.meta &&
          prev.data.realizado === curr.data.realizado
        )
      )
      .subscribe((item) => this.executeSave(item));
  }
  
  onValorMensalChange(indicadorMensalId: string, mes: number, campo: 'meta' | 'realizado', valor: any): void {
    // Converter tipo
    const valorConverted = valor === '' || valor === null ? null : Number(valor);
    
    // Atualizar cache
    const cached = this.valoresMensaisCache.get(indicadorMensalId) || { meta: null, realizado: null };
    cached[campo] = valorConverted;
    this.valoresMensaisCache.set(indicadorMensalId, cached);
    
    // Validar e adicionar à fila
    // ... (ver cockpit-pilares-frontend.md seção 4.3)
  }
  ```

- [ ] **8.4. Cálculo de desvio e status**
  ```typescript
  calcularDesvio(indicador: IndicadorCockpit, mes: IndicadorMensal): number {
    if (!mes.meta || !mes.realizado) return 0;
    
    if (indicador.melhor === 'MAIOR') {
      return mes.realizado - mes.meta;
    } else {
      return mes.meta - mes.realizado;
    }
  }
  
  calcularStatus(indicador: IndicadorCockpit, mes: IndicadorMensal): 'success' | 'warning' | 'danger' {
    if (!mes.meta || !mes.realizado) return null;
    
    const percentual = mes.realizado / mes.meta;
    
    if (indicador.melhor === 'MAIOR') {
      if (percentual >= 1) return 'success';      // 🟢 ≥100%
      if (percentual >= 0.8) return 'warning';    // 🟡 80-99%
      return 'danger';                            // 🔴 <80%
    } else {
      if (percentual <= 1) return 'success';      // 🟢 ≤100%
      if (percentual <= 1.2) return 'warning';    // 🟡 até 120%
      return 'danger';                            // 🔴 >120%
    }
  }
  ```

- [ ] **8.5. Feedback visual**
  ```html
  @if (savingCount > 0) {
    <div class="saving-indicator">
      <div class="spinner-border spinner-border-sm"></div>
      <span>Salvando...</span>
    </div>
  } @else if (lastSaveTime) {
    <div class="last-save-info">
      <i class="feather icon-check-circle text-success"></i>
      <span>Salvo às: {{ getLastSaveTimeFormatted() }}</span>
    </div>
  }
  ```

- [ ] **8.6. Modal de criar indicador**
  - Campos: nome*, descrição, tipoMedida*, statusMedicao*, responsavelMedicaoId, melhor*
  - Após criar: backend cria 13 meses automaticamente
  - Frontend atualiza lista

- [ ] **8.7. Modal de editar indicador**
  - Permite alterar TODAS as propriedades
  - ⚠️ Avisar: "Alterar Melhor recalculará desvios e status"

---

### ✅ Fase 1I: Frontend - Gráficos

- [ ] **9.1. Componente de gráficos**
  ```typescript
  @Component({
    selector: 'app-grafico-indicadores',
    standalone: true,
    imports: [CommonModule, NgChartsModule, /* ... */],
    templateUrl: './grafico-indicadores.component.html'
  })
  export class GraficoIndicadoresComponent implements OnInit {
    @Input() cockpitId: string;
    
    indicadores: IndicadorCockpit[] = [];
    indicadorSelecionado: IndicadorCockpit;
    anoSelecionado: number = new Date().getFullYear();
    
    chartData: ChartData = {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
      datasets: [
        {
          label: 'Meta',
          data: [],
          borderColor: '#4bc0c0',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: false
        },
        {
          label: 'Realizado',
          data: [],
          borderColor: '#ff6384',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false
        }
      ]
    };
    
    async carregarDadosGrafico(): Promise<void> {
      const dados = await this.cockpitService.getDadosGraficos(
        this.cockpitId, 
        this.anoSelecionado
      ).toPromise();
      
      const indicador = dados.indicadores.find(i => i.id === this.indicadorSelecionado.id);
      
      this.chartData.datasets[0].data = indicador.mesesIndicador
        .filter(m => m.mes !== null)
        .map(m => m.meta || 0);
        
      this.chartData.datasets[1].data = indicador.mesesIndicador
        .filter(m => m.mes !== null)
        .map(m => m.realizado || 0);
    }
  }
  ```

- [ ] **9.2. Template HTML**
  ```html
  <div class="grafico-container">
    <div class="selecao">
      <label>Indicador:</label>
      <select [(ngModel)]="indicadorSelecionado" (change)="carregarDadosGrafico()">
        @for (ind of indicadores; track ind.id) {
          <option [value]="ind">{{ ind.nome }}</option>
        }
      </select>
      
      <label>Ano:</label>
      <select [(ngModel)]="anoSelecionado" (change)="carregarDadosGrafico()">
        <option [value]="2026">2026</option>
        <option [value]="2025">2025</option>
      </select>
    </div>
    
    <canvas baseChart
      [data]="chartData"
      [type]="'line'"
      [options]="chartOptions">
    </canvas>
  </div>
  ```

---

### ✅ Fase 1J: Frontend - Processos Prioritários

- [ ] **10.1. Componente de matriz de processos**
  - Tabela: Rotina | Nível Crítico | Nota Atual | Status Mapeamento | Status Treinamento
  - **IMPORTANTE:** Nome, criticidade, nota são READ-ONLY (vêm de RotinaEmpresa via backend)
  - **EDITÁVEL:** Apenas statusMapeamento e statusTreinamento (dropdown)

- [ ] **10.2. Dropdown de status**
  ```html
  <select [(ngModel)]="processo.statusMapeamento" 
          (change)="onStatusChange(processo)"
          [disabled]="!canEdit">
    <option value="PENDENTE">Pendente</option>
    <option value="EM_ANDAMENTO">Em Andamento</option>
    <option value="CONCLUIDO">Concluído</option>
  </select>
  ```

- [ ] **10.3. Auto-save ao trocar status**
  - Seguir padrão de auto-save (debounce 1000ms)
  - Endpoint: PATCH `/processos-prioritarios/:processoId`

---

### ✅ Fase 1K: Frontend - Rotas

- [ ] **11.1. Configurar rotas**
  ```typescript
  // app.routes.ts
  {
    path: 'cockpits',
    children: [
      { 
        path: '', 
        component: CockpitListComponent,
        canActivate: [AuthGuard]
      },
      { 
        path: ':cockpitId/dashboard', 
        component: CockpitDashboardComponent,
        canActivate: [AuthGuard]
      }
    ]
  }
  ```

---

## 5. Ordem de Execução

**Siga esta ordem EXATA para evitar bloqueios:**

### Dia 1: Backend Base
1. ✅ Migration Prisma (já feito)
2. Criar módulo + DTOs
3. Implementar CockpitPilaresService (CRUD básico)
4. Implementar auto-vinculação de rotinas
5. Implementar CockpitPilaresController
6. Testar endpoints com Postman/Insomnia

### Dia 2: Backend - Indicadores
7. Implementar IndicadoresService
8. Implementar auto-criação de 13 meses
9. Implementar endpoints de indicadores
10. Implementar batch update de valores mensais
11. Testar auto-criação de meses

### Dia 3: Backend - Processos e Gráficos
12. Implementar endpoint de processos (com JOIN)
13. Implementar endpoint de dados agregados para gráficos
14. Otimizar query (include com where aninhado)
15. Testar performance

### Dia 4: Backend - Testes e Validações
16. Criar testes unitários (mínimo 80% cobertura)
17. Validar multi-tenancy em TODOS os endpoints
18. Validar RBAC em TODOS os endpoints
19. Integrar AuditService
20. Revisar erros e edge cases

### Dia 5: Frontend - Estrutura
21. Verificar/instalar biblioteca de gráficos
22. Criar estrutura de componentes
23. Criar service Angular
24. Criar componente de lista de cockpits
25. Criar dashboard básico (abas)

### Dia 6: Frontend - Matriz de Indicadores
26. Implementar matriz de indicadores
27. Implementar auto-save (copiar de diagnostico-notas)
28. Implementar cálculo de desvio/status
29. Implementar modais de criar/editar
30. Testar feedback visual

### Dia 7: Frontend - Gráficos e Processos
31. Implementar componente de gráficos
32. Implementar matriz de processos
33. Integrar com diagnóstico (botão criar/abrir cockpit)
34. Testar navegação completa

### Dia 8: Testes E2E e Ajustes
35. Criar testes E2E mínimos (3 cenários)
36. Validar RBAC frontend com diferentes perfis
37. Validar auto-save em todos os campos
38. Ajustes de CSS/responsividade
39. Revisar console.error em produção

---

## 6. Validação e Testes

### 6.1. Testes Unitários (Backend)

**Mínimo obrigatório:**
```typescript
// cockpit-pilares.service.spec.ts

describe('CockpitPilaresService', () => {
  it('deve criar cockpit e vincular rotinas automaticamente', async () => {
    // Arrange
    const empresaId = 'empresa-1';
    const pilarEmpresaId = 'pilar-1';
    const dto = { entradas: 'teste', saidas: 'teste', missao: 'teste' };
    
    // Mock de rotinas ativas
    jest.spyOn(prisma.rotinaEmpresa, 'findMany').mockResolvedValue([
      { id: 'rotina-1', nome: 'Rotina 1', ordem: 1 },
      { id: 'rotina-2', nome: 'Rotina 2', ordem: 2 }
    ]);
    
    // Act
    const result = await service.createCockpit(pilarEmpresaId, dto, usuario);
    
    // Assert
    expect(result).toBeDefined();
    expect(prisma.processoPrioritario.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ rotinaEmpresaId: 'rotina-1' }),
        expect.objectContaining({ rotinaEmpresaId: 'rotina-2' })
      ])
    });
  });
  
  it('deve validar multi-tenant (GESTOR só acessa própria empresa)', async () => {
    // Arrange
    const cockpitId = 'cockpit-1';
    const usuarioGestor = { perfil: { codigo: 'GESTOR' }, empresaId: 'empresa-2' };
    
    jest.spyOn(prisma.cockpitPilar, 'findUnique').mockResolvedValue({
      pilarEmpresa: { empresaId: 'empresa-1' }
    });
    
    // Act & Assert
    await expect(service.getCockpitById(cockpitId, usuarioGestor))
      .rejects.toThrow(ForbiddenException);
  });
  
  it('deve criar indicador com 13 meses vazios', async () => {
    // Arrange
    const cockpitId = 'cockpit-1';
    const dto = { nome: 'Faturamento', tipoMedida: 'REAL', /* ... */ };
    
    // Act
    await service.createIndicador(cockpitId, dto, usuario);
    
    // Assert
    expect(prisma.indicadorMensal.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({ mes: 1 }),
        expect.objectContaining({ mes: 2 }),
        // ...
        expect.objectContaining({ mes: 12 }),
        expect.objectContaining({ mes: null }) // Resumo anual
      ])
    });
    expect(prisma.indicadorMensal.createMany.mock.calls[0][0].data).toHaveLength(13);
  });
});
```

**Executar:**
```bash
npm run test
npm run test:cov  # Verificar cobertura ≥80%
```

---

### 6.2. Testes E2E (Mínimo Obrigatório)

**3 cenários críticos:**

```typescript
// frontend/e2e/cockpit-pilares.spec.ts

test('Criar cockpit e verificar auto-vinculação de rotinas', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'gestor@empresa.com');
  await page.fill('[name="password"]', 'senha123');
  await page.click('button[type="submit"]');
  
  // 2. Ir para diagnóstico
  await page.goto('/diagnostico');
  
  // 3. Abrir dropdown do pilar
  await page.click('[data-testid="pilar-dropdown"]');
  
  // 4. Clicar em "Criar Cockpit"
  await page.click('text=Criar Cockpit');
  
  // 5. Preencher modal
  await page.fill('[name="entradas"]', 'Pedidos de clientes');
  await page.fill('[name="saidas"]', 'Propostas comerciais');
  await page.click('button:has-text("Criar Cockpit")');
  
  // 6. Verificar redirecionamento
  await page.waitForURL('**/cockpits/**/dashboard');
  
  // 7. Ir para aba de processos
  await page.click('text=Processos');
  
  // 8. Verificar que rotinas foram vinculadas
  const rotinas = await page.locator('[data-testid="processo-row"]').count();
  expect(rotinas).toBeGreaterThan(0);
});

test('Adicionar indicador e verificar 13 meses criados', async ({ page }) => {
  // 1. Ir para cockpit existente
  await page.goto('/cockpits/cockpit-123/dashboard');
  
  // 2. Ir para aba de indicadores
  await page.click('text=Indicadores');
  
  // 3. Clicar em "+ Novo Indicador"
  await page.click('button:has-text("Novo Indicador")');
  
  // 4. Preencher modal
  await page.fill('[name="nome"]', 'Faturamento Total Mensal');
  await page.click('input[value="REAL"]');
  await page.click('input[value="MEDIDO_CONFIAVEL"]');
  await page.click('input[value="MAIOR"]');
  await page.click('button:has-text("Criar Indicador")');
  
  // 5. Verificar que 13 linhas de meses aparecem
  await page.waitForSelector('text=Jan');
  const meses = await page.locator('tbody tr').count();
  expect(meses).toBe(13); // 12 meses + 1 anual
});

test('Editar meta mensal e verificar auto-save', async ({ page }) => {
  // 1. Ir para aba de indicadores
  await page.goto('/cockpits/cockpit-123/dashboard');
  await page.click('text=Indicadores');
  
  // 2. Editar meta de Janeiro
  const inputMeta = page.locator('input[data-mes="1"][data-campo="meta"]').first();
  await inputMeta.fill('1890000');
  
  // 3. Aguardar debounce (1000ms) + tempo de save
  await page.waitForTimeout(2000);
  
  // 4. Verificar feedback visual "Salvo às:"
  await expect(page.locator('text=/Salvo às: \\d{2}:\\d{2}:\\d{2}/')).toBeVisible();
  
  // 5. Recarregar página e verificar persistência
  await page.reload();
  const valorSalvo = await inputMeta.inputValue();
  expect(valorSalvo).toBe('1890000');
});
```

**Executar:**
```bash
npm run test:e2e
```

---

### 6.3. Validações Manuais (Checklist)

**Backend:**
- [ ] Cockpit criado com auto-vinculação de rotinas
- [ ] Indicador criado com 13 meses vazios
- [ ] Valores mensais atualizados via batch
- [ ] Multi-tenancy validado (GESTOR só acessa própria empresa)
- [ ] RBAC validado (perfis corretos por endpoint)
- [ ] Auditoria registrada em todas operações CUD
- [ ] Soft delete funcionando (ativo = false)
- [ ] Queries otimizadas (sem N+1)

**Frontend:**
- [ ] Lista de cockpits exibida
- [ ] Dashboard com abas funcionais
- [ ] Matriz de indicadores com auto-save
- [ ] Feedback visual (saving/saved/error)
- [ ] Gráficos exibindo meta vs realizado
- [ ] Processos prioritários com status editável
- [ ] Desvio e status calculados corretamente
- [ ] Modais funcionais (criar/editar)
- [ ] RBAC frontend (botões ocultos conforme perfil)
- [ ] Navegação fluida (voltar, breadcrumbs)

---

## 7. Critérios de Aceitação

### ✅ Backend

1. **Cockpit criado com auto-vinculação de rotinas**
   - Endpoint POST funcional
   - Rotinas vinculadas automaticamente como ProcessoPrioritario
   - Status inicial: PENDENTE

2. **Indicador criado com 13 meses vazios**
   - Endpoint POST funcional
   - 13 registros IndicadorMensal criados (mes=1-12 + mes=null)
   - Valores iniciais: meta=null, realizado=null

3. **Valores mensais atualizados via batch**
   - Endpoint PATCH funcional
   - Batch update de múltiplos meses em uma requisição

4. **Endpoint de dados agregados para gráficos funcional**
   - Query otimizada (include com where aninhado)
   - Retorna indicadores com meses do ano selecionado

5. **Multi-tenancy validado**
   - GESTOR só acessa própria empresa
   - ADMINISTRADOR acessa todas

6. **Auditoria registrada**
   - Todas operações CREATE/UPDATE/DELETE em AuditLog

7. **Testes passando**
   - Cobertura ≥80%
   - Todos testes unitários verdes

---

### ✅ Frontend

1. **Lista de cockpits exibida**
   - Cards com nome do pilar, total de indicadores/processos
   - Botão "Abrir Dashboard"

2. **Dashboard com contexto editável**
   - Abas: Contexto | Indicadores | Gráficos | Processos
   - Campos entradas/saídas/missão editáveis

3. **Matriz de indicadores com auto-save**
   - Card de propriedades (Tipo, Status, Responsável, Melhor) FORA da tabela
   - Tabela mensal (jan-dez + anual)
   - Células meta/realizado editáveis inline
   - Auto-save com debounce 1000ms

4. **Gráficos exibindo meta vs realizado**
   - Dropdown de indicador
   - Dropdown de ano
   - Linha de meta vs linha de realizado

5. **Processos prioritários exibidos**
   - Nome, criticidade, nota READ-ONLY (via backend)
   - Status mapeamento/treinamento editáveis (dropdown)

6. **Desvio e status calculados corretamente**
   - Fórmula de desvio conforme "melhor"
   - Cores: 🟢 ≥100%, 🟡 80-99%, 🔴 <80%

7. **Modais funcionais**
   - Criar cockpit
   - Criar indicador
   - Editar indicador

8. **RBAC frontend**
   - Botões ocultos conforme perfil
   - Campos desabilitados se read-only

---

## 8. Handoff para QA

### 8.1. Documentos para QA Agent

Após implementação completa, criar:

📄 **`/docs/handoffs/cockpit-pilares/dev-to-qa-handoff.md`**

**Conteúdo mínimo:**
- Endpoints implementados (lista completa)
- Componentes frontend criados
- Testes unitários executados (relatório de cobertura)
- Testes E2E executados (3 cenários)
- Issues conhecidos (se houver)
- Sugestões de testes adicionais

---

### 8.2. Ambiente de Teste

**Backend:**
```bash
# Ambiente de desenvolvimento
cd backend
npm run start:dev

# URL: http://localhost:3000
# Swagger: http://localhost:3000/api
```

**Frontend:**
```bash
# Ambiente de desenvolvimento
cd frontend
npm start

# URL: http://localhost:4200
```

**Banco de dados:**
- Usar ambiente de teste (não produção)
- Seed de dados de exemplo
- Empresa de teste criada com pilares e rotinas

---

### 8.3. Usuários de Teste

**Criar usuários com diferentes perfis:**

| Email | Senha | Perfil | Empresa |
|-------|-------|--------|---------|
| admin@teste.com | senha123 | ADMINISTRADOR | - |
| gestor@empresa1.com | senha123 | GESTOR | Empresa 1 |
| colaborador@empresa1.com | senha123 | COLABORADOR | Empresa 1 |
| consultor@empresa1.com | senha123 | CONSULTOR | Empresa 1 |
| leitura@empresa1.com | senha123 | LEITURA | Empresa 1 |

---

## 9. Troubleshooting

### 9.1. Erros Comuns

**Erro: Migration falha**
```bash
# Solução: Resetar banco de teste
npx prisma migrate reset
npx prisma migrate dev
```

**Erro: Auto-save não funciona**
- Verificar debounceTime(1000)
- Verificar distinctUntilChanged
- Verificar savingCount incremento/decremento
- Console.log no executeSave

**Erro: Gráfico não renderiza**
- Verificar ng2-charts instalado
- Verificar chartData estrutura correta
- Verificar dados não são null/undefined

**Erro: Multi-tenancy não valida**
- Verificar join com pilarEmpresa.empresa
- Verificar empresaId do usuário
- Verificar ForbiddenException

---

### 9.2. Quando Pedir Ajuda

**Consultar System Engineer se:**
- Regra de negócio ambígua
- Validação não especificada
- Conflito entre documentos

**Consultar Pattern Enforcer se:**
- Dúvida sobre biblioteca de gráficos
- Padrão não encontrado em diagnostico-notas
- Estrutura de arquivos inconsistente

**Consultar Business Rules Extractor se:**
- Lacuna na documentação identificada
- Comportamento não especificado

---

## 10. Conclusão

### ✅ Você tem TUDO que precisa:

1. ✅ Prisma schema completo (196 linhas)
2. ✅ Regras de negócio formalizadas (743 linhas)
3. ✅ Handoff técnico detalhado (838 linhas)
4. ✅ Padrões frontend obrigatórios (1303 linhas)
5. ✅ Mockup de interface completo
6. ✅ Relatório de validação
7. ✅ Checklist de implementação
8. ✅ Critérios de aceitação
9. ✅ Exemplos de código

### 🎯 Próximos Passos:

1. **Ler TODOS os documentos normativos** (seção 2)
2. **Executar migration Prisma**
3. **Seguir ordem de execução** (seção 5)
4. **Validar cada etapa** com testes
5. **Criar handoff para QA** ao finalizar

### 📞 Comunicação:

- **Bloqueios:** Reportar imediatamente com contexto
- **Dúvidas:** Consultar documentação ANTES de perguntar
- **Progresso:** Atualizar daily (o que foi feito, o que falta, bloqueios)

---

**Boa implementação! 🚀**

**Última atualização:** 2026-01-15  
**Próximo agente:** Dev Agent → QA Agent  
**Status:** 🟢 READY TO CODE
