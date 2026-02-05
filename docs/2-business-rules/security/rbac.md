 # RBAC (Role-Based Access Control)

**ID:** RN-SEC-003  
**Versão:** 1.0  
**Data:** 2026-02-04  
**Status:** ✅ Ativa  
**Prioridade:** 🔴 Crítica (CVSS 9.0 se violada)

---

## 📋 Visão Geral

Sistema Reiche Academy implementa controle de acesso baseado em perfis (RBAC) com **4 níveis hierárquicos** estritos. Cada perfil tem permissões específicas e validações de segurança para impedir elevação de privilégios não autorizada.

**Risco:** Elevação de privilégios, acesso não autorizado a dados críticos.

---

## 🎯 Perfis e Hierarquia

### RN-SEC-003.1: Hierarquia Oficial de Perfis

**Descrição:**  
> Sistema possui 4 perfis oficiais com hierarquia rígida baseada em nível numérico.

**Perfis Oficiais:**

| Código | Nome | Nível | Descrição | Acesso Multi-Tenant |
|--------|------|-------|-----------|---------------------|
| **ADMINISTRADOR** | Administrador | 1 (maior poder) | Gestão global da plataforma | ✅ Global (todas empresas) |
| **GESTOR** | Gestor | 2-3 | Gestão de empresa única | ❌ Apenas própria empresa |
| **COLABORADOR** | Colaborador | 3-4 | Execução de tarefas | ❌ Apenas própria empresa |
| **LEITURA** | Leitura | 5 (menor poder) | Apenas visualização | ❌ Apenas própria empresa |

**Validação de Nível:**
```typescript
// Menor número = maior poder
if (targetPerfil.nivel < requestUser.perfil.nivel) {
  throw new ForbiddenException("Você não pode criar/atribuir usuário com perfil superior ao seu");
}
```

