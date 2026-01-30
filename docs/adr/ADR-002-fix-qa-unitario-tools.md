# ADR-002: Correção de Ferramentas do QA Unitário Estrito

**Data:** 2026-01-13  
**Status:** Aceito  
**Decisor:** System Engineer  
**Contexto:** Correção de bug na definição do agente

---

## Contexto

O agente **QA Unitário Estrito** (`5-QA_Unitário_Estrito.md`) estava definido com restrição de ferramentas:

```yaml
tools: ['runTests']
```

Isso **bloqueava** o agente de:
- Criar arquivos de teste (`create_file`)
- Editar testes existentes (`replace_string_in_file`, `multi_replace_string_in_file`)
- Ler código de produção (`read_file`)
- Buscar implementações (`semantic_search`, `grep_search`)

**Resultado:** O agente não conseguia executar sua responsabilidade principal (criar e corrigir testes unitários).

---

## Problema Identificado

Durante execução real, o agente respondeu:
> "Como não tenho acesso às ferramentas de edição de arquivos, vou fornecer o código completo dos testes para você criar manualmente"

Isso viola o princípio de automação do sistema de governança.

---

## Decisão

**Alterar** a definição do agente de:
```yaml
tools: ['runTests']
```

**Para:**
```yaml
tools: []
```

**Efeito:** Array vazio = **todas as ferramentas disponíveis** (comportamento padrão do sistema).

---

## Justificativa

### Por que `tools: []` ao invés de lista explícita?

**Opção 1: Lista explícita**
```yaml
tools: ['create_file', 'replace_string_in_file', 'read_file', 'runTests', 'grep_search', 'semantic_search', ...]
```
- ❌ Frágil (quebra se novas ferramentas forem adicionadas ao sistema)
- ❌ Verboso
- ❌ Manutenção constante

**Opção 2: Array vazio (escolhida)**
```yaml
tools: []
```
- ✅ Comportamento padrão = acesso total
- ✅ Resistente a mudanças no sistema
- ✅ Consistente com outros agentes (Dev, Pattern Enforcer, Tech Writer)

### Ferramentas Essenciais para QA Unitário:

1. **Criação:**
   - `create_file` — Criar novos arquivos `.spec.ts`

2. **Edição:**
   - `replace_string_in_file` — Corrigir testes unitários
   - `multi_replace_string_in_file` — Corrigir múltiplos testes simultaneamente

3. **Leitura/Análise:**
   - `read_file` — Ler código de produção para entender comportamento
   - `grep_search` — Buscar implementações específicas
   - `semantic_search` — Encontrar regras relacionadas

4. **Execução:**
   - `runTests` — Executar testes (já estava permitido)
   - `run_in_terminal` — Executar testes via NPM (backend)
   - `get_terminal_output` — Analisar resultados

5. **Navegação:**
   - `list_dir` — Explorar estrutura de testes
   - `file_search` — Localizar arquivos de teste

---

## Impacto nos Agentes Existentes

### Agentes Afetados:
- **5-QA_Unitário_Estrito** ← CORRIGIDO

### Agentes Inalterados:
- 0-System_Engineer
- 1-Extractor_Regras
- 2-Reviewer_Regras
- 3-DEV_Agent
- 4-Pattern_Enforcer
- 6-QA_E2E_Interface
- 7-Tech_Writer
- Advisor

### FLOW.md:
- ✅ Inalterado (agente continua na mesma posição)
- ✅ Responsabilidades preservadas

### Hierarquia de Autoridade:
- ✅ Inalterada

---

## Validação de Consistência

- [x] FLOW.md ainda é internamente consistente?
- [x] Todos os agentes têm escopo claro e não sobreposto?
- [x] Hierarquia de autoridade preservada?
- [x] Documentação de referência atualizada?

---

## Riscos Identificados

### Risco Eliminado:
- ❌ ~~Agente não consegue executar sua função principal~~

### Novos Riscos:
- ⚠️ **Nenhum** — Correção apenas restaura comportamento esperado

### Mitigações:
- ✅ ADR documenta mudança
- ✅ Change Report rastreável
- ✅ Reversível via git

---

## Próximos Passos

1. ✅ Mudança aplicada em `5-QA_Unitário_Estrito.md`
2. ⏳ Testar agente em cenário real (criar testes para `updateResponsavel`)
3. ⏳ Validar que ferramentas funcionam corretamente
4. ⏳ Atualizar documentação se necessário

---

## Alternativas Consideradas

### 1. Manter `tools: ['runTests']` e adicionar manualmente
- ❌ Rejeitado: Lista ficaria muito longa e frágil

### 2. Criar categoria de ferramentas "qa-tools"
- ❌ Rejeitado: Over-engineering para problema simples

### 3. `tools: []` (escolhida)
- ✅ Aceita: Simples, robusto, consistente

---

## Referências

- `/docs/FLOW.md` — Posição do agente no fluxo
- `/.github/agents/5-QA_Unitário_Estrito.md` — Definição do agente
- Issue reportada: Usuário notou que agente disse "não tenho ferramentas de edição"

---

## Lições Aprendidas

1. **Restrição de ferramentas deve ser exceção, não regra**
   - Apenas restringir quando houver motivo de segurança explícito
   - Exemplo: Agente "Read-Only Auditor" teria `tools: ['read_file', 'grep_search']`

2. **Testar agentes em cenários reais antes de deploy**
   - Este bug só foi detectado durante uso real
   - Considerar criar suite de validação de agentes

3. **Documentar decisões de design**
   - Por que alguns agentes têm `tools: []` e outros lista explícita?
   - Faltava clareza (corrigido neste ADR)

---

**Aprovação:** Implícita (correção de bug não controvertido)  
**Implementação:** Imediata  
**Revisão:** Não requer (mudança de baixo risco)
