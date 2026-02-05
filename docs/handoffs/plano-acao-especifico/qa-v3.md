# QA Handoff: Plano de Ação Específico (Smoke)

**Data:** 2026-02-03  
**QA Engineer:** QA Engineer  
**Dev Handoff:** [docs/handoffs/plano-acao-especifico/dev-v3.md](docs/handoffs/plano-acao-especifico/dev-v3.md)  
**Regras Base:** [docs/business-rules/cockpit-plano-acao-especifico.md](docs/business-rules/cockpit-plano-acao-especifico.md)

---

## 1️⃣ Resumo da Validação

- **Tipo de testes:** E2E Smoke (Playwright)
- **Testes atualizados:** 1 (aba de plano de ação no cockpit)
- **Status de execução:** ⚠️ NÃO EXECUTADO (não solicitado)
- **Regras validadas:** Cobertura parcial via smoke de UI

## 2️⃣ Testes Smoke Atualizados

- [frontend/e2e/cockpit-pilares/cockpit-dashboard.smoke.spec.ts](frontend/e2e/cockpit-pilares/cockpit-dashboard.smoke.spec.ts)
  - Acesso à aba de plano de ação
  - Presença de botão “Adicionar Ação” e listagem (vazia ou tabela)

**Execução:**
```bash
cd frontend && npm run test:e2e
```

**Resultado:** ⚠️ NÃO EXECUTADO

## 3️⃣ Cobertura de Regras

- [ ] RN: Não permitir término real antes de início real — **NÃO TESTADA** (necessita cenário com ação existente)
- [ ] RN: Sumário + listagem do plano de ação — smoke ajustado, execução pendente

## 4️⃣ Bugs/Falhas Detectados

- Nenhum (testes não executados)

## 5️⃣ Recomendações

- Criar teste dedicado para regra de término real após início real.
- Executar smoke suite do frontend para validar regressões.

---

**Handoff criado automaticamente pelo QA Engineer**
