# System Engineering Change Report

**Data:** 2026-01-21  
**Tipo:** Enhancement (Nova funcionalidade)  
**Modo:** Consultivo + Documentação  
**Solicitação:** Adicionar coluna `historico` em IndicadorMensal

---

## Motivação

Usuário solicitou adição de campo `historico` no modelo `IndicadorMensal` para permitir comparação de valores atuais com baseline de períodos anteriores.

**Contexto:**
- Sistema atual possui apenas `meta` e `realizado` por mês
- Necessidade de visualizar dados históricos para análise comparativa
- Gráfico deve diferenciar visualmente histórico (barras cinza) de meta/realizado (linhas)

**Justificativa:**
- Funcionalidade comum em dashboards gerenciais
- Backward compatible (campo opcional)
- Melhora análise de tendências e evolução temporal

---

## Mudanças Realizadas

### 1. Handoff para Dev Agent
**Arquivo:** [`docs/handoffs/cockpit-pilares/dev-v5-coluna-historico.md`](c:/Users/filip/source/repos/reiche-academy/docs/handoffs/cockpit-pilares/dev-v5-coluna-historico.md)

**Conteúdo:**
- Especificação completa do campo `historico: Float?`
- 6 tasks detalhadas (migration, DTOs, service, frontend tabela, interface, gráfico)
- Padrões de implementação (cor cinza `rgba(200, 200, 200, 0.5)`)
- Checklist de validação
- Critérios de aceite

**Conformidade:**
- ✅ Segue template de handoff do projeto
- ✅ Especificação técnica completa (backend + frontend)
- ✅ Validação obrigatória antes de merge

### 2. Atualização de Business Rules
**Arquivo:** [`docs/business-rules/cockpit-pilares.md`](c:/Users/filip/source/repos/reiche-academy/docs/business-rules/cockpit-pilares.md)

**Mudanças:**
1. **Seção 2.3 (IndicadorMensal) - Descrição:**
   - Antes: "Valores de meta e realizado..."
   - Depois: "Valores de meta, histórico e realizado..."

2. **Tabela de campos:**
   - Adicionado: `historico | Float? | Valor histórico de referência (períodos anteriores)`

3. **Regras de Negócio:**
   - Adicionado: "Histórico representa valores de períodos anteriores usados como baseline/referência"
   - Adicionado: "Gráfico exibe histórico como barras cinza claro para diferenciação visual"

**Conformidade:**
- ✅ Documentação normativa atualizada
- ✅ Especificação de comportamento visual (UX)
- ✅ Mantém consistência com padrão de campos nullable

---

## Impacto nos Agentes Existentes

### Dev Agent Disciplinado
- **Afetado:** ✅ Sim
- **Como:** Receberá handoff dev-v5-coluna-historico.md
- **Ação:** Implementar 6 tasks especificadas
- **Escopo:** Backend (migration, DTOs, service) + Frontend (tabela, interface, gráfico)

### Pattern Enforcer
- **Afetado:** ✅ Sim
- **Como:** Validará implementação contra business-rules/cockpit-pilares.md
- **Ação:** Verificar conformidade com especificação
- **Foco:** Nullable handling, DTOs, padrões de UX

### QA Unitário Estrito
- **Afetado:** ⚠️ Parcial (sem testes unitários)
- **Como:** Regra do projeto: testes unitários criados posteriormente
- **Ação:** Nenhuma neste momento
- **Nota:** Handoff especifica teste manual obrigatório

### Outros Agentes
- **FLOW:** Nenhum impacto (fluxo normal de feature)
- **System Engineer:** Nenhum impacto (mudança não afeta governança)

---

## Validação de Consistência

### ✅ FLOW.md ainda é internamente consistente?
**Sim.** Mudança segue fluxo normal:
1. Requisito → System Engineer (handoff)
2. Handoff → Dev Agent (implementação)
3. Dev → Pattern Enforcer (validação)
4. Pattern → QA (testes manuais)

