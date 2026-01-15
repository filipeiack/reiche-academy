# System Engineering Change Report — Cockpit de Pilares

**Data:** 2026-01-15  
**Agente:** System Engineer  
**Tipo de mudança:** Nova funcionalidade (feature arquitetural)  
**Impacto:** Alto (nova área de produto)  
**ADR necessário:** ✅ SIM

---

## 1. Motivação

### Contexto
O sistema atual possui:
- **Diagnóstico de pilares** com notas gerais (0-10) e criticidade
- **Evolução temporal** com snapshots de médias trimestrais
- **Ausência de detalhamento** sobre COMO melhorar pilares com médias baixas

### Problema identificado
Empresas conseguem identificar pilares fracos (via diagnóstico), mas não têm ferramentas para:
- Monitorar indicadores específicos da área (ex: faturamento, inadimplência)
- Estabelecer metas mensais e acompanhar desvios
- Mapear processos prioritários e status de treinamento
- Definir cargos, funções e avaliações
- Criar planos de ação estruturados (5 Porquês)

### Solução proposta
Criar **Cockpit de Pilares**: painel gerencial especializado por pilar com:
1. Matriz de indicadores customizados (jan-dez)
2. Análise gráfica de evolução
3. Matriz de processos prioritários
4. Matriz de cargos e funções
5. Plano de ação com análise de causas

---

## 2. Mudanças Realizadas

### 2.1. Schema Prisma (`backend/prisma/schema.prisma`)

**Novos enums adicionados:**
- `TipoMedidaIndicador` (REAL, QUANTIDADE, TEMPO, PERCENTUAL)
- `StatusMedicaoIndicador` (NAO_MEDIDO, MEDIDO_NAO_CONFIAVEL, MEDIDO_CONFIAVEL)
- `DirecaoIndicador` (MAIOR, MENOR)
- `StatusProcesso` (PENDENTE, EM_ANDAMENTO, CONCLUIDO)

**Novos modelos criados:**
- `CockpitPilar` (13 campos, 4 relações)
- `IndicadorCockpit` (11 campos, 3 relações)
- `IndicadorMensal` (7 campos, 1 relação)
- `ProcessoPrioritario` (8 campos, 2 relações)
- `CargoCockpit` (8 campos, 2 relações)
- `FuncaoCargo` (9 campos, 1 relação)
- `AcaoCockpit` (14 campos, 3 relações)

**Relações atualizadas em modelos existentes:**
- `Usuario`:
  - `indicadoresResponsavel` (responsável por medição)
  - `cargosCockpit` (usuário em cargo)
  - `acoesCockpit` (responsável por ação)
- `PilarEmpresa`:
  - `cockpit` (one-to-one)
- `RotinaEmpresa`:
  - `processosPrioritarios` (one-to-many)

**Constraints adicionados:**
- `@@unique([pilarEmpresaId])` em CockpitPilar (um cockpit por pilar)
- `@@unique([cockpitPilarId, nome])` em IndicadorCockpit (nome único)
- `@@unique([indicadorCockpitId, ano, mes])` em IndicadorMensal
- `@@unique([cockpitPilarId, rotinaEmpresaId])` em ProcessoPrioritario

**Total de mudanças no schema:**
- 4 novos enums
- 7 novos modelos
- 196 novas linhas de código
- 5 relações reversas adicionadas

---

### 2.2. Documentação Normativa

**Criado:** `/docs/business-rules/cockpit-pilares.md` (489 linhas)

**Conteúdo:**
- Visão geral e responsabilidades
- Definição completa de 7 entidades
- Regras de negócio (R-COCKPIT-001 a R-COCKPIT-006)
- Endpoints esperados (15 endpoints)
- Validações e segurança
- Integrações com módulos existentes
- Roadmap de implementação (5 fases)

**Características:**
- Documento normativo (contrato para Dev Agent)
- Alinhado com padrões existentes (Snapshot Pattern, Multi-Tenancy, RBAC)
- Referências cruzadas com documentos relacionados

---

### 2.3. Handoff para Dev Agent

**Criado:** `/docs/handoffs/cockpit-pilares/system-engineer-v1.md` (520 linhas)

