# Regras de UI - Formulários

**Data de criação**: 2026-02-04  
**Escopo**: Validação, campos de senha, ambiente em forms, padrões visuais  
**Fontes consolidadas**: auth-ui-visualizar-ocultar-senha.md, ui-login-exibir-ambiente.md, frontend-build-config-ambiente.md  

---

## 1. Visão Geral

Os formulários do sistema seguem um padrão consistente com:
- Reactive Forms do Angular para validação
- Campos de senha com toggle de visualização
- Indicadores de ambiente em forms críticos
- Validação client-side + server-side
- Feedback visual claro para estados de erro/sucesso

---

## 2. Componentes e Padrões

### 2.1 Estrutura Base de Formulário
```typescript
// Padrão Reactive Forms
export class ExampleFormComponent implements OnInit {
  form = this.fb.group({
    campo1: ['', [Validators.required]],
    campo2: ['', [Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(private fb: FormBuilder) {}
}
```

### 2.2 Campos de Senha
**R-FRM-001**: Toggle de visualização
```html
<div class="input-group">
  <input [type]="showPassword ? 'text' : 'password'" 
         class="form-control" 
         formControlName="senha"
         [attr.aria-label]="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
  <button type="button" 
          class="btn btn-outline-secondary" 
          (click)="togglePasswordVisibility()">
    <i class="bi" 
       [class.bi-eye]="showPassword" 
       [class.bi-eye-slash]="!showPassword"></i>
  </button>
</div>
```

**R-FRM-002**: Múltiplos campos de senha
- Cada campo com toggle independente (nova senha, confirmação)
- Estados separados: `showNewPassword`, `showConfirmPassword`
- Validação de matching entre campos

### 2.3 Indicadores de Ambiente
**R-FRM-003**: Exibir ambiente em forms críticos
```typescript
// Em login.component.ts
environmentLabel = environment.environmentName || 'LOCAL';

// Template
<div *ngIf="environmentLabel !== 'LOCAL'" 
     class="environment-indicator">
  {{ environmentLabel }}
</div>
```

---

## 3. Regras de Comportamento

### 3.1 Validação de Campos
**R-FRM-004**: Validadores padrão
```typescript
// Email
email: ['', [Validators.required, Validators.email]]

// Senha forte  
senha: ['', [
  Validators.required,
  Validators.minLength(8),
  Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
]]

// CPF
cpf: ['', [Validators.required, cpfValidator()]]

// Telefone
telefone: ['', [telefoneValidator()]]
```

**R-FRM-005**: Mensagens de erro padrão
```html
<div *ngIf="campo.invalid && (campo.dirty || campo.touched)" 
     class="text-danger small">
  <div *ngIf="campo.errors?.required">Campo obrigatório</div>
  <div *ngIf="campo.errors?.email">Email inválido</div>
  <div *ngIf="campo.errors?.minlength">
    Mínimo de {{ campo.errors.minlength.requiredLength }} caracteres
  </div>
</div>
```

### 3.2 Estados de Loading
**R-FRM-006**: Estados visuais durante processamento
```html
<button type="submit" 
        class="btn btn-primary" 
        [disabled]="form.invalid || loading">
  <span *ngIf="loading" class="spinner-border spinner-border-sm me-2"></span>
  {{ loading ? 'Salvando...' : 'Salvar' }}
</button>
```

### 3.3 Validação Servidor
**R-FRM-007**: Tratamento de erros do backend
```typescript
onSubmit() {
  if (this.form.invalid) return;
  
  this.loading = true;
  this.service.create(this.form.value).subscribe({
    next: (result) => {
      this.onSuccess(result);
    },
    error: (err) => {
      this.handleServerErrors(err);
      this.loading = false;
    }
  });
}

private handleServerErrors(err: any) {
  if (err.error?.message) {
    // Erro genérico do servidor
    Swal.fire('Erro', err.error.message, 'error');
  }
  
  if (err.error?.errors) {
    // Erros de campo específicos
    Object.keys(err.error.errors).forEach(field => {
      const control = this.form.get(field);
      if (control) {
        control.setErrors({ server: err.error.errors[field] });
      }
    });
  }
}
```

---

## 4. Validações e Acessibilidade

### 4.1 Validação de Senha
**R-FRM-008**: Requisitos mínimos de senha
- Mínimo 8 caracteres
- Pelo menos uma letra maiúscula
- Pelo menos uma letra minúscula  
- Pelo menos um número
- Pelo menos um caractere especial (@$!%*?&)

**R-FRM-009**: Toggle de visibilidade
- Botão com ícone claro (olho/olho riscado)
- ARIA label apropriada
- Não afeta validação do campo
- Estado inicial: oculto

### 4.2 Acessibilidade
**R-FRM-010**: Labels e navegação
- Todos os campos com `for` no label
- Ordem de tabulação lógica
- Mensagens de erro associadas aos campos
- Foco automático em primeiro campo com erro

**R-FRM-011**: Teclado
- Submit com Enter
- Cancelar com Escape
- Navegação entre campos com Tab/Shift+Tab

### 4.3 Responsividade
**R-FRM-012**: Layout adaptativo
- Formulários em coluna única (<768px)
- Botões em stack vertical em mobile
- Inputs com width 100% em telas pequenas

---

## 5. Integrações com Backend

