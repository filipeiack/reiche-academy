# Regras de Negócio — Perfis

**Módulo:** Perfis (PerfilUsuario)  
**Backend:** `backend/src/modules/perfis/`  
**Frontend:** Não implementado  
**Última extração:** 21/12/2024  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Perfis é responsável por:
- Listagem de perfis de usuário disponíveis (apenas leitura)
- Busca de perfil por código
- Fornecimento de dados para validação de hierarquia (níveis)

**Entidades principais:**
- PerfilUsuario (perfis de acesso do sistema)

**Endpoints implementados:**
- `GET /perfis` — Listar perfis ativos (autenticado)

**Observação:** Módulo READ-ONLY. Não implementa criação, atualização ou deleção de perfis.

---

## 2. Entidades

### 2.1. PerfilUsuario

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| codigo | String (unique) | Código do perfil (ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA) |
| nome | String | Nome descritivo do perfil |
| descricao | String? | Descrição detalhada do perfil |
| nivel | Int | Nível hierárquico (1 = maior poder, 5 = menor poder) |
| ativo | Boolean (default: true) | Indica se perfil está ativo |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |

**Relações:**
- `usuarios`: Usuario[] (usuários com este perfil)

**Índices:**
- `codigo` (unique)

**Hierarquia de níveis (assumida pela ordenação):**
- 1: ADMINISTRADOR (maior poder)
- 2-4: GESTOR, COLABORADOR, etc.
- 5: LEITURA (menor poder)

**Nota:** Perfis são gerenciados via seed ou migrations, não via API.

---

## 3. Regras Implementadas

### R-PERFIL-001: Listagem de Perfis Ativos

**Descrição:** Endpoint retorna apenas perfis com `ativo: true`, ordenados por hierarquia (nível).

**Implementação:**
- **Endpoint:** `GET /perfis` (requer autenticação JWT)
- **Método:** `PerfisService.findAll()`

**Filtro:**
```typescript
where: { ativo: true }
```

**Ordenação:**
```typescript
orderBy: { nivel: 'asc' }
```

**Retorno:** Perfis ordenados do maior poder (nível 1) ao menor (nível 5+)

**Dados retornados:**
```typescript
{
  id: string,
  codigo: string,
  nome: string,
  descricao: string | null,
  nivel: number
}
```

