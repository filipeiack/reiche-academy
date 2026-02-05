# Handoff Final: QA Unitário Estrito → Desenvolvedor

**Data:** 2026-01-08  
**De:** QA Unitário Estrito  
**Para:** Desenvolvedor (Correção de Métodos Deprecated)  
**Status:** ⚠️ **BLOQUEIO IDENTIFICADO**  

---

## Situação Atual

### ✅ Testes Criados com Sucesso
- **23 testes unitários** para Snapshot Pattern implementados
- Cobertura completa: XOR validation, multi-tenant, cascade audit, snapshot isolation

### ⚠️ Bloqueio Identificado
Migration do schema executada com sucesso, **MAS** métodos deprecated no service ainda usam schema antigo, causando **27 erros TypeScript**.

---

## Análise do Problema

### Schema Migrado Corretamente
```prisma
model PilarEmpresa {
  pilarTemplateId  String?  // ✅ Novo campo (Snapshot Pattern)
  nome             String   // ✅ Novo campo
  descricao        String?  // ✅ Novo campo
  // ❌ pilarId removido (era obrigatório no schema antigo)
}

model RotinaEmpresa {
  rotinaTemplateId String?  // ✅ Novo campo (Snapshot Pattern)
  nome             String   // ✅ Novo campo
  descricao        String?  // ✅ Novo campo
  // ❌ rotinaId removido (era obrigatório no schema antigo)
}
```

### Métodos Deprecated com Erros
Arquivos com problemas: [pilares-empresa.service.ts](c:\\Users\\filip\\source\\repos\\reiche-academy\\backend\\src\\modules\\pilares-empresa\\pilares-empresa.service.ts)

**Total de erros:** 27 TypeScript errors

#### Erros Críticos:

1. **Line 43:** `pilar: { ativo: true }` - Campo `pilar` não existe em `PilarEmpresaWhereInput`
2. **Line 46:** `include: { pilar: ... }` - Relação `pilar` substituída por `pilarTemplate`
3. **Line 141:** `pilarId: { in: pilaresIds }` - Campo `pilarId` removido
4. **Line 184:** `data: novosVinculos` - Falta campo obrigatório `nome`
5. **Line 263:** `pilarEmpresa.pilar.rotinas` - Campo `pilar` não existe
6. **Line 497:** `rotina.pilarId !== pilarEmpresa.pilarId` - Campo `pilarId` não existe
7. **Line 504:** `pilarEmpresaId_rotinaId` - Constraint antiga (agora `pilarEmpresaId_nome`)
8. **Line 530:** `rotinaId` - Campo removido
9. **Line 581:** `rotinaEmpresa.pilarEmpresa.empresaId` - Relação não incluída
10. **Line 614:** `rotinaEmpresa.rotina.nome` - Campo `rotina` não existe (agora é `nome` diretamente)

---

## Métodos Afetados (Deprecated)

### 1. `findByEmpresa()` (linhas 31-56)
**Status:** ⚠️ **DEVE SER ATUALIZADO** (não é deprecated, é usado pelos endpoints principais)

**Erros:**
```typescript
// ❌ ANTES (schema antigo)
where: {
  empresaId,
  ativo: true,
  pilar: { ativo: true }, // Erro: 'pilar' não existe
},
include: {
  pilar: { // Erro: 'pilar' não existe
    include: {
      _count: { select: { rotinas: true, empresas: true } },
    },
  },
}

// ✅ DEPOIS (Snapshot Pattern)
where: {
  empresaId,
  ativo: true,
  // Snapshot não precisa filtrar template
},
include: {
  pilarTemplate: { // Opcional (apenas rastreabilidade)
    include: {
      _count: { select: { rotinas: true, empresas: true } },
    },
  },
  _count: {
    select: { rotinasEmpresa: true }, // Rotinas da empresa, não do template
  },
}
```

### 2. `vincularPilares()` (linhas 126-219) - **@deprecated**
**Status:** ⚠️ **ACEITAR ERROS** (método será removido após migração de testes)

**Estratégia:** Adicionar `// @ts-ignore` ou comentar método inteiro

### 3. `autoAssociarRotinasModelo()` (linhas 229-301) - **@deprecated**
**Status:** ⚠️ **ACEITAR ERROS** (método será removido após migração de testes)

**Estratégia:** Adicionar `// @ts-ignore` ou comentar método inteiro

### 4. `remover()` (linhas 303-357) - **@deprecated**
**Status:** ⚠️ **ACEITAR ERROS** (substituído por `deletePilarEmpresa`)

**Estratégia:** Comentar método (endpoint `/legacy` não será usado)

### 5. `vincularRotina()` (linhas 440-549) - **@deprecated**
**Status:** ⚠️ **ACEITAR ERROS** (substituído por `createRotinaEmpresa`)

### 6. `removerRotina()` (linhas 551-626) - **@deprecated**
**Status:** ⚠️ **ACEITAR ERROS** (substituído por `deleteRotinaEmpresa`)

---

## Estratégias de Resolução

### Opção 1: Comentar Métodos Deprecated (RECOMENDADO)
- Comentar completamente os métodos deprecated
- Endpoints `/legacy` retornarão 404
- Testes antigos falharão (aceitável, serão removidos)
- **Testes do Snapshot Pattern executarão sem erros**

```typescript
  // /**
  //  * @deprecated Método removido no Snapshot Pattern
  //  */
  // async vincularPilares(...) { ... }
```

