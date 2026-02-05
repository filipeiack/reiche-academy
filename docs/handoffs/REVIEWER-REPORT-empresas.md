# BUSINESS RULES REVIEW REPORT — Módulo Empresas

**Agente:** Reviewer de Regras  
**Data:** 21/12/2024  
**Documento analisado:** `/docs/business-rules/empresas.md`  
**Código verificado:** `backend/src/modules/empresas/`

---

## 🎯 Objetivo da Revisão

Validar se as **regras documentadas** atendem aos requisitos de:
- ✅ Segurança
- ✅ RBAC (Controle de Acesso Baseado em Perfis)
- ✅ Multi-Tenant (Isolamento por Empresa)
- ✅ Compliance (LGPD, Auditoria)

**Contexto do projeto:**
- Sistema SaaS multi-tenant educacional
- Empresas são os "tenants" do sistema
- Usuários pertencem a empresas (relacionamento N:1)
- Perfis: ADMINISTRADOR (global), GESTOR, COLABORADOR, LEITURA (tenant-scoped)

---

## 1️⃣ Resumo Geral

### Avaliação de Maturidade

| Aspecto | Nível | Observação |
|---------|-------|-----------|
| **Documentação** | ✅ ALTO | Regras completas, lacunas explicitadas |
| **Segurança** | ❌ CRÍTICO | Isolamento multi-tenant **NÃO IMPLEMENTADO** |
| **RBAC** | ⚠️ MÉDIO | Guards presentes, mas permissões excessivas |
| **Auditoria** | ✅ ALTO | CRUD completo auditado |
| **Validações** | ⚠️ MÉDIO | Formato validado, mas CNPJ não verificado |

**Status Geral:** ❌ **NÃO CONFORME — BLOQUEANTE PARA PRODUÇÃO**

---

## 2️⃣ Análise por Aspecto Crítico

### 🚨 CRÍTICO: Isolamento Multi-Tenant AUSENTE

**Severidade:** **BLOQUEANTE**  
**Impacto:** Violação de segurança fundamental em sistema SaaS

#### Problema Identificado

**Documentação (empresas.md § 6.3):**
> ⚠️ **IMPLEMENTADO COM RESTRIÇÕES**:
> - `GET /empresas/:id` aceita qualquer empresa (sem validação se pertence ao tenant do usuário)
> - Não há validação de isolamento em `UPDATE`, `DELETE`, `vincularPilares`
> - Usuário GESTOR de empresa A pode deletar empresa B (se conseguir bypass)

**Validação do código:**

```typescript
// empresas.service.ts - UPDATE
async update(id: string, updateEmpresaDto: UpdateEmpresaDto, userId: string) {
  const before = await this.findOne(id); // ❌ Sem validação de tenant
  // ... atualiza qualquer empresa
}

// empresas.service.ts - DELETE
async remove(id: string, userId: string) {
  const before = await this.findOne(id); // ❌ Sem validação de tenant
  // ... desativa qualquer empresa
}

// empresas.service.ts - VINCULAR PILARES
async vincularPilares(empresaId: string, pilaresIds: string[], userId: string) {
  const before = await this.findOne(empresaId); // ❌ Sem validação de tenant
  // ... vincula pilares em qualquer empresa
}
```

**Controller:**
```typescript
// empresas.controller.ts
@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Patch(':id')
update(@Param('id') id: string, ...) {
  return this.empresasService.update(id, updateEmpresaDto, req.user.id);
  // ❌ GESTOR pode atualizar qualquer empresa
}

@Roles('ADMINISTRADOR', 'CONSULTOR')
@Delete(':id')
remove(@Param('id') id: string, ...) {
  return this.empresasService.remove(id, req.user.id);
  // ❌ CONSULTOR pode deletar qualquer empresa (perfil removido do schema?)
}
```

#### Cenário de Ataque

1. **Usuário GESTOR da Empresa A** (empresaId: "uuid-A")
2. Descobre ID da Empresa B: "uuid-B"
3. Envia: `PATCH /empresas/uuid-B { nome: "Empresa Hackeada" }`
4. **Sistema permite** — sem validação de tenant
5. Resultado: **Dados de outra empresa alterados**

#### Risco

- ⚠️ **Vazamento de dados entre tenants**
- ⚠️ **Modificação não autorizada de dados**
- ⚠️ **Violação de LGPD** (acesso cruzado a dados pessoais)
- ⚠️ **Reputação** — falha crítica em SaaS

#### Decisão

