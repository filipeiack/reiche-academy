# Regra: Plano de Ação Específico no Cockpit

## Contexto
Módulo Cockpit de Pilares → Aba “Plano de Ação Específico”.
Objetivo: registrar ações corretivas por indicador e mês, aplicando análise de 5 porquês e controle de status por datas planejadas e reais.

## Descrição
A aba “Plano de Ação Específico” permite cadastrar várias ações. Cada ação está vinculada a um indicador do cockpit e a um mês específico daquele indicador (registro de `IndicadorMensal`).
O status da ação é derivado do avanço das datas planejadas e reais, sem seleção manual em tela.

## Condição
Aplicar-se quando o usuário:
- Seleciona um indicador e um mês para iniciar um plano.
- Cadastra/edita/remover ações.
- Atualiza datas planejadas e reais da ação.

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
- Data de início previsto
- Data de término previsto (prazo)
- Ação proposta

Campos opcionais:
- Causas (5 Porquês) — campos independentes
- Responsável (usuário da empresa; cadastro simplificado)
- Data de início real
- Data de término real (data de conclusão)

### 3. Status e Cores (UI)
Status disponíveis na tela:
- A INICIAR (neutro/sem cor)
- EM ANDAMENTO (azul)
- ATRASADA (vermelho)
- CONCLUÍDA (verde)

Regra de status (backend):
- **CONCLUÍDA** quando `terminoReal` está preenchida.
- **ATRASADA** quando `terminoPrevisto` < data atual **e** `terminoReal` não está preenchida.
- **EM ANDAMENTO** quando `inicioReal` está preenchida e `terminoReal` não está preenchida **e** não se enquadra em ATRASADA.
- **A INICIAR** quando `inicioReal` não está preenchida e não se enquadra em ATRASADA.

Regras de casos-limite (backend):
- Se `inicioReal` ocorreu **dentro do intervalo previsto** (entre `inicioPrevisto` e `terminoPrevisto`), status é **EM ANDAMENTO** (desde que `terminoReal` não esteja preenchida).
- Se `inicioReal` ocorreu **após** `terminoPrevisto`, status é **ATRASADA**.

### 4. Responsável
- Seleção de usuário da empresa com o **mesmo fluxo simplificado** usado em diagnóstico-notas.
- Não permitir usuário de outra empresa.

### 5. Permissões e Segurança
- Restringir CRUD a usuários com perfil adequado conforme regras de cockpit (ADMINISTRADOR/GESTOR).
- Validar multi-tenant em todas as operações.

### 6. Listagem (UI)
- A listagem deve exibir somente as causas preenchidas no registro.
- Campos de causa devem ser exibidos individualmente **apenas se preenchidos** (ex.: se houver somente causa1 e causa2, não renderizar causa3-5).

### 7. Datas na Grid e Drawer (UI)
- Exibir as quatro datas na grid e manter os mesmos campos no drawer.
- Remover combo/manual de status do drawer.
- A grid deve oferecer botões de ação para marcar **apenas datas reais** diretamente (sem abrir o drawer).
- Não permitir marcar `terminoReal` antes de `inicioReal`.

### 8. Sumário de Status (UI)
- Antes da grid, exibir um **sumário por status** do plano de ação do cockpit pilar.
- O sumário deve mostrar **quantidade absoluta** e **percentual** de ações em cada status.
- Considerar **todas** as ações do cockpit pilar, independente de indicador/mês.

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
- Datas previstas obrigatórias ausentes → impedir salvamento.

## Restrições
- Vincular ação a `IndicadorMensal` (não apenas a texto do mês).
- Status é derivado das datas e não deve ser armazenado manualmente.
- `prazo` corresponde a `terminoPrevisto`.
- `dataConclusao` corresponde a `terminoReal`.
- `inicioPrevisto` e `terminoPrevisto` são obrigatórios.
- Comparação de datas usa data do servidor em horário de São Paulo (Brasil).

## Impacto Técnico Estimado
- Backend:
  - Ajustar modelo de ações para armazenar `indicadorMensalId`.
  - Endpoints CRUD com validação do vínculo indicador↔mês.
  - Incluir campos `inicioPrevisto`, `terminoPrevisto`, `inicioReal`, `terminoReal`.
  - Cálculo de status centralizado no backend com base nas datas previstas e reais.
- Frontend:
  - Aba com fluxo de seleção Indicador → Mês.
  - Lista de ações com badges de status e cálculo de atraso.
  - Sumário por status antes da grid (quantidade e percentual).
  - Exibir somente campos presentes na listagem (ex.: se só houver causa1 e causa2, não renderizar causa3-5).
  - Reuso do cadastro simplificado de usuário.
  - Remover combo de status e permitir marcação de datas na grid.

---
## Observações
- Regra proposta - aguardando implementação.
- Decisão aprovada por: usuário (2026-02-02).
- Prioridade: alta.
