# Handoff: System Engineer → Dev Agent — Cockpit de Pilares (MVP Fase 1)

**Feature:** Cockpit de Pilares — Fase 1 (MVP)  
**From:** System Engineer  
**To:** Dev Agent  
**Version:** v1  
**Date:** 2026-01-15  
**Status:** 🟢 READY TO IMPLEMENT

---

## 1. Contexto e Objetivo

### O que é?
Criação de um **painel gerencial especializado por pilar** que permite monitorar indicadores customizados, processos, equipes e planos de ação.

### Por que?
- Diagnóstico atual avalia pilares com notas gerais (0-10)
- Cockpit detalha **como** melhorar pilares com médias baixas
- Permite gestão estratégica com indicadores, metas mensais e análise de causas

### Escopo desta versão (MVP Fase 1)
✅ Criar cockpit para pilar  
✅ Definir contexto (entradas, saídas, missão)  
✅ Gestão de indicadores customizados  
✅ Valores mensais (jan-dez) com meta/realizado  
✅ Vinculação de rotinas como processos prioritários  
✅ Backend completo (CRUD + validações)  
✅ Frontend completo (dashboard + matriz + **gráficos**)

❌ **Fora do escopo (fases futuras):**
- Matriz de cargos e funções (Fase 2)
- Plano de ação com 5 Porquês (Fase 3)
- Otimizações (export Excel/PDF, comparações) (Fase 4)

---

## 2. Documentação Normativa

**LEIA ANTES DE IMPLEMENTAR:**

### Regra de Negócio (contrato)
📄 `/docs/business-rules/cockpit-pilares.md`

**Seções críticas:**
- Entidades completas com todos os campos
- Enums necessários
- Regras R-COCKPIT-001 a R-COCKPIT-003
- Validações e segurança multi-tenant

### Modelos relacionados (contexto)
📄 `/docs/business-rules/pilares-empresa.md`  
📄 `/docs/business-rules/rotinas-empresa.md`  
📄 `/docs/business-rules/diagnosticos.md`

### Convenções técnicas
📄 `/docs/conventions/backend.md`  
📄 `/docs/conventions/frontend.md`  
📄 `/docs/conventions/naming.md`

---

## 3. Modelo de Dados (Prisma)

### Status: ✅ **IMPLEMENTADO**

Schema atualizado em: `backend/prisma/schema.prisma`

**Novos enums adicionados:**
```prisma
enum TipoMedidaIndicador {
  REAL
  QUANTIDADE
  TEMPO
  PERCENTUAL
}

enum StatusMedicaoIndicador {
  NAO_MEDIDO
  MEDIDO_NAO_CONFIAVEL
  MEDIDO_CONFIAVEL
}

enum DirecaoIndicador {
  MAIOR
  MENOR
}

enum StatusProcesso {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDO
}
```

**Novos modelos adicionados:**
- `CockpitPilar` (cockpit do pilar)
- `IndicadorCockpit` (indicador customizado)
- `IndicadorMensal` (valores mensais jan-dez)
- `ProcessoPrioritario` (rotinas com status mapeamento/treinamento)
- `CargoCockpit` (para Fase 3)
- `FuncaoCargo` (para Fase 3)
- `AcaoCockpit` (para Fase 4)

**Relações atualizadas:**
- `PilarEmpresa.cockpit` (one-to-one com CockpitPilar)
- `RotinaEmpresa.processosPrioritarios` (one-to-many)
- `Usuario.indicadoresResponsavel` (responsável por medição)

### Próximos passos (Dev Agent):
1. **Executar migration:**
   ```bash
   cd backend
   npx prisma migrate dev --name add-cockpit-pilares
   ```
2. **Regenerar Prisma Client:**
   ```bash
   npx prisma generate
   ```

---

## 4. Estrutura de Arquivos (Backend)

### Criar módulo NestJS:
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

### Integração no AppModule:
Importar `CockpitPilaresModule` em `backend/src/app.module.ts`

---

## 5. Endpoints Obrigatórios (Fase 1)

### 5.1. Gestão de Cockpit

