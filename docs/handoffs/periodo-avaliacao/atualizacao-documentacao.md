# Atualização de Documentação - Período de Avaliação

**Data:** 2026-01-14  
**Responsável:** Dev Agent  
**Tipo:** Atualização de Regras de Negócio

---

## Contexto da Mudança

Removida a restrição que obrigava a data de referência do período de avaliação a ser o **último dia do trimestre**.

### Regra Anterior (REMOVIDA)
- ❌ `dataReferencia` DEVE ser último dia do trimestre (31/mar, 30/jun, 30/set, 31/dez)
- ❌ Frontend validava se data era último dia do trimestre
- ❌ Backend validava com `endOfQuarter()` e `isSameDay()`

### Nova Regra (IMPLEMENTADA)
- ✅ `dataReferencia` pode ser **qualquer data**
- ✅ Trimestre é **calculado automaticamente** baseado no mês: jan-mar=Q1, abr-jun=Q2, jul-set=Q3, out-dez=Q4
- ✅ Intervalo mínimo de 90 dias calculado entre as `dataReferencia` escolhidas
- ✅ Gráfico exibe mês/ano da `dataReferencia` real (ex: `01/2026`, `05/2026`) ao invés de Q1, Q2, etc.

---

## Arquivos de Código Já Atualizados

### Backend
- ✅ `backend/src/modules/periodos-avaliacao/periodos-avaliacao.service.ts`
  - Removida validação `endOfQuarter()` e `isSameDay()`
  - Removidas importações desnecessárias do date-fns
  - Mantido `getQuarter(dataRef)` para calcular trimestre

- ✅ `backend/src/modules/periodos-avaliacao/dto/create-periodo-avaliacao.dto.ts`
  - Atualizada descrição do campo `dataReferencia`

- ✅ `backend/prisma/schema.prisma`
  - Atualizado comentário do campo `dataReferencia`

### Frontend
- ✅ `frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts`
  - Removida validação de último dia do trimestre em `confirmarIniciarPeriodo()`
  - Data sugerida alterada para data atual

- ✅ `frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.html`
  - Textos do modal atualizados

- ✅ `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts`
  - Gráfico alterado para exibir mês/ano da `dataReferencia` real
  - Datasets ordenados por data real (não trimestre fixo)

- ✅ `frontend/src/app/core/services/periodos-avaliacao.service.ts`
  - Atualizado JSDoc do método `iniciar()`

---

## Arquivos de Documentação a Atualizar

### 1. Regras de Negócio
**Arquivo:** `/docs/business-rules/periodo-avaliacao.md`

#### Seções a Modificar:

**Linha 68** - Validações:
```diff
- Validação de data de referência (último dia do trimestre)
+ Cálculo automático de trimestre baseado na data de referência
```

**Linha 87** - Tabela de Campos:
```diff
| Campo | Tipo | Descrição |
|-------|------|-----------|
- | dataReferencia | DateTime | Último dia do trimestre (ex: 2026-03-31) |
+ | dataReferencia | DateTime | Data de referência do período (qualquer data, trimestre calculado automaticamente) |
```

**Linha 135** - Descrição do UC001:
```diff
- **Descrição:** Admin cria novo período trimestral fornecendo data de referência (último dia do trimestre).
+ **Descrição:** Admin cria novo período trimestral fornecendo data de referência (qualquer data).
```

**Linhas 157-161** - Remover Validação Completa:
```diff
- 3. **Deve Ser Último Dia do Trimestre:**
-   ```typescript
-   const ultimoDia = endOfQuarter(dataRef);
-   if (!isSameDay(dataRef, ultimoDia)) {
-     throw new BadRequestException('A data de referência deve ser o último dia do trimestre');
-   }
-   ```
```

**Linha 547** - Frontend:
```diff
- Validação frontend: data deve ser último dia do trimestre
+ Frontend: trimestre calculado automaticamente pelo backend
```

**Linha 659** - Fluxo de Congelamento:
```diff
- Backend valida se é último dia do trimestre
+ Backend calcula trimestre com getQuarter(dataRef)
```

**Linha 765** - Tabela de Validações:
```diff
- | V-PEVOL-002 | Último dia do trimestre | 🚧 A implementar |
+ | V-PEVOL-002 | Cálculo automático de trimestre | ✅ Implementado |
```

---

### 2. ADR (Architecture Decision Record)
**Arquivo:** `/docs/adr/009-periodo-avaliacao-trimestral.md`

#### Seções a Modificar:

**Linha 68** - Schema Prisma:
```diff
  periodoAvaliacao  PeriodoAvaliacao? @relation(fields: [periodoAvaliacaoId], references: [id], onDelete: Cascade)
  
- dataReferencia    DateTime // Ex: 2026-03-31 (último dia do trimestre)
+ dataReferencia    DateTime // Data de referência (qualquer data, trimestre calculado)
```

**Linha 118** - Fluxo Frontend:
```diff
- Modal solicita `dataReferencia` (último dia do trimestre)
+ Modal solicita `dataReferencia` (qualquer data, trimestre calculado automaticamente)
```

**Linha 340** - Exemplo de Requisição:
```diff
{
- "dataReferencia": "2026-03-31" // ISO 8601 (último dia do trimestre)
+ "dataReferencia": "2026-03-31" // ISO 8601 (qualquer data, ex: 31/mar, 15/abr, 20/set)
}
```

---

### 3. Handoff do Dev Agent
**Arquivo:** `/docs/handoffs/diagnostico-evolucao/dev-v1.md`

#### Seções a Modificar:

