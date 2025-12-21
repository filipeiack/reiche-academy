# 📋 Relatório de Revisão — Regras de Negócio do Módulo Usuarios

> **Agente:** Reviewer de Regras  
> **Data:** 21/12/2024  
> **Documento Revisado:** `/docs/business-rules/usuarios.md`  
> **Status:** ⚠️ **APROVADO COM RESSALVAS CRÍTICAS**

---

## 1️⃣ Resumo Geral

### Avaliação de Maturidade

| Aspecto | Nível | Observação |
|---------|-------|-----------|
| **Extração de Regras** | ✅ Alta | Regras implementadas foram corretamente identificadas |
| **Validações Técnicas** | ✅ Adequada | DTOs e validações documentadas |
| **RBAC** | ⚠️ Média | Lacunas críticas de segurança identificadas |
| **Isolamento por Empresa** | 🔴 Baixa | Ausência total de proteção multi-tenant |
| **Auditoria** | ⚠️ Média | Implementada, mas incompleta |
| **Completude Documental** | ✅ Alta | Ambiguidades bem identificadas |

### Decisão de Revisão

✅ **Documento APROVADO como extração fiel do código**  
⚠️ **Código possui RISCOS CRÍTICOS de segurança**  
🔴 **Implementação NÃO ESTÁ PRONTA PARA PRODUÇÃO**

---

## 2️⃣ Análise por Seção

### Seção 3: Regras de Negócio Implementadas

#### ✅ RN-001: Unicidade de Email
**Validação:** CONFORME  
**Código verificado:** `usuarios.service.ts:124`
```typescript
const existingUser = await this.findByEmail(data.email);
if (existingUser) {
  throw new ConflictException('Email já cadastrado');
}
```
**Observação:** Regra corretamente implementada e documentada.

---

#### ✅ RN-002: Hash de Senha com Argon2
**Validação:** CONFORME  
**Código verificado:** `usuarios.service.ts:129, 182`
```typescript
const hashedPassword = await argon2.hash(data.senha);
```
**Observação:** Boa prática de segurança. Argon2 é recomendado para hashing de senha.

---

#### ✅ RN-003: Redação de Senha em Logs de Auditoria
**Validação:** CONFORME  
**Código verificado:** Múltiplas linhas no service
```typescript
dadosDepois: { ...created, senha: '[REDACTED]' }
```
**Observação:** Proteção adequada contra vazamento de credenciais em logs.

---

#### ✅ RN-004: Usuários Disponíveis para Associação
**Validação:** CONFORME  
**Código verificado:** `usuarios.service.ts:46-66`
```typescript
where: {
  empresaId: null,
  ativo: true,
}
```
**Observação:** Lógica clara e correta.

---

#### ✅ RN-005: Soft Delete (Inativação)
**Validação:** CONFORME  
**Código verificado:** `usuarios.service.ts:223-244`  
**Observação:** Implementação adequada de soft delete.

---

#### ✅ RN-006: Hard Delete com Remoção de Arquivo
**Validação:** CONFORME  
**Código verificado:** `usuarios.service.ts:246-269`  
**Observação:** Limpeza correta de arquivos órfãos.

---

#### ✅ RN-007 e RN-008: Gestão de Foto de Perfil
**Validação:** CONFORME  
**Observação:** Implementação técnica correta, mas com **lacuna crítica de segurança** (ver Riscos).

---

### Seção 4: Restrições e Validações

#### ✅ Validações de DTO
**Validação:** CONFORME  
**Observação:** DTOs bem estruturados com validações class-validator adequadas.

**Ponto de atenção:**
- Senha mínima de 6 caracteres é **fraca** para padrões modernos (recomendado: 8+)
- Não há validação de complexidade de senha

---

#### ✅ Validações de Upload de Foto
**Validação:** CONFORME  
**Código verificado:** `usuarios.controller.ts:100-118`  
**Observação:** Restrições adequadas de formato e tamanho.

---

### Seção 6: Controle de Acesso (RBAC)

#### ⚠️ Permissões por Endpoint
**Validação:** CONFORME com a implementação, MAS IMPLEMENTAÇÃO INSEGURA

**Tabela documentada está correta**, porém:

| Endpoint | Problema Identificado |
|----------|----------------------|
| `POST /usuarios/:id/foto` | ❌ **SEM proteção RBAC** |
| `DELETE /usuarios/:id/foto` | ❌ **SEM proteção RBAC** |
| `PATCH /usuarios/:id` | ⚠️ Qualquer COLABORADOR pode editar qualquer usuário |

