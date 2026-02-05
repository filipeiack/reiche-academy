# ADR-008: Consolidação de Agentes (7 → 4) para Otimização OpenCode

## Status
✅ **Aceita** (2026-01-22)

## Contexto

O projeto Reiche Academy iniciou com um sistema de **7 agentes especializados** (v1.0):

1. Extractor de Regras
2. Reviewer de Regras
3. Dev Agent Disciplinado
4. Pattern Enforcer
5. QA Unitário Estrito
6. QA E2E Interface
7. System Engineer (meta-nível)

### Problemas Identificados com v1.0

**1. Overhead Documental**
- 6 handoffs por feature (extractor → reviewer → dev → pattern → qa-unit → qa-e2e)
- Tempo significativo criando/lendo handoffs intermediários
- Burocracia excessiva para mudanças simples

**2. Incompatibilidade com OpenCode**
- OpenCode permite **sessões longas e contextuais**
- v1.0 forçava **6 sessões diferentes** (uma por agente)
- Contexto perdido entre sessões
- Workflow otimizado para GitHub Copilot (completions curtas), não OpenCode

**3. Separações Desnecessárias**
- **Extractor + Reviewer:** Ambos fazem análise de regras de negócio
- **Dev + Pattern Enforcer:** Dev pode auto-validar padrões objetivos (checklist)
- **QA Unit + QA E2E:** Mesma função (testes independentes), apenas escopo diferente

**4. Velocidade vs Qualidade**
- Qualidade era máxima (9/10)
- Velocidade era baixa (2/10)
- Trade-off não era adequado para desenvolvimento ágil

### Requisitos para v2.0

1. **Manter separação Dev/QA** (validação independente de regras)
2. **Reduzir overhead** documental (menos handoffs)
3. **Otimizar para OpenCode** (sessões contínuas)
4. **Preservar qualidade** (testes adversariais, segurança)
5. **Não perder rastreabilidade**

---

## Decisão

### Consolidação: 7 Agentes → 4 Agentes

**v1.0 (7 agentes):**
```
Extractor de Regras
Reviewer de Regras
Dev Agent Disciplinado
Pattern Enforcer
QA Unitário Estrito
QA E2E Interface
System Engineer (meta)
```

**v2.0 (4 agentes):**
```
1. Business Analyst (Extractor + Reviewer)
2. Dev Agent Enhanced (Dev + Pattern Enforcer)
3. QA Engineer (QA Unit + QA E2E)
4. System Engineer (mantido sem alterações)
```

### Detalhamento das Consolidações

#### 1. **Business Analyst** = Extractor + Reviewer

**Justificativa:**
- Ambos fazem análise de regras de negócio
- Extração e validação são etapas complementares
- Mesmo contexto técnico/domínio
- Nenhum conflito de interesse (não implementam código)

**Novo escopo:**
- Extrair regras do código (engenharia reversa)
- Documentar regras propostas
- Validar completude e riscos
- Identificar lacunas (RBAC, multi-tenant, LGPD)
- Criar handoff único: `business-v1.md`

**Ganho:**
- 2 handoffs → 1 handoff
- Análise completa em uma sessão
- Contexto preservado

---

#### 2. **Dev Agent Enhanced** = Dev + Pattern Enforcer

**Justificativa:**
- Pattern Enforcer valida padrões **objetivos** (checklist: naming, estrutura)
- Dev pode executar checklist durante implementação (auto-validação)
- **QA ainda valida regras de negócio** de forma independente (separação crítica mantida)
- Sem conflito: padrões são objetivos, regras são adversariais

**Novo escopo:**
- Implementar código seguindo regras documentadas
- **Auto-validar padrões** via checklist:
  - Naming conventions (PascalCase, camelCase, kebab-case)
  - Estrutura de pastas
  - DTOs com validadores
  - Guards aplicados
  - Soft delete respeitado
- Documentar decisões técnicas
- Criar handoff único: `dev-v<N>.md` (incluindo resultado de auto-validação)

**Limitações importantes:**
- ❌ **NÃO valida regras de negócio** (QA faz isso)
- ❌ **NÃO cria testes finais** (QA faz isso)
- ✅ Auto-valida apenas padrões objetivos

**Ganho:**
- 2 handoffs → 1 handoff
- Velocidade sem perder qualidade (QA independente preservado)

**Por que é seguro:**
- Padrões são **objetivos** (naming, estrutura) → checklist
- Regras são **adversariais** (edge cases, segurança) → QA independente
- Separação Dev/QA para regras **permanece intocada**

---

#### 3. **QA Engineer** = QA Unitário + QA E2E

**Justificativa:**
- Mesma função: testes independentes
- Apenas escopo diferente (unit vs E2E)
- Mesmo princípio: testar REGRAS, não código
- Validação adversarial (pensar como atacante)

