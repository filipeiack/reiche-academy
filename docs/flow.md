## 📘 FLOW.md — Fluxo Oficial e Normativo do Projeto

---

## 🎯 Objetivo

Este documento define **o único fluxo oficial** de desenvolvimento, validação e entrega de código do projeto.

👉 **Nenhuma ação técnica é válida fora deste fluxo.**  
👉 **Nenhum agente pode atuar sem estar formalmente definido aqui.**

---

## 🧭 Princípios Inquebráveis

1. **Documentos mandam, agentes obedecem**
2. **Agentes não compartilham memória — apenas artefatos**
3. **Nenhum agente valida o próprio trabalho**
4. **Instruções ad-hoc não criam autoridade**
5. **Nenhuma mudança entra no `main` sem passar pelo fluxo completo**

---

## 🔐 Autoridade Documental (Precedência)

A ordem de autoridade no projeto é **imutável**:

1. `FLOW.md`
2. `/docs/DOCUMENTATION_AUTHORITY.md`
3. Definições de agentes em `/.github/agents/*.md`
4. Documentos de regras e arquitetura
5. Instruções do usuário (chat, prompt, comentário)

⚠️ **Instruções do usuário NÃO podem:**
- Criar novos agentes
- Alterar escopo de agentes
- Ignorar proibições documentadas
- Substituir regras normativas

---

## 🤖 Agentes Oficiais Autorizados

Somente os agentes abaixo podem atuar neste projeto:

| Agente | Documento | Nível |
|------|---------|------|
| **System Engineer** | `/.github/agents/0-System_Engineer.md` | Meta (governança + consultivo + documentação) |
| Extractor de Regras | `/.github/agents/1-Extractor_Regras.md` | Fluxo |
| Reviewer de Regras | `/.github/agents/2-Reviewer_Regras.md` | Fluxo |
| Dev Agent Disciplinado | `/.github/agents/3-DEV_Agent.md` | Fluxo |
| Pattern Enforcer | `/.github/agents/4-Pattern_Enforcer.md` | Fluxo |
| QA Unitário Estrito | `/.github/agents/5-QA_Unitário_Estrito.md` | Fluxo |
| QA E2E Interface | `/.github/agents/6-QA_E2E_Interface.md` | Fluxo |

🚫 **Qualquer agente não listado aqui NÃO EXISTE para o projeto**, mesmo sob instrução direta.

**Nota:** System Engineer opera em 3 modos — ver `/.github/agents/0-System_Engineer.md` para detalhes.

---

## 🔁 Fluxo Oficial (Visão Geral)

```
Ideia / Feature
        ↓
(Se regra não existe)
Business Rules Extractor / Definição
        ↓ (cria arquivo em /docs/business-rules)
Business Rules Reviewer
        ↓ (handoff: reviewer-v1.md)
/docs/business-rules (contrato aprovado)
        ↓
Dev Agent Disciplinado
        ↓ (handoff: dev-v1.md)
Pattern Enforcer
        ↓ (handoff: pattern-v1.md)
   [✅ CONFORME]     [❌ NÃO CONFORME]
        ↓                    ↓
   QA Unitário       Dev Agent (v2)
        ↓                    ↓
   QA E2E           Pattern Enforcer (v2)
        ↓                    ↓
Pull Request         (repete até CONFORME)
        ↓
Merge no main
        ↓
Tech Writer (opcional)
        ↓
Docs atualizados
```

**Handoffs:** Todos os agentes criam handoffs em `/docs/handoffs/<feature>/`

**Documentação completa:** `/docs/handoffs/README.md`

---

## 1️⃣ Início do Fluxo — Requisito

O fluxo só inicia quando há **um requisito válido**, originado de:

- Documento de regras (`/docs/business-rules`)
- Correção aprovada
- Demanda explícita registrada

📌 **Código sem requisito documentado é inválido.**

### Novas regras de negócio:
→ Devem ser propostas via Rule Extractor (Mode B)
→ Devem ser aprovadas explicitamente por humano
→ Só então podem ser promovidas a documentação oficial

---

## 2️⃣ Implementação — Dev Agent Disciplinado

