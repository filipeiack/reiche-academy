# DEV HANDOFF — Correções de Segurança Módulo Usuarios

**Agente:** Dev Agent Disciplinado  
**Data:** 21/12/2024  
**Commits:** dcad616, 06c2159, d7fbc72  
**Próximo agente obrigatório:** Pattern Enforcer

---

## Escopo Implementado

Implementadas as **4 correções críticas de segurança** conforme especificado em:
- `/docs/business-rules/usuarios-review.md`
- `/docs/business-rules/usuarios-fixes.md`

### RA-001: Isolamento Multi-Tenant
✅ **Implementado**
- Método privado `validateTenantAccess()` criado
- Aplicado em: `findById()`, `update()`, `updateProfilePhoto()`, `deleteProfilePhoto()`
- ADMINISTRADOR: acesso global mantido
- Outros perfis: restrição por `empresaId`

### RA-002: Bloqueio de Auto-Edição Privilegiada
✅ **Implementado**
- Validação no método `update()`
- Campos bloqueados para auto-edição: `perfilId`, `empresaId`, `ativo`
- Exceção: ADMINISTRADOR pode alterar qualquer usuário

### RA-003: Proteção de Recursos (Foto)
✅ **Implementado**
- Decorators `@Roles` adicionados aos endpoints de foto
- Validação: apenas ADMINISTRADOR ou próprio usuário pode alterar/deletar foto
- Auditoria de alterações de foto implementada

### RA-004: Restrição de Elevação de Perfil
✅ **Implementado**
- Método privado `validateProfileElevation()` criado
- Baseado no campo `nivel` da tabela `perfis_usuario`
- Aplicado em: `create()`, `update()`
- GESTOR não pode criar/promover para ADMINISTRADOR

---

## Arquivos Alterados

### Backend
```
backend/src/modules/usuarios/
├── usuarios.service.ts        (+117 linhas, -17 linhas)
└── usuarios.controller.ts     (+17 linhas, -0 linhas)
```

### Documentação
```
docs/business-rules/
├── usuarios-implementacao.md  (novo, 322 linhas)
└── usuarios-fixes.md          (atualizado)
```

---

## Alterações Técnicas Detalhadas

### 1. Service (`usuarios.service.ts`)

**Novos métodos privados:**
- `validateTenantAccess(targetUsuario, requestUser, action)`
- `validateProfileElevation(targetPerfilId, requestUser, action)`

**Assinatura de métodos alterada** (agora recebem `requestUser`):
- `create(data, requestUser?)`
- `findById(id, requestUser?)`
- `update(id, data, requestUser)`
- `updateProfilePhoto(id, fotoUrl, requestUser)`
- `deleteProfilePhoto(id, requestUser)`

**Auditoria adicionada em:**
- `updateProfilePhoto()` — registra antes/depois
- `deleteProfilePhoto()` — registra antes/depois

### 2. Controller (`usuarios.controller.ts`)

**Endpoints modificados:**
```typescript
// Antes
create(@Body() dto)
findOne(@Param('id') id)
update(@Param('id') id, @Body() dto)
uploadProfilePhoto(@Param('id') id, @UploadedFile() file)
deleteProfilePhoto(@Param('id') id)

// Depois (+ @Request() req)
create(@Body() dto, @Request() req)
findOne(@Param('id') id, @Request() req)
update(@Param('id') id, @Body() dto, @Request() req)
uploadProfilePhoto(@Param('id') id, @UploadedFile() file, @Request() req)
deleteProfilePhoto(@Param('id') id, @Request() req)
```

**Guards adicionados:**
```typescript
@Post(':id/foto')
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')  // ← NOVO

@Delete(':id/foto')
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')  // ← NOVO
```

---

## Conformidade com Arquitetura

✅ **Padrões seguidos:**
- NestJS: decorators, guards, exception filters
- Prisma: queries via service
- AuditService: chamadas conforme padrão existente
- DTOs: sem alterações (validações já existentes)

⚠️ **Pendente de validação:**
- Aderência a `/docs/conventions/backend.md`
- Consistência de nomenclatura
- Estrutura de erros conforme padrão

---

## Ambiguidades Encontradas

