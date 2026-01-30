# Regra: Seleção de config por build (staging/prod)

## Contexto
Build e deploy do frontend para ambientes distintos (staging e produção).

## Descrição
O ambiente do frontend deve ser definido no momento do build, permitindo builds distintos para staging e produção.

## Condição
Durante o processo de build da aplicação frontend.

## Comportamento Esperado
- O build de staging utiliza configuração específica de ambiente (ex.: `environment.staging.ts`).
- O build de produção utiliza configuração de produção (`environment.prod.ts`).
- A seleção do ambiente é feita via parâmetro de build (ex.: `--configuration staging|production`).

## Cenários

### Happy Path
- Build `staging` gera bundle com `environment.staging.ts`.
- Build `production` gera bundle com `environment.prod.ts`.

### Casos de Erro
- Se a configuração solicitada não existir, o build deve falhar.

## Restrições
- Não deve haver seleção de ambiente em runtime; o ambiente é fixado no build.

## Impacto Técnico Estimado
- Angular: incluir configuração `staging` com `fileReplacements`.
- Docker: parametrizar build com `ARG` para escolher configuração.
- Compose: definir build arg distinto para staging/prod.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: usuário (2026-01-30)
- Prioridade: alta
