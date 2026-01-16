# ADR-006: Arquitetura de Componentes da Matriz de Indicadores

**Status:** ✅ Aprovado  
**Data:** 2026-01-15  
**Autor:** System Engineer  
**Decisores:** Product Owner, System Engineer  
**Substitui:** Parcialmente ADR-005 (especificação de implementação)  
**Relacionado:** ADR-005 (UX Excel-like)

---

## Contexto

### Erro de Validação (Autocrítica)

Como **System Engineer**, falhei em seguir o princípio fundamental:

> "Documentos mandam, agentes obedecem"

**Erro cometido:**
1. Criei **ADR-005** especificando componente `matriz-indicadores` com UX Excel-like para CRUD de indicadores
2. **NÃO validei** se componente já existia no código antes de documentar
3. Instruí **Dev Agent** a implementar sem verificar código existente
4. Dev Agent descobriu implementação existente **com propósito diferente**

**Resultado:**
- ADR-005 especificava CRUD de indicadores (setup inicial)
- Código existente implementava edição de valores mensais (acompanhamento)
- **Bloqueio de implementação** até decisão arquitetural

### Lições Aprendidas

**Princípio violado:**
> System Engineer deve validar código existente ANTES de criar especificações

**Correção aplicada:**
- Análise de código existente (handoff dev-v1-analise.md)
- Documentação retroativa desta decisão (ADR-006)
- Atualização de processo (adicionar checklist pré-ADR)

---

## Situação Encontrada

### Código Existente: Matriz de Valores Mensais

**Localização:** `frontend/src/app/views/pages/cockpit-pilares/matriz-indicadores/`

**Funcionalidade atual:**
- Edição de valores mensais (meta/realizado) para indicadores **já criados**
- Grid com 12 meses (Jan-Dez) + 2 campos por mês
- Auto-save com debounce 1000ms (correto, padrão do projeto)
- Cálculo de desvios (realizado vs meta)
- Status visual (success/warning/danger)
- Placeholders para CRUD: `novoIndicador()`, `editarIndicador()`, `excluirIndicador()` (TODO)

**Propósito:** Passo 2 do workflow (Acompanhamento Mensal)

### Especificação ADR-005: CRUD de Indicadores

**Funcionalidade especificada:**
- CRUD completo de indicadores (criar/editar/excluir)
- Grid Excel-like inline para setup inicial
- Drag & drop para reordenar
- 6 campos por indicador (nome, tipo, status, responsável, melhor, descrição)
- Auto-save com debounce 1000ms

**Propósito:** Passo 1 do workflow (Setup Inicial)

### Análise de Divergência

| Aspecto | Código Existente | ADR-005 Especificado |
|---------|------------------|----------------------|
| **Entidade** | `IndicadorMensal` | `IndicadorCockpit` |
| **Workflow** | Passo 2: Acompanhamento | Passo 1: Setup |
| **Ações** | Editar valores (meta/realizado) | CRUD (criar/editar/excluir indicadores) |
| **Campos editados** | 2 campos × 12 meses = 24 inputs | 6 campos × N indicadores |
| **Status** | ✅ Implementado (220 linhas) | ❌ Não implementado |

**Conclusão:** Duas funcionalidades **complementares**, não conflitantes.

---

## Decisão

Implementar **Arquitetura de Componentes Separados** (Opção 1 do handoff):

### Estrutura Final

```
frontend/src/app/views/pages/cockpit-pilares/
├── matriz-indicadores/                        # ← Container (tela principal)
│   ├── matriz-indicadores.component.ts       # ← Existente (renomeado internamente)
│   ├── matriz-indicadores.component.html     # ← Atualizado (tabs/sections)
│   └── matriz-indicadores.component.scss     # ← Atualizado
├── gestao-indicadores/                        # ← NOVO (ADR-005)
│   ├── gestao-indicadores.component.ts       # ← CRUD inline Excel-like
│   ├── gestao-indicadores.component.html
│   ├── gestao-indicadores.component.scss
│   └── gestao-indicadores.component.spec.ts
├── edicao-valores-mensais/                    # ← NOVO (código movido)
│   ├── edicao-valores-mensais.component.ts   # ← Código atual migrado
│   ├── edicao-valores-mensais.component.html
│   ├── edicao-valores-mensais.component.scss
│   └── edicao-valores-mensais.component.spec.ts
└── modals/
    ├── descricao-indicador-modal/
    └── indicador-mobile-modal/
```

