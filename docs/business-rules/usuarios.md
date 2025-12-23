# Regras de Negócio — Usuarios

**Módulo:** Usuarios  
**Backend:** `backend/src/modules/usuarios/`  
**Frontend:** Não implementado  
**Última extração:** 21/12/2024  
**Última atualização:** 23/12/2024 (pós-Reviewer de Regras)  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Usuarios é responsável por:
- Gestão de cadastro de usuários (CRUD)
- Controle de perfis e permissões (RBAC via PerfilUsuario)
- Isolamento multi-tenant (usuários por empresa)
- Validação de elevação de perfil (hierarquia de níveis)
- Upload e gestão de fotos de perfil
- Auditoria de alterações em usuários
- Soft delete e hard delete de usuários

**Entidades principais:**
- Usuario (dados pessoais, autenticação, vinculação empresa/perfil)
- PerfilUsuario (perfis de acesso: ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA)

**Endpoints implementados:**
- `POST /usuarios` — Criar usuário (ADMINISTRADOR)
- `GET /usuarios` — Listar todos usuários (ADMINISTRADOR)
- `GET /usuarios/disponiveis/empresa` — Listar usuários sem empresa (ADMINISTRADOR)
- `GET /usuarios/:id` — Buscar usuário por ID
- `PATCH /usuarios/:id` — Atualizar usuário (ADMINISTRADOR/GESTOR/COLABORADOR)
- `DELETE /usuarios/:id` — Deletar permanentemente (ADMINISTRADOR)
- `PATCH /usuarios/:id/inativar` — Soft delete (ADMINISTRADOR)
- `POST /usuarios/:id/foto` — Upload de foto (ADMINISTRADOR/GESTOR/COLABORADOR)
- `DELETE /usuarios/:id/foto` — Deletar foto (ADMINISTRADOR/GESTOR/COLABORADOR)

---

## 2. Entidades

### 2.1. Usuario

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| email | String (unique) | Email do usuário (login) |
| nome | String | Nome completo |
| senha | String | Senha hash (argon2) |
| cargo | String | Cargo/função do usuário |
| telefone | String? | Telefone de contato |
| fotoUrl | String? | URL da foto de perfil |
| ativo | Boolean (default: true) | Indica se usuário está ativo |
| perfilId | String (FK) | Referência ao perfil de acesso |
| empresaId | String? (FK) | Referência à empresa (nullable) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário criador |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `perfil`: PerfilUsuario (perfil de acesso)
- `empresa`: Empresa? (empresa vinculada, opcional)
- `reunioes`: AgendaReuniao[]
- `passwordResets`: PasswordReset[]
- `loginHistory`: LoginHistory[]

**Índices:**
- `email` (unique)

---

### 2.2. PerfilUsuario

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| codigo | String (unique) | Código do perfil (ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA) |
| nome | String | Nome descritivo do perfil |
| descricao | String? | Descrição do perfil |
| nivel | Int | Nível hierárquico (1 = maior poder, 5 = menor poder) |
| ativo | Boolean (default: true) | Indica se perfil está ativo |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |

**Relações:**
- `usuarios`: Usuario[]

**Índices:**
- `codigo` (unique)

**Hierarquia de níveis:**
- 1: ADMINISTRADOR (maior poder)
- 2-4: GESTOR, COLABORADOR, etc.
- 5: LEITURA (menor poder)

---

## 3. Regras Implementadas

### R-USU-001: Validação de Email Único

**Descrição:** Email deve ser único no sistema. Não permite duplicação.

**Implementação:**
- **Endpoint:** `POST /usuarios`
- **Método:** `UsuariosService.create()`

**Comportamento:**
1. Busca usuário existente por email
2. Se encontrar → ConflictException("Email já cadastrado")
3. Se único → permite criação

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L208-L211)

---

### R-USU-002: Hash de Senha com Argon2

**Descrição:** Senha é armazenada com hash argon2 (não plaintext).

**Implementação:**
- **Biblioteca:** `argon2`
- **Método:** `argon2.hash()`

**Comportamento:**
```typescript
const hashedPassword = await argon2.hash(data.senha);
```

**Aplicado em:**
- create()
- update() (se senha fornecida)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L216)

---

### R-USU-003: Validação de Senha Forte

**Descrição:** Senha deve atender requisitos de segurança: mínimo 8 caracteres, incluindo letra maiúscula, letra minúscula, número e caractere especial.

**Implementação:**
- **DTO:** `CreateUsuarioDto`
- **Validações:** 
  - `@MinLength(8)` — Mínimo 8 caracteres
  - `@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)` — Complexidade

**Mensagem de erro:** "A senha deve conter letra maiúscula, minúscula, número e caractere especial"

**Justificativa:** Alinhado com OWASP Password Guidelines para segurança aprimorada.

**Arquivo:** [create-usuario.dto.ts](../../backend/src/modules/usuarios/dto/create-usuario.dto.ts#L19-L29)

---

### R-USU-004: Validação de Elevação de Perfil (RA-004)

**Descrição:** Usuário não pode criar/editar usuário com perfil superior ao seu.

**Implementação:**
- **Método privado:** `validateProfileElevation()`

**Comportamento:**
1. **ADMINISTRADOR:** Pode criar/editar qualquer perfil (sem validação)
2. **Outros perfis:** Valida `targetPerfil.nivel < requestUser.perfil.nivel`
   - Se sim → ForbiddenException("Você não pode criar/atribuir usuário com perfil superior ao seu")
   - Se não → permite

**Aplicado em:**
- create() — valida perfilId fornecido
- update() — valida se há mudança de perfilId

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L33-L54)

