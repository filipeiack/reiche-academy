# Convenções - Backend (NestJS)

**Status**: Documentação baseada em código existente  
**Última atualização**: 2025-12-23

---

## 1. Estrutura de Módulos

### Padrão Observado

Cada módulo de negócio segue a estrutura:

```
src/modules/{nome-modulo}/
├── {nome}.module.ts          # Declaração do módulo
├── {nome}.controller.ts      # Endpoints HTTP
├── {nome}.service.ts         # Lógica de negócio
├── {nome}.service.spec.ts    # Testes unitários do service
├── dto/                      # Data Transfer Objects
│   ├── create-{nome}.dto.ts
│   └── update-{nome}.dto.ts
└── (opcional) guards/, decorators/, strategies/
```

**Onde aparece**:
- `/backend/src/modules/usuarios/`
- `/backend/src/modules/empresas/`
- `/backend/src/modules/pilares/`
- `/backend/src/modules/rotinas/`
- `/backend/src/modules/auth/`
- `/backend/src/modules/audit/`
- `/backend/src/modules/perfis/`
- `/backend/src/modules/diagnosticos/`
- `/backend/src/modules/pilares-empresa/`

**Grau de consistência**: CONSISTENTE

---

## 2. Controllers

### Padrão de Estrutura

**Onde aparece**: Todos os arquivos `*.controller.ts`

```typescript
@ApiTags('nome-recurso')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('nome-recurso')
export class NomeController {
  constructor(private readonly nomeService: NomeService) {}

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Descrição da operação' })
  create(@Body() createDto: CreateDto) {
    return this.nomeService.create(createDto);
  }
  
  @Get()
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Listar todos' })
  findAll() {
    return this.nomeService.findAll();
  }
  
  @Get(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Buscar por ID' })
  findOne(@Param('id') id: string) {
    return this.nomeService.findById(id);
  }
  
  @Patch(':id')
  @Roles('ADMINISTRADOR', 'GESTOR')
  @ApiOperation({ summary: 'Atualizar' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDto) {
    return this.nomeService.update(id, updateDto);
  }
  
  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Deletar' })
  remove(@Param('id') id: string) {
    return this.nomeService.hardDelete(id);
  }
  
  @Patch(':id/inativar')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Inativar (soft delete)' })
  inactivate(@Param('id') id: string) {
    return this.nomeService.remove(id);
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Decorator `@Controller()` | Nome do recurso em kebab-case |
| Documentação Swagger | `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()` sempre presentes |
| Autenticação | `@UseGuards(JwtAuthGuard, RolesGuard)` aplicado no nível do controller |
| Autorização | `@Roles()` por endpoint, aceita múltiplos perfis |
| Verbos HTTP | POST (create), GET (findAll/findOne), PATCH (update), DELETE (remove) |
| Parâmetros | DTOs tipados com `@Body()`, IDs com `@Param('id')` |
| Injeção | Constructor com `private readonly nomeService: NomeService` |

**Exemplos reais**:
- `/backend/src/modules/usuarios/usuarios.controller.ts` (140 linhas)
- `/backend/src/modules/empresas/empresas.controller.ts` (183 linhas)
- `/backend/src/modules/pilares/pilares.controller.ts`

**Grau de consistência**: CONSISTENTE

---

## 3. Services

### Padrão de Estrutura

**Onde aparece**: Todos os arquivos `*.service.ts`

```typescript
@Injectable()
export class NomeService {
  private readonly logger = new Logger(NomeService.name);
  
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  async findAll() {
    return this.prisma.entidade.findMany({
      select: {
        id: true,
        campo1: true,
        // ... campos necessários (nunca senha)
      },
    });
  }

  async findById(id: string) {
    const item = await this.prisma.entidade.findUnique({
      where: { id },
      select: { /* campos */ },
    });
    
    if (!item) {
      throw new NotFoundException('Recurso não encontrado');
    }
    
    return item;
  }

  async create(data: CreateDto, requestUser: RequestUser) {
    // 1. Validações de negócio
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }
    