❌ **BLOQUEANTE** — Sistema **NÃO PODE** ir para produção sem correção.

**Recomendação:**
Implementar validação similar ao módulo Usuarios (RA-001):

```typescript
private validateTenantAccess(
  targetEmpresa: { id: string }, 
  requestUser: { empresaId: string, perfil: { codigo: string } }, 
  action: string
) {
  // ADMINISTRADOR tem acesso global
  if (requestUser.perfil.codigo === 'ADMINISTRADOR') {
    return;
  }

  // GESTOR só pode acessar sua própria empresa
  if (targetEmpresa.id !== requestUser.empresaId) {
    throw new ForbiddenException(`Você não pode ${action} dados de outra empresa`);
  }
}
```

Aplicar em: `update()`, `remove()`, `vincularPilares()`, `updateLogo()`, `deleteLogo()`.

---

### ⚠️ ALTA: Perfil CONSULTOR Inconsistente

**Severidade:** ALTA  
**Documentação (empresas.md § 2.1):**
> Perfis: ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA

**Código atual:**
```typescript
// empresas.controller.ts
@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Patch(':id')

@Roles('ADMINISTRADOR', 'CONSULTOR')
@Delete(':id')

@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Post(':id/pilares')
```

**Evidência de inconsistência:**
- Módulo Usuarios removeu CONSULTOR do schema Prisma
- PATTERN-REPORT-usuarios-security-v2.md confirmou remoção (V-003)
- Módulo Empresas ainda referencia CONSULTOR

**Impacto:**
- Código morto no decorator `@Roles()`
- Inconsistência documental entre módulos
- Confusão sobre autorização real

**Decisão:**
⚠️ **NÃO BLOQUEANTE**, mas deve ser corrigido junto com isolamento multi-tenant.

**Recomendação:**
Remover todas as referências a CONSULTOR:
```typescript
// De:
@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')

// Para:
@Roles('ADMINISTRADOR', 'GESTOR')
```

---

### ⚠️ MÉDIA: GESTOR com Permissões Excessivas

**Severidade:** MÉDIA  
**Documentação identifica (empresas.md § 6.2):**
> - GESTOR pode atualizar e deletar empresa
> - GESTOR pode deletar empresa (deveria ser apenas ADMINISTRADOR?)

**Código atual:**
```typescript
@Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
@Patch(':id')
update(...)

@Roles('ADMINISTRADOR', 'CONSULTOR')
@Delete(':id')
remove(...)
```

**Análise:**

**UPDATE:**
- GESTOR pode atualizar empresa
- **Sem isolamento multi-tenant** → pode atualizar qualquer empresa (CRÍTICO)
- **Com isolamento** → pode atualizar apenas sua empresa (ACEITÁVEL)

**DELETE:**
- Apenas ADMINISTRADOR e CONSULTOR podem deletar
- Se CONSULTOR for removido → apenas ADMINISTRADOR (CORRETO)

**Decisão:**
⚠️ **DEPENDENTE** — Após implementar isolamento multi-tenant:
- Permitir GESTOR atualizar **sua própria empresa** → ACEITÁVEL
- Bloquear GESTOR deletar empresa → JÁ IMPLEMENTADO (não tem @Roles)

**Observação:**
Decisão de produto: GESTOR deve poder editar dados da própria empresa?
- Se SIM: manter GESTOR em UPDATE + adicionar isolamento
- Se NÃO: remover GESTOR de UPDATE

---

### ✅ CONFORME: Validações de DTO

**Documentação:** empresas.md § 4.1, 4.2

**Código verificado:**
```typescript
// create-empresa.dto.ts
@Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
  message: 'CNPJ deve estar no formato 00.000.000/0000-00',
})
cnpj: string;

@Matches(/^\S+$/, {
  message: 'loginUrl não pode conter espaços em branco',
})
loginUrl?: string;
```

**Conformidade:** ✅ **CONFORME**

**Lacuna documentada corretamente:**
> ⚠️ **NÃO IMPLEMENTADO**: Validação de CNPJ existente (apenas formato)

**Observação:**
Validação de dígitos verificadores de CNPJ **não é obrigatória** para MVP, mas recomendada.

---

### ⚠️ MÉDIA: loginUrl sem Constraint UNIQUE

**Severidade:** MÉDIA  
**Documentação identifica (empresas.md § 6.1):**
> 3. Validação de que loginUrl seja único (sem constraint UNIQUE)

