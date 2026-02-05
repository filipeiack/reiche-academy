# Regra: Fluxograma de Processos Prioritários

## Contexto
Esta regra se aplica ao módulo **Cockpit de Pilares**, especificamente na aba **"Processos"** (Matriz de Processos), onde são listados os processos prioritários mapeados em `ProcessoPrioritario`.

O fluxograma permite que usuários documentem os passos/ações de cada processo prioritário, facilitando o mapeamento e padronização de rotinas.

---

## Descrição
Cada **processo prioritário** pode ter um **fluxograma** associado, que é uma lista ordenada de ações (textos descritivos) representando os passos do processo.

O fluxograma é gerenciado via **drawer** (painel lateral) acessado por um ícone na lista de processos.

---

## Condição
Esta funcionalidade é aplicável quando:
- Usuário está visualizando a aba "Processos" de um cockpit de pilar
- Possui permissão adequada (GESTOR, ADMINISTRADOR ou COLABORADOR)
- Há pelo menos um processo prioritário cadastrado

---

## Comportamento Esperado

### 1. **Criação e Armazenamento**

#### Modelo de Dados (Prisma)
```prisma
model ProcessoFluxograma {
  id String @id @default(uuid())

  processoPrioritarioId String
  processoPrioritario   ProcessoPrioritario @relation(fields: [processoPrioritarioId], references: [id], onDelete: Cascade)

  descricao String // Texto da ação (10-300 caracteres)
  ordem     Int    // Ordenação das ações (auto-incrementada)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?

  @@index([processoPrioritarioId])
  @@map("processos_fluxograma")
}
```

#### Relação com ProcessoPrioritario
- Adicionar ao modelo `ProcessoPrioritario`:
```prisma
acoes ProcessoFluxograma[] @relation
```

---

### 2. **Interface de Usuário (Frontend)**

#### Localização
- **Path:** `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/`
- **Componente:** Lista de processos prioritários (tabela/cards)

#### Ícone Indicador (Estrela)
- **Posição:** Ao lado de cada processo prioritário na lista
- **Estados:**
  - **Vazio (☆):** Nenhuma ação no fluxograma (count = 0)
  - **Preenchido (★):** Há pelo menos 1 ação ativa (count > 0)
- **Tooltip:** "Gerenciar fluxograma do processo"
- **Comportamento:** Clique abre drawer de gerenciamento

#### Drawer de Fluxograma
**Referência de implementação:** `frontend/src/app/views/pages/diagnostico-notas/rotina-edit-drawer/rotina-edit-drawer.component.ts`

**Elementos:**
- **Header:**
  - Título: "Fluxograma do Processo"
  - Subtítulo: Nome do processo prioritário/rotina
  - Botão fechar (X)

- **Body (lista de ações):**
  - Drag & drop para reordenação (CDK DragDrop)
  - Badge com número de ordem
  - Campo de texto (edição inline)
  - Botões: Editar, Remover
  - Estado vazio: "Nenhuma ação cadastrada. Adicione ações para documentar o fluxograma."

- **Footer:**
  - Botão "Adicionar Ação"
  - Botão "Fechar"

**Funcionalidades:**
1. **Adicionar Ação:**
   - Campo de texto com validação (10-300 caracteres)
   - Ordem auto-incrementada (max(ordem) + 1)
   - Confirmação via toast (SweetAlert2)

2. **Editar Ação:**
   - Edição inline (textarea)
   - Validação ao salvar
   - Teclas: Enter (salvar), Escape (cancelar)

3. **Remover Ação:**
   - Confirmação via SweetAlert2
   - Hard delete (remoção permanente do banco)
   - Atualiza ícone se count = 0

4. **Reordenar Ações:**
   - Drag & drop (Angular CDK)
   - Atualiza campo `ordem` (1, 2, 3, ...)
   - Salva automaticamente ao soltar

---

### 3. **Status de Mapeamento (statusMapeamento)**

#### Campo em ProcessoPrioritario
```prisma
enum StatusProcesso {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDO
}

statusMapeamento StatusProcesso?
```

#### Comportamento
- **Controle Manual:** Usuário altera o status manualmente (dropdown/select)
- **NÃO há automação:** Criar/remover ações do fluxograma NÃO altera o status automaticamente
- **Independência:** Status e fluxograma são gerenciados separadamente

**Exemplo de UI:**
```html
<!-- Na lista de processos, ao lado do ícone de fluxograma -->
<select [(ngModel)]="processo.statusMapeamento">
  <option value="PENDENTE">Pendente</option>
  <option value="EM_ANDAMENTO">Em Andamento</option>
  <option value="CONCLUIDO">Concluído</option>
</select>
```

---

### 4. **API Endpoints (Backend)**

#### Rotas Sugeridas
```
Base: /empresas/:empresaId/cockpit-pilares/:cockpitPilarId/processos/:processoPrioritarioId

GET    /fluxograma              # Listar ações do fluxograma
POST   /fluxograma              # Criar nova ação
PATCH  /fluxograma/:acaoId      # Editar ação
DELETE /fluxograma/:acaoId      # Remover ação (hard delete)
PATCH  /fluxograma/reordenar    # Reordenar múltiplas ações
```

