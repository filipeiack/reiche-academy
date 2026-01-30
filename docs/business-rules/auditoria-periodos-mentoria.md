# Regra: Auditoria em Períodos de Mentoria

## Contexto
Períodos de mentoria são criados e renovados no módulo PeriodosMentoria e representam ciclos anuais por empresa.

## Descrição
Operações de criação e renovação de períodos de mentoria geram auditoria em `AuditLog` quando há identificação do usuário (`createdBy`/`updatedBy`).

## Condição
- Ao criar um novo período (`create`).
- Ao renovar um período (`renovar`) — encerramento do período anterior e criação do novo.

## Comportamento Implementado
- **CREATE:** registra auditoria com `entidade = 'periodos_mentoria'` e `dadosDepois` do período criado.
- **RENEW:** registra auditoria do encerramento (UPDATE) do período ativo e auditoria de CREATE do novo período.
- A auditoria só é registrada quando `createdBy`/`updatedBy` é fornecido pelo controller.

## Restrições
- A padronização de `entidade` segue `periodos_mentoria`.
- Não há tratamento explícito de falha na auditoria (o comportamento depende do `AuditService`).

## Fonte no Código
- Arquivo: backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts
- Classe: `PeriodosMentoriaService`
- Métodos: `create()` e `renovar()`

---
## Observações
- Regra extraída por engenharia reversa
- Não representa necessariamente o comportamento desejado
