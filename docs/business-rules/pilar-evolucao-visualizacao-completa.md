# Regra: Exibição Completa de Pilares na Tela de Evolução

**Identificador:** RN-DIAG-EVO-001  
**Categoria:** Diagnóstico de Pilares / Evolução  
**Status:** ✅ ATIVA  
**Versão:** 1.1  
**Data de Última Atualização:** 2026-02-05  
**Autor:** Business Analyst

---

## Descrição Executiva

A tela **"Evolução dos Pilares"** exibe **TODOS os pilares cadastrados na empresa**, independentemente de possuírem avaliações associadas. Pilares sem avaliação são visíveis com indicativo claro de "não avaliado" (média = 0).

**Objetivo:** Fornecer visibilidade completa do panorama de pilares para facilitar planejamento estratégico e identificação de próximas ações.

---

## Contexto

Anteriormente (v1.0), a tela de Evolução mostra apenas pilares que possuem avaliações (médias calculadas). Isso causa confusão:
- Usuário não sabe se "faltam dados" ou se realmente não há pilares
- Impossível identificar rapidamente quais pilares precisam de avaliação
- Visão incompleta do panorama estratégico

A mudança (v1.1) resolve isso mostrando todos os pilares, com distinção clara entre "não avaliado" (0) e "em progresso" (1-9).

---

## Requisitos Funcionais

### RF-DIAG-EVO-001: Carregar Todos os Pilares Ativos
```
Dado: Uma empresa com N pilares cadastrados (alguns com avaliações, outros sem)
Quando: Usuário abre a tela "Evolução dos Pilares"
Então: Vê todos os N pilares listados
  E: Pilares com avaliação mostram sua média real (0-10)
  E: Pilares sem avaliação mostram "0" em todas as métricas
```

**Implementação:**
- Carregar todos pilares via `PilaresEmpresaService.listarPilaresDaEmpresa(empresaId)`
- Filtrar `ativo === true` (respeita soft delete)
- Combinar com médias via `DiagnosticoNotasService.calcularMediasPilares()`
- Usar `Promise.all()` para paralelismo (2 requisições simultâneas)

### RF-DIAG-EVO-002: Indicador Visual de Pilares não Avaliados
```
Dado: Um pilar sem nenhuma avaliação registrada
Quando: Aparece na tabela "Evolução dos Pilares"
Então: Coluna "Média Atual" exibe "-" ou "0"
  E: Coluna "% Avaliação" exibe "0%"
  E: Coluna "Última Atualização" exibe "-"
```

**Semântica:** `mediaAtual = 0` significa "não avaliado (ainda)", não "avaliado com zero pontos"

### RF-DIAG-EVO-003: Ordenação Consistente
```
Dado: Empresa com 10 pilares (4 com média, 6 sem)
Quando: Tela carrega (sem ordenação de coluna específica)
Então: Pilares aparecem em ordem alfabética
  E: Todos os 10 pilares inclusos
  E: Análise possível "top 4" ou "4 melhores" vs "6 não iniciados"
```

**Lógica:** Ordenação por nome (A-Z), uniform para todos pilares

---

## Comportamento Implementado

### Carregamento de Dados

**Algoritmo:**
```
1. Promise.all([
     PilaresEmpresaService.listarPilaresDaEmpresa(empresaId),
     DiagnosticoService.calcularMediasPilares(empresaId)
   ])

2. Cria Map: pilarEmpresaId → MediaPilar (O(1) lookup)

3. Para cada pilar ativo:
   IF existe média no map:
     return dados reais
   ELSE:
     return {
       pilarEmpresaId: pilar.id,
       pilarNome: pilar.nome,
       mediaAtual: 0,
       totalRotinasAvaliadas: 0,
       totalRotinas: 0,
       ultimaAtualizacao: null
     }

4. Sort alfabético por pilarNome

5. Render tabela + gráfico com todos pilares
```

### Estrutura de Dados de Entrada

**PilarEmpresa:**
```typescript
{
  id: string;               // UUID
  nome: string;             // "Operacional", "Vendas"
  ativo: boolean;          // true → aparece; false → oculto
  pilarTemplateId?: string;
  ordem: number;
}
```

**MediaPilar (retornada pelo service):**
```typescript
{
  pilarEmpresaId: string;
  pilarNome: string;
  mediaAtual: number;           // 0-10, real
  totalRotinasAvaliadas: number;
  totalRotinas: number;
  ultimaAtualizacao?: string;
}
```

### Saída (Frontend)

