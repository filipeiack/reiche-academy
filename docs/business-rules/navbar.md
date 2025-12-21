# Regras de Negócio — Frontend Navbar

**Data de extração**: 2025-12-21  
**Escopo**: Componente de topo (navbar) e integrações relacionadas

---

## 1. Visão Geral

A Navbar implementa:
- Alternância de tema (dark/light) com persistência via serviço
- Troca de idioma e exibição do idioma atual
- Exibição de usuário atual, perfil e empresa (quando disponíveis)
- Abertura do sidebar em telas móveis
- Logout com redirecionamento condicional (customizado por empresa)

---

## 2. Entidades

### 2.1 Estado de UI (interno)
- `currentTheme: 'dark' | 'light'` — tema ativo
- `languages: LanguageOption[]` e `currentLanguage` — idiomas disponíveis e selecionado
- `currentUser: Usuario | null` — usuário autenticado

### 2.2 Serviços Consumidos
- `ThemeModeService` — alterna tema e emite tema atual
- `TranslateService` — lista de idiomas e idioma atual
- `AuthService` — usuário atual, logout
- `EmpresasService` — busca empresa por `empresaId` para obter `loginUrl`

---

## 3. Regras Implementadas

### 3.1 Alternância de Tema

**R-NAV-001**: Exibição do tema ativo
- Assina `ThemeModeService.currentTheme` para atualizar `currentTheme`
- Atualiza DOM: checkbox `#theme-switcher` e classe em `.box` (`dark`/`light`)

**R-NAV-002**: Troca de tema
- Evento no checkbox chama `ThemeModeService.toggleTheme(newTheme)`
- Atualiza DOM imediatamente após alternar

### 3.2 Idiomas

**R-NAV-003**: Inicialização de idiomas
- Carrega `languages` de `TranslateService.languages`
- Assina `currentLang$` para refletir o idioma ativo

**R-NAV-004**: Troca de idioma
- Chama `TranslateService.use(lang.code)` ao selecionar idioma

### 3.3 Ações sobre Sidebar

**R-NAV-005**: Abrir sidebar (mobile)
- `toggleSidebar()` adiciona `sidebar-open` ao `<body>`
- Marca `.sidebar .sidebar-toggler` com classe `active`

### 3.4 Logout e Redirecionamento

**R-NAV-006**: Logout de usuário sem empresa
- Se `!currentUser?.empresaId`: chama `AuthService.logout()` e navega para `/auth/login`

**R-NAV-007**: Logout com empresa vinculada
- Busca empresa: `EmpresasService.getById(currentUser.empresaId)`
- Em `next`: chama `logout()` e, se `empresa.loginUrl` existir, navega para `/${empresa.loginUrl}`; caso contrário, para `/auth/login`
- Em `error`: chama `logout()` e navega para `/auth/login`

### 3.5 Exibição de Perfil/Empresa

**R-NAV-008**: Perfil do usuário
- `getPerfilNome()` retorna `perfil.nome` quando `perfil` é objeto; caso contrário, `null`

**R-NAV-009**: Empresa do usuário
- `getEmpresaNome()` retorna `empresa.nome` quando `empresa` é objeto; caso contrário, `null`

**R-NAV-010**: Detecção de perfis "cliente"
- `isPerfilCliente()` retorna `true` se `perfil.codigo` ∈ {GESTOR, COLABORADOR, LEITURA}  
- Usado para lógica condicional de UI (ex.: rótulos e navegação)

---

## 4. Validações

- Sem validações de formulário na Navbar; interage apenas com serviços e DOM.
- Verificações defensivas: existência de `#theme-switcher`, `.box`, e dados de `currentUser`.

---

## 5. Comportamentos Condicionais

### 5.1 Troca de Tema
```
#theme-switcher change
  ├─ checked? → newTheme = 'dark' : 'light'
  ├─ ThemeModeService.toggleTheme(newTheme)
  └─ Atualiza classes em .box e estado do checkbox
```

### 5.2 Troca de Idioma
```
select idioma
  └─ TranslateService.use(code)
```

### 5.3 Logout
```
click logout
  ├─ currentUser.empresaId?
  │  ├─ Sim → EmpresasService.getById → logout →
  │  │    empresa.loginUrl? → navigate('/{loginUrl}') : navigate('/auth/login')
  │  └─ Não → logout → navigate('/auth/login')
  └─ Falha ao obter empresa → logout → navigate('/auth/login')
```

### 5.4 Abrir Sidebar (mobile)
```
click hamburger
  ├─ body.classList.add('sidebar-open')
  └─ .sidebar .sidebar-toggler.classList.add('active')
```

---

## 6. Ausências ou Ambiguidades

- Representação de `perfil` pode ser objeto ou string; métodos assumem objeto para nome/código.
- Manipulação direta de DOM (`document.querySelector`) pode falhar em ambientes sem DOM ou SSR.
- Não há persistência do tema no localStorage neste componente (delegado ao serviço).
- Redirecionamento por `loginUrl` assume rota registrada na app; ausência pode levar a página não encontrada.
