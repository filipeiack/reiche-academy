# Handoff: Adicionar Coluna Histórico em Indicadores

**De:** System Engineer (Modo Consultivo)  
**Para:** Dev Agent Disciplinado  
**Feature:** Adicionar campo `historico` em IndicadorMensal  
**Data:** 2026-01-21  
**Versão:** v5  
**Tipo:** Enhancement (Nova funcionalidade)

---

## 📋 Contexto

Adicionar uma nova coluna `historico` no modelo `IndicadorMensal` para permitir visualização de dados históricos (referência de desempenho passado) no gráfico de indicadores.

**Motivação:**
- Usuários precisam comparar valores atuais com histórico (baseline)
- Gráfico deve exibir histórico como barras cinza claro para diferenciação visual
- Histórico representa valores de períodos anteriores usados como referência

**Impacto:**
- ✅ Backward compatible (campo opcional)
- ✅ Não quebra código existente
- ⚠️ Requer migration do Prisma
- ⚠️ Requer atualização de 3 componentes frontend

---

## 🎯 Objetivos

1. **Backend:**
   - Adicionar campo `historico: Float?` em `IndicadorMensal`
   - Criar migration Prisma
   - Atualizar DTOs e Service

2. **Frontend:**
   - Adicionar coluna "Histórico" na tabela de edição (edicao-valores-mensais)
   - Incluir dados históricos no gráfico como barras cinza claro
   - Manter padrões de UX existentes

3. **Documentação:**
   - Atualizar business-rules/cockpit-pilares.md
   - Atualizar ADR-006 (se necessário)

---

## 📊 Especificação do Campo

### Backend: `IndicadorMensal`

```prisma
model IndicadorMensal {
  id String @id @default(uuid())

  indicadorCockpitId String
  indicadorCockpit   IndicadorCockpit @relation(fields: [indicadorCockpitId], references: [id], onDelete: Cascade)

  mes Int? // 1-12 (null para resumo anual)
  ano Int

  meta       Float?
  realizado  Float?
  historico  Float? // ← NOVO CAMPO

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?

  @@unique([indicadorCockpitId, ano, mes])
  @@index([indicadorCockpitId])
  @@map("indicadores_mensais")
}
```

**Características:**
- **Tipo:** `Float?` (nullable)
- **Default:** null
- **Descrição:** Valor histórico de referência (períodos anteriores)
- **Exemplo:** Se 2026 é ano atual, histórico pode conter valor de 2025

---

## 🛠️ Tasks de Implementação

### Task 1: Migration do Banco (Backend)

**Arquivo:** `backend/prisma/schema.prisma`

**Mudança:**
```prisma
model IndicadorMensal {
  // ... campos existentes ...
  meta       Float?
  realizado  Float?
  historico  Float? // ← Adicionar aqui
  // ... restante ...
}
```

**Comandos:**
```bash
cd backend
npx prisma migrate dev --name add_historico_to_indicador_mensal
```

**Validação:**
- Migration criada em `backend/prisma/migrations/`
- Arquivo migration contém `ALTER TABLE "indicadores_mensais" ADD COLUMN "historico" DOUBLE PRECISION;`

---

### Task 2: Atualizar DTOs (Backend)

**Arquivo:** `backend/src/modules/cockpit-pilares/dto/update-indicador-mensal.dto.ts`

**Mudança:**
```typescript
export class UpdateIndicadorMensalDto {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  meta?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  realizado?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  historico?: number; // ← NOVO CAMPO

  // ... outros campos ...
}
```

**Arquivos afetados:**
- `create-indicador-mensal.dto.ts` (se houver)
- `indicador-mensal.dto.ts` (response DTO)

**Validação:**
- Compilação TypeScript OK
- Swagger atualizado automaticamente

---

### Task 3: Atualizar Service (Backend)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Verificar método:** `updateIndicadorMensal()`

**Comportamento esperado:**
- Campo `historico` incluído automaticamente no Prisma update
- Nenhuma lógica adicional necessária (campo simples)