    // 2. Transformações (ex: hash de senha)
    const hashedPassword = await argon2.hash(data.senha);
    
    // 3. Criação
    const created = await this.prisma.entidade.create({
      data: { ...data, senha: hashedPassword },
      select: { /* campos */ },
    });
    
    // 4. Auditoria
    await this.audit.log({
      entidade: 'ENTIDADE',
      acao: 'CREATE',
      entidadeId: created.id,
      usuarioId: requestUser.id,
    });
    
    return created;
  }

  async update(id: string, data: UpdateDto, requestUser: RequestUser) {
    await this.findById(id); // valida existência
    
    // validações adicionais...
    
    const updated = await this.prisma.entidade.update({
      where: { id },
      data,
      select: { /* campos */ },
    });
    
    await this.audit.log({
      entidade: 'ENTIDADE',
      acao: 'UPDATE',
      entidadeId: id,
      usuarioId: requestUser.id,
    });
    
    return updated;
  }

  async remove(id: string) {
    // Soft delete: marcar como inativo
    return this.prisma.entidade.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async hardDelete(id: string) {
    // Delete físico
    return this.prisma.entidade.delete({
      where: { id },
    });
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Decorator | `@Injectable()` sempre presente |
| Logger | `private readonly logger = new Logger(NomeService.name)` |
| Injeção | Constructor com `private` para dependências |
| Métodos | `async/await` (100% assíncrono) |
| Hash de Senha | `argon2` (nunca bcrypt) |
| Select Seletivo | Sempre usa `.select()`, nunca retorna `senha` |
| Validações | Feitas no service antes de ações (throw exceptions) |
| Exceptions | `NotFoundException`, `ConflictException`, `ForbiddenException` |
| Soft Delete | Método `remove()` marca `ativo: false` |
| Hard Delete | Método separado `hardDelete()` |
| Auditoria | Chamada após operações (CREATE, UPDATE, DELETE) |
| RequestUser | Parâmetro `requestUser: RequestUser` para rastreabilidade |

**Exemplos reais**:
- `/backend/src/modules/usuarios/usuarios.service.ts` (472 linhas)
- `/backend/src/modules/empresas/empresas.service.ts`
- `/backend/src/modules/pilares/pilares.service.ts`

**Grau de consistência**: CONSISTENTE

---

## 4. DTOs (Data Transfer Objects)

### Padrão de Estrutura

**Onde aparece**: Todos os arquivos em `*/dto/*.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, IsUUID, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'joao.silva@reiche.com.br' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nome: string;

  @ApiProperty({ example: 'SenhaForte1@' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&)',
  })
  senha: string;

  @ApiPropertyOptional({ example: '(11) 98765-4321' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({ example: 'uuid-do-perfil' })
  @IsUUID()
  @IsNotEmpty()
  perfilId: string;
}

export class UpdateUsuarioDto {
  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nome?: string;
  
  // ... demais campos opcionais
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Nomenclatura | `Create{Nome}Dto`, `Update{Nome}Dto` (PascalCase) |
| Validadores | `class-validator` decorators (`@IsEmail`, `@IsNotEmpty`, etc.) |
| Documentação | `@ApiProperty()` para campos obrigatórios, `@ApiPropertyOptional()` para opcionais |
| Examples | Sempre incluídos no `@ApiProperty({ example: '...' })` |
| Validação de Senha | Regex com requisitos explícitos (maiúscula, minúscula, número, especial) |
| Campos Opcionais | Tipo `field?: string` + decorator `@IsOptional()` |
| UUIDs | Validação com `@IsUUID()` |

**Exemplos reais**:
- `/backend/src/modules/usuarios/dto/create-usuario.dto.ts` (46 linhas)
- `/backend/src/modules/usuarios/dto/update-usuario.dto.ts`
- `/backend/src/modules/empresas/dto/create-empresa.dto.ts`

**Grau de consistência**: CONSISTENTE

---

## 5. Autenticação e Autorização (Guards)

### Padrão de Implementação

**Onde aparece**:
- `/backend/src/modules/auth/guards/jwt-auth.guard.ts`
- `/backend/src/modules/auth/guards/roles.guard.ts`
- `/backend/src/modules/auth/guards/local-auth.guard.ts`

**JwtAuthGuard** (autenticação):
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**RolesGuard** (autorização):
```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Sem restrição
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user || !user.perfil) return false;
    
    const perfilCodigo = typeof user.perfil === 'object' 
      ? user.perfil.codigo 
      : user.perfil;
      
    return requiredRoles.includes(perfilCodigo);
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Autenticação | `@UseGuards(JwtAuthGuard)` aplicado no controller |
| Autorização | `@UseGuards(RolesGuard)` após JwtAuthGuard |
| Decorator de Roles | `@Roles('ADMINISTRADOR', 'GESTOR')` por endpoint |
| Perfis Disponíveis | ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA |
| Retorno de Guards | `boolean` (true = autorizado, false = bloqueado) |
| Request User | `request.user` contém dados do usuário autenticado |

**Grau de consistência**: CONSISTENTE

---

## 6. Interface RequestUser

### Padrão Observado

**Onde aparece**: `/backend/src/common/interfaces/request-user.interface.ts`

```typescript
export interface RequestUser {
  id: string;
  email: string;
  nome: string;
  empresaId: string | null;
  perfil: {
    id: string;
    codigo: string;
    nome: string;
    nivel: number;
  };
}
```

**Uso**:
- Parâmetro em métodos de service para rastreabilidade
- Validação de regras de negócio (multi-tenant, hierarquia de perfis)
- Auditoria

**Grau de consistência**: CONSISTENTE (introduzido recentemente, uso crescente)

---

## 7. Regras de Validação Multi-Tenant

### Padrão Observado

**Onde aparece**: Services de `usuarios`, `empresas`

```typescript
private validateTenantAccess(
  targetUsuario: { empresaId: string | null }, 
  requestUser: RequestUser, 
  action: string
) {
  // ADMINISTRADOR tem acesso global
  if (requestUser.perfil?.codigo === 'ADMINISTRADOR') {
    return;
  }

  // Outros perfis só acessam recursos da mesma empresa
  if (targetUsuario.empresaId !== requestUser.empresaId) {
    throw new ForbiddenException(`Você não pode ${action} usuários de outra empresa`);
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Validação de Tenant | Método privado `validateTenantAccess()` |
| Exceção ADMINISTRADOR | Sempre tem acesso global |
| Outros Perfis | Isolamento por `empresaId` |
| Exception | `ForbiddenException` com mensagem descritiva |

**Exemplos reais**:
- `/backend/src/modules/usuarios/usuarios.service.ts` (linhas 24-34)

**Grau de consistência**: PARCIAL (implementado em usuários, empresas; falta em outros módulos)

---

## 8. Hierarquia de Perfis (Elevation Protection)

### Padrão Observado

```typescript
private async validateProfileElevation(
  targetPerfilId: string, 
  requestUser: RequestUser, 
  action: string
) {
  // ADMINISTRADOR pode criar/editar qualquer perfil
  if (requestUser.perfil?.codigo === 'ADMINISTRADOR') {
    return;
  }

  // Buscar perfil alvo
  const targetPerfil = await this.prisma.perfilUsuario.findUnique({
    where: { id: targetPerfilId },
  });

  if (!targetPerfil) {
    throw new NotFoundException('Perfil não encontrado');
  }

  // Impedir criação/edição de perfil superior ou igual
  if (targetPerfil.nivel <= requestUser.perfil.nivel) {
    throw new ForbiddenException(
      `Você não pode ${action} usuário com perfil ${targetPerfil.nome}`
    );
  }
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Validação | Método privado `validateProfileElevation()` |
| Hierarquia | Baseada no campo `nivel` (menor = mais poder) |
| Regra | Usuário não pode criar/editar perfis de nível superior ou igual |
| Exception | `ForbiddenException` |

**Exemplos reais**:
- `/backend/src/modules/usuarios/usuarios.service.ts` (linhas 39-56)

**Grau de consistência**: PARCIAL (implementado em usuários; não necessário em outros módulos)

---

## 9. Auditoria

### Padrão Observado

**Onde aparece**: `/backend/src/modules/audit/audit.service.ts`

```typescript
await this.audit.log({
  entidade: 'USUARIO',
  acao: 'CREATE',
  entidadeId: created.id,
  usuarioId: requestUser.id,
  detalhes: { campo: 'valor' }, // opcional
});
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Chamada | `await this.audit.log()` após CREATE, UPDATE, DELETE |
| Entidade | Enum ou string maiúscula (ex: 'USUARIO', 'EMPRESA') |
| Ação | CREATE, UPDATE, DELETE, INACTIVATE, etc. |
| Usuário | Sempre rastreia quem executou (`requestUser.id`) |
| Detalhes | Campo opcional JSON para contexto adicional |

**Exemplos reais**:
- `/backend/src/modules/usuarios/usuarios.service.ts`
- `/backend/src/modules/empresas/empresas.service.ts`

**Grau de consistência**: CONSISTENTE

---

## 10. Soft Delete vs Hard Delete

### Padrão Observado

**Soft Delete** (padrão preferido):
```typescript
async remove(id: string) {
  return this.prisma.entidade.update({
    where: { id },
    data: { ativo: false },
  });
}
```

**Hard Delete** (operação administrativa):
```typescript
async hardDelete(id: string) {
  return this.prisma.entidade.delete({
    where: { id },
  });
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Soft Delete | Método `remove()`, marca `ativo: false` |
| Hard Delete | Método `hardDelete()`, usa Prisma `.delete()` |
| Endpoint Soft | `PATCH /:id/inativar` |
| Endpoint Hard | `DELETE /:id` |
| Perfil Necessário | Apenas ADMINISTRADOR |

**Grau de consistência**: CONSISTENTE

---

## 11. Tratamento de Erros

### Padrões Observados

**Exceptions utilizadas**:

| Exception | Quando Usar | Código HTTP |
|-----------|-------------|-------------|
| `NotFoundException` | Recurso não encontrado | 404 |
| `ConflictException` | Violação de unicidade (email duplicado, etc.) | 409 |
| `ForbiddenException` | Sem permissão para ação | 403 |
| `BadRequestException` | Dados inválidos | 400 |
| `UnauthorizedException` | Não autenticado | 401 |

**Exemplos reais**:
```typescript
if (!usuario) {
  throw new NotFoundException('Usuário não encontrado');
}

if (existingEmail) {
  throw new ConflictException('Email já cadastrado');
}

if (!hasPermission) {
  throw new ForbiddenException('Você não pode executar esta ação');
}
```

**Grau de consistência**: CONSISTENTE

---

## 12. Upload de Arquivos

### Padrão Observado

**Onde aparece**:
- `/backend/src/modules/usuarios/usuarios.controller.ts` (upload de avatar)
- `/backend/src/modules/empresas/empresas.controller.ts` (upload de logo)

```typescript
@Patch(':id/avatar')
@UseInterceptors(
  FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './public/images/avatars',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `avatar-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Apenas imagens são permitidas'), false);
      }
      cb(null, true);
    },
  })
)
@ApiConsumes('multipart/form-data')
uploadAvatar(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
  return this.usuariosService.updateAvatar(id, file);
}
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Interceptor | `FileInterceptor('campo')` |
| Storage | `diskStorage()` em `/public/images/{tipo}` |
| Filename | `{tipo}-{timestamp}-{random}{ext}` |
| Filtro | Validação de tipo MIME (apenas imagens) |
| API Doc | `@ApiConsumes('multipart/form-data')` |
| Decorator | `@UploadedFile() file: Express.Multer.File` |

