# Business Analysis: Navbar - Dados da Empresa no Modo Admin

**Data:** 2026-01-29  
**Analista:** Business Analyst  
**Regras Documentadas:**
- /docs/business-rules/navbar.md (atualizado)

---

## 1️⃣ Resumo da Análise

- **Modo:** Proposta
- **Regras documentadas:** 2 arquivos criados (+ atualização em navbar.md)
- **Status:** ✅ APROVADO

## 2️⃣ Regras Documentadas

### Regras Propostas
- [docs/business-rules/navbar.md](docs/business-rules/navbar.md) - R-NAV-011 (borda primária no ng-select) e R-NAV-012 (dados da empresa selecionada no modo admin).

## 3️⃣ Análise de Completude

### ✅ O que está claro
- Escopo restrito à navbar.
- Perfis afetados: ADMINISTRADOR.
- Dados exibidos devem espelhar o bloco do perfil cliente (nome, CNPJ e localização).
- Inclusão do status do período de mentoria no bloco de dados da empresa.

### ⚠️ O que está ausente/ambíguo
- Fonte exata do status do período de mentoria no frontend (serviço/endpoint) não está especificada.

### 🔴 Riscos Identificados
- **Segurança:** baixo (exibição de dados já acessíveis ao ADMIN).
- **RBAC:** sem mudança de permissões.
- **Multi-tenant:** sem impacto em isolamento, apenas UI.
- **LGPD:** baixo (dados empresariais já existentes na navbar para perfil cliente).
- **Disponibilidade de dados:** pode exigir integração com período de mentoria ativo.

## 4️⃣ Checklist de Riscos Críticos

- [x] RBAC documentado e aplicado?
- [x] Isolamento multi-tenant garantido?
- [x] Auditoria de ações sensíveis?
- [x] Validações de input?
- [x] Proteção contra OWASP Top 10?
- [x] Dados sensíveis protegidos?

## 5️⃣ Bloqueadores

- Nenhum bloqueador identificado.

## 6️⃣ Recomendações

- Reaproveitar o mesmo layout/formatos do bloco de empresa do perfil cliente para consistência visual.
- Evitar impacto em outros `ng-select` (escopo restrito ao seletor da navbar).
- Alinhar formato do período de mentoria com o padrão já definido em regras de períodos.

## 7️⃣ Decisão e Próximos Passos

- [x] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar regras documentadas em `/docs/business-rules`
- [ ] Atenção especial para: consistência visual, ocultar dados quando não houver seleção, e integração com período de mentoria ativo

---

**Handoff criado automaticamente pelo Business Analyst**
