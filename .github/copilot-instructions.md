# Reiche Academy - Sistema de Gestão Empresarial PDCA

## Visão Geral
Sistema web SPA para gestão empresarial PDCA, substituindo planilhas Excel de Diagnóstico e Cockpit. Desenvolvimento em 2 fases, iniciando com módulo de Diagnóstico.

## Stack Tecnológica

### Frontend
- **Framework**: Angular 18+ com Angular Material
- **Template Base**: NobleUI Angular (em `templates/nobleui-angular/`)
- **Estado**: RxJS + NgRx (quando necessário)
- **Estrutura**: Componentes e módulos isolados, arquitetura modular

### Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: NestJS com TypeScript
- **Validação**: DTOs com class-validator
- **Documentação**: Swagger/OpenAPI (todos os endpoints documentados)
- **Arquitetura**: Clean Architecture (controllers → services → repositories)

### Banco de Dados
- **SGBD**: PostgreSQL
- **ORM**: Prisma com migrations versionadas
- **Auditoria**: Logs registram usuário, data/hora, operação e versão anterior dos dados

### Segurança & Autenticação
- **Auth**: JWT (access + refresh tokens)
- **Senhas**: Argon2 (nunca bcrypt)
- **RBAC**: 4 perfis (Consultor, Gestor, Colaborador, Leitura)
- **Proteção**: CSRF, XSS, SQL Injection
- **Compliance**: LGPD

### Infraestrutura
- **Containers**: Docker + Docker Compose
- **Proxy**: Nginx
- **CI/CD**: GitHub Actions
- **Storage**: S3-compatible
- **Observabilidade**: Winston/Pino + OpenTelemetry

## Estrutura do Projeto

### Fase 1 (Atual)
1. **Cadastros Essenciais**: Empresa, Usuário, Pilares, Rotinas, Agenda de Reuniões
2. **Wizard de Diagnóstico**: Associar Pilares/Rotinas por empresa, atribuir notas e criticidade (Alto/Médio/Baixo)
3. **Perfis e Permissões**: Isolamento de dados por empresa/contrato
4. **Log de Auditoria**: Rastreabilidade completa

### Fase 2 (Futura)
- Cockpit PDCA (5W2H, tarefas, anexos)
- KPIs/Metas/Resultados
- Dashboard 360°

## Convenções de Código

### Backend (NestJS)
```typescript
// Sempre usar DTOs tipados e validados
export class CreateDiagnosticoDto {
  @IsNotEmpty()
  @IsUUID()
  empresaId: string;
  
  @IsArray()
  @ValidateNested({ each: true })
  pilares: PilarDiagnosticoDto[];
}

// Services com injeção de dependências
@Injectable()
export class DiagnosticoService {
  constructor(
    private readonly repository: DiagnosticoRepository,
    private readonly auditService: AuditService,
  ) {}
}

// Controllers documentados com Swagger
@ApiTags('diagnostico')
@Controller('diagnostico')
export class DiagnosticoController {}
```

### Frontend (Angular)
```typescript
// Componentes standalone quando possível (Angular 18+)
@Component({
  selector: 'app-diagnostico-wizard',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './diagnostico-wizard.component.html'
})

// Services com tipagem rigorosa
@Injectable({ providedIn: 'root' })
export class DiagnosticoService {
  private apiUrl = environment.apiUrl;
  
  getDiagnostico(id: string): Observable<Diagnostico> {
    return this.http.get<Diagnostico>(`${this.apiUrl}/diagnostico/${id}`);
  }
}
```

### Banco de Dados (Prisma)
```prisma
// Sempre incluir auditoria
model Diagnostico {
  id          String   @id @default(uuid())
  empresaId   String
  empresa     Empresa  @relation(fields: [empresaId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String
  updatedBy   String?
}
```

## Regras de Negócio Críticas

1. **Isolamento de Dados**: Usuários só veem dados de suas empresas/contratos
2. **Auditoria Obrigatória**: Toda alteração deve ser logada
3. **Criticidade**: Sempre usar enum `Alto | Medio | Baixo` (sem acento)
4. **Validação**: Backend valida TUDO, frontend valida para UX
5. **Nomenclatura**: PascalCase para classes, camelCase para variáveis, kebab-case para rotas

## Referências Importantes

- **Planilhas Originais**: `planilhas/DIAGNOSTICO.xlsx` e `planilhas/COCKPIT.xlsx`
- **Template Frontend**: `templates/nobleui-angular/`
- **Contexto Completo**: `CONTEXT.md`

## Comandos Essenciais

```bash
# Backend
cd backend
npm install
npm run migration:dev    # Rodar migrations
npm run dev             # Desenvolvimento

# Frontend
cd frontend
npm install
ng serve                # Desenvolvimento (porta 4200)

# Docker
docker-compose up -d    # Subir PostgreSQL
```

## Próximos Passos

1. Criar estrutura monorepo (backend + frontend)
2. Configurar Prisma e migrations iniciais
3. Implementar autenticação JWT
4. Desenvolver módulo de Cadastros Essenciais
5. Implementar Wizard de Diagnóstico
