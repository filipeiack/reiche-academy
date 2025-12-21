# Convenções - Backend (NestJS)

## 1. Estrutura de Módulos

### Padrão Observado

Cada módulo de negócio segue a estrutura:
```
src/modules/{nome-modulo}/
├── {nome}.module.ts          # Declaração do módulo
├── {nome}.controller.ts       # Endpoints HTTP
├── {nome}.service.ts          # Lógica de negócio
├── dto/                       # Data Transfer Objects
│   ├── create-{nome}.dto.ts
│   └── update-{nome}.dto.ts
└── (opcional) guards/, decorators/, strategies/
```

**Módulos existentes no projeto**:
- `usuarios/` - Gestão de usuários
- `empresas/` - Gestão de empresas
- `auth/` - Autenticação JWT
- `pilares/` - Gestão de pilares
- `rotinas/` - Gestão de rotinas
- `diagnosticos/` - Gestão de diagnósticos
- `audit/` - Log de auditoria
- `perfis/` - Gestão de perfis de usuário

**Arquivo**: `src/app.module.ts`  
**Consistência**: **CONSISTENTE**

### Módulo Raiz

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    // ... outros módulos
  ],
})
export class AppModule {}
```

**Característico**:
- ConfigModule global
- ThrottlerModule para rate limiting (60s, 10 requisições)
- PrismaModule injetado como dependência

---

## 2. Controllers

### Padrão Observado

Controllers são finos e delegam lógica para services.

**Arquivo exemplo**: `src/modules/usuarios/usuarios.controller.ts`

```typescript
@ApiTags('usuarios')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Criar novo usuário' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usuariosService.findById(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Deletar usuário' })
  remove(@Param('id') id: string) {
    return this.usuariosService.hardDelete(id);
  }

  @Patch(':id/inativar')
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'Inativar usuário' })
  inactivate(@Param('id') id: string) {
    return this.usuariosService.remove(id);
  }
}
```

**Padrões observados**:

| Aspecto | Padrão | Exemplo |
|---------|--------|---------|
| **Decorator de Rota** | `@Controller('nome-recurso')` (kebab-case) | `@Controller('usuarios')` |
| **Decoradores API** | Todos endpoints têm `@ApiTags()`, `@ApiOperation()`, `@ApiBearerAuth()` | Visto acima |
| **Guards** | `@UseGuards(JwtAuthGuard, RolesGuard)` aplicado ao controller | Todos os controllers |
| **Autorização** | `@Roles('PERFIL')` por endpoint (pode ter múltiplos perfis) | `@Roles('ADMINISTRADOR', 'GESTOR')` |
| **Métodos CRUD** | POST (create), GET (findAll/findOne), PATCH (update), DELETE (remove) | Padrão REST |
| **Parâmetros** | DTOs tipados com `@Body()`, IDs com `@Param('id')` | `CreateUsuarioDto`, `UpdateUsuarioDto` |
| **Soft Delete** | Endpoint separado `PATCH /:id/inativar` + `DELETE /:id` (hard delete) | Visto acima |

**Consistência**: **CONSISTENTE**

---

## 3. Services

### Padrão Observado

Services contêm toda a lógica de negócio. Injetam dependências (Prisma, Audit, outros serviços).

**Arquivo exemplo**: `src/modules/usuarios/usuarios.service.ts` (331 linhas)

```typescript
@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService, private audit: AuditService) {}

  async findAll() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nome: true,
        // ... campos
      },
    });
  }

  async create(data: any) {
    const existingUser = await this.findByEmail(data.email);
    
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await argon2.hash(data.senha);
    
    const created = await this.prisma.usuario.create({
      data: { ...data, senha: hashedPassword },
      select: { /* select fields */ },
    });

    return created;
  }

  async update(id: string, data: any) {
    // validações...
    return this.prisma.usuario.update({
      where: { id },
      data,
      select: { /* select fields */ },
    });
  }

  async remove(id: string) {
    // soft delete: ativo = false
    return this.prisma.usuario.update({
      where: { id },
      data: { ativo: false },
    });
  }

  async hardDelete(id: string) {
    // delete real
    return this.prisma.usuario.delete({
      where: { id },
    });
  }
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Decorator** | `@Injectable()` | Sempre presente |
| **Injeção** | Constructor com `private` | Visto sempre |
| **Métodos** | `async/await` (Promises) | Código 100% assíncrono |
| **Validação** | Feita no serviço antes de ação (verificação de existência, conflitos) | Throw exceptions |
| **Hash de Senha** | Argon2 (nunca bcrypt) | `await argon2.hash(data.senha)` |
| **Select Seletivo** | Usa `.select()` para retornar apenas campos necessários | Não retorna `senha` |
| **Soft Delete** | Campo `ativo: boolean` (update com ativo=false) | Método `remove()` |
| **Hard Delete** | Método separado `hardDelete()` | Delete real do BD |
| **Auditoria** | Service injeta `AuditService` (não observado log em todos os métodos) | Implementação parcial |

