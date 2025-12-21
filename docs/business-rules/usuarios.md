# Regras de Negócio do Módulo Usuarios

> **Documento gerado por:** Extractor de Regras  
> **Data:** 21/12/2024  
> **Escopo:** Backend (`backend/src/modules/usuarios`) e Frontend (`frontend/src/app/views/pages/usuarios`)

---

## 1. Visão Geral do Módulo

O módulo **Usuarios** gerencia o cadastro, autenticação, permissões e perfil de usuários do sistema. Usuários podem estar associados a empresas ou permanecer disponíveis para associação futura.

### Responsabilidades Implementadas
- CRUD completo de usuários
- Upload e gerenciamento de foto de perfil
- Ativação/inativação de usuários
- Associação de usuários com empresas
- Associação de usuários com perfis de acesso
- Auditoria automática de operações

---

## 2. Entidades Envolvidas

### 2.1. Usuario (Entidade Principal)

**Schema Prisma:**
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
  
  perfilId  String
  perfil    PerfilUsuario @relation(fields: [perfilId], references: [id])
  
  empresaId String?
  empresa   Empresa? @relation(fields: [empresaId], references: [id])
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
}
```

**Campos obrigatórios:**
- `id`: UUID gerado automaticamente
- `email`: único no sistema
- `nome`: nome completo
- `senha`: hash argon2
- `cargo`: cargo/função do usuário
- `perfilId`: perfil de acesso obrigatório

**Campos opcionais:**
- `telefone`: telefone de contato
- `fotoUrl`: URL da foto de perfil
- `empresaId`: ID da empresa associada (pode ser null)

**Relações:**
- `perfil`: N:1 com PerfilUsuario (obrigatório)
- `empresa`: N:1 com Empresa (opcional)
- `reunioes`: 1:N com AgendaReuniao
- `passwordResets`: 1:N com PasswordReset
- `loginHistory`: 1:N com LoginHistory

---

## 3. Regras de Negócio Implementadas

### RN-001: Unicidade de Email
**Implementação:** `usuarios.service.ts` linha 124
```typescript
const existingUser = await this.findByEmail(data.email);
if (existingUser) {
  throw new ConflictException('Email já cadastrado');
}
```

**Descrição:**  
Não é permitido criar usuários com e-mail duplicado. O sistema verifica antes de criar.

---

### RN-002: Hash de Senha com Argon2
**Implementação:** `usuarios.service.ts` linhas 129, 182
```typescript
const hashedPassword = await argon2.hash(data.senha);
```

**Descrição:**  
Todas as senhas são armazenadas como hash argon2. Nunca em texto plano.

---

### RN-003: Redação de Senha em Logs de Auditoria
**Implementação:** `usuarios.service.ts` linhas 161, 219, 241, 268
```typescript
dadosDepois: { ...created, senha: '[REDACTED]' }
```

**Descrição:**  
A auditoria nunca registra a senha real. Sempre substitui por `[REDACTED]`.

---

### RN-004: Usuários Disponíveis para Associação
**Implementação:** `usuarios.service.ts` linhas 46-66
```typescript
async findDisponiveis() {
  return this.prisma.usuario.findMany({
    where: {
      empresaId: null,
      ativo: true,
    },
    ...
  });
}
```

**Descrição:**  
Usuários sem `empresaId` e com `ativo = true` são considerados disponíveis para associação a empresas.

---

### RN-005: Soft Delete (Inativação)
**Implementação:** `usuarios.service.ts` linhas 223-244
```typescript
async remove(id: string) {
  const after = await this.prisma.usuario.update({
    where: { id },
    data: { ativo: false },
  });
  ...
}
```

**Descrição:**  
A operação "remove" (inativar) apenas define `ativo = false`. Não deleta o registro.

---

### RN-006: Hard Delete com Remoção de Arquivo
**Implementação:** `usuarios.service.ts` linhas 246-269
```typescript
async hardDelete(id: string) {
  const usuario = await this.findById(id);
  if (usuario.fotoUrl) {
    const filePath = this.getAbsolutePublicPath(usuario.fotoUrl);
    this.deleteFileIfExists(filePath);
  }
  ...
  return this.prisma.usuario.delete({ where: { id } });
}
```

**Descrição:**  
A exclusão permanente remove o registro do banco E deleta o arquivo de foto do disco.

---

### RN-007: Substituição de Foto de Perfil
**Implementação:** `usuarios.service.ts` linhas 271-292
```typescript
async updateProfilePhoto(id: string, fotoUrl: string) {
  const usuario = await this.findById(id);
  if (usuario.fotoUrl && usuario.fotoUrl !== fotoUrl) {
    const oldFilePath = this.getAbsolutePublicPath(usuario.fotoUrl);
    this.deleteFileIfExists(oldFilePath);
  }
  ...
}
```

**Descrição:**  
Ao fazer upload de nova foto, o sistema deleta a foto anterior do disco para evitar acúmulo.

---

### RN-008: Exclusão de Foto de Perfil
**Implementação:** `usuarios.service.ts` linhas 294-318
```typescript
async deleteProfilePhoto(id: string) {
  const usuario = await this.findById(id);
  if (usuario.fotoUrl) {
    const filePath = this.getAbsolutePublicPath(usuario.fotoUrl);
    this.deleteFileIfExists(filePath);
  }
  return this.prisma.usuario.update({
    where: { id },
    data: { fotoUrl: null },
  });
}
```

**Descrição:**  
Ao deletar a foto, o sistema remove o arquivo físico e define `fotoUrl = null`.

---

## 4. Restrições e Validações

### 4.1. Validações de DTO (CreateUsuarioDto)

**Arquivo:** `dto/create-usuario.dto.ts`

| Campo | Validações |
|-------|------------|
| `email` | `@IsEmail`, `@IsNotEmpty` |
| `nome` | `@IsString`, `@IsNotEmpty`, `@Length(2, 100)` |
| `senha` | `@IsString`, `@IsNotEmpty`, `@MinLength(6)` |
| `cargo` | `@IsString`, `@IsNotEmpty`, `@Length(2, 100)` |
| `telefone` | `@IsString`, `@IsOptional` |
| `perfilId` | `@IsUUID`, `@IsNotEmpty` |
| `empresaId` | `@IsUUID`, `@IsOptional` |

**Regras:**
- Nome e cargo: entre 2 e 100 caracteres
- Senha: mínimo 6 caracteres
- Email: formato válido obrigatório
- PerfilId: obrigatório (UUID válido)
- EmpresaId: opcional (UUID válido)

---

### 4.2. Validações de DTO (UpdateUsuarioDto)

**Arquivo:** `dto/update-usuario.dto.ts`

```typescript
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}
```

**Regras:**
- Todos os campos são opcionais (herda de `PartialType`)
- Campo adicional: `ativo` (booleano opcional)

---

### 4.3. Validações de Upload de Foto

**Arquivo:** `usuarios.controller.ts` linhas 100-118

```typescript
fileFilter: (req, file, cb) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
    cb(new BadRequestException('Apenas imagens JPG, PNG ou WebP são permitidas'), false);
  } else {
    cb(null, true);
  }
},
limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
```

**Regras:**
- Formatos permitidos: JPG, JPEG, PNG, WebP
- Tamanho máximo: 5MB
- Diretório de destino: `public/images/faces`
- Nome gerado: 32 caracteres hexadecimais aleatórios + extensão original

---

### 4.4. Validações Frontend (Form)

**Arquivo:** `usuarios-form.component.ts` linhas 46-54

```typescript
form = this.fb.group({
  nome: ['', [Validators.required, Validators.minLength(2)]],
  telefone: [''],
  email: ['', [Validators.required, Validators.email]],
  cargo: ['', []],
  perfilId: ['', Validators.required],
  empresaId: [''],
  senha: ['', []],
  ativo: [true]
});
```

**Regras dinâmicas:**
- Senha obrigatória na criação (`Validators.required + MinLength(6)`)
- Senha opcional na edição (`MinLength(6)`)

**Máscara de telefone:** Aplicada automaticamente no frontend (método `applyPhoneMask`)
- Telefone fixo: `(11) 3333-4444`
- Celular: `(11) 98765-4321`

---

## 5. Comportamentos Condicionais

### BC-001: Senha Opcional em Atualização
**Implementação:** `usuarios-form.component.ts` linhas 126-130, 240-245

```typescript
if (this.isEditMode && this.usuarioId) {
  this.form.get('senha')?.setValidators([Validators.minLength(6)]);
} else {
  this.form.get('senha')?.setValidators([Validators.required, Validators.minLength(6)]);
}
```

**Backend:** `usuarios-form.component.ts` linhas 240-243
```typescript
if (formValue.senha && formValue.senha.trim()) {
  updateData.senha = formValue.senha;
}
```

**Descrição:**  
Na criação, senha é obrigatória. Na edição, senha só é atualizada se for fornecida.

---

### BC-002: Perfil Padrão na Criação
**Implementação:** `usuarios-form.component.ts` linhas 149-158

```typescript
if (!this.isEditMode && perfis.length > 0) {
  const colaborador = perfis.find(p => p.codigo === 'COLABORADOR');
  if (colaborador) {
    this.form.patchValue({ perfilId: colaborador.id });
  }
}
```

**Descrição:**  
Ao criar novo usuário, o perfil `COLABORADOR` é pré-selecionado se existir.

---

### BC-003: Bloqueio de Campo Empresa para Perfis Cliente
**Implementação:** `usuarios-form.component.ts` linhas 82-86

```typescript
get shouldDisableEmpresaField(): boolean {
  return this.isPerfilCliente && this.isEditingOwnUser;
}
```

**Descrição:**  
Perfis de cliente (GESTOR, COLABORADOR, LEITURA) não podem alterar sua própria empresa ao editar seus dados.

---

### BC-004: Redirecionamento Condicional
**Implementação:** `usuarios-form.component.ts` linhas 93-96

```typescript
private getRedirectUrl(): string {
  return this.isPerfilCliente ? '/dashboard' : '/usuarios';
}
```

**Descrição:**  
Após salvar, perfis de cliente vão para `/dashboard`, administradores vão para `/usuarios`.

---

### BC-005: Upload de Avatar Imediato vs. Diferido
**Implementação:** `usuarios-form.component.ts` linhas 370-379

```typescript
if (this.isEditMode && this.usuarioId) {
  this.uploadAvatar(file);
} else {
  this.avatarFile = file;
  this.showToast('Avatar será enviado quando você criar o usuário', 'info');
}
```

**Descrição:**
- **Modo edição:** upload imediato
- **Modo criação:** armazena em memória e faz upload após criar usuário

---

### BC-006: Cache Buster para Fotos
**Implementação:** `usuarios-form.component.ts` linhas 168-172

```typescript
private withCacheBuster(url: string | null): string | null {
  if (!url) return null;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}cb=${Date.now()}`;
}
```

