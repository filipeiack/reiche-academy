# Regras de Negócio — Empresas

**Módulo:** Empresas  
**Backend:** `backend/src/modules/empresas/`  
**Frontend:** Não implementado  
**Última extração:** 21/12/2024  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Empresas é responsável por:
- Gestão de cadastro de empresas (CRUD)
- Customização de login (loginUrl e logoUrl)
- Vinculação de pilares por empresa
- Isolamento multi-tenant (GESTOR só acessa própria empresa)
- Auditoria de alterações em empresas

**Entidades principais:**
- Empresa (dados cadastrais e customização)
- PilarEmpresa (relação entre empresa e pilares)

**Endpoints implementados:**
- `POST /empresas` — Criar empresa (ADMINISTRADOR)
- `GET /empresas` — Listar empresas (ADMINISTRADOR vê todas, GESTOR vê própria)
- `GET /empresas/:id` — Buscar empresa por ID
- `PATCH /empresas/:id` — Atualizar empresa (ADMINISTRADOR/GESTOR)
- `DELETE /empresas/:id` — Desativar empresa (ADMINISTRADOR)
- `POST /empresas/:id/pilares` — Vincular pilares (ADMINISTRADOR/GESTOR)
- `POST /empresas/:id/logo` — Upload de logo (ADMINISTRADOR/GESTOR)
- `DELETE /empresas/:id/logo` — Deletar logo (ADMINISTRADOR/GESTOR)
- `GET /empresas/customization/:cnpj` — Buscar customização por CNPJ (público)
- `GET /empresas/by-login-url/:loginUrl` — Buscar por loginUrl (público)
- `GET /empresas/tipos-negocio/distinct` — Listar tipos de negócio (ADMINISTRADOR)

---

## 2. Entidades

### 2.1. Empresa

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| nome | String | Nome da empresa |
| cnpj | String (unique) | CNPJ formatado (00.000.000/0000-00) |
| tipoNegocio | String? | Tipo de negócio da empresa |
| cidade | String | Cidade da empresa |
| estado | EstadoBrasil (enum) | Estado brasileiro (sigla) |
| ativo | Boolean (default: true) | Indica se empresa está ativa |
| logoUrl | String? | URL do logotipo da empresa |
| loginUrl | String? | URL personalizada para login |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário criador |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `usuarios`: Usuario[] (usuários da empresa)
- `pilares`: PilarEmpresa[] (pilares vinculados)

**Índices:**
- `cnpj` (unique)

---

### 2.2. PilarEmpresa

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| empresaId | String (FK) | Referência à empresa |
| pilarId | String (FK) | Referência ao pilar |
| ativo | Boolean (default: true) | Indica se vínculo está ativo |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário criador |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `empresa`: Empresa
- `pilar`: Pilar
- `rotinasEmpresa`: RotinaEmpresa[]
- `evolucao`: PilarEvolucao[]

**Índices:**
- `@@unique([empresaId, pilarId])` (um pilar por empresa)

---

## 3. Regras Implementadas

### R-EMP-001: Validação de CNPJ Único na Criação

**Descrição:** CNPJ deve ser único no sistema. Não permite duplicação.

**Implementação:**
- **Endpoint:** `POST /empresas`
- **Método:** `EmpresasService.create()`

**Comportamento:**
1. Busca empresa existente com mesmo CNPJ
2. Se encontrar → ConflictException("CNPJ já cadastrado")
3. Se único → permite criação

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L32-L37)

---

### R-EMP-002: Formato de CNPJ com Máscara

**Descrição:** CNPJ deve estar no formato 00.000.000/0000-00.

**Implementação:**
- **DTO:** `CreateEmpresaDto`
- **Validação:** `@Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)`

**Mensagem de erro:**
```
"CNPJ deve estar no formato 00.000.000/0000-00"
```

