# Reiche Academy – Design System de Cores

Este documento serve como **referência oficial de cores** para uso em temas, CSS, componentes e identidade visual do sistema.

## 🎨 Paleta Principal

### **Dourado 01 (Primário)**
- **HEX:** `#B6915D`
- **RGB:** 182, 145, 93
- **HSB:** 35°, 49%, 71%
- **CMYK:** 25, 38, 65, 14

### **Dourado 02 (Apoio)**
- **HEX:** `#D1B689`
- **RGB:** 209, 182, 137
- **HSB:** 38°, 34%, 82%
- **CMYK:** 18, 27, 49, 5

### **Azul Grafite (Neutro Escuro)**
- **HEX:** `#242B2E`
- **RGB:** 36, 40, 46
- **HSB:** 216°, 22%, 18%
- **CMYK:** 80, 67, 55, 68

### **Branco (Neutro Claro)**
- **HEX:** `#EFEFEF`
- **RGB:** 239, 239, 239
- **HSB:** 0°, 0%, 94%
- **CMYK:** 7, 5, 6, 0

---

## 🧱 Estrutura de Uso

### **Fundo Escuro**
Utilizar:
- Dourado 01
- Branco

Ideal para **páginas de destaque**, **telas de login**, áreas premium e elementos que exigem contraste elegante.

### **Fundo Claro**
Utilizar:
- Dourado 01
- Azul Grafite

Recomendado para **dashboards**, páginas de conteúdo e telas internas onde legibilidade é prioridade.

---

## 🏷️ Tokens Sugeridos para CSS / Tailwind / SCSS

```css
:root {
  /* Primários */
  --color-gold-1: #B6915D;
  --color-gold-2: #D1B689;

  /* Neutros */
  --color-dark: #242B2E;
  --color-light: #EFEFEF;

  /* Fundos */
  --bg-dark: #0d0d0d; /* sugerido para manter coerência com o layout */
  --bg-light: #ffffff;
}
```

---

## 🧩 Recomendações de Aplicação

### Tipografia
- Em **fundos escuros**, usar **branco** ou **dourado 02**.
- Em **fundos claros**, usar **azul grafite**.

### Componentes
- **Botões primários:** dourado 01 com texto azul grafite ou branco.
- **Botões secundários:** azul grafite com texto branco.
- **Bordas e divisores:** dourado 02 ou azul grafite com baixa opacidade.

### Acessibilidade
- Garantir contraste mínimo AA:
  - Dourado 01 sobre fundo escuro → OK
  - Azul grafite sobre branco → OK
  - Branco sobre azul grafite → OK

---

## 📦 Resumo da Paleta

| Nome             | HEX       | Uso Principal |
|------------------|-----------|----------------|
| Dourado 01       | `#B6915D` | Primário, botões, destaques |
| Dourado 02       | `#D1B689` | Apoio, bordas, detalhes |
| Azul Grafite     | `#242B2E` | Textos escuros, contraste, fundos elegantes |
| Branco           | `#EFEFEF` | Fundos claros, textos em fundos escuros |

---

Este arquivo pode ser usado para instruir um agente de IA a personalizar temas, gerar CSS, converter cores para tokens e aplicar consistência no design do sistema da Reiche Academy.

