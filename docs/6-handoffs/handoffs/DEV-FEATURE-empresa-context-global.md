# Implementação do Contexto Global de Empresa

## Resumo

Implementação de um sistema de **contexto global de empresa** que permite ao administrador "assumir" temporariamente uma empresa no navbar, tornando essa seleção válida para todas as telas do sistema.

## Mudanças Implementadas

### 1. Novo Serviço: EmpresaContextService

**Arquivo:** [`frontend/src/app/core/services/empresa-context.service.ts`](frontend/src/app/core/services/empresa-context.service.ts)

Serviço global que gerencia a empresa selecionada:

- **Para Administradores**: Permite selecionar manualmente qualquer empresa
- **Para Clientes**: Sempre retorna a empresa associada ao usuário
- **Persistência**: Armazena seleção no `localStorage` (apenas para admin)
- **Observable**: Emite mudanças via `selectedEmpresaId$` para atualização reativa

#### Métodos principais:

```typescript
setSelectedEmpresa(empresaId: string | null): void  // Define empresa selecionada
getEmpresaId(): string | null                       // Retorna empresa no contexto atual
clearSelectedEmpresa(): void                        // Limpa seleção (usado no logout)
isAdmin(): boolean                                  // Verifica se usuário é admin
```

---

### 2. Modificações no NavbarComponent

**Arquivos:**
- [navbar.component.ts](frontend/src/app/views/layout/navbar/navbar.component.ts)
- [navbar.component.html](frontend/src/app/views/layout/navbar/navbar.component.html)
- [navbar.component.scss](frontend/src/app/views/layout/navbar/navbar.component.scss)

#### Mudanças:

1. **Substituição do search-form** por seletor de empresa
2. **Comportamento diferenciado por perfil:**
   - **Admin**: Combo `ng-select` para escolher empresa
   - **Cliente**: Exibição read-only do nome da empresa

3. **Integração com EmpresaContextService:**
   - Carrega lista de empresas ativas
   - Ao selecionar empresa, chama `setSelectedEmpresa()`
   - Subscrito a mudanças via `selectedEmpresaId$`

4. **Limpeza no logout:**
   - Chama `clearSelectedEmpresa()` antes de deslogar

#### Template (navbar.component.html):

```html
<!-- Seletor de Empresa (Admin) ou Exibição (Cliente) -->
<div class="empresa-selector-wrapper">
  @if (isAdmin) {
    <!-- Combo para admin -->
    <ng-select [items]="empresas" [(ngModel)]="selectedEmpresaId">
    </ng-select>
  } @else if (currentUser?.empresa) {
    <!-- Display read-only para cliente -->
    <div class="empresa-display">
      <i class="feather icon-briefcase"></i>
      <span>{{ getEmpresaNomeUsuario() }}</span>
    </div>
  }
</div>
```

---

### 3. Modificações no AuthService

**Arquivo:** [frontend/src/app/core/services/auth.service.ts](frontend/src/app/core/services/auth.service.ts)

#### Mudança no método `logout()`:

```typescript
logout(): void {
  // ... código existente ...
  
  // Limpar também o contexto de empresa selecionada
  localStorage.removeItem('selected_empresa_context');
  
  // ... restante do código ...
}
```

Garante que a empresa selecionada pelo admin seja limpa ao fazer logout.

---

### 4. Modificações no DiagnosticoNotasComponent

**Arquivos:**
- [diagnostico-notas.component.ts](frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts)
- [diagnostico-notas.component.html](frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.html)

#### Mudanças:

1. **Remoção da lógica local de seleção de empresa**
   - Removido `empresas: Empresa[]`
   - Removido `loadEmpresas()`
   - Removido `onEmpresaChange()`
   - Removido seletor `ng-select` do template

2. **Integração com EmpresaContextService:**
   - Injeção do serviço `empresaContextService`
   - Subscription a `selectedEmpresaId$` para reagir a mudanças
   - Método `checkUserPerfil()` usa `getEmpresaId()` para admin

3. **Comportamento reativo:**
   - Quando admin muda empresa no navbar, o componente automaticamente recarrega os dados

#### Código TypeScript:

```typescript
ngOnInit(): void {
  this.checkUserPerfil();
  this.setupAutoSave();
  
  // Subscrever às mudanças no contexto de empresa
  this.empresaContextSubscription = this.empresaContextService.selectedEmpresaId$.subscribe(empresaId => {
    if (this.isAdmin && empresaId !== this.selectedEmpresaId) {
      this.selectedEmpresaId = empresaId;
      if (empresaId) {
        this.loadDiagnostico();  // Recarrega dados automaticamente
      } else {
        this.pilares = [];
      }
    }
  });
}
```

---

## Fluxo de Funcionamento

### Para Administrador:

1. **Login** → Entra sem empresa selecionada
2. **Navbar** → Visualiza combo com todas as empresas ativas
3. **Seleciona empresa** → `EmpresaContextService.setSelectedEmpresa(id)` é chamado
4. **Persistência** → Seleção salva no `localStorage`
5. **Navegação** → Ao acessar diagnóstico-notas ou outras telas, elas usam a empresa selecionada
6. **Mudança de empresa** → Telas reagem automaticamente e recarregam dados
7. **Logout** → Empresa selecionada é limpa

### Para Cliente (Gestor/Colaborador/Leitura):

1. **Login** → Já tem `empresaId` associado
2. **Navbar** → Exibe nome da empresa (read-only)
3. **Navegação** → Todas as telas usam automaticamente `user.empresaId`
4. **Sem seleção manual** → Sempre opera no contexto da própria empresa

---

## Multi-Tenant

O sistema agora opera em **contexto de empresa** verdadeiramente global:

- **CRUDs (menu Cadastro)**: Continuam acessíveis apenas para admin
- **Diagnóstico e Evolução**: Usam a empresa do contexto (admin seleciona, cliente usa própria)
- **Consistência**: Uma única fonte de verdade (`EmpresaContextService`)

---

## Próximos Passos (Opcional)

Para aplicar em outras telas do sistema:

1. Injetar `EmpresaContextService`
2. Usar `getEmpresaId()` para obter empresa no contexto
3. Subscrever a `selectedEmpresaId$` para reagir a mudanças

### Exemplo:

```typescript
export class MinhaTelaComponent implements OnInit {
  private empresaContextService = inject(EmpresaContextService);
  
  ngOnInit(): void {
    // Obter empresa no contexto atual
    const empresaId = this.empresaContextService.getEmpresaId();
    
    // Reagir a mudanças
    this.empresaContextService.selectedEmpresaId$.subscribe(id => {
      if (id) {
        this.carregarDados(id);
      }
    });
  }
}
```

---

## Arquivos Criados

- `frontend/src/app/core/services/empresa-context.service.ts`

## Arquivos Modificados

- `frontend/src/app/views/layout/navbar/navbar.component.ts`
- `frontend/src/app/views/layout/navbar/navbar.component.html`
- `frontend/src/app/views/layout/navbar/navbar.component.scss`
- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts`
- `frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.html`

---

## Notas Técnicas

- ✅ **Persistência**: `localStorage` mantém seleção entre recarregamentos
- ✅ **Segurança**: Cliente nunca pode alterar empresa (apenas admin)
- ✅ **Reatividade**: Mudanças propagam automaticamente via Observable
- ✅ **Limpeza**: Logout remove contexto de empresa
- ✅ **Compatibilidade**: Não quebra funcionalidade existente para clientes
