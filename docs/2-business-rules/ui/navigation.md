# Regras de UI - Navegação

**Data de criação**: 2026-02-04  
**Escopo**: Sidebar, navegação principal, ordenação de menus  
**Fontes consolidadas**: sidebar.md, sidebar-cockpit-submenu-ordenacao.md  

---

## 1. Visão Geral

O sistema de navegação implementa um menu lateral (sidebar) responsivo com:
- Construção dinâmica baseada em perfil de usuário
- Tradução automática de rótulos
- Comportamento responsivo (desktop/mobile)
- Destaque de rota ativa e expansão automática
- Ordenação alfabética de submenus específicos

---

## 2. Componentes e Padrões

### 2.1 Sidebar Principal
- **Localização**: `frontend/src/app/views/layout/sidebar/`
- **Responsividade**: 
  - Desktop: modo folded/dobrado com hover
  - Mobile: overlay que fecha após navegação
- **Tradução**: Integration com `TranslateService`
- **Ativação**: Classes CSS `.mm-active` e `.mm-show`

### 2.2 Estrutura de Menu
```typescript
interface MenuItem {
  id?: string;
  label: string;           // Traduzido via TranslateService
  icon?: string;
  link?: string;
  subItems?: MenuItem[];
  isTitle?: boolean;
}
```

### 2.3 Links Restritos (Admin)
```typescript
const ADMIN_ONLY_LINKS = [
  '/usuarios', 
  '/empresas', 
  '/pilares', 
  '/rotinas'
];
```

---

## 3. Regras de Comportamento

### 3.1 Geração de Menu (MenuService)
**R-NAV-001**: Tradução automática
- Aplica `TranslateService.instant()` em todos os `label` e `subItems`

**R-NAV-002**: Filtragem por perfil
- Se `currentUser?.perfil?.codigo !== 'ADMINISTRADOR'`, remove itens cujo `link` ∈ `ADMIN_ONLY_LINKS`
- Mantém títulos apenas se houver `subItems` visíveis

**R-NAV-003**: Atualização reativa
- Regenera itens ao mudar idioma (`currentLang$`) ou usuário atual

**R-NAV-004**: Ordenação de Cockpits
- Submenu de Cockpits ordenado alfabeticamente pelo nome do pilar
- Ordenação simples (A-Z), sem tratamento especial de acentos

### 3.2 Comportamento Responsivo
**R-NAV-005**: Toggle Desktop
- `toggleSidebar()` altera `body.sidebar-folded`
- Modo hover: `mouseenter` adiciona `body.open-sidebar-folded`

**R-NAV-006**: Toggle Mobile
- Em tela ≤ 991px, alterna `body.sidebar-open`
- Fecha automaticamente após navegação bem-sucedida

### 3.3 Ativação de Rota
**R-NAV-007**: Destaque automático
- Em `NavigationEnd`, compara `window.location.pathname` com menu items
- Aplica `.mm-active` no item correspondente e ancestrais
- Expande submenu pai com `.mm-show`

---

## 4. Validações e Acessibilidade

### 4.1 Validações de Estrutura
- Verificação de existência de elementos DOM antes de manipulação
- Tratamento de títulos sem itens visíveis (removidos automaticamente)
- Prevenção de null/undefined em `currentUser.perfil.codigo`

### 4.2 Acessibilidade
- Labels traduzidos via `| translate`
- Navegação por teclado suportada via MetisMenu
- Estrutura semântica com elementos de navegação HTML5

---

## 5. Integrações com Backend

### 5.1 Fonte de Dados Estática
- Menu principal definido em array estático (`MENU`)
- Submenus dinâmicos (ex: Cockpits) alimentados por APIs específicas
- Período de mentoria ativo considerado em algumas navegações

### 5.2 Permissões
- Filtragem visual apenas (acesso real validado no backend)
- Links restritos baseados em perfil (ADMINISTRADOR vs outros)

---

## 6. Casos de Uso Típicos

### 6.1 Admin vs Cliente
```typescript
// Admin: vê menu completo
currentUser.perfil.codigo === 'ADMINISTRADOR'
→ Todos os itens visíveis (usuários, empresas, pilares, rotinas)

// Cliente: menu filtrado
currentUser.perfil.codigo !== 'ADMINISTRADOR'  
→ Links admin removidos, apenas áreas públicas
```

### 6.2 Fluxo de Navegação
1. Usuário faz login
2. Sidebar renderiza baseado em perfil
3. Usuário clica em item
4. Rota ativada com destaque visual
5. Em mobile, sidebar fecha automaticamente

### 6.3 Multi-idioma
1. Usuário muda idioma no sistema
2. `currentLang$` emitido
3. MenuService regera menu com tradução
4. Sidebar atualizada sem reload

---

## 7. Testes de UI

### 7.1 Testes Unitários
- `MenuService.getItems()`: filtragem por perfil
- `toggleSidebar()`: comportamento responsivo
- `_activateMenuDropdown()`: ativação de rota

### 7.2 Testes E2E (Playwright)
```typescript
// Navegação principal
test('menu admin vs cliente', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[href="/usuarios"]')).toBeVisible();
  
  // Login como cliente
  await loginAsCliente();
  await expect(page.locator('[href="/usuarios"]')).not.toBeVisible();
});

// Ordenação de cockpits
test('submenu cockpits ordenado', async ({ page }) => {
  await page.goto('/');
  const cockpits = page.locator('.cockpit-submenu .nav-link');
  const names = await cockpits.allTextContents();
  
  // Verifica ordenação alfabética
  expect(names).toEqual([...names].sort());
});
```

---

## 8. Considerações Técnicas

### 8.1 Performance
- Menu gerado apenas uma vez por mudança de idioma/perfil
- Cache de traduções via `TranslateService`
- Lazy loading de submenus grandes ( Cockpits)

### 8.2 Compatibilidade
- Uso de `window.location.pathname` (considerar base href)
- Classes CSS baseadas em MetisMenu v1.x
- Breakpoint mobile: `window.innerWidth <= 991px`

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Inconsistência `currentUser.perfil.codigo` | Médio | Padronizar tipo para string em todo frontend |
| Links visíveis sem acesso real | Baixo | Validação no backend garante segurança |
| Base href divergente de pathname | Baixo | Documentar se aplicável e ajustar se necessário |
| Estado sidebar não persistido | Baixo | Feature futura (opcional) |

---

**Status**: ✅ **IMPLEMENTADO** (com regra de ordenação proposta)  
**Próxima versão**: Implementar R-NAV-004 (ordenação de Cockpits)  
**Manutenção**: Revisar anualmente para ajustes de performance/UX