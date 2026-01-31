# Regra de Negócio: Isolamento Multi-Tenant

**ID:** RN-SEC-002  
**Versão:** 1.0  
**Data:** 2026-01-24  
**Status:** ✅ Ativa  
**Prioridade:** 🔴 Crítica (CVSS 8.5 se violada)

---

## 📋 Contexto

Sistema Reiche Academy é **multi-tenant**: múltiplas empresas usam mesma instância do software, mas dados devem ser **estritamente isolados**.

**Risco:** Data leakage entre empresas (violação de LGPD, perda de confiança, processos judiciais).

---

## 🎯 Regras de Negócio

### RN-SEC-002.1: Validação Obrigatória de EmpresaId

**Descrição:**  
> TODA requisição que acessa dados de empresa DEVE validar que usuário pertence àquela empresa.

**Exceção:**  
Perfil **ADMINISTRADOR** tem acesso global (todas empresas).

**Implementação:**
- JWT Guard extrai `empresaId` de:
  - `params.empresaId` (rotas `/empresas/:empresaId/...`)
  - `query.empresaId` (?empresaId=uuid)
  - `body.empresaId` (POST/PUT)
- Compara com `user.empresaId` do token JWT
- Se diferente: lança `403 Forbidden`

**Código Crítico:**
```typescript
// jwt-auth.guard.ts
if (user.perfil?.codigo !== 'ADMINISTRADOR') {
  const requestedCompanyId = this.extractCompanyIdFromRequest(request);
  
  if (requestedCompanyId && user.empresaId !== requestedCompanyId) {
    throw new ForbiddenException('Acesso não autorizado para esta empresa');
  }
}
```

**Teste:**
- E2E: `security-adversarial.spec.ts` - GESTOR tenta acessar cockpit de outra empresa
- Unit: JwtAuthGuard.canActivate() bloqueia cross-tenant

---

### RN-SEC-002.2: Validação de UUID

**Descrição:**  
> EmpresaId extraído de request DEVE ser UUID válido.

**Implementação:**
```typescript
private isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
```

**Justificativa:**  
Previne injection de strings maliciosas como empresaId.

