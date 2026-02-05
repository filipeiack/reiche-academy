# System Engineering Change Report

**Data:** 2026-01-15  
**Tipo:** Documentação de Decisão Arquitetural (ADR-006)  
**Motivação:** Correção de erro de validação pré-especificação

---

## Motivação

### Erro Identificado

Como **System Engineer**, violei princípio fundamental da governança:

> "Documentos mandam, agentes obedecem — mas System Engineer deve VALIDAR código ANTES de criar documentos normativos"

**Sequência do erro:**
1. Criei **ADR-005** especificando componente `matriz-indicadores` com UX Excel-like
2. **NÃO validei** se componente já existia no código
3. Instruí **Dev Agent** a implementar sem verificação prévia
4. Dev Agent descobriu implementação existente com propósito diferente
5. **Bloqueio de implementação** até decisão arquitetural

**Consequências:**
- Dev Agent ficou bloqueado (handoff de análise)
- Tempo perdido em especificação sem contexto completo
- Risco de sobrescrever código funcional

---

## Mudanças Realizadas

### 1. Criado: ADR-006 (Arquitetura de Componentes)

**Arquivo:** `/docs/adr/ADR-006-arquitetura-matriz-indicadores.md`

**Conteúdo:**
- **Autocrítica:** Documentação do erro cometido
- **Análise:** Código existente vs ADR-005 especificado
- **Decisão:** Opção 1 — Criar `gestao-indicadores` separado
- **Arquitetura:** 3 componentes (container + gestão + valores)
- **Especificação:** Responsabilidades, comunicação, endpoints
- **Checklist:** 5 fases de implementação (17h estimadas)
- **Retroação:** Processo corrigido com checklist pré-ADR

**Princípios aplicados:**
- Preservar código existente (não sobrescrever)
- Separação de responsabilidades (CRUD vs Edição de Valores)
- Documentação retroativa (admitir erro, corrigir processo)

---

### 2. Atualizado: ADR-005 (Referência a ADR-006)

**Arquivo:** `/docs/adr/ADR-005-ux-excel-like-indicadores.md`

**Mudança:**
```diff
# ADR-005: UX Excel-like para Indicadores do Cockpit

**Status:** ✅ Aprovado  
**Data:** 2026-01-15  
**Autor:** System Engineer  
**Decisores:** Product Owner, System Engineer  
**Contexto técnico:** Angular 18, Bootstrap 5, ng-select, auto-save pattern
+ **Implementação:** Ver ADR-006 para arquitetura de componentes

---

+ ## ⚠️ Nota de Implementação
+ 
+ Este ADR especifica a **UX e funcionalidades** do CRUD de indicadores.
+ 
+ Para **arquitetura de componentes e integração com código existente**, consulte:
+ → **[ADR-006: Arquitetura de Componentes da Matriz de Indicadores](ADR-006-arquitetura-matriz-indicadores.md)**
+ 
+ **Componente implementado:** `gestao-indicadores.component` (não `matriz-indicadores`)
+ 
+ ---
```

**Justificativa:**
- ADR-005 permanece válido (especificação UX completa)
- Adiciona contexto de implementação (nome do componente correto)
- Direciona para ADR-006 (decisão arquitetural)

---

### 3. Atualizado: README.md dos ADRs

**Arquivo:** `/docs/adr/README.md`

**Mudança:**
```diff
| [ADR-005](ADR-005-ux-excel-like-indicadores.md) | UX Excel-like para Indicadores | ✅ Aprovado | 2026-01-15 |
+ | [ADR-006](ADR-006-arquitetura-matriz-indicadores.md) | Arquitetura de Componentes Matriz | ✅ Aprovado | 2026-01-15 |

---

**Gerenciado por:** System Engineer (Modo Documentação)  
**Última atualização:** 2026-01-15  
- **Changelog:** ADR-005 — UX Excel-like para Indicadores do Cockpit
+ **Changelog:** ADR-006 — Arquitetura de Componentes da Matriz de Indicadores
```

---