**Consistência**: **CONSISTENTE**

---

## 4. DTOs (Data Transfer Objects)

### Padrão Observado

DTOs usam `class-validator` para validação automática pelo NestJS.

**Arquivo**: `src/modules/usuarios/dto/create-usuario.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, IsUUID, IsOptional, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @ApiProperty({ example: 'joao@reiche.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  nome: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  senha: string;

  @ApiPropertyOptional({ example: '(11) 98765-4321' })
  @IsString()
  @IsOptional()
  telefone?: string;

  @ApiProperty({ example: 'uuid-perfil' })
  @IsUUID()
  @IsNotEmpty()
  perfilId: string;
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Arquivo** | `create-{entidade}.dto.ts`, `update-{entidade}.dto.ts` | Kebab-case, pluraliza a entidade |
| **Export** | Named export (não default) | `export class CreateUsuarioDto` |
| **Decoradores Swagger** | `@ApiProperty()` e `@ApiPropertyOptional()` | Sempre com `example` |
| **Validadores** | Decoradores do `class-validator` | `@IsEmail()`, `@IsNotEmpty()`, etc |
| **Campos Opcionais** | `@IsOptional()` + `?` no TypeScript | Telefone é opcional |
| **Validações Comuns** | Length, MinLength, IsEmail, IsUUID, IsString | Sem custom validators observados |
| **Sem Métodos** | DTOs são apenas data holders | Nenhum método visto |

**Consistência**: **CONSISTENTE**

---

## 5. Tratamento de Erros

### Padrões Observados

Usa exceções do NestJS (`@nestjs/common`).

**Exceções observadas no código**:
- `NotFoundException` - Recurso não encontrado (GET 404)
- `ConflictException` - Conflito (ex: email duplicado, POST 409)
- `UnauthorizedException` - Credenciais inválidas (GET 401)
- `BadRequestException` - Entrada inválida (GET 400)

**Exemplo**:
```typescript
if (!usuario) {
  throw new NotFoundException('Usuário não encontrado');
}

if (existingUser) {
  throw new ConflictException('Email já cadastrado');
}

if (!isPasswordValid) {
  throw new UnauthorizedException('Credenciais inválidas');
}
```

**Padrões observados**:

| Aspecto | Padrão | Observação |
|---------|--------|-----------|
| **Biblioteca** | `@nestjs/common` | Sempre |
| **Lançamento** | `throw new NestJsException()` | Nunca Error() genérico |
| **Mensagem** | Sempre em português | Mensagens de erro em PT-BR |
| **Mapping Automático** | NestJS converte para HTTP status automaticamente | NotFoundException → 404 |

**Inconsistências**:
- Global error handler **NÃO CONSOLIDADO** (nenhum exception filter observado)

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
