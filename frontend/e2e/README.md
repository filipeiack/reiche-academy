# Testes E2E - Reiche Academy

**Framework:** Playwright  
**Agente:** E2E_Agent (/.github/agents/6-QA_E2E_Interface.md)  
**Documentação:** [Playwright Docs](https://playwright.dev)

---

## 📋 Estrutura de Testes

```
frontend/e2e/
├── fixtures.ts                      # Helpers e fixtures compartilhados
├── empresas/
│   └── wizard-criacao.spec.ts      # Wizard 2 etapas (UI-EMP-001)
├── usuarios/
│   └── crud-usuarios.spec.ts       # CRUD completo de usuários
├── diagnostico/
│   └── auto-save-diagnostico.spec.ts  # Auto-save (UI-DIAG-001)
└── pilares/
    └── drag-and-drop.spec.ts       # Reordenação drag-and-drop
```

---

## 🚀 Comandos

### Executar todos os testes (headless)
```bash
npm run test:e2e
```

### Executar com interface gráfica (Playwright UI Mode)
```bash
npm run test:e2e:ui
```

### Executar com navegador visível (headed)
```bash
npm run test:e2e:headed
```

### Executar em modo debug (step-by-step)
```bash
npm run test:e2e:debug
```

### Executar suite específica
```bash
npx playwright test empresas/wizard-criacao.spec.ts
```

### Executar teste específico
```bash
npx playwright test empresas/wizard-criacao.spec.ts -g "deve criar empresa"
```

---

## 📊 Cobertura de Regras

### Wizard de Empresas (UI-EMP-001 a UI-EMP-004)
- ✅ Criação em 2 etapas
- ✅ Máscara automática de CNPJ
- ✅ Validação de CNPJ único
- ✅ Validação de loginUrl (mínimo 3 chars, sem espaços)
- ✅ Cancelamento de wizard
- ✅ Navegação entre etapas

**Arquivo:** `e2e/empresas/wizard-criacao.spec.ts` (9 testes)

---

### CRUD de Usuários
- ✅ Criação de usuário (CREATE)
- ✅ Listagem e busca (READ)
- ✅ Edição de usuário (UPDATE)
- ✅ Desativação (DELETE - soft delete)
- ✅ Validação multi-tenant (GESTOR)
- ✅ Validações de RBAC (perfis)
- ✅ Email único
- ✅ Senha forte

**Arquivo:** `e2e/usuarios/crud-usuarios.spec.ts` (12+ testes)

---

### Diagnóstico com Auto-Save (UI-DIAG-001, UI-DIAG-002)
- ✅ Seleção de empresa (ADMIN vs GESTOR)
- ✅ Estrutura hierárquica (pilares → rotinas → notas)
- ✅ Auto-save com debounce (1000ms)
- ✅ Validação multi-tenant
- ✅ Cálculo de progresso por pilar (0-100%)
- ✅ Validações de nota (0-10)
- ✅ Badges de criticidade (ALTO, MEDIO, BAIXO)

**Arquivo:** `e2e/diagnostico/auto-save-diagnostico.spec.ts` (15+ testes)

---

### Drag-and-Drop (Reordenação)
- ✅ Reordenação de pilares
- ✅ Reordenação de rotinas dentro de pilar
- ✅ Persistência após reload
- ✅ Feedback visual durante arrasto
- ✅ Validação multi-tenant (GESTOR)

**Arquivo:** `e2e/pilares/drag-and-drop.spec.ts` (5 testes)

---

## 🧪 Fixtures e Helpers

### Usuários de Teste

```typescript
TEST_USERS = {
  admin: {
    email: 'admin@reiche.com.br',
    senha: 'Admin@123',
    perfil: 'ADMINISTRADOR',
  },
  gestorEmpresaA: {
    email: 'gestor.a@empresa-a.com',
    senha: 'Gestor@123',
    perfil: 'GESTOR',
    empresaId: 'empresa-a-id',
  },
  // ... outros
}
```

### Helpers Disponíveis

#### Autenticação
- `login(page, user)` — Login automático
- `logout(page)` — Logout

#### Navegação
- `navigateTo(page, route)` — Navegar para rota

#### Formulários
- `fillFormField(page, fieldName, value)` — Preencher campo
- `selectDropdownOption(page, fieldName, option)` — Selecionar dropdown
- `submitForm(page, buttonText)` — Enviar formulário

#### Validações
- `expectToast(page, type, message?)` — Validar toast (success/error/warning)
- `expectErrorMessage(page, fieldName, message)` — Validar mensagem de erro

#### Tabelas
- `getTableRowCount(page)` — Contar linhas da tabela
- `searchInTable(page, term)` — Buscar na tabela

#### Modais
- `openModal(page, buttonSelector)` — Abrir modal
- `closeModal(page)` — Fechar modal

---

## 🎯 Boas Práticas

### 1. Seletores Estáveis
Sempre usar `data-testid` quando possível:

```typescript
// ✅ BOM
await page.click('[data-testid="login-button"]');

// ❌ EVITAR
await page.click('.btn-primary');
```

### 2. Aguardar Elementos

```typescript
// ✅ BOM - Aguardar visibilidade
await expect(page.locator('[data-testid="modal"]')).toBeVisible();

// ❌ EVITAR - Timeouts fixos
await page.waitForTimeout(5000);
```

### 3. Independência de Testes

Cada teste deve:
- Criar próprios dados (ou usar seed)
- Fazer login independentemente
- Limpar estado após execução

```typescript
test.beforeEach(async ({ page }) => {
  await login(page, TEST_USERS.admin);
  await navigateTo(page, '/usuarios');
});
```

### 4. Assertions Explícitas

```typescript
// ✅ BOM
await expect(page.locator('td:has-text("João Silva")')).toBeVisible();

// ❌ EVITAR
const text = await page.textContent('td');
expect(text).toBe('João Silva');
```

---

## 🐛 Debug de Testes

### 1. Modo UI (Recomendado)

```bash
npm run test:e2e:ui
```

Permite:
- Ver execução em tempo real
- Pausar em qualquer ponto
- Inspecionar seletores
- Replay de testes

### 2. Modo Debug (Step-by-Step)

```bash
npm run test:e2e:debug
```

Abre Playwright Inspector para debug linha por linha.

### 3. Screenshots e Vídeos

Screenshots e vídeos são automaticamente capturados em falhas:

```
test-results/
├── empresas-wizard-criacao-spec-ts/
│   ├── test-failed-1.png
│   └── video.webm
```

### 4. Traces

Traces são capturados em retries:

```bash
npx playwright show-trace test-results/.../trace.zip
```

---

## 📝 Convenções de Nomenclatura

### Arquivos
- `kebab-case.spec.ts`
- Agrupados por módulo/feature

### Describes
```typescript
test.describe('Nome da Feature', () => {
  test.describe('Subfuncionalidade', () => {
    test('deve comportamento esperado', async ({ page }) => {
      // ...
    });
  });
});
```

### Testes
- Português
- Iniciar com "deve"
- Descrever comportamento esperado
- Incluir código da regra quando aplicável (UI-EMP-001)

---

## 🔧 Configuração

### playwright.config.ts

Principais configurações:

- **baseURL:** `http://localhost:4200`
- **timeout:** 60s
- **retries (CI):** 2
- **reporter:** HTML + List
- **screenshot:** only-on-failure
- **video:** retain-on-failure

### Variáveis de Ambiente

```bash
# URL base customizada
E2E_BASE_URL=http://staging.reiche.com.br

# CI mode
CI=true
```

---

## 📈 Relatórios

Após execução, relatório HTML é gerado automaticamente:

```bash
npx playwright show-report
```

Abre navegador com:
- Resumo de testes (pass/fail)
- Duração de cada teste
- Screenshots e vídeos de falhas
- Traces (se habilitado)

---

## 🚨 Troubleshooting

### Testes falhando localmente

1. **Backend rodando?**
   ```bash
   cd backend
   npm run start:dev
   ```

2. **Frontend rodando?**
   ```bash
   cd frontend
   npm start
   ```

3. **Dados de seed?**
   - Verificar se banco tem dados de teste
   - Executar seed se necessário

### Testes falhando em CI

1. Verificar logs do backend
2. Aumentar timeout se necessário
3. Desabilitar paralelização (`workers: 1`)
4. Habilitar traces (`trace: 'on'`)

---

## 📚 Recursos

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright Selectors](https://playwright.dev/docs/selectors)
- [Playwright Assertions](https://playwright.dev/docs/test-assertions)

---

## ✅ Checklist para Novos Testes

- [ ] Teste está isolado (não depende de outros)
- [ ] Usa fixtures para login quando necessário
- [ ] Seletores estáveis (`data-testid`)
- [ ] Assertions explícitas (expect)
- [ ] Aguarda elementos (waitForSelector, expect.toBeVisible)
- [ ] Nome descritivo (português, "deve...")
- [ ] Documentado (comentário no topo do arquivo)
- [ ] Validações multi-tenant (quando aplicável)
- [ ] Validações de RBAC (quando aplicável)

---

**Agente:** E2E_Agent @ 2026-01-09  
**Documentação:** Conforme /.github/agents/6-QA_E2E_Interface.md
