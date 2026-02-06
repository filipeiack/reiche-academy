# CI/CD — visão mínima (documentação base)

**Objetivo:** registrar o fluxo mínimo de integração e entrega para o projeto, sem impor ferramenta específica.

## Escopo
- **CI (Integração Contínua):** valida qualidade a cada mudança.
- **CD (Entrega/Deploy Contínuo):** promove artefatos para ambientes quando aprovado.

## Estágios mínimos recomendados

### CI
1. **Instalação**
   - `backend`: `npm install`
   - `frontend`: `npm install`
2. **Lint/Format**
   - `backend`: `npm run lint`
   - `frontend`: `npm test` (ou `ng test --code-coverage`)
3. **Testes**
   - `backend`: `npm test`
   - `frontend`: `npm run test:e2e` (quando aplicável)
4. **Build**
   - `backend`: `npm run build`
   - `frontend`: `npm run build`

### CD
1. **Staging**
   - Deploy automático após CI verde em `develop` ou `staging`
   - Smoke tests básicos
2. **Produção**
   - Deploy após aprovação humana e tag/versionamento
   - Rollback documentado

## Gatilhos sugeridos
- **PR → develop**: executa CI completo.
- **Merge em staging**: CI + deploy em staging.
- **Merge em main**: CI + deploy em produção (com aprovação).

## Artefatos e logs
- Guardar relatórios de testes e coverage.
- Manter logs de deploy por ambiente.

## Segredos e variáveis
- Nunca versionar `.env`.
- Usar secrets do provedor de CI.
- Separar variáveis por ambiente (dev/staging/prod).

## Observações
- Esta página é **base mínima**. Se houver escolha de ferramenta (GitHub Actions, GitLab CI, Jenkins, etc.), registrar em ADR.
