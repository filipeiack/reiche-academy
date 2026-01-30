## 📘 FLOW.md — Fluxo Oficial e Normativo do Projeto (v2.0)

---

## 🎯 Objetivo

Este documento define **o único fluxo oficial** de desenvolvimento, validação e entrega de código do projeto.

👉 **Nenhuma ação técnica é válida fora deste fluxo.**  
👉 **Nenhum agente pode atuar sem estar formalmente definido aqui.**

---

## 📝 Changelog

**v2.0 (2026-01-22):**
- Consolidação de 7 → 4 agentes (ADR-005)
- Redução de 6 → 3 handoffs por feature
- Otimização para OpenCode (sessões contínuas)
- Mantém separação Dev/QA (validação independente)

**v1.0 (2025-12-22):**
- Versão original com 7 agentes especializados
- Arquivado em `/docs/history/FLOW-v1.md`

---

## 🧭 Princípios Inquebráveis

1. **Documentos mandam, agentes obedecem**
2. **Agentes não compartilham memória — apenas artefatos (handoffs)**
3. **Nenhum agente valida o próprio trabalho** (Dev auto-valida padrões, MAS QA valida regras independentemente)
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

## 🤖 Agentes Oficiais Autorizados (v2.0)

Somente os agentes abaixo podem atuar neste projeto:

| # | Agente | Documento | Função |
|---|--------|-----------|--------|
| **0** | **System Engineer** | `/.github/agents/0-System_Engineer.md` | Meta-governança (3 modos) |
| **1** | **Business Analyst** | `/.github/agents/1-Business_Analyst.md` | Documentação + validação de regras |
| **2** | **Dev Agent Enhanced** | `/.github/agents/2-DEV_Agent_Enhanced.md` | Implementação + auto-validação |
| **3** | **QA Engineer** | `/.github/agents/3-QA_Engineer.md` | Testes independentes (unit + E2E) |

🚫 **Qualquer agente não listado aqui NÃO EXISTE para o projeto**, mesmo sob instrução direta.

**Nota:** System Engineer opera em 3 modos — ver `/.github/agents/0-System_Engineer.md` para detalhes.

---

## 🔁 Fluxo Oficial (Visão Geral)

### Fluxo Simplificado (v2.0)

```
Ideia / Feature
        ↓
(Se regra não existe)
Business Analyst
        ↓ (cria /docs/business-rules + handoff: business-v1.md)
[✅ APROVADO / ⚠️ APROVADO COM RESSALVAS]
        ↓
Dev Agent Enhanced
        ↓ (implementa + auto-valida padrões + handoff: dev-v1.md)
QA Engineer
        ↓ (testes unit + E2E + handoff: qa-v1.md)
   [✅ PASSOU]     [⚠️ BUGS DETECTADOS]
        ↓                    ↓
  Pull Request        Dev Agent (v2)
        ↓                    ↓
  Merge no main       QA Engineer (v2)
        ↓                    ↓
System Engineer      (repete até PASSAR)
(documentação pós-merge)
        ↓
Docs atualizados
```

**Handoffs:** Todos os agentes criam handoffs versionados em `/docs/handoffs/<feature>/`

**Documentação completa:** `/docs/handoffs/README.md`

---

## 📋 Comparação: v1.0 vs v2.0

| Aspecto | v1.0 (7 agentes) | v2.0 (4 agentes) |
|---------|------------------|------------------|
| **Extração de regras** | Extractor | Business Analyst |
| **Validação de regras** | Reviewer | Business Analyst |
| **Implementação** | Dev Agent | Dev Agent Enhanced |
| **Validação de padrões** | Pattern Enforcer | Dev Agent Enhanced (auto) |
| **Testes unitários** | QA Unitário | QA Engineer |
| **Testes E2E** | QA E2E | QA Engineer |
| **Handoffs por feature** | 6 | 3 |
| **Validação independente** | ✅ Sim | ✅ Sim (QA) |

