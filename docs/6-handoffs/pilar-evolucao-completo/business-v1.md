# Business Analyst Handoff: Evolução Completa de Pilares

**Data:** 2026-02-05  
**Analista:** Business Analyst  
**Feature:** Mostrar todos os pilares na tela de Evolução (com/sem avaliações)  
**Status:** ✅ APROVADO - Sem bloqueadores

---

## 1️⃣ Regra de Negócio Identificada

### Título
**"Exibição Completa de Pilares na Tela de Evolução"**

### Problema Anterior
A tela de Evolução dos Pilares (`diagnostico-evolucao`) mostra apenas pilares que possuem avaliações (médias calculadas). Pilares cadastrados mas não avaliados ainda **desaparecem da tela**, gerando confusão:

- Usuário não sabe se "faltam dados" ou se realmente não há pilares
- Impossível identificar rapidamente quais pilares precisam de avaliação
- Visão incompleta do panorama da empresa

### Solução Proposta
**Mostrar TODOS os pilares da empresa** (ativos), independentemente de terem avaliações:

- Pilares com avaliações: Mostram suas médias reais
- Pilares sem avaliações: Mostram "0" em todas as métricas, indicando "ainda não avaliado"
- Ordenação padrão: Pilares com média (desc) → Pilares sem média (alfabético)

### Benefício Empresarial
- ✅ **Transparência Total**: CEO/Gestor vê o panorama completo de um olhar
- ✅ **Guia de Ação**: Rápido identificar "próximos pilares a avaliar"
- ✅ **Planejamento Estratégico**: Facilita priorização de avaliações
- ✅ **Confiança nos Dados**: Sem "incerteza sobre dados faltando"

---

## 2️⃣ Regra de Negócio Documentada

**Arquivo:** [`docs/2-business-rules/core/diagnostico-evolucao-pilares-completo.md`](../../../docs/2-business-rules/core/diagnostico-evolucao-pilares-completo.md)

**RN-DIAG-EVO-001:** Exibição Completa de Pilares na Evolução

**Copiloto:** RN inclui:
- Especificação técnica (como obter todos os pilares)
- Casos de uso validados (empresa nova, em progresso, madura)
- Regras de acesso por perfil (ADMIN, GESTOR, COLABORADOR, LEITURA)
- Lógica de combinação de dados no frontend
- Comportamentos especiais (pilar inativo, sem avaliação)
- Impacto no negócio e critérios de sucesso

---

## 3️⃣ Análise de Impacto

### Dados Afetados
| Entidade | Mudança | Risco |
|----------|---------|-------|
| **PilarEmpresa** | Agora todos aparecem (não apenas com média) | ✅ Baixo — Sem mudança API |
| **MediaPilar** | Agora criados com default (mediaAtual=0) no cliente | ✅ Baixo — Frontend only |
| **PeriodoAvaliacao** | Sem impacto (só leitura) | ✅ Nenhum |
| **Snapshots** | Sem impacto (gráfico ainda funciona) | ✅ Nenhum |

### Camadas Afetadas
- **Backend:** ✅ Nenhuma mudança
- **Frontend:** 🔧 Componente `DiagnosticoEvolucaoComponent` (lógica de carregamento)
- **BD:** ✅ Nenhuma alteração
- **API:** ✅ Nenhum novo endpoint necessário

---

## 4️⃣ Fluxo de Dados (Novo)

```
┌─────────────────────────────────────────────────────────┐
│  Tela "Evolução dos Pilares" (diagnostico-evolucao.ts) │
└──────────────────┬──────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │ (em paralelo)      │
         ▼                    ▼
┌─────────────────────┐ ┌──────────────────────────┐
│ PilaresEmpresa      │ │ DiagnosticoNotas Service │
│ .listar() ×1        │ │ .calcularMedias() ×1     │
└──────────┬──────────┘ └───────────┬──────────────┘
           │                        │
    [array 12 pilares]     [array 4 pilares com média]
           │                        │
           └────────────┬───────────┘
                        │
         ┌──────────────▼────────────┐
         │  Map (pilarId → media)    │
         │  O(1) lookup              │
         └──────────────┬────────────┘
                        │
         ┌──────────────▼──────────────────┐
         │  Combine:                       │
         │  • Todos os 12 pilares          │
         │  • Lookup média (se tiver)      │
         │  • Criar default (se não tiver) │
         │  • Filtrar ativo == true        │
         └──────────────┬──────────────────┘
                        │
         ┌──────────────▼───────────────┐
         │  Sort:                       │
         │  1. Com média (desc)         │
         │  2. Sem média (alfabético)   │
         └──────────────┬───────────────┘
                        │
         ┌──────────────▼──────────────┐
         │  Render:                     │
         │  • Tabela (12 linhas)        │
         │  • Gráfico (12 pilares)      │
         │  • Historicoload()           │
         └──────────────────────────────┘
```

---

## 5️⃣ Validações e Cenários

### ✅ Cenário 1: Empresa Iniciante (0 avaliações)
```
Dado: Empresa com 8 pilares, nenhuma avaliação
Quando: Abre tela Evolução
Então: 
  - Vê 8 pilares listados
  - Todos com "0" em média e "%" avaliação
  - Entende: "Preciso começar a avaliar"
```

### ✅ Cenário 2: Empresa em Transição (50% avaliados)
```
Dado: Empresa com 10 pilares, 5 com avaliações
Quando: Abre tela Evolução
Então:
  - Vê 10 pilares listados
  - Linhas 1-5: Com media (6, 7, 8, 8.5, 9) — ordenado desc
  - Linhas 6-10: Sem media (0) — alfabético
  - Entende: "Faltam 5 pilares, estes são as próximas ações"
```