**Arquivo:** [usuarios.service.ts](../../../backend/src/modules/usuarios/usuarios.service.ts#L33-L54)

---

## 🔐 Regras de Acesso por Perfil

### RN-SEC-003.2: ADMINISTRADOR (Nível 1)

**Descrição:**  
> ADMINISTRADOR tem acesso global a todas as empresas e recursos do sistema.

**Permissões Especiais:**
- ✅ **Acesso Global:** Ignora validação de `empresaId` em todos os endpoints
- ✅ **Gestão de Empresas:** Criar, editar, desativar qualquer empresa
- ✅ **Gestão de Usuários:** Criar/editar usuários de qualquer empresa
- ✅ **Templates Globais:** Criar/editar pilares, rotinas, objetivos templates
- ✅ **Períodos de Mentoria:** Criar, renovar, encerrar períodos
- ✅ **Auditoria Completa:** Visualizar todos os logs de auditoria

**Implementação:**
```typescript
// Bypass universal para ADMINISTRADOR
if (user.perfil?.codigo === 'ADMINISTRADOR') {
  return true; // Ignora validações de tenant
}
```

**Exceção:**  
Todos os acessos de ADMINISTRADOR são logados em `audit_logs` com `empresaId` acessada.

---

### RN-SEC-003.3: GESTOR (Nível 2-3)

**Descrição:**  
> GESTOR gerencia apenas sua própria empresa e seus recursos.

**Permissões:**
- ✅ **Empresa Própria:** Editar dados da empresa vinculada
- ✅ **Usuários Próprios:** Criar/editar usuários da mesma empresa
- ✅ **Pilares Empresa:** Criar/editar pilares da empresa
- ✅ **Cockpits:** Criar/editar cockpits dos pilares
- ✅ **Períodos:** Visualizar períodos de mentoria (não gerenciar)
- ✅ **Diagnósticos:** Visualizar e gerenciar diagnósticos

**Restrições:**
- ❌ Não pode acessar dados de outras empresas
- ❌ Não pode criar/editar templates globais
- ❌ Não pode gerenciar períodos de mentoria
- ❌ Não pode elevar perfil de usuários para ADMINISTRADOR

---

### RN-SEC-003.4: COLABORADOR (Nível 3-4)

**Descrição:**  
> COLABORADOR executa tarefas operacionais dentro de sua empresa.

**Permissões:**
- ✅ **Diagnósticos:** Avaliar rotinas e preencher diagnósticos
- ✅ **Dados Próprios:** Editar próprio nome, cargo, senha
- ✅ **Foto Própria:** Alterar própria foto de perfil
- ✅ **Visualização:** Ver cockpits e indicadores (somente leitura)

**Restrições:**
- ❌ Não pode gerenciar usuários
- ❌ Não pode editar dados da empresa
- ❌ Não pode criar/editar pilares ou cockpits
- ❌ Não pode acessar dados de outras empresas

---

### RN-SEC-003.5: LEITURA (Nível 5)

**Descrição:**  
> LEITURA tem acesso apenas visualização dentro de sua empresa.

**Permissões:**
- ✅ **Visualização:** Ver cockpits, indicadores e diagnósticos
- ✅ **Dados Próprios:** Visualizar próprio perfil

**Restrições:**
- ❌ Não pode executar nenhuma ação de escrita/edição
- ❌ Não pode avaliar diagnósticos
- ❌ Não pode alterar nenhum dado
- ❌ Não pode acessar dados de outras empresas

---

## 🛡️ Validações de Segurança

### RN-SEC-003.6: Validação de Elevação de Perfil

**Descrição:**  
> Usuário não pode criar/editar usuário com perfil superior ao seu próprio.

**Implementação:**
```typescript
private validateProfileElevation(targetPerfilId: string, requestUser: RequestUser) {
  // ADMINISTRADOR pode criar qualquer perfil
  if (requestUser.perfil.codigo === 'ADMINISTRADOR') {
    return;
  }

  const targetPerfil = await this.prisma.perfilUsuario.findUnique({
    where: { id: targetPerfilId }
  });

  // Valida hierarquia (nível menor = mais poder)
  if (targetPerfil.nivel < requestUser.perfil.nivel) {
    throw new ForbiddenException("Você não pode criar/atribuir usuário com perfil superior ao seu");
  }
}
```

**Arquivo:** [usuarios.service.ts](../../../backend/src/modules/usuarios/usuarios.service.ts#L33-L54)

**Teste:**  
Unit test `validateProfileElevation()` impede GESTOR de criar ADMINISTRADOR.

---

### RN-SEC-003.7: Bloqueio de Auto-Edição de Campos Privilegiados

**Descrição:**  
> Usuário não pode alterar próprio perfilId, empresaId ou status ativo.

**Implementação:**
```typescript
const isSelfEdit = id === requestUser.id;

if (isSelfEdit) {
  const privilegedFields = ['perfilId', 'empresaId', 'ativo'];
  const hasPrivilegedChanges = privilegedFields.some(field => 
    data[field] !== undefined && data[field] !== before[field]
  );

  if (hasPrivilegedChanges) {
    throw new ForbiddenException("Você não pode alterar perfilId, empresaId ou ativo no seu próprio usuário");
  }
}
```

**Arquivo:** [usuarios.service.ts](../../../backend/src/modules/usuarios/usuarios.service.ts#L276-L285)

---

## 🏢 Multi-Tenant e Permissões

### RN-SEC-003.8: Isolamento Multi-Tenant por Perfil

**Descrição:**  
> Apenas ADMINISTRADOR ignora validação multi-tenant. Demais perfis validam empresaId.

**Tabela de Validação:**

| Perfil | Validação EmpresaId | Escopo de Acesso |
|--------|-------------------|------------------|
| **ADMINISTRADOR** | ❌ Não valida | Global (todas empresas) |
| **GESTOR** | ✅ Sempre valida | Apenas própria empresa |
| **COLABORADOR** | ✅ Sempre valida | Apenas própria empresa |
| **LEITURA** | ✅ Sempre valida | Apenas própria empresa |

**Implementação Padrão:**
```typescript
// Em todos os services de dados empresariais
if (requestUser.perfil.codigo !== 'ADMINISTRADOR') {
  if (target.empresaId !== requestUser.empresaId) {
    throw new ForbiddenException("Você não pode acessar dados de outra empresa");
  }
}
```

---

## 📋 Matriz de Permissões Detalhada

### Recursos de Usuários
| Ação | ADMINISTRADOR | GESTOR | COLABORADOR | LEITURA |
|------|---------------|--------|-------------|---------|
| Criar usuário | ✅ qualquer empresa | ✅ mesma empresa | ❌ | ❌ |
| Editar usuário | ✅ qualquer empresa | ✅ mesma empresa | ✅ próprio | ❌ |
| Deletar usuário | ✅ qualquer empresa | ❌ | ❌ | ❌ |
| Alterar foto | ✅ qualquer | ✅ própria empresa | ✅ própria | ❌ |

### Recursos de Empresa
| Ação | ADMINISTRADOR | GESTOR | COLABORADOR | LEITURA |
|------|---------------|--------|-------------|---------|
| Criar empresa | ✅ | ❌ | ❌ | ❌ |
| Editar empresa | ✅ qualquer | ✅ própria | ❌ | ❌ |
| Desativar empresa | ✅ | ❌ | ❌ | ❌ |
| Upload logo | ✅ qualquer | ✅ própria | ❌ | ❌ |

### Recursos de Pilares/Cockpits
| Ação | ADMINISTRADOR | GESTOR | COLABORADOR | LEITURA |
|------|---------------|--------|-------------|---------|
| Criar templates | ✅ global | ❌ | ❌ | ❌ |
| Criar pilar empresa | ✅ qualquer | ✅ própria | ❌ | ❌ |
| Criar cockpit | ✅ qualquer | ✅ própria | ❌ | ❌ |
| Visualizar cockpit | ✅ qualquer | ✅ própria | ✅ própria | ✅ própria |

### Recursos de Mentoria
| Ação | ADMINISTRADOR | GESTOR | COLABORADOR | LEITURA |
|------|---------------|--------|-------------|---------|
| Criar período | ✅ | ❌ | ❌ | ❌ |
| Renovar período | ✅ | ❌ | ❌ | ❌ |
| Encerrar período | ✅ | ❌ | ❌ | ❌ |
| Visualizar | ✅ | ✅ própria | ✅ própria | ✅ própria |

---

## 🔧 Implementação Técnica

### Guards e Decorators

**JwtAuthGuard:** Autenticação JWT obrigatória  
**RolesGuard:** Validação de perfil por endpoint  
**@Roles():** Define perfis permitidos por endpoint

```typescript
// Exemplo de uso
@Roles('ADMINISTRADOR', 'GESTOR')
@UseGuards(JwtAuthGuard, RolesGuard)
@Post('/empresas')
createEmpresa() {
  // Implementação
}
```

**Arquivo:** [roles.guard.ts](../../../backend/src/modules/auth/guards/roles.guard.ts)

### Validações em Services

**validateTenantAccess():** Validação multi-tenant padrão  
**validateProfileElevation():** Validação de hierarquia de perfis  
**auditService.log():** Registro de auditoria para ações privilegiadas

---

## 🧪 Testes de Segurança Obrigatórios

### Unit Tests
- ✅ validateProfileElevation() impede elevação
- ✅ validateTenantAccess() bloqueia cross-tenant
- ✅ RolesGuard permite/bloqueia por perfil
- ✅ Auto-edição de campos privilegiados bloqueada

### E2E Tests
- ✅ GESTOR não acessa dados de outra empresa
- ✅ COLABORADOR não cria usuários
- ✅ LEITURA não edita nenhum recurso
- ✅ ADMINISTRADOR acessa qualquer empresa (auditado)

### Security Tests
- ✅ Token manipulation para elevação de privilégios
- ✅ URL manipulation para cross-tenant access
- ✅ Direct API calls bypassing frontend

---

## 🚨 Exceções e Casos Especiais

### Caso 1: ADMINISTRADOR Global sem Empresa
**Cenário:** ADMINISTRADOR sem empresa vinculada (usuário sistema).  
**Comportamento:** Acesso global mantido, não bloqueado por regras de tenant.

### Caso 2: Mudança de Perfil com Dados Existentes
**Cenário:** Usuário promovido de GESTOR para ADMINISTRADOR.  
**Comportamento:** Permissões atualizadas imediatamente, acesso global concedido.

### Caso 3: Transferência de Empresa
**Cenário:** GESTOR muda de empresa A para B.  
**Comportamento:** Perde acesso à empresa A, ganha acesso à empresa B.

---

## 📚 Referências

- **Multi-Tenant:** [RN-SEC-002](./multi-tenant.md)
- **Autenticação:** [RN-SEC-001](./session-policy.md)
- **Implementação:** [usuarios.service.ts](../../../backend/src/modules/usuarios/usuarios.service.ts)
- **Guards:** [auth/guards/](../../../backend/src/modules/auth/guards/)

---

**Aprovado por:** Business Analyst  
**Implementado em:** 2026-02-04 (consolidação)  
**Próxima Revisão:** 2026-05-04 (trimestral - alta criticidade)