### Entradas
- Requisito válido
- Documentação normativa (`/docs/business-rules`)
- Arquitetura e convenções (`/docs/architecture`, `/docs/conventions`)
- Handoff do Reviewer (se houver): `/docs/handoffs/<feature>/reviewer-v1.md`

### Restrições
- ❌ Não cria regras
- ❌ Não cria testes finais (apenas testes de suporte)
- ❌ Não valida o próprio código

### Saída obrigatória (handoff)

**Cria arquivo:** `/docs/handoffs/<feature>/dev-v<N>.md`

Onde:
- `N = 1` para nova feature
- `N` incrementa se Pattern Enforcer retornar NÃO CONFORME

**Estrutura do handoff:** Ver `/docs/handoffs/README.md`

Sem esse handoff, o fluxo **para**.

### Ferramentas disponíveis
- `create_file`, `replace_string_in_file`, `multi_replace_string_in_file`
- `read_file`, `semantic_search`, `grep_search`, `file_search`

---

## 3️⃣ Validação de Padrões — Pattern Enforcer

### Função
- Garantir aderência estrita a padrões
- Bloquear drift arquitetural
- Validar naming conventions, estrutura de pastas, separação de responsabilidades

### Entrada
- **Lê handoff do Dev:** `/docs/handoffs/<feature>/dev-v<N>.md`
- Convenções em `/docs/conventions`
- Arquitetura em `/docs/architecture`

### Saída obrigatória

**Cria arquivo:** `/docs/handoffs/<feature>/pattern-v<N>.md` (mesma versão do dev)

**Conteúdo:**

```md
# Pattern Enforcement: <Feature> (v<N>)

**Status:** ✅ CONFORME | ❌ NÃO CONFORME

Viólações encontradas:
- [lista detalhada se NÃO CONFORME]

Bloqueadores:
- [violações críticas que impedem continuidade]
```

🚫 **Status = NÃO CONFORME:**
- Fluxo retorna ao Dev Agent
- Dev cria `dev-v<N+1>.md` com correções
- Pattern valida novamente como `pattern-v<N+1>.md`

✅ **Status = CONFORME:**
- Fluxo prossegue para QA Unitário

### Ferramentas disponíveis
- `read_file`, `grep_search`, `semantic_search`, `file_search`
- `create_file` (para handoff)

---

## 4️⃣ Testes Unitários — QA Unitário Estrito

### Função
- Criar testes independentes
- Proteger regras documentadas
- Detectar falhas de segurança e negócio

### Entrada
- **Lê handoff do Pattern Enforcer:** `/docs/handoffs/<feature>/pattern-v<N>.md`
  - **Pré-requisito:** Status = CONFORME
- Regras em `/docs/business-rules`
- Código de produção

### Restrições
- ❌ Não altera código de produção
- ❌ Não confia em testes existentes
- ❌ Não testa comportamento não documentado
- ✅ Pode executar e corrigir próprios testes

### Saída

**Cria arquivo:** `/docs/handoffs/<feature>/qa-unit-v<N>.md`

**Conteúdo:**
- Testes executáveis criados
- Lista de regras protegidas
- Lacunas identificadas
- Status de execução (todos passaram?)

### Ferramentas disponíveis
- `runTests` (executar testes)
- `create_file`, `replace_string_in_file` (criar/corrigir testes)
- `read_file`, `grep_search`, `semantic_search`

---

## 1️⃣ Validação de Regras — Reviewer de Regras (Opcional)

### Quando acionar
- Após Extractor criar/atualizar regras
- Antes de Dev Agent iniciar implementação
- Features críticas: Segurança, RBAC, Multi-tenant, Compliance

### Função
- Comparar regras documentadas com princípios de domínio
- Identificar lacunas críticas
- Emitir parecer técnico com bloqueadores
- Nunca implementar

### Entrada
- Documentos em `/docs/business-rules`

### Saída

**Cria arquivo:** `/docs/handoffs/<feature>/reviewer-v1.md`

**Conteúdo:**
- Status: APROVADO | APROVADO COM RESSALVAS | BLOQUEADO
- Análise de riscos
- Bloqueadores (regras ausentes críticas)
- Recomendações

