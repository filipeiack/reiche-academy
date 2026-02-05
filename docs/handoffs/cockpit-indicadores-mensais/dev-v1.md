# Dev Handoff: Ciclos de Indicadores Mensais

**Data:** 2026-01-26  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [cockpit-indicadores-mensais.md](../../business-rules/cockpit-indicadores-mensais.md)  
**Business Analyst Handoff:** [business-v1.md](business-v1.md)

---

## 1️⃣ Escopo Implementado

- Removida dependência de `periodoMentoriaId` em `IndicadorMensal` (schema Prisma)
- Ajustado `createIndicador` para criar 12 meses consecutivos a partir do mês atual (sem resumo anual)
- Removida criação automática de meses em `PeriodosMentoriaService.create` e `renovar`
- Simplificado `updateValoresMensais` removendo validação R-MENT-008 e filtro por período
- Ajustado `getCockpitById` para retornar todos os meses sem filtro por período
- Criado endpoint `POST /cockpits/:cockpitId/meses/ciclo` para novo ciclo de 12 meses
- Adicionado botão "Novo ciclo de 12 meses" no frontend (edicao-valores-mensais)
- Implementada validação de habilitação do botão com base no período de mentoria
- Filtrado apenas últimos 13 meses para exibição no editor

## 2️⃣ Arquivos Criados/Alterados

