# Status de Execução E2E - Problemas Técnicos Identificados

**Agente:** QA_E2E_Interface  
**Data:** 2026-01-09  
**Status:** ⚠️ BLOQUEADO POR PROBLEMA TÉCNICO

---

## 🚨 Problema Identificado

### Erro: "Playwright Test did not expect test.describe() to be called here"

**Causa Raiz:**
O arquivo `fixtures.ts` exporta um `test` extendido com fixtures customizados (cleanup, auth, etc), mas isso está causando conflito quando:
1. Alguns arquivos importam `test` de `'@playwright/test'`
2. Outros arquivos importam `test` de `'./fixtures'`
3. Playwright detecta isso como uma tentativa de chamar `test.describe()` no arquivo de configuração

**Arquivos Afetados:**
- ✅ Arquivos que importam de `'@playwright/test'`: test-basic.spec.ts, test-login.spec.ts
- ❌ Arquivos que importam de `'./fixtures'`: crud-usuarios.spec.ts, wizard-criacao.spec.ts, auto-save-diagnostico.spec.ts, drag-and-drop.spec.ts

---

## 📊 Análise

### Arquivos de Teste Criados/Modificados

| Arquivo | Import De | Status | Observação |
|---------|-----------|--------|------------|
| test-basic.spec.ts | @playwright/test | ✅ OK | Smoke test |
| test-login.spec.ts | @playwright/test | ✅ OK | Login simplificado |
| crud-usuarios.spec.ts | ./fixtures | ❌ ERRO | Usa cleanupRegistry |
| wizard-criacao.spec.ts | ./fixtures | ❌ ERRO | Usa cleanupRegistry |
| auto-save-diagnostico.spec.ts | ./fixtures | ❌ ERRO | Usa helpers |
| drag-and-drop.spec.ts | ./fixtures | ❌ ERRO | Usa helpers |

### Arquivos Desabilitados
- `_test-login-simple.spec.ts.skip`
- `_test-login-debug.spec.ts.skip`
- `_test-usuarios-simple.spec.ts.skip`
- `_test-debug-criar.spec.ts.skip`
- `_debug-wizard.spec.ts.skip`
- `_test-criar-usuario.spec.ts.skip`

---

## 🔧 Soluções Possíveis

### Opção 1: Unificar Imports (RECOMENDADO)
Fazer TODOS os arquivos importarem de `./fixtures` e remover imports diretos de `@playwright/test`.

**Prós:**
- Mantém cleanup automático
- Mantém helpers reutilizáveis
- Arquitetura profissional

**Contras:**
- Requer ajuste em todos os arquivos

### Opção 2: Remover Fixtures Customizados
Voltar para Playwright puro sem `test.extend()`.

**Prós:**
- Sem conflitos de import
- Mais simples

**Contras:**
- Perde cleanup automático
- Perde fixtures de autenticação
- Código duplicado entre testes

### Opção 3: Split de Fixtures
Criar dois arquivos:
- `helpers.ts` - funções puras (login, navigateTo, etc)
- `test-fixtures.ts` - test extendido com fixtures

**Prós:**
- Melhor separação de responsabilidades
- Evita import circular

**Contras:**
- Mais complexo
- Requer refatoração

---

## ✅ Ação Imediata Recomendada

**OPÇÃO 1 - Unificar Imports**

Modificar test-login.spec.ts e test-basic.spec.ts para importarem de './fixtures':

```typescript
// ANTES
import { test, expect } from '@playwright/test';

// DEPOIS
import { test, expect } from './fixtures';
```

Isso permitirá que TODOS os testes rodem com a mesma base.

---

## 📝 Próximos Passos

1. ✅ **Decisão:** Qual opção seguir? (Recomendo Opção 1)
2. 🔄 **Implementação:** Ajustar imports conforme decisão
3. ✅ **Validação:** Executar `npx playwright test`
4. ✅ **Documentação:** Atualizar README.md com padrão correto de import

---

## 🎯 Testes Implementados (Aguardando Correção de Import)

### ✅ Diagnóstico (auto-save-diagnostico.spec.ts)
- 9 testes funcionais
- Validação de acesso, estrutura, preenchimento, validações

### ✅ Pilares (drag-and-drop.spec.ts)
- 7 testes funcionais
- Limitação técnica documentada
- Testes alternativos implementados

### ✅ Login (test-login.spec.ts)
- 3 testes simplificados
- Login válido, inválido, validação

### ✅ CRUD Usuários (crud-usuarios.spec.ts)
- 12+ testes refatorados
- Sem IDs fictícios
- Sem seletores frágeis
- Multi-tenant implementado

### ✅ Wizard Empresas (wizard-criacao.spec.ts)
- 9 testes funcionais
- Validações específicas

### ✅ Smoke Test (test-basic.spec.ts)
- 1 teste básico
- Frontend acessível

---

## ⚠️ Blocker Atual

**Impossível executar testes até resolver conflito de imports.**

---

**Agente:** QA_E2E_Interface  
**Data:** 2026-01-09  
**Status:** AGUARDANDO DECISÃO TÉCNICA
