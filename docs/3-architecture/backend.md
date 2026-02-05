# Arquitetura do Backend

**Última atualização:** 2026-02-04  
**Status:** Documentação consolidada (baseado em código existente)

---

## Propósito deste Documento

Descrever a arquitetura detalhada do backend da aplicação Reiche Academy,
focando em implementação específica, padrões e decisões técnicas.

**Para stack tecnológico consolidado, consulte:** [overview.md](./overview.md#2-stack-tecnológico-consolidado)

---

## 1. Estrutura do Projeto

```
backend/
├── src/
│   ├── main.ts                    # Entry point, configuração global
│   ├── app.module.ts              # Root module
│   ├── common/                    # Recursos compartilhados
│   │   ├── guards/                # Auth guards, RBAC
│   │   ├── decorators/            # Custom decorators
│   │   ├── pipes/                 # Global pipes
│   │   ├── interceptors/          # HTTP interceptors
│   │   └── interfaces/            # Type definitions
│   ├── modules/                   # Módulos de negócio
│   │   ├── {module}/
│   │   │   ├── {module}.module.ts
│   │   │   ├── {module}.controller.ts
│   │   │   ├── {module}.service.ts
│   │   │   └── dto/
│   │   │       ├── create-{entity}.dto.ts
│   │   │       ├── update-{entity}.dto.ts
│   │   │       └── response-{entity}.dto.ts
│   ├── config/                    # Configurações de ambiente
│   └── prisma/                    # Prisma service
├── prisma/
│   ├── schema.prisma              # Modelo de dados
│   ├── migrations/                # Versionamento do schema
│   └── seed.ts                    # Dados iniciais
├── public/                        # Arquivos estáticos
│   └── images/                    # Logos, avatares
├── scripts/                       # Scripts utilitários
├── diagrams/                      # Documentação visual
├── Dockerfile                     # Build Docker
├── package.json                   # Dependências e scripts
└── tsconfig.json                  # Configuração TypeScript
```

---

## 2. Entry Point e Configuração Global

### Arquivo: `backend/src/main.ts`

**Configurações aplicadas:**

```typescript
// ValidationPipe global
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Remove propriedades não definidas
    forbidNonWhitelisted: true,  // Rejeita propriedades extras
    transform: true,             // Transforma payloads para tipos DTO
  })
);

// Middlewares de segurança
app.use(helmet());                 // HTTP security headers
app.enableCors();                  // CORS habilitado
app.use(compression());            // Compressão de respostas

// Swagger/OpenAPI
SwaggerModule.setup('api/docs', app, document);
  - Rota: /api/docs
  - Titulo: Reiche Academy API
  - Descrição completa configurada

// Arquivos estáticos
app.useStaticAssets(join(__dirname, '..', 'public'), {
  prefix: '/public',
});

// Servidor
await app.listen(process.env.PORT || 3000, '0.0.0.0');
  - Global prefix: /api
  - Host: 0.0.0.0
  - Porta: 3000 (default)
```

**Middlewares ativos:**
- Helmet (segurança HTTP)
- CORS (habilitado para frontend)
- Compression (gzip)
- ValidationPipe (validação global)

---

## 3. Módulos Registrados

### Root Module: `backend/src/app.module.ts`

| Módulo | Tipo | Responsabilidade | Imports Principais |
|--------|------|------------------|-------------------|
| **ConfigModule** | Infra | Variáveis de ambiente | `.env` validation |
| **ThrottlerModule** | Segurança | Rate limiting | 10 req/60s global |
| **PrismaModule** | Infra | Conexão banco | PrismaService global |
| **AuthModule** | Negócio | Autenticação JWT | JwtModule, Passport |
| **UsuariosModule** | Negócio | CRUD usuários | AuthModule (referência) |
| **EmpresasModule** | Negócio | CRUD empresas | Multi-tenant |
| **PilaresModule** | Negócio | PDCA - Pilares | Auth module |
| **PilaresEmpresaModule** | Negócio | Relação N:N | Junction table |
| **RotinasModule** | Negócio | PDCA - Rotinas | Hierarquia de pilares |
| **DiagnosticosModule** | Negócio | Avaliações | Business logic |
| **AuditModule** | Negócio | Auditoria | Logging de ações |
| **PerfisModule** | Negócio | RBAC | Profile management |

### Configuração do ThrottlerModule

```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,      // 60 segundos
  limit: 10,        // 10 requisições
}])
```

---

## 4. Padrão de Módulo de Negócio

### Estrutura Consistente

```
src/modules/{module}/
├── {module}.module.ts        # Module definition
├── {module}.controller.ts    # REST endpoints
├── {module}.service.ts       # Business logic
├── dto/                      # Data Transfer Objects
│   ├── create-{entity}.dto.ts
│   ├── update-{entity}.dto.ts
│   └── response-{entity}.dto.ts
└── entities/                 # Domain models (se necessário)
```

### Responsabilidades

**Controller:**
- Define endpoints REST
- Aplica guards (`@UseGuards()`)
- Decorators de documentação Swagger
- Delega para services

**Service:**
- Implementa regras de negócio
- Interação com PrismaService
- Validações específicas do domínio
- Logging de auditoria

**DTOs:**
- Contratos de entrada/saída
- Validação com `class-validator`
- Documentação com `@ApiProperty()`

---

## 5. Segurança Implementada

### Autenticação (AuthModule)

**JWT Strategy:**
```typescript
// Access token: 2h (padrão)
// Refresh token: 1d (padrão)
// Payload: userId, email, perfil, empresaId
```

**Endpoints auth:**
```
POST /api/auth/login           # Autenticação
POST /api/auth/register        # Novo usuário
POST /api/auth/refresh         # Refresh token
POST /api/auth/logout          # Logout (token blacklist)
POST /api/auth/forgot-password # Recuperação de senha
POST /api/auth/reset-password  # Reset com token
```

### Autorização (RBAC)

**Guards disponíveis:**
- `JwtAuthGuard` - Verifica JWT válido
- `RolesGuard` - Verifica permissões específicas
- `EmpresaGuard` - Isolamento multi-tenant

**Perfis hierárquicos:**
```
ADMINISTRADOR (nivel: 1) > GESTOR (nivel: 2) > COLABORADOR (nivel: 3) > LEITURA (nivel: 4)
```

**Profile Elevation Protection:**
- Usuário não pode criar/editar usuários com nível <= seu próprio nível
- ADMINISTRADOR tem acesso global (ignora empresaId)

### Segurança HTTP

**Headers implementados:**
```typescript
// Helmet configuração padrão:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security (em HTTPS)
```

**Rate Limiting:**
- Global: 10 requisições por 60 segundos
- Por IP (padrão ThrottlerModule)
- Configurável por endpoint se necessário

---

## 6. Validação e DTOs

### ValidationPipe Global

```typescript
new ValidationPipe({
  whitelist: true,              // Remove não definidos no DTO
  forbidNonWhitelisted: true,  // Rejeita propriedades extras
  transform: true,             // Auto-conversão de tipos
  transformOptions: {
    enableImplicitConversion: true,
  }
})
```

### Padrões de DTO

**Create DTO:**
```typescript
export class CreateUsuarioDto {
  @IsEmail()
  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  @ApiProperty({ example: 'password123' })
  senha: string;

  @IsNotEmpty()
  @ApiProperty({ example: 'João Silva' })
  nome: string;

  @IsUUID()
  @ApiProperty({ example: 'uuid-perfil-id' })
  perfilId: string;
}
```

**Update DTO:**
```typescript
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  // Herda campos como opcionais (PartialType)
}
```

**Response DTO:**
```typescript
export class UsuarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nome: string;

  @ApiProperty()
  ativo: boolean;

  @ApiProperty()
  perfil: PerfilResponseDto;
}
```

---

## 7. Persistência de Dados (Prisma)

### PrismaService

**Injeção global:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }
}
```

### Padrões de Query

**Sempre usar `.select()`:**
```typescript
// ✅ CORRETO - Retorna apenas campos necessários
return this.prisma.usuario.findMany({
  select: {
    id: true,
    email: true,
    nome: true,
    ativo: true,
    perfil: {
      select: {
        id: true,
        codigo: true,
        nome: true,
      },
    },
  },
});

