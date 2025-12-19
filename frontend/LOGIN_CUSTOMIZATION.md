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
```

## 🎨 Personalização

### Assets Padrão
✅ **Logo Padrão na tela login**: `assets/images/logo_reiche_academy.png`

## 🚀 Como Usar

### 1. **Usuário Final**
1. Acessa a página de login pela url.
2. **Opção A**: URL de acesso padrão [padrão Reiche] (http://localhost:4200): 
   - redireciona para login http://localhost:4200/auth/login 
   - Insere email/senha diretamente (logo Reiche Academy)
3. **Opção B**: URL de login especifica http://localhost:4200/[empresa]
   - Sistema identifica empresa pelo nome comparando com campo loginURL da empresa.
   - Redireciona para o login exibindo a logotipo da empresa (logoURL) no lugar do logo da Reiche.
   - Fallback: Se não encontrar o nome da empresa digitado, redireciona para o padrão de login.
   - Insere email/senha e faz login normal no sistema.
