# Regra: Criticidade opcional em Rotina Template e Snapshot em RotinaEmpresa

## Contexto
Módulo de Rotinas (templates globais) e Rotinas por Empresa (snapshot pattern). Esta regra define a introdução do campo `criticidade` nas rotinas templates e sua cópia para instâncias por empresa.

## Descrição
Adicionar o campo `criticidade` (opcional) nas rotinas templates e copiá-lo para a instância `RotinaEmpresa` quando a rotina é criada a partir de um template, mantendo o snapshot desacoplado de alterações futuras do template.

## Condição
Aplicado quando:
- Um template de rotina é criado/atualizado
- Uma rotina de empresa é criada a partir de um template (snapshot)

## Comportamento Esperado
- `Rotina` (template) possui `criticidade` opcional (enum `Criticidade`: `ALTA`, `MEDIA`, `BAIXA`).
- `RotinaEmpresa` (snapshot) possui `criticidade` opcional.
- Ao criar `RotinaEmpresa` a partir de `Rotina` (template), copiar `criticidade` do template para a instância.
- Caso o template não possua `criticidade`, o snapshot deve ficar com `criticidade = null`.
- Alterações futuras no template **não** propagam mudanças para `RotinaEmpresa` existente (mantém snapshot pattern).
- `RotinaEmpresa.criticidade` é **editável** após a criação.
- Rotinas **customizadas** (sem template) podem receber `criticidade` no input normalmente.
- O campo deve estar disponível para **exibição e edição** no frontend (template e rotina da empresa).

## Cenários

### Happy Path
1. Admin cria um template de rotina com `criticidade = ALTA`.
2. Gestor cria uma `RotinaEmpresa` a partir desse template.
3. A instância é criada com `criticidade = ALTA` copiada do template.

### Casos de Erro
- `criticidade` com valor fora do enum deve ser rejeitado (validação de input).
- Regras existentes de criação (template inexistente, pilar inválido, multi-tenant) permanecem inalteradas.

## Restrições
- O campo `criticidade` é **não obrigatório** em templates e snapshots.
- Não deve quebrar validações existentes nem o snapshot pattern.
- Não há impacto em ordenação, filtros ou validações adicionais.

## Impacto Técnico Estimado
- **Backend:**
  - Prisma schema: `Rotina` e `RotinaEmpresa`.
  - DTOs de criação/atualização de rotinas template e rotinas empresa.
  - Serviços de criação (cópia para snapshot) e responses.
- **Frontend:**
  - Formulário de Rotinas (template) e telas que exibem dados.
  - Fluxo de criação de rotinas por empresa, se houver campos expostos.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-02-03)
- Prioridade: (pendente)
