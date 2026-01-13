# Regra: Evolução de Pilares (PilarEvolucao)

## Contexto
Módulo de gestão de snapshots históricos das médias de notas dos pilares de uma empresa. Permite congelar e visualizar a evolução temporal do desempenho de cada pilar.

## Descrição
O sistema cria snapshots das médias de notas dos pilares em momentos específicos (congelamento manual), permitindo visualizar a evolução temporal do desempenho da empresa em cada pilar. Os snapshots são imutáveis após criação.

## Condição
Aplicado quando:
- Usuário (GESTOR, CONSULTOR ou ADMINISTRADOR) decide congelar as médias atuais
- Sistema precisa calcular médias atuais dos pilares (tempo real)
- Usuário visualiza histórico de evolução de um pilar
- Empresa precisa comparar desempenho ao longo do tempo

## Comportamento Implementado

### Entidade PilarEvolucao

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único |
| pilarEmpresaId | String | FK para PilarEmpresa |
| pilarEmpresa | PilarEmpresa | Relação com pilar associado |
| mediaNotas | Float? | Média calculada das notas (0-10) |
| createdAt | DateTime | Data do snapshot (data do congelamento) |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que congelou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `pilarEmpresa`: PilarEmpresa (pilar associado ao snapshot)

**Comportamento:**
- Armazena snapshots históricos das médias de notas por pilar
- Criado quando usuário "congela" as médias atuais
- **Imutável** após criação (histórico não é alterado)
- Permite visualização da evolução temporal das médias

### Endpoints Implementados

**Backend:** `backend/src/modules/diagnosticos/`

| Endpoint | Método | Descrição | Perfis Autorizados |
|----------|--------|-----------|-------------------|
| `GET /empresas/:empresaId/evolucao/medias` | GET | Calcular médias atuais dos pilares | Todos |
| `POST /empresas/:empresaId/evolucao/congelar` | POST | Congelar médias atuais (criar snapshots) | ADMINISTRADOR, CONSULTOR, GESTOR |
| `GET /empresas/:empresaId/evolucao/historico/:pilarEmpresaId` | GET | Buscar histórico de evolução de um pilar | Todos |

### Regra R-EVOL-001: Calcular Médias Atuais dos Pilares

**Descrição:** Calcula a média atual das notas de cada pilar da empresa, considerando apenas rotinas que possuem notas.

**Comportamento:**
```typescript
// Para cada PilarEmpresa da empresa:
1. Buscar todas as RotinaEmpresa ativas do pilar
2. Para cada rotina, buscar a nota mais recente (se existe)
3. Calcular média = soma(notas) / count(notas)
4. Se count(notas) === 0, não retornar o pilar (média não existe)
```

**Output:**
```json
[
  {
    "pilarEmpresaId": "uuid-pilar-1",
    "pilarId": "uuid-template",
    "pilarNome": "Gestão",
    "mediaAtual": 7.5,
    "totalRotinasAvaliadas": 8,
    "totalRotinas": 10
  }
]
```

**Validações:**
- `empresaId` deve existir
- Usuário deve ter acesso à empresa (multi-tenant)
- Retornar apenas pilares com média > 0

**Perfis autorizados:** Todos

**Fonte:** [diagnosticos.service.ts](../../backend/src/modules/diagnosticos/diagnosticos.service.ts) (método `calcularMediasPilares`)

---

### Regra R-EVOL-002: Congelar Médias Atuais

**Descrição:** Cria snapshots na tabela PilarEvolucao com as médias calculadas no momento atual.

**Comportamento:**
```typescript
1. Calcular médias atuais (usar R-EVOL-001)
2. Para cada pilar com média > 0:
   - Criar registro em PilarEvolucao
   - mediaNotas = média calculada
   - createdAt = data/hora atual
   - createdBy = user.id
3. Registrar auditoria (CREATE em PilarEvolucao)
```

**Output:**
```json
{
  "message": "Médias congeladas com sucesso",
  "totalPilaresCongelados": 5,
  "data": "2026-01-13T10:30:00Z"
}
```

**Validações:**
- `empresaId` deve existir
- Usuário deve ter perfil ADMINISTRADOR, CONSULTOR ou GESTOR
- Usuário deve ter acesso à empresa (multi-tenant)
- Deve haver pelo menos 1 pilar com média > 0
- Cada congelamento cria um **novo registro** (não sobrescreve)

**Perfis autorizados:** ADMINISTRADOR, CONSULTOR, GESTOR

**Auditoria:** Sim (CREATE)