### Fluxo de Componentes

```
MatrizIndicadoresComponent (Container)
├─ <app-gestao-indicadores>           ← Seção 1: Setup (CRUD)
│  └─ Implementa ADR-005
│     - Adicionar indicadores
│     - Editar propriedades
│     - Reordenar (drag & drop)
│     - Remover indicadores
│
└─ <app-edicao-valores-mensais>       ← Seção 2: Acompanhamento
   └─ Código existente preservado
      - Editar meta/realizado por mês
      - Calcular desvios
      - Status visual
```

### UX da Tela Unificada

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Matriz de Indicadores                                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📊 Gestão de Indicadores                               │
│  ┌────────────────────────────────────────────────────┐ │
│  │ + Nova Linha                                       │ │
│  │ ──────────────────────────────────────────────────│ │
│  │ [Grid Excel-like - CRUD inline]                   │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  📈 Edição de Valores Mensais                           │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [Grid de meses - Meta/Realizado]                  │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Alternativas de navegação:**
1. **Seções sequenciais** (sem tabs) — ✅ ESCOLHIDA
   - Gestão de Indicadores sempre visível no topo
   - Edição de Valores logo abaixo
   - Scroll natural entre seções

2. **Tabs Bootstrap** (alternativa)
   - Tab 1: Gestão de Indicadores
   - Tab 2: Valores Mensais

**Justificativa:** Seções sequenciais permitem contexto completo (ver indicadores + valores sem troca de tabs).

---

## Especificação de Migração

### Fase 1: Refatoração do Código Existente

**Criar:** `edicao-valores-mensais.component.ts`

```typescript
// Copiar TODO o código de matriz-indicadores.component.ts
// Renomear selector: 'app-edicao-valores-mensais'
// Manter TODAS as funcionalidades:
// - loadIndicadores()
// - onValorChange()
// - executeSave()
// - calcularDesvio()
// - calcularStatus()
// - setupAutoSave()
```

**Remover:** Métodos placeholder do código atual:
- `novoIndicador()` (será implementado em gestao-indicadores)
- `editarIndicador()` (será implementado em gestao-indicadores)
- `excluirIndicador()` (será implementado em gestao-indicadores)

**Resultado:** Componente focado APENAS em edição de valores mensais.

---

### Fase 2: Criar Gestão de Indicadores

**Criar:** `gestao-indicadores.component.ts`

**Seguir:** ADR-005 completo (950+ linhas de especificação)

**Funcionalidades:**
- `addNewRow()` → Adicionar indicador vazio
- `enableEdit()` / `disableEdit()` → Controle de edição inline
- `saveIndicador()` → CREATE/UPDATE de `IndicadorCockpit`
- `deleteIndicador()` → Remover indicador (cascade delete de meses)
- `onDrop()` → Reordenar via drag & drop
- `onKeyDown()` → Navegação Tab/Enter (Excel-like)
- `openDescricaoModal()` → Modal para descrição longa

**Output esperado:**
- Evento `@Output() indicadorCriado: EventEmitter<IndicadorCockpit>`
- Evento `@Output() indicadorRemovido: EventEmitter<string>`

---

### Fase 3: Atualizar Container (Matriz-Indicadores)

**Atualizar:** `matriz-indicadores.component.ts`

```typescript
@Component({
  selector: 'app-matriz-indicadores',
  standalone: true,
  imports: [
    CommonModule,
    GestaoIndicadoresComponent,       // ← NOVO
    EdicaoValoresMensaisComponent,    // ← Código migrado
  ],
  templateUrl: './matriz-indicadores.component.html',
  styleUrl: './matriz-indicadores.component.scss',
})
export class MatrizIndicadoresComponent implements OnInit {
  @Input() cockpitId!: string;

  // Coordenar recarregamento entre componentes
  onIndicadorCriado(indicador: IndicadorCockpit) {
    // Recarregar edicao-valores-mensais para incluir novo indicador
    this.reloadValoresMensais();
  }

  onIndicadorRemovido(indicadorId: string) {
    // Recarregar edicao-valores-mensais para remover indicador
    this.reloadValoresMensais();
  }

  private reloadValoresMensais() {
    // ViewChild para acessar componente filho
    // Chamar método de reload
  }
}
```

