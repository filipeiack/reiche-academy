# PATTERN ENFORCEMENT REPORT — Correções de Segurança Módulo Usuarios

**Agente:** Pattern Enforcer  
**Data:** 21/12/2024  
**Handoff analisado:** DEV-to-PATTERN-usuarios-security.md  
**Commits verificados:** dcad616, 06c2159, d7fbc72

---

## Escopo da Análise

**Área:** Backend (NestJS)  
**Arquivos analisados:**
- `backend/src/modules/usuarios/usuarios.service.ts`
- `backend/src/modules/usuarios/usuarios.controller.ts`

**Convenções aplicadas:**
- `/docs/conventions/backend.md`
- `/docs/architecture/backend.md`

---

## ✅ Conformidades Detectadas

### 1. Estrutura de Service
✅ **CONFORME** — `/docs/conventions/backend.md` § 3 (Services)
- Service usa `@Injectable()` decorator
- Injeção de dependências via constructor com `private`
- Métodos assíncronos com `async/await`
- Auditoria via `AuditService` injetado

### 2. Métodos Privados
✅ **CONFORME** — Convenção observada no código existente
- `validateTenantAccess()` — privado, prefixo `validate`
- `validateProfileElevation()` — privado, prefixo `validate`
- `getAbsolutePublicPath()` — privado, helper
- `deleteFileIfExists()` — privado, helper

### 3. Tratamento de Erros
✅ **CONFORME** — `/docs/conventions/backend.md` § 5 (Tratamento de Erros)
- `NotFoundException` para recurso não encontrado
- `ForbiddenException` para violações de segurança
- `ConflictException` para conflitos de email
- Mensagens em português

### 4. Auditoria
✅ **CONFORME** — `/docs/conventions/backend.md` § 10 (Auditoria)
- Chamadas ao `AuditService.log()`
- Campos obrigatórios: usuarioId, usuarioNome, usuarioEmail, entidade, entidadeId, acao
- `dadosAntes` e `dadosDepois` preservados
- Campo `senha` redatado: `[REDACTED]`

### 5. Hash de Senha
✅ **CONFORME** — `/docs/conventions/backend.md` § 3 (Services)
- Usa `argon2.hash()` (nunca bcrypt)
- Hash aplicado antes de `create()` e `update()`

### 6. Select Seletivo
✅ **CONFORME** — `/docs/conventions/backend.md` § 3 (Services)
- Todas as queries usam `.select()` explícito
- Campo `senha` nunca retornado em queries

### 7. Controller
✅ **CONFORME** — `/docs/conventions/backend.md` § 2 (Controllers)
- Controller continua fino, delega lógica para service
- Decorators `@ApiTags()`, `@ApiBearerAuth()`, `@ApiOperation()` presentes
- Guards `@UseGuards(JwtAuthGuard, RolesGuard)` aplicados ao controller
- `@Roles()` decorator por endpoint

### 8. Assinatura de Parâmetros
✅ **CONFORME** — Convenção observada no código existente
- `@Body()` para DTOs
- `@Param('id')` para IDs
- `@Request()` para acesso ao `req.user`
- `@UploadedFile()` para upload de arquivo

### 9. Nomenclatura
✅ **CONFORME** — `/docs/conventions/backend.md` § 2 (Controllers)
- Métodos: camelCase (`create`, `findById`, `update`, `updateProfilePhoto`, `deleteProfilePhoto`)
- Variáveis: camelCase (`targetUsuario`, `requestUser`, `hashedPassword`)
- Métodos privados: prefixos descritivos (`validate`, `get`, `delete`)

### 10. Guards em Endpoints de Foto
✅ **CONFORME** — `/docs/conventions/backend.md` § 6 (Autenticação e Guards)
- `@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')` adicionado aos endpoints de foto
- Alinhado com padrão existente

---

## ⚠️ Violações Detectadas

### V-001: Parâmetro `requestUser` Opcional em Métodos de Validação
**Severidade:** ALTA  
**Regra violada:** `/docs/conventions/backend.md` § 3 (Services) — Validações devem ser obrigatórias  
**Local do código:**
- [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L100) — `create(data: any, requestUser?: any)`
- [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L120) — `findById(id: string, requestUser?: any)`

**Descrição:**
Parâmetro `requestUser?` é opcional em `create()` e `findById()`, mas as validações de segurança (RA-001, RA-004) **só ocorrem quando fornecido**. Isso cria brecha: se controller não passar `requestUser`, validações são puladas.

**Impacto:** 
Código vulnerável se endpoint chamar `create()` sem `requestUser` — validação de elevação de perfil seria ignorada.

**Correção recomendada:**
Tornar `requestUser` obrigatório em todos os métodos que fazem validações de segurança:
```typescript
// De:
async create(data: any, requestUser?: any)
async findById(id: string, requestUser?: any)

// Para:
async create(data: any, requestUser: any)
async findById(id: string, requestUser: any)
```

Se retrocompatibilidade for necessária, criar métodos separados (ex: `createUnsafe()` vs `create()`).

---

### V-002: Tipo `any` em Parâmetros
**Severidade:** MÉDIA  
**Regra violada:** Boas práticas TypeScript (não documentado explicitamente, mas observado no código)  
**Local do código:**
- [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L24) — `validateTenantAccess(targetUsuario: any, requestUser: any, action: string)`
- [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L40) — `validateProfileElevation(targetPerfilId: string, requestUser: any, action: string)`
- [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L100) — `create(data: any, requestUser?: any)`
- [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L137) — `update(id: string, data: any, requestUser: any)`