🚫 **Status = BLOQUEADO:**
- Humano deve decidir:
  1. Criar regra faltante (volta ao Extractor)
  2. Aceitar risco e documentar (ADR)
  3. Adiar feature

### Ferramentas disponíveis
- `create_file` (criar handoff)
- `read_file` (ler regras)

---

## 6️⃣ Pull Request (PR)

O PR é o **checkpoint humano final**.

Deve conter:
- Código
- Testes (unitários + E2E)
- Handoffs de todos os agentes
- Referência ao requisito

---

## 7️⃣ Merge no `main`

O merge só é permitido se:

- Pattern Enforcer: **CONFORME**
- Testes: **passando**
- Regras: **aderentes**
- Nenhum agente violou escopo

Após o merge:
- O código vira fonte de verdade
- Extractor pode ser acionado para atualização documental
- Tech Writer pode ser acionado (se aplicável)

---

## 8️⃣ Tech Writer (Opcional — Pós-Merge)

### Quando acionar
- Mudanças arquiteturais significativas
- Novas integrações ou dependências
- Decisões técnicas que impactam o sistema
- Sob instrução explícita

### Função
- Documentar decisões arquiteturais (ADRs)
- Atualizar `/docs/architecture`
- Manter diagramas sincronizados
- Registrar contexto e trade-offs

### Restrições
- ❌ Não decide arquitetura
- ❌ Não altera código
- ❌ Não cria regras de negócio
- ✅ Apenas documenta decisões aprovadas

### Saída
- ADR em `/docs/adr/`
- Atualização em `/docs/architecture` (quando aplicável)
- Diagramas atualizados (quando aplicável)

---

## 5️⃣ Testes E2E (Critical Paths) — QA E2E Interface

### Função
- Validar fluxos críticos de ponta a ponta
- Verificar acessibilidade (WCAG)
- Medir performance (Core Web Vitals)
- Confirmar compatibilidade cross-browser

### Entrada
- **Lê handoff do QA Unitário:** `/docs/handoffs/<feature>/qa-unit-v<N>.md`
- Regras em `/docs/business-rules`
- Código frontend + backend

### Restrições
- ❌ Não altera código de produção
- ❌ Não cria testes unitários
- ✅ Pode executar testes E2E e ferramentas de qualidade

### Saída

**Cria arquivo:** `/docs/handoffs/<feature>/qa-e2e-v<N>.md`

**Conteúdo:**
- Testes E2E executáveis (Playwright)
- Resultados de acessibilidade (Axe)
- Métricas de performance (Lighthouse)
- Status de validação

### Ferramentas disponíveis
- `runTests` (executar testes E2E)
- `run_in_terminal` (Lighthouse, Axe, etc.)
- `create_file`, `replace_string_in_file` (criar/corrigir testes)
- `read_file`, `grep_search`

---

## 📋 Sistema de Handoffs

### Propósito

Handoffs são **contratos persistentes e versionáveis** entre agentes.

Substituem relatórios efêmeros na conversa.

### Estrutura

```
/docs/handoffs/<feature>/<agent>-v<N>.md
```

**Exemplos:**
```
/docs/handoffs/autenticacao-login/reviewer-v1.md
/docs/handoffs/autenticacao-login/dev-v1.md
/docs/handoffs/autenticacao-login/pattern-v1.md
/docs/handoffs/autenticacao-login/dev-v2.md      ← iteração
/docs/handoffs/autenticacao-login/pattern-v2.md  ← iteração
/docs/handoffs/autenticacao-login/qa-unit-v2.md
/docs/handoffs/autenticacao-login/qa-e2e-v2.md
```

### Versionamento

**Regra:** Versão incrementa **apenas quando Pattern Enforcer retorna NÃO CONFORME**

```
Dev cria dev-v1.md
  ↓
Pattern valida → pattern-v1.md (Status: CONFORME)
  ↓
QA Unit cria qa-unit-v1.md (mesma versão)
  ↓
QA E2E cria qa-e2e-v1.md (mesma versão)
```

