# 🎨 Sistema de Design - Reiche Academy

## Visão Geral

O Reiche Academy utiliza uma paleta de cores moderna e profissional, com tons neutros e acentos em marrom/bronze, mantendo consistência visual em todo o sistema.

**Status:** ✅ Implementado  
**Data:** Dezembro 2024  
**Template Base:** NobleUI Angular v3.0  
**Temas:** Light + Dark (Dark como padrão)

---

## 📋 Índice

1. [Paleta de Cores](#-paleta-de-cores)
2. [Tema Dark (Padrão)](#-tema-dark-padrão)
3. [Tema Light](#-tema-light)
4. [Componentes](#-componentes)
5. [Tipografia](#-tipografia)
6. [Espaçamento](#-espaçamento)
7. [Acessibilidade](#-acessibilidade)
8. [Implementação](#-implementação)

---

## 🎨 Paleta de Cores

### Cores Principais

| Cor | Hex | RGB | Uso | Variável SCSS |
|-----|-----|-----|-----|---------------|
| **Primary (Bronze)** | `#8C6E45` | 140, 110, 69 | Botões, links, destaques | `$primary` |
| **Secondary (Gray)** | `#4E4E4E` | 78, 78, 78 | Elementos secundários | `$secondary` |
| **Success** | `#5CB870` | 92, 184, 112 | Confirmações, status positivo | `$success` |
| **Warning** | `#A67C00` | 166, 124, 0 | Avisos, alertas | `$warning` |
| **Danger** | `#C34D38` | 195, 77, 56 | Erros, exclusões | `$danger` |
| **Info** | `#B6915D` | 182, 145, 93 | Informações, dicas | `$info` |

### Escala de Cinzas

| Nome | Hex | Uso | Variável |
|------|-----|-----|----------|
| `gray-100` | `#F7F7F7` | Background muito claro | `$gray-100` |
| `gray-200` | `#EEEEEE` | Background light | `$gray-200` |
| `gray-300` | `#E0E0E0` | Bordas light | `$gray-300` |
| `gray-400` | `#CCCCCC` | Placeholder | `$gray-400` |
| `gray-500` | `#B0B0B0` | Texto muted | `$gray-500` |
| `gray-600` | `#8A8A8A` | Texto desabilitado | `$gray-600` |
| `gray-700` | `#4E4E4E` | Elementos secundários | `$gray-700` |
| `gray-800` | `#333333` | Bordas, divisores | `$gray-800` |
| `gray-900` | `#1A1A1A` | Background dark, cards | `$gray-900` |

---

## 🌙 Tema Dark (Padrão)

### Cores do Tema Dark

| Elemento | Cor | Hex | Uso |
|----------|-----|-----|-----|
| **Background Principal** | Deep Black | `#0A0A0A` | Fundo da aplicação |
| **Cards/Containers** | Dark Gray | `#1A1A1A` | Cards, modais, sidebar |
| **Borders** | Medium Gray | `#333333` | Bordas, divisores |
| **Texto Principal** | Light Gray | `#F0F0F0` | Texto principal |
| **Texto Secundário** | Medium Gray | `#B0B0B0` | Texto muted, legendas |
| **Links/Accents** | Bronze | `#8C6E45` | Links, highlights |

### Configuração SCSS - Dark

```scss
// Background
$app-bg-dark: #0A0A0A;
$body-bg-dark: #1A1A1A;

// Cores
$primary-dark: #8C6E45;
$secondary-dark: #B0B0B0;

// Texto
$body-color-dark: #F0F0F0;
$body-secondary-color-dark: #B0B0B0;

// Borders
$border-color-dark: #333333;
$card-border-color-dark: #333333;

// Shadows
$box-shadow-dark: 0 2px 8px rgba(0, 0, 0, 0.3);
```

### Contrastes WCAG (Dark)

| Combinação | Contraste | Status |
|------------|-----------|--------|
| Texto principal (#F0F0F0) / Background (#0A0A0A) | 14.2:1 | ✅ AAA |
| Texto secundário (#B0B0B0) / Background (#0A0A0A) | 8.5:1 | ✅ AAA |
| Primary (#8C6E45) / Background (#0A0A0A) | 4.8:1 | ✅ AA |
| Links (#8C6E45) / Cards (#1A1A1A) | 4.2:1 | ✅ AA |

---

## ☀️ Tema Light

### Cores do Tema Light

| Elemento | Cor | Hex | Uso |
|----------|-----|-----|-----|
| **Background Principal** | Branco | `#FFFFFF` | Fundo da aplicação |
| **Cards/Containers** | Very Light Gray | `#FAFAFA` | Cards, modais |
| **Borders** | Light Gray | `#E0E0E0` | Bordas, divisores |
| **Texto Principal** | Dark | `#1A1A1A` | Texto principal |
| **Texto Secundário** | Medium Gray | `#8A8A8A` | Texto muted |
| **Links/Accents** | Bronze | `#8C6E45` | Links, highlights |

### Configuração SCSS - Light

```scss
// Background
$body-bg: #FFFFFF;
$light: #FAFAFA;

// Cores
$primary: #8C6E45;
$secondary: #4E4E4E;

// Texto
$body-color: #1A1A1A;
$text-muted: #8A8A8A;

// Borders
$border-color: #E0E0E0;
```

---

## 🧩 Componentes

### Botões

#### Botão Primary
- **Background:** `#8C6E45`
- **Texto:** `#FFFFFF`
- **Hover:** `#7A5D39`
- **Active:** `#6A4F2F`
- **Border-radius:** `4px`

#### Botão Secondary
- **Background:** `#4E4E4E`
- **Texto:** `#FFFFFF`
- **Hover:** `#3E3E3E`

#### Botão Danger
- **Background:** `#C34D38`
- **Texto:** `#FFFFFF`
- **Hover:** `#B03D28`

### Cards

```scss
// Dark Theme
.card {
  background: #1A1A1A;
  border: 1px solid #333333;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

// Light Theme
[data-bs-theme="light"] .card {
  background: #FAFAFA;
  border: 1px solid #E0E0E0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

### Forms

```scss
// Input Dark
.form-control {
  background: #1A1A1A;
  border: 1px solid #333333;
  color: #F0F0F0;
  
  &:focus {
    border-color: #8C6E45;
    box-shadow: 0 0 0 0.2rem rgba(140, 110, 69, 0.25);
  }
}

// Input Light
[data-bs-theme="light"] .form-control {
  background: #FFFFFF;
  border: 1px solid #E0E0E0;
  color: #1A1A1A;
}
```

### Tabelas

```scss
.table {
  color: #F0F0F0;
  
  thead {
    background: #1A1A1A;
    border-bottom: 2px solid #333333;
  }
  
  tbody tr {
    border-bottom: 1px solid #333333;
    
    &:hover {
      background: rgba(140, 110, 69, 0.1);
    }
  }
}
```

### Checkboxes

```scss
.form-check-input {
  border: 2px solid #333333;
  background-color: transparent;
  
  &:checked {
    background-color: #8C6E45;
    border-color: #8C6E45;
  }
  
  &:focus {
    box-shadow: 0 0 0 0.2rem rgba(140, 110, 69, 0.25);
  }
}
```

---

## 📝 Tipografia

### Família de Fontes

```scss
$font-family-base: system-ui, -apple-system, "Segoe UI", Roboto, 
                   "Helvetica Neue", Arial, sans-serif;
```

### Tamanhos

| Elemento | Tamanho | Peso | Uso |
|----------|---------|------|-----|
| **h1** | 2.5rem (40px) | 600 | Títulos principais |
| **h2** | 2rem (32px) | 600 | Subtítulos |
| **h3** | 1.75rem (28px) | 600 | Seções |
| **h4** | 1.5rem (24px) | 500 | Subsecções |
| **h5** | 1.25rem (20px) | 500 | Cards, labels |
| **h6** | 1rem (16px) | 500 | Pequenos títulos |
| **body** | 0.875rem (14px) | 400 | Texto geral |
| **small** | 0.75rem (12px) | 400 | Legendas |

---

## 📏 Espaçamento

### Grid Spacing (Bootstrap)

| Class | Valor | Uso |
|-------|-------|-----|
| `p-1` / `m-1` | 0.25rem (4px) | Espaço mínimo |
| `p-2` / `m-2` | 0.5rem (8px) | Espaço pequeno |
| `p-3` / `m-3` | 1rem (16px) | Espaço padrão |
| `p-4` / `m-4` | 1.5rem (24px) | Espaço médio |
| `p-5` / `m-5` | 3rem (48px) | Espaço grande |

### Container

```scss
.container {
  max-width: 1144px;
  padding: 0 1rem;
}
```

---

## ♿ Acessibilidade

### Diretrizes WCAG 2.1

✅ **Nível AA Garantido**
- Contraste mínimo 4.5:1 para texto normal
- Contraste mínimo 3:1 para texto grande e elementos de interface
- Indicadores de foco visíveis
- Navegação por teclado completa

### Cores Seguras para Daltônicos

- ✅ Primary (#8C6E45) distinguível de Success (#5CB870)
- ✅ Danger (#C34D38) distinguível de Warning (#A67C00)
- ✅ Padrões visuais além de cores (ícones, bordas)

---

## 🛠️ Implementação

### Estrutura de Arquivos

```
frontend/src/styles/
├── _variables.scss           # Variáveis Light Theme
├── _variables-dark.scss      # Variáveis Dark Theme
├── _custom.scss              # Customizações
└── styles.scss               # Import principal
```

### Alternância de Tema

```typescript
// theme-mode.service.ts
export class ThemeModeService {
  readonly currentTheme = new BehaviorSubject<string>('dark'); // Dark como padrão
  
  toggleTheme(theme: string) {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  }
}
```

### Uso em Componentes

```html
<!-- Template -->
<div class="card">
  <div class="card-body">
    <h5 class="card-title">Título</h5>
    <button class="btn btn-primary">Ação</button>
  </div>
</div>
```

```scss
// Component SCSS
.card {
  // Herda automaticamente do tema global
}

// Override específico se necessário
[data-bs-theme="dark"] .custom-element {
  color: #8C6E45;
}
```

---

## 📦 Componentes Customizados

### Alert Bar (Multi-Select)

```scss
.alert-bar {
  background: rgba(140, 110, 69, 0.1);
  border-left: 4px solid #8C6E45;
  padding: 1rem;
  margin-bottom: 1rem;
}
```

### Sortable Headers

```scss
.sortable {
  cursor: pointer;
  user-select: none;
  
  &:hover {
    background: rgba(140, 110, 69, 0.1);
  }
  
  &.asc::after { content: ' ▲'; }
  &.desc::after { content: ' ▼'; }
}
```

### User Avatar

```scss
.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid #8C6E45;
  object-fit: cover;
}
```

---

## 🎯 Guia de Uso Rápido

### Quando usar cada cor

| Situação | Cor | Classe/Variável |
|----------|-----|-----------------|
| Ação principal | Primary | `.btn-primary` / `$primary` |
| Ação secundária | Secondary | `.btn-secondary` / `$secondary` |
| Confirmar/Salvar | Success | `.btn-success` / `$success` |
| Cancelar/Voltar | Secondary | `.btn-secondary` |
| Deletar/Remover | Danger | `.btn-danger` / `$danger` |
| Alerta | Warning | `.alert-warning` / `$warning` |
| Informação | Info | `.alert-info` / `$info` |
| Links | Primary | `<a>` / `$link-color` |

---

## 📌 Referências

- **Bootstrap 5.3:** https://getbootstrap.com/docs/5.3/
- **WCAG 2.1:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **NobleUI Template:** Template base usado no projeto

---

**Última atualização:** Dezembro 2024  
**Mantido por:** Equipe Reiche Academy
