# Dev Handoff: Seed Cockpit Marketing (Templates)

**Data:** 2026-02-02  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** [docs/business-rules/objetivos-templates-globais.md](docs/business-rules/objetivos-templates-globais.md), [docs/business-rules/indicadores-templates-globais.md](docs/business-rules/indicadores-templates-globais.md)  
**Business Analyst Handoff:** [docs/handoffs/objetivos-templates/business-v1.md](docs/handoffs/objetivos-templates/business-v1.md)

---

## 1️⃣ Escopo Implementado

- Cockpit de Marketing agora respeita objetivos e indicadores templates do pilar (snapshot via seed).
- Valores mensais do Marketing atualizam registros existentes quando já houver meses criados.
- Ajustado dataset de indicadores do Marketing para refletir templates atuais.

## 2️⃣ Arquivos Criados/Alterados

### Backend
- backend/prisma/seed.ts - cockpit de Marketing baseado em templates, ajustes nos indicadores e valores mensais.

## 3️⃣ Decisões Técnicas

- Cockpit de Marketing usa `pilarTemplateId` para copiar `objetivoTemplate` e `indicadorTemplate` (alinhado ao snapshot do serviço).
- Valores mensais fazem update quando o mês já existe, preservando criação prévia de meses.

## 4️⃣ Auto-Validação de Padrões

**Checklist executado:**

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura de pastas correta
- [x] DTOs com validadores (não aplicável)
- [x] Prisma com .select() (não aplicável)
- [x] Soft delete respeitado (não aplicável)
- [x] Guards aplicados (não aplicável)
- [x] Audit logging implementado (não aplicável)

### Frontend
- [x] Standalone components (não aplicável)
- [x] inject() function usado (não aplicável)
- [x] Control flow moderno (não aplicável)
- [x] Translations aplicadas (não aplicável)
- [x] ReactiveForms (não aplicável)
- [x] Error handling (não aplicável)

**Violações encontradas durante auto-validação:**
- Nenhuma.

## 5️⃣ Ambiguidades e TODOs

- [ ] Confirmar quando executar `npx prisma migrate reset --force` em vez de rodar seed isoladamente.

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos criados (se houver):**
- Nenhum.

**Cobertura preliminar:**
- Não aplicável.

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- [RN-OBJ-01] Objetivos do cockpit respeitam template do pilar - Arquivo: backend/prisma/seed.ts
- [RN-IND-01] Indicadores do cockpit respeitam template do pilar - Arquivo: backend/prisma/seed.ts

**Regras NÃO implementadas (se houver):**
- Nenhuma.

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** validar se o seed deve preservar dados existentes ou sempre limpar base.
- **Prioridade de testes:** criação do cockpit de Marketing e indicadores a partir dos templates.

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Seed pode gerar conflitos caso seja executado sem reset em base com dados incompatíveis.

**Dependências externas:**
- Nenhuma.

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