**Arquivo:** [create-empresa.dto.ts](../../backend/src/modules/empresas/dto/create-empresa.dto.ts#L15-L19)

---

### R-EMP-003: Unicidade de loginUrl na Criação

**Descrição:** Campo loginUrl deve ser único no sistema (se fornecido).

**Implementação:**
- **Endpoint:** `POST /empresas`
- **Método:** `EmpresasService.create()`

**Comportamento:**
1. Se loginUrl fornecido e não vazio (após trim)
2. Busca empresa com mesmo loginUrl
3. Se encontrar → ConflictException("loginUrl já está em uso por outra empresa")
4. Se único → permite criação

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L40-L49)

---

### R-EMP-004: Validação de String Vazia em loginUrl

**Descrição:** loginUrl vazio ou apenas espaços não deve acionar validação de unicidade.

**Implementação:**
- Validação: `if (loginUrl && loginUrl.trim() !== '')`
- Se vazio ou apenas espaços → ignora validação de unicidade

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L40)

---

### R-EMP-005: loginUrl Sem Espaços

**Descrição:** loginUrl não pode conter espaços em branco.

**Implementação:**
- **DTO:** `CreateEmpresaDto`
- **Validação:** `@Matches(/^\S+$/)`

**Mensagem de erro:**
```
"loginUrl não pode conter espaços em branco"
```

**Arquivo:** [create-empresa.dto.ts](../../backend/src/modules/empresas/dto/create-empresa.dto.ts#L43-L46)

---

### R-EMP-006: Listar Apenas Empresas Ativas

**Descrição:** Endpoint de listagem retorna apenas empresas com `ativo: true`.

**Implementação:**
- **Endpoint:** `GET /empresas`
- **Método:** `EmpresasService.findAll()`
- **Filtro:** `where: { ativo: true }`

**Comportamento:**
- Retorna empresas ordenadas por nome (asc)
- Inclui contagem de usuários e pilares

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L59-L71)

---

### R-EMP-007: ADMINISTRADOR Vê Todas as Empresas

**Descrição:** Usuário ADMINISTRADOR pode listar todas as empresas ativas.

**Implementação:**
- **Endpoint:** `GET /empresas`
- **Controller:** Verifica perfil do usuário

**Comportamento:**
```typescript
if (req.user.perfil === 'ADMINISTRADOR') {
  return this.empresasService.findAll();
}
```

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L81-L83)

---

### R-EMP-008: GESTOR Vê Apenas Própria Empresa

**Descrição:** Usuário GESTOR pode listar apenas sua própria empresa.

**Implementação:**
- **Endpoint:** `GET /empresas`
- **Método:** `EmpresasService.findAllByEmpresa()`

**Comportamento:**
```typescript
// GESTOR vê apenas sua empresa
return this.empresasService.findAllByEmpresa(req.user.empresaId);
```

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L85)

---

### R-EMP-009: Busca de Empresa por ID com Detalhes

**Descrição:** Busca empresa por ID retorna dados completos (usuários, pilares, contagens).

**Implementação:**
- **Endpoint:** `GET /empresas/:id`
- **Método:** `EmpresasService.findOne()`

**Dados incluídos:**
- Lista de usuários (id, nome, email, perfil, ativo)
- Lista de pilares vinculados (com dados do pilar)
- Contagem de usuários e pilares

**Exceção:**
- Se empresa não existe → NotFoundException("Empresa não encontrada")

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L87-L113)

---

### R-EMP-010: Busca Pública de Customização por CNPJ

**Descrição:** Endpoint público retorna dados de customização sem autenticação.

**Implementação:**
- **Endpoint:** `GET /empresas/customization/:cnpj` (SEM @UseGuards)
- **Método:** `EmpresasService.findByCnpj()`

**Dados retornados:**
```typescript
{
  id, nome, cnpj, tipoNegocio, cidade, estado,
  logoUrl, loginUrl, ativo
}
```

**Exceção:**
- Se empresa não existe → NotFoundException("Empresa não encontrada")

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L115-L132)

---

