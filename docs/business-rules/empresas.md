# Regras de Negócio — Módulo EMPRESAS

**Data de extração**: 2025-12-21  
**Escopo**: Gestão de empresas (multi-tenant)

---

## 1. Visão Geral

O módulo EMPRESAS implementa:
- Gerenciamento de cadastro de empresas (CRUD)
- Validação de CNPJ único por empresa
- Customização da experiência por empresa (logo, URL de login, tipo de negócio)
- Relacionamento com pilares de gestão
- Suporte a soft delete (desativação)
- Isolamento de dados por empresa (multi-tenant)

---

## 2. Entidades

### 2.1 Empresa
```
- id: UUID (PK)
- nome: String — nome legal da empresa
- cnpj: String (UNIQUE) — formato: 00.000.000/0000-00
- tipoNegocio: String (nullable) — categoria de negócio
- cidade: String — cidade sede
- estado: EstadoBrasil (ENUM) — UF onde empresa está localizada
- ativo: Boolean (default: true) — marca soft delete
- logoUrl: String (nullable) — URL da logo customizada
- loginUrl: String (nullable) — URL customizada para página de login
- createdAt: DateTime — data de criação
- updatedAt: DateTime — data da última atualização
- createdBy: String (nullable) — ID do usuário que criou
- updatedBy: String (nullable) — ID do usuário que atualizou
- usuarios: Usuario[] — usuários da empresa
- pilares: PilarEmpresa[] — pilares vinculados à empresa
```

### 2.2 EstadoBrasil (ENUM)
Valores suportados: todas as UF brasileiras (AC, AL, AP, AM, BA, CE, DF, ES, GO, MA, MT, MS, MG, PA, PB, PR, PE, PI, RJ, RN, RS, RO, RR, SC, SP, SE, TO)

---

## 3. Regras Implementadas

### 3.1 Criação de Empresa

**R-EMP-001**: Validação de CNPJ
- CNPJ obrigatório
- Formato: `00.000.000/0000-00` (validado por regex: `^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$`)
- Deve ser único no sistema
- Se CNPJ já existe → `ConflictException("CNPJ já cadastrado")`

**R-EMP-002**: Dados obrigatórios
- `nome`: obrigatório, string, 2-200 caracteres
- `cidade`: obrigatório, string, 2-100 caracteres
- `estado`: obrigatório, enum EstadoBrasil

**R-EMP-003**: Dados opcionais
- `tipoNegocio`: opcional, string, 2-100 caracteres
- `loginUrl`: opcional, string, 3-100 caracteres

**R-EMP-004**: Auditoria de criação
- Campo `createdBy` registra ID do usuário que criou
- Campo `createdAt` preenchido automaticamente

**R-EMP-005**: Acesso restrito
- Apenas usuários com perfil `ADMINISTRADOR` podem criar empresa
- Requer autenticação (JWT) + `JwtAuthGuard` + `RolesGuard`

### 3.2 Leitura de Empresa

**R-EMP-006**: Listagem com contexto de perfil
- Se perfil `ADMINISTRADOR` → lista todas as empresas ativas
- Se perfil `GESTOR` ou outro → lista apenas a empresa do usuário (`empresaId` do token)

**R-EMP-007**: Paginação e ordenação
- Empresas retornadas ordenadas por `nome ASC`
- Inclui contagem de usuários e pilares por empresa

**R-EMP-008**: Inclusão de relacionamentos
- `usuarios`: seleciona id, nome, email, perfil, ativo
- `pilares`: inclui dados completos do pilar associado
- `_count`: contagem de usuários e pilares

**R-EMP-009**: Busca por ID
- Se empresa não encontrada → `NotFoundException("Empresa não encontrada")`
- Requer autenticação
- Permitido para perfis: ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA

**R-EMP-010**: Busca por CNPJ (público)
- Endpoint sem autenticação: `GET /empresas/customization/:cnpj`
- Retorna: `{ id, nome, cnpj, tipoNegocio, cidade, estado, logoUrl, loginUrl, ativo }`
- Usado pela tela de login para customização
- Se CNPJ não encontrado → `NotFoundException("Empresa não encontrada")`

**R-EMP-011**: Busca por loginUrl (público)
- Endpoint sem autenticação: `GET /empresas/by-login-url/:loginUrl`
- Retorna apenas empresa ativa (`ativo: true`)
- Retorna: `{ id, nome, logoUrl, loginUrl }`
- Se URL não encontrada → `NotFoundException("Empresa não encontrada")`
- Usado para customizar página de login por empresa

**R-EMP-012**: Tipos de negócio (DISTINCT)
- Endpoint: `GET /empresas/tipos-negocio/distinct`
- Retorna lista de tipos de negócio únicos usados no sistema
- Apenas ADMINISTRADOR pode acessar
- Ordenado alfabeticamente
- Ignora valores nulos

