# Document Authority Map

Este documento define quais arquivos possuem
autoridade normativa sobre o sistema.

## Hierarquia de Precedência

Em caso de conflito, a ordem de autoridade é:

**0. Humano** (decisão final sempre)  
**1. FLOW.md** (define workflow obrigatório)  
**2. /.github/agents/** (define escopo e poderes de cada agente)  
**3. /docs/business-rules/** (regras de negócio aprovadas)  
**4. /docs/adr/** (decisões arquiteturais registradas)  
**5. /docs/architecture/** (estrutura técnica do sistema)  
**6. /docs/conventions/** (padrões de código e organização)  
**7. /docs/handoffs/** (contratos entre agentes em execução)  

## Fontes de Verdade (OBRIGATÓRIAS)

### Nível 1: Workflow
- **`/docs/FLOW.md`**  
  Define o fluxo oficial de desenvolvimento, sequência de agentes, e regras de transição.
  Nenhum agente pode atuar fora deste fluxo sem aprovação humana explícita.

### Nível 2: Agentes
- **`/.github/agents/`** (v2.0 - 4 agentes consolidados)
  Define escopo, ferramentas, restrições e responsabilidades de cada agente.
  Agentes não podem executar ações fora de suas definições.
  
  **Agentes oficiais (v2.0):**
  - 0-System_Engineer.md (meta-governança: 3 modos)
  - 1-Business_Analyst.md (extração + validação de regras)
  - 2-DEV_Agent_Enhanced.md (implementação + auto-validação de padrões)
  - 3-QA_Engineer.md (testes unitários + E2E independentes)
  
  **Histórico v1.0:** `/docs/history/agents-v1/` (7 agentes - arquivado)  
  **ADR:** ADR-008 (consolidação 7→4 agentes)

### Nível 3: Regras de Negócio
- **`/docs/business-rules/`**  
  Regras de domínio aprovadas. Fonte de verdade para comportamento do sistema.
  Código e testes devem proteger estas regras.

### Nível 4: Decisões Arquiteturais
- **`/docs/adr/` (Architecture Decision Records)**  
  Decisões técnicas aprovadas e justificadas.
  Precedem convenções genéricas quando houver conflito.

### Nível 5: Arquitetura
- **`/docs/architecture/`**  
  Estrutura técnica, diagramas, dependências, camadas.
  Define "como o sistema é construído".

### Nível 6: Convenções
- **`/docs/conventions/`**  
  Padrões de código, naming, estrutura de pastas, formatação.
  Dev Agent Enhanced valida padrões durante implementação (auto-validação).

### Nível 7: Handoffs (Execução)
- **`/docs/handoffs/`**  
  Contratos versionados entre agentes durante desenvolvimento de features.
  Normativos dentro do contexto de uma feature específica.
  Ver `/docs/handoffs/README.md` para estrutura completa.

## Documentos NÃO Normativos

Os documentos abaixo são apenas **informativos, históricos ou guias de referência**.  
Eles **NÃO definem regras** nem **padrões obrigatórios**.

### Informativos/Referência
- `/docs/reference/*` - Documentação de apoio
- `/CONTEXT.md` - Contexto histórico do projeto
- `/README.md` - Visão geral para usuários/contribuidores
- `/docs/guides/*` - Tutoriais e guias (se existirem)

### Históricos/Arquivados
- `/docs/history/*` - Documentos obsoletos mantidos para referência
- Qualquer arquivo marcado com `[DEPRECATED]` ou `[HISTORICAL]`

### Regra Geral
Qualquer `.md` **fora dos diretórios normativos** listados acima
é considerado **não-normativo** por padrão.

## Regras de Conflito

### Quando há conflito entre documentos normativos:

1. **Seguir hierarquia de precedência** (Nível 1 > Nível 2 > ... > Nível 7)

2. **Notificar humano imediatamente:**
   ```
   ⚠️ CONFLITO DETECTADO:
   - Documento A (/docs/X) diz: [...]
   - Documento B (/docs/Y) diz: [...]
   - Precedência: A > B (Nível X > Nível Y)
   - Decisão: Seguir documento A, mas requer validação humana
   ```

3. **Agente DEVE parar e aguardar decisão humana se:**
   - Conflito impacta segurança ou dados
   - Conflito envolve regras de negócio críticas
   - Documentos têm mesmo nível de precedência

### Quando documento normativo está ausente:

- ❌ **Agente NÃO PODE inventar regra**
- ✅ **Agente DEVE:**
  1. Parar execução
  2. Listar o que falta
  3. Indicar qual agente/documento resolveria a lacuna
  4. Aguardar orientação humana

## Atualização de Documentos Normativos

### Quem pode modificar:

| Documento | Agente Autorizado | Requer ADR? |
|-----------|-------------------|-------------|
| FLOW.md | System Engineer | Sim (mudanças estruturais) |
| /.github/agents/ | System Engineer | Sim (criar/remover agentes) |
| /docs/business-rules/ | Extractor (propor) + Humano (aprovar) | Não |
| /docs/adr/ | Tech Writer + Humano | N/A (já é ADR) |
| /docs/architecture/ | Tech Writer | Sim (mudanças significativas) |
| /docs/conventions/ | System Engineer | Sim (novos padrões) |
| /docs/handoffs/ | Agentes durante fluxo | Não (efêmeros por feature) |

### Princípio Imutável:

**Nenhum agente pode modificar documento normativo sem:**
1. Estar explicitamente autorizado (tabela acima)
2. Seguir processo definido no agente responsável
3. Aprovação humana (exceto handoffs automáticos)

---

## Validação de Conformidade

Agentes devem validar se estão seguindo autoridade correta:

```md
✅ Checklist de Autoridade:
- [ ] Consultei FLOW.md para confirmar etapa atual?
- [ ] Li definição do meu agente em /.github/agents/?
- [ ] Identifiquei regras de negócio em /docs/business-rules/?
- [ ] Verifiquei ADRs relevantes em /docs/adr/?
- [ ] Consultei convenções em /docs/conventions/?
- [ ] Li handoff de entrada (se aplicável)?
- [ ] Não inventei regra não documentada?
```

---

## Exceções Controladas

### System Engineer
- Pode alterar FLOW.md e /.github/agents/
- **Sempre requer aprovação humana**
- Documenta mudanças em ADR

### Handoffs
- Agentes criam automaticamente durante fluxo
- Não requerem aprovação prévia (mas são auditáveis)
- Versionados e rastreáveis

---

## Regra Final

**Se não está nos documentos normativos, não é permitido.**

Criatividade sem respaldo documental é proibida.

Em caso de dúvida:
1. Parar
2. Listar o que está faltando
3. Aguardar orientação humana