---

### R-USU-005: Isolamento Multi-Tenant (RA-001)

**Descrição:** ADMINISTRADOR tem acesso global. Outros perfis só acessam usuários da mesma empresa.

**Implementação:**
- **Método privado:** `validateTenantAccess()`

**Comportamento:**
1. **ADMINISTRADOR:** Acesso global (sem validação)
2. **Outros perfis:** Valida `targetUsuario.empresaId === requestUser.empresaId`
   - Se diferente → ForbiddenException("Você não pode [ação] usuários de outra empresa")
   - Se igual → permite

**Métodos que validam:**
- findById()
- update()
- updateProfilePhoto()
- deleteProfilePhoto()

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L19-L30)

---

### R-USU-006: Bloqueio de Auto-Edição de Campos Privilegiados (RA-002)

**Descrição:** Usuário não pode alterar perfilId, empresaId ou ativo no próprio cadastro.

**Implementação:**
- **Método:** `update()`

**Comportamento:**
1. Detecta auto-edição: `isSelfEdit = id === requestUser.id`
2. Se auto-edição, valida se tenta alterar: `perfilId`, `empresaId`, `ativo`
3. Se tentar → ForbiddenException("Você não pode alterar perfilId, empresaId ou ativo no seu próprio usuário")
4. Se não → permite atualização de outros campos (nome, cargo, senha, etc.)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L276-L285)

---

### R-USU-007: Permissão de Upload de Foto (RA-003)

**Descrição:** Apenas ADMINISTRADOR ou o próprio usuário pode alterar foto.

**Implementação:**
- **Método:** `updateProfilePhoto()`

**Comportamento:**
1. Valida: `requestUser.perfil.codigo === 'ADMINISTRADOR' || requestUser.id === id`
2. Se não → ForbiddenException("Você não pode alterar a foto de outro usuário")
3. Se sim → permite upload

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L378-L381)

---

### R-USU-008: Permissão de Deleção de Foto (RA-003)

**Descrição:** Apenas ADMINISTRADOR ou o próprio usuário pode deletar foto.

**Implementação:**
- **Método:** `deleteProfilePhoto()`

**Comportamento:**
1. Valida: `requestUser.perfil.codigo === 'ADMINISTRADOR' || requestUser.id === id`
2. Se não → ForbiddenException("Você não pode deletar a foto de outro usuário")
3. Se sim → permite deleção

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L437-L440)

---

### R-USU-009: Listagem de Todos os Usuários (ADMINISTRADOR)

**Descrição:** Endpoint retorna todos os usuários do sistema (sem filtro de empresa).

**Implementação:**
- **Endpoint:** `GET /usuarios` (apenas ADMINISTRADOR)
- **Método:** `UsuariosService.findAll()`

**Dados retornados:**
```typescript
{
  id, email, nome, cargo, perfil, fotoUrl, ativo,
  empresaId, createdAt, updatedAt
}
```

**Nota:** Senha NÃO é retornada (select explícito sem campo senha).

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L67-L86)

---

### R-USU-010: Listagem de Usuários Disponíveis (Sem Empresa)

**Descrição:** Endpoint retorna usuários ativos sem empresa vinculada.

**Implementação:**
- **Endpoint:** `GET /usuarios/disponiveis/empresa` (apenas ADMINISTRADOR)
- **Método:** `UsuariosService.findDisponiveis()`

**Filtros:**
```typescript
where: {
  empresaId: null,
  ativo: true,
}
```

**Ordenação:** Por nome (asc)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L88-L111)

---

### R-USU-011: Busca de Usuário por ID com Validação Multi-Tenant

**Descrição:** Busca usuário por ID retorna dados completos, validando isolamento multi-tenant.

**Implementação:**
- **Endpoint:** `GET /usuarios/:id`
- **Método:** `UsuariosService.findById()`

**Comportamento:**
1. Busca usuário por ID
2. Se não existe → NotFoundException("Usuário não encontrado")
3. Valida isolamento multi-tenant (RA-001)
4. Se válido → retorna dados completos (incluindo empresa)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L113-L147)

---

### R-USU-012: Busca de Usuário por Email (Interno)

**Descrição:** Método interno retorna usuário por email com perfil e empresa.

**Implementação:**
- **Método:** `findByEmail()`
- **Uso:** Autenticação (módulo Auth), validação de duplicação

**Dados incluídos:**
- perfil (id, codigo, nome, nivel)
- empresa (id, nome, cnpj, logoUrl)
- senha (para validação de login)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L164-L182)

---

### R-USU-012B: Busca de Usuário por ID (Interno, Sem Validação Multi-Tenant)

**Descrição:** Método interno que busca usuário por ID sem aplicar validação de isolamento multi-tenant.

**Implementação:**
- **Método:** `findByIdInternal()`
- **Uso:** Módulo Auth (refresh token), delegação interna em `findById()`

**⚠️ Importante:** Este método **bypassa validação multi-tenant** (RA-001) intencionalmente.

**Justificativa:** 
- Necessário para o módulo Auth validar refresh tokens sem contexto de empresa
- Usado como delegação interna por `findById()` que aplica validação posteriormente

**Dados incluídos:**
- Usuário completo com perfil e empresa
- **Não** aplica `validateTenantAccess()`

**Restrição de uso:** Apenas para uso interno (não exposto em controller).

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L127-L162)

---

### R-USU-013: Auditoria em Criação de Usuário

**Descrição:** Sistema registra auditoria ao criar usuário.

