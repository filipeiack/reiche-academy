# Regras de UI - Acessibilidade

**Data de criação**: 2026-02-04  
**Escopo**: Acessibilidade digital, WCAG 2.1 AA, navegação por teclado, leitores de tela  
**Fontes consolidadas**: Padrões observados em componentes existentes e boas práticas  

---

## 1. Visão Geral

O sistema implementa acessibilidade seguindo as diretrizes WCAG 2.1 AA, garantindo:
- Navegação completa por teclado
- Compatibilidade com leitores de tela
- Contraste adequado de cores
- Estrutura semântica HTML5
- Feedback visual e auditivo consistente

---

## 2. Componentes e Padrões

### 2.1 Estrutura Semântica
```html
<!-- Header com navegação -->
<header role="banner">
  <nav aria-label="Navegação principal">
    <!-- Menu principal -->
  </nav>
</header>

<!-- Conteúdo principal -->
<main role="main" aria-label="Conteúdo principal">
  <section aria-labelledby="section-title">
    <h1 id="section-title">Título da Seção</h1>
  </section>
</main>

<!-- Rodapé -->
<footer role="contentinfo">
  <!-- Footer content -->
</footer>
```

### 2.2 Navegação por Teclado
**R-A11Y-001**: Ordem de tabulação lógica
- Elementos interativos em ordem de leitura
- Grupos relacionados com `tabindex="-1"` para skip
- Skip links para navegação rápida

```html
<!-- Skip to main content -->
<a href="#main-content" class="skip-link">
  Ir para o conteúdo principal
</a>

<main id="main-content" role="main">
  <!-- Main content -->
</main>
```

### 2.3 Forms Acessíveis
**R-A11Y-002**: Labels e descrições
```html
<div class="form-group">
  <label for="email" class="form-label">
    Email
    <span class="required" aria-label="obrigatório">*</span>
  </label>
  <input type="email" 
         id="email" 
         class="form-control"
         aria-describedby="email-help email-error"
         aria-required="true"
         aria-invalid="false">
  <small id="email-help" class="form-text text-muted">
    Digite seu email corporativo
  </small>
  <div id="email-error" class="invalid-feedback" role="alert">
    <!-- Mensagens de erro -->
  </div>
</div>
```

---

## 3. Regras de Comportamento

### 3.1 Navegação
**R-A11Y-003**: Teclas de atalho padrão
- `Tab`: Próximo elemento interativo
- `Shift+Tab`: Elemento anterior
- `Enter`: Ativar botão, link, submit form
- `Space`: Toggle checkbox/radio button
- `Escape`: Fechar modal/dropdown

**R-A11Y-004**: Foco visível
```css
/* Focus indicator */
:focus-visible {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :focus-visible {
    outline: 3px solid;
    outline-offset: 3px;
  }
}
```

### 3.2 Feedback Auditivo
**R-A11Y-005**: Anúncios de mudanças de estado
```typescript
// Live regions para notificações
<div aria-live="polite" aria-atomic="true" class="sr-only">
  <!-- Mensagens para leitores de tela -->
</div>

// Em TypeScript
announceToScreenReader(message: string) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}
```

### 3.3 Modais e Overlays
**R-A11Y-006**: Trapping de foco
```typescript
// SweetAlert2 já implementa focus trapping
Swal.fire({
  title: 'Confirmar Ação',
  showCancelButton: true,
  focusConfirm: false,  // Foco customizado se necessário
  preConfirm: () => {
    // Lógica de confirmação
  }
});
```

---

## 4. Validações e Testes

### 4.1 Contraste de Cores
**R-A11Y-007**: WCAG 2.1 AA compliance
- Texto normal: 4.5:1 mínimo
- Texto grande (18px+): 3:1 mínimo
- Componentes UI: 3:1 mínimo

```css
/* Exemplo de cores acessíveis */
.text-primary {
  color: #0066cc; /* Contraste adequado com branco */
}

.btn-primary {
  background-color: #0066cc;
  color: #ffffff; /* Contraste 7.1:1 */
}
```

### 4.2 Tamanhos de Toque
**R-A11Y-008**: Áreas de clique adequadas
- Mínimo 44x44px para elementos interativos
- Espaçamento adequado entre elementos adjacentes

