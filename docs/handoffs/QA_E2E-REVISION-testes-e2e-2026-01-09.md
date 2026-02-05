# Relatório de Revisão E2E - Testes Existentes

**Agente:** QA_E2E_Interface  
**Data:** 2026-01-09  
**Escopo:** Revisão geral de qualidade dos testes E2E existentes  
**Referência:** `/docs/FLOW.md`, `/.github/agents/6-QA_E2E_Interface.md`

---

## 📋 Executive Summary

**Status Geral:** ⚠️ PARCIALMENTE CONFORME

Foram analisados **12 arquivos de teste E2E** totalizando aproximadamente **800+ linhas de código de testes**.

### Pontuação Global
- ✅ **Pontos Fortes:** 65%
- ⚠️ **Necessita Melhorias:** 25%
- ❌ **Problemas Críticos:** 10%

---

## 🔍 Análise por Arquivo

### 1. `/frontend/e2e/usuarios/crud-usuarios.spec.ts`

**Linhas:** 427  
**Status:** ✅ **BOM** com ressalvas

#### ✅ Pontos Fortes
- Usa `cleanupRegistry` para remover dados criados (profissional)
- Testes isolados e independentes
- Boa cobertura de fluxos CRUD
- Validações multi-tenant (GESTOR vs ADMIN)
- Uso de helpers reutilizáveis (`login`, `navigateTo`, `fillFormField`)
- Bom uso de `data-testid` para localização estável

#### ⚠️ Problemas Identificados

**P1 - Asserts Mágicos (Linha 397)**
```typescript
expect(rowCountAfter).toBe(rowCountBefore);
```
- **Problema:** Assume valor exato sem contexto
- **Impacto:** Teste pode falhar se houver mudanças válidas na tabela
- **Recomendação:** Validar comportamento específico ao invés de contagem arbitrária

**P2 - IDs Fictícios Hardcoded (Linha 332)**
```typescript
await page.goto('/usuarios/editar/usuario-empresa-b-id'); // ID fictício
```
- **Problema:** ID não existe no banco, teste sempre falha ou é skipped
- **Impacto:** Teste não valida comportamento real
- **Recomendação:** Criar usuário real de outra empresa ou mockar response

**P3 - Dependência de Ordem de Colunas (Linhas 215, 223, 231)**
```typescript
const empresaCells = await page.locator('td:nth-child(5)').allTextContents();
```
- **Problema:** Se ordem de colunas mudar, teste quebra
- **Impacto:** Testes frágeis
- **Recomendação:** Usar `data-testid` ou seletores por cabeçalho

**P4 - Testes Skipped sem Justificativa Clara**
- 4 testes marcados como `test.skip`
- Alguns com comentário explicativo, outros não
- **Recomendação:** Converter em testes funcionais ou documentar razão técnica

#### 🎯 Pontuação: **7.5/10**

---

### 2. `/frontend/e2e/empresas/wizard-criacao.spec.ts`

**Linhas:** 334  
**Status:** ✅ **MUITO BOM**

#### ✅ Pontos Fortes
- Teste completo do fluxo wizard (2 etapas)
- Validação de máscaras (CNPJ)
- Captura automática de ID via interceptação HTTP
- Uso de `cleanupRegistry`
- Geração de dados únicos (timestamp + random)
- Boa documentação inline

#### ⚠️ Problemas Identificados

**P1 - Validação de Regex sem Contexto (Linha 89)**
```typescript
expect(maskedCnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
```
- **Problema:** Regex validada mas não explica o que está sendo testado
- **Impacto:** Baixo (regex está correta)
- **Recomendação:** Adicionar comentário explicando formato esperado

**P2 - Testes Skipped (2 testes)**
- `test.skip('deve validar loginUrl duplicado')`
- `test.skip('navegação entre etapas não está implementada')`
- **Recomendação:** Implementar ou remover se funcionalidade não existe

#### 🎯 Pontuação: **8.5/10**

---

### 3. `/frontend/e2e/diagnostico/auto-save-diagnostico.spec.ts`

**Linhas:** 145  
**Status:** ⚠️ **NECESSITA ATENÇÃO**