**Teste:**
- Unit: JwtAuthGuard rejeita empresaId='<script>' com 403

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
  // Pode omitir empresaId
}
```

**Convenção:**
- SEMPRE receber `requestUser: RequestUser` em métodos de service
- SEMPRE validar `requestUser.empresaId` antes de query

**Teste:**
- Unit: Cada service valida tenant isolation
- E2E: GESTOR não vê dados de outra empresa via API

---

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
- Frontend: Não exibe links para outras empresas
- Backend: Valida empresaId em TODAS rotas (Guard + Service)
- Dupla validação: Guard (early return) + Service (query filter)

**Teste:**
- E2E: `security-adversarial.spec.ts` linha 20-40
- Manual: Alterar UUID na URL e verificar bloqueio

---

### RN-SEC-002.5: Exceção para ADMINISTRADOR

**Descrição:**  
> Perfil ADMINISTRADOR tem acesso cross-tenant (todas empresas).

**Justificativa:**  
- Suporte técnico
- Gestão de plataforma
- Configurações globais

**Implementação:**
```typescript
if (user.perfil?.codigo === 'ADMINISTRADOR') {
  // Bypass validação de empresaId
  return true;
}
```

**Auditoria:**
- TODOS acessos de ADMINISTRADOR são logados em `audit_logs`
- Incluindo empresaId acessada

**Teste:**
- E2E: ADMINISTRADOR acessa dados de qualquer empresa
- Unit: AuditService registra acessos de ADMIN

---

## 🔒 Hierarquia de Perfis e Acesso

| Perfil | Acesso Multi-Tenant | Validação EmpresaId |
|--------|-------------------|---------------------|
| **ADMINISTRADOR** | ✅ Global (todas empresas) | ❌ Não valida |
| **GESTOR** | ❌ Apenas própria empresa | ✅ Valida sempre |
| **COLABORADOR** | ❌ Apenas própria empresa | ✅ Valida sempre |
| **LEITURA** | ❌ Apenas própria empresa | ✅ Valida sempre |

---

## 🚨 Cenários de Ataque Prevenidos

### Ataque 1: URL Manipulation
**Tentativa:** Mudar empresaId na URL  
**Defesa:** JwtAuthGuard bloqueia com 403  
**CVSS:** 8.5 (Critical) → 0 (Mitigado)

### Ataque 2: API Request Tampering
**Tentativa:** Alterar `body.empresaId` em POST  
**Defesa:** Guard valida antes de chegar no controller  
**CVSS:** 7.5 (High) → 0 (Mitigado)

### Ataque 3: Token Manipulation
**Tentativa:** Modificar `empresaId` no JWT  
**Defesa:** Assinatura JWT invalida, token rejeitado  
**CVSS:** 9.0 (Critical) → 0 (Mitigado)

### Ataque 4: SQL Injection para Bypass
**Tentativa:** `empresaId=' OR '1'='1`  
**Defesa:** 
  1. UUID validation rejeita
  2. Prisma usa parametrização (SQL injection impossível)  
**CVSS:** 8.0 (High) → 0 (Mitigado)

---

## 📊 Validação e Testes

### Cobertura Obrigatória:

- ✅ **Unit Tests:** JwtAuthGuard, cada Service com filtro empresaId
- ✅ **E2E Tests:** `security-adversarial.spec.ts` (3 testes de multi-tenant)
- ✅ **Penetration Test:** Simulação de atacante tentando cross-tenant

### Cenários Críticos:

1. ✅ GESTOR tenta /empresas/:outra-empresa-id
2. ✅ POST /usuarios com body.empresaId diferente
3. ✅ ADMINISTRADOR acessa qualquer empresa (audit logged)
4. ✅ Token JWT com empresaId manipulado

---

## 🛠️ Implementação Técnica

### Arquivos Críticos:

| Arquivo | Responsabilidade |
|---------|------------------|
| `jwt-auth.guard.ts` | Validação early-return (antes de controller) |
| `usuarios.service.ts` | Filtro empresaId em queries |
| `empresas.service.ts` | Validação de acesso a empresa |
| `cockpit-pilares.service.ts` | Filtro empresaId em indicadores |
| `audit.service.ts` | Log de acessos cross-tenant de ADMIN |

### Migration Crítica:

Índice para performance:
```sql
CREATE INDEX idx_usuarios_empresa ON usuarios(empresaId);
CREATE INDEX idx_pilares_empresa ON pilares_empresa(empresaId);
```

---

## 🚨 Exceções e Edge Cases

### Caso 1: ADMINISTRADOR Acessando Empresa

**Cenário:** ADMIN acessa empresa X para configurar.

**Comportamento:**  
- ✅ Acesso permitido
- ✅ Ação logada em audit_logs
- ✅ Frontend exibe banner "Acessando como ADMINISTRADOR"

**Justificativa:** Suporte técnico necessário.

### Caso 2: Usuário Transferido de Empresa

**Cenário:** Colaborador muda de empresa A para B.

**Comportamento:**  
- Atualizar `usuarios.empresaId` para nova empresa
- Access token antigo expira (1h)
- Próximo login: novo token com empresaId correto

**Justificativa:** Mudança de empresaId é rara, não precisa invalidação forçada.

### Caso 3: Empresa Desativada

**Cenário:** Empresa cancela contrato, `empresas.ativo = false`.

**Comportamento:**  
- Usuários da empresa não conseguem login (validado em AuthService)
- Dados permanecem no banco (soft delete)
- ADMINISTRADOR ainda acessa para recuperação

---

## 📚 Referências

- [OWASP: Insecure Direct Object References](https://owasp.org/www-project-top-ten/2017/A5_2017-Broken_Access_Control)
- [Multi-Tenancy Best Practices](https://docs.aws.amazon.com/wellarchitected/latest/saas-lens/multi-tenancy.html)
- LGPD Art. 46: Segurança de dados pessoais
- **Relatório QA:** CVSS 8.5 identificado e mitigado

---

**Aprovado por:** Business Analyst  
**Implementado em:** 2026-01-24  
**Próxima Revisão:** 2026-02-24 (mensal - alta criticidade)
