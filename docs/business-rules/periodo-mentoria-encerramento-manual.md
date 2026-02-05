# Regra: Encerramento Manual de Período de Mentoria

## Contexto
Gestão de períodos de mentoria por empresa dentro do CRUD de empresas, permitindo encerrar um período ativo sem criar um novo período automaticamente.

## Descrição
O usuário deve poder encerrar um período de mentoria. Ao encerrar, o sistema define automaticamente a data/hora do encerramento, desativa o período e a empresa fica sem período ativo.

## Condição
Quando o usuário aciona a ação de encerrar período de mentoria (ex.: botão dedicado no wizard/gestão de períodos).

## Comportamento Esperado
- Definir `dataEncerramento` com a data/hora atual.
- Atualizar o período para `ativo = false`.
- Após encerrar, a empresa deve ficar **sem período ativo**.
- O período encerrado permanece no histórico de períodos.
- Exibir confirmação: "Encerrar mentoria atual? Essa ação desativa o acesso dos usuários da empresa.".

## Cenários

### Happy Path
1. Usuário seleciona um período ativo.
2. Sistema desativa o período e registra `dataEncerramento` com a data/hora atual.
4. A empresa passa a exibir “Sem mentoria ativa”.

### Casos de Erro
- Encerramento sem período ativo disponível.

## Restrições
- Somente **ADMINISTRADOR** pode encerrar período.
- `dataEncerramento` deve ser **maior ou igual** à `dataInicio` do período.
- `dataEncerramento` **não pode ser futura**.
- O período encerrado deve pertencer à empresa em edição no CRUD de empresas.

## Impacto Técnico Estimado
- Backend: novo endpoint/ação para encerrar período e atualizar `ativo` + `dataEncerramento`.
- Frontend: botão/fluxo de encerramento no wizard ou gestão de períodos.
- Auditoria: registrar ação de encerramento (UPDATE) em `AuditLog`.
- Navbar e listas: refletir ausência de período ativo.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: Aguardando validação humana
- Prioridade: média