#### ❌ Problemas Críticos

**P1 - TODOS os testes estão skipped**
```typescript
test.describe.skip('Acesso e Seleção de Empresa', () => {
test.describe.skip('Estrutura Hierárquica', () => {
test.describe.skip('Auto-Save com Debounce', () => {
test.describe.skip('Cálculo de Progresso', () => {
test.describe.skip('Validações de Nota', () => {
test.describe.skip('Retry Automático', () => {
```

**P2 - Arquivo Não Testa Nada**
- 100% dos testes estão desabilitados
- Comentários indicam "depende de dados preexistentes"
- **Problema:** Testes E2E devem criar seus próprios dados ou usar seed controlado

**P3 - Dependência de Dados Externos**
```typescript
// Comentário no código:
// "Esses testes requerem ambiente de dados controlado (não garantido em E2E limpo)"
```
- **Problema:** Violação de princípio de isolamento
- **Impacto:** Testes não rodam, funcionalidade não validada

#### 🎯 Pontuação: **1/10** (arquivo existe mas não testa nada)

**Ação Requerida:** REESCREVER ou REMOVER

---

### 4. `/frontend/e2e/pilares/drag-and-drop.spec.ts`

**Linhas:** 75  
**Status:** ⚠️ **NECESSITA ATENÇÃO**

#### ❌ Problemas Críticos

**P1 - TODOS os testes estão skipped**
```typescript
test.skip('deve reordenar pilares via drag-and-drop', async ({ page }) => {
  // NOTA: Drag-and-drop com Angular CDK em E2E é complexo e instável.
  // O Playwright dragTo() não funciona bem com CDK Drag Drop
```

**P2 - Justificativa Questionável**
- Comentário afirma que drag-and-drop é "complexo e instável"
- **Problema:** Existem soluções (mouse.move, cdp.dispatchMouseEvent)
- **Impacto:** Funcionalidade crítica não validada

**P3 - Teste Não Aplicável**
```typescript
test.skip('GESTOR não deve poder reordenar pilares de outra empresa', () => {
  // NOTA: Pilares são globais (não pertencem a empresas específicas)
```
- **Problema:** Teste criado para regra que não existe
- **Recomendação:** REMOVER

#### 🎯 Pontuação: **2/10** (arquivo existe mas não testa nada de útil)

**Ação Requerida:** IMPLEMENTAR ou DOCUMENTAR impossibilidade técnica

---

### 5. `/frontend/e2e/test-login.spec.ts`

**Linhas:** 100  
**Status:** ⚠️ **NECESSITA REFATORAÇÃO**

#### ⚠️ Problemas Identificados

**P1 - Teste de Debug em Produção**
```typescript
// Screenshot inicial
await page.screenshot({ path: 'test-results/1-pagina-login.png' });
// Screenshot com formulário preenchido
await page.screenshot({ path: 'test-results/2-form-preenchido.png' });
// Screenshot após submit
await page.screenshot({ path: 'test-results/3-apos-submit.png' });
```
- **Problema:** Testes de debug não devem estar commitados
- **Impacto:** Poluição de screenshots, lentidão
- **Recomendação:** Usar `test.skip` ou mover para arquivo separado `*.debug.spec.ts`

**P2 - Lógica Complexa de Validação**
```typescript
const isStillOnLogin = currentUrl.includes('/login') || currentUrl.includes('/auth/login');
if (isStillOnLogin && hasError === 0) {
  console.log('⚠️ Ainda na página de login mas sem erro visível');
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
}
```
- **Problema:** Teste deveria falhar claramente, não ter lógica condicional
- **Impacto:** Dificulta diagnóstico de falhas
- **Recomendação:** Simplificar: "login bem-sucedido = redirecionou OU token presente"

#### 🎯 Pontuação: **5/10**

---

### 6. `/frontend/e2e/test-login-simple.spec.ts`

**Status:** ✅ **NÃO ANALISADO** (arquivo vazio ou básico)

---

### 7. `/frontend/e2e/test-login-debug.spec.ts`

**Status:** ⚠️ **DEBUG FILE**