**Arquivo:** [perfis.service.ts](../../backend/src/modules/perfis/perfis.service.ts#L8-L19)

---

### R-PERFIL-002: Busca de Perfil por Código

**Descrição:** Método interno retorna perfil completo por código único.

**Implementação:**
- **Método:** `PerfisService.findByCodigo()`
- **Uso:** Validação de perfis em outros módulos (usuarios, auth)

**Comportamento:**
```typescript
await this.prisma.perfilUsuario.findUnique({
  where: { codigo },
});
```

**Retorno:** Perfil completo ou `null` se não existir.

**Arquivo:** [perfis.service.ts](../../backend/src/modules/perfis/perfis.service.ts#L21-L25)

---

### R-PERFIL-003: Autenticação Obrigatória em Listagem

**Descrição:** Listagem de perfis exige JWT válido (qualquer perfil autenticado).

**Implementação:**
- **Guard:** `@UseGuards(JwtAuthGuard)`
- **Sem restrição de perfil:** Qualquer usuário autenticado pode listar perfis

**Justificativa:** Perfis são necessários para interface de criação/edição de usuários.

**Arquivo:** [perfis.controller.ts](../../backend/src/modules/perfis/perfis.controller.ts#L7-L8)

---

## 4. Validações

### 4.1. Listagem de Perfis

**Validações:**
- Usuário deve estar autenticado (JwtAuthGuard)
- Sem validações de DTO (endpoint GET sem parâmetros)

---

### 4.2. Busca por Código

**Validações:**
- Nenhuma validação explícita (método interno)
- Retorna `null` se código não existe

---

## 5. Comportamentos Condicionais

### 5.1. Perfis Inativos Não Aparecem

**Condição:** `perfil.ativo === false`

**Comportamento:**
- Perfis inativos não são retornados em `findAll()`
- Não aparecem em listagens para seleção de perfil

**Arquivo:** [perfis.service.ts](../../backend/src/modules/perfis/perfis.service.ts#L9)

---

### 5.2. Ordenação por Hierarquia

**Condição:** Sempre

**Comportamento:**
- Perfis retornados em ordem crescente de nível (1, 2, 3, ...)
- ADMINISTRADOR aparece primeiro, LEITURA por último

**Justificativa:** Facilita seleção em interfaces (perfis mais poderosos primeiro).

**Arquivo:** [perfis.service.ts](../../backend/src/modules/perfis/perfis.service.ts#L10)

---

## 6. Ausências ou Ambiguidades

### 6.1. CRUD de Perfis Não Implementado

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Módulo é READ-ONLY
- Não existe criação, atualização ou deleção de perfis via API
- Perfis gerenciados via seed ou migrations

**Justificativa possível:**
- Perfis são configuração de sistema (não dados de negócio)
- Alteração de perfis pode quebrar lógica de autorização

**TODO (se necessário):**
- Implementar CRUD administrativo de perfis
- Validar impacto de mudança de nível em usuários existentes
- Restringir acesso apenas a ADMINISTRADOR

---

### 6.2. Validação de Níveis Duplicados

**Status:** ⚠️ NÃO VALIDADO

**Descrição:**
- Sistema assume níveis únicos, mas não há constraint no banco
- Possível ter dois perfis com mesmo nível
- Ordenação pode ser ambígua

**TODO:**
- Adicionar constraint unique em nível (se regra de negócio exigir)
- Ou documentar que níveis podem ser iguais

---

### 6.3. Documentação de Perfis Disponíveis

**Status:** ⚠️ INCOMPLETO

**Descrição:**
- Código menciona ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA
- Não documenta quais existem de fato no sistema
- Não documenta permissões de cada perfil

**TODO:**
- Documentar perfis oficiais do sistema
- Documentar matriz de permissões (RBAC)
- Listar endpoints/ações permitidas por perfil

---

### 6.4. Perfil CONSULTOR Removido?

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- Código de outros módulos menciona CONSULTOR em comentários
- RA-EMP-002 em empresas.md menciona remoção de perfil CONSULTOR
- Mas perfis.md não confirma quais perfis existem

**TODO:**
- Confirmar se CONSULTOR foi removido do seed
- Atualizar documentação de perfis disponíveis

---

### 6.5. Cache de Perfis

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Perfis raramente mudam (configuração de sistema)
- Busca no banco a cada requisição
- Ideal para cache em memória

**TODO:**
- Implementar cache de perfis (Redis ou in-memory)
- Invalidar cache apenas em mudanças de perfil (raro)

---

### 6.6. Validação de Perfil Existente em findByCodigo

**Status:** ⚠️ SEM EXCEÇÃO

**Descrição:**
- findByCodigo() retorna `null` se perfil não existe
- Não lança NotFoundException
- Módulos consumidores devem validar retorno

**Comportamento atual:**
- Responsabilidade de validação fica no módulo consumidor (ex: usuarios)

**TODO:**
- Considerar lançar NotFoundException se perfil crítico não existe
- Ou documentar que método pode retornar null

---

### 6.7. Permissões de Acesso ao Endpoint de Listagem

**Status:** ⚠️ MUITO AMPLO

**Descrição:**
- Qualquer usuário autenticado pode listar perfis
- Não restringe por perfil (sem @Roles())

**Comportamento atual:**
- LEITURA pode ver lista de perfis (ok para interface de visualização)
- COLABORADOR pode ver perfis (ok para entender hierarquia?)

**TODO:**
- Definir se listagem de perfis deve ser restrita
- Considerar endpoint público para perfis (se usado em tela de login?)

---

### 6.8. Seed de Perfis

**Status:** ⚠️ NÃO DOCUMENTADO

**Descrição:**
- Perfis devem ser criados via seed (já que não há CRUD)
- Não documenta quais perfis são criados no seed
- Não documenta níveis atribuídos

**TODO:**
- Documentar seed de perfis
- Listar perfis iniciais do sistema
- Especificar níveis de cada perfil

---

### 6.9. Relação com RolesGuard

**Status:** ✅ IMPLEMENTADO (Observação)

**Descrição:**
- Perfis são usados em `@Roles()` decorator
- RolesGuard valida perfil do usuário (código do perfil)
- Relação está em módulo auth, não perfis

**Arquivo referência:** [roles.decorator.ts](../../backend/src/modules/auth/decorators/roles.decorator.ts)

---

### 6.10. Validação de Hierarquia em Outros Módulos

**Status:** ✅ IMPLEMENTADO (Observação)

**Descrição:**
- Hierarquia de níveis é usada em:
  - UsuariosService.validateProfileElevation() (RA-004)
- Validação impede criação/edição de perfil superior ao do usuário

**Arquivo referência:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L33-L54)

---

## 7. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-PERFIL-001** | Listagem de perfis ativos | ✅ Implementado |
| **R-PERFIL-002** | Busca por código | ✅ Implementado |
| **R-PERFIL-003** | Autenticação obrigatória | ✅ Implementado |

**Ausências críticas:**
- ❌ CRUD de perfis (apenas leitura)
- ❌ Cache de perfis
- ⚠️ Documentação de perfis disponíveis no sistema
- ⚠️ Seed de perfis não documentado

---

## 8. Perfis Conhecidos (Mencionados no Código)

| Código | Nome (assumido) | Nível (assumido) | Status |
|--------|-----------------|------------------|--------|
| ADMINISTRADOR | Administrador | 1 | ✅ Ativo |
| GESTOR | Gestor | 2-3 | ✅ Ativo |
| COLABORADOR | Colaborador | 3-4 | ✅ Ativo |
| LEITURA | Leitura | 5 | ✅ Ativo |
| CONSULTOR | Consultor | ? | ❓ Removido (RA-EMP-002) |

**Nota:** Dados baseados em menções no código. Não confirmados por seed ou documentação oficial.

---

## 9. Matriz de Permissões (Observada no Código)

| Perfil | Criar Empresa | Editar Empresa | Deletar Empresa | Criar Usuário | Editar Usuário | Deletar Usuário |
|--------|---------------|----------------|-----------------|---------------|----------------|-----------------|
| **ADMINISTRADOR** | ✅ | ✅ | ✅ | ✅ | ✅ (todos) | ✅ |
| **GESTOR** | ❌ | ✅ (própria) | ❌ | ❌ | ✅ (mesma empresa) | ❌ |
| **COLABORADOR** | ❌ | ❌ | ❌ | ❌ | ✅ (limitado) | ❌ |
| **LEITURA** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

**Nota:** Matriz inferida de `@Roles()` em controllers. Não é documentação oficial.

---

## 10. Referências

**Arquivos principais:**
- [perfis.service.ts](../../backend/src/modules/perfis/perfis.service.ts)
- [perfis.controller.ts](../../backend/src/modules/perfis/perfis.controller.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (PerfilUsuario)

**Uso em outros módulos:**
- [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts) (validateProfileElevation)
- [roles.decorator.ts](../../backend/src/modules/auth/decorators/roles.decorator.ts) (Role type)
- [roles.guard.ts](../../backend/src/modules/auth/guards/roles.guard.ts) (validação de perfil)

---

**Observação final:**  
Este documento reflete APENAS o código IMPLEMENTADO.  
Módulo Perfis é READ-ONLY e muito simples.  
Regras de autorização baseadas em perfis estão implementadas em outros módulos (auth, usuarios, empresas).
