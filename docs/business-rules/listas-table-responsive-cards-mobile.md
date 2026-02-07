# Regra: Listas com table-responsive - cards no mobile

## Contexto
Listas de CRUD e telas do frontend que usam `table-responsive`.

## Descricao
Em mobile, listas baseadas em tabela devem usar cards para evitar scroll horizontal. Em desktop, devem manter a tabela.

## Condicao
Quando a tela for exibida em viewport mobile (padrao de mercado: max-width 768px).

## Comportamento Esperado
- Desktop: renderizar tabela com as mesmas colunas e acoes atuais.
- Mobile: renderizar cards, sem scroll horizontal.
- Cards devem exibir as informacoes da tabela e as acoes disponiveis na linha.
- Paginacao, busca e ordenacao continuam funcionando da mesma forma.
- Cada tela deve manter equivalencia funcional entre tabela (desktop) e cards (mobile).

## Cenarios

### Happy Path
- Acessa uma tela com tabela em desktop e visualiza tabela completa.
- Acessa a mesma tela em mobile e visualiza cards com os dados e acoes disponiveis.

### Casos de Erro
- Sem dados: exibir o estado vazio atual (sem tabela/cards com dados).
- Erro de carregamento: manter mensagem de erro e estados de loading atuais.

## Restricoes
- Nao alterar regras de negocio nem chamadas de API.
- Nao remover acoes existentes (detalhes, editar, deletar).
- Manter textos com i18n.

## Excecoes

~~**Tabelas de edicao inline:** Telas que permitem edicao de multiplos valores simultaneamente em uma grid (ex: edicao-valores-mensais) mantem table-responsive com scroll horizontal.~~

**Status:** ✅ RESOLVIDO (2026-02-06)
- A tela `edicao-valores-mensais` foi implementada com mobile-cards na versão v4
- Cards individuais por mês com inputs de histórico, meta, realizado
- Cálculos automáticos preservados, card de resumo com totais/médias
- Padrão table-responsive → mobile-cards agora é **universal** em todas as telas identificadas

## Impacto Tecnico Estimado
- Ajustes em cada tela com `table-responsive` para alternar tabela no desktop e cards no mobile.
- Possivel reutilizacao de estilos responsivos existentes.
- Mapeamento inicial de telas com `table-responsive`:
  - frontend/src/app/views/pages/empresas/empresas-list/empresas-list.component.html
  - frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.html
  - frontend/src/app/views/pages/usuarios/usuarios-list/usuarios-list.component.html
  - frontend/src/app/views/pages/rotinas/rotinas-list/rotinas-list.component.html
  - frontend/src/app/views/pages/pilares/pilares-list/pilares-list.component.html
  - frontend/src/app/views/pages/objetivos-templates/objetivos-templates-list/objetivos-templates-list.component.html
  - frontend/src/app/views/pages/indicadores-templates/indicadores-templates-list/indicadores-templates-list.component.html
  - frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.html
  - frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.html
  - frontend/src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.html
  - frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.html
  - frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html
  - frontend/src/app/views/pages/cockpit-pilares/plano-acao-especifico/plano-acao-especifico.component.html

---
## Observacoes
- Regra proposta - aguardando implementacao
- Decisao aprovada por: Filipe Iack (2026-02-07)
- Prioridade: media