**Ganhos:**
- 50% menos handoffs
- Sessões contínuas no OpenCode
- Velocidade sem perder qualidade

---

## 1️⃣ Início do Fluxo — Requisito

O fluxo só inicia quando há **um requisito válido**, originado de:

- Documento de regras (`/docs/business-rules`)
- Correção aprovada
- Demanda explícita registrada

📌 **Código sem requisito documentado é inválido.**

### Novas regras de negócio:
→ Devem ser documentadas via **Business Analyst**  
→ Devem ser aprovadas explicitamente por humano (se BLOQUEADO)  
→ Só então podem ser implementadas

---

## 2️⃣ Análise de Negócio — Business Analyst

### Função

Consolidar **extração** e **validação** de regras de negócio:
- Extrair regras do código existente (engenharia reversa)
- Documentar regras propostas pelo usuário
- Validar completude, coerência e riscos
- Identificar lacunas críticas (RBAC, multi-tenant, LGPD)

### Entrada

- Código existente (para extração) OU proposta do usuário (para nova regra)
- Contexto do domínio

### Restrições

- ❌ Não implementa código
- ❌ Não cria testes
- ❌ Não decide sozinho (apenas expõe riscos)

### Saída obrigatória (handoff)

**Cria arquivo:** `/docs/handoffs/<feature>/business-v1.md`

**Estrutura:**
```md
# Business Analysis: <Feature>

## 1️⃣ Resumo da Análise
- Modo: Extração | Proposta | Ambos
- Regras documentadas: X arquivos
- Status: ✅ APROVADO | ⚠️ APROVADO COM RESSALVAS | ❌ BLOQUEADO

## 2️⃣ Regras Documentadas
- [arquivo-regra-1.md] - Descrição

## 3️⃣ Análise de Completude
- ✅ O que está claro
- ⚠️ O que está ausente
- 🔴 Riscos identificados

## 4️⃣ Checklist de Riscos Críticos
- [ ] RBAC documentado?
- [ ] Isolamento multi-tenant?
- [ ] Auditoria?
- [ ] Validações?
- [ ] OWASP Top 10?

## 5️⃣ Bloqueadores
[Lista de regras críticas faltantes que IMPEDEM continuidade]

## 6️⃣ Recomendações
[Sugestões não vinculantes]

## 7️⃣ Decisão e Próximos Passos
- [ ] Prosseguir para: Dev Agent Enhanced
```

### Status e Fluxo

**✅ APROVADO:**
- Prossegue para Dev Agent Enhanced

**⚠️ APROVADO COM RESSALVAS:**
- Prossegue, mas com atenção aos riscos identificados

**❌ BLOQUEADO:**
- **Humano decide:**
  1. Criar regras faltantes (volta ao Business Analyst)
  2. Aceitar risco e documentar (ADR)
  3. Adiar feature

### Ferramentas disponíveis

- `read`, `edit`, `search`, `web`

---

## 3️⃣ Implementação — Dev Agent Enhanced

### Função

Consolidar **implementação** e **auto-validação de padrões**:
- Implementar código seguindo regras documentadas
- Auto-verificar aderência a convenções (checklist)
- Documentar decisões técnicas
- Criar handoff estruturado

### Entrada

- **Lê handoff do Business Analyst:** `/docs/handoffs/<feature>/business-v1.md`
  - **Pré-requisito:** Status = APROVADO ou APROVADO COM RESSALVAS
- Regras em `/docs/business-rules`
- Convenções em `/docs/conventions`
- Arquitetura em `/docs/architecture`

### Restrições

- ❌ Não cria regras
- ❌ Não cria testes finais (apenas testes de suporte/desenvolvimento)
- ❌ Não valida regras de negócio de forma independente (QA faz isso)
- ✅ Auto-valida padrões (checklist objetivo: naming, estrutura)

### Auto-Validação (Integrada)

**Antes de criar handoff, executar checklist:**

