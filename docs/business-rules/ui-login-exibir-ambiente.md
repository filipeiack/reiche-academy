# Regra: Exibir ambiente na tela de login

## Contexto
Autenticação no frontend, tela de login (UI).

## Descrição
A tela de login deve exibir um indicador discreto do ambiente atual (staging/prod) para evitar confusão entre ambientes.

## Condição
Ao renderizar a tela de login no frontend.

## Comportamento Esperado
- O ambiente é definido em build time (configuração do build do frontend).
- A tela de login exibe o nome do ambiente atual de forma discreta (ex.: badge/label “STAGING” ou “PRODUÇÃO”).
- O indicador não deve interferir no fluxo de login.

## Cenários

### Happy Path
- Em build de staging, a tela de login mostra “STAGING”.
- Em build de produção, a tela de login mostra “PRODUÇÃO”.

### Casos de Erro
- Se a configuração de ambiente estiver ausente ou inválida, o indicador deve mostrar “DESCONHECIDO”.

## Restrições
- O indicador deve ser visualmente discreto (não deve distrair o usuário final).
- Não deve expor informações sensíveis além do nome do ambiente.

## Impacto Técnico Estimado
- Frontend: adicionar propriedade de ambiente no `environment.*.ts`.
- Tela de login: consumir propriedade de ambiente e renderizar indicador.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-30)
- Prioridade: média
