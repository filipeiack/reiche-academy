# Regra: Gestão de Rotinas por Empresa (RotinaEmpresa)

## Contexto
Módulo de gestão de instâncias snapshot de rotinas vinculadas a pilares de cada empresa. Permite criar rotinas a partir de templates globais ou rotinas customizadas específicas da empresa.

## Descrição
O sistema utiliza o **Snapshot Pattern** para separar templates globais (Rotina) de instâncias por empresa (RotinaEmpresa). Cada empresa pode criar rotinas copiando templates existentes ou criando rotinas customizadas sem vínculo com templates.

## Condição
Aplicado quando:
- Empresa precisa vincular rotinas aos seus pilares
- Usuário (GESTOR ou ADMINISTRADOR) adiciona/remove rotinas de um pilar
- Empresa deseja customizar nomes e descrições de rotinas (independente do template)
- Empresa precisa criar rotina específica não existente no catálogo de templates

## Comportamento Implementado

### Entidade RotinaEmpresa (Instância Snapshot)

**Localização:** `backend/prisma/schema.prisma`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | String (UUID) | Identificador único da instância |
| rotinaTemplateId | String? | FK para Rotina (null = customizado, uuid = cópia de template) |
| rotinaTemplate | Rotina? | Relação com template de origem (se aplicável) |
| nome | String | Nome da rotina (SEMPRE preenchido, copiado OU customizado) |
| pilarEmpresaId | String | FK para PilarEmpresa (obrigatório) |
| pilarEmpresa | PilarEmpresa | Relação com pilar da empresa |
| ordem | Int | Ordem de exibição per-company (independente do template) |
| observacao | String? | Observação específica da empresa sobre a rotina |
| ativo | Boolean (default: true) | Soft delete flag |
| createdAt | DateTime | Data de criação da instância |
| updatedAt | DateTime | Data da última atualização |
| createdBy | String? | ID do usuário que criou |
| updatedBy | String? | ID do usuário que atualizou |

**Relações:**
- `rotinaTemplate`: Rotina? (template de origem, se aplicável)
- `pilarEmpresa`: PilarEmpresa (pilar da empresa)
- `notas`: NotaRotina[] (avaliações da rotina)

**Índices:**
- `@@unique([pilarEmpresaId, nome])` — Nome único por pilar da empresa

**Regras de Negócio:**
- Cada empresa tem suas próprias instâncias de rotinas (snapshots)
- Nome deve ser único dentro do pilar da empresa (permite customização)
- Ordem é obrigatória e determina exibição (independente do template)
- `rotinaTemplateId = null` indica rotina customizada (não veio de template)
- `rotinaTemplateId != null` indica cópia de template (origem rastreável)

### Endpoints Implementados

**Backend:** `backend/src/modules/rotinas-empresa/` (integrado com PilaresEmpresa)

| Endpoint | Método | Descrição | Perfis Autorizados |
|----------|--------|-----------|-------------------|
| `GET /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas` | GET | Listar rotinas do pilar | Todos |
| `POST /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas` | POST | Criar rotina (cópia OU customizado) | ADMINISTRADOR, GESTOR |
| `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas/:rotinaEmpresaId` | PATCH | Editar rotina | ADMINISTRADOR, GESTOR |
| `DELETE /empresas/:empresaId/pilares/rotinas/:rotinaEmpresaId` | DELETE | Remover rotina (soft delete) | ADMINISTRADOR, GESTOR |
| `PATCH /empresas/:empresaId/pilares/:pilarEmpresaId/rotinas/reordenar` | PATCH | Reordenar rotinas | ADMINISTRADOR, GESTOR |

### Regra R-ROTEMP-001: Criação de Rotina a partir de Template

**Descrição:** Sistema copia dados de um template global para criar instância snapshot por empresa.

**Input:**
```json
{
  "rotinaTemplateId": "uuid-template-planejamento",
  "ordem": 1
}
```

**Comportamento:**
1. Validar se template existe e está ativo
2. Validar se empresa e pilar existem
3. Validar multi-tenant (GESTOR só cria para própria empresa)
4. Copiar nome do template para a instância
5. Calcular ordem (se não fornecida, usar próxima ordem disponível)
6. Criar registro RotinaEmpresa com:
   - `rotinaTemplateId` = ID do template
   - `nome` = cópia do template.nome
   - `pilarEmpresaId` = pilar da empresa
   - `ordem` = ordem calculada
7. Registrar auditoria (CREATE)

**Validações:**
- Template existe e está ativo?
- Empresa existe?
- PilarEmpresa existe e pertence à empresa?
- Multi-tenant (GESTOR só cria para própria empresa)
- Nome não duplicado no pilar (constraint `@@unique([pilarEmpresaId, nome])`)

### Regra R-ROTEMP-002: Criação de Rotina Customizada

**Descrição:** Sistema cria rotina customizada (específica da empresa) sem vínculo com template.

**Input:**
```json
{
  "rotinaTemplateId": null,
  "nome": "Rotina Específica XYZ",
  "observacao": "Processo interno customizado",
  "ordem": 2
}
```

