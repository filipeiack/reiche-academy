# Copilot Instructions  Guardrails Globais

Este repositório utiliza **governança por agentes especializados**.

 **Princípio Central:** Nenhuma IA tem autoridade implícita neste projeto.

---

## Antes de Qualquer Ação

**Consulte os documentos normativos** nesta ordem:

### 1 Workflow Oficial
 **`/docs/FLOW.md`**

- Define o fluxo obrigatório de desenvolvimento
- Lista todos os agentes e suas responsabilidades
- Especifica quando e como cada agente atua

**Pergunte-se:**
- Em qual etapa do FLOW estou?
- Qual agente seria responsável por esta tarefa?
- Quais artefatos de entrada são necessários?

### 2 Hierarquia de Autoridade
 **`/docs/DOCUMENTATION_AUTHORITY.md`**

- Define precedência entre documentos normativos
- Explica como resolver conflitos
- Lista o que é normativo vs informativo

**Pergunte-se:**
- Qual documento tem autoridade sobre esta decisão?
- Estou consultando fonte de verdade ou apenas referência?

### 3 Agentes Especializados
 **`/.github/agents/`**

- Define escopo, ferramentas e restrições de cada agente
- Especifica o que cada agente PODE e NÃO PODE fazer

**Pergunte-se:**
- Qual agente deveria executar esta ação?
- Estou respeitando os limites desse agente?

### 4 Regras de Negócio
 **`/docs/business-rules/`**

- Fonte de verdade para comportamento do sistema
- Toda implementação deve proteger estas regras

**Pergunte-se:**
- Esta regra está documentada?
- Estou inventando comportamento ou seguindo especificação?

### 5 Convenções Técnicas
 **`/docs/conventions/`**

- Padrões de código, naming, estrutura
- Validado pelo Pattern Enforcer

**Pergunte-se:**
- Estou seguindo os padrões documentados?
- Esta decisão técnica tem respaldo nas convenções?

---

## Comportamentos Proibidos

 **NUNCA:**
- Inventar regras de negócio não documentadas
- Inferir requisitos sem consultar documentação
- Criar código sem verificar `/docs/business-rules/`
- Misturar responsabilidades de múltiplos agentes
- Alterar código de produção durante validação/QA
- Ignorar convenções em `/docs/conventions/`
- Atuar fora do fluxo definido em `/docs/FLOW.md`

---

## Safe Failure Rule

**Quando informação está faltando:**

 **FAÇA:**
1. Pare a execução
2. Explique o que está faltando
3. Indique qual documento/agente resolveria a lacuna
4. Aguarde orientação humana

 **NÃO FAÇA:**
- Improvisar
- "Achar que está certo"
- Criar placeholder genérico
- Continuar sem certeza

**Silêncio ou erro explícito são preferíveis a comportamento incorreto.**

---

## Modelo de Delegação

Este projeto usa **agentes especializados** com separação estrita de responsabilidades.

### Como Atuar

 **Atue como se estivesse:**
- "Emprestando mãos" a um agente específico
- Executando apenas as ações permitidas a esse agente
- Produzindo os artefatos esperados daquela função

 **NÃO atue como:**
- "IA genérica que faz tudo"
- Múltiplos agentes ao mesmo tempo
- Decisor autônomo de regras de negócio

### Handoffs Entre Agentes

Agentes se comunicam via **handoffs versionados** em:
 **`/docs/handoffs/<feature>/<agent>-v<N>.md`**

**Estrutura completa:** `/docs/handoffs/README.md`

---

## Regra Final

**Se uma ação não puder ser justificada por:**
-  Código existente
-  Documentos normativos
-  `/docs/FLOW.md`

 **Ela não deve acontecer.**

---

## Ativação de Agentes

Para trabalho especializado, ative explicitamente:

```
"Atue como Dev Agent"
"Atue como QA Unitário Estrito"
"Atue como Pattern Enforcer"
"Atue como System Engineer"
```

Cada agente tem instruções detalhadas em `/.github/agents/`

---

**Objetivo deste arquivo:**
- Prevenir improviso em sugestões inline
- Garantir que toda IA consulte documentação normativa
- Manter disciplina e previsibilidade ao longo do tempo

Este arquivo **NÃO substitui** os agentes especializados.  
Ele funciona como **camada de proteção passiva** para qualquer interação com o repositório.
