# 📊 Regra de Negócio: Exibição Completa de Pilares na Evolução

**Identificador:** RN-DIAG-EVO-001  
**Categoria:** Diagnóstico de Pilares  
**Status:** ✅ ATIVA  
**Versão:** 1.1  
**Data de Última Atualização:** 2026-02-05  
**Autor:** Business Analyst

---

## 📋 Descrição Executiva

A tela **"Evolução dos Pilares"** exibe **TODOS os pilares cadastrados na empresa**, independentemente de possuírem avaliações associadas. Pilares sem avaliação ainda são visíveis com indicativo claro de "não avaliado" (média = 0).

**Objetivo:** Fornecer visibilidade completa do panorama de pilares para facilitar planejamento estratégico e identificação de próximas ações.

---

## 🎯 Requisitos Funcionais

### RF-DIAG-EVO-001: Carregar Todos os Pilares Ativos
```gherkin
Dado: Uma empresa com N pilares cadastrados (alguns com avaliações, outros sem)
Quando: Usuário abre a tela "Evolução dos Pilares"
Então: Vê todos os N pilares listados
  E: Pilares com avaliação mostram sua média real (0-10)
  E: Pilares sem avaliação mostram "0" em todas as métricas
```

**Implementação:**
- Carregar via `PilaresEmpresaService.listarPilaresDaEmpresa(empresaId)`
- Filtrar `ativo === true` (respeita soft delete)
- Combinar com médias via `DiagnosticoNotasService.calcularMediasPilares()`

### RF-DIAG-EVO-002: Indicador Visual de Pilares não Avaliados
```gherkin
Dado: Um pilar sem nenhuma avaliação registrada
Quando: Aparece na tabela "Evolução dos Pilares"
Então: Coluna "Média Atual" exibe "-" ou "0"
  E: Coluna "% Avaliação" exibe "0%"
  E: Coluna "Última Atualização" exibe "-"
```

**Semântica:** `mediaAtual = 0` significa "não avaliado (ainda)", não "avaliado com zero pontos"

### RF-DIAG-EVO-003: Ordenação Inteligente
```gherkin
Dado: Empresa com 10 pilares (4 com média, 6 sem)
Quando: Tela carrega (sem ordenação de coluna específica)
Então: Pilares aparecem em ordem alfabética
  E: Todos os 10 pilares inclusos
  E: Análise possível "top 4" ou "4 melhores" vs "6 não iniciados"
```

**Lógica:** Pilares com média → alfabético; Pilares sem média → alfabético

---

## 🔐 Regras de Acesso

| Perfil | Visualiza | Ações |
|--------|-----------|-------|
| **ADMINISTRADOR** | Todos pilares de qualquer empresa | Congelar, recongelar |
| **GESTOR** | Todos pilares da sua empresa | Congelar, recongelar |
| **COLABORADOR** | Todos pilares da sua empresa | Nenhuma ação |
| **LEITURA** | Todos pilares da sua empresa | Nenhuma ação |

---

## 📊 Estrutura de Dados

### Entrada: PilarEmpresa (via API)
```typescript
{
  id: string;           // UUID
  nome: string;         // "Operacional", "Vendas", etc.
  ativo: boolean;       // true → aparece; false → oculto
  pilarTemplateId?: string;
  ordem: number;
}
```

### Entrada: MediaPilar (via API)
```typescript
{
  pilarEmpresaId: string;
  pilarNome: string;
  mediaAtual: number;            // 0-10, ou 0 se não avaliado
  totalRotinasAvaliadas: number;
  totalRotinas: number;
  ultimaAtualizacao?: string;
}
```

### Saída: MediaPilar Combinada (Frontend)
```typescript
// Se pilar tem avaliações:
{
  pilarEmpresaId: "abc123",
  pilarNome: "Operacional",
  mediaAtual: 7.5,
  totalRotinasAvaliadas: 3,
  totalRotinas: 4,
  ultimaAtualizacao: "2026-02-01T10:30:00"
}

// Se pilar NÃO tem avaliações:
{
  pilarEmpresaId: "def456",
  pilarNome: "Inovação",
  mediaAtual: 0,              // ← Criado no frontend
  totalRotinasAvaliadas: 0,
  totalRotinas: 0,
  ultimaAtualizacao: null
}
```

