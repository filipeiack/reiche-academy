# Regra: Criação de Período de Mentoria via Modal

## Contexto
Criação de período de mentoria a partir do wizard de empresas (etapa 2), dentro do CRUD de empresa.

## Descrição
O botão “Criar” deve abrir um modal solicitando a data de início da mentoria. O sistema deve sugerir automaticamente a data de término com base no cálculo do ciclo anual, mantendo o campo de término **editável**.

## Condição
Quando o usuário clica em “Criar período de mentoria”.

## Comportamento Esperado
- Abrir modal com:
  - Campo obrigatório: data de início.
  - Campo sugerido: data de término calculada automaticamente.
  - Campo de término permanece **habilitado para edição**.
- Ao confirmar, o período é criado e passa a aparecer no histórico de períodos.

## Cenários

### Happy Path
1. Usuário abre o modal.
2. Informa data de início.
3. Sistema sugere data de término.
4. Usuário confirma (com ou sem editar a data de término).
5. Período é criado e listado no histórico.

### Casos de Erro
- Data de início ausente.
- Data de término inválida (formato incorreto).
- Data de término anterior à data de início.
- Data de término fora do intervalo permitido (5 a 13 meses após a data de início).

## Restrições
- Somente **ADMINISTRADOR** pode criar período.
- `dataInicio` é obrigatória.
- `dataFim` deve ser **maior ou igual** à `dataInicio`.
- `dataFim` deve estar **entre 5 e 13 meses** após `dataInicio`.
- O período criado é sempre associado à empresa em edição no CRUD de empresas.

## Impacto Técnico Estimado
- Frontend: modal no wizard com inputs de data e sugestão automática de término.
- Backend: aceitar data de término editada (se for requisito de persistência) ou recalcular no servidor.
- Histórico: garantir que novos períodos apareçam na lista de períodos.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: Aguardando validação humana
- Prioridade: alta