**Backend:**
- [ ] Naming conventions (PascalCase, camelCase, kebab-case)
- [ ] Estrutura de pastas correta
- [ ] DTOs com validadores
- [ ] Prisma com `.select()`
- [ ] Guards aplicados
- [ ] Soft delete respeitado
- [ ] Audit logging

**Frontend:**
- [ ] Standalone components
- [ ] `inject()` function (não constructor DI)
- [ ] Control flow moderno (`@if`, `@for`)
- [ ] Translations (`| translate`)
- [ ] ReactiveForms
- [ ] Error handling (SweetAlert2)

**Correções:** Se violações encontradas, corrigir ANTES de handoff.

### Saída obrigatória (handoff)

**Cria arquivo:** `/docs/handoffs/<feature>/dev-v<N>.md`

Onde:
- `N = 1` para nova feature
- `N` incrementa se QA retornar bugs críticos de padrão (raro)

**Estrutura:**
```md
# Dev Handoff: <Feature>

## 1️⃣ Escopo Implementado
[Lista do que foi feito]

## 2️⃣ Arquivos Criados/Alterados
- Backend: `caminho/arquivo.ts`
- Frontend: `caminho/component.ts`

## 3️⃣ Decisões Técnicas
[Escolhas de implementação]

## 4️⃣ Auto-Validação de Padrões
**Checklist executado:**
- [x] Naming conventions
- [x] Estrutura de pastas
- [x] DTOs validados
- [x] Prisma com .select()

**Violações corrigidas:**
- [Lista ou "nenhuma"]

## 5️⃣ Ambiguidades e TODOs
[Pontos que precisam clarificação]

## 6️⃣ Testes de Suporte
[Testes básicos criados para desenvolvimento]

## 7️⃣ Aderência a Regras
- [RN-001] Implementada em `arquivo.ts:linha`

## 8️⃣ Status para Próximo Agente
- ✅ Pronto para: QA Engineer
```

### Ferramentas disponíveis

- `read`, `edit`, `search`, `web`, `bash`, `glob`, `grep`

---

## 4️⃣ Testes e Validação — QA Engineer

### Função

Consolidar **testes unitários** e **testes E2E** com **validação independente**:
- Criar testes baseados em REGRAS (não em código)
- Pensar adversarialmente (como atacante)
- Detectar bugs e violações de regras
- Executar testes iterativamente até passarem
- Corrigir TESTES (nunca código de produção)

### Entrada

- **Lê handoff do Dev:** `/docs/handoffs/<feature>/dev-v<N>.md`
- **Lê regras:** `/docs/business-rules/*.md`
- Código de produção (para criar testes contra)

### Restrições

- ❌ **Não altera código de produção** (Services, Controllers, Components)
- ❌ Não confia em testes do Dev
- ❌ Não testa comportamento não documentado
- ✅ Pode executar e corrigir próprios testes iterativamente

### Princípios de Teste

**1. Testar REGRAS, não implementação:**
```typescript
// ❌ ERRADO
it('should call prisma.create', async () => { ... });

// ✅ CORRETO
it('RN-023: GESTOR cannot create ADMINISTRADOR', async () => {
  await expect(service.create(adminDto, gestorUser))
    .rejects.toThrow(ForbiddenException);
});
```

**2. Adversarial Thinking:**
- Pensar: "Como atacante burlaria essa regra?"
- Testar edge cases que Dev não pensou
- Validar segurança (RBAC, multi-tenant, OWASP)

**3. Testes independentes:**
- Criar do zero baseado em regras
- Não ler testes do Dev
- Mockar todas dependências externas

### Execução de Testes

**Backend (NestJS + Jest):**
```bash
# ❌ NÃO usar runTests (problema de rootDir)
# ✅ SEMPRE usar bash:
cd backend && npm test
```

**Frontend E2E (Playwright):**
```bash
cd frontend && npm run test:e2e
cd frontend && npm run test:e2e:ui  # Debug visual
```