**Descrição:**  
Adiciona timestamp às URLs de foto para forçar atualização do cache do navegador.

---

### BC-007: Atualização do Usuário Logado após Upload
**Implementação:** `usuarios-form.component.ts` linhas 398-405

```typescript
const currentUser = this.authService.getCurrentUser();
if (currentUser && currentUser.id === idToUse) {
  this.authService.updateCurrentUser({
    ...currentUser,
    fotoUrl: refreshedUrl
  });
}
```

**Descrição:**  
Se o usuário editado for o próprio usuário logado, atualiza sua foto no contexto global.

---

### BC-008: Filtro de Busca Multi-Campo
**Implementação:** `usuarios-list.component.ts` linhas 94-105

```typescript
filterUsuarios(): void {
  if (!this.searchQuery.trim()) {
    this.filteredUsuarios = [...this.usuarios];
  } else {
    const query = this.searchQuery.toLowerCase();
    this.filteredUsuarios = this.usuarios.filter(u =>
      u.nome.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.cargo?.toLowerCase().includes(query)
    );
  }
}
```

**Descrição:**  
A busca pesquisa simultaneamente em nome, email e cargo.

---

### BC-009: Ordenação de Colunas
**Implementação:** `usuarios-list.component.ts` linhas 113-149

**Descrição:**  
Colunas `name` e `email` podem ser ordenadas ASC/DESC. Clicar novamente inverte a ordem.

