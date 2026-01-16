# Regras de Negócio — Cockpit de Pilares

**Módulo:** Cockpit de Pilares  
**Backend:** `backend/src/modules/cockpit-pilares/` (a implementar)  
**Frontend:** `frontend/src/app/views/pages/cockpit-pilares/` (a implementar)  
**Criado em:** 2026-01-15  
**Agente:** System Engineer  
**Status:** 📋 **ESPECIFICAÇÃO** (aguardando implementação)

---

## 1. Visão Geral

O módulo Cockpit de Pilares é responsável por criar **painéis gerenciais especializados** por pilar, permitindo que empresas monitorem indicadores, processos, equipes e planos de ação de forma integrada.

### Responsabilidades:

- **Gerenciar ativação de cockpits** por pilar (selecionar pilares prioritários)
- **Definir contexto do pilar**: Entradas, Saídas, Missão
- **Gestão de Indicadores**: Definir indicadores customizados com metas mensais (jan-dez)
- **Análise Gráfica**: Visualizar evolução temporal dos indicadores
- **Processos Prioritários**: Vincular rotinas do pilar com status de mapeamento/treinamento
- **Cargos e Funções**: Atribuir responsabilidades e avaliações por cargo
- **Plano de Ação**: Criar ações corretivas com análise de causas (5 Porquês)

**Integração com módulos existentes:**
- **PilarEmpresa** → Cockpit vinculado a um pilar específico da empresa
- **RotinaEmpresa** → Processos prioritários derivam das rotinas do pilar
- **Usuario** → Responsáveis, cargos e execução de ações
- **PeriodoAvaliacao** → Dados mensais de indicadores podem referenciar períodos

**Conceito central:**
- Cockpit é uma **visão aprofundada** de um pilar específico
- Enquanto diagnóstico avalia pilares com notas gerais (0-10), o cockpit detalha **como** melhorar
- Usuário escolhe quais pilares merecem cockpit (geralmente os com médias mais baixas)

---

## 2. Entidades

### 2.1. CockpitPilar

**Descrição:** Ativa um cockpit para um pilar específico da empresa, definindo contexto gerencial.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| pilarEmpresaId | String | FK para PilarEmpresa (qual pilar tem cockpit) |
| entradas | String? | Descrição das entradas do pilar (ex: "Pedidos de clientes, leads gerados") |
| saidas | String? | Descrição das saídas do pilar (ex: "Propostas comerciais, contratos assinados") |
| missao | String? | Missão do pilar (ex: "Garantir crescimento sustentável via canal indireto") |
| ativo | Boolean | Se cockpit está ativo (default: true) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `pilarEmpresa`: PilarEmpresa (único - um cockpit por pilar)
- `indicadores`: IndicadorCockpit[] (indicadores customizados)
- `processosPrioritarios`: ProcessoPrioritario[] (rotinas com status de mapeamento)
- `cargos`: CargoCockpit[] (cargos e funções da área)
- `acoes`: AcaoCockpit[] (plano de ação)

**Índices:**
- `@@unique([pilarEmpresaId])` — Um cockpit por pilar

**Regras de Negócio:**
- Apenas ADMINISTRADOR e GESTOR podem criar/editar cockpits
- Usuário só cria cockpit para pilar da sua empresa (multi-tenant)
- Ao criar cockpit, automaticamente importa rotinas do pilar como processos prioritários

---

### 2.2. IndicadorCockpit

**Descrição:** Indicador customizado monitorado no cockpit (ex: Faturamento Total Mensal, Taxa de Inadimplência).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| cockpitPilarId | String | FK para CockpitPilar |
| nome | String | Nome do indicador (ex: "FATURAMENTO TOTAL MENSAL") |
| descricao | String? | Descrição detalhada (ex: "TOTAL EM R$ VENDIDOS VIA CANAL INDIRETO") |
| tipoMedida | TipoMedidaIndicador | REAL, QUANTIDADE, TEMPO, PERCENTUAL |
| statusMedicao | StatusMedicaoIndicador | NAO_MEDIDO, MEDIDO_NAO_CONFIAVEL, MEDIDO_CONFIAVEL |
| responsavelMedicaoId | String? | FK para Usuario (quem coleta o dado) |
| melhor | DirecaoIndicador | MAIOR (↑) ou MENOR (↓) |
| ordem | Int | Ordem de exibição no cockpit |
| ativo | Boolean | Se indicador está ativo (default: true) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `cockpitPilar`: CockpitPilar (cockpit dono)
- `responsavelMedicao`: Usuario? (responsável pela coleta)
- `mesesIndicador`: IndicadorMensal[] (valores mensais jan-dez + resumo anual)

