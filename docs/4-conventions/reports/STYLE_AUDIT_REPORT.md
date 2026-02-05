# Auditoria de Estilos - Reiche Academy

**Data:** 07/01/2026  
**Objetivo:** Identificar e corrigir estilos hardcoded que devem usar variáveis do sistema

---

## 🔍 Problemas Encontrados

### 1. **Estilos Inline em HTML** (24 ocorrências)

#### 📍 diagnostico-notas.component.html
- `style="width: 14px; height: 14px"` → Usar classes utilitárias
- `style="font-size: small"` → Usar `fs-sm` ou `fs-6`
- `style="font-size: x-large"` → Usar `fs-4` ou `fs-3`
- `style="font-size: 8px; font-weight: 500"` → Classes Bootstrap

#### 📍 diagnostico-evolucao.component.html
- `style="padding-top: 10px; padding-bottom: 10px"` → `py-2`
- `style="height: 450px"` → Variável SCSS
- `style="height: 5px"` → Classe `.progress-sm`
- `style="position: absolute; top: 50%..."` → Classe `.position-center`

#### 📍 empresas-form.component.html
- `style="max-height: 140px; max-width: 100%"` → Classes Bootstrap

#### 📍 empresas-list.component.html
- `style="max-height: 120px; max-width: 100%"` → Classes Bootstrap

#### 📍 rotinas-list.component.html
- `style="width: 40px"` → `w-40px`
- `style="width: 80px"` → `w-80px`
- `style="width: 120px"` → `w-120px`

---

### 2. **Cores Hardcoded em SCSS** (11 ocorrências)

| Arquivo | Cor Atual | Deve Usar |
|---------|-----------|-----------|
| usuarios-list.component.scss | `#667eea`, `#764ba2` | Variáveis do tema |
| diagnostico-notas.component.scss | `#6c757d` (3x) | `$text-muted` ou `text-muted` |
| diagnostico-evolucao.component.scss | `#ccc`, `#999` | `$gray-300`, `$gray-500` |
| empresas-form.component.scss | `#6c757d` | `$text-muted` |
| pilares-empresa-form.component.scss | `#6c757d` | `$text-muted` |
| rotinas-list.component.scss | `#dee2e6` | `$border-color` |

---

### 3. **Font-sizes Hardcoded**

| Arquivo | Problema | Solução |
|---------|----------|---------|
| diagnostico-notas.component.scss | `font-size: x-small` | `$font-size-sm` ou classe `fs-sm` |
| diagnostico-notas.component.scss | `font-size: 3rem` | `$h3-font-size` ou classe `fs-1` |
| diagnostico-evolucao.component.scss | `font-size: 4rem` | Variável customizada ou `display-1` |

---

## ✅ Ações Recomendadas

### Prioridade Alta
1. ✅ Substituir todas cores `#6c757d` por `var(--bs-text-muted)`
2. ✅ Substituir gradiente hardcoded por variável CSS
3. ✅ Remover estilos inline e usar classes Bootstrap

### Prioridade Média
4. ✅ Criar classes utilitárias para alturas comuns
5. ✅ Padronizar font-sizes usando variáveis SCSS

### Prioridade Baixa
6. ⏳ Documentar classes customizadas no guia de estilo
7. ⏳ Criar linter para prevenir novos hardcodes

---

## 📊 Benefícios da Correção

✅ **Tema Escuro:** Cores ajustam automaticamente  
✅ **Manutenção:** Mudanças centralizadas em `_variables.scss`  
✅ **Consistência:** Mesmo visual em todo sistema  
✅ **Acessibilidade:** Contraste gerenciado globalmente  
✅ **Performance:** Menor duplicação de CSS  

---

## 🎯 Classes Bootstrap Recomendadas

### Tamanhos de Fonte
- `fs-1` a `fs-6` → Headings
- `fs-sm` → Texto pequeno (15px)
- `fs-base` → Texto normal (16px)
- `fs-lg` → Texto grande (18px)

### Spacing
- `py-2` → padding vertical (0.5rem)
- `px-3` → padding horizontal (1rem)
- `mb-0` → margin-bottom zero
- `gap-2` → gap de 0.5rem

### Cores de Texto
- `text-muted` → Texto secundário
- `text-primary` → Cor primária
- `text-success` → Verde
- `text-danger` → Vermelho

### Larguras/Alturas
- `w-25`, `w-50`, `w-75`, `w-100` → Percentuais
- `w-40px`, `w-80px` → Pixels (custom no _variables.scss)

---

## 📝 Próximos Passos

1. Aplicar correções nos 6 componentes identificados
2. Testar em ambos os temas (claro/escuro)
3. Verificar responsividade
4. Criar PR com as mudanças
