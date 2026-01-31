# Dev Handoff: Evolução do Seed - Cockpit Marketing + Indicadores

**Data:** 2026-01-22  
**Implementador:** Dev Agent  
**Regras Base:** [cockpit-pilares.md](../../business-rules/cockpit-pilares.md), [cockpit-gestao-indicadores.md](../../business-rules/cockpit-gestao-indicadores.md), [periodo-avaliacao.md](../../business-rules/periodo-avaliacao.md)

---

## 1 Escopo Implementado

Evolução do seed E2E com dados realistas para:
- 1 Cockpit de Marketing para Empresa Teste A
- 5 Indicadores de Marketing com diferentes tipos de medida
- Valores mensais (meta, realizado, histórico) para 2 indicadores cobrindo ano 2026

### Objetivo

Fornecer dados de teste mais realistas que permitam validar:
- Interface de gestão de cockpits
- Interface de gestão de indicadores
- Gráficos de evolução de indicadores
- Filtro por período de mentoria
- Comparação meta vs realizado vs histórico

---

## 2 Arquivos Criados/Alterados

### Backend

- [backend/prisma/seed.ts](../../../backend/prisma/seed.ts#L919-L1095) - Adicionada seção 10 (Cockpit + Indicadores)
  - **Linhas 919-1095:** Nova seção de criação de cockpit e indicadores
  - **Linha 929:** Criação do CockpitPilar para pilar Marketing
  - **Linhas 937-990:** Criação de 5 IndicadorCockpit
  - **Linhas 1020-1051:** Criação de 12 valores mensais para "Leads Gerados"
  - **Linhas 1054-1091:** Criação de 6 valores mensais para "Taxa de Conversão"
  - **Linhas 1096-1116:** Atualização do resumo final

---

## 3 Decisões Técnicas

### 3.1 Estrutura dos Indicadores

Criados 5 indicadores com diferentes tipos de medida para cobrir cenários diversos:

1. **Leads Gerados** (QUANTIDADE, MAIOR)
   - Tipo: Valor absoluto
   - 12 meses de dados completos (jan-dez 2026)
   - Meta crescente: 80 → 125 leads/mês
   - Realizado varia entre 75-130 (simula superação e falhas)
   - Histórico: Dados do ano anterior (2025) para comparação

2. **Taxa de Conversão** (PERCENTUAL, MAIOR)
   - Tipo: Percentual
   - 6 meses de dados (jan-jun 2026)
   - Meta crescente: 12.0% → 14.0%
   - Demonstra indicador em preenchimento gradual

3. **CAC - Custo de Aquisição** (REAL, MENOR)
   - Tipo: Valor monetário
   - Direção: Menor é melhor (diferente dos outros)
   - Apenas configurado, sem valores mensais

4. **ROI de Campanhas** (PERCENTUAL, MAIOR)
   - Tipo: Percentual
   - Apenas configurado, sem valores mensais

5. **Engajamento Redes Sociais** (QUANTIDADE, MAIOR)
   - Tipo: Valor absoluto
   - Apenas configurado, sem valores mensais

**Justificativa:** Variedade de tipos permite validar diferentes UX e cálculos.

### 3.2 Período de Mentoria

Todos os valores mensais estão vinculados ao `periodoMentoriaA` (2026-01-01 a 2027-01-01):
- Garante consistência com período ativo
- Permite testar filtro por período no frontend
- Alinhado com regra R-MENT-008 e R-MENT-009

### 3.3 Status de Medição

Todos os indicadores criados com:
- `statusMedicao: MEDIDO_CONFIAVEL`
- Atribuição ao responsável: `gestorA`

**Nota:** Campos `responsavelMedicao` e `statusMedicao` foram REMOVIDOS do modelo `IndicadorMensal` durante implementação pois:
- Schema não possui esses campos em IndicadorMensal
- Esses campos existem em IndicadorCockpit, não em IndicadorMensal
- Valores mensais são apenas dados numéricos (meta, realizado, histórico)

### 3.4 Uso de `findFirst + create` ao invés de `upsert`

Não existe unique constraint `indicadorCockpitId_ano_mes` no schema:
```prisma
@@index([indicadorCockpitId])
@@index([periodoMentoriaId])
```

Solução: Usar `findFirst` para verificar existência + `create` condicional.

**Alternativa futura:** Adicionar unique constraint ao schema se necessário.

### 3.5 Dados Realistas

Valores simulam cenário real de startup em crescimento:
- Meta progressiva (+5 a +10% mês a mês)
- Realizado varia: alguns meses superam meta, outros ficam abaixo
- Histórico sempre menor que realizado (simula evolução positiva)

---

## 4 Ambiguidades e TODOs

- [x] ~~Verificar se `empresaId` deve existir em CockpitPilar~~ → Removido, não existe no schema
- [x] ~~Validar unique constraint para IndicadorMensal~~ → Não existe, usado findFirst
- [ ] Considerar adicionar unique constraint `indicadorCockpitId_ano_mes` no futuro
- [ ] Preencher valores mensais para os outros 3 indicadores (CAC, ROI, Engajamento)
- [ ] Criar cockpits para outros pilares (Vendas, Financeiro) em futuras evoluções

---

## 5 Testes de Suporte

### 5.1 Execução do Seed

✅ Seed executado com sucesso via `npx prisma migrate reset --force`:
```
✅ Cockpit de Marketing criado
✅ 5 indicadores criados para Cockpit de Marketing
✅ 12 valores mensais criados para indicador "Leads Gerados"
✅ 6 valores mensais criados para indicador "Taxa de Conversão"
```

### 5.2 Dados Criados

Resumo final confirma:
- 1 cockpit de Marketing
- 5 indicadores de Marketing
- 18 valores mensais (12 Leads + 6 Taxa Conversão)

### 5.3 Validações Pendentes

- [ ] Acessar interface de cockpits e verificar se cockpit de Marketing aparece
- [ ] Verificar lista de 5 indicadores na interface
- [ ] Validar gráfico de "Leads Gerados" mostrando 12 meses
- [ ] Validar gráfico de "Taxa de Conversão" mostrando 6 meses
- [ ] Testar filtro de período de mentoria nos gráficos
- [ ] Verificar comparação meta vs realizado vs histórico

---

## 6 Dados Criados - Detalhamento

### 6.1 Indicador "Leads Gerados" (12 meses - 2026)

| Mês | Meta | Realizado | Histórico (2025) | Status |
|-----|------|-----------|------------------|--------|
| Jan | 80   | 75        | 65              | 📉 Abaixo |
| Fev | 85   | 90        | 70              | 📈 Acima |
| Mar | 90   | 88        | 72              | 📉 Abaixo |
| Abr | 95   | 92        | 75              | 📉 Abaixo |
| Mai | 100  | 105       | 80              | 📈 Acima |
| Jun | 100  | 98        | 82              | 📉 Abaixo |
| Jul | 105  | 110       | 85              | 📈 Acima |
| Ago | 105  | 102       | 87              | 📉 Abaixo |
| Set | 110  | 115       | 90              | 📈 Acima |
| Out | 115  | 118       | 92              | 📈 Acima |
| Nov | 120  | 122       | 95              | 📈 Acima |
| Dez | 125  | 130       | 98              | 📈 Acima |

**Evolução:**
- ✅ Tendência de crescimento: 75 → 130 leads (+73%)
- ✅ Supera meta em 7 de 12 meses (58%)
- ✅ Evolução positiva vs histórico em todos os meses

### 6.2 Indicador "Taxa de Conversão" (6 meses - 2026)

| Mês | Meta  | Realizado | Histórico (2025) | Status |
|-----|-------|-----------|------------------|--------|
| Jan | 12.0% | 11.5%     | 10.0%           | 📉 Abaixo |
| Fev | 12.5% | 13.0%     | 10.5%           | 📈 Acima |
| Mar | 13.0% | 12.8%     | 11.0%           | 📉 Abaixo |
| Abr | 13.5% | 13.2%     | 11.5%           | 📉 Abaixo |
| Mai | 14.0% | 14.5%     | 12.0%           | 📈 Acima |
| Jun | 14.0% | 13.8%     | 12.5%           | 📉 Abaixo |

**Evolução:**
- ✅ Tendência de crescimento: 11.5% → 14.5% (+26%)
- ✅ Supera meta em 2 de 6 meses (33%)
- ✅ Evolução positiva vs histórico em todos os meses

---

## 7 Status para Próximo Agente

✅ **Pronto para:** Validação em UI (testes manuais ou E2E)

### Checklist de Validação

**Pattern Enforcer:**
- ✅ Código segue convenções de naming
- ✅ Estrutura do seed mantém organização por seções
- ✅ Uso correto de Prisma Client (await, upsert, findFirst)
- ✅ Tipos TypeScript corretos (as const para enums)

**QA Unitário:**
- N/A (seed não possui testes unitários - é script de dados)

**QA E2E:**
- [ ] Criar teste E2E que valida existência de cockpit Marketing
- [ ] Criar teste E2E que valida 5 indicadores na lista
- [ ] Criar teste E2E que valida gráfico com 12 pontos de dados

**Atenções Especiais:**
- Verificar se `periodoMentoriaId` está sendo usado corretamente no filtro de gráficos
- Validar formatação de valores percentuais vs quantitativos vs monetários
- Confirmar que histórico aparece como linha secundária nos gráficos

---

**Handoff criado automaticamente pelo Dev Agent**