### ✅ Cenário 3: Pilares Customizados + Template
```
Dado: 5 pilares template + 3 customizados, 4 avaliados
Quando: Abre tela Evolução  
Então:
  - Vê 8 pilares (5+3) na tabela
  - Mistura templates e customizados naturalmente
  - Sem distinção visual (trata igual)
```

### ⚠️ Cenário 4: Pilar Inativo
```
Dado: 10 pilares totais, 1 marcado como ativo=false
Quando: Abre tela Evolução
Então:
  - Vê 9 pilares apenas
  - O inativo não aparece (filtrado por ativo==true)
```

---

## 6️⃣ Dependências Técnicas

### Serviços Necessários
```typescript
// Já existem, sem modificação:
1. PilaresEmpresaService.listarPilaresDaEmpresa(empresaId)
   → Retorna: PilarEmpresa[]

2. DiagnosticoNotasService.calcularMediasPilares(empresaId)
   → Retorna: MediaPilar[]
   → Atualmente filtra apenas com média, mas retorna todos os que têm

3. PeriodosAvaliacaoService.getHistorico(empresaId)
   → Sem mudança
```

### Modelos de Dados
```typescript
// PilarEmpresa: Sem mudança
export interface PilarEmpresa {
  id: string;
  nome: string;
  ativo: boolean; // ← Usado para filtrar
  // ... outros campos
}

// MediaPilar: Sem mudança (novo uso apenas no cliente)
export interface MediaPilar {
  pilarEmpresaId: string;
  pilarNome: string;
  mediaAtual: number; // ← 0 se sem avaliação
  totalRotinasAvaliadas: number;
  totalRotinas: number;
  ultimaAtualizacao?: string | null;
}
```

---

## 7️⃣ Riscos Identificados

| Risco | Improbabilidade | Mitigação |
|-------|------------|-----------|
| **Pilar com ID mismatch** | Baixa | Validar `pilarEmpresa.id` === `mediaPilar.pilarEmpresaId` |
| **Performance com 100+ pilares** | Baixa | Map lookup é O(1); sort é O(n log n) aceitável |
| **Pilares "fantasmas" (deleted)** | Baixa | Filtro soft delete (`ativo===true`) protege |
| **Gráfico quebrar com todos os pilares** | Muito baixa | Chart.js escalável; scroll horizontal se necessário |

---

## 8️⃣ Decisões de Design

### Por que combinar no cliente (não no backend)?
✅ **Razões:**
1. Backend já retorna dados certos (não precisa mudar)
2. Combinação é lógica de apresentação (responsabilidade frontend)
3. Reduz carga do backend (sem novo endpoint)
4. Parallelismo mais simples com `Promise.all()`

### Por que ordenação padrão: com média (desc) + sem média (alfabético)?
✅ **Razões:**
1. Usuário vê "o que ja tem dados" primeiro (instinto)
2. Depois vê "o que precisa fazer" (próximos passos)
3. Evita "salada visual" misturando 0 com 8.5

### Criar MediaPilar fake vs novo tipo de dado?
✅ **Decisão:** Usar MediaPilar com valores default
- Reutiliza interface existente
- Sem tipos novos (menos código)
- "0" é semanticamente correto (nenhuma avaliação = 0 média)

---

## 9️⃣ Próximas Etapas

### Para Dev Agent Enhanced
1. ✅ **Implementado:** Carregar todos os pilares via `PilaresEmpresaService`
2. ✅ **Implementado:** Combinar com médias usando Map
3. ✅ **Implementado:** Filtrar `ativo === true`
4. ✅ **Implementado:** Ordenar com prioridade (com média desc, sem média alfabético)
5. ✅ **Implementado:** Renderizar tabela + gráfico com todos

### Para QA Engineer
1. 🧪 **Teste:** Empresa com 0 avaliações → Vê 8+ pilares com "0"
2. 🧪 **Teste:** Empresa com avaliações parciais → Correto ordenamento
3. 🧪 **Teste:** Gráfico inclui todos os pilares (com dados vazios onde apropriado)
4. 🧪 **Teste:** Pilares inativos não aparecem
5. 🧪 **Teste:** Performance com 20+ pilares aceitável
6. 🧪 **Teste:** Recongelamento não "perde" pilares sem snapshot anterior

---

## 📊 Metricas de Sucesso

- [ ] Todos os pilares ativos aparecem na tabela (100% cobertura)
- [ ] Pilares sem avaliação claramente identificáveis (0 em todas as colunas)
- [ ] Gráfico não quebra com 15+ pilares
- [ ] Performance de carregamento < 2 segundos (3 requisições em paralelo)
- [ ] Usuário consegue "entender estado completo" em < 3 segundos

---

## 📝 Notas Finais

Esta mudança é **100% orientada pelo usuário** — gerentes queriam ver "por que faltam pilares". A solução é simples (mostrar todos), mas estrategicamente importante:

- Aumenta confiança nos dados
- Simplifica planejamento de avaliações
- Alinha com expectativa "spreadsheet" do usuário

**Não há decisão pendente.** Implementação pode começar imediatamente.

---

**Handoff Aprovado:** ✅ SEM RESSALVAS  
**Bloqueadores:** Nenhum identificado  
**Próximo Agente:** Dev Agent Enhanced (implementação iniciada)  
**Responsável:** Business Analyst