### ✅ Todos os agentes têm escopo claro e não sobreposto?
**Sim.** Responsabilidades bem definidas:
- System Engineer: Criar handoff + atualizar docs
- Dev Agent: Implementar (backend + frontend)
- Pattern Enforcer: Validar conformidade
- QA: Testar manualmente (testes unitários posteriores)

### ✅ Hierarquia de autoridade preservada?
**Sim.**
```
1. Business Rules (cockpit-pilares.md) ← Atualizado (fonte de verdade)
2. Conventions (matriz-indicadores-excel-like.md) ← Não afetado
3. Handoff (dev-v5) ← Criado (instruções de implementação)
4. Código ← A ser implementado pelo Dev
```

### ✅ Documentação de referência atualizada?
**Sim.**
- ✅ Business rules atualizado
- ✅ Handoff criado
- ⏳ ADR-006 não requer atualização (mudança não afeta arquitetura de componentes)

---

## Riscos Identificados

### 1. Migration Irreversível
**Risco:** Após deploy em produção, remover campo causaria perda de dados  
**Mitigação:** Campo nullable (backward compatible), sistema funciona com `historico = null`  
**Severidade:** ⚠️ Média

### 2. Impacto Visual no Gráfico
**Risco:** Barras cinza podem poluir visualização se muitos indicadores tiverem histórico  
**Mitigação:** Cor clara escolhida intencionalmente (`rgba(200, 200, 200, 0.5)`), opacidade baixa  
**Severidade:** ℹ️ Baixa

### 3. Performance de Queries
**Risco:** Campo adicional aumenta payload de GET /indicadores-mensais  
**Mitigação:** Campo simples (Float), sem relações, impacto negligível  
**Severidade:** ℹ️ Muito Baixa

---

## Próximos Passos

### Imediato (Dev Agent)
1. Implementar Task 1: Migration Prisma
2. Implementar Task 2: Atualizar DTOs
3. Implementar Task 3: Atualizar Service
4. Implementar Task 4: Adicionar coluna na tabela (frontend)
5. Implementar Task 5: Atualizar interface TypeScript
6. Implementar Task 6: Adicionar histórico no gráfico

### Após Implementação (Pattern Enforcer)
1. Validar DTOs seguem padrão `@IsOptional()`
2. Validar migration criada corretamente
3. Validar coluna aparece na tabela de edição
4. Validar gráfico exibe barras cinza claro
5. Validar auto-save funciona para campo histórico

### Futuro (Opcional)
- ❓ Importação automática de dados históricos de planilhas Excel
- ❓ Cálculo automático de desvio histórico (realizado vs histórico)
- ❓ Configuração de opacidade/cor de histórico por indicador

---

## ADR Criado

**Não.** ADR não necessário.

**Justificativa:**
- Mudança é **enhancement simples** (novo campo)
- Não afeta arquitetura de sistema
- Não cria novas dependências
- Não muda padrões existentes
- Backward compatible

**Categoria:** Feature incremental documentada via handoff

---

## Conformidade com Safe Failure Rule

**Situação:** Solicitação clara e direta do usuário ✅

**Validação prévia:**
- ✅ Documentação existente consultada (cockpit-pilares.md, ADR-006)
- ✅ Código existente analisado (schema.prisma, componentes frontend)
- ✅ Nenhuma lacuna de informação identificada

**Decisão:** Prosseguir com handoff (System Engineer atua em Modo Consultivo)

---

## Checklist Final

- [x] Handoff criado com especificação completa
- [x] Business rules atualizado
- [x] Impacto em agentes documentado
- [x] Riscos identificados e mitigados
- [x] Próximos passos claros
- [x] Rastreabilidade garantida (git commit)
- [x] Nenhuma salvaguarda de segurança removida
- [x] Humano informado via report

---

**Conclusão:**

Mudança **aprovada para implementação** via handoff dev-v5-coluna-historico.md.

Sistema de governança **preservado** e **consistente**.

**Fim do Report**

---

**Assinatura:** System Engineer  
**Modo:** Consultivo + Documentação  
**Data:** 2026-01-21