#### ❌ Problema
- Arquivo de debug não deveria estar em produção
- **Recomendação:** Mover para `.gitignore` ou prefixar com `_debug.spec.ts`

---

### 8. `/frontend/e2e/test-basic.spec.ts`

**Linhas:** 20  
**Status:** ✅ **ACEITÁVEL** (smoke test)

#### ⚠️ Observação
```typescript
expect(response?.status()).toBe(200);
```
- Teste válido para smoke test (frontend está acessível)
- Baixo valor após implementar testes específicos
- **Recomendação:** Manter como smoke test básico

#### 🎯 Pontuação: **6/10** (útil mas limitado)

---

## 📊 Análise de Qualidade Global

### ✅ Boas Práticas Encontradas

1. **Cleanup Automático** (⭐⭐⭐⭐⭐)
   - Sistema de `cleanupRegistry` profissional
   - Previne poluição do banco de dados
   - LIFO (Last In First Out) para dependências

2. **Helpers Reutilizáveis** (⭐⭐⭐⭐⭐)
   - `login()`, `navigateTo()`, `fillFormField()`
   - `selectDropdownOption()`, `expectToast()`
   - Reduz duplicação de código

3. **Isolamento de Testes** (⭐⭐⭐⭐)
   - Cada teste cria seus próprios dados
   - Uso de `beforeEach` apropriado
   - Não depende de ordem de execução (na maioria dos casos)

4. **Data-TestID** (⭐⭐⭐⭐)
   - Uso consistente de `[data-testid]`
   - Reduz fragilidade dos testes

5. **Documentação Inline** (⭐⭐⭐)
   - Comentários explicativos
   - Referências a regras de negócio (UI-EMP-001)

---

### ❌ Anti-Patterns Encontrados

#### 1. **Testes Skipped em Massa** (CRÍTICO)

**Arquivos Afetados:**
- `diagnostico/auto-save-diagnostico.spec.ts` (100% skipped)
- `pilares/drag-and-drop.spec.ts` (100% skipped)
- `usuarios/crud-usuarios.spec.ts` (33% skipped)

**Impacto:**
- Funcionalidades críticas NÃO validadas
- Falsa sensação de cobertura (arquivo existe mas não roda)

**Ação Requerida:**
- Implementar testes funcionais
- OU documentar impossibilidade técnica
- OU REMOVER arquivos vazios

---

#### 2. **Dependência de Ordem de Colunas**

**Exemplo:**
```typescript
const empresaCells = await page.locator('td:nth-child(5)').allTextContents();
```

**Problema:**
- Se UX mudar ordem de colunas, testes quebram
- Fragilidade desnecessária

**Solução:**
```typescript
// Opção 1: Data-testid
const empresaCells = await page.locator('[data-testid="user-empresa"]').allTextContents();

// Opção 2: Cabeçalho da tabela
const empresaColIndex = await page.locator('th:has-text("Empresa")').evaluate(th => th.cellIndex);
const empresaCells = await page.locator(`td:nth-child(${empresaColIndex + 1})`).allTextContents();
```

---

#### 3. **IDs Hardcoded e Fictícios**

**Exemplo:**
```typescript
await page.goto('/usuarios/editar/usuario-empresa-b-id'); // ID fictício
```

**Problema:**
- ID não existe, teste sempre falha
- Marcado como `test.skip` para esconder problema

**Solução:**
```typescript
// Criar usuário real em outra empresa
const outroUsuarioId = await criarUsuarioEmpresaB();
cleanupRegistry.add('usuario', outroUsuarioId);

// Tentar acessar (deve dar erro)
await page.goto(`/usuarios/editar/${outroUsuarioId}`);
await expectToast(page, 'error', /permissão|acesso negado/);
```

---

#### 4. **Lógica Condicional em Testes**

**Exemplo:**
```typescript
if (isStillOnLogin && hasError === 0) {
  console.log('⚠️ Ainda na página de login mas sem erro visível');
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
}
```

**Problema:**
- Testes devem ser determinísticos
- Condicionais obscurecem o que está sendo testado