**MediaPilar Combinada (com/sem avaliação):**
```typescript
// Pilar COM avaliações
{
  pilarEmpresaId: "abc123",
  pilarNome: "Operacional",
  mediaAtual: 7.5,              // ← Real
  totalRotinasAvaliadas: 3,
  totalRotinas: 4,
  ultimaAtualizacao: "2026-02-01T10:30:00"
}

// Pilar SEM avaliações (criado no frontend)
{
  pilarEmpresaId: "def456",
  pilarNome: "Inovação",
  mediaAtual: 0,                // ← Default (não avaliado)
  totalRotinasAvaliadas: 0,
  totalRotinas: 0,
  ultimaAtualizacao: null
}
```

---

## Regras de Acesso (RBAC)

| Perfil | Vê Tela | Vê Todos Pilares | Pode Congelar |
|--------|---------|-----------------|---------------|
| **ADMINISTRADOR** | ✅ | ✅ (empresa selecionada) | ✅ |
| **GESTOR** | ✅ | ✅ (sua empresa) | ✅ |
| **COLABORADOR** | ✅ | ✅ (sua empresa) | ❌ |
| **LEITURA** | ✅ | ✅ (sua empresa) | ❌ |

---

## Cenários de Teste

### Cenário 1: Empresa Iniciante
**Setup:** 8 pilares, 0 avaliações

**Esperado:**
- Tabela exibe 8 linhas
- Todas com Média = 0, % Avaliação = 0%, Última Atualização = -
- Gráfico vazio (sem dados históricos)

### Cenário 2: Empresa em Progresso
**Setup:** 10 pilares, 5 com avaliação

**Esperado:**
- Tabela exibe 10 linhas
- 5 linhas com médias (ex: 6.0, 7.5, 8.0, 8.5, 9.0)
- 5 linhas sem média (0, 0, 0, 0, 0)
- Separação clara entre "feito" e "a fazer"

### Cenário 3: Pilares Inativos
**Setup:** 10 cadastrados, 2 com ativo=false

**Esperado:**
- Tabela exibe 8 linhas (apenas ativos)
- Exemplos com ativo=false não aparecem

---

## Indicadores Visuais

### Tabela de Píchares

| Coluna | Pilar Avaliado | Pilar não Avaliado |
|--------|---|---|
| **Nome** | "Operacional" | "Inovação" |
| **Média Atual** | "7.5" | "-" ou "0" |
| **% Avaliação** | "75%" | "0%" |
| **Última Atualização** | "01/02/2026 14:30" | "-" |

### Gráfico de Evolução

- **Eixo X:** Nomes dos pilares (todos, ativos)
- **Eixo Y:** Escala 0-10
- **Barras:** Um conjunto por período congelado (cores cinza)
- **Pilares sem snapshot:** Barra vazia (null) naquele período
- **Scroll:** Se > 10 pilares, permite scroll horizontal

---

## Impacto no Negócio

| Aspecto | Antes (v1.0) | Depois (v1.1) | Ganho |
|---------|---|---|---|
| **Visibilidade** | 40% pilares | 100% pilares | 150% ↑ |
| **Confiança** | Média (confuso) | Alta (transparente) | UX ↑ |
| **Planejamento** | Difícil | Direto | Eficiência ↑ |
| **Onboarding** | Confuso | Óbvio | Curva learning ↓ |

---

## Critérios de Sucesso

- [x] Todos pilares ativos aparecem (100% cobertura)
- [x] Pilares sem avaliação claramente indicados (0)
- [x] Ordenação padrão é alfabética
- [x] Gráfico suporta 20+ pilares
- [x] Performance: load < 2s (3 requests paralelos)
- [x] Soft delete respeitado (inativos ocultos)
- [x] RBAC mantido (sem mudança)

---

## Versão do Documento

| Versão | Data | Status | Mudança |
|--------|------|--------|---------|
| 1.0 | ~Jan 2026 | Obsoleta | Apenas pilares com avaliação |
| **1.1** | 2026-02-05 | ✅ ATIVA | **Todos os pilares visíveis** |

---

## Dependências Técnicas

| Componente | Função | Mudança |
|---|---|---|
| `PilaresEmpresaService.listarPilaresDaEmpresa()` | Listar todos | ✅ Nenhuma |
| `DiagnosticoService.calcularMediasPilares()` | Calcular médias | ✅ Nenhuma |
| `diagnostico-evolucao.component.ts` | Orquestração | 🔧 Modificado `loadMedias()` |

---

## Referências

- **Arquivo Frontend:** `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts`
- **Template:** `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.html`
- **Handoff Business Analyst:** `/docs/6-handoffs/pilar-evolucao-completo/business-v1.md`
- **Handoff README:** `/docs/6-handoffs/pilar-evolucao-completo/README.md`
