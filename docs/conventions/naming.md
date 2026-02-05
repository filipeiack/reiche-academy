# Convenções - Naming (Nomenclatura)

**Status**: Documentação baseada em código existente  
**Última atualização**: 2025-12-23

---

## 1. Padrões de Nomes - Visão Geral

| Contexto | Padrão | Exemplo |
|----------|--------|---------|
| **Classes** | PascalCase | `UsuariosService`, `CreateUsuarioDto` |
| **Arquivos de Classe** | kebab-case | `usuarios.service.ts`, `create-usuario.dto.ts` |
| **Variáveis/Propriedades** | camelCase | `selectedUsuarios`, `loadingDetails` |
| **Constantes** | UPPER_SNAKE_CASE | `API_URL`, `TOKEN_KEY` |
| **Enums (valores)** | SCREAMING_SNAKE_CASE | `ADMINISTRADOR`, `GESTOR`, `COLABORADOR` |
| **Funções/Métodos** | camelCase | `findById()`, `loadUsuarios()`, `onSubmit()` |
| **Métodos Private** | camelCase com `private` | `private validateInput()` |
| **Métodos Async** | camelCase com prefixo verbal | `async findAll()`, `async loadUsuarios()` |
| **Rotas (backend)** | kebab-case | `/usuarios`, `/usuarios/:id` |
| **Interfaces** | PascalCase | `Usuario`, `Empresa`, `RequestUser` |
| **Componentes Angular** | PascalCase + Component | `UsuariosListComponent`, `UsuariosFormComponent` |
| **Seletores Component** | kebab-case com `app-` | `app-usuarios-list`, `app-usuarios-form` |

**Grau de consistência**: CONSISTENTE

---

## 2. Backend - Classes e Services

### Services

**Padrão**: `{Entidade}Service`

**Arquivos observados**:
- `usuarios.service.ts` → `UsuariosService`
- `auth.service.ts` → `AuthService`
- `empresas.service.ts` → `EmpresasService`
- `audit.service.ts` → `AuditService`
- `pilares.service.ts` → `PilaresService`

```typescript
// Arquivo: usuarios.service.ts
@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}
  
  async findAll() { }
  async findById(id: number) { }
  async create(dto: CreateUsuarioDto) { }
  async update(id: number, dto: UpdateUsuarioDto) { }
  async remove(id: number) { }
  async hardDelete(id: number) { }
}
```

**Observações**:
- Nome do arquivo: plural, kebab-case (`usuarios.service.ts`)
- Nome da classe: plural, PascalCase (`UsuariosService`)
- Métodos: camelCase, verbos em inglês

**Grau de consistência**: CONSISTENTE

---

### Controllers

**Padrão**: `{Entidade}Controller`

**Arquivos observados**:
- `usuarios.controller.ts` → `UsuariosController`
- `auth.controller.ts` → `AuthController`
- `empresas.controller.ts` → `EmpresasController`

```typescript
// Arquivo: usuarios.controller.ts
@Controller('usuarios')
@ApiTags('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}
  
  @Get()
  findAll() { }
  
  @Get(':id')
  findOne(@Param('id') id: string) { }
  
  @Post()
  create(@Body() createDto: CreateUsuarioDto) { }
  
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateUsuarioDto) { }
  
  @Delete(':id')
  remove(@Param('id') id: string) { }
}
```

**Observações**:
- Decorator `@Controller`: plural, kebab-case (`'usuarios'`)
- Nome da classe: plural, PascalCase (`UsuariosController`)
- Métodos HTTP: verbos em inglês padrão (`findAll`, `findOne`, `create`, `update`, `remove`)

**Grau de consistência**: CONSISTENTE

---

### DTOs (Data Transfer Objects)

**Padrão**: `Create{Entidade}Dto`, `Update{Entidade}Dto`

**Arquivos observados**:
- `create-usuario.dto.ts` → `CreateUsuarioDto`
- `update-usuario.dto.ts` → `UpdateUsuarioDto`
- `create-empresa.dto.ts` → `CreateEmpresaDto`
- `update-empresa.dto.ts` → `UpdateEmpresaDto`

