# Dev Handoff: Cockpit de Pilares — Decisão Arquitetural

**Data:** 2026-01-15  
**Implementador:** Dev Agent  
**Contexto:** Análise de código existente vs ADR-005 (UX Excel-like)  
**Status:**  **✅ DECISÃO TOMADA** — Implementar Opção 1 (componente separado)

---

## ⚠️ Resolução da Divergência

**Decisão aprovada pelo Product Owner:**

→ **Opção 1: Criar `gestao-indicadores` separado (preservando código existente)**

**Arquitetura final documentada em:**
→ **[ADR-006: Arquitetura de Componentes da Matriz de Indicadores](../adr/ADR-006-arquitetura-matriz-indicadores.md)**

---

## 1 Objetivo da Tarefa

Implementar componente `matriz-indicadores` seguindo **ADR-005: UX Excel-like para Indicadores do Cockpit**.

**Especificação:** `/docs/adr/ADR-005-ux-excel-like-indicadores.md`  
**Convenções:** `/docs/conventions/matriz-indicadores-excel-like.md`

---

## 2 Situação Encontrada

### 2.1 Implementação Existente

Ao acessar o diretório do projeto, encontrei **implementação parcial** do módulo Cockpit de Pilares já existente:

```
frontend/src/app/views/pages/cockpit-pilares/
├── matriz-indicadores/
│   ├── matriz-indicadores.component.ts       # ✅ EXISTE (220 linhas)
│   ├── matriz-indicadores.component.html     # ✅ EXISTE
│   ├── matriz-indicadores.component.scss     # ✅ EXISTE
│   └── matriz-indicadores.component.spec.ts  # ✅ EXISTE
```

### 2.2 Funcionalidade Atual vs ADR-005

| Aspecto | Implementação Atual | ADR-005 Especificado |
|---------|---------------------|----------------------|
| **Propósito** | Edição de valores mensais (meta/realizado) de indicadores JÁ CRIADOS | Criação/edição de INDICADORES (CRUD completo) |
| **UX** | Grid de meses (Jan-Dez) com inputs numéricos | Grid Excel-like editável inline para gerenciar indicadores |
| **Dados editados** | `IndicadorMensal` (meta, realizado por mês) | `IndicadorCockpit` (nome, tipo, responsável, etc) |
| **Funcionalidades** | Auto-save de valores, cálculo de desvios | Drag & drop, navegação Tab, modal descrição, ações CRUD |
| **Campos** | 2 campos por mês (meta, realizado) | 6 campos por indicador (nome, tipo, status, responsável, melhor, descrição) |

### 2.3 Divergência Identificada

**Conclusão:** O componente atual implementa um **caso de uso diferente** do especificado no ADR-005.

- **Atual**: Edita valores mensais de indicadores existentes (passo 2 do workflow)
- **ADR-005**: CRUD de indicadores (passo 1 do workflow)

**Analogia:** É como ter uma tela de "editar produtos" quando o ADR especificava "cadastrar produtos".

---

## 3 Arquivos Criados/Alterados

### 3.1 Estrutura de Diretórios

```
frontend/src/app/views/pages/cockpit-pilares/
├── matriz-indicadores/                        # ✅ JÁ EXISTIA
│   ├── matriz-indicadores.component.ts       # ✅ JÁ EXISTIA (implementação diferente)
│   ├── matriz-indicadores.component.html     # ✅ JÁ EXISTIA
│   ├── matriz-indicadores.component.scss     # ✅ JÁ EXISTIA
│   └── matriz-indicadores.component.spec.ts  # ✅ JÁ EXISTIA
├── modals/
│   ├── descricao-indicador-modal/            # ✅ CRIADO (vazio)
│   └── indicador-mobile-modal/               # ✅ CRIADO (vazio)
```

**Ação tomada:** Criei apenas as pastas dos modais (vazias).

### 3.2 Análise da Implementação Existente

#### matriz-indicadores.component.ts (linhas relevantes)

**Imports:**
```typescript
import { CockpitPilaresService } from '@core/services/cockpit-pilares.service';
import {
  CockpitPilar,
  IndicadorCockpit,
  IndicadorMensal,
  DirecaoIndicador,
  StatusMedicaoIndicador,
} from '@core/interfaces/cockpit-pilares.interface';
```

**Propriedades:**
```typescript
@Input() cockpitId!: string;
indicadores: IndicadorCockpit[] = [];
loading = false;
savingCount = 0;
lastSaveTime: Date | null = null;
```

