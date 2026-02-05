# Regra: Refresh Tokens não exigem auditoria

## Contexto
Refresh tokens são armazenados em `refresh_tokens` para controle de sessões.

## Descrição
Operações em `refresh_tokens` não precisam gerar AuditLog.

## Condição
Sempre que houver criação, renovação ou revogação de refresh tokens.

## Comportamento Esperado
- Não registrar AuditLog para operações em `refresh_tokens`.

## Cenários

### Happy Path
- Rotação de refresh token ocorre sem geração de AuditLog.

### Casos de Erro
- Nenhum.

## Restrições
- A exclusão é específica para `refresh_tokens` e não se estende a outras entidades.

## Impacto Técnico Estimado
- Documentação: explicitar exceção nas regras de auditoria.
- Nenhuma mudança de código necessária se não houver auditoria existente.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-28)
- Prioridade: baixa
