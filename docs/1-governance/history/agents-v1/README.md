# Agentes v1 - Histórico

**Data:** 2026-01-22  
**Versão:** 1.0 (7 agentes especializados)  
**Substituído por:** Versão 2.0 (4 agentes consolidados)  
**ADR:** ADR-005

---

## Contexto

Esta pasta contém a **primeira versão** do sistema de agentes do Reiche Academy, com **7 agentes especializados**:

1. **Extractor de Regras** - Extrair regras do código
2. **Reviewer de Regras** - Validar completude e riscos
3. **Dev Agent** - Implementar código
4. **Pattern Enforcer** - Validar convenções
5. **QA Unitário Estrito** - Criar testes unitários
6. **QA E2E Interface** - Criar testes E2E

---

## Por Que Foi Substituído?

### Problemas Identificados:

1. **Overhead documental:** 6 handoffs por feature
2. **Múltiplas sessões necessárias:** Incompatível com fluxo contínuo do OpenCode
3. **Separações desnecessárias:**
   - Extractor + Reviewer faziam análise de negócio
   - Dev + Pattern Enforcer validavam código
   - QA Unit + QA E2E criavam testes

### Consolidações Realizadas (v2.0):

**v1.0 (7 agentes) → v2.0 (4 agentes):**

1. **Extractor + Reviewer** → **Business Analyst**
   - Mesma função (análise de regras)
   - Redução de 2 handoffs para 1

2. **Dev + Pattern Enforcer** → **Dev Agent Enhanced**
   - Dev auto-valida padrões (checklist objetivo)
   - QA ainda valida regras de forma independente
   - Redução de 2 handoffs para 1

3. **QA Unit + QA E2E** → **QA Engineer**
   - Mesma função (testes independentes)
   - Redução de 2 handoffs para 1

4. **System Engineer** → **Mantido sem alterações**

---

## Resultado

**Handoffs por feature:**
- v1.0: 6 handoffs (extractor → reviewer → dev → pattern → qa-unit → qa-e2e)
- v2.0: 3 handoffs (business → dev → qa)

**Redução:** 50% menos overhead, mantendo qualidade

---

## Quando Consultar Esta Versão?

- Referência histórica de decisões
- Entender evolução do sistema de governança
- Comparar abordagens (7 vs 4 agentes)

---

## Migração

Se precisar voltar à v1.0:
```bash
# Mover agentes de volta
mv docs/history/agents-v1/*.md .github/agents/

# Restaurar FLOW.md (consultar git history)
git checkout <commit-hash> -- docs/FLOW.md
```

**Não recomendado:** v2.0 é otimizada para OpenCode

---

**Documentação completa:** Ver ADR-005