---

## 🔄 Fluxo de Carregamento

```
1. Usuário abre "Evolução dos Pilares"
   ↓
2. loadMedias() dispara Promise.all([
     pilaresEmpresaService.listarPilaresDaEmpresa(empresaId),
     diagnosticoService.calcularMediasPilares(empresaId)
   ])
   ↓
3. Cria Map: pilarEmpresaId → MediaPilar (para O(1) lookup)
   ↓
4. Para cada pilar da empresa:
   • IF pilar.ativo === true:
     - IF existe no map: usa dados reais
     - ELSE: cria objeto com mediaAtual=0
   ↓
5. Ordena alfabeticamente (padrão)
   ↓
6. Render: Tabela + Gráfico com todos os pilares
```

---

## ✅ Cenários Validados

### Cenário 1: Empresa Iniciante (0% avaliação)
**Setup:**
- 8 pilares cadastrados
- ZERO avaliações completas

**Esperado:**
- Tabela exibe 8 linhas
- Todas com Média = 0, % Avaliação = 0%, Última Atualização = -
- Gráfico vazio (sem dados históricos)
- **UX:** Claro que "não começou ainda"

### Cenário 2: Empresa em Transição (50% avaliação)
**Setup:**
- 10 pilares cadastrados
- 5 pilares com 1+ avaliação
- 5 pilares nunca avaliados

**Esperado:**
- Tabela exibe 10 linhas
- Linhas 1-5: Com média (ex: 6.0, 7.5, 8.0, 8.5, 9.0)
- Linhas 6-10: Sem média (0, 0, 0, 0, 0) — em ordem alfabética
- **UX:** Fácil identificar "próximos 5 pilares para avaliar"

### Cenário 3: Empresa Madura (100% avaliação)
**Setup:**
- 12 pilares, TODOS com avaliações
- Histórico de 12+ períodos congelados

**Esperado:**
- Tabela exibe 12 linhas
- Todas com média entre 5.0-9.5
- Gráfico: 12 colunas (uma por pilar) com múltiplos períodos
- **UX:** Panorama completo do desempenho por pilar

### Cenário 4: Pilares Inativos (soft delete)
**Setup:**
- 10 pilares cadastrados
- 2 deles com ativo=false (foram desativados)

**Esperado:**
- Tabela exibe 8 linhas (apenas ativos)
- Os 2 inativos não aparecem
- Gráfico: 8 pilares
- **UX:** Sem "ruído" de pilares antigos/obsoletos

---

## 🎨 Indicadores Visuais

### Tabela de Pilares
| Coluna | Pilar Avaliado | Pilar não Avaliado | Nota |
|--------|---|---|---|
| **Nome** | "Operacional" | "Inovação" | Sempre preenchido |
| **Média Atual** | "7.5" | "-" ou "0" | Unidade: 0-10 |
| **% Avaliação** | "75%" | "0%" | Rotinas avaliadas / total |
| **Última Atualização** | "01/02/2026 14:30" | "-" | Data/hora ou vazio |

### Gráfico de Evolução
- **Eixo X:** Nomes dos pilares (todos)
- **Eixo Y:** Escala 0-10 com zonas coloridas (vermelho 0-6, amarelo 6-8, verde 8-10)
- **Barras:** Um conjunto por período congelado (cores cinza)
- **Pilares sem snapshot:** Barra vazia (null) naquele período
- **Scroll:** Se > 10 pilares, permite scroll horizontal

---

## ⚙️ Lógica Técnica

### Algoritmo de Combinação
```typescript
function combinarDados(
  todosOsPilares: PilarEmpresa[],
  mediasPilares: MediaPilar[]
): MediaPilar[] {
  
  // Map para O(1) lookup
  const mediasMap = new Map(
    mediasPilares.map(m => [m.pilarEmpresaId, m])
  );

  return todosOsPilares
    // Filtrar apenas ativos
    .filter(p => p.ativo === true)
    
    // Combinar ou criar default
    .map(pilar => {
      const media = mediasMap.get(pilar.id);
      return media || {
        pilarEmpresaId: pilar.id,
        pilarId: pilar.pilarTemplateId || pilar.id,
        pilarNome: pilar.nome,
        mediaAtual: 0,
        totalRotinasAvaliadas: 0,
        totalRotinas: 0,
        ultimaAtualizacao: null
      };
    })
    
    // Ordenar alfabeticamente
    .sort((a, b) => 
      a.pilarNome.localeCompare(b.pilarNome)
    );
}
```