### R-EMP-011: Busca Pública por loginUrl

**Descrição:** Endpoint público retorna empresa ativa por loginUrl.

**Implementação:**
- **Endpoint:** `GET /empresas/by-login-url/:loginUrl` (SEM @UseGuards)
- **Método:** `EmpresasService.findByLoginUrl()`

**Filtro:**
```typescript
where: { 
  loginUrl,
  ativo: true
}
```

**Dados retornados:**
```typescript
{
  id, nome, logoUrl, loginUrl
}
```

**Exceção:**
- Se empresa não existe → NotFoundException("Empresa não encontrada")

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L134-L151)

---

### R-EMP-012: Validação de CNPJ Único na Atualização

**Descrição:** Ao atualizar CNPJ, sistema valida se não está em uso por outra empresa.

**Implementação:**
- **Endpoint:** `PATCH /empresas/:id`
- **Método:** `EmpresasService.update()`

**Comportamento:**
1. Se updateDto.cnpj fornecido
2. Busca empresa com mesmo CNPJ (excluindo empresa atual: `id: { not: id }`)
3. Se encontrar → ConflictException("CNPJ já cadastrado em outra empresa")
4. Se único → permite atualização

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L173-L181)

---

### R-EMP-013: Validação de loginUrl Único na Atualização

**Descrição:** Ao atualizar loginUrl, sistema valida unicidade (excluindo empresa atual).

**Implementação:**
- **Endpoint:** `PATCH /empresas/:id`
- **Método:** `EmpresasService.update()`

**Comportamento:**
1. Se loginUrl fornecido e não vazio (após trim)
2. Busca empresa com mesmo loginUrl (excluindo empresa atual)
3. Se encontrar → ConflictException("loginUrl já está em uso por outra empresa")
4. Se único → permite atualização

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L184-L194)

---

### R-EMP-014: Isolamento Multi-Tenant em Atualização

**Descrição:** GESTOR só pode atualizar dados da própria empresa.

**Implementação:**
- **Método:** `validateTenantAccess()` chamado em `update()`

**Comportamento:**
1. ADMINISTRADOR → acesso global (sem restrição)
2. GESTOR → valida `targetEmpresa.id === requestUser.empresaId`
3. Se diferente → ForbiddenException("Você não pode atualizar dados de outra empresa")

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L17-L27)

---

### R-EMP-015: Auditoria em Atualização de Empresa

**Descrição:** Sistema registra auditoria ao atualizar empresa.

**Implementação:**
- **Serviço:** `AuditService.log()`
- **Dados registrados:**
  - usuarioId, usuarioNome, usuarioEmail
  - entidade: "empresas"
  - entidadeId: id da empresa
  - acao: "UPDATE"
  - dadosAntes: estado antes da atualização
  - dadosDepois: estado depois da atualização

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L202-L212)

---

### R-EMP-016: Campo updatedBy Atualizado

**Descrição:** Ao atualizar empresa, campo updatedBy recebe ID do usuário.

**Implementação:**
```typescript
data: {
  ...updateEmpresaDto,
  updatedBy: userId,
}
```

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L196-L200)

---

### R-EMP-017: Soft Delete de Empresa

**Descrição:** Ao deletar empresa, sistema apenas desativa (ativo: false), sem exclusão física.

**Implementação:**
- **Endpoint:** `DELETE /empresas/:id` (apenas ADMINISTRADOR)
- **Método:** `EmpresasService.remove()`

**Comportamento:**
```typescript
await this.prisma.empresa.update({
  where: { id },
  data: {
    ativo: false,
    updatedBy: userId,
  },
});
```

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L220-L226)

---

### R-EMP-018: Isolamento Multi-Tenant em Deleção

**Descrição:** Apenas ADMINISTRADOR pode desativar empresas.

**Implementação:**
- **Controller:** `@Roles('ADMINISTRADOR')`
- **Service:** `validateTenantAccess()` validaria, mas apenas ADMIN tem permissão

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L114-L118)

