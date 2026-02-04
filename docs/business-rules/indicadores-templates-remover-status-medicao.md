# Regra: Remover Status de Medição do Template de Indicadores

## Contexto
Módulo Indicadores Templates (globais). O objetivo é simplificar o template, mantendo `statusMedicao` apenas quando o indicador estiver no Cockpit do Pilar.

## Descrição
O template de indicador **não deve** armazenar ou expor o campo `statusMedicao`. Esse status deve existir **somente** no contexto de `IndicadorCockpit` (cockpit de pilares).

## Condição
Ao criar, editar ou exibir Indicadores Templates.

## Comportamento Esperado
- O template **não inclui** `statusMedicao` em DTOs, UI ou persistência.
- O status de medição **é configurado apenas** quando o indicador está no Cockpit do Pilar.
- Ao criar `IndicadorCockpit` a partir de template, o `statusMedicao` inicial fica **null**.

## Cenários

### Happy Path
- Usuário cria/edita um Indicador Template sem campo `statusMedicao`.
- Ao visualizar o template, o campo `statusMedicao` não aparece.

### Casos de Erro
- Payloads contendo `statusMedicao` para templates devem ser **ignorados**.

## Restrições
- O campo `statusMedicao` permanece obrigatório apenas para `IndicadorCockpit`.
- A regra de snapshot deve ser atualizada para **não copiar** `statusMedicao` do template.

## Impacto Técnico Estimado
- Backend: DTOs/entidade de Indicadores Templates e rotas CRUD.
- Frontend: formulário/listagem/detalhes de Indicadores Templates.
- Fluxo de snapshot para `IndicadorCockpit` (criação de cockpit a partir de template).
- Seed de templates e validações existentes.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-02-04)
- Prioridade: (pendente)