**Novo escopo:**
- Criar testes unitários baseados em REGRAS documentadas
- Criar testes E2E (Playwright) validando fluxos completos
- Executar testes iterativamente
- Detectar bugs via testes adversariais
- Criar handoff único: `qa-v<N>.md`

**Ganho:**
- 2 handoffs → 1 handoff
- Testes completos (unit + E2E) em uma sessão
- Contexto preservado (mesmas regras, mesma feature)

---

#### 4. **System Engineer** (Mantido)

**Sem alterações.**
- Opera em meta-nível (governança)
- Não participa do fluxo de desenvolvimento regular
- 3 modos: Governança, Consultivo, Documentação

---

### Fluxo Comparado

**v1.0 (6 handoffs):**
```
Extractor → Reviewer → Dev → Pattern → QA Unit → QA E2E
(handoff)  (handoff)  (handoff) (handoff) (handoff)  (handoff)
```

**v2.0 (3 handoffs):**
```
Business Analyst → Dev Agent Enhanced → QA Engineer
    (handoff)           (handoff)         (handoff)
```

**Redução:** 50% menos handoffs

---

## Consequências

### Positivas ✅

1. **Velocidade:** 50% menos handoffs = features mais rápidas
2. **OpenCode otimizado:** Sessões contínuas viáveis
   - Business Analyst: análise completa em 1 sessão
   - Dev Agent Enhanced: implementação + auto-validação em 1 sessão
   - QA Engineer: testes unit + E2E em 1 sessão
3. **Qualidade preservada:**
   - Separação Dev/QA para regras **mantida**
   - QA independente valida regras adversarialmente
   - Testes protegem regras documentadas (não código)
4. **Rastreabilidade mantida:**
   - 3 handoffs versionados
   - Git commits + PRs
   - Histórico completo
5. **Simplicidade:**
   - Menos agentes para lembrar (4 vs 7)
   - Menos documentação para manter
   - Onboarding mais fácil

### Negativas ⚠️

1. **Granularidade reduzida:**
   - Não há handoff separado para extração vs validação de regras
   - Não há handoff separado para implementação vs padrões
   - Não há handoff separado para unit vs E2E

   **Mitigação:** Handoffs consolidados têm seções separadas para cada etapa

2. **Risco teórico de viés em auto-validação:**
   - Dev auto-valida padrões (pode ter ponto cego)

   **Mitigação:** 
   - QA ainda valida **regras** de forma independente
   - Auto-validação é apenas para padrões **objetivos** (checklist)
   - Padrões objetivos (naming, estrutura) têm baixo risco de viés
   - Regras adversariais (segurança, edge cases) continuam com QA independente

3. **Handoffs mais longos:**
   - `business-v1.md` inclui extração + validação
   - `dev-v<N>.md` inclui implementação + auto-validação
   - `qa-v<N>.md` inclui unit + E2E

   **Mitigação:** Estrutura clara com seções numeradas

### Neutras ⚖️

1. **Mudança de workflow:**
   - Usuários precisam aprender novos agentes
   - Documentação atualizada (FLOW.md, AGENTS.md)

2. **Histórico preservado:**
   - v1.0 arquivada em `/docs/history/agents-v1/`
   - Possível reverter (não recomendado)

---

## Alternativas Consideradas

### Alternativa 1: Manter v1.0 (7 agentes)

**Prós:**
- Máxima granularidade
- Rastreabilidade absoluta
- Separação total de responsabilidades

**Contras:**
- Overhead alto (6 handoffs)
- Incompatível com OpenCode
- Lento para mudanças simples

**Decisão:** Rejeitado (muito overhead)

---

### Alternativa 2: Consolidação Total (3 agentes)

**Estrutura:**
1. System Engineer (meta)
2. Dev Full-Cycle (regras + implementação + testes)
3. QA Auditor (validação final)

**Prós:**
- Máxima velocidade
- Apenas 2 handoffs

**Contras:**
- **Risco crítico de viés:** Dev implementa E cria testes
- Perde validação independente de regras
- QA se torna apenas "verificador de testes do Dev"
- Vulnerável a pontos cegos (Dev não testa o que não pensou)

**Decisão:** Rejeitado (risco de viés muito alto)

**Evidências do próprio código:**
- `usuarios.service.spec.ts` (1221 linhas) protege 32 regras
- Testes incluem edge cases que Dev poderia não pensar:
  - RN-007: Soft delete (inativos não aparecem)
  - RN-015: Multi-tenant (GESTOR não vê outras empresas)
  - RN-023: Elevação de privilégio (GESTOR não cria ADMINISTRADOR)
- Se mesmo agente implementasse E testasse, esses casos poderiam ser perdidos

---

### Alternativa 3: Modelo Híbrido (Opção 2.5 - ESCOLHIDA)

**Estrutura:**
1. System Engineer (meta)
2. Business Analyst (regras)
3. Dev Agent Enhanced (implementação + auto-validação de padrões)
4. QA Engineer (testes independentes de REGRAS)