### 3.3 Atualização de Empresa

**R-EMP-013**: Validação de CNPJ em atualização
- Se novo CNPJ fornecido, valida unicidade
- Permite CNPJ da própria empresa (não rejeita self)
- Se CNPJ duplicado em outra empresa → `ConflictException("CNPJ já cadastrado em outra empresa")`

**R-EMP-014**: Campos atualizáveis
- `nome`, `cnpj`, `tipoNegocio`, `cidade`, `estado`, `loginUrl`
- Campo `ativo` pode ser atualizado via DTO

**R-EMP-015**: Auditoria de atualização
- Registra estado anterior e posterior via `AuditService.log()`
- Campo `updatedBy` recebe ID do usuário
- Campo `updatedAt` preenchido automaticamente

**R-EMP-016**: Acesso restrito
- Requer perfil: ADMINISTRADOR, CONSULTOR ou GESTOR
- Requer autenticação JWT

### 3.4 Soft Delete de Empresa

**R-EMP-017**: Desativação em vez de exclusão física
- Endpoint `DELETE /empresas/:id` não remove registro
- Apenas marca `ativo: false`
- Após desativação, empresa não aparece em listas (filtro `ativo: true`)

**R-EMP-018**: Acesso a delete
- Requer perfil: ADMINISTRADOR ou CONSULTOR
- Requer autenticação JWT

**R-EMP-019**: Auditoria de delete
- Ação registrada como `DELETE` em audit log
- Estado anterior e posterior registrados

### 3.5 Vinculação de Pilares

**R-EMP-020**: Modelo de relacionamento
- Uma empresa pode ter múltiplos pilares
- Um pilar pode estar em múltiplas empresas
- Relacionamento através de tabela `PilarEmpresa` (join table)

**R-EMP-021**: Atualização de pilares
- Endpoint `POST /empresas/:id/pilares` com payload `{ pilaresIds: string[] }`
- Remove TODOS os vínculos antigos da empresa
- Cria novos vínculos com pilaresIds fornecidos
- Operação é atômica (replace, não merge)

**R-EMP-022**: Auditoria de vinculação
- Registra update como `UPDATE` em audit
- Estado anterior e posterior da empresa registrados

**R-EMP-023**: Acesso a vinculação
- Requer perfil: ADMINISTRADOR, CONSULTOR ou GESTOR

### 3.6 Upload de Logo

**R-EMP-024**: Validação de arquivo
- Apenas imagens: JPG, JPEG, PNG, WebP
- MIME types: `/(jpg|jpeg|png|webp)$/`
- Tamanho máximo: 5 MB
- Se arquivo inválido → `BadRequestException("Apenas imagens JPG, PNG ou WebP são permitidas")`
- Se nenhum arquivo → `BadRequestException("Nenhuma imagem foi enviada")`

**R-EMP-025**: Armazenamento de logo
- Caminho: `./public/images/logos`
- Nome gerado: `empresa-${timestamp}-${random}.${ext}`
- URL armazenada: `/images/logos/{filename}`
- Campo `logoUrl` atualizado na empresa

**R-EMP-026**: Acesso a upload
- Requer perfil: ADMINISTRADOR, CONSULTOR ou GESTOR
- Requer autenticação JWT

**R-EMP-027**: Remoção de logo
- Endpoint `DELETE /empresas/:id/logo`
- Define `logoUrl: null`
- Não remove arquivo do disco (apenas desvincula)

### 3.7 Relacionamentos Multi-tenant

**R-EMP-028**: Isolamento de dados por tenant
- Cada usuário tem `empresaId` no JWT
- Endpoints filtram por empresa do usuário (baseado em perfil)
- ADMINISTRADOR acessa todas as empresas
- GESTOR e demais perfis veem apenas sua empresa

### Frontend (Implementado)

**F-EMP-001**: Listagem com busca, ordenação e paginação
- `EmpresasListComponent` aplica filtro por `nome`, `cnpj`, `cidade`, `estado`
- Ordenação por coluna com `SortableDirective`; paginação com pageSize=10
- Multi-seleção com checkbox no header; batch delete com confirmação SweetAlert
- Offcanvas de detalhes carrega empresa via `getById`

**F-EMP-002**: Formulário de criação/edição
- Validações: `nome` (required + minLength(2)), `cnpj` (required), `cidade` (required + minLength(2)), `estado` (required)
- `loginUrl`: `minLength(3)` + `pattern(/^\S+$/)` (sem espaços)
- Formata CNPJ no input com máscara baseada em dígitos (não valida dígito verificador)