**Validação:**
- Teste manual via Swagger: PATCH /indicadores-mensais/:id com `{ "historico": 123.45 }`
- Verificar que valor é persistido no banco

---

### Task 4: Adicionar Coluna na Tabela (Frontend)

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html`

**Localização:** Após coluna "Meta", antes de "Realizado"

**Mudança no header:**
```html
<thead class="table-light">
  <tr>
    <th style="width: 80px;">Mês</th>
    <th class="text-center" style="width: 60px;">Melhor</th>
    <th style="width: 120px;">Meta
      ({{ getLabelTipoMedida(indicador.tipoMedida) }})
    </th>
    <th style="width: 120px;">Histórico
      ({{ getLabelTipoMedida(indicador.tipoMedida) }})
    </th> <!-- ← NOVA COLUNA -->
    <th style="width: 120px;">Realizado
      ({{ getLabelTipoMedida(indicador.tipoMedida) }})
    </th>
    <th style="width: 100px;">Desvio</th>
    <th class="text-center" style="width: 100px;">Status</th>
  </tr>
</thead>
```

**Mudança no body:**
```html
<tbody>
  @for (mes of getMesesOrdenados(indicador); track mes.id) {
  <tr>
    <td class="fw-bold" style="width: 80px;">{{ getNomeMes(mes.mes!) }}</td>
    <td class="text-center" style="width: 60px;">
      <!-- melhor icon -->
    </td>
    <td style="width: 120px;">
      <input type="number" class="form-control form-control-sm" 
        [value]="mes.meta"
        (input)="onValorChange(mes, 'meta', $event)" 
        step="0.01" />
    </td>
    <td style="width: 120px;"> <!-- ← NOVA COLUNA -->
      <input type="number" class="form-control form-control-sm" 
        [value]="mes.historico"
        (input)="onValorChange(mes, 'historico', $event)" 
        step="0.01" />
    </td>
    <td style="width: 120px;">
      <input type="number" class="form-control form-control-sm" 
        [value]="mes.realizado"
        (input)="onValorChange(mes, 'realizado', $event)" 
        step="0.01" />
    </td>
    <!-- ... desvio e status ... -->
  </tr>
  }
</tbody>
```

**Validação:**
- Coluna aparece entre Meta e Realizado
- Input editável com auto-save (usa mesma lógica de `onValorChange`)
- Largura consistente (120px)

---

### Task 5: Atualizar Interface TypeScript (Frontend)

**Arquivo:** `frontend/src/app/shared/interfaces/cockpit-pilares.interface.ts`

**Mudança:**
```typescript
export interface IndicadorMensal {
  id: string;
  indicadorCockpitId: string;
  mes: number | null;
  ano: number;
  meta: number | null;
  historico: number | null; // ← NOVO CAMPO
  realizado: number | null;
  createdAt: string;
  updatedAt: string;
}
```

**Validação:**
- Compilação TypeScript OK
- Nenhum erro de tipo no componente

---

### Task 6: Adicionar Histórico no Gráfico (Frontend)

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts`

**Método a atualizar:** `buildChartData()`

**Mudança:**
```typescript
private buildChartData(indicador: IndicadorCockpit): void {
  const labels = this.mesesNomes;
  
  const metaData = this.meses.map(m => m.meta);
  const realizadoData = this.meses.map(m => m.realizado);
  const historicoData = this.meses.map(m => m.historico); // ← NOVO DATASET

  this.lineChartData = {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Histórico',
        data: historicoData,
        backgroundColor: 'rgba(200, 200, 200, 0.5)', // ← Cinza claro
        borderColor: 'rgba(150, 150, 150, 0.8)',
        borderWidth: 1,
        order: 3 // ← Exibir atrás das outras séries
      },
      {
        type: 'line',
        label: 'Meta',
        data: metaData,
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        order: 1
      },
      {
        type: 'line',
        label: 'Realizado',
        data: realizadoData,
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderWidth: 2,
        tension: 0.4,
        order: 2
      }
    ]
  };
}
```

**Configuração do Chart (se necessário):**
```typescript
public lineChartOptions: ChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    y: {
      beginAtZero: true
    }
  }
};
```