**Template:** `matriz-indicadores.component.html`

```html
<div class="card">
  <div class="card-body">
    <h5 class="card-title mb-4">
      <i class="bi bi-bar-chart me-2"></i>
      Matriz de Indicadores
    </h5>

    <!-- Seção 1: Gestão de Indicadores -->
    <div class="section-gestao mb-5">
      <h6 class="section-title">
        <i class="bi bi-gear me-2"></i>
        Gestão de Indicadores
      </h6>
      <app-gestao-indicadores
        [cockpitId]="cockpitId"
        (indicadorCriado)="onIndicadorCriado($event)"
        (indicadorRemovido)="onIndicadorRemovido($event)">
      </app-gestao-indicadores>
    </div>

    <!-- Seção 2: Edição de Valores Mensais -->
    <div class="section-valores">
      <h6 class="section-title">
        <i class="bi bi-calendar-range me-2"></i>
        Edição de Valores Mensais
      </h6>
      <app-edicao-valores-mensais
        #valoresMensais
        [cockpitId]="cockpitId">
      </app-edicao-valores-mensais>
    </div>
  </div>
</div>
```

---

## Responsabilidades dos Componentes

### Container: matriz-indicadores

**Responsabilidade:** Coordenação e layout

✅ **Pode fazer:**
- Receber `cockpitId` como Input
- Renderizar sub-componentes
- Coordenar reload entre componentes
- Aplicar estilos de layout (sections)

❌ **Não pode fazer:**
- Lógica de CRUD de indicadores
- Lógica de edição de valores
- Chamadas diretas ao service (delegado aos filhos)

---

### gestao-indicadores

**Responsabilidade:** CRUD de IndicadorCockpit (ADR-005)

✅ **Pode fazer:**
- Criar indicador (POST /cockpits/:id/indicadores)
- Editar indicador (PATCH /indicadores/:id)
- Remover indicador (DELETE /indicadores/:id)
- Reordenar indicadores (PATCH /cockpits/:id/indicadores/ordem)
- Auto-save inline com debounce 1000ms
- Drag & drop para reordenar
- Navegação Tab/Enter
- Emitir eventos `@Output()` ao criar/remover

❌ **Não pode fazer:**
- Editar valores mensais (meta/realizado)
- Calcular desvios
- Exibir gráficos

---

### edicao-valores-mensais

**Responsabilidade:** Edição de IndicadorMensal

✅ **Pode fazer:**
- Carregar indicadores do cockpit
- Editar meta/realizado por mês (PATCH /indicadores-mensais/:id)
- Calcular desvios (realizado vs meta)
- Exibir status visual (success/warning/danger)
- Auto-save com debounce 1000ms
- Método público `reload()` para refresh forçado

❌ **Não pode fazer:**
- Criar/remover indicadores
- Editar propriedades do indicador (nome, tipo, etc)
- Reordenar indicadores

---

## Comunicação Entre Componentes

```
MatrizIndicadoresComponent (Container)
│
├─ [cockpitId] ────────────────────┬──────────────────────┐
│                                   │                       │
│                                   ▼                       ▼
│                         GestaoIndicadoresComponent   EdicaoValoresMensaisComponent
│                                   │                       
│                                   │ (indicadorCriado)
│  onIndicadorCriado() ◄────────────┤
│         │                         │ (indicadorRemovido)
│         │ reloadValoresMensais()  │
│         └─────────────────────────┼──────► reload()
│                                   
```

**Fluxo:**
1. Usuário cria indicador em `gestao-indicadores`
2. Componente emite `@Output() indicadorCriado`
3. Container recebe evento e chama `valoresMensais.reload()`
4. `edicao-valores-mensais` recarrega lista (inclui novo indicador)

---

## Endpoints Backend (Não Alterado)

Os endpoints permanecem conforme especificado em ADR-005:

| Endpoint | Método | Responsável |
|----------|--------|-------------|
| `POST /cockpits/:id/indicadores` | POST | gestao-indicadores |
| `PATCH /indicadores/:id` | PATCH | gestao-indicadores |
| `DELETE /indicadores/:id` | DELETE | gestao-indicadores |
| `PATCH /cockpits/:id/indicadores/ordem` | PATCH | gestao-indicadores |
| `PATCH /indicadores-mensais/:id` | PATCH | edicao-valores-mensais |

