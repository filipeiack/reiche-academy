# DEV HANDOFF — Correções de Conformidade de Padrões

**Agente:** Dev Agent Disciplinado  
**Data:** 21/12/2024  
**Commit:** ecb554c  
**Entrada:** PATTERN-REPORT-usuarios-security.md (NÃO CONFORME)  
**Próximo agente obrigatório:** Pattern Enforcer (reavaliação)

---

## Violações Corrigidas

### V-001: Parâmetro `requestUser` Obrigatório (CRÍTICO)
✅ **RESOLVIDO**

**Problema original:**  
Parâmetro `requestUser?` opcional em `create()` e `findById()` permitia bypass das validações RA-001 e RA-004 se controller não fornecesse o usuário.

**Correção implementada:**
```typescript
// Antes
async create(data: any, requestUser?: any)
async findById(id: string, requestUser?: any)

// Depois
async create(data: CreateUsuarioDto, requestUser: RequestUser)
async findById(id: string, requestUser: RequestUser)
```

**Impacto:**
- Validações de segurança **sempre executam**
- Impossível chamar esses métodos sem contexto de usuário
- Controllers obrigados a passar `req.user`

**Casos especiais:**
Métodos `remove()` e `hardDelete()` chamam `findById()` internamente para auditoria, mas não têm `requestUser` disponível. Criado método privado `findByIdInternal()` para uso interno sem validação multi-tenant.

---

### V-002: Tipos Específicos (MÉDIA)
✅ **RESOLVIDO**

**Problema original:**  
Múltiplos parâmetros tipados como `any` reduziam segurança de tipos.

**Correção implementada:**

1. **Interface RequestUser exportada:**
```typescript
export interface RequestUser {
  id: string;
  perfil: { codigo: string; nivel: number };
  empresaId: string | null;
  nome: string;
  email: string;
}
```

2. **DTOs aplicados:**
```typescript
// Antes
async create(data: any, requestUser?: any)
async update(id: string, data: any, requestUser: any)

// Depois
async create(data: CreateUsuarioDto, requestUser: RequestUser)
async update(id: string, data: UpdateUsuarioDto, requestUser: RequestUser)
```

3. **Métodos privados tipados:**
```typescript
private validateTenantAccess(
  targetUsuario: { empresaId: string | null }, 
  requestUser: RequestUser, 
  action: string
)

private async validateProfileElevation(
  targetPerfilId: string, 
  requestUser: RequestUser, 
  action: string
)
```

**Observação técnica:**  
Validação de campos proibidos em `update()` requer type assertion devido a limitação do TypeScript com DTOs parciais:
```typescript
const attemptingForbidden = forbiddenFields.some(field => (data as any)[field] !== undefined);
```
Alternativa seria usar Prisma types, mas mantida simplicidade.

---

### V-003: Perfil CONSULTOR Removido (BAIXA)
✅ **RESOLVIDO**

**Problema original:**  
Endpoint `findOne()` autorizava perfil `'CONSULTOR'`, mas este perfil foi removido do schema Prisma em migration anterior.

**Correção implementada:**
```typescript
// Antes
@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')

// Depois
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
```

**Impacto:**  
Apenas limpeza de código morto. Perfil nunca seria concedido pelo guard (inexistente no banco).

---

## Arquivos Alterados

### Backend
```
backend/src/modules/usuarios/
├── usuarios.service.ts        (+14 linhas, -6 linhas)
│   ├── + export interface RequestUser
│   ├── + private findByIdInternal()
│   ├── ~ validateTenantAccess() (tipos)
│   ├── ~ validateProfileElevation() (tipos)
│   ├── ~ create() (obrigatório + DTO)
│   ├── ~ findById() (obrigatório)
│   ├── ~ update() (DTO + type assertion)
│   └── ~ métodos de foto (RequestUser)
└── usuarios.controller.ts     (-1 linha)
    └── ~ findOne() (remove CONSULTOR)
```

### Testes
```
backend/src/modules/usuarios/
└── usuarios.service.spec.ts   (+6 linhas)
    └── ~ Ajustado para passar requestUser + campo cargo
```

---

## Alterações Técnicas Detalhadas

### 1. Interface RequestUser

**Localização:** [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L8-L14)

Exportada para permitir reuso em outros módulos que dependam de UsuariosService.

**Campos:**
- `id` — UUID do usuário autenticado
- `perfil.codigo` — String literal do perfil (ADMINISTRADOR, GESTOR, etc)
- `perfil.nivel` — Número representando hierarquia (menor = mais poder)
- `empresaId` — UUID da empresa ou null (usuários disponíveis)
- `nome`, `email` — Para auditoria