---

### BC-010: Seleção Multi-Item e Delete em Lote
**Implementação:** `usuarios-list.component.ts` linhas 338-390

**Descrição:**  
Checkbox no cabeçalho marca/desmarca todos da página atual. Delete em lote exclui múltiplos usuários.

---

## 6. Controle de Acesso (RBAC)

### 6.1. Perfis Implementados no Sistema

Baseado no schema Prisma e uso no código:

| Código | Nome | Nível | Descrição |
|--------|------|-------|-----------|
| ADMINISTRADOR | Administrador | 1 | Acesso total ao sistema |
| CONSULTOR | Consultor | 2 | (Removido do código atual) |
| GESTOR | Gestor | 3 | Gestor de empresa |
| COLABORADOR | Colaborador | 4 | Colaborador de empresa |
| LEITURA | Leitura | 5 | Acesso somente leitura |

---

### 6.2. Permissões por Endpoint (Backend)

**Arquivo:** `usuarios.controller.ts`

| Endpoint | Método | Perfis Autorizados |
|----------|--------|-------------------|
| `POST /usuarios` | Criar usuário | ADMINISTRADOR |
| `GET /usuarios` | Listar todos | ADMINISTRADOR |
| `GET /usuarios/disponiveis/empresa` | Listar disponíveis | ADMINISTRADOR |
| `GET /usuarios/:id` | Buscar por ID | Todos os perfis |
| `PATCH /usuarios/:id` | Atualizar | ADMINISTRADOR, GESTOR, COLABORADOR |
| `DELETE /usuarios/:id` | Deletar (hard) | ADMINISTRADOR |
| `PATCH /usuarios/:id/inativar` | Inativar (soft) | ADMINISTRADOR |
| `POST /usuarios/:id/foto` | Upload de foto | Sem restrição explícita* |
| `DELETE /usuarios/:id/foto` | Deletar foto | Sem restrição explícita* |

