# Regra: Piloto do pipeline UI/UX (CRUD Empresas)

## Contexto
Avaliar rapidamente a UI/UX do fluxo de CRUD de empresas antes de escalar um pipeline completo.

## Descricao
Executar um piloto minimo com capturas e metricas objetivas para a tela de empresas.

## Condicao
Quando o time solicitar validacao de UI/UX para o CRUD de empresas.

## Comportamento Esperado
- Rodar localmente no ambiente de desenvolvimento.
- Usar o seed de testes para credenciais.
- Capturar evidencias de desktop e mobile, em tema claro e escuro.
- Gerar relatorios de acessibilidade e performance.
- Consolidar evidencias para analise por IA.

## Cenarios

### Happy Path
- Acessa http://localhost:4200/empresas.
- Autentica com credenciais do seed.
- Navega no CRUD de empresas.
- Gera screenshots desktop e mobile em tema claro e escuro.
- Gera relatorios Lighthouse e Axe.

### Casos de Erro
- Falha de login: registrar erro e encerrar coleta.
- Nao encontra rota: registrar erro e encerrar coleta.
- Falha ao alternar tema: registrar erro e seguir com tema disponivel.

## Restricoes
- Piloto nao altera codigo de producao.
- Piloto nao altera regras de negocio.
- Escopo limitado a CRUD de empresas.

## Impacto Tecnico Estimado
- Scripts locais para Playwright, Lighthouse e Axe.
- Armazenamento de evidencias em pasta dedicada.

---
## Observacoes
- Regra proposta - aguardando implementacao
- Decisao aprovada por: Filip Iack (2026-02-06)
- Prioridade: media
