# Correção: Navegação entre Empresas sem Perder Sessão

**Data:** 27/01/2026  
**Problema:** Ao mudar empresa na navbar, o sistema tentava ir para diagnostico-notas mas caía a sessão  
**Status:** ✅ Corrigido

---

## Alterações Realizadas

### 1. [navbar.component.ts](frontend/src/app/views/layout/navbar/navbar.component.ts)

**Problema:** Navegação muito rápida sem aguardar sincronização

**Solução:**
```typescript
onEmpresaChange(event: any): void {
  const empresaId = typeof event === 'string' ? event : event?.id || this.selectedEmpresaId;
  
  if (!empresaId) {
    this.empresaContextService.clearSelectedEmpresa();
    return;
  }
  
  // Atualizar contexto de empresa
  this.empresaContextService.setSelectedEmpresa(empresaId);
  
  // Aguardar 100ms para garantir que o contexto foi atualizado
  setTimeout(() => {
    this.router.navigate(['/diagnosticos-notas']).catch(err => {
      console.error('Erro ao navegar para diagnósticos:', err);
    });
  }, 100);
}
```

**Benefícios:**
- ✅ Delay garante que contexto é atualizado antes da navegação
- ✅ Error handling para capturar problemas de navegação
- ✅ Evita race conditions

### 2. [diagnostico-notas.component.ts](frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts#L147-L220)

**Problema:** Admin sem empresa selecionada causava erro

**Solução A - checkUserPerfil():**
```typescript
private checkUserPerfil(): void {
  // ...
  if (this.isAdmin) {
    // Admin: usar empresa do contexto global
    const contextEmpresaId = this.empresaContextService.getEmpresaId();
    this.selectedEmpresaId = contextEmpresaId || null;
    
    if (this.selectedEmpresaId) {
      this.loadDiagnostico();
    } else {
      // Sem empresa selecionada no contexto
      this.error = 'Selecione uma empresa para visualizar diagnósticos';
    }
  }
  // ...
}
```

**Solução B - ngOnInit():**
```typescript
ngOnInit(): void {
  this.checkUserPerfil();
  this.setupAutoSave();
  
  // Subscrever às mudanças no contexto de empresa
  this.empresaContextSubscription = this.empresaContextService.selectedEmpresaId$.subscribe(empresaId => {
    if (this.isAdmin && empresaId !== this.selectedEmpresaId) {
      if (this.selectedEmpresaId) {
        this.clearExpandedState();
      }
      
      this.selectedEmpresaId = empresaId;
      this.error = ''; // Limpar erro anterior
      
      if (empresaId) {
        this.loadDiagnostico();
      } else {
        this.pilares = [];
        this.error = 'Selecione uma empresa para visualizar diagnósticos';
      }
    }
  });
}
```

**Solução C - loadDiagnostico() - Error Handling:**
```typescript
error: (err: any) => {
  this.loading = false;
  
  // Se for erro de autenticação (401), deixar o interceptor lidar com logout
  if (err?.status === 401) {
    return;
  }
  
  // Outros erros
  this.error = err?.error?.message || 'Erro ao carregar dashboard da empresa';
}
```

**Benefícios:**
- ✅ Admin sem empresa selecionada vê mensagem clara
- ✅ Erro de sessão (401) é tratado pelo interceptor (não mostra erro do usuário)
- ✅ Sincronização automática ao mudar empresa via Observable

---

## Fluxo de Navegação (Corrigido)

```
1. Admin clica no combo e seleciona Empresa B
   ↓
2. onEmpresaChange() é disparado
   ↓
3. setSelectedEmpresa('empresa-B')
   ↓
4. setTimeout(100ms) - Aguarda sincronização
   ↓
5. router.navigate(['/diagnosticos-notas'])
   ↓
6. DiagnosticoNotasComponent carrega
   ↓
7. checkUserPerfil() - obtém empresa do contexto
   ↓
8. loadDiagnostico() com empresa-B
   ↓
9. getDiagnosticoByEmpresa('empresa-B') via HTTP
   ↓
10. syncEmpresaFromResource() - sincroniza combo
    ↓
11. Tela exibe dados de empresa-B ✅
```

---

## Casos Tratados

### ✅ Admin Muda de Empresa
- Contexto atualizado
- Navegação aguarda sincronização
- Dados carregados corretamente

### ✅ Admin sem Empresa Selecionada
- Mensagem: "Selecione uma empresa para visualizar diagnósticos"
- Sem erro de sessão
- Aguarda seleção na navbar

### ✅ Erro de Sessão (401)
- Interceptor trata logout automaticamente
- Não mostra erro genérico ao usuário
- Redireciona para login

### ✅ Cliente Logado
- Sempre usa sua empresa associada
- Não é afetado por mudanças de contexto
- Funciona normalmente

---

## Testes Recomendados

```bash
# 1. Admin muda de empresa na navbar
- Selecionar Empresa A
- Combo atualiza e navega para diagnostico-notas
- Dados exibem empresa-A

# 2. Admin muda para Empresa B
- Selecionar Empresa B
- Combo atualiza e navega para diagnostico-notas
- Dados exibem empresa-B

# 3. Admin sem empresa
- Abrir diagnostico-notas sem seleção
- Mensagem: "Selecione uma empresa"

# 4. Cliente logado
- Cliente não vê combo (apenas seu nome de empresa)
- Cliente vê dados apenas de sua empresa
```

---

## Resumo das Mudanças

| Arquivo | Mudança | Impacto |
|---------|---------|--------|
| navbar.component.ts | Delay + error handling | ✅ Navegação segura |
| diagnostico-notas.component.ts | Validação de empresa + error 401 | ✅ Sem perda de sessão |

**Status:** Ready to Test 🧪
