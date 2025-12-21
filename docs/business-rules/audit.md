# Regras de Negócio — Módulo AUDIT

**Data de extração**: 2025-12-21  
**Escopo**: Auditoria e logging de mudanças em entidades

---

## 1. Visão Geral

O módulo AUDIT implementa:
- Registro de todas as operações CREATE, UPDATE, DELETE
- Captura de estado anterior e posterior
- Rastreamento de quem fez a mudança e quando
- Sem endpoints públicos (apenas serviço interno)
- Sem limpeza automática de histórico

---

## 2. Entidades

### 2.1 AuditLog
```
- id: UUID (PK)
- usuarioId: String — ID do usuário que realizou a ação
- usuarioNome: String — nome do usuário no momento da ação
- usuarioEmail: String — email do usuário no momento da ação
- entidade: String — nome da tabela/entidade afetada (ex: "empresas", "usuarios")
- entidadeId: String — ID do registro afetado
- acao: String (ENUM) — CREATE, UPDATE ou DELETE
- dadosAntes: Json (nullable) — snapshot do estado anterior
- dadosDepois: Json (nullable) — snapshot do estado posterior
- createdAt: DateTime — momento da ação
- Índices: (entidade, entidadeId), (usuarioId)
```

---

## 3. Regras Implementadas

### 3.1 Logging de Operações

**R-AUD-001**: Serviço de logging
- Único método público: `async log(params: {...})`
- Não retorna valor (fire-and-forget)
- Parâmetros obrigatórios: usuarioId, usuarioNome, usuarioEmail, entidade, entidadeId, acao
- Parâmetros opcionais: dadosAntes, dadosDepois

**R-AUD-002**: Ação suportadas
- Valores válidos de `acao`: CREATE, UPDATE, DELETE
- Sem validação de enum no serviço (String genérico)
- Tipos esperados: string literal

**R-AUD-003**: Rastreamento de identidade
- Nome e email capturados NO MOMENTO DA AÇÃO (não consultados depois)
- Permite auditoria mesmo se usuário for deletado
- Não há FK para Usuario (apenas campos desnormalizados)

**R-AUD-004**: Captura de estado
- `dadosAntes`: snapshot do objeto ANTES da mudança
- `dadosDepois`: snapshot do objeto DEPOIS da mudança
- Ambos podem ser null (CREATE tem antes=null, DELETE tem depois=null)
- Formato: JSON genérico (aceita qualquer estrutura)

**R-AUD-005**: Timestamp
- Preenchido automaticamente com `now()` no banco
- Precisão: timestamp do banco de dados

### 3.2 Invocação do Audit

**R-AUD-006**: Responsabilidade do caller
- Cada módulo (empresas, usuarios, etc.) é responsável por chamar `AuditService.log()`
- Não há middleware automático
- Não há interceptor global

**R-AUD-007**: Padrão de integração
Exemplo de uso (de empresas.service.ts):
```typescript
const before = await this.findOne(id);
const after = await this.prisma.empresa.update(...);
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

**R-AUD-008**: Tratamento de erros no logging
- Se `AuditService.log()` falha, operação anterior (CREATE/UPDATE/DELETE) já foi confirmada
- Sem rollback automático
- Try-catch fica responsabilidade do caller

**R-AUD-009**: Extração de identidade do caller
- Nome e email são extraídos do objeto antes/depois ou do contexto
- Padrão: `before.usuarios?.find(u => u.id === userId)?.nome ?? ''`
- Se não encontrado, usa string vazia
- Sem validação que nome/email são válidos

### 3.3 Janela de Auditoria

**R-AUD-010**: Dados persistidos
- Apenas a operação é registrada
- Dados anteriores e posteriores são JSON snapshots (não histórico completo)
- Sem versionamento automático de campos
- Sem diff entre versões (diff é calculado pelo consumer)

**R-AUD-011**: Retenção
- **IMPLEMENTADO**: Nenhuma
- **NÃO IMPLEMENTADO**: Limpeza automática, arquivamento, ou compactação
- Logs crescem indefinidamente

---

## 4. Validações

### 4.1 CreateAuditLogDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| usuarioId | string | IsUUID() | ✓ |
| usuarioNome | string | IsString() | ✓ |
| usuarioEmail | string | IsEmail() | ✓ |
| entidade | string | IsString() | ✓ |
| entidadeId | string | IsUUID() | ✓ |
| acao | string | IsString(), enum: CREATE/UPDATE/DELETE | ✓ |
| dadosAntes | object | IsObject(), IsOptional() | ✗ |
| dadosDepois | object | IsObject(), IsOptional() | ✗ |

---

## 5. Comportamentos Condicionais

### 5.1 Fluxo de Criação de Entidade

```
POST /modulo (criar)
  ├─ Valida DTO
  ├─ Cria registro no banco
  ├─ Chama AuditService.log({
  │    acao: 'CREATE',
  │    dadosAntes: null (ou {}),
  │    dadosDepois: novoRegistro,
  │  })
  └─ Retorna novoRegistro