#### DTOs (Validações)

**CreateProcessoFluxogramaDto:**
```typescript
export class CreateProcessoFluxogramaDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'A descrição deve ter no mínimo 10 caracteres' })
  @MaxLength(300, { message: 'A descrição deve ter no máximo 300 caracteres' })
  @ApiProperty({ example: 'Coletar dados iniciais do cliente' })
  descricao: string;
}
```

**UpdateProcessoFluxogramaDto:**
```typescript
export class UpdateProcessoFluxogramaDto extends PartialType(CreateProcessoFluxogramaDto) {}
```

**ReordenarFluxogramaDto:**
```typescript
export class ReordenarFluxogramaDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdemItemDto)
  @ApiProperty({
    example: [
      { id: 'uuid-1', ordem: 1 },
      { id: 'uuid-2', ordem: 2 }
    ]
  })
  ordens: OrdemItemDto[];
}

class OrdemItemDto {
  @IsUUID()
  id: string;

  @IsInt()
  @Min(1)
  ordem: number;
}
```

---

## Cenários

### Happy Path

#### Cenário 1: Criar Primeira Ação no Fluxograma
1. Usuário GESTOR acessa cockpit de pilar → aba "Processos"
2. Clica no ícone ☆ (vazio) de um processo prioritário
3. Drawer abre com estado vazio
4. Clica em "Adicionar Ação"
5. Digita: "Coletar dados iniciais do cliente" (25 caracteres)
6. Confirma
7. **Resultado:**
   - Ação criada com `ordem = 1`
   - Ícone muda para ★ (preenchido)
   - Toast de sucesso
   - Audit log criado

#### Cenário 2: Reordenar Ações
1. Usuário abre drawer com 5 ações
2. Arrasta ação #5 para posição #2
3. **Resultado:**
   - Ordens atualizadas: [1, 5, 2, 3, 4] → [1, 2, 3, 4, 5]
   - Salvo automaticamente
   - Toast de sucesso

#### Cenário 3: Alterar Status Manualmente
1. Usuário altera `statusMapeamento` de PENDENTE → EM_ANDAMENTO
2. **Resultado:**
   - Status salvo
   - Audit log criado
   - Fluxograma NÃO é afetado (independente)

---

### Casos de Erro

#### Erro 1: Descrição Muito Curta
- **Input:** "Ação 1" (6 caracteres)
- **Resultado:** Erro de validação (400)
- **Mensagem:** "A descrição deve ter no mínimo 10 caracteres"

#### Erro 2: Descrição Muito Longa
- **Input:** Texto com 301 caracteres
- **Resultado:** Erro de validação (400)
- **Mensagem:** "A descrição deve ter no máximo 300 caracteres"

#### Erro 3: Usuário sem Permissão (LEITURA)
- **Ação:** Usuário com perfil LEITURA tenta criar ação
- **Resultado:** 403 Forbidden
- **Mensagem:** "Você não tem permissão para realizar esta ação"

#### Erro 4: Isolamento Multi-Tenant
- **Ação:** Usuário da Empresa A tenta acessar fluxograma da Empresa B
- **Resultado:** 404 Not Found ou 403 Forbidden
- **Validação:** Backend valida cadeia `empresaId → PilarEmpresa → CockpitPilar → ProcessoPrioritario`

#### Erro 5: Processo Prioritário Não Existe
- **Ação:** Request para `/processos/uuid-invalido/fluxograma`
- **Resultado:** 404 Not Found
- **Mensagem:** "Processo prioritário não encontrado"

---

## Restrições

### Validações de Negócio
1. **Descrição:**
   - Mínimo: 10 caracteres
   - Máximo: 300 caracteres
   - Não pode ser vazia ou apenas espaços

2. **Limite de Ações:**
   - **Ilimitado** (usuário pode criar quantas quiser)
   - ⚠️ **Recomendação:** Monitorar performance se > 100 ações por processo
   - UI pode sugerir limite de 50 ações para melhor usabilidade

3. **Ordenação:**
   - Auto-incrementada na criação (max(ordem) + 1)
   - Deve ser sequencial (1, 2, 3, ...) após reordenação
   - Não pode haver gaps (1, 3, 5 ❌ → 1, 2, 3 ✅)

4. **Zero Ações:**
   - Processos sem ações NÃO criam registros em `processos_fluxograma`
   - Ícone mostra ☆ (vazio)
   - Drawer mostra estado vazio

### Permissões (RBAC)
- **ADMINISTRADOR:** Acesso total (criar, editar, remover, alterar status)
- **GESTOR:** Acesso total dentro de sua empresa
- **COLABORADOR:** Acesso total dentro de sua empresa
- **LEITURA:** ❌ Apenas visualização (sem criar/editar/remover)

