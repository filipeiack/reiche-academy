 # Multi-Tenant Security

**ID:** RN-SEC-002  
**Versão:** 1.1  
**Data:** 2026-02-04  
**Status:** ✅ Ativa  
**Prioridade:** 🔴 Crítica (CVSS 8.5 se violada)

---

## 📋 Visão Geral

Sistema Reiche Academy é **multi-tenant**: múltiplas empresas usam mesma instância do software, mas dados devem ser **estritamente isolados**. Qualquer violação pode resultar em data leakage entre empresas, violação de LGPD e processos judiciais.

**Risco:** Data leakage entre empresas (CVSS 8.5 → 0 se mitigado).

---

## 🎯 Regras de Isolamento

### RN-SEC-002.1: Validação Obrigatória de EmpresaId

**Descrição:**  
> TODA requisição que acessa dados de empresa DEVE validar que usuário pertence àquela empresa.

**Exceção Única:**  
Perfil **ADMINISTRADOR** tem acesso global (todas empresas).

**Implementação Padrão:**
```typescript
// jwt-auth.guard.ts - Validação early-return
if (user.perfil?.codigo !== 'ADMINISTRADOR') {
  const requestedCompanyId = this.extractCompanyIdFromRequest(request);
  
  if (requestedCompanyId && user.empresaId !== requestedCompanyId) {
    throw new ForbiddenException('Acesso não autorizado para esta empresa');
  }
}
```

**Extração de empresaId:**
- `params.empresaId` (rotas `/empresas/:empresaId/...`)
- `query.empresaId` (?empresaId=uuid)
- `body.empresaId` (POST/PUT requests)

**Arquivo:** [jwt-auth.guard.ts](../../../backend/src/modules/auth/guards/jwt-auth.guard.ts)

---

### RN-SEC-002.2: Validação de UUID

**Descrição:**  
> EmpresaId extraído de request DEVE ser UUID válido antes da validação.

**Implementação:**
```typescript
private isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
```

**Justificativa:**  
Previne injection de strings maliciosas como empresaId (SQLi, XSS).

---

### RN-SEC-002.3: Filtro em Queries Prisma

**Descrição:**  
> Services DEVEM filtrar por `empresaId` em TODAS queries de dados de empresa.

**Padrão Obrigatório:**
```typescript
// ❌ ERRADO (vazamento possível)
await this.prisma.usuario.findMany();

// ✅ CORRETO
await this.prisma.usuario.findMany({
  where: { 
    empresaId: requestUser.empresaId,
    ativo: true 
  }
});

// ✅ EXCEÇÃO: ADMINISTRADOR
if (requestUser.perfil.codigo === 'ADMINISTRADOR') {
  // Pode omitir empresaId - acesso global
}
```

**Convenção:**
- SEMPRE receber `requestUser: RequestUser` em métodos de service
- SEMPRE validar `requestUser.empresaId` antes de query
- Usar `.select()` explícito para evitar campos sensíveis

**Aplicado em:**
- usuarios.service.ts
- empresas.service.ts
- cockpit-pilares.service.ts
- pilares-empresa.service.ts
- rotinas-empresa.service.ts

---

## 🔒 Hierarquia de Perfis e Acesso

### Tabela de Isolamento

| Perfil | Acesso Multi-Tenant | Validação EmpresaId | Escopo |
|--------|-------------------|---------------------|--------|
| **ADMINISTRADOR** | ✅ Global (todas empresas) | ❌ Não valida | Sistema |
| **GESTOR** | ❌ Apenas própria empresa | ✅ Valida sempre | Empresa única |
| **COLABORADOR** | ❌ Apenas própria empresa | ✅ Valida sempre | Empresa única |
| **LEITURA** | ❌ Apenas própria empresa | ✅ Valida sempre | Empresa única |

### RN-SEC-002.4: Proteção contra URL Manipulation

**Descrição:**  
> Usuário NÃO PODE acessar dados de outra empresa mudando URL manualmente.

**Cenário de Ataque:**
```
GESTOR Empresa A logado
Acessa: /cockpits/empresa-a/dashboard ✅ Permitido
Tenta: /cockpits/empresa-b/dashboard ❌ Bloqueado com 403
```

**Implementação:**
- **Frontend:** Não exibe links para outras empresas
- **Backend:** Validação em JwtAuthGuard (early return)
- **Service:** Filtro empresaId em queries (defesa em profundidade)

**Teste:** E2E `security-adversarial.spec.ts` - GESTOR tenta acesso cross-tenant.

---

### RN-SEC-002.5: Exceção para ADMINISTRADOR

**Descrição:**  
> Perfil ADMINISTRADOR tem acesso cross-tenant (todas empresas) para suporte.

**Justificativa:**  
- Suporte técnico preciso acessar qualquer empresa
- Gestão de plataforma e configurações globais
- Resolução de problemas sem necessidade de vínculo

