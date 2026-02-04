# Regra: Objetivos Templates Globais

## Contexto
Catálogo global de objetivos templates, administrado por ADMINISTRADOR, associado a pilares templates. Usado para **pré-preencher** os campos de objetivos na criação do cockpit do pilar (tela criar-cockpit-drawer) quando o PilarEmpresa possui `pilarTemplateId`.

## Descrição
O sistema deve permitir o cadastro de **Objetivos Templates Globais**, vinculados a um **Pilar Template**, e utilizar esses templates para **exibição/preenchimento inicial** dos campos de objetivos na criação de um cockpit. Os objetivos templates **não** são gravados automaticamente nas tabelas do cockpit; apenas são exibidos para que o usuário confirme e salve.

## Condição
Aplicado quando:
- ADMINISTRADOR cria/edita/exclui objetivos templates globais.
- Um cockpit é criado para um `PilarEmpresa` que possui `pilarTemplateId`.

## Comportamento Esperado

### 1) CRUD de Objetivos Templates Globais
- Objetivos templates são **globais** (não pertencem a empresa).
- Cada objetivo template deve estar associado a um **Pilar Template**.
- Existe **um único objetivo template por pilar template**.
- Cada objetivo template contém exatamente 3 campos:
  - `entradas`
  - `saidas`
  - `missao`
- CRUD deve estar disponível no menu de **ADMINISTRADOR**.
- Telas devem ser baseadas no CRUD de **Indicadores**.
- O formulário deve ser baseado na tela **criar-cockpit-drawer**.
- Exclusão é **hard delete**.
- **Sem auditoria** nesse CRUD.

### 2) Pré-preenchimento na criação do cockpit (sem persistência automática)
- Ao criar um cockpit para um `PilarEmpresa` que possui `pilarTemplateId`, o sistema deve:
  1. Buscar todos os objetivos templates associados ao Pilar Template.
  2. Exibir/preencher os campos de objetivos na tela **criar-cockpit-drawer** com os dados do template correspondente.
  3. **Não** gravar automaticamente esses dados no backend; a persistência só ocorre quando o usuário salvar o cockpit.
- Caso o `PilarEmpresa` não possua `pilarTemplateId`, **nenhum** objetivo template é exibido.
 - As permissões já existentes na tela **criar-cockpit-drawer** permanecem inalteradas.

### 3) Isolamento entre template e instância
- Alterações no objetivo template **não** devem alterar cockpits já criados.
- Templates criados após o cockpit **não** são aplicados retroativamente.

## Cenários

### Happy Path
1. ADMINISTRADOR cria um objetivo template associado ao Pilar Template "Gestão" com entradas, saídas e missão.
2. Um cockpit é criado para um PilarEmpresa com `pilarTemplateId` apontando para "Gestão".
3. A tela **criar-cockpit-drawer** exibe os campos de objetivos pré-preenchidos com o template.
4. Usuário revisa e salva o cockpit para persistir os dados.

### Casos de Erro
- Tentativa de criar objetivo template sem `pilarTemplateId` válido → erro de validação.
- Tentativa de criar cockpit com `pilarTemplateId` inexistente → erro de integridade.

## Restrições
- Os 3 campos (`entradas`, `saidas`, `missao`) são obrigatórios.
- Não há ordenação.
- Não há regra de unicidade além da cardinalidade **1 objetivo por pilar template**.

## Impacto Técnico Estimado
- Backend: nova entidade/tabela para objetivos templates + CRUD admin.
- Backend: endpoint para listar objetivos templates por `pilarTemplateId` para a criação de cockpit.
- Frontend: novo CRUD de Objetivos Templates no menu de ADMINISTRADOR, baseado em Indicadores.
- Frontend: pré-preenchimento no criar-cockpit-drawer sem persistência automática.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: solicitante (chat), 2026-02-03
- Prioridade: alta