```typescript
// Arquivo: create-usuario.dto.ts
export class CreateUsuarioDto {
  @ApiProperty()
  @IsString()
  nome: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  senha: string;

  @ApiProperty({ enum: Perfil })
  @IsEnum(Perfil)
  perfil: Perfil;

  @ApiProperty()
  @IsInt()
  empresaId: number;
}
```

```typescript
// Arquivo: update-usuario.dto.ts
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}
```

**Observações**:
- Nome do arquivo: `create-`/`update-` + entidade singular + `.dto.ts`
- Nome da classe: `Create`/`Update` + entidade singular + `Dto`
- Propriedades: camelCase

**Grau de consistência**: CONSISTENTE

---

### Interfaces

**Padrão**: PascalCase, nome descritivo

**Arquivos observados**:
- `RequestUser` (interface para usuário autenticado)
- `Usuario` (modelo de domínio)
- `Empresa` (modelo de domínio)

```typescript
export interface RequestUser {
  userId: number;
  email: string;
  perfil: Perfil;
  empresaId: number;
}
```

**Grau de consistência**: CONSISTENTE

---

### Enums

**Padrão**: Valores em SCREAMING_SNAKE_CASE

**Arquivo observado**: `@prisma/client` (gerado)

```typescript
enum Perfil {
  ADMINISTRADOR = 'ADMINISTRADOR',
  GESTOR = 'GESTOR',
  COLABORADOR = 'COLABORADOR',
}
```

**Observações**:
- Valores: SCREAMING_SNAKE_CASE, sem acentos
- Mesmo padrão para todos os enums

**Grau de consistência**: CONSISTENTE

---

### Métodos - Padrões Comuns

| Operação | Padrão Backend | Exemplo |
|----------|---------------|---------|
| Listar todos | `findAll()` | `async findAll()` |
| Buscar por ID | `findById(id)` ou `findOne(id)` | `async findById(id: number)` |
| Criar | `create(dto)` | `async create(dto: CreateUsuarioDto)` |
| Atualizar | `update(id, dto)` | `async update(id: number, dto: UpdateUsuarioDto)` |
| Deletar (soft) | `remove(id)` | `async remove(id: number)` |
| Deletar (hard) | `hardDelete(id)` | `async hardDelete(id: number)` |

**Grau de consistência**: CONSISTENTE

---

## 3. Frontend - Componentes e Services

### Componentes

**Padrão**: `{Nome}{Tipo}Component`

**Arquivos observados**:
- `usuarios-list.component.ts` → `UsuariosListComponent`
- `usuarios-form.component.ts` → `UsuariosFormComponent`
- `pilares-list.component.ts` → `PilaresListComponent`

```typescript
// Arquivo: usuarios-list.component.ts
@Component({
  selector: 'app-usuarios-list',
  templateUrl: './usuarios-list.component.html',
  styleUrls: ['./usuarios-list.component.scss']
})
export class UsuariosListComponent implements OnInit {
  selectedUsuarios: number[] = [];
  loadingDetails: boolean = false;
  
  ngOnInit(): void {
    this.loadUsuarios();
  }
  
  loadUsuarios(): void { }
  onSubmit(): void { }
  handleCancel(): void { }
}
```

**Observações**:
- Arquivo: kebab-case com sufixo `.component.ts`
- Classe: PascalCase com sufixo `Component`
- Selector: `app-` + kebab-case
- Propriedades: camelCase
- Métodos: camelCase, verbos descritivos

**Grau de consistência**: CONSISTENTE

---

### Services

**Padrão**: `{Nome}Service`

**Arquivos observados**:
- `users.service.ts` → `UsersService`
- `auth.service.ts` → `AuthService`
- `pilares.service.ts` → `PilaresService`