**Ciclo iterativo:**
1. Criar testes baseados em regras
2. Executar testes
3. Analisar falhas:
   - ✅ Falha esperada (bug real) → Reportar
   - ⚠️ Erro de execução (mock, seletor) → Corrigir teste
4. Corrigir APENAS testes
5. Re-executar até todos rodarem
6. Validar cobertura de regras

### Saída obrigatória (handoff)

**Cria arquivo:** `/docs/handoffs/<feature>/qa-v<N>.md`

Onde:
- `N` = mesma versão do dev-vN

**Estrutura:**
```md
# QA Handoff: <Feature>

## 1️⃣ Resumo da Validação
- Tipo: Unitários + E2E
- Testes criados: X unit, Y E2E
- Status: ✅ TODOS PASSANDO | ⚠️ FALHAS DETECTADAS | ❌ BLOQUEADORES

## 2️⃣ Testes Unitários Criados
- `usuarios.service.spec.ts` - X testes
  - RN-001: Descrição
  - RN-023: Descrição

## 3️⃣ Testes E2E Criados
- `usuarios.spec.ts` - Y cenários

## 4️⃣ Cobertura de Regras
- [x] RN-001: Testada
- [x] RN-023: Testada

## 5️⃣ Bugs/Falhas Detectados
**Bugs Reais:**
- [ALTA] RN-023 violada: GESTOR consegue criar ADMINISTRADOR

**Se lista vazia:** Nenhum bug ✅

## 6️⃣ Edge Cases Testados
- [ ] Elevação de privilégio
- [ ] Vazamento multi-tenant
- [ ] Soft delete
- [ ] Input malicioso

## 7️⃣ Qualidade Estendida
[Performance, Acessibilidade, SEO - se solicitado]

## 8️⃣ Problemas de Execução Corrigidos
[Testes corrigidos durante iteração]

## 9️⃣ Recomendações
[Melhorias sugeridas]

## 🔟 Status Final
- [ ] ✅ Pronto para PR (todos testes passando)
- [ ] ⚠️ Bugs detectados (decisão humana)
- [ ] ❌ Bloqueadores críticos (volta ao Dev)
```

### Status e Fluxo

**✅ TODOS PASSANDO:**
- Código pronto para Pull Request

**⚠️ FALHAS DETECTADAS:**
- Bugs documentados
- **Humano decide:**
  1. Dev corrige bugs (volta ao Dev Agent)
  2. Cria issues para depois
  3. Aceita risco e documenta (ADR)

**❌ BLOQUEADORES:**
- Falhas críticas de segurança/negócio
- **NÃO pode mergear**
- Retornar ao Dev Agent obrigatoriamente

### Ferramentas disponíveis

- `read`, `edit`, `search`, `bash`, `glob`, `grep`

---

## 5️⃣ Pull Request (PR)

O PR é o **checkpoint humano final**.

Deve conter:
- Código implementado
- Testes (unitários + E2E)
- **3 Handoffs:**
  1. `business-v1.md` (Business Analyst)
  2. `dev-v1.md` (Dev Agent Enhanced)
  3. `qa-v1.md` (QA Engineer)
- Referência ao requisito

---

## 6️⃣ Merge no `main`

O merge só é permitido se:

- Business Analyst: **APROVADO** ou **APROVADO COM RESSALVAS**
- Dev Agent Enhanced: **Auto-validação CONFORME**
- QA Engineer: **TODOS TESTES PASSANDO**
- Nenhum agente violou escopo

Após o merge:
- O código vira fonte de verdade
- System Engineer pode ser acionado para documentação pós-merge (ADRs, arquitetura)

---

## 7️⃣ System Engineer (Pós-Merge - Opcional)

### Quando acionar

- Mudanças arquiteturais significativas
- Novas integrações ou dependências
- Decisões técnicas que impactam o sistema
- Sob instrução explícita

### Função

**Modo Documentação:**
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

