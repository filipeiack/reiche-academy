# 📋 Guia de Template CRUD - Reiche Academy

Este documento define o padrão completo para criação de CRUDs no sistema Reiche Academy, baseado na implementação do módulo de **Usuários**.

## 📚 Índice

1. [Estrutura de Arquivos](#estrutura-de-arquivos)
2. [Backend (NestJS)](#backend-nestjs)
3. [Frontend (Angular)](#frontend-angular)
4. [Checklist de Implementação](#checklist-de-implementação)

---

## 🗂️ Estrutura de Arquivos

### Backend: `/backend/src/modules/{nome-modulo}/`

```
{nome-modulo}/
├── dto/
│   ├── create-{entidade}.dto.ts
│   └── update-{entidade}.dto.ts
├── {nome-modulo}.controller.ts
├── {nome-modulo}.service.ts
└── {nome-modulo}.module.ts
```

### Frontend: `/frontend/src/app/views/pages/{nome-modulo}/`

```
{nome-modulo}/
├── {nome-modulo}-list/
│   ├── {nome-modulo}-list.component.ts
│   ├── {nome-modulo}-list.component.html
│   └── {nome-modulo}-list.component.scss
├── {nome-modulo}-form/
│   ├── {nome-modulo}-form.component.ts
│   ├── {nome-modulo}-form.component.html
│   └── {nome-modulo}-form.component.scss
└── {nome-modulo}.routes.ts
```

### Service Frontend: `/frontend/src/app/core/services/{nome-entidade}.service.ts`

---

## 🔧 Backend (NestJS)

### 1. DTOs (Data Transfer Objects)

#### `create-{entidade}.dto.ts`

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsEmail, IsNotEmpty, IsString, Length, 
  IsUUID, IsOptional, MinLength, IsBoolean 
} from 'class-validator';

export class Create{Entidade}Dto {
  @ApiProperty({ example: 'Valor exemplo' })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  campo: string;

  @ApiPropertyOptional({ example: 'Valor opcional' })
  @IsString()
  @IsOptional()
  campoOpcional?: string;

  @ApiProperty({ example: 'uuid-relacionamento' })
  @IsUUID()
  @IsNotEmpty()
  relacionamentoId: string;
}
```

**Validações comuns:**
- `@IsString()` - Campo texto
- `@IsEmail()` - Email válido
- `@IsNotEmpty()` - Não vazio
- `@IsUUID()` - UUID válido
- `@IsOptional()` - Campo opcional
- `@Length(min, max)` - Tamanho do texto
- `@MinLength(n)` - Tamanho mínimo
- `@IsBoolean()` - Booleano

#### `update-{entidade}.dto.ts`

```typescript
import { PartialType } from '@nestjs/swagger';
import { Create{Entidade}Dto } from './create-{entidade}.dto';

export class Update{Entidade}Dto extends PartialType(Create{Entidade}Dto) {}
```

---

### 2. Controller

**Template:** `/backend/src/modules/{nome-modulo}/{nome-modulo}.controller.ts`

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { {Entidade}Service } from './{nome-modulo}.service';
import { Create{Entidade}Dto } from './dto/create-{entidade}.dto';
import { Update{Entidade}Dto } from './dto/update-{entidade}.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('{nome-modulo}')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('{nome-modulo}')
export class {Entidade}Controller {
  constructor(private readonly service: {Entidade}Service) {}

  @Post()
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Criar novo registro' })
  create(@Body() createDto: Create{Entidade}Dto) {
    return this.service.create(createDto);
  }

  @Get()
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Listar todos os registros' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR', 'COLABORADOR', 'LEITURA')
  @ApiOperation({ summary: 'Buscar registro por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Patch(':id')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Atualizar registro' })
  update(@Param('id') id: string, @Body() updateDto: Update{Entidade}Dto) {
    return this.service.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR', 'CONSULTOR')
  @ApiOperation({ summary: 'Deletar registro permanentemente' })
  remove(@Param('id') id: string) {
    return this.service.hardDelete(id);
  }

  @Patch(':id/inativar')
  @Roles('ADMINISTRADOR', 'CONSULTOR', 'GESTOR')
  @ApiOperation({ summary: 'Inativar registro' })
  inactivate(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

**Perfis de Acesso:**
- **ADMINISTRADOR**: Acesso total (CRUD completo)
- **CONSULTOR**: Criar, Ler, Atualizar, Deletar
- **GESTOR**: Criar, Ler, Atualizar, Inativar
- **COLABORADOR**: Ler, Atualizar (próprios dados)
- **LEITURA**: Somente Ler

---

### 3. Service

**Template:** `/backend/src/modules/{nome-modulo}/{nome-modulo}.service.ts`

```typescript
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class {Entidade}Service {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService
  ) {}

  async findAll() {
    return this.prisma.{entidade}.findMany({
      select: {
        id: true,
        campo1: true,
        campo2: true,
        ativo: true,
        createdAt: true,
        updatedAt: true,
        // Incluir relacionamentos se necessário
        relacionamento: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
  }

  async findById(id: string) {
    const registro = await this.prisma.{entidade}.findUnique({
      where: { id },
      include: {
        relacionamento: true,
      },
    });

    if (!registro) {
      throw new NotFoundException('{Entidade} não encontrado');
    }

    return registro;
  }

  async create(data: any) {
    // Validações de negócio
    const existe = await this.prisma.{entidade}.findFirst({
      where: { campoUnico: data.campoUnico },
    });

    if (existe) {
      throw new ConflictException('Registro já existe');
    }

    const created = await this.prisma.{entidade}.create({
      data,
      include: {
        relacionamento: true,
      },
    });

    // Log de auditoria
    await this.audit.log({
      usuarioId: 'user-id-from-context',
      usuarioNome: 'Nome do usuário',
      usuarioEmail: 'email@exemplo.com',
      entidade: '{entidade}',
      entidadeId: created.id,
      acao: 'CREATE',
      dadosDepois: created,
    });

    return created;
  }

  async update(id: string, data: any) {
    const before = await this.findById(id);

    const after = await this.prisma.{entidade}.update({
      where: { id },
      data,
      include: {
        relacionamento: true,
      },
    });

    // Log de auditoria
    await this.audit.log({
      usuarioId: 'user-id-from-context',
      usuarioNome: 'Nome do usuário',
      usuarioEmail: 'email@exemplo.com',
      entidade: '{entidade}',
      entidadeId: id,
      acao: 'UPDATE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async remove(id: string) {
    const before = await this.findById(id);
    
    const after = await this.prisma.{entidade}.update({
      where: { id },
      data: { ativo: false },
    });

    await this.audit.log({
      usuarioId: 'user-id-from-context',
      usuarioNome: 'Nome do usuário',
      usuarioEmail: 'email@exemplo.com',
      entidade: '{entidade}',
      entidadeId: id,
      acao: 'DELETE',
      dadosAntes: before,
      dadosDepois: after,
    });

    return after;
  }

  async hardDelete(id: string) {
    const before = await this.findById(id);

    await this.prisma.{entidade}.delete({
      where: { id },
    });

    await this.audit.log({
      usuarioId: 'user-id-from-context',
      usuarioNome: 'Nome do usuário',
      usuarioEmail: 'email@exemplo.com',
      entidade: '{entidade}',
      entidadeId: id,
      acao: 'HARD_DELETE',
      dadosAntes: before,
    });

    return { message: '{Entidade} deletado permanentemente' };
  }
}
```

---

### 4. Module

**Template:** `/backend/src/modules/{nome-modulo}/{nome-modulo}.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { {Entidade}Service } from './{nome-modulo}.service';
import { {Entidade}Controller } from './{nome-modulo}.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [{Entidade}Controller],
  providers: [{Entidade}Service],
  exports: [{Entidade}Service],
})
export class {Entidade}Module {}
```

---

## 🎨 Frontend (Angular)

### 1. Service

**Template:** `/frontend/src/app/core/services/{nome-entidade}.service.ts`

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface {Entidade} {
  id: string;
  campo1: string;
  campo2: string;
  ativo: boolean;
  relacionamentoId?: string;
  relacionamento?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create{Entidade}Request {
  campo1: string;
  campo2: string;
  relacionamentoId: string;
}

export interface Update{Entidade}Request {
  campo1?: string;
  campo2?: string;
  ativo?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class {Entidade}Service {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/{nome-modulo}`;

  getAll(): Observable<{Entidade}[]> {
    return this.http.get<{Entidade}[]>(this.API_URL);
  }

  getById(id: string): Observable<{Entidade}> {
    return this.http.get<{Entidade}>(`${this.API_URL}/${id}`);
  }

  create(data: Create{Entidade}Request): Observable<{Entidade}> {
    return this.http.post<{Entidade}>(this.API_URL, data);
  }

  update(id: string, data: Update{Entidade}Request): Observable<{Entidade}> {
    return this.http.patch<{Entidade}>(`${this.API_URL}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  inactivate(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}/inativar`, {});
  }

  activate(id: string): Observable<any> {
    return this.http.patch(`${this.API_URL}/${id}`, { ativo: true });
  }
}
```

---

### 2. Routes

**Template:** `/frontend/src/app/views/pages/{nome-modulo}/{nome-modulo}.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { {Entidade}ListComponent } from './{nome-modulo}-list/{nome-modulo}-list.component';
import { {Entidade}FormComponent } from './{nome-modulo}-form/{nome-modulo}-form.component';

export const {ENTIDADE}_ROUTES: Routes = [
  {
    path: '',
    component: {Entidade}ListComponent,
  },
  {
    path: 'criar',
    component: {Entidade}FormComponent,
  },
  {
    path: 'editar/:id',
    component: {Entidade}FormComponent,
  },
];
```

---

### 3. List Component

**Template:** `/frontend/src/app/views/pages/{nome-modulo}/{nome-modulo}-list/{nome-modulo}-list.component.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { {Entidade}Service, {Entidade} } from '../../../../core/services/{nome-entidade}.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { SortableDirective, SortEvent } from '../../../../shared/directives/sortable.directive';

@Component({
  selector: 'app-{nome-modulo}-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslatePipe,
    NgbPaginationModule,
    SortableDirective,
  ],
  templateUrl: './{nome-modulo}-list.component.html',
  styleUrl: './{nome-modulo}-list.component.scss'
})
export class {Entidade}ListComponent implements OnInit {
  private service = inject({Entidade}Service);
  private offcanvas = inject(NgbOffcanvas);

  registros: {Entidade}[] = [];
  filteredRegistros: {Entidade}[] = [];
  searchQuery = '';
  loading = false;
  error = '';

  // Seleção múltipla
  selectedIds: Set<string> = new Set();
  headerCheckboxChecked = false;

  // Ordenação
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Paginação
  currentPage = 1;
  pageSize = 10;

  // Offcanvas de detalhes
  selectedRegistro: {Entidade} | null = null;
  loadingDetails = false;

  ngOnInit(): void {
    this.loadRegistros();
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      title,
      icon,
    });
  }

  loadRegistros(): void {
    this.loading = true;
    this.error = '';
    this.service.getAll().subscribe({
      next: (data) => {
        this.registros = data;
        this.filterRegistros();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Erro ao carregar registros';
        this.loading = false;
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.filterRegistros();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.onSearch(input.value);
  }

  filterRegistros(): void {
    if (!this.searchQuery.trim()) {
      this.filteredRegistros = [...this.registros];
    } else {
      const query = this.searchQuery.toLowerCase();
      this.filteredRegistros = this.registros.filter(r =>
        r.campo1.toLowerCase().includes(query) ||
        r.campo2.toLowerCase().includes(query)
      );
    }
    
    if (this.sortColumn) {
      this.applySorting();
    }
  }

  onSort(event: SortEvent): void {
    const column = event.column;
    
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = event.direction as 'asc' | 'desc';
    }
    
    this.applySorting();
  }

  private applySorting(): void {
    if (!this.sortColumn) return;

    this.filteredRegistros.sort((a, b) => {
      let valueA: any = (a as any)[this.sortColumn];
      let valueB: any = (b as any)[this.sortColumn];

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  deleteRegistro(id: string, nome: string): void {
    Swal.fire({
      title: '<strong>Deletar Registro</strong>',
      html: `Tem certeza que deseja deletar <strong>${nome}</strong>?<br><strong class="text-danger">Esta ação não pode ser desfeita!</strong>`,
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: '<i class="feather icon-trash-2"></i> Deletar',
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.confirmDelete(id);
    });
  }

  private confirmDelete(id: string): void {
    this.loading = true;
    this.service.delete(id).subscribe({
      next: () => {
        this.registros = this.registros.filter(r => r.id !== id);
        this.filterRegistros();
        this.showToast('Registro deletado com sucesso!', 'success');
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao deletar registro', 'error');
        this.loading = false;
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.filteredRegistros.length / this.pageSize);
  }

  get paginatedRegistros(): {Entidade}[] {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredRegistros.slice(start, end);
  }

  // ===== SELEÇÃO MÚLTIPLA =====

  toggleSelectAll(): void {
    this.headerCheckboxChecked = !this.headerCheckboxChecked;
    
    if (this.headerCheckboxChecked) {
      this.paginatedRegistros.forEach(r => this.selectedIds.add(r.id));
    } else {
      this.paginatedRegistros.forEach(r => this.selectedIds.delete(r.id));
    }
  }

  toggleSelect(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
    
    this.updateHeaderCheckbox();
  }

  private updateHeaderCheckbox(): void {
    const currentPageIds = this.paginatedRegistros.map(r => r.id);
    const allSelected = currentPageIds.every(id => this.selectedIds.has(id));
    this.headerCheckboxChecked = allSelected && currentPageIds.length > 0;
  }

  deleteSelected(): void {
    const count = this.selectedIds.size;
    if (count === 0) return;

    Swal.fire({
      title: '<strong>Deletar Registros Selecionados</strong>',
      html: `Tem certeza que deseja deletar <strong>${count} registro(s)</strong>?<br><strong class="text-danger">Esta ação não pode ser desfeita!</strong>`,
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: `<i class="feather icon-trash-2"></i> Deletar ${count}`,
      cancelButtonText: '<i class="feather icon-x"></i> Cancelar',
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmDeleteBatch();
      }
    });
  }

  private confirmDeleteBatch(): void {
    this.loading = true;
    const ids = Array.from(this.selectedIds);
    let completed = 0;
    let errors = 0;

    ids.forEach(id => {
      this.service.delete(id).subscribe({
        next: () => {
          completed++;
          this.registros = this.registros.filter(r => r.id !== id);
          
          if (completed + errors === ids.length) {
            this.finalizeBatchDelete(completed, errors);
          }
        },
        error: () => {
          errors++;
          if (completed + errors === ids.length) {
            this.finalizeBatchDelete(completed, errors);
          }
        }
      });
    });
  }

  private finalizeBatchDelete(completed: number, errors: number): void {
    this.selectedIds.clear();
    this.headerCheckboxChecked = false;
    this.filterRegistros();
    this.loading = false;

    if (errors > 0) {
      this.showToast(`${completed} deletados, ${errors} erro(s)`, 'warning');
    } else {
      this.showToast(`${completed} registro(s) deletado(s) com sucesso!`, 'success');
    }
  }

  // ===== DETALHES (OFFCANVAS) =====
  openDetailsOffcanvas(id: string, content: TemplateRef<any>): void {
    this.loadingDetails = true;
    this.selectedRegistro = null;
    this.offcanvas.open(content, { position: 'end' });

    this.service.getById(id).subscribe({
      next: (registro) => {
        this.selectedRegistro = registro;
        this.loadingDetails = false;
      },
      error: () => {
        this.loadingDetails = false;
        this.showToast('Erro ao carregar detalhes', 'error');
      }
    });
  }
}
```

**Funcionalidades principais:**
- ✅ Listagem com paginação
- ✅ Busca/filtro
- ✅ Ordenação de colunas
- ✅ Seleção múltipla com checkbox
- ✅ Delete em lote
- ✅ Offcanvas com detalhes do registro
- ✅ Toast notifications
- ✅ Loading states

---

### 4. Form Component

**Template:** `/frontend/src/app/views/pages/{nome-modulo}/{nome-modulo}-form/{nome-modulo}-form.component.ts`

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { {Entidade}Service, {Entidade}, Create{Entidade}Request, Update{Entidade}Request } from '../../../../core/services/{nome-entidade}.service';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { NgSelectModule } from '@ng-select/ng-select';

@Component({
  selector: 'app-{nome-modulo}-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    RouterLink, 
    TranslatePipe,
    NgSelectModule
  ],
  templateUrl: './{nome-modulo}-form.component.html',
  styleUrl: './{nome-modulo}-form.component.scss'
})
export class {Entidade}FormComponent implements OnInit {
  private service = inject({Entidade}Service);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    campo1: ['', [Validators.required, Validators.minLength(2)]],
    campo2: ['', [Validators.required]],
    relacionamentoId: ['', Validators.required],
    ativo: [true]
  });

  isEditMode = false;
  registroId: string | null = null;
  loading = false;

  ngOnInit(): void {
    this.registroId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.registroId;

    if (this.isEditMode && this.registroId) {
      this.loadRegistro(this.registroId);
    }
  }

  private showToast(title: string, icon: 'success' | 'error' | 'info' | 'warning', timer: number = 3000): void {
    Swal.fire({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      title,
      icon,
    });
  }

  loadRegistro(id: string): void {
    this.loading = true;
    this.service.getById(id).subscribe({
      next: (registro) => {
        this.form.patchValue({
          campo1: registro.campo1,
          campo2: registro.campo2,
          relacionamentoId: registro.relacionamentoId,
          ativo: registro.ativo
        });
        this.loading = false;
      },
      error: (err) => {
        this.showToast(err?.error?.message || 'Erro ao carregar registro', 'error');
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.form.value;

    if (this.isEditMode && this.registroId) {
      const updateData: Update{Entidade}Request = {
        campo1: formValue.campo1 || '',
        campo2: formValue.campo2 || '',
        ativo: formValue.ativo || true
      };

      this.service.update(this.registroId, updateData).subscribe({
        next: () => {
          this.showToast('Registro atualizado com sucesso!', 'success');
          this.loading = false;
          setTimeout(() => this.router.navigate(['/{nome-modulo}']), 2000);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao atualizar registro', 'error');
          this.loading = false;
        }
      });
    } else {
      const createData: Create{Entidade}Request = {
        campo1: formValue.campo1 || '',
        campo2: formValue.campo2 || '',
        relacionamentoId: formValue.relacionamentoId || ''
      };

      this.service.create(createData).subscribe({
        next: () => {
          this.showToast('Registro criado com sucesso!', 'success');
          this.loading = false;
          setTimeout(() => this.router.navigate(['/{nome-modulo}']), 2000);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Erro ao criar registro', 'error');
          this.loading = false;
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.form.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.hasError('required')) return `${fieldName} é obrigatório`;
    if (field.hasError('minlength')) {
      const minLength = field.getError('minlength').requiredLength;
      return `${fieldName} deve ter no mínimo ${minLength} caracteres`;
    }
    if (field.hasError('email')) return 'Email inválido';

    return 'Campo inválido';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }
}
```

**Funcionalidades principais:**
- ✅ Modo criação/edição
- ✅ Validação de formulário
- ✅ Mensagens de erro customizadas
- ✅ Toast notifications
- ✅ Loading states
- ✅ Redirecionamento após sucesso

---

### 5. List HTML Template

**Estrutura básica do HTML de listagem:**

```html
<div class="row">
  <div class="col-md-12 grid-margin stretch-card">
    <div class="card">
      <!-- Header com título e botão criar -->
      <div class="card-header d-flex justify-content-between align-items-center">
        <h6 class="card-title mb-0">{{ "MENU.{ENTIDADE}" | translate }}</h6>
        <a [routerLink]="['criar']" class="btn btn-primary btn-sm">
          <i data-feather="plus" class="icon-sm me-1"></i>
          {{ "BUTTONS.CREATE" | translate }}
        </a>
      </div>

      <div class="card-body">
        <!-- Barra de busca e ações em lote -->
        <div class="row mb-3">
          <div class="col-md-8">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Buscar..."
              (input)="onSearchInput($event)"
              [(ngModel)]="searchQuery"
            />
          </div>
          <div class="col-md-4 text-end">
            @if (selectedIds.size > 0) {
            <button class="btn btn-danger btn-sm" (click)="deleteSelected()">
              <i data-feather="trash-2" class="icon-sm me-1"></i>
              Deletar ({{ selectedIds.size }})
            </button>
            }
          </div>
        </div>

        <!-- Loading State -->
        @if (loading) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Carregando...</span>
          </div>
        </div>
        }

        <!-- Error State -->
        @if (error && !loading) {
        <div class="alert alert-danger">{{ error }}</div>
        }

        <!-- Tabela -->
        @if (!loading && !error) {
        <div class="table-responsive">
          <table class="table table-hover">
            <thead>
              <tr>
                <th style="width: 40px;">
                  <input 
                    type="checkbox" 
                    [checked]="headerCheckboxChecked"
                    (change)="toggleSelectAll()"
                  />
                </th>
                <th appSortable="campo1" (sort)="onSort($event)">Campo 1</th>
                <th appSortable="campo2" (sort)="onSort($event)">Campo 2</th>
                <th>Status</th>
                <th style="width: 120px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (registro of paginatedRegistros; track registro.id) {
              <tr>
                <td>
                  <input 
                    type="checkbox"
                    [checked]="selectedIds.has(registro.id)"
                    (change)="toggleSelect(registro.id)"
                  />
                </td>
                <td>{{ registro.campo1 }}</td>
                <td>{{ registro.campo2 }}</td>
                <td>
                  @if (registro.ativo) {
                  <span class="badge bg-success">Ativo</span>
                  } @else {
                  <span class="badge bg-danger">Inativo</span>
                  }
                </td>
                <td>
                  <a [routerLink]="['editar', registro.id]" class="btn btn-sm btn-primary me-1">
                    <i data-feather="edit" class="icon-sm"></i>
                  </a>
                  <button class="btn btn-sm btn-danger" (click)="deleteRegistro(registro.id, registro.campo1)">
                    <i data-feather="trash-2" class="icon-sm"></i>
                  </button>
                </td>
              </tr>
              } @empty {
              <tr>
                <td colspan="5" class="text-center">Nenhum registro encontrado</td>
              </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Paginação -->
        @if (filteredRegistros.length > pageSize) {
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div>
            Mostrando {{ (currentPage - 1) * pageSize + 1 }} a 
            {{ Math.min(currentPage * pageSize, filteredRegistros.length) }} de 
            {{ filteredRegistros.length }} registros
          </div>

  <!-- Offcanvas de Detalhes -->
  <ng-template #detailsOffcanvas let-offcanvas>
    <div class="offcanvas-header">
      <h5 class="offcanvas-title">{{ 'COMMON.DETAILS' | translate }}</h5>
      <button type="button" class="btn-close text-reset" (click)="offcanvas.dismiss()"></button>
    </div>
    <div class="offcanvas-body">
      @if (loadingDetails) {
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">{{ 'COMMON.LOADING' | translate }}...</span>
          </div>
        </div>
      } @else if (selectedRegistro) {
        <div class="mb-3">
          <h6 class="card-title mb-2">{{ selectedRegistro.campo1 }}</h6>
          <p class="text-muted mb-0">{{ selectedRegistro.campo2 }}</p>
          <span class="badge" [ngClass]="{ 'bg-success': selectedRegistro.ativo, 'bg-danger': !selectedRegistro.ativo }">
            {{ selectedRegistro.ativo ? ('COMMON.ACTIVE' | translate) : ('COMMON.INACTIVE' | translate) }}
          </span>
        </div>

        <div class="d-grid gap-2">
          <button type="button" class="btn btn-primary" [routerLink]="['/{nome-modulo}', selectedRegistro.id, 'editar']" (click)="offcanvas.dismiss()">
            <i class="feather icon-edit"></i> {{ 'BUTTONS.EDIT' | translate }}
          </button>
          <!-- Exemplo de ação adicional: inativar/ativar -->
          <!--
          <button type="button" class="btn btn-outline-secondary" (click)="toggleStatus(selectedRegistro.id); offcanvas.dismiss()">
            <i class="feather icon-toggle-right"></i>
            {{ selectedRegistro.ativo ? ('COMMON.DEACTIVATE' | translate) : ('COMMON.ACTIVATE' | translate) }}
          </button>
          -->
        </div>
      }
    </div>
  </ng-template>
          <ngb-pagination
            [(page)]="currentPage"
            [pageSize]="pageSize"
            [collectionSize]="filteredRegistros.length"
            [maxSize]="5"
            [boundaryLinks]="true"
          ></ngb-pagination>
        </div>
        }
        }
      </div>
    </div>
  </div>
</div>
```

---

### 6. Form HTML Template

**Estrutura básica do HTML de formulário:**

```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb breadcrumb-dot mb-1">
    <li class="breadcrumb-item">
      <i class="input-icon" data-feather="icon-name"></i>
    </li>
    <li class="breadcrumb-item">
      <a routerLink="/{nome-modulo}">{{ "MENU.{ENTIDADE}" | translate }}</a>
    </li>
    <li class="breadcrumb-item active">
      @if (isEditMode) {
        {{ "COMMON.EDIT" | translate }}
      } @else {
        {{ "COMMON.CREATE" | translate }}
      }
    </li>
  </ol>
</nav>

<div class="card">
  <div class="card-body">
    @if (loading && isEditMode) {
    <div class="text-center py-5">
      <div class="spinner-border text-primary"></div>
    </div>
    } @else {
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <!-- Campo de texto -->
      <div class="mb-3">
        <label class="form-label" for="campo1">
          Campo 1 <span class="text-danger">*</span>
        </label>
        <input 
          type="text" 
          class="form-control" 
          [class.is-invalid]="isFieldInvalid('campo1')"
          id="campo1" 
          formControlName="campo1" 
        />
        @if (isFieldInvalid('campo1')) {
        <div class="invalid-feedback d-block">
          {{ getFieldError("campo1") }}
        </div>
        }
      </div>

      <!-- Select com ng-select -->
      <div class="mb-3">
        <label class="form-label" for="relacionamentoId">
          Relacionamento <span class="text-danger">*</span>
        </label>
        <ng-select
          [items]="opcoes"
          bindLabel="nome"
          bindValue="id"
          placeholder="Selecione..."
          formControlName="relacionamentoId"
          [class.is-invalid]="isFieldInvalid('relacionamentoId')"
        ></ng-select>
        @if (isFieldInvalid('relacionamentoId')) {
        <div class="invalid-feedback d-block">
          {{ getFieldError("relacionamentoId") }}
        </div>
        }
      </div>

      <!-- Checkbox -->
      <div class="mb-3">
        <div class="form-check">
          <input 
            type="checkbox" 
            class="form-check-input" 
            id="ativo" 
            formControlName="ativo" 
          />
          <label class="form-check-label" for="ativo">
            {{ "COMMON.ACTIVE" | translate }}
          </label>
        </div>
      </div>

      <!-- Botões -->
      <div class="form-footer mt-4 d-flex justify-content-end gap-2">
        <a [routerLink]="['/{nome-modulo}']" class="btn btn-link">
          {{ "BUTTONS.CANCEL" | translate }}
        </a>
        <button type="submit" class="btn btn-primary" [disabled]="loading || form.invalid">
          @if (loading) {
          <span class="spinner-border spinner-border-sm me-2"></span>
          }
          @if (isEditMode) {
            {{ "BUTTONS.UPDATE" | translate }}
          } @else {
            {{ "BUTTONS.CREATE" | translate }}
          }
        </button>
      </div>
    </form>
    }
  </div>
</div>
```

---

## ✅ Checklist de Implementação

### Backend

- [ ] Criar schema Prisma para a entidade
- [ ] Rodar migration: `npm run migration:dev`
- [ ] Criar módulo: `nest g module modules/{nome-modulo}`
- [ ] Criar DTOs: `create-{entidade}.dto.ts` e `update-{entidade}.dto.ts`
- [ ] Criar service: `{nome-modulo}.service.ts`
- [ ] Criar controller: `{nome-modulo}.controller.ts`
- [ ] Adicionar decorators de validação nos DTOs
- [ ] Implementar métodos CRUD no service
- [ ] Adicionar logs de auditoria
- [ ] Configurar guards e roles no controller
- [ ] Documentar com Swagger (@ApiTags, @ApiOperation)
- [ ] Registrar módulo no `app.module.ts`
- [ ] Testar endpoints com Postman/Insomnia

### Frontend

- [ ] Criar service: `{nome-entidade}.service.ts`
- [ ] Definir interfaces/tipos TypeScript
- [ ] Criar componente list: `{nome-modulo}-list.component.ts`
- [ ] Criar template list: `{nome-modulo}-list.component.html`
- [ ] Criar componente form: `{nome-modulo}-form.component.ts`
- [ ] Criar template form: `{nome-modulo}-form.component.html`
- [ ] Selects: usar `ng-select` (NgSelectModule) sempre, nunca `<select>` nativo
- [ ] Configurar rotas: `{nome-modulo}.routes.ts`
- [ ] Adicionar traduções em `i18n/pt-BR.json` e `i18n/en-US.json`
- [ ] Implementar busca/filtro
- [ ] Implementar ordenação de colunas
- [ ] Implementar paginação
- [ ] Implementar seleção múltipla
- [ ] Implementar delete em lote
- [ ] Testar criação, edição, listagem e exclusão

### Internacionalização (i18n)

Adicionar traduções em `/frontend/src/assets/i18n/`:

**pt-BR.json:**
```json
{
  "MENU": {
    "{ENTIDADE}": "Nome do Módulo"
  },
  "{ENTIDADE}": {
    "TITLE": "Título",
    "FIELD1": "Campo 1",
    "FIELD2": "Campo 2"
  }
}
```

---

## 📝 Convenções de Nomenclatura

### Backend
- **Arquivos**: kebab-case (`create-usuario.dto.ts`)
- **Classes**: PascalCase (`CreateUsuarioDto`)
- **Métodos**: camelCase (`findById()`)
- **Rotas**: kebab-case (`/usuarios`)

### Frontend
- **Arquivos**: kebab-case (`usuarios-list.component.ts`)
- **Componentes**: PascalCase (`UsuariosListComponent`)
- **Variáveis**: camelCase (`isEditMode`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)
- **Rotas**: kebab-case (`/usuarios/criar`)

### Banco de Dados (Prisma)
- **Tabelas**: PascalCase singular (`Usuario`)
- **Colunas**: camelCase (`createdAt`)
- **Enums**: UPPER_SNAKE_CASE (`ADMINISTRADOR`)

---

## 🎯 Padrões de UX/UI

1. **Toast Notifications**: Usar SweetAlert2 para feedback
2. **Loading States**: Spinner durante carregamento
3. **Confirmações**: Modal para ações destrutivas (delete)
4. **Validações**: Feedback visual em tempo real
5. **Breadcrumbs**: Navegação contextual
6. **Paginação**: Máximo 10 itens por página (padrão)
7. **Ordenação**: Click no header da coluna
8. **Busca**: Filtro em tempo real (debounce 300ms)

---

## 🔒 Segurança

1. **Autenticação**: JWT obrigatório em todos os endpoints
2. **Autorização**: RBAC com guards no backend
3. **Validação**: DTOs com class-validator
4. **Sanitização**: Nunca confiar em dados do frontend
5. **Auditoria**: Log de todas as operações
6. **LGPD**: Anonimização de dados sensíveis

---

## 📚 Referências

- **Módulo de Referência**: `/backend/src/modules/usuarios/`
- **Frontend de Referência**: `/frontend/src/app/views/pages/usuarios/`
- **Planilhas de Negócio**: `/planilhas/`
- **Contexto Completo**: `CONTEXT.md`
- **Design System**: `DESIGN_SYSTEM_FINAL.md`

---

## 🚀 Próximos Passos

Ao criar um novo CRUD, siga esta ordem:

1. Definir modelo de dados (Prisma schema)
2. Criar backend (DTOs → Service → Controller → Module)
3. Testar backend (Postman/Insomnia)
4. Criar frontend (Service → Components → Routes)
5. Adicionar traduções (i18n)
6. Testar frontend (navegação completa)
7. Revisar logs de auditoria
8. Documentar particularidades específicas

---

**Última Atualização**: 16/12/2024  
**Baseado em**: Módulo de Usuários (v1.0)
