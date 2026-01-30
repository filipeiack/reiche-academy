# Atualização do Handoff: Cockpit de Pilares

**Data:** 2026-01-15  
**Versão:** 1.1  
**Tipo:** Ajustes de entendimento + Expansão de escopo

---

## Mudanças Realizadas

### 1. ProcessoPrioritario: Vínculo (NÃO Snapshot)

**Antes:** Documentação ambígua sobre "auto-importação" de rotinas.

**Agora:** Esclarecido que ProcessoPrioritario é **apenas vínculo**, não cópia/snapshot.

**Impacto:**
- ✅ **Modelo de dados já estava correto** (apenas FK `rotinaEmpresaId`)
- ✅ Nome, criticidade, nota da rotina são **SOMENTE LEITURA** (via join no backend)
- ✅ Apenas `statusMapeamento` e `statusTreinamento` são editáveis no cockpit
- ✅ Sem overhead de snapshot: rotinas permanecem atualizadas

**Terminologia corrigida:**
- ❌ "Auto-importação" (sugere cópia)
- ✅ "Auto-vinculação" (apenas referência)

---

### 2. Fase 2 (Gráficos) Integrada no MVP

**Antes:** Fase 2 (Análise Gráfica) era separada do MVP.

**Agora:** Gráficos **integrados no MVP Fase 1**.

**Justificativa:**
- Cockpit sem gráficos perde muito valor gerencial
- Matriz de indicadores + gráficos = visão completa
- Biblioteca de gráficos (Chart.js/ng2-charts) é madura e estável

**Novo escopo do MVP:**
- ✅ Cockpit + indicadores
- ✅ Valores mensais (jan-dez)
- ✅ Processos prioritários
- ✅ **Gráficos de evolução temporal** (meta vs realizado)

**Fases renumeradas:**
- **Fase 1 (MVP):** Cockpit + indicadores + gráficos ← ATUAL
- **Fase 2:** Matriz de cargos e funções
- **Fase 3:** Plano de ação com 5 Porquês
- **Fase 4:** Otimizações (export, comparações)

---

## Documentos Atualizados

### ✅ Regra de Negócio
📄 [/docs/business-rules/cockpit-pilares.md](../../business-rules/cockpit-pilares.md)

**Mudanças:**
- Seção 2.4 (ProcessoPrioritario) esclarecida: "NÃO é snapshot"
- Roadmap (seção 8) atualizado: Fase 2 integrada no MVP

---

### ✅ Handoff para Dev Agent
📄 [system-engineer-v1.md](./system-engineer-v1.md)

**Mudanças:**
- Escopo do MVP atualizado (incluindo gráficos)
- Seção 8: "Auto-vinculação" (não "auto-importação")
- Seção 10: Novo componente `grafico-indicadores`
- Novo endpoint: `GET /cockpits/:id/graficos/dados?ano=2026`
- Checklist atualizado: biblioteca de gráficos + componente
- Critérios de aceitação: gráficos funcionais

---

### ✅ ADR-003
📄 [/docs/adr/ADR-003-cockpit-pilares-architecture.md](../../adr/ADR-003-cockpit-pilares-architecture.md)

**Mudanças:**
- Fases renumeradas (Fase 2 = gráficos → integrada no MVP)
- Decisão técnica "Auto-vinculação" esclarecida (não snapshot)

---

### ✅ Este documento (atualização)
📄 [ATUALIZACAO_v1.1.md](./ATUALIZACAO_v1.1.md) ← **NOVO**

---

## Novo Escopo do Frontend (MVP)

### Componentes Adicionados
```
frontend/src/app/views/pages/cockpit-pilares/
├── grafico-indicadores/         ← NOVO
│   ├── grafico-indicadores.component.ts
│   ├── grafico-indicadores.component.html
│   └── grafico-indicadores.component.scss
```