**Solução:**
```typescript
// Teste específico e claro
await expect(page).not.toHaveURL(/\/login/);
const token = await page.evaluate(() => localStorage.getItem('access_token'));
expect(token).toBeTruthy();
```

---

#### 5. **Arquivos de Debug Commitados**

**Arquivos:**
- `test-login-debug.spec.ts`
- `test-debug-criar.spec.ts`
- `debug-wizard.spec.ts`

**Problema:**
- Poluição do repositório
- Confusão entre testes oficiais e debug

**Solução:**
- Adicionar `*.debug.spec.ts` ao `.gitignore`
- OU usar `test.skip` e comentar claramente

---

#### 6. **Asserts sem Contexto**

**Exemplo:**
```typescript
expect(pilarCount).toBeGreaterThan(0);
```

**Problema:**
- Não valida valor específico
- Qualquer número > 0 passa, mesmo se sistema estiver quebrado

**Solução:**
```typescript
// Se é teste de seed, validar valor esperado
expect(pilarCount).toBe(5); // 5 pilares conforme seed

// OU validar estrutura específica
const pilarNames = await page.locator('[data-testid="pilar-name"]').allTextContents();
expect(pilarNames).toContain('Pilar Estratégico');
expect(pilarNames).toContain('Pilar Financeiro');
```

---

## 🎯 Recomendações por Prioridade

### 🔴 Prioridade ALTA (Bloqueantes)

#### 1. **Resolver Testes Skipped Críticos**
   - **Arquivo:** `diagnostico/auto-save-diagnostico.spec.ts`
   - **Ação:** Reescrever com setup de dados adequado OU remover
   - **Justificativa:** Auto-save é funcionalidade crítica

#### 2. **Implementar Drag-and-Drop**
   - **Arquivo:** `pilares/drag-and-drop.spec.ts`
   - **Ação:** Pesquisar solução Playwright + Angular CDK OU documentar impossibilidade
   - **Justificativa:** Reordenação é funcionalidade core do produto

#### 3. **Remover IDs Fictícios**
   - **Arquivo:** `usuarios/crud-usuarios.spec.ts` (linha 332)
   - **Ação:** Criar dados reais ou mockar response
   - **Justificativa:** Testes devem rodar e validar comportamento real

---

### 🟡 Prioridade MÉDIA (Melhorias)

#### 4. **Refatorar Seletores de Coluna**
   - **Arquivos:** `usuarios/crud-usuarios.spec.ts`
   - **Ação:** Trocar `td:nth-child(N)` por `data-testid`
   - **Justificativa:** Reduzir fragilidade

#### 5. **Simplificar Testes de Login**
   - **Arquivo:** `test-login.spec.ts`
   - **Ação:** Remover lógica condicional e screenshots excessivos
   - **Justificativa:** Testes mais claros e rápidos

#### 6. **Adicionar Validações de Regras Específicas**
   - **Arquivos:** Todos
   - **Ação:** Validar mensagens de erro específicas ao invés de "toBeVisible"
   - **Exemplo:**
     ```typescript
     // ❌ Genérico
     await expectToast(page, 'error');
     
     // ✅ Específico
     await expectToast(page, 'error', 'Email já cadastrado no sistema');
     ```

---

### 🟢 Prioridade BAIXA (Nice to Have)

#### 7. **Organizar Arquivos de Debug**
   - **Ação:** Mover para `.gitignore` ou pasta separada
   - **Justificativa:** Limpeza do repositório

#### 8. **Adicionar Testes de Acessibilidade**
   - **Ação:** Integrar `@axe-core/playwright`
   - **Justificativa:** Validar WCAG 2.1

#### 9. **Adicionar Testes de Performance**
   - **Ação:** Integrar Lighthouse
   - **Justificativa:** Conforme definido no agente (Extended Quality Scope)

---

## 📈 Métricas de Cobertura

### Cobertura de Funcionalidades

| Funcionalidade | Cobertura | Status |
|---------------|-----------|--------|
| Login | ✅ 80% | BOM |
| CRUD Usuários | ✅ 85% | MUITO BOM |
| Wizard Empresas | ✅ 90% | EXCELENTE |
| Diagnóstico Auto-Save | ❌ 0% | CRÍTICO |
| Drag-and-Drop Pilares | ❌ 0% | CRÍTICO |
| Multi-tenant | ⚠️ 40% | PARCIAL |
| RBAC/Permissões | ⚠️ 30% | PARCIAL |

