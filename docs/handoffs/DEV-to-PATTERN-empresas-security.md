# DEV HANDOFF — Implementação de Correções de Segurança (Empresas)

**Agente:** Dev Agent Disciplinado  
**Data:** 2024-12-21  
**Commits:** c5e5b50, fd5f852, ba32e50  
**Entrada:** REVIEWER-REPORT-empresas.md (NÃO CONFORME - BLOQUEANTE)  
**Próximo agente obrigatório:** Pattern Enforcer (validação de conformidade)

---

## Violações Corrigidas

### RA-EMP-001: Implementar Isolamento Multi-Tenant (BLOQUEANTE)
✅ **RESOLVIDO**

**Problema original:**  
Endpoints críticos de empresas não validavam isolamento multi-tenant:
- `update()` — Qualquer GESTOR podia alterar qualquer empresa
- `remove()` — Qualquer GESTOR podia desativar qualquer empresa
- `vincularPilares()` — Qualquer GESTOR podia vincular pilares em qualquer empresa
- `updateLogo()` — Qualquer GESTOR podia alterar logo de qualquer empresa
- `deleteLogo()` — Qualquer GESTOR podia deletar logo de qualquer empresa

**Correção implementada:**

1. **Criada interface RequestUser:**
```typescript
export interface RequestUser {
  id: string;
  perfil: { codigo: string; nivel: number };
  empresaId: string | null;
  nome: string;
  email: string;
}
```

2. **Criado método de validação multi-tenant:**
```typescript
/**
 * RA-EMP-001: Valida isolamento multi-tenant
 * ADMINISTRADOR tem acesso global
 * GESTOR só pode acessar sua própria empresa
 */
private validateTenantAccess(
  targetEmpresa: { id: string }, 
  requestUser: RequestUser, 
  action: string
) {
  // ADMINISTRADOR tem acesso global
  if (requestUser.perfil?.codigo === 'ADMINISTRADOR') {
    return;
  }

  // GESTOR só pode acessar sua própria empresa
  if (targetEmpresa.id !== requestUser.empresaId) {
    throw new ForbiddenException(`Você não pode ${action} dados de outra empresa`);
  }
}
```

3. **Aplicado em todos os métodos críticos:**
```typescript
// update()
async update(id: string, updateEmpresaDto: UpdateEmpresaDto, userId: string, requestUser: RequestUser) {
  const before = await this.findOne(id);
  
  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(before, requestUser, 'atualizar');
  // ... resto do método
}

// remove()
async remove(id: string, userId: string, requestUser: RequestUser) {
  const before = await this.findOne(id);
  
  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(before, requestUser, 'desativar');
  // ... resto do método
}

// vincularPilares()
async vincularPilares(id: string, pilaresIds: string[], userId: string, requestUser: RequestUser) {
  const empresa = await this.findOne(id);
  
  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(empresa, requestUser, 'vincular pilares em');
  // ... resto do método
}

// updateLogo()
async updateLogo(id: string, logoPath: string, userId: string, requestUser: RequestUser) {
  const before = await this.findOne(id);
  
  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(before, requestUser, 'atualizar logo de');
  // ... resto do método
}

// deleteLogo()
async deleteLogo(id: string, userId: string, requestUser: RequestUser) {
  const before = await this.findOne(id);
  
  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(before, requestUser, 'deletar logo de');
  // ... resto do método
}
```

4. **Controller atualizado para passar req.user:**
```typescript
// Antes
@Patch(':id')
update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto, @Req() req: any) {
  return this.empresasService.update(id, updateEmpresaDto, req.user.id);
}

// Depois
@Patch(':id')
update(@Param('id') id: string, @Body() updateEmpresaDto: UpdateEmpresaDto, @Req() req: any) {
  return this.empresasService.update(id, updateEmpresaDto, req.user.id, req.user);
}
```

**Impacto:**
- ADMINISTRADOR mantém acesso global a todas as empresas
- GESTOR só pode modificar dados da própria empresa (`empresaId === targetEmpresa.id`)
- Tentativa de acesso cross-tenant retorna `403 Forbidden`
- Isola completamente operações críticas entre tenants

**Commit:** c5e5b50

---

### RA-EMP-002: Remover Perfil CONSULTOR (ALTA)
✅ **RESOLVIDO**

