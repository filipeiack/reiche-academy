# Regras de Negócio — Rotinas (Frontend)

**Módulo:** Rotinas (Frontend CRUD)  
**Backend:** `backend/src/modules/rotinas/`  
**Frontend:** `frontend/src/app/modules/rotinas/` (A IMPLEMENTAR)  
**Última extração:** 25/12/2024  
**Agente:** Extractor de Regras (Mode B - Rule Proposal)  
**Status:** ⚠️ **REGRAS CANDIDATAS** - Aprovação humana obrigatória

---

## ⚠️ AVISO IMPORTANTE

Este documento contém **regras propostas** baseadas em:
- Modelo de dados existente (schema.prisma)
- Padrões estabelecidos nos módulos Empresas e Pilares
- Contexto fornecido pelo usuário

**Estas regras NÃO são oficiais até aprovação humana explícita.**

---

## 1. Visão Geral

O módulo Rotinas (Frontend) é responsável por:
- CRUD completo de rotinas padrão do sistema (tabela `Rotina`)
- Gestão de rotinas modelo (auto-associáveis a empresas)
- Vinculação de rotinas a pilares específicos
- Ordenação customizável dentro de cada pilar
- Interface administrativa para ADMINISTRADOR

**Entidade principal:**
- Rotina (catálogo global de rotinas padrão por pilar)

**Funcionalidades propostas:**
- Listar rotinas ativas (com filtro por pilar)
- Criar rotina vinculada a pilar
- Editar rotina existente
- Desativar rotina (soft delete)
- Reordenar rotinas dentro do mesmo pilar (drag-and-drop)

**Perfil autorizado:**
- **ADMINISTRADOR** (exclusivo para todas as operações de escrita)
- Todos os perfis autenticados podem visualizar

---

## 2. Contexto de Negócio

### 2.1. Hierarquia do Sistema

```
Pilar (global)
  └── Rotina (global) ← FOCO DESTE MÓDULO
      └── (usado por) RotinaEmpresa (por empresa)
          └── NotaRotina (avaliação)
```

### 2.2. Exemplo Real

**PILAR:** Estratégico

**ROTINAS:**
1. Definição e alinhamento com time de missão, visão e valores
2. Gestão do organograma da empresa e mapeamento de cargos
3. Elaboração e apresentação do regulamento interno
4. Definição de metas anuais e desdobramento mês a mês
5. Rotina de reunião mensal para análise de resultados
6. Rotina de reunião semanal para alinhamento 1 a 1
7. Rotina de reunião diária para alinhamento do time
8. Rotina de treinamento e formação de novas lideranças
9. Ações de desenvolvimento e fortalecimento da cultura organizacional
10. Rotina de análise de concorrentes e tendências de mercado

### 2.3. Campo `modelo`

Similar ao campo `modelo` da tabela `Pilar`:
- **`modelo: true`**: Rotina padrão do sistema, pode ser auto-associada a novos PilaresEmpresa
- **`modelo: false`**: Rotina customizada, específica de uma empresa, mas reutilizável

---

## 3. Regras Candidatas — Interface (Frontend)

### R-ROT-FRONT-001: Listagem de Rotinas Ativas

**Descrição:**  
Sistema exibe apenas rotinas ativas (`ativo: true`), ordenadas por pilar e campo `ordem`.

**Condição:**  
Usuário autenticado acessa página de listagem de rotinas.

**Comportamento Esperado:**

**Interface:**
- Exibir rotinas agrupadas por pilar
- Ordenação: `pilar.ordem ASC`, depois `rotina.ordem ASC`
- Mostrar: nome, descrição (resumida), pilar associado, badge "Modelo" (se `modelo: true`)
- Contador de rotinas por pilar

**Cenários:**
- **Happy Path:** Lista carregada com rotinas ativas de todos os pilares
- **Vazio:** Mensagem "Nenhuma rotina cadastrada" se lista vazia
- **Erro API:** Mensagem de erro com retry

**Restrições:**
- Rotinas inativas (`ativo: false`) não aparecem na listagem
- Apenas rotinas de pilares ativos são exibidas

