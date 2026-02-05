# Business Analysis: Adicionar Pilar (Customizado ou Template)

**Data:** 2026-02-05  
**Analista:** Business Analyst  
**Feature:** Refatoração de UX - Drawer de Adição de Pilar  
**Versão:** business-v1

---

## 1️⃣ Resumo da Análise

**Modo:** Proposta + Validação  
**Regras Documentadas:** 1 arquivo criado  
**Status:** ✅ **APROVADO**

---

## 2️⃣ Regras Documentadas

### Regra Principal
- [pilar-adicionar-drawer.md](../../2-business-rules/ui/pilar-adicionar-drawer.md) - Fluxos de criação e seleção de pilares com UX melhorada

---

## 3️⃣ Análise de Completude

### ✅ O que está claro

- **Dois fluxos independentes**: Criar novo vs Selecionar template
- **Modo padrão definido**: "Criar Novo Pilar" como padrão (mais usado)
- **Validações documentadas**: Tamanho, duplicação, RBAC
- **Persistência de UX**: Drawer permanece aberto para bulk operations
- **Multi-tenant garantido**: Pilares customizados isolados por `empresaId`

### ⚠️ O que está ausente/ambíguo

**NENHUM bloqueador identificado.** As seguintes questões são menores:

1. **Ordem de validação**: Backend deve validar unicidade por empresa antes de criar (recomendação: use unique constraint em Prisma)
2. **Feedback de duplicação**: Consideramos apenas validação manual frontend para template, mas backend também deve proteger
3. **i18n das mensagens**: Strings estão em português hardcoded - considerar tradução futura

### 🔴 Riscos Identificados

**Segurança:** Nenhum risco crítico
- ✅ Multi-tenant isolado corretamente
- ✅ Soft delete respeitado
- ✅ Sem exposição de dados sensíveis

**RBAC:** Nenhum risco
- ✅ Usuário só cria pilar para sua empresa
- ✅ Sem elevação de privilégio

**Business Logic:** Nenhum risco
- ✅ Regra de duplicação clara
- ✅ Validações coerentes

---

## 4️⃣ Checklist de Riscos Críticos

- [x] RBAC documentado e aplicado? **SIM** - Isolamento por `empresaId`
- [x] Isolamento multi-tenant garantido? **SIM** - Pilares custom pertencem a empresa
- [x] Auditoria de ações sensíveis? **NÃO APLICÁVEL** - Usar auditoria padrão do sistema
- [x] Validações de input? **SIM** - Frontend + recomendação para backend
- [x] Proteção contra OWASP Top 10? **SIM** - Sem injeção, XSS, ou escalation
- [x] Dados sensíveis protegidos? **N/A** - Nomes de pilares não são dados sensíveis

---

## 5️⃣ Bloqueadores

**Nenhum bloqueador identificado.**

Feature pode prosseguir para Dev Agent Enhanced.

---

## 6️⃣ Recomendações

### ✨ Implementação Recomendada

1. **Modo padrão = "Criar Novo"**
   ```typescript
   isCriarNovoMode = true;  // ← Padrão
   ```

2. **Validação em Tempo Real (Frontend)**
   - Tamanho: 2-60 caracteres
   - Duplicação com `pilaresDisponiveis` (templates)
   - Erro inline enquanto digita

3. **Backend: Adicionar Validação Única**
   ```prisma
   // Recomendação: unique constraint
   @@unique([empresaId, nome])
   ```
   Assim, mesmo que frontend falhe, backend bloqueia duplicação.

4. **Mantém Drawer Aberto**
   - Cada adição reseta apenas o input, não fecha
   - Ideal para criar múltiplos pilares rapidamente

### 💡 Melhorias Futuras (Nice-to-have)

- Usar `| translate` para i18n das mensagens
- Mostrar avatar/ícone para diferençar pilares template vs custom
- Cache de pilares para évitar recarregar a cada abertura
- Teclado atalho (TAB para alternar modos)

---

## 7️⃣ Impacto Técnico

**Arquivo Principal:**
- `frontend/src/app/views/pages/diagnostico-notas/pilar-add-drawer/pilar-add-drawer.component.ts`

**Serviços:**
- `PilaresService.findAll()` - Listar pilares templates
- `PilaresEmpresaService.criarPilarCustomizado()`
- `PilaresEmpresaService.vincularPilares()`

**Mudanças:**
1. Remover `[addTag]="addPilarTag"` do ng-select
2. Separar em dois inputs: `ng-select` (select) + `input[text]` (create)
3. Adicionar toggle de modo: `isCriarNovoMode` boolean
4. Implementar `validarNomoPilar()` com feedback inline
5. Simplificar `salvar()` - branch por `isCriarNovoMode`

---

## ✅ Decisão e Próximos Passos

**APROVADO** ✅

- [ ] Próximo: **Dev Agent Enhanced**
- [ ] Dev Agent deve:
  1. Implementar separação de modos (toggle claro)
  2. Modo padrão = "Criar Novo Pilar"
  3. Validação inline em tempo real
  4. Auto-validar padrões de nomeação (kebab-case, PascalCase)
  5. Testar contra regras documentadas
- [ ] Após: **QA Engineer** criará testes E2E validando ambos fluxos

**Pontos críticos para Dev:**
- ✅ Modo padrão TEM que ser "Criar Novo"
- ✅ Validação em tempo real (não apenas on submit)
- ✅ Drawer permanece aberto
- ✅ Remover `pilaresCustomizados` Set (agora desnecessário)

---

**Criado por:** Business Analyst  
**Conforme:** `/.github/agents/business-analyst.md` v2.0  
**Autoridade:** `/docs/DOCUMENTATION_AUTHORITY.md`
