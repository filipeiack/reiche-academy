# Business Analysis: Referencia de Mes/Ano em IndicadorMensal

**Data:** 2026-02-06  
**Analista:** Business Analyst  
**Regras Documentadas:** [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md), [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md)

---

## 1️⃣ Resumo da Analise

- **Modo:** Proposta (com ajustes pontuais em regra extraida)
- **Regras documentadas:** 2 arquivos atualizados
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Propostas
- [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md) - Criacao de `IndicadorMensal` exclusiva via botao com mes/ano de referencia, persistencia da referencia no `CockpitPilar`, exibicao da tela antes de meses e heranca para novos indicadores.
- [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md) - Ajuste para criacao condicional de meses apenas quando houver referencia definida.

## 3️⃣ Analise de Completude

### ✅ O que esta claro
- Criacao de cockpit e indicadores nao deve mais gerar meses automaticamente.
- Botao "Novo ciclo de 12 meses" passa a receber mes/ano e grava referencia no `CockpitPilar`.
- Apos referencia definida, o botao fica indisponivel e novos indicadores herdam os 12 meses baseados na referencia.
- Sem meses, a tela exibe apenas o header com o botao e o campo de referencia.

### ⚠️ O que esta ausente/ambiguo
- Formato exato da referencia persistida (campos `mes/ano` separados ou `dataReferencia` unica).
- Mensagem/erro padrao quando `updateValoresMensais` recebe mes inexistente.
- Comportamento quando nao ha indicadores ativos no cockpit no momento do clique (bloqueia ou permite salvar referencia sem criar meses).

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

## 6️⃣ Recomendacoes

- Definir campos de referencia no `CockpitPilar` (ex: `mesReferencia`, `anoReferencia` ou `dataReferencia`) e padronizar serializacao no frontend.
- Definir erro padrao para tentativa de atualizar mes inexistente (ex: `BadRequestException` com mensagem amigavel).
- Decidir comportamento quando o cockpit nao tem indicadores ativos no momento da definicao da referencia.

## 7️⃣ Decisao e Proximos Passos

- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar a regra proposta em `cockpit-indicadores-mensais.md`
- [ ] Atencao especial para: persistencia da referencia e desativacao do botao apos definicao

---

**Handoff criado automaticamente pelo Business Analyst**
