# Review: Documentação de Regras de Negócio - Módulo Cockpit de Pilares

**Data:** 2026-01-21  
**Revisor:** Business Rules Reviewer  
**Regras Analisadas:**
1. `/docs/business-rules/cockpit-multi-tenant-seguranca.md`
2. `/docs/business-rules/cockpit-gestao-indicadores.md`
3. `/docs/business-rules/cockpit-valores-mensais.md`
4. `/docs/business-rules/cockpit-processos-prioritarios.md`
5. `/docs/business-rules/cockpit-ux-excel-like.md`

**Código Fonte Analisado:**
- Backend: `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts` (787 linhas)
- Backend: `backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts`
- Frontend: `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/`
- Frontend: `frontend/src/app/views/pages/cockpit-pilares/edicao-valores-mensais/`
- Frontend: `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/`
- Frontend: `frontend/src/app/views/pages/cockpit-pilares/matriz-indicadores/`

---

## 1️⃣ Resumo Geral

### Avaliação de Maturidade

A documentação extraída do módulo **Cockpit de Pilares** demonstra **maturidade técnica muito alta**:

✅ **Pontos Fortes:**
- Rastreabilidade completa: todos os trechos de código possuem referências explícitas (arquivo + linhas)
- Separação lógica de responsabilidades em 5 documentos especializados
- Aderência rigorosa ao template oficial de regras de negócio
- Implementação robusta de multi-tenancy em todas as camadas
- RBAC granular com controle por perfil em cada operação
- Validações de segurança coesas e consistentes
- Padrões UX sofisticados (Excel-like) com auto-save, debounce e feedback centralizado

⚠️ **Áreas de Atenção:**
- Regra de cálculo de status visual com implementação simplificada (apenas verde/vermelho)
- Ausência de documentação sobre sincronização de processos prioritários após alteração em rotinas
- Falta de especificação sobre comportamento em caso de exclusão de responsável vinculado a indicador
- Ausência de regras sobre auditoria detalhada (mencionada mas não documentada)

### Status Final

**Status:** ✅ **APROVADO COM RESSALVAS**

A documentação está **pronta para uso pelo QA Unitário** com pequenas observações não-bloqueantes.

---

## 2️⃣ Análise por Regra

### 📄 cockpit-multi-tenant-seguranca.md

#### ✅ O que está claro
- Validação multi-tenant rigorosa em todos os endpoints
- Separação ADMINISTRADOR (acesso global) vs outros perfis (isolamento estrito)
- Código rastreável: `validateTenantAccess` (linhas 30-44) e `validateCockpitAccess` (linhas 45-71)
- Tabela completa de permissões por perfil (CRUD de cockpits, indicadores, valores)
- Validação de responsável de medição (mesma empresa do cockpit)
- Filtro frontend de usuários elegíveis (apenas perfil CLIENTE da mesma empresa)

#### ⚠️ O que está ausente
- **Documentação sobre cache/session de empresaId:**  
  O documento assume `user.empresaId` sempre disponível, mas não detalha como isso é garantido (JWT? Session? Middleware?)
  
- **Comportamento em cascata:**  
  Não documenta o que acontece se:
  - Empresa é desativada (cockpits ficam inacessíveis?)
  - Responsável de medição é desativado (indicador fica órfão?)
  - Usuário perde perfil CLIENTE (permanece como responsável?)

#### 🔴 Riscos identificados
- ❌ **Nenhum risco crítico:** Validações estão implementadas corretamente no código

#### ❓ Ambiguidades
- **Perfil CONSULTOR:** Tem acesso de leitura a cockpits (tabela linha 6), mas não há especificação sobre se pode visualizar valores mensais ou apenas estrutura
- **Soft delete de empresas:** Não documenta se cockpits são preservados ou também desativados

---

### 📄 cockpit-gestao-indicadores.md

#### ✅ O que está claro
- CRUD completo de indicadores com validações robustas
- Unicidade de nome por cockpit (case-sensitive)
- Auto-criação de 13 meses (jan-dez + anual) ao criar indicador
- Soft delete preservando dados mensais
- Auto-save frontend com debounce de 1000ms e validação antes de persistir
- Drag-and-drop para reordenação com recálculo automático de campo `ordem`
- Criação de usuário on-the-fly (tag customizada) com validação de nome+sobrenome
- Código rastreável em service (linhas 321-566) e frontend (linhas 104-493)

#### ⚠️ O que está ausente
- **Limite de indicadores por cockpit:**  
  Não há documentação sobre limite máximo (pode haver 100? 1000?)
  