```typescript
// Arquivo: users.service.ts
@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/usuarios`;
  
  constructor(private http: HttpClient) {}
  
  listar(): Observable<Usuario[]> { }
  buscarPorId(id: number): Observable<Usuario> { }
  criar(usuario: CreateUsuarioDto): Observable<Usuario> { }
  atualizar(id: number, usuario: UpdateUsuarioDto): Observable<Usuario> { }
  deletar(id: number): Observable<void> { }
}
```

**Observações**:
- Arquivo: kebab-case com sufixo `.service.ts`
- Classe: PascalCase com sufixo `Service`
- Métodos: camelCase, português ou inglês (INCONSISTENTE)

**Grau de consistência**: PARCIAL (idioma dos métodos varia)

---

### Propriedades de Componente

| Tipo de Propriedade | Padrão | Exemplo |
|---------------------|--------|---------|
| Arrays | plural, camelCase | `usuarios`, `pilares` |
| Booleanos | prefixo `is`/`has`/`loading` | `isLoading`, `hasPermission`, `loadingDetails` |
| Selecionados | prefixo `selected` | `selectedUsuarios`, `selectedIds` |
| Formulários | sufixo `Form` | `usuarioForm`, `empresaForm` |
| Observables | sufixo `$` | `usuarios$`, `loading$` |

**Grau de consistência**: CONSISTENTE

---

### Métodos de Componente

| Tipo de Método | Padrão | Exemplo |
|----------------|--------|---------|
| Lifecycle | Angular padrão | `ngOnInit()`, `ngOnDestroy()` |
| Carregar dados | prefixo `load` | `loadUsuarios()`, `loadDetails()` |
| Event handlers | prefixo `on` ou `handle` | `onSubmit()`, `handleCancel()` |
| Toggle | prefixo `toggle` | `toggleSelection()` |
| Navegação | prefixo `navigate` | `navigateToEdit()` |

**Grau de consistência**: CONSISTENTE

---

## 4. Rotas e Endpoints

### Backend (NestJS)

**Padrão**: kebab-case, plural

```typescript
@Controller('usuarios')          // /usuarios
@Controller('empresas')          // /empresas
@Controller('pilares')           // /pilares
@Controller('pilares-empresa')   // /pilares-empresa
```

**Endpoints**:
```
GET    /usuarios
GET    /usuarios/:id
POST   /usuarios
PATCH  /usuarios/:id
DELETE /usuarios/:id
DELETE /usuarios/:id/hard
```

**Grau de consistência**: CONSISTENTE

---

### Frontend (Angular)

**Padrão**: kebab-case

```typescript
const routes: Routes = [
  { path: 'usuarios', component: UsuariosListComponent },
  { path: 'usuarios/novo', component: UsuariosFormComponent },
  { path: 'usuarios/:id', component: UsuariosFormComponent },
];
```

**Grau de consistência**: CONSISTENTE

---

## 5. Arquivos de Teste

### Backend

**Padrão**: `{nome}.spec.ts`

- `usuarios.service.spec.ts`
- `usuarios.controller.spec.ts`

**Grau de consistência**: CONSISTENTE

---

### Frontend

**Padrão**: `{nome}.spec.ts`

- `pilares.service.spec.ts`
- `usuarios-list.component.spec.ts`

**Grau de consistência**: CONSISTENTE

---

## 6. Constantes e Configurações

### Backend

```typescript
// Constantes em UPPER_SNAKE_CASE
const API_VERSION = 'v1';
const DEFAULT_PAGE_SIZE = 10;
```

### Frontend

```typescript
// Constantes em UPPER_SNAKE_CASE
export const API_BASE_URL = 'http://localhost:3000';
export const TOKEN_KEY = 'auth_token';
```

**Grau de consistência**: CONSISTENTE

---

## Resumo de Consistência

| Categoria | Grau de Consistência | Observação |
|-----------|----------------------|-----------|
| **Classes Backend** | CONSISTENTE | PascalCase + sufixo (Service, Controller, Module) |
| **Arquivos Backend** | CONSISTENTE | kebab-case |
| **DTOs** | CONSISTENTE | Create/Update + entidade + Dto |
| **Métodos Backend** | CONSISTENTE | camelCase, verbos em inglês |
| **Enums** | CONSISTENTE | SCREAMING_SNAKE_CASE |
| **Classes Frontend** | CONSISTENTE | PascalCase + sufixo (Component, Service) |
| **Arquivos Frontend** | CONSISTENTE | kebab-case |
| **Métodos Frontend** | PARCIAL | camelCase, mas idioma varia (PT/EN) |
| **Rotas** | CONSISTENTE | kebab-case, plural |
| **Constantes** | CONSISTENTE | UPPER_SNAKE_CASE |

**Padrão de Nomes de Propriedades em DTOs**:
- camelCase (não snake_case)
- Correspondem exatamente aos nomes do banco (respeitando Prisma mapping)

**Exemplo**:
```typescript
export class CreateUsuarioDto {
  email: string;        // campo no BD: email
  nome: string;         // campo no BD: nome
  perfilId: string;     // campo no BD: perfilId (FK)
  empresaId?: string;   // campo no BD: empresaId (FK nullable)
}
```

**Consistência**: **CONSISTENTE**

### Interfaces e Types

**Padrão**: PascalCase (nunca I-prefixed como em C#)

**Observado**:
```typescript
export interface LoginRequest { }
export interface LoginResponse { }
export interface Usuario { }
export interface PerfilUsuarioBasic { }
```

**Padrão**: Sem prefixo `I`, apenas sufixo se necessário (Request, Response, Basic)

**Consistência**: **CONSISTENTE**

### Metadatas e Decorators

**Padrão**: Variável = CONSTANT_CASE

**Observado**:
```typescript
export const ROLES_KEY = 'roles';
export type Role = 'ADMINISTRADOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
```

**Padrão**: `ROLES_KEY` (não `RolesKey`), `Role` type (PascalCase para type union)

**Consistência**: **CONSISTENTE**

---

## 3. Frontend - Componentes

### Componentes

**Padrão**: `{Feature}Component`

**Arquivos observados**:
- `usuarios-list.component.ts` → `UsuariosListComponent`
- `usuarios-form.component.ts` → `UsuariosFormComponent`
- `user-avatar.component.ts` → `UserAvatarComponent`

**Arquivo no disco**:
```
usuarios-list.component.ts    (kebab-case)
UsuariosListComponent         (PascalCase na classe)
```

**Seletor**:
```typescript
@Component({
  selector: 'app-usuarios-list',  // kebab-case com 'app-' prefix
  // ...
})
export class UsuariosListComponent { }
```

**Padrão de Nomes**:
- `UsuariosListComponent` para listas
- `UsuariosFormComponent` para formulários
- `UserAvatarComponent` para componentes reutilizáveis

**Consistência**: **CONSISTENTE**

### Propriedades de Componentes

**Padrão**: camelCase

**Observado**:
```typescript
@Input() modalMode = false;
@Input() presetEmpresaId?: string;
@Output() onSave = new EventEmitter<Usuario>();
@Output() onCancel = new EventEmitter<void>();