**POST** `/empresas/:empresaId/pilares/:pilarEmpresaId/cockpit`
- **Descrição:** Cria cockpit para pilar específico
- **Perfis:** ADMINISTRADOR, GESTOR
- **Body:**
  ```json
  {
    "entradas": "string (opcional)",
    "saidas": "string (opcional)",
    "missao": "string (opcional)"
  }
  ```
- **Comportamento:**
  1. Validar pilar existe e pertence à empresa
  2. Validar multi-tenant (GESTOR só cria para própria empresa)
  3. Verificar se cockpit já existe (unique constraint)
  4. Criar CockpitPilar
  5. **AUTO-IMPORTAR** rotinas do pilar como ProcessoPrioritario (status PENDENTE)
  6. Registrar auditoria

**GET** `/empresas/:empresaId/cockpits`
- **Descrição:** Lista cockpits da empresa
- **Perfis:** Todos
- **Response:**
  ```json
  [
    {
      "id": "uuid",
      "pilarEmpresaId": "uuid",
      "pilarNome": "COMERCIAL - CANAL INDIRETO",
      "entradas": "...",
      "saidas": "...",
      "missao": "...",
      "ativo": true,
      "totalIndicadores": 5,
      "totalProcessos": 11
    }
  ]
  ```

**GET** `/cockpits/:cockpitId`
- **Descrição:** Busca cockpit completo com indicadores e processos
- **Perfis:** Todos
- **Response:**
  ```json
  {
    "id": "uuid",
    "pilarEmpresa": {...},
    "entradas": "...",
    "indicadores": [...],
    "processosPrioritarios": [...]
  }
  ```

**PATCH** `/cockpits/:cockpitId`
- **Descrição:** Edita entradas/saídas/missão
- **Perfis:** ADMINISTRADOR, GESTOR
- **Body:**
  ```json
  {
    "entradas": "string (opcional)",
    "saidas": "string (opcional)",
    "missao": "string (opcional)"
  }
  ```

**DELETE** `/cockpits/:cockpitId`
- **Descrição:** Desativa cockpit (soft delete)
- **Perfis:** ADMINISTRADOR, GESTOR

---

### 5.2. Gestão de Indicadores

**POST** `/cockpits/:cockpitId/indicadores`
- **Descrição:** Adiciona indicador ao cockpit
- **Perfis:** ADMINISTRADOR, GESTOR
- **Body:**
  ```json
  {
    "nome": "FATURAMENTO TOTAL MENSAL",
    "descricao": "TOTAL EM R$ VENDIDOS VIA CANAL INDIRETO",
    "tipoMedida": "REAL",
    "statusMedicao": "MEDIDO_CONFIAVEL",
    "responsavelMedicaoId": "uuid-usuario",
    "melhor": "MAIOR",
    "ordem": 1
  }
  ```
- **Comportamento:**
  1. Validar cockpit existe e pertence à empresa
  2. Validar responsável existe e pertence à empresa
  3. Validar enums
  4. Calcular ordem (se não fornecida)
  5. Criar IndicadorCockpit
  6. **AUTO-CRIAR** 13 registros IndicadorMensal vazios:
     - 12 meses (mes=1-12, ano=2026)
     - 1 resumo anual (mes=null, ano=2026)
  7. Registrar auditoria

**PATCH** `/indicadores/:indicadorId`
- **Descrição:** Edita indicador
- **Perfis:** ADMINISTRADOR, GESTOR
- **Body:** (campos opcionais de IndicadorCockpit)

**DELETE** `/indicadores/:indicadorId`
- **Descrição:** Remove indicador (soft delete)
- **Perfis:** ADMINISTRADOR, GESTOR

---

### 5.3. Valores Mensais de Indicadores

**PATCH** `/indicadores/:indicadorId/meses`
- **Descrição:** Atualiza meta e/ou realizado de múltiplos meses (batch)
- **Perfis:** ADMINISTRADOR, GESTOR, COLABORADOR
- **Body:**
  ```json
  {
    "valores": [
      {"mes": 1, "ano": 2026, "meta": 1890000, "realizado": null},
      {"mes": 2, "ano": 2026, "meta": 2430000, "realizado": null}
    ]
  }
  ```
- **Comportamento:**
  1. Validar indicador existe e pertence à empresa
  2. Para cada valor:
     - Buscar ou criar IndicadorMensal (unique constraint)
     - Atualizar meta e/ou realizado
  3. Registrar auditoria