---

### R-EMP-019: Auditoria em Deleção (Soft Delete)

**Descrição:** Sistema registra auditoria ao desativar empresa.

**Implementação:**
- **Ação:** "DELETE"
- **Dados:** dadosAntes (ativo: true) e dadosDepois (ativo: false)

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L228-L238)

---

### R-EMP-020: Vinculação de Pilares (Replace)

**Descrição:** Ao vincular pilares, sistema substitui TODOS os vínculos anteriores.

**Implementação:**
- **Endpoint:** `POST /empresas/:id/pilares`
- **Método:** `EmpresasService.vincularPilares()`

**Comportamento:**
1. Remove TODOS os vínculos antigos: `pilarEmpresa.deleteMany()`
2. Cria novos vínculos: `pilarEmpresa.createMany()`
3. Campo createdBy preenchido em cada vínculo

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L247-L262)

---

### R-EMP-021: Isolamento Multi-Tenant em Vinculação de Pilares

**Descrição:** GESTOR só pode vincular pilares à própria empresa.

**Implementação:**
- **Validação:** `validateTenantAccess()` antes de vincular
- **Mensagem:** "Você não pode vincular pilares em dados de outra empresa"

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L246)

---

### R-EMP-022: Auditoria em Vinculação de Pilares

**Descrição:** Sistema registra auditoria ao vincular pilares.

**Implementação:**
- **Ação:** "UPDATE"
- **Dados:** dadosAntes (pilares antigos) e dadosDepois (pilares novos)

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L264-L274)

---

### R-EMP-023: Upload de Logo com Validação de Tipo

**Descrição:** Sistema aceita apenas imagens JPG, JPEG, PNG ou WebP.

**Implementação:**
- **Endpoint:** `POST /empresas/:id/logo`
- **Interceptor:** `FileInterceptor` com fileFilter

**Validação:**
```typescript
fileFilter: (req, file, cb) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(new BadRequestException('Apenas imagens JPG, PNG ou WebP são permitidas'), false);
  }
}
```

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L151-L157)

---

### R-EMP-024: Limite de Tamanho de Logo (5MB)

**Descrição:** Logo não pode exceder 5MB.

**Implementação:**
- **Validação:** `limits: { fileSize: 5 * 1024 * 1024 }`

**Exceção:**
- Se exceder → erro de limite de arquivo (tratado pelo Multer)

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L159)

---

### R-EMP-025: Nome de Arquivo de Logo Único

**Descrição:** Logo salvo com nome único (timestamp + random).

**Implementação:**
```typescript
filename: (req, file, cb) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = extname(file.originalname);
  cb(null, `empresa-${uniqueSuffix}${ext}`);
}
```

**Destino:** `./public/images/logos/`

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L145-L150)

---

### R-EMP-026: Auditoria em Upload de Logo

**Descrição:** Sistema registra auditoria ao atualizar logo.

**Implementação:**
- **Método:** `EmpresasService.updateLogo()`
- **Ação:** "UPDATE"
- **Dados:** dadosAntes (logoUrl antigo) e dadosDepois (logoUrl novo)

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L317-L327)

---

### R-EMP-027: Isolamento Multi-Tenant em Upload de Logo

**Descrição:** GESTOR só pode alterar logo da própria empresa.

**Implementação:**
- **Validação:** `validateTenantAccess()` em `updateLogo()`
- **Mensagem:** "Você não pode alterar logo de dados de outra empresa"

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L310)

---

### R-EMP-028: Deleção de Logo (Null)

**Descrição:** Ao deletar logo, campo logoUrl é setado para null.

**Implementação:**
- **Endpoint:** `DELETE /empresas/:id/logo`
- **Método:** `EmpresasService.deleteLogo()`

**Comportamento:**
```typescript
await this.prisma.empresa.update({
  where: { id },
  data: { logoUrl: null, updatedBy: userId },
});
```

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L340-L344)

---