**Problema original:**  
Endpoints de empresas autorizavam perfil `'CONSULTOR'`, mas este perfil foi removido do schema Prisma em migration anterior. Inconsistência com módulo usuarios que já removeu CONSULTOR.

**Correção implementada:**
```typescript
// Endpoints alterados:

// findOne()
// Antes: @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')

// update()
// Antes: @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Roles('ADMINISTRADOR', 'GESTOR')

// remove()
// Antes: @Roles('ADMINISTRADOR', 'CONSULTOR')
@Roles('ADMINISTRADOR')

// vincularPilares()
// Antes: @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Roles('ADMINISTRADOR', 'GESTOR')

// uploadLogo()
// Antes: @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Roles('ADMINISTRADOR', 'GESTOR')

// deleteLogo()
// Antes: @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Roles('ADMINISTRADOR', 'GESTOR')
```

**Impacto:**
- Alinha perfis de acesso com schema Prisma atual
- Remove código morto (perfil nunca seria concedido pelo guard)
- Consistência com módulo usuarios

**Commit:** fd5f852

---

### RA-EMP-003: Validar Unicidade de loginUrl (ALTA)
✅ **RESOLVIDO**

**Problema original:**  
Campo `loginUrl` permite customização de URL de login por empresa, mas não validava unicidade. Possibilidade de conflito se duas empresas cadastrassem mesmo loginUrl.

**Correção implementada:**

1. **Validação no método create():**
```typescript
async create(createEmpresaDto: CreateEmpresaDto, userId: string) {
  const existingEmpresa = await this.prisma.empresa.findUnique({
    where: { cnpj: createEmpresaDto.cnpj },
  });

  if (existingEmpresa) {
    throw new ConflictException('CNPJ já cadastrado');
  }

  // RA-EMP-003: Validar unicidade de loginUrl
  if (createEmpresaDto.loginUrl) {
    const existingLoginUrl = await this.prisma.empresa.findFirst({
      where: { loginUrl: createEmpresaDto.loginUrl },
    });

    if (existingLoginUrl) {
      throw new ConflictException('loginUrl já está em uso por outra empresa');
    }
  }

  const created = await this.prisma.empresa.create({
    data: {
      ...createEmpresaDto,
      createdBy: userId,
    },
  });

  return created;
}
```

2. **Validação no método update():**
```typescript
async update(id: string, updateEmpresaDto: UpdateEmpresaDto, userId: string, requestUser: RequestUser) {
  const before = await this.findOne(id);

  // RA-EMP-001: Validar isolamento multi-tenant
  this.validateTenantAccess(before, requestUser, 'atualizar');

  if (updateEmpresaDto.cnpj) {
    const existingEmpresa = await this.prisma.empresa.findFirst({
      where: {
        cnpj: updateEmpresaDto.cnpj,
        id: { not: id },
      },
    });

    if (existingEmpresa) {
      throw new ConflictException('CNPJ já cadastrado em outra empresa');
    }
  }

  // RA-EMP-003: Validar unicidade de loginUrl
  if (updateEmpresaDto.loginUrl) {
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

  const after = await this.prisma.empresa.update({
    where: { id },
    data: {
      ...updateEmpresaDto,
      updatedBy: userId,
    },
  });
  // ... auditoria
}
```

**Impacto:**
- Previne conflito de URLs customizadas entre empresas
- Validação somente quando `loginUrl` está presente no DTO
- No update, exclui registro atual (`id: { not: id }`)
- Retorna `409 Conflict` se loginUrl duplicado

**Observação técnica:**  
Validação ocorre antes de salvar no banco. Campo `loginUrl` é opcional no DTO, validação só executa se valor fornecido.

**Commit:** ba32e50

---

## Arquivos Alterados

### Backend
```
backend/src/modules/empresas/
├── empresas.service.ts        (+56 linhas, -15 linhas)
│   ├── + export interface RequestUser
│   ├── + private validateTenantAccess()
│   ├── ~ create() (validação loginUrl)
│   ├── ~ update() (requestUser + loginUrl)
│   ├── ~ remove() (requestUser)
│   ├── ~ vincularPilares() (requestUser)
│   ├── ~ updateLogo() (requestUser)
│   └── ~ deleteLogo() (requestUser)
└── empresas.controller.ts     (+6 linhas, -6 linhas)
    ├── ~ update() (passa req.user)
    ├── ~ remove() (passa req.user)
    ├── ~ vincularPilares() (passa req.user)
    ├── ~ uploadLogo() (passa req.user)
    ├── ~ deleteLogo() (passa req.user)
    └── ~ 6 endpoints (remove CONSULTOR)
```