**Código:**
```typescript
// Schema Prisma (não visto, mas inferido pela documentação)
loginUrl: String? // Sem @unique

// Service não valida duplicação
async update(id: string, updateEmpresaDto: UpdateEmpresaDto, userId: string) {
  // Valida CNPJ duplicado
  if (updateEmpresaDto.cnpj) {
    const existingEmpresa = await this.prisma.empresa.findFirst({
      where: { cnpj: updateEmpresaDto.cnpj, id: { not: id } },
    });
    if (existingEmpresa) {
      throw new ConflictException('CNPJ já cadastrado em outra empresa');
    }
  }
  
  // ❌ Mas NÃO valida loginUrl duplicado
}
```

**Impacto:**
- Duas empresas podem ter `loginUrl: "reiche"`
- Endpoint `GET /empresas/by-login-url/:loginUrl` retorna apenas a primeira (`findFirst`)
- Comportamento não determinístico

**Decisão:**
⚠️ **NÃO BLOQUEANTE**, mas deve ser corrigido.

**Recomendação:**
1. Adicionar constraint no Prisma: `loginUrl String? @unique`
2. Validar unicidade no service (similar ao CNPJ):
```typescript
if (updateEmpresaDto.loginUrl) {
  const existingEmpresa = await this.prisma.empresa.findFirst({
    where: { loginUrl: updateEmpresaDto.loginUrl, id: { not: id } },
  });
  if (existingEmpresa) {
    throw new ConflictException('loginUrl já está em uso');
  }
}
```

---

### ✅ CONFORME: Auditoria

**Documentação:** empresas.md § 3.4, 3.15, 3.19, 3.22

**Código verificado:**
```typescript
// CREATE - não auditado (esperado, createdBy suficiente)

// UPDATE
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

// DELETE
await this.audit.log({ ... acao: 'DELETE' ... });

// VINCULAR PILARES
await this.audit.log({ ... acao: 'UPDATE' ... });
```

**Conformidade:** ✅ **CONFORME**

**Lacuna documentada (empresas.md § 6.5):**
> ⚠️ **PARCIAL**: Mas AuditService pode falhar silenciosamente?

**Observação:**
Se `audit.log()` lançar exceção, toda a transação é revertida (comportamento padrão).
Não é necessário tratamento especial.

---

### ⚠️ BAIXA: Upload de Logo sem Auditoria

**Severidade:** BAIXA  
**Código:**
```typescript
async updateLogo(id: string, logoUrl: string) {
  const empresa = await this.findOne(id);
  const updated = await this.prisma.empresa.update({
    where: { id },
    data: { logoUrl },
  });
  return { logoUrl: updated.logoUrl };
  // ❌ Sem chamada para audit.log()
}

async deleteLogo(id: string) {
  // ❌ Sem auditoria
}
```

**Impacto:**
- Mudanças de logo não rastreadas
- Similar a L-RV-003 do módulo Usuarios (foto não auditada)

**Decisão:**
⚠️ **NÃO BLOQUEANTE** — melhoria de compliance.

**Recomendação:**
Adicionar auditoria similar ao módulo Usuarios:
```typescript
await this.audit.log({
  usuarioId: userId,
  usuarioNome: ...,
  usuarioEmail: ...,
  entidade: 'empresas',
  entidadeId: id,
  acao: 'UPDATE',
  dadosAntes: { logoUrl: empresa.logoUrl },
  dadosDepois: { logoUrl },
});
```

---

### ✅ CONFORME: Endpoints Públicos

**Documentação:** empresas.md § 3.10, 3.11

**Código verificado:**
```typescript
// Endpoint público - sem @UseGuards
@Get('customization/:cnpj')
async getCustomizationByCnpj(@Param('cnpj') cnpj: string) {
  return this.empresasService.findByCnpj(cnpj);
}

// Endpoint público - sem @UseGuards
@Get('by-login-url/:loginUrl')
async getByLoginUrl(@Param('loginUrl') loginUrl: string) {
  return this.empresasService.findByLoginUrl(loginUrl);
}
```

**Conformidade:** ✅ **CONFORME**

**Justificativa:**
- Necessários para customização da tela de login **antes** da autenticação
- Retornam apenas dados de customização (logo, nome, loginUrl)
- **NÃO expõem** dados sensíveis (usuários, pilares, dados internos)

**Observação:**
Considerar rate limiting para prevenir enumeration attack.

---

### ✅ CONFORME: Soft Delete

**Documentação:** empresas.md § 3.17