- **Comportamento ao reativar indicador soft-deleted:**  
  Se indicador foi desativado (`ativo = false`), pode ser reativado? Volta com mesmos valores mensais?
  
- **Validação de nome único case-insensitive:**  
  Código valida case-sensitive, mas não documenta se "Meta Vendas" e "meta vendas" são considerados diferentes (pode gerar confusão para usuários)

#### 🔴 Riscos identificados
- ⚠️ **Criação de usuário sem validação de email:**  
  `addUsuarioTag` cria usuário apenas com nome (linhas 164-192), mas não exige email. Usuário criado ficará sem credenciais de acesso?
  
- ⚠️ **Race condition potencial em reordenação:**  
  Se múltiplos usuários reordenarem indicadores simultaneamente, última ordem gravada prevalece sem merge (último PATCH ganha)

#### ❓ Ambiguidades
- **Perfil COLABORADOR fixo em criação on-the-fly:**  
  Código força `perfilColaboradorId`, mas não documenta por que não permite escolha de perfil
  
- **Auto-criação de meses usa ano atual:**  
  Se indicador é criado em dezembro, auto-cria meses do ano atual ou próximo ano?

---

### 📄 cockpit-valores-mensais.md

#### ✅ O que está claro
- Edição inline com auto-save e debounce de 1000ms
- Replicação automática de meta para meses seguintes
- Cálculo de desvio absoluto e percentual dependendo de `indicador.melhor` (MAIOR vs MENOR)
- Fórmulas matemáticas explícitas e corretas
- Cache local para recálculo imediato (UX responsiva)
- Batch update no backend (aceita array de valores)
- Upsert automático (cria se não existe, atualiza se existe)
- Código rastreável (frontend linhas 86-268, backend linhas 568-644)

#### ⚠️ O que está ausente
- **Status visual "warning" (amarelo):**  
  Documento menciona que código **NÃO implementa** status intermediário (≥80% meta), apenas verde/vermelho.  
  ⚠️ **Lacuna documentada mas não tratada:**  
  - Código atual (linhas 224-246) só retorna `success` ou `danger`
  - Documentação deveria recomendar implementação futura ou justificar simplificação

#### 🔴 Riscos identificados
- ❌ **Nenhum risco crítico:** Fórmulas matemáticas validadas, lógica coerente

#### ❓ Ambiguidades
- **Replicação de meta para meses passados:**  
  Documento diz "copia para todos os meses seguintes (mes > mesAtual)", mas não documenta se meses passados podem ser editados ou ficam bloqueados
  
- **Resumo anual (mes = null):**  
  Não documenta se resumo anual é calculado automaticamente (SUM/AVG dos 12 meses) ou editável manualmente

---

### 📄 cockpit-processos-prioritarios.md

#### ✅ O que está claro
- Auto-vinculação de rotinas ativas ao criar cockpit (batch insert)
- Preservação de ordem original do pilar (`ordem ASC`)
- Status de mapeamento e treinamento editáveis via ng-select
- Auto-save com debounce de 1000ms
- Exibição de nota e criticidade **mais recentes** da rotina (referência dinâmica, não snapshot)
- Código rastreável (backend linhas 73-771, frontend linhas 84-196)

#### ⚠️ O que está ausente
- **Sincronização com mudanças em rotinas:**  
  ⚠️ **LACUNA CRÍTICA:**  
  - Documento deixa explícito: "Auto-vinculação ocorre **apenas na criação** do cockpit (não sincroniza mudanças posteriores nas rotinas)"
  - **Cenário não documentado:**
    - Se nova rotina é adicionada ao pilar DEPOIS da criação do cockpit, processo prioritário NÃO é criado automaticamente
    - Se rotina é desativada, processo prioritário continua existindo (pode exibir rotina inativa?)
  
- **Desvinculação manual de processos:**  
  Não documenta se usuário pode remover processo prioritário (desacoplar rotina do cockpit)
  
- **Reavaliação de nota:**  
  Nota exibida é "sempre a mais recente da rotina" (dinâmica), mas não documenta se há cache ou sempre busca em tempo real

#### 🔴 Riscos identificados
- 🔴 **Sincronização manual:**  
  Cockpits criados ANTES de nova rotina ser adicionada ao pilar ficarão desatualizados permanentemente (a menos que haja funcionalidade de "sincronizar processos" não documentada)

#### ❓ Ambiguidades
- **Status clearable:**  
  Código permite `null` (remover seleção), mas não documenta se `null` significa "pendente" ou "não aplicável"

