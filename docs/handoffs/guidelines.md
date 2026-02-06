# Guidelines para handoffs

## Objetivo

Documentar como os artefatos entre agentes devem ser organizados, nomeados e arquivados para manter a pasta `/docs/handoffs/` navegável.

## Estrutura das pastas
- Cada feature ou assunto recebe uma pasta própria: `docs/handoffs/<nome-da-feature>/`.
- Evite criar pastas baseadas em datas; o foco é o problema/fluxo, não o calendário.
- Dentro da pasta, utilize **arquivos versionados** por agente (business, dev, qa): `<agente>-v<N>.md`.
- Quando o handoff for extenso, adicione um `README.md` local para sumarizar o estado atual.

## Nomenclatura & versionamento
- **Nomes:** `business`, `dev`, `qa`, `system-engineer`.
- **Versão:** `v1`, `v2`, etc. Incrementa apenas quando o agente precisa refazer o trabalho (ex: pattern NÃO CONFORME).
- Documente o status no topo do arquivo (`**Status:** ✅ CONFORME | ❌ NÃO CONFORME | ⚠️ PARCIAL`).

## Metadados úteis
- **Responsável:** quem criou o handoff.
- **Data:** última atualização.
- **Referências:** regras, ADRs ou tickets associados.
- **Próximo agente:** qual agente deve agir em seguida.

## Arquivamento
- Caracterize a feature como “ativa” até existir um `qa-e2e-vN.md ✅ CONFORME`.
- Após merge ou 90 dias sem atividade, mova a pasta para `docs/handoffs-archive/<feature>/`.
- Arquivos antigos podem ser comprimidos em `docs/handoffs-archive/templates/` quando forem apenas históricos.

## Recomendações rápidas
1. Garanta que cada agente leia o handoff anterior antes de agir.
2. Conecte o handoff ao `docs/governance.md` (referencie a seção apropriada).
3. Atualize este guia se o fluxo mudar (System Engineer).  
4. Use checklists simples no final dos handoffs para registrar o status de regras, padrões e testes.