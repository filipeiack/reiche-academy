# Regra: Renovação Inteligente de Período de Mentoria

## Contexto
A ação “Renovar mentoria” deve considerar se existe período ativo para decidir entre renovar ou criar, dentro do CRUD de empresas.

## Descrição
Ao clicar em “Renovar mentoria”, o sistema deve:
- Se existir período ativo, pedir confirmação para encerrar o período atual e criar um novo período de 1 ano a partir da data de hoje.
- Se **não** existir período ativo, executar o fluxo de criação como se fosse “Criar período”.

## Condição
Quando o usuário aciona o botão “Renovar mentoria”.

## Comportamento Esperado
- **Com período ativo:**
  - Exibir confirmação: encerrar período atual e criar novo.
  - Ao confirmar, encerrar o período atual e criar novo período com `dataInicio = hoje`.
  - `dataFim` deve ser calculado automaticamente para o ciclo anual (1 ano a partir de hoje).
- **Sem período ativo:**
  - Executar o fluxo de criação padrão (sem exigir período anterior).

## Cenários

### Happy Path
1. Empresa possui período ativo.
2. Usuário clica em “Renovar mentoria”.
3. Sistema confirma encerramento do período atual.
4. Período atual é encerrado e novo período é criado com data de hoje.

### Casos de Erro
- Renovação sem período ativo disponível (deve cair no fluxo de criação).
- Falha ao encerrar período atual (transação não deve criar novo período).

## Restrições
- Somente **ADMINISTRADOR** pode renovar período.
- Mensagens de confirmação/alerta **não definidas** nesta regra.
- O período renovado deve pertencer à empresa em edição no CRUD de empresas.

## Impacto Técnico Estimado
- Backend: ajustar fluxo de renovação para aceitar criação quando não houver período ativo; garantir atomicidade ao encerrar + criar.
- Frontend: botão “Renovar mentoria” deve consultar período ativo e abrir confirmação apropriada.
- Auditoria: registrar UPDATE do período encerrado e CREATE do novo período.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: Aguardando validação humana
- Prioridade: alta