**Métodos principais:**
- `loadIndicadores()` → Carrega indicadores do backend
- `onValorChange()` → Detecta mudança em meta/realizado de um mês
- `executeSave()` → Salva valores mensais (POST)
- `calcularDesvio()` → Calcula % de desvio
- `calcularStatus()` → Retorna status (success/warning/danger)
- `novoIndicador()` → Placeholder (TODO)
- `editarIndicador()` → Placeholder (TODO)
- `excluirIndicador()` → Placeholder (TODO)

**Auto-save:**
```typescript
private autoSaveSubject = new Subject<{
  indicadorMensalId: string;
  campo: 'meta' | 'realizado';
  valor: number | null;
}>();

this.autoSaveSubject
  .pipe(debounceTime(1000), distinctUntilChanged())
  .subscribe((change) => {
    this.executeSave(change.indicadorMensalId, change.campo, change.valor);
  });
```

**Observação:** Auto-save está correto (1000ms), mas aplicado a valores mensais, não a indicadores.

---

## 4 Decisões Técnicas

### 4.1 Não Sobrescrever Implementação Existente

**Decisão:** NÃO sobrescrever `matriz-indicadores.component.ts` existente.

**Justificativa:**
1. Código atual está funcional para edição de valores mensais
2. Sobrescrever causaria perda de funcionalidade (passo 2 do workflow)
3. ADR-005 especifica funcionalidade DIFERENTE (passo 1 do workflow)

### 4.2 Sugerir Novo Componente

**Proposta:** Criar componente separado para CRUD de indicadores conforme ADR-005.

**Opção 1: Criar `gestao-indicadores.component`**
```
frontend/src/app/views/pages/cockpit-pilares/
├── gestao-indicadores/               # ← NOVO (ADR-005)
│   ├── gestao-indicadores.component.ts
│   ├── gestao-indicadores.component.html
│   └── gestao-indicadores.component.scss
├── matriz-indicadores/               # ← EXISTENTE (valores mensais)
│   └── ...
```

**Opção 2: Renomear existente e criar novo**
```
frontend/src/app/views/pages/cockpit-pilares/
├── edicao-valores-mensais/           # ← RENOMEADO (antiga matriz-indicadores)
│   └── ...
├── matriz-indicadores/               # ← NOVO (ADR-005)
│   └── ...
```

**Opção 3: Componentes combinados (tabs)**
```
frontend/src/app/views/pages/cockpit-pilares/
├── cockpit-dashboard/
│   ├── tabs/
│   │   ├── gestao-indicadores/       # ← Tab 1: CRUD (ADR-005)
│   │   └── edicao-valores/           # ← Tab 2: Valores mensais (existente)
```

---

## 5 Ambiguidades e Bloqueadores

### 5.1 Ambiguidades de Especificação

1. **Workflow não documentado**: Não há especificação clara de quando usar cada componente
   - Passo 1: Criar indicadores (ADR-005)
   - Passo 2: Editar valores mensais (existente)

2. **Nomenclatura confusa**: "Matriz de Indicadores" pode significar:
   - Grid de indicadores (ADR-005)
   - Matriz de valores mensais (atual)

3. **Integração entre componentes**: Como os dois componentes se comunicam?
   - Criar indicador → Redireciona para edição de valores?
   - São views separadas? Tabs?

### 5.2 Bloqueadores Técnicos

 **BLOQUEADOR 1: Conflito de Funcionalidade**
- Componente `matriz-indicadores` já existe com propósito diferente
- Sobrescrever = perder funcionalidade de edição de valores mensais

 **BLOQUEADOR 2: Falta de Especificação de Integração**
- ADR-005 não especifica como componentes se integram
- Não há fluxo documentado em `/docs/FLOW.md` para Cockpit

 **BLOQUEADOR 3: Service e Interfaces Existentes**
- `CockpitPilaresService` já implementado
- Interfaces `IndicadorCockpit` e `IndicadorMensal` já definidas
- Endpoints backend podem já estar implementados

---

## 6 Próximos Passos Recomendados

### 6.1 Análise e Decisão Arquitetural

1. **Revisar especificação**: Product Owner + System Engineer decidem:
   - Renomear componente existente?
   - Criar novo componente separado?
   - Unificar em tabs/views?

2. **Documentar workflow completo** em `/docs/FLOW.md`:
   ```
   Cockpit Workflow:
   1. Criar Cockpit para Pilar
   2. Gerenciar Indicadores (CRUD) ← ADR-005
   3. Editar Valores Mensais ← Existente
   4. Visualizar Gráficos
   ```