---

### 📄 cockpit-ux-excel-like.md

#### ✅ O que está claro
- Navegação por teclado (Tab, Shift+Tab, Enter) com lógica similar ao Excel
- Auto-save transparente com debounce de 1000ms em todos os componentes
- Feedback visual centralizado via `SaveFeedbackService` (spinner → checkmark)
- Drag-and-drop para reordenação com Angular CDK
- Edição inline sem modais (exceto descrição longa)
- Toast notifications com SweetAlert2 (3 segundos, auto-fechamento)
- Cache local para performance (recálculo sem latência de rede)
- Confirmação de exclusão com modal SweetAlert2
- Código rastreável (gestão-indicadores linhas 495-552, edicao-valores linhas 46-283)

#### ⚠️ O que está ausente
- **Navegação por setas (↑↓←→):**  
  Documento não menciona se setas navegam entre células (comportamento comum em planilhas)
  
- **Undo/Redo:**  
  Não documenta se há suporte para desfazer alterações (CTRL+Z)

#### 🔴 Riscos identificados
- ❌ **Nenhum risco crítico:** Padrões UX bem implementados

#### ❓ Ambiguidades
- **Cache local persistente:**  
  Documento diz "cache limpo após salvamento, não persiste entre reloads", mas não documenta se há perda de dados em caso de falha de rede antes do auto-save completar
  
- **Debounce fixo de 1000ms:**  
  Não documenta se esse valor é configurável (pode ser lento para usuários avançados)

---

## 3️⃣ Checklist de Riscos

### Segurança e Multi-Tenancy
- [x] ✅ RBAC implementado (decorators `@Roles` em todos os endpoints)
- [x] ✅ Isolamento por empresa (`validateTenantAccess` em todas as operações)
- [x] ✅ Validação de responsável (mesma empresa do cockpit)
- [x] ✅ Soft delete (preservação de histórico)

### Auditoria
- [ ] ⚠️ **Parcial:** Auditoria mencionada em código (`AuditService.log`), mas **NÃO documentada** em detalhes (campos auditados, retenção, consulta)

### Validações Críticas
- [x] ✅ Unicidade de nome de indicador por cockpit
- [x] ✅ Validação de existência de entidades relacionadas (cockpit, indicador, responsável)
- [ ] ⚠️ **Ausente:** Limite máximo de indicadores por cockpit

### Regras Excessivamente Permissivas
- [ ] ⚠️ **Criação de usuário sem email:** `addUsuarioTag` permite criar usuário apenas com nome (sem validação de email)

### Vulnerabilidades (OWASP)
- [x] ✅ Injection: Validado via Prisma ORM (parameterização automática)
- [x] ✅ Broken Access Control: Validações multi-tenant em todas as operações
- [x] ✅ XSS: Frontend usa Angular (sanitização automática)
- [x] ✅ CSRF: NestJS Guards + JWT (stateless)

---

## 4️⃣ Bloqueadores

### ❌ Nenhum bloqueador crítico identificado

A documentação está **pronta para QA** com as ressalvas documentadas.

---

## 5️⃣ Recomendações (Não vinculantes)

### Recomendações de Alta Prioridade

1. **Documentar sincronização de processos prioritários**  
   - **Problema:** Cockpits criados antes de novas rotinas ficam desatualizados
   - **Sugestão:** Criar documento adicional sobre "Sincronização de Processos" OU adicionar seção em `cockpit-processos-prioritarios.md`
   - **Alternativa:** Implementar endpoint `POST /cockpits/:id/sync-processos` (tarefa para Dev Agent)

2. **Especificar comportamento de auditoria**  
   - **Problema:** Código chama `AuditService.log` mas não há documento de regra correspondente em `/docs/business-rules/`
   - **Sugestão:** Verificar se `/docs/business-rules/audit.md` cobre auditoria de cockpit ou criar seção específica

3. **Documentar status visual "warning"**  
   - **Problema:** Código atual só implementa verde/vermelho (sem amarelo para desempenho intermediário)
   - **Sugestão:** Adicionar ADR justificando simplificação OU incluir como backlog de melhoria

### Recomendações de Média Prioridade

4. **Validação de nome case-insensitive**  
   - **Problema:** "Meta Vendas" e "meta vendas" são considerados diferentes
   - **Sugestão:** Adicionar regra sobre normalização de nomes OU documentar que case-sensitive é intencional

