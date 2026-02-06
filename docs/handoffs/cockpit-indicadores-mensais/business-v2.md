# Business Analysis: Criacao Exclusiva de IndicadorMensal

**Data:** 2026-02-05  
**Analista:** Business Analyst  
**Regras Documentadas:** [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md), [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md)

---

## 1️⃣ Resumo da Analise

- **Modo:** Ambos (extracao + proposta)
- **Regras documentadas:** 2 arquivos atualizados
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Extraidas
- [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md) - Atualiza o comportamento atual de `createIndicador` (12 meses consecutivos a partir do mes atual, sem resumo anual).

### Regras Propostas
- [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md) - Cria IndicadorMensal apenas pelo botao "Novo ciclo de 12 meses" e elimina auto-criacao em outros fluxos.

## 3️⃣ Analise de Completude

### ✅ O que esta claro
- A criacao de periodo de mentoria nao dispara IndicadorMensal (o service possui nota explicita e nao cria meses).
- Hoje, o backend cria IndicadorMensal em tres pontos: `createCockpit` (quando copia templates), `createIndicador` e `updateValoresMensais`.
- A nova regra proposta elimina qualquer auto-criacao e concentra tudo no botao "Novo ciclo de 12 meses".

### ⚠️ O que esta ausente/ambiguo
- Comportamento exato quando `updateValoresMensais` recebe mes inexistente (tipo de erro e mensagem).
- Se o primeiro ciclo deve exigir mentoria ativa ou se o botao deve funcionar mesmo sem mentoria.

### 🔴 Riscos Identificados
- **RBAC:** o novo endpoint do botao precisa manter `validateCockpitAccess` para evitar escrita fora da empresa.
- **Multi-tenant:** consulta de mentoria ativa deve usar `empresaId` do cockpit.
- **LGPD:** sem dados pessoais novos, mas auditoria deve cobrir criacao em lote de meses.

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

- Definir erro padrao para tentativa de atualizar mes inexistente (ex: `BadRequestException` com texto amigavel).
- Confirmar se o botao exige mentoria ativa para o primeiro ciclo.
- Garantir auditoria explicita para criacao em lote no endpoint do botao.

## 7️⃣ Decisao e Proximos Passos

- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar a regra proposta em `cockpit-indicadores-mensais.md`
- [ ] Atencao especial para: remocao de auto-criacao em `createCockpit`, `createIndicador` e `updateValoresMensais`

---

**Handoff criado automaticamente pelo Business Analyst**
