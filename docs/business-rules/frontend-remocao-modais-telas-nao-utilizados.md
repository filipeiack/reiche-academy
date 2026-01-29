# Regra: Remoção segura de modais e telas não utilizados (Frontend)

## Contexto
Manutenção do frontend Angular para reduzir código morto e melhorar manutenção.

## Descrição
Modais e telas só devem ser removidos quando comprovadamente **não utilizados** no sistema.

## Condição
A remoção pode ser considerada quando a tela/modal **não possui referências ativas** em:
- Configuração de rotas (incluindo lazy-load).
- Templates de componentes (HTML) e uso de seletores.
- Serviços de diálogo/drawer/modal (ex.: abertura dinâmica por serviço).
- Imports diretos (TypeScript) em componentes, módulos ou serviços.
- Testes E2E/Unitários que exerçam a tela/modal.

## Comportamento Esperado
- Identificar telas/modais sem referências comprovadas.
- Registrar evidências de não uso (busca por classe, seletor, path e rotas).
- Remover apenas itens com evidência de não uso.
- Se houver dúvida (uso indireto, feature flags, permissões), manter e registrar como “candidato” para validação humana.

## Cenários

### Happy Path
1. Componente de tela/modal sem referências em rotas, templates, imports e testes.
2. Remoção do componente e arquivos associados.
3. Build e testes passam.

### Casos de Erro
- Referência dinâmica (ex.: string em serviço de diálogo) não detectada por busca simples.
- Tela/modal acessível via feature flag ou permissão específica.
- Rota gerada em tempo de execução.

Nesses casos, **não remover** sem validação humana.

## Restrições
- Não remover itens com uso indireto ou ambíguo.
- Não remover itens ligados a fluxos sensíveis sem confirmação explícita.
- Não remover se houver divergência entre buscas estáticas e configuração de rotas.

## Impacto Técnico Estimado
- Frontend: components/ views/ shared/ dialogs/ drawers.
- Rotas e lazy-load.
- Arquivos de tradução (assets/i18n).
- Testes unitários e E2E.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-29)
- Prioridade: média