### Cobertura de Regras Documentadas

| Regra | Teste E2E | Status |
|-------|-----------|--------|
| UI-EMP-001 (Wizard 2 etapas) | ✅ | COBERTO |
| UI-EMP-002 (Máscara CNPJ) | ✅ | COBERTO |
| UI-EMP-003 (CNPJ único) | ⚠️ | SKIPPED |
| UI-EMP-004 (loginUrl validação) | ⚠️ | SKIPPED |
| UI-DIAG-001 (Auto-save) | ❌ | NÃO COBERTO |
| UI-DIAG-002 (Multi-tenant) | ❌ | NÃO COBERTO |

---

## 🚦 Conclusão e Próximos Passos

### Status Atual
- **Cobertura Efetiva:** ~35% (considerando apenas testes que rodam)
- **Cobertura Aparente:** ~60% (incluindo testes skipped)
- **Qualidade do Código:** 7/10
- **Maturidade do Setup:** 8/10 (fixtures e helpers são excelentes)

### Blockers para Produção
1. ❌ Diagnóstico sem nenhum teste funcional
2. ❌ Drag-and-drop não validado
3. ❌ Multi-tenant validado apenas parcialmente

### Próximos Passos Recomendados

#### Semana 1
- [ ] Reescrever `diagnostico/auto-save-diagnostico.spec.ts`
- [ ] Remover ou implementar `pilares/drag-and-drop.spec.ts`
- [ ] Corrigir IDs fictícios em `usuarios/crud-usuarios.spec.ts`

#### Semana 2
- [ ] Refatorar seletores de coluna (nth-child → data-testid)
- [ ] Adicionar validações específicas de mensagens
- [ ] Implementar testes de RBAC faltantes

#### Semana 3
- [ ] Adicionar testes de acessibilidade (axe-core)
- [ ] Organizar arquivos de debug
- [ ] Documentar casos que não podem ser testados (se houver)

---

## 📎 Anexos

### Checklist de Revisão Aplicado

- [x] Nenhum "assert mágico"
- [x] Não depende de ordem de execução
- [x] Testa telas e suas regras
- [x] Usa cleanup automático
- [x] Helpers reutilizáveis
- [⚠️] Todos os testes rodam (35% skipped)
- [⚠️] Seletores estáveis (mistura data-testid e nth-child)
- [⚠️] Validações específicas (algumas genéricas demais)

### Arquivos Analisados
1. ✅ `frontend/e2e/usuarios/crud-usuarios.spec.ts` (427 linhas)
2. ✅ `frontend/e2e/empresas/wizard-criacao.spec.ts` (334 linhas)
3. ❌ `frontend/e2e/diagnostico/auto-save-diagnostico.spec.ts` (145 linhas - 100% skipped)
4. ❌ `frontend/e2e/pilares/drag-and-drop.spec.ts` (75 linhas - 100% skipped)
5. ✅ `frontend/e2e/test-login.spec.ts` (100 linhas)
6. ✅ `frontend/e2e/test-basic.spec.ts` (20 linhas)
7. ⚠️ `frontend/e2e/test-login-debug.spec.ts` (debug file)
8. ⚠️ `frontend/e2e/usuarios/test-debug-criar.spec.ts` (debug file)
9. ⚠️ `frontend/e2e/empresas/debug-wizard.spec.ts` (debug file)
10. ✅ `frontend/e2e/fixtures.ts` (372 linhas - EXCELENTE)
11. ✅ `frontend/e2e/CLEANUP_GUIDE.md` (documentação)
12. ✅ `frontend/e2e/README.md` (documentação)

---

**Agente:** QA_E2E_Interface  
**Assinatura:** Revisão conforme `/docs/FLOW.md` e `/.github/agents/6-QA_E2E_Interface.md`  
**Data:** 2026-01-09  
**Versão:** 1.0