**Fonte:** [diagnosticos.service.ts](../../backend/src/modules/diagnosticos/diagnosticos.service.ts) (método `congelarMedias`)

---

### Regra R-EVOL-003: Buscar Histórico de Evolução

**Descrição:** Retorna todo o histórico de médias congeladas de um pilar específico.

**Comportamento:**
```typescript
// Buscar todos os registros de PilarEvolucao para o pilar
const historico = await prisma.pilarEvolucao.findMany({
  where: { pilarEmpresaId },
  orderBy: { createdAt: 'asc' },
  include: {
    pilarEmpresa: {
      include: {
        pilarTemplate: { select: { id: true, nome: true } }
      }
    }
  }
});
```

**Output:**
```json
[
  {
    "id": "uuid-snapshot-1",
    "mediaNotas": 6.8,
    "createdAt": "2025-12-01T10:00:00Z",
    "pilarNome": "Gestão",
    "pilarId": "uuid-template"
  },
  {
    "id": "uuid-snapshot-2",
    "mediaNotas": 7.5,
    "createdAt": "2026-01-01T10:00:00Z",
    "pilarNome": "Gestão",
    "pilarId": "uuid-template"
  }
]
```

**Validações:**
- `pilarEmpresaId` deve existir
- PilarEmpresa deve pertencer à empresa informada
- Usuário deve ter acesso à empresa (multi-tenant)

**Ordenação:** Por data de criação (ASC - mais antigo primeiro)

**Perfis autorizados:** Todos

**Fonte:** [diagnosticos.service.ts](../../backend/src/modules/diagnosticos/diagnosticos.service.ts) (método `buscarHistoricoEvolucao`)

---

## Interface — Tela de Evolução

### UI-EVOL-001: Tela de Evolução com Tabela de Médias

**Localização:** `frontend/src/app/views/pages/diagnostico-evolucao/`

**Funcionalidades:**
- Exibir lista de pilares da empresa do usuário logado
- Mostrar média atual de cada pilar
- Botão para congelar médias (apenas ADMINISTRADOR, CONSULTOR, GESTOR)
- Gráfico de barras agrupadas mostrando evolução histórica
- Filtro/seleção de empresa (ADMINISTRADOR)

**Estrutura da Tela:**

```
[Breadcrumb] Diagnósticos > Evolução

[Empresa Selecionada] (se ADMIN, contexto global; senão, empresa do usuário)

[Tabela de Pilares com Médias]
┌──────────────────────────────────────┐
│ Pilar          │ Média Atual         │
│────────────────┼─────────────────────│
│ Gestão         │ [7.5] (badge verde) │
│ Vendas         │ [6.8] (badge amar.) │
│ Marketing      │ [5.2] (badge verm.) │
└──────────────────────────────────────┘

[Botão: Congelar Médias] (apenas ADMIN/CONSULTOR/GESTOR)

[Gráfico de Barras Agrupadas por Data]
```

**Regras de Exibição:**
- Exibir apenas pilares que possuem pelo menos 1 nota
- Média com 1 casa decimal (ex: 7.5)
- Badge colorido:
  - 0-6: Vermelho (crítico)
  - 6-8: Amarelo (atenção)
  - 8-10: Verde (ideal)
- Suporte a ordenação por coluna

---

### UI-EVOL-002: Gráfico de Barras Agrupadas por Data

**Tipo:** Barras verticais agrupadas (Chart.js)

**Características:**
- **Eixo X:** Nomes dos pilares
- **Eixo Y:** Média das notas (0-10, step 1)
- **Datasets:** Cada data congelada é um dataset separado
- **Cores:** Paleta de 10 tons de cinza (do escuro ao claro)
- **Data Labels:** Média exibida sobre cada barra (1 casa decimal)
- **Interatividade:**
  - Hover: Tooltip com data e média exata
  - Click na legenda: Ocultar/exibir dataset
  - Responsive e mantém aspecto

**Exemplo:**
```
  10 ┤                                  
   8 ┤  ██ ██ ██  (barras agrupadas)   
   6 ┤  ██ ██ ██   por data            
   4 ┤  ██ ██ ██                        
   2 ┤  ██ ██ ██                        
   0 └────────────────────────────────  
    Gestão Vendas Marketing             

  Legenda: ▮ 01/01/2026 ▮ 15/01/2026
```

---

### UI-EVOL-003: Zonas Coloridas de Performance

**Plugin:** chartjs-plugin-annotation