isEditMode = false;
loading = false;
uploadingAvatar = false;
```

**Padrão de Output handlers**: `on{Action}` (onSave, onCancel)

**Padrão de Flags**: `is{State}`, `{action}ing` (isEditMode, uploadingAvatar)

**Consistência**: **CONSISTENTE**

### Métodos de Componentes

**Padrão**: Verbos + camelCase

**Observado**:
```typescript
handleSubmit(): void { }
handleCancel(): void { }
togglePasswordVisibility(): void { }
getRedirectUrl(): string { }
```

**Padrão de Handlers**: `handle{Action}`
**Padrão de Getters**: `get{Property}` (computadas)
**Padrão de Predicados**: `is{State}`, `should{Action}`

**Exemplo**:
```typescript
get isEditMode(): boolean { }
get isPerfilCliente(): boolean { }
get shouldDisableEmpresaField(): boolean { }
```

**Consistência**: **CONSISTENTE**

### Serviços Frontend

**Padrão**: `{Feature}Service`

**Arquivos observados**:
- `users.service.ts` → `UsersService`
- `auth.service.ts` → `AuthService`
- `perfis.service.ts` → `PerfisService`

**Padrão**:
```typescript
@Injectable({ providedIn: 'root' })
export class UsersService {
  // Aqui usa 'Users' (plural), não 'User'
}
```

**Consistência**: **CONSISTENTE**

### Métodos de Serviços Frontend

**Padrão**: CRUDify com verbos específicos

| Operação | Padrão | Exemplo |
|----------|--------|---------|
| Listar Tudo | `getAll()` | `getAll(): Observable<Usuario[]>` |
| Listar com filtro | `getFiltered()` | `getDisponiveis()` |
| Buscar um | `getById()` | `getById(id): Observable<Usuario>` |
| Buscar por campo | `getBy{Field}()` | `getByEmail()` |
| Criar | `create()` | `create(data): Observable<Usuario>` |
| Atualizar | `update()` | `update(id, data): Observable<Usuario>` |
| Deletar | `delete()` | `delete(id): Observable<any>` |
| Soft delete | `inactivate()` | `inactivate(id): Observable<any>` |

**Observado**:
```typescript
getAll(): Observable<Usuario[]> { }
getDisponiveis(): Observable<Usuario[]> { }
getById(id: string): Observable<Usuario> { }
create(data: CreateUsuarioDto): Observable<Usuario> { }
update(id: string, data: UpdateUsuarioRequest): Observable<Usuario> { }
delete(id: string): Observable<any> { }
inactivate(id: string): Observable<any> { }
```

**Consistência**: **CONSISTENTE**

### Modelos e Interfaces Frontend

**Padrão**: PascalCase + sufixo contextual

**Observado**:
```typescript
// Arquivo: auth.model.ts
export interface LoginRequest { }
export interface LoginResponse { }
export interface Usuario { }
export interface PerfilUsuarioBasic { }
export interface EmpresaBasic { }
```

**Padrão de Sufixos**:
- `Request` - DTO de entrada
- `Response` - DTO de resposta
- `Basic` - Versão reduzida de um modelo
- Sem sufixo - Modelo principal (Usuario, Empresa)

**Consistência**: **CONSISTENTE**

### Rotas

**Padrão**: kebab-case, RESTful

**Observado**:
```typescript
path: 'usuarios'
path: 'novo'
path: ':id/editar'
path: ':id/deletar'  // (esperado, não visto)
```

**Padrão**:
- Recurso no plural: `/usuarios`, `/empresas`
- Ação padrão: `:id`, `:id/editar`, `:id/deletar`
- Sem parênteses ou underscore

**Consistência**: **CONSISTENTE**

### Seletores em Templates

**Padrão**: CSS specificity + clarity

**Observado em testes E2E**:
```typescript
'input#nome'                        // ID quando disponível
'input[type="email"]'               // Atributo
'button[type="submit"]'             // Tipo
'a[href="/usuarios/novo"]'          // Href
'select#perfil'                     // Select com ID
'input[placeholder*="Procurar"]'    // Placeholder parcial
'table tbody tr'                    // Elemento + traversal
'.swal2-toast'                      // Classe
'app-user-avatar'                   // Custom element
```

**Padrão**:
- Preferência: ID > tipo + atributo > classe > selector complexo
- Evitar seletores muito específicos
- Usar atributos semanticamente significativos

**Consistência**: **PARCIAL** (varia conforme a estrutura do template)

---

## 4. Banco de Dados (Prisma)

### Modelos

**Padrão**: PascalCase (singular)

**Observado**:
```prisma
model Usuario { }
model Empresa { }
model PerfilUsuario { }
model AuditLog { }
```

**Padrão**: Singular no Prisma, plural quando gerado em TypeScript

**Consistência**: **CONSISTENTE**

### Campos

**Padrão**: camelCase

**Observado**:
```prisma
model Usuario {
  id        String   @id
  email     String   @unique
  nome      String
  telefone  String?
  fotoUrl   String?
  ativo     Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  perfilId  String
  empresaId String?
}
```

**Padrão**:
- camelCase para campos
- `Id` para foreign keys (perfilId, empresaId)
- `Url` para URLs (fotoUrl, logoUrl)
- Booleanos: `is{Property}`, `{Property}Active`, ou simples `ativo`
- Timestamps: `createdAt`, `updatedAt` (obrigatórios)

**Inconsistência**: Uns usam `ativo`, outros `is*` (não consolidado)

### Table Names

**Padrão**: snake_case

**Observado**:
```prisma
@@map("usuarios")
@@map("perfis_usuario")
@@map("audit_logs")
```

**Padrão**: Plural + underscore se composto

**Consistência**: **CONSISTENTE**

### Enums

**Padrão**: UPPER_CASE, sem acento

**Observado**:
```prisma
enum Criticidade {
  ALTO
  MEDIO
  BAIXO
}