### Opção 2: Adicionar @ts-ignore (TEMPORÁRIO)
- Adicionar `// @ts-ignore` acima de cada erro
- Permite compilação TypeScript
- Métodos permanecerão no código (não ideal)

### Opção 3: Atualizar findByEmpresa() + Comentar Deprecated (IDEAL)
- Corrigir `findByEmpresa()` para Snapshot Pattern
- Comentar todos métodos deprecated
- **Permite executar testes do Snapshot Pattern**

---

## Correção Mínima para Executar Testes

### Atualizar findByEmpresa() (OBRIGATÓRIO)

**Arquivo:** `pilares-empresa.service.ts` (linhas 31-56)

```typescript
async findByEmpresa(empresaId: string, user: RequestUser) {
  this.validateTenantAccess(empresaId, user);

  return this.prisma.pilarEmpresa.findMany({
    where: {
      empresaId,
      ativo: true,
      // ✅ Snapshot Pattern: não precisa filtrar pilarTemplate.ativo
    },
    include: {
      pilarTemplate: true, // Opcional: rastreabilidade
      responsavel: {
        select: { id: true, nome: true, email: true },
      },
      _count: {
        select: { rotinasEmpresa: true }, // Rotinas da empresa
      },
    },
    orderBy: { ordem: 'asc' }, // Per-company ordering
  });
}
```

### Comentar Métodos Deprecated

**Arquivo:** `pilares-empresa.service.ts`

```typescript
  // /**
  //  * @deprecated Removido no Snapshot Pattern. Use createPilarEmpresa() com pilarTemplateId.
  //  */
  // async vincularPilares(...) { ... }

  // /**
  //  * @deprecated Removido no Snapshot Pattern. Rotinas são criadas via createRotinaEmpresa().
  //  */
  // async autoAssociarRotinasModelo(...) { ... }

  // /**
  //  * @deprecated Use deletePilarEmpresa() instead.
  //  */
  // async remover(...) { ... }

  // /**
  //  * @deprecated Use createRotinaEmpresa() instead.
  //  */
  // async vincularRotina(...) { ... }

  // /**
  //  * @deprecated Use deleteRotinaEmpresa() instead.
  //  */
  // async removerRotina(...) { ... }
```

---

## Após Correção: Executar Testes

```bash
cd backend
npm test -- pilares-empresa.service.spec.ts --testNamePattern="Snapshot Pattern"
```

**Expectativa:** 23 testes executando

**Breakdown esperado:**
- createPilarEmpresa: 8 testes
- deletePilarEmpresa: 5 testes
- createRotinaEmpresa: 5 testes
- deleteRotinaEmpresa: 3 testes
- Snapshot Isolation: 2 testes

---

## Decisão Necessária

### Opção A: Comentar tudo deprecated AGORA
- ✅ Permite executar testes do Snapshot Pattern
- ✅ Remove código obsoleto
- ❌ Testes antigos falharão (30+ casos)
- ⏱️ Tempo: 5 minutos

### Opção B: Atualizar findByEmpresa + Comentar deprecated
- ✅ Método principal funcional
- ✅ Testes novos executam
- ✅ Código limpo
- ❌ Testes antigos falharão
- ⏱️ Tempo: 10 minutos

### Opção C: Manter tudo, adicionar @ts-ignore
- ✅ Compilação funciona
- ❌ Código sujo (deprecated com erros ignorados)
- ❌ Confusão para futuros desenvolvedores
- ⏱️ Tempo: 2 minutos (não recomendado)

---

## Recomendação do QA

**OPÇÃO B** é a ideal:
1. Atualizar `findByEmpresa()` para Snapshot Pattern
2. Comentar todos métodos deprecated
3. Executar testes do Snapshot Pattern (23 testes)
4. Criar PR com código limpo

**Justificativa:**
- Snapshot Pattern totalmente funcional
- Código limpo (sem deprecated ativo)
- Testes antigos serão substituídos pelos novos 23 testes
- Migração clara e documentada

---

## Próximos Passos (Após Correção)

1. ✅ Executar testes: `npm test -- pilares-empresa.service.spec.ts --testNamePattern="Snapshot Pattern"`
2. ✅ Validar cobertura: `npm test -- pilares-empresa.service.spec.ts --coverage`
3. ✅ Commit changes:
   ```bash
   git add .
   git commit -m "feat: Implementa Snapshot Pattern com 23 testes unitários"
   ```
4. ✅ Push & Pull Request
5. ✅ Merge após code review

---

## Arquivos para Correção Imediata

### 1. pilares-empresa.service.ts
- Atualizar `findByEmpresa()` (linhas 31-56)
- Comentar `vincularPilares()` (linhas 126-219)
- Comentar `autoAssociarRotinasModelo()` (linhas 229-301)
- Comentar `remover()` (linhas 303-357)
- Comentar `vincularRotina()` (linhas 440-549)
- Comentar `removerRotina()` (linhas 551-626)

### 2. pilares-empresa.controller.ts
- Endpoints `/legacy` retornarão 404 (aceitável, pois métodos comentados)
- Endpoints principais (`POST /pilares`, `DELETE /:pilarEmpresaId`) funcionam com novos métodos

---

**QA Unitário Estrito**  
2026-01-08

**Status:** ⏸️ AGUARDANDO CORREÇÃO DE MÉTODOS DEPRECATED
