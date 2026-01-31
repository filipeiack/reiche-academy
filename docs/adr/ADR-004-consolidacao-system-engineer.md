# ADR-004: Consolidação de Responsabilidades no System Engineer

## Status
**Aceita** — 2026-01-15

## Contexto

O projeto possuía três agentes atuando em níveis meta/consultivo/documentação:

1. **System Engineer** — Mantém estrutura de governança
2. **Advisor** — Orientação técnica consultiva
3. **Tech Writer** — Documentação de decisões arquiteturais

### Problema Identificado

**Sobreposição de responsabilidades:**
- Advisor propunha melhorias na governança → System Engineer executava
- Tech Writer documentava decisões → System Engineer também documentava (governança)
- Distinção artificial criando fricção desnecessária
- Usuários confusos sobre qual agente acionar

**Subutilização:**
- Advisor raramente usado (orientação poderia ser integrada)
- Tech Writer acionado apenas pós-merge (pouco engajamento)

**Complexidade sem benefício:**
- Três agentes para tarefas relacionadas
- Handoffs desnecessários entre Advisor → System Engineer
- Responsabilidades muito próximas conceptualmente

## Decisão

**Consolidar Advisor e Tech Writer no System Engineer**, expandindo suas responsabilidades para três modos de operação:

### Novo Escopo do System Engineer

**1. Modo Governança (original):**
- Criar/modificar definições de agentes
- Atualizar FLOW.md e DOCUMENTATION_AUTHORITY.md
- Reorganizar estrutura documental normativa

**2. Modo Consultivo (do Advisor):**
- Orientar sobre uso correto do FLOW
- Sugerir agentes apropriados (Agent Selection)
- Interpretar hierarquia de autoridade
- Pre-flight checks antes de iniciar features
- Explicar trade-offs técnicos no contexto de governança

**3. Modo Documentação (do Tech Writer):**
- Criar ADRs para decisões arquiteturais
- Criar ADRs para decisões de governança
- Atualizar `/docs/architecture/**`
- Manter diagramas sincronizados
- Documentar decisões aprovadas pós-merge

### Princípios Preservados

✅ Aprovação humana obrigatória para mudanças estruturais
✅ ADRs para mudanças críticas
✅ Rastreabilidade via git
✅ Rollback sempre possível
✅ System Engineer nunca atua em código de produção

## Alternativas Consideradas

### 1. Manter status quo
**Rejeitado:** Sobreposição continuaria gerando confusão

### 2. Eliminar apenas Tech Writer
**Rejeitado:** Advisor também tinha overlap significativo

### 3. Eliminar apenas Advisor
**Rejeitado:** Tech Writer também documentava governança (overlap)

### 4. Criar "Meta Agent" separado
**Rejeitado:** Criaria quarto agente, aumentando complexidade

### 5. Consolidar no System Engineer ✅
**Aceito:** Unifica responsabilidades relacionadas em agente único bem definido

## Consequências

### Positivas

✅ **Clareza:** Um único ponto de contato para meta-nível
✅ **Simplicidade:** Menos agentes = menos overhead cognitivo
✅ **Consistência:** Documentação técnica unificada (arquitetura + governança)
✅ **Eficiência:** Elimina handoffs desnecessários
✅ **Escopo claro:** Modos de operação explícitos dentro do mesmo agente

### Negativas

⚠️ **Responsabilidades múltiplas:** System Engineer tem 3 modos
⚠️ **Risco de confusão:** Usuário pode misturar modos

### Neutras

- Total de agentes: 9 → 7
- FLOW permanece inalterado (apenas referências atualizadas)
- Agentes especializados (Dev, QA, Pattern) não afetados

### Mitigações

**Para evitar confusão entre modos:**
- Documentação explícita de quando usar cada modo
- Ativação por comandos claros ("Modo Consultivo", "Crie ADR", etc.)
- Separação lógica dentro da definição do agente
- System Engineer continua exigindo aprovação para mudanças estruturais

## Impacto em Agentes Existentes

| Agente | Impacto |
|--------|---------|
| Extractor de Regras | Nenhum |
| Reviewer de Regras | Nenhum |
| Dev Agent | Nenhum |
| Pattern Enforcer | Nenhum |
| QA Unitário Estrito | Nenhum |
| QA E2E Interface | Nenhum |

**Mudança isolada no meta-nível — não afeta fluxo de desenvolvimento**

## Migração/Transição

**Imediata — sem transição necessária:**
- Advisor nunca criou artefatos persistentes
- Tech Writer não tinha handoffs versionados
- Nenhum código depende desses agentes
- Documentação existente preservada

**Ações executadas:**
1. ✅ ADR-004 criado
2. ✅ `0-System_Engineer.md` expandido
3. ✅ `FLOW.md` atualizado
4. ✅ `Advisor.md` removido
5. ✅ `7-Tech_Writer.md` removido
6. ✅ `/docs/adr/README.md` atualizado

## Riscos de Governança

**Risco Baixo:**
- System Engineer já era agente crítico com salvaguardas robustas
- Expansão de escopo não altera princípios de segurança
- Aprovação humana permanece obrigatória
- Rollback fácil (git revert + recriar agentes deletados)

**Monitoramento:**
- Verificar se modos de operação permanecem claros
- Avaliar após 2-3 usos se consolidação funciona
- Considerar split novamente se confusão persistir

## Referências

- `/docs/FLOW.md` — Fluxo oficial
- `/.github/agents/0-System_Engineer.md` — Definição atualizada
- `/.github/agents/Advisor.md` — [REMOVIDO]
- `/.github/agents/7-Tech_Writer.md` — [REMOVIDO]

---

**Decisão tomada por:** Humano (filipeiack)  
**Executado por:** System Engineer  
**Data:** 2026-01-15
