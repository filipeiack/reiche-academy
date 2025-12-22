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
| **System Engineer** | `/.github/agents/0-System_Engineer.md` | Meta (governança) |
| Extractor de Regras | `/.github/agents/1-Extractor_Regras.md` | Fluxo |
| Reviewer de Regras | `/.github/agents/2-Reviewer_Regras.md` | Fluxo |
| Dev Agent Disciplinado | `/.github/agents/3-DEV_Agent.md` | Fluxo |
| Pattern Enforcer | `/.github/agents/4-Pattern_Enforcer.md` | Fluxo |
| QA Unitário Estrito | `/.github/agents/5-QA_Unitário_Estrito.md` | Fluxo |
| E2E Agent | `/.github/agents/6-QA_E2E_Interface.md` | Fluxo |
| Tech Writer (Opcional) | `/.github/agents/7-Tech_Writer.md` | Pós-merge |
| Advisor (Consultivo) | `/.github/agents/Advisor.md` | Consultivo |

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
        ↓
Tech Writer (opcional / mudanças arquiteturais)
        ↓
Documentação atualizada

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
- Documentação normativa
- Arquitetura e convenções

### Restrições
- ❌ Não cria regras
- ❌ Não cria testes finais
- ❌ Não valida o próprio código

### Saída obrigatória (handoff)

Template do handoff: /docs/conventions/handoff-template.md
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

## 🚨 Regras Absolutas

- Dev e QA **nunca** atuam na mesma PR
- Nenhum agente assume papel não documentado
- Nenhum teste valida intenção — apenas regra
- Nenhuma exceção sem registro explícito

---

## 🔧 Manutenção da Estrutura (Meta-Nível)

Fora do fluxo de desenvolvimento regular, existe o **System Engineer**:

### System Engineer (Meta-Agente)

**Função:** Manter e evoluir a estrutura de governança do projeto

**Escopo:**
- Criar/modificar definições de agentes
- Atualizar FLOW.md
- Manter DOCUMENTATION_AUTHORITY.md
- Reorganizar estrutura documental normativa

**Ativação:** Explícita apenas ("Atue como System Engineer")

**Restrição Absoluta:** 
- ❌ Nunca atua em código de produção
- ❌ Nunca define regras de negócio
- ❌ Nunca participa de PRs de features
- ✅ Sempre requer aprovação humana

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