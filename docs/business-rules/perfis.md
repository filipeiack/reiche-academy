# Regras de Negócio — Módulo PERFIS

**Data de extração**: 2025-12-21  
**Escopo**: Definição e hierarquia de perfis de usuário (RBAC)

---

## 1. Visão Geral

O módulo PERFIS implementa:
- Definição de perfis de usuário (roles) do sistema
- Hierarquia de perfis baseada em nível
- CRUD limitado de perfis (apenas leitura implementada)
- Suporte a soft delete (desativação)

**Perfis predefinidos no sistema**:
- ADMINISTRADOR (nível 1)
- CONSULTOR (nível 2)
- GESTOR (nível 3)
- COLABORADOR (nível 4)
- LEITURA (nível 5)

---

## 2. Entidades

### 2.1 PerfilUsuario
```
- id: UUID (PK)
- codigo: String (UNIQUE) — identificador constante do perfil (ADMINISTRADOR, CONSULTOR, etc.)
- nome: String — nome legível do perfil
- descricao: String (nullable) — descrição das responsabilidades
- nivel: Int — hierarquia (1=maior poder, 5=menor poder)
- ativo: Boolean (default: true) — marca soft delete
- createdAt: DateTime — data de criação
- updatedAt: DateTime — data da última atualização
- usuarios: Usuario[] — usuários com este perfil
```

---

## 3. Regras Implementadas

### 3.1 Leitura de Perfis

**R-PER-001**: Listagem de perfis
- Endpoint `GET /perfis` retorna todos os perfis ativos
- Apenas campos retornados: `id, codigo, nome, descricao, nivel`
- Ordenação: `nivel ASC` (perfis com menor número primeiro)
- Filtro: `ativo: true`

**R-PER-002**: Acesso restrito
- Requer autenticação (JWT)
- Requer `JwtAuthGuard`
- Nenhuma validação adicional de perfil para acessar lista

**R-PER-003**: Busca por código
- Método interno `findByCodigo(codigo: string)` no service
- Retorna perfil completo (incluindo usuários)
- Sem endpoint HTTP correspondente

### 3.2 Hierarquia de Perfis

**R-PER-004**: Níveis de acesso
| Nível | Código | Descrição |
|-------|--------|-----------|
| 1 | ADMINISTRADOR | Controla todo o sistema e outras empresas |
| 2 | CONSULTOR | Pode criar/editar empresas e usuários, gerencia pilares |
| 3 | GESTOR | Gerencia apenas sua empresa e usuários |
| 4 | COLABORADOR | Visualiza e executa, sem criar |
| 5 | LEITURA | Apenas leitura |

**R-PER-005**: Permissões por perfil (baseado em uso no código)
| Operação | ADMINISTRADOR | CONSULTOR | GESTOR | COLABORADOR | LEITURA |
|----------|:---:|:---:|:---:|:---:|:---:|
| Criar Empresa | ✓ | ❌ | ❌ | ❌ | ❌ |
| Listar Empresas | ✓ (todas) | ✓ (todas?) | ✓ (sua) | ❌ | ❌ |
| Atualizar Empresa | ✓ | ✓ | ✓ | ❌ | ❌ |
| Deletar Empresa | ✓ | ✓ | ❌ | ❌ | ❌ |
| Gerenciar Perfis | ✓ | ❌ | ❌ | ❌ | ❌ |
| Gerenciar Usuários | ✓ | ✓ | ✓ (sua empresa) | ❌ | ❌ |
| Visualizar Audit | ✓ | ? | ? | ❌ | ❌ |
| Criar Pilares | ✓ | ? | ✓ (?)  | ❌ | ❌ |

**OBSERVAÇÃO**: Alguns permissões não estão claramente definidas no código. Vide seção 6.

### 3.3 Atribuição de Perfis

**R-PER-006**: Associação usuário-perfil
- Um usuário tem exatamente um `perfilId` (FK em Usuario)
- Cada usuário tem acesso ao objeto `Perfil` completo
- Perfil é incluído em queries de usuário