**Impacto Técnico:**
- Componente: `RotinasListComponent`
- Endpoint: `GET /rotinas?pilarId=uuid` (filtro opcional)
- Service: `RotinasService.findAll(pilarId?)`

**Referências:**
- Backend: [rotinas.md](rotinas.md#R-ROT-002)
- Padrão similar: [pilares.md](pilares.md#R-PIL-002)

---

### R-ROT-FRONT-002: Filtro de Rotinas por Pilar

**Descrição:**  
Interface permite filtrar rotinas por pilar específico.

**Condição:**  
Usuário seleciona pilar no dropdown de filtros.

**Comportamento Esperado:**

**Interface:**
- Dropdown com lista de pilares ativos
- Opção "Todos os Pilares" (padrão)
- Ao selecionar pilar: recarregar lista apenas com rotinas daquele pilar
- Exibir contador: "X rotinas encontradas no pilar Y"

**Cenários:**
- **Happy Path:** Filtro aplicado, lista atualizada
- **Sem resultados:** Mensagem "Nenhuma rotina neste pilar"
- **Erro API:** Manter estado anterior, exibir toast de erro

**Restrições:**
- Filtro aplica-se apenas a rotinas ativas
- Dropdown só exibe pilares ativos

**Impacto Técnico:**
- Componente: `RotinaFilterComponent`
- Endpoint: `GET /pilares` (para popular dropdown)
- Endpoint: `GET /rotinas?pilarId=uuid`

**Referências:**
- Backend: [rotinas.md](rotinas.md#R-ROT-002)

---

### R-ROT-FRONT-003: Badge Visual "Modelo"

**Descrição:**  
Rotinas com `modelo: true` exibem badge visual distintivo.

**Condição:**  
Rotina possui campo `modelo: true`.

**Comportamento Esperado:**

**Interface:**
- Badge com texto "Modelo" ou "Padrão"
- Cor diferenciada (ex: azul primário)
- Tooltip: "Rotina padrão do sistema, auto-associada a novas empresas"
- Posicionamento: ao lado do nome da rotina

**Cenários:**
- **Happy Path:** Badge exibido para rotinas modelo
- **Não modelo:** Sem badge

**Restrições:**
- Badge é apenas visual (não clicável)
- Não afeta ordenação ou filtros

**Impacto Técnico:**
- Componente: `RotinaBadgeComponent` ou diretiva
- CSS: classe `.badge-modelo`

**Referências:**
- Padrão similar: [pilares.md](pilares.md#R-PIL-002) (contador)

---

### R-ROT-FRONT-004: Formulário de Criação de Rotina

**Descrição:**  
Apenas ADMINISTRADOR pode criar nova rotina vinculada a um pilar.

**Condição:**  
Usuário ADMINISTRADOR acessa formulário de criação.

**Comportamento Esperado:**

**Interface:**
- Campos obrigatórios: 
  - Nome (texto, 2-200 caracteres)
  - Pilar (dropdown com pilares ativos)
- Campos opcionais:
  - Descrição (textarea, 0-500 caracteres)
  - Ordem (número, >= 1)
  - Modelo (checkbox, padrão: false)
- Botão "Salvar"
- Validação client-side:
  - Nome: obrigatório, trim, min 2 caracteres
  - Pilar: obrigatório
  - Ordem: se fornecida, >= 1

**Cenários:**
- **Happy Path:** Rotina criada, toast "Rotina criada com sucesso", redirecionar para listagem
- **Erro validação:** Destacar campos inválidos, mensagens inline
- **Erro backend (409):** "Erro ao criar rotina" (ex: pilar inválido)
- **Erro rede:** Toast "Erro de conexão, tente novamente"

**Restrições:**
- Apenas ADMINISTRADOR vê botão "Nova Rotina"
- Outros perfis: redirecionados ou acesso negado (403)

**Impacto Técnico:**
- Componente: `RotinaFormComponent`
- Endpoint: `POST /rotinas`
- Guard: `RoleGuard` (ADMINISTRADOR)
- Service: `RotinasService.create(createRotinaDto)`

**Referências:**
- Backend: [rotinas.md](rotinas.md#R-ROT-001)
- Padrão similar: [pilares.md](pilares.md#R-PIL-001)

---

### R-ROT-FRONT-005: Edição de Rotina Existente

**Descrição:**  
ADMINISTRADOR pode editar rotina existente (todos os campos exceto ID e pilarId).

**Condição:**  
Usuário ADMINISTRADOR clica em "Editar" na listagem.

**Comportamento Esperado:**

**Interface:**
- Modal ou página de edição
- Campos editáveis:
  - Nome (obrigatório)
  - Descrição (opcional)
  - Ordem (opcional)
  - Modelo (checkbox)
- Campo **não editável**: Pilar (exibir apenas como texto)
- Botão "Salvar alterações"
- Validações idênticas à criação

**Cenários:**
- **Happy Path:** Rotina atualizada, toast "Rotina atualizada", fechar modal
- **Erro validação:** Mensagens inline
- **Erro 404:** "Rotina não encontrada" (pode ter sido deletada)
- **Erro 403:** "Sem permissão para editar"

**Restrições:**
- Não permite alterar pilar (regra de integridade)
- Não permite editar ID
- Apenas ADMINISTRADOR pode editar

**Impacto Técnico:**
- Componente: `RotinaFormComponent` (modo edição)
- Endpoint: `PATCH /rotinas/:id`
- Service: `RotinasService.update(id, updateRotinaDto)`

**Referências:**
- Backend: [rotinas.md](rotinas.md#R-ROT-004)
- Padrão similar: [pilares.md](pilares.md#R-PIL-004)

---

### R-ROT-FRONT-006: Desativação de Rotina (Soft Delete)

**Descrição:**  
ADMINISTRADOR pode desativar rotina (soft delete: `ativo: false`).

**Condição:**  
Usuário ADMINISTRADOR clica em "Desativar" ou ícone de lixeira.

**Comportamento Esperado:**

**Interface:**
- Modal de confirmação obrigatória:
  - Título: "Desativar rotina?"
  - Mensagem: "A rotina '[nome]' será desativada. Esta ação pode ser revertida."
  - Botões: "Cancelar" | "Desativar"
- Se rotina vinculada a empresas ativas:
  - Mensagem adicional: "⚠️ Esta rotina está em uso por X empresa(s). Empresas afetadas: [lista]"
  - Botão: "Ainda assim desativar"

**Cenários:**
- **Happy Path:** Rotina desativada, toast "Rotina desativada", removida da lista
- **Em uso (warning):** Modal exibe lista de empresas, confirma desativação
- **Erro 409:** "Não é possível desativar rotina em uso" (se backend bloquear)
- **Erro 404:** "Rotina não encontrada"

**Restrições:**
- Apenas ADMINISTRADOR pode desativar
- Soft delete (ativo: false), não deleta fisicamente
- Backend pode bloquear se houver dependências críticas (RotinaEmpresa ativa)

**Impacto Técnico:**
- Componente: `ConfirmDialogComponent`
- Endpoint: `DELETE /rotinas/:id`
- Service: `RotinasService.remove(id)`
- Validação backend: R-ROT-BE-002 (proposta)

**Referências:**
- Backend: [rotinas.md](rotinas.md#R-ROT-006)
- Padrão similar: [pilares.md](pilares.md#R-PIL-006)

---

### R-ROT-FRONT-007: Reordenação de Rotinas (Drag-and-Drop)

**Descrição:**  
ADMINISTRADOR pode reordenar rotinas dentro do mesmo pilar via drag-and-drop.

**Condição:**  
Usuário ADMINISTRADOR acessa listagem de rotinas filtrada por pilar.

**Comportamento Esperado:**

**Interface:**
- Ícone de "arrastar" (⋮⋮) ao lado de cada rotina
- Ao arrastar: feedback visual (cursor, placeholder)
- Ao soltar: ordem atualizada imediatamente
- Chamada API automática para persistir nova ordem
- Toast de confirmação: "Ordem atualizada com sucesso"

**Cenários:**
- **Happy Path:** Rotina arrastada, nova ordem salva, lista atualizada
- **Erro API:** Reverter ordem anterior, toast "Erro ao reordenar"
- **Sem filtro (todos pilares):** Reordenação desabilitada, tooltip "Selecione um pilar para reordenar"

**Restrições:**
- Apenas dentro do mesmo pilar (não permite mover entre pilares)
- Apenas ADMINISTRADOR vê controles de arrastar
- Requer filtro por pilar ativo

**Impacto Técnico:**
- Componente: `RotinasListComponent` + diretiva drag-and-drop
- Endpoint: `POST /rotinas/pilar/:pilarId/reordenar`
- Body: `{ ordemRotinas: [{ id, ordem }] }`
- Service: `RotinasService.reordenar(pilarId, ordemRotinas)`

**Referências:**
- Backend: [rotinas.md](rotinas.md#R-ROT-007)
- Padrão similar: [pilares-empresa.md](pilares-empresa.md#R-PILEMP-004)

---

### R-ROT-FRONT-008: Proteção de Acesso por Perfil (RBAC)

**Descrição:**  
Apenas ADMINISTRADOR pode criar, editar, desativar ou reordenar rotinas.

**Condição:**  
Usuário não-ADMINISTRADOR tenta acessar funcionalidades restritas.

**Comportamento Esperado:**

**Interface:**
- **ADMINISTRADOR:**
  - Vê botões: "Nova Rotina", "Editar", "Desativar", controles drag-and-drop
  - Acesso total a formulários
  
- **Outros perfis (GESTOR, COLABORADOR, LEITURA):**
  - Apenas visualização (listagem)
  - Botões de ação ocultos
  - Tentativa de acesso direto a rotas protegidas → redirecionamento ou 403

**Cenários:**
- **ADMINISTRADOR:** Acesso completo
- **Outros perfis:** Apenas leitura
- **Tentativa de acesso direto:** Guard bloqueia, redireciona para listagem ou dashboard

**Restrições:**
- Guards aplicados em todas as rotas de edição
- Backend valida novamente (camada dupla de segurança)

**Impacto Técnico:**
- Guards: `RoleGuard` (verificar perfil.codigo === 'ADMINISTRADOR')
- Diretivas: `*ngIf="isAdmin"` para botões
- Service: `AuthService.hasRole('ADMINISTRADOR')`

**Referências:**
- Backend: [rotinas.md](rotinas.md#R-ROT-001) (guards já implementados)
- Padrão similar: [pilares.md](pilares.md#R-PIL-001)

---

## 4. Regras Candidatas — Backend (Complementares)

### R-ROT-BE-001: Auto-associação de Rotinas Modelo

**Descrição:**  
Quando empresa vincular PilarEmpresa, rotinas com `modelo: true` desse pilar devem ser auto-criadas em RotinaEmpresa.

**Condição:**  
Novo registro criado em PilarEmpresa (empresa vincula pilar).

**Comportamento Esperado:**

**Backend:**
1. Trigger: `PilaresEmpresaService.vincularPilares()` ou similar
2. Query: `SELECT * FROM rotinas WHERE pilarId = :pilarId AND modelo = true AND ativo = true`
3. Para cada rotina modelo:
   - Criar RotinaEmpresa: 
     ```typescript
     {
       pilarEmpresaId: novoPilarEmpresaId,
       rotinaId: rotina.id,
       ordem: rotina.ordem,
       ativo: true,
       observacao: null
     }
     ```
4. Auditoria: registrar criação em batch

**Cenários:**
- **Happy Path:** Pilares modelo auto-associados com rotinas modelo
- **Sem rotinas modelo:** Apenas PilarEmpresa criado, sem RotinaEmpresa
- **Duplicata:** Ignorar (já vinculado anteriormente)

**Restrições:**
- Apenas rotinas com `modelo: true`
- Apenas rotinas ativas
- Respeita ordem original das rotinas

**Impacto Técnico:**
- Módulo: `PilaresEmpresaService`
- Método: `vincularPilares()` ou hook pós-criação
- Tabelas: `rotinas`, `rotinas_empresa`

**Referências:**
- Padrão similar: [empresas.md](empresas.md#R-EMP-004) (auto-associação de pilares modelo)

---

### R-ROT-BE-002: Validação de Dependência em Desativação

**Descrição:**  
Sistema valida se rotina possui RotinaEmpresa ativa antes de desativar. Se houver uso ativo, bloqueia ou alerta.

**Condição:**  
ADMINISTRADOR tenta desativar rotina via `DELETE /rotinas/:id`.

**Comportamento Esperado:**

**Backend (Opção 1 - Bloqueio Rígido):**
1. Query: `SELECT COUNT(*) FROM rotinas_empresa WHERE rotinaId = :id AND ativo = true`
2. Se count > 0:
   - `409 Conflict`
   - Mensagem: `"Não é possível desativar rotina em uso por X empresa(s)"`
   - Body: `{ empresasAfetadas: [{ id, nome }] }`

**Backend (Opção 2 - Permitir com Alerta):**
1. Query empresas afetadas
2. Retornar warning em response (200)
3. Frontend exibe confirmação adicional
4. Desativa mesmo assim (soft delete)

**Cenários:**
- **Sem uso:** Desativa normalmente
- **Em uso:** Bloqueia (opção 1) ou alerta (opção 2)
- **Erro query:** 500 Internal Server Error

**Restrições:**
- Apenas conta RotinaEmpresa com `ativo: true`
- Não deleta fisicamente (sempre soft delete)

**Impacto Técnico:**
- Módulo: `RotinasService`
- Método: `remove()`
- Query: JOIN com empresas para listar nomes

**Decisão pendente:**
- ⚠️ **Aprovação humana**: Bloqueio rígido ou permitir com alerta?

**Referências:**
- Padrão similar: [pilares.md](pilares.md#R-PIL-006) (validação de dependências)

---

## 5. Estrutura de Componentes Proposta

```
frontend/src/app/modules/rotinas/
├── rotinas.module.ts
├── rotinas-routing.module.ts
├── components/
│   ├── rotinas-list/
│   │   ├── rotinas-list.component.ts
│   │   ├── rotinas-list.component.html
│   │   └── rotinas-list.component.scss
│   ├── rotina-form/
│   │   ├── rotina-form.component.ts
│   │   ├── rotina-form.component.html
│   │   └── rotina-form.component.scss
│   └── rotina-filter/
│       ├── rotina-filter.component.ts
│       ├── rotina-filter.component.html
│       └── rotina-filter.component.scss
├── services/
│   └── rotinas.service.ts
├── models/
│   ├── rotina.model.ts
│   └── rotina-form.model.ts
└── guards/
    └── admin-only.guard.ts (ou reutilizar guard global)
```

---

## 6. Endpoints Backend Utilizados

| Método | Endpoint | Descrição | Guard |
|--------|----------|-----------|-------|
| GET | `/rotinas` | Listar rotinas ativas (filtro opcional) | Autenticado |
| GET | `/rotinas/:id` | Buscar rotina por ID | Autenticado |
| POST | `/rotinas` | Criar rotina | ADMINISTRADOR |
| PATCH | `/rotinas/:id` | Atualizar rotina | ADMINISTRADOR |
| DELETE | `/rotinas/:id` | Desativar rotina | ADMINISTRADOR |
| POST | `/rotinas/pilar/:pilarId/reordenar` | Reordenar rotinas | ADMINISTRADOR |
| GET | `/pilares` | Listar pilares (para dropdown) | Autenticado |

**Referência:** [rotinas.md](rotinas.md#1-visão-geral)

---

## 7. Validações de DTO (Frontend)

### CreateRotinaDto (Cliente)

```typescript
export interface CreateRotinaDto {
  nome: string;        // obrigatório, 2-200 caracteres
  pilarId: string;     // obrigatório, UUID válido
  descricao?: string;  // opcional, 0-500 caracteres
  ordem?: number;      // opcional, >= 1
  modelo?: boolean;    // opcional, padrão: false
}
```

### UpdateRotinaDto (Cliente)

```typescript
export interface UpdateRotinaDto {
  nome?: string;       // opcional, 2-200 caracteres
  descricao?: string;  // opcional, 0-500 caracteres
  ordem?: number;      // opcional, >= 1
  modelo?: boolean;    // opcional
}
```

---

## 8. Fluxo de Usuário (User Stories)

### US-1: Listar Rotinas
**Como** ADMINISTRADOR  
**Quero** visualizar todas as rotinas cadastradas  
**Para** ter visão geral do catálogo de rotinas

**Critérios de Aceitação:**
- ✅ Exibir rotinas ativas agrupadas por pilar
- ✅ Mostrar badge "Modelo" para rotinas padrão
- ✅ Permitir filtro por pilar
- ✅ Exibir contador de rotinas

---

### US-2: Criar Rotina
**Como** ADMINISTRADOR  
**Quero** criar nova rotina vinculada a um pilar  
**Para** expandir o catálogo de rotinas do sistema

**Critérios de Aceitação:**
- ✅ Formulário com campos: nome, pilar, descrição, ordem, modelo
- ✅ Validação de campos obrigatórios
- ✅ Feedback de sucesso/erro
- ✅ Redirecionar para listagem após criação

---

### US-3: Editar Rotina
**Como** ADMINISTRADOR  
**Quero** editar rotina existente  
**Para** corrigir informações ou ajustar ordenação

**Critérios de Aceitação:**
- ✅ Modal de edição com dados pré-preenchidos
- ✅ Não permitir alterar pilar
- ✅ Validação idêntica à criação
- ✅ Feedback de sucesso/erro

---

### US-4: Desativar Rotina
**Como** ADMINISTRADOR  
**Quero** desativar rotina obsoleta  
**Para** manter catálogo limpo sem deletar dados

**Critérios de Aceitação:**
- ✅ Confirmação obrigatória
- ✅ Alerta se rotina em uso por empresas
- ✅ Soft delete (ativo: false)
- ✅ Rotina removida da listagem

---

### US-5: Reordenar Rotinas
**Como** ADMINISTRADOR  
**Quero** reordenar rotinas dentro de um pilar  
**Para** ajustar prioridade ou sequência lógica

**Critérios de Aceitação:**
- ✅ Drag-and-drop funcional
- ✅ Feedback visual ao arrastar
- ✅ Persistência automática da nova ordem
- ✅ Funciona apenas com filtro por pilar ativo

---

## 9. Testes Frontend Sugeridos (E2E)

### Teste 1: Listagem de Rotinas
- **Dado** que existem 5 rotinas ativas no pilar "Estratégico"
- **Quando** acesso a listagem de rotinas
- **Então** devo ver 5 rotinas ordenadas por campo `ordem`

### Teste 2: Filtro por Pilar
- **Dado** que existem rotinas em 3 pilares diferentes
- **Quando** filtro por pilar "Financeiro"
- **Então** devo ver apenas rotinas do pilar "Financeiro"

### Teste 3: Criar Rotina (ADMINISTRADOR)
- **Dado** que sou ADMINISTRADOR
- **Quando** preencho formulário válido e clico em "Salvar"
- **Então** devo ver toast "Rotina criada com sucesso"
- **E** rotina deve aparecer na listagem

### Teste 4: Editar Rotina (ADMINISTRADOR)
- **Dado** que sou ADMINISTRADOR
- **Quando** edito nome da rotina e salvo
- **Então** devo ver toast "Rotina atualizada"
- **E** nome atualizado na listagem

### Teste 5: Desativar Rotina (ADMINISTRADOR)
- **Dado** que sou ADMINISTRADOR
- **Quando** clico em "Desativar" e confirmo
- **Então** rotina deve desaparecer da listagem

### Teste 6: Acesso Negado (GESTOR)
- **Dado** que sou GESTOR
- **Quando** acesso listagem de rotinas
- **Então** devo ver apenas visualização
- **E** não devo ver botões "Nova Rotina", "Editar", "Desativar"

### Teste 7: Reordenar Rotinas (ADMINISTRADOR)
- **Dado** que filtrei rotinas do pilar "Estratégico"
- **Quando** arrasto rotina da posição 3 para posição 1
- **Então** devo ver ordem atualizada
- **E** nova ordem deve persistir após reload

---

## 10. Observações Técnicas

### 10.1. Integração com Backend Existente

O backend do módulo Rotinas já está implementado:
- Endpoints CRUD completos
- Validações de negócio (pilar existente, soft delete)
- Auditoria configurada
- Guards de autorização (ADMINISTRADOR)

**Referência:** [rotinas.md](rotinas.md)

### 10.2. Padrões a Seguir

Este módulo deve seguir os padrões estabelecidos em:
- **Pilares (Frontend):** Estrutura de componentes, filtros, drag-and-drop
- **Empresas (Frontend):** RBAC, validações, multi-tenant (não aplicável aqui)

**Referências:**
- [docs/conventions/frontend.md](../conventions/frontend.md)
- [docs/handoffs/DEV-to-PATTERN-pilares-frontend.md](../handoffs/DEV-to-PATTERN-pilares-frontend.md)

### 10.3. Campo `modelo` — Auto-associação

**⚠️ Decisão pendente:**
- A regra R-ROT-BE-001 propõe auto-associação de rotinas modelo ao criar PilarEmpresa
- Similar à regra R-EMP-004 (pilares modelo)
- **Requer aprovação humana** antes de implementar no backend

### 10.4. Desativação de Rotina em Uso

**⚠️ Decisão pendente:**
- R-ROT-BE-002 propõe validação de dependências
- Opção 1: Bloqueio rígido (409 Conflict)
- Opção 2: Permitir com alerta
- **Requer decisão humana** sobre comportamento desejado

---

## 11. Próximos Passos

### 11.1. Aprovação Humana Obrigatória

Este documento **NÃO é oficial**.  
Requer revisão e aprovação explícita de:
- Regras de negócio (frontend e backend complementares)
- Comportamento de auto-associação (R-ROT-BE-001)
- Validação de dependências (R-ROT-BE-002)

### 11.2. Fluxo Após Aprovação

Conforme [FLOW.md](../flow.md):

1. ✅ **Extractor de Regras (Mode B)** — Este documento (CONCLUÍDO)
2. ⏳ **Reviewer de Regras** — Validar aderência e segurança (SE APLICÁVEL)
3. ⏳ **Dev Agent Disciplinado** — Implementar frontend conforme regras aprovadas
4. ⏳ **Pattern Enforcer** — Validar conformidade com padrões
5. ⏳ **QA Unitário** — Criar testes independentes
6. ⏳ **E2E Agent** — Validar fluxo completo (SE APLICÁVEL)

### 11.3. Handoff Template

Após aprovação, Dev Agent deve usar:
- [docs/conventions/handoff-template.md](../conventions/handoff-template.md)

---

## 12. Referências Normativas

Conforme [DOCUMENTATION_AUTHORITY.md](../DOCUMENTATION_AUTHORITY.md):

**Fontes de Verdade:**
- [docs/business-rules/pilares.md](pilares.md)
- [docs/business-rules/empresas.md](empresas.md)
- [docs/business-rules/rotinas.md](rotinas.md)
- [docs/architecture/frontend.md](../architecture/frontend.md)
- [docs/conventions/frontend.md](../conventions/frontend.md)
- [docs/flow.md](../flow.md)

**Padrões de Implementação:**
- [docs/handoffs/DEV-to-PATTERN-pilares-gaps.md](../handoffs/DEV-to-PATTERN-pilares-gaps.md)
- [docs/handoffs/DEV-to-PATTERN-empresas-security.md](../handoffs/DEV-to-PATTERN-empresas-security.md)

---

## 13. Glossário

- **Rotina:** Atividade padrão vinculada a um pilar (ex: "Reunião semanal de alinhamento")
- **Rotina Modelo:** Rotina com `modelo: true`, reutilizável por múltiplas empresas
- **RotinaEmpresa:** Instância de rotina vinculada a empresa específica (via PilarEmpresa)
- **NotaRotina:** Avaliação de maturidade (0-10) + criticidade (ALTO/MEDIO/BAIXO)
- **Soft Delete:** Desativação lógica (`ativo: false`), sem deleção física

---

## 🚦 Status Final

**⚠️ REGRAS CANDIDATAS**  
**Aguardando aprovação humana explícita**

**Próximo agente:** Reviewer de Regras (opcional) ou Dev Agent Disciplinado (após aprovação)

---

**Assinado por:** Extractor de Regras (Mode B)  
**Data:** 25/12/2024  
**Conforme:** `/.github/agents/1-Extractor_Regras.md`