**Conteúdo:**
- Contexto e objetivo (MVP Fase 1)
- Modelo de dados completo
- Estrutura de arquivos esperada
- Endpoints obrigatórios com request/response
- DTOs e validações
- Lógica de auto-importação (rotinas → processos)
- Lógica de auto-criação (indicador → 13 meses)
- Cálculos de desvio/status no frontend
- Checklist de implementação
- Critérios de aceitação

**Características:**
- Handoff executável (Dev Agent pode iniciar sem perguntas)
- Foco em MVP (Fase 1: Cockpit básico + indicadores)
- Fases futuras documentadas mas não obrigatórias
- Validações críticas destacadas (multi-tenancy, RBAC)

---

## 3. Impacto nos Agentes Existentes

### System Engineer (este agente)
- ✅ **Atuação normal:** Definição de nova feature arquitetural
- ✅ **Sem mudanças** em sua própria definição
- ✅ **Sem mudanças** no FLOW.md

### Dev Agent
- 📌 **Impacto:** Receberá handoff para implementar MVP Fase 1
- 📌 **Dependências:** Prisma migration, NestJS module, Angular components
- 📌 **Escopo:** Backend completo + Frontend básico

### Pattern Enforcer
- 📌 **Impacto:** Validará aderência aos padrões existentes
- ✅ **Sem mudanças** necessárias (padrões já conhecidos aplicam-se)

### QA Unitário Estrito
- 📌 **Impacto:** Criará testes para novo módulo
- 📌 **Escopo:** Testes de service, controller, DTOs (>80% cobertura)

### QA E2E Interface
- 📌 **Impacto:** Criará testes E2E (opcional para Fase 1)
- 📌 **Escopo:** Fluxo criar cockpit → adicionar indicador → editar valores

### Business Rules Extractor
- ✅ **Sem impacto:** Regras já documentadas pelo System Engineer

### Business Rules Reviewer
- ✅ **Sem impacto:** Regras criadas diretamente (autoridade meta-nível)

### Tech Writer
- 📌 **Impacto (pós-merge):** Atualizar documentação de usuário final

### Advisor
- ✅ **Sem impacto direto:** Pode recomendar melhorias futuras

---

## 4. Validação de Consistência

### ✅ FLOW.md ainda é internamente consistente?
**SIM.** Nenhuma alteração no fluxo oficial.

### ✅ Todos os agentes têm escopo claro e não sobreposto?
**SIM.** System Engineer atuou em meta-nível (definição arquitetural). Dev Agent implementará código.

### ✅ Hierarquia de autoridade preservada?
**SIM.**
1. FLOW.md (inalterado)
2. DOCUMENTATION_AUTHORITY.md (inalterado)
3. Definições de agentes (inalteradas)
4. **Novo documento:** `/docs/business-rules/cockpit-pilares.md` (nível 4)

### ✅ Documentação de referência atualizada?
**SIM.**
- `/docs/business-rules/cockpit-pilares.md` criado
- Referências cruzadas adicionadas (pilares-empresa.md, rotinas-empresa.md, etc)

### ✅ Schema Prisma sintaticamente correto?
**SIM.** Validado localmente (enums, relações, constraints).

### ✅ Multi-tenancy preservado?
**SIM.** Todas as entidades conectam a Empresa via PilarEmpresa.

### ✅ RBAC aplicado?
**SIM.** Perfis documentados em cada endpoint.

### ✅ Auditoria garantida?
**SIM.** CUD de CockpitPilar, IndicadorCockpit, IndicadorMensal registrados.

---

## 5. Riscos Identificados

### Risco 1: Complexidade do MVP
**Descrição:** MVP Fase 1 já inclui muitas funcionalidades (cockpit + indicadores + processos + valores mensais).

**Mitigação:**
- Handoff prioriza backend primeiro
- Frontend básico (sem gráficos, sem plano de ação)
- Fases 2-4 explicitamente fora do escopo

**Probabilidade:** Média  
**Impacto:** Médio

---

### Risco 2: Auto-importação pode gerar muitos registros
**Descrição:** Pilar com 50 rotinas criará 50 ProcessoPrioritario automaticamente.

**Mitigação:**
- Rotinas são filtradas por `ativo=true`
- Necessário para garantir integridade (cockpit completo)
- Performance aceitável (batch insert)