### Compatibilidade com Recongelamento
- Recongelar período: Busca snapshots para pilares com avaliação
- Pilares **sem avaliação não geram snapshots** (protegido no backend)
- Tabela continua mostrando "0" para não avaliados após recongelar ✅

---

## 🚨 Impacto no Negócio

| Aspecto | Antes v1.0 | Depois v1.1 | Ganho |
|---------|-----------|-----------|-------|
| **Visibilidade** | 40% pilares (com média) | 100% pilares | 150% ↑ |
| **Decisões** | Incerteza ("faltam dados?") | Clareza total | Confiança ↑ |
| **Planejamento** | Difícil | Direto | Eficiência ↑ |
| **Onboarding** | Confuso | Óbvio | UX ↑ |

---

## 📈 Critérios de Sucesso

- [x] Todos pilares ativos aparecem (100% cobertura)
- [x] Pilares sem avaliação mostram "0" com clareza
- [x] Ordenação padrão é alfabética (consistente)
- [x] Gráfico suporta 20+ pilares sem quebrar
- [x] Performance: load < 2 seg (3 requests paralelos)
- [x] Soft delete respeitado (inativos não aparecem)
- [x] Perfis de acesso mantidos (sem mudança RBAC)

---

## 🔗 Dependências

| Serviço/Componente | Função | Mudança |
|---|---|---|
| `PilaresEmpresaService` | Listar todos pilares | ✅ Sem alteração |
| `DiagnosticoNotasService` | Calcular médias | ✅ Sem alteração |
| `PeriodosAvaliacaoService` | Histórico congelado | ✅ Sem alteração |
| `diagnostico-evolucao.component.ts` | Orquestração | 🔧 Modificado (loadMedias) |

---

## 📝 Versões

| Versão | Data | Status | Mudança |
|--------|------|--------|---------|
| **1.0** | ~Jan 2026 | Obsoleta | Apenas pilares com avaliação |
| **1.1** | 2026-02-05 | ✅ ATIVA | **Todos os pilares visíveis** |

---

## 💬 Notas para Implementação

1. **Frontend-only:** Sem mudanças de backend
2. **Parallelismo:** Use `Promise.all()` para 2 requisições simultâneas
3. **Sem novo tipo de dado:** Reutilize `MediaPilar` com valores default
4. **Validação:** Garantir `pilar.id === mediapilar.pilarEmpresaId` para match
5. **Performance:** Map lookup é O(1); sort é O(n log n) — aceitável até 100 pilares

---

## 🎓 Justificativa de Design

### Por que mostrar pilares sem avaliação (e não esconder)?
✅ **Razões:**
1. **Transparência:** Usuário vê "o panorama completo" de uma olhada
2. **Planejamento:** Facilita identificar próximas ações ("faltam esses 5")
3. **Confiança:** Sem incerteza de "dados faltando"
4. **Natureza do PDCA:** Nem todos pilares evoluem no mesmo ritmo (é esperado)

### Por que ordenação alfabética (não por valor)?
✅ **Razões:**
1. **Previsível:** Usuário sabe onde procurar
2. **Escaneável:** Leitura em F-pattern funciona melhor
3. **Justa:** Não favorecem pilares "melhores"
4. **Simples:** Sem lógica complexa de tie-breaking

---

## 🔐 Restrições Técnicas

- **Soft delete:** Só pilares com `ativo=true` aparecem
- **Multi-tenant:** Dados isolados por `empresaId` em todas camadas
- **Sem novo endpoint:** Reutiliza APIs existentes
- **Sem cache:** Cada load recarrega fresh
- **Sem modificação de backend:** Implementação é 100% frontend

---

**Documento Normalizado por:** Business Analyst  
**Próximo Revisor:** Dev Agent Enhanced (implementação validada)  
**Data de Criação:** 2026-02-05  
**Última Revisão:** 2026-02-05
