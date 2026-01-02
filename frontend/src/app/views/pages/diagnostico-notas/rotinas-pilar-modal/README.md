# RotinasPilarModalComponent

Componente modal para gerenciar rotinas de um pilar na tela de diagnóstico de notas.

## Descrição

Este componente permite gerenciar as rotinas associadas a um pilar específico de uma empresa (tabela `RotinaEmpresa`), incluindo reordenação via drag-and-drop, remoção e adição de novas rotinas.

## Funcionalidades

- **Reordenação**: Arrastar e soltar rotinas para alterar a ordem de execução
- **Remoção**: Remover rotinas existentes do pilar
- **Adição**: Adicionar novas rotinas ao pilar (sempre no final da lista)
- **Visualização**: Lista visual com número de ordem e nome de cada rotina

## Uso

### Importação

```typescript
import { RotinasPilarModalComponent } from './rotinas-pilar-modal/rotinas-pilar-modal.component';

@Component({
  // ...
  imports: [RotinasPilarModalComponent]
})
export class DiagnosticoNotasComponent {
  @ViewChild(RotinasPilarModalComponent) rotinasPilarModal!: RotinasPilarModalComponent;
}
```

### Abertura da Modal

```typescript
abrirModalEditarRotinas(pilarEmpresa: PilarEmpresa): void {
  if (this.rotinasPilarModal) {
    this.rotinasPilarModal.pilarEmpresaId = pilarEmpresa.id;
    this.rotinasPilarModal.pilarNome = pilarEmpresa.pilar.nome;
    this.rotinasPilarModal.pilarId = pilarEmpresa.pilarId;
    this.rotinasPilarModal.rotinasEmpresa = [...pilarEmpresa.rotinasEmpresa];
    this.rotinasPilarModal.open();
  }
}
```

### Template

```html
<app-rotinas-pilar-modal
    (rotinasModificadas)="onRotinasModificadas()">
</app-rotinas-pilar-modal>
```

## Inputs

| Input | Tipo | Descrição |
|-------|------|-----------|
| `pilarEmpresaId` | `string` | ID do PilarEmpresa |
| `pilarNome` | `string` | Nome do pilar para exibição |
| `pilarId` | `string` | ID do pilar base |
| `rotinasEmpresa` | `RotinaEmpresa[]` | Array de rotinas associadas ao pilar (via @Input ou propriedade) |

## Outputs

| Output | Tipo | Descrição |
|--------|------|-----------|
| `rotinasModificadas` | `EventEmitter<void>` | Emitido quando rotinas são adicionadas, removidas ou reordenadas |

## Funcionalidades Detalhadas

### Drag and Drop

- Utiliza Angular CDK Drag Drop
- Permite reordenação visual das rotinas
- Atualiza automaticamente o campo `ordem` de cada rotina
- Marca que há alterações pendentes para salvar

### Adicionar Rotina

1. Seleciona uma rotina disponível do pilar via `ng-select`
2. Adiciona ao final da lista com `ordem = max(ordem) + 1`
3. Cria registro em `RotinaEmpresa` vinculado ao `PilarEmpresa`
4. Emite evento `rotinasModificadas`

### Remover Rotina

1. Confirmação via SweetAlert2
2. Remove registro de `RotinaEmpresa` (não deleta a `Rotina` base)
3. Reordena rotinas restantes
4. Emite evento `rotinasModificadas`

### Salvar Ordem

- Botão habilitado apenas quando há alterações
- Persiste nova ordem no backend
- Atualiza campo `ordem` de cada `RotinaEmpresa`

## Endpoints Backend Necessários

### GET /diagnosticos/pilar-empresa/:pilarEmpresaId/rotinas
Retorna todas as rotinas associadas a um pilar de empresa.

### POST /diagnosticos/pilar-empresa/:pilarEmpresaId/rotinas
Adiciona uma nova rotina ao pilar.

**Body:**
```json
{
  "rotinaId": "uuid",
  "ordem": 5
}
```

### DELETE /diagnosticos/rotinas-empresa/:rotinaEmpresaId
Remove uma RotinaEmpresa específica.

### PATCH /diagnosticos/pilar-empresa/:pilarEmpresaId/rotinas/ordem
Atualiza a ordem de múltiplas rotinas.

**Body:**
```json
{
  "rotinas": [
    { "id": "uuid1", "ordem": 1 },
    { "id": "uuid2", "ordem": 2 }
  ]
}
```

## Tabelas Envolvidas

- **RotinaEmpresa**: Vínculo entre Rotina e PilarEmpresa (contém campo `ordem`)
- **PilarEmpresa**: Pilar associado a uma empresa
- **Rotina**: Rotina base (modelo ou customizada)

## Estados da Modal

- **Loading**: Carregando dados iniciais
- **Lista Vazia**: Nenhuma rotina associada
- **Lista com Rotinas**: Exibe rotinas com drag-drop habilitado
- **Alterações Pendentes**: Botão "Salvar Ordem" habilitado

## Validações

- Não permite adicionar a mesma rotina duas vezes ao mesmo pilar
- Rotinas removidas não podem ser recuperadas pela modal
- Ordem é sempre sequencial (1, 2, 3, ...)