**F-EMP-003**: Upload e remoção de logo
- Tipos aceitos: `image/jpeg`, `image/png`, `image/webp`; tamanho máximo 5MB
- Modo edição: upload imediato ao selecionar arquivo; modo criação: armazena e envia após criar
- Exibição da logo concatena `environment.backendUrl` e adiciona cache-buster (?cb=timestamp)
- Remoção com confirmação SweetAlert; `DELETE /empresas/:id/logo` atualiza `logoUrl` para `null`

**F-EMP-004**: Associação de usuários à empresa
- Perfis "cliente" (`GESTOR`, `COLABORADOR`, `LEITURA`) não carregam usuários disponíveis para associação
- Modo criação: acumula usuários pendentes em memória e associa após `POST /empresas`
- Modo edição: associa/desassocia imediatamente via `UsersService.update(usuario.id, { empresaId })`
- Atualiza listas de disponíveis/associados e emite toasts de sucesso/erro

**F-EMP-005**: Navegação condicional
- Perfis "cliente" redirecionam para `/dashboard`; demais para `/empresas`
- Determinação de perfil usa `perfil.codigo` quando objeto ou `perfil` string

---

## 4. Validações

### 4.1 CreateEmpresaDto
| Campo | Tipo | Validações | Obrigatório |
|-------|------|-----------|------------|
| nome | string | IsString(), IsNotEmpty(), Length(2,200) | ✓ |
| cnpj | string | IsString(), IsNotEmpty(), Matches(regex) | ✓ |
| tipoNegocio | string | IsString(), IsOptional(), Length(2,100) | ✗ |
| cidade | string | IsString(), IsNotEmpty(), Length(2,100) | ✓ |
| estado | EstadoBrasil | IsEnum(EstadoBrasil), IsNotEmpty() | ✓ |
| loginUrl | string | IsString(), IsOptional(), Length(3,100) | ✗ |

### 4.2 UpdateEmpresaDto
Mesmos campos que CreateEmpresaDto, mas todos opcionais + campo `ativo` (IsBoolean, IsOptional).

### 4.3 Frontend Forms
- `loginUrl`: `minLength(3)` e `pattern(/^\S+$/)` (sem espaços)
- Upload de logo: valida `mimetype` (JPG/PNG/WebP) e `file.size <= 5MB`
- Máscara de CNPJ no input (formatação client-side; sem validação de dígitos)

---

## 5. Comportamentos Condicionais

### 5.1 Fluxo de Criação

```
POST /empresas (requer ADMINISTRADOR)
  ├─ Validação DTO
  ├─ CNPJ já existe?
  │  └─ Sim → ConflictException("CNPJ já cadastrado")
  └─ ✓ Criado
     ├─ createdBy = usuarioId
     ├─ createdAt = now()
     └─ Retorna empresa
```

### 5.2 Fluxo de Listagem

```
GET /empresas (requer ADMINISTRADOR ou GESTOR)
  ├─ Perfil = ADMINISTRADOR?
  │  └─ Sim → findAll() (todas as empresas ativas)
  └─ Outro perfil
     └─ findAllByEmpresa(usuarioId.empresaId) (apenas sua empresa)
```

### 5.3 Fluxo de Busca Pública por CNPJ

```
GET /empresas/customization/:cnpj (público)
  ├─ CNPJ encontrado?
  │  └─ Não → NotFoundException
  └─ ✓ Retorna empresa com customizações
```

### 5.4 Fluxo de Vinculação de Pilares

```
POST /empresas/:id/pilares (requer ADMINISTRADOR, CONSULTOR ou GESTOR)
  ├─ Empresa existe?
  │  └─ Não → NotFoundException
  ├─ Delete PilarEmpresa.where(empresaId=id)
  ├─ Create PilarEmpresa para cada pilarId
  ├─ Log audit com estado antes/depois
  └─ Retorna empresa atualizada
```

### 5.5 Fluxo de Upload de Logo

```
POST /empresas/:id/logo (requer ADMINISTRADOR, CONSULTOR ou GESTOR)
  ├─ Arquivo presente?
  │  └─ Não → BadRequestException
  ├─ MIME type válido?
  │  └─ Não → BadRequestException
  ├─ Tamanho ≤ 5MB?
  │  └─ Não → BadRequestException (implícito em limits)
  ├─ Empresa existe?
  │  └─ Não → NotFoundException
  ├─ Arquivo salvo em ./public/images/logos
  ├─ logoUrl atualizado
  └─ Retorna { logoUrl: "/images/logos/empresa-..." }

### 5.6 Frontend: Associação de Usuários (Criação)

```
Criar Empresa
  ├─ Usuários pendentes acumulados em memória
  ├─ POST /empresas → retorna nova empresa
  ├─ Para cada usuário pendente: PATCH /usuarios/:id { empresaId }
  └─ Toast de sucesso/erros agregados