**Comportamento:**
1. Validar campos obrigatórios (nome é obrigatório se rotinaTemplateId = null)
2. Validar multi-tenant
3. Calcular ordem
4. Criar registro RotinaEmpresa com:
   - `rotinaTemplateId` = null
   - `nome` = fornecido pelo usuário
   - `observacao` = opcional
   - `pilarEmpresaId` = pilar da empresa
   - `ordem` = ordem calculada
5. Registrar auditoria (CREATE)

### Regra R-ROTEMP-003: Edição de Rotina da Empresa

**Descrição:** Sistema permite editar nome, observação e ordem de rotinas da empresa (independente de serem cópias ou customizadas).

**Campos Editáveis:**
- `nome`: Pode ser alterado (não afeta template original)
- `observacao`: Pode ser alterada
- `ordem`: Pode ser alterada

**Restrições:**
- Não pode editar `rotinaTemplateId` (origem da rotina é imutável)
- Não pode editar `pilarEmpresaId` (mover rotina = deletar + criar nova)
- Validação multi-tenant
- Auditoria (UPDATE)

### Regra R-ROTEMP-004: Reordenação de Rotinas

**Descrição:** Sistema permite reordenar rotinas dentro de um pilar da empresa.

**Input:**
```json
{
  "ordens": [
    { "rotinaEmpresaId": "uuid-1", "novaOrdem": 1 },
    { "rotinaEmpresaId": "uuid-2", "novaOrdem": 2 }
  ]
}
```

**Comportamento:**
1. Validar que todas rotinas pertencem ao mesmo pilar
2. Validar multi-tenant
3. Atualizar campo `ordem` de cada rotina
4. Registrar auditoria (UPDATE múltiplo)

### Regra R-ROTEMP-005: Soft Delete de Rotina

**Descrição:** Sistema desativa rotina (soft delete) em vez de deletar permanentemente.

**Comportamento:**
1. Setar `ativo = false`
2. Manter histórico de notas associadas
3. Rotina não aparece mais em listagens (filtro `ativo = true`)
4. Registrar auditoria (UPDATE - soft delete)

## Restrições

### Multi-Tenancy
- Usuários (exceto ADMINISTRADOR) só podem manipular rotinas de sua própria empresa
- Validação: `pilarEmpresa.empresaId === user.empresaId`

### Constraints do Banco
- `@@unique([pilarEmpresaId, nome])` — Nome único por pilar da empresa
- FK `rotinaTemplateId` pode ser NULL (rotinas customizadas)
- FK `pilarEmpresaId` obrigatória

### Soft Delete
- Rotinas não são deletadas permanentemente
- Histórico de notas é mantido mesmo após desativação

### Snapshot Pattern
- Alterar nome da rotina na empresa **não afeta** template original
- Alterar template **não propaga** mudanças para instâncias existentes
- Cada empresa tem cópia independente (customizável)

## Fonte no Código

**Backend:**
- Service: `backend/src/modules/pilares-empresa/pilares-empresa.service.ts` (gestão de rotinas)
- Controller: `backend/src/modules/pilares-empresa/pilares-empresa.controller.ts`
- Schema: `backend/prisma/schema.prisma` (model RotinaEmpresa)
- DTO: 
  - `backend/src/modules/pilares-empresa/dto/create-rotina-empresa.dto.ts`
  - `backend/src/modules/pilares-empresa/dto/update-rotina-empresa.dto.ts`

**Frontend:**
- Componente: `frontend/src/app/views/pages/diagnostico-notas/rotinas-pilar-modal/` (modal gestão de rotinas)
- Service: `frontend/src/app/core/services/pilares-empresa.service.ts`

---

## Observações

### Status de Implementação
- ✅ **Backend implementado** (CRUD completo)
- ✅ **Frontend implementado** (modal de gestão de rotinas)
- ✅ **Multi-tenancy ativo**
- ✅ **Auditoria completa**
- ✅ **Snapshot Pattern aplicado**

### Decisões de Design
- **Snapshot Pattern** permite customização total por empresa
- **Soft delete** preserva histórico de avaliações
- **Ordem independente** do template (cada empresa define sua priorização)
- **Nome editável** permite adaptação ao contexto da empresa
- **Observação** permite contexto adicional específico da empresa

### Relação com Outros Módulos
- **Rotina (templates)**: Fonte de dados para cópias
- **PilarEmpresa**: Contexto de vinculação (rotinas pertencem a pilares)
- **NotaRotina**: Avaliações de rotinas por empresa
- **DiagnosticosModule**: Consumidor principal (interface de diagnóstico)

### Migração de Dados
O sistema migrou de um modelo com campo `modelo: Boolean` (rotinas template vs empresa no mesmo lugar) para o Snapshot Pattern (tabelas separadas). Detalhes da migração estão documentados em [rotinas.md](./rotinas.md#11-migração-de-dados-modelo-antigo--snapshot-pattern).

---

**Regra extraída por engenharia reversa**  
**Data:** 13/01/2026  
**Agente:** Business Rules Extractor  
**Versão:** 1.0
