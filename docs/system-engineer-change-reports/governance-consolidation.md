### System Engineering Change Report

#### Motivação
Reduzir a leitura redundante exigida pelos agentes reorganizando o fluxo e o mapa de autoridade em um único guia e limpando os índices de regras, convenções e handoffs para acelerar as ordens e o consumo de tokens.

#### Mudanças Realizadas
- docs/governance.md: novo guia consolidado contendo fluxo, autoridade, agentes, safe failure e referências a handoffs.
- docs/flow.md, docs/DOCUMENTATION_AUTHORITY.md: passaram a apontar para o novo guia.
- .github/copilot-instructions.md: instruções compactas que referenciam o guia de governança e preservam as regras básicas de falha segura.
- docs/business-rules/README.md, docs/conventions/README.md, docs/architecture/architecture.md, docs/handoffs/README.md: índices enxutos que destacam domínios principais e remetem às páginas técnicas.
- docs/handoffs/guidelines.md: novo guia operando por feature, mantendo metadata e archive.
- docs/adr/ADR-014-governance-consolidation.md: registro da decisão.
- docs/system-engineer-change-reports/governance-consolidation.md: este relatório.

#### Impacto nos Agentes Existentes
- System Engineer: responsável por manter o novo guia e garantir a atualização de handoffs com base em `docs/handoffs/guidelines.md`.
- Business Analyst: agora parte do fluxo narrado em `docs/governance.md` e usa índices enxutos para localizar regras.
- Dev Agent Enhanced: consulta o guia unificado e o novo índice de convenções antes de auto-validar padrões.
- QA Engineer: segue o fluxo descrito no guia e a versão atualizada de `docs/handoffs/README.md`.

#### Validação de Consistência
- [x] FLOW.md ainda é internamente consistente? (agora redirecionado para o novo guia)
- [x] Todos os agentes têm escopo claro e não sobreposto? (mantido em `/.github/agents` e referenciado no guia)
- [x] Hierarquia de autoridade preservada? (hierarquia consolidada em `docs/governance.md`)
- [x] Documentação de referência atualizada? (`docs/business-rules`, `docs/conventions`, `docs/architecture`, `docs/handoffs`)

#### Riscos Identificados
- O novo guia concentra muita informação; pode requerer atualizações frequentes ou subdivisões futuras.
- Mudanças futuras no fluxo ainda exigirão novos ADRs e este guia precisa avançar junto para evitar divergências.

#### Próximos Passos
1. Notificar os agentes sobre o novo guia e orientá-los a lê-lo antes da próxima tarefa.
2. Atualizar os handoffs ativos com links para `docs/handoffs/guidelines.md`.
3. Monitorar o consumo de tokens dos agentes e ajustar a documentação se ainda houver lentidão.

#### ADR Criado
Sim: ADR-014-governance-consolidation.md