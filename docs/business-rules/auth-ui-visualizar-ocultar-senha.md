# Regra: Visualizar/ocultar senha em campos de autenticação

## Contexto
Interfaces com campos de senha nas telas:
- Login
- Usuários (formulário de alteração de senha)
- Esqueci minha senha / Reset de senha

## Descrição
O usuário pode alternar a visualização da senha digitada entre **oculta** e **visível** diretamente no campo de senha.

## Condição
Quando um campo de senha é exibido nas telas acima.

## Comportamento Esperado
- O campo inicia com a senha **oculta** (tipo `password`).
- Existe um controle visual (ícone/botão) associado ao campo para alternar entre **mostrar** e **ocultar** a senha.
- Ao alternar, o tipo do campo muda para `text` (visível) ou `password` (oculto).
- A alternância **não** altera o valor digitado e **não** afeta validações.
- A alternância é **local** ao campo (não afeta outros campos de senha na mesma tela).

## Cenários

### Happy Path
1. Usuário abre a tela com campo de senha.
2. O campo está oculto por padrão.
3. Usuário clica no controle de visualização.
4. O campo exibe a senha.
5. Usuário clica novamente para ocultar.

### Casos de Erro
- Não há erro funcional esperado; a alternância é puramente visual.

## Restrições
- Não persiste estado entre sessões.
- Não envia dados adicionais ao backend.

## Impacto Técnico Estimado
- Frontend: templates e componentes das telas de login, usuários-form (alteração de senha) e esqueci/reset de senha.

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: <pendente>
- Prioridade: média