**R-PER-007**: Comparação de perfis em RBAC
- JWT payload contém `perfil: payload.perfil` (pode ser string ou objeto)
- Código verifica: `typeof perfil === 'object' ? perfil.codigo : perfil`
- Permite compatibilidade se JWT armazena apenas código ou objeto completo

### 3.4 Soft Delete

**R-PER-008**: Desativação de perfis
- Perfis inativos (`ativo: false`) não aparecem na listagem
- Usuários com perfil inativo permanecem com esse perfil (sem cascata)
- Sem endpoint de deleção implementado

---

## 4. Validações

### 4.1 Listagem
| Campo | Restrição |
|-------|-----------|
| status | Apenas `ativo: true` |
| ordem | `nivel ASC` |

---

## 5. Comportamentos Condicionais

### 5.1 Fluxo de Listagem

```
GET /perfis (requer autenticação)
  └─ ✓ Retorna
     ├─ SELECT id, codigo, nome, descricao, nivel
     ├─ WHERE ativo: true
     ├─ ORDER BY nivel ASC
     └─ Retorna array de perfis
```

### 5.2 Fluxo de Detecção de Perfil (Frontend)

```
Frontend detecta permissões:
  ├─ typeof perfil === 'object'?
  │  ├─ Sim → usa perfil.codigo
  │  └─ Não → usa perfil como string
  ├─ Verifica se perfil está em lista permitida
  └─ Habilita/desabilita features
```

---

## 6. Ausências ou Ambiguidades

### 6.1 Operações Não Implementadas

⚠️ **NÃO IMPLEMENTADO**:
1. Criar novo perfil
2. Atualizar perfil
3. Deletar perfil
4. Moderar permissões de perfis

**Motivo**: Perfis provavelmente são pré-configurados na seed do banco.

### 6.2 Permissões Ambíguas

⚠️ **NÃO DEFINIDO CLARAMENTE**:
1. Pode CONSULTOR listar TODAS as empresas?
2. Pode GESTOR criar usuários em sua empresa?
3. Pode COLABORADOR editar seus próprios dados?
4. Qual perfil pode criar pilares?
5. Qual perfil pode visualizar audit log?

Diferentes endpoints têm interpretações diferentes de `@Roles`:
- `GET /empresas` filtra por empresa (GESTOR vê apenas sua)
- `GET /empresas/:id` permite CONSULTOR (vê todas?)
- `POST /pilares` pode ter lógica diferente

### 6.3 Política de Atribuição

⚠️ **NÃO DEFINIDO**:
1. Quem pode atribuir perfis a usuários?
2. ADMINISTRADOR pode atribuir a si mesmo?
3. CONSULTOR pode criar usuário ADMINISTRADOR?
4. Validação de promoção de perfil (nível 5 → nível 1)?

### 6.4 Representação em JWT

⚠️ **INCONSISTENTE**:
- `auth.service.ts` coloca `perfil: usuario.perfil?.codigo || usuario.perfil`
- Alguns controllers verificam `perfil.codigo`, outros usam `perfil` como string
- Não há normalização clara

### 6.5 Seed de Dados

⚠️ **NÃO DOCUMENTADO**:
- Valores iniciais dos perfis vêm de `seed.ts`
- Sem validação se perfis necessários existem
- Sem proteção contra remoção de perfis críticos

---

## 7. Endpoints

| Método | Rota | Autenticação | Roles | Descrição |
|--------|------|--------------|-------|-----------|
| GET | `/perfis` | ✓ | — | Listar perfis ativos |

---

## 8. Dependências

- **NestJS** (`@nestjs/common`)
- **Prisma** para ORM
- **JwtAuthGuard** para validação de token

---

## Resumo Executivo

✅ **Hierarquia clara** com 5 níveis de permissão  
✅ **Soft delete** implementado  
✅ **Integração RBAC** com módulo AUTH  

⚠️ **Não implementado**: CRUD de perfis, moderação de permissões  
⚠️ **Gap crítico**: Permissões por perfil não estão centralizadas (espalhadas em cada módulo)  
⚠️ **Ambiguidade**: Representação de perfil inconsistente em JWT (objeto vs. string)