**Descrição:**
Múltiplos parâmetros tipados como `any` reduzem segurança de tipos. Código existente usa `any` em alguns places, mas DTOs deveriam ser usados onde aplicável.

**Impacto:**
Perda de autocomplete, verificação de tipos em tempo de desenvolvimento, maior risco de bugs.

**Correção sugerida:**
- `data` → usar DTOs existentes (`CreateUsuarioDto`, `UpdateUsuarioDto`)
- `requestUser` → criar interface `RequestUser` com campos esperados
- `targetUsuario` → inferir tipo do Prisma client

Exemplo:
```typescript
interface RequestUser {
  id: string;
  perfil: { codigo: string; nivel: number };
  empresaId: string | null;
  nome: string;
  email: string;
}

private validateTenantAccess(
  targetUsuario: Usuario, 
  requestUser: RequestUser, 
  action: string
)
```

**Observação:** Este padrão (`any`) é observado em outros services do projeto (inconsistência geral), mas não é uma best practice.

---

### V-003: CONSULTOR no Type, Ausente no Schema
**Severidade:** BAIXA  
**Regra violada:** `/docs/conventions/backend.md` § 6 (Guards e Roles) — Perfis devem estar sincronizados  
**Local do código:**
- [usuarios.controller.ts](backend/src/modules/usuarios/usuarios.controller.ts#L56) — `@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')`

**Descrição:**
Endpoint `findOne()` autoriza perfil `'CONSULTOR'`, mas este perfil não existe no schema Prisma (foi removido em migration anterior).

**Impacto:**
Role guard nunca concederá acesso para perfil inexistente. Potencial código morto.

**Correção recomendada:**
Remover `'CONSULTOR'` de todos os `@Roles()` decorators:
```typescript
// De:
@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')

// Para:
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
```

**Nota:** DEV identificou esta inconsistência no handoff (A-003), mas não corrigiu.

---

## 🔍 Ambiguidades Não Resolvidas

### A-001: Usuários sem Empresa (`empresaId: null`)
**Descrição:** DEV identificou ambiguidade no handoff.  
**Questão:** RA-001 valida `empresaId` do target, mas não trata `null` especificamente.  
**Código atual:**
```typescript
if (targetUsuario.empresaId !== requestUser.empresaId) {
  throw new ForbiddenException(...)
}
```
Se `targetUsuario.empresaId === null` e `requestUser.empresaId === "uuid-empresa"`, validação bloqueia acesso.

**Recomendação:** Definir em `/docs/business-rules/usuarios.md` se:
- Usuários disponíveis são visíveis apenas para ADMINISTRADOR
- OU qualquer GESTOR pode visualizar (para recrutamento)

**Status:** Não pode ser resolvido por Pattern Enforcer (requer decisão de negócio).

---

### A-002: GESTOR Pode Editar Outro GESTOR da Mesma Empresa?
**Descrição:** DEV identificou ambiguidade no handoff.  
**Questão:** RA-004 valida apenas elevação vertical (níveis), não horizontal (mesmo nível).  
**Código atual:** Permitiria GESTOR editar outro GESTOR.

**Recomendação:** Documentar hierarquia horizontal em `/docs/business-rules/usuarios.md`.

**Status:** Não pode ser resolvido por Pattern Enforcer (requer decisão de negócio).

---

## 📊 Análise de Consistência

### Padrões Mantidos
✅ Estrutura de services (injeção, async/await)  
✅ Nomenclatura de métodos (camelCase)  
✅ Auditoria (chamadas ao AuditService)  
✅ Hash de senha (argon2)  
✅ Exceções do NestJS  
✅ Select seletivo (nunca retorna senha)  
✅ Guards e Roles  
✅ Documentação Swagger

### Inconsistências Introduzidas
❌ Parâmetro opcional `requestUser?` cria brecha de segurança  
❌ Tipo `any` em validações (diverge de DTOs em outros métodos)  
❌ Perfil `CONSULTOR` ainda referenciado (código morto)

---

## 🎯 Conclusão

**Status Geral:** ❌ **NÃO CONFORME**

**Justificativa:**
Violação **V-001** (Alta Severidade) cria brecha de segurança real. Validações de segurança críticas (RA-001, RA-004) podem ser puladas se `requestUser` não for fornecido, contrariando o objetivo das correções.

**Bloqueio:** Conforme `/docs/FLOW.md`, código NÃO CONFORME bloqueia avanço para QA.

---

## 📋 Checklist de Correções Obrigatórias

Antes de prosseguir para QA Unitário Estrito, corrigir:

- [ ] **V-001 (CRÍTICO):** Tornar `requestUser` obrigatório em `create()`, `findById()`
- [ ] **V-002 (RECOMENDADO):** Substituir `any` por tipos específicos (DTOs, interfaces)
- [ ] **V-003 (BAIXA):** Remover `'CONSULTOR'` de todos os `@Roles()`

**Ambiguidades para documentação:**
- [ ] **A-001:** Definir visibilidade de usuários disponíveis em business rules
- [ ] **A-002:** Documentar hierarquia horizontal (mesmo nível)

---

## 🔄 Próximo Agente

❌ **BLOQUEADO** — QA Unitário Estrito não pode prosseguir até correções.

Após correções do DEV:
1. Gerar novo handoff
2. Pattern Enforcer reavalia
3. Se CONFORME → segue para QA

---

**Assinatura Digital:** Pattern Enforcer  
**Timestamp:** 21/12/2024  
**Resultado:** NÃO CONFORME (1 violação crítica, 2 recomendações)