**GET** `/indicadores/:indicadorId/meses?ano=2026`
- **Descrição:** Busca valores mensais de um ano específico
- **Perfis:** Todos
- **Response:**
  ```json
  [
    {"mes": 1, "ano": 2026, "meta": 1890000, "realizado": null},
    {"mes": 2, "ano": 2026, "meta": 2430000, "realizado": null},
    ...
    {"mes": null, "ano": 2026, "meta": null, "realizado": null}
  ]
  ```

**GET** `/cockpits/:cockpitId/graficos/dados?ano=2026`
- **Descrição:** Retorna dados agregados para gráficos (todos os indicadores)
- **Perfis:** Todos
- **Response:**
  ```json
  {
    "ano": 2026,
    "indicadores": [
      {
        "id": "uuid-indicador-1",
        "nome": "FATURAMENTO TOTAL MENSAL",
        "tipoMedida": "REAL",
        "melhor": "MAIOR",
        "meses": [
          {"mes": 1, "meta": 1890000, "realizado": 1500000, "desvio": -390000},
          {"mes": 2, "meta": 2430000, "realizado": null, "desvio": null},
          ...
        ]
      }
    ]
  }
  ```

---

### 5.4. Processos Prioritários

**PATCH** `/processos-prioritarios/:processoId`
- **Descrição:** Atualiza status de mapeamento/treinamento
- **Perfis:** ADMINISTRADOR, GESTOR
- **Body:**
  ```json
  {
    "statusMapeamento": "CONCLUIDO",
    "statusTreinamento": "EM_ANDAMENTO"
  }
  ```

---

## 6. DTOs e Validações (class-validator)

### CreateCockpitPilarDto
```typescript
export class CreateCockpitPilarDto {
  @IsString()
  @IsOptional()
  entradas?: string;

  @IsString()
  @IsOptional()
  saidas?: string;

  @IsString()
  @IsOptional()
  missao?: string;
}
```

### CreateIndicadorCockpitDto
```typescript
export class CreateIndicadorCockpitDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsEnum(TipoMedidaIndicador)
  tipoMedida: TipoMedidaIndicador;

  @IsEnum(StatusMedicaoIndicador)
  statusMedicao: StatusMedicaoIndicador;

  @IsEnum(DirecaoIndicador)
  melhor: DirecaoIndicador;

  @IsUUID()
  @IsOptional()
  responsavelMedicaoId?: string;

  @IsInt()
  @IsOptional()
  ordem?: number;
}
```

### UpdateIndicadorMensalDto
```typescript
export class UpdateIndicadorMensalDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValorMensalDto)
  valores: ValorMensalDto[];
}

class ValorMensalDto {
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  mes?: number; // null para resumo anual

  @IsInt()
  ano: number;

  @IsNumber()
  @IsOptional()
  meta?: number;

  @IsNumber()
  @IsOptional()
  realizado?: number;
}
```

---

## 7. Validações de Negócio (Service)

### Multi-Tenancy (CRÍTICO)
Toda operação deve validar:
```typescript
// ADMINISTRADOR acessa qualquer empresa
if (usuario.perfil.codigo !== 'ADMINISTRADOR') {
  // Buscar cockpit com join empresa
  const cockpit = await this.prisma.cockpitPilar.findUnique({
    where: { id: cockpitId },
    include: { pilarEmpresa: { include: { empresa: true } } }
  });

  // Validar se usuário pertence à mesma empresa
  if (cockpit.pilarEmpresa.empresaId !== usuario.empresaId) {
    throw new ForbiddenException('Acesso negado');
  }
}
```

### RBAC por Endpoint
- **ADMINISTRADOR:** CRUD completo
- **GESTOR:** CRUD na própria empresa
- **COLABORADOR:** Leitura + edição de valores mensais
- **CONSULTOR:** Leitura + edição de valores mensais
- **LEITURA:** Apenas leitura

### Validações Específicas
- **Nome de indicador único por cockpit** (constraint `@@unique([cockpitPilarId, nome])`)
- **Responsável deve ser usuário da mesma empresa**
- **Enums válidos** (TipoMedidaIndicador, StatusMedicaoIndicador, etc)
- **Mês entre 1-12 ou null** (resumo anual)

