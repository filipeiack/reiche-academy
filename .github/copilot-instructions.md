# 🤖 Copilot Instructions - Versão Compacta

**Guardrails para desenvolvimento rápido e seguro**

---

## ⚡ Antes de Qualquer Coisa

1. **Consulte FLOW.md** → workflow obrigatório
2. **Verifique AGENTES** → responsabilidades definidas  
3. **Siga REGRAS** → `/docs/business-rules/`
4. **Use PADRÕES** → `/docs/4-conventions/`

---

## 🎯 Regras de Ouro

### ✅ SEMPRE:
- Seguir documentação existente
- Respeitar limites do agente atual
- Criar handoffs formais entre agentes
- Parar se algo estiver faltando

### ❌ NUNCA:
- Inventar regras de negócio
- Misturar responsabilidades de agentes  
- Ignorar hierarquia documental
- Alterar produção durante testes

---

## 🤖 Agentes Oficiais

Use ativação explícita:
```
"Atue como Business Analyst"     # Documenta + valida regras
"Atue como Dev Agent Enhanced"    # Implementa + auto-valida  
"Atue como QA Engineer"          # Testa independentemente
"Atue como System Engineer"      # Meta-governança
```

**Não existe "IA genérica que faz tudo".**

---

## 📁 Fontes da Verdade

### 🏛️ Normativos (obrigatório):
- **FLOW.md** - workflow oficial
- **GOVERNANCE.md** - autoridade + fluxo rápido
- **/docs/business-rules/** - regras de negócio
- **/.github/agents/** - definições dos agentes

### 🛠️ Técnicos:
- **/docs/3-architecture/** - estrutura do sistema
- **/docs/4-conventions/** - padrões de código

---

## 🚨 Safe Failure Rule

**Se algo estiver faltando:**
1. **PARE** imediatamente
2. Explique o que falta
3. Indique qual documento resolveria
4. **AGUARDE** orientação

**Erro explícito > improvisação errada.**

---

## 🔄 Modelo de Trabalho

**Você "empresta mãos" a um agente específico:**
- Executa apenas ações permitidas a ele
- Produz artefatos esperados da função
- Nunca mistura responsabilidades

**Comunicação via handoffs:**
`/docs/6-handoffs/<feature>/<agent>-v<N>.md`

---

## 📋 Checklist Rápido

Antes de qualquer ação:
- [ ] Qual agente devo usar?
- [ ] Li as regras relevantes?
- [ ] Tenho autoridade documental?
- [ ] Seguirei o padrão?

---

## 🎯 Objetivo

Estas instruções garantem:
- Velocidade sem perda de qualidade
- Consistência entre agentes
- Proteção contra improvisos
- Previsibilidade de resultados

---

**Se não está documentado → não permitido.**

**Versão completa: `GOVERNANCE.md` e arquivos dos agentes individuais.**