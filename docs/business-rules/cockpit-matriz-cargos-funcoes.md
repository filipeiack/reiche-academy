# Regra: Matriz de Cargos e Funções no Cockpit

## Contexto
Módulo Cockpit de Pilares → Aba “Matriz de Cargos e Funções”.
Objetivo: permitir o cadastro de cargos, múltiplos responsáveis por cargo e funções associadas, com avaliações e criticidade, seguindo o padrão de multi-cadastros do sistema.

## Descrição
A aba “Matriz de Cargos e Funções” deve **seguir o mesmo padrão de layout e fluxo** já usado na aba de Indicadores do Cockpit:
- Primeiro bloco: **Matriz de Cargos e Responsáveis** (equivalente ao cadastro de indicadores).
- Segundo bloco (abaixo): **Funções por Cargo** em formato de accordion (equivalente aos valores mensais), com ações por função.

Funcionalidades:
- Cadastrar cargos de um cockpit.
- Associar múltiplos responsáveis (usuários da empresa) a cada cargo, utilizando o fluxo de cadastro simplificado de usuários (mesmo padrão de “Definir Responsável” do diagnóstico-notas).
- Cadastrar funções (responsabilidades) por cargo com criticidade e notas.
- Reordenar cargos na primeira grid (matriz principal).
- Reordenar funções **dentro do accordion** do cargo.
- Hard delete de funções.
- Exibir médias das avaliações no footer da lista de funções (visível apenas com accordion aberto).

## Condição
Aplicar-se quando o usuário acessa a aba e executa operações de:
- Criar/editar/remover cargos.
- Associar/remover responsáveis.
- Criar/editar/remover/reordenar funções.
- Preencher notas de auto-avaliação e avaliação de liderança.

## Comportamento Esperado
### 1. Cargos (Matriz principal)
- Cada cargo pertence a um cockpit específico.
- Um cargo pode ter **múltiplos responsáveis** (usuários da mesma empresa).
- O cadastro de responsáveis segue o **mesmo fluxo simplificado** já existente em diagnóstico-notas (cadastro rápido de usuário quando necessário).
- **Reordenação de cargos** deve ocorrer na primeira grid, espelhando a matriz de indicadores.

### 2. Funções do cargo (Accordion)
- Cada função pertence a um cargo.
- Campos obrigatórios por função:
  - Descrição
  - Criticidade (ALTA, MEDIA, BAIXA)
- Campos opcionais:
  - Auto-avaliação (0–10)
  - Avaliação da liderança (0–10)
- Funções podem ser **reordenadas** pelo usuário **dentro do accordion**.
- **Hard delete**: exclusão remove fisicamente a função.

### 3. Criticidade (UI)
- ALTA: vermelho
- MEDIA: amarelo
- BAIXA: verde

### 4. Médias no footer
- No final da lista de funções do cargo (dentro do accordion aberto), exibir:
  - Média de auto-avaliação
  - Média de avaliação da liderança
- Considerar apenas funções com nota preenchida.
- Se não houver notas, exibir “—” ou equivalente neutro.
- Footer não precisa ficar visível quando o accordion estiver fechado.

### 5. Permissões e Segurança
- Restringir CRUD a usuários com perfil adequado conforme regras de cockpit (ADMINISTRADOR/GESTOR).
- Responsáveis devem ser **usuários da mesma empresa** do cockpit (multi-tenant).

## Cenários
### Happy Path
1. Usuário abre a aba e cadastra um novo cargo.
2. Adiciona dois responsáveis para o cargo usando cadastro simplificado.
3. Adiciona funções com criticidade e notas.
4. Reordena funções e verifica médias no footer.

### Casos de Erro
- Tentar atribuir responsável de outra empresa → bloquear operação.
- Excluir função que não existe → retornar erro de not found.
- Informar nota fora do intervalo 0–10 → validar e rejeitar.

## Restrições
- Múltiplos responsáveis por cargo exigem relação N:N (tabela associativa).
- Hard delete de funções é obrigatório (sem soft delete).

## Impacto Técnico Estimado
- Backend:
  - Ajustar modelo para múltiplos responsáveis por cargo (tabela de associação).
  - Endpoints CRUD para cargos e funções com ordenação.
  - Validações de empresa e intervalo de notas.
- Frontend:
  - Nova aba com layout de multi-cadastro em duas colunas (lista de cargos + detalhe/funções).
  - Reuso do componente de cadastro simplificado de usuários.
  - Footer de médias por cargo.

---
## Observações
- Regra proposta - aguardando implementação.
- Decisão aprovada por: usuário (2026-01-27).
- Prioridade: alta.
