# Sistema de Avatar de Perfil

## Visão Geral

O sistema de avatar exibe a foto de perfil do usuário na navbar e no dropdown de perfil. Caso o usuário não tenha uma foto, o sistema exibe automaticamente as iniciais do seu nome em um círculo colorido.

## Componentes Criados

### 1. **InitialsPipe** (`initials.pipe.ts`)

Pipe standalone que gera as iniciais do nome do usuário.

```typescript
{{ nome | initials }}  // "João Silva" → "JS"
{{ nome | initials }}  // "Maria" → "M"
{{ nome | initials }}  // null → "?"
```

**Lógica:**
- Se o nome tiver múltiplas partes: pega a primeira letra do primeiro e último nome
- Se tiver uma só parte: pega a primeira letra
- Se for vazio/null: retorna "?"

### 2. **UserAvatarComponent** (`user-avatar.component.ts`)

Componente standalone que exibe o avatar do usuário com as seguintes funcionalidades:

```typescript
<app-user-avatar 
  [nome]="currentUser?.nome" 
  [fotoUrl]="currentUser?.fotoUrl"
  size="small">
</app-user-avatar>
```

**Inputs:**
- `nome: string | null | undefined` - Nome do usuário para gerar iniciais
- `fotoUrl: string | null | undefined` - URL da foto de perfil
- `size: 'small' | 'medium' | 'large'` - Tamanho do avatar (padrão: 'medium')

**Tamanhos:**
- `small` - 30x30px (navbar)
- `medium` - 50x50px (padrão)
- `large` - 80x80px (dropdown de perfil)

**Cores:**
- Se houver foto: exibe a imagem
- Se não houver: exibe iniciais com fundo colorido
- A cor é escolhida de forma consistente baseada na primeira letra do nome
- 10 cores diferentes disponíveis

**Tratamento de Erros:**
- Se a imagem falhar ao carregar (erro HTTP), automaticamente exibe as iniciais
- Implementado via evento `(error)` da tag `<img>`

## Como Usar

### Na Navbar

```html
<app-user-avatar 
  [nome]="currentUser?.nome" 
  [fotoUrl]="currentUser?.fotoUrl"
  size="small">
</app-user-avatar>
```

### No Dropdown de Perfil

```html
<app-user-avatar 
  [nome]="currentUser?.nome" 
  [fotoUrl]="currentUser?.fotoUrl"
  size="large">
</app-user-avatar>
```

## Modelo de Usuário Atualizado

```typescript
export interface Usuario {
  id: string;
  email: string;
  nome: string;
  cargo?: string;
  perfil: 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
  ativo: boolean;
  empresaId?: string;
  fotoUrl?: string | null;  // ← Novo campo
  createdAt: Date;
  updatedAt: Date;
}
```

## Serviço de Upload de Foto

Criado `UserProfileService` para gerenciar fotos de perfil:

```typescript
// Upload da foto
userProfileService.uploadProfilePhoto(usuarioId, file).subscribe(response => {
  console.log('Foto atualizada:', response);
});

// Deletar foto
userProfileService.deleteProfilePhoto(usuarioId).subscribe(() => {
  console.log('Foto removida');
});

// Obter perfil do usuário
userProfileService.getUserProfile(usuarioId).subscribe(user => {
  console.log('Dados do perfil:', user);
});
```

## Fluxo de Exibição

```
Usuario carrega a página
  ↓
AuthService carrega currentUser$ (que inclui fotoUrl)
  ↓
Navbar renderiza UserAvatarComponent com [fotoUrl]
  ↓
┌─────────────────────────────────────────┐
│ Tenta carregar a imagem                │
└─────────────────────────────────────────┘
  │
  ├─ Sucesso → Exibe a foto
  │
  └─ Erro → Exibe as iniciais com fundo colorido
```

## Próximos Passos

1. **Implementar Modal de Upload:** Criar interface para usuário fazer upload da foto
   - Validar tipo de arquivo (jpg, png, webp)
   - Validar tamanho máximo
   - Prévia da imagem antes de enviar

2. **Crop de Imagem:** Permitir usuário cortar/redimensionar a foto antes de enviar

3. **Foto Padrão:** Usar foto padrão da empresa/plataforma se usuário não tiver foto

4. **Cache:** Implementar cache de avatares para melhor performance

5. **Badge de Status:** Adicionar indicador de online/offline no avatar

6. **Avatar do Grupo:** Exibir múltiplos avatares para equipes/departamentos

## Exemplo de Integração Completa

```typescript
// No componente de perfil
export class ProfileComponent {
  currentUser: Usuario | null = null;

  constructor(
    private authService: AuthService,
    private userProfileService: UserProfileService
  ) {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.currentUser) {
      this.userProfileService
        .uploadProfilePhoto(this.currentUser.id, file)
        .subscribe(() => {
          // Atualizar dados do usuário
          this.userProfileService
            .getUserProfile(this.currentUser!.id)
            .subscribe(user => {
              this.authService.updateCurrentUser(user);
            });
        });
    }
  }
}
```

## Estilos

O componente inclui estilos CSS encapsulados:

```css
.user-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar.small { /* 30x30px */ }
.user-avatar.medium { /* 50x50px */ }
.user-avatar.large { /* 80x80px */ }

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-initials {
  font-weight: 600;
  letter-spacing: 0.5px;
}
```

## Troubleshooting

**Problema:** Avatar mostra "?" em vez de iniciais
- Verifique se o nome do usuário está sendo passado corretamente
- Verifique se `currentUser?.nome` é uma string válida

**Problema:** Foto não aparece mesmo com fotoUrl preenchido
- Verifique se a URL é acessível
- Verifique CORS (se for de outro domínio)
- Verifique se o formato da imagem é suportado

**Problema:** Cor do fundo não é consistente
- As cores são calculadas automaticamente baseado no primeiro caractere do nome
- Não há como customizar por enquanto, mas a cor é sempre a mesma para o mesmo nome