enum StatusAcao {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDA
  CANCELADA
}
```

**Padrão**: Nunca MÉDIO (sem acento), sempre MAIUSCULA

**Inconsistência**: Um usa underscore (EM_ANDAMENTO), outro não (CONCLUIDA)

**Padrão esperado**: Sempre SNAKE_CASE para enums compostos

**Consistência**: **PARCIAL**

### Índices e Constraints

**Padrão**: Explícitos com `@@` annotation

**Observado**:
```prisma
@@unique([email, empresaId])
@@map("usuarios")
```

**Padrão**: Constraints ao final do modelo

**Consistência**: **CONSISTENTE**

---

## 5. Enums em Código

### Backend

**Arquivo**: `src/modules/auth/decorators/roles.decorator.ts`

```typescript
export type Role = 'ADMINISTRADOR' | 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
```

**Padrão**: String literal union (não enum)

**Gerado do Prisma**:
```typescript
// Auto-generated pelo Prisma
enum Criticidade {
  ALTO = "ALTO",
  MEDIO = "MEDIO",
  BAIXO = "BAIXO"
}
```

**Padrão**: PascalCase ou UPPER_CASE, sem acentuação

**Consistência**: **CONSISTENTE**

### Arquivo Gerado

**Observado**:
- `@prisma/client` gera enums automaticamente
- Nomes preservam maiúsculas do schema

**Consistência**: **CONSISTENTE**

---

## 6. Convenções de URL e Endpoints

### Rotas Backend

**Padrão**: RESTful, kebab-case (para hiphenados), plural

**Observado**:
```
GET    /usuarios
POST   /usuarios
GET    /usuarios/:id
PATCH  /usuarios/:id
DELETE /usuarios/:id
PATCH  /usuarios/:id/inativar
GET    /usuarios/disponiveis/empresa
```

**Padrão**:
- Recurso plural (usuarios, empresas)
- ID como parâmetro
- Ações customizadas no final do path
- Soft delete: `PATCH /:id/inativar`
- Hard delete: `DELETE /:id`

**Inconsistência**: `GET /usuarios/disponiveis/empresa` mistura recursos (usuarios com empresa)

**Consistência**: **PARCIAL**

### Query Parameters

**Não observado** (sem paginação, filtros explícitos em código)

### Request Body

**Padrão**: DTO tipado

```typescript
POST /usuarios
{
  "email": "user@reiche.com",
  "nome": "João Silva",
  "senha": "senha123",
  "cargo": "Diretor",
  "perfilId": "uuid",
  "empresaId": "uuid"  // opcional
}
```

**Padrão**: camelCase, nunca snake_case

**Consistência**: **CONSISTENTE**

---

## 7. Variáveis de Ambiente

### Padrão

**Nomes**: UPPER_SNAKE_CASE

**Observado**:
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRATION`

