# Dev Handoff: PilaresEmpresa — Criação Local no empresas-form

**Data:** 2026-02-03  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:**
- [docs/business-rules/pilares-empresa-criacao-local.md](../../business-rules/pilares-empresa-criacao-local.md)
- [docs/business-rules/pilares-empresa.md](../../business-rules/pilares-empresa.md)

---

## 1️⃣ Escopo Implementado

- Ajuste no empresas-form para **não** criar pilares globais ao usar “add tag”.
- Criação local passa a gerar apenas `PilarEmpresa` via `PilaresEmpresaService`.

## 2️⃣ Arquivos Criados/Alterados

### Frontend
- frontend/src/app/views/pages/empresas/empresas-form/empresas-form.component.ts — criação de pilar customizado via `PilaresEmpresaService`.

## 3️⃣ Decisões Técnicas

- `addPilarTag` retorna item customizado apenas para seleção local.
- `associarPilar` detecta item customizado e chama `criarPilarCustomizado`.
- Bloqueio de criação caso não exista empresa definida.

## 4️⃣ Auto-Validação de Padrões

### Frontend
- [x] Standalone components
- [x] inject() function usado
- [x] Control flow moderno
- [x] Translations aplicadas (texto existente em pt-BR conforme padrão da tela)
- [x] ReactiveForms
- [x] Error handling (SweetAlert2)

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Caso seja necessário permitir criação de pilar antes da empresa existir, definir fluxo (hoje bloqueado).

## 6️⃣ Testes de Suporte

- Não aplicável.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Criação no empresas-form grava apenas `PilarEmpresa`.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar que nenhum `Pilar` global é criado via empresas-form.

## 9️⃣ Riscos Identificados

- Dependência de `empresaId` para criação customizada.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
