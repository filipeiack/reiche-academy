# Business Analysis: Visualizar/Ocultar Senha (Login, Usuários, Esqueci/Reset)

**Data:** 2026-01-30  
**Analista:** Business Analyst  
**Regras Documentadas:**
- [docs/business-rules/auth-ui-visualizar-ocultar-senha.md](../../business-rules/auth-ui-visualizar-ocultar-senha.md)

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta
- **Regras documentadas:** 1 arquivo criado
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Propostas
- [docs/business-rules/auth-ui-visualizar-ocultar-senha.md](../../business-rules/auth-ui-visualizar-ocultar-senha.md) - Alternância de visibilidade do campo senha nas telas de login, usuários-form e esqueci/reset.

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Alternância visual entre senha oculta e visível.
- Escopo: login, alteração de senha em usuários-form, esqueci/reset de senha.
- Comportamento não altera valor nem validações.

### ⚠️ O que está ausente/ambíguo
- Padrão visual do controle (ícone/botão específico) e posicionamento.
- Regras para múltiplos campos de senha (ex.: nova senha + confirmação no reset).
- Requisitos de acessibilidade (teclado/aria-label).

### 🔴 Riscos Identificados
- **Segurança:** exposição visual local do segredo; mitigado por ação explícita do usuário.
- **RBAC:** não aplicável.
- **Multi-tenant:** não aplicável.
- **LGPD:** risco baixo; dado sensível exibido somente por ação do usuário.

## 4️⃣ Checklist de Riscos Críticos

- [x] RBAC documentado e aplicado?
- [x] Isolamento multi-tenant garantido?
- [ ] Auditoria de ações sensíveis?
- [x] Validações de input?
- [x] Proteção contra OWASP Top 10?
- [x] Dados sensíveis protegidos?

## 5️⃣ Bloqueadores

**Regras ausentes que IMPEDEM continuidade:**

- Nenhum bloqueador crítico identificado.

## 6️⃣ Recomendações

- Definir padrão visual do controle (ícone e posição) para consistência entre telas.
- Especificar comportamento para campos de confirmação de senha.
- Considerar acessibilidade mínima (foco e aria-label).

## 7️⃣ Decisão e Próximos Passos

**Status:** ⚠️ APROVADO COM RESSALVAS

- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar regras documentadas em `/docs/business-rules`
- [ ] Atenção especial para: padronização visual e comportamento em campos múltiplos

---

**Handoff criado automaticamente pelo Business Analyst**
