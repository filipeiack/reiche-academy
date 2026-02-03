# Regra: Fuso horário padrão São Paulo para datas

## Contexto
Sistema completo (backend, frontend, integrações e banco de dados).
Aplica-se a qualquer fluxo que leia, compare, persista ou exiba datas e horários.

## Descrição
Todas as datas e horários do sistema devem ser tratados no fuso horário de São Paulo (America/Sao_Paulo).
Não é permitido persistir datas em UTC nem utilizar o fuso horário do navegador para armazenamento.

## Condição
Quando o sistema:
- Recebe datas/horas em requests de API, importações, jobs ou integrações.
- Compara datas para regras de negócio (status, prazos, vencimentos).
- Persiste datas no PostgreSQL.
- Exibe datas no frontend ou em relatórios.

## Comportamento Esperado
- **Normalização obrigatória:** toda data recebida deve ser normalizada para America/Sao_Paulo antes de qualquer cálculo ou persistência.
- **Persistência:** o PostgreSQL deve armazenar datas no fuso horário de São Paulo. Não gravar UTC nem fuso local do browser.
- **Comparações:** regras de negócio que comparam datas devem considerar America/Sao_Paulo como referência.
- **Exibição:** o frontend deve exibir datas em America/Sao_Paulo, independente do fuso do navegador.
- **Conversão:** se a entrada vier com fuso diferente, converter para America/Sao_Paulo antes de salvar; se a conversão não for possível, a operação deve falhar.

## Cenários

### Happy Path
1. Usuário informa uma data de início.
2. Backend normaliza a data para America/Sao_Paulo.
3. A data é persistida no PostgreSQL no fuso de São Paulo.
4. Ao consultar, a data retorna e é exibida em America/Sao_Paulo.

### Casos de Erro
- Entrada com fuso inválido ou não interpretável → rejeitar a operação.
- Tentativa de persistir data em UTC → impedir e registrar erro.

## Restrições
- Proibido gravar datas em UTC.
- Proibido persistir datas baseadas no fuso do navegador.
- A normalização deve ocorrer no backend, não no frontend.

## Impacto Técnico Estimado
- Backend: normalização de datas em serviços, jobs e integrações; comparações de datas alinhadas ao fuso America/Sao_Paulo.
- Banco de dados: padronização de persistência e possível migração de dados existentes.
- Frontend: exibição padronizada em America/Sao_Paulo (pipes, formatação, grids, relatórios).

---
## Observações
- Regra proposta - aguardando implementação.
- Decisão aprovada por: usuário (2026-02-03).
- Prioridade: alta.
