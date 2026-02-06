# Regra: Ciclos de Indicadores Mensais do Cockpit

## Contexto
O módulo Cockpit de Pilares alimenta a grade de indicadores mensais exibida em duas telas principais: o dashboard de diagnóstico (`frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts`) e o editor de valores mensais (`frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`). O backend centraliza o contrato em `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` (métodos `createCockpit`, `createIndicador`, `updateValoresMensais` e `getCockpitById`). O modelo relacional atual (`backend/prisma/schema.prisma` > `IndicadorMensal`) precisa ser ajustado para suportar ciclos atrelados exclusivamente ao indicador e não ao período de mentoria.

## Descrição
A criação de registros na tabela `IndicadorMensal` deve ser disparada exclusivamente pelo botão "Novo ciclo de 12 meses" no editor de valores mensais, usando uma **data de referência única** definida pelo usuário. Esse clique deve persistir a referência no `CockpitPilar` e criar 12 meses para **todos** os indicadores do cockpit a partir dessa referência (mes/ano da data). Nenhum outro fluxo (criação de cockpit, criação de indicador, atualização de valores mensais ou criação/renovação de período de mentoria) pode criar `IndicadorMensal` automaticamente. Em vez de vincular os meses a um `PeriodoMentoria`, cada registro deve refletir o mês/ano em que foi criado e o backend deve manter um histórico sequencial por indicador.

## Condição
Aplicar-se quando:
- O usuário seleciona uma data de referência e dispara o botão "Novo ciclo de 12 meses" no editor de valores mensais.
- Um novo indicador é criado **depois** que a referência já foi definida no cockpit.
- Dados exibidos no editor são renderizados (todos os indicadores carregados em `CockpitPilaresService.getCockpitById`).

## Comportamento Esperado
### 1. Definicao de referencia + criacao inicial (unico gatilho de criacao)
- A tela de edicao exibira um campo de data referencia (mes/ano) e o botao "Novo ciclo de 12 meses".
- Ao clicar, o backend deve:
  - Persistir a referencia (data unica) no `CockpitPilar`, **normalizada para dia 1**.
  - Criar 12 meses consecutivos a partir do mes/ano informado para **todos** os indicadores ativos do cockpit.
  - Preencher `meta`, `realizado` e `historico` como `null`.
- Se nao houver indicadores ativos, o backend **ainda** deve salvar a referencia.
- O botao nao fica mais disponivel para clique apos a referencia ser definida (regra de uma unica definicao).

### 2. Criacao tardia de indicador
- Se um indicador for criado **depois** da referencia estar definida no cockpit, o backend deve criar automaticamente os 12 meses a partir da referencia.
- Se nao houver referencia definida, nenhum `IndicadorMensal` deve ser criado na criacao do indicador.

### 3. Nenhuma criacao automatica fora do botao
- `createCockpit`, `createIndicador` (sem referencia), `updateValoresMensais`, `PeriodosMentoriaService.create` e `PeriodosMentoriaService.renovar` nao devem criar `IndicadorMensal`.
- `updateValoresMensais` deve apenas atualizar registros existentes; se o mes nao existir, o backend deve rejeitar a operacao.

### 4. Exibicao no editor de valores mensais
- Antes de existir qualquer mes, a tela deve exibir apenas o header com o botao e o campo de referencia; a tabela nao deve aparecer.
- O endpoint `CockpitPilaresService.getCockpitById` deve retornar `mesesIndicador` completos (sem filtro por `periodoMentoriaId`) e a referencia registrada no `CockpitPilar`.
- Quando houver meses, o componente `edicao-valores-mensais` deve ordenar os registros por `(ano DESC, mes DESC)` e apresentar somente os **ultimos 13 meses** criados. Se houver menos de 13 registros, apresenta todos.

## Cenários
### Happy Path
1. Usuario seleciona mes/ano e aciona "Novo ciclo de 12 meses"; backend grava a referencia e cria 12 meses consecutivos a partir dela.
2. O editor passa a listar os ultimos 13 meses daquele indicador.
3. Um novo indicador criado depois herda os 12 meses baseados na referencia.

### Casos de Erro
- Botao clicado sem data valida: backend rejeita com erro de validacao.
- Botao clicado quando a referencia ja esta definida: backend rejeita e frontend mantem o botao desabilitado.
- Ao criar novo indicador, se nao houver referencia definida, nenhum mes e criado.
- Ao atualizar valores de um mes inexistente, o backend deve rejeitar a operacao.

## Restrições
- Não há mais dependência direta em `periodoMentoriaId` dentro de `IndicadorMensal`; a tabela só precisa de `indicadorCockpitId`, `ano`, `mes`, `meta`, `realizado` e `historico`.
- Auditorias (via `AuditService`) continuam sendo registradas para o endpoint de criacao de ciclo, `createIndicador` (quando cria meses) e `updateValoresMensais`.
- Mensagens de validação são exibidas ao usuário usando o mesmo padrão de `BadRequestException`/SweetAlert2 já adotado.

## Impacto Técnico Estimado
- Atualizar `CockpitPilaresService.createCockpit` para **nao** criar meses automaticamente.
- Atualizar `CockpitPilaresService.createIndicador` para criar meses **apenas** se existir referencia no cockpit.
- Garantir que `updateValoresMensais` nao crie registros inexistentes.
- Consolidar a criacao de meses no endpoint do botao (ex: `POST /cockpits/:cockpitId/meses/ciclo`).
- Persistir a referencia no `CockpitPilar` como **data unica** (ex: `dataReferencia`) normalizada para dia 1 e expor via `getCockpitById`.
- Ajustar `getCockpitById` para ordenar `mesesIndicador` e retornar todos; o frontend trata o recorte dos últimos 13 meses.
- Remodelar `IndicadorMensal` em `backend/prisma/schema.prisma`:
  - Remover `periodoMentoriaId` e relação com `PeriodoMentoria`.
  - Adicionar `@@unique([indicadorCockpitId, ano, mes])` e `@@index([ano, mes])` para acelerar busca do último mês.
  - Garantir `mes` aceita `null` apenas quando for necessário retornar resumos (se mantiver, explicar no documentação). Como o frontend já calcula resumos, o campo pode ser mantido para compatibilidade mas nunca deve ser preenchido durante criação de novos ciclos.

---
## Observações
- Regra proposta - aguardando implementação.
- Decisão aprovada por: Aguardando validação humana.
- Prioridade: alta.
