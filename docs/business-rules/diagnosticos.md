# Regras de Negócio — Diagnósticos

**Módulo:** Diagnósticos  
**Backend:** `backend/src/modules/diagnosticos/`  
**Frontend:** `frontend/src/app/views/pages/diagnostico-notas/`  
**Última extração:** 02/01/2026  
**Agente:** Extractor de Regras

---

## 1. Visão Geral

O módulo Diagnósticos é responsável por:
- **Buscar estrutura completa** de pilares → rotinas → notas por empresa (diagnóstico empresarial)
- **Upsert de notas** com auto-save (criar ou atualizar notas de rotinas)
- **Validação multi-tenant** estrita (ADMINISTRADOR acessa tudo, outros apenas sua empresa)
- **Auditoria completa** de criação e atualização de notas
- **Interface de diagnóstico** com auto-save, cache local e cálculo de progresso
- **Gestão de rotinas customizadas** por empresa
- **Definição de responsáveis** por pilar em cada empresa

**Entidades principais:**
- NotaRotina (avaliação de rotinas com nota 1-10 e criticidade)
- PilarEmpresa (vinculação empresa-pilar com responsável)
- RotinaEmpresa (vinculação rotina-pilar por empresa)

**Endpoints implementados:**
- `GET /empresas/:empresaId/diagnostico/notas` — Buscar estrutura completa de diagnóstico (todos os perfis)
- `PATCH /rotinas-empresa/:rotinaEmpresaId/nota` — Atualizar ou criar nota (ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR)

**Status do módulo:** ✅ **IMPLEMENTADO** (backend + frontend completos)

---

## 2. Arquitetura do Módulo

### 2.1. Backend

**Arquivos principais:**
- `diagnosticos.service.ts` — Lógica de negócio
- `diagnosticos.controller.ts` — Endpoints REST
- `diagnosticos.module.ts` — Módulo NestJS
- DTOs de validação (update-nota-rotina.dto.ts)

**Integrações:**
- PrismaService — Acesso ao banco de dados
- AuditService — Registro de operações CUD

### 2.2. Frontend

**Arquivos principais:**
- `diagnostico-notas.component.ts` — Componente principal (590 linhas)
- `nova-rotina-modal.component.ts` — Modal criação de rotinas customizadas
- `responsavel-pilar-modal.component.ts` — Modal definição de responsáveis
- `rotinas-pilar-modal.component.ts` — Modal gestão de rotinas do pilar

**Funcionalidades:**
- Auto-save com debounce (1000ms)
- Cache local de valores em edição
- Cálculo de progresso por pilar (0-100%)
- Cálculo de média de notas por pilar
- Validação em tempo real (nota 1-10, criticidade obrigatória)
- Retry automático em caso de erro (até 3 tentativas)
- Indicadores visuais de salvamento e timestamp do último save
- Suporte a perfis read-only (COLABORADOR e LEITURA)

---

## 3. Entidades

### 3.1. NotaRotina (IMPLEMENTADO)

### 3.1. NotaRotina (IMPLEMENTADO)

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| rotinaEmpresaId | String | FK para RotinaEmpresa |
| nota | Float? | Avaliação de 1 a 10 (validado no DTO) |
| criticidade | Criticidade? | Nível de criticidade (ALTO, MEDIO, BAIXO) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Enum Criticidade:**
- ALTO
- MEDIO  
- BAIXO

**Relações:**
- `rotinaEmpresa`: RotinaEmpresa (rotina avaliada)

**Índices:**
- `[rotinaEmpresaId]`

**Comportamento:**
- Sistema mantém histórico de notas (não sobrescreve, cria nova)
- Endpoint `upsertNotaRotina` atualiza a nota mais recente ou cria nova
- Frontend exibe apenas a nota mais recente (`orderBy: { createdAt: 'desc' }, take: 1`)

---

## 4. Regras Implementadas

### R-DIAG-001: Buscar Estrutura Completa de Diagnóstico

**Descrição:** Endpoint retorna estrutura hierárquica completa de pilares → rotinas → notas de uma empresa.

**Implementação:**
- **Endpoint:** `GET /empresas/:empresaId/diagnostico/notas` (todos os perfis)
- **Método:** `DiagnosticosService.getDiagnosticoByEmpresa()`

**Validação Multi-Tenant:**
```typescript
if (user.perfil?.codigo !== 'ADMINISTRADOR' && user.empresaId !== empresaId) {
  throw new ForbiddenException('Você não pode acessar dados de outra empresa');
}
```

**Filtros Aplicados:**
```typescript
where: {
  empresaId,
  ativo: true,
  pilar: { ativo: true }, // Cascata lógica
}
```

**Estrutura Retornada:**
```typescript
PilarEmpresa[] {
  id, ordem, responsavelId,
  pilar: { id, nome, descricao },
  responsavel: { id, nome, email, cargo } | null,
  rotinasEmpresa: RotinaEmpresa[] {
    id, ordem,
    rotina: { id, nome, descricao },
    notas: NotaRotina[] (apenas a mais recente)
  }
}
```

**Ordenação:**
- Pilares: por `ordem` ASC
- Rotinas: por `ordem` ASC dentro de cada pilar
- Notas: mais recente primeiro (`createdAt` DESC, `take: 1`)

**Include Completo:**
- Dados do pilar
- Responsável do pilar (se definido)
- Rotinas ativas do pilar
- Nota mais recente de cada rotina

**Perfis autorizados:** Todos (ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR, LEITURA)

