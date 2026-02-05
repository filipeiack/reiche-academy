# QA Handoff: Cockpit Pilares (Smoke Tests)

**Data:** 2026-02-03  
**QA Engineer:** QA Engineer  
**Dev Handoff:** [docs/handoffs/cockpit-pilares/dev-v5-implementacao-historico.md](docs/handoffs/cockpit-pilares/dev-v5-implementacao-historico.md)  
**Regras Base:** [docs/business-rules/cockpit-gestao-indicadores.md](docs/business-rules/cockpit-gestao-indicadores.md), [docs/business-rules/cockpit-valores-mensais.md](docs/business-rules/cockpit-valores-mensais.md), [docs/business-rules/cockpit-plano-acao-especifico.md](docs/business-rules/cockpit-plano-acao-especifico.md)

---

## 1️⃣ Resumo da Validação

- **Tipo de testes:** E2E Smoke (Playwright)
- **Testes atualizados:** 3 arquivos
- **Status de execução:** ⚠️ NÃO EXECUTADO (não solicitado)
- **Regras validadas:** Cobertura parcial via ajustes de smoke (não executado)

## 2️⃣ Testes Smoke Atualizados

- [frontend/e2e/cockpit-pilares/cockpit-dashboard.smoke.spec.ts](frontend/e2e/cockpit-pilares/cockpit-dashboard.smoke.spec.ts)
  - Tabs atualizados (objetivos, indicadores, gráficos, processos, cargos/funções, plano de ação)
  - Validação de campos de objetivos
  - Verificação de acesso à aba de plano de ação
- [frontend/e2e/cockpit-pilares/grafico-indicadores.smoke.spec.ts](frontend/e2e/cockpit-pilares/grafico-indicadores.smoke.spec.ts)
  - Navegação ajustada para aba de gráficos
- [frontend/e2e/cockpit-pilares/valores-mensais.smoke.spec.ts](frontend/e2e/cockpit-pilares/valores-mensais.smoke.spec.ts)
  - Inclusão do campo histórico

**Execução:**
```bash
cd frontend && npm run test:e2e
```

**Resultado:** ⚠️ NÃO EXECUTADO

## 3️⃣ Cobertura de Regras

- [ ] Cockpit (tabs + objetivos) — Smoke ajustado, execução pendente
- [ ] Plano de ação específico — Smoke de acesso à aba, execução pendente
- [ ] Valores mensais (histórico/meta/realizado) — Smoke ajustado, execução pendente

## 4️⃣ Bugs/Falhas Detectados

- Nenhum (testes não executados)

## 5️⃣ Edge Cases Testados (Adversarial Thinking)

- Não executado

## 6️⃣ Recomendações

- Executar smoke suite do frontend para confirmar os ajustes.
- Cobrir regra de “término real apenas após início real” com teste dedicado.

---

**Handoff criado automaticamente pelo QA Engineer**