**Validação:**
- Gráfico exibe 3 séries: Histórico (barras cinza), Meta (linha vermelha), Realizado (linha azul)
- Barras de histórico aparecem atrás das linhas (order: 3)
- Legenda mostra "Histórico", "Meta", "Realizado"

---

## 📐 Padrões e Convenções

### Backend
- ✅ Seguir padrão existente de campos nullable em `IndicadorMensal`
- ✅ DTOs com validações `@IsOptional()` e `@IsNumber()`
- ✅ Migration Prisma com nome descritivo

### Frontend
- ✅ Mesma largura de coluna que Meta/Realizado (120px)
- ✅ Auto-save com debounce 1000ms (padrão do projeto)
- ✅ Input type="number" step="0.01"
- ✅ Cor cinza claro para diferenciação visual: `rgba(200, 200, 200, 0.5)`

### Testes
- ⚠️ **NÃO criar testes unitários** (regra do projeto: testes criados posteriormente)
- ✅ Teste manual obrigatório (ver seção Validação)

---

## ✅ Checklist de Validação

### Backend
- [ ] Migration executada com sucesso
- [ ] Prisma Client regenerado (`npx prisma generate`)
- [ ] Swagger exibe campo `historico` em DTOs
- [ ] PATCH /indicadores-mensais/:id aceita `{ "historico": 100 }`
- [ ] GET /indicadores-mensais retorna campo `historico`

### Frontend
- [ ] Coluna "Histórico" aparece na tabela de edição
- [ ] Input permite edição e salva via auto-save
- [ ] Gráfico exibe barras cinza claro para histórico
- [ ] Legenda mostra "Histórico", "Meta", "Realizado"
- [ ] Nenhum erro de compilação TypeScript

### Documentação
- [ ] `docs/business-rules/cockpit-pilares.md` atualizado
- [ ] Handoff arquivado em `docs/handoffs/cockpit-pilares/`

---

## 🎨 Referências Visuais

### Tabela de Edição (Esperado)

```
| Mês | Melhor | Meta | Histórico | Realizado | Desvio | Status |
|-----|--------|------|-----------|-----------|--------|--------|
| Jan |   ↑    | 1000 |    950    |   1050    |  +5%   |   ✓    |
| Fev |   ↑    | 1100 |    980    |   1080    |  -2%   |   ⚠    |
```

### Gráfico (Esperado)

```
  ┌─────────────────────────────────────┐
  │ ━━━ Meta (vermelho)                 │
  │ ━━━ Realizado (azul)                │
  │ ▓▓▓ Histórico (cinza claro - barras)│
  └─────────────────────────────────────┘
     Jan  Fev  Mar  Abr  Mai  ...
```

---

## 🔗 Documentos Relacionados

- **ADR-006:** Arquitetura de Componentes da Matriz de Indicadores
- **Business Rules:** `docs/business-rules/cockpit-pilares.md`
- **Conventions:** `docs/conventions/matriz-indicadores-excel-like.md`

---

## 🚨 Avisos Importantes

1. **Migration irreversível:** Após deploy em produção, campo `historico` não pode ser removido sem perda de dados
2. **Backward compatibility:** Sistema deve funcionar com `historico = null` (valor padrão)
3. **Performance:** Nenhum impacto esperado (campo simples, sem relações)

---

## 🎯 Critérios de Aceite

### Must Have (Obrigatório)
- [x] Campo `historico` existe no banco de dados
- [x] Tabela de edição exibe coluna "Histórico"
- [x] Auto-save funciona para campo histórico
- [x] Gráfico exibe barras cinza claro para histórico
- [x] Documentação atualizada

### Should Have (Desejável)
- [ ] Tooltip no gráfico mostra valor histórico
- [ ] Coluna destacada visualmente (background levemente diferente)

### Won't Have (Não neste handoff)
- ❌ Importação automática de dados históricos
- ❌ Validação de range (histórico vs meta)
- ❌ Cálculo de desvio histórico

---

**Fim do Handoff**

**Próximo passo:** Dev Agent implementar tasks 1-6 seguindo esta especificação.