**Enums:**

```prisma
enum TipoMedidaIndicador {
  REAL           // R$
  QUANTIDADE     // #
  TEMPO          // horas, dias
  PERCENTUAL     // %
}

enum StatusMedicaoIndicador {
  NAO_MEDIDO
  MEDIDO_NAO_CONFIAVEL
  MEDIDO_CONFIAVEL
}

enum DirecaoIndicador {
  MAIOR  // ↑ (quanto maior, melhor)
  MENOR  // ↓ (quanto menor, melhor)
}
```

**Regras de Negócio:**
- Nome único por cockpit
- Ordem determina posição na matriz de indicadores
- Responsável deve ser usuário da mesma empresa

---

### 2.3. IndicadorMensal

**Descrição:** Valores de meta e realizado para cada mês (jan-dez) + resumo anual de um indicador.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| indicadorCockpitId | String | FK para IndicadorCockpit |
| mes | Int? | 1-12 (null para resumo anual) |
| ano | Int | Ano de referência (ex: 2026) |
| meta | Float? | Valor de meta |
| realizado | Float? | Valor realizado |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `indicadorCockpit`: IndicadorCockpit (indicador dono)

**Índices:**
- `@@unique([indicadorCockpitId, ano, mes])` — Um registro por mês/ano

**Campos calculados (frontend):**
- **Desvio**: `SE(melhor="MENOR"; meta - realizado; SE(melhor="MAIOR"; realizado - meta; 0))`
- **Status**: Verde (atingiu meta), Amarelo (≥80% meta), Vermelho (<80% meta)

**Regras de Negócio:**
- `mes = null` representa resumo anual
- Meta e realizado podem ser null (não preenchido)
- Status visual calculado no frontend baseado em meta vs realizado

---

### 2.4. ProcessoPrioritario

**Descrição:** Vincula rotinas do pilar com status de mapeamento e treinamento. **NÃO é snapshot** - apenas referência direta para exibir nome, criticidade e nota atual da rotina.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| cockpitPilarId | String | FK para CockpitPilar |
| rotinaEmpresaId | String | FK para RotinaEmpresa (rotina vinculada) |
| statusMapeamento | StatusProcesso | PENDENTE, EM_ANDAMENTO, CONCLUIDO |
| statusTreinamento | StatusProcesso | PENDENTE, EM_ANDAMENTO, CONCLUIDO |
| ordem | Int | Ordem de exibição (herdada da rotina) |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `cockpitPilar`: CockpitPilar (cockpit dono)
- `rotinaEmpresa`: RotinaEmpresa (rotina vinculada)

**Enum:**

```prisma
enum StatusProcesso {
  PENDENTE
  EM_ANDAMENTO
  CONCLUIDO
}
```

**Índices:**
- `@@unique([cockpitPilarId, rotinaEmpresaId])` — Uma entrada por rotina

**Regras de Negócio:**
- Ao criar cockpit, automaticamente vincula todas rotinas ativas do pilar
- Ordem herdada de RotinaEmpresa
- **Dados da rotina são SOMENTE LEITURA** (nome, criticidade, nota via join)
- **Apenas status de mapeamento/treinamento são editáveis**

---

### 2.5. CargoCockpit

**Descrição:** Define cargos/funções da área com auto-avaliação e avaliação da liderança.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| cockpitPilarId | String | FK para CockpitPilar |
| cargo | String | Nome do cargo (ex: "DIRETORA") |
| usuarioId | String? | FK para Usuario (pessoa no cargo) |
| ordem | Int | Ordem de exibição |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `cockpitPilar`: CockpitPilar (cockpit dono)
- `usuario`: Usuario? (pessoa no cargo)
- `funcoes`: FuncaoCargo[] (responsabilidades do cargo)

**Regras de Negócio:**
- Um cargo pode ter múltiplas funções
- Usuário vinculado deve ser da mesma empresa

---

### 2.6. FuncaoCargo