**Implementação:**
- **Serviço:** `AuditService.log()`
- **Dados registrados:**
  - usuarioId: ID do usuário criado
  - usuarioNome, usuarioEmail: dados do usuário criado
  - entidade: "usuarios"
  - entidadeId: ID do usuário criado
  - acao: "CREATE"
  - dadosDepois: estado do usuário criado (senha: "[REDACTED]")

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L238-L247)

---

### R-USU-014: Auditoria em Atualização de Usuário

**Descrição:** Sistema registra auditoria ao atualizar usuário.

**Implementação:**
- **Ação:** "UPDATE"
- **Dados:** dadosAntes e dadosDepois (senha: "[REDACTED]" em ambos)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L317-L327)

---

### R-USU-015: Soft Delete de Usuário (Inativação)

**Descrição:** Inativação apenas seta `ativo: false`, sem exclusão física.

**Implementação:**
- **Endpoint:** `PATCH /usuarios/:id/inativar` (apenas ADMINISTRADOR)
- **Método:** `UsuariosService.remove()`

**Comportamento:**
```typescript
await this.prisma.usuario.update({
  where: { id },
  data: { ativo: false },
});
```

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L333-L347)

---

### R-USU-016: Hard Delete de Usuário

**Descrição:** Deleção física remove usuário do banco e deleta foto do sistema de arquivos.

**Implementação:**
- **Endpoint:** `DELETE /usuarios/:id` (apenas ADMINISTRADOR)
- **Método:** `UsuariosService.hardDelete()`

**Comportamento:**
1. Busca usuário
2. Se tem foto → deleta arquivo físico (`deleteFileIfExists()`)
3. Registra auditoria com acao: "DELETE"
4. Executa `prisma.usuario.delete()`

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L349-L371)

---

### R-USU-017: Upload de Foto com Validação de Tipo

**Descrição:** Sistema aceita apenas imagens JPG, JPEG, PNG ou WebP.

**Implementação:**
- **Endpoint:** `POST /usuarios/:id/foto`
- **Interceptor:** `FileInterceptor` com fileFilter

**Validação:**
```typescript
fileFilter: (req, file, cb) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(new BadRequestException('Apenas imagens JPG, PNG ou WebP são permitidas'), false);
  }
}
```

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L116-L120)

---

### R-USU-018: Limite de Tamanho de Foto (5MB)

**Descrição:** Foto não pode exceder 5MB.

**Implementação:**
- **Validação:** `limits: { fileSize: 5 * 1024 * 1024 }`

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L122)

---

### R-USU-019: Nome de Arquivo de Foto Único

**Descrição:** Foto salva com nome aleatório (32 caracteres hex).

**Implementação:**
```typescript
filename: (req, file, cb) => {
  const randomName = Array(32)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  cb(null, `${randomName}${extname(file.originalname)}`);
}
```

**Destino:** `public/images/faces/`

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L106-L113)

---

### R-USU-020: Exclusão de Foto Anterior ao Atualizar

**Descrição:** Ao fazer upload de nova foto, sistema deleta foto anterior do sistema de arquivos.

**Implementação:**
- **Método:** `updateProfilePhoto()`

**Comportamento:**
```typescript
if (usuario.fotoUrl && usuario.fotoUrl !== fotoUrl) {
  const oldFilePath = this.getAbsolutePublicPath(usuario.fotoUrl);
  this.deleteFileIfExists(oldFilePath);
}
```

**Justificativa:** Evitar acúmulo de arquivos não utilizados.

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L386-L390)

---

### R-USU-021: Auditoria em Upload de Foto

**Descrição:** Sistema registra auditoria ao atualizar foto.

**Implementação:**
- **Ação:** "UPDATE"
- **Dados:** dadosAntes (fotoUrl antigo) e dadosDepois (fotoUrl novo)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L412-L422)

---

### R-USU-022: Deleção de Foto do Sistema de Arquivos

**Descrição:** Ao deletar foto, sistema remove arquivo físico e seta fotoUrl: null.

**Implementação:**
- **Endpoint:** `DELETE /usuarios/:id/foto`
- **Método:** `deleteProfilePhoto()`

**Comportamento:**
1. Valida permissão (RA-003)
2. Valida isolamento multi-tenant (RA-001)
3. Deleta arquivo físico: `deleteFileIfExists()`
4. Atualiza banco: `fotoUrl: null`
5. Registra auditoria

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L444-L448)

---

### R-USU-023: Auditoria em Deleção de Foto

**Descrição:** Sistema registra auditoria ao deletar foto.

**Implementação:**
- **Ação:** "UPDATE"
- **Dados:** dadosAntes (fotoUrl preenchido) e dadosDepois (fotoUrl: null)

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L466-L476)

---

### R-USU-024: Senha Redacted em Auditoria

**Descrição:** Campo senha é sempre substituído por "[REDACTED]" em logs de auditoria.

**Implementação:**
```typescript
dadosAntes: { ...before, senha: '[REDACTED]' },
dadosDepois: { ...after, senha: '[REDACTED]' }
```

**Aplicado em:**
- create()
- update()
- remove()
- hardDelete()

**Justificativa:** Segurança — não expor hash de senha em logs.

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L246)

---

### R-USU-025: Hash de Senha em Atualização

**Descrição:** Se senha fornecida em update, sistema faz hash antes de salvar.

**Implementação:**
```typescript
if (data.senha) {
  data.senha = await argon2.hash(data.senha);
}
```

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L292-L294)

---

### R-USU-026: Validação de Upload Sem Arquivo

**Descrição:** Se nenhum arquivo enviado, sistema lança exceção.

**Implementação:**
```typescript
if (!file) {
  throw new BadRequestException('Nenhuma imagem foi enviada');
}
```

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L128-L130)