```

### 5.2 Fluxo de Atualização de Entidade

```
PATCH /modulo/:id (atualizar)
  ├─ Busca estado anterior
  ├─ Valida DTO
  ├─ Atualiza no banco
  ├─ Chama AuditService.log({
  │    acao: 'UPDATE',
  │    dadosAntes: estadoAnterior,
  │    dadosDepois: novoEstado,
  │  })
  └─ Retorna novoEstado
```

### 5.3 Fluxo de Deleção (Soft Delete)

```
DELETE /modulo/:id (deletar)
  ├─ Busca estado anterior
  ├─ Marca como inativo
  ├─ Chama AuditService.log({
  │    acao: 'DELETE',
  │    dadosAntes: estadoAnterior,
  │    dadosDepois: estadoFinal (com ativo=false),
  │  })
  └─ Retorna entidadeDesativada
```

---

## 6. Ausências ou Ambiguidades

### 6.1 Não Implementado

⚠️ **Endpoints públicos**:
- Nenhum endpoint de query de audit log
- Sem relatório de auditoria
- Sem filtros (por data, usuário, entidade, ação)
- Sem exportação de dados

⚠️ **Retenção**:
- Sem política de limpeza de logs antigos
- Sem arquivamento
- Banco cresce indefinidamente

⚠️ **Performance**:
- Sem particionamento de tabela
- Sem índices específicos para query (apenas índice em entidade+entidadeId)
- Sem cache

⚠️ **Conformidade**:
- Sem assinatura digital (não prova integridade)
- Sem criptografia de dados sensíveis
- Sem GDPR "direito ao esquecimento" (dados não podem ser deletados)

### 6.2 Ambiguidades

⚠️ **Identidade do usuário**:
- Nome e email capturados no momento, mas podem estar incorretos
- Sem validação se esses campos correspondem ao usuarioId
- Sem FK constraint

⚠️ **Identidade da entidade**:
- `entidade` é string genérico, sem enum
- Sem validação se entidade existe
- Convenção de nomes não é documentada

⚠️ **Formato de dadosAntes/Depois**:
- JSON genérico, sem schema
- Pode conter dados sensíveis (senhas, tokens, etc.)
- Sem redação/masking

⚠️ **Atomicidade**:
- Se operação é commitada mas audit.log() falha:
  - Operação permanece (não há rollback)
  - Sem alertas para operação não auditada
  - Sem retry automático

⚠️ **Controle de acesso**:
- Sem endpoint de query (não há necessidade de RBAC)
- Mas se houver, quem pode acessar logs?

### 6.3 Integração Inconsistente

⚠️ **Nem todos os módulos usam audit**:
- `empresas.service.ts`: ✓ Usa audit em update(), remove(), vincularPilares()
- `usuarios.service.ts`: Precisa validar
- `pilares.service.ts`: Precisa validar
- `rotinas.service.ts`: Precisa validar

⚠️ **LoginHistory vs. AuditLog**:
- Tentativas de login são registradas em `LoginHistory` (módulo auth)
- Não usa `AuditService`
- Dois sistemas de logging diferentes para operações diferentes

---

## 7. Endpoints

| Método | Rota | Autenticação | Roles | Descrição |
|--------|------|--------------|-------|-----------|
| — | — | — | — | Nenhum endpoint público (serviço interno) |

---

## 8. Dependências

- **NestJS** (`@nestjs/common`)
- **Prisma** para ORM
- **Nenhuma dependência de autenticação** (audit é chamado pelos controllers)

---

## Resumo Executivo

✅ **Logging centralizado** de todas as operações (CREATE, UPDATE, DELETE)  
✅ **Captura de estado completo** (antes e depois)  
✅ **Rastreamento de identidade** mesmo se usuário for deletado  

⚠️ **Não implementado**: Endpoints de query, retenção, conformidade  
⚠️ **Gap crítico**: Sem integridade (se operação falha após commit, log fica órfão)  
⚠️ **Ambiguidade**: Integração não é uniforme (alguns módulos usam, outros não)