### 4. Atualizado: Handoff dev-v1-analise.md

**Arquivo:** `/docs/handoffs/cockpit-pilares/dev-v1-analise.md`

**Mudança:**
```diff
# Dev Handoff: Cockpit de Pilares — Análise de Implementação Existente
- **Status:**  **ANÁLISE TÉCNICA** (divergência entre especificação e implementação)
+ **Status:**  **✅ DECISÃO TOMADA** — Implementar Opção 1 (componente separado)

+ ## ⚠️ Resolução da Divergência
+ 
+ **Decisão aprovada pelo Product Owner:**
+ 
+ → **Opção 1: Criar `gestao-indicadores` separado (preservando código existente)**
+ 
+ **Arquitetura final documentada em:**
+ → **[ADR-006: Arquitetura de Componentes da Matriz de Indicadores](../adr/ADR-006-arquitetura-matriz-indicadores.md)**

## 8 Status para Próximo Agente

- **Aguardando decisão:** System Engineer + Product Owner
+ **✅ DECISÃO APROVADA:** Opção 1 — Criar `gestao-indicadores` separado

- **Próximo agente:** System Engineer (Modo Documentação)
+ **Próximo agente:** Dev Agent (implementação)

- **Ações necessárias:**
- 1. Analisar código existente vs ADR-005
- 2. Decidir estratégia de implementação (Opção 1, 2 ou 3)
+ **Ações aprovadas:**
+ 1. ✅ Criar `edicao-valores-mensais/` (migrar código existente)
+ 2. ✅ Criar `gestao-indicadores/` (implementar ADR-005)
```

---

## Impacto nos Agentes Existentes

### Dev Agent
- **Antes:** Bloqueado (aguardando decisão arquitetural)
- **Depois:** ✅ Desbloqueado (ADR-006 fornece arquitetura completa)
- **Próximos passos:** Implementar Fase 1 (migração código) + Fase 2 (gestao-indicadores)

### Pattern Enforcer
- **Impacto:** Nenhum (não foi ativado ainda)
- **Quando validar:** Após Dev Agent implementar componentes

### QA Unitário
- **Impacto:** Nenhum (não foi ativado ainda)
- **Quando validar:** Após Dev Agent criar testes

### FLOW.md
- **Impacto:** Nenhum direto (Cockpit não está em FLOW ainda)
- **Ação futura:** Adicionar workflow de Cockpit quando módulo estiver completo

---

## Validação de Consistência

### ✅ FLOW.md ainda é internamente consistente?
**Sim.** Cockpit não está documentado em FLOW ainda (módulo em desenvolvimento).

### ✅ Todos os agentes têm escopo claro e não sobreposto?
**Sim.** Nenhuma mudança em escopos de agentes.

### ✅ Hierarquia de autoridade preservada?
**Sim.** ADR-006 documenta decisão aprovada por Product Owner (autoridade final).

### ✅ Documentação de referência atualizada?
**Sim.**
- ADR-005 referencia ADR-006
- README de ADRs incluiu ADR-006
- Handoff atualizado com decisão

---

## Riscos Identificados

### Risco 1: Regressão ao Migrar Código Existente

**Descrição:** Código de `matriz-indicadores` será copiado para `edicao-valores-mensais`.

**Probabilidade:** Média  
**Impacto:** Alto (perda de funcionalidade)

**Mitigação:**
- Testes unitários ANTES de migrar (garantir baseline)
- Testes unitários DEPOIS de migrar (validar comportamento)
- Git diff para validar mudanças

---

### Risco 2: Comunicação Entre Componentes (ViewChild)

**Descrição:** Container precisa chamar `reload()` em `edicao-valores-mensais` via ViewChild.

**Probabilidade:** Baixa  
**Impacto:** Médio (valores não atualizam após CRUD)

**Mitigação:**
- Testes de integração (criar indicador → verificar reload)
- Documentação clara no ADR-006 (seção Comunicação)

---

### Risco 3: Complexidade Aumentada (3 Componentes)

