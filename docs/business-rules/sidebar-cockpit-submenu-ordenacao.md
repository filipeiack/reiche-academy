# Regra: Ordenação alfabética do submenu de Cockpits

## Contexto
Menu lateral (Sidebar) e geração dinâmica do submenu de Cockpits, exibindo o nome do pilar associado ao cockpit.

## Descrição
O submenu de Cockpits deve ser exibido em ordem alfabética pelo nome do pilar, para facilitar a navegação quando há múltiplos cockpits.

## Condição
Quando o MenuService cria os subitens de Cockpits a partir da lista de cockpits da empresa.

## Comportamento Esperado
- Ordenar os subitens de Cockpits em ordem alfabética simples (A–Z) pelo nome do pilar exibido.
- A ordenação deve ocorrer antes da renderização do menu.

## Cenários

### Happy Path
- Cockpits: "Comercial", "Financeiro", "Gestão"
- Menu: exibe subitens na ordem **Comercial → Financeiro → Gestão**.

### Casos de Erro
- Cockpit sem nome de pilar disponível: manter ordenação consistente e registrar ausência para correção de dados.

## Restrições
- Regra adota ordenação simples (sem tratamento especial de acentos ou case).

## Impacto Técnico Estimado
- Frontend: ajuste no MenuService para ordenar os subitens gerados a partir da lista de cockpits.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: solicitante (chat), 2026-02-02
- Prioridade: média
