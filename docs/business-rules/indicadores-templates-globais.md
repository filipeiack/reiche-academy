# Regra: Indicadores Templates Globais

## Contexto
Catálogo global de indicadores templates, administrado por ADMINISTRADOR, associado a pilares templates. Usado para criar automaticamente indicadores de cockpit quando um cockpit é criado a partir de um pilar que possui `pilarTemplateId`.

## Descrição
O sistema deve permitir o cadastro de **Indicadores Templates Globais**, vinculados a um **Pilar Template**, e copiar esses indicadores para **IndicadorCockpit** (Snapshot Pattern) quando um cockpit é criado para um pilar de empresa que possui vínculo com template.

## Condição
Aplicado quando:
- ADMINISTRADOR cria/edita/exclui indicadores templates globais.
- Um cockpit é criado para um `PilarEmpresa` que possui `pilarTemplateId`.

## Comportamento Esperado

### 1) CRUD de Indicadores Templates Globais
- Indicadores templates são **globais** (não pertencem a empresa).
- Cada indicador template deve estar associado a um **Pilar Template**.
- Campos do indicador template devem refletir o mesmo conjunto do **IndicadorCockpit**:
  - `nome`
  - `descricao`
  - `tipoMedida`
  - `statusMedicao`
  - `melhor`
  - `ordem`
- Deve existir **soft delete** via `ativo` (padrão do sistema).
- CRUD deve estar disponível no menu de **ADMINISTRADOR**.
- Telas devem ser baseadas na tela de CRUD de Rotinas.

### 2) Snapshot Pattern: cópia para IndicadorCockpit
- Ao criar um cockpit para um `PilarEmpresa` que possui `pilarTemplateId`, o sistema deve:
  1. Buscar todos os indicadores templates associados ao Pilar Template.
  2. Copiar cada indicador template para **IndicadorCockpit** do cockpit criado.
  3. Manter os campos copiados conforme o template (`nome`, `descricao`, `tipoMedida`, `statusMedicao`, `melhor`, `ordem`).
  4. Auto-criar **12** registros `IndicadorMensal` (jan-dez) para cada `IndicadorCockpit` copiado.
- Caso o `PilarEmpresa` não possua `pilarTemplateId`, **nenhum** indicador template é copiado.

### 3) Isolamento entre template e instância
- Alterações no indicador template **não** devem alterar indicadores já copiados no cockpit.
- Templates criados após o cockpit **não** são copiados retroativamente.

## Cenários

### Happy Path
1. ADMINISTRADOR cria um indicador template associado ao Pilar Template "Gestão".
2. Um cockpit é criado para um PilarEmpresa com `pilarTemplateId` apontando para "Gestão".
3. O cockpit recebe os indicadores copiados automaticamente em **IndicadorCockpit**.

### Casos de Erro
- Tentativa de criar indicador template sem `pilarTemplateId` válido → erro de validação.
- Tentativa de criar cockpit com `pilarTemplateId` inexistente → erro de integridade.

## Restrições
- `nome` deve ser único **por pilar template**.

## Impacto Técnico Estimado
- Backend: nova entidade/tabela para indicadores templates + CRUD admin.
- Backend: ajuste no fluxo de criação de cockpit para copiar indicadores templates e auto-criar 12 meses.
- Frontend: novo CRUD de Indicadores Templates no menu de ADMINISTRADOR, baseado na tela de Rotinas.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: solicitante (chat), 2026-02-02
- Prioridade: alta