**Arquivo:** [diagnosticos.service.ts](../../backend/src/modules/diagnosticos/diagnosticos.service.ts#L40-L90)

---

### R-DIAG-002: Upsert de Nota com Auto-Save

**Descrição:** Endpoint cria ou atualiza nota de uma rotina. Se já existe nota mais recente, atualiza. Senão, cria nova.

**Implementação:**
- **Endpoint:** `PATCH /rotinas-empresa/:rotinaEmpresaId/nota` (ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR)
- **Método:** `DiagnosticosService.upsertNotaRotina()`
- **DTO:** UpdateNotaRotinaDto

**Validação Multi-Tenant:**
```typescript
const rotinaEmpresa = await this.prisma.rotinaEmpresa.findUnique({
  where: { id: rotinaEmpresaId },
  include: { pilarEmpresa: { select: { empresaId: true } } },
});

if (user.perfil?.codigo !== 'ADMINISTRADOR' && 
    user.empresaId !== rotinaEmpresa.pilarEmpresa.empresaId) {
  throw new ForbiddenException('Você não pode acessar dados de outra empresa');
}
```

**Lógica de Upsert:**
```typescript
// Buscar nota mais recente
const notaExistente = await this.prisma.notaRotina.findFirst({
  where: { rotinaEmpresaId },
  orderBy: { createdAt: 'desc' },
});

if (notaExistente) {
  // Atualizar nota existente
  nota = await this.prisma.notaRotina.update({
    where: { id: notaExistente.id },
    data: {
      nota: updateDto.nota,
      criticidade: updateDto.criticidade,
      updatedBy: user.id,
    },
  });
} else {
  // Criar nova nota
  nota = await this.prisma.notaRotina.create({
    data: {
      rotinaEmpresaId,
      nota: updateDto.nota,
      criticidade: updateDto.criticidade,
      createdBy: user.id,
      updatedBy: user.id,
    },
  });
}
```

**Validação de DTO:**
- `nota`: number, required, min: 1, max: 10
- `criticidade`: enum (ALTO, MEDIO, BAIXO), required

**Auditoria:**
- **UPDATE**: Registra `dadosAntes` e `dadosDepois`
- **CREATE**: Registra apenas `dadosDepois` + `rotinaEmpresaId`

**Retorno:**
```typescript
{
  message: 'Nota atualizada com sucesso' | 'Nota criada com sucesso',
  nota: NotaRotina (com includes: rotinaEmpresa, rotina, pilarEmpresa, pilar)
}
```

**Perfis autorizados:** ADMINISTRADOR, CONSULTOR, GESTOR, COLABORADOR (LEITURA **não** pode salvar)

**Arquivo:** [diagnosticos.service.ts](../../backend/src/modules/diagnosticos/diagnosticos.service.ts#L92-L196)

---

### RA-DIAG-001: Auditoria Completa de Notas

**Descrição:** Todas operações CREATE e UPDATE em NotaRotina são auditadas.

**Implementação:**
- **Serviço:** AuditService
- **Entidade:** 'NotaRotina'

**Dados auditados:**
- usuarioId, usuarioNome, usuarioEmail
- entidade: 'NotaRotina'
- entidadeId: ID da nota
- acao: CREATE | UPDATE
- dadosAntes (em UPDATE): { nota, criticidade }
- dadosDepois (sempre): { nota, criticidade, rotinaEmpresaId (em CREATE) }

**Cobertura:**
- ✅ CREATE (criação de nota)
- ✅ UPDATE (atualização de nota)
- ❌ DELETE (não implementado — notas não são deletadas, apenas historico mantido)

**Arquivo:** [diagnosticos.service.ts](../../backend/src/modules/diagnosticos/diagnosticos.service.ts#L138-L148, L181-L191)

---

## 5. Regras de Interface (Frontend)

### UI-DIAG-001: Tela de Diagnóstico com Auto-Save

**Descrição:** Interface principal de diagnóstico empresarial com auto-save inteligente.

**Acesso:** Todos os perfis autenticados  
**Rota:** `/diagnostico/notas`

**Localização:** `frontend/src/app/views/pages/diagnostico-notas/`

**Funcionalidades:**

1. **Seleção de Empresa:**
   - ADMINISTRADOR: ng-select com lista de empresas ativas
   - Outros perfis: Empresa pré-selecionada (empresaId do usuário)

2. **Estrutura Hierárquica:**
   - Accordion expansível por pilar
   - Todos os pilares inicialmente expandidos
   - Rotinas listadas dentro de cada pilar (ordenadas por `ordem`)

3. **Auto-Save com Debounce:**
   - Debounce de 1000ms após última alteração
   - Salva automaticamente nota + criticidade
   - Cache local de valores em edição
   - Indicador visual "Salvando..." durante operação

4. **Validações em Tempo Real:**
   - Nota: obrigatória, 1-10
   - Criticidade: obrigatória (ALTO, MEDIO, BAIXO)
   - Ambos os campos devem estar preenchidos para salvar
   - Validação silenciosa (aguarda usuário preencher ambos)

5. **Retry Automático:**
   - Até 3 tentativas em caso de erro
   - Delay de 2 segundos entre tentativas
   - Toast de erro persistente após falha final

6. **Indicadores Visuais:**
   - Contador de saves em andamento (`savingCount`)
   - Timestamp do último salvamento bem-sucedido
   - Progress bar por pilar (0-100%)
   - Média de notas por pilar (0-10)
   - Badges de criticidade com cores (danger, warning, success)

---

### UI-DIAG-002: Cálculo de Progresso por Pilar

**Descrição:** Algoritmo de cálculo de percentual de preenchimento de diagnóstico.

**Lógica:**
```typescript
getPilarProgress(pilar: PilarEmpresa): number {
  let totalProgress = 0;
  const totalRotinas = pilar.rotinasEmpresa.length;

  pilar.rotinasEmpresa.forEach(rotina => {
    const hasNota = nota !== null && nota !== undefined;
    const hasCriticidade = criticidade !== null && criticidade !== undefined;

    if (hasNota && hasCriticidade) {
      totalProgress += 1; // 100% da rotina
    } else if (hasNota || hasCriticidade) {
      totalProgress += 0.5; // 50% da rotina
    }
    // Nenhum preenchido = 0%
  });

  return (totalProgress / totalRotinas) * 100;
}
```

**Interpretação:**
- Rotina com nota E criticidade = 100%
- Rotina com apenas nota OU criticidade = 50%
- Rotina sem nada = 0%
- Pilar sem rotinas = 0%

**Exibição:**
- Progress bar Bootstrap com variante de cor:
  - 0-33%: `bg-danger`
  - 34-66%: `bg-warning`
  - 67-100%: `bg-success`

---

### UI-DIAG-003: Cálculo de Média de Notas

**Descrição:** Algoritmo de cálculo de média aritmética das notas de um pilar.

**Lógica:**
```typescript
getPilarMediaNotas(pilar: PilarEmpresa): number {
  const rotinasComNota = pilar.rotinasEmpresa.filter(rotina => 
    rotina.nota !== null && rotina.nota !== undefined
  );

  if (rotinasComNota.length === 0) return 0;

  const somaNotas = rotinasComNota.reduce((soma, rotina) => 
    soma + (rotina.nota || 0), 0
  );

  return somaNotas / rotinasComNota.length;
}
```

**Interpretação:**
- Considera apenas rotinas com nota preenchida
- Ignora rotinas sem nota (não afeta média)
- Retorna 0 se nenhuma rotina tiver nota
- Valor entre 0 e 10

**Exibição:**
- Badge com cor baseada na média:
  - 0-4: `bg-danger`
  - 5-7: `bg-warning`
  - 8-10: `bg-success`
- Precisão de 1 casa decimal (ex: 7.5)

---

### UI-DIAG-004: Cache Local e Priorização de Valores

**Descrição:** Estratégia de cache para melhorar UX durante edição.

**Implementação:**
```typescript
private notasCache = new Map<string, { nota: number | null, criticidade: string | null }>();

getNotaAtual(rotinaEmpresa: RotinaEmpresa): number | null {
  // Priorizar cache local (valores em edição)
  const cached = this.notasCache.get(rotinaEmpresa.id);
  if (cached?.nota !== undefined && cached?.nota !== null) {
    return cached.nota;
  }
  // Fallback: valor salvo no backend
  return rotinaEmpresa.notas?.[0]?.nota ?? null;
}
```

**Justificativa:**
- Evita "piscar" de valores durante digitação
- Mantém valores visíveis mesmo antes de salvar
- Sincroniza com backend após salvamento bem-sucedido
- Limpa cache ao recarregar dados

**Ciclo de Vida:**
1. Usuário edita campo → valor vai para cache
2. Debounce completa → salva no backend
3. Backend retorna sucesso → atualiza dados locais + mantém cache
4. Usuário recarrega página → limpa cache, mostra dados do backend

---

### UI-DIAG-005: Perfis Read-Only

**Descrição:** Restrição de edição para perfis específicos.

**Lógica:**
```typescript
get isReadOnlyPerfil(): boolean {
  const perfilCodigo = user.perfil?.codigo;
  return ['COLABORADOR', 'LEITURA'].includes(perfilCodigo);
}
```

**Comportamento:**
- **COLABORADOR e LEITURA**: Inputs desabilitados, sem auto-save
- **GESTOR, CONSULTOR, ADMINISTRADOR**: Podem editar e salvar

**Diferença em relação ao backend:**
- Backend: COLABORADOR **pode** salvar notas
- Frontend: COLABORADOR **não pode** editar (apenas leitura)
- Decisão de UX: proteger COLABORADOR de edições acidentais no frontend

---

### UI-DIAG-006: Gestão de Pilares da Empresa

**Descrição:** Botão "Gerenciar Pilares" abre modal reutilizado de empresas.

**Implementação:**
- Componente: `PilaresEmpresaModalComponent` (reutilizado)
- Trigger: Botão no cabeçalho da tela
- Callback: `onPilaresModificados()` → recarrega diagnóstico

**Funcionalidades (herdadas):**
- Adicionar/remover pilares
- Reordenar pilares via drag & drop
- Validação multi-tenant

**Apenas para:** ADMINISTRADOR e GESTOR

---

### UI-DIAG-007: Definição de Responsável por Pilar

**Descrição:** Modal para atribuir usuário responsável pelo acompanhamento de um pilar.

**Implementação:**
- Componente: `ResponsavelPilarModalComponent`
- Localização: `frontend/src/app/views/pages/diagnostico-notas/responsavel-pilar-modal/`
- Trigger: Botão "Definir Responsável" no card do pilar

**Funcionalidades:**
- ng-select com usuários da empresa
- Exibe nome + email de cada usuário
- Permite remover responsável (seleção null)
- Callback: `onResponsavelAtualizado()` → recarrega diagnóstico

**Backend Correspondente:**
- Endpoint: `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/responsavel`
- Validação: Responsável deve pertencer à mesma empresa

**Apenas para:** ADMINISTRADOR e GESTOR

---

### UI-DIAG-008: Criação de Rotina Customizada

**Descrição:** Modal para criar nova rotina não-modelo vinculada ao pilar da empresa.

**Implementação:**
- Componente: `NovaRotinaModalComponent`
- Localização: `frontend/src/app/views/pages/diagnostico-notas/nova-rotina-modal/`
- Trigger: Botão "Nova Rotina" no card do pilar

**Campos:**
- **Nome**: obrigatório, min 3 caracteres
- **Descrição**: opcional, textarea
- **PilarId**: automático (do pilar selecionado)
- **Modelo**: false (sempre customizada)
- **PilarEmpresaId**: automático (cria vínculo RotinaEmpresa automaticamente)

**Fluxo:**
```typescript
POST /rotinas
{
  nome: 'Nova Rotina X',
  descricao: 'Descrição...',
  pilarId: 'uuid-pilar',
  modelo: false,
  pilarEmpresaId: 'uuid-pilar-empresa' // ← Vínculo automático
}
```

**Backend:**
- Cria Rotina no catálogo global
- Cria RotinaEmpresa automaticamente (transação)
- Calcula `ordem` automaticamente (próxima disponível)
- Valida multi-tenant se user for GESTOR

**Callback:** `onRotinaCriada()` → recarrega diagnóstico

**Apenas para:** ADMINISTRADOR e GESTOR

---

### UI-DIAG-009: Gestão de Rotinas do Pilar

**Descrição:** Modal para adicionar/remover/reordenar rotinas de um pilar da empresa.

**Implementação:**
- Componente: `RotinasPilarModalComponent`
- Localização: `frontend/src/app/views/pages/diagnostico-notas/rotinas-pilar-modal/`
- Trigger: Botão "Editar Rotinas" no card do pilar

**Funcionalidades:**
- Listar rotinas vinculadas ao PilarEmpresa
- Adicionar rotinas do catálogo global
- Remover rotinas (delete RotinaEmpresa)
- Reordenar via drag & drop
- Validação multi-tenant

**Backend Correspondente:**
- Endpoints em `PilaresEmpresaService`:
  - `GET /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas`
  - `POST /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas`
  - `DELETE /empresas/:empresaId/pilares/rotinas/:rotinaEmpresaId`
  - `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas/reordenar`

**Callback:** `onRotinasModificadas()` → recarrega diagnóstico

**Apenas para:** ADMINISTRADOR e GESTOR

---

## 6. Validações

### 6.1. UpdateNotaRotinaDto

**Campos:**
- `nota`: @IsNumber(), @IsNotEmpty(), @Min(1), @Max(10)
- `criticidade`: @IsEnum(Criticidade), @IsNotEmpty()

**Validações implementadas:**
- Nota obrigatória, entre 1 e 10
- Criticidade obrigatória (ALTO, MEDIO, BAIXO)
- Mensagens de erro customizadas

**Arquivo:** [update-nota-rotina.dto.ts](../../backend/src/modules/diagnosticos/dto/update-nota-rotina.dto.ts)

---

## 7. Comportamentos Condicionais

### 7.1. Priorização de Cache vs Backend

**Condição:** Valores em edição no frontend

**Comportamento:**
- **Getters** priorizam cache local
- **Após save bem-sucedido**, atualiza dados locais com resposta do backend
- **Ao recarregar página**, limpa cache e usa dados do backend

**Justificativa:**
- Evita UX ruim (valores "piscando")
- Mantém sincronização eventual com backend

---

### 7.2. Retry Automático em Caso de Erro

**Condição:** Erro HTTP no auto-save

**Comportamento:**
- Aguarda 2 segundos
- Tenta novamente (até 3 vezes)
- Se falhar 3x, exibe toast de erro persistente (5000ms)

**Justificativa:**
- Resiliência a falhas temporárias de rede
- Não perde dados do usuário

---

### 7.3. Validação Silenciosa de Campos Obrigatórios

**Condição:** Usuário editando campos

**Comportamento:**
- **NÃO salva** se apenas nota ou apenas criticidade preenchidos
- **NÃO exibe erro** (aguarda silenciosamente)
- **Salva automaticamente** quando ambos os campos estão completos

**Justificativa:**
- UX não intrusiva
- Evita salvamentos parciais inválidos

---

### 7.4. Bloqueio de Edição para COLABORADOR (Frontend)

**Condição:** Perfil do usuário é COLABORADOR ou LEITURA

**Comportamento Frontend:**
- Inputs desabilitados
- Auto-save desativado
- Botões de gestão ocultados

**Comportamento Backend:**
- COLABORADOR **pode** salvar notas (endpoint permite)
- LEITURA **não pode** salvar (endpoint bloqueia)

**Discrepância:**
- Frontend mais restritivo que backend para COLABORADOR
- Decisão de UX: proteger de edições acidentais

---

### 7.5. Cascata Lógica de Pilares Inativos

**Condição:** Pilar desativado (`Pilar.ativo = false`)

**Comportamento:**
- Filtro em `getDiagnosticoByEmpresa`: `pilar: { ativo: true }`
- Pilares inativos não aparecem no diagnóstico
- PilarEmpresa.ativo pode continuar `true` (histórico preservado)

**Justificativa:**
- Cascata lógica (não física)
- Permite reativação sem perder vinculação

---

## 8. Ausências ou Ambiguidades

### 8.1. Paginação Ausente

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Endpoint `getDiagnosticoByEmpresa` retorna TODOS os pilares e rotinas da empresa
- Sem paginação, filtros ou busca
- Pode ser problemático com muitas rotinas

**TODO:**
- Considerar paginação se empresa tiver >100 rotinas
- Ou implementar scroll infinito no frontend

---

### 8.2. Histórico de Notas Não Exposto

**Status:** ⚠️ IMPLEMENTADO NO BACKEND, NÃO NO FRONTEND

**Descrição:**
- Schema permite múltiplas `NotaRotina` por `RotinaEmpresa` (histórico)
- Backend cria novas notas (não sobrescreve)
- Frontend exibe apenas a mais recente (`take: 1`)
- Não há interface para visualizar histórico

**TODO:**
- Implementar endpoint `GET /rotinas-empresa/:id/notas` (histórico completo)
- Implementar modal frontend com histórico de notas

---

### 8.3. PilarEvolucao Não Implementado

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Entidade `PilarEvolucao` existe no schema
- Permite snapshots temporais da média de notas
- Nenhum endpoint ou lógica implementada
- Frontend calcula média em tempo real (não persiste)

**TODO:**
- Implementar job agendado para criar snapshots mensais
- Endpoint para visualizar evolução histórica

---

### 8.4. AgendaReuniao Não Implementado

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- Entidade `AgendaReuniao` existe no schema
- DTO criado mas sem endpoints
- Funcionalidade planejada mas não desenvolvida

**TODO:**
- CRUD completo de AgendaReuniao
- Integração com diagnóstico (reuniões relacionadas a pilares?)

---

## 9. Sumário de Regras

| ID | Descrição | Status |
|----|-----------|--------|
| **R-DIAG-001** | Buscar estrutura completa de diagnóstico | ✅ Implementado |
| **R-DIAG-002** | Upsert de nota com auto-save | ✅ Implementado |
| **RA-DIAG-001** | Auditoria completa de notas | ✅ Implementado |

**Frontend (UI):**

| ID | Descrição | Status |
|----|-----------|--------|
| **UI-DIAG-001** | Tela de diagnóstico com auto-save | ✅ Implementado |
| **UI-DIAG-002** | Cálculo de progresso por pilar | ✅ Implementado |
| **UI-DIAG-003** | Cálculo de média de notas | ✅ Implementado |
| **UI-DIAG-004** | Cache local e priorização de valores | ✅ Implementado |
| **UI-DIAG-005** | Perfis read-only | ✅ Implementado |
| **UI-DIAG-006** | Gestão de pilares da empresa | ✅ Implementado |
| **UI-DIAG-007** | Definição de responsável por pilar | ✅ Implementado |
| **UI-DIAG-008** | Criação de rotina customizada | ✅ Implementado |
| **UI-DIAG-009** | Gestão de rotinas do pilar | ✅ Implementado |

**Pendências:**
- ❌ Paginação de diagnóstico
- ⚠️ Histórico de notas (backend pronto, frontend ausente)
- ❌ PilarEvolucao (snapshots temporais)
- ❌ AgendaReuniao (CRUD completo)

---

## 10. Referências

**Módulo Diagnósticos:**
- [diagnosticos.service.ts](../../backend/src/modules/diagnosticos/diagnosticos.service.ts)
- [diagnosticos.controller.ts](../../backend/src/modules/diagnosticos/diagnosticos.controller.ts)
- [update-nota-rotina.dto.ts](../../backend/src/modules/diagnosticos/dto/update-nota-rotina.dto.ts)
- [diagnosticos.module.ts](../../backend/src/modules/diagnosticos/diagnosticos.module.ts)

**Frontend:**
- [diagnostico-notas.component.ts](../../frontend/src/app/views/pages/diagnostico-notas/diagnostico-notas.component.ts)
- [nova-rotina-modal.component.ts](../../frontend/src/app/views/pages/diagnostico-notas/nova-rotina-modal/nova-rotina-modal.component.ts)
- [responsavel-pilar-modal.component.ts](../../frontend/src/app/views/pages/diagnostico-notas/responsavel-pilar-modal/responsavel-pilar-modal.component.ts)
- [rotinas-pilar-modal.component.ts](../../frontend/src/app/views/pages/diagnostico-notas/rotinas-pilar-modal/rotinas-pilar-modal.component.ts)
- [diagnostico-notas.service.ts](../../frontend/src/app/core/services/diagnostico-notas.service.ts)

**Schema:**
- [schema.prisma](../../backend/prisma/schema.prisma) (NotaRotina, PilarEvolucao)

**Dependências:**
- AuditService (auditoria de operações)
- PrismaService (acesso ao banco)
- PilaresEmpresaService (gestão de pilares e rotinas)
- RotinasService (criação de rotinas customizadas)
- JwtAuthGuard (autenticação)
- RolesGuard (autorização por perfil)

---

**Data de extração:** 02/01/2026  
**Agente:** Extractor de Regras (Modo A - Reverse Engineering)  
**Status:** ✅ **Backend e Frontend Completamente Implementados**

**Observação final:**  
Este módulo transforma o catálogo de pilares e rotinas em um diagnóstico empresarial funcional, com auto-save, validações em tempo real, cálculos de progresso e múltiplas modalidades de gestão (pilares, rotinas, responsáveis). A implementação está completa e pronta para uso.

### 4.2. CreateRotinaEmpresaDto

**Campos:**
- `pilarEmpresaId`: @IsUUID(), @IsNotEmpty()
- `rotinaId`: @IsUUID(), @IsNotEmpty()
- `observacao`: @IsString(), @IsOptional(), @Length(0, 1000)

**Validações:**
- IDs obrigatórios e devem ser UUIDs válidos
- Observação opcional, máximo 1000 caracteres

**Arquivo:** [create-rotina-empresa.dto.ts](../../backend/src/modules/diagnosticos/dto/create-rotina-empresa.dto.ts)

---

### 4.3. CreateNotaRotinaDto

**Campos:**
- `rotinaEmpresaId`: @IsUUID(), @IsNotEmpty()
- `nota`: @IsNumber(), @IsOptional(), @Min(0), @Max(10)
- `criticidade`: @IsEnum(Criticidade), @IsOptional()

**Validações:**
- rotinaEmpresaId obrigatório e UUID válido
- Nota opcional, entre 0 e 10
- Criticidade opcional, valores: ALTO, MEDIO, BAIXO

**Enum local:**
```typescript
enum Criticidade {
  ALTO = 'ALTO',
  MEDIO = 'MEDIO',
  BAIXO = 'BAIXO',
}
```

**Arquivo:** [create-nota-rotina.dto.ts](../../backend/src/modules/diagnosticos/dto/create-nota-rotina.dto.ts)

---

### 4.4. CreatePilarEvolucaoDto

**Campos:**
- `pilarEmpresaId`: @IsUUID(), @IsNotEmpty()
- `mediaNotas`: @IsNumber(), @IsOptional(), @Min(0), @Max(10)

**Validações:**
- pilarEmpresaId obrigatório e UUID válido
- mediaNotas opcional, entre 0 e 10

**Arquivo:** [create-pilar-evolucao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-pilar-evolucao.dto.ts)

---

### 4.5. CreateAgendaReuniaoDto

**Campos:**
- `titulo`: @IsString(), @IsNotEmpty(), @Length(2, 200)
- `descricao`: @IsString(), @IsOptional(), @Length(0, 1000)
- `dataHora`: @IsDateString(), @IsNotEmpty()
- `duracao`: @IsInt(), @IsOptional(), @Min(1)
- `local`: @IsString(), @IsOptional(), @Length(0, 200)
- `link`: @IsUrl(), @IsOptional()
- `usuarioId`: @IsUUID(), @IsNotEmpty()

**Validações:**
- Título obrigatório, 2-200 caracteres
- Descrição opcional, máximo 1000 caracteres
- dataHora obrigatória, deve ser ISO 8601 válido
- Duração opcional, mínimo 1 minuto
- Local opcional, máximo 200 caracteres
- Link opcional, deve ser URL válida
- usuarioId obrigatório e UUID válido

**Arquivo:** [create-agenda-reuniao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-agenda-reuniao.dto.ts)

---

### 4.6. DTOs de Update

Todos os DTOs de update usam `PartialType`:

- `UpdatePilarEmpresaDto`
- `UpdateRotinaEmpresaDto`
- `UpdateNotaRotinaDto`
- `UpdatePilarEvolucaoDto`
- `UpdateAgendaReuniaoDto`

**Comportamento:**
- Todos os campos tornam-se opcionais
- Mantêm as mesmas validações quando fornecidos

---

## 5. Regras Implementadas

⚠️ **NENHUMA REGRA IMPLEMENTADA**

**Motivo:** Módulo não possui service ou controller.

**DTOs prontos para:**
- ✅ Validação de entrada
- ✅ Documentação Swagger
- ❌ Sem lógica de negócio

---

## 6. Validações

### 6.1. Validações de DTO Prontas

**Prontas mas não usadas:**
- ✅ Validação de UUIDs
- ✅ Validação de ranges (nota 0-10)
- ✅ Validação de enum (criticidade)
- ✅ Validação de datas (ISO 8601)
- ✅ Validação de URLs
- ✅ Validação de comprimento de strings

**Sem validação de lógica de negócio:**
- ❌ Validação de existência de empresaId/pilarId
- ❌ Validação de unicidade [empresaId, pilarId]
- ❌ Validação de existência de pilarEmpresaId/rotinaId
- ❌ Validação de múltiplas notas para mesma rotinaEmpresa
- ❌ Validação de reunião no passado

---

## 7. Comportamentos Condicionais

⚠️ **NENHUM COMPORTAMENTO IMPLEMENTADO**

**Comportamentos esperados (não implementados):**
- Soft delete em PilarEmpresa
- Histórico de NotaRotina
- Cálculo automático de mediaNotas em PilarEvolucao
- Validação de conflito de horários em AgendaReuniao

---

## 8. Ausências ou Ambiguidades

### 8.1. Módulo Não Implementado

**Status:** 🚧 **CRÍTICO**

**Descrição:**
- Módulo possui apenas DTOs
- Nenhum service ou controller
- Entidades existem no schema mas não são gerenciadas

**Impacto:**
- Empresas não podem vincular pilares
- Rotinas não podem ser avaliadas
- Evolução não é rastreada
- Reuniões não podem ser agendadas

**TODO:**
- Implementar DiagnosticosService
- Implementar DiagnosticosController
- Implementar endpoints CRUD para todas as entidades
- Adicionar auditoria

---

### 8.2. Vinculação de Pilares a Empresas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- PilarEmpresa existe no schema
- DTO pronto
- Sem endpoint para vincular

**Endpoints esperados:**
```
POST /empresas/:empresaId/pilares
GET /empresas/:empresaId/pilares
DELETE /empresas/:empresaId/pilares/:pilarId
```

**TODO:**
- Implementar vinculação de pilares
- Validar existência de empresa e pilar
- Validar unicidade [empresaId, pilarId]
- Auditar vinculação

---

### 8.3. Vinculação de Rotinas a Empresas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- RotinaEmpresa existe no schema
- DTO pronto (com observação customizável)
- Sem endpoint para vincular

**Endpoints esperados:**
```
POST /empresas/:empresaId/pilares/:pilarId/rotinas
GET /empresas/:empresaId/pilares/:pilarId/rotinas
PATCH /empresas/:empresaId/rotinas/:rotinaId
DELETE /empresas/:empresaId/rotinas/:rotinaId
```

**TODO:**
- Implementar vinculação de rotinas via pilar
- Validar existência de PilarEmpresa e Rotina
- Permitir observações customizadas
- Validar unicidade [pilarEmpresaId, rotinaId]

---

### 8.4. Avaliação de Rotinas

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- NotaRotina existe no schema
- DTO pronto (nota + criticidade)
- Sem endpoint para avaliar

**Endpoints esperados:**
```
POST /empresas/:empresaId/rotinas/:rotinaId/notas
GET /empresas/:empresaId/rotinas/:rotinaId/notas (histórico)
PATCH /notas/:notaId
```

**Comportamento esperado:**
- Múltiplas notas por rotina (histórico)
- Cálculo de média automático
- Atualização de PilarEvolucao

**TODO:**
- Implementar criação de notas
- Implementar histórico de avaliações
- Implementar cálculo de média por pilar
- Atualizar PilarEvolucao automaticamente

---

### 8.5. Evolução de Pilares

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- PilarEvolucao existe no schema
- DTO pronto
- Sem endpoint para consultar evolução

**Endpoints esperados:**
```
GET /empresas/:empresaId/pilares/:pilarId/evolucao
POST /empresas/:empresaId/pilares/:pilarId/evolucao (snapshot manual?)
```

**Comportamento esperado:**
- Snapshots temporais de média de notas
- Histórico de evolução ao longo do tempo
- Gráficos de evolução

**Dúvidas:**
- Snapshot é manual ou automático?
- Quando criar novo registro de evolução?
- Como calcular mediaNotas (agregação de NotaRotina)?

**TODO:**
- Definir estratégia de snapshot (manual vs automático)
- Implementar cálculo de mediaNotas
- Implementar consulta de histórico

---

### 8.6. Agenda de Reuniões

**Status:** ❌ NÃO IMPLEMENTADO

**Descrição:**
- AgendaReuniao existe no schema
- DTO pronto
- Sem endpoint para agendar

**Endpoints esperados:**
```
POST /reunioes
GET /reunioes (filtrar por usuário/data)
GET /reunioes/:id
PATCH /reunioes/:id
DELETE /reunioes/:id
```

**Comportamento esperado:**
- CRUD completo de reuniões
- Filtro por usuário (minhas reuniões)
- Filtro por data (próximas reuniões)
- Validação de conflito de horários (?)

**TODO:**
- Implementar CRUD de reuniões
- Adicionar filtros (usuário, data)
- Validar reunião no futuro
- Considerar notificações/lembretes

---

### 8.7. Multi-Tenancy em Diagnósticos

**Status:** ⚠️ NÃO IMPLEMENTADO

**Descrição:**
- PilarEmpresa vincula a empresaId
- Mas sem validação de acesso por usuário

**Comportamento esperado:**
- Usuário só acessa diagnósticos da própria empresa
- ADMINISTRADOR acessa todas as empresas
- GESTOR acessa apenas sua empresa

**TODO:**
- Implementar isolamento por empresaId
- Validar acesso em todos os endpoints
- Usar guard de multi-tenancy

---

### 8.8. Cálculo Automático de Média

**Status:** ⚠️ NÃO DEFINIDO

**Descrição:**
- PilarEvolucao.mediaNotas é opcional
- Não documenta se é calculado ou manual

**Estratégias possíveis:**
1. Calculado automaticamente ao criar NotaRotina
2. Calculado em query (não armazenado)
3. Calculado manualmente via endpoint

**TODO:**
- Definir estratégia de cálculo
- Implementar lógica de agregação
- Documentar comportamento

---

### 8.9. Histórico vs Estado Atual

**Status:** ⚠️ AMBÍGUO

**Descrição:**
- NotaRotina permite múltiplos registros
- Não documenta qual é a "nota atual"

**Estratégias possíveis:**
1. Última nota criada é a atual
2. Média de todas as notas
3. Flag `atual: boolean` (apenas uma por vez)

**TODO:**
- Definir conceito de "nota atual"
- Implementar lógica de consulta
- Documentar comportamento

---

### 8.10. Relação AgendaReuniao com Diagnóstico

**Status:** ⚠️ SEM RELAÇÃO

**Descrição:**
- AgendaReuniao não referencia empresa ou diagnóstico
- Apenas usuarioId
- Não documenta propósito da reunião

**Comportamento atual:**
- Agenda genérica de reuniões
- Sem vínculo com processo de diagnóstico

**TODO:**
- Adicionar campo empresaId (?)
- Adicionar campo tipo (diagnóstico, follow-up, etc)
- Ou mover para módulo separado (não é específico de diagnóstico)

---

### 8.11. Enum Criticidade Duplicado

**Status:** ⚠️ DUPLICAÇÃO

**Descrição:**
- Enum Criticidade definido no schema.prisma
- Enum Criticidade redefinido em create-nota-rotina.dto.ts
- Duplicação de código

**TODO:**
- Usar enum do Prisma gerado
- Remover definição duplicada no DTO
- Centralizar enums

---

## 9. Sumário de Status

| Componente | Status | Descrição |
|------------|--------|-----------|
| **Module** | 🟡 Definido | Módulo vazio sem providers |
| **Service** | ❌ Ausente | Não existe |
| **Controller** | ❌ Ausente | Não existe |
| **DTOs** | ✅ Completos | 5 create + 5 update |
| **Entidades** | ✅ Schema | Definidas no Prisma |
| **Endpoints** | ❌ Nenhum | Zero implementados |
| **Lógica de Negócio** | ❌ Nenhuma | Módulo stub |
| **Auditoria** | ❌ Não implementada | Sem service |
| **Multi-tenancy** | ❌ Não implementado | Sem validação |

---

## 10. Roadmap Sugerido

### 10.1. Fase 1: Vinculação de Pilares

**Prioridade:** ALTA

**Implementar:**
1. Service para PilarEmpresa
2. Endpoints POST/GET/DELETE
3. Validação de existência empresa/pilar
4. Validação de unicidade
5. Auditoria
6. Multi-tenancy

---

### 10.2. Fase 2: Vinculação de Rotinas

**Prioridade:** ALTA

**Implementar:**
1. Service para RotinaEmpresa
2. Endpoints POST/GET/PATCH/DELETE
3. Validação de existência PilarEmpresa/Rotina
4. Observações customizadas
5. Auditoria

---

### 10.3. Fase 3: Avaliação de Rotinas

**Prioridade:** MÉDIA

**Implementar:**
1. Service para NotaRotina
2. Endpoints POST/GET (histórico)/PATCH
3. Validação de nota (0-10)
4. Cálculo de média
5. Atualização de PilarEvolucao

---

### 10.4. Fase 4: Evolução de Pilares

**Prioridade:** MÉDIA

**Implementar:**
1. Service para PilarEvolucao
2. Endpoint GET (histórico temporal)
3. Estratégia de snapshot (definir)
4. Cálculo de mediaNotas
5. Gráficos de evolução (frontend)

---

### 10.5. Fase 5: Agenda de Reuniões

**Prioridade:** BAIXA

**Implementar:**
1. Service para AgendaReuniao
2. CRUD completo
3. Filtros (usuário, data)
4. Validação de conflitos (?)
5. Notificações (?)

---

## 11. Dependências Externas

### 11.1. Dependências de Outros Módulos

**Para implementar Diagnosticos, é necessário:**
- ✅ Empresas (empresaId)
- ✅ Pilares (pilarId)
- ✅ Rotinas (rotinaId)
- ✅ Usuarios (usuarioId)
- ✅ Audit (auditoria)

**Todos os módulos dependentes JÁ estão implementados.**

---

### 11.2. Validações Necessárias

**Ao criar PilarEmpresa:**
```typescript
const empresa = await prisma.empresa.findUnique({ where: { id: empresaId } });
if (!empresa) throw new NotFoundException('Empresa não encontrada');

const pilar = await prisma.pilar.findUnique({ where: { id: pilarId } });
if (!pilar) throw new NotFoundException('Pilar não encontrado');

const existing = await prisma.pilarEmpresa.findUnique({
  where: { empresaId_pilarId: { empresaId, pilarId } }
});
if (existing) throw new ConflictException('Pilar já vinculado');
```

**Ao criar RotinaEmpresa:**
```typescript
const pilarEmpresa = await prisma.pilarEmpresa.findUnique({ where: { id: pilarEmpresaId } });
if (!pilarEmpresa) throw new NotFoundException('PilarEmpresa não encontrado');

const rotina = await prisma.rotina.findUnique({ where: { id: rotinaId } });
if (!rotina) throw new NotFoundException('Rotina não encontrada');

// Validar que rotina pertence ao pilar
if (rotina.pilarId !== pilarEmpresa.pilarId) {
  throw new ConflictException('Rotina não pertence ao pilar');
}
```

---

## 12. Referências

**Arquivos existentes:**
- [diagnosticos.module.ts](../../backend/src/modules/diagnosticos/diagnosticos.module.ts) (vazio)
- [create-pilar-empresa.dto.ts](../../backend/src/modules/diagnosticos/dto/create-pilar-empresa.dto.ts)
- [create-rotina-empresa.dto.ts](../../backend/src/modules/diagnosticos/dto/create-rotina-empresa.dto.ts)
- [create-nota-rotina.dto.ts](../../backend/src/modules/diagnosticos/dto/create-nota-rotina.dto.ts)
- [create-pilar-evolucao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-pilar-evolucao.dto.ts)
- [create-agenda-reuniao.dto.ts](../../backend/src/modules/diagnosticos/dto/create-agenda-reuniao.dto.ts)
- [schema.prisma](../../backend/prisma/schema.prisma) (PilarEmpresa, RotinaEmpresa, NotaRotina, PilarEvolucao, AgendaReuniao)

**Arquivos ausentes:**
- ❌ diagnosticos.service.ts
- ❌ diagnosticos.controller.ts

**Módulos relacionados:**
- Empresas (vinculação)
- Pilares (vinculação)
- Rotinas (avaliação)
- Usuarios (agenda)
- Audit (auditoria futura)

---

## 13. Fluxo Esperado (Não Implementado)

### 13.1. Processo de Diagnóstico Completo

```
1. ADMINISTRADOR cria empresa (módulo Empresas)
2. ADMINISTRADOR vincula pilares à empresa (Diagnosticos)
   → POST /empresas/:empresaId/pilares { pilarId }
   
3. ADMINISTRADOR/GESTOR vincula rotinas aos pilares (Diagnosticos)
   → POST /empresas/:empresaId/pilares/:pilarId/rotinas { rotinaId }
   
4. GESTOR/COLABORADOR avalia rotinas (Diagnosticos)
   → POST /empresas/:empresaId/rotinas/:rotinaId/notas { nota, criticidade }
   
5. Sistema calcula média automaticamente (Diagnosticos)
   → PilarEvolucao.mediaNotas atualizado
   
6. GESTOR agenda reunião para apresentação (Diagnosticos)
   → POST /reunioes { titulo, dataHora, ... }
   
7. GESTOR/COLABORADOR consulta evolução (Diagnosticos)
   → GET /empresas/:empresaId/pilares/:pilarId/evolucao
```

---

**Observação final:**  
Este documento reflete APENAS os DTOs DEFINIDOS.  
**Módulo Diagnosticos NÃO possui implementação.**  
Estruturas estão prontas no schema e validações nos DTOs.  
**Crítico:** Service e Controller precisam ser implementados.  
**Roadmap:** Implementar em 5 fases (pilares → rotinas → notas → evolução → reuniões).
