# ADR-012: Exceção Controlada para QA adicionar data-testid

## Status
Aceita (aprovada pelo humano em 2026-01-29)

## Contexto
O QA Engineer precisa estabilizar seletores E2E sem alterar comportamento. Atualmente o escopo do agente proíbe qualquer mudança em templates de produção, mesmo quando a alteração é apenas adicionar ou ajustar `data-testid`.

## Decisão
Permitir que o QA Engineer **adicione/ajuste/remova apenas atributos `data-testid`** em templates HTML/Angular, exclusivamente para estabilização de testes, sem mudanças funcionais.

## Consequências
- Positivas:
  - Reduz flakiness e acoplamento a seletores frágeis.
  - Melhora rastreabilidade de seletores E2E.
- Negativas:
  - Aumenta a superfície de alteração permitida ao QA, exigindo disciplina.
- Neutras:
  - Não altera lógica nem comportamento do sistema.

## Alternativas Consideradas
- Manter proibição total: rejeitada por manter instabilidade e custo alto de manutenção.
- Delegar sempre ao Dev: rejeitada por aumentar latência operacional.

## Impacto em Agentes Existentes
- **QA Engineer:** ganha exceção limitada para `data-testid`.
- **Dev Agent Enhanced:** inalterado.
- **Business Analyst/System Engineer:** inalterados.

## Migração/Transição
Nenhuma. Mudança efetiva após atualização da definição do agente.

## Riscos de Governança
- Risco de uso indevido para alterar comportamento. Mitigação: regra explícita de “sem alterações funcionais”.