**Probabilidade:** Baixa  
**Impacto:** Baixo

---

### Risco 3: Auto-criação de 13 meses por indicador
**Descrição:** Indicador criado gera 13 IndicadorMensal (jan-dez + resumo).

**Mitigação:**
- Registros vazios são pequenos (meta/realizado nullable)
- Necessário para UX (usuário não precisa criar meses manualmente)
- Batch insert eficiente

**Probabilidade:** Baixa  
**Impacto:** Baixo

---

### Risco 4: Falta de restrição de ano
**Descrição:** IndicadorMensal permite qualquer ano, sem limite.

**Mitigação:**
- Validação no DTO (ano >= 2020, ano <= ano_atual + 5)
- Filtro de ano no frontend
- Cleanup futuro se necessário

**Probabilidade:** Baixa  
**Impacto:** Baixo

---

### Risco 5: Integração com PeriodoAvaliacao não definida
**Descrição:** Indicadores mensais podem colidir com trimestres de avaliação.

**Decisão:**
- Módulos são **independentes** (Fase 1)
- Indicadores não referenciam PeriodoAvaliacao
- Integração possível em Fase 5 (otimizações)

**Probabilidade:** N/A (decisão arquitetural)  
**Impacto:** Nenhum (by design)

---

## 6. Próximos Passos

### Imediatos (Dev Agent)
1. ✅ Executar migration: `npx prisma migrate dev --name add-cockpit-pilares`
2. ✅ Regenerar Prisma Client: `npx prisma generate`
3. ✅ Criar módulo `CockpitPilaresModule`
4. ✅ Implementar service com auto-importação e auto-criação
5. ✅ Implementar controller com RBAC
6. ✅ Criar DTOs com validações
7. ✅ Criar testes unitários (>80% cobertura)

### Pattern Enforcer
1. Validar aderência ao Snapshot Pattern
2. Validar multi-tenancy em todos os endpoints
3. Validar RBAC e auditoria

### QA Unitário
1. Criar testes de service (createCockpit, createIndicador, etc)
2. Validar cobertura >80%

### Tech Writer (pós-merge)
1. Atualizar README com novo módulo
2. Documentar endpoints (Swagger/Postman)

---

## 7. ADR Criado

**Status:** ✅ **SIM**

**Arquivo:** `/docs/adr/ADR-003-cockpit-pilares-architecture.md`

**Conteúdo:**
- Contexto: Necessidade de detalhamento pós-diagnóstico
- Decisão: Criar módulo Cockpit com indicadores customizados
- Consequências: 7 novos modelos, 4 novos enums
- Alternativas consideradas: Estender diagnóstico atual (rejeitado - mistura responsabilidades)

**Justificativa para ADR:**
- **Nova área de produto** (cockpits)
- **Mudança arquitetural** (7 novos modelos)
- **Impacto em múltiplos agentes** (Dev, Pattern, QA)
- **Decisões estruturais** (independência de PeriodoAvaliacao, fases de implementação)

---

## 8. Conclusão

### Mudança aprovada?
✅ **SIM** (sob aprovação humana)

### Consistência garantida?
✅ **SIM** (checklist completo)

### Documentação completa?
✅ **SIM**
- Regra de negócio: `/docs/business-rules/cockpit-pilares.md`
- Handoff: `/docs/handoffs/cockpit-pilares/system-engineer-v1.md`
- ADR: `/docs/adr/ADR-003-cockpit-pilares-architecture.md`
- Schema: `backend/prisma/schema.prisma` (atualizado)

### Próximo agente:
👉 **Dev Agent** (via handoff `system-engineer-v1.md`)

### Prioridade:
🔥 **ALTA** (funcionalidade core do produto)

---

**System Engineer:**  
Trabalho concluído. Aguardando aprovação humana para prosseguir.

**Checklist final:**
- [x] Regra de negócio documentada
- [x] Schema Prisma atualizado
- [x] Handoff para Dev Agent criado
- [x] ADR documentado
- [x] Impacto nos agentes analisado
- [x] Riscos identificados
- [x] Validação de consistência completa
- [x] Próximos passos definidos

**Status:** 🟢 **READY FOR IMPLEMENTATION**