**Implementação:**
```typescript
if (user.perfil?.codigo === 'ADMINISTRADOR') {
  // Bypass validação de empresaId
  return true;
}
```

**Auditoria Obrigatória:**  
TODOS acessos de ADMINISTRADOR são logados em `audit_logs`:
```typescript
await this.auditService.log({
  usuarioId: user.id,
  empresaId: requestedCompanyId, // Empresa acessada
  entidade: "cross_tenant_access",
  acao: "READ",
  dadosDepois: { accessedAs: "ADMINISTRADOR" }
});
```

---

## 🚨 Cenários de Ataque Prevenidos

### Ataque 1: URL Manipulation
**Tentativa:** Mudar empresaId na URL (`/empresas/:outra-empresa-id`)  
**Defesa:** JwtAuthGuard bloqueia com 403  
**CVSS:** 8.5 (Critical) → 0 (Mitigado)

### Ataque 2: API Request Tampering
**Tentativa:** Alterar `body.empresaId` em POST  
**Defesa:** Guard valida antes de chegar no controller  
**CVSS:** 7.5 (High) → 0 (Mitigado)

### Ataque 3: Token Manipulation
**Tentativa:** Modificar `empresaId` no JWT payload  
**Defesa:** Assinatura JWT invalida, token rejeitado  
**CVSS:** 9.0 (Critical) → 0 (Mitigado)

### Ataque 4: SQL Injection para Bypass
**Tentativa:** `empresaId=' OR '1'='1`  
**Defesa:** 
1. UUID validation rejeita string inválida
2. Prisma usa parametrização (impossível SQLi)  
**CVSS:** 8.0 (High) → 0 (Mitigado)

### Ataque 5: Direct API Access
**Tentativa:** Chamar API diretamente sem frontend validation  
**Defesa:** Backend validation independentemente de frontend  
**CVSS:** 7.0 (High) → 0 (Mitigado)

---

## 🔧 Implementação Técnica

### Camadas de Defesa

**1. JwtAuthGuard (Early Return):**
```typescript
// Primeira linha de defesa - antes do controller
if (user.perfil?.codigo !== 'ADMINISTRADOR') {
  const requestedCompanyId = this.extractCompanyIdFromRequest(request);
  
  if (requestedCompanyId && user.empresaId !== requestedCompanyId) {
    throw new ForbiddenException('Acesso não autorizado para esta empresa');
  }
}
```

**2. Service Layer (Query Filter):**
```typescript
// Segunda linha de defesa - no banco de dados
where: { 
  empresaId: requestUser.empresaId,
  ativo: true 
}
```

**3. Database Indexes:**
```sql
-- Performance das validações
CREATE INDEX idx_usuarios_empresa ON usuarios(empresaId);
CREATE INDEX idx_pilares_empresa ON pilares_empresa(empresaId);
CREATE INDEX idx_cockpits_empresa ON cockpit_pilares(empresaId);
```

### Métodos de Validação Padrão

**validateTenantAccess():**
```typescript
private validateTenantAccess(target: any, requestUser: RequestUser): void {
  if (requestUser.perfil.codigo === 'ADMINISTRADOR') {
    return; // ADMIN tem acesso global
  }

  if (target.empresaId !== requestUser.empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }
}
```

**extractCompanyIdFromRequest():**
```typescript
private extractCompanyIdFromRequest(request: any): string | null {
  // 1. Params: /empresas/:empresaId/...
  if (request.params?.empresaId) return request.params.empresaId;
  
  // 2. Query: ?empresaId=uuid
  if (request.query?.empresaId) return request.query.empresaId;
  
  // 3. Body: POST/PUT com empresaId
  if (request.body?.empresaId) return request.body.empresaId;
  
  return null;
}
```

---

## 📊 Validação e Testes

### Cobertura Obrigatória

**Unit Tests:**
- ✅ JwtAuthGuard.canActivate() bloqueia cross-tenant
- ✅ validateTenantAccess() impede acesso indevido
- ✅ Services filtram empresaId corretamente
- ✅ ADMINISTRADOR bypass funciona

**E2E Tests (security-adversarial.spec.ts):**
- ✅ GESTOR tenta acessar cockpit de outra empresa
- ✅ COLABORADOR tenta editar usuário de outra empresa
- ✅ LEITURA tenta visualizar dados de outra empresa
- ✅ ADMINISTRADOR acessa qualquer empresa (com auditoria)

**Penetration Tests:**
- ✅ Simulação de atacante tentando cross-tenant
- ✅ Manipulação de headers, parâmetros, body
- ✅ Teste de todas as combinações de perfil vs recurso

### Cenários Críticos