3. **Atualizar ADR-005** com:
   - Contexto de implementação parcial existente
   - Decisão sobre nomenclatura de componentes
   - Integração com código existente

### 6.2 Implementação (Após Decisão)

**Se decisão for: Criar componente separado**

```
[ ] Criar gestao-indicadores.component conforme ADR-005
[ ] Manter matriz-indicadores.component para valores mensais
[ ] Criar routing para ambos os componentes
[ ] Documentar integração entre eles
```

**Se decisão for: Renomear existente**

```
[ ] Renomear matriz-indicadores → edicao-valores-mensais
[ ] Criar nova matriz-indicadores conforme ADR-005
[ ] Atualizar imports e referências
[ ] Atualizar routing
```

**Se decisão for: Tabs/Views**

```
[ ] Criar cockpit-dashboard com tabs
[ ] Tab 1: Gestão de Indicadores (ADR-005)
[ ] Tab 2: Edição de Valores (existente)
[ ] Implementar navegação entre tabs
```

---

## 7 Testes de Suporte

Não foram criados testes nesta fase (apenas análise).

**Testes pendentes:**
- [ ] Testes unitários do novo componente (após definição arquitetural)
- [ ] Testes de integração entre componentes
- [ ] Testes E2E do fluxo completo (criar indicador → editar valores)

---

## 8 Status para Próximo Agente

 **✅ DECISÃO APROVADA:** Opção 1 — Criar `gestao-indicadores` separado

**Documentação completa:** [ADR-006](../adr/ADR-006-arquitetura-matriz-indicadores.md)

**Próximo agente:** Dev Agent (implementação)

**Ações aprovadas:**
1. ✅ Criar `edicao-valores-mensais/` (migrar código existente)
2. ✅ Criar `gestao-indicadores/` (implementar ADR-005)
3. ✅ Atualizar `matriz-indicadores/` (container com seções)
4. ✅ Implementar comunicação via `@Output()` eventos
5. ✅ Criar testes completos (unitários + integração + E2E)

**Checklist detalhado:** Ver ADR-006, Seção "Checklist de Implementação"

---

## 9 Referências

- **ADR-005:** `/docs/adr/ADR-005-ux-excel-like-indicadores.md` (especificação original)
- **Business Rules:** `/docs/business-rules/cockpit-pilares.md`
- **Código existente:** `frontend/src/app/views/pages/cockpit-pilares/matriz-indicadores/`
- **Service:** `@core/services/cockpit-pilares.service` (já implementado)
- **Interfaces:** `@core/interfaces/cockpit-pilares.interface` (já implementado)

---

## 10 Anexo: Comparação Técnica

### 10.1 ADR-005: Grid Excel-like (CRUD Indicadores)

**Dados gerenciados:** `IndicadorCockpit`
```typescript
{
  id, nome, descricao, tipoMedida, statusMedicao,
  responsavelMedicaoId, melhor, ordem, ativo
}
```

**Ações:**
- Adicionar nova linha (indicador vazio)
- Editar nome, tipo, responsável inline
- Drag & drop para reordenar
- Remover indicador (cascade delete de meses)
- Modal para descrição

**Foco:** Configuração inicial do cockpit (setup)

---

### 10.2 Implementação Existente: Matriz Valores Mensais

**Dados gerenciados:** `IndicadorMensal[]` por `IndicadorCockpit`
```typescript
{
  id, mes, ano, meta, realizado, indicadorCockpitId
}
```

**Ações:**
- Editar meta (input numérico)
- Editar realizado (input numérico)
- Calcular desvio (realizado vs meta)
- Status visual (success/warning/danger)
- Placeholder para criar/editar/excluir indicador

**Foco:** Acompanhamento mensal de indicadores já criados

---

**Handoff criado automaticamente pelo Dev Agent**

---

## 11 Anexo: Código de Referência (ADR-005)

Para implementação futura do componente conforme ADR-005, consultar:

- **Pseudo-código completo**: `/docs/adr/ADR-005-ux-excel-like-indicadores.md` (linhas 255-540)
- **Template HTML**: `/docs/adr/ADR-005-ux-excel-like-indicadores.md` (linhas 545-740)
- **Estilos SCSS**: `/docs/adr/ADR-005-ux-excel-like-indicadores.md` (linhas 745-880)
- **Especificação detalhada**: `/docs/conventions/matriz-indicadores-excel-like.md` (1400+ linhas)

**Checklist completo:** 12 fases, 42 tarefas (seção 18 do ADR-005)
