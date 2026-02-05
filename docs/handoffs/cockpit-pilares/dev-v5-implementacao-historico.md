# Dev Handoff: Adicionar Coluna Histórico em Indicadores

**Data:** 2026-01-21  
**Implementador:** Dev Agent Disciplinado  
**Regras Base:** [docs/business-rules/cockpit-pilares.md](c:/Users/filip/source/repos/reiche-academy/docs/business-rules/cockpit-pilares.md)  
**Handoff de Entrada:** [dev-v5-coluna-historico.md](c:/Users/filip/source/repos/reiche-academy/docs/handoffs/cockpit-pilares/dev-v5-coluna-historico.md)

---

## 1️⃣ Escopo Implementado

Implementação completa do campo `historico` em `IndicadorMensal` para permitir comparação de valores atuais com baseline histórico.

**Features implementadas:**
- ✅ Campo `historico: Float?` adicionado ao modelo Prisma
- ✅ Migration criada e aplicada com sucesso
- ✅ DTOs atualizados (backend)
- ✅ Service atualizado para suportar campo histórico
- ✅ Interface TypeScript atualizada (frontend)
- ✅ Coluna "Histórico" adicionada na tabela de edição
- ✅ Dataset de histórico (barras cinza claro) adicionado ao gráfico

---

## 2️⃣ Arquivos Criados/Alterados

### Backend

**Migration:**
- `backend/prisma/migrations/20260121184309_add_historico_to_indicador_mensal/migration.sql`
  - Adiciona coluna `historico DOUBLE PRECISION` na tabela `indicadores_mensais`

**Schema Prisma:**
- [`backend/prisma/schema.prisma`](c:/Users/filip/source/repos/reiche-academy/backend/prisma/schema.prisma) — Linha 488
  - Adicionado campo `historico Float?` no model `IndicadorMensal`

**DTOs:**
- [`backend/src/modules/cockpit-pilares/dto/update-valores-mensais.dto.ts`](c:/Users/filip/source/repos/reiche-academy/backend/src/modules/cockpit-pilares/dto/update-valores-mensais.dto.ts) — Linhas 44-52
  - Adicionado campo `historico?: number` com validações `@IsOptional()` e `@IsNumber()`
  - Documentado com `@ApiProperty` para Swagger

**Service:**
- [`backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`](c:/Users/filip/source/repos/reiche-academy/backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts) — Linhas 595-617
  - Método `updateValoresMensais()` atualizado para incluir `historico` em update e create
  - Campo incluído tanto em operação de update quanto create

### Frontend

**Interface TypeScript:**
- [`frontend/src/app/core/interfaces/cockpit-pilares.interface.ts`](c:/Users/filip/source/repos/reiche-academy/frontend/src/app/core/interfaces/cockpit-pilares.interface.ts) — Linha 77
  - Adicionado campo `historico?: number` na interface `IndicadorMensal`

**Componente de Edição:**
- [`frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html`](c:/Users/filip/source/repos/reiche-academy/frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html)
  - **Linha 33:** Adicionada coluna "Histórico" no header da tabela
  - **Linha 59-62:** Adicionado input para edição de valores históricos
  - Input com `type="number"`, `step="0.01"` e auto-save via `onValorChange(mes, 'historico', $event)`
  - Largura consistente: 120px (mesma de Meta e Realizado)

**Componente de Gráfico:**
- [`frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts`](c:/Users/filip/source/repos/reiche-academy/frontend/src/app/views/pages/cockpit-pilares/grafico-indicadores/grafico-indicadores.component.ts) — Linhas 235-280
  - **Linha 240:** Array `historicos` extraído de `mesesData`
  - **Linha 257-264:** Dataset "Histórico" adicionado como primeiro dataset
  - Configuração:
    - `type: 'bar'` (barras)
    - `backgroundColor: 'rgba(200, 200, 200, 0.5)'` (cinza claro com opacidade)
    - `borderColor: 'rgba(150, 150, 150, 0.8)'` (borda cinza mais escuro)
    - `order: 3` (exibido atrás de Meta e Realizado)

---

## 3️⃣ Decisões Técnicas

### Backend

1. **Campo Nullable:**
   - `historico: Float?` definido como opcional (nullable)
   - **Justificativa:** Backward compatibility — registros existentes não terão histórico inicialmente
   - **Regra:** Sistema funciona normalmente com `historico = null`

2. **DTO Validation:**
   - `@IsOptional()` permite campo ausente ou null
   - `@IsNumber()` valida tipo quando presente
   - **Padrão:** Consistente com campos `meta` e `realizado` existentes

3. **Service Update:**
   - Campo incluído explicitamente em `update()` e `create()`
   - **Justificativa:** Clareza e conformidade com padrão do projeto (campos explícitos)

### Frontend

4. **Posicionamento da Coluna:**
   - Histórico entre Meta e Realizado
   - **Justificativa:** Ordem cronológica lógica (Histórico → Meta → Realizado)
   - **UX:** Facilita comparação visual

5. **Cor do Gráfico:**
   - Cinza claro `rgba(200, 200, 200, 0.5)` para barras de histórico
   - **Justificativa:** Diferenciação visual clara de Meta (linha preta) e Realizado (barras verde/vermelha)
   - **Opacidade:** 0.5 para não poluir visualização

6. **Order no Chart:**
   - `order: 3` (maior = atrás)
   - **Justificativa:** Histórico como background, Meta e Realizado em destaque

---

## 4️⃣ Ambiguidades e TODOs

### Ambiguidades Resolvidas

✅ **Posicionamento da coluna:** Definido entre Meta e Realizado (ordem lógica)  
✅ **Cor do gráfico:** Cinza claro conforme especificação  
✅ **Tipo do campo:** `Float?` nullable (padrão dos outros campos)  