**Grau de consistência**: CONSISTENTE

---

## 13. Prisma ORM

### Padrões Observados

**Uso de Select**:
```typescript
return this.prisma.usuario.findMany({
  select: {
    id: true,
    email: true,
    nome: true,
    cargo: true,
    ativo: true,
    perfil: {
      select: {
        id: true,
        codigo: true,
        nome: true,
      },
    },
    empresa: {
      select: {
        id: true,
        nomeFantasia: true,
      },
    },
  },
});
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Select | Sempre explícito, nunca retornar tudo |
| Senha | NUNCA incluída no select |
| Relações | Nested select para incluir dados relacionados |
| Contadores | `_count: { relacao: true }` para estatísticas |
| Where | UUIDs com `{ id }`, emails com `{ email }` |

**Grau de consistência**: CONSISTENTE

---

## 14. Endpoints Públicos (Sem Autenticação)

### Padrão Observado

**Onde aparece**: `/backend/src/modules/empresas/empresas.controller.ts`

```typescript
// Endpoints públicos DEVEM vir ANTES de rotas com :id para não serem interceptados

// Endpoint público para buscar customização por CNPJ (sem autenticação)
@Get('customization/:cnpj')
@ApiOperation({ summary: 'Buscar customização da empresa por CNPJ (público)' })
@ApiResponse({ status: 200, description: 'Customização encontrada' })
@ApiResponse({ status: 404, description: 'Empresa não encontrada' })
async getCustomizationByCnpj(@Param('cnpj') cnpj: string) {
  return this.empresasService.findByCnpj(cnpj);
}