---

## Testes

### Testes Unitários

**gestao-indicadores.component.spec.ts:**
- [ ] Adicionar nova linha (cria indicador vazio)
- [ ] Editar inline com auto-save (debounce 1000ms)
- [ ] Validação de campos obrigatórios
- [ ] Remover com confirmação
- [ ] Drag & drop (reordenar)
- [ ] Navegação Tab/Enter
- [ ] Emissão de eventos `@Output()`

**edicao-valores-mensais.component.spec.ts:**
- [ ] Carregar indicadores
- [ ] Editar meta/realizado com auto-save
- [ ] Cálculo de desvios
- [ ] Status visual (success/warning/danger)
- [ ] Método `reload()` público

**matriz-indicadores.component.spec.ts:**
- [ ] Renderizar sub-componentes
- [ ] Recarregar valores após criar indicador
- [ ] Recarregar valores após remover indicador

### Testes de Integração

- [ ] Criar indicador → Aparece em edição de valores
- [ ] Remover indicador → Desaparece de edição de valores
- [ ] Reordenar indicadores → Ordem reflete em edição de valores

### Testes E2E

- [ ] Fluxo completo: Criar 3 indicadores → Editar valores mensais → Ver gráficos
- [ ] Mobile: Cards + modals funcionam corretamente
- [ ] Validação RBAC (ADMINISTRADOR/GESTOR pode editar)

---

## Impacto em Documentação

### Documentos a Atualizar

1. **ADR-005** (UX Excel-like):
   - Adicionar seção "Implementação" referenciando ADR-006
   - Atualizar estrutura de arquivos
   - Manter especificação técnica completa (válida para `gestao-indicadores`)

2. **`/docs/business-rules/cockpit-pilares.md`**:
   - Adicionar workflow de telas:
     ```
     Workflow de Cockpit:
     1. Criar Cockpit para Pilar
     2. [Matriz de Indicadores] → Gestão (CRUD) + Valores Mensais
        a. Gestão: Adicionar/editar/remover indicadores
        b. Valores: Preencher meta/realizado por mês
     3. Visualizar Gráficos
     ```

3. **`/docs/conventions/cockpit-pilares-frontend.md`**:
   - Atualizar seção de componentes:
     - Container: matriz-indicadores
     - CRUD: gestao-indicadores (ADR-005)
     - Valores: edicao-valores-mensais (código migrado)

4. **`/docs/architecture/frontend.md`**:
   - Adicionar padrão "Container + Sub-componentes Especializados"
   - Exemplo: Matriz de Indicadores

---

## Checklist de Implementação (Dev Agent)

### ✅ Fase 1: Migração do Código Existente (3h)
- [ ] Criar `edicao-valores-mensais/` (copiar código atual)
- [ ] Renomear selector e imports
- [ ] Remover métodos placeholder (`novoIndicador`, `editarIndicador`, `excluirIndicador`)
- [ ] Adicionar método `reload()` público
- [ ] Criar testes unitários (migrar de matriz-indicadores.spec.ts)
- [ ] Validar funcionalidade (auto-save, cálculos, status)

### ✅ Fase 2: Implementação de Gestão (8h)
- [ ] Criar `gestao-indicadores/` conforme ADR-005
- [ ] Implementar CRUD inline (addNewRow, enableEdit, saveIndicador, deleteIndicador)
- [ ] Implementar auto-save com debounce 1000ms
- [ ] Implementar drag & drop (CDK Drag Drop)
- [ ] Implementar navegação Tab/Enter
- [ ] Criar modais (descricao-indicador-modal, indicador-mobile-modal)
- [ ] Implementar `@Output()` eventos (indicadorCriado, indicadorRemovido)
- [ ] Criar testes unitários (cobertura > 80%)

### ✅ Fase 3: Atualização do Container (2h)
- [ ] Atualizar `matriz-indicadores.component.ts` (coordenação)
- [ ] Atualizar `matriz-indicadores.component.html` (seções)
- [ ] Implementar `onIndicadorCriado()` e `onIndicadorRemovido()`
- [ ] Implementar `reloadValoresMensais()` via ViewChild
- [ ] Atualizar estilos (sections, títulos)
- [ ] Criar testes de integração

