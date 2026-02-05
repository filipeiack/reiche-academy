# Business Analysis: Indicadores Templates Globais + Ordenação de Submenu Cockpits

**Data:** 2026-02-02  
**Analista:** Business Analyst  
**Regras Documentadas:** 
- /docs/business-rules/indicadores-templates-globais.md
- /docs/business-rules/sidebar-cockpit-submenu-ordenacao.md

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta
- **Regras documentadas:** 2 arquivos criados
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Propostas
- indicadores-templates-globais.md — CRUD global de indicadores templates e cópia para IndicadorCockpit (Snapshot Pattern)
- sidebar-cockpit-submenu-ordenacao.md — Ordenação alfabética do submenu de Cockpits

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Indicadores templates são globais e vinculados a Pilar Template.
- Ao criar cockpit com `pilarTemplateId`, indicadores templates são copiados para `IndicadorCockpit`.
- CRUD de indicadores templates deve existir no menu de administrador e ser baseado em telas de rotinas.
- Submenu de cockpits deve ser ordenado alfabeticamente por nome do pilar (ordenação simples).
- Indicador template **não possui** campo `responsavel`.
- `nome` é único **por pilar template**.
- Ao copiar para `IndicadorCockpit`, auto-criar **12** `IndicadorMensal` (jan-dez).
- Templates criados após o cockpit **não** são copiados retroativamente.

### ⚠️ O que está ausente/ambíguo
- Não há lacunas críticas adicionais informadas.

### 🔴 Riscos Identificados
- **Segurança/RBAC:** CRUD de templates precisa estar restrito a ADMINISTRADOR (não explicitado em detalhe).
- **Multi-tenant:** Cópia de templates para cockpit deve respeitar empresa do cockpit (evitar vazamento de dados).
- **LGPD:** Campo `responsavel` pode envolver dados pessoais sem definição de origem/escopo.

## 4️⃣ Checklist de Riscos Críticos

- [ ] RBAC documentado e aplicado?
- [ ] Isolamento multi-tenant garantido?
- [ ] Auditoria de ações sensíveis?
- [ ] Validações de input?
- [ ] Proteção contra OWASP Top 10?
- [ ] Dados sensíveis protegidos?

## 5️⃣ Bloqueadores

**Regras ausentes que IMPEDEM continuidade:**

- Nenhum bloqueador crítico identificado.

## 6️⃣ Recomendações

**Não vinculantes - decisão humana necessária:**

- Nenhuma recomendação adicional.

## 7️⃣ Decisão e Próximos Passos

**Status atual:** ⚠️ APROVADO COM RESSALVAS
- [ ] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar regras documentadas em `/docs/business-rules`
- [ ] Atenção especial para: definição de unicidade, `responsavel`, e criação de meses

---

**Handoff criado automaticamente pelo Business Analyst**