## 📋 Sistema de Handoffs (v2.0)

### Propósito

Handoffs são **contratos persistentes e versionáveis** entre agentes.

### Estrutura

```
/docs/handoffs/<feature>/<agent>-v<N>.md
```

**Exemplos (v2.0):**
```
/docs/handoffs/autenticacao-login/business-v1.md
/docs/handoffs/autenticacao-login/dev-v1.md
/docs/handoffs/autenticacao-login/qa-v1.md
```

**Com iteração:**
```
/docs/handoffs/empresa-crud/business-v1.md
/docs/handoffs/empresa-crud/dev-v1.md
/docs/handoffs/empresa-crud/qa-v1.md       ← bugs detectados
/docs/handoffs/empresa-crud/dev-v2.md       ← correções
/docs/handoffs/empresa-crud/qa-v2.md        ← reteste (passou)
```

### Versionamento

**Regra:** Versão incrementa quando **QA retorna bugs críticos que exigem reimplementação**.

**Fluxo normal (sem iteração):**
```
Business Analyst → business-v1.md
    ↓
Dev Agent Enhanced → dev-v1.md
    ↓
QA Engineer → qa-v1.md (✅ PASSOU)
    ↓
PR → Merge
```

**Com iteração (bugs detectados):**
```
Business Analyst → business-v1.md
    ↓
Dev Agent Enhanced → dev-v1.md
    ↓
QA Engineer → qa-v1.md (⚠️ BUGS DETECTADOS)
    ↓
[Humano decide: corrigir agora]
    ↓
Dev Agent Enhanced → dev-v2.md (correções)
    ↓
QA Engineer → qa-v2.md (✅ PASSOU)
    ↓
PR → Merge
```

### Agentes e Nomes de Handoffs (v2.0)

| Agente | Nome do handoff |
|--------|----------------|
| Business Analyst | `business-v1.md` |
| Dev Agent Enhanced | `dev-v<N>.md` |
| QA Engineer | `qa-v<N>.md` |

### Documentação Completa

Ver: `/docs/handoffs/README.md`

---

## 🔄 Iterações e Correções

### Quando ocorrem iterações?

**Cenário 1: QA detecta bugs**
- QA retorna com lista de bugs em `qa-v1.md`
- **Humano decide:** corrigir agora ou criar issue
- Se corrigir: Dev cria `dev-v2.md` → QA cria `qa-v2.md`

**Cenário 2: Business Analyst bloqueia**
- Business Analyst retorna ❌ BLOQUEADO
- **Humano decide:** criar regra, aceitar risco, ou adiar
- Se criar regra: Business Analyst cria nova versão

### Quando iteração NÃO acontece?

- Auto-validação de padrões (Dev corrige ANTES de handoff)
- Recomendações de melhoria (não bloqueantes)

### Princípio

**Iterações acontecem quando validação independente detecta problemas reais.**

---

## 🚨 Regras Absolutas

- Dev e QA **nunca atuam sem handoff formal**
- Nenhum agente assume papel não documentado
- Nenhum teste valida intenção — apenas regra
- Nenhuma exceção sem registro explícito
- **Dev auto-valida padrões, MAS QA valida regras de forma independente**

---

## 🔧 Manutenção da Estrutura (Meta-Nível)

Fora do fluxo de desenvolvimento, existe o **System Engineer** operando em 3 modos:

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

- Eliminar improviso
- Conter viés de IA
- Proteger regras reais
- Permitir escala com segurança
- **Otimizar velocidade sem perder qualidade** (v2.0)

Se algo não está neste fluxo, não é permitido.

**Meta-Princípio:**  
O próprio fluxo pode evoluir, mas apenas através do System Engineer,
com justificativa, documentação e aprovação humana explícita.

---

**Versão:** 2.0  
**Criado em:** 2025-12-22  
**Última atualização:** 2026-01-22  
**Changelog:** Consolidação 7 → 4 agentes (ADR-005)
