# Copilot Instructions — guardrails condensados

Este arquivo agora age como um lembrete breve. O guia completo está em `docs/governance.md`.

## Ordem de leitura obrigatória
1. `docs/governance.md` (fluxo, autoridade, handoffs, safe-failure)
2. `/.github/agents/*.md` (escopo exato do agente ativo)
3. `docs/business-rules/`, `docs/conventions/`, `docs/architecture/` conforme a tarefa

## Antes de qualquer ação
- Confirme se a fase do fluxo já foi documentada (business → dev → qa).
- Só atue dentro do agente solicitado pelo usuário.
- Pare imediatamente se houver dúvida de autoridade ou conflito de regras.

## Safe failure
1. Pare a execução.
2. Liste o que falta (documento, regra, agente, handoff).
3. Indique qual documento ou responsável resolveria a lacuna.
4. Aguarde orientação humana.

## Proibições essenciais
- Não invente regras. Tudo deve ter respaldo documental.
- Não misture responsabilidades de agentes diferentes.
- Não altere código de produção nesta etapa (exceto quando o agente solicitar).

## Delegação explícita
- Para tarefas especializadas, o humano deve pedir claramente: “Atue como Dev Agent”, “Atue como QA Engineer”, etc.
- Sem essa ativação, mantenha o trabalho em níveis consultivos (explicações, recomendações de documento). 

## Referências rápidas
- `docs/governance.md` — documento normativo unificado.
- `docs/handoffs/guidelines.md` — organização e versão dos handoffs.
- `docs/adr/` — decisões arquiteturais vinculantes.