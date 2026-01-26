# Regra: Ciclos de Indicadores Mensais do Cockpit

## Contexto
O módulo Cockpit de Pilares alimenta a grade de indicadores mensais exibida em duas telas principais: o dashboard de diagnóstico (`frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts`) e o editor de valores mensais (`frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`). O backend centraliza o contrato em `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` (métodos `createCockpit`, `createIndicador`, `updateValoresMensais` e `getCockpitById`). O modelo relacional atual (`backend/prisma/schema.prisma` > `IndicadorMensal`) precisa ser ajustado para suportar ciclos atrelados exclusivamente ao indicador e não ao período de mentoria.

## Descrição
A criação de registros na tabela `IndicadorMensal` deve ser disparada exclusivamente por dois fluxos controlados, garantindo visibilidade dos últimos 13 meses na tela e evitando duplicidades automáticas ao renovar uma mentoria. Em vez de vincular os meses a um `PeriodoMentoria`, cada registro deve refletir o mês/ano em que foi criado e o backend deve manter um histórico sequencial por indicador.

## Condição
Aplicar-se quando:
- Um cockpit é criado a partir do botão "Criar Cockpit" na tela de diagnóstico (`CriarCockpitModalComponent`).
- Um novo indicador é adicionado na tela de edição de valores mensais (formulário do editor).
- O usuário dispara o novo botão "Novo ciclo de 12 meses" dentro do editor de valores mensais.
- Dados exibidos no editor são renderizados (todos os indicadores carregados em `CockpitPilaresService.getCockpitById`).

## Comportamento Esperado
### 1. Criação inicial de meses pelo botão de diagnóstico
- O botão "Criar Cockpit" (via `CriarCockpitModalComponent`) continua acionando `cockpitService.createCockpit`, mas agora o backend deve garantir que, após o cockpit existir, os indicadores associados recebam exatamente 12 registros mensais.
- Cada indicador recebe meses sequenciais a partir do mês corrente (`Date_NOW`), preenchendo `mes`/`ano` e deixando `meta`, `realizado` e `historico` em `null`.
- Não há mais criação automática de mês anual (sem `mes`); o resumo anual passa a ser responsabilidade do frontend (já existente em `gestao-indicadores.component.ts`).
- O backend não deve criar registros adicionais ao renovar o período de mentoria (`PeriodosMentoriaService.renovar`). A criação de novos meses fica a cargo do botão do editor.

### 2. Novo indicador via edição de valores mensais
- Ao cadastrar um indicador em `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`, o backend (`createIndicador`) deve produzir 12 meses em vez de 13, começando pelo mês atual e avançando mês a mês (ano deve avançar automaticamente ao cruzar dezembro).
- Cada registro deve usar `indicadorCockpitId`, `ano` e `mes` como chave natural; valores vazios mantêm `null`.
- O backend não deve criar nada relacionado a `periodoMentoriaId` durante esta operação.

### 3. Botão "Novo ciclo de 12 meses" no editor
- A tela de edição exibirá um botão adicional "Novo ciclo de 12 meses" (texto a confirmar com UX) que dispara um endpoint do backend para criar os próximos 12 meses de cada indicador do cockpit.
- Antes de habilitar o botão, o frontend consulta `PeriodosMentoriaService.getPeriodoAtivo` para verificar se há mentoria ativa e se o mês atual (`anoAtual * 100 + mesAtual`) é **maior ou igual** ao mês final do período (`dataFim`). Enquanto a condição não for satisfeita, o botão fica desabilitado e exibe tooltip/alerta explicando o bloqueio.
- O backend valida a mesma condição: se não houver mentoria ativa ou se o mês vigente for anterior ao último mês do período (`periodo.dataFim`), retorna `BadRequestException` com mensagem amigável.
- Quando a validação passa, o backend calcula o `ano`/`mes` do último registro existente para cada indicador (`MAX(ano, mes)` ordenado por `ano`, `mes`). A partir do mês seguinte, insere 12 novos registros consecutivos com `meta`, `realizado` e `historico` nulificados.
- A criação respeita a sequência de meses (dezembro → janeiro do próximo ano) e repete o processo para todos os indicadores ativos do cockpit.

### 4. Exibição no editor de valores mensais
- O endpoint `CockpitPilaresService.getCockpitById` não filtra mais `mesesIndicador` por `periodoMentoriaId`; todos os `IndicadorMensal` registrados na tabela são retornados para cada indicador.
- O componente `edicao-valores-mensais` deve ordenar os registros por `(ano DESC, mes DESC)` e apresentar somente os **últimos 13 meses** criados. Exemplo: se há dados de Jan/24 a Dez/26, a tabela mostra Dez/24 a Dez/26 (13 meses). Se houver menos de 13 registros, apresenta todos.
- A coluna de visualização deixa de depender de `periodoMentoria`; qualquer dados fora do último ciclo permanecem visíveis, mas apenas os 13 mais recentes entram na renderização.

## Cenários
### Happy Path
1. Usuário cria cockpit via diagnóstico; backend gera 12 meses fechando o ciclo mais recente.
2. Usuário abre o editor, cadastra novo indicador; backend cria 12 meses iniciando no mês atual. O editor lista os últimos 13 meses daquele indicador.
3. Depois que o período de mentoria atual alcança o último mês (`dataFim`), o botão "Novo ciclo de 12 meses" fica habilitado, o backend insere mais 12 meses e o editor passa a mostrar os 13 registros finais da nova sequência.

### Casos de Erro
- Botão de novo ciclo ativado antes da mentoria atingir o mês final: o backend responde com `BadRequestException` e o frontend exibe alerta explicando que a mentoria ainda não encerrou o ciclo.
- Empresa sem mentoria ativa tenta criar ciclo adicional: backend rejeita e o botão permanece desabilitado enquanto `PeriodosMentoriaService.getPeriodoAtivo` retornar `null`.
- Ao criar novo indicador, se já existirem 12+ meses consecutivos, deve-se continuar a sequência a partir do último (`ano`, `mes`). O backend não deve inserir duplicatas.

## Restrições
- Não há mais dependência direta em `periodoMentoriaId` dentro de `IndicadorMensal`; a tabela só precisa de `indicadorCockpitId`, `ano`, `mes`, `meta`, `realizado` e `historico`.
- Auditorias (via `AuditService`) continuam sendo registradas para `createIndicador`, `updateValoresMensais` e os novos endpoints criados.
- Mensagens de validação são exibidas ao usuário usando o mesmo padrão de `BadRequestException`/SweetAlert2 já adotado.

## Impacto Técnico Estimado
- Atualizar `CockpitPilaresService.createCockpit` e `createIndicador` para gerar 12 meses a partir do `Date` atual sem criar resumo anual.
- Introduzir novo endpoint (ex: `POST /cockpits/:cockpitId/meses/ciclo`) que consome `PeriodoMentoriaService.getPeriodoAtivo`, valida datas e insere 12 novos meses por indicador.
- Simplificar `updateValoresMensais` para operar sem filtro por `periodoMentoriaId`, removendo a validação `R-MENT-008` e passando a buscar/atualizar registros únicos por `(ipo, ano, mes)`.
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
