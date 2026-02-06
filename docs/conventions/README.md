# Convenções do Repositório (versão enxuta)

## Pilares da convenção
- **Backend:** NestJS + Prisma com DTOs validados, `.select()` em queries, soft delete e audit logging.
- **Frontend:** Angular 18 standalone, `inject()` em vez de construtores, observables/signals, `| translate` em textos visíveis.
- **Testes:** Jest (backend), Jasmine/Karma (frontend), Playwright (e2e) — com foco em regras, não em implementação.
- **Git & commits:** Conventional Commits parcial; mantenha o padrão documentado em `git.md`.

## Arquivos principais (detalhes separados)
- `backend.md` — estrutura de módulos, controllers, DTOs e validações.
- `frontend.md` — componentes standalone, formulários reativos, guards e i18n.
- `testing.md` — nomenclatura, mocks e critérios de cobertura.
- `naming.md` — convenções de nomes (classes, arquivos, métodos). 
- `git.md` — fluxo de commits e merges.
- `handoff-template.md` — estrutura padrão de entrega entre agentes.

## Consistência atual (legenda)
- **CONSISTENTE:** regras aplicadas em quase todo o código.
- **PARCIAL:** padrão presente na maioria dos casos, mas com exceções.
- **INCONSISTENTE:** padrão pouco adotado.

Cada arquivo indica o grau de consistência na seção inicial; consulte se precisar justificar um desvio.

## Como usar este índice
1. Identifique o artefato de código que será afetado (backend, frontend, testes...).
2. Abra o documento correspondente na lista acima.
3. Verifique se há padrões específicos para o módulo/pacote — o Dev Agent Enhanced valida isso automaticamente.

## Próximos passos
- Atualizar `testing.md` assim que testes Playwright ou Jest novos forem adicionados.
- Consolidar convenções Git com hooks se o time adotar Conventional Commits completo.
- Documentar novos padrões (ex: lazy loading ou interceptors) apenas após implementação.

**Nota:** Este README agora serve como índice rápido e referências diretas. Conteúdo técnico permanece em cada arquivo específico.