### 5.1 Padrão de DTOs
```typescript
// Create DTO
export class CreateUsuarioDto {
  @ApiProperty({ example: 'João Silva' })
  @IsNotEmpty()
  nome: string;

  @ApiProperty({ example: 'joao@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsNotEmpty()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial'
  })
  senha?: string;

  @ApiProperty()
  perfilId: string;
}
```

### 5.2 Multi-tenant
**R-FRM-013**: Contexto de empresa
- Forms de criação incluem `empresaId` automaticamente
- Admin pode selecionar empresa em dropdown
- Clientes veem apenas dados da própria empresa

### 5.3 Configuração por Ambiente
**R-FRM-014**: Build-time configuration
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
  environmentName: 'LOCAL'
};

// environment.prod.ts  
export const environment = {
  production: true,
  apiUrl: 'https://api.reicheacademy.com',
  environmentName: 'PRODUÇÃO'
};
```

---

## 6. Casos de Uso Típicos

### 6.1 Formulário de Login
```html
<form [formGroup]="form" (submit)="onLogin($event)">
  <div class="mb-3">
    <label for="email" class="form-label">Email</label>
    <input type="email" class="form-control" id="email" 
           formControlName="email" required>
  </div>
  
  <div class="mb-3">
    <label for="senha" class="form-label">Senha</label>
    <div class="input-group">
      <input [type]="showPassword ? 'text' : 'password'" 
             class="form-control" id="senha"
             formControlName="senha" autocomplete="current-password">
      <button type="button" class="btn btn-outline-secondary" 
              (click)="togglePasswordVisibility()">
        <i class="bi" [class.bi-eye]="showPassword" [class.bi-eye-slash]="!showPassword"></i>
      </button>
    </div>
  </div>
  
  <button type="submit" class="btn btn-primary w-100" 
          [disabled]="form.invalid || loading">
    Entrar
  </button>
</form>
```

### 6.2 Formulário de Usuário
```typescript
// Usuário form component
ngOnInit() {
  this.form = this.fb.group({
    nome: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
    perfilId: ['', Validators.required],
    ativo: [true]
  });
}

// Exibição de ambiente no login
get environmentLabel() {
  const env = environment.environmentName || 'LOCAL';
  return env === 'PRODUÇÃO' ? 'PRODUÇÃO' : env;
}
```

### 6.3 Reset de Senha
```typescript
// Reset password com múltiplos campos
form = this.fb.group({
  novaSenha: ['', [Validators.required, Validators.minLength(8)]],
  confirmarSenha: ['', Validators.required]
}, { validators: passwordMatchValidator });

// Validador customizado
function passwordMatchValidator(control: AbstractControl) {
  const nova = control.get('novaSenha')?.value;
  const confirmar = control.get('confirmarSenha')?.value;
  return nova === confirmar ? null : { passwordMismatch: true };
}
```

---

## 7. Testes de UI

### 7.1 Testes Unitários
```typescript
describe('UsuarioFormComponent', () => {
  it('deve validar email inválido', () => {
    component.form.get('email')?.setValue('email-invalido');
    expect(component.form.get('email')?.invalid).toBeTruthy();
  });

  it('deve validar senha forte', () => {
    component.form.get('senha')?.setValue('senha123');
    expect(component.form.get('senha')?.invalid).toBeTruthy();
    
    component.form.get('senha')?.setValue('Senha@123');
    expect(component.form.get('senha')?.valid).toBeTruthy();
  });
});
```

### 7.2 Testes E2E (Playwright)
```typescript
test('formulário de login com toggle de senha', async ({ page }) => {
  await page.goto('/auth/login');
  
  // Preencher campos
  await page.fill('#email', 'admin@teste.com');
  await page.fill('#senha', 'senha123');
  
  // Toggle para mostrar senha
  await page.click('button[aria-label="Mostrar senha"]');
  await expect(page.locator('input[name="senha"]')).toHaveAttribute('type', 'text');
  
  // Toggle para ocultar senha
  await page.click('button[aria-label="Ocultar senha"]');
  await expect(page.locator('input[name="senha"]')).toHaveAttribute('type', 'password');
  
  // Submeter formulário
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

test('validação de formulário de usuário', async ({ page }) => {
  await page.goto('/usuarios/novo');
  
  // Tentar submit sem preencher
  await page.click('button[type="submit"]');
  await expect(page.locator('.text-danger')).toContainText('Campo obrigatório');
  
  // Preencher inválido
  await page.fill('#email', 'email-invalido');
  await expect(page.locator('.text-danger')).toContainText('Email inválido');
});
```

---

## 8. Considerações Técnicas

### 8.1 Performance
- Validadores síncronos para feedback imediato
- Debounce em campos com validação server-side
- Lazy loading de validadores complexos

### 8.2 Segurança
- Senhas sempre em type="password" por padrão
- Sanitização de inputs para XSS
- Rate limiting em endpoints sensíveis

### 8.3 UX
- Feedback visual imediato para validações
- Mensagens de erro claras e acionáveis
- Prevenção de duplo submit

---

## 9. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Senha exposta em claro | Alto | Default oculto, toggle explícito, ARIA labels |
| Validação client-side burlada | Médio | Sempre validar no backend |
| Formulário não responsivo | Baixo | Testar em múltiplos viewports |
| Acessibilidade comprometida | Baixo | Testar com leitor de tela |

---

**Status**: ✅ **IMPLEMENTADO**  
**Manutenção**: Revisar validadores trimestralmente  
**Documentação relacionada**: `/docs/2-business-rules/ui/navigation.md`, `/docs/2-business-rules/ui/feedback.md`