# Sistema de Internacionalização (i18n) - Reiche Academy

## Visão Geral

Sistema bilíngue implementado com **Português (pt-BR)** e **Inglês (en-US)**, permitindo troca dinâmica de idioma através do botão no navbar.

## Estrutura de Arquivos

### Arquivos de Tradução
```
frontend/src/assets/i18n/
├── pt-BR.json  # Traduções em Português
└── en-US.json  # Traduções em Inglês
```

### Serviços Core
```
frontend/src/app/core/
├── services/
│   ├── translate.service.ts  # Serviço principal de tradução
│   └── menu.service.ts        # Gerencia menu traduzido
└── pipes/
    └── translate.pipe.ts      # Pipe para uso em templates
```

## Como Usar

### 1. Em Templates HTML

Use o pipe `translate` com a chave de tradução:

```html
<!-- Texto simples -->
<h1>{{ 'MENU.DASHBOARD' | translate }}</h1>

<!-- Em atributos -->
<input [placeholder]="'AUTH.LOGIN.EMAIL_PLACEHOLDER' | translate">

<!-- Em labels -->
<label>{{ 'AUTH.LOGIN.EMAIL_LABEL' | translate }}</label>
```

### 2. Em Componentes TypeScript

Injete o `TranslateService`:

```typescript
import { TranslateService } from '@core/services/translate.service';

export class MyComponent {
  translateService = inject(TranslateService);

  ngOnInit() {
    // Obter tradução instantânea
    const text = this.translateService.instant('MENU.DASHBOARD');
    
    // Obter tradução como Observable
    this.translateService.get('MENU.DASHBOARD').subscribe(text => {
      console.log(text);
    });
    
    // Trocar idioma
    this.translateService.use('en-US');
    
    // Alternar entre idiomas
    this.translateService.switchLanguage();
  }
}
```

### 3. Adicionar o TranslatePipe ao Componente

Sempre inclua o `TranslatePipe` nos imports do componente standalone:

```typescript
import { TranslatePipe } from '@core/pipes/translate.pipe';

@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe  // ← Adicione aqui
  ],
  templateUrl: './my-component.html'
})
export class MyComponent { }
```

## Estrutura das Chaves de Tradução

As traduções são organizadas hierarquicamente usando notação de ponto:

```json
{
  "APP": {
    "TITLE": "Reiche Academy",
    "BRAND": "REICHE"
  },
  "AUTH": {
    "LOGIN": {
      "TITLE": "Bem-vindo! Faça login na sua conta.",
      "EMAIL_LABEL": "Email"
    }
  },
  "MENU": {
    "DASHBOARD": "Dashboard",
    "AUTHENTICATION": "Autenticação"
  }
}
```

Uso: `{{ 'AUTH.LOGIN.TITLE' | translate }}`

## Categorias de Tradução

### APP
Informações gerais da aplicação (título, marca, etc.)

### AUTH
Telas de autenticação (login, registro, recuperação de senha)

### MENU
Itens do menu lateral (sidebar)

### NAVBAR
Elementos da barra superior (idioma, perfil, notificações)

### COMMON
Textos comuns usados em várias partes da aplicação

## Troca de Idioma

### Através do Navbar

O usuário pode trocar o idioma clicando no dropdown de idiomas no navbar:

1. Clique no ícone da bandeira atual
2. Selecione o idioma desejado
3. A aplicação recarrega instantaneamente com o novo idioma

### Persistência

O idioma selecionado é salvo automaticamente no `localStorage` com a chave `app_language` e permanece entre sessões.

## Adicionando Novas Traduções

### 1. Adicione a Chave nos Arquivos JSON

**pt-BR.json:**
```json
{
  "CADASTROS": {
    "EMPRESA": {
      "TITULO": "Cadastro de Empresa",
      "NOME_LABEL": "Nome da Empresa"
    }
  }
}
```

**en-US.json:**
```json
{
  "CADASTROS": {
    "EMPRESA": {
      "TITULO": "Company Registration",
      "NOME_LABEL": "Company Name"
    }
  }
}
```

### 2. Use no Template

```html
<h2>{{ 'CADASTROS.EMPRESA.TITULO' | translate }}</h2>
<label>{{ 'CADASTROS.EMPRESA.NOME_LABEL' | translate }}</label>
```

## Idiomas Disponíveis

| Código | Nome       | Bandeira                          |
|--------|------------|-----------------------------------|
| pt-BR  | Português  | assets/images/flags/br.svg        |
| en-US  | English    | assets/images/flags/us.svg        |

