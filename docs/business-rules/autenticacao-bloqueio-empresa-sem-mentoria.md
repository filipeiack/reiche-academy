# Regra: Bloqueio de Login sem Empresa Ativa e Mentoria Ativa

## Contexto
Autenticação de usuários vinculados a empresas no sistema.

## Descrição
Ao encerrar um período de mentoria, os usuários da empresa perdem acesso ao sistema. A tela de login deve validar se a empresa do usuário está ativa e se existe período de mentoria ativo; caso contrário, o login deve ser bloqueado.

## Condição
Durante o processo de login/autenticação.

## Comportamento Esperado
- Validar se a empresa do usuário está **ativa**.
- Validar se a empresa possui **período de mentoria ativo**.
- Se qualquer validação falhar, negar o login com mensagem adequada.
- Mensagem sugerida: "A empresa está inativa ou sem mentoria ativa. Contate o administrador.".

## Cenários

### Happy Path
1. Usuário tenta login.
2. Empresa está ativa e possui período de mentoria ativo.
3. Login é autorizado.

### Casos de Erro
- Empresa inativa.
- Empresa sem período de mentoria ativo.

## Restrições
- Aplica-se a usuários **vinculados a empresa**.
- Usuários **sem empresa vinculada** (ex.: ADMINISTRADOR global) **não são bloqueados** por esta regra.

## Impacto Técnico Estimado
- Backend: validação adicional no fluxo de autenticação.
- Frontend: exibir mensagem de bloqueio na tela de login.
- Auditoria: registrar tentativa bloqueada (usuário, empresaId, motivo, timestamp, IP).

---
## Observações
- Regra proposta - aguardando implementação
- Decisão aprovada por: Aguardando validação humana
- Prioridade: alta