**Observação:** Endpoints de foto não têm decorator `@Roles`, portanto qualquer usuário autenticado pode fazer upload/delete.

---

### 6.3. Controle de Acesso Frontend

**Arquivo:** `usuarios-form.component.ts`

```typescript
get isPerfilCliente(): boolean {
  const perfilCodigo = typeof this.currentLoggedUser.perfil === 'object' 
    ? this.currentLoggedUser.perfil.codigo 
    : this.currentLoggedUser.perfil;
  return ['GESTOR', 'COLABORADOR', 'LEITURA'].includes(perfilCodigo);
}
```

**Comportamentos:**
- Perfis de cliente (GESTOR, COLABORADOR, LEITURA) são redirecionados ao `/dashboard`
- Perfis de cliente não podem alterar própria empresa
- (Não há restrição explícita de UI para outros campos)

---

## 7. Auditoria Automática

### 7.1. Eventos Auditados

**Implementação:** `usuarios.service.ts`

Todas as operações de CRUD geram log de auditoria:

| Ação | Evento | Dados Registrados |
|------|--------|-------------------|
| Criar | CREATE | `dadosDepois` |
| Atualizar | UPDATE | `dadosAntes`, `dadosDepois` |
| Inativar | DELETE | `dadosAntes`, `dadosDepois` |
| Deletar | DELETE | `dadosAntes` |

**Campos da auditoria:**
```typescript
{
  usuarioId: string,
  usuarioNome: string,
  usuarioEmail: string,
  entidade: 'usuarios',
  entidadeId: string,
  acao: 'CREATE' | 'UPDATE' | 'DELETE',
  dadosAntes?: object,
  dadosDepois?: object
}
```

---

## 8. Pontos de Ambiguidade ou Ausência de Regra