1. ✅ GESTOR tenta `/empresas/:outra-empresa-id` → 403
2. ✅ POST `/usuarios` com `body.empresaId` diferente → 403
3. ✅ Token JWT com `empresaId` manipulado → 401
4. ✅ ADMINISTRADOR acessa qualquer empresa → 200 + audit log
5. ✅ Direct API call sem frontend validation → 403/401

---

## 🚨 Exceções e Edge Cases

### Caso 1: ADMINISTRADOR Acessando Empresa

**Cenário:** ADMIN acessa empresa X para suporte técnico.  
**Comportamento:**  
- ✅ Acesso permitido
- ✅ Ação logada em audit_logs com empresaId
- ✅ Frontend exibe banner "Acessando como ADMINISTRADOR"

**Implementação:**
```typescript
// Frontend warning
@if (currentUser.perfil.codigo === 'ADMINISTRADOR' && currentCompanyId !== currentUser.empresaId) {
  <div class="alert alert-warning">
    <strong>Aviso:</strong> Acessando como ADMINISTRADOR. Esta ação está sendo auditada.
  </div>
}
```

### Caso 2: Usuário Transferido de Empresa

**Cenário:** Colaborador muda de empresa A para B.  
**Comportamento:**  
- Atualizar `usuarios.empresaId` para nova empresa
- Access token antigo expira (máx 1h)
- Próximo login: novo token com empresaId correto
- Acesso antigo bloqueado pelo validateTenantAccess()

### Caso 3: Empresa Desativada

**Cenário:** Empresa cancela contrato (`empresas.ativo = false`).  
**Comportamento:**  
- Usuários da empresa não conseguem login (validado em AuthService)
- Dados permanecem no banco (soft delete)
- ADMINISTRADOR ainda acessa para recuperação/backup

**Implementação:**
```typescript
// AuthService.validateUser()
if (!usuario || !usuario.ativo || !usuario.empresa?.ativo) {
  throw new UnauthorizedException('Credenciais inválidas');
}
```

### Caso 4: Usuários Multi-Empresa (Futuro)

**Status:** ❌ NÃO IMPLEMENTADO  
**Descrição:** Sistema atual não permite usuário vinculado a múltiplas empresas.  
**Consideração:** Se implementado no futuro, exigirá schema updates complexos.

---

## 📝 Performance e Escalabilidade

### Índices Obrigatórios

```sql
-- Performance das validações de tenant
CREATE INDEX idx_usuarios_empresa ON usuarios(empresaId);
CREATE INDEX idx_empresas_ativo ON empresas(ativo);
CREATE INDEX idx_pilares_empresa ON pilares_empresa(empresaId);
CREATE INDEX idx_cockpit_pilares_empresa ON cockpit_pilares(empresaId);
CREATE INDEX idx_rotinas_empresa ON rotinas_empresa(empresaId);

-- Composição para queries comuns
CREATE INDEX idx_usuarios_empresa_ativo ON usuarios(empresaId, ativo);
CREATE INDEX idx_pilares_empresa_ativo ON pilares_empresa(empresaId, ativo);
```

### Cache Considerations

**Cache de Empresas:**
- Considerar cache de dados públicos (`loginUrl`, `logoUrl`)
- Invalidar cache ao atualizar empresa
- TTL curto (5-15 minutos) para não impactar segurança

**Cache de Permissões:**
- Cache de perfil + nível do usuário
- Invalidar ao alterar perfil
- Reduz queries em `validateProfileElevation()`

---

## 🔄 Evolução e Manutenção

### Monitoramento

**Métricas de Segurança:**
- Tentativas de acesso cross-tenant (logs 403)
- Acessos de ADMINISTRADOR (auditoria)
- Performance das validações (tempo de resposta)

**Alertas:**
- Spike em 403s (possível ataque)
- ADMINISTRADOR acessando muitas empresas (suporte ativo)
- Queries lentas em validações de tenant

### Revisões de Segurança

**Trimestral:**
- Revisar logs de acesso cross-tenant
- Validar novos endpoints contra regras
- Testar penetração atualizada

**Anual:**
- Análise completa de arquitetura multi-tenant
- Revisão de CVSS e mitigações
- Atualização de documentação

---

## 📚 Referências

- **RBAC:** [RN-SEC-003](./rbac.md) - Hierarquia de perfis
- **Session:** [RN-SEC-001](./session-policy.md) - Autenticação
- **OWASP:** Multi-Tenancy Best Practices
- **LGPD:** Art. 46 - Segurança de dados pessoais
- **Source Code:** [jwt-auth.guard.ts](../../../backend/src/modules/auth/guards/jwt-auth.guard.ts)

---

**Aprovado por:** Business Analyst  
**Implementado em:** 2026-01-24 (v1.0)  
**Consolidado em:** 2026-02-04 (v1.1)  
**Próxima Revisão:** 2026-05-04 (trimestral - alta criticidade)