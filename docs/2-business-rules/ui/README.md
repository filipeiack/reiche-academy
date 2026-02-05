# Regras de UI - User Interface

**Última atualização**: 2026-02-04  
**Escopo**: Centralizar padrões de UI, eliminar inconsistências, facilitar manutenção do frontend

---

## 📋 Visão Geral

Este diretório consolida todas as regras de negócio relacionadas à interface do usuário, organizadas por área de responsabilidade para facilitar referência e implementação.

### Objetivos
- ✅ Centralizar padrões de UI
- ✅ Eliminar inconsistências entre componentes
- ✅ Facilitar onboarding de desenvolvedores
- ✅ Padronizar experiência do usuário
- ✅ Simplificar manutenção do frontend

---

## 📁 Estrutura de Documentos

| Documento | Conteúdo | Status |
|-----------|----------|---------|
| **[navigation.md](./navigation.md)** | Sidebar, menu, navegação, ordenação | ✅ Implementado |
| **[feedback.md](./feedback.md)** | Toasts, modais, SweetAlert2, notificações | ✅ Implementado |
| **[forms.md](./forms.md)** | Validação, campos senha, ambiente, padrões | ✅ Implementado |
| **[accessibility.md](./accessibility.md)** | WCAG 2.1 AA, teclado, leitores de tela | 🚧 Em implementação |

---

## 🔗 Integração com Outras Regras

### Dependencies
- **Core**: `/docs/2-business-rules/core/` - Autenticação, multi-tenant, RBAC
- **Security**: `/docs/2-business-rules/security/` - Senhas, sessão, rate limiting
- **Conventions**: `/docs/conventions/` - Padrões de código e nomenclatura

### Framework Integration
- **Frontend**: Angular 18+ standalone components
- **UI Library**: Bootstrap 5 + SweetAlert2
- **Testing**: Jasmine (unit) + Playwright (E2E)

---

## 🎯 Padrões Principais

### Bibliotecas e Ferramentas
```typescript
// Feedback principal
import Swal from 'sweetalert2';

// Forms
import { FormBuilder, Validators } from '@angular/forms';

// Navegação
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
```

### Cores e Tema
```css
/* Principais */
--primary: #0066cc;    /* AA contrast */
--success: #28a745;
--warning: #ffc107;
--danger: #dc3545;
--info: #17a2b8;

/* Accessibility */
--text-primary: #212529;   /* 7:1 contrast */
--text-secondary: #6c757d;  /* 4.5:1 contrast */
```

### Componentes Padrão
- **Forms**: Reactive Forms + validação client + server
- **Feedback**: SweetAlert2 toasts + modais
- **Navegação**: Sidebar responsivo + MetisMenu
- **Layout**: Bootstrap grid + custom components

---

## 🔄 Workflow de Implementação

### Para Novos Componentes

1. **Referenciar documentos relevantes**
   - Se tem formulário → `forms.md`
   - Se tem feedback → `feedback.md`
   - Se tem navegação → `navigation.md`
   - Sempre → `accessibility.md`

2. **Seguir padrões estabelecidos**
   - Estrutura HTML semântica
   - Classes CSS consistentes
   - Nomenclatura padronizada

3. **Implementar acessibilidade**
   - Labels e ARIA attributes
   - Navegação por teclado
   - Contraste de cores

4. **Testes obrigatórios**
   - Unit tests (Jasmine)
   - E2E tests (Playwright)
   - Accessibility tests (axe-core)

### Para Manutenção

1. **Verificar impacto**
   - Alterações afetam múltiplos componentes?
   - Quebra padrões estabelecidos?

2. **Atualizar documentação**
   - Novas regras documentadas aqui
   - Exemplos práticos incluídos

3. **Comunicar mudanças**
   - Atualizar convenções em `/docs/conventions/`
   - Comunicar via changelog/semana dev

---

## 🚨 Regras Críticas (NÃO QUEBRAR)

### 🚨 Segurança
- Senhas SEMPRE com `type="password"` por padrão
- Nunca expor dados sensíveis em console.logs
- Validar TODOS inputs no backend também

### 🚨 Acessibilidade
- TODO input tem `<label>` associado
- Ordem de tabulação lógica
- Contraste WCAG 2.1 AA mínimo

### 🚨 Performance
- Lazy loading de componentes pesados
- Evitar múltiplos toasts simultâneos
- Otimizar renders em listas grandes

### 🚨 UX Consistente
- Mensagens de erro padronizadas
- Loading states consistentes
- Feedback visual para TODAS as ações

---

## 📊 Status por Módulo

| Módulo | Padronização | Testes | Acessibilidade |
|--------|--------------|--------|----------------|
| Auth | ✅ | ✅ | 🚧 |
| Usuários | ✅ | ✅ | 🚧 |
| Empresas | ✅ | ✅ | 🚧 |
| Cockpits | ✅ | 🚧 | 🚧 |
| Relatórios | 🚧 | 🚧 | 🚧 |

Legenda: ✅ Completo | 🚧 Em progresso | ❌ Não iniciado

---

## 🛠️ Ferramentas de Validação

### Automatizadas
```bash
# Lint + TypeScript
npm run lint
npm run typecheck

# Tests
npm test                    # Unit tests
npm run test:e2e           # E2E tests

# Accessibility
npm run test:a11y           # axe-core integration
```

### Manuais
- **WAVE Extension**: Validação visual de acessibilidade
- **Lighthouse**: Performance + A11Y audit
- **Screen Readers**: NVDA/JAWS/VoiceOver testing
- **Keyboard Navigation**: Full workflow testing

---

## 📚 Recursos Adicionais

### Internos
- [`/docs/conventions/frontend.md`](../../conventions/frontend.md) - Padrões Angular
- [`/docs/conventions/testing.md`](../../conventions/testing.md) - Padrões de testes
- [`/docs/conventions/naming.md`](../../conventions/naming.md) - Nomenclatura

### Externos
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Angular Accessibility Guide](https://angular.io/guide/accessibility)
- [SweetAlert2 Documentation](https://sweetalert2.github.io/)
- [Bootstrap 5 Accessibility](https://getbootstrap.com/docs/5.1/getting-started/accessibility/)

---

## 🔄 Histórico de Mudanças

### v1.0.0 (2026-02-04)
- ✅ Criação dos 4 documentos principais
- ✅ Consolidação de regras espalhadas
- ✅ Padronização de estrutura
- 🚧 Início de implementação de acessibilidade

### Próximas Versões
- **v1.1**: Completar accessibility.md com exemplos reais
- **v1.2**: Adicionar dark theme guidelines
- **v1.3**: Mobile-first patterns otimizados

---

## 📞 Suporte e Contribuição

### Para Dúvidas
1. Consultar documentos relevantes
2. Verificar exemplos em `/docs/conventions/`
3. Procurar implementações existentes no código

### Para Contribuir
1. Novas regras devem ser documentadas aqui primeiro
2. Exemplos práticos são obrigatórios
3. Testes devem validar novas regras

### Para Reportar Problemas
- Inconsistências entre componentes
- Quebra de padrões estabelecidos
- Sugestões de melhoria

---

** Mantenedores**: Dev Team  
**Revisores**: QA Team + Business Analyst  
**Aprovação**: System Engineer (mudanças estruturais)