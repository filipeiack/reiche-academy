# Guia: Offcanvas de Detalhes do Usuário

## Visão Geral
Implementação de um offcanvas posicionado à direita que exibe os detalhes completos de um usuário ao clicar no botão de informações na listagem de usuários.

## Funcionalidades Implementadas

### 1. Botão de Detalhes
- Ícone de informação (`icon-info`) na coluna de ações
- Ao clicar, busca dados do usuário no backend via API
- Abre offcanvas na lateral direita da tela

### 2. Offcanvas de Detalhes
Exibe as seguintes informações do usuário:

#### Seção de Avatar e Identificação
- **Avatar**: Foto do usuário (se disponível) ou placeholder com inicial do nome
- **Nome completo**: Nome do usuário
- **Cargo**: Cargo do usuário
- **Status**: Badge indicando se está Ativo/Inativo

#### Informações Básicas (Card)
- **Email**: Email do usuário
- **Perfil**: Badge colorido com o perfil (Consultor, Gestor, Colaborador, Leitura)
- **Cargo**: Cargo do usuário
- **Status**: Badge indicando se está Ativo/Inativo

#### Datas (Card)
- **Criado em**: Data e hora de criação (formato dd/MM/yyyy HH:mm)
- **Atualizado em**: Data e hora da última atualização

#### Ações Disponíveis
- **Editar**: Redireciona para a página de edição do usuário
- **Ativar/Inativar**: Alterna o status do usuário
- **Deletar**: Remove o usuário permanentemente

### 3. Estados de Carregamento
- **Loading**: Spinner exibido enquanto busca dados do backend
- **Erro**: Toast de erro se falhar ao carregar os dados
- **Sucesso**: Exibe todos os detalhes do usuário

## Arquivos Modificados

### 1. `usuarios-list.component.ts`
```typescript
// Imports adicionados
import { NgbOffcanvas, NgbOffcanvasModule } from '@ng-bootstrap/ng-bootstrap';

// Propriedades adicionadas
private offcanvasService = inject(NgbOffcanvas);
selectedUsuario: Usuario | null = null;
loadingDetails = false;

// Método principal
openDetailsOffcanvas(usuarioId: string, content: any): void {
  // Abre offcanvas e busca dados do backend
}
```

### 2. `usuarios-list.component.html`
```html
<!-- Botão de detalhes atualizado -->
<button class="btn btn-icon text-primary"
        (click)="openDetailsOffcanvas(usuario.id, detailsOffcanvas)">
  <i class="feather icon-info"></i>
</button>

<!-- Template do offcanvas -->
<ng-template #detailsOffcanvas let-offcanvas>
  <!-- Conteúdo do offcanvas -->
</ng-template>
```

### 3. `usuarios-list.component.scss`
```scss
// Largura customizada do offcanvas
:host ::ng-deep .offcanvas-large {
  width: 450px !important;
  max-width: 90vw;
}

// Avatar placeholder
.avatar-placeholder {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### 4. `pt-BR.json` (i18n)
Traduções adicionadas:
- `USERS.DETAILS`: "Detalhes do Usuário"
- `USERS.CARGO`: "Cargo"
- `COMMON.BASIC_INFO`: "Informações Básicas"
- `COMMON.TIMESTAMPS`: "Datas"
- `COMMON.CREATED_AT`: "Criado em"
- `COMMON.UPDATED_AT`: "Atualizado em"

## Como Usar

1. Na listagem de usuários, clique no botão de informações (ícone 'i')
2. O offcanvas será aberto na lateral direita
3. Enquanto carrega, um spinner será exibido
4. Após o carregamento, todos os detalhes do usuário serão exibidos
5. É possível editar, ativar/inativar ou deletar diretamente do offcanvas
6. Clique no X ou fora do offcanvas para fechar

## Integração com Backend

### Endpoint Utilizado
```typescript
GET /usuarios/:id
```

### Serviço
```typescript
this.usersService.getById(usuarioId).subscribe({
  next: (usuario) => {
    this.selectedUsuario = usuario;
    this.loadingDetails = false;
  },
  error: (err) => {
    // Exibe toast de erro e fecha offcanvas
  }
});
```

## Recursos Visuais

### Layout do Offcanvas
```
┌─────────────────────────────┐
│ Detalhes do Usuário      [X]│
├─────────────────────────────┤
│        [Avatar/Foto]        │
│       Nome do Usuário       │
│           Cargo             │
│      [Badge: Ativo]         │
│                             │
│ ┌─ Informações Básicas ───┐│
│ │ Email: ...               ││
│ │ Perfil: [Badge]          ││
│ │ Cargo: ...               ││
│ │ Status: [Badge]          ││
│ └─────────────────────────┘│
│                             │
│ ┌─ Datas ─────────────────┐│
│ │ Criado em: ...           ││
│ │ Atualizado em: ...       ││
│ └─────────────────────────┘│
│                             │
│ [Editar (primário)]         │
│ [Ativar/Inativar (sec)]     │
│ [Deletar (danger)]          │
└─────────────────────────────┘
```

### Badges de Perfil
- **Consultor**: Badge primário (azul)
- **Gestor**: Badge success (verde)
- **Colaborador**: Badge info (ciano)
- **Leitura**: Badge secondary (cinza)

### Avatar Placeholder
- Gradiente roxo/azul (`#667eea` → `#764ba2`)
- Primeira letra do nome em branco
- Tamanho: 120x120px, circular

## Observações

- O offcanvas é responsivo (largura máxima de 90vw em telas pequenas)
- Fecha automaticamente ao clicar em editar/ativar/deletar
- Utiliza Angular Material Icons (Feather Icons)
- Totalmente integrado com o sistema de tradução (i18n)
- Segue as convenções do NobleUI template
- Mantém consistência visual com o resto da aplicação

## Próximas Melhorias (Sugestões)

1. Adicionar histórico de auditoria do usuário
2. Exibir empresas/contratos vinculados
3. Mostrar últimos acessos
4. Adicionar opção de resetar senha
5. Exibir permissões detalhadas por módulo
