# Regras de Negócio — Audit

**Módulo:** Audit (Auditoria)  
**Backend:** `backend/src/modules/audit/`  
**Frontend:** Não implementado  
**Última extração:** 21/12/2024  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Audit é responsável por:
- Registrar logs de auditoria de todas as operações CUD (Create, Update, Delete)
- Armazenar estado antes e depois de mudanças
- Registrar identificação do usuário responsável pela ação
- Rastrear mudanças em todas as entidades do sistema

**Entidades principais:**
- AuditLog (logs de auditoria)

**Endpoints implementados:**
- ❌ NENHUM (módulo é apenas serviço interno)

**Observação:** Módulo é **service-only**, sem controller ou endpoints públicos.

---

## 2. Entidades

### 2.1. AuditLog

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único do log |
| usuarioId | String | ID do usuário que executou a ação |
| usuarioNome | String | Nome do usuário no momento da ação |
| usuarioEmail | String | Email do usuário no momento da ação |
| entidade | String | Nome da tabela/entidade afetada |
| entidadeId | String | ID do registro afetado |
| acao | String | Tipo de ação (CREATE, UPDATE, DELETE) |
| dadosAntes | Json? | Estado anterior do registro (UPDATE/DELETE) |
| dadosDepois | Json? | Estado posterior do registro (CREATE/UPDATE) |
| createdAt | DateTime | Data/hora do registro de auditoria |

**Índices:**
- `[entidade, entidadeId]` (busca de histórico de um registro)
- `[usuarioId]` (busca de ações de um usuário)

**Características:**
- Não possui relação direta com Usuario (apenas ID armazenado)
- Não possui updatedAt (logs são imutáveis)
- Não possui soft delete (logs nunca são deletados)
- Dados de usuário são desnormalizados (nome/email armazenados para histórico)

---

## 3. Regras Implementadas

### R-AUD-001: Registro de Log de Auditoria

**Descrição:** Serviço fornece método `log()` para registrar ações de auditoria.

**Implementação:**
- **Método:** `AuditService.log()`
- **Uso:** Chamado por outros módulos (empresas, usuarios, pilares, rotinas)

**Parâmetros obrigatórios:**
```typescript
{
  usuarioId: string,
  usuarioNome: string,
  usuarioEmail: string,
  entidade: string,        // ex: 'empresas', 'usuarios', 'pilares', 'rotinas'
  entidadeId: string,
  acao: 'CREATE' | 'UPDATE' | 'DELETE',
  dadosAntes?: any,        // Opcional (usado em UPDATE/DELETE)
  dadosDepois?: any        // Opcional (usado em CREATE/UPDATE)
}
```

**Comportamento:**
```typescript
await this.prisma.auditLog.create({
  data: {
    usuarioId: params.usuarioId,
    usuarioNome: params.usuarioNome,
    usuarioEmail: params.usuarioEmail,
    entidade: params.entidade,
    entidadeId: params.entidadeId,
    acao: params.acao,
    dadosAntes: params.dadosAntes ?? null,
    dadosDepois: params.dadosDepois ?? null,
  },
});
```

**Cobertura de uso (baseado em grep):**
- ✅ Empresas: CREATE, UPDATE, DELETE, logo upload, logo delete
- ✅ Usuarios: CREATE, UPDATE, DELETE (soft), DELETE (hard), photo upload, photo delete
- ✅ Pilares: CREATE, UPDATE, DELETE
- ✅ Rotinas: CREATE, UPDATE, DELETE
- ❌ Perfis: Não auditado (read-only)
- ❌ Auth: Não auditado (login/logout não registrados)

