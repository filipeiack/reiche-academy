# Sistema de Proteção de Rotas (Route Guards)

## Visão Geral

O sistema implementa proteção de rotas para garantir que apenas usuários autenticados possam acessar as páginas do menu. Se um usuário não autenticado tentar acessar uma página protegida, será redirecionado para a página de login.

## Como Funciona

### 1. Auth Guard (`auth.guard.ts`)

O guard verifica se o usuário está logado usando o `AuthService`:

```typescript
export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;  // Permite acesso
  }

  // Redireciona para login com a URL solicitada como parâmetro
  router.navigate(['/auth/login'], { 
    queryParams: { returnUrl: state.url.split('?')[0] } 
  });
  
  return false;  // Bloqueia acesso
};
```

### 2. Verificação de Login

O `AuthService.isLoggedIn()` verifica se existe um token válido no localStorage:

```typescript
isLoggedIn(): boolean {
  return !!this.getToken();
}

getToken(): string | null {
  return localStorage.getItem('access_token');
}
```

### 3. Rotas Protegidas (`app.routes.ts`)

O guard é aplicado às rotas que requerem autenticação:

```typescript
{
  path: 'dashboard',
  component: BaseComponent,
  canActivate: [authGuard],  // Proteção aplicada
  children: [
    {
      path: '',
      loadComponent: () => import('./views/pages/dashboard/dashboard.component')
    }
  ]
}
```

### 4. Redirecionamento Pós-Login

Após um login bem-sucedido, o usuário é redirecionado para a página que estava tentando acessar:

```typescript
ngOnInit(): void {
  // Obtém a URL original da query parameter
  this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
}

onLoggedin(e: Event) {
  this.authService.login(credentials).subscribe({
    next: () => {
      // Redireciona para a URL original ou dashboard
      this.router.navigate([this.returnUrl]);
    }
  });
}
```

## Fluxo de Acesso

### Cenário 1: Usuário Logado
```
Usuário clica em Dashboard
  ↓
Route Guard verifica isLoggedIn() → true
  ↓
Dashboard carrega normalmente
```

### Cenário 2: Usuário Não Logado (Acesso Direto)
```
Usuário tenta acessar /dashboard diretamente
  ↓
Route Guard verifica isLoggedIn() → false
  ↓
Redireciona para /auth/login?returnUrl=/dashboard
  ↓
Usuário faz login
  ↓
Redireciona para /dashboard (URL original)
```

### Cenário 3: Logout
```
Usuário clica em Sair
  ↓
AuthService.logout() limpa tokens e currentUser
  ↓
Redireciona para /auth/login
```

## Adicionando Proteção a Novas Rotas

Para proteger uma nova rota com o guard:

```typescript
{
  path: 'nova-pagina',
  component: NovaComponent,
  canActivate: [authGuard]  // Adicionar o guard
}
```

## Testando a Proteção

1. **Teste 1 - Acesso Direto Sem Autenticação:**
   - Feche o navegador ou limpe o localStorage
   - Acesse diretamente: `http://localhost:4200/dashboard`
   - Resultado esperado: Redireciona para login

2. **Teste 2 - Login e Redirecionamento:**
   - Tente acessar `/dashboard?returnUrl=/dashboard`
   - Faça login com credenciais válidas
   - Resultado esperado: Redireciona para /dashboard após login

3. **Teste 3 - Logout e Redirecionamento:**
   - Faça login normalmente
   - Clique em "Sair" no profile dropdown
   - Resultado esperado: Redireciona para login, tokens removidos

## Verificação do Token

O token é verificado no localStorage com a chave `access_token`:

```typescript
// Token é armazenado após login bem-sucedido
localStorage.setItem('access_token', response.accessToken);

// Token é removido ao fazer logout
localStorage.removeItem('access_token');
```

## Próximos Passos (Opcional)

1. **JWT Token Expiration:** Implementar verificação de expiração do token
2. **Refresh Token:** Usar refresh token para renovar sessão automaticamente
3. **Role-Based Access Control (RBAC):** Criar guards específicos por perfil (Consultor, Gestor, etc.)
4. **Request Interceptor:** Adicionar token aos headers de todas as requisições HTTP
5. **Error Handling:** Tratar erros 401 Unauthorized em requisições

