# Convenções - Git

**Status**: Documentação baseada em histórico analisado  
**Última atualização**: 2025-12-23

---

## 1. Branches

### Padrão Observado

**Branch principal**: `main`

**Estrutura de branches**: Não documentada

**Observação**: O projeto não possui documentação explícita de estratégia de branches. Aparentemente trabalha direto na branch `main`.

**Grau de consistência**: NÃO CONSOLIDADO

---

### Padrão Recomendado (não implementado)

```
main                    # Branch principal (produção)
develop                 # Branch de desenvolvimento
feature/{nome}          # Novas funcionalidades
fix/{nome}              # Correções de bugs
hotfix/{nome}           # Correções urgentes em produção
release/{versao}        # Preparação de releases
```

**Grau de consistência**: NÃO APLICÁVEL

---

## 2. Commits

### Padrão Observado (últimos 50 commits)

**Formato**: Conventional Commits (PARCIALMENTE seguido)

```
feat:     Nova funcionalidade
fix:      Correção de bug
refactor: Refatoração de código
test:     Adição ou modificação de testes
docs:     Alteração em documentação
chore:    Tarefas de manutenção (build, deps, etc.)
```

**Exemplos reais observados**:

```bash
# Com prefixo (CORRETO)
feat(usuarios): implementar R-USU-030
fix: corrigir atualização de telefone
refactor: melhorar estrutura de testes
test: adicionar testes unitários de pilares
docs: atualizar documentação de API

# Sem prefixo (INCONSISTENTE)
Adicionar validação de email
Corrigir bug na listagem
Atualizar dependências
```

**Padrão de escopo**: `(modulo)` quando aplicável

```
feat(usuarios): descrição
feat(empresas): descrição
fix(pilares): descrição
```

**Grau de consistência**: PARCIAL

---

### Estrutura Completa de Commit Message

**Formato padrão**:

```
<tipo>[(escopo)]: <descrição curta>

[corpo opcional]

[rodapé opcional]
```

**Exemplos observados**:

```bash
# Simples (mais comum)
feat(usuarios): implementar upload de avatar

# Com corpo
fix(empresas): corrigir validação de CNPJ

O CNPJ estava sendo validado incorretamente quando
continha apenas números.

# Com referência a issue (não observado, mas recomendado)
feat(pilares): adicionar endpoint de listagem

Implementa R-PIL-010 conforme especificação.

Refs: #42
```

**Grau de consistência**: PARCIAL

---

### Tipos de Commit - Definições

| Tipo | Quando Usar | Exemplo |
|------|-------------|---------|
| `feat` | Nova funcionalidade | `feat(usuarios): adicionar campo telefone` |
| `fix` | Correção de bug | `fix(auth): corrigir validação de token` |
| `refactor` | Refatoração sem alterar comportamento | `refactor(empresas): simplificar lógica de validação` |
| `test` | Adição ou alteração de testes | `test(pilares): adicionar testes unitários` |
| `docs` | Alteração em documentação | `docs: atualizar README com instruções` |
| `chore` | Tarefas de manutenção | `chore: atualizar dependências` |
| `style` | Formatação de código | `style: aplicar prettier` |
| `perf` | Melhorias de performance | `perf(usuarios): otimizar query de listagem` |

**Grau de consistência**: PARCIAL (tipos principais são usados, mas não exclusivamente)

---

### Escopos Observados

**Backend**:
- `usuarios`
- `empresas`
- `pilares`
- `auth`
- `audit`
- `diagnosticos`

**Frontend**:
- Não observado uso consistente de escopo para frontend

**Geral**:
- Escopo é OPCIONAL
- Quando presente, usa kebab-case
- Corresponde ao módulo afetado

**Grau de consistência**: PARCIAL

---

## 3. Mensagens de Commit - Boas Práticas

### Observado no Projeto

✅ **BOM**:
- `feat(usuarios): implementar R-USU-030`
- `fix: corrigir atualização de telefone`
- `refactor: melhorar estrutura de testes`

❌ **INCONSISTENTE**:
- `Adicionar validação de email` (sem prefixo)
- `Corrigir bug na listagem` (sem prefixo)
- `Update README.md` (em inglês, sem prefixo)

**Grau de consistência**: PARCIAL

---

### Regras Esperadas (baseadas em boas práticas)

1. **Usar prefixo de tipo**: Sempre iniciar com `feat:`, `fix:`, etc.
2. **Imperative mood**: "adicionar" não "adicionado" ou "adicionando"
3. **Sem ponto final**: Não terminar a descrição com `.`
4. **Máximo 72 caracteres**: Para a linha de descrição
5. **Referências**: Incluir `Refs:` ou `Closes:` quando aplicável