**Descrição:** Responsabilidades de um cargo com avaliações.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| cargoCockpitId | String | FK para CargoCockpit |
| descricao | String | Descrição da função (ex: "REVISÃO DE VENDAS E PROPOSTAS EM ANDAMENTO") |
| nivelCritico | Criticidade | ALTO, MEDIO, BAIXO |
| autoAvaliacao | Float? | Nota de auto-avaliação (0-10) |
| avaliacaoLideranca | Float? | Nota da liderança (0-10) |
| ordem | Int | Ordem de exibição |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `cargoCockpit`: CargoCockpit (cargo dono)

**Regras de Negócio:**
- Avaliações podem ser null (não preenchidas)
- Média do cargo calculada no frontend

---

### 2.7. AcaoCockpit

**Descrição:** Plano de ação específico do cockpit com análise de causas (5 Porquês).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| cockpitPilarId | String | FK para CockpitPilar |
| indicadorCockpitId | String? | FK para IndicadorCockpit (ação relacionada a indicador específico) |
| analiseMes | String? | Análise do mês (ex: "JANEIRO") |
| causa1 | String? | Primeira causa (ex: "CUSTO POR LEAD") |
| causa2 | String? | Segunda causa (método 5 Porquês) |
| causa3 | String? | Terceira causa |
| causa4 | String? | Quarta causa |
| causa5 | String? | Quinta causa (causa raiz) |
| acaoProposta | String | Ação elaborada para resolver |
| responsavelId | String? | FK para Usuario (quem executa) |
| status | StatusAcao | PENDENTE, EM_ANDAMENTO, CONCLUIDA, CANCELADA |
| prazo | DateTime? | Data limite para conclusão |
| createdAt | DateTime | Data de criação |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `cockpitPilar`: CockpitPilar (cockpit dono)
- `indicadorCockpit`: IndicadorCockpit? (indicador relacionado)
- `responsavel`: Usuario? (responsável pela ação)

**Enum StatusAcao** (já existe no schema):
- PENDENTE
- EM_ANDAMENTO
- CONCLUIDA
- CANCELADA

**Regras de Negócio:**
- Ação pode ser vinculada a indicador específico ou ser genérica
- Responsável deve ser usuário da mesma empresa
- Status CONCLUIDA/CANCELADA não pode voltar para PENDENTE

---

## 3. Regras Implementadas (A DEFINIR)

### R-COCKPIT-001: Criar Cockpit para Pilar

**Descrição:** Ativa um cockpit para pilar específico da empresa.

**Input:**
```json
{
  "pilarEmpresaId": "uuid-pilar",
  "entradas": "Pedidos de clientes, leads gerados",
  "saidas": "Propostas comerciais, contratos assinados",
  "missao": "Garantir crescimento sustentável via canal indireto"
}
```

**Comportamento:**
1. Validar se pilar existe e pertence à empresa
2. Validar multi-tenant (GESTOR só cria para própria empresa)
3. Validar se cockpit já existe para o pilar (unique constraint)
4. Criar registro CockpitPilar
5. Automaticamente importar rotinas do pilar como processos prioritários
6. Registrar auditoria (CREATE)

**Validações:**
- Pilar existe?
- Pertence à empresa do usuário?
- Cockpit já existe?
- Perfil autorizado (ADMINISTRADOR, GESTOR)?

**Output:**
```json
{
  "id": "uuid-cockpit",
  "pilarEmpresaId": "uuid-pilar",
  "entradas": "...",
  "saidas": "...",
  "missao": "...",
  "ativo": true,
  "createdAt": "2026-01-15T10:00:00Z"
}
```

**Perfis autorizados:** ADMINISTRADOR, GESTOR

---

### R-COCKPIT-002: Adicionar Indicador ao Cockpit

**Descrição:** Cria indicador customizado no cockpit.

**Input:**
```json
{
  "nome": "FATURAMENTO TOTAL MENSAL",
  "descricao": "TOTAL EM R$ VENDIDOS VIA CANAL INDIRETO",
  "tipoMedida": "REAL",
  "statusMedicao": "MEDIDO_CONFIAVEL",
  "responsavelMedicaoId": "uuid-usuario",
  "melhor": "MAIOR",
  "ordem": 1
}
```