### ✅ Fase 4: Validação e Testes (3h)
- [ ] Testes unitários completos (3 componentes)
- [ ] Testes de integração (comunicação entre componentes)
- [ ] Testes E2E (fluxo completo)
- [ ] Validação manual desktop + mobile
- [ ] Pattern Enforcer valida padrões

### ✅ Fase 5: Documentação (1h)
- [ ] Criar handoff `dev-v2-implementacao.md`
- [ ] Atualizar ADR-005 (referência a ADR-006)
- [ ] Atualizar `/docs/business-rules/cockpit-pilares.md`
- [ ] Atualizar `/docs/conventions/cockpit-pilares-frontend.md`

**Estimativa total:** 17h (2 dias úteis)

---

## Consequências

### Positivas

✅ **Código existente preservado:** Nenhuma funcionalidade perdida  
✅ **Separação de responsabilidades:** CRUD vs Edição de Valores (Single Responsibility Principle)  
✅ **Manutenibilidade:** Componentes focados, fácil de testar  
✅ **Reusabilidade:** `gestao-indicadores` pode ser usado em outros contextos  
✅ **UX completa:** Gestão + Valores na mesma tela (contexto visual)  
✅ **ADR-005 mantido:** Especificação técnica permanece válida  

### Negativas

⚠️ **Complexidade adicional:** 3 componentes vs 1 (mais arquivos)  
⚠️ **Comunicação entre componentes:** Eventos `@Output()` + ViewChild  
⚠️ **Migração de código:** Refatoração do existente (risco de regressão)  
⚠️ **Mais testes:** 3 specs + testes de integração  

### Riscos Mitigados

✅ **Perda de funcionalidade:** Código migrado, não reescrito  
✅ **Conflito de nomes:** `edicao-valores-mensais` é explícito  
✅ **Regressão:** Testes unitários garantem comportamento original  

---

## Alternativas Rejeitadas

### Opção 2: Renomear Existente (Rejected)

```
matriz-indicadores → edicao-valores-mensais (rename)
matriz-indicadores ← novo (ADR-005)
```

**Rejeitada porque:**
- Quebra histórico Git (rename massivo)
- Pode quebrar referências existentes (imports, routing)
- Mais invasivo que criar novo componente

### Opção 3: Tabs/Views (Rejected)

```
cockpit-dashboard/
  tabs/
    gestao-indicadores/
    edicao-valores/
```

**Rejeitada porque:**
- Usuário perde contexto ao trocar tabs
- Over-engineering para 2 componentes simples
- Seções sequenciais são mais intuitivas (Excel mental model)

---

## Retroação (System Engineer Self-Review)

### Erro Cometido

❌ Violei princípio: "Sempre validar código antes de especificar"

### Processo Corrigido

**Novo checklist pré-ADR:**
- [ ] Grep search por nome do componente
- [ ] File search por estrutura relacionada
- [ ] Ler código existente (se houver)
- [ ] Documentar estado atual vs proposta
- [ ] Justificar criação vs refatoração

### Lição Aprendida

> "System Engineer não tem autoridade implícita para SOBRESCREVER código.  
> Apenas para PROPOR mudanças após validação completa."

**Ação corretiva aplicada:** Este ADR-006 documenta decisão pós-análise.

---

## Aprovação e Próximos Passos

**Decisão aprovada em:** 2026-01-15  
**Aprovador:** Product Owner  
**Implementador:** Dev Agent  

**Próximos passos:**
1. Dev Agent implementa Fase 1 (migração código existente)
2. Dev Agent implementa Fase 2 (gestao-indicadores ADR-005)
3. Dev Agent implementa Fase 3 (atualização container)
4. Pattern Enforcer valida padrões
5. QA Unitário testa componentes
6. Merge após todos os checks passarem

---

**Referências:**
- ADR-005: UX Excel-like para Indicadores
- Handoff: `/docs/handoffs/cockpit-pilares/dev-v1-analise.md`
- Código existente: `frontend/src/app/views/pages/cockpit-pilares/matriz-indicadores/`
- Business Rules: `/docs/business-rules/cockpit-pilares.md`
