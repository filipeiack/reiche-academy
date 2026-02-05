# Regra: Controle Multi-tenant e Segurança no Cockpit de Pilares

## Contexto
Módulo Cockpit de Pilares - Backend e Frontend
Todas as operações de criação, leitura, atualização e exclusão de cockpits e entidades relacionadas.

## Descrição
O sistema implementa isolamento rigoroso entre empresas (multi-tenancy) e controle de acesso baseado em perfis para todas as operações do Cockpit de Pilares.

## Condição
Aplicada em **todas** as operações:
- Criação de cockpit
- Listagem de cockpits
- Visualização de cockpit por ID
- Atualização de cockpit
- Exclusão (soft delete) de cockpit
- CRUD de indicadores
- Atualização de valores mensais
- Atualização de processos prioritários

## Comportamento Implementado

### 1. Validação Multi-tenant (Backend)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `validateTenantAccess(empresaId: string, user: RequestUser)`

**Regra:**
- Perfil ADMINISTRADOR: acesso **global** (pode acessar qualquer empresa)
- Outros perfis: acesso **restrito** à própria empresa (`user.empresaId === empresaId`)
- Violação: lança `ForbiddenException` com mensagem "Você não pode acessar dados de outra empresa"

**Código implementado:**
```typescript
private validateTenantAccess(empresaId: string, user: RequestUser) {
  if (user.perfil?.codigo === 'ADMINISTRADOR') {
    return;
  }

  if (user.empresaId !== empresaId) {
    throw new ForbiddenException(
      'Você não pode acessar dados de outra empresa',
    );
  }
}
```

---

### 2. Validação de Acesso ao Cockpit (Backend)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `validateCockpitAccess(cockpitId: string, user: RequestUser)`

**Regra:**
- Verifica se cockpit existe (caso contrário: `NotFoundException`)
- Verifica se cockpit pertence à empresa do usuário
- Perfil ADMINISTRADOR: bypass da validação de empresa
- Outros perfis: verifica `cockpit.pilarEmpresa.empresa.id === user.empresaId`
- Violação: lança `ForbiddenException` com mensagem "Você não pode acessar cockpits de outra empresa"

**Código implementado:**
```typescript
private async validateCockpitAccess(cockpitId: string, user: RequestUser) {
  const cockpit = await this.prisma.cockpitPilar.findUnique({
    where: { id: cockpitId },
    include: {
      pilarEmpresa: {
        include: {
          empresa: true,
        },
      },
    },
  });

  if (!cockpit) {
    throw new NotFoundException('Cockpit não encontrado');
  }

  if (user.perfil?.codigo !== 'ADMINISTRADOR') {
    if (cockpit.pilarEmpresa.empresa.id !== user.empresaId) {
      throw new ForbiddenException(
        'Você não pode acessar cockpits de outra empresa',
      );
    }
  }

  return cockpit;
}
```

---

### 3. Controle de Permissões por Perfil (Backend)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts`

**Implementação via Decorators `@Roles(...)`**

| Operação | Perfis Autorizados |
|----------|-------------------|
| **Criar Cockpit** | ADMINISTRADOR, GESTOR |
| **Listar Cockpits** | ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA |
| **Visualizar Cockpit** | ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA |
| **Atualizar Contexto Cockpit** | ADMINISTRADOR, GESTOR |
| **Deletar Cockpit** | ADMINISTRADOR, GESTOR |
| **Criar Indicador** | ADMINISTRADOR, GESTOR, COLABORADOR |
| **Atualizar Indicador** | ADMINISTRADOR, GESTOR, COLABORADOR |
| **Deletar Indicador** | ADMINISTRADOR, GESTOR, COLABORADOR |
| **Atualizar Valores Mensais** | ADMINISTRADOR, GESTOR, COLABORADOR |
| **Atualizar Processo Prioritário** | ADMINISTRADOR, GESTOR, COLABORADOR |