```css
.btn {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 16px;
}

/* Mobile touch targets */
@media (pointer: coarse) {
  .btn {
    min-height: 48px;
    min-width: 48px;
  }
}
```

### 4.3 Redução de Movimento
**R-A11Y-009**: Respectar preferências do usuário
```css
/* Respeitar prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 5. Componentes Específicos

### 5.1 Sidebar Acessível
**R-A11Y-010**: Menu de navegação
```html
<nav role="navigation" aria-label="Menu principal">
  <ul class="sidebar-menu" role="menu">
    <li role="none">
      <a href="/dashboard" 
         role="menuitem" 
         aria-current="page">
        <i class="icon" aria-hidden="true"></i>
        <span>Dashboard</span>
      </a>
    </li>
  </ul>
</nav>
```

### 5.2 Tabelas de Dados
**R-A11Y-011**: Tabelas acessíveis
```html
<table class="table" role="table">
  <caption>Lista de usuários da empresa</caption>
  <thead>
    <tr role="row">
      <th scope="col">Nome</th>
      <th scope="col">Email</th>
      <th scope="col">Ações</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td>João Silva</td>
      <td>joao@empresa.com</td>
      <td>
        <button aria-label="Editar João Silva">
          <i class="icon-edit" aria-hidden="true"></i>
        </button>
      </td>
    </tr>
  </tbody>
</table>
```

### 5.3 Gráficos e Visualizações
**R-A11Y-012**: Alternativas textuais
```html
<!-- Chart com descrição -->
<div class="chart-container">
  <canvas id="chart-element"></canvas>
  <div class="sr-only" role="img" 
       aria-label="Gráfico mostrando crescimento de 20% no primeiro trimestre">
    Gráfico de crescimento trimestral: T1: 100, T2: 120 (20% de crescimento)
  </div>
</div>
```

---

## 6. Integrações com Backend

### 6.1 Conteúdo Dinâmico
**R-A11Y-013**: Atualizações de conteúdo
```typescript
// Anunciar mudanças para leitores de tela
updateContent(newContent: string) {
  const liveRegion = document.getElementById('live-region');
  if (liveRegion) {
    liveRegion.textContent = `Conteúdo atualizado: ${newContent}`;
  }
}

// SweetAlert2 com acessibilidade
Swal.fire({
  title: 'Operação Concluída',
  text: 'Os dados foram salvos com sucesso',
  icon: 'success',
  ariaLabel: 'Modal de confirmação: Operação concluída com sucesso'
});
```

### 6.2 Validações de Formulário
**R-A11Y-014**: Feedback de erro acessível
```typescript
// Adicionar erro ao campo
addFieldError(fieldName: string, errorMessage: string) {
  const field = this.form.get(fieldName);
  const errorElement = document.getElementById(`${fieldName}-error`);
  
  field?.setErrors({ server: errorMessage });
  
  if (errorElement) {
    errorElement.textContent = errorMessage;
    errorElement.setAttribute('role', 'alert');
  }
  
  // Foco no primeiro campo com erro
  field?.markAsTouched();
  document.getElementById(fieldName)?.focus();
}
```

---

## 7. Casos de Uso Típicos

### 7.1 Navegação Completa por Teclado
```typescript
// Custom keyboard navigation para componentes complexos
@HostListener('keydown', ['$event'])
onKeyDown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Tab':
      // Navegação natural já funciona
      break;
    case 'Enter':
      if (event.target instanceof HTMLElement) {
        event.target.click();
      }
      break;
    case 'Escape':
      this.closeModal();
      break;
  }
}
```

### 7.2 Upload de Arquivos
```html
<div class="upload-area" 
     role="button"
     tabindex="0"
     aria-label="Arraste arquivos ou clique para selecionar"
     (drop)="onFileDrop($event)"
     (dragover)="onDragOver($event)"
     (keydown.enter)="fileInput.click()"
     (keydown.space)="fileInput.click()">
  
  <input type="file" 
         #fileInput 
         class="sr-only" 
         (change)="onFileSelect($event)"
         aria-label="Selecionar arquivos para upload">
  
  <span>Arraste arquivos aqui ou clique para selecionar</span>