// Endpoint público para buscar empresa por loginUrl (sem autenticação)
@Get('by-login-url/:loginUrl')
@ApiOperation({ summary: 'Buscar empresa por loginUrl (público)' })
async getByLoginUrl(@Param('loginUrl') loginUrl: string) {
  return this.empresasService.findByLoginUrl(loginUrl);
}

// Rotas protegidas vêm depois
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)

@Get(':id')
@Roles('ADMINISTRADOR', 'GESTOR')
// ...
```

**Convenções aplicadas**:

| Aspecto | Padrão |
|---------|--------|
| Ordem | Endpoints públicos ANTES de rotas com `:id` |
| Sem Guards | Não usa `@UseGuards()` |
| Sem Auth | Não usa `@ApiBearerAuth()` |
| Documentação | Comentário explícito: `// público (sem autenticação)` |

**Grau de consistência**: CONSISTENTE (nos poucos casos onde se aplica)

---

## Limitações e Inconsistências Atuais

### Áreas sem Padrão Consolidado

1. **Paginação**: Não há padrão consistente implementado nos endpoints de listagem
2. **Filtros**: Não há padrão para query params de filtro
3. **Ordenação**: Não implementado no backend (feito no frontend)
4. **Rate Limiting**: ThrottlerModule configurado globalmente (60s, 10 req), mas não testado em cenários de carga
5. **Logging**: Logger declarado nos services mas uso inconsistente
6. **Internacionalização**: Mensagens de erro em português, sem i18n
7. **Versionamento de API**: Não implementado (sem `/v1`, `/v2`)
8. **Testes E2E**: Removidos, não há padrão definido

