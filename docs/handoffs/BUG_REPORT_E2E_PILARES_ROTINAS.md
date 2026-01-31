# Relatório de Bugs Encontrados - Testes E2E Completos

**Data:** 13/01/2026  
**Agente:** QA E2E Interface  
**Escopo:** Modal Gerenciar Pilares e Modal Gerenciar Rotinas  
**Status:** 🔴 BLOQUEADOR - AddTag não funciona

---

## 🐛 BUG CRÍTICO #1: AddTag não funciona no ng-select do Modal Gerenciar Pilares

**Severidade:** 🔴 BLOQUEADOR  
**Prioridade:** P0 (Crítica)

### Descrição
A funcionalidade de criar novos pilares via `addTag` (digitar nome diretamente no ng-select) **NÃO está funcionando**. A opção "Adicionar..." não aparece no dropdown quando usuário digita um nome novo.

### Regra de Negócio Violada
- **R-PILEMP-002:** Criação de Pilar Customizado (sem template)
- Documentado em: `/docs/business-rules/pilares-empresa.md`

### Passos para Reproduzir
1. Login como ADMINISTRADOR (`admin@reiche.com.br`)
2. Selecionar "Empresa Teste A Ltda"
3. Navegar para `/diagnostico-notas`
4. Clicar no menu (ícone três pontos) ao lado de "Salvar Tudo"
5. Clicar em "Gerenciar Pilares"
6. No ng-select, digitar um nome novo (ex: "PILAR TESTE E2E 1736812345678")
7. **RESULTADO ESPERADO:** Opção "Adicionar PILAR TESTE E2E..." aparece no dropdown
8. **RESULTADO ATUAL:** Nenhuma opção "Adicionar" aparece

### Evidências
- **Screenshot:** `test-results\gestao-pilares-completa-Mo-69c87-addTag-e-vincular-à-empresa-chromium\test-failed-1.png`
- **Vídeo:** `test-results\gestao-pilares-completa-Mo-69c87-addTag-e-vincular-à-empresa-chromium\video.webm`
- **Arquivo de teste:** `frontend/e2e/gestao-pilares-completa.spec.ts:26`

### Código Relevante
**Frontend:** `frontend/src/app/views/pages/empresas/pilares-empresa-form/pilares-empresa-form.component.ts`

```typescript
addPilarTag = (nome: string): Pilar | Promise<Pilar> => {
  const novoPilar: CreatePilarDto = {
    nome: nome
  };

  return new Promise((resolve, reject) => {
    this.pilaresService.create(novoPilar).subscribe({
      next: (pilar) => {
        this.showToast(`Pilar "${nome}" criado com sucesso!`, 'success');
        resolve(pilar);
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao criar pilar', 'error');
        reject(err);
      }
    });
  });
};
```

**HTML:** `frontend/src/app/views/pages/empresas/pilares-empresa-form/pilares-empresa-form.component.html`

```html
<ng-select 
  [items]="pilaresDisponiveis" 
  bindLabel="nome" 
  [searchable]="true" 
  [clearable]="true"
  [addTag]="addPilarTag" 
  placeholder="Busque por nome de pilar ou digite para criar novo..."
  (change)="associarPilar($event)">
```

### Possíveis Causas
1. ❌ `addTag` não está sendo passado corretamente para o ng-select
2. ❌ ng-select não está renderizando a opção "Adicionar" (problema de versão?)
3. ❌ Função `addPilarTag` não está sendo reconhecida
4. ❌ Placeholder pode estar incorreto (ng-select espera texto específico?)

### Impacto
- **Funcionalidade completamente quebrada** para criação de pilares customizados
- ADMINISTRADOR e GESTOR **NÃO conseguem criar novos pilares** via interface
- Workaround: Criar pilar via API diretamente (não é viável para usuários finais)

### Testes Bloqueados
- ✅ `ADMINISTRADOR deve criar novo pilar via addTag e vincular à empresa` - **BLOQUEADO**
- ✅ `GESTOR deve criar novo pilar via addTag para própria empresa` - **BLOQUEADO**
- ⚠️ Outros testes de pilares (reordenar, remover) podem funcionar com pilares existentes

### Ação Necessária
**DEV Agent deve:**
1. Investigar configuração do ng-select no componente pilares-empresa-form
2. Verificar se `[addTag]="addPilarTag"` está correto
3. Testar manualmente no navegador se opção "Adicionar" aparece
4. Corrigir implementação do addTag conforme especificação do ng-select
5. Validar que toast de sucesso aparece após criação

---

## ⚠️ Observação #1: Seletores de Teste Precisavam de Ajuste

**Severidade:** ℹ️ INFORMATIVO (já corrigido nos testes)

### Descrição
Seletores CSS nos testes estavam usando caminho complexo que não funcionava:
```typescript
// ❌ ERRADO
page.locator('[data-testid="empresa-select"]').locator('..').locator('[ngbDropdownToggle]')

// ✅ CORRETO
page.locator('#savingBar [ngbDropdownToggle]')
```

### Ação Tomada
- Testes foram corrigidos para usar seletor direto
- **NOTA:** Isso NÃO é um bug de produção, apenas melhoria nos testes

---

## 📊 Resumo Executivo

| Categoria | Quantidade |
|-----------|------------|
| Bugs Críticos Bloqueadores | 1 |
| Bugs Médios | 0 |
| Bugs Baixos | 0 |
| Melhorias de Teste | 1 |
| **Taxa de Sucesso** | **0%** (bloqueado no primeiro teste) |

### Próximos Passos
1. ❌ **DEV deve corrigir BUG #1 IMEDIATAMENTE** (bloqueador)
2. ⏸️ Testes E2E estão pausados até correção
3. 🔄 Re-executar suite completa após fix do DEV
4. ✅ Continuar com testes de reordenação e remoção (podem passar com dados existentes)

---

**IMPORTANTE:** Como QA E2E, **NÃO posso corrigir código de produção**. Este relatório documenta os bugs encontrados para que o **DEV Agent** possa atuar e corrigi-los.