**Arquivo:** [audit.service.ts](../../backend/src/modules/audit/audit.service.ts#L8-L29)

---

### R-AUD-002: Desnormalização de Dados de Usuário

**Descrição:** Sistema armazena nome e email do usuário diretamente no log, não apenas ID.

**Implementação:**
- **Campos:** `usuarioNome`, `usuarioEmail` (além de `usuarioId`)

**Justificativa:**
- Preservar identificação mesmo se usuário for deletado
- Preservar nome/email no momento da ação (pode mudar depois)
- Facilitar consultas de auditoria sem JOIN

**Comportamento:**
```typescript
const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
await this.audit.log({
  usuarioId: userId,
  usuarioNome: user?.nome ?? '',
  usuarioEmail: user?.email ?? '',
  // ...
});
```

**Observação:**
- Módulos chamadores são responsáveis por buscar dados do usuário
- AuditService recebe dados já preparados

**Arquivo:** [audit.service.ts](../../backend/src/modules/audit/audit.service.ts#L8-L29)

---

### R-AUD-003: Dados Antes/Depois Opcionais

**Descrição:** Campos `dadosAntes` e `dadosDepois` são opcionais e salvos como `null` se não fornecidos.

**Implementação:**
```typescript
dadosAntes: params.dadosAntes ?? null,
dadosDepois: params.dadosDepois ?? null,
```

**Padrão de uso observado:**
- **CREATE:** dadosAntes = null, dadosDepois = registro criado
- **UPDATE:** dadosAntes = estado anterior, dadosDepois = estado posterior
- **DELETE:** dadosAntes = estado anterior, dadosDepois = estado final (ativo: false)

**Exemplo (DELETE soft):**
```typescript
const before = await this.findOne(id);  // { id, nome, ativo: true, ... }
const after = await this.update({ ativo: false });  // { id, nome, ativo: false, ... }

await this.audit.log({
  acao: 'DELETE',
  dadosAntes: before,
  dadosDepois: after,
});
```

**Arquivo:** [audit.service.ts](../../backend/src/modules/audit/audit.service.ts#L24-L25)

---

### R-AUD-004: Logs São Imutáveis

**Descrição:** Modelo AuditLog não possui `updatedAt` ou métodos de update.

**Implementação:**
- Apenas operação CREATE implementada
- Nenhum método de update/delete no service
- Logs são registro histórico permanente

**Comportamento:**
- Uma vez criado, log nunca é modificado
- Correções devem ser feitas via novo registro compensatório

**Arquivo:** [audit.service.ts](../../backend/src/modules/audit/audit.service.ts)

---

## 4. Validações

### 4.1. CreateAuditLogDto

**Campos:**
- `usuarioId`: @IsUUID(), @IsNotEmpty()
- `usuarioNome`: @IsString(), @IsNotEmpty()
- `usuarioEmail`: @IsEmail(), @IsNotEmpty()
- `entidade`: @IsString(), @IsNotEmpty()
- `entidadeId`: @IsUUID(), @IsNotEmpty()
- `acao`: @IsString(), @IsNotEmpty() (enum: CREATE, UPDATE, DELETE)
- `dadosAntes`: @IsObject(), @IsOptional()
- `dadosDepois`: @IsObject(), @IsOptional()

**Validações implementadas:**
- IDs devem ser UUIDs válidos
- Email deve ser válido
- Ação deve ser string (sem validação de enum)
- Dados antes/depois devem ser objetos (se fornecidos)

**Observação:**
- DTO existe mas não é usado (serviço não tem controller)
- Service recebe parâmetros diretos, não DTO validado

**Arquivo:** [create-audit-log.dto.ts](../../backend/src/modules/audit/dto/create-audit-log.dto.ts)

---

## 5. Comportamentos Condicionais

### 5.1. Dados Nulos Convertidos para null

**Condição:** `dadosAntes` ou `dadosDepois` não fornecidos

**Comportamento:**
```typescript
dadosAntes: params.dadosAntes ?? null
```

**Justificativa:**
- Garantir valor consistente no banco (null vs undefined)
- Facilitar queries SQL

**Arquivo:** [audit.service.ts](../../backend/src/modules/audit/audit.service.ts#L24-L25)

---

### 5.2. Módulos Responsáveis por Buscar Dados do Usuário

**Condição:** Sempre

**Comportamento:**
- AuditService NÃO busca dados do usuário
- Módulo chamador deve buscar e fornecer nome/email

**Exemplo (de outros módulos):**
```typescript
const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
await this.audit.log({
  usuarioId: userId,
  usuarioNome: user?.nome ?? '',
  usuarioEmail: user?.email ?? '',
  // ...
});
```

**Observação:**
- Responsabilidade distribuída (não centralizada)
- Duplicação de código em todos os módulos

**Arquivo:** [audit.service.ts](../../backend/src/modules/audit/audit.service.ts)

---

## 6. Ausências ou Ambiguidades

### 6.1. Nenhum Endpoint de Consulta

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Módulo não possui controller
- Não há endpoints para consultar logs de auditoria
- Dados ficam apenas no banco, sem interface de acesso

**TODO:**
- Implementar endpoints de consulta:
  - GET /audit/logs (listar com filtros)
  - GET /audit/logs/:id (buscar log específico)
  - GET /audit/entity/:entidade/:id (histórico de um registro)
  - GET /audit/user/:userId (ações de um usuário)
- Implementar paginação
- Implementar filtros (data, entidade, ação, usuário)

---

### 6.2. DTO Não Utilizado

**Status:** ⚠️ CÓDIGO MORTO

**Descrição:**
- CreateAuditLogDto existe mas nunca é usado
- Service recebe parâmetros diretos, não validados
- Validações do DTO são ignoradas

**TODO:**
- Remover DTO se não for usado
- Ou implementar endpoints e usar DTO
- Ou validar parâmetros no método `log()`

**Arquivo:** [create-audit-log.dto.ts](../../backend/src/modules/audit/dto/create-audit-log.dto.ts)

---

### 6.3. Validação de Enum de Ação Não Implementada

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- Parâmetro `acao` é tipado como `'CREATE' | 'UPDATE' | 'DELETE'`
- Mas não há validação em runtime
- Possível passar valor inválido sem erro

**Comportamento atual:**
- TypeScript valida em compile time
- Nenhuma validação em runtime

**TODO:**
- Adicionar validação de enum no service
- Ou usar DTO com validação de enum
- Lançar erro se ação inválida

---

### 6.4. Busca de Usuário Duplicada em Todos os Módulos

**Status:** ⚠️ DUPLICAÇÃO

**Descrição:**
- Cada módulo (empresas, usuarios, pilares, rotinas) busca dados do usuário
- Código duplicado em ~17 lugares
- Manutenção difícil

**Código duplicado:**
```typescript
const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
await this.audit.log({
  usuarioId: userId,
  usuarioNome: user?.nome ?? '',
  usuarioEmail: user?.email ?? '',
  // ...
});
```

**TODO:**
- Centralizar busca de usuário no AuditService
- Modificar método `log()` para receber apenas `userId`
- Service busca nome/email internamente

**Refatoração sugerida:**
```typescript
async log(params: {
  userId: string,
  entidade: string,
  entidadeId: string,
  acao: 'CREATE' | 'UPDATE' | 'DELETE',
  dadosAntes?: any,
  dadosDepois?: any,
}) {
  const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
  
  await this.prisma.auditLog.create({
    data: {
      usuarioId: userId,
      usuarioNome: user?.nome ?? 'Desconhecido',
      usuarioEmail: user?.email ?? 'desconhecido@sistema',
      // ...
    },
  });
}
```

---

### 6.5. Sem Tratamento de Erro em Log

**Status:** ⚠️ SEM TRATAMENTO

**Descrição:**
- Método `log()` não trata erros
- Se criação de log falhar, erro é propagado para módulo chamador
- Pode interromper operação principal

**Cenário problemático:**
```
1. Usuario cria empresa (sucesso)
2. audit.log() falha (banco indisponível)
3. Erro é lançado
4. Empresa foi criada mas auditoria falhou
```

**TODO:**
- Decidir estratégia de erro:
  - Opção 1: Auditoria é crítica (falha interrompe operação)
  - Opção 2: Auditoria é opcional (falha é logada mas não interrompe)
- Implementar try/catch se auditoria for opcional
- Logar erros de auditoria em sistema de monitoramento

---

### 6.6. Logs de Auth Não Implementados

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Módulo Auth não usa AuditService
- Login/logout não são auditados via AuditLog
- Apenas LoginHistory (entidade separada) registra logins

**Comportamento atual:**
- LoginHistory registra tentativas de login (sucesso/falha)
- Logout não é registrado em lugar nenhum
- Password reset não é auditado

**TODO:**
- Definir se login/logout devem usar AuditLog
- Ou manter LoginHistory separado (pode ser correto)
- Auditar password reset (ação crítica)

---

### 6.7. Rotinas Não Auditam Reordenação

**Status:** ❌ NÃO AUDITADO

**Descrição:**
- Método `reordenarPorPilar()` não registra auditoria
- Mudanças de ordem não são rastreadas

**TODO:**
- Adicionar auditoria em reordenação
- Registrar uma entrada para toda a operação (não uma por rotina)

**Observação:**
- Mesmo problema em Pilares (`reordenar()` não auditado)

---

### 6.8. Empresas Não Auditam Vinculação de Pilares

**Status:** ⚠️ AUDITORIA PARCIAL

**Descrição:**
- Criação/deleção de PilarEmpresa não é auditada
- Apenas operações diretas em Empresa são auditadas

**TODO:**
- Definir se vinculação de pilares deve ser auditada
- Se sim, adicionar chamada a audit.log()

---

### 6.9. Dados JSON Não Validados

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- `dadosAntes` e `dadosDepois` aceitam qualquer objeto
- Não há validação de estrutura
- Possível armazenar dados corrompidos ou muito grandes

**TODO:**
- Definir limite de tamanho para JSON
- Validar estrutura básica (se necessário)
- Considerar compressão para dados grandes

---

### 6.10. Sem Retenção de Dados Definida

**Status:** ⚠️ NÃO DOCUMENTADO

**Descrição:**
- Logs nunca são deletados
- Não há política de retenção
- Tabela pode crescer indefinidamente

**TODO:**
- Definir política de retenção (ex: 2 anos)
- Implementar rotina de limpeza (CRON job)
- Considerar arquivamento de logs antigos
- Implementar particionamento de tabela por data

---

### 6.11. Usuário Deletado Quebra Referência

**Status:** ⚠️ SEM CONSTRAINT FK

**Descrição:**
- `usuarioId` não é FK (apenas String)
- Se usuário for deletado, ID fica órfão
- Intencional (para preservar histórico), mas não documentado

**Comportamento atual:**
- Nome/email preservados (desnormalização)
- ID preservado mas pode não ter usuário correspondente

**Observação:**
- Design é correto (logs devem sobreviver a deleções)
- Mas deveria estar documentado

---

## 7. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-AUD-001** | Registro de log via método `log()` | ✅ Implementado |
| **R-AUD-002** | Desnormalização de dados de usuário | ✅ Implementado |
| **R-AUD-003** | Dados antes/depois opcionais | ✅ Implementado |
| **R-AUD-004** | Logs são imutáveis | ✅ Implementado |

**Ausências críticas:**
- ❌ Nenhum endpoint de consulta
- ❌ Auditoria de login/logout
- ❌ Auditoria de reordenação (pilares/rotinas)
- ❌ Política de retenção de dados
- ⚠️ DTO não utilizado (código morto)
- ⚠️ Busca de usuário duplicada em todos os módulos
- ⚠️ Sem tratamento de erro em log

---

## 8. Padrão de Uso Observado

### 8.1. CREATE

**Módulos chamadores:**
```typescript
const created = await this.prisma.entidade.create({ ... });

const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
await this.audit.log({
  usuarioId: userId,
  usuarioNome: user?.nome ?? '',
  usuarioEmail: user?.email ?? '',
  entidade: 'entidades',
  entidadeId: created.id,
  acao: 'CREATE',
  dadosDepois: created,  // Estado criado
});
```

---

### 8.2. UPDATE

**Módulos chamadores:**
```typescript
const before = await this.findOne(id);
const after = await this.prisma.entidade.update({ ... });

const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
await this.audit.log({
  usuarioId: userId,
  usuarioNome: user?.nome ?? '',
  usuarioEmail: user?.email ?? '',
  entidade: 'entidades',
  entidadeId: id,
  acao: 'UPDATE',
  dadosAntes: before,    // Estado anterior
  dadosDepois: after,    // Estado posterior
});
```

---

### 8.3. DELETE (Soft)

**Módulos chamadores:**
```typescript
const before = await this.findOne(id);
const after = await this.prisma.entidade.update({
  where: { id },
  data: { ativo: false },
});

const user = await this.prisma.usuario.findUnique({ where: { id: userId } });
await this.audit.log({
  usuarioId: userId,
  usuarioNome: user?.nome ?? '',
  usuarioEmail: user?.email ?? '',
  entidade: 'entidades',
  entidadeId: id,
  acao: 'DELETE',
  dadosAntes: before,    // Estado ativo
  dadosDepois: after,    // Estado inativo
});
```

---

## 9. Módulos que Usam Auditoria

### 9.1. Empresas

**Operações auditadas:**
- ✅ CREATE (criação de empresa)
- ✅ UPDATE (atualização de empresa)
- ✅ DELETE (desativação de empresa)
- ✅ Logo upload
- ✅ Logo delete

**Operações não auditadas:**
- ❌ Vinculação de pilares (PilarEmpresa)

---

### 9.2. Usuarios

**Operações auditadas:**
- ✅ CREATE (criação de usuário)
- ✅ UPDATE (atualização de usuário)
- ✅ DELETE soft (desativação)
- ✅ DELETE hard (deleção física)
- ✅ Photo upload
- ✅ Photo delete

**Observação:**
- Cobertura completa de todas as operações

---

### 9.3. Pilares

**Operações auditadas:**
- ✅ CREATE
- ✅ UPDATE
- ✅ DELETE

**Operações não auditadas:**
- ❌ Reordenação (`reordenar()`)

---

### 9.4. Rotinas

**Operações auditadas:**
- ✅ CREATE
- ✅ UPDATE
- ✅ DELETE

**Operações não auditadas:**
- ❌ Reordenação (`reordenarPorPilar()`)

---

### 9.5. Perfis

**Operações auditadas:**
- ❌ NENHUMA (módulo read-only, sem CRUD)

---

### 9.6. Auth

**Operações auditadas:**
- ❌ NENHUMA (usa LoginHistory separado)

---

## 10. Queries Úteis (Não Implementadas)

### 10.1. Histórico de um Registro

```sql
SELECT * FROM audit_logs
WHERE entidade = 'empresas'
  AND entidadeId = 'uuid-da-empresa'
ORDER BY createdAt DESC;
```

**Uso:** Visualizar todas as mudanças em um registro específico

---

### 10.2. Ações de um Usuário

```sql
SELECT * FROM audit_logs
WHERE usuarioId = 'uuid-do-usuario'
ORDER BY createdAt DESC
LIMIT 50;
```

**Uso:** Rastrear ações de um usuário específico

---

### 10.3. Mudanças Recentes em uma Entidade

```sql
SELECT * FROM audit_logs
WHERE entidade = 'usuarios'
  AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;
```

**Uso:** Monitorar mudanças recentes em uma tabela

---

### 10.4. Deleções em um Período

```sql
SELECT * FROM audit_logs
WHERE acao = 'DELETE'
  AND createdAt BETWEEN '2024-01-01' AND '2024-12-31'
ORDER BY createdAt DESC;
```

**Uso:** Auditoria de deleções em um período

---

## 11. Referências

**Arquivos principais:**
- [audit.service.ts](../../backend/src/modules/audit/audit.service.ts)
- [create-audit-log.dto.ts](../../backend/src/modules/audit/dto/create-audit-log.dto.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (AuditLog)

**Dependências:**
- PrismaService (acesso ao banco)

**Módulos dependentes:**
- Empresas (5 chamadas a audit.log)
- Usuarios (6 chamadas a audit.log)
- Pilares (3 chamadas a audit.log)
- Rotinas (3 chamadas a audit.log)

---

**Observação final:**  
Este documento reflete APENAS o código IMPLEMENTADO.  
Módulo Audit é **service-only** (sem controller ou endpoints).  
Usado extensivamente por outros módulos para rastreabilidade.  
Logs são imutáveis e preservam histórico completo de mudanças.  
**Crítico:** Falta interface de consulta (logs existem mas não são acessíveis via API).
