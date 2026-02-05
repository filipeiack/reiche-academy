# Regras de UI - Feedback ao Usuário

**Data de criação**: 2026-02-04  
**Escopo**: Toasts, modais, notificações, feedback visual  
**Fontes consolidadas**: Múltiplos arquivos com Swal, toast, modal patterns  

---

## 1. Visão Geral

O sistema utiliza SweetAlert2 como biblioteca principal para feedback ao usuário, implementando:
- Toasts para notificações rápidas (sucesso/erro/info)
- Modais para confirmações e formulários complexos
- Feedback visual consistente em todas as telas
- Tratamento adequado de acessibilidade

---

## 2. Componentes e Padrões

### 2.1 Biblioteca Padrão
- **Principal**: SweetAlert2 (`Swal.fire()`)
- **Uso**: Toasts e modais em todo frontend
- **Import**: `import Swal from 'sweetalert2';`

### 2.2 Tipos de Feedback

#### 2.2.1 Toast (Notificação Rápida)
```typescript
// Padrão de toast
Swal.fire({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,           // 3 segundos padrão
  timerProgressBar: true,
  title: 'Mensagem',
  icon: 'success' | 'error' | 'warning' | 'info'
});
```

#### 2.2.2 Modal (Confirmação/Formulário)
```typescript
// Padrão de confirmação
Swal.fire({
  title: '<strong>Título</strong>',
  html: `Conteúdo com <strong>HTML</strong> permitido`,
  showCloseButton: true,
  showCancelButton: true,
  confirmButtonText: '<i class="feather icon-check"></i> Confirmar',
  cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
  allowOutsideClick: false
});
```

### 2.3 Ícones Padrão
- **Sucesso**: `'success'` ✅
- **Erro**: `'error'` ❌  
- **Aviso**: `'warning'` ⚠️
- **Informação**: `'info'` ℹ️

---

## 3. Regras de Comportamento

### 3.1 Toasts
**R-FB-001**: Posição e duração padrão
- Sempre `toast: true`
- Posição fixa: `position: 'top-end'`
- Duração padrão: 3000ms
- Barra de progresso: `timerProgressBar: true`

**R-FB-002**: Uso consistente de botões
- Toasts nunca mostram botão de confirmação: `showConfirmButton: false`
- Botão de fechar opcional apenas para erros persistentes

**R-FB-003**: Timing apropriado
- Sucesso: 3000ms (rápido)
- Erro: 5000ms (mais tempo para ler)
- Aviso: 4000ms
- Info: 3000ms

### 3.2 Modais de Confirmação
**R-FB-004**: Estrutura padrão
- Título com `<strong>` para destaque
- Conteúdo com `html` permitido para formatação
- Botão de cancelar sempre presente em ações destrutivas
- `allowOutsideClick: false` para decisões críticas

**R-FB-005**: Ícones em botões
- Confirmar: `<i class="feather icon-check"></i>`
- Cancelar: `<i class="feather icon-x"></i>`
- Deletar: `<i class="feather icon-trash-2"></i>`

### 3.3 Feedback de Formulários
**R-FB-006**: Validação inline
- Erros de campo mostrados diretamente no formulário
- Toast apenas para confirmação de salvamento ou erro geral
- Múltiplos erros exibidos em modal se necessário

**R-FB-007**: Estados de loading
- Botões desabilitados durante processamento
- Spinner em botão principal durante requisições
- Mensagem "Carregando..." para operações longas (>2s)

---

## 4. Validações e Acessibilidade

### 4.1 Tratamento de Erros
**R-FB-008**: Mensagens de erro específicas
```typescript
// Erro de API genérico
Swal.fire('Erro', err?.error?.message || 'Erro ao processar solicitação', 'error');

// Erro de validação
Swal.fire({
  icon: 'warning',
  title: 'Dados inválidos',
  html: `Verifique os seguintes campos:<br>• ${errors.join('<br>• ')}`
});
```

### 4.2 Acessibilidade
**R-FB-009**: Foco e navegação
- Modais capturam foco automaticamente
- Fechamento com tecla ESC habilitado
- Navegação por teclado entre botões
- ARIA labels para botões customizados

### 4.3 Responsividade
**R-FB-010**: Comportamento mobile
- Toasts adaptados para telas pequenas
- Modais com `width: '90%'` em mobile (<768px)
- Font sizes ajustados automaticamente

---

## 5. Integrações com Backend

