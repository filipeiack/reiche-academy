# Regra: Exibição do Cargo do Usuário baseado no Cockpit

## Contexto
Tela de cadastro/edição de usuários (usuarios-form). O campo "Cargo na Empresa" deve refletir a associação do usuário a cargos do Cockpit (CargoCockpit + CargoCockpitResponsavel).

## Descrição
O campo "Cargo na Empresa" deixa de ser um texto livre e passa a exibir o cargo associado ao usuário no Cockpit. Enquanto não houver associação, deve exibir mensagem informando associação posterior.

## Condição
Aplicar-se ao abrir o formulário de usuários (criação/edição) e na exibição do resumo do usuário.

## Comportamento Esperado
1. **Sem associação registrada** (nenhum registro em CargoCockpitResponsavel para o usuário):
   - Exibir mensagem: “Cargo será associado posteriormente.”
2. **Com associação registrada**:
   - Exibir **lista** de cargos com **nome do cargo** (CargoCockpit.cargo) e **nome do pilar** (PilarEmpresa.nome, via CockpitPilar).

## Cenários

### Happy Path
- Usuário sem cargo associado abre o formulário → campo exibe “Cargo será associado posteriormente.”
- Após criação de CargoCockpitResponsavel, o mesmo usuário abre o formulário → campo exibe lista com “<Cargo> — <Pilar>”.

### Casos de Erro
- Associação aponta para CargoCockpit inexistente → retornar erro de integridade e não exibir cargo.

## Restrições
- Se houver múltiplos cargos, o campo deve exibir **lista** de cargos/pilares.

## Impacto Técnico Estimado
- **Backend:** consulta de cargo via CargoCockpitResponsavel → CargoCockpit → CockpitPilar → PilarEmpresa.
- **Frontend:** campo “Cargo na Empresa” em modo somente leitura, exibindo placeholder quando não houver associação.
- **Dados legados:** campo `Usuario.cargo` pode ser descontinuado (deprecação/remover em etapa posterior).

---
## Observações
- Regra proposta - aguardando implementação.
- Decisão aprovada por: usuário (2026-01-29)
- Prioridade: média