### Funcionalidades Adicionadas
1. **Gráfico de Linha (Meta vs Realizado):**
   - Biblioteca: Chart.js ou ng2-charts
   - Eixo X: Meses (jan-dez)
   - Eixo Y: Valores (meta e realizado)
   - Seletor de indicador (dropdown)
   - Filtro de ano
   - Tooltip com desvio calculado

2. **Navegação por Abas:**
   - Aba 1: Matriz de Indicadores
   - Aba 2: Análise Gráfica ← NOVO
   - Aba 3: Processos Prioritários

---

## Novo Endpoint (Backend)

### GET `/cockpits/:cockpitId/graficos/dados?ano=2026`

**Descrição:** Retorna dados agregados de todos os indicadores para gráficos.

**Perfis:** Todos

**Response:**
```json
{
  "ano": 2026,
  "indicadores": [
    {
      "id": "uuid-indicador-1",
      "nome": "FATURAMENTO TOTAL MENSAL",
      "tipoMedida": "REAL",
      "melhor": "MAIOR",
      "meses": [
        {
          "mes": 1,
          "meta": 1890000,
          "realizado": 1500000,
          "desvio": -390000
        },
        {
          "mes": 2,
          "meta": 2430000,
          "realizado": null,
          "desvio": null
        }
        // ... jan-dez
      ]
    }
  ]
}
```

**Lógica de cálculo do desvio (backend):**
```typescript
desvio = indicador.melhor === 'MAIOR' 
  ? (realizado - meta) 
  : (meta - realizado);
```

---

## Dependências Adicionais

### Frontend
```bash
npm install chart.js ng2-charts
```

ou

```bash
npm install @ng-bootstrap/ng-bootstrap chartjs
```

**Escolha:** Fica a critério do Dev Agent (ambas são maduras).

---

## Checklist Adicional (Dev Agent)

### Backend
- [ ] Implementar endpoint `GET /cockpits/:id/graficos/dados`
- [ ] Calcular desvio no backend (não apenas frontend)
- [ ] Validar filtro de ano (>=2020, <=ano_atual+5)

### Frontend
- [ ] Instalar biblioteca de gráficos
- [ ] Criar componente `grafico-indicadores`
- [ ] Implementar seletor de indicador (dropdown)
- [ ] Implementar filtro de ano
- [ ] Renderizar gráfico de linha (meta vs realizado)
- [ ] Tooltip com desvio calculado

---

## Critérios de Aceitação Adicionais

### Gráficos
- [ ] Gráfico exibe meta e realizado (jan-dez)
- [ ] Seletor de indicador funcional
- [ ] Filtro de ano funcional
- [ ] Tooltip exibe desvio ao hover
- [ ] Gráfico responsivo (ajusta a tamanho de tela)
- [ ] Linhas com cores distintas (meta vs realizado)

---

## Impacto no Cronograma

**Estimativa adicional:** +20% no tempo de desenvolvimento do MVP.

**Justificativa:**
- Biblioteca de gráficos é plug-and-play
- Endpoint de dados agregados é simples (join + cálculo)
- Ganho de valor justifica o esforço

**Priorização:**
1. Backend + Matriz de indicadores (core)
2. Gráficos (valor agregado alto)
3. Processos prioritários (complementar)

---

## Referências Cruzadas

**Documentos principais:**
- [cockpit-pilares.md](../../business-rules/cockpit-pilares.md) ← Regra de negócio atualizada
- [system-engineer-v1.md](./system-engineer-v1.md) ← Handoff atualizado
- [ADR-003](../../adr/ADR-003-cockpit-pilares-architecture.md) ← ADR atualizado

**Exemplos de gráficos:**
- Chart.js: https://www.chartjs.org/docs/latest/
- ng2-charts: https://valor-software.com/ng2-charts/

---

**Status:** ✅ Atualização concluída  
**Versão do handoff:** 1.1  
**Próximo agente:** Dev Agent (implementar MVP completo)
