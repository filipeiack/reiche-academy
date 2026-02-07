# Dev Handoff: Piloto UI/UX - CRUD Empresas

**Data:** 2026-02-06  
**Agente:** Dev Agent Enhanced  
**Base:** /docs/handoffs/uiux-piloto-empresas/business-v1.md

---

## 1) Escopo Implementado
- Script piloto para capturas e relatorios (Playwright + Axe).
- Evidencias organizadas em `frontend/test-results/uiux-pilot/empresas`.

## 2) Arquivos Alterados
- frontend/scripts/uiux-pilot-empresas.js
- frontend/scripts/uiux-lighthouse-empresas.ps1
- frontend/package.json

## 3) Como Executar
```bash
cd frontend
npm install
npm run uiux:pilot:empresas
npm run uiux:lh:empresas
```

## 4) Observacoes
- Login via ids `#exampleInputEmail1` e `#InputPassword`, submit `button[type="submit"]`.
- Tema definido por query param `?theme=light|dark` e perfil persistente para Lighthouse.
- Lighthouse roda com preset `desktop` e alterna `--form-factor` para `desktop` e `mobile`.
- Lighthouse desativado no piloto por instabilidade no Windows.
- Lighthouse pode ser executado via Docker no Windows com o script `uiux:lh:empresas` (imagem `justinribeiro/lighthouse`, comando `lighthouse`, flags via `--chrome-flags="--no-sandbox --disable-gpu --headless"`).
- Para evitar 403 em rotas autenticadas, o script aponta para `/auth/login`.
- Caso o login falhe, o script encerra com erro.

## 5) Auto-validacao (Dev)
- [x] Escopo limitado ao piloto do CRUD de empresas
- [x] Sem alteracao de codigo de producao
- [x] Usa credenciais do seed de testes
- [x] Artefatos gerados para desktop e mobile

## 6) Lista de Tarefas (UI/UX)
- [ ] Ajustar contraste do badge verde no tema escuro para atender WCAG (>= 4.5:1)
- [ ] Adicionar label ou aria-label no combobox de selecao de empresa (ng-select)
- [ ] Garantir `aria-expanded` apenas em elementos compatíveis (dropdown profile)
- [ ] Incluir landmark principal (`<main>`) e um `h1` na pagina
- [ ] Adicionar labels unicos para landmarks de navegacao (navbar e sidebar)
- [ ] Reforcar hierarquia no mobile (CTA primario mais destacado e espacamento vertical maior)
- [ ] Incluir texto/tooltip para icones de acao no mobile (Editar/Excluir)
- [ ] Reforcar contraste de textos secundarios no tema escuro (CNPJ/UF)

---

**Pronto para QA (se aplicavel)**