---

### R-USU-027: Criação Apenas por ADMINISTRADOR

**Descrição:** Apenas ADMINISTRADOR pode criar novos usuários.

**Implementação:**
- **Controller:** `@Roles('ADMINISTRADOR')`

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L34-L35)

---

### R-USU-028: Deleção Apenas por ADMINISTRADOR

**Descrição:** Apenas ADMINISTRADOR pode fazer soft delete ou hard delete.

**Implementação:**
- **Inativar:** `@Roles('ADMINISTRADOR')` em `PATCH /usuarios/:id/inativar`
- **Deletar:** `@Roles('ADMINISTRADOR')` em `DELETE /usuarios/:id`

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L72-L79)

---

### R-USU-029: Atualização por ADMINISTRADOR/GESTOR/COLABORADOR

**Descrição:** ADMINISTRADOR, GESTOR e COLABORADOR podem atualizar usuários (com validações de isolamento).

**Implementação:**
- **Controller:** `@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')`

**Observação:** Validações adicionais em service:
- RA-001 (isolamento multi-tenant)
- RA-002 (auto-edição de campos privilegiados)
- RA-004 (elevação de perfil)

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L63-L64)

---

### R-USU-030: Validação de Unicidade de Email em Update

**Descrição:** Ao atualizar email de usuário, sistema valida se novo email já está em uso por outro usuário.

**Implementação:**
- **Método:** `update()`
- **Validação:** Executada apenas se email for fornecido e diferente do atual

**Comportamento:**
1. Verifica se `data.email` foi fornecido
2. Verifica se email é diferente do atual: `data.email !== before.email`
3. Busca usuário existente com novo email: `findByEmail(data.email)`
4. Se encontrado **e** não for o próprio usuário → ConflictException("Email já cadastrado por outro usuário")
5. Se não encontrado ou for o próprio usuário → permite atualização

**Código:**
```typescript
if (data.email && data.email !== before.email) {
  const existingUser = await this.findByEmail(data.email);
  
  if (existingUser && existingUser.id !== id) {
    throw new ConflictException('Email já cadastrado por outro usuário');
  }
}
```

**Justificativa:** Garante unicidade de email também em atualizações, complementando R-USU-001 (criação).

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L280-L284)

**Testes:** `deve lançar ConflictException se tentar atualizar para email já existente` (usuarios.service.spec.ts)

---

## 4. Validações

### 4.1. CreateUsuarioDto

**Arquivo:** [create-usuario.dto.ts](../../backend/src/modules/usuarios/dto/create-usuario.dto.ts)

| Campo | Validações |
|-------|-----------|
| email | `@IsEmail()`, `@IsNotEmpty()` |
| nome | `@IsString()`, `@IsNotEmpty()`, `@Length(2, 100)` |
| senha | `@IsString()`, `@IsNotEmpty()`, `@MinLength(6)` |
| cargo | `@IsString()`, `@IsNotEmpty()`, `@Length(2, 100)` |
| telefone | `@IsString()`, `@IsOptional()` |
| perfilId | `@IsUUID()`, `@IsNotEmpty()` |
| empresaId | `@IsUUID()`, `@IsOptional()` |

---

### 4.2. UpdateUsuarioDto

**Arquivo:** [update-usuario.dto.ts](../../backend/src/modules/usuarios/dto/update-usuario.dto.ts)

Estende `PartialType(CreateUsuarioDto)` + campo adicional:

| Campo | Validações |
|-------|-----------|
| ativo | `@IsBoolean()`, `@IsOptional()` |

**Nota:** Todos os campos do CreateUsuarioDto tornam-se opcionais.

---

### 4.3. Upload de Foto

**Validações:**
- **Tipo de arquivo:** JPG, JPEG, PNG, WebP
- **Tamanho máximo:** 5MB
- **Destino:** `public/images/faces/`

---

## 5. Comportamentos Condicionais

### 5.1. Isolamento Multi-Tenant (validateTenantAccess)

**Condição:** Perfil e empresaId do usuário vs empresaId do recurso

**Comportamento:**
1. **ADMINISTRADOR:** Acesso global (sem validação)
2. **Outros perfis:** Valida `targetUsuario.empresaId === requestUser.empresaId`
   - Se diferente → ForbiddenException
   - Se igual → permite

**Métodos que validam:**
- findById()
- update()
- updateProfilePhoto()
- deleteProfilePhoto()

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L19-L30)

---

### 5.2. Elevação de Perfil (validateProfileElevation)

**Condição:** Perfil do usuário logado vs perfil alvo (baseado em nível)

**Comportamento:**
1. **ADMINISTRADOR:** Pode criar/editar qualquer perfil (sem validação)
2. **Outros perfis:** Valida `targetPerfil.nivel < requestUser.perfil.nivel`
   - Se sim (nível menor = mais poder) → ForbiddenException
   - Se não → permite

**Métodos que validam:**
- create() — valida perfilId fornecido
- update() — valida se há mudança de perfilId

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L33-L54)

---

### 5.3. Auto-Edição de Campos Privilegiados

**Condição:** `isSelfEdit = id === requestUser.id`

**Comportamento:**
- Se auto-edição E tenta alterar `perfilId`, `empresaId` ou `ativo`
  - → ForbiddenException
- Se auto-edição E altera apenas outros campos (nome, cargo, senha)
  - → Permite
- Se não é auto-edição
  - → Valida isolamento multi-tenant e elevação de perfil

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L276-L285)

---

### 5.4. Permissão de Alteração de Foto

**Condição:** `requestUser.perfil.codigo === 'ADMINISTRADOR' || requestUser.id === id`