**Padrão**: Sempre maiúsculas, underscore para separar palavras

**Consistência**: **CONSISTENTE**

---

## 8. Comentários e Documentação

### JSDoc para Métodos Públicos

**Observado no Backend**:
```typescript
/**
 * Listar todos os usuários
 */
findAll() { }

/**
 * Buscar usuário por ID
 */
findById(id: string) { }
```

**Padrão**: Simples, descritivo, sem detalhes de implementação

**Observado no Frontend**:
```typescript
/**
 * Listar todos os usuários
 */
getAll(): Observable<Usuario[]> { }

/**
 * Atualiza os dados do usuário atual
 * Útil quando dados do perfil são alterados (ex: avatar, nome, etc)
 */
updateCurrentUser(usuario: Usuario): void { }
```

**Padrão**: Um-liner ou 2-3 linhas quando necessário

**Consistência**: **PARCIAL** (não é obrigatório em todos os métodos)

### Comentários Inline

**Padrão**: Raro, quando a lógica é complexa

**Observado**:
```typescript
// Registra tentativa de login falhada
await this.registrarLogin(null, email, false, ...);

// Retorna apenas campos necessários (sem senha)
select: { /* select fields */ }
```

**Consistência**: **CONSISTENTE** (quando usado, segue padrão)

---

