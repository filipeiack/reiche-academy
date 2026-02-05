# 📊 Regra de Negócio: Exibição Completa de Pilares na Evolução

**Identificador:** RN-DIAG-EVO-001  
**Categoria:** Diagnóstico de Pilares  
**Status:** ✅ ATIVA  
**Versão:** 1.1  
**Data de Atualização:** 2026-02-05

---

## 📋 Descrição

A tela **Evolução dos Pilares** deve exibir **TODOS os pilares cadastrados na empresa**, independentemente de possuírem avaliações ou médias associadas no momento.

**Antes (v1.0):** Apenas pilares com avaliações comprovadas apareciam na tela.  
**Agora (v1.1):** Todos os pilares aparecem, com destaque especial para aqueles sem avaliações ainda.

---

## 🎯 Objetivo

- Fornecer visibilidade completa do panorama de pilares da empresa
- Identificar rapidamente quais pilares ainda não foram avaliados
- Preparar a empresa para iniciar avaliações em novos pilares
- Evitar impressão de "dados faltando" ou tela incompleta

---

## 📐 Especificação Técnica

### Escopo dos Dados

```typescript
// Antes (v1.0): Apenas pilares com média
const medias = await diagnosticoService.calcularMediasPilares(empresaId);
// Resultado: Array com max 5 pilares (só os com notas)

// Agora (v1.1): Todos os pilares + suas médias (se tiverem)
const todosOsPilares = await pilaresEmpresaService.listarPilaresDaEmpresa(empresaId);
const mediasPilares = await diagnosticoService.calcularMediasPilares(empresaId);
// Resultado: Array com 12+ pilares (todos da empresa)
```

### Dados de um Pilar sem Avaliação

Quando um pilar **não tem médias ainda**, o componente cria um objeto padrão:

```typescript
{
  pilarEmpresaId: "uuid-da-empresa",
  pilarId: "uuid-do-template",
  pilarNome: "Operacional",
  mediaAtual: 0,              // ← Sem avaliação
  totalRotinasAvaliadas: 0,
  totalRotinas: 0,
  ultimaAtualizacao: null
}
```

### Filtros Aplicados

1. **Apenas pilares ativos:** `pilar.ativo === true`
2. **Ordenação padrão (sem filtro):**
   - Pilares com média (desc) → depois
   - Pilares sem média (alfabético)
3. **Ordenação quando coluna selecionada:** Conforme critério escolhido pelo usuário

---

## 🚦 Casos de Uso Validados

### Caso 1: Empresa Nova (sem avaliações)
```
Entrada:
- Empresa com 8 pilares cadastrados
- Nenhuma avaliação realizada ainda

Saída:
- Tabela exibe 8 linhas
- Todas com mediaAtual = 0
- Todas com ultimaAtualizacao = "-"
```

### Caso 2: Empresa em Progresso (algumas avaliações)
```
Entrada:
- Empresa com 8 pilares
- 4 pilares com avaliações (média 6, 7.5, 8, 9)
- 4 pilares ainda não avaliados

Saída:
- Tabela exibe 8 linhas
- Linhas 1-4: Pilares com média (ordenados desc: 9, 8, 7.5, 6)
- Linhas 5-8: Pilares sem média (alfabético)
- Usuário identifica imediatamente que precisa avaliar 4 pilares
```

### Caso 3: Pilares Customizados + Pilares do Template
```
Entrada:
- Pilares do template (5): Operacional, Administrativo, Financeiro, Vendas, RH
- Pilares customizados (3): Inovação, Qualidade, Sustentabilidade

Saída:
- Tabela exibe 8 linhas (5 template + 3 customizados)
- Todos incluídos na combinação de dados
```

---

## 🔐 Regras de Acesso

| Perfil | Permissão | Nota |
|--------|-----------|------|
| **ADMINISTRADOR** | ✅ Ver todos os pilares de qualquer empresa | Selecionável via navbar |
| **GESTOR** | ✅ Ver todos os pilares da sua empresa | Visão fixa da empresa |
| **COLABORADOR** | ✅ Ver todos os pilares e histórico | Visão fixa da empresa |
| **LEITURA** | ✅ Ver todos os pilares (read-only) | Sem ações de congelamento |

---

## 🔄 Lógica de Combinação de Dados

```
1. Buscar em paralelo:
   - Todos os pilares da empresa (via listarPilaresDaEmpresa)
   - Médias dos pilares (via calcularMediasPilares)

2. Criar Map de médias por pilarEmpresaId para O(1) lookup

3. Para cada pilar da empresa:
   IF pilar.ativo === true:
     IF existe média no Map:
       → Usar dados da média
     ELSE:
       → Criar objeto com mediaAtual = 0
     
4. Ordenar por: pilares com média (desc) + sem média (alfabético)

5. Renderizar tabela + gráfico de evolução
```

