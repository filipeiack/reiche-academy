# Regras de Negócio — Frontend Sidebar

**Data de extração**: 2025-12-21  
**Escopo**: Componente Sidebar, Menu estático e MenuService

---

## 1. Visão Geral

O Sidebar implementa:
- Construção de menu a partir de fonte estática e tradução
- Filtragem de itens baseada no perfil do usuário (admin vs cliente)
- Comportamento responsivo: abrir/fechar, modo dobrado (folded) e hover
- Realce de rota ativa e expansão automática de submenus

---

## 2. Entidades

### 2.1 `MenuItem`
- Campos: `id?`, `label`, `icon?`, `link?`, `subItems?`, `isTitle?`

### 2.2 Fonte de Menu (`MENU`)
- Seções e itens (
  Dashboard, Calendário, Usuários, Empresas, Pilares, Rotinas, Notas, Documentos
)

### 2.3 Lista de Links Admin (`ADMIN_ONLY_LINKS`)
- `['/usuarios', '/empresas', '/pilares', '/rotinas']`

### 2.4 Serviços Consumidos
- `MenuService` — gera itens traduzidos e filtrados
- `TranslateService` — tradução de rótulos
- `AuthService` — usuário atual para decidir filtragem

---

## 3. Regras Implementadas

### 3.1 Geração de Menu (MenuService)

**R-SID-001**: Tradução de rótulos
- Aplica `TranslateService.instant` em `label` e em cada `subItems`

**R-SID-002**: Filtragem por perfil
- Se `currentUser?.perfil?.codigo !== 'ADMINISTRADOR'`, remove itens cujo `link` ∈ `ADMIN_ONLY_LINKS`
- Mantém títulos apenas se houver `subItems` visíveis

**R-SID-003**: Atualização reativa
- Regenera itens ao mudar idioma (`currentLang$`) ou usuário atual

### 3.2 Comportamento de Sidebar (SidebarComponent)

**R-SID-004**: Inicialização e MetisMenu
- Após `ViewInit`, instancia `MetisMenu` sobre `#menu-bar` quando presente

**R-SID-005**: Responsividade — abrir/fechar
- `toggleSidebar()`
  - Em desktop: alterna `body.sidebar-folded`
  - Em mobile (≤ 991px): alterna `body.sidebar-open`

**R-SID-006**: Modo dobrado (folded) com hover
- `openSidebarFolded()`: adiciona `body.open-sidebar-folded`
- `closeSidebarFolded()`: remove `body.open-sidebar-folded`

**R-SID-007**: Ativação de rota
- Em `NavigationEnd`, chama `_activateMenuDropdown()`
- Usa `window.location.pathname` para localizar item ativo e aplicar classes:
  - `mm-active` em item/link e ancestrais
  - `mm-show` para expandir submenus

**R-SID-008**: Fechar em mobile após navegação
- Se `window.innerWidth <= 991`, remove `body.sidebar-open` e a classe `active` do toggler

---

## 4. Validações

- Verificação de existência de elementos DOM antes de manipulação (`#menu-bar`, `.sidebar-toggler`)
- `hasItems()` considera títulos sem itens visíveis como removíveis

---

## 5. Comportamentos Condicionais

### 5.1 Geração de Menu
```
init | idioma muda | usuário muda
  └─ MenuService.getItems()
       ├─ traduz labels
       └─ filtra ADMIN_ONLY_LINKS para não-admin
```

### 5.2 Toggle Sidebar
```
click toggler
  ├─ mobile? (≤991) → body.sidebar-open ^= true
  └─ desktop → body.sidebar-folded ^= true
```

### 5.3 Hover em modo folded
```
mouseenter sidebar → body.open-sidebar-folded = true
mouseleave sidebar → body.open-sidebar-folded = false
```

### 5.4 Ativação de rota
```
NavigationEnd
  └─ _activateMenuDropdown()
       ├─ encontra link por pathname
       ├─ aplica mm-active
       └─ expande mm-show em pais
```

---

## 6. Ausências ou Ambiguidades

- Dependência de `currentUser.perfil.codigo` como objeto; em outras partes do frontend o perfil pode ser string — potencial inconsistência.
- Filtragem é apenas visual; acesso real é decidido no backend (pode haver negação mesmo com link visível em casos futuros).
- Uso de `window.location.pathname` pode divergir se a app usar base href ou rotas auxiliares.
- Estado de `sidebar-folded`/`sidebar-open` não é persistido entre sessões.
