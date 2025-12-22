# PATTERN ENFORCER REPORT — Empresas Security

**Agente:** Pattern Enforcer  
**Data:** 21/12/2024  
**Entrada:** DEV-to-PATTERN-empresas-security.md  
**Commits analisados:** c5e5b50, fd5f852, ba32e50  
**Próximo agente obrigatório:** DEV Agent Disciplinado (correções) ou QA Unitário Estrito (se CONFORME)

---

## Status de Conformidade

🔴 **NÃO CONFORME**

**Violações encontradas:** 4  
**Severidade:** 2 CRÍTICAS, 1 ALTA, 1 MÉDIA

**Resumo executivo:**  
A implementação de segurança do módulo empresas apresenta violações críticas de padrão:
1. Interface RequestUser duplicada (violação de DRY)
2. Assinatura inconsistente em updateLogo() e deleteLogo()
3. String vazia permitida em loginUrl (validação incompleta)
4. Auditoria usando busca redundante ao invés de requestUser

Correções obrigatórias antes de prosseguir para QA.

---

## Análise de Violações

### V-001: Interface RequestUser Duplicada (CRÍTICA)
❌ **NÃO CONFORME**

**Localização:**
- [usuarios.service.ts#L10-L16](../../backend/src/modules/usuarios/usuarios.service.ts#L10-L16)
- [empresas.service.ts#L7-L13](../../backend/src/modules/empresas/empresas.service.ts#L7-L13)

**Violação:**  
Mesma interface exportada em dois módulos distintos. Viola princípio DRY (Don't Repeat Yourself).

**Convenção violada:**  
`/docs/conventions/backend.md` — "Tipos compartilhados devem estar em `common/interfaces/`"

**Código atual:**
```typescript
// usuarios.service.ts
export interface RequestUser {
  id: string;
  perfil: { codigo: string; nivel: number };
  empresaId: string | null;
  nome: string;
  email: string;
}

// empresas.service.ts
export interface RequestUser {
  id: string;
  perfil: { codigo: string; nivel: number };
  empresaId: string | null;
  nome: string;
  email: string;
}
```

**Impacto:**
- Drift inevitável: se um módulo alterar interface, outro fica desatualizado
- Dificulta refatoração global
- Violação de single source of truth

**Correção obrigatória:**
```typescript
// Criar: backend/src/common/interfaces/request-user.interface.ts
export interface RequestUser {
  id: string;
  perfil: { codigo: string; nivel: number };
  empresaId: string | null;
  nome: string;
  email: string;
}

// usuarios.service.ts
import { RequestUser } from '../../common/interfaces/request-user.interface';

// empresas.service.ts
import { RequestUser } from '../../common/interfaces/request-user.interface';
```

**Resposta à Questão Q1 do DEV:**  
Opção 2 (interface compartilhada em `common/interfaces/`) é obrigatória. Duplicação não é aceitável.

---

### V-002: Assinatura Inconsistente em updateLogo() e deleteLogo() (CRÍTICA)
❌ **NÃO CONFORME**

**Localização:**
- [empresas.service.ts#L327](../../backend/src/modules/empresas/empresas.service.ts#L327)
- [empresas.service.ts#L338](../../backend/src/modules/empresas/empresas.service.ts#L338)
- [empresas.controller.ts#L165](../../backend/src/modules/empresas/empresas.controller.ts#L165)
- [empresas.controller.ts#L178](../../backend/src/modules/empresas/empresas.controller.ts#L178)

**Violação:**  
Métodos `updateLogo()` e `deleteLogo()` recebem apenas `requestUser`, mas todos os outros métodos recebem `userId` + `requestUser`.

**Código atual:**
```typescript
// Service
async updateLogo(id: string, logoUrl: string, requestUser: RequestUser) { ... }
async deleteLogo(id: string, requestUser: RequestUser) { ... }

// Comparar com:
async update(id: string, updateEmpresaDto: UpdateEmpresaDto, userId: string, requestUser: RequestUser) { ... }
async remove(id: string, userId: string, requestUser: RequestUser) { ... }
async vincularPilares(empresaId: string, pilaresIds: string[], userId: string, requestUser: RequestUser) { ... }

// Controller
return await this.empresasService.updateLogo(id, logoUrl, req.user);
return this.empresasService.deleteLogo(id, req.user);
```

**Problema:**  
- `updateLogo()` e `deleteLogo()` não fazem auditoria, mas deveriam (são operações críticas)
- Inconsistência de padrão: outros métodos recebem `userId` separado
- Se no futuro adicionarem auditoria, precisarão de `userId`

**Convenção violada:**  
Padrão interno observado: todos os métodos CRUD recebem `userId` + `requestUser` para auditoria.

**Correção obrigatória:**
```typescript
// Service
async updateLogo(id: string, logoUrl: string, userId: string, requestUser: RequestUser) {
  const before = await this.findOne(id);
  
  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(before, requestUser, 'alterar logo de');
  
  const after = await this.prisma.empresa.update({
    where: { id },
    data: { logoUrl, updatedBy: userId },
  });

  // Adicionar auditoria
  await this.audit.log({
    usuarioId: userId,
    usuarioNome: requestUser.nome,
    usuarioEmail: requestUser.email,
    entidade: 'empresas',
    entidadeId: id,
    acao: 'UPDATE',
    dadosAntes: before,
    dadosDepois: after,
  });

  return { logoUrl: after.logoUrl };
}

async deleteLogo(id: string, userId: string, requestUser: RequestUser) {
  const before = await this.findOne(id);
  
  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(before, requestUser, 'deletar logo de');

  const after = await this.prisma.empresa.update({
    where: { id },
    data: { logoUrl: null, updatedBy: userId },
  });

  // Adicionar auditoria
  await this.audit.log({
    usuarioId: userId,
    usuarioNome: requestUser.nome,
    usuarioEmail: requestUser.email,
    entidade: 'empresas',
    entidadeId: id,
    acao: 'UPDATE',
    dadosAntes: before,
    dadosDepois: after,
  });

  return { logoUrl: null };
}

// Controller
return await this.empresasService.updateLogo(id, logoUrl, req.user.id, req.user);
return this.empresasService.deleteLogo(id, req.user.id, req.user);
```

**Justificativa:**  
Alteração de logo é operação crítica (afeta identidade visual da empresa). Deve ter auditoria completa.

---

### V-003: String Vazia Permitida em loginUrl (ALTA)
❌ **NÃO CONFORME**

**Localização:**
- [empresas.service.ts#L46-L55](../../backend/src/modules/empresas/empresas.service.ts#L46-L55)
- [empresas.service.ts#L190-L199](../../backend/src/modules/empresas/empresas.service.ts#L190-L199)

**Violação:**  
Validação `if (createEmpresaDto.loginUrl)` não rejeita string vazia. Duas empresas podem ter `loginUrl = ""`, quebrando unicidade.

**Código atual:**
```typescript
// RA-EMP-003: Validar unicidade de loginUrl
if (createEmpresaDto.loginUrl) {
  const existingLoginUrl = await this.prisma.empresa.findFirst({
    where: { loginUrl: createEmpresaDto.loginUrl },
  });

  if (existingLoginUrl) {
    throw new ConflictException('loginUrl já está em uso por outra empresa');
  }
}
```

**Teste de falha:**
```typescript
// Ambas as requisições passam sem erro:
await create({ ..., loginUrl: "" });  // OK (string vazia = falsy)
await create({ ..., loginUrl: "" });  // OK (não valida duplicação)
// Resultado: duas empresas com loginUrl = ""
```

**Convenção violada:**  
`/docs/conventions/backend.md` — "Validações devem ser explícitas e completas, evitando estados inválidos"

**Resposta à Ambiguidade A1:**  
Adicionar validação no DTO é insuficiente (DTO só valida formato, não lógica de negócio). Service também deve validar.

**Correção obrigatória:**
```typescript
// RA-EMP-003: Validar unicidade de loginUrl
if (createEmpresaDto.loginUrl && createEmpresaDto.loginUrl.trim() !== '') {
  const existingLoginUrl = await this.prisma.empresa.findFirst({
    where: { loginUrl: createEmpresaDto.loginUrl },
  });

  if (existingLoginUrl) {
    throw new ConflictException('loginUrl já está em uso por outra empresa');
  }
}

// Aplicar mesma correção em update()
if (updateEmpresaDto.loginUrl && updateEmpresaDto.loginUrl.trim() !== '') {
  const existingLoginUrl = await this.prisma.empresa.findFirst({
    where: {
      loginUrl: updateEmpresaDto.loginUrl,
      id: { not: id },
    },
  });

  if (existingLoginUrl) {
    throw new ConflictException('loginUrl já está em uso por outra empresa');
  }
}
```

**Complementar com validação no DTO:**
```typescript
// dto/create-empresa.dto.ts e update-empresa.dto.ts
@IsOptional()
@IsString()
@IsNotEmpty({ message: 'loginUrl não pode ser vazio' })
loginUrl?: string;
```

---

### V-004: Auditoria com Busca Redundante (MÉDIA)
❌ **NÃO CONFORME**

**Localização:**
- [empresas.service.ts#L218-L220](../../backend/src/modules/empresas/empresas.service.ts#L218-L220)
- [empresas.service.ts#L242-L244](../../backend/src/modules/empresas/empresas.service.ts#L242-L244)
- [empresas.service.ts#L288-L290](../../backend/src/modules/empresas/empresas.service.ts#L288-L290)

**Violação:**  
Auditoria busca nome/email do usuário em `before.usuarios[]`, mas `requestUser` já possui essas informações.

**Código atual:**
```typescript
await this.audit.log({
  usuarioId: userId,
  usuarioNome: before.usuarios?.find(u => u.id === userId)?.nome ?? '',
  usuarioEmail: before.usuarios?.find(u => u.id === userId)?.email ?? '',
  entidade: 'empresas',
  entidadeId: id,
  acao: 'UPDATE',
  dadosAntes: before,
  dadosDepois: after,
});
```

**Problemas:**
1. **Redundância:** Busca desnecessária (requestUser já tem dados)
2. **Falha silenciosa:** Se usuário não estiver na empresa, nome/email ficam vazios
3. **Inconsistência:** Módulo usuarios usa `requestUser` diretamente (verificar padrão)

**Convenção violada:**  
Princípio de eficiência: evitar buscas redundantes quando dados já estão disponíveis.

**Resposta à Questão Q2 do DEV:**  
Opção 2 (usar `requestUser.nome` e `requestUser.email` diretamente) é obrigatória. Simplifica código e garante auditoria completa.

**Correção obrigatória:**
```typescript
await this.audit.log({
  usuarioId: userId,
  usuarioNome: requestUser.nome,
  usuarioEmail: requestUser.email,
  entidade: 'empresas',
  entidadeId: id,
  acao: 'UPDATE',
  dadosAntes: before,
  dadosDepois: after,
});

// Aplicar em todos os métodos:
// - update() linha ~218
// - remove() linha ~242
// - vincularPilares() linha ~288
```

**Validação adicional:**  
Verificar se módulo usuarios já usa esse padrão. Se sim, alinhar; se não, corrigir ambos.

---

## Respostas às Questões do DEV

### Q1: Interface RequestUser duplicada
✅ **RESOLVIDA**

**Decisão:** Opção 2 — Criar `common/interfaces/request-user.interface.ts`

**Justificativa:**
- Interface representa conceito global (usuário autenticado)
- Será usada em múltiplos módulos (usuarios, empresas, futuramente outros)
- Evita drift e mantém single source of truth
- Padrão já estabelecido: `common/` é local para código compartilhado

**Ação obrigatória:** Criar interface compartilhada e refatorar ambos os módulos (usuarios + empresas).

---

### Q2: Auditoria em métodos com requestUser
✅ **RESOLVIDA**

**Decisão:** Opção 2 — Usar `requestUser.nome` e `requestUser.email` diretamente

**Justificativa:**
- Elimina busca redundante
- Garante auditoria completa mesmo se usuário não estiver na empresa
- Código mais limpo e manutenível
- Dados já validados pelo JWT guard

**Ação obrigatória:** Refatorar auditoria em update(), remove(), vincularPilares().

---

### Q3: Tratamento de empresaId null
✅ **RESOLVIDA**

**Decisão:** Opção "confiar na regra de negócio" com adição de defensive programming

**Justificativa:**
- ADMINISTRADOR retorna antes da comparação (early return é seguro)
- GESTOR sempre tem empresaId (validado na criação de usuário)
- Validação explícita adiciona clareza ao código

**Recomendação (opcional mas boa prática):**
```typescript
private validateTenantAccess(targetEmpresa: { id: string }, requestUser: RequestUser, action: string) {
  // ADMINISTRADOR tem acesso global
  if (requestUser.perfil?.codigo === 'ADMINISTRADOR') {
    return;
  }

  // Defensive: usuários sem empresa não têm acesso
  if (!requestUser.empresaId) {
    throw new ForbiddenException(`Você não pode ${action} dados de empresas (usuário sem vínculo)`);
  }

  // GESTOR só pode acessar sua própria empresa
  if (targetEmpresa.id !== requestUser.empresaId) {
    throw new ForbiddenException(`Você não pode ${action} dados de outra empresa`);
  }
}
```

**Ação:** Opcional (não bloqueia aprovação, mas recomendado para robustez).

---

## Avaliação de Ambiguidades

### A1: loginUrl null vs string vazia
**Avaliação:** CRÍTICA — Deve ser corrigida (vide V-003)

**Decisão:**  
Validação em dois níveis:
1. **DTO:** `@IsNotEmpty()` rejeita string vazia
2. **Service:** `loginUrl.trim() !== ''` defesa adicional

**Justificativa:**  
DTO pode ser bypassado em testes ou integrações. Service deve ser defensivo.

---

### A2: Ordem de validações em update()
**Avaliação:** CONFORME

**Decisão:**  
Manter ordem atual (multi-tenant antes de validações de unicidade).

**Justificativa:**
- Segurança > performance
- Não expõe informação de existência de CNPJ/loginUrl
- Padrão defense in depth: validar autorização antes de processar dados

**Recomendação DEV aceita:** Sem alterações necessárias.

---

### A3: Mensagem de erro genérica vs específica
**Avaliação:** CONFORME

**Decisão:**  
Manter mensagem genérica.

**Justificativa:**
- Não expõe informação de existência de empresas
- Previne enumeração de recursos
- Padrão de segurança OWASP: "fail securely"

**Recomendação DEV aceita:** Sem alterações necessárias.

---

## Validações Adicionais

### ✅ Padrões de Código

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Imports organizados** | ✅ CONFORME | NestJS decorators, depois DTOs/services |
| **Comentários de regras** | ✅ CONFORME | Todos os blocos têm `// RA-EMP-XXX` |
| **Tipagem estrita** | ✅ CONFORME | Sem `any` desnecessário |
| **Async/await correto** | ✅ CONFORME | Todos os Promises são awaited |
| **Nomenclatura** | ✅ CONFORME | CamelCase para métodos, kebab-case para rotas |

### ✅ Segurança

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Guards aplicados** | ✅ CONFORME | JwtAuthGuard + RolesGuard em todos os endpoints protegidos |
| **@Roles consistente** | ✅ CONFORME | CONSULTOR removido corretamente (RA-EMP-002) |
| **Isolamento multi-tenant** | ✅ CONFORME | validateTenantAccess() implementado (RA-EMP-001) |
| **Validação de unicidade** | ⚠️ PARCIAL | loginUrl valida, mas aceita string vazia (V-003) |

### ✅ Arquitetura

| Aspecto | Status | Observação |
|---------|--------|------------|
| **Separação controller/service** | ✅ CONFORME | Controller fino, lógica no service |
| **Injeção de dependências** | ✅ CONFORME | PrismaService + AuditService via constructor |
| **DTOs tipados** | ✅ CONFORME | CreateEmpresaDto, UpdateEmpresaDto |
| **Exceptions apropriadas** | ✅ CONFORME | NotFoundException, ConflictException, ForbiddenException |

---

## Comparação com Módulo Usuarios

Validando consistência entre módulos:

| Aspecto | Usuarios | Empresas | Status |
|---------|----------|----------|--------|
| **Interface RequestUser** | Exportada | Exportada duplicada | ❌ Inconsistente (V-001) |
| **validateTenantAccess()** | Implementado | Implementado | ✅ Consistente |
| **Auditoria** | Usa requestUser diretamente | Busca em usuarios[] | ❌ Inconsistente (V-004) |
| **CONSULTOR removido** | Sim | Sim | ✅ Consistente |
| **userId + requestUser** | Todos os métodos | Exceto updateLogo/deleteLogo | ❌ Inconsistente (V-002) |

**Conclusão:** Empresas deve alinhar com padrões de Usuarios.

---

## Checklist de Correções Obrigatórias

### 🔴 CRÍTICAS (bloqueiam aprovação)

- [ ] **V-001:** Criar `common/interfaces/request-user.interface.ts`
  - [ ] Mover interface de usuarios.service.ts
  - [ ] Atualizar import em usuarios.service.ts
  - [ ] Atualizar import em empresas.service.ts
  - [ ] Remover duplicações

- [ ] **V-002:** Corrigir assinatura de updateLogo() e deleteLogo()
  - [ ] Adicionar parâmetro `userId` nos services
  - [ ] Adicionar auditoria completa em ambos
  - [ ] Adicionar `updatedBy` no Prisma update
  - [ ] Atualizar chamadas no controller

### 🟠 ALTA (fortemente recomendado)

- [ ] **V-003:** Validar string vazia em loginUrl
  - [ ] Adicionar `&& loginUrl.trim() !== ''` em create()
  - [ ] Adicionar `&& loginUrl.trim() !== ''` em update()
  - [ ] Adicionar `@IsNotEmpty()` nos DTOs

### 🟡 MÉDIA (melhoria de qualidade)

- [ ] **V-004:** Usar requestUser na auditoria
  - [ ] Substituir busca em update()
  - [ ] Substituir busca em remove()
  - [ ] Substituir busca em vincularPilares()

### 🟢 OPCIONAL (boa prática)

- [ ] **Q3:** Adicionar validação de empresaId null
  - [ ] Adicionar early return para empresaId null

---

## Próximas Etapas Obrigatórias

### Se DEV corrigir violações:
1. **DEV Agent Disciplinado:**
   - Implementar correções V-001, V-002, V-003, V-004
   - Gerar commits isolados por violação
   - Atualizar handoff DEV-to-PATTERN-empresas-security.md (v2)

2. **Pattern Enforcer (re-validação):**
   - Validar conformidade das correções
   - Gerar PATTERN-REPORT-empresas-security-v2.md
   - Status esperado: CONFORME

3. **QA Unitário Estrito (após CONFORME):**
   - Criar testes para RA-EMP-001, RA-EMP-002, RA-EMP-003
   - Validar cenários de violações corrigidas (V-001 a V-004)

### Se aceitar parcialmente:
❌ **NÃO PERMITIDO** — Pattern Enforcer não aceita conformidade parcial. Todas as violações CRÍTICAS e ALTA devem ser corrigidas.

---

## Commits Esperados (DEV)

Após correções, espera-se:
- **Commit 1:** `refactor(common): Criar interface RequestUser compartilhada (V-001)`
- **Commit 2:** `refactor(empresas): Adicionar auditoria em updateLogo/deleteLogo (V-002)`
- **Commit 3:** `fix(empresas): Validar string vazia em loginUrl (V-003)`
- **Commit 4:** `refactor(empresas): Usar requestUser na auditoria (V-004)`

---

## Referências

- **Entrada:** [DEV-to-PATTERN-empresas-security.md](DEV-to-PATTERN-empresas-security.md)
- **Convenções:** [/docs/conventions/backend.md](../conventions/backend.md)
- **Comparação:** [PATTERN-REPORT-usuarios-security-v2.md](PATTERN-REPORT-usuarios-security-v2.md)
- **Commits analisados:**
  - c5e5b50 — feat(empresas): Implementar isolamento multi-tenant (RA-EMP-001)
  - fd5f852 — refactor(empresas): Remover perfil CONSULTOR (RA-EMP-002)
  - ba32e50 — feat(empresas): Validar unicidade de loginUrl (RA-EMP-003)

---

**Status final:** 🔴 **NÃO CONFORME**  
**Violações críticas:** 2  
**Violações alta:** 1  
**Violações média:** 1  
**Próximo agente:** DEV Agent Disciplinado (correções obrigatórias)
