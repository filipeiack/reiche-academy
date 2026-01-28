# Regra: Padronização de `entidade` em AuditLog

## Contexto
AuditLog registra a coluna `entidade` para identificar a origem da mudança. Hoje há nomes inconsistentes.

## Descrição
`entidade` deve ser padronizada para evitar inconsistências de consulta e relatórios.

## Condição
Sempre que um módulo registrar AuditLog.

## Comportamento Esperado
- `entidade` deve seguir um padrão único e documentado.
- Padrão proposto: nome da tabela no banco (snake_case conforme @@map do Prisma).

## Cenários

### Happy Path
- Ao criar usuário, `entidade = "usuarios"`.
- Ao atualizar período de avaliação, `entidade = "periodos_avaliacao"`.

### Casos de Erro
- `entidade` fora do padrão deve ser considerada não conforme e corrigida.

## Restrições
- Padronização exige revisão de todas as chamadas a `AuditService.log()`.

## Impacto Técnico Estimado
- Backend: atualizar valores de `entidade` em todos os módulos que auditam.
- Documentação: registrar padrão único em auditoria.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-28)
- Prioridade: média