**Descrição:** De 1 componente para 3 (container + gestão + valores).

**Probabilidade:** Baixa  
**Impacto:** Baixo (manutenibilidade levemente afetada)

**Mitigação:**
- Separação de responsabilidades clara (documentada)
- Testes isolados por componente
- ADR-006 documenta arquitetura completa

---

## Próximos Passos

### Imediato: Dev Agent

1. Ler **ADR-006** completo
2. Implementar **Fase 1** (migração código existente):
   - Criar `edicao-valores-mensais/`
   - Copiar código de `matriz-indicadores/`
   - Remover placeholders (`novoIndicador`, `editarIndicador`, `excluirIndicador`)
   - Adicionar método `reload()` público
   - Criar testes unitários
3. Implementar **Fase 2** (gestao-indicadores):
   - Seguir ADR-005 completo (950+ linhas)
   - CRUD inline Excel-like
   - Drag & drop, Tab navigation, auto-save
   - Modais (descrição, mobile)
   - Eventos `@Output()`
4. Implementar **Fase 3** (container):
   - Atualizar `matriz-indicadores.component`
   - Seções (Gestão + Valores)
   - Coordenação via ViewChild
5. Criar **handoff dev-v2-implementacao.md**

---

### Médio Prazo: Documentação de Negócio

**Responsável:** System Engineer (Modo Documentação)

**Arquivos a atualizar:**
1. `/docs/business-rules/cockpit-pilares.md`
   - Adicionar workflow de telas
   - Documentar fluxo: Gestão → Valores → Gráficos

2. `/docs/conventions/cockpit-pilares-frontend.md`
   - Atualizar estrutura de componentes
   - Documentar padrão "Container + Sub-componentes"

3. `/docs/architecture/frontend.md`
   - Adicionar exemplo de arquitetura (Matriz de Indicadores)

---

## ADR Criado

**Sim:** [ADR-006: Arquitetura de Componentes da Matriz de Indicadores](../adr/ADR-006-arquitetura-matriz-indicadores.md)

**Tipo:** Decisão Arquitetural + Autocrítica de Processo

**Seções principais:**
1. Contexto (erro de validação)
2. Situação Encontrada (análise código vs especificação)
3. Decisão (Opção 1 — componente separado)
4. Especificação de Migração (3 fases)
5. Responsabilidades dos Componentes
6. Comunicação Entre Componentes
7. Checklist de Implementação (17h)
8. Consequências (positivas/negativas/riscos)
9. **Retroação (System Engineer Self-Review)** — Novo checklist pré-ADR

---

## Lições Aprendidas (Process Improvement)

### Novo Checklist Pré-ADR (Obrigatório)

**Antes de criar qualquer ADR de implementação:**

- [ ] **Grep search** por nome do componente/módulo especificado
- [ ] **File search** por estrutura relacionada (`**/*nome*`)
- [ ] **Ler código existente** (se houver implementação parcial)
- [ ] **Documentar divergências** (estado atual vs proposta)
- [ ] **Justificar abordagem** (criar novo vs refatorar vs mesclar)
- [ ] **Consultar Product Owner** se houver conflito

**Objetivo:** Nunca mais especificar sem contexto completo do código.

---

### Princípio Reforçado

> **System Engineer propõe, Product Owner aprova, Dev Agent executa.**

**Mas antes de propor:**
→ System Engineer **DEVE** validar estado atual do código.

---

## Aprovação

**Decisão aprovada por:** Product Owner  
**Data:** 2026-01-15  
**Próximo agente:** Dev Agent  

**Status:**
- ✅ ADR-006 criado e documentado
- ✅ ADR-005 atualizado com referência
- ✅ README de ADRs atualizado
- ✅ Handoff atualizado com decisão
- ✅ Processo corrigido (checklist pré-ADR)
- ✅ Dev Agent desbloqueado para implementação

---

**System Engineering Change Report criado automaticamente**  
**Versão:** 1.0  
**Arquivo:** `/docs/handoffs/cockpit-pilares/system-engineer-change-report-adr-006.md`