**Comportamento:**
- **ADMINISTRADOR:** Pode alterar foto de qualquer usuário
- **Próprio usuário:** Pode alterar própria foto
- **Outros casos:** ForbiddenException

**Métodos que validam:**
- updateProfilePhoto()
- deleteProfilePhoto()

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L378-L381)

---

### 5.5. Email Duplicado

**Condição:** Email já cadastrado em outro usuário

**Comportamento:**
- ConflictException("Email já cadastrado")

**Aplicado em:**
- create()

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L208-L211)

---

### 5.6. Usuário Não Encontrado

**Condição:** Usuário com ID não existe

**Comportamento:**
- NotFoundException("Usuário não encontrado")

**Métodos que validam:**
- findById()
- findByIdInternal()

---

### 5.7. Upload Sem Arquivo

**Condição:** `!file` após interceptor

**Comportamento:**
- BadRequestException("Nenhuma imagem foi enviada")

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L128-L130)

---

### 5.8. Tipo de Arquivo Inválido em Upload

**Condição:** Mimetype não é jpg/jpeg/png/webp

**Comportamento:**
- BadRequestException("Apenas imagens JPG, PNG ou WebP são permitidas")

**Arquivo:** [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts#L117-L119)

---

### 5.9. Exclusão de Foto Anterior ao Atualizar

**Condição:** `usuario.fotoUrl && usuario.fotoUrl !== fotoUrl`

**Comportamento:**
1. Deleta arquivo físico antigo
2. Salva nova foto
3. Atualiza banco com novo fotoUrl

**Justificativa:** Evitar acúmulo de arquivos não utilizados.

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L386-L390)

---

### 5.10. Perfil Não Encontrado em Elevação

**Condição:** perfilId fornecido não existe no banco

**Comportamento:**
- NotFoundException("Perfil não encontrado")

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L44-L46)

---

## 6. Ausências ou Ambiguidades

### 6.1. Validação de Senha Forte

**Status:** ⚠️ INCOMPLETO

**Descrição:**
- CreateUsuarioDto exige `@MinLength(6)` apenas
- Não valida complexidade (maiúsculas, números, caracteres especiais)
- Módulo Auth exige senha forte em reset, mas não em criação de usuário

**TODO:**
- Aplicar mesma validação de reset de senha (R-AUTH-009)
- Adicionar `@Matches()` com regex de senha forte
- Consistência entre criação e reset

---

#### 💡 **Regra Candidata: R-USU-031 (MODO B)**

**Origem:** Intenção humana (22/12/2024)  
**Prioridade:** ALTA  
**Tipo:** Validação de senha forte

**Descrição:** Sistema deve exigir senha forte na criação de usuário, aplicando os mesmos critérios de complexidade usados em reset de senha (R-AUTH-009).

**Implementação esperada:**
- **Arquivo:** `backend/src/modules/usuarios/dto/create-usuario.dto.ts`
- **Campo:** `senha`
- **Momento:** Validação automática via class-validator

**Validações esperadas:**
```typescript
@IsString()
@IsNotEmpty()
@MinLength(8) // alterado de 6 para 8
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
  message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)',
})
senha: string;
```

**Critérios de senha forte:**
- ✅ Mínimo 8 caracteres (aumentado de 6)
- ✅ Pelo menos 1 letra maiúscula
- ✅ Pelo menos 1 letra minúscula
- ✅ Pelo menos 1 número
- ✅ Pelo menos 1 caractere especial (@$!%*?&)

**Casos de uso:**
1. **Senha fraca (só letras minúsculas):** BadRequestException (400) com mensagem de validação
2. **Senha fraca (sem números):** BadRequestException (400)
3. **Senha fraca (sem caracteres especiais):** BadRequestException (400)
4. **Senha forte (atende todos critérios):** Permite criação

**Validações adicionais:**
- ✅ Regex idêntico ao usado em R-AUTH-009 (reset de senha)
- ✅ Mensagem de erro clara e específica
- ✅ Validação automática via class-validator (não requer lógica adicional no service)

**Exceções:**
- `BadRequestException` (400) com mensagem: "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)"

**Impacto:**
- **Performance:** Zero (validação no DTO)
- **UX:** Mensagem de erro clara para usuário final
- **Segurança:** Aumenta significativamente a segurança das senhas no sistema
- **Consistência:** Alinha criação com reset de senha

**Arquivo de implementação:**
- `backend/src/modules/usuarios/dto/create-usuario.dto.ts`
- Linha esperada: ~19-26 (campo senha)

**Testes esperados:**
```typescript
describe('R-USU-031: Validação de senha forte na criação', () => {
  it('deve rejeitar senha com menos de 8 caracteres', async () => {
    // senha: "Pass1@" → BadRequestException
  });

  it('deve rejeitar senha sem letra maiúscula', async () => {
    // senha: "password1@" → BadRequestException
  });

  it('deve rejeitar senha sem letra minúscula', async () => {
    // senha: "PASSWORD1@" → BadRequestException
  });

  it('deve rejeitar senha sem número', async () => {
    // senha: "Password@" → BadRequestException
  });

  it('deve rejeitar senha sem caractere especial', async () => {
    // senha: "Password1" → BadRequestException
  });

  it('deve aceitar senha forte válida', async () => {
    // senha: "Password1@" → sucesso
  });
});
```

**Relação com regras existentes:**
- Complementa **R-USU-003** (senha mínima 6 caracteres) — altera para 8 caracteres com complexidade
- Alinha com **R-AUTH-009** (validação de senha forte em reset)
- Usa mesma biblioteca: class-validator com @Matches()