// ❌ ERRADO - Retorna todos os campos incluindo senha
return this.prisma.usuario.findMany();
```

**Soft Delete Pattern:**
```typescript
// Soft delete (padrão)
async remove(id: string): Promise<void> {
  await this.prisma.usuario.update({
    where: { id },
    data: { ativo: false },
  });
}

// Hard delete (quando necessário)
async hardDelete(id: string): Promise<void> {
  await this.prisma.usuario.delete({
    where: { id },
  });
}
```

---

## 8. API REST Patterns

### Padrão de Endpoints

**CRUD Básico:**
```typescript
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {

  @Get()
  @Roles('ADMINISTRADOR', 'GESTOR')
  findAll() { /* lista todos */ }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
  findOne(@Param('id') id: string) { /* busca por ID */ }

  @Post()
  @Roles('ADMINISTRADOR')
  create(@Body() createDto: CreateUsuarioDto) { /* cria */ }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'GESTOR')
  update(@Param('id') id: string, @Body() updateDto: UpdateUsuarioDto) { /* atualiza */ }

  @Delete(':id')
  @Roles('ADMINISTRADOR')
  remove(@Param('id') id: string) { /* soft delete */ }
}
```

**Configuração global:**
- Base URL: `/api`
- Host: `0.0.0.0`
- Porta: `3000`
- Documentation: `/api/docs`

---

## 9. Documentação da API (Swagger)

### Configuração

```typescript
// main.ts
const config = new DocumentBuilder()
  .setTitle('Reiche Academy API')
  .setDescription('API para sistema PDCA de gestão organizacional')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

