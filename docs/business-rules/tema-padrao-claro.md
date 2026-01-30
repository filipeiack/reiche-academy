# Regra: Tema padrão claro

## Contexto
Sistema frontend com alternância de tema (claro/escuro) persistida no cliente.

## Descrição
O tema padrão do sistema deve ser claro quando não houver preferência previamente salva.

## Condição
Na inicialização do frontend, antes do primeiro uso do tema pelo usuário.

## Comportamento Esperado
- Se não existir tema salvo (ex.: localStorage vazio), o sistema deve iniciar com tema claro.
- Se existir tema salvo, o sistema deve respeitar essa preferência.
- Se houver parâmetro de tema explícito na URL, ele deve ser respeitado.

## Cenários

### Happy Path
- Primeiro acesso (sem tema salvo): aplica tema claro.
- Acesso subsequente (tema salvo): mantém tema salvo.

### Casos de Erro
- Se o tema salvo for inválido, deve recair para tema claro.

## Restrições
- O tema padrão não deve sobrescrever escolhas explícitas do usuário.
- A troca de tema deve continuar funcionando como hoje.

## Impacto Técnico Estimado
- Frontend: ajustar lógica de `ThemeModeService` (tema inicial e persistência).

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-30)
- Prioridade: média