**Código implementado:**
```typescript
@Post('empresas/:empresaId/pilares/:pilarEmpresaId/cockpit')
@Roles('ADMINISTRADOR', 'GESTOR')
createCockpit(...) { }

@Get('empresas/:empresaId/cockpits')
@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
getCockpitsByEmpresa(...) { }

@Post('cockpits/:cockpitId/indicadores')
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
createIndicador(...) { }
```

---

### 4. Validação de Responsável (Indicadores)

**Arquivo:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`

**Método:** `createIndicador()` e `updateIndicador()`

**Regra:**
- Se `responsavelMedicaoId` for fornecido:
  - Valida se o usuário existe (caso contrário: `NotFoundException`)
  - Valida se o responsável pertence à **mesma empresa do cockpit**
  - Perfil ADMINISTRADOR: bypass da validação de empresa
  - Outros perfis: verifica `responsavel.empresaId === cockpit.pilarEmpresa.empresa.id`
  - Violação: lança `ForbiddenException` com mensagem "Responsável deve ser da mesma empresa do cockpit"

**Código implementado:**
```typescript
if (dto.responsavelMedicaoId) {
  const responsavel = await this.prisma.usuario.findUnique({
    where: { id: dto.responsavelMedicaoId },
  });

  if (!responsavel) {
    throw new NotFoundException('Responsável não encontrado');
  }

  if (
    user.perfil?.codigo !== 'ADMINISTRADOR' &&
    responsavel.empresaId !== cockpit.pilarEmpresa.empresa.id
  ) {
    throw new ForbiddenException(
      'Responsável deve ser da mesma empresa do cockpit',
    );
  }
}
```

---

### 5. Filtro de Usuários no Frontend

**Arquivo:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`

**Método:** `loadUsuarios()`

**Regra:**
- Ao carregar lista de usuários para responsável de medição:
  - Filtra apenas usuários da **mesma empresa do cockpit** (`u.empresaId === this.empresaId`)
  - Filtra apenas usuários com perfil **CLIENTE** (`u.perfil?.codigo === 'CLIENTE'`)
  - Lista exibida no ng-select é pré-filtrada

**Código implementado:**
```typescript
private loadUsuarios(): void {
  if (!this.empresaId) {
    console.error('empresaId não definido');
    return;
  }

  this.usersService.getAll().subscribe({
    next: (usuarios: Usuario[]) => {
      // Filtrar apenas usuários com perfil CLIENTE da empresa atual
      this.usuarios = usuarios.filter(u => 
        u.empresaId === this.empresaId && 
        u.perfil?.codigo === 'CLIENTE'
      );
    },
    error: (err: unknown) => {
      console.error('Erro ao carregar usuários:', err);
    },
  });
}
```

---

## Restrições

1. **Isolamento absoluto:** Usuários nunca veem dados de outras empresas (exceto ADMINISTRADOR)
2. **Responsável de medição:** Deve ser da mesma empresa do cockpit
3. **Perfil LEITURA:** Pode visualizar mas não pode criar/editar/deletar
4. **Perfil COLABORADOR:** Pode criar/editar indicadores e valores, mas não criar/deletar cockpits

---

## Fonte no Código

- **Backend Service:** `backend/src/modules/cockpit-pilares/cockpit-pilares.service.ts`
  - Linhas: 26-44 (`validateTenantAccess`)
  - Linhas: 46-71 (`validateCockpitAccess`)
  - Linhas: 339-360 (`validação de responsável em createIndicador`)
  - Linhas: 494-514 (`validação de responsável em updateIndicador`)
  
- **Backend Controller:** `backend/src/modules/cockpit-pilares/cockpit-pilares.controller.ts`
  - Decorators `@Roles()` em todos os endpoints
  
- **Frontend Gestão Indicadores:** `frontend/src/app/views/pages/cockpit-pilares/gestao-indicadores/gestao-indicadores.component.ts`
  - Linhas: 135-151 (`loadUsuarios`)

---

## Observações

-  **Regra extraída por engenharia reversa**
- Validações implementadas no backend (camada de serviço)
- Controle de acesso via Guards + Decorators no controller
- Frontend pré-filtra dados para evitar exibição de informações não autorizadas
- Multi-tenancy garantido em todas as camadas