### Uso de Decorators

```typescript
@ApiOperation({ summary: 'Criar novo usuário' })
@ApiCreatedResponse({ type: UsuarioResponseDto })
@ApiForbiddenResponse({ description: 'Sem permissão' })
@ApiConflictResponse({ description: 'Email já existe' })
@Post()
create(@Body() createDto: CreateUsuarioDto) {
  return this.usuariosService.create(createDto);
}
```

---

## 10. Auditoria e Logging

### AuditModule

**Registro automático de ações:**
```typescript
@Injectable()
export class AuditService {
  async log(action: string, entity: string, entityId: string, userId: string) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        userId,
        timestamp: new Date(),
      },
    });
  }
}
```

**Ações auditadas:**
- CREATE: Criação de entidades
- UPDATE: Modificação de dados
- DELETE: Soft/Hard delete
- LOGIN: Tentativas de autenticação

### Logger Pattern

```typescript
@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  async create(createDto: CreateUsuarioDto) {
    this.logger.log(`Creating user: ${createDto.email}`);
    // ... implementação
  }
}
```

---

## 11. Arquivos Estáticos

### Configuração

```typescript
// main.ts
app.useStaticAssets(join(__dirname, '..', 'public'), {
  prefix: '/public',
  setHeaders: (res, path) => {
    // CORS para assets estáticos
    res.header('Access-Control-Allow-Origin', '*');
  },
});
```

### Usos identificados

**Path público:** `/public`

**Conteúdo servido:**
- Imagens de perfil/avatar
- Logos de empresas
- Assets estáticos diversos

**Localização:** `backend/public/images/`

---

## 12. Scripts Utilitários

### Scripts disponíveis

