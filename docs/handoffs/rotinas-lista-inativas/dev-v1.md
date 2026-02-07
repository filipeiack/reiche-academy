# Dev Handoff: Rotinas - Listar Inativas

**Data:** 2026-02-07  
**Desenvolvedor:** Dev Agent Enhanced  
**Regras Base:** Arquitetura existente de CRUD  
**Business Analyst Handoff:** N/A (ajuste técnico)

---

## 1️⃣ Escopo Implementado

- Lista de rotinas agora exibe rotinas inativas também
- Apenas removido filtro `ativo: true` do backend
- Frontend já possuía toda visualização necessária (badges de status, toggle ativo/inativo)

## 2️⃣ Arquivos Criados/Alterados

### Backend
- `backend/src/modules/rotinas/rotinas.service.ts` - Removido filtro `ativo: true` do método `findAll()`

### Frontend
- Nenhuma alteração necessária (interface já está preparada)

## 3️⃣ Decisões Técnicas

**Filtro de ativo removido:**
- Antes: `where: { ativo: true, ...(pilarId && { pilarId }) }`
- Depois: `where: { ...(pilarId && { pilarId }) }`
- Mantida ordenação por pilar e ordem

**Interface já preparada:**
- Badge de status (ativo/inativo) já existe
- Botão de toggle para ativar/inativar já existe
- Ações (detalhes, editar, excluir) já tratam status corretamente
- Botão de excluir só aparece para rotinas ativas (condicional `@if (rotina.ativo)`)

## 4️⃣ Auto-Validação de Padrões

### Backend
- [x] Naming conventions seguidas
- [x] Estrutura mantida
- [x] Prisma com `.select()` explícito no include do pilar
- [x] Soft delete respeitado (apenas exibição, não hard delete)
- [x] Ordenação mantida

**Violações encontradas durante auto-validação:**
- Nenhuma violação encontrada

## 5️⃣ Ambiguidades e TODOs

- Nenhuma ambiguidade identificada
- Comportamento consistente com outras listagens que mostram inativos

## 6️⃣ Testes de Suporte

**Nota:** Testes unitários finais são responsabilidade do QA Engineer.

**Testes básicos sugeridos:**
- Verificar que rotinas inativas aparecem na lista
- Verificar que badge de status indica corretamente ativo/inativo
- Verificar que botão de excluir não aparece para rotinas inativas
- Verificar que toggle funciona para ativar/inativar

## 7️⃣ Aderência a Regras de Negócio

**Regras implementadas:**
- Soft delete: rotinas inativas permanecem no banco mas sinalizadas
- Exclusão só disponível para rotinas ativas (regra existente mantida)
- Interface visual diferencia status claramente

## 8️⃣ Status para Próximo Agente

- ✅ **Pronto para:** QA Engineer
- **Atenção:** Validar que rotinas inativas aparecem corretamente na lista
- **Prioridade de testes:** Comportamento de toggle e exclusão conforme status

## 9️⃣ Riscos Identificados

**Riscos técnicos:**
- Nenhum identificado (mudança mínima e bem definida)

**Dependências externas:**
- Nenhuma

---

**Handoff criado automaticamente pelo Dev Agent Enhanced**
