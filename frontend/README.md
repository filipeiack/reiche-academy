# Frontend - Reiche Academy

Aplicação web SPA desenvolvida com Angular 18+ para o sistema Reiche Academy.

## 🚀 Tecnologias

- Angular 18+
- Angular Material
- RxJS
- TypeScript
- SCSS

## 📋 Pré-requisitos

```bash
node --version  # v20.x
npm --version   # v10.x
```

## 🔧 Instalação

```bash
# Instalar dependências
npm install
```

## 🏃 Executar

```bash
# Desenvolvimento
npm start
# ou
ng serve

# Build produção
npm run build
```

Acesse: http://localhost:4200

## 📁 Estrutura

```
src/
├── app/
│   ├── core/           # Serviços core (auth, http, etc)
│   ├── shared/         # Componentes compartilhados
│   ├── features/       # Módulos de features
│   │   ├── auth/      # Autenticação
│   │   ├── dashboard/ # Dashboard
│   │   ├── empresas/  # Gestão de empresas
│   │   ├── usuarios/  # Gestão de usuários
│   │   └── diagnosticos/ # Diagnósticos
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── assets/            # Recursos estáticos
├── environments/      # Configurações de ambiente
└── styles.scss       # Estilos globais
```

## 🎨 Template Base

O projeto utiliza o template NobleUI Angular localizado em `../templates/nobleui-angular/`.

## 🧪 Testes

```bash
# Unit tests
npm test

# E2E tests
npm run e2e
```

## 📦 Build

```bash
# Produção
npm run build

# Desenvolvimento
npm run watch
```