**Zonas de Fundo:**
- Vermelho (0-6): rgba(195, 77, 56, 0.3) — Crítico
- Amarelo (6-8): rgba(166, 124, 0, 0.3) — Atenção
- Verde (8-10): rgba(92, 184, 112, 0.3) — Ideal

**Comportamento:**
- Zonas são renderizadas como fundo do gráfico
- Facilitam interpretação visual rápida
- Adaptam-se ao tema (light/dark)

---

### UI-EVOL-004: Carregamento Paralelo de Histórico

**Descrição:** Sistema carrega histórico de todos os pilares em paralelo para otimizar performance.

**Implementação:**
```typescript
const promises = pilares.map(pilar => 
  this.service.buscarHistorico(empresaId, pilar.id)
);

const resultados = await Promise.all(promises);
```

**Vantagens:**
- Reduz tempo de carregamento total
- Melhora experiência do usuário
- Evita requests sequenciais desnecessários

---

### UI-EVOL-005: Botão Congelar Médias

**Localização:** Abaixo da tabela de médias

**Comportamento:**
- Visível apenas para: ADMINISTRADOR, CONSULTOR, GESTOR
- Desabilitado se não houver médias para congelar
- Ao clicar: Confirmação via SweetAlert
- Após congelar: 
  - Toast de sucesso
  - Atualizar automaticamente dados e gráfico
- Tooltip explicativo: "Salva as médias atuais para comparação futura"

**Validações:**
- Perfil autorizado?
- Existe pelo menos 1 pilar com média > 0?

---

## Restrições

### Multi-Tenancy
- Usuários (exceto ADMINISTRADOR) só podem acessar dados de sua própria empresa
- Validação: `pilarEmpresa.empresaId === user.empresaId`

### Imutabilidade
- Snapshots em PilarEvolucao **não são editados** após criação
- Histórico é **somente leitura**
- Cada congelamento cria **novos registros**

### Perfis Autorizados
**Visualização (médias e histórico):** Todos os perfis

**Congelamento:** ADMINISTRADOR, CONSULTOR, GESTOR

### Cálculo de Médias
- Considera apenas rotinas **ativas**
- Considera apenas notas **mais recentes** de cada rotina
- Ignora rotinas sem notas (não afeta média)
- Retorna 0 se nenhuma rotina tiver nota
- Valor entre 0 e 10

### Performance
- Frontend carrega histórico de todos os pilares em **paralelo**
- Backend calcula médias em **tempo real** (não persiste médias calculadas, apenas snapshots)

## Fonte no Código

**Backend:**
- Service: `backend/src/modules/diagnosticos/diagnosticos.service.ts`
- Controller: `backend/src/modules/diagnosticos/diagnosticos.controller.ts`
- Schema: `backend/prisma/schema.prisma` (model PilarEvolucao)

**Frontend:**
- Componente: `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.ts`
- Service: `frontend/src/app/core/services/diagnostico-notas.service.ts`
- Template: `frontend/src/app/views/pages/diagnostico-evolucao/diagnostico-evolucao.component.html`

---

## Observações

### Status de Implementação
- ✅ **Backend implementado** (3 endpoints)
- ✅ **Frontend implementado** (tela completa com gráfico)
- ✅ **Multi-tenancy ativo**
- ✅ **Auditoria completa**
- ✅ **Gráfico interativo** (Chart.js + annotations)

### Decisões de Design
- **Congelamento manual** (não automático) para controle do usuário
- **Snapshots imutáveis** preservam histórico fiel
- **Cálculo em tempo real** de médias atuais (não persiste)
- **Carregamento paralelo** otimiza performance do frontend
- **Zonas coloridas** facilitam interpretação visual
- **Gráfico de barras agrupadas** permite comparação temporal direta

### Relação com Outros Módulos
- **PilarEmpresa**: Fonte de pilares para cálculo de médias
- **RotinaEmpresa**: Fonte de rotinas para cálculo de médias
- **NotaRotina**: Fonte de notas para cálculo de médias
- **DiagnosticosModule**: Módulo responsável pelos endpoints

### Próximos Passos Sugeridos
- ⚠️ **Congelamento automático agendado** (job mensal/trimestral)
- ⚠️ **Comparação entre períodos** (delta percentual)
- ⚠️ **Alertas de degradação** (média caiu X% em relação ao período anterior)
- ⚠️ **Exportação de relatórios** (PDF/Excel com gráficos)

---

**Regra extraída por engenharia reversa**  
**Data:** 13/01/2026  
**Agente:** Business Rules Extractor  
**Versão:** 1.0