---

## Alterações Técnicas Detalhadas

### 1. Interface RequestUser

**Localização:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L7-L13)

Exportada para permitir reuso em outros módulos que dependam de EmpresasService.

**Campos:**
- `id` — UUID do usuário autenticado
- `perfil.codigo` — String literal do perfil (ADMINISTRADOR, GESTOR, etc)
- `perfil.nivel` — Número representando hierarquia (menor = mais poder)
- `empresaId` — UUID da empresa ou null (usuários disponíveis)
- `nome`, `email` — Para auditoria

**Padrão:** Mesma interface já utilizada no módulo usuarios.

---

### 2. Método validateTenantAccess()

**Localização:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L23-L36)

**Por que foi criado:**  
Centralizar lógica de isolamento multi-tenant para evitar duplicação em 5 métodos.

**Lógica:**
1. Se `requestUser.perfil.codigo === 'ADMINISTRADOR'` → retorna sem validar (acesso global)
2. Se `targetEmpresa.id !== requestUser.empresaId` → lança `ForbiddenException`
3. Caso contrário → acesso permitido

**Segurança:**  
Método privado, chamado após buscar empresa no banco. Valida somente após confirmar que registro existe.

---

### 3. Validação de loginUrl

**Localização:** 
- [empresas.service.ts create()](../../backend/src/modules/empresas/empresas.service.ts#L40-L52)
- [empresas.service.ts update()](../../backend/src/modules/empresas/empresas.service.ts#L178-L190)

**Padrão utilizado:**  
Mesma estratégia de validação de CNPJ:
1. Se campo presente no DTO → busca duplicado no banco
2. No update, exclui registro atual com `id: { not: id }`
3. Se duplicado encontrado → lança `ConflictException`

**Por que `findFirst()` ao invés de `findUnique()`:**  
Campo `loginUrl` não tem constraint UNIQUE no schema (é nullable e opcional). `findFirst()` permite buscar por campo não-unique.

---

## Validação de Testes

⏳ **PENDENTE**

Testes unitários ainda não foram criados. Esta validação será responsabilidade do agente **QA Unitário Estrito** após aprovação do **Pattern Enforcer**.

**Cenários críticos a validar:**
1. **RA-EMP-001:**
   - ADMINISTRADOR pode atualizar qualquer empresa
   - GESTOR só pode atualizar própria empresa (empresaId igual)
   - GESTOR não pode atualizar empresa de outro tenant (403)
   - Aplicado em: update, remove, vincularPilares, updateLogo, deleteLogo

2. **RA-EMP-002:**
   - Perfil CONSULTOR removido de todos os @Roles

3. **RA-EMP-003:**
   - create() rejeita loginUrl duplicado (409)
   - update() rejeita loginUrl duplicado (excluindo registro atual) (409)
   - create() e update() aceitam loginUrl único
   - create() e update() aceitam ausência de loginUrl

---

## Questões para Pattern Enforcer

### Q1: Interface RequestUser duplicada
**Contexto:**  
Mesma interface foi exportada em `usuarios.service.ts` e agora em `empresas.service.ts`. Há duplicação de código.

**Opções:**
1. Manter duplicação (módulos independentes)
2. Criar `common/interfaces/request-user.interface.ts` compartilhado
3. Importar de usuarios.service.ts (cria acoplamento)

**Recomendação DEV:**  
Criar interface compartilhada em `common/interfaces/` para evitar duplicação e manter consistência.

**Decisão pendente:** Pattern Enforcer

---

### Q2: Auditoria em métodos com requestUser
**Contexto:**  
Métodos `update()`, `remove()`, `vincularPilares()`, etc agora recebem `requestUser`, mas auditoria ainda busca nome/email do usuário via:
```typescript
usuarioNome: before.usuarios?.find(u => u.id === userId)?.nome ?? ''
```

**Problema:**  
- `requestUser` já possui `nome` e `email`
- Busca no array `usuarios` é redundante
- Se usuário não estiver na empresa, nome fica vazio

**Opções:**
1. Manter busca atual (não quebra auditoria existente)
2. Usar `requestUser.nome` e `requestUser.email` diretamente
3. Validar se usuário está em `before.usuarios` antes de auditar

**Recomendação DEV:**  
Usar `requestUser.nome` e `requestUser.email` diretamente para simplificar e garantir auditoria completa.

**Decisão pendente:** Pattern Enforcer

---

### Q3: Tratamento de empresaId null
**Contexto:**  
`validateTenantAccess()` compara `targetEmpresa.id !== requestUser.empresaId`, mas `empresaId` pode ser `null` (usuários disponíveis/ADMINISTRADOR).

**Situação atual:**
- ADMINISTRADOR retorna antes da comparação (seguro)
- GESTOR sempre tem `empresaId` não-null (regra de negócio)
- Comparação com `null` nunca acontece na prática

**Questão:**  
Devemos adicionar validação explícita para `empresaId === null` ou confiar na regra de negócio existente?

**Recomendação DEV:**  
Confiar na regra de negócio (GESTOR sempre tem empresa). Adicionar validação seria defensivo, mas não necessário.

**Decisão pendente:** Pattern Enforcer

---

## Ambiguidades Encontradas

### A1: loginUrl null vs string vazia
**Descrição:**  
Campo `loginUrl` aceita `null` no schema Prisma, mas DTO pode enviar string vazia `""`.

**Comportamento atual:**
- Validação `if (createEmpresaDto.loginUrl)` ignora string vazia
- Prisma salva string vazia sem erro
- Duas empresas podem ter `loginUrl = ""`

**Risco:**  
Baixo (frontend não envia string vazia), mas tecnicamente possível via API direta.

**Recomendação:**  
Adicionar validação no DTO: `@IsOptional() @IsNotEmpty() loginUrl?: string`

---

### A2: Ordem de validações em update()
**Descrição:**  
Método `update()` valida na ordem:
1. Busca empresa (`findOne`)
2. Valida multi-tenant
3. Valida CNPJ duplicado
4. Valida loginUrl duplicado
5. Salva no banco

**Questão:**  
Validar CNPJ/loginUrl antes de multi-tenant economiza queries em caso de falha, mas expõe informação (empresa com esse CNPJ existe?) para usuário sem acesso.

**Comportamento atual:**  
Multi-tenant valida primeiro (segurança > performance).

**Recomendação:**  
Manter ordem atual (segurança primeiro).

---

### A3: Mensagem de erro genérica vs específica
**Descrição:**  
`validateTenantAccess()` retorna mensagem genérica:
```
Você não pode ${action} dados de outra empresa
```

**Alternativas:**
- Mensagem genérica (atual) — não expõe se empresa existe
- Mensagem específica — "Empresa X não encontrada ou sem permissão"

**Recomendação:**  
Manter mensagem genérica (segurança).

---

## Próximas Etapas Obrigatórias

1. **Pattern Enforcer:**
   - Validar conformidade com convenções de código
   - Resolver questões Q1, Q2, Q3
   - Avaliar ambiguidades A1, A2, A3
   - Gerar PATTERN-REPORT-empresas-security.md

2. **QA Unitário Estrito (após Pattern CONFORME):**
   - Criar testes para RA-EMP-001, RA-EMP-002, RA-EMP-003
   - Validar cenários de sucesso e erro
   - Confirmar isolamento multi-tenant
   - Gerar QA-REPORT-empresas-security.md

3. **Reviewer de Regras (após QA APROVADO):**
   - Validar alinhamento com FLOW.md
   - Confirmar completude das correções
   - Gerar REVIEWER-REPORT-empresas-security.md

---

## Commits Relacionados

- **c5e5b50** — feat(empresas): Implementar isolamento multi-tenant (RA-EMP-001)
- **fd5f852** — refactor(empresas): Remover perfil CONSULTOR (RA-EMP-002)
- **ba32e50** — feat(empresas): Validar unicidade de loginUrl (RA-EMP-003)

---

## Referências

- **Entrada:** [REVIEWER-REPORT-empresas.md](../handoffs/REVIEWER-REPORT-empresas.md)
- **Regras de negócio:** [empresas.md](../business-rules/empresas.md)
- **Padrão anterior:** [DEV-to-PATTERN-usuarios-security-v2.md](../handoffs/DEV-to-PATTERN-usuarios-security-v2.md)
- **FLOW oficial:** [FLOW.md](../FLOW.md)

---

**Status final:** ✅ TODAS AS CORREÇÕES CRÍTICAS IMPLEMENTADAS  
**Próximo agente:** Pattern Enforcer (validação obrigatória)
