# ADR-003: Arquitetura de Cockpit de Pilares

**Status:** ✅ Aprovado (aguardando implementação)  
**Data:** 2026-01-15  
**Autor:** System Engineer  
**Decisores:** Product Owner, System Engineer  
**Contexto técnico:** NestJS, Prisma, PostgreSQL, Angular

---

## Contexto

### Situação atual
O sistema possui:
- **Diagnóstico de pilares** com notas gerais (0-10) e criticidade por rotina
- **Evolução temporal** com snapshots de médias trimestrais
- **Identificação** de pilares fracos (médias baixas)

### Problema
Empresas conseguem **identificar** pilares com desempenho ruim, mas não têm ferramentas para:
- Monitorar indicadores específicos da área (faturamento, inadimplência, etc)
- Estabelecer metas mensais e acompanhar desvios
- Mapear status de processos (mapeamento, treinamento)
- Definir cargos, funções e avaliações
- Criar planos de ação estruturados com análise de causas (5 Porquês)

### Necessidade
Criar **painel gerencial especializado** por pilar para **detalhamento de COMO melhorar**, complementando o diagnóstico existente (que identifica O QUE melhorar).

---

## Decisão

Criar módulo **Cockpit de Pilares** com as seguintes características:

### 1. Arquitetura Modular
- **Novo módulo:** `backend/src/modules/cockpit-pilares/`
- **Independente** de PeriodoAvaliacao (não obriga trimestres)
- **Opcional** por pilar (empresa escolhe quais pilares merecem cockpit)

### 2. Modelo de Dados
Adicionar 7 novos modelos ao schema Prisma:

| Modelo | Propósito |
|--------|-----------|
| `CockpitPilar` | Ativa cockpit para pilar específico (contexto: entradas, saídas, missão) |
| `IndicadorCockpit` | Indicador customizado (ex: faturamento, inadimplência) |
| `IndicadorMensal` | Valores mensais (jan-dez + resumo anual) com meta/realizado |
| `ProcessoPrioritario` | Vincula rotinas do pilar com status de mapeamento/treinamento |
| `CargoCockpit` | Define cargos da área |
| `FuncaoCargo` | Responsabilidades de cargos com avaliações |
| `AcaoCockpit` | Plano de ação com análise de causas (5 Porquês) |

### 3. Enums Específicos
Adicionar 4 novos enums:

```prisma
enum TipoMedidaIndicador { REAL, QUANTIDADE, TEMPO, PERCENTUAL }
enum StatusMedicaoIndicador { NAO_MEDIDO, MEDIDO_NAO_CONFIAVEL, MEDIDO_CONFIAVEL }
enum DirecaoIndicador { MAIOR, MENOR }
enum StatusProcesso { PENDENTE, EM_ANDAMENTO, CONCLUIDO }
```

### 4. Relações com Módulos Existentes
- `PilarEmpresa.cockpit` (one-to-one) — Um cockpit por pilar
- `RotinaEmpresa.processosPrioritarios` (one-to-many) — Rotinas viram processos
- `Usuario` — Responsável por medição, cargos, ações

### 5. Auto-Importação e Auto-Criação
- **Ao criar cockpit:** Importar automaticamente rotinas ativas como processos prioritários
- **Ao criar indicador:** Criar automaticamente 13 registros mensais vazios (jan-dez + resumo)

### 6. Implementação Faseada
- **Fase 1 (MVP):** Cockpit + indicadores + valores mensais + processos + **gráficos**
- **Fase 2:** Matriz de cargos e funções
- **Fase 3:** Plano de ação com 5 Porquês
- **Fase 4:** Otimizações (export, comparações)

---

## Alternativas Consideradas

### Alternativa 1: Estender módulo Diagnóstico
**Descrição:** Adicionar indicadores e metas dentro do módulo `diagnosticos`.

**Prós:**
- Menos módulos no sistema
- Indicadores próximos das notas de rotinas

**Contras:**
- ❌ Mistura responsabilidades (diagnóstico ≠ gestão detalhada)
- ❌ Diagnóstico é **avaliativo** (pontual), cockpit é **gerencial** (contínuo)
- ❌ Crescimento descontrolado de um único módulo
- ❌ Dificulta manutenção futura

**Decisão:** ❌ **Rejeitada**

---

### Alternativa 2: Integrar com PeriodoAvaliacao
**Descrição:** Forçar indicadores mensais a pertencerem a períodos trimestrais.