**Linha 16** - Escopo:
```diff
- Validações de negócio: intervalo mínimo 90 dias, último dia do trimestre, período único ativo
+ Validações de negócio: intervalo mínimo 90 dias (calculado entre dataReferencia), período único ativo
```

**Linha 94** - Remover Seção Completa:
```diff
- ### Validação de Último Dia do Trimestre
- 
- (remover todo o bloco de código)
```

**Linha 186** - Decisões Técnicas:
```diff
- 2. ✅ Modal de iniciar período valida data (erro se não for último dia do trimestre)
+ 2. ✅ Modal de iniciar período aceita qualquer data (trimestre calculado pelo backend)
```

---

### 4. Instruções para Pattern Enforcer
**Arquivo:** `/docs/handoffs/diagnostico-evolucao/INSTRUCAO_PATTERN_ENFORCER.md`

#### Seções a Modificar:

**Linha 155** - Validações:
```diff
- Validar cálculo correto do último dia do trimestre
+ Validar cálculo correto do trimestre usando getQuarter(dataRef)
```

---

### 5. CHANGELOG
**Arquivo:** `/docs/history/CHANGELOG.md`

#### Adicionar Nova Entrada no Topo:

```markdown
## [1.1.0] - 2026-01-14

### Changed
- **Período de Avaliação - Flexibilização da Data de Referência**
  - Removida restrição de último dia do trimestre
  - `dataReferencia` agora aceita qualquer data
  - Trimestre calculado automaticamente: jan-mar=Q1, abr-jun=Q2, jul-set=Q3, out-dez=Q4
  - Intervalo mínimo de 90 dias calculado entre datas de referência escolhidas
  - Gráfico exibe mês/ano da `dataReferencia` real (ex: 01/2026, 05/2026)

### Removed
- Backend: validação `endOfQuarter()` e `isSameDay()`
- Frontend: validação de último dia do trimestre no modal
```

#### Atualizar Entradas Antigas:

**Linha 13** - Validações (versão anterior):
```diff
- Validação de data de referência (deve ser último dia do trimestre)
+ (remover esta linha - regra obsoleta)
```

**Linha 37** - Frontend (versão anterior):
```diff
- Validação frontend: data deve ser último dia do trimestre
+ (remover esta linha - regra obsoleta)
```

---

### 6. Especificação Técnica
**Arquivo:** `/docs/handoffs/periodo-avaliacao/especificacao-tecnica.md`

**Linha 59** - Schema:
```diff
- dataReferencia    DateTime // Ex: 2026-03-31 (último dia do trimestre)
+ dataReferencia    DateTime // Data de referência (qualquer data, trimestre calculado)
```

---

## Instruções para Agente de Documentação

### Passo 1: Ler Este Documento
- Compreender o contexto da mudança
- Identificar todos os arquivos a serem atualizados
- Verificar se há outros arquivos não listados que mencionam "último dia do trimestre"

### Passo 2: Buscar Referências Adicionais
Execute busca global:
```bash
grep -r "último dia do trimestre" docs/
grep -r "last day of quarter" docs/
grep -r "endOfQuarter" docs/
grep -r "V-PEVOL-002" docs/
```

### Passo 3: Aplicar Mudanças Sistematicamente
Para cada arquivo listado:
1. Abrir arquivo
2. Localizar seção exata (usar número de linha como referência)
3. Aplicar mudança conforme diff indicado
4. Verificar consistência com resto do documento
5. Salvar arquivo

### Passo 4: Atualizar CHANGELOG
- Adicionar entrada `[1.1.0] - 2026-01-14` no topo
- Marcar como `Changed` e `Removed`
- Remover referências obsoletas nas versões anteriores

### Passo 5: Criar Handoff de Atualização
Após completar todas as atualizações, criar:
- `/docs/handoffs/periodo-avaliacao/doc-update-v1.md`

Incluir:
- Lista de arquivos modificados
- Resumo das mudanças aplicadas
- Data da atualização
- Confirmação de que todas as referências obsoletas foram removidas

### Passo 6: Validação Final
- [ ] Todos os arquivos listados foram atualizados
- [ ] Busca por "último dia do trimestre" retorna 0 resultados em `/docs/`
- [ ] CHANGELOG possui entrada `[1.1.0]`
- [ ] ADR 009 está consistente
- [ ] Regras de negócio estão corretas
- [ ] Handoff criado em `/docs/handoffs/periodo-avaliacao/`

---

## Resumo da Mudança

### Antes
```typescript
// Backend
const ultimoDia = endOfQuarter(dataRef);
if (!isSameDay(dataRef, ultimoDia)) {
  throw new BadRequestException('Deve ser último dia do trimestre');
}

// Frontend
if (dataRef.getDate() !== ultimoDiaEsperado.getDate()) {
  this.showToast('Deve ser último dia de trimestre', 'error');
  return;
}
```

### Depois
```typescript
// Backend
const trimestre = getQuarter(dataRef); // Calcula automaticamente
const ano = getYear(dataRef);

// Frontend
// Sem validação - aceita qualquer data
this.periodosService.iniciar(empresaId, dataReferencia).subscribe(...);
```

---

## Benefícios da Nova Abordagem

1. **Flexibilidade:** Admin pode escolher qualquer data significativa para a empresa
2. **Simplicidade:** Menos validações, menos código
3. **Usabilidade:** Não força datas específicas (31/mar, 30/jun, etc.)
4. **Precisão:** Intervalo de 90 dias calculado entre datas reais escolhidas
5. **Transparência:** Gráfico mostra mês/ano exato da referência

---

**Fim do Documento de Instruções**
