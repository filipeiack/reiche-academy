# 📘 FLOW.md — Fluxo Oficial de Desenvolvimento

## Objetivo

Este documento define **o fluxo oficial de desenvolvimento**, validação e entrega de código do projeto, utilizando **agentes especializados** e **documentação normativa**.

Nenhuma implementação deve ignorar este fluxo.

---

## 🧭 Princípios Fundamentais

1. **Documentos mandam, agentes obedecem**
2. **Agentes não compartilham memória, compartilham artefatos**
3. **Nenhuma mudança entra no `main` sem validação**
4. **Autoridade documental é centralizada**

---

## 🔐 Autoridade Documental

Todo o fluxo obedece estritamente ao mapeamento definido em:

```
/docs/DOCUMENTATION_AUTHORITY.md
```

Somente documentos classificados como **Fontes de Verdade** podem:
- definir regras de negócio
- impor padrões técnicos
- orientar testes
- bloquear ou permitir PRs

---

## 🤖 Agentes Envolvidos

| Agente | Responsabilidade |
|-----|----------------|
| Dev Agent Disciplinado | Implementar código conforme docs |
| Pattern Enforcer | Validar padrões e convenções |
| QA Unitário Estrito | Criar testes unitários confiáveis |
| Reviewer de Regra | Validar regras de negócio |
| Extractor | Extrair arquitetura e regras AS-IS |

---

## 🔁 Fluxo Completo (Visão Geral)

```text
Requisito
   ↓
Dev Agent Disciplinado
   ↓ (código + relatório)
Pattern Enforcer
   ↓ (CONFORME)
QA Unitário Estrito
   ↓ (testes)
Reviewer de Regra (se necessário)
   ↓
PR aprovado
   ↓
Merge no main
```

---

## 1️⃣ Início do Fluxo — Requisito

O fluxo inicia quando existe **uma demanda clara**, como:
- nova feature
- correção
- ajuste funcional
- melhoria aprovada

📌 O requisito deve estar:
- documentado em `/docs/rules` **OU**
- descrito explicitamente na solicitação

---

## 2️⃣ Implementação — Dev Agent Disciplinado

### Entradas
- Requisito
- `/docs/rules`
- `/docs/architecture`
- `/docs/conventions`

### Ações
- Implementa apenas o escopo solicitado
- Não cria regras de negócio
- Não define padrões
- Não valida o próprio código

### Saída obrigatória (handoff)

```md
### Implementação Concluída

#### Escopo atendido
- Lista objetiva

#### Arquivos alterados/criados
- Caminhos completos

#### Pontos de atenção
- Ambiguidades
- TODOs

#### Próximo passo sugerido
- Pattern Enforcer
```

⚠️ Sem este relatório, o fluxo **não avança**.

---

## 3️⃣ Validação de Padrões — Pattern Enforcer

### Entradas
- Código implementado
- `/docs/conventions`
- `/docs/architecture`

### Ações
- Verifica aderência estrita aos padrões
- Não sugere melhorias
- Não corrige código

### Saída obrigatória

```md
### Pattern Enforcement Report

#### Escopo
- Backend | Frontend | Testes

#### Conformidades
- [✔] ...

#### Violações
- [✖] ...

#### Conclusão
- Status geral: CONFORME | NÃO CONFORME
```

📌 Apenas **CONFORME** permite seguir no fluxo.

---

## 4️⃣ Testes Unitários — QA Unitário Estrito

### Entradas
- Código validado
- `/docs/rules` (somente regras normativas)
- Relatório do Pattern Enforcer

### Ações
- Cria testes unitários reais
- Testa comportamentos explícitos
- Não inventa regras
- Não cobre fluxos não documentados

### Saída
- Arquivos de teste executáveis
- Lista de comportamentos cobertos
- Ambiguidades encontradas

---

## 5️⃣ Validação de Regras — Reviewer de Regra (Opcional)

### Quando usar
- Regras críticas (segurança, permissões, compliance)
- Conflito entre código e documentação

### Ações
- Compara código × `/docs/rules`
- Identifica lacunas
- Não cria nem corrige regras

### Saída
- Relatório de aderência ou divergência

---

## 6️⃣ Pull Request (PR)

O PR deve conter:
- Código implementado
- Testes associados
- Relatórios dos agentes
- Referência ao requisito

📌 O PR é o **checkpoint final humano + IA**.

---

## 7️⃣ Merge no `main`

O merge só pode ocorrer se:
- Pattern Enforcer: **CONFORME**
- Testes: **passando**
- Regras: **validadas** (se aplicável)

Após o merge:
- O código torna-se nova **fonte de verdade**
- O Extractor pode ser acionado para atualização documental

---

## 🧪 Fluxos Alternativos

### 🔄 Atualização de Documentação

```text
Código existente
   ↓
Extractor
   ↓
Reviewer de Regra
   ↓
Docs atualizados
```

---

## 🚨 Regras Inquebráveis

- Nenhum agente valida o próprio trabalho
- Nenhuma regra implícita é aceita
- Nenhum documento fora da autoridade manda
- Nenhum merge sem PR

---

## 🎯 Conclusão

Este fluxo existe para:
- eliminar ambiguidade
- conter drift de IA
- preservar padrões
- escalar o projeto com segurança

Qualquer exceção a este fluxo deve ser **explícita e documentada**.

