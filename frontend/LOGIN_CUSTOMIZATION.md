# Página de Login Personalizada por Empresa

## 📋 Visão Geral

Sistema de login com personalização visual por empresa, permitindo que cada cliente tenha sua própria identidade visual na tela de acesso. Utiliza a paleta de cores oficial do Design System Reiche Academy.

## ✨ Funcionalidades

### 1. **Personalização por Empresa**
- Logo customizado por empresa
- Imagem de fundo personalizada
- Cores primária e secundária (Dourado 01 e Dourado 02)
- Fallback automático para identidade visual Reiche Academy

### 2. **Modos de Acesso**
- **Modo Padrão**: Login direto com email/senha (usa visual Reiche Academy)
- **Modo Empresa**: Login com CNPJ para carregar personalização específica

### 3. **Segurança**
- Endpoint público apenas para customização visual (logoUrl, backgroundUrl, cores)
- Dados sensíveis protegidos por autenticação JWT
- Validação de formulários com feedback visual

## 🎨 Paleta de Cores

Baseada em `design_system_byGPT.md`:

| Elemento | Cor | HEX | RGB | Uso |
|----------|-----|-----|-----|-----|
| Primária | Dourado 01 | `#B6915D` | 182, 145, 93 | Botões, destaques |
| Secundária | Dourado 02 | `#D1B689` | 209, 182, 137 | Bordas, detalhes |
| Neutro Escuro | Azul Grafite | `#242B2E` | 36, 40, 46 | Textos, backgrounds |
| Neutro Claro | Branco | `#EFEFEF` | 239, 239, 239 | Fundos claros |

## 🗂️ Arquivos Criados/Modificados

### Backend
```
backend/
├── prisma/
│   └── schema.prisma              # ✅ Campos: logoUrl, backgroundUrl, corPrimaria, corSecundaria
├── src/modules/empresas/
│   ├── empresas.controller.ts     # ✅ Endpoint público GET /customization/:cnpj
│   └── empresas.service.ts        # ✅ Método findByCnpj()
```

### Frontend
```
frontend/src/app/
├── core/
│   ├── models/
│   │   ├── empresa.model.ts       # ✅ Interfaces Empresa e EmpresaCustomization
│   │   └── auth.model.ts          # ✅ Interfaces LoginRequest, LoginResponse, Usuario
│   └── services/
│       ├── auth.service.ts        # ✅ Serviço de autenticação com JWT
│       └── customization.service.ts # ✅ Serviço de personalização visual (cores oficiais)
└── features/auth/login/
    ├── login.component.ts         # ✅ Lógica de login com personalização
    ├── login.component.html       # ✅ Template baseado em NobleUI
    └── login.component.scss       # ✅ Estilos com paleta oficial (#B6915D, #D1B689)

frontend/src/assets/images/
├── logo_reiche_academy.png        # ✅ Logo padrão (copiado de templates/)
└── login-bg.jpg                   # ⚠️ A criar (background padrão)
```

## 🔌 Endpoints da API

### Público (sem autenticação)
```http
GET /api/empresas/customization/:cnpj
```
**Resposta:**
```json
{
  "id": "uuid",
  "nome": "Nome da Empresa",
  "razaoSocial": "Razão Social",
  "logoUrl": "https://...",
  "backgroundUrl": "https://...",
  "corPrimaria": "#B6915D",
  "corSecundaria": "#D1B689"
}
```

### Autenticado
```http
POST /api/auth/login
```
**Request:**
```json
{
  "email": "usuario@empresa.com",
  "senha": "senha123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "usuario": {
    "id": "uuid",
    "email": "usuario@empresa.com",
    "nome": "Nome do Usuário",
    "tipo": "CONSULTOR",
    "empresaId": "uuid"
  }
}
```

## 🎨 Personalização

### Assets Padrão
✅ **Logo**: `frontend/src/assets/images/logo_reiche_academy.png` (já copiado de `templates/logo_reiche_academy_fundo.PNG`)

⚠️ **Background Padrão**: Crie em `frontend/src/assets/images/login-bg.jpg` (mínimo 1920x1080px)

### Cores CSS Variables
```css
:root {
  --color-gold-1: #B6915D;        /* Dourado 01 - Primário */
  --color-gold-2: #D1B689;        /* Dourado 02 - Apoio */
  --color-dark: #242B2E;          /* Azul Grafite */
  --color-light: #EFEFEF;         /* Branco */
}
```

## 🚀 Como Usar

### 1. **Usuário Final**
1. Acessa a página de login
2. **Opção A**: Insere email/senha diretamente (visual padrão Reiche Academy)
3. **Opção B**: Clica em "Acessar com CNPJ específico"
   - Digite o CNPJ da empresa
   - Sistema carrega logo e cores personalizados (ou padrão se não existir)
   - Insere email/senha e faz login

### 2. **Administrador configurando empresa**
```typescript
// Atualizar empresa com customização
PATCH /api/empresas/:id
{
  "logoUrl": "https://cdn.empresa.com/logo.png",
  "backgroundUrl": "https://cdn.empresa.com/background.jpg",
  "corPrimaria": "#FF6B6B",
  "corSecundaria": "#4ECDC4"
}
```

## 🔧 Configuração

### 1. Aplicar Migration ✅
```bash
cd backend
npx prisma migrate dev --name add_empresa_customization
# ✅ Já aplicada
```

### 2. Criar Background Padrão ⚠️
Coloque um arquivo em: `frontend/src/assets/images/login-bg.jpg`
- Dimensões: 1920x1080px (16:9 aspect ratio)
- Recomendação: Usar gradient ou imagem sutil

### 3. Testar
```bash
# Backend (já rodando)
cd backend
npm run dev

# Frontend
cd frontend
ng serve
```

Acesse: http://localhost:4200/auth/login

## 📱 Responsividade

- ✅ Desktop (1920x1080+)
- ✅ Laptop (1366x768)
- ✅ Tablet (768x1024)
- ✅ Mobile (375x667)

## 🔐 Segurança

1. **Endpoint Público Limitado**: Apenas dados visuais expostos
2. **JWT Authentication**: Tokens com expiração (15min + refresh 7d)
3. **Validação de Formulários**: Client-side e server-side
4. **CORS Configurado**: Apenas origens permitidas
5. **LGPD Compliant**: Logs de auditoria implementados

## 🎯 Próximos Passos

- [ ] Criar `login-bg.jpg` padrão
- [ ] Upload de logo via interface admin
- [ ] Preview de customização antes de salvar
- [ ] Temas claro/escuro por empresa
- [ ] Mensagens personalizadas de boas-vindas
- [ ] Multi-idioma por empresa

## 📝 Credenciais de Teste

```
Email: admin@reiche.com
Senha: 123456
CNPJ: 00000000000000 (Empresa Demo)
```

## 📚 Referências

- **Design System**: `DESIGN_SYSTEM_COLORS.md`
- **Paleta Original**: `design_system_byGPT.md`
- **Logo Padrão**: `templates/logo_reiche_academy_fundo.PNG`
- **Context**: `CONTEXT.md` (Seção "Personalização por Empresa")

---

**Documentado em:** 08/12/2024  
**Autor:** Reiche Academy Development Team  
**Cores:** Baseadas em design_system_byGPT.md

