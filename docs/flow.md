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

| Agente | Documento |
|------|---------|
| Extractor de Regras | `/.github/agents/1-Extractor_Regras.md` |
| Reviewer de Regras | `/.github/agents/2-Reviewer_Regras.md` |
| Dev Agent Disciplinado | `/.github/agents/3-DEV_Agent.md` |
| Pattern Enforcer | `/.github/agents/4-Pattern_Enforcer.md` |
| QA Unitário Estrito | `/.github/agents/5-QA_Unitário_Estrito.md` |
| E2E Agent | `/.github/agents/QA_E2E_Interface.md` |

🚫 **Qualquer agente não listado aqui NÃO EXISTE para o projeto**, mesmo sob instrução direta.

---

## 🔁 Fluxo Oficial (Visão Geral)

Ideia / Feature
        ↓
(Se regra não existe)
Business Rules Extractor / Definição
        ↓
Business Rules Reviewer
        ↓
Docs /business-rules (contrato)
        ↓
Dev Agent Disciplinado
        ↓ (código + relatório)
Pattern Enforcer (frontend/backend)
        ↓ (CONFORME)
QA Unitário Estrito
        ↓ (testes)
E2E (opcional / crítico)
        ↓
Pull Request
        ↓
Merge no main

---

## 1️⃣ Início do Fluxo — Requisito

O fluxo só inicia quando há **um requisito válido**, originado de:

- Documento de regras (`/docs/business-rules`)
- Correção aprovada
- Demanda explícita registrada

📌 **Código sem requisito documentado é inválido.**

---

## 2️⃣ Implementação — Dev Agent Disciplinado

### Entradas
- Requisito válido
- Documentação normativa
- Arquitetura e convenções

### Restrições
- ❌ Não cria regras
- ❌ Não cria testes finais
- ❌ Não valida o próprio código

### Saída obrigatória (handoff)

```md
### DEV HANDOFF

Escopo implementado:
- ...

Arquivos alterados:
- ...

Ambiguidades encontradas:
- ...

Próximo agente obrigatório:
- Pattern Enforcer
```

Sem esse handoff, o fluxo **para**.

---

## 3️⃣ Validação de Padrões — Pattern Enforcer

### Função
- Garantir aderência estrita a padrões
- Bloquear drift arquitetural

### Saída obrigatória

```md
### PATTERN ENFORCEMENT REPORT

Status: CONFORME | NÃO CONFORME
Violações encontradas:
- ...
```

🚫 **NÃO CONFORME bloqueia o fluxo.**

---

## 4️⃣ Testes Unitários — QA Unitário Estrito

### Função
- Criar testes independentes
- Proteger regras documentadas
- Detectar falhas de segurança e negócio

### Restrições
- ❌ Não altera código de produção
- ❌ Não confia em testes existentes
- ❌ Não testa comportamento não documentado

### Saída
- Testes executáveis
- Lista de regras protegidas
- Lacunas identificadas

---

## 5️⃣ Validação de Regras — Reviewer de Regras (Condicional)

### Quando acionar
- Segurança
- RBAC
- Multi-tenant
- Compliance

### Função
- Comparar código × regras documentadas
- Emitir parecer técnico
- Nunca implementar

---

## 6️⃣ Pull Request (PR)

O PR é o **checkpoint humano final**.

Deve conter:
- Código
- Testes
- Relatórios dos agentes
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

---

## 🚨 Regras Absolutas

- Dev e QA **nunca** atuam na mesma PR
- Nenhum agente assume papel não documentado
- Nenhum teste valida intenção — apenas regra
- Nenhuma exceção sem registro explícito

---

## 🎯 Conclusão

Este fluxo existe para:

- eliminar improviso
- conter viés de IA
- proteger regras reais
- permitir escala com segurança

Se algo não está neste fluxo, não é permitido.