| Script | Finalidade | Localização |
|--------|------------|-------------|
| `check-empresas.ts` | Verificação de dados de empresas | `backend/scripts/` |
| `check-user.ts` | Verificação de dados de usuários | `backend/scripts/` |
| `seed.ts` | População inicial do banco | `backend/prisma/` |

### Execução

```bash
# Seed de dados
npm run seed

# Scripts personalizados
npx ts-node scripts/check-empresas.ts
```

---

## 13. Build e Execução

### Scripts npm

```json
{
  "scripts": {
    "dev": "nest start --watch",
    "start:debug": "nest start --debug",
    "build": "nest build",
    "start:prod": "node dist/main",
    "lint": "eslint --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "seed": "ts-node prisma/seed.ts"
  }
}
```

### Configurações

**TypeScript:**
- `tsconfig.json` - Configuração base
- `tsconfig.build.json` - Build específico

**NestJS:**
- `nest-cli.json` - Configuração CLI

---

## 14. Testes

### Framework: Jest

**Estrutura de testes:**
```
src/
├── modules/
│   └── {module}/
│       ├── {module}.controller.spec.ts
│       ├── {module}.service.spec.ts
│       └── dto/
│           └── *.dto.spec.ts
└── test/
    └── e2e/
        └── {module}.e2e-spec.ts
```

### Padrões de Teste

**Service Test:**
```typescript
describe('UsuariosService', () => {
  let service: UsuariosService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [UsuariosService, PrismaService],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create user', async () => {
    const result = await service.create(createDto);
    expect(result.email).toBe(createDto.email);
  });
});
```

---

## 15. Configuração de Ambiente

### Variáveis de Ambiente

```bash
# Database
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Auth
JWT_SECRET="super-secret-key"
JWT_ACCESS_EXPIRATION="2h"
JWT_REFRESH_SECRET="refresh-secret-key"
JWT_REFRESH_EXPIRATION="1d"

# API
PORT=3000
API_PREFIX="api"

# CORS
CORS_ORIGIN="http://localhost:4200"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=10

# Redis (se configurado)
REDIS_URL="redis://localhost:6379"
```

### ConfigModule

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  validationSchema: Joi.object({
    DATABASE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
    PORT: Joi.number().default(3000),
  }),
});
```

---

## 16. Documentação Visual

### Diagramas disponíveis

| Diagrama | Descrição | Localização |
|----------|-----------|-------------|
| `erd.mmd` | Entity Relationship Diagram | `backend/diagrams/erd.mmd` |
| `README.md` | Documentação dos diagramas | `backend/diagrams/README.md` |

**Formato:** Mermaid (pode ser renderizado no GitHub)

---

## 17. Limitações e Próximos Passos

### Funcionalidades não implementadas

- **Paginação:** Não há padrão definido
- **Filtros dinâmicos:** Query params não estruturados
- **Versionamento de API:** Sem `/v1` no momento
- **Cache Redis:** Configurado mas sem uso ativo
- **Rate limiting granular:** Apenas global atualmente
- **Internacionalização:** Erros apenas em português

### Melhorias planejadas

- Implementar paginação padronizada (cursor-based?)
- Adicionar filtros dinâmicos para endpoints de listagem
- Versionar API (`/api/v1/`)
- Implementar cache Redis para queries frequentes
- Internacionalizar mensagens de erro
- Adicionar health check endpoint

---

## 18. Documentos Relacionados

- **Visão Geral:** [overview.md](./overview.md)
- **Dados:** [data.md](./data.md) - Schema completo
- **Infraestrutura:** [infrastructure.md](./infrastructure.md) - Deploy e Docker
- **Convenções:** [../conventions/backend.md](../conventions/backend.md) - Padrões de código
- **Business Rules:** [../business-rules/](../business-rules/) - Regras de negócio

---

**Princípio:** Este documento reflete a implementação atual do backend. Para decisões arquitetônicas gerais, consulte [overview.md](./overview.md).