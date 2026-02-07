# Dev Handoff: Table Responsive - Cards Mobile (4 telas adicionais)

**Data:** 2026-02-07  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [/docs/business-rules/listas-table-responsive-cards-mobile.md](../../../business-rules/listas-table-responsive-cards-mobile.md)  
**Business Analyst Handoff:** [business-v1.md](business-v1.md)

---

## 1️⃣ Escopo Implementado

Implementado padrão table-responsive → mobile-cards em 4 telas complexas:

### Empresas Form (2 tabelas)
- Histórico de períodos de mentoria
- Usuários associados

### Diagnóstico Evolução (1 tabela)
- Médias por pilar com última atualização

### Matriz Processos (1 tabela)
- Processos prioritários com status mapeamento/treinamento

### Matriz Cargos e Funções (2 tabelas)
- Cargos e responsáveis
- Funções por cargo (com médias no footer)

Total: **6 tabelas** em **4 telas** implementadas

---

## 2️⃣ Arquivos Criados/Alterados

### Frontend HTML
- [empresas-form.component.html](../../../src/app/views/pages/empresas/empresas-form/empresas-form.component.html#L350-L580)
  - Histórico de períodos: desktop-table + mobile-cards com período, datas, contratação, encerramento
  - Usuários: desktop-table + mobile-cards com nome, cargo, telefone, perfil, ações

- [diagnostico-evolucao.component.html](../../../src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.html#L27-L72)
  - Médias: desktop-table + mobile-cards com pilar, média atual, última atualização

- [matriz-processos.component.html](../../../src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.html#L7-L100)
  - Processos: desktop-table + mobile-cards com rotina, criticidade, nota, status (mapeamento + treinamento)

- [matriz-cargos-funcoes.component.html](../../../src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.html#L23-L200)
  - Cargos: desktop-table + mobile-cards com cargo, responsáveis, ações
  - Funções: desktop-table + mobile-cards com descrição, criticidade, avaliações, desvio, ações (+ médias em card separado)

### Frontend SCSS
- [empresas-form.component.scss](../../../src/app/views/pages/empresas/empresas-form/empresas-form.component.scss)
  - Adicionado desktop-table/mobile-cards toggle + estilos .periodo-card, .usuario-card

- [diagnostico-evolucao.component.scss](../../../src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.scss)
  - Adicionado desktop-table/mobile-cards toggle + estilos .media-card

- [matriz-processos.component.scss](../../../src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.scss)
  - Adicionado desktop-table/mobile-cards toggle + estilos .processo-card

- [matriz-cargos-funcoes.component.scss](../../../src/app/views/pages/cockpit-pilares/matriz-cargos-funcoes/matriz-cargos-funcoes.component.scss)
  - Adicionado desktop-table/mobile-cards toggle + estilos .cargo-card, .funcao-card

---

## 3️⃣ Decisões Técnicas

**Padrão Responsivo Consolidado:**
```scss
.desktop-table { display: block; }
.mobile-cards { display: none; }

@media (max-width: 768px) {
  .desktop-table { display: none; }
  .mobile-cards { display: block; }
}
```

**Cards Mobile - Estrutura Padrão:**
- Título principal com ícones/badges relevantes
- `.meta-row` para cada campo: label + valor
- Ações em botões `btn-outline-*` na parte inferior
- Border, shadow e padding consistentes

**Casos Especiais Implementados:**

1. **Empresas Form - Histórico Mentoria:**
   - Card exibe número do período, datas formatadas (início/fim), contratação e encerramento
   - Badge indica status ativo/inativo

2. **Empresas Form - Usuários:**
   - Card exibe nome, cargo, telefone, perfil
   - Ação de desassociação apenas se não for perfil cliente

3. **Diagnóstico Evolução - Médias:**
   - Card utiliza componente `<app-media-badge>` para manter consistência visual
   - Data formatada via método `formatarData()`

4. **Matriz Processos:**
   - Card inclui ng-select para status mapeamento/treinamento
   - IDs únicos para ng-select mobile (`-mobile-` prefix)
   - Criticidade e nota com badges coloridos preservados

5. **Matriz Cargos e Funções:**
   - Cargos: drag handle visível, responsáveis em flex wrap
   - Funções: avaliações em destaque (fs-4 fw-bold), desvio colorido, médias em card separado no mobile

**Preservação de Funcionalidades:**
- Drag and drop (cdkDrag) mantido em tabelas desktop
- ng-select bindings preservados
- Todas ações (editar, deletar, fluxograma) funcionais em ambos formatos
- i18n keys mantidas

---

## 4️⃣ Auto-Validação de Padrões

### Backend
- [x] Nenhuma alteração backend necessária

### Frontend
- [x] Naming conventions seguidas (kebab-case files, camelCase classes)
- [x] Estrutura de pastas mantida
- [x] Control flow moderno (@if, @for) utilizado
- [x] Translations preservadas ({{ 'KEY' | translate }})
- [x] Standalone components mantidos
- [x] Responsive pattern consistente (768px breakpoint)

**Violações encontradas durante auto-validação:**
- Nenhuma violação encontrada

---

## 5️⃣ Ambiguidades e TODOs

- Nenhuma ambiguidade identificada
- Todas as telas implementadas seguem o mesmo padrão estabelecido previamente

---

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos sugeridos:**
- Verificar toggle desktop/mobile em 768px para cada tela
- Confirmar que cards exibem todas informações da tabela
- Validar que ações (editar, deletar, ng-select) funcionam em mobile
- Testar drag and drop apenas em desktop (cargos, funções)
- Verificar que médias aparecem no card separado (funções mobile)

**Navegadores/Dispositivos prioritários:**
- Chrome/Edge DevTools (responsive mode 375px, 768px, 1024px)
- Safari iOS (real device)
- Chrome Android (real device)

---

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [RN-001] Desktop (>768px): tabela completa - ✅ Implementado
- [RN-002] Mobile (<=768px): cards sem scroll horizontal - ✅ Implementado
- [RN-003] Equivalência funcional tabela/cards - ✅ Implementado
- [RN-004] Manter todas ações disponíveis - ✅ Implementado
- [RN-005] Textos com i18n - ✅ Implementado

**Escopo da Regra:**
- Empresas Form: ✅ 2 tabelas implementadas
- Diagnóstico Evolução: ✅ 1 tabela implementada
- Matriz Processos: ✅ 1 tabela implementada
- Matriz Cargos/Funções: ✅ 2 tabelas implementadas

---

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** Validar comportamento responsivo em 768px para:
  - Períodos de mentoria (histórico)
  - Usuários associados em empresas
  - Médias por pilar (diagnóstico)
  - Processos prioritários (matriz)
  - Cargos, funções e médias (matriz cargos/funções)
- **Prioridade de testes:** ng-select em mobile (matriz processos), drag and drop desktop only, médias em card separado (funções mobile)

---

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- ng-select em cards mobile pode ter comportamento diferente (IDs únicos criados para evitar conflito)
- Drag and drop em mobile pode gerar confusão (mantido apenas tabela desktop conforme padrão)
- Médias em card separado (funções) pode não ser intuitivo - aguardar feedback UX

**Dependências externas:**
- Bootstrap 5 grid/breakpoints
- ng-select library
- Angular CDK drag-drop

**Mitigações:**
- IDs únicos para ng-select mobile (`-mobile-` suffix)
- Drag handles visíveis apenas desktop
- Médias destacadas visualmente no card mobile

---

## 🎯 Completude da Feature

**Telas Implementadas (Total):**
- ✅ empresas-list (handoff anterior)
- ✅ empresas-form (2 tabelas)
- ✅ usuarios-list (handoff anterior)
- ✅ rotinas-list (handoff anterior)
- ✅ pilares-list (handoff anterior)
- ✅ objetivos-templates-list (handoff anterior)
- ✅ indicadores-templates-list (handoff anterior)
- ✅ diagnostico-evolucao
- ✅ matriz-processos
- ✅ matriz-cargos-funcoes (2 tabelas)

**Telas Restantes (conforme business rule):**
- ⏸️ gestao-indicadores (cockpit-pilares)
- ⏸️ edicao-valores-mensais (cockpit-pilares)
- ⏸️ plano-acao-especifico (cockpit-pilares)

**Nota:** Telas restantes serão implementadas em handoff separado conforme solicitação do usuário ("vamos fazendo aos poucos").

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