**Motivação:**
- Inconsistência atual: reset exige senha forte, mas criação aceita "123456"
- Segurança: senhas fracas são vulneráveis a ataques de força bruta
- Padrão de mercado: maioria dos sistemas exige senha forte desde criação

**Status de implementação:** 🚧 **CANDIDATA** (aguardando implementação)

---

### 6.2. Paginação em Listagem

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- `findAll()` retorna TODOS os usuários sem paginação
- Pode causar problemas de performance em grandes volumes

**TODO:**
- Implementar paginação (skip/take)
- Adicionar parâmetros de query (page, limit)
- Retornar metadados (total, pages)

---

### 6.3. Filtros de Busca em Listagem

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Listagem não permite filtros (nome, email, perfil, empresa)
- Apenas retorna todos os registros

**TODO:**
- Implementar filtros via query params
- Permitir busca por texto (nome, email)
- Filtrar por perfil, empresa, status (ativo/inativo)

---

### 6.4. Reativação de Usuário

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Usuário pode ser inativado, mas não existe endpoint de reativação
- UpdateUsuarioDto tem campo `ativo`, mas bloqueado em auto-edição

**TODO:**
- Implementar endpoint `POST /usuarios/:id/reativar`
- Ou permitir `PATCH /usuarios/:id` com `ativo: true`
- Documentar permissões (apenas ADMINISTRADOR?)

---

### 6.5. Validação de Foto Corrompida

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema valida mimetype, mas não valida integridade da imagem
- Não verifica se arquivo é realmente uma imagem válida

**TODO:**
- Usar biblioteca de validação de imagem (sharp, jimp)
- Validar dimensões mínimas/máximas
- Validar se arquivo não está corrompido

---

### 6.6. Validação de empresaId Existente

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- CreateUsuarioDto aceita empresaId sem validar se empresa existe
- Prisma lançará erro de FK, mas mensagem não é clara

**TODO:**
- Validar se empresaId existe antes de criar usuário
- Lançar BadRequestException com mensagem clara

---

### 6.7. Validação de perfilId Existente em Criação

**Status:** ⚠️ PARCIAL

**Descrição:**
- validateProfileElevation() busca perfil e valida existência
- Mas apenas em contexto de elevação (não valida se ADMINISTRADOR cria)

**TODO:**
- Garantir validação de existência de perfil em TODOS os casos
- Mensagem clara se perfil não existe

---

### 6.8. Exclusão de Foto em Hard Delete

**Status:** ✅ IMPLEMENTADO (Observação)

**Descrição:**
- hardDelete() deleta foto física antes de deletar usuário
- Correto para evitar arquivos órfãos

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L354-L357)

---

### 6.9. Validação de Vínculos Antes de Hard Delete

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema permite hard delete mesmo com vínculos (reuniões, auditoria)
- Pode causar violação de FK ou perda de dados

**TODO:**
- Validar se usuário tem vínculos antes de deletar
- Bloquear hard delete se houver dados relacionados
- Ou implementar cascata de deleção (com cuidado)

---

### 6.10. Telefone Sem Validação de Formato

**Status:** ⚠️ SEM VALIDAÇÃO

**Descrição:**
- Campo telefone é `@IsString()`, `@IsOptional()`
- Não valida formato (DDD, máscara)

**TODO:**
- Adicionar `@Matches()` com regex de telefone brasileiro
- Exemplo: `@Matches(/^\(\d{2}\) \d{4,5}-\d{4}$/)`

---

### 6.11. Auditoria de Soft Delete

**Status:** ✅ IMPLEMENTADO (Observação)

**Descrição:**
- remove() (soft delete) registra auditoria com acao: "DELETE"
- Correto para rastreabilidade