**Prós:**
- Consistência com evolução trimestral
- Snapshots históricos garantidos

**Contras:**
- ❌ Rigidez: empresa precisa criar período para usar cockpit
- ❌ Indicadores mensais não se alinham naturalmente com trimestres
- ❌ Complexidade adicional sem ganho de valor (Fase 1)

**Decisão:** ❌ **Rejeitada para Fase 1** (possível integração em Fase 5)

---

### Alternativa 3: Módulo único "Gestão Estratégica"
**Descrição:** Criar módulo genérico para cockpits, OKRs, KPIs, etc.

**Prós:**
- Flexibilidade para múltiplas metodologias
- Reuso de código

**Contras:**
- ❌ Over-engineering (YAGNI - You Aren't Gonna Need It)
- ❌ Complexidade prematura
- ❌ Cockpit de pilares é específico do domínio (não genérico)

**Decisão:** ❌ **Rejeitada**

---

## Consequências

### Positivas
✅ **Separação de responsabilidades:** Diagnóstico ≠ Gestão  
✅ **Flexibilidade:** Empresa escolhe quais pilares merecem cockpit  
✅ **Escalabilidade:** Fases permitem evolução incremental  
✅ **UX:** Auto-criação de meses evita trabalho manual  
✅ **Rastreabilidade:** Indicadores customizados por empresa  
✅ **Integração:** Processos prioritários derivam de rotinas existentes

### Negativas
⚠️ **Complexidade do schema:** +7 modelos, +4 enums (196 linhas)  
⚠️ **Migration grande:** Primeira migration do cockpit será volumosa  
⚠️ **Overhead de auto-criação:** 13 registros por indicador (mitigado: batch insert)  
⚠️ **Fases incrementais:** Funcionalidade completa apenas em Fase 4

### Neutras
🔵 **Independência de PeriodoAvaliacao:** Pode integrar no futuro se necessário  
🔵 **RBAC existente:** Aplica-se sem mudanças (ADMINISTRADOR, GESTOR, etc)  
🔵 **Auditoria existente:** AuditLog registra todas as operações

---

## Impacto em Agentes Existentes

| Agente | Impacto | Descrição |
|--------|---------|-----------|
| Dev Agent | 🔴 **Alto** | Implementar backend + frontend (MVP ~500 linhas service + controller) |
| Pattern Enforcer | 🟡 **Médio** | Validar multi-tenancy, RBAC, Snapshot Pattern |
| QA Unitário | 🟡 **Médio** | Criar testes para novo módulo (>80% cobertura) |
| QA E2E | 🟢 **Baixo** | Testes E2E opcionais para Fase 1 |
| Tech Writer | 🟢 **Baixo** | Documentar endpoints pós-merge |
| Outros | ⚪ **Nenhum** | Sem impacto |

---

## Decisões Técnicas Chave

### 1. Auto-Vinculação de Rotinas
**Decisão:** Ao criar cockpit, vincular automaticamente rotinas ativas como processos prioritários (**não snapshot, apenas referência**).

**Justificativa:**
- Garante integridade: cockpit completo desde o início
- Evita trabalho manual: empresa não precisa adicionar rotinas uma a uma
- Dados da rotina (nome, criticidade, nota) permanecem atualizados via join
- Apenas status de mapeamento/treinamento são editáveis no cockpit
- Performance aceitável: batch insert eficiente

**Trade-off:**
- Pilar com 50 rotinas cria 50 vínculos
- Mitigado: Filtro por `ativo=true`, registros são leves (apenas FK + 2 campos)

---

### 2. Auto-Criação de 13 Meses
**Decisão:** Ao criar indicador, criar automaticamente 12 meses + 1 resumo anual (vazios).

**Justificativa:**
- UX superior: usuário não precisa criar meses manualmente
- Frontend simplificado: sempre renderiza 13 colunas
- Valores nullable: não ocupa espaço significativo

**Trade-off:**
- 13 registros por indicador (crescimento previsível)
- Mitigado: Cleanup futuro se necessário, batch insert eficiente

---

### 3. Independência de PeriodoAvaliacao
**Decisão:** Indicadores mensais NÃO referenciam PeriodoAvaliacao (Fase 1).

**Justificativa:**
- Simplicidade: cockpit funciona sem criar períodos
- Flexibilidade: empresa pode ter indicadores sem trimestres
- Escopo reduzido: MVP foca em indicadores, não em integração

**Trade-off:**
- Possível duplicação de conceitos (mensal vs trimestral)
- Mitigado: Integração possível em Fase 5 se necessário

---

### 4. Implementação Faseada
**Decisão:** Dividir em 5 fases, implementar apenas MVP (Fase 1).

**Justificativa:**
- Reduz risco: validação incremental com usuários
- Foco: entrega valor mínimo rapidamente
- Aprendizado: feedback real antes de construir features complexas

**Trade-off:**
- Schema completo (7 modelos) criado, mas Fase 1 usa apenas 4
- Mitigado: Modelos restantes não adicionam overhead até serem usados

---

## Validação de Princípios Arquiteturais

### Multi-Tenancy
✅ **Validado:** Todos os modelos conectam a `Empresa` via `PilarEmpresa`.

### RBAC
✅ **Validado:** Endpoints seguem padrões existentes (Guards, `@PerfilAutorizado`).

### Snapshot Pattern
✅ **Validado:** Cockpit vinculado a `PilarEmpresa` (snapshot de pilar template).

### Auditoria
✅ **Validado:** CUD de todos os modelos registrados em `AuditLog`.

### Soft Delete
✅ **Validado:** `CockpitPilar.ativo`, `IndicadorCockpit.ativo`.

---

## Métricas de Sucesso

### Fase 1 (MVP)
- [ ] Migration executada sem erros
- [ ] CRUD completo de cockpits
- [ ] CRUD completo de indicadores
- [ ] Auto-importação de rotinas funcional
- [ ] Auto-criação de 13 meses funcional
- [ ] Valores mensais atualizados via batch
- [ ] Desvio e status calculados corretamente no frontend
- [ ] Testes unitários >80% cobertura
- [ ] Multi-tenancy validado (GESTOR só acessa própria empresa)
- [ ] Auditoria registrada

### Fase 2
- [ ] Gráficos de evolução temporal exibidos

### Fase 3
- [ ] Matriz de cargos e funções funcional

### Fase 4
- [ ] Plano de ação com 5 Porquês funcional

---

## Riscos e Mitigações

### Risco 1: Over-engineering inicial
**Descrição:** Schema completo (7 modelos) criado antes de validar com usuários.

**Probabilidade:** Média  
**Impacto:** Médio  
**Mitigação:**
- Fase 1 usa apenas 4 modelos (CockpitPilar, IndicadorCockpit, IndicadorMensal, ProcessoPrioritario)
- Modelos restantes não adicionam overhead até serem usados
- Rollback possível via migration reversa

---

### Risco 2: Performance de auto-importação
**Descrição:** Pilar com muitas rotinas pode causar lentidão.

**Probabilidade:** Baixa  
**Impacto:** Baixo  
**Mitigação:**
- Batch insert eficiente (Prisma `createMany`)
- Filtro por `ativo=true` reduz volume
- Limite razoável (50 rotinas é máximo esperado)

---

### Risco 3: Crescimento descontrolado de IndicadorMensal
**Descrição:** Indicadores acumulam meses ao longo dos anos.

**Probabilidade:** Alta (esperado)  
**Impacto:** Baixo  
**Mitigação:**
- Particionamento futuro por ano (se necessário)
- Índice em `@@unique([indicadorCockpitId, ano, mes])` garante busca eficiente
- Cleanup manual possível (deletar anos antigos)

---

## Referências

**Regra de Negócio:**  
📄 `/docs/business-rules/cockpit-pilares.md`

**Handoff:**  
📄 `/docs/handoffs/cockpit-pilares/system-engineer-v1.md`

**Change Report:**  
📄 `/docs/handoffs/cockpit-pilares/SYSTEM_ENGINEERING_CHANGE_REPORT.md`

**Schema:**  
📄 `backend/prisma/schema.prisma`

**Documentos relacionados:**  
📄 `/docs/business-rules/pilares-empresa.md`  
📄 `/docs/business-rules/rotinas-empresa.md`  
📄 `/docs/business-rules/diagnosticos.md`

---

## Aprovação

**Data da decisão:** 2026-01-15  
**Decisão final:** ✅ **APROVADA** (aguardando implementação)

**Assinado por:**
- System Engineer (autor)
- [Aguardando] Product Owner (aprovação humana)

---

**Status:** 🟢 READY FOR IMPLEMENTATION  
**Next Step:** Dev Agent implementar MVP (Fase 1)