```

### 5.7 Frontend: Upload de Logo

```
Seleção de arquivo
  ├─ Valida tipo (jpeg/png/webp) e tamanho (≤5MB)
  ├─ Modo edição → upload imediato
  ├─ Modo criação → armazenar para upload após criar
  └─ Atualiza exibição com cache-buster
```
```

---

## 6. Ausências ou Ambiguidades

### 6.1 Validações Faltantes

⚠️ **NÃO IMPLEMENTADO**:
1. Validação de CNPJ existente (apenas formato)
2. Validação de loginUrl (formato específico não validado)
3. Validação de que loginUrl seja único (sem constraint UNIQUE)
4. Validação que não há empresas duplicadas por nome

### 6.2 Permissões

⚠️ **IMPLEMENTADO MAS PODE SER MAIS RESTRITIVO**:
- GESTOR pode atualizar e deletar empresa
- GESTOR pode deletar empresa (deveria ser apenas ADMINISTRADOR?)
- Não há validação se GESTOR tenta atualizar empresa de outro tenant

### 6.3 Isolamento Multi-tenant

⚠️ **IMPLEMENTADO COM RESTRIÇÕES**:
- `GET /empresas` filtra por tenant (ok)
- `GET /empresas/:id` aceita qualquer empresa (sem validação se pertence ao tenant do usuário)
- ADMINISTRADOR acessa todas as empresas (esperado)
- Não há validação de isolamento em `UPDATE`, `DELETE`, `vincularPilares`
- Usuário GESTOR de empresa A pode deletar empresa B (se conseguir bypass)

### 6.4 Eventos e Notificações

⚠️ **NÃO IMPLEMENTADO**:
- Webhook quando empresa é criada/atualizada
- Notificação de usuários quando empresa é desativada
- Sincronização com sistemas externos

### 6.5 Dados de Auditoria

⚠️ **PARCIAL**:
- Criação registrada (createdBy, createdAt)
- Atualização registrada (updatedBy, updatedAt)
- Mas AuditService pode falhar silenciosamente?

### 6.6 Integridade Referencial

⚠️ **NÃO DEFINIDO**:
- O que fazer com usuários quando empresa é desativada?
- O que fazer com pilares quando empresa é desativada?
- Propagação de soft delete não é clara

---

## 7. Endpoints

| Método | Rota | Autenticação | Roles | Descrição |
|--------|------|--------------|-------|-----------|
| GET | `/empresas/customization/:cnpj` | ❌ | — | Buscar customização por CNPJ (público) |
| GET | `/empresas/by-login-url/:loginUrl` | ❌ | — | Buscar empresa por URL de login (público) |
| GET | `/empresas/tipos-negocio/distinct` | ✓ | ADMINISTRADOR | Lista tipos de negócio únicos |
| POST | `/empresas` | ✓ | ADMINISTRADOR | Criar nova empresa |
| GET | `/empresas` | ✓ | ADMINISTRADOR, GESTOR | Listar empresas (contexto) |
| GET | `/empresas/:id` | ✓ | ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA | Buscar empresa por ID |
| PATCH | `/empresas/:id` | ✓ | ADMINISTRADOR, CONSULTOR, GESTOR | Atualizar empresa |
| DELETE | `/empresas/:id` | ✓ | ADMINISTRADOR, CONSULTOR | Soft delete (desativar) |
| POST | `/empresas/:id/pilares` | ✓ | ADMINISTRADOR, CONSULTOR, GESTOR | Vincular pilares |
| POST | `/empresas/:id/logo` | ✓ | ADMINISTRADOR, CONSULTOR, GESTOR | Upload de logo |
| DELETE | `/empresas/:id/logo` | ✓ | ADMINISTRADOR, CONSULTOR, GESTOR | Remover logo |

---

## 8. Dependências

- **NestJS** (`@nestjs/common`, `@nestjs/platform-express` para multer)
- **Prisma** para ORM
- **AuditService** para logging de mudanças
- **File system** para armazenamento de logos

---

## Resumo Executivo

✅ **CRUD completo** com validações de CNPJ e dados obrigatórios  
✅ **Soft delete** mantém histórico sem remover dados  
✅ **Multi-tenant isolado** por empresa com ADMINISTRADOR global  
✅ **Customização por tenant** (logo, URL de login)  
✅ **Auditoria integrada** de todas as operações  

⚠️ **Não implementado**: Rate limiting, CNPJ validation (apenas formato), loginUrl uniqueness  
⚠️ **Gap crítico**: Isolamento multi-tenant não é validado em todos endpoints (DELETE, UPDATE podem escapar)