---

## 📊 Visualizações

### Tabela de Médias
- Coluna "Pilar": Nome completo
- Coluna "% Avaliação": `(totalRotinasAvaliadas / totalRotinas) * 100` ou "Sem dados"
- Coluna "Média Atual": `mediaAtual` (0-10) ou "-" para pilares sem avaliação
- Coluna "Última Atualização": Data/hora ou "-"

### Gráfico de Evolução
- **Eixo X:** Nomes dos pilares (todos, ativos)
- **Eixo Y:** Médias (0-10) com zonas coloridas
- **Datasets:** Um por período congelado
- **Dados vazios:** Se pilar não tem snapshot no período, a barra fica em branco (null)

---

## ⚠️ Comportamentos Especiais

### Pilar sem Avaliação mas com Rotinas
```typescript
// Exemplo: Operacional tem 5 rotinas, mas nenhuma foi avaliada ainda
{
  pilarEmpresaId: "abc",
  pilarNome: "Operacional",
  mediaAtual: 0,              // ← 0 porque nenhum nota registrada
  totalRotinasAvaliadas: 0,   // ← 0 porque nenhuma avaliada
  totalRotinas: 5
}
```

**Exibição:**
- "Operacional" — Média: **0** — % Avaliação: **0%** — Última: **-**

### Pilar Inativo
```typescript
// Pilares com ativo === false são EXCLUÍDOS da combinação
// Não aparecem na tela
```

---

## 🔧 Implementação

### Arquivo Afetado
- `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts`

### Método Principal
```typescript
loadMedias(): Promise<void>
  ↳ Chama em paralelo:
     • pilaresEmpresaService.listarPilaresDaEmpresa()
     • diagnosticoService.calcularMediasPilares()
  ↳ Combina dados
  ↳ Filtra ativos
  ↳ Ordena e renderiza
```

### Serviços Utilizados
1. **PilaresEmpresaService** — `listarPilaresDaEmpresa(empresaId)`
2. **DiagnosticoNotasService** — `calcularMediasPilares(empresaId)`
3. **PeriodosAvaliacaoService** — Histórico congelado (sem mudanças)

---

## 📈 Impacto no Negócio

| Aspecto | Antes | Depois |
|--------|-------|--------|
| **Visibilidade** | 40% dos pilares visíveis | 100% dos pilares visíveis |
| **Deciões** | Incerteza sobre o que falta | Clareza total do panorama |
| **Planejamento** | Difícil identificar próximos passos | Fácil listas pilares a avaliar |
| **Confiança** | "Estão faltando dados?" | "Vejo exatamente de onde estou" |

---

## ✅ Critérios de Sucesso

- [ ] Tela exibe **todos** os pilares da empresa (confirmado com >= 8 pilares)
- [ ] Pilares sem avaliação aparecem com "0" e "-" nas métricas
- [ ] Gráfico inclui todos os pilares (sem filtro de "apenas com dados")
- [ ] Ordenação padrão prioriza pilares com média
- [ ] Performance mantida (parallelismo de requisições)
- [ ] Nenhum pilar "sumindo" mesmo após recongelamento
- [ ] Teste em: novo cadastro (0 avaliações), em progresso, empresa madura

---

## 📝 Notas de Desenvolvimento

- **Não alterar backend**: Serviços retornam dados corretos
- **Apenas lógica frontend**: Combinação ocorre no componente Angular
- **Sem cache**: Cada load recarrega lista completamente
- **Soft delete**: Filtro `ativo === true` já garante respeito a soft deletes
- **Multi-tenant**: Dados isolados por `empresaId` em todas as camadas

---

## 🔗 Relacionados

| Documento | Relação |
|-----------|---------|
| [pilar-adicionar-drawer.md](./pilar-adicionar-drawer.md) | Criação de novos pilares (impacta lista) |
| [periodo-avaliacao.md](./periodo-avaliacao.md) | Congelamento de médias |
| [diagnostico-notas.md](./diagnostico-notas.md) | Avaliações de rotinas → médias |

---

## 📋 Histórico

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-01-15 | Comportamento inicial (apenas com médias) |
| **1.1** | **2026-02-05** | **Mostrar todos os pilares (com/sem avaliações)** |

---

**Documento Autorizado por:** Business Analyst  
**Última Revisão:** 2026-02-05
