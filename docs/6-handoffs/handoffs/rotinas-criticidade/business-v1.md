# Business Analysis: Criticidade em Rotinas (Template + Snapshot)

**Data:** 2026-02-03  
**Analista:** Business Analyst  
**Regras Documentadas:**
- /docs/business-rules/rotinas-criticidade-template-snapshot.md

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta
- **Regras documentadas:** 1 arquivo criado
- **Status:** ✅ APROVADO

## 2️⃣ Regras Documentadas

### Regras Propostas
- [rotinas-criticidade-template-snapshot.md] - Criticidade opcional no template e cópia para snapshot em RotinaEmpresa.

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Campo `criticidade` deve existir em `Rotina` (template) como **opcional**.
- Campo `criticidade` deve existir em `RotinaEmpresa` como **opcional**.
- Na criação da `RotinaEmpresa` a partir do template, o valor deve ser **copiado**.
- Manter o snapshot pattern (sem propagação de mudanças futuras do template).
- `RotinaEmpresa.criticidade` é **editável** após criação.
- Rotinas customizadas permitem `criticidade` no input.
- Campo deve estar **disponível no frontend** (exibição e edição).
- Sem impacto em ordenação, filtros ou validações adicionais.

### ⚠️ O que está ausente/ambíguo
- Nenhuma lacuna relevante identificada.

### 🔴 Riscos Identificados
- **RBAC:** Nenhum risco novo identificado (herda regras existentes de rotinas e rotinas-empresa).
- **Multi-tenant:** Deve manter validações atuais de `empresaId` em rotinas-empresa.
- **LGPD:** Sem dados sensíveis novos.
- **Segurança (OWASP):** Validação de enum deve evitar dados inválidos.

## 4️⃣ Checklist de Riscos Críticos

- [x] RBAC documentado e aplicado?
- [x] Isolamento multi-tenant garantido?
- [x] Auditoria de ações sensíveis?
- [x] Validações de input?
- [x] Proteção contra OWASP Top 10?
- [x] Dados sensíveis protegidos?

## 5️⃣ Bloqueadores

**Regras ausentes que IMPEDEM continuidade:**
- Nenhum bloqueador crítico identificado.

## 6️⃣ Recomendações

- Nenhuma recomendação adicional.

## 7️⃣ Decisão e Próximos Passos

**Status atual: ⚠️ APROVADO COM RESSALVAS**
- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar regras documentadas em `/docs/business-rules/rotinas-criticidade-template-snapshot.md`
**Status atual: ✅ APROVADO**
- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar regras documentadas em `/docs/business-rules/rotinas-criticidade-template-snapshot.md`

---

**Handoff criado automaticamente pelo Business Analyst**
