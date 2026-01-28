# Regra: LoginHistory deve registrar logout e reset de senha

## Contexto
LoginHistory é a tabela de auditoria de autenticação, atualmente usada para registrar tentativas de login.

## Descrição
Logout e reset de senha devem gerar registros em LoginHistory.

## Condição
Quando houver:
- Logout explícito do usuário.
- Reset de senha concluído (token válido e senha alterada).

## Comportamento Esperado
- Registrar evento de logout em LoginHistory.
- Registrar evento de reset de senha em LoginHistory.
- Manter registro de IP e User-Agent, quando disponíveis.

## Cenários

### Happy Path
1. Usuário realiza logout.
2. Sistema registra LoginHistory com sucesso.

1. Usuário conclui reset de senha.
2. Sistema registra LoginHistory com sucesso.

### Casos de Erro
- Falha ao registrar LoginHistory não deve bloquear logout ou reset. **Alinhado à regra de login.**

## Restrições
- A estrutura atual de LoginHistory não diferencia tipo de evento (login/logout/reset).
- É necessário definir campo ou convenção para identificar o tipo de evento.

## Impacto Técnico Estimado
- Backend: AuthService deve registrar logout e reset.
- Banco: avaliar adição de campo para tipo de evento, ou convenção documentada.
- Atualizar regras de auditoria e autenticação.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-28)
- Prioridade: alta