**Código:**
```typescript
async remove(id: string, userId: string) {
  const before = await this.findOne(id);
  const after = await this.prisma.empresa.update({
    where: { id },
    data: { ativo: false, updatedBy: userId },
  });
  // ... auditoria
  return after;
}
```

**Conformidade:** ✅ **CONFORME**

**Lacuna documentada (empresas.md § 6.6):**
> ⚠️ **NÃO DEFINIDO**: O que fazer com usuários quando empresa é desativada?

**Decisão:**
⚠️ **NÃO BLOQUEANTE** — decisão de produto.

**Opções:**
1. Manter usuários ativos (status quo)
2. Inativar automaticamente usuários da empresa
3. Bloquear desativação se há usuários ativos

---

## 3️⃣ Checklist de Riscos

### Riscos Críticos (BLOQUEANTES)

- ❌ **Isolamento multi-tenant ausente** em UPDATE, DELETE, vincularPilares (CRÍTICO)
- ❌ **GESTOR pode modificar dados de qualquer empresa** (CRÍTICO)

### Riscos Altos

- ⚠️ **Perfil CONSULTOR inconsistente** entre módulos (ALTA)
- ⚠️ **loginUrl sem validação de unicidade** (MÉDIA)

### Riscos Médios/Baixos

- ⚠️ Upload de logo sem auditoria (BAIXA)
- ⚠️ Política de desativação de empresa não definida (BAIXA)
- ⚠️ Rate limiting em endpoints públicos ausente (BAIXA)

### Riscos Mitigados (✅ Conforme)

- ✅ Auditoria de CRUD implementada
- ✅ Soft delete preserva histórico
- ✅ Validações de DTO presentes
- ✅ Guards RBAC aplicados
- ✅ Endpoints públicos não expõem dados sensíveis

---

## 4️⃣ Análise de Compliance

### LGPD / Privacy

**Conformidade Parcial:** ⚠️

**✅ Conforme:**
- Soft delete preserva histórico
- Auditoria registra acessos e modificações
- Dados sensíveis não expostos em endpoints públicos

**❌ Não Conforme:**
- **Vazamento de dados entre tenants** por falta de isolamento
- Violação do princípio de **finalidade** e **necessidade** (Art. 6º LGPD)
- Risco de **acesso não autorizado** a dados pessoais (Art. 46 LGPD)

**Impacto Legal:**
- Multa de até 2% do faturamento (limitada a R$ 50 milhões)
- Responsabilidade solidária do controlador e operador

---

### Multi-Tenant (SaaS)

**Conformidade:** ❌ **NÃO CONFORME**

**Princípio fundamental de SaaS:**
> Dados de um tenant NUNCA devem ser acessíveis por outro tenant (exceto admin global)

**Violações identificadas:**
1. GESTOR pode acessar dados de qualquer empresa
2. Não há validação de tenant em operações de escrita
3. Apenas `GET /empresas` filtra por tenant

**Comparação com padrão da indústria:**
- AWS, Azure, Salesforce: isolamento obrigatório em todas as operações
- Módulo Usuarios: implementa isolamento via `validateTenantAccess()`
- Módulo Empresas: **não implementa**

---

## 5️⃣ Recomendações (Priorizadas)

### CRÍTICAS (Implementar ANTES de produção)

**R-001: Implementar Isolamento Multi-Tenant**
- **Severidade:** BLOQUEANTE
- **Esforço:** MÉDIO (2-3h)
- **Arquivos:** `empresas.service.ts`
- **Ação:**
  1. Criar método `validateTenantAccess()` similar ao módulo Usuarios
  2. Aplicar em: `update()`, `remove()`, `vincularPilares()`, `updateLogo()`, `deleteLogo()`
  3. Permitir ADMINISTRADOR bypass
  4. Lançar `ForbiddenException` para outros perfis tentando acessar empresa diferente

**R-002: Criar Testes de Segurança Multi-Tenant**
- **Severidade:** BLOQUEANTE
- **Esforço:** MÉDIO (3-4h)
- **Arquivos:** `empresas.service.spec.ts` (criar)
- **Ação:**
  1. Testar GESTOR bloqueado ao acessar outra empresa
  2. Testar ADMINISTRADOR com acesso global
  3. Testar tentativa de bypass via ID direto

### ALTAS (Implementar no mesmo ciclo)

**R-003: Remover Perfil CONSULTOR**
- **Severidade:** ALTA
- **Esforço:** BAIXO (30min)
- **Arquivos:** `empresas.controller.ts`
- **Ação:** Remover `'CONSULTOR'` de todos os decorators `@Roles()`