### Backend
- [backend/prisma/schema.prisma](../../backend/prisma/schema.prisma#L507-L533) - Removido `periodoMentoriaId`, adicionado `@@unique([indicadorCockpitId, ano, mes])` e `@@index([ano, mes])`
- [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](../../backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts#L318-L450) - Atualizado `createIndicador` para criar 12 meses consecutivos
- [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](../../backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts#L210-L250) - Simplificado `getCockpitById` sem filtro por período
- [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](../../backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts#L603-L680) - Simplificado `updateValoresMensais` sem R-MENT-008
- [backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts](../../backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts#L720-L850) - Novo método `criarNovoCicloMeses`
- [backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts](../../backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts#L230-L260) - Novo endpoint POST `/cockpits/:cockpitId/meses/ciclo`
- [backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts](../../backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts#L70-L90) - Removida criação automática de meses em `create`
- [backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts](../../backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts#L200-L220) - Removida criação automática de meses em `renovar`

### Frontend
- [frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html](../../frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.html#L1-L25) - Adicionado botão "Novo ciclo de 12 meses" com validação
- [frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts](../../frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts#L1-L30) - Adicionados imports e propriedades de controle
- [frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts](../../frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/edicao-valores-mensais.component.ts#L280-L380) - Métodos `verificarPodeCriarNovoCiclo`, `criarNovoCicloMeses` e ajuste em `getMesesOrdenados`
- [frontend/src/app/core/services/cockpit-pilares.service.ts](../../frontend/src/app/core/services/cockpit-pilares.service.ts#L110-L125) - Novo método `criarNovoCicloMeses`

## 3️⃣ Decisões Técnicas

### Prisma Schema
- Removida relação com `PeriodoMentoria` em `IndicadorMensal`
- Adicionada constraint única `@@unique([indicadorCockpitId, ano, mes])` para evitar duplicatas
- Adicionado índice `@@index([ano, mes])` para acelerar buscas sequenciais
- Mantido campo `mes` como `Int?` para compatibilidade com resumos anuais futuros (se necessário)

### Backend - Criação de Meses
- Lógica de criação de 12 meses consecutivos calculando mês/ano a partir do `Date.now()`
- Ajuste automático de ano quando mês ultrapassa 12 (dezembro → janeiro do próximo ano)
- Uso de `skipDuplicates: true` em `createMany` para ignorar meses já existentes

### Backend - Novo Ciclo
- Validação dupla: backend e frontend verificam se mês atual >= mês final do período
- Para cada indicador, busca o último mês (`MAX(ano, mes)`) e cria 12 meses seguintes
- Resposta estruturada `{ sucesso, indicadores, mesesCriados }` para feedback detalhado

### Frontend - Filtro de Exibição
- Método `getMesesOrdenados` agora ordena DESC e aplica `.slice(0, 13).reverse()`
- Exibe sempre os 13 registros mais recentes, independente de períodos

### Frontend - Botão Habilitação
- Botão desabilitado enquanto `podeCriarNovoCiclo === false`
- Tooltip dinâmico com `mensagemBotaoCiclo` explicando motivo do bloqueio
- SweetAlert2 para confirmação antes de disparar criação

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas (PascalCase, camelCase, kebab-case)
- [x] Estrutura de pastas correta (service, controller, dto)
- [x] DTOs validados (UpdateValoresMensaisDto mantém validações existentes)
- [x] Prisma com `.select()` onde necessário
- [x] Guards aplicados (`@UseGuards(JwtAuthGuard, RolesGuard)`)
- [x] Soft delete respeitado (não aplicável a esta feature)
- [x] Audit logging implementado (criação de ciclo auditada)

### Frontend
- [x] Standalone components (edicao-valores-mensais já era standalone)
- [x] `inject()` function usado (PeriodosMentoriaService adicionado)
- [x] Control flow moderno (`@if`, `@for`) usado no template
- [x] Translations aplicadas (botão não usa tradução - texto direto)
- [x] ReactiveForms (não aplicável - usa FormsModule básico)
- [x] Error handling (SweetAlert2 para erros e sucessos)

**Violações encontradas durante auto-validação:**
- Nenhuma violação crítica identificada

## 5️⃣ Ambiguidades e TODOs

- [ ] Texto do botão "Novo ciclo de 12 meses" pode precisar revisão de UX/produto
- [ ] Considerar tradução do botão para i18n no futuro (atualmente hard-coded)
- [ ] Validar com QA se mensagem de erro do backend é clara o suficiente
- [ ] Confirmar se campo `mes: null` (resumo anual) ainda será usado no futuro

## 6️⃣ Testes de Suporte

Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados:**
- Nenhum teste unitário foi criado nesta iteração (Dev Agent não cria testes finais)

**Testes manuais realizados:**
- Schema Prisma valida sintaxe com `npx prisma format`
- Compilação TypeScript sem erros
- Endpoints Swagger gerados corretamente

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- **Criação de meses em 2 gatilhos:** Arquivo: `cockpit-pilares.service.ts:425` (createIndicador) e `cockpit-pilares.service.ts:750` (criarNovoCicloMeses)
- **12 meses sem resumo anual:** Arquivo: `cockpit-pilares.service.ts:425-445`
- **Validação de período de mentoria:** Arquivo: `cockpit-pilares.service.ts:725-745` (backend) e `edicao-valores-mensais.component.ts:290-330` (frontend)
- **Filtro de últimos 13 meses:** Arquivo: `edicao-valores-mensais.component.ts:280-295`
- **Sem filtro por periodoMentoriaId:** Arquivo: `cockpit-pilares.service.ts:220-250` (getCockpitById) e `cockpit-pilares.service.ts:603-680` (updateValoresMensais)
- **Sem criação automática em renovação:** Arquivo: `periodos-mentoria.service.ts:200-220`

**Regras NÃO implementadas:**
- Nenhuma regra documentada foi deixada de fora

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** QA deve validar:
  - Criação de 12 meses consecutivos (não 13) a partir do mês atual
  - Botão só habilita quando mês atual >= mês final do período
  - Novo ciclo cria meses a partir do último registrado
  - Exibição filtra apenas últimos 13 meses
  - Renovação de mentoria NÃO cria meses automaticamente
  - Unique constraint `[indicadorCockpitId, ano, mes]` previne duplicatas
- **Prioridade de testes:** 
  - Validação de período de mentoria (botão habilitado/desabilitado)
  - Criação sequencial de meses (ajuste de ano quando ultrapassa dezembro)
  - Filtro de últimos 13 meses (edge case: menos de 13 meses cadastrados)

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Migração do schema Prisma requer `npx prisma migrate dev` - pode falhar se houver dados históricos com `periodoMentoriaId`
- Dados antigos em `indicadores_mensais` podem precisar de migração manual antes de remover a coluna

**Dependências externas:**
- Schema Prisma depende de PostgreSQL suportar unique constraint composta
- Frontend depende de `PeriodosMentoriaService` retornar dados corretos

**Mitigação sugerida:**
- Executar `npx prisma db push --force-reset` em ambiente de desenvolvimento primeiro
- Em produção, criar migration manual com `ALTER TABLE` se houver dados históricos

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