</div>
```

### 7.3 Paginação Acessível
```html
<nav aria-label="Navegação de páginas">
  <ul class="pagination">
    <li class="page-item" [class.disabled]="currentPage === 1">
      <a class="page-link" 
         href="#" 
         aria-label="Página anterior"
         (click)="previousPage($event)">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>
    
    <li class="page-item" [class.active]="page === currentPage">
      <a class="page-link" 
         href="#" 
         aria-current="page" 
         aria-label={`Página ${page}`}
         (click)="goToPage(page, $event)">
        {{ page }}
      </a>
    </li>
  </ul>
</nav>
```

---

## 8. Testes de Acessibilidade

### 8.1 Testes Automáticos
```typescript
// Testes unitários para acessibilidade
describe('Acessibilidade', () => {
  it('deve ter labels para todos os inputs', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input');
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      expect(label).toBeTruthy();
    });
  });
  
  it('deve anunciar mudanças de estado', () => {
    component.showMessage('Test message');
    const liveRegion = document.querySelector('[aria-live="polite"]');
    expect(liveRegion?.textContent).toContain('Test message');
  });
});
```

### 8.2 Testes E2E (Playwright)
```typescript
test('navegação por teclado', async ({ page }) => {
  await page.goto('/usuarios');
  
  // Tab navigation
  await page.keyboard.press('Tab');
  let focused = await page.locator(':focus');
  expect(focused).toBeVisible();
  
  // Continue navigation through all interactive elements
  const interactiveElements = page.locator('a, button, input, select, textarea');
  const count = await interactiveElements.count();
  
  for (let i = 0; i < count; i++) {
    await page.keyboard.press('Tab');
    focused = await page.locator(':focus');
    expect(focused).toBeVisible();
  }
});

test('leitor de tela compatibility', async ({ page }) => {
  await page.goto('/usuarios/novo');
  
  // Verificar se todos os inputs têm labels associados
  const inputs = await page.locator('input').all();
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    const label = await page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
  }
});
```

### 8.3 Ferramentas de Validação
- **axe-core**: Integração com testes automatizados
- **WAVE**: Validação visual de acessibilidade
- **Lighthouse**: Performance + acessibilidade
- **Screen readers**: NVDA, JAWS, VoiceOver

---

## 9. Considerações Técnicas

### 9.1 Performance
- Uso eficiente de ARIA attributes
- Evitar over-annotation (marcar apenas quando necessário)
- Semantic HTML5 em vez de divs excessivas

### 9.2 Framework Considerations
- Angular já tem boa acessibilidade nativa
- SweetAlert2 implementado com ARIA adequado
- Custom components precisam atenção especial

### 9.3 Testing Strategy
- Testes automatizados em pipeline CI/CD
- Testes manuais com leitores de tela
- Validação com usuários reais com deficiências

---

## 10. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Novo componente não acessível | Alto | Revisão de código com checklist de A11Y |
| Contraste inadequado em tema customizado | Médio | Validar contrastes com ferramentas automatizadas |
| Navegação por teclado quebrada | Alto | Testes E2E de navegação em todas as telas |
| Conteúdo dinâmico não anunciado | Médio | Usar live regions para mudanças importantes |

---

## 11. Checklist de Implementação

### Antes do Merge:
- [ ] Todos inputs têm labels associados
- [ ] Ordem de tabulação lógica
- [ ] Contraste de cores WCAG 2.1 AA
- [ ] Áreas de clique >= 44x44px
- [ ] ARIA attributes apenas quando necessário
- [ ] Testes com teclado passam
- [ ] Conteúdo dinâmico anunciado

### Pós-Implementação:
- [ ] Validação com ferramentas automatizadas
- [ ] Teste manual com leitor de tela
- [ ] Verificação em diferentes navegadores
- [ ] Documentação de componentes customizados

---

**Status**: ✅ **EM IMPLEMENTAÇÃO**  
**Próxima auditoria**: Revisar todos os componentes existentes em Q1 2026  
**Manutenção**: Checklist obrigatório em todo novo componente UI