## Adicionando Novos Idiomas

Para adicionar um novo idioma (ex: Espanhol):

1. **Crie o arquivo de tradução:**
   ```
   frontend/src/assets/i18n/es-ES.json
   ```

2. **Atualize o TranslateService:**
   ```typescript
   export type Language = 'pt-BR' | 'en-US' | 'es-ES';
   
   public readonly languages: LanguageOption[] = [
     { code: 'pt-BR', name: 'Português', flag: 'assets/images/flags/br.svg' },
     { code: 'en-US', name: 'English', flag: 'assets/images/flags/us.svg' },
     { code: 'es-ES', name: 'Español', flag: 'assets/images/flags/es.svg' }
   ];
   ```

3. **Adicione a bandeira:**
   ```
   frontend/src/assets/images/flags/es.svg
   ```

## Boas Práticas

### ✅ DO

- Use chaves descritivas em UPPER_SNAKE_CASE
- Organize as chaves hierarquicamente por contexto
- Mantenha os arquivos JSON sincronizados entre idiomas
- Use o pipe `translate` diretamente em templates
- Teste todas as traduções em ambos os idiomas

### ❌ DON'T

- Não use textos hardcoded em português/inglês
- Não crie chaves genéricas como `TEXT1`, `TEXT2`
- Não misture idiomas no mesmo arquivo de tradução
- Não esqueça de adicionar o `TranslatePipe` nos imports do componente

## Exemplo Completo

**Componente TypeScript:**
```typescript
import { Component, inject } from '@angular/core';
import { TranslatePipe } from '@core/pipes/translate.pipe';
import { TranslateService } from '@core/services/translate.service';

@Component({
  selector: 'app-cadastro-empresa',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="page-header">
      <h1>{{ 'CADASTROS.EMPRESA.TITULO' | translate }}</h1>
      <p>{{ 'CADASTROS.EMPRESA.DESCRICAO' | translate }}</p>
    </div>
    
    <form>
      <label>{{ 'CADASTROS.EMPRESA.NOME_LABEL' | translate }}</label>
      <input [placeholder]="'CADASTROS.EMPRESA.NOME_PLACEHOLDER' | translate">
      
      <button>{{ 'COMMON.SAVE' | translate }}</button>
    </form>
  `
})
export class CadastroEmpresaComponent {
  translateService = inject(TranslateService);
  
  salvar() {
    const mensagem = this.translateService.instant('COMMON.SAVE_SUCCESS');
    alert(mensagem);
  }
}
```

**Arquivo de Tradução (pt-BR.json):**
```json
{
  "CADASTROS": {
    "EMPRESA": {
      "TITULO": "Cadastro de Empresa",
      "DESCRICAO": "Preencha os dados da empresa",
      "NOME_LABEL": "Nome da Empresa",
      "NOME_PLACEHOLDER": "Digite o nome da empresa"
    }
  },
  "COMMON": {
    "SAVE": "Salvar",
    "SAVE_SUCCESS": "Dados salvos com sucesso!"
  }
}
```

## Troubleshooting

### Problema: Tradução não aparece

**Solução:** Verifique se:
1. O `TranslatePipe` está nos imports do componente
2. A chave existe em ambos os arquivos de tradução
3. A sintaxe está correta: `{{ 'CHAVE.SUBCHAVE' | translate }}`

### Problema: Idioma não persiste após refresh

**Solução:** O `TranslateService` salva automaticamente no localStorage. Verifique o console para erros de carregamento do serviço.

### Problema: Menu não traduz

**Solução:** O menu usa o `MenuService` que atualiza automaticamente. Verifique se:
1. As chaves do menu estão corretas em `menu.service.ts`
2. As traduções existem nos arquivos JSON
3. O componente sidebar está injetando o `MenuService` corretamente

## Arquitetura Técnica

### TranslateService
- Gerencia o estado do idioma atual
- Carrega arquivos JSON de tradução via HttpClient
- Persiste escolha do usuário no localStorage
- Emite eventos quando o idioma muda

### TranslatePipe
- Pipe puro e standalone
- Transforma chaves em texto traduzido
- Atualiza automaticamente quando o idioma muda

### MenuService
- Gerencia menu traduzido dinamicamente
- Observa mudanças de idioma
- Atualiza labels do menu em tempo real

### APP_INITIALIZER
- Carrega traduções antes da aplicação iniciar
- Garante que o idioma esteja pronto no primeiro render
- Previne "flash" de conteúdo não traduzido