**Risco:** Escalação de privilégios e manipulação de dados de terceiros.

---

### Seção 7: Auditoria Automática

#### ⚠️ Auditoria Incompleta
**Validação:** CONFORME, mas incompleta

**O que está auditado:**
- ✅ CREATE
- ✅ UPDATE
- ✅ DELETE (soft e hard)

**O que NÃO está auditado:**
- ❌ Upload de foto (`updateProfilePhoto`)
- ❌ Remoção de foto (`deleteProfilePhoto`)
- ❌ Falha de criação por email duplicado

**Recomendação:** Adicionar auditoria de alterações de foto de perfil.

---

### Seção 8: Pontos de Ambiguidade

#### ✅ Ambiguidades Bem Identificadas
O documento identificou corretamente 8 pontos de ambiguidade. Todos foram validados contra o código.

**Destaque para os mais críticos:**
- **A-001:** Permissões de foto (CRÍTICO)
- **A-003:** Auto-associação de empresa (CRÍTICO)
- **A-004:** Exclusão com vínculos (ALTO)

---

## 3️⃣ Checklist de Riscos

### 🔴 Riscos Críticos Identificados

- [x] **Falta de RBAC em endpoints sensíveis**
  - `POST /usuarios/:id/foto` e `DELETE /usuarios/:id/foto` sem `@Roles`
  - Qualquer usuário autenticado pode manipular foto de outros

- [x] **Falta de isolamento por empresa (Multi-Tenancy)**
  - Nenhum endpoint valida se o usuário pertence à mesma empresa
  - GESTOR da Empresa A pode editar usuário da Empresa B
  - COLABORADOR pode editar GESTOR ou ADMINISTRADOR

- [x] **Falta de validação de propriedade de recurso**
  - `PATCH /usuarios/:id` permite qualquer COLABORADOR editar qualquer usuário
  - Não há verificação: "este usuário pode editar ESTE usuário específico?"

- [x] **Falta de auditoria completa**
  - Alterações de foto não são auditadas
  - Falhas de criação não são registradas

### ⚠️ Riscos Médios Identificados

- [x] **Validações fracas**
  - Senha mínima de 6 caracteres (baixa)
  - Sem validação de complexidade
  - Telefone sem validação de formato no backend

- [x] **Código morto/inconsistente**
  - Perfil CONSULTOR ainda referenciado no código
  - Método `search()` no frontend sem backend

- [x] **Regras excessivamente permissivas**
  - Usuários podem alterar próprio `perfilId` via API
  - Usuários podem se auto-promover a ADMINISTRADOR

### ✅ Aspectos Positivos

- [x] Auditoria implementada (parcialmente)
- [x] Soft delete implementado
- [x] Hash de senha com Argon2
- [x] Redação de senha em logs
- [x] Validações de DTO básicas

---

## 4️⃣ Regras Ausentes (CRÍTICAS)

### RA-001: Isolamento Multi-Tenant (BLOQUEANTE)

**Descrição:** Sistema SaaS multi-empresa DEVE garantir que:
- GESTOR da Empresa A não acessa dados da Empresa B
- COLABORADOR só manipula usuários da própria empresa
- ADMINISTRADOR tem acesso global, mas outros perfis não

**Implementação atual:** ❌ **AUSENTE**

**Código esperado (exemplo):**
```typescript
// Em usuarios.service.ts
async update(id: string, data: any, requestUser: Usuario) {
  const usuario = await this.findById(id);
  
  // ADMINISTRADOR pode editar qualquer usuário
  if (requestUser.perfil.codigo === 'ADMINISTRADOR') {
    // prosseguir
  }
  // Outros perfis só podem editar usuários da mesma empresa
  else if (usuario.empresaId !== requestUser.empresaId) {
    throw new ForbiddenException('Você não pode editar usuários de outra empresa');
  }
  
  // ... resto do código
}
```

**Impacto:** 🔴 **CRÍTICO - Vazamento de dados entre empresas**

---

### RA-002: Proteção de Auto-Edição Privilegiada (BLOQUEANTE)

**Descrição:** Usuários não devem poder alterar seu próprio:
- `perfilId` (auto-promoção)
- `empresaId` (mudança de empresa)
- `ativo` (auto-reativação)

**Implementação atual:** ❌ **AUSENTE no backend** (frontend bloqueia apenas UI)