---

## 8. Auto-Vinculação de Rotinas

Ao criar cockpit, automaticamente vincular rotinas do pilar como processos prioritários:

```typescript
async createCockpit(pilarEmpresaId: string, dto: CreateCockpitPilarDto) {
  // 1. Criar cockpit
  const cockpit = await this.prisma.cockpitPilar.create({
    data: {
      pilarEmpresaId,
      ...dto
    }
  });

  // 2. Buscar rotinas ativas do pilar
  const rotinas = await this.prisma.rotinaEmpresa.findMany({
    where: {
      pilarEmpresaId,
      ativo: true
    },
    orderBy: { ordem: 'asc' }
  });

  // 3. Criar vínculos (ProcessoPrioritario)
  // IMPORTANTE: NÃO É SNAPSHOT - apenas referência direta
  // Nome, criticidade, nota virão de RotinaEmpresa via JOIN
  const processos = rotinas.map((rotina, index) => ({
    cockpitPilarId: cockpit.id,
    rotinaEmpresaId: rotina.id,
    statusMapeamento: 'PENDENTE',
    statusTreinamento: 'PENDENTE',
    ordem: index + 1
  }));

  await this.prisma.processoPrioritario.createMany({
    data: processos
  });

  return cockpit;
}
```

**Importante:**
- ProcessoPrioritario **NÃO É SNAPSHOT**
- Apenas referência (`rotinaEmpresaId`) + status editável
- Nome, criticidade, nota são **SOMENTE LEITURA** (via join com RotinaEmpresa e NotaRotina)
- Apenas `statusMapeamento` e `statusTreinamento` são editáveis

---

## 9. Auto-Criação de Meses

Ao criar indicador, criar 13 registros mensais vazios:

```typescript
async createIndicador(cockpitId: string, dto: CreateIndicadorCockpitDto) {
  const anoAtual = new Date().getFullYear();

  // 1. Criar indicador
  const indicador = await this.prisma.indicadorCockpit.create({
    data: {
      cockpitPilarId: cockpitId,
      ...dto
    }
  });

  // 2. Criar 13 meses (1-12 + resumo anual)
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

  await this.prisma.indicadorMensal.createMany({
    data: meses
  });

  return indicador;
}
```

---

## 10. Frontend (Fase 1 — Completo)

### Estrutura de Componentes
```
frontend/src/app/views/pages/cockpit-pilares/
├── cockpit-pilar-dashboard/
│   ├── cockpit-pilar-dashboard.component.ts
│   ├── cockpit-pilar-dashboard.component.html
│   └── cockpit-pilar-dashboard.component.scss
├── matriz-indicadores/
│   ├── matriz-indicadores.component.ts
│   ├── matriz-indicadores.component.html
│   └── matriz-indicadores.component.scss
├── grafico-indicadores/
│   ├── grafico-indicadores.component.ts
│   ├── grafico-indicadores.component.html
│   └── grafico-indicadores.component.scss
└── modals/
    ├── criar-cockpit-modal.component.ts
    └── criar-indicador-modal.component.ts
```

### Funcionalidades
1. **Lista de Cockpits:**
   - Card para cada cockpit ativo
   - Exibir nome do pilar, total de indicadores, processos

2. **Dashboard do Cockpit:**
   - Seção: Contexto (entradas, saídas, missão) - editável inline
   - Aba: 1. Matriz de Indicadores
   - Aba: 2. Análise Gráfica
   - Aba: 3. Processos Prioritários

3. **Matriz de Indicadores:**
   - Tabela com colunas: Indicador, Tipo, Status, Responsável, Jan-Dez, Resumo
   - Auto-save com debounce (1000ms) ao editar meta/realizado
   - Cálculo de desvio e status (verde/amarelo/vermelho) no frontend
   - Botão "Adicionar Indicador"

