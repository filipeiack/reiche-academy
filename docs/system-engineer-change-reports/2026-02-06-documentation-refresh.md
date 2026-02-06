### System Engineering Change Report

#### Motivação
Atualizar referências de documentação para o guia de governança consolidado e preparar a estrutura de arquivamento de handoffs.

#### Mudanças Realizadas
- `README.md`: ajustado para referenciar `docs/governance.md` e remover `docs/reference/`.
- `docs/flow.md`: reforçado redirecionamento para `docs/governance.md` com formatação limpa.
- `docs/DOCUMENTATION_AUTHORITY.md`: reforçado redirecionamento para `docs/governance.md`.
- `docs/handoffs/README.md`: atualizado fluxo para `business → dev → qa`.
- `docs/handoffs-archive/README.md`: criado guia de arquivamento.
- `docs/guides/README.md`: removidas referências a `docs/reference/` e adicionado guia central.
- `docs/governance.md`: alinhada seção de handoffs ao fluxo `business → dev → qa`.
- `docs/handoffs/cockpit-pilares/`: arquivado para `docs/handoffs-archive/cockpit-pilares/` (QA ✅ ou critério de idade).
- `docs/architecture/ci-cd.md`: criada documentação mínima de CI/CD.
- `docs/architecture/architecture.md`: referência ao guia de CI/CD.

#### Impacto nos Agentes Existentes
- System Engineer: mantém governança como fonte de verdade.
- Business Analyst: fluxo de handoffs agora alinhado ao guia principal.
- Dev Agent Enhanced: fluxo de handoffs agora alinhado ao guia principal.
- QA Engineer: fluxo de handoffs agora alinhado ao guia principal.

#### Validação de Consistência
- [x] FLOW.md ainda é internamente consistente? (redirecionado para governança)
- [x] Todos os agentes têm escopo claro e não sobreposto? (sem alteração)
- [x] Hierarquia de autoridade preservada? (governança permanece como topo)
- [x] Documentação de referência atualizada? (README e handoffs alinhados)

#### Riscos Identificados
- Se houver dependências externas apontando para `docs/reference/`, será necessário atualizar links adicionais.

#### Próximos Passos
1. Revisar handoffs ativos e arquivar os com mais de 90 dias quando apropriado.
2. Atualizar possíveis links internos em documentos que ainda apontem para `docs/reference/`.

#### ADR Criado
Não. Mudanças editoriais/organizacionais sem alteração estrutural de governança.