**Código esperado:**
```typescript
async update(id: string, data: any, requestUser: Usuario) {
  const isSelfEdit = id === requestUser.id;
  
  if (isSelfEdit) {
    // Campos que não podem ser auto-editados
    const forbiddenFields = ['perfilId', 'empresaId', 'ativo'];
    const attemptingForbidden = forbiddenFields.some(field => 
      data[field] !== undefined
    );
    
    if (attemptingForbidden) {
      throw new ForbiddenException('Você não pode alterar estes campos no seu próprio usuário');
    }
  }
  
  // ... resto do código
}
```

**Impacto:** 🔴 **CRÍTICO - Escalação de privilégios**

---

### RA-003: Proteção de Recursos por Propriedade (BLOQUEANTE)

**Descrição:** Endpoints de foto devem validar:
- Usuário só pode alterar própria foto OU
- Apenas ADMINISTRADOR pode alterar foto de outros

**Implementação atual:** ❌ **AUSENTE**

**Código esperado:**
```typescript
@Post(':id/foto')
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
async uploadProfilePhoto(
  @Param('id') id: string,
  @UploadedFile() file: Express.Multer.File,
  @Request() req: any
) {
  const requestUser = req.user;
  
  // Apenas ADMINISTRADOR ou o próprio usuário pode alterar foto
  if (requestUser.perfil !== 'ADMINISTRADOR' && requestUser.id !== id) {
    throw new ForbiddenException('Você não pode alterar a foto de outro usuário');
  }
  
  // ... resto do código
}
```

**Impacto:** 🔴 **CRÍTICO - Manipulação de dados de terceiros**

---

### RA-004: Restrição de Elevação de Perfil (ALTA)

**Descrição:** Usuários não devem poder criar/editar usuários com perfil superior ao seu.

**Exemplo:**
- GESTOR não pode criar ADMINISTRADOR
- COLABORADOR não pode criar GESTOR

**Implementação atual:** ❌ **AUSENTE**

**Impacto:** 🔴 **ALTO - Escalação de privilégios indireta**

---

### RA-005: Validação de Deleção (MÉDIA)

**Descrição:** Antes de deletar usuário, verificar:
- Usuário não é o único ADMINISTRADOR do sistema
- Usuário não possui vínculos críticos não cascateados

**Implementação atual:** ⚠️ **PARCIAL** (Prisma gerencia cascata, mas sem validação de negócio)

**Impacto:** ⚠️ **MÉDIO - Perda de dados ou estado inválido**

---

### RA-006: Auditoria de Segurança (MÉDIA)

**Descrição:** Registrar eventos de segurança:
- Tentativas de acesso negado (403)
- Tentativas de criar email duplicado
- Alterações de perfil/empresa
- Alterações de senha

**Implementação atual:** ⚠️ **PARCIAL** (apenas CRUD básico)

**Impacto:** ⚠️ **MÉDIO - Dificuldade de investigação de incidentes**

---

## 5️⃣ Validação de Comportamentos Condicionais

### ✅ BC-001 a BC-010: CONFORMES

Todos os 10 comportamentos condicionais documentados foram validados contra o código.

**Ponto de atenção:**
- **BC-003** (bloqueio de empresa) é apenas UI - falta validação backend
- **BC-002** (perfil padrão COLABORADOR) pode ser problema de segurança se ADMINISTRADOR esquecer de alterar

---

## 6️⃣ Recomendações Priorizadas

### 🔴 Prioridade CRÍTICA (Bloqueante para Produção)

1. **Implementar isolamento multi-tenant em TODOS os endpoints**
   - Adicionar validação de `empresaId` em todos os métodos do service
   - Exceção: ADMINISTRADOR tem acesso global

2. **Adicionar `@Roles` aos endpoints de foto**
   - `POST /usuarios/:id/foto`
   - `DELETE /usuarios/:id/foto`

3. **Implementar validação de propriedade de recurso**
   - Usuários só podem editar a si mesmos (exceto ADMINISTRADOR)
   - Ou criar lógica de hierarquia (GESTOR edita COLABORADOR da mesma empresa)

4. **Bloquear auto-edição de campos privilegiados**
   - `perfilId`, `empresaId`, `ativo` não podem ser auto-editados

### ⚠️ Prioridade ALTA (Antes do primeiro cliente real)

5. **Fortalecer validação de senha**
   - Mínimo 8 caracteres
   - Exigir complexidade (maiúscula, minúscula, número)

6. **Implementar restrição de elevação de perfil**
   - GESTOR não cria ADMINISTRADOR

7. **Adicionar auditoria de alterações de foto**

8. **Remover perfil CONSULTOR do código**

### ℹ️ Prioridade MÉDIA (Melhorias)