4. **Análise Gráfica (NOVO - Integrado no MVP):**
   - **Biblioteca:** Chart.js ou ng2-charts
   - **Tipo de gráfico:** Linha (evolução temporal)
   - **Dados:** Meta vs Realizado (jan-dez)
   - **Seletor:** Dropdown para escolher indicador
   - **Filtro de ano:** Exibir apenas ano selecionado
   - **Tooltip:** Exibir desvio ao hover

   **Exemplo de implementação:**
   ```typescript
   // grafico-indicadores.component.ts
   export class GraficoIndicadoresComponent implements OnInit {
     @Input() cockpitId: string;
     
     indicadores: IndicadorCockpit[] = [];
     indicadorSelecionado: IndicadorCockpit;
     anoSelecionado: number = new Date().getFullYear();
     
     chartData: ChartData = {
       labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 
                'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
       datasets: [
         {
           label: 'Meta',
           data: [],
           borderColor: '#4bc0c0',
           fill: false
         },
         {
           label: 'Realizado',
           data: [],
           borderColor: '#ff6384',
           fill: false
         }
       ]
     };
     
     chartOptions: ChartOptions = {
       responsive: true,
       plugins: {
         tooltip: {
           callbacks: {
             label: (context) => {
               const index = context.dataIndex;
               const meta = this.chartData.datasets[0].data[index];
               const realizado = this.chartData.datasets[1].data[index];
               const desvio = this.calcularDesvio(meta, realizado);
               return `${context.dataset.label}: ${context.parsed.y} (Desvio: ${desvio})`;
             }
           }
         }
       }
     };
     
     async carregarIndicadores() {
       this.indicadores = await this.cockpitService.getIndicadores(this.cockpitId);
       if (this.indicadores.length > 0) {
         this.indicadorSelecionado = this.indicadores[0];
         await this.carregarDadosGrafico();
       }
     }
     
     async carregarDadosGrafico() {
       const meses = await this.cockpitService.getValoresMensais(
         this.indicadorSelecionado.id, 
         this.anoSelecionado
       );
       
       this.chartData.datasets[0].data = meses
         .filter(m => m.mes !== null)
         .map(m => m.meta || 0);
         
       this.chartData.datasets[1].data = meses
         .filter(m => m.mes !== null)
         .map(m => m.realizado || 0);
     }
     
     calcularDesvio(meta: number, realizado: number): number {
       if (!meta || !realizado) return 0;
       
       if (this.indicadorSelecionado.melhor === 'MAIOR') {
         return realizado - meta;
       } else {
         return meta - realizado;
       }
     }
   }
   ```

5. **Processos Prioritários:**
   - Tabela: Rotina (nome), Nível Crítico, Nota Atual, Status Mapeamento, Status Treinamento
   - Dropdown inline para alterar status (PENDENTE → EM_ANDAMENTO → CONCLUIDO)
   - **Dados da rotina são SOMENTE LEITURA** (nome, criticidade, nota vêm de RotinaEmpresa via backend)

6. **Cálculos no Frontend:**
   ```typescript
   calcularDesvio(indicador, mes): number {
     if (!mes.meta || !mes.realizado) return 0;
     
     if (indicador.melhor === 'MAIOR') {
       return mes.realizado - mes.meta;
     } else {
       return mes.meta - mes.realizado;
     }
   }

   calcularStatus(indicador, mes): 'success' | 'warning' | 'danger' {
     if (!mes.meta || !mes.realizado) return null;
     
     const percentual = mes.realizado / mes.meta;
     
     if (indicador.melhor === 'MAIOR') {
       if (percentual >= 1) return 'success';
       if (percentual >= 0.8) return 'warning';
       return 'danger';
     } else {
       if (percentual <= 1) return 'success';
       if (percentual <= 1.2) return 'warning';
       return 'danger';
     }
   }
   ```

---

## 11. Testes Obrigatórios

### Backend (Unitários)
- `cockpit-pilares.service.spec.ts`
  - [x] Deve criar cockpit e importar rotinas automaticamente
  - [x] Deve validar multi-tenant (GESTOR só acessa própria empresa)
  - [x] Deve criar indicador com 13 meses vazios
  - [x] Deve atualizar valores mensais (batch)
  - [x] Deve validar responsável pertence à empresa
  - [x] Deve validar nome de indicador único por cockpit

### Frontend (E2E - Opcional para Fase 1)
- Criar cockpit para pilar
- Adicionar indicador
- Editar meta/realizado com auto-save
- Visualizar status calculado

---

## 12. Auditoria