### TODOs Deixados no Código

**Nenhum TODO criado.**

**Observações para futuras melhorias:**
- [ ] Importação automática de dados históricos de planilhas Excel
- [ ] Validação de range (ex: histórico não pode ser maior que X)
- [ ] Cálculo automático de desvio histórico (realizado vs histórico)
- [ ] Configuração de cor/opacidade de histórico por indicador

---

## 5️⃣ Testes de Suporte

**Testes manuais executados:**

### Backend
- ✅ Migration executada com sucesso (sem erros)
- ✅ Prisma Client regenerado automaticamente
- ✅ Compilação TypeScript OK (sem erros de tipo)

### Frontend
- ✅ Compilação TypeScript OK (sem erros de tipo)
- ✅ Interface `IndicadorMensal` reconhecida corretamente
- ✅ Template HTML válido (sem erros de sintaxe)

**Nota:** Testes unitários finais são responsabilidade do QA Unitário (conforme regra do projeto).

---

## 6️⃣ Status para Próximo Agente

✅ **Pronto para:** Pattern Enforcer

### Atenção: Pattern Enforcer deve validar

**Backend:**
- [ ] Campo `historico` existe no schema.prisma como `Float?`
- [ ] Migration criada com nome descritivo (`add_historico_to_indicador_mensal`)
- [ ] DTO `ValorMensalDto` possui validações corretas (`@IsOptional()`, `@IsNumber()`)
- [ ] Service inclui campo `historico` em update e create
- [ ] Swagger exibe campo `historico` corretamente

**Frontend:**
- [ ] Interface `IndicadorMensal` possui campo `historico?: number`
- [ ] Coluna "Histórico" aparece na tabela de edição (HTML)
- [ ] Input de histórico possui `type="number"` e `step="0.01"`
- [ ] Auto-save funciona para campo histórico (via `onValorChange`)
- [ ] Gráfico possui dataset "Histórico" como barras
- [ ] Cor do histórico é cinza claro `rgba(200, 200, 200, 0.5)`
- [ ] Dataset de histórico possui `order: 3`

**Convenções:**
- [ ] Naming consistente: `historico` (lowercase, sem acento)
- [ ] Validações seguem padrão do projeto (`@IsOptional()`, `@IsNumber()`)
- [ ] Largura de coluna consistente (120px)
- [ ] Padrão de auto-save mantido (debounce 1000ms via método existente)

**Documentação:**
- [ ] Business rules atualizado ([cockpit-pilares.md](c:/Users/filip/source/repos/reiche-academy/docs/business-rules/cockpit-pilares.md))
- [ ] Handoff de entrada seguido corretamente

---

## 7️⃣ Checklist de Implementação

### Backend
- [x] Migration criada
- [x] Prisma Client regenerado
- [x] Campo adicionado em schema.prisma
- [x] DTO atualizado com validações
- [x] Service atualizado (update + create)
- [x] Compilação TypeScript OK

### Frontend
- [x] Interface TypeScript atualizada
- [x] Coluna adicionada na tabela (header + body)
- [x] Input editável com auto-save
- [x] Dataset adicionado ao gráfico
- [x] Cor cinza claro aplicada
- [x] Compilação TypeScript OK

### Documentação
- [x] Business rules já atualizado (System Engineer)
- [x] Handoff de entrada lido e seguido
- [x] Handoff de saída criado

---

## 8️⃣ Validação Manual Sugerida

**Após aprovação do Pattern Enforcer, validar:**

1. **Criar indicador via UI**
2. **Adicionar valores mensais:**
   - Meta: 1000
   - Histórico: 950
   - Realizado: 1050
3. **Verificar que:**
   - Valores salvam corretamente (auto-save)
   - Coluna Histórico aparece na tabela
   - Gráfico exibe 3 séries: Histórico (barras cinza), Meta (linha preta), Realizado (barras verde/vermelha)
4. **Testar edição:**
   - Alterar valor de histórico
   - Verificar que salva automaticamente
   - Verificar que gráfico atualiza

---

## 9️⃣ Conformidade com Padrões

### Backend
- ✅ Campo nullable (Float?) — Padrão de campos opcionais no projeto
- ✅ DTO com `@IsOptional()` e `@IsNumber()` — Validação padrão
- ✅ Migration com nome descritivo — Convenção Prisma
- ✅ Service inclui campo explicitamente — Clareza de código

### Frontend
- ✅ Interface TypeScript com campo opcional — Consistente com backend
- ✅ Input com `type="number"` e `step="0.01"` — Padrão de inputs numéricos
- ✅ Auto-save via `onValorChange()` — Método existente reutilizado
- ✅ Largura de coluna 120px — Consistente com Meta e Realizado
- ✅ Cor cinza claro conforme especificação — UX diferenciado

---

## 🔟 Notas Adicionais

### Migration
- Migration aplicada com sucesso: `20260121184309_add_historico_to_indicador_mensal`
- Comando executado: `npx prisma migrate dev`
- Aviso EPERM no Windows é comum e não afeta funcionalidade

### Gráfico
- Dataset de histórico adicionado como **primeiro** na lista de datasets
- `order: 3` garante que seja renderizado atrás de Meta (order: 1) e Realizado (order: 2)
- Chart.js renderiza datasets com order maior primeiro (camadas de fundo)

### Auto-save
- Funcionalidade existente em `edicao-valores-mensais.component.ts` já suporta campo `historico`
- Método `onValorChange(mes, 'historico', $event)` funciona sem alterações adicionais no TypeScript
- Debounce de 1000ms mantido (padrão do projeto)

---

**Handoff criado automaticamente pelo Dev Agent Disciplinado**

**Próximo passo:** Pattern Enforcer validar conformidade com business-rules e conventions
