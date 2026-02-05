# Guia de Migração: Estilos Hardcoded → Sistema de Design

## 📋 Visão Geral

Este guia documenta como migrar estilos inline e cores hardcoded para o sistema de design centralizado do Reiche Academy.

---

## 🎨 Cores

### ❌ Antes (Hardcoded)
```scss
.my-class {
  color: #6c757d;
  background: #f8f9fa;
  border-color: #dee2e6;
}
```

### ✅ Depois (Variáveis CSS)
```scss
.my-class {
  color: var(--bs-text-muted);
  background: var(--bs-body-bg);
  border-color: var(--bs-border-color);
}
```

### Variáveis Disponíveis
| Uso | Variável CSS | Tema Claro | Tema Escuro |
|-----|--------------|------------|-------------|
| Texto principal | `var(--bs-body-color)` | #000000 | #FFFFFF |
| Texto secundário | `var(--bs-text-muted)` | #757575 | #BDBDBD |
| Fundo principal | `var(--bs-body-bg)` | #FFFFFF | #1E1E1E |
| Fundo secundário | `var(--bs-app-bg)` | #f9fafb | #121212 |
| Bordas | `var(--bs-border-color)` | #EEEEEE | #3A3A3A |
| Primary | `var(--bs-primary)` | #8C6E45 | #B6915D |
| Links | `var(--bs-link-color)` | #8C6E45 | #D4AF6A |
| Cinzas | `var(--bs-gray-300)` a `var(--bs-gray-900)` | - | - |

---

## 📏 Tamanhos de Fonte

### ❌ Antes (Hardcoded)
```html
<p style="font-size: 14px">Texto</p>
<span style="font-size: small">Pequeno</span>
```

```scss
.my-class {
  font-size: 0.875rem;
  font-size: x-small;
}
```

### ✅ Depois (Classes Bootstrap)
```html
<p class="fs-base">Texto</p>
<span class="fs-sm">Pequeno</span>
```

```scss
.my-class {
  font-size: var(--bs-font-size-base);
  font-size: var(--bs-font-size-sm);
}
```

### Classes Disponíveis
| Classe | Tamanho | Uso |
|--------|---------|-----|
| `fs-1` | 2.5rem (40px) | Display/Hero |
| `fs-2` | 2rem (32px) | Título H1 |
| `fs-3` | 1.5rem (24px) | Título H2 |
| `fs-4` | 1.25rem (20px) | Título H3 |
| `fs-5` | 1rem (16px) | Título H4 |
| `fs-6` | 1rem (16px) | Título H5/H6 |
| `fs-lg` | 1.125rem (18px) | Texto grande |
| `fs-base` | 1rem (16px) | Texto normal |
| `fs-sm` | 0.9375rem (15px) | Texto pequeno |

---

## 📐 Espaçamento

### ❌ Antes (Inline)
```html
<div style="padding-top: 10px; padding-bottom: 10px;">
<div style="margin-bottom: 1rem;">
```

### ✅ Depois (Classes Bootstrap)
```html
<div class="py-2">
<div class="mb-3">
```

### Classes de Spacing
| Classe | Valor | Pixels (aprox) |
|--------|-------|----------------|
| `p-0`, `m-0` | 0 | 0px |
| `p-1`, `m-1` | 0.25rem | 4px |
| `p-2`, `m-2` | 0.5rem | 8px |
| `p-3`, `m-3` | 1rem | 16px |
| `p-4`, `m-4` | 1.5rem | 24px |
| `p-5`, `m-5` | 3rem | 48px |

**Direções:**
- `p` / `m` = todas direções
- `pt` / `mt` = top
- `pb` / `mb` = bottom
- `ps` / `ms` = start (left)
- `pe` / `me` = end (right)
- `px` / `mx` = horizontal
- `py` / `my` = vertical

---

## 📏 Larguras e Alturas

### ❌ Antes (Inline)
```html
<div style="width: 120px; height: 450px;">
<img style="max-width: 100%; max-height: 120px;">
```

### ✅ Depois (Classes)
```html
<div class="w-120px h-450px">
<img class="mw-100 mh-120px">
```

### Classes Customizadas Disponíveis
```scss
// Pixels fixos (definidos em _variables.scss)
w-40px, w-80px, w-120px, w-140px, w-200px, w-450px

// Percentuais
w-25, w-50, w-75, w-100

// Alturas
h-5px, h-10px, h-40px, h-120px, h-450px
h-25, h-50, h-75, h-100
```

---

## 🎯 Ícones

### ❌ Antes (Inline)
```html
<i class="feather icon-check" style="width: 14px; height: 14px; font-size: 14px"></i>
<i class="feather icon-edit" style="font-size: small"></i>
<i class="feather icon-more" style="font-size: x-large"></i>
```

### ✅ Depois (Classes Helper)
```html
<i class="feather icon-check icon-sm"></i>
<i class="feather icon-edit icon-sm"></i>
<i class="feather icon-more icon-xl"></i>
```

### Classes de Ícones
| Classe | Tamanho |
|--------|---------|
| `icon-xs` | 12px |
| `icon-sm` | 14px |
| `icon-md` | 16px |
| `icon-lg` | 20px |
| `icon-xl` | 26px |
| `icon-xxl` | 40px |

---

## 🎨 Classes Utilitárias Adicionadas

### Progress Bar
```html
<!-- Antes -->
<div class="progress" style="height: 5px"></div>

<!-- Depois -->
<div class="progress progress-sm"></div>
```

| Classe | Altura |
|--------|--------|
| `progress-sm` | 5px |
| `progress-md` | 10px |
| `progress-lg` | 20px |

### Posicionamento
```html
<!-- Antes -->
<div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">

<!-- Depois -->
<div class="position-center">
```

### Cursor
```html
<!-- Antes -->
<div style="cursor: grab">

<!-- Depois -->
<div class="cursor-grab">
```

---

## 🔄 Checklist de Migração

Ao criar ou editar componentes:

- [ ] Verifique se há atributos `style=""` no HTML
- [ ] Substitua por classes Bootstrap quando possível
- [ ] Use variáveis CSS (`var(--bs-*)`) em arquivos SCSS
- [ ] Nunca use cores hexadecimais (#xxx) diretas
- [ ] Prefira classes utilitárias a SCSS customizado
- [ ] Teste em tema claro E escuro
- [ ] Verifique responsividade

---

## 📚 Referências

- [Bootstrap Utilities](https://getbootstrap.com/docs/5.3/utilities/api/)
- [Variables.scss](../../frontend/src/styles/_variables.scss)
- [Helpers.scss](../../frontend/src/styles/_helpers.scss)
- [Utilities.scss](../../frontend/src/styles/_utilities.scss)

---

## 🚀 Benefícios

✅ **Consistência:** Mesmo visual em todo sistema  
✅ **Tema escuro:** Cores ajustam automaticamente  
✅ **Manutenção:** Mudanças centralizadas  
✅ **Performance:** Menos CSS duplicado  
✅ **Acessibilidade:** Contraste gerenciado  
✅ **Legibilidade:** Código mais limpo  

---

**Última atualização:** 07/01/2026