**Validação no Backend:**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'GESTOR', 'COLABORADOR')
export class ProcessoFluxogramaController {
  // endpoints...
}
```

### Multi-Tenant (Isolamento)
**Cadeia de validação:**
```
ProcessoFluxograma 
  → ProcessoPrioritario 
    → CockpitPilar 
      → PilarEmpresa 
        → empresaId
```

**Query Prisma (exemplo):**
```typescript
const processo = await this.prisma.processoPrioritario.findFirst({
  where: {
    id: processoPrioritarioId,
    cockpitPilar: {
      pilarEmpresa: {
        empresaId
      }
    }
  },
  include: {
    acoes: {
      orderBy: { ordem: 'asc' }
    }
  }
});

if (!processo) {
  throw new NotFoundException('Processo não encontrado');
}
```

### Auditoria
**Eventos que geram AuditLog:**

1. **Criar Ação:**
   - Entidade: `processos_fluxograma`
   - Ação: `CREATE`
   - dadosAntes: `null`
   - dadosDepois: `{ id, processoPrioritarioId, descricao, ordem }`

2. **Editar Ação:**
   - Entidade: `processos_fluxograma`
   - Ação: `UPDATE`
   - dadosAntes: `{ descricao: "antigo", ordem: 1 }`
   - dadosDepois: `{ descricao: "novo", ordem: 1 }`

3. **Remover Ação:**
   - Entidade: `processos_fluxograma`
   - Ação: `DELETE`
   - dadosAntes: `{ id, descricao, ordem }`
   - dadosDepois: `null`

4. **Reordenar Ações:**
   - Entidade: `processos_fluxograma`
   - Ação: `UPDATE`
   - dadosAntes: `[{ id: 'uuid-1', ordem: 1 }, ...]`
   - dadosDepois: `[{ id: 'uuid-1', ordem: 2 }, ...]`

5. **Alterar statusMapeamento:**
   - Entidade: `processos_prioritarios`
   - Ação: `UPDATE`
   - dadosAntes: `{ statusMapeamento: "PENDENTE" }`
   - dadosDepois: `{ statusMapeamento: "EM_ANDAMENTO" }`

---

## Fonte no Código

### Modelo de Dados
- **Arquivo:** `backend/prisma/schema.prisma`
- **Tabelas:**
  - `ProcessoFluxograma` (nova - será criada)
  - `ProcessoPrioritario` (existente - adicionar relação)

### Frontend
- **Path:** `frontend/src/app/views/pages/cockpit-pilares/matriz-processos/`
- **Componente Drawer:** (novo - baseado em `rotina-edit-drawer.component.ts`)
- **Service:** (novo - `processo-fluxograma.service.ts`)

### Backend
- **Module:** `backend/src/modules/cockpit-pilares/`
- **Controller:** (novo - `processo-fluxograma.controller.ts`)
- **Service:** (novo - `processo-fluxograma.service.ts`)
- **DTOs:** (novo - `dto/processo-fluxograma/*.dto.ts`)

---

## Observações

### Regra Proposta
- **Status:** Regra proposta - aguardando implementação
- **Decisão aprovada por:** Usuário (2026-01-27)
- **Prioridade:** Média

### Relação com statusMapeamento
- O campo `statusMapeamento` é **independente** do fluxograma
- Usuário controla manualmente (não há automação)
- Ambos podem ser auditados separadamente

### Performance
- Sem limite técnico de ações, mas UI pode sugerir máximo de 50 para melhor UX
- Queries devem usar `orderBy: { ordem: 'asc' }` para garantir ordenação
- Considerar paginação se processos tiverem > 100 ações

### Exclusão
- **Hard delete** (remoção permanente)
- Razão: Ações são descritivas e não têm dependências críticas
- Se necessário histórico, pode-se adicionar soft delete (`ativo: Boolean`) futuramente

### Compatibilidade com Padrões do Sistema
- Segue padrão de drawer existente (rotina-edit-drawer)
- Usa SweetAlert2 para feedbacks
- Usa Angular CDK para drag & drop
- Usa reactive forms e standalone components
- Todas strings i18n (`{{ 'KEY' | translate }}`)

---

## Decisões Técnicas Pendentes

### Para Dev Agent Enhanced:
1. **Endpoint de reordenação:** Batch update ou individual?
   - Sugestão: Batch (recebe array de `{ id, ordem }`)
2. **Campo `statusMapeamento` na UI:** Dropdown, radio buttons ou badges clicáveis?
   - Sugestão: Dropdown inline na tabela
3. **Limite visual de ações:** Mostrar warning quando > 50?
4. **Animações:** Usar Angular Animations para feedback visual ao adicionar/remover?

### Para QA Engineer:
1. **Testes E2E:** Priorizar cenário de drag & drop (complexo)
2. **Testes adversariais:** Validar isolamento multi-tenant rigorosamente
3. **Performance:** Testar com 100+ ações para validar UX

---

**Última atualização:** 2026-01-27  
**Changelog:** Criação inicial da regra
