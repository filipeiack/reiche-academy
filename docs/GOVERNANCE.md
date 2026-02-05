# 🏛️ Governança do Projeto - Fluxo e Autoridade

**Versão compacta para leitura rápida de agentes**

---

## 🎯 Hierarquia de Autoridade (IMUTÁVEL)

1. **Humano** - decisão final sempre
2. **FLOW.md** - workflow obrigatório  
3. **/.github/agents/** - definição de agentes
4. **/docs/business-rules/** - regras de negócio
5. **/docs/3-architecture/** - estrutura técnica
6. **/docs/4-conventions/** - padrões de código
7. **/docs/6-handoffs/** - execução entre agentes

---

## 🤖 Agentes Oficiais (v2.0)

| # | Agente | Função | Documento |
|---|--------|--------|-----------|
| **0** | System Engineer | Meta-governança | `/.github/agents/0-System_Engineer.md` |
| **1** | Business Analyst | Regras + Validação | `/.github/agents/1-Business_Analyst.md` |
| **2** | Dev Agent Enhanced | Código + Auto-validação | `/.github/agents/2-DEV_Agent_Enhanced.md` |
| **3** | QA Engineer | Testes independentes | `/.github/agents/3-QA_Engineer.md` |

🚫 **Qualquer outro agente NÃO EXISTE** para este projeto.

---

## 🔁 Fluxo Oficial (3 Handoffs)

```
Feature Request
        ↓
Business Analyst → docs/handoffs/<feature>/business-v1.md
        ↓ (APROVADO)
Dev Agent Enhanced → docs/handoffs/<feature>/dev-v1.md  
        ↓ (padrões validados)
QA Engineer → docs/handoffs/<feature>/qa-v1.md
        ↓ (testes passando)
Pull Request → Merge → System Engineer (docs)
```

**Handoffs:** Contratos versionados entre agentes em `/docs/6-handoffs/`

---

## ⚡ Regras Críticas

### ✅ O QUE PODE:
- Seguir regras documentadas em `/docs/business-rules/`
- Usar padrões em `/docs/4-conventions/`
- Consultar arquitetura em `/docs/3-architecture/`
- Criar handoffs conforme estrutura padrão

### ❌ O QUE NÃO PODE:
- Inventar regras de negócio
- Ignorar hierarchy documental
- Atuar sem handoff formal
- Misturar responsabilidades de agentes

---

## 🛡️ Safe Failure Rule

**Se algo estiver faltando:**
1. **PARE** a execução
2. Liste o que falta
3. Indique qual documento/agente resolveria
4. **AGUARDE** orientação humana

**Silêncio é melhor que erro.**

---

## 📋 Checklists Rápidos

### Antes de Codificar (Dev):
- [ ] Li regras em `/docs/business-rules/`?
- [ ] Verifiquei padrões em `/docs/4-conventions/`?
- [ ] Tenho handoff do Business Analyst?

### Antes de Testar (QA):
- [ ] Li handoff do Dev?
- [ ] Estou testando REGRAS (não código)?
- [ ] Não vou alterar produção?

### Para Qualquer Ação:
- [ ] Qual agente deve fazer isso?
- [ ] Tenho autoridade documental?
- [ ] Segui FLOW.md corretamente?

---

## 🎯 Ativação de Agentes

**Use comandos explícitos:**
```
"Atue como Business Analyst"
"Atue como Dev Agent Enhanced" 
"Atue como QA Engineer"
"Atue como System Engineer"
```

**Nunca** atue sem definição explícita.

---

## 📚 Referências Rápidas

- **Regras de Negócio**: `/docs/2-business-rules/`
- **Padrões**: `/docs/4-conventions/backend-patterns.md`, `/docs/4-conventions/frontend-patterns.md`
- **Arquitetura**: `/docs/3-architecture/overview.md`
- **Handoffs**: `/docs/6-handoffs/README.md`

---

## 🔚 Regra Final

**Se não está documentado, não é permitido.**

Criatividade sem respaldo = proibido.
Documentação mandam, agentes obedecem.

---

**Criado para velocidade de leitura de agentes. Versão completa em `FLOW.md` e `DOCUMENTATION_AUTHORITY.md`.**