# Handoff: Cockpit de Pilares

**Feature:** Cockpit de Pilares (Painel Gerencial Especializado)  
**Status:** 🟢 READY FOR QA  
**Criado em:** 2026-01-15  
**Última atualização:** 2026-01-21 (Revisão Completa)  
**System Engineer:** v1  
**Business Rules Reviewer:** ✅ APROVADO (2026-01-21)

---

## Visão Geral

Criação de **painéis gerenciais especializados** por pilar, permitindo:
- Monitorar indicadores customizados com metas mensais
- Acompanhar desvios e status visual
- **Visualizar evolução temporal** via gráficos (meta vs realizado)
- Mapear processos prioritários (status de mapeamento/treinamento)
- Definir cargos, funções e avaliações (Fase 2)
- Criar planos de ação estruturados com 5 Porquês (Fase 3)

---

## ⚠️ Atualizações Importantes (v1.1)

### Mudança 1: ProcessoPrioritario é Vínculo (NÃO Snapshot)
- ✅ Rotinas **não são copiadas** - apenas vinculadas via FK
- ✅ Nome, criticidade, nota da rotina = **SOMENTE LEITURA** (via join)
- ✅ Apenas status de mapeamento/treinamento são editáveis

### Mudança 2: Gráficos Integrados no MVP
- ✅ Fase 2 (Análise Gráfica) **integrada no MVP Fase 1**
- ✅ Dashboard terá 3 abas: Indicadores, Gráficos, Processos
- ✅ Biblioteca Chart.js ou ng2-charts

📄 Detalhes: [ATUALIZACAO_v1.1.md](./ATUALIZACAO_v1.1.md)

---

## Documentos deste Handoff

### 0. Business Rules Reviewer (2026-01-21) ← **NOVO**
📄 **[reviewer-v1.md](./reviewer-v1.md)** ✅

**Conteúdo:**
- Revisão completa de 5 documentos de regras de negócio
- Validação de rastreabilidade ao código (100% verificada)
- Análise de riscos e lacunas (nenhum bloqueador)
- Recomendações não-vinculantes
- Aprovação para QA Unitário

**Quando ler:** Para entender qualidade da documentação e ressalvas identificadas.

---

### 1. Atualização v1.1 (LEIA PRIMEIRO)
📄 **[ATUALIZACAO_v1.1.md](./ATUALIZACAO_v1.1.md)**

**Conteúdo:**
- ProcessoPrioritario: Vínculo (não snapshot)
- Fase 2 (gráficos) integrada no MVP
- Novo endpoint de dados agregados
- Dependências adicionais (Chart.js)
- Checklist e critérios de aceitação atualizados

**Quando ler:** ANTES de implementar (mudanças importantes).

---

### 1. System Engineering Change Report
📄 **[SYSTEM_ENGINEERING_CHANGE_REPORT.md](./SYSTEM_ENGINEERING_CHANGE_REPORT.md)**

**Conteúdo:**
- Motivação da mudança
- Mudanças realizadas (schema, docs, handoff)
- Impacto nos agentes existentes
- Validação de consistência
- Riscos identificados
- Próximos passos

**Quando ler:** Para entender **por que** essa feature foi criada e **como** impacta o sistema.

---

### 2. Handoff para Dev Agent
📄 **[system-engineer-v1.md](./system-engineer-v1.md)**

**Conteúdo:**
- Contexto e objetivo (MVP Fase 1)
- Modelo de dados completo
- Endpoints obrigatórios (request/response)
- DTOs e validações
- Lógica de auto-importação e auto-criação
- Checklist de implementação
- Critérios de aceitação

**Quando ler:** Para **implementar** a feature (Dev Agent).

---

### 3. ADR (Architecture Decision Record)
📄 **[/docs/adr/ADR-003-cockpit-pilares-architecture.md](../../adr/ADR-003-cockpit-pilares-architecture.md)**

**Conteúdo:**
- Contexto do problema
- Decisão arquitetural
- Alternativas consideradas
- Consequências (positivas, negativas, neutras)
- Decisões técnicas chave
- Riscos e mitigações