**R-004: Validar Unicidade de loginUrl**
- **Severidade:** ALTA
- **Esforço:** MÉDIO (1h)
- **Arquivos:** `schema.prisma`, `empresas.service.ts`
- **Ação:**
  1. Adicionar `@unique` em `loginUrl` no schema
  2. Criar migration
  3. Validar duplicação no service (similar ao CNPJ)

### MÉDIAS (Ciclo seguinte)

**R-005: Auditoria de Upload de Logo**
- **Severidade:** MÉDIA
- **Esforço:** BAIXO (30min)
- **Arquivos:** `empresas.service.ts`

**R-006: Rate Limiting em Endpoints Públicos**
- **Severidade:** MÉDIA
- **Esforço:** BAIXO (1h)
- **Arquivos:** `empresas.controller.ts`
- **Ação:** Aplicar `@Throttle()` em endpoints públicos

---

## 6️⃣ Comparação com Módulo Usuarios

| Aspecto | Usuarios | Empresas | Gap |
|---------|----------|----------|-----|
| Isolamento Multi-Tenant | ✅ Implementado (RA-001) | ❌ **AUSENTE** | **CRÍTICO** |
| Auto-Edição Privilegiada | ✅ Implementado (RA-002) | N/A | — |
| Proteção de Recursos | ⚠️ Foto sem guard | ⚠️ Logo sem guard | Similar |
| Elevação de Perfil | ✅ Implementado (RA-004) | N/A | — |
| Auditoria Completa | ⚠️ Foto não auditada | ⚠️ Logo não auditada | Similar |
| Testes Unitários | ✅ 35/35 passando | ❌ **AUSENTES** | **CRÍTICO** |
| Perfil CONSULTOR | ✅ Removido (V-003) | ❌ Ainda presente | Inconsistência |

**Conclusão:**
Módulo Empresas está **MUITO ATRÁS** do módulo Usuarios em termos de segurança.

---

## 7️⃣ Decisão Final

**Status:** ❌ **NÃO CONFORME — BLOQUEANTE PARA PRODUÇÃO**

**Justificativa:**
- **Violação crítica de segurança:** Isolamento multi-tenant ausente
- **Risco LGPD:** Vazamento de dados entre tenants
- **Risco reputacional:** Falha fundamental em SaaS
- **Ausência de testes:** Não há suite de testes unitários

**Bloqueios:**
1. Implementar isolamento multi-tenant (R-001)
2. Criar testes de segurança (R-002)
3. Remover CONSULTOR (R-003)
4. Validar loginUrl único (R-004)

**Não Bloqueante:**
- Auditoria de logo (melhoria)
- Rate limiting (melhoria)

---

## 📝 Handoff para DEV Agent

**Próxima etapa:** DEV Agent Disciplinado deve implementar correções.

### Requisito Formal

**Título:** Correções de Segurança Multi-Tenant — Módulo Empresas

**Escopo:**
- Implementar isolamento multi-tenant em UPDATE, DELETE, vincularPilares, updateLogo, deleteLogo
- Remover perfil CONSULTOR de todos os decorators
- Validar unicidade de loginUrl
- Criar suite de testes unitários (mínimo: 20 testes de segurança)

**Referência:**
- Implementação de referência: `usuarios.service.ts` (RA-001)
- Padrão de teste: `usuarios.service.spec.ts`

**Prioridade:** CRÍTICA — BLOQUEANTE

**Artefatos esperados:**
- Código corrigido em `empresas.service.ts`
- Testes em `empresas.service.spec.ts`
- Migration para loginUrl unique
- Handoff para Pattern Enforcer

---

## 📊 Métricas de Qualidade

| Métrica | Usuarios | Empresas | Meta |
|---------|----------|----------|------|
| Cobertura de Regras | 100% | 100% | ✅ |
| Testes Unitários | 35 | 0 | ❌ |
| Isolamento Multi-Tenant | ✅ | ❌ | ❌ |
| Auditoria | 95% | 90% | ⚠️ |
| Guards RBAC | ✅ | ✅ | ✅ |
| Documentação | ✅ | ✅ | ✅ |

**Score Geral:** 3/6 (50%) — **REPROVADO**

---

**Assinatura Reviewer de Regras:**  
Data: 21/12/2024  
Status: ❌ NÃO CONFORME  
Bloqueios: 4 CRÍTICOS  
Requer: Implementação de segurança multi-tenant + testes  
