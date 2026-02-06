# ADR-014: Governança consolidada para fluxo e autoridade

## Status
Proposta

## Contexto
O fluxo oficial (`docs/FLOW.md`) e o mapa de autoridade documental (`docs/DOCUMENTATION_AUTHORITY.md`) eram mantidos em arquivos separados e detalhavam muitos conceitos em duplicidade. Esse modelo tem exigido que agentes leiam múltiplos documentos longos antes de agir (mais tokens e mais tempo). O pedido do usuário foi unificar essa base normativa para agilizar a leitura e reduzir redundância.

## Decisão
Consolidar o fluxo, a hierarquia normativa, os agentes autorizados, os handoffs e a regra de safe failure em um único guia (novo `docs/governance.md`). Redirecionar os arquivos anteriores para apontarem ao novo documento e compactar os guardrails de `.github/copilot-instructions.md`. Atualizar os índices de business rules, conventions, architecture e handoffs para refletir a nova organização, mantendo o conteúdo técnico em seus arquivos específicos.

## Consequências
- Um único documento central contém todas as instruções obrigatórias, facilitando a leitura inicial.
- Documentos legados (`FLOW.md`, `DOCUMENTATION_AUTHORITY.md`) funcionam como ponteiros para o novo guia.
- O `.github/copilot-instructions.md` fica menor e referencia diretamente o novo guia.
- Os agentes terão índices de regras e convenções mais enxutos e um guia oficial de como organizar handoffs.

## Alternativas consideradas
1. Manter os dois documentos separados e apenas adicionar resumos no topo — rejeitado por não reduzir suficiente a leitura.
2. Criar um índice referenciando seções em ambos os documentos — rejeitado porque ainda exigiria leitura de arquivos separados.

## Impacto nos agentes existentes
- System Engineer: altera o material de governança e lidera a atualização dos handoffs e do guia consolidado.
- Business Analyst / Dev Agent Enhanced / QA Engineer: agora consultam `docs/governance.md` antes de agir. Os handoffs continuam existindo, porém guiados por `docs/handoffs/guidelines.md`.

## Migração
1. Criar `docs/governance.md` com o conteúdo consolidado.
2. Atualizar os arquivos antigos para direcionar ao novo guia.
3. Revisar os índices de business rules, conventions, architecture e handoffs.
4. Comunicar a mudança e garantir que os agentes leiam o novo guia nas primeiras ações pós-merge.

## Riscos de governança
- Leitura única pode ocultar detalhes se o documento ficar saturado; mitigado com seções claras e links para guias específicos.
- Qualquer mudança no guia exigirá atualização imediata de referências e possivelmente um novo ADR se mudar o fluxo.