**Prós:**
- Separação Dev/QA para regras **preservada**
- Velocidade alta (3 handoffs vs 6)
- QA pensa adversarialmente
- Auto-validação de padrões objetivos (checklist)

**Contras:**
- Handoffs mais longos

**Decisão:** ✅ **ACEITA** (melhor balanceamento velocidade/qualidade)

---

## Validação de Separação Dev/QA

### Princípio Crítico Mantido

**Dev pode auto-validar PADRÕES, mas NÃO pode validar REGRAS:**

| Aspecto | Dev Auto-Valida? | QA Valida? |
|---------|------------------|------------|
| **Naming conventions** | ✅ Sim (checklist) | ❌ Não |
| **Estrutura de pastas** | ✅ Sim (checklist) | ❌ Não |
| **DTOs com validadores** | ✅ Sim (checklist) | ❌ Não |
| **Regras de negócio** | ❌ **NÃO** | ✅ **SIM** |
| **Edge cases** | ❌ **NÃO** | ✅ **SIM** |
| **Segurança (RBAC, multi-tenant)** | ❌ **NÃO** | ✅ **SIM** |
| **Testes adversariais** | ❌ **NÃO** | ✅ **SIM** |

**Conclusão:** Separação crítica Dev/QA permanece intacta onde importa.

---

## Migração e Rollout

### Etapas

1. ✅ Criar 4 novos agentes em `/.github/agents/`
2. ✅ Mover agentes antigos para `/docs/history/agents-v1/`
3. ✅ Atualizar FLOW.md (v2.0)
4. ✅ Criar ADR-008 (este documento)
5. ⏳ Atualizar AGENTS.md com novos comandos
6. ⏳ Atualizar DOCUMENTATION_AUTHORITY.md
7. ⏳ Comunicar mudança aos usuários
8. ⏳ Usar v2.0 em próximas features

### Rollback (Se Necessário)

**Não recomendado**, mas possível:
```bash
# Restaurar agentes v1.0
mv docs/history/agents-v1/*.md .github/agents/

# Restaurar FLOW.md v1.0
git checkout docs/history/FLOW-v1.md
mv docs/history/FLOW-v1.md docs/FLOW.md
```

**Quando considerar rollback:**
- Qualidade de testes cai significativamente
- Bugs de regras não são detectados
- Separação Dev/QA mostrar-se insuficiente

**Prazo de avaliação:** 3 meses (até 2026-04-22)

---

## Métricas de Sucesso

**Acompanhar após 3 meses:**

1. **Velocidade:**
   - Tempo médio de feature (v1.0 vs v2.0)
   - Meta: Redução de 30%+

2. **Qualidade:**
   - Bugs de regras detectados por QA
   - Meta: Manter nível atual (95%+ detecção)

3. **Overhead:**
   - Tempo criando handoffs
   - Meta: Redução de 40%+

4. **Satisfação:**
   - Feedback dos desenvolvedores
   - Facilidade de uso (OpenCode)

---

## Referências

- **FLOW.md v1.0:** `/docs/history/FLOW-v1.md`
- **Agentes v1.0:** `/docs/history/agents-v1/`
- **ADR-004:** Consolidação Tech Writer + Advisor (precedente)
- **Discussão:** Conversa com usuário em 2026-01-22

---

## Notas Adicionais

### Contexto de Uso (OpenCode vs Copilot)

**GitHub Copilot (v1.0 otimizada):**
- Completions curtas, sem memória
- Agentes = "prompts reutilizáveis"
- Cada agente = nova sessão

**OpenCode (v2.0 otimizada):**
- Sessões longas com contexto persistente
- Tool calls (read, edit, bash, etc.)
- Multi-agente interno (Task tool)
- Uma sessão pode fazer Business → Dev → QA (se desejado)

**v2.0 aproveita melhor OpenCode.**

### Agentes Nativos do OpenCode

**OpenCode tem agentes internos** (Plan, Build, etc.):
- **Plan:** Planejamento de tarefas
- **Build:** Implementação de código
- **TAB:** Alterna entre Plan ↔ Build

**Relação com nossos agentes customizados:**
- **Complementares, não substituem**
- Nossos agentes têm **regras específicas de domínio**
- Plan/Build são genéricos
- Nossos agentes garantem **governança + rastreabilidade**

**Uso combinado:**
```
Usuário ativa: "Atue como Dev Agent Enhanced"
    ↓
OpenCode assume papel do Dev Agent Enhanced
    ↓
Internamente, OpenCode pode usar Plan/Build para subtarefas
    ↓
Mas segue restrições/outputs do Dev Agent Enhanced
```

**Explicação completa:** Ver próxima seção (Integração com OpenCode)

---

**Decisão aprovada por:** OpenCode (atuando como System Engineer - Modo Governança)  
**Data:** 2026-01-22  
**Revisão:** Não necessária (mudança interna de governança)