**Grau de consistência**: PARCIAL (regras 1 e 2 não são 100% seguidas)

---

## 4. Tags e Versionamento

### Padrão Observado

**Versionamento**: Semantic Versioning (inferido de package.json)

```json
// backend/package.json
"version": "1.0.0"

// frontend/package.json
"version": "1.0.0"
```

**Tags Git**: Não analisadas (sem acesso ao histórico de tags)

**CHANGELOG**: Arquivo existe em `docs/history/CHANGELOG.md`

**Grau de consistência**: NÃO CONSOLIDADO

---

### Padrão Esperado (Semantic Versioning)

```
vMAJOR.MINOR.PATCH

v1.0.0    # Release inicial
v1.0.1    # Correção de bug
v1.1.0    # Nova funcionalidade (compatível)
v2.0.0    # Breaking change
```

**Grau de consistência**: NÃO APLICÁVEL (não implementado)

---

## 5. Pull Requests / Merge Requests

### Padrão Observado

**Template de PR**: NÃO OBSERVADO

**Processo de review**: NÃO DOCUMENTADO

**Grau de consistência**: NÃO CONSOLIDADO

---

### Padrão Recomendado (não implementado)

```markdown
## Descrição
Breve descrição das mudanças implementadas.

## Tipo de Mudança
- [ ] Feature (feat)
- [ ] Bug fix (fix)
- [ ] Breaking change
- [ ] Documentação (docs)

## Checklist
- [ ] Código segue as convenções do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Build passou sem erros

## Como Testar
1. Passo 1
2. Passo 2
3. Resultado esperado

## Refs
Closes #123
```

**Grau de consistência**: NÃO APLICÁVEL

---

## 6. Histórico - Análise dos Últimos 50 Commits

### Distribuição de Tipos

Baseado na análise fornecida:

| Tipo | Frequência Observada |
|------|---------------------|
| `feat:` | Alta |
| `fix:` | Média |
| `refactor:` | Média |
| `test:` | Baixa |
| `docs:` | Baixa |
| `chore:` | Baixa |
| Sem prefixo | Média-Alta (PROBLEMA) |

**Grau de consistência**: PARCIAL

---

### Padrões de Escopo

| Escopo | Exemplos |
|--------|----------|
| `usuarios` | `feat(usuarios): implementar R-USU-030` |
| `empresas` | `feat(empresas): adicionar validação` |
| `pilares` | `test(pilares): adicionar testes` |
| Sem escopo | `fix: corrigir atualização` |

**Observação**: Escopo não é usado de forma consistente

**Grau de consistência**: PARCIAL

---

### Idioma das Mensagens

**Observado**: Português (predominante)

**Exemplos**:
- `feat(usuarios): implementar upload de avatar`
- `fix: corrigir validação de telefone`
- `refactor: melhorar estrutura de testes`

**Exceções**: Algumas mensagens em inglês (ex: `Update README.md`)

**Grau de consistência**: CONSISTENTE (português, com exceções)

---

## Resumo de Consistência

| Aspecto | Grau de Consistência | Observação |
|---------|----------------------|-----------|
| **Branches** | NÃO CONSOLIDADO | Sem documentação de estratégia |
| **Conventional Commits** | PARCIAL | Usado, mas não em 100% dos commits |
| **Prefixo de tipo** | PARCIAL | Muitos commits sem prefixo |
| **Escopo** | PARCIAL | Usado quando relevante, mas inconsistente |
| **Idioma** | CONSISTENTE | Português (com raras exceções) |
| **Versionamento** | NÃO CONSOLIDADO | SemVer esperado, mas não documentado |
| **Pull Requests** | NÃO CONSOLIDADO | Sem template ou processo documentado |

---

## Recomendações

1. **Adotar Conventional Commits obrigatoriamente**
   - Configurar `commitlint` para validar mensagens
   - Rejeitar commits sem prefixo adequado

2. **Definir estratégia de branches**
   - Documentar fluxo de trabalho (Git Flow, GitHub Flow, etc.)
   - Criar proteção de branch para `main`

3. **Criar template de Pull Request**
   - Padronizar descrição de mudanças
   - Incluir checklist de revisão

4. **Automatizar versionamento**
   - Usar `standard-version` ou `semantic-release`
   - Gerar CHANGELOG automaticamente

5. **Documentar processo de release**
   - Como criar tags
   - Como gerar versões
   - Como publicar releases
