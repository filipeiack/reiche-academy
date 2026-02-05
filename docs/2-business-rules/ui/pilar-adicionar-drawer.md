# Regra: Adicionar Pilar (Customizado ou Template)

**Data**: 2026-02-05  
**Escopo**: Componente `PilarAddDrawerComponent`  
**Status**: Proposta - Aguardando Implementação

---

## Contexto

Quando um usuário deseja adicionar um pilar customizado ou vincular um template de pilar a uma empresa, preenche um formulário em drawer (offcanvas).

Historicamente, o componente usava `ng-select` com flag `[addTag]`, o que gerava confusão UX: usuários não conseguiam diferenciar entre "buscar/selecionar" e "digitar para criar novo".

---

## Descrição

O componente `PilarAddDrawerComponent` oferece dois fluxos mutuamente exclusivos:

1. **Criar Pilar Customizado** (⭐ MODO PADRÃO)
   - Input de texto livre para digitar novo nome
   - Validação: 2-60 caracteres
   - Criação imediata via API

2. **Selecionar Pilar Template** (Alternativa)
   - Dropdown com pilares já cadastrados no sistema
   - Validação: Não permitir pilar já vinculado
   - Apenas vincular pilar existente

---

## Condições

**Modo Padrão = Criar Customizado:**
- Ao abrir o drawer, o toggle deve estar em "Criar Novo Pilar"
- Usuário vê um input de texto, não uma lista

**Modo Alternativa = Selecionar Template:**
- Toggle secundário leva para dropdown de pilares
- Mostra apenas pilares ativos e não duplicados

---

## Comportamento Esperado

### Happy Path - Criar Customizado
1. Drawer abre → Modo "Criar Novo Pilar" já selecionado
2. Usuário digita nome (ex: "Inovação")
3. Sistema valida durante typing (tamanho, caracteres especiais)
4. Clica "Adicionar Pilar" → Sucesso
5. Toast de sucesso, campo reseta, drawer permanece aberto

### Happy Path - Selecionar Template
1. User clica toggle "Selecionar Pilar Template"
2. Dropdown carrega pilares disponíveis
3. Usuário seleciona (ex: "Gestão financeira")
4. Clica "Adicionar Pilar" → Sucesso
5. Toast de sucesso, campo reseta, drawer permanece aberto

### Caso de Erro - Nome Inválido (Create)
1. Nome < 2 caracteres → Erro inline "Mínimo 2 caracteres"
2. Nome > 60 caracteres → Erro inline "Máximo 60 caracteres"
3. Nome já existe → Erro inline "Pilar com este nome já existe"
4. Botão "Adicionar" desabilitado até corrigir

### Caso de Erro - Template Duplicado (Select)
1. Pilar já vinculado à empresa → Toast warning
2. Nenhuma requisição enviada
3. Drawer permanece aberto, toggle na posição anterior

---

## Restrições

1. **Isolamento Multi-tenant**: Pilares customizados criados pertencem a `empresaId` do usuario
2. **Soft Delete**: Não vincular pilares com `ativo: false`
3. **Persistência do Drawer**: Permanecer aberto após cada adição (UX para bulk)
4. **Sem validação de presença**: Campo vazio após clique é aceitável (feedback apenas ao salvar)

---

## Impacto Técnico

**Componente Afetado:**
- `frontend/src/app/views/pages/diagnostico-notas/pilar-add-drawer/pilar-add-drawer.component.ts`
- `frontend/src/app/views/pages/diagnostico-notas/pilar-add-drawer/pilar-add-drawer.component.html` (template inline)

**Serviços Utilizados:**
- `PilaresService.findAll()` - Listar templates ativos
- `PilaresEmpresaService.criarPilarCustomizado()` - POST novo pilar
- `PilaresEmpresaService.vincularPilares()` - POST vínculo

**Validações Necessárias:**
- [ ] Frontend: tamanho nome (2-60 caracteres)
- [ ] Frontend: detecção duplo (template já vinculado)
- [ ] Backend: validation único do nome (por empresa)

---

## Exemplo de UX

```
┌─────────────────────────────────────┐
│ + Adicionar Pilar Customizado       │
├─────────────────────────────────────┤
│                                     │
│  [Criar Novo] [Selecionar Template] │
│                                     │
│  Nome do Novo Pilar *               │
│  ┌─────────────────────────────────┐│
│  │ Inovação                 ✓ 9/60 ││
│  └─────────────────────────────────┘│
│  ℹ️ Digite um nome único...          │
│                                     │
│                                     │
│                  [Cancelar] [Adicionar] │
└─────────────────────────────────────┘
```

---

## Cinémo da Mudança

✅ **Antes**: `ng-select` com `[addTag]` confuso  
✅ **Depois**: Dois modos explícitos + padrão intuitivo

---

## Observações

- Regra proposta com base em feedback do usuário
- Toggle claro entre duas ações distintas
- Validação em tempo real para melhor UX
- Drawer permanece aberto para eficiência (bulk operations)
