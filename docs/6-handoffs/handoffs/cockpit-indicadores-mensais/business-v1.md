# Business Analysis: Ciclos de Indicadores Mensais

**Data:** 2026-01-26  
**Analista:** Business Analyst  
**Regras Documentadas:** [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md), [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md)

---

## 1️⃣ Resumo da Análise
- **Modo:** Proposta  
- **Regras documentadas:** 1 arquivo novo (referência acima) + vínculo histórico com `cockpit-gestao-indicadores`  
- **Status:** ⚠️ APROVADO COM RESSALVAS (validações de data/mês require detail)

## 2️⃣ Regras Documentadas
### Regras Propostas
- [cockpit-indicadores-mensais.md](../business-rules/cockpit-indicadores-mensais.md) - Define os dois gatilhos autorizados para criar registros em `IndicadorMensal`, as condições do novo botão "Novo ciclo de 12 meses", as regras de exibição dos últimos 13 meses no editor e as alterações necessárias no Prisma e nos serviços do backend.  
- [cockpit-gestao-indicadores.md](../business-rules/cockpit-gestao-indicadores.md) - Continua sendo o compêndio geral; o novo documento amplia os detalhes mensais.

## 3️⃣ Análise de Completude
### ✅ O que está claro
- O botão "Criar Cockpit" (diagnóstico) passa por `CriarCockpitModalComponent` e `CockpitPilaresService.createCockpit`.  
- O editor de valores mensais consome `CockpitPilaresService.getCockpitById` e `updateValoresMensais` para renderizar/atualizar os meses.  
- Os novos meses devem nascer com ano/mês sequenciais e `meta/realizado/historico` nulos, sem criar resumos anuais.

### ⚠️ O que está ausente/ambíguo
- Detalhe preciso do texto/UX do botão "Novo ciclo de 12 meses" e sua localização responsível no layout do editor.  
- Definição de como o backend comunica o motivo exato da rejeição (mensagem textual) quando a mentoria ainda não atingiu o último mês.

### 🔴 Riscos Identificados
- **Segurança:** botões que disparam criação de dados em lote (novos ciclos) precisam passar por `validateCockpitAccess` para evitar escrita fora da empresa do usuário.  
- **RBAC:** Gatilhos precisam respeitar perfis (ADMINISTRADOR/ GESTOR) conforme `CockpitPilaresService` já valida; garantir que o novo endpoint herde as mesmas verificações.  
- **Multi-tenant:** `PeriodosMentoria` deve ser consultado com o `empresaId` do cockpit para evitar vazamento de dados entre empresas.  
- **LGPD:** dados gerados automaticamente (`IndicadorMensal`) não trazem informações pessoais, mas qualquer falha em `AuditService` durante criação deve ser monitorada.

## 4️⃣ Checklist de Riscos Críticos
- [ ] RBAC documentado e aplicado? (novo endpoint precisa aplicar `validateTenantAccess`/`validateCockpitAccess`)  
- [x] Isolamento multi-tenant garantido? (já há validações, basta reaproveitar)  
- [ ] Auditoria de ações sensíveis? (confirmar log para a criação em lote de meses)  
- [ ] Validações de input? (mês/ano sequenciais e presença de mentoria precisam ser validados)  
- [ ] Proteção contra OWASP Top 10? (fluxos não expõem dados privados, mas o botão pode disparar criação em massa — limite alcance)  
- [x] Dados sensíveis protegidos? (apenas indicadores e notas mensais são manipulados)

## 5️⃣ Bloqueadores
- Nenhum bloqueador crítico identificado; detalhes de texto e mensagens permanecem para Dev (validar com UX/dono do produto se necessário).

## 6️⃣ Recomendações
- Definir padrão visual/textual do botão "Novo ciclo de 12 meses" para não confundir com criação de indicador.  
- Considerar retorno estruturado (`{ sucesso: true, mesesCriados: 12 }`) para que o frontend mostre snackbar.  
- Validar a remoção de `periodoMentoriaId` em todas as queries e migrar os dados históricos antes de deploy em produção.

## 7️⃣ Decisão e Próximos Passos
- [x] Prosseguir para: **Dev Agent Enhanced**  
- [x] Dev Agent deve implementar as regras descritas em `cockpit-indicadores-mensais.md` e ajustar `IndicadorMensal` no Prisma.  
- [ ] Atenção especial para: botão do editor (habilitação + tooltip) e novos registros gerados em lote durante criação de ciclo.

---

**Handoff criado automaticamente pelo Business Analyst**
