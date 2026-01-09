# Guia de Cleanup Automático - E2E Tests

## 📋 Visão Geral

O sistema de cleanup automático garante que **todos os recursos criados durante testes E2E sejam removidos ao final**, independente de sucesso ou falha do teste.

## ✅ Benefícios

- **Isolamento de testes**: cada teste roda em ambiente limpo
- **Cleanup garantido**: mesmo se teste falhar, recursos são removidos
- **Sem poluição**: banco de dados não acumula lixo de testes
- **Professional**: segue best practices de QA Senior

## 🎯 Como Usar

### 1. Básico - Registro Manual

```typescript
test('criar usuário', async ({ page, cleanupRegistry }) => {
  // ... criar usuário via UI
  
  // Registrar ID para cleanup automático
  cleanupRegistry.add('usuario', 'user-id-123');
  
  // ... validações
  
  // Cleanup acontece AUTOMATICAMENTE ao final do teste
});
```

### 2. Captura Automática via HTTP Interceptor

```typescript
import { captureCreatedResourceId } from '../fixtures';

test('criar empresa', async ({ page, cleanupRegistry }) => {
  // Setup interceptor ANTES de criar recurso
  await captureCreatedResourceId(page, 'empresa', cleanupRegistry);
  
  // ... preencher formulário e criar empresa
  
  // ID é capturado automaticamente da response 201
  // Cleanup automático ao final
});
```

### 3. Múltiplos Recursos

```typescript
test('setup completo', async ({ page, cleanupRegistry }) => {
  // Registrar múltiplos IDs de uma vez
  cleanupRegistry.addMultiple('pilar', ['pilar-1', 'pilar-2', 'pilar-3']);
  
  // Ou registrar conforme cria
  const empresaId = await criarEmpresa();
  cleanupRegistry.add('empresa', empresaId);
  
  const userId = await criarUsuario();
  cleanupRegistry.add('usuario', userId);
  
  // Todos serão removidos ao final (ordem reversa = LIFO)
});
```

## 📊 Tipos de Recursos Suportados

| Tipo | Endpoint de Delete |
|------|-------------------|
| `usuario` | `DELETE /api/users/{id}` |
| `empresa` | `DELETE /api/empresas/{id}` |
| `pilar` | `DELETE /api/pilares/{id}` |
| `rotina` | `DELETE /api/rotinas/{id}` |

## 🔧 Comportamento

### Ordem de Limpeza
- **LIFO (Last In First Out)**: último recurso criado é o primeiro removido
- Evita erros de dependência (ex: remove usuários antes de empresas)

### Tratamento de Erros
- Se recurso já foi deletado (404): apenas log warning
- Se falha na remoção: log error mas continua limpeza dos demais
- Não bloqueia execução de outros testes

### Logs
```
[Cleanup] Registrado para limpeza: empresa:abc-123
[Cleanup] Registrado para limpeza: usuario:def-456
[Cleanup] Iniciando limpeza de 2 recurso(s)...
[Cleanup] ✅ usuario:def-456 removido
[Cleanup] ✅ empresa:abc-123 removido
```

## ⚠️ O Que NÃO Fazer

### ❌ ERRADO: Teste de Delete Separado
```typescript
test('criar usuário', async ({ page }) => {
  // cria usuário
});

test('deletar usuário criado', async ({ page }) => {
  // ERRADO! Não é um teste real, é cleanup manual
});
```

### ✅ CORRETO: Cleanup Automático
```typescript
test('criar usuário', async ({ page, cleanupRegistry }) => {
  const id = await criarUsuario();
  cleanupRegistry.add('usuario', id);
  // Cleanup automático ao final
});
```

## 🎓 Exemplos Completos

### Teste de CRUD de Usuários
```typescript
test('ciclo completo CRUD', async ({ page, cleanupRegistry }) => {
  // CREATE
  await captureCreatedResourceId(page, 'usuario', cleanupRegistry);
  const userId = await criarUsuarioViaUI();
  
  // READ
  await validarUsuarioNaLista(userId);
  
  // UPDATE
  await editarUsuario(userId);
  
  // DELETE via UI (soft delete)
  await desativarUsuario(userId);
  
  // Cleanup final remove do banco (hard delete)
});
```

### Teste de Wizard Multi-Step
```typescript
test('wizard empresa completo', async ({ page, cleanupRegistry }) => {
  // Interceptar criação
  let empresaId: string | null = null;
  
  page.on('response', async response => {
    if (response.url().includes('/api/empresas') && response.status() === 201) {
      const body = await response.json();
      empresaId = body.id;
      cleanupRegistry.add('empresa', empresaId);
    }
  });
  
  // Etapa 1: dados básicos
  await preencherDadosBasicos();
  await submitEtapa1();
  
  // Etapa 2: usuários e pilares
  await preencherUsuarios();
  await submitEtapa2();
  
  // Validações
  await expect(page).toHaveURL(/empresas\/.*\/detalhes/);
});
```

## 📚 Referências

- [Playwright Fixtures](https://playwright.dev/docs/test-fixtures)
- [Test Isolation Best Practices](https://playwright.dev/docs/best-practices#use-test-fixtures)
- [ADR sobre E2E Testing](../docs/adr/)

---

**Agente**: QA_E2E_Interface  
**Data**: Janeiro 2026
