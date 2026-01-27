# Regra: Plano de Ação Específico no Cockpit

## Contexto
Módulo Cockpit de Pilares → Aba “Plano de Ação Específico”.
Objetivo: registrar ações corretivas por indicador e mês, aplicando análise de 5 porquês e controle de status/prazo.

## Descrição
A aba “Plano de Ação Específico” permite cadastrar várias ações. Cada ação está vinculada a um indicador do cockpit e a um mês específico daquele indicador (registro de `IndicadorMensal`).

## Condição
Aplicar-se quando o usuário:
- Seleciona um indicador e um mês para iniciar um plano.
- Cadastra/edita/remover ações.
- Atualiza status e prazo.

## Comportamento Esperado
### 1. Seleção de Indicador e Mês
- Usuário escolhe um **Indicador** (lista de `IndicadorCockpit`).
- Após escolher o indicador, o usuário escolhe um **Mês** (lista de `IndicadorMensal` daquele indicador).
- O sistema grava a referência via `indicadorMensalId`.
- O mês deve ser exibido no formato mês/ano na tela.

### 2. Registro do Plano (Ação)
Campos obrigatórios:
- Indicador (IndicadorCockpit)
- Mês (IndicadorMensal)
- 5 Porquês (5 campos de texto)
- Ação proposta

Campos opcionais:
- Responsável (usuário da empresa; cadastro simplificado)
- Status
- Prazo

### 3. Status e Cores (UI)
Status disponíveis na tela:
- A INICIAR (neutro/sem cor)
- EM ANDAMENTO (amarelo)
- CONCLUÍDA (verde)
- ATRASADA (vermelho)

Regra de atraso (backend):
- ATRASADA é **calculada no backend** quando `prazo` < data atual e status não é CONCLUÍDA.
- Se prazo não estiver preenchido, não marcar como ATRASADA.

### 4. Responsável
- Seleção de usuário da empresa com o **mesmo fluxo simplificado** usado em diagnóstico-notas.
- Não permitir usuário de outra empresa.

### 5. Permissões e Segurança
- Restringir CRUD a usuários com perfil adequado conforme regras de cockpit (ADMINISTRADOR/GESTOR).
- Validar multi-tenant em todas as operações.

## Cenários
### Happy Path
1. Usuário escolhe indicador e mês.
2. Preenche 5 porquês e ação proposta.
3. Seleciona responsável e prazo.
4. Salva e visualiza ação na lista com status e cores.

### Casos de Erro
- Mês escolhido não pertence ao indicador → rejeitar.
- Responsável de outra empresa → rejeitar.
- 5 porquês incompletos → validar e impedir salvamento.

## Restrições
- Vincular ação a `IndicadorMensal` (não apenas a texto do mês).
- Status ATRASADA é derivado, não armazenado.

## Impacto Técnico Estimado
- Backend:
  - Ajustar modelo de ações para armazenar `indicadorMensalId`.
  - Endpoints CRUD com validação do vínculo indicador↔mês.
  - Cálculo de atraso centralizado no backend.
- Frontend:
  - Aba com fluxo de seleção Indicador → Mês.
  - Lista de ações com badges de status e cálculo de atraso.
  - Reuso do cadastro simplificado de usuário.

---
## Observações
- Regra proposta - aguardando implementação.
- Decisão aprovada por: usuário (2026-01-27).
- Prioridade: alta.