### 5.1 Padrão de Resposta
```typescript
// Service pattern
create(data: CreateDto): Observable<any> {
  return this.http.post(`${this.apiUrl}`, data).pipe(
    tap(() => {
      this.showToast('Criado com sucesso!', 'success');
    }),
    catchError((err) => {
      this.showToast('Erro ao criar', 'error');
      return throwError(err);
    })
  );
}
```

### 5.2 Tratamento de Erros HTTP
**R-FB-011**: Mapeamento de status codes
- 400: Bad Request → Validar formulário
- 401: Unauthorized → Redirecionar para login
- 403: Forbidden → Mostrar toast de permissão
- 404: Not Found → Recurso não encontrado
- 500: Server Error → Erro genérico

### 5.3 Rate Limiting
**R-FB-012**: Feedback para múltiplas tentativas
```typescript
// Excesso de tentativas
Swal.fire({
  icon: 'warning',
  title: 'Muitas tentativas',
  text: 'Aguarde alguns minutos antes de tentar novamente',
  timer: 5000
});
```

---

## 6. Casos de Uso Típicos

### 6.1 CRUD Operations
```typescript
// Create
Swal.fire('Sucesso!', 'Registro criado com sucesso', 'success');

// Update  
Swal.fire('Atualizado!', 'Registro atualizado com sucesso', 'success');

// Delete (com confirmação)
Swal.fire({
  title: 'Deletar registro?',
  html: `Tem certeza que deseja deletar <strong>${nome}</strong>?`,
  icon: 'warning',
  showCancelButton: true,
  confirmButtonText: 'Sim, deletar'
}).then((result) => {
  if (result.isConfirmed) {
    // Executar deleção
    Swal.fire('Deletado!', 'Registro removido', 'success');
  }
});
```

### 6.2 Upload de Arquivos
```typescript
// Progress indicator
Swal.fire({
  title: 'Enviando arquivo...',
  html: '<div class="progress"><div class="progress-bar" style="width: 0%"></div></div>',
  showConfirmButton: false,
  allowOutsideClick: false
});

// Completion
Swal.fire('Concluído!', 'Arquivo enviado com sucesso', 'success');
```

### 6.3 Operações Longas
```typescript
// Auto-save
Swal.fire({
  toast: true,
  position: 'top-end',
  icon: 'info',
  title: 'Salvando...',
  timer: 1000
});
```

---

## 7. Testes de UI

### 7.1 Testes Unitários (Jasmine)
```typescript
describe('Toast Service', () => {
  it('deve mostrar toast de sucesso', () => {
    spyOn(Swal, 'fire');
    component.showToast('Sucesso!', 'success');
    expect(Swal.fire).toHaveBeenCalledWith(jasmine.objectContaining({
      toast: true,
      title: 'Sucesso!',
      icon: 'success'
    }));
  });
});
```

### 7.2 Testes E2E (Playwright)
```typescript
test('feedback de criação', async ({ page }) => {
  await page.goto('/usuarios/novo');
  await page.fill('#nome', 'Test User');
  await page.fill('#email', 'test@example.com');
  await page.click('button[type="submit"]');
  
  // Valida toast de sucesso
  await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.swal2-toast .swal2-title')).toContainText('criado com sucesso');
});

test('confirmação de deleção', async ({ page }) => {
  await page.goto('/usuarios');
  await page.click('[data-testid="delete-user"]');
  
  // Valida modal de confirmação
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await expect(page.locator('.swal2-title')).toContainText('Deletar Usuário');
  
  // Confirma e valida sucesso
  await page.click('.swal2-confirm');
  await expect(page.locator('.swal2-toast .swal2-title')).toContainText('deletado');
});
```

---

## 8. Considerações Técnicas

### 8.1 Performance
- Import único de SweetAlert2
- Reuso de configurações padrão
- Evitar múltiplos toasts simultâneos

### 8.2 Themas e Customização
- CSS customizado via `customClass` quando necessário
- Cores consistentes com branding da aplicação
- Animações padrão do SweetAlert2

### 8.3 Limitações
- SweetAlert2 bloqueia interação com outros elementos
- Toasts podem acumular se não controlados
- Customização excessiva pode quebrar acessibilidade

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Spam de toasts | Médio | Limitar toast por ação, usar队列 se necessário |
| Modal stack overflow | Baixo | Evitar modais dentro de modais |
| Acessibilidade perdida | Baixo | Testar com leitor de tela periodicamente |
| Performance em mobile | Baixo | Configurar `width: '90%'` para mobile |

---

**Status**: ✅ **IMPLEMENTADO**  
**Manutenção**: Revisar trimestralmente para ajustes de UX/Performance  
**Documentação relacionada**: `/docs/conventions/frontend.md` (seção 10)