### A-001: Permissões de Foto de Perfil
**Observação:**  
Os endpoints de upload e delete de foto (`POST /usuarios/:id/foto` e `DELETE /usuarios/:id/foto`) não possuem decorator `@Roles`.

**Consequência:**  
Qualquer usuário autenticado pode fazer upload ou deletar foto de qualquer outro usuário.

**Recomendação (fora do escopo):**  
Não documentado se isso é intencional ou uma lacuna de segurança.

---

### A-002: Validação de Formato de Telefone
**Observação:**  
O frontend aplica máscara de telefone brasileiro, mas o backend não valida o formato.

**Consequência:**  
É possível criar usuário com telefone em formato inválido via API direta.

**Recomendação (fora do escopo):**  
Não documentado se validação de formato é obrigatória.

---

### A-003: Regra de Auto-Associação de Empresa
**Observação:**  
Não há regra explícita no código que impeça um usuário de alterar sua própria `empresaId`.

**Implementação atual:**  
O frontend bloqueia a UI (`shouldDisableEmpresaField`), mas o backend aceita qualquer valor.

**Consequência:**  
Via API direta, um GESTOR pode se desassociar ou trocar de empresa.

**Recomendação (fora do escopo):**  
Não documentado se isso deve ser bloqueado no backend.

---

### A-004: Exclusão de Usuário com Vínculos
**Observação:**  
Não há regra explícita que impeça deletar usuário com agendas, históricos de login, etc.

**Implementação atual:**  
O schema Prisma define cascata ou `SetNull` em algumas relações:
- `passwordResets`: `onDelete: Cascade`
- `loginHistory`: `onDelete: SetNull`

**Consequência:**  
Deletar usuário pode causar perda de histórico ou órfãos dependendo da relação.

**Recomendação (fora do escopo):**  
Não documentado se há restrições de negócio para esta operação.

---

### A-005: Remoção de Perfil CONSULTOR
**Observação:**  
O código do controller ainda referencia `'CONSULTOR'` em alguns endpoints, mas o perfil foi removido do sistema.

**Evidência:**
- `usuarios.controller.ts` linha 56: `@Roles('ADMINISTRADOR', 'CONSULTOR', ...)`
- Frontend não usa mais `CONSULTOR`

**Consequência:**  
Código morto / inconsistência documental.

**Recomendação (fora do escopo):**  
Não documentado se deve ser removido completamente.

---

### A-006: Ativação Manual de Usuário
**Observação:**  
Existe método `activate` no `users.service.ts` (frontend), mas não há endpoint correspondente no backend.

**Implementação atual:**  
Ativação é feita via `PATCH /usuarios/:id` com `{ ativo: true }`.

**Consequência:**  
Funciona, mas sem endpoint dedicado.

**Recomendação (fora do escopo):**  
Não documentado se endpoint específico é necessário.

---

### A-007: Atualização de Avatar não Auditada
**Observação:**  
Os métodos `updateProfilePhoto` e `deleteProfilePhoto` não registram auditoria.

**Consequência:**  
Mudanças de foto não são rastreadas.

**Recomendação (fora do escopo):**  
Não documentado se auditoria de foto é necessária.

---

### A-008: Busca por Nome/Email não Implementada
**Observação:**  
O serviço frontend possui método `search(query)`, mas não há endpoint correspondente no backend.

**Implementação atual:**  
Frontend faz busca local após carregar todos os usuários.

**Consequência:**  
Funciona, mas ineficiente para grandes volumes.

**Recomendação (fora do escopo):**  
Não documentado se busca server-side é necessária.

---

## 9. Conclusão

Este documento extraiu **todas as regras implementadas** no código do módulo Usuarios.

**Resumo:**
- 8 regras de negócio explícitas
- 10 comportamentos condicionais implementados
- 6 perfis de usuário (1 removido)
- Auditoria completa de CRUD
- 8 pontos de ambiguidade identificados

**Próximos passos (fora do escopo deste agente):**
- Resolver ambiguidades com stakeholders
- Documentar regras implícitas se necessário
- Criar testes baseados nestas regras

---

**Fim do documento.**
