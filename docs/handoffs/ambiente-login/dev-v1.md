# Dev Handoff: Ambiente no Login + Config por Build

**Data:** 2026-01-30  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**  
- /docs/business-rules/ui-login-exibir-ambiente.md  
- /docs/business-rules/frontend-build-config-ambiente.md  
**Business Analyst Handoff:** /docs/handoffs/ambiente-login/business-v1.md

---

## 1️⃣ Escopo Implementado

- Adicionada propriedade de ambiente nos arquivos `environment.*.ts`.
- Criado `environment.staging.ts` e configurado `fileReplacements` para staging/produção.
- Parametrizado build do frontend via `ARG BUILD_CONFIGURATION` no Dockerfile.
- Ajustado docker-compose.vps.yml para build staging/produção.
- Exibido indicador discreto do ambiente na tela de login.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- frontend/src/environments/environment.ts - adiciona `environmentName` (LOCAL).
- frontend/src/environments/environment.prod.ts - adiciona `environmentName` (PRODUÇÃO).
- frontend/src/environments/environment.staging.ts - novo ambiente (STAGING).
- frontend/angular.json - `fileReplacements` e configuração `staging`.
- frontend/Dockerfile - `ARG BUILD_CONFIGURATION` para build por ambiente.
- frontend/src/app/views/pages/auth/login/login.component.ts - `environmentLabel` com fallback.
- frontend/src/app/views/pages/auth/login/login.component.html - indicador de ambiente.
- frontend/src/app/views/pages/auth/login/login.component.scss - estilo discreto do indicador.

### Infra
- docker-compose.vps.yml - build args para frontend-prod/staging.

## 3️⃣ Decisões Técnicas

- Indicador de ambiente como label discreto abaixo da logo (opacidade baixa).
- Texto escolhido: `STAGING` e `PRODUÇÃO`; `LOCAL` para ambiente de dev.
- Fallback para `DESCONHECIDO` caso configuração esteja ausente.
- Build configurável via `--configuration staging|production` e `ARG BUILD_CONFIGURATION`.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno (mantido padrão existente)
- [x] Translations aplicadas (texto do indicador não exige i18n)
- [x] ReactiveForms
- [x] Error handling

**Violações encontradas durante auto-validação:**
- Nenhuma

## 5️⃣ Ambiguidades e TODOs

- [ ] Confirmar nomenclatura final do indicador (ex.: “HOMOLOG” vs “STAGING”).
- [ ] Confirmar se “PRODUÇÃO” deve aparecer para usuários finais.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados:**
- Nenhum.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [ui-login-exibir-ambiente] Indicador de ambiente na tela de login.
  - frontend/src/app/views/pages/auth/login/login.component.ts
  - frontend/src/app/views/pages/auth/login/login.component.html
- [frontend-build-config-ambiente] Config por build (staging/prod).
  - frontend/angular.json
  - frontend/Dockerfile
  - docker-compose.vps.yml

**Regras NÃO implementadas:**
- Nenhuma

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar nomenclatura do indicador e build staging.
- **Prioridade de testes:** indicador de ambiente e build config.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Build staging depende de `--configuration staging` estar disponível no pipeline.

**Dependências externas:**
- Docker build args e Compose.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
