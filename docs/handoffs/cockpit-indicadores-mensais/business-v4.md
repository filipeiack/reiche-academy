# Business Analysis: Data Referencia Unica em IndicadorMensal

**Data:** 2026-02-06  
**Analista:** Business Analyst  
**Regras Documentadas:** [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md), [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md)

---

## 1️⃣ Resumo da Analise

- **Modo:** Proposta (com ajustes em regra extraida)
- **Regras documentadas:** 2 arquivos atualizados
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Propostas
- [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md) - Criacao de `IndicadorMensal` exclusiva via botao com **dataReferencia** unica, persistida no `CockpitPilar`, com salvamento mesmo sem indicadores e heranca para novos indicadores.
- [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md) - Criacao condicional de meses na criacao de indicador apenas quando existir `dataReferencia`.

## 3️⃣ Analise de Completude

### ✅ O que esta claro
- Criacao de cockpit e indicadores nao deve mais gerar meses automaticamente.
- Botao "Novo ciclo de 12 meses" passa a receber dataReferencia unica e grava no `CockpitPilar`.
- A referencia pode ser salva mesmo sem indicadores ativos; indicadores criados depois herdam os 12 meses.
- Sem meses, a tela exibe apenas o header com o botao e o campo de referencia.

### ⚠️ O que esta ausente/ambiguo
- Mensagem/erro padrao quando `updateValoresMensais` recebe mes inexistente.
- Comportamento quando o usuario tenta atualizar valores antes de existir meses.

### 🔴 Riscos Identificados
- **RBAC:** novo endpoint do botao deve manter `validateCockpitAccess`.
- **Multi-tenant:** gravacao da referencia deve usar `empresaId` do cockpit.
- **LGPD:** sem dados pessoais novos, mas auditoria deve cobrir criacao em lote.

## 4️⃣ Checklist de Riscos Criticos

- [ ] RBAC documentado e aplicado?
- [x] Isolamento multi-tenant garantido?
- [ ] Auditoria de acoes sensiveis?
- [ ] Validacoes de input?
- [ ] Protecao contra OWASP Top 10?
- [x] Dados sensiveis protegidos?

## 5️⃣ Bloqueadores

- Nenhum bloqueador critico identificado.

### 6️⃣ Recomendacoes

- Definir erro padrao para tentativa de atualizar mes inexistente (ex: `BadRequestException` com mensagem amigavel).
- Garantir auditoria explicita para criacao em lote no endpoint do botao.

## 7️⃣ Decisao e Proximos Passos

- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar a regra proposta em `cockpit-indicadores-mensais.md`
- [ ] Atencao especial para: persistencia da referencia unica e desativacao do botao apos definicao

---

**Handoff criado automaticamente pelo Business Analyst**