### R-EMP-029: Isolamento Multi-Tenant em Deleção de Logo

**Descrição:** GESTOR só pode deletar logo da própria empresa.

**Implementação:**
- **Validação:** `validateTenantAccess()` em `deleteLogo()`
- **Mensagem:** "Você não pode deletar logo de dados de outra empresa"

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L337)

---

### R-EMP-030: Auditoria em Deleção de Logo

**Descrição:** Sistema registra auditoria ao deletar logo.

**Implementação:**
- **Ação:** "UPDATE"
- **Dados:** dadosAntes (logoUrl preenchido) e dadosDepois (logoUrl: null)

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L346-L356)

---

### R-EMP-031: Listar Tipos de Negócio Distintos

**Descrição:** Endpoint retorna lista de tipos de negócio únicos cadastrados.

**Implementação:**
- **Endpoint:** `GET /empresas/tipos-negocio/distinct` (apenas ADMINISTRADOR)
- **Método:** `EmpresasService.getTiposNegocioDistinct()`

**Comportamento:**
1. Busca empresas com tipoNegocio não null
2. Retorna valores distintos ordenados alfabeticamente
3. Filtra nulls do resultado

**Retorno:** `string[]`

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L279-L297)

---

### R-EMP-032: Campo createdBy na Criação

**Descrição:** Ao criar empresa, campo createdBy recebe ID do usuário.

**Implementação:**
```typescript
data: {
  ...createEmpresaDto,
  createdBy: userId,
}
```

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L51-L55)

---

## 4. Validações

### 4.1. CreateEmpresaDto

**Arquivo:** [create-empresa.dto.ts](../../backend/src/modules/empresas/dto/create-empresa.dto.ts)

| Campo | Validações |
|-------|-----------|
| nome | `@IsString()`, `@IsNotEmpty()`, `@Length(2, 200)` |
| cnpj | `@IsString()`, `@IsNotEmpty()`, `@Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)` |
| tipoNegocio | `@IsString()`, `@IsOptional()`, `@Length(2, 100)` |
| cidade | `@IsString()`, `@IsNotEmpty()`, `@Length(2, 100)` |
| estado | `@IsEnum(EstadoBrasil)`, `@IsNotEmpty()` |
| loginUrl | `@IsOptional()`, `@IsString()`, `@IsNotEmpty()`, `@Length(3, 100)`, `@Matches(/^\S+$/)` |

**Mensagens customizadas:**
- CNPJ: "CNPJ deve estar no formato 00.000.000/0000-00"
- loginUrl (vazio): "loginUrl não pode ser vazio"
- loginUrl (espaços): "loginUrl não pode conter espaços em branco"

---

### 4.2. UpdateEmpresaDto

**Arquivo:** [update-empresa.dto.ts](../../backend/src/modules/empresas/dto/update-empresa.dto.ts)

Estende `PartialType(CreateEmpresaDto)` + campo adicional:

| Campo | Validações |
|-------|-----------|
| ativo | `@IsBoolean()`, `@IsOptional()` |

**Nota:** Todos os campos do CreateEmpresaDto tornam-se opcionais.

---

### 4.3. Upload de Logo

**Validações:**
- **Tipo de arquivo:** JPG, JPEG, PNG, WebP
- **Tamanho máximo:** 5MB
- **Destino:** `./public/images/logos/`

---

## 5. Comportamentos Condicionais

### 5.1. ADMINISTRADOR vs GESTOR em Listagem

**Condição:** Perfil do usuário autenticado

**Comportamento:**
- **ADMINISTRADOR:** Retorna todas as empresas ativas (`findAll()`)
- **GESTOR:** Retorna apenas empresa do usuário (`findAllByEmpresa(empresaId)`)

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L80-L85)

---

### 5.2. Isolamento Multi-Tenant (validateTenantAccess)

**Condição:** Perfil e empresaId do usuário vs empresaId do recurso