### Pontos que Precisam Decisão Futura

- Implementar paginação padronizada?
- Adicionar filtros dinâmicos (query builder)?
- Internacionalizar mensagens de erro?
- Versionar API?
- Reativar testes E2E com padrão definido?
- Padronizar logs estruturados?

**Consistência**: **PARCIAL** (exceções específicas, sem handler global)

---

## 6. Autenticação e Guards

### JWT e Refresh Tokens

**Arquivo**: `src/modules/auth/auth.service.ts`

```typescript
async login(usuario: any, ip?: string, userAgent?: string) {
  const payload = {
    sub: usuario.id,
    email: usuario.email,
    perfil: usuario.perfil?.codigo || usuario.perfil,
    empresaId: usuario.empresaId,
  };

  const accessToken = this.jwtService.sign(payload);
  const refreshToken = this.jwtService.sign(payload, {
    secret: this.configService.get('JWT_REFRESH_SECRET'),
    expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
  });

  // Registra login bem-sucedido
  await this.registrarLogin(usuario.id, usuario.email, true, null, ip, userAgent);

  return {
    accessToken,
    refreshToken,
    usuario: { /* ... */ }
  };
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Tokens** | Access + Refresh | Sempre dual tokens |
| **Payload** | sub (id), email, perfil, empresaId | Informação de contexto |
| **Configuração** | Via `ConfigService` (variáveis de ambiente) | Secrets externalizados |
| **Refresh Expiration** | Padrão '7d' | Configurável |
| **Auditoria** | `registrarLogin()` registra tentativas (sucesso/falha) | Implementado |

### Guards

**Arquivo**: `src/modules/auth/guards/jwt-auth.guard.ts`

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Arquivo**: `src/modules/auth/guards/roles.guard.ts`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<Role[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Endpoint público
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user as { perfil?: Role } | undefined;
    if (!user || !user.perfil) return false;
    return requiredRoles.includes(user.perfil);
  }
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **JWT Guard** | Estende `AuthGuard('jwt')` | Sem customização |
| **Roles Guard** | Implementa `CanActivate` + `Reflector` | Lê metadata do decorator @Roles |
| **Sem Roles** | Endpoint é público | Guard permite se não houver roles definidas |
| **Perfil no Request** | `request.user.perfil` | Passado pelo JWT payload |

### Decorador @Roles

**Arquivo**: `src/modules/auth/decorators/roles.decorator.ts`

```typescript
export const ROLES_KEY = 'roles';
export type Role = 'ADMINISTRADOR' | 'CONSULTOR' | 'GESTOR' | 'COLABORADOR' | 'LEITURA';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