**Arquivo:** [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts#L339-L347)

---

### 6.12. Cache de Busca por Email

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- findByEmail() é usado em autenticação (frequente)
- Não usa cache
- Pode causar carga no banco de dados

**TODO:**
- Implementar cache (Redis)
- Invalidar cache ao atualizar usuário
- TTL configurável

---

### 6.13. Busca de Usuário por ID Público vs Privado

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- findById() valida isolamento multi-tenant (correto)
- findByIdInternal() NÃO valida isolamento (uso interno)
- Ambos têm mesma lógica de busca, mas validações diferentes

**TODO:**
- Documentar quando usar cada método
- Garantir que findByIdInternal() só seja usado em contextos seguros

---

#### 💡 **Regra Candidata: R-USU-032 (MODO B)**

**Origem:** Intenção humana (22/12/2024)  
**Prioridade:** MÉDIA  
**Tipo:** Refatoração de arquitetura

**Descrição:** Sistema deve remover método findByIdInternal() e usar apenas findById() como método público, eliminando ambiguidade e potenciais falhas de segurança.

**Implementação esperada:**
- **Arquivo:** `backend/src/modules/usuarios/usuarios.service.ts`
- **Métodos afetados:**
  - ❌ Remover: `findByIdInternal()`
  - ✅ Manter: `findById()` (com validação multi-tenant)

**Comportamento esperado:**
```typescript
// ANTES (ambíguo):
findById(id: string, requestUser: RequestUser) {
  // valida multi-tenant
}

findByIdInternal(id: string) {
  // NÃO valida multi-tenant (perigoso)
}

// DEPOIS (apenas método público):
findById(id: string, requestUser: RequestUser) {
  // valida multi-tenant (mantém segurança)
}

// findByIdInternal removido completamente
```

**Refatorações necessárias:**

1. **Identificar usos de findByIdInternal():**
   - Buscar chamadas no service (update, updateProfilePhoto, deleteProfilePhoto, etc.)
   - Substituir todas por findById()

2. **Ajustar chamadas internas:**
   ```typescript
   // ANTES:
   const usuario = await this.findByIdInternal(id);
   
   // DEPOIS:
   const usuario = await this.findById(id, requestUser);
   ```

3. **Remover método findByIdInternal():**
   - Deletar método do service
   - Remover testes relacionados (se houver)

**Casos afetados:**
1. **update():** Já usa findByIdInternal → trocar por findById()
2. **updateProfilePhoto():** Já usa findByIdInternal → trocar por findById()
3. **deleteProfilePhoto():** Já usa findByIdInternal → trocar por findById()
4. **hardDelete():** Já usa findByIdInternal → trocar por findById()

**Validações adicionais:**
- ✅ Todos os métodos passam a validar isolamento multi-tenant (RA-001)
- ✅ Remove risco de bypass de segurança via método interno
- ✅ Simplifica arquitetura (apenas 1 método de busca por ID)

**Exceções:**
- Nenhuma exceção adicional (mantém comportamento de findById)
- ForbiddenException se tentar acessar usuário de outra empresa (já existente)

**Impacto:**
- **Performance:** Zero (mesma lógica de busca)
- **Segurança:** Melhora significativa (elimina método sem validação)
- **Código:** Reduz complexidade (menos métodos, menos ambiguidade)
- **Manutenibilidade:** Facilita manutenção (1 caminho único)

**Arquivos de implementação:**
- `backend/src/modules/usuarios/usuarios.service.ts`
  - Linha ~149-184 (remover findByIdInternal)
  - Linhas de update, updateProfilePhoto, deleteProfilePhoto, hardDelete (substituir chamadas)

**Testes esperados:**
```typescript
describe('R-USU-032: Remoção de findByIdInternal', () => {
  it('NÃO deve existir método findByIdInternal', () => {
    const service = new UsuariosService();
    expect(service.findByIdInternal).toBeUndefined();
  });

  it('update deve validar isolamento multi-tenant', async () => {
    // GESTOR tentando atualizar usuário de outra empresa → ForbiddenException
  });

  it('updateProfilePhoto deve validar isolamento multi-tenant', async () => {
    // GESTOR tentando alterar foto de usuário de outra empresa → ForbiddenException
  });

  it('deleteProfilePhoto deve validar isolamento multi-tenant', async () => {
    // GESTOR tentando deletar foto de usuário de outra empresa → ForbiddenException
  });

  it('hardDelete deve validar isolamento multi-tenant', async () => {
    // ADMINISTRADOR pode deletar qualquer usuário → sucesso
  });
});
```

**Relação com regras existentes:**
- Fortalece **R-USU-005** (isolamento multi-tenant)
- Elimina brecha de segurança identificada na ausência 6.13
- Simplifica arquitetura sem quebrar regras existentes

**Motivação:**
- **Segurança:** findByIdInternal() não valida isolamento multi-tenant
- **Ambiguidade:** Desenvolvedores podem usar método errado inadvertidamente
- **Princípio KISS:** Um método público é suficiente
- **Auditabilidade:** Todas as buscas passam por validação de segurança

**Riscos:**
- ⚠️ Requer refatoração de 4+ métodos que usam findByIdInternal()
- ⚠️ Testes existentes podem quebrar se dependem de findByIdInternal()
- ✅ Risco mitigado: findById() já existe e está testado

**Status de implementação:** 🚧 **CANDIDATA** (aguardando implementação)

---

### 6.14. Validação de Unicidade de Email em Update

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- update() permite alterar email, mas não valida se novo email já existe
- Prisma lançará erro de unique, mas mensagem não é clara

**TODO:**
- Validar se novo email já existe em outro usuário
- Lançar ConflictException com mensagem clara

---

#### 💡 **Regra Candidata: R-USU-030 (MODO B)**

**Origem:** Intenção humana (22/12/2024)  
**Prioridade:** ALTA  
**Tipo:** Validação de conflito

**Descrição:** Sistema deve validar unicidade de email ao atualizar usuário, impedindo uso de email já cadastrado por outro usuário.

**Implementação esperada:**
- **Endpoint:** `PATCH /usuarios/:id`
- **Método:** `UsuariosService.update()`
- **Momento:** Antes da atualização no banco

**Comportamento esperado:**
```typescript
async update(id: string, data: UpdateUsuarioDto, requestUser: RequestUser) {
  // ... validações existentes ...

  // R-USU-030: Validar unicidade de email se houver mudança
  if (data.email && data.email !== before.email) {
    const existingUser = await this.findByEmail(data.email);
    
    if (existingUser && existingUser.id !== id) {
      throw new ConflictException('Email já cadastrado por outro usuário');
    }
  }

  // ... restante do método ...
}
```

**Casos de uso:**
1. **Email não muda:** Não valida (performance)
2. **Email muda para email livre:** Permite atualização
3. **Email muda para email existente:** ConflictException (409)
4. **Email muda para próprio email:** Permite (edge case)

**Validações adicionais:**
- ✅ Apenas valida se campo `email` for fornecido no UpdateUsuarioDto
- ✅ Ignora validação se email não muda
- ✅ Compara `existingUser.id !== id` para permitir auto-update

**Exceções:**
- `ConflictException("Email já cadastrado por outro usuário")` — HTTP 409
- Mensagem clara e específica (diferente de erro genérico Prisma)

**Impacto:**
- **Performance:** Adiciona 1 query ao update (apenas se email mudar)
- **UX:** Mensagem de erro clara para usuário final
- **Segurança:** Mantém integridade de email único

**Arquivo de implementação:**
- `backend/src/modules/usuarios/usuarios.service.ts` (método `update()`)
- Linha esperada: ~270-275 (após validação multi-tenant)

**Testes esperados:**
```typescript
describe('R-USU-030: Validação de email único em update', () => {
  it('deve permitir update sem mudança de email', async () => {
    // email não fornecido ou igual ao atual → sucesso
  });

  it('deve permitir update com novo email livre', async () => {
    // email fornecido e único → sucesso
  });

  it('deve bloquear update com email já existente', async () => {
    // email fornecido e duplicado → ConflictException
  });

  it('deve permitir update do próprio email (edge case)', async () => {
    // email = email atual → sucesso (sem query)
  });
});
```

**Relação com regras existentes:**
- Similar a **R-USU-001** (validação de email único em create)
- Complementa validações de update existentes (RA-001, RA-002, RA-004)

**Status de implementação:** 🚧 **CANDIDATA** (aguardando implementação)

---

### 6.15. Permissão de Visualização de Usuário

**Status:** ⚠️ AMPLA

**Descrição:**
- `GET /usuarios/:id` permite ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA
- Valida isolamento multi-tenant (correto)
- Mas LEITURA pode visualizar outros usuários da mesma empresa

**Comportamento atual:**
- LEITURA pode ver dados de outros usuários (dentro da mesma empresa)

**TODO:**
- Definir se LEITURA deve ver apenas próprio usuário
- Ou manter comportamento atual (documentar decisão)

---

## 7. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-USU-001** | Email único | ✅ Implementado |
| **R-USU-002** | Hash de senha (argon2) | ✅ Implementado |
| **R-USU-003** | Senha mínima 6 caracteres | ✅ Implementado |
| **R-USU-004** | Validação de elevação de perfil (RA-004) | ✅ Implementado |
| **R-USU-005** | Isolamento multi-tenant (RA-001) | ✅ Implementado |
| **R-USU-006** | Bloqueio auto-edição campos privilegiados (RA-002) | ✅ Implementado |
| **R-USU-007** | Permissão upload foto (RA-003) | ✅ Implementado |
| **R-USU-008** | Permissão deleção foto (RA-003) | ✅ Implementado |
| **R-USU-009** | Listagem todos usuários (ADMIN) | ✅ Implementado |
| **R-USU-010** | Listagem usuários sem empresa | ✅ Implementado |
| **R-USU-011** | Busca por ID com multi-tenant | ✅ Implementado |
| **R-USU-012** | Busca por email (interno) | ✅ Implementado |
| **R-USU-013** | Auditoria em criação | ✅ Implementado |
| **R-USU-014** | Auditoria em atualização | ✅ Implementado |
| **R-USU-015** | Soft delete (inativação) | ✅ Implementado |
| **R-USU-016** | Hard delete (física) | ✅ Implementado |
| **R-USU-017** | Upload foto com validação tipo | ✅ Implementado |
| **R-USU-018** | Limite 5MB em foto | ✅ Implementado |
| **R-USU-019** | Nome arquivo foto único | ✅ Implementado |
| **R-USU-020** | Exclusão foto anterior ao atualizar | ✅ Implementado |
| **R-USU-021** | Auditoria em upload foto | ✅ Implementado |
| **R-USU-022** | Deleção foto sistema arquivos | ✅ Implementado |
| **R-USU-023** | Auditoria em deleção foto | ✅ Implementado |
| **R-USU-024** | Senha redacted em auditoria | ✅ Implementado |
| **R-USU-025** | Hash senha em atualização | ✅ Implementado |
| **R-USU-026** | Validação upload sem arquivo | ✅ Implementado |
| **R-USU-027** | Criação apenas ADMINISTRADOR | ✅ Implementado |
| **R-USU-028** | Deleção apenas ADMINISTRADOR | ✅ Implementado |
| **R-USU-029** | Atualização ADMIN/GESTOR/COLABORADOR | ✅ Implementado |

**Regras de Segurança (RA):**
- **RA-001:** Isolamento multi-tenant (4 métodos)
- **RA-002:** Bloqueio auto-edição campos privilegiados
- **RA-003:** Permissão foto (ADMIN ou próprio)
- **RA-004:** Validação elevação de perfil (hierarquia)

**Ausências críticas:**
- ❌ Validação de senha forte (inconsistência com Auth)
- ❌ Validação de unicidade de email em update
- ❌ Paginação em listagem
- ❌ Reativação de usuário
- ❌ Validação de empresaId/perfilId existentes

---

## 8. Referências

**Arquivos principais:**
- [usuarios.service.ts](../../backend/src/modules/usuarios/usuarios.service.ts)
- [usuarios.controller.ts](../../backend/src/modules/usuarios/usuarios.controller.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (Usuario, PerfilUsuario)

**DTOs:**
- [create-usuario.dto.ts](../../backend/src/modules/usuarios/dto/create-usuario.dto.ts)
- [update-usuario.dto.ts](../../backend/src/modules/usuarios/dto/update-usuario.dto.ts)

**Testes:**
- [usuarios.service.spec.ts](../../backend/src/modules/usuarios/usuarios.service.spec.ts) (35 testes unitários)

**Interfaces:**
- [request-user.interface.ts](../../backend/src/common/interfaces/request-user.interface.ts) (RequestUser compartilhado)

---

**Observação final:**  
Este documento reflete APENAS o código IMPLEMENTADO.  
Regras inferidas, comportamentos não documentados ou recursos futuros  
foram marcados como ausências/ambiguidades.