**Comportamento:**
1. **ADMINISTRADOR:** Acesso global (sem validação)
2. **GESTOR:** Valida `targetEmpresa.id === requestUser.empresaId`
   - Se diferente → ForbiddenException
   - Se igual → permite

**Métodos que validam:**
- update()
- remove()
- vincularPilares()
- updateLogo()
- deleteLogo()

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L17-L27)

---

### 5.3. Validação de loginUrl Vazio

**Condição:** `loginUrl && loginUrl.trim() !== ''`

**Comportamento:**
- Se loginUrl não fornecido → não valida unicidade
- Se loginUrl vazio ("") → não valida unicidade
- Se loginUrl apenas espaços ("   ") → não valida unicidade
- Se loginUrl tem conteúdo → valida unicidade

**Aplicado em:**
- create()
- update()

**Arquivo:** [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts#L40)

---

### 5.4. Empresa Não Encontrada

**Condição:** Empresa com ID/CNPJ/loginUrl não existe

**Comportamento:**
- Lança NotFoundException("Empresa não encontrada")

**Métodos que validam:**
- findOne()
- findByCnpj()
- findByLoginUrl()

---

### 5.5. CNPJ Duplicado

**Condição:** CNPJ já cadastrado em outra empresa

**Comportamento:**
- **create():** ConflictException("CNPJ já cadastrado")
- **update():** ConflictException("CNPJ já cadastrado em outra empresa")

---

### 5.6. loginUrl Duplicado

**Condição:** loginUrl já em uso por outra empresa

**Comportamento:**
- ConflictException("loginUrl já está em uso por outra empresa")

**Aplicado em:**
- create()
- update()

---

### 5.7. Upload de Logo Sem Arquivo

**Condição:** `!file` após interceptor

**Comportamento:**
- BadRequestException("Nenhuma imagem foi enviada")

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L166-L168)

---

### 5.8. Tipo de Arquivo Inválido em Upload

**Condição:** Mimetype não é jpg/jpeg/png/webp

**Comportamento:**
- BadRequestException("Apenas imagens JPG, PNG ou WebP são permitidas")

