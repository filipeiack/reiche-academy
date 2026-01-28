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
- Prazo
- Ação proposta

Campos opcionais:
- Causas (5 Porquês) — campos independentes
- Responsável (usuário da empresa; cadastro simplificado)
- Data de conclusão da ação

### 3. Status e Cores (UI)
Status disponíveis na tela:
- A INICIAR (neutro/sem cor)
- CONCLUÍDA (verde)
- ATRASADA (vermelho)
- SEM PRAZO (neutro/sem cor)

Regra de status (backend):
- **CONCLUÍDA** quando `dataConclusao` está preenchida.
- **ATRASADA** quando `prazo` < data atual **e** `dataConclusao` não está preenchida.
- **A INICIAR** quando `prazo` está preenchido e não caiu nas regras acima.
- **SEM PRAZO** quando `prazo` não está preenchido.

### 4. Responsável
- Seleção de usuário da empresa com o **mesmo fluxo simplificado** usado em diagnóstico-notas.
- Não permitir usuário de outra empresa.

### 5. Permissões e Segurança
- Restringir CRUD a usuários com perfil adequado conforme regras de cockpit (ADMINISTRADOR/GESTOR).
- Validar multi-tenant em todas as operações.

### 6. Listagem (UI)
- A listagem deve exibir somente as causas preenchidas no registro.
- Campos de causa devem ser exibidos individualmente **apenas se preenchidos** (ex.: se houver somente causa1 e causa2, não renderizar causa3-5).

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
- Status é derivado das datas e não deve ser armazenado manualmente.
- `dataConclusao` é opcional, mas sua presença tem prioridade sobre atraso.
- Comparação de datas usa data do servidor em horário de São Paulo (Brasil).

## Impacto Técnico Estimado
- Backend:
  - Ajustar modelo de ações para armazenar `indicadorMensalId`.
  - Endpoints CRUD com validação do vínculo indicador↔mês.
  - Incluir campo `dataConclusao` na criação/edição.
  - Cálculo de status centralizado no backend com base em `prazo` e `dataConclusao`.
- Frontend:
  - Aba com fluxo de seleção Indicador → Mês.
  - Lista de ações com badges de status e cálculo de atraso.
  - Exibir somente campos presentes na listagem (ex.: se só houver causa1 e causa2, não renderizar causa3-5).
  - Reuso do cadastro simplificado de usuário.

---
## Observações
- Regra proposta - aguardando implementação.
- Decisão aprovada por: usuário (2026-01-28).
- Prioridade: alta.
