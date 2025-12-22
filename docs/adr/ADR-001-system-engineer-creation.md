# ADR-001: Criação do System Engineer (Meta-Agente)

## Status
Aceita

## Contexto

Durante a evolução do sistema de agentes, identificou-se uma **lacuna de governança crítica**:

**Problema:**  
Não havia agente autorizado a modificar a própria estrutura de governança (FLOW.md, definições de agentes, hierarquia documental).

**Situação observada:**  
Quando mudanças estruturais eram necessárias (ex: adicionar Tech Writer ao FLOW), a IA:
- Ou assumia papel não autorizado (violando princípios)
- Ou recusava executar (criando fricção)

**Necessidade identificada:**  
Um agente com escopo restrito e controlado para manutenção da **estrutura que governa o desenvolvimento**, mas que **nunca participa do desenvolvimento em si**.

---

## Decisão

Criar **System Engineer** (`0-System_Engineer.md`) com as seguintes características:

### Autoridade
- Opera no **meta-nível** (acima do FLOW, mas abaixo do humano)
- Único agente autorizado a modificar:
  - Definições de agentes
  - FLOW.md
  - DOCUMENTATION_AUTHORITY.md
  - Estrutura documental normativa

### Restrições
- **Nunca atua em código de produção**
- **Nunca define regras de negócio**
- **Sempre requer aprovação humana explícita**
- **Mudanças críticas exigem ADR**
- **Não pode auto-modificar sem ADR + aprovação**

### Salvaguardas
1. Ativação explícita obrigatória
2. Change Report obrigatório em toda mudança
3. ADR obrigatório para mudanças críticas
4. Versionamento via git
5. Rollback sempre possível

### Posicionamento
- Não entra no diagrama do FLOW (opera fora dele)
- Seção separada no FLOW.md: "Manutenção da Estrutura (Meta-Nível)"
- Numeração especial: `0-` (indica precedência conceitual)

---

## Consequências

### Positivas
- ✅ **Lacuna fechada:** Agora há forma controlada de evoluir a governança
- ✅ **Rastreabilidade:** Toda mudança estrutural é documentada
- ✅ **Segurança:** Salvaguardas impedem abuso de poder
- ✅ **Consistência:** Um único ponto responsável pela estrutura
- ✅ **Flexibilidade:** Sistema pode evoluir sem violar princípios

### Negativas
- ⚠️ **Complexidade adicional:** Mais um agente a ser compreendido
- ⚠️ **Risco de "super-agente":** Poder concentrado (mitigado por salvaguardas)
- ⚠️ **Overhead:** Mudanças estruturais agora têm processo formal

### Neutras
- 🔄 **Precedente:** Cria categoria "meta-agente" (pode ser único ou expandir)
- 📚 **Documentação:** Requer manutenção de ADRs sobre governança

---

## Alternativas Consideradas

### 1. Manter apenas controle humano manual
**Por quê rejeitado:**  
- Criava fricção desnecessária
- Não aproveitava capacidade da IA para mudanças mecânicas
- Não resolvia o problema de consistência

### 2. Dar poder ao Advisor
**Por quê rejeitado:**  
- Advisor é consultivo por definição
- Violaria separação de responsabilidades
- Confundiria escopo (consultar vs executar)

### 3. Expandir escopo do Tech Writer
**Por quê rejeitado:**  
- Tech Writer documenta decisões, não governa estrutura
- Confundiria dois papéis distintos
- Tech Writer é pós-merge, System Engineer é meta-nível

### 4. Criar "God Mode" sem restrições
**Por quê rejeitado:**  
- Extremamente perigoso
- Violaria todos os princípios de governança
- Sem salvaguardas adequadas

---

## Implementação

### Arquivos Criados
- `/.github/agents/0-System_Engineer.md` (definição completa)
- `/docs/adr/ADR-001-system-engineer-creation.md` (este documento)

### Arquivos Modificados
- `/docs/FLOW.md`:
  - Adicionada coluna "Nível" na tabela de agentes
  - Adicionada seção "🔧 Manutenção da Estrutura (Meta-Nível)"
  - Atualizado "Meta-Princípio" na conclusão

### Estrutura de Segurança
- ADR obrigatório para mudanças críticas
- Change Report obrigatório sempre
- Checklist de validação de impacto
- Versionamento via git
- Humano sempre tem última palavra

---

## Validação

### Teste Conceitual
**Cenário:** Precisamos adicionar novo agente ao fluxo

**Antes (sem System Engineer):**
- ❌ IA violava escopo ou recusava executar
- ❌ Inconsistências entre FLOW e agentes
- ❌ Sem rastreabilidade

**Depois (com System Engineer):**
- ✅ Ativação: "Atue como System Engineer"
- ✅ Criação do agente com todas as seções padronizadas
- ✅ Atualização automática do FLOW.md
- ✅ Change Report gerado
- ✅ ADR criado (se aplicável)
- ✅ Aprovação humana antes de finalizar

---

## Riscos Identificados

### Risco 1: Concentração de Poder
**Mitigação:**
- Salvaguardas múltiplas
- Aprovação humana obrigatória
- ADR para mudanças críticas
- Não pode auto-modificar facilmente

### Risco 2: Uso Indevido
**Mitigação:**
- Ativação explícita obrigatória
- Escopo muito claro (não atua em código)
- Proibições absolutas documentadas

### Risco 3: Complexidade para Novos Usuários
**Mitigação:**
- Documentação clara
- Advisor pode explicar quando usar
- System Engineer é raramente ativado

---

## Próximos Passos

1. ✅ System Engineer criado e documentado
2. ✅ FLOW.md atualizado
3. ✅ ADR-001 criado
4. [ ] Testar em cenário real (criar próximo agente via System Engineer)
5. [ ] Avaliar necessidade de ajustes após uso prático
6. [ ] Considerar criar template para novos agentes

---

## Referências

- `/docs/FLOW.md` - Fluxo oficial
- `/docs/DOCUMENTATION_AUTHORITY.md` - Hierarquia documental
- `/.github/agents/0-System_Engineer.md` - Definição do agente
- `/.github/copilot-instructions.md` - Princípios de governança

---

**Decisão tomada por:** Humano (Filipe)  
**Implementado por:** System Engineer (primeira atuação)  
**Data:** 2025-12-22  
**Revisão necessária:** Após 3-6 meses de uso
