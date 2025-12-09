# Página de Login Personalizada por Empresa

## 📋 Visão Geral

Sistema de login com personalização visual por empresa, permitindo que cada cliente tenha seu proprio logotipo na tela de acesso.

## ✨ Funcionalidades

### 1. **Personalização por Empresa**
- Logo customizado por empresa
- Cores primária e secundária padrão do sistema
- Fallback automático para logotipo Reiche Academy

### 2. **Modos de Acesso**
- **Modo Padrão**: Acesso a URL de Login padrão com logotipo Reiche Academy
- **Modo Empresa**: Acesso a URL de Login da empresa especifica com logotipo da empresa.

### 3. **Segurança**
- Endpoint público apenas para customização visual (logoUrl)
- Dados sensíveis protegidos por autenticação JWT
- Validação de formulários com feedback visual

## 🎨 Paleta de Cores

Usar padrão definido no sistema, com opção de tema claro e escuro.

## 🗂️ Arquivos Criados/Modificados

### Backend
```
backend/
├── prisma/
│   └── schema.prisma              # ✅ Campos: logoUrl, loginUrl
├── src/modules/empresas/
│   ├── empresas.controller.ts     # ✅ Endpoint público GET /customization/:cnpj
│   └── empresas.service.ts        # ✅ Método findByCnpj()
```

## 🎨 Personalização

### Assets Padrão
✅ **Logo Padrão na tela login**: `assets/images/logo_reiche_250x650.png`

## 🚀 Como Usar

### 1. **Usuário Final**
1. Acessa a página de login pela url.
2. **Opção A**: URL de login [padrão Reiche](http://localhost:4200/auth/login): Insere email/senha diretamente (logo Reiche Academy)
3. **Opção B**: URL de login especifica http://empresa.localhost:4200/auth/login/[empresa]
   - Sistema carrega logo atraves do campo loginUrl do cadastro da empresa (ou padrão se não existir)
   - Insere email/senha e faz login