**Com iteração:**

```
Dev cria dev-v1.md
  ↓
Pattern valida → pattern-v1.md (Status: NÃO CONFORME)
  ↓
Dev corrige → dev-v2.md  ← incrementa
  ↓
Pattern valida → pattern-v2.md (Status: CONFORME)
  ↓
QA Unit cria qa-unit-v2.md (mesma versão)
  ↓
QA E2E cria qa-e2e-v2.md (mesma versão)
```

### Agentes e Nomes de Handoffs

| Agente | Nome do handoff |
|--------|----------------|
| Reviewer de Regras | `reviewer-v1.md` |
| Dev Agent | `dev-v<N>.md` |
| Pattern Enforcer | `pattern-v<N>.md` |
| QA Unitário | `qa-unit-v<N>.md` |
| QA E2E | `qa-e2e-v<N>.md` |

### Documentação Completa

Ver: `/docs/handoffs/README.md`

- Templates de cada handoff
- Exemplos completos de fluxos
- Comandos de navegação
- Regras de versionamento detalhadas

---

## 🔄 Iterações e Correções

### Quando ocorrem iterações?

**Único gatilho:** Pattern Enforcer retorna **NÃO CONFORME**

### Fluxo de iteração

1. Dev cria `dev-v1.md` + implementa código
2. Pattern valida → `pattern-v1.md` com Status: NÃO CONFORME
3. Dev lê violações em `pattern-v1.md`
4. Dev corrige código + cria `dev-v2.md`
5. Pattern valida novamente → `pattern-v2.md`
   - Se CONFORME → prossegue
   - Se NÃO CONFORME → repete (v3, v4...)

### Quando iteração NÃO acontece?

- QA encontra bug → **não volta ao Dev automaticamente**
  - Bug é documentado
  - Humano decide: corrigir agora ou criar issue
- Reviewer bloqueia regra → **não volta ao Extractor automaticamente**
  - Humano decide: criar regra, aceitar risco, adiar

### Princípio

**Iteração automática apenas em validação de padrões.**

Outras situações exigem decisão humana.

---

## 🚨 Regras Absolutas

- Dev e QA **nunca** atuam na mesma PR
- Nenhum agente assume papel não documentado
- Nenhum teste valida intenção — apenas regra
- Nenhuma exceção sem registro explícito

---

## 🔧 Manutenção da Estrutura e Orientação (Meta-Nível)

Fora do fluxo de desenvolvimento regular, existe o **System Engineer** operando em 3 modos:

### System Engineer (Meta-Agente Multi-Modo)

**Modo 1: Governança**
- Criar/modificar definições de agentes
- Atualizar FLOW.md e DOCUMENTATION_AUTHORITY.md
- Reorganizar estrutura documental normativa
- **Requer aprovação humana explícita**

**Modo 2: Consultivo**
- Esclarecer dúvidas sobre FLOW
- Sugerir qual agente usar (Agent Selection)
- Interpretar documentação normativa
- Pre-flight checks antes de features
- **Apenas orienta, nunca executa**

**Modo 3: Documentação**
- Criar ADRs (decisões arquiteturais + governança)
- Atualizar `/docs/architecture/**`
- Manter diagramas sincronizados
- Documentar decisões aprovadas pós-merge
- **Documenta apenas decisões JÁ aprovadas**

**Ativação:** Explícita ("Atue como System Engineer" + modo desejado)

**Restrições Absolutas:** 
- ❌ Nunca atua em código de produção
- ❌ Nunca define regras de negócio
- ❌ Nunca participa de PRs de features
- ❌ Modo Consultivo nunca executa ações
- ❌ Modo Documentação só documenta o já aprovado

**Documentação completa:** `/.github/agents/0-System_Engineer.md`

---

## 🎯 Conclusão

Este fluxo existe para:

- eliminar improviso
- conter viés de IA
- proteger regras reais
- permitir escala com segurança

Se algo não está neste fluxo, não é permitido.

**Meta-Princípio:**  
O próprio fluxo pode evoluir, mas apenas através do System Engineer,
com justificativa, documentação e aprovação humana explícita.