**Quando ler:** Para entender **decisões estruturais** e **trade-offs**.

---

## Documentos Relacionados

### Regras de Negócio Extraídas (2026-01-21) ✅
📄 **[/docs/business-rules/cockpit-multi-tenant-seguranca.md](../../business-rules/cockpit-multi-tenant-seguranca.md)** — Controle multi-tenant e segurança  
📄 **[/docs/business-rules/cockpit-gestao-indicadores.md](../../business-rules/cockpit-gestao-indicadores.md)** — CRUD de indicadores customizados  
📄 **[/docs/business-rules/cockpit-valores-mensais.md](../../business-rules/cockpit-valores-mensais.md)** — Edição de valores mensais e cálculos  
📄 **[/docs/business-rules/cockpit-processos-prioritarios.md](../../business-rules/cockpit-processos-prioritarios.md)** — Auto-vinculação de rotinas  
📄 **[/docs/business-rules/cockpit-ux-excel-like.md](../../business-rules/cockpit-ux-excel-like.md)** — Comportamentos de interface Excel-like

**Status:** ✅ REVISADO (reviewer-v1.md) - APROVADO PARA QA

---

### Regra de Negócio Original (contrato)
📄 **[/docs/business-rules/cockpit-pilares.md](../../business-rules/cockpit-pilares.md)**

Define:
- Entidades completas (7 modelos)
- Regras de negócio (R-COCKPIT-001 a R-COCKPIT-006)
- Validações e segurança
- Endpoints esperados
- Roadmap de 5 fases

---

### Modelo de Dados
📄 **[backend/prisma/schema.prisma](../../../backend/prisma/schema.prisma)**

Alterações:
- ✅ 4 novos enums
- ✅ 7 novos modelos
- ✅ 5 relações reversas adicionadas
- ✅ 196 linhas de código

---

### Módulos Relacionados
📄 [/docs/business-rules/pilares-empresa.md](../../business-rules/pilares-empresa.md)  
📄 [/docs/business-rules/rotinas-empresa.md](../../business-rules/rotinas-empresa.md)  
📄 [/docs/business-rules/diagnosticos.md](../../business-rules/diagnosticos.md)

---

## Escopo da Implementação

### ✅ Fase 1 (MVP) — **ESTE HANDOFF (v1.1)**
- Criar cockpit para pilar
- Gestão de indicadores customizados
- Valores mensais (jan-dez + resumo)
- Auto-vinculação de rotinas como processos (**não snapshot**)
- Backend completo (CRUD + validações + endpoint de gráficos)
- Frontend completo (dashboard + matriz + **gráficos**)

### ❌ Fora do Escopo (Fases Futuras)
- **Fase 2:** Matriz de cargos e funções
- **Fase 3:** Plano de ação com 5 Porquês
- **Fase 4:** Otimizações (export, comparações)

---

## Próximos Passos

### 1. Dev Agent
📌 **Ler:** [system-engineer-v1.md](./system-engineer-v1.md)  
📌 **Executar:**
```bash
cd backend
npx prisma migrate dev --name add-cockpit-pilares
npx prisma generate
```
📌 **Implementar:** Módulo `CockpitPilaresModule` completo

---

### 2. Pattern Enforcer
📌 **Validar:**
- Multi-tenancy em todos os endpoints
- RBAC correto
- Snapshot Pattern preservado
- Auditoria registrada

---

### 3. QA Unitário
📌 **Criar:**
- Testes de service (>80% cobertura)
- Validar auto-importação de rotinas
- Validar auto-criação de 13 meses
- Validar multi-tenancy

---

### 4. Tech Writer (pós-merge)
📌 **Documentar:**
- Endpoints (Swagger/Postman)
- README atualizado

---

## Contatos

**Dúvidas arquiteturais:** System Engineer  
**Dúvidas de implementação:** Consultar handoff [system-engineer-v1.md](./system-engineer-v1.md)  
**Dúvidas de regras:** [/docs/business-rules/cockpit-pilares.md](../../business-rules/cockpit-pilares.md)

---

**Status:** 🟢 READY  
**Próximo agente:** Dev Agent  
**Prioridade:** ALTA
