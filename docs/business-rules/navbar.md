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

### 3.6 Regras Propostas (aguardando implementação)

#### R-NAV-011: Borda primária no ng-select da navbar

**Contexto**
Navbar do frontend quando o seletor de empresa (ng-select) é exibido.

**Descrição**
O seletor de empresa na navbar deve ter borda com a cor primária do tema, reforçando o estado interativo e alinhando com a identidade visual.

**Condição**
Quando o `ng-select` de empresa estiver presente na navbar (perfil ADMINISTRADOR).

**Comportamento Esperado**
- O campo `ng-select` na navbar deve exibir borda na cor primária.
- A mudança é exclusivamente visual (sem impacto em lógica, dados ou permissões).

**Cenários**

**Happy Path**
- Admin acessa a aplicação e vê o `ng-select` de empresa com borda na cor primária.

**Casos de Erro**
- Se o seletor não estiver presente, nenhuma alteração visual é aplicada.

**Restrições**
- Não altera comportamento de seleção, valores ou validações.
- Não deve introduzir estilos globais conflitantes com outros `ng-select` fora da navbar.

**Impacto Técnico Estimado**
- Frontend: ajustes de estilo no componente da navbar (HTML/SCSS), aplicando classe ou estilo específico ao `ng-select`.

---

#### R-NAV-012: Admin deve ver dados da empresa selecionada na navbar

**Contexto**
Navbar do frontend quando o perfil é ADMINISTRADOR e existe seleção de empresa no combo.

**Descrição**
Ao selecionar uma empresa no combo da navbar, o ADMINISTRADOR deve visualizar ao lado do combo os mesmos dados exibidos para perfis cliente.

**Condição**
Quando o usuário possui perfil ADMINISTRADOR e seleciona uma empresa no `ng-select` da navbar.

**Comportamento Esperado**
- Exibir, ao lado do combo, os mesmos dados de empresa apresentados no perfil cliente da navbar.
- Campos exibidos:
  - Nome da empresa
  - CNPJ (com máscara)
  - Localização (cidade/estado), quando disponível
  - Período de mentoria (status do período ativo, com intervalo de datas quando disponível)
- Se a seleção for limpa, o bloco de dados deve ser ocultado.

**Cenários**

**Happy Path**
- Admin seleciona uma empresa no combo.
- O bloco lateral exibe nome, CNPJ e localização, seguindo o mesmo formato do perfil cliente.

**Casos de Erro**
- Se a empresa selecionada não possuir CNPJ ou localização, apenas os campos disponíveis são exibidos.
- Se não houver período de mentoria ativo, exibir status equivalente a "Sem mentoria".
- Se não houver empresa selecionada, não exibir o bloco de dados.

**Restrições**
- Apenas ADMINISTRADOR visualiza o combo e o bloco de dados associado.
- Não altera permissões de acesso, apenas exibe informações já acessíveis ao ADMIN.
- O status do período de mentoria deve seguir o padrão já definido para exibição de período ativo/inexistente.

**Impacto Técnico Estimado**
- Frontend: navbar component (template e lógica de exibição) para compor o bloco de dados ao lado do combo.
- Dependência de dados da empresa selecionada (lista carregada pelo contexto global).
- Dependência de dados do período de mentoria ativo da empresa (se disponível).

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
- As regras propostas R-NAV-011 e R-NAV-012 aguardam implementação.
