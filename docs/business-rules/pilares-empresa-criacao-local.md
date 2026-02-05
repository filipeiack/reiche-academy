# Regra: Criação de Pilar na Empresa não cria Pilar Global

## Contexto
Gestão de pilares dentro do formulário de empresas (empresas-form), com criação de pilares diretamente no contexto da empresa.

## Descrição
Ao criar um pilar na tela de gestão de pilares do empresas-form, o sistema deve criar **apenas** o registro em `PilarEmpresa` (instância da empresa). **Nunca** deve criar ou alterar registros na tabela de pilares globais (`Pilar`).

## Condição
Quando o usuário cria um novo pilar a partir da gestão de pilares no empresas-form.

## Comportamento Esperado
- Criar registro em `PilarEmpresa` associado à empresa em contexto.
- Não criar registro em `Pilar` (tabela global).
- O pilar criado aparece apenas na lista de pilares da empresa.

## Cenários

### Happy Path
1. Usuário cria um pilar na tela empresas-form.
2. Sistema grava apenas em `PilarEmpresa`.
3. O pilar passa a existir apenas no escopo da empresa.

### Casos de Erro
- Tentativa de criação no contexto de empresa inexistente.

## Restrições
- Aplica-se somente à criação via empresas-form.
- Perfis autorizados seguem as regras já definidas para gestão de pilares da empresa.

## Impacto Técnico Estimado
- Frontend: criação deve chamar endpoint de `PilarEmpresa` (não `Pilar`).
- Backend: garantir que o endpoint de criação para empresa não propague para pilares globais.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: Aguardando validação humana
- Prioridade: média