**Comportamento:**
1. Validar se cockpit existe e pertence à empresa
2. Validar se responsável existe e pertence à empresa
3. Validar tipo de medida (enum válido)
4. Calcular ordem (se não fornecida, usar próxima disponível)
5. Criar registro IndicadorCockpit
6. Criar 13 registros IndicadorMensal (jan-dez + resumo anual) vazios
7. Registrar auditoria (CREATE)

**Validações:**
- Cockpit existe?
- Nome único no cockpit?
- Responsável pertence à empresa?
- Enum TipoMedidaIndicador válido?
- Enum StatusMedicaoIndicador válido?
- Enum DirecaoIndicador válido?

**Output:**
```json
{
  "id": "uuid-indicador",
  "cockpitPilarId": "uuid-cockpit",
  "nome": "FATURAMENTO TOTAL MENSAL",
  "tipoMedida": "REAL",
  "melhor": "MAIOR",
  "mesesIndicador": [
    {"mes": 1, "ano": 2026, "meta": null, "realizado": null},
    {"mes": 2, "ano": 2026, "meta": null, "realizado": null},
    ...
    {"mes": null, "ano": 2026, "meta": null, "realizado": null}
  ]
}
```

**Perfis autorizados:** ADMINISTRADOR, GESTOR

---

### R-COCKPIT-003: Atualizar Valores Mensais de Indicador

**Descrição:** Atualiza meta e realizado de um mês específico.

**Input:**
```json
{
  "indicadorCockpitId": "uuid-indicador",
  "mes": 1,
  "ano": 2026,
  "meta": 1890000,
  "realizado": null
}
```

**Comportamento:**
1. Validar se indicador existe e pertence à empresa
2. Buscar/criar registro IndicadorMensal (unique constraint)
3. Atualizar meta e/ou realizado
4. Registrar auditoria (UPDATE)

**Validações:**
- Indicador existe?
- Mês entre 1-12 ou null (resumo)?
- Ano válido?
- Valores numéricos?

**Output:**
```json
{
  "id": "uuid-mensal",
  "indicadorCockpitId": "uuid-indicador",
  "mes": 1,
  "ano": 2026,
  "meta": 1890000,
  "realizado": null,
  "desvio": null,
  "status": null
}
```

**Campos calculados no frontend:**
- **desvio**: `realizado - meta` (se melhor=MAIOR) ou `meta - realizado` (se melhor=MENOR)
- **status**: Verde/Amarelo/Vermelho baseado em % atingimento

**Perfis autorizados:** ADMINISTRADOR, GESTOR, COLABORADOR

---

### R-COCKPIT-004: Atualizar Status de Processo Prioritário

**Descrição:** Atualiza status de mapeamento/treinamento de rotina.

**Input:**
```json
{
  "processoPrioritarioId": "uuid-processo",
  "statusMapeamento": "CONCLUIDO",
  "statusTreinamento": "EM_ANDAMENTO"
}
```

**Comportamento:**
1. Validar se processo existe e pertence à empresa
2. Atualizar statusMapeamento e/ou statusTreinamento
3. Registrar auditoria (UPDATE)

**Validações:**
- Processo existe?
- Enum StatusProcesso válido?

**Output:**
```json
{
  "id": "uuid-processo",
  "rotinaEmpresaId": "uuid-rotina",
  "statusMapeamento": "CONCLUIDO",
  "statusTreinamento": "EM_ANDAMENTO"
}
```

**Perfis autorizados:** ADMINISTRADOR, GESTOR

---

### R-COCKPIT-005: Adicionar Cargo e Funções

**Descrição:** Cria cargo com funções e avaliações.

**Input:**
```json
{
  "cockpitPilarId": "uuid-cockpit",
  "cargo": "DIRETORA",
  "usuarioId": "uuid-usuario",
  "funcoes": [
    {
      "descricao": "REVISÃO DE VENDAS E PROPOSTAS EM ANDAMENTO",
      "nivelCritico": "ALTO",
      "autoAvaliacao": null,
      "avaliacaoLideranca": null,
      "ordem": 1
    }
  ]
}
```

**Comportamento:**
1. Validar se cockpit existe e pertence à empresa
2. Validar se usuário existe e pertence à empresa
3. Criar registro CargoCockpit
4. Criar registros FuncaoCargo
5. Registrar auditoria (CREATE)

**Validações:**
- Cockpit existe?
- Usuário pertence à empresa?
- Enum Criticidade válido?
- Avaliações entre 0-10?