## 9. Type Naming - TypeScript Específico

### Generics

**Padrão**: PascalCase, single letters para simples

**Observado**:
```typescript
Observable<Usuario>
Observable<Usuario[]>
Observable<any>
```

**Padrão**: Não há generics customizados no código (sem `<T>`, `<K, V>`)

### Union Types

**Padrão**: Sem parênteses, pipe-separated

```typescript
type Role = 'ADMINISTRADOR' | 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
type Status = 'ATIVO' | 'INATIVO';
```

**Consistência**: **CONSISTENTE**

### Tipos Nullable

**Padrão**: `Type | null` (não `Type?` para union, mas `?` para propriedades opcionais)

**Observado**:
```typescript
fotoUrl?: string | null;
empresa?: EmpresaBasic;
currentUser: Usuario | null;
```

**Padrão**:
- Propriedade: `field?: Type` (opcional, pode ser undefined)
- Valor: `value: Type | null` (explicitamente pode ser null)

**Consistência**: **PARCIAL** (mistura os dois padrões)

---

## 10. Arquivo de Testes

### Padrão

**Arquivo**: `{component/service}.spec.ts`

**Observado**:
```
app.component.spec.ts
usuarios.service.spec.ts
usuarios-form.component.spec.ts
```

**Padrão**: Same name + `.spec.ts`

**Descrição no Jasmine**:
```typescript
describe('UsuariosService', () => { })
describe('UsuariosFormComponent', () => { })
```

**Padrão**: Mesma string do nome da classe/componente

**Consistência**: **CONSISTENTE**

---

## Resumo - Consistência de Naming

| Categoria | Padrão | Consistência |
|-----------|--------|--------------|
| Classes | PascalCase | CONSISTENTE |
| Arquivos de Classe | kebab-case | CONSISTENTE |
| Variáveis/Propriedades | camelCase | CONSISTENTE |
| Constantes | UPPER_SNAKE_CASE | CONSISTENTE |
| Enums | UPPER_CASE (sem acento) | PARCIAL |
| Rotas | kebab-case (plural) | CONSISTENTE |
| Modelos Prisma | PascalCase (singular) | CONSISTENTE |
| Campos DB | camelCase | CONSISTENTE |
| Table Names | snake_case | CONSISTENTE |
| Métodos Async | async + verbo | CONSISTENTE |
| DTOs | Create/Update{Entity}Dto | CONSISTENTE |
| Componentes | {Feature}Component | CONSISTENTE |
| Seletores Component | app-{feature} | CONSISTENTE |
| Interfaces | PascalCase (sem I prefix) | CONSISTENTE |
| Testes | {name}.spec.ts | CONSISTENTE |

---

## Limitações e Gaps - Naming

1. **Enums Booleanos**: Uns usam `ativo`, outros esperariam `isAtivo` (não consolidado)

2. **Enum Compostos**: `EM_ANDAMENTO` usa underscore, mas `CONCLUIDA` não (inconsistente)

3. **Nullable vs Optional**: Mistura `?` e `| null` (sem padrão claro)

4. **Nomenclatura RESTful**: Endpoint `/usuarios/disponiveis/empresa` é ambíguo (qual recurso?)

5. **Sufixos de Interface**: Usa Request/Response/Basic mas não há standard docs

6. **Private Methods**: Sem prefixo `_` (Angular convention) ou documentação

7. **Boolean Getters**: Alguns usam `get is*()`, outros não (não consolidado)

8. **Abreviações**: Nenhuma abreviação observada (bom), mas sem guideline

9. **Nomes em Português**: Sempre PT-BR (UsuarioDto vs UserDto), sem documentação disso

10. **Constantes Magic Numbers**: Throttler hardcoded (10, 60000) sem nomes simbólicos