**Arquivo:** [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts#L152-L156)

---

## 6. Ausências ou Ambiguidades

### 6.1. Exclusão Física de Logo no Sistema de Arquivos

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- deleteLogo() apenas seta logoUrl: null no banco
- Arquivo físico permanece em `./public/images/logos/`
- Sem limpeza de arquivos órfãos

**TODO:**
- Implementar exclusão física do arquivo antigo
- Considerar storage em cloud (S3, Azure Blob)
- Implementar job de limpeza de arquivos órfãos

---

### 6.2. Validação de Estado (EstadoBrasil)

**Status:** ⚠️ PARCIALMENTE DOCUMENTADO

**Descrição:**
- DTO valida `@IsEnum(EstadoBrasil)`
- Enum não está visível no código analisado
- Assume enum do Prisma

**TODO:**
- Documentar valores aceitos de EstadoBrasil
- Validar se enum está sincronizado entre Prisma e DTOs

---

### 6.3. Atualização de Logo ao Fazer Upload

**Status:** ⚠️ SEM LIMPEZA

**Descrição:**
- updateLogo() sobrescreve logoUrl
- Logo antigo NÃO é deletado do sistema de arquivos
- Pode acumular arquivos não utilizados

**TODO:**
- Deletar arquivo antigo antes de salvar novo
- Validar se logoUrl antigo existe fisicamente

---

### 6.4. Validação de Imagem Corrompida

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema valida mimetype, mas não valida integridade da imagem
- Não verifica se arquivo é realmente uma imagem válida

**TODO:**
- Usar biblioteca de validação de imagem (sharp, jimp)
- Validar dimensões mínimas/máximas
- Validar se arquivo não está corrompido

---

### 6.5. Deleção Física de Empresa

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema usa soft delete (`ativo: false`)
- Não existe endpoint para deleção física
- Dados de empresas inativas permanecem indefinidamente

**TODO:**
- Considerar se deleção física é necessária
- Implementar job de limpeza (se aplicável)
- Documentar política de retenção de dados

---

### 6.6. Reativação de Empresa

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Empresa pode ser desativada, mas não existe endpoint de reativação
- UpdateEmpresaDto tem campo `ativo`, mas não é usado explicitamente

**TODO:**
- Implementar endpoint `POST /empresas/:id/reactivate`
- Ou permitir `PATCH /empresas/:id` com `ativo: true`
- Documentar permissões (apenas ADMINISTRADOR?)

---

### 6.7. Validação de Vínculos Existentes Antes de Desativar

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema permite desativar empresa mesmo com usuários ou pilares vinculados
- Não valida impacto da desativação

**TODO:**
- Validar se empresa tem usuários ativos
- Validar se empresa tem pilares vinculados
- Opções: bloquear desativação ou desativar em cascata

---

### 6.8. Paginação em Listagem de Empresas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- `findAll()` retorna todas as empresas ativas sem paginação
- Pode causar problemas de performance em grandes volumes

**TODO:**
- Implementar paginação (skip/take)
- Adicionar parâmetros de query (page, limit)
- Retornar metadados (total, pages)

---

### 6.9. Filtros de Busca em Listagem

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Listagem não permite filtros (nome, cidade, estado, tipo)
- Apenas ordenação por nome

**TODO:**
- Implementar filtros via query params
- Permitir busca por texto (nome, CNPJ)
- Filtrar por estado, cidade, tipo de negócio

---

### 6.10. Unicidade de PilarEmpresa

**Status:** ✅ IMPLEMENTADO (Observação)

**Descrição:**
- Prisma garante `@@unique([empresaId, pilarId])`
- Não permite duplicação de vínculo empresa-pilar

**Observação:**
- vincularPilares() faz deleteMany + createMany, evitando violação de unique

---

### 6.11. Validação de pilaresIds em vincularPilares

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Endpoint não valida se pilaresIds existem
- Não valida se array está vazio
- Prisma lançará erro se pilarId não existir, mas sem mensagem clara

**TODO:**
- Validar se pilares existem antes de criar vínculos
- Validar se array não está vazio
- Lançar BadRequestException com mensagem clara

---

### 6.12. Permissão de Deleção de Empresa com Dados

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- Apenas ADMINISTRADOR pode deletar (soft delete)
- Não documenta se deve validar vínculos antes
- Não especifica comportamento esperado de dados relacionados

**TODO:**
- Documentar política de deleção
- Definir se soft delete desativa usuários em cascata
- Definir se pilares vinculados devem ser removidos

---

### 6.13. Validação de Duplicação de Nome

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Sistema valida unicidade de CNPJ e loginUrl
- Não valida se nome da empresa está duplicado
- Pode ter múltiplas empresas com mesmo nome (mas CNPJs diferentes)

**Comportamento atual:**
- Permite duplicação de nome (apenas CNPJ é único)

**TODO:**
- Definir se nome deve ser único
- Implementar validação se necessário

---

### 6.14. Cache de Busca por loginUrl

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Endpoint público `GET /empresas/by-login-url/:loginUrl` é frequente (login customizado)
- Não usa cache
- Pode causar carga no banco de dados

**TODO:**
- Implementar cache (Redis)
- Invalidar cache ao atualizar loginUrl
- TTL configurável

---

### 6.15. Validação de Permissão em Upload de Logo

**Status:** ⚠️ INCOMPLETO

**Descrição:**
- Controller valida `@Roles('ADMINISTRADOR', 'GESTOR')`
- Service valida isolamento multi-tenant
- Mas se GESTOR tentar upload para outra empresa, erro é genérico

**TODO:**
- Mensagem de erro mais específica
- Validar permissão antes de processar upload (economiza recursos)

---

## 7. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-EMP-001** | CNPJ único na criação | ✅ Implementado |
| **R-EMP-002** | Formato de CNPJ com máscara | ✅ Implementado |
| **R-EMP-003** | Unicidade de loginUrl na criação | ✅ Implementado |
| **R-EMP-004** | String vazia em loginUrl não valida | ✅ Implementado |
| **R-EMP-005** | loginUrl sem espaços | ✅ Implementado |
| **R-EMP-006** | Listar apenas empresas ativas | ✅ Implementado |
| **R-EMP-007** | ADMINISTRADOR vê todas empresas | ✅ Implementado |
| **R-EMP-008** | GESTOR vê apenas própria empresa | ✅ Implementado |
| **R-EMP-009** | Busca por ID com detalhes | ✅ Implementado |
| **R-EMP-010** | Busca pública por CNPJ | ✅ Implementado |
| **R-EMP-011** | Busca pública por loginUrl | ✅ Implementado |
| **R-EMP-012** | CNPJ único na atualização | ✅ Implementado |
| **R-EMP-013** | loginUrl único na atualização | ✅ Implementado |
| **R-EMP-014** | Isolamento multi-tenant em atualização | ✅ Implementado |
| **R-EMP-015** | Auditoria em atualização | ✅ Implementado |
| **R-EMP-016** | Campo updatedBy atualizado | ✅ Implementado |
| **R-EMP-017** | Soft delete de empresa | ✅ Implementado |
| **R-EMP-018** | Apenas ADMIN deleta empresas | ✅ Implementado |
| **R-EMP-019** | Auditoria em deleção | ✅ Implementado |
| **R-EMP-020** | Vinculação de pilares (replace) | ✅ Implementado |
| **R-EMP-021** | Isolamento multi-tenant em pilares | ✅ Implementado |
| **R-EMP-022** | Auditoria em vinculação de pilares | ✅ Implementado |
| **R-EMP-023** | Upload de logo com validação de tipo | ✅ Implementado |
| **R-EMP-024** | Limite de 5MB em logo | ✅ Implementado |
| **R-EMP-025** | Nome de arquivo de logo único | ✅ Implementado |
| **R-EMP-026** | Auditoria em upload de logo | ✅ Implementado |
| **R-EMP-027** | Isolamento multi-tenant em logo | ✅ Implementado |
| **R-EMP-028** | Deleção de logo (null) | ✅ Implementado |
| **R-EMP-029** | Isolamento multi-tenant em deleção logo | ✅ Implementado |
| **R-EMP-030** | Auditoria em deleção de logo | ✅ Implementado |
| **R-EMP-031** | Listar tipos de negócio distintos | ✅ Implementado |
| **R-EMP-032** | Campo createdBy na criação | ✅ Implementado |

**Ausências críticas:**
- ❌ Exclusão física de logos não utilizados
- ❌ Validação de pilares existentes em vincularPilares
- ❌ Paginação em listagem
- ❌ Reativação de empresa
- ❌ Cache em busca por loginUrl (endpoint público frequente)

---

## 8. Referências

**Arquivos principais:**
- [empresas.service.ts](../../backend/src/modules/empresas/empresas.service.ts)
- [empresas.controller.ts](../../backend/src/modules/empresas/empresas.controller.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (Empresa, PilarEmpresa)

**DTOs:**
- [create-empresa.dto.ts](../../backend/src/modules/empresas/dto/create-empresa.dto.ts)
- [update-empresa.dto.ts](../../backend/src/modules/empresas/dto/update-empresa.dto.ts)

**Testes:**
- [empresas.service.spec.ts](../../backend/src/modules/empresas/empresas.service.spec.ts) (43 testes unitários)

**Interfaces:**
- [request-user.interface.ts](../../backend/src/common/interfaces/request-user.interface.ts) (RequestUser compartilhado)

---

**Observação final:**  
Este documento reflete APENAS o código IMPLEMENTADO.  
Regras inferidas, comportamentos não documentados ou recursos futuros  
foram marcados como ausências/ambiguidades.