5. **Limite de indicadores por cockpit**  
   - **Problema:** Não há limite documentado (pode gerar performance issues)
   - **Sugestão:** Definir limite técnico (ex: 50 indicadores) e documentar

6. **Criação de usuário sem email**  
   - **Problema:** `addUsuarioTag` cria usuário sem validar email (usuário ficará sem credenciais)
   - **Sugestão:** Adicionar validação de email OU documentar que email é opcional para responsáveis de medição

### Recomendações de Baixa Prioridade

7. **Navegação por setas**  
   - **Problema:** Navegação por teclado implementa Tab/Enter mas não setas (↑↓←→)
   - **Sugestão:** Considerar como melhoria UX futura

8. **Debounce configurável**  
   - **Problema:** Debounce fixo de 1000ms pode ser lento para usuários avançados
   - **Sugestão:** Considerar configuração por usuário/empresa (backlog futuro)

---

## 6️⃣ Próximos Passos

### Decisão Humana Necessária

- [ ] **Decisão sobre sincronização de processos prioritários:**  
  - Opção A: Implementar sincronização automática (Dev Agent)
  - Opção B: Documentar como limitação conhecida + funcionalidade manual (System Engineer)
  - Opção C: Aceitar comportamento atual (snapshot único na criação)

- [ ] **Decisão sobre auditoria:**  
  - Validar se `/docs/business-rules/audit.md` já documenta auditoria de cockpit
  - Se não, decidir se cria seção específica ou mantém genérico

### Criar Regras Adicionais (Opcional)

- [ ] **Limite de indicadores por cockpit** (definir valor técnico)
- [ ] **Sincronização de processos** (se Opção A/B for escolhida)
- [ ] **Validação de email em criação de usuário** (se aprovada correção)

### Prosseguir para Próximo Agente

- [x] **QA Unitário Estrito:**  
  - Documentação aprovada para criação de testes unitários
  - Priorizar testes de:
    - Multi-tenancy (validações `validateTenantAccess` e `validateCockpitAccess`)
    - CRUD de indicadores (unicidade, soft delete, auto-criação de meses)
    - Cálculos de desvio (fórmulas MAIOR vs MENOR)
    - Auto-vinculação de processos prioritários
    - Auto-save e replicação de meta

---

## 📊 Métricas de Qualidade

### Aderência ao Template Oficial
- **Score:** 10/10 ✅
- Todos os documentos seguem estrutura:
  - Contexto
  - Descrição
  - Condição
  - Comportamento Implementado (com código rastreável)
  - Restrições
  - Fonte no Código (arquivos + linhas)
  - Observações

### Rastreabilidade ao Código
- **Score:** 10/10 ✅
- 100% das regras possuem referências explícitas:
  - Arquivo completo (caminho absoluto)
  - Métodos específicos
  - Intervalos de linhas (ex: "Linhas 26-44")
  - Validado por `grep_search` - todas as referências encontradas no código

### Completude das Regras
- **Score:** 9/10 ⚠️
- **-1 ponto:** Lacuna na sincronização de processos prioritários (documentada mas não resolvida)

### Consistência entre Documentos
- **Score:** 10/10 ✅
- Nenhuma contradição encontrada
- Terminologia consistente (cockpit, indicador, processo prioritário)
- Referências cruzadas corretas

### Clareza e Objetividade
- **Score:** 10/10 ✅
- Linguagem técnica precisa
- Exemplos de código incluídos
- Fórmulas matemáticas explícitas
- Uso de tabelas e badges para facilitar leitura

---

## ✅ Critérios de Aprovação

- [x] **Todas as regras críticas do código estão documentadas**
- [x] **Não há contradições entre documentos**
- [x] **Referências ao código estão corretas**
- [x] **Template oficial foi seguido**
- [x] **Documentos estão prontos para uso pelo QA**

---

## 🎯 Conclusão

A documentação de regras de negócio do **Módulo Cockpit de Pilares** é de **qualidade excepcional**:

- ✅ Extração completa e precisa do código implementado
- ✅ Rastreabilidade 100% verificada
- ✅ Validações de segurança robustas (multi-tenancy + RBAC)
- ✅ Padrões UX sofisticados documentados
- ⚠️ Pequenas lacunas não-bloqueantes identificadas (sincronização de processos, auditoria detalhada)

**Recomendação:** Aprovar para **QA Unitário Estrito** com atenção especial aos pontos mencionados nas ressalvas.

---

**Assinatura:** Business Rules Reviewer - Conforme definição em `/.github/agents/2-Reviewer_Regras.md`
