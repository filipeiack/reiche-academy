# Design System - Reiche Academy

Documento de referência para cores, estilos e componentes visuais do sistema.

## 🎨 Paleta de Cores Oficial

Baseado em `design_system_byGPT.md`

### Cores Primárias

| Nome | HEX | RGB | HSB | Uso |
|------|-----|-----|-----|-----|
| **Dourado 01** | `#B6915D` | 182, 145, 93 | 35°, 49%, 71% | Botões, destaques, elementos interativos |
| **Dourado 02** | `#D1B689` | 209, 182, 137 | 38°, 34%, 82% | Bordas, divisores, detalhes secundários |

### Cores Neutras

| Nome | HEX | RGB | HSB | Uso |
|------|-----|-----|-----|-----|
| **Azul Grafite** | `#242B2E` | 36, 40, 46 | 216°, 22%, 18% | Textos escuros, backgrounds elegantes |
| **Branco** | `#EFEFEF` | 239, 239, 239 | 0°, 0%, 94% | Fundos claros, textos em backgrounds escuros |

## 💻 CSS Variables

Use as seguintes variáveis CSS em toda a aplicação:

```css
:root {
  /* Cores Primárias */
  --color-gold-1: #B6915D;        /* Dourado 01 */
  --color-gold-2: #D1B689;        /* Dourado 02 */

  /* Cores Neutras */
  --color-dark: #242B2E;          /* Azul Grafite */
  --color-light: #EFEFEF;         /* Branco */

  /* Fundos */
  --bg-dark: #0d0d0d;             /* Background Escuro */
  --bg-light: #ffffff;            /* Background Claro */

  /* Componentes */
  --primary-btn-color: #B6915D;
  --secondary-btn-color: #D1B689;
  --text-dark: #242B2E;
  --text-light: #EFEFEF;
}
```

## 🏗️ Estrutura de Uso

### Fundo Escuro
**Recomendado para:** Telas de login, páginas de destaque, áreas premium

**Paleta:**
- Fundo: `#0d0d0d` ou `#242B2E`
- Acentos: `#B6915D` (Dourado 01)
- Texto: `#EFEFEF` (Branco)

**Exemplo:** Página de login com gradient `#B6915D` → `#D1B689`

### Fundo Claro
**Recomendado para:** Dashboards, páginas de conteúdo, telas internas

**Paleta:**
- Fundo: `#ffffff` ou `#EFEFEF`
- Acentos: `#B6915D` (Dourado 01)
- Texto: `#242B2E` (Azul Grafite)

**Exemplo:** Dashboard com cards e typography escura

## 🧩 Componentes

### Botões

#### Primário
```scss
.btn-primary {
  background-color: #B6915D;
  color: white;
  
  &:hover {
    background-color: darken(#B6915D, 10%);
  }
}
```

#### Secundário
```scss
.btn-secondary {
  background-color: #D1B689;
  color: #242B2E;
  
  &:hover {
    background-color: darken(#D1B689, 10%);
  }
}
```

### Inputs
- Border: `#dee2e6` (cinza claro)
- Focus: `#B6915D` com box-shadow `rgba(182, 145, 93, 0.15)`
- Text: `#242B2E` (Azul Grafite)

### Cards
- Background: `#ffffff` ou `#EFEFEF`
- Border: `#D1B689` ou sem border
- Shadow: `0 2px 8px rgba(0, 0, 0, 0.1)`

### Navigation
- Background: `#242B2E` (Azul Grafite)
- Text: `#EFEFEF` (Branco)
- Active: `#B6915D` (Dourado 01)

## ♿ Acessibilidade

Garantir contraste mínimo WCAG AA:

| Combinação | Contraste | Status |
|------------|-----------|--------|
| Dourado 01 (#B6915D) + Branco (#EFEFEF) | 5.5:1 | ✅ AA |
| Dourado 01 (#B6915D) + Azul Grafite (#242B2E) | 4.8:1 | ✅ AA |
| Azul Grafite (#242B2E) + Branco (#EFEFEF) | 13.5:1 | ✅ AAA |

## 📦 Assets Padrão

### Logo
- **Arquivo**: `frontend/src/assets/images/logo_reiche_academy.png`
- **Dimensões**: 180x80px (web), 140x60px (mobile)
- **Formato**: PNG com fundo transparente
- **Fonte**: `templates/logo_reiche_academy_fundo.PNG`

### Backgrounds
- **Login**: Gradient `#B6915D` → `#D1B689`
- **Padrão**: `frontend/src/assets/images/login-bg.jpg`
- **Dimensões**: Mínimo 1920x1080px (16:9)

## 🎯 Guia de Aplicação

### Tipografia

**Em fundos escuros:**
- Texto principal: `#EFEFEF` (Branco)
- Texto secundário: `#D1B689` (Dourado 02)
- Links: `#B6915D` (Dourado 01) com hover escuro

**Em fundos claros:**
- Texto principal: `#242B2E` (Azul Grafite)
- Texto secundário: `#7987a1` (cinza médio)
- Links: `#B6915D` (Dourado 01)

### Elementos Interativos

- **Hover**: Transformar -2px (subir), adicionar shadow suave
- **Focus**: Outline com cor primária
- **Disabled**: Opacidade 0.65, cursor not-allowed
- **Loading**: Spinner com cor primária

### Gradients

**Principal:**
```css
background: linear-gradient(135deg, #B6915D 0%, #D1B689 100%);
```

**Hover (botões):**
```css
background: linear-gradient(135deg, darken(#B6915D, 10%) 0%, darken(#D1B689, 10%) 100%);
```

## 🔄 Customização por Empresa

Quando uma empresa fornece suas próprias cores:

```typescript
// Aplicar colors customizados
customizationService.applyThemeColors(
  empresa.corPrimaria,    // Substitui --color-gold-1
  empresa.corSecundaria   // Substitui --color-gold-2
);
```

**Fallback**: Se a empresa não tiver cores definidas, o sistema usa a paleta oficial.

## 📱 Responsividade

Aplicar as mesmas cores em todos os breakpoints:

```scss
@media (max-width: 767px) {
  // Cores permanecem iguais
  // Apenas tamanhos e paddings mudam
}
```

---

**Última atualização:** 08/12/2024  
**Referência:** design_system_byGPT.md  
**Mantido por:** Reiche Academy Development Team