---

### 2. Método findByIdInternal()

**Localização:** [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L161-L191)

**Por que foi criado:**  
Métodos `remove()` e `hardDelete()` precisam buscar usuário para auditoria, mas não têm `requestUser` disponível (são chamados por ADMINISTRADOR com autorização global).

**Diferença de findById():**
- **Não valida** multi-tenant (RA-001)
- Uso restrito a métodos internos do service
- Mantém mesma assinatura de retorno

**Segurança:**  
Endpoints `PATCH :id/inativar` e `DELETE :id` são restritos a `@Roles('ADMINISTRADOR')`, então chamada interna sem validação é segura.

---

### 3. Type Assertion em update()

**Localização:** [usuarios.service.ts](backend/src/modules/usuarios/usuarios.service.ts#L244)

```typescript
const attemptingForbidden = forbiddenFields.some(field => (data as any)[field] !== undefined);
```

**Por que `as any`:**  
`UpdateUsuarioDto` é partial, TypeScript não permite indexação dinâmica. Alternativas:
- Criar type guard para cada campo (verboso)
- Usar Prisma types (perde validação de DTO)
- Type assertion (escolhida por simplicidade)

**Segurança:**  
Array `forbiddenFields` é hardcoded, não há risco de injeção.

---

## Validação de Testes

✅ **35/35 testes passando**

**Testes ajustados:**
1. RN-001 (2 testes) — Adicionado `requestUser` e campo `cargo`
2. RN-002 (1 teste) — Adicionado `requestUser` e campo `cargo`
3. RN-003 (1 teste) — Adicionado `requestUser` e campo `cargo`
4. RA-004 (2 testes) — Adicionado campo `cargo`

**Nenhum teste foi removido ou comportamento alterado.**

---

## Conformidade com Convenções

### Verificado contra `/docs/conventions/backend.md`:

✅ **Estrutura de Service** — `@Injectable()`, injeção via constructor  
✅ **Métodos Privados** — Prefixo `validate`, `findByIdInternal`  
✅ **Tratamento de Erros** — `ForbiddenException`, `NotFoundException`, `ConflictException`  
✅ **DTOs** — `CreateUsuarioDto`, `UpdateUsuarioDto`  
✅ **Nomenclatura** — camelCase, descritiva  
✅ **Auditoria** — Calls to AuditService mantidos  
✅ **Controller** — Permanece fino, delega para service

---

## Ambiguidades Não Resolvidas (Remanescentes)

### A-001: Usuários sem Empresa (`empresaId: null`)
**Status:** Não resolvido (requer decisão de negócio)  
**Questão:** RA-001 bloqueia acesso se `empresaId` não coincidir. Usuários disponíveis (`empresaId: null`) são bloqueados para GESTOR?  
**Recomendação:** Documentar em `/docs/business-rules/usuarios.md`.

### A-002: GESTOR Pode Editar Outro GESTOR?
**Status:** Não resolvido (requer decisão de negócio)  
**Questão:** RA-004 valida elevação vertical, não horizontal. GESTOR pode editar outro GESTOR da mesma empresa?  
**Recomendação:** Documentar hierarquia horizontal.

---

## Breaking Changes

⚠️ **Assinatura de métodos alterada:**

Se algum código externo chamar diretamente `UsuariosService.create()` ou `UsuariosService.findById()` sem `requestUser`, código não compilará.

**Impacto:**  
- Controllers já passam `req.user` ✅
- Seeders/scripts precisarão passar mock de RequestUser ⚠️
- Testes já ajustados ✅

**Exemplo de mock para scripts:**
```typescript
const mockAdmin: RequestUser = {
  id: 'script-admin',
  perfil: { codigo: 'ADMINISTRADOR', nivel: 1 },
  empresaId: null,
  nome: 'Script Admin',
  email: 'script@system',
};

await usuariosService.create(data, mockAdmin);
```

---

## Próximo Agente Obrigatório

**Pattern Enforcer** deve reavaliar:

1. **V-001 resolvido?** requestUser obrigatório implementado  
2. **V-002 resolvido?** Tipos específicos aplicados  
3. **V-003 resolvido?** CONSULTOR removido  
4. **Novas violações introduzidas?** Type assertion, findByIdInternal()

**Bloqueio:** Se ainda NÃO CONFORME, retornar para DEV.  
**Liberação:** Se CONFORME, avançar para QA Unitário Estrito.

---

**Status:** ✅ Correções implementadas, aguardando validação  
**Branch:** main  
**Pronto para:** Pattern Enforcement (reavaliação)

---

**Assinatura Digital:** Dev Agent Disciplinado  
**Timestamp:** 21/12/2024
