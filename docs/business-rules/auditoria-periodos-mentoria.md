# Regra: Auditoria em Períodos de Mentoria

## Contexto
Períodos de mentoria são criados e renovados no módulo PeriodosMentoria e representam ciclos anuais por empresa.

## Descrição
Todas as operações CUD relacionadas a períodos de mentoria devem gerar auditoria em AuditLog.

## Condição
Quando ocorrer criação, renovação (encerramento do período anterior) ou atualização relevante de período de mentoria.

## Comportamento Esperado
- Registrar AuditLog após CREATE de período.
- Registrar AuditLog após UPDATE que encerra período vigente.
- Registrar AuditLog após criação do novo período no fluxo de renovação.

## Cenários

### Happy Path
1. Usuário cria período de mentoria.
2. Sistema cria o registro no banco.
3. Sistema registra AuditLog (acao: CREATE) com `dadosDepois` do período criado.

### Casos de Erro
- Falha ao registrar auditoria não deve impedir a criação/renovação? **Decisão pendente.**

## Restrições
- O registro de auditoria deve respeitar a padronização de `entidade` definida em regra específica.

## Impacto Técnico Estimado
- Backend: adicionar chamadas a `AuditService.log()` em PeriodosMentoriaService.
- Regras de auditoria: atualizar documento de auditoria com nova cobertura.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-28)
- Prioridade: alta