### A-001: Usuários sem empresa (`empresaId: null`)
**Situação:** Regra RA-001 valida `empresaId` do target.  
**Ambiguidade:** Usuários disponíveis (sem empresa) podem ser acessados por qualquer perfil?  
**Implementação atual:** Validação não trata `null` especificamente.  
**Recomendação:** Definir se usuários disponíveis são visíveis apenas para ADMINISTRADOR.

### A-002: GESTOR pode editar outro GESTOR?
**Situação:** RA-004 valida apenas elevação de perfil.  
**Ambiguidade:** GESTOR da Empresa A pode editar GESTOR da mesma empresa?  
**Implementação atual:** RA-001 bloqueia entre empresas, mas permite dentro da mesma.  
**Recomendação:** Documentar hierarquia horizontal (mesmos níveis).

### A-003: Perfil CONSULTOR ainda no código
**Situação:** Controller ainda referencia `'CONSULTOR'` em alguns endpoints.  
**Ambiguidade:** Perfil foi removido mas código não foi limpo.  
**Implementação atual:** Mantido conforme estava.  
**Recomendação:** Remover referências se perfil for descontinuado.

---

## Testes de Suporte Criados

⚠️ **Testes criados durante implementação:**
- Arquivo: `backend/src/modules/usuarios/usuarios.service.spec.ts`
- Total: 23 testes unitários
- Cobertura: RA-001 a RA-004 + RN-001 + auditoria

**IMPORTANTE:** Estes testes foram criados **pelo DEV** e podem conter viés de confirmação.  
**Ação recomendada:** QA Unitário Estrito deve revisar/reescrever independentemente.

---

## Validações Pendentes

- [ ] **Pattern Enforcer** — verificar aderência a convenções
- [ ] **QA Unitário Estrito** — criar/validar testes independentes
- [ ] **Reviewer de Regras** — confirmar se correções atendem review original

---

## Decisões Técnicas Tomadas

1. **Validações no Service, não no Controller**
   - Motivo: Controllers podem ser bypassados (GraphQL, outros entry points)
   - Garante proteção em qualquer forma de acesso

2. **requestUser obrigatório em métodos sensíveis**
   - Permite validações contextuais
   - Mantém retrocompatibilidade com `requestUser?: any` onde aplicável

3. **ForbiddenException para violações de segurança**
   - HTTP 403 é semanticamente correto
   - Diferencia de 401 (não autenticado) e 400 (bad request)

4. **Auditoria de foto usa requestUser.id, não target.id**
   - Registra quem executou a ação, não quem foi afetado
   - Alinhado com auditoria de outras operações

---

## Breaking Changes

⚠️ **Potenciais quebras:**

1. **Assinatura de métodos do Service**
   - Código que chama `update()` sem `requestUser` ainda funciona (parâmetro opcional)
   - Mas validações de segurança SÓ ocorrem se `requestUser` for fornecido

2. **Endpoints de foto agora exigem autenticação com perfil**
   - Antes: qualquer usuário autenticado
   - Depois: precisa ser ADMINISTRADOR, GESTOR ou COLABORADOR

3. **Usuários não podem mais se auto-promover**
   - Comportamento anterior permitia via API
   - Frontend já bloqueava UI

---

## Próximo Agente Obrigatório

**Pattern Enforcer** deve validar:

1. **Aderência a `/docs/conventions/backend.md`:**
   - Nomenclatura de métodos privados
   - Estrutura de exceções
   - Padrão de auditoria

2. **Aderência a `/docs/architecture/backend.md`:**
   - Separação de responsabilidades
   - Uso correto de guards vs. validações
   - DTOs vs. validações de negócio

3. **Consistência com código existente:**
   - Outros módulos seguem mesmo padrão?
   - Guards em todos os endpoints sensíveis?
   - Auditoria completa em operações críticas?

**Bloqueio:** Se Pattern Enforcer retornar `NÃO CONFORME`, correções devem ser feitas antes de prosseguir para QA.

---

## Artefatos Gerados

1. Código de produção (commit dcad616)
2. Relatório de implementação (commit 06c2159)
3. Atualização de plano de correções (commit d7fbc72)
4. Este handoff (em criação)

---

**Status:** ✅ Implementação concluída, aguardando validação de Pattern Enforcer  
**Branch:** main  
**Pronto para:** Pattern Enforcement

---

**Assinatura Digital:** Dev Agent Disciplinado  
**Timestamp:** 21/12/2024
