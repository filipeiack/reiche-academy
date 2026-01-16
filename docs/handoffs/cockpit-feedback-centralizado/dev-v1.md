# Dev Handoff: Centralização de Feedback de Salvamento no Cockpit

**Data:** 2026-01-16  
**Implementador:** Dev Agent  
**Regras Base:** 
- `/docs/conventions/frontend.md`
- `/docs/architecture/frontend.md`

---

## 1. Escopo Implementado

- ✅ Criado serviço centralizado `SaveFeedbackService` para gerenciar feedback de salvamento
- ✅ Centralizado feedback de salvamento no elemento `#feedbackSaveCockpit` do cockpit-dashboard
- ✅ Adicionado contexto descritivo às mensagens de salvamento
- ✅ Removido feedback duplicado de componentes filhos:
  - `edicao-valores-mensais`
  - `matriz-processos`
  - Aba de contexto no cockpit-dashboard
- ✅ Mantido feedback inline no `gestao-indicadores` (por ser específico de cada linha)

---

## 2. Arquivos Criados/Alterados

### Serviços
- `frontend/src/app/core/services/save-feedback.service.ts` - **CRIADO**
  - Serviço singleton compartilhado via `providedIn: 'root'`
  - Interface `SaveFeedback` com propriedades: `context`, `saving`, `lastSaveTime`
  - Métodos: `startSaving()`, `completeSaving()`, `reset()`
  - Observable `feedback$` para comunicação com componentes

### Componentes

#### Cockpit Dashboard
- `frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.ts`
  - Injetado `SaveFeedbackService`
  - Adicionada subscription ao `feedback$`
  - Removidas variáveis locais: `savingContexto`, `lastSaveTime`
  - Adicionada variável `saveFeedback: SaveFeedback`
  - Método `saveContexto()` agora usa `saveFeedbackService.startSaving('Contexto do pilar')`
  - Cleanup no `ngOnDestroy()`

- `frontend/src/app/views/pages/cockpit-pilares/cockpit-dashboard/cockpit-dashboard.component.html`
  - Atualizado elemento `#feedbackSaveCockpit` para exibir contexto: "Salvando {{ saveFeedback.context }}..."
  - Removido bloco de feedback duplicado da aba "Contexto"

#### Edição de Valores Mensais
- `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts`
  - Injetado `SaveFeedbackService`
  - Removidas variáveis públicas: `savingCount`, `lastSaveTime` (mantido `savingCount` como private)
  - Método `executeSave()` chama `startSaving('Valores mensais')` quando `savingCount === 1`
  - `completeSaving()` chamado quando `savingCount === 0`
  - Tratamento de erro chama `reset()`

- `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html`
  - **REMOVIDO** bloco completo de feedback de salvamento

#### Matriz de Processos
- `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.ts`
  - Injetado `SaveFeedbackService`
  - Removidas variáveis públicas: `savingCount`, `lastSaveTime` (mantido `savingCount` como private)
  - Método `saveStatus()` chama `startSaving('Status de processos')` quando `savingCount === 1`
  - `completeSaving()` chamado quando `savingCount === 0`
  - Tratamento de erro chama `reset()`

- `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/matriz-processos.component.html`
  - **REMOVIDO** bloco completo de feedback de salvamento

---

## 3. Decisões Técnicas

### 3.1. Padrão de Comunicação
- Optado por **Observable pattern** via `BehaviorSubject`
- Permite múltiplos componentes comunicarem feedback para um único ponto de exibição
- Dashbord se subscreve e exibe automaticamente

### 3.2. Contexto Descritivo
Cada componente filho identifica o que está salvando:
- `"Contexto do pilar"` - quando edita entradas/saídas/missão
- `"Valores mensais"` - quando edita meta/realizado de indicadores
- `"Status de processos"` - quando altera status de processos prioritários

### 3.3. Controle de savingCount
- Mantido contador local (`private savingCount`) em cada componente
- Notifica serviço centralizado apenas quando:
  - `savingCount === 1` → inicia feedback
  - `savingCount === 0` → completa feedback
- Evita conflito quando múltiplas requisições simultâneas

### 3.4. Feedback Inline Preservado
- `gestao-indicadores` mantém feedback inline (spinner/check/erro por linha)
- Razão: feedback específico de cada indicador, não global
- Não conflita com feedback centralizado

---

## 4. Ambiguidades e TODOs

- [ ] **Conflito potencial:** Se usuário editar contexto + valores mensais simultaneamente, qual contexto exibir?
  - Solução atual: última operação sobrescreve
  - Possível melhoria: fila de contextos ou contagem agregada
  
- [ ] **UX:** Considerar timeout automático para limpar mensagem "Salvo em HH:mm:ss" após X segundos
  
- [ ] **Erro handling:** Atualmente, erro apenas reseta feedback. Considerar exibir mensagem de erro específica

---

## 5. Testes de Suporte

Nenhum teste automatizado criado nesta implementação (responsabilidade do QA Unitário).

**Testes manuais recomendados:**
1. Editar contexto (entradas/saídas/missão) → verificar feedback "Contexto do pilar"
2. Editar valores mensais → verificar feedback "Valores mensais"
3. Alterar status de processos → verificar feedback "Status de processos"
4. Trocar rapidamente entre abas enquanto salva → verificar transições
5. Simular erro de rede → verificar reset de feedback

---

## 6. Status para Próximo Agente

✅ **Pronto para:** Pattern Enforcer

**Atenção - Pattern Enforcer deve validar:**
- Nomenclatura do serviço segue padrão `*.service.ts`
- Injeção via `inject()` (não constructor DI)
- Uso de `providedIn: 'root'`
- Cleanup correto de subscriptions em `ngOnDestroy()`
- Template syntax (control flow `@if/@else`)
- Imports standalone components

**Não aplicável nesta feature:**
- Backend changes (apenas frontend)
- Testes unitários (QA Unitário)
- E2E (QA E2E)

---

**Handoff criado automaticamente pelo Dev Agent**