Registrar em `AuditLog`:
- **CREATE:** CockpitPilar, IndicadorCockpit
- **UPDATE:** CockpitPilar (entradas/saídas/missão), IndicadorCockpit, IndicadorMensal
- **DELETE:** CockpitPilar, IndicadorCockpit

Usar `AuditService` existente (já implementado).

---

## 13. Checklist de Implementação

### Backend
- [ ] Executar migration (`npx prisma migrate dev`)
- [ ] Criar módulo `CockpitPilaresModule`
- [ ] Criar DTOs com validações
- [ ] Implementar `CockpitPilaresService`:
  - [ ] `createCockpit` (com auto-vinculação de rotinas)
  - [ ] `createIndicador` (com auto-criação de 13 meses)
  - [ ] `updateValoresMensais` (batch)
  - [ ] `updateProcessoPrioritario`
  - [ ] `getDadosGraficos` (endpoint agregado para gráficos)
  - [ ] Validações multi-tenant em todos os métodos
- [ ] Implementar `CockpitPilaresController`:
  - [ ] Guards RBAC por endpoint
  - [ ] Decorators `@PerfilAutorizado`
- [ ] Criar testes unitários (mínimo 80% cobertura)
- [ ] Integrar auditoria

### Frontend
- [ ] Instalar biblioteca de gráficos (ng2-charts ou chart.js)
- [ ] Criar componentes base
- [ ] Service Angular (`cockpit-pilares.service.ts`)
- [ ] Tela: Lista de cockpits
- [ ] Tela: Dashboard do cockpit (com abas)
- [ ] Componente: Matriz de indicadores com auto-save
- [ ] Componente: **Gráficos de evolução temporal** (meta vs realizado)
- [ ] Componente: Processos prioritários (tabela com status editável)
- [ ] Modal: Criar cockpit
- [ ] Modal: Adicionar indicador
- [ ] Cálculos de desvio e status
- [ ] Validações de formulário
- [ ] Feedback visual (toast de sucesso/erro)

---

## 14. Critérios de Aceitação

✅ **Backend:**
- Cockpit criado com auto-vinculação de rotinas como processos prioritários
- Indicador criado com 13 meses vazios (jan-dez + resumo)
- Valores mensais atualizados via batch
- Endpoint de dados agregados para gráficos funcional
- Multi-tenancy validado (GESTOR só acessa própria empresa)
- Auditoria registrada
- Testes passando (>80% cobertura)

✅ **Frontend:**
- Lista de cockpits exibida
- Dashboard com contexto editável
- Matriz de indicadores com auto-save
- **Gráficos exibindo meta vs realizado** (jan-dez)
- Processos prioritários exibidos com status editável
- Desvio e status calculados corretamente
- Modais funcionais

✅ **Documentação:**
- Endpoints documentados (Swagger/Postman)
- README atualizado

---

## 15. Próximas Fases (Informativo)

**Fase 2:** Matriz de cargos e funções  
**Fase 3:** Plano de ação com 5 Porquês  
**Fase 4:** Otimizações (export Excel/PDF, comparações)

---

## 16. Referências

**Regra de Negócio:**  
📄 `/docs/business-rules/cockpit-pilares.md`

**Modelos relacionados:**  
📄 `/docs/business-rules/pilares-empresa.md`  
📄 `/docs/business-rules/rotinas-empresa.md`  
📄 `/docs/business-rules/diagnosticos.md`

**Convenções:**  
📄 `/docs/conventions/backend.md`  
📄 `/docs/conventions/frontend.md`

**Schema:**  
📄 `backend/prisma/schema.prisma`

---

## 17. Notas Finais

- **NÃO invente regras:** Todas as regras estão documentadas
- **NÃO pule validações:** Multi-tenancy e RBAC são CRÍTICAS
- **NÃO esqueça auditoria:** Toda operação CUD registrada
- **NÃO implemente Fases 2-4:** Foco no MVP (Fase 1)

**Dúvidas?** Consulte System Engineer ou Advisor antes de improvisar.

---

**Handoff Status:** 🟢 READY  
**Next Agent:** Dev Agent  
**Priority:** ALTA  
**Complexity:** MÉDIA-ALTA

Good luck! 🚀