9. **Implementar busca server-side** (`search` endpoint)

10. **Validar formato de telefone no backend**

11. **Criar endpoint dedicado de ativação** (`PATCH /usuarios/:id/ativar`)

12. **Adicionar validação de deleção** (não deletar último admin)

---

## 7️⃣ Cenários de Ataque Possíveis

### 🔴 Cenário 1: Escalação de Privilégios via Auto-Edição

**Passo a passo:**
1. Usuário COLABORADOR faz login
2. Chama `PATCH /usuarios/{seu_proprio_id}` com `{ perfilId: 'uuid-do-administrador' }`
3. Sistema aceita (não há validação)
4. Usuário se torna ADMINISTRADOR

**Status atual:** ✅ **POSSÍVEL**

---

### 🔴 Cenário 2: Vazamento entre Empresas

**Passo a passo:**
1. GESTOR da Empresa A faz login
2. Descobre UUID de usuário da Empresa B (via tentativa e erro ou leak)
3. Chama `GET /usuarios/{uuid-empresa-B}`
4. Sistema retorna dados completos do usuário (sem verificar empresa)

**Status atual:** ✅ **POSSÍVEL**

---

### 🔴 Cenário 3: Sabotagem de Foto de Perfil

**Passo a passo:**
1. Usuário malicioso faz login
2. Descobre UUID de ADMINISTRADOR
3. Chama `DELETE /usuarios/{uuid-admin}/foto`
4. Remove foto do administrador sem permissão

**Status atual:** ✅ **POSSÍVEL**

---

### 🔴 Cenário 4: Migração Não Autorizada de Empresa

**Passo a passo:**
1. COLABORADOR da Empresa A faz login
2. Chama `PATCH /usuarios/{seu_proprio_id}` com `{ empresaId: 'uuid-empresa-B' }`
3. Sistema aceita
4. Usuário migra para outra empresa sem autorização

**Status atual:** ✅ **POSSÍVEL via API** (frontend bloqueia UI apenas)

---

## 8️⃣ Conformidade LGPD e Boas Práticas

### ✅ Aspectos Positivos

- Hash de senha adequado
- Soft delete implementado (facilita recuperação)
- Redação de senha em logs

### ⚠️ Pontos de Atenção

- Falta auditoria completa (LGPD exige rastreabilidade)
- Falta log de consentimento de uso de dados
- Não há funcionalidade de "exportar meus dados"
- Não há funcionalidade de "deletar permanentemente meus dados"

**Observação:** Para conformidade LGPD completa, será necessário:
- Auditoria de todos os acessos a dados pessoais
- Funcionalidade de portabilidade de dados
- Funcionalidade de esquecimento (right to be forgotten)

---

## 9️⃣ Conclusão e Decisão

### Validação do Documento

✅ **DOCUMENTO APROVADO**

O documento `/docs/business-rules/usuarios.md` é uma **extração fiel e precisa** do código atual. Todas as regras documentadas foram validadas. As ambiguidades identificadas são reais.

### Avaliação do Código

🔴 **CÓDIGO NÃO ESTÁ PRONTO PARA PRODUÇÃO**

**Motivos:**
1. Ausência total de isolamento multi-tenant
2. Falta de proteção contra escalação de privilégios
3. Endpoints críticos sem proteção RBAC
4. Possibilidade de vazamento de dados entre empresas

### Próximos Passos Obrigatórios

Antes de qualquer deploy em produção:

1. ✅ Implementar **RA-001** (Isolamento Multi-Tenant) - BLOQUEANTE
2. ✅ Implementar **RA-002** (Proteção Auto-Edição) - BLOQUEANTE
3. ✅ Implementar **RA-003** (Proteção de Recursos) - BLOQUEANTE
4. ✅ Implementar **RA-004** (Restrição de Elevação) - RECOMENDADO
5. ✅ Revisar todas as permissões RBAC

### Recomendação Final

**Este módulo PODE ser usado em desenvolvimento/staging**, mas:

⚠️ **NÃO DEVE ser exposto a produção sem correções críticas**

**Risco atual:** 🔴 **ALTO - Comprometimento total do sistema possível**

---

## 📌 Assinaturas

**Revisor:** Business Rules Reviewer (Agente)  
**Data:** 21/12/2024  
**Status:** ⚠️ Aprovado com Ressalvas Críticas  

**Próximo Agente:** Dev Agent Disciplinado (para implementar correções) OU Stakeholder Humano (para decisões de negócio)

---

**Fim do Relatório de Revisão**
