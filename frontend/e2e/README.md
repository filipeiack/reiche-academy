# Testes E2E com Playwright - CRUD de Usuários

## 📋 Sobre os Testes

Este conjunto de testes E2E (End-to-End) foi criado com Playwright para validar completamente o fluxo de CRUD (Create, Read, Update, Delete) de usuários no sistema Reiche Academy.

## 🧪 Cobertura de Testes

### Cenários Implementados:

1. ✅ **Criar Usuário** - Valida criação de novo usuário com todos os campos
2. ✅ **Visualizar Usuário** - Verifica se usuário criado aparece na lista com dados corretos
3. ✅ **Editar Usuário** - Testa atualização de dados (nome, cargo, perfil)
4. ✅ **Upload de Avatar** - Valida funcionalidade de upload de foto de perfil
5. ✅ **Inativar Usuário** - Testa inativação com confirmação via SweetAlert
6. ✅ **Ativar Usuário** - Testa reativação de usuário inativo
7. ✅ **Deletar Usuário** - Valida exclusão permanente com confirmação
8. ✅ **Validações de Formulário** - Campos obrigatórios e regras de negócio
9. ✅ **Validação de Email** - Formato correto de email
10. ✅ **Busca na Lista** - Funcionalidade de filtro/pesquisa

## 🚀 Instalação

```bash
# Instalar dependências
cd frontend
npm install

# Instalar browsers do Playwright
npx playwright install
```

## 🎯 Como Executar

### Modo Headless (padrão - CI/CD)
```bash
npm run test:e2e
```

### Modo UI (interface interativa)
```bash
npm run test:e2e:ui
```

### Modo Headed (ver browser executando)
```bash
npm run test:e2e:headed
```

### Modo Debug (passo a passo)
```bash
npm run test:e2e:debug
```

## 📁 Estrutura de Arquivos

```
frontend/
├── playwright.config.ts          # Configuração do Playwright
├── e2e/
│   ├── usuarios.spec.ts         # Testes do CRUD de usuários
│   └── fixtures/
│       ├── README.md
│       └── test-avatar.png      # Imagem para teste de upload
```

## ⚙️ Pré-requisitos

### Backend deve estar rodando:
```bash
cd backend
npm run dev
```

### Banco de dados configurado com usuário admin:
- **Email**: admin@reiche.com
- **Senha**: admin123

> ⚠️ **Importante**: Os testes criam usuários temporários que são deletados ao final. Certifique-se de que o backend está acessível em `http://localhost:3000`.

## 📊 Relatórios

Após execução, o Playwright gera um relatório HTML:

```bash
npx playwright show-report
```

## 🔍 Debugging

Para debugar um teste específico:

```bash
npx playwright test usuarios.spec.ts --debug
```

Para executar apenas um teste:

```bash
npx playwright test usuarios.spec.ts -g "Deve criar um novo usuário"
```

## 📝 Notas Técnicas

### Estratégia de Testes
- **Sequencial**: Testes rodam em ordem (`fullyParallel: false`) pois dependem do estado anterior
- **Variável Global**: `createdUserId` mantém referência do usuário criado entre testes
- **Cleanup**: Último teste deleta o usuário criado (cleanup automático)
- **Timestamps**: Email usa timestamp para evitar conflitos

### SweetAlert2
Testes validam:
- Aparecimento de modais de confirmação
- Títulos e mensagens corretas
- Toasts de sucesso/erro
- Timer e posicionamento

### Seletores
- Usa seletores semânticos quando possível (`role`, `text`)
- IDs de elementos para campos de formulário
- Classes CSS para botões e badges
- Feather icons para ações

## 🐛 Troubleshooting

### Timeout ao fazer login
```bash
# Aumentar timeout no playwright.config.ts
timeout: 30000
```

### Testes falhando localmente
```bash
# Limpar estado do navegador
npx playwright clean
npx playwright install
```

### Backend não responde
Verificar se ambos estão rodando:
- Frontend: http://localhost:4200
- Backend: http://localhost:3000

## 🔄 CI/CD

Para integração contínua, adicione ao pipeline:

```yaml
# GitHub Actions exemplo
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E Tests
  run: npm run test:e2e
  working-directory: ./frontend

- name: Upload Test Report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

## 📚 Referências

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Angular Testing](https://angular.io/guide/testing)