**Output:**
```json
{
  "id": "uuid-cargo",
  "cargo": "DIRETORA",
  "usuarioId": "uuid-usuario",
  "funcoes": [...]
}
```

**Perfis autorizados:** ADMINISTRADOR, GESTOR

---

### R-COCKPIT-006: Criar Ação com Análise de Causas

**Descrição:** Adiciona ação ao plano com método 5 Porquês.

**Input:**
```json
{
  "cockpitPilarId": "uuid-cockpit",
  "indicadorCockpitId": "uuid-indicador",
  "analiseMes": "JANEIRO",
  "causa1": "CUSTO POR LEAD",
  "causa2": "PORQUE",
  "causa3": "PORQUE",
  "causa4": "PORQUE",
  "causa5": null,
  "acaoProposta": "AÇÃO ELABORADA PARA REDUZIR O CUSTO POR LEAD",
  "responsavelId": "uuid-usuario",
  "status": "PENDENTE",
  "prazo": "2026-11-30"
}
```

**Comportamento:**
1. Validar se cockpit existe e pertence à empresa
2. Validar se indicador existe (se fornecido)
3. Validar se responsável existe e pertence à empresa
4. Criar registro AcaoCockpit
5. Registrar auditoria (CREATE)

**Validações:**
- Cockpit existe?
- Indicador existe (se fornecido)?
- Responsável pertence à empresa?
- Enum StatusAcao válido?

**Output:**
```json
{
  "id": "uuid-acao",
  "acaoProposta": "...",
  "status": "PENDENTE",
  "prazo": "2026-11-30"
}
```

**Perfis autorizados:** ADMINISTRADOR, GESTOR

---

## 4. Endpoints Esperados

### Backend: `backend/src/modules/cockpit-pilares/`

| Endpoint | Método | Descrição | Perfis |
|----------|--------|-----------|--------|
| `POST /empresas/:empresaId/pilares/:pilarEmpresaId/cockpit` | POST | Criar cockpit para pilar | ADMIN, GESTOR |
| `GET /empresas/:empresaId/cockpits` | GET | Listar cockpits da empresa | Todos |
| `GET /empresas/:empresaId/cockpits/:cockpitId` | GET | Buscar cockpit completo | Todos |
| `PATCH /cockpits/:cockpitId` | PATCH | Editar entradas/saídas/missão | ADMIN, GESTOR |
| `DELETE /cockpits/:cockpitId` | DELETE | Desativar cockpit | ADMIN, GESTOR |
| **Indicadores** |
| `POST /cockpits/:cockpitId/indicadores` | POST | Adicionar indicador | ADMIN, GESTOR |
| `PATCH /cockpits/:cockpitId/indicadores/:indicadorId` | PATCH | Editar indicador | ADMIN, GESTOR |
| `DELETE /indicadores/:indicadorId` | DELETE | Remover indicador | ADMIN, GESTOR |
| `PATCH /indicadores/:indicadorId/meses/:mesId` | PATCH | Atualizar meta/realizado | ADMIN, GESTOR, COLAB |
| **Processos** |
| `PATCH /processos-prioritarios/:processoId` | PATCH | Atualizar status | ADMIN, GESTOR |
| **Cargos** |
| `POST /cockpits/:cockpitId/cargos` | POST | Adicionar cargo | ADMIN, GESTOR |
| `PATCH /cargos/:cargoId/funcoes/:funcaoId` | PATCH | Atualizar avaliações | ADMIN, GESTOR, COLAB |
| **Ações** |
| `POST /cockpits/:cockpitId/acoes` | POST | Criar ação | ADMIN, GESTOR |
| `PATCH /acoes/:acaoId` | PATCH | Atualizar status/prazo | ADMIN, GESTOR |

---

## 5. Frontend Esperado

### Tela Principal: Cockpit de Pilar

**Localização:** `frontend/src/app/views/pages/cockpit-pilares/`

**Componentes:**
- `cockpit-pilar-dashboard.component.ts` — Dashboard principal
- `matriz-indicadores.component.ts` — Tabela de indicadores (jan-dez)
- `grafico-indicadores.component.ts` — Gráficos de evolução
- `matriz-processos.component.ts` — Processos prioritários
- `matriz-cargos.component.ts` — Cargos e funções
- `plano-acao.component.ts` — Plano de ação