**Padrão**:
```typescript
@Roles('ADMINISTRADOR', 'GESTOR')
create(@Body() dto: CreateDto) { }
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Type** | Union de string literals | Tipagem segura |
| **Perfis** | ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA | 5 perfis (nota: CONSULTOR no type, não visto ativo) |
| **Múltiplos Perfis** | Pode passar vários: `@Roles('A', 'B')` | OR logic |

**Consistência**: **CONSISTENTE**

---

## 7. Enums

### Enums Observados

**Arquivo**: `backend/prisma/schema.prisma`

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

enum EstadoBrasil {
  AC
  AL
  AP
  // ... 27 estados
  TO
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Nomes** | MAIUSCULA_SEPARADO_UNDERSCORE | Criticidade: ALTO, MEDIO, BAIXO (sem acento) |
| **Localização** | Schema Prisma (fonte única) | Gerado no TypeScript automaticamente |
| **Sem Acentuação** | MEDIO (não MÉDIO) | Consistente em todo projeto |
| **Valores** | String literals | Nunca números |

**Consistência**: **CONSISTENTE**

---

## 8. Prisma ORM

### Padrão Observado

**Arquivo**: `backend/prisma/schema.prisma` (333 linhas)

```prisma
model Usuario {
  id        String   @id @default(uuid())
  email     String   @unique
  nome      String
  senha     String
  cargo     String
  telefone  String?
  fotoUrl   String?
  ativo     Boolean  @default(true)
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  perfil    PerfilUsuario @relation(fields: [perfilId], references: [id])
  perfilId  String
  
  empresa   Empresa?  @relation(fields: [empresaId], references: [id])
  empresaId String?
  
  @@unique([email, empresaId])
  @@map("usuarios")
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **ID** | UUID string com `@default(uuid())` | Sempre UUID, nunca numérico |
| **Timestamps** | `createdAt` e `updatedAt` | Automáticos |
| **Soft Delete** | Campo `ativo: Boolean @default(true)` | Não usa `@db.Timestamp deletedAt` |
| **Índices** | `@unique`, `@@unique()` para compostos | Email único, email+empresa único |
| **Relationais** | Explícitas com `@relation()` | Foreign keys mapeados |
| **Nullable** | `?` para campos opcionais | `empresa?: Empresa` |
| **Table Name** | `@@map("snake_case")` | `usuarios`, `perfis_usuario` |
| **Migrations** | Versionadas em `migrations/` | `20251208164933_initial_schema/` |

**Soft Delete Específico**:
- Não existe campo de data de exclusão
- Campo `ativo` é usado para marcar como inativo
- Hard delete é operação real quando necessário

**Consistência**: **CONSISTENTE**

---

## 9. Swagger/OpenAPI

### Padrão Observado

Todos endpoints estão documentados com Swagger.

**Decoradores usados**:
- `@ApiTags('nome')` - Agrupa endpoints
- `@ApiBearerAuth()` - Indica autenticação JWT
- `@ApiOperation({ summary: 'texto' })` - Descrição
- `@ApiProperty()` / `@ApiPropertyOptional()` - Documenta DTO fields
- `@ApiConsumes()` - Para upload de arquivo
- `@ApiBody()` - Documenta corpo customizado

**Exemplo**:
```typescript
@ApiTags('usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Criar novo usuário' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) { }
}
```

**Endpoint da documentação**: `/api/docs` (padrão NestJS)

**Consistência**: **CONSISTENTE**

---

## 10. Auditoria

### Padrão Observado

**Arquivo**: `src/modules/audit/audit.service.ts`

```typescript
@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    usuarioId: string;
    usuarioNome: string;
    usuarioEmail: string;
    entidade: string;
    entidadeId: string;
    acao: 'CREATE' | 'UPDATE' | 'DELETE';
    dadosAntes?: any;
    dadosDepois?: any;
  }) {
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
  }
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Entidade** | `AuditLog` no banco | Tabela separada |
| **Campos** | usuarioId, usuarioNome, usuarioEmail, entidade, entidadeId, acao, dadosAntes, dadosDepois | Completo |
| **Ações** | CREATE, UPDATE, DELETE (string literal) | 3 tipos |
| **Dados Anteriores/Posteriores** | Stored como JSON | Permite rastreabilidade completa |
| **Timestamp** | Automaticamente por `createdAt` do modelo | Incluído automaticamente |

**Inconsistência Observada**:
- Service de auditoria é injido mas **NÃO é chamado consistentemente em todos os métodos**
- Implementação é parcial, alguns métodos não registram auditoria

**Consistência**: **INCONSISTENTE** (definido, mas não integrado em todos os endpoints)

---

## 11. Configuração e Variáveis de Ambiente

### Padrão Observado

**Arquivo**: `src/app.module.ts`

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
})
```

**Uso**: `ConfigService` injetado em serviços

```typescript
constructor(private configService: ConfigService) {}

const secret = this.configService.get('JWT_REFRESH_SECRET');
const ttl = this.configService.get('JWT_REFRESH_EXPIRATION', '7d'); // default
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Módulo** | `ConfigModule.forRoot()` global | Uma vez na raiz |
| **Arquivo** | `.env` na raiz do backend | Não versionado |
| **Acesso** | Via `ConfigService` | Nunca direto em `process.env` |
| **Defaults** | Segundo argumento no `.get()` | `get('KEY', 'default')` |
| **Variáveis Comuns** | DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, JWT_REFRESH_EXPIRATION | Observadas no código |

**Consistência**: **CONSISTENTE**

---

## 12. Throttling e Rate Limiting

### Padrão Observado

**Arquivo**: `src/app.module.ts`

```typescript
ThrottlerModule.forRoot([
  {
    ttl: 60000,  // 60 segundos
    limit: 10,   // 10 requisições
  },
])
```

**Padrão**: 10 requisições por 60 segundos (global)

**Consistência**: **CONSISTENTE** (hardcoded, não em config)

---

## 13. Segurança - Cookies e CSRF

### ⚠️ PROIBIDO: Cookies para Autenticação

**Regra Obrigatória:**

> ❌ **NUNCA** usar cookies para armazenar tokens de autenticação (JWT ou refresh tokens)
> ❌ **NUNCA** aceitar autenticação via cookies (session-based auth)
> ✅ **SEMPRE** usar header `Authorization: Bearer {token}`

**Justificativa:**

Sistema usa **JWT stateless** em headers HTTP. Esta arquitetura elimina necessidade de proteção CSRF (Cross-Site Request Forgery), pois:

1. JWT em `localStorage`/`sessionStorage` não é enviado automaticamente pelo navegador
2. Atacante cross-origin não pode forçar navegador a incluir header `Authorization`
3. CORS já bloqueia requisições de origens não autorizadas

**Se Cookies Forem Introduzidos:**

⚠️ **OBRIGATÓRIO** implementar proteção CSRF:
- Gerar tokens CSRF por sessão
- Validar tokens em todas as mutações (POST/PATCH/DELETE)
- Criar ADR justificando mudança arquitetural
- Atualizar testes de segurança

**Exemplo de Violação (NÃO FAZER):**

```typescript
// ❌ PROIBIDO
@Post('login')
async login(@Body() dto: LoginDto, @Res() res: Response) {
  const tokens = await this.authService.login(dto);
  res.cookie('access_token', tokens.accessToken, { httpOnly: true });
  return res.json({ success: true });
}
```

**Padrão Correto (FAZER):**

```typescript
// ✅ CORRETO
@Post('login')
async login(@Body() dto: LoginDto) {
  return this.authService.login(dto); // Cliente armazena em localStorage
}
```

**Documentação:**
- ADR-013: CSRF Desnecessário em Arquitetura JWT Stateless
- RN-SEC-001.8: CSRF Não Implementado

**Validação:**
- Testes E2E NÃO esperam proteção CSRF
- CI DEVE falhar se cookies de autenticação forem introduzidos sem CSRF

---

## Resumo - Consistência do Backend

| Aspecto | Consistência | Notas |
|---------|--------------|-------|
| Estrutura de Módulos | CONSISTENTE | Todos seguem o padrão |
| Controllers | CONSISTENTE | Finos, delegam para services |
| Services | CONSISTENTE | Lógica centralizada, async/await |
| DTOs | CONSISTENTE | Sempre com class-validator + Swagger |
| Tratamento de Erros | PARCIAL | Exceções do NestJS, sem handler global |
| Autenticação JWT | CONSISTENTE | Dual tokens, refresh automático |
| Guards e Roles | CONSISTENTE | RBAC por perfil |
| Enums | CONSISTENTE | MAIUSCULA, sem acentuação |
| Prisma ORM | CONSISTENTE | UUID, soft delete, versionado |
| Swagger | CONSISTENTE | Todos endpoints documentados |
| Auditoria | INCONSISTENTE | Definida, mas não integrada em todos os métodos |
| Configuração | CONSISTENTE | ConfigModule global |
| Rate Limiting | CONSISTENTE | Throttler hardcoded |

---

## Limitações e Gaps - Backend

1. **Auditoria não consolidada**: Service de auditoria existe mas não é chamado em todos os endpoints (implementação incompleta)

2. **Global Error Handler**: Não existe exception filter global (sem tratamento uniforme de erros)

3. **Validação customizada**: Nenhum custom validator observado (apenas class-validator padrão)

4. **Request Logging**: Não há middleware de log de requisições (Winston existe no package.json mas não integrado)

5. **Rate Limiting Hardcoded**: Throttler define 10/min globalmente sem configuração por endpoint

6. **Perfil CONSULTOR**: Type existe mas não é usado ativamente no schema (legacy?)

7. **Padrão de Repository Pattern**: Não consolidado (services acessam Prisma diretamente)

8. **Testes Unitários**: Backend test scripts existem (jest) mas não há testes observados no repositório

9. **Documentação de Endpoints**: Swagger está lá, mas não há descrição de possíveis erros (@ApiResponse não observado)

10. **Soft Delete Automático**: Consultas não filtram automaticamente `ativo=true` (pode retornar usuários inativos)