**Navegação:**
- Botão na tela de diagnóstico: "Criar Cockpit" (para pilares com média baixa)
- Menu lateral: "Cockpits" → Lista de cockpits ativos
- Dentro do cockpit: Abas/seções para 1-Indicadores, 2-Gráficos, 3-Processos, 4-Cargos, 5-Ações

**Funcionalidades:**
- Auto-save em indicadores mensais (debounce 1000ms)
- Cálculo de desvio e status visual (verde/amarelo/vermelho)
- Filtro de ano para indicadores
- Gráficos com Chart.js ou similar
- Drag-and-drop para reordenar indicadores/processos (opcional)

---

## 6. Validações e Segurança

### Multi-Tenancy
- Todos os endpoints validam `empresaId` do usuário
- GESTOR só acessa cockpits da própria empresa
- ADMINISTRADOR acessa todas as empresas

### RBAC
- **ADMINISTRADOR**: CRUD completo
- **GESTOR**: CRUD completo na própria empresa
- **CONSULTOR**: Leitura + edição de indicadores mensais
- **COLABORADOR**: Leitura + edição de avaliações de funções
- **LEITURA**: Apenas visualização

### Auditoria
- Todas operações CUD registradas em AuditLog
- Rastreabilidade de quem criou/atualizou indicadores, metas, ações

### Validações de Negócio
- Nome de indicador único por cockpit
- Responsáveis devem ser usuários da mesma empresa
- Status de ações não podem retroceder (CONCLUIDA → PENDENTE proibido)
- Mês entre 1-12 ou null
- Avaliações entre 0-10

---

## 7. Integrações com Módulos Existentes

### PilarEmpresa
- Cockpit vinculado via `pilarEmpresaId`
- Ao criar cockpit, buscar nome e responsável do pilar

### RotinaEmpresa
- Ao criar cockpit, importar rotinas ativas como processos prioritários
- Exibir nome, criticidade e nota atual (join com NotaRotina)

### NotaRotina
- Matriz de processos exibe nota atual da rotina (última avaliação)

### Usuario
- Responsáveis por medição, cargos e ações
- Filtro multi-tenant por `empresaId`

### PeriodoAvaliacao (opcional)
- Indicadores mensais podem referenciar períodos trimestrais
- Não é obrigatório (indicadores funcionam independente)

---

## 8. Roadmap de Implementação

### Fase 1 (MVP - Cockpit Completo)
- [x] Especificação (este documento)
- [ ] Modelo de dados (schema Prisma)
- [ ] Backend: CRUD de CockpitPilar
- [ ] Backend: CRUD de IndicadorCockpit e IndicadorMensal
- [ ] Backend: Vinculação de processos prioritários
- [ ] Frontend: Dashboard básico com matriz de indicadores
- [ ] Frontend: **Gráficos de evolução temporal** (integrado no MVP)
- [ ] Backend: Endpoint de dados agregados para gráficos

### Fase 2 (Processos e Cargos)
- [ ] Backend: CRUD de CargoCockpit e FuncaoCargo
- [ ] Frontend: Matriz de processos prioritários
- [ ] Frontend: Matriz de cargos e funções

### Fase 3 (Plano de Ação)
- [ ] Backend: CRUD de AcaoCockpit
- [ ] Frontend: Plano de ação com 5 Porquês
- [ ] Notificações de prazos vencidos

### Fase 4 (Otimizações)
- [ ] Exportação para Excel/PDF
- [ ] Comparação de indicadores entre cockpits
- [ ] Dashboard consolidado de todos os cockpits

---

## 9. Referências

**Documentos relacionados:**
- [pilares-empresa.md](./pilares-empresa.md)
- [rotinas-empresa.md](./rotinas-empresa.md)
- [diagnosticos.md](./diagnosticos.md)
- [periodo-avaliacao.md](./periodo-avaliacao.md)
- [pilar-evolucao.md](./pilar-evolucao.md)

**Convenções:**
- [backend.md](../conventions/backend.md)
- [frontend.md](../conventions/frontend.md)
- [naming.md](../conventions/naming.md)

**Exemplos de negócio:**
- Planilha "COMERCIAL - CANAL INDIRETO" (anexada por usuário)

---

**Versão:** 1.0  
**Última atualização:** 2026-01-15  
**Próximos passos:** Criar handoff para Dev Agent implementar MVP
