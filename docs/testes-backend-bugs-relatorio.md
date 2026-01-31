# 🔍 RELATÓRIO DE BUGS - TESTES UNITÁRIOS BACKEND

**Data**: 2026-01-23  
**Analista**: QA Engineer  
**Status**: 🚨 CRÍTICO - 4 arquivos com problemas reais de produção

---

## 📊 **RESUMO DAS FALHAS**

| Test Suite | Testes Falhando | Gravidade | Módulo Afetado |
|------------|-----------------|------------|------------------|
| periodos-mentoria.integration.spec.ts | 4 | 🟡 MÉDIA | Lógica de negócio |
| periodos-mentoria.diagnosticos.spec.ts | 8 | 🟡 MÉDIA | Integração de dados |
| periodos-mentoria.diagnosticos.simple.spec.ts | 2 | 🟡 MÉDIA | Validação de períodos |
| pilares-empresa.service.spec.ts | 5 | 🟢 BAIXA | Mocks incompletos |

**Total**: 19 testes falhando de 589 (96.8% de sucesso geral)

---

## 🐛 **PROBLEMAS DE CÓDIGO IDENTIFICADOS**

### 1. **PERÍODOS-MENTORIA: CÁLCULO INCORRETO DE `addYears()`** 

**🔥 GRAVIDADE: ALTA**

**Arquivo**: `backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts`  
**Linhas**: 54 e 128

#### **Problema Identificado:**
```typescript
// LINHA 54 (método create)
const dataFim = addYears(dataInicio, 1);

// LINHA 128 (método renovar) 
const dataFim = addYears(dataInicio, 1);
```

#### **Comportamento Atual:**
- `addYears(new Date('2025-01-01'), 1)` retorna `2026-01-01`
- Isso cria **períodos de 366 dias em anos bissextos**
- Testes esperam `2025-12-31`, mas recebem `2026-01-01`

#### **Testes Afetados:**
```
periodos-mentoria.integration.spec.ts
  ● deve criar período que será usado por Indicadores Mensais
  ● deve suportar renovação que afeta estrutura de Indicadores Mensais
  ● deve validar datas extremas em renovação
  ● deve manter consistência após múltiplas renovações

periodos-mentoria.diagnosticos.simple.spec.ts
  ● deve criar novo período que migrará dados de diagnóstico
```

#### **Solução Sugerida:**
```typescript
// Substituir addYears por cálculo exato de fim de ano
const dataFim = new Date(dataInicio.getFullYear(), 11, 31); // 31 de dezembro
```

---

### 2. **PERÍODOS-MENTORIA: NÚMERO SEQUENCIAL INCORRETO**

**🔥 GRAVIDADE: MÉDIA**

**Arquivo**: `backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts`  
**Linhas**: 50 e 129

#### **Problema Identificado:**
```typescript
// LINHA 50 (método create)
const numero = ultimoPeriodo ? ultimoPeriodo.numero + 1 : 1;

// LINHA 129 (método renovar)
const novoNumero = periodoAtual.numero + 1;
```

#### **Comportamento Atual:**
- Lógica correta, mas **mocks nos testes inconsistentes**
- Testes esperam `numero: 3` mas service retorna `numero: 1`

#### **Testes Afetados:**
```
periodos-mentoria.integration.spec.ts
  ● deve manter consistência após múltiplas renovações
  ● deve criar período que será usado por Indicadores Mensais
```

#### **Análise Necessária:**
- Verificar se `ultimoPeriodo` está sendo encontrado corretamente
- Confirmar se mocks do `findFirst` estão retornando valores adequados

---

### 3. **PERÍODOS-MENTORIA: ORDENAÇÃO HISTÓRICA INCORRETA**

**🔥 GRAVIDADE: MÉDIA**

**Arquivo**: `backend/src/modules/periodos-mentoria/periodos-mentoria.service.ts`  
**Linha**: 77

#### **Problema Identificado:**
```typescript
// LINHA 77 (método findByEmpresa)
orderBy: { numero: 'desc' },
```

#### **Comportamento Esperado vs Real:**
- **Esperado**: Arrays ordenados decrescentemente `[2, 1]`
- **Real**: Arrays retornando `[1]` ou ordem inconsistente

#### **Testes Afetados:**
```
periodos-mentoria.diagnosticos.spec.ts
  ● deve fornecer contexto histórico para PilarEvolucao
  ● deve manter sequência temporal correta para evolução
  ● deve manter isolamento de diagnosticos entre períodos
  ● deve manter dados históricos preservados após renovação
```

#### **Investigação Necessária:**
- Verificar se dados no banco estão salvos com `numero` correto
- Confirmar se `orderBy` está sendo aplicado corretamente

---

### 4. **PILARES-EMPRESA: MOCKS INCOMPLETOS**

**🟢 GRAVIDADE: BAIXA**

**Arquivo**: `backend/src/modules/pilares-empresa/pilares-empresa.service.spec.ts`

#### **Problema Identificado:**
Mocks do `rotinasService.createRotinaEmpresa` retornando `undefined`

#### **Testes Afetados:**
```
pilares-empresa.service.spec.ts
  ● R-ROTEMP-001: deve criar rotina customizada sem template
  ● XOR Validation: deve falhar se template não encontrado
  ● Unicidade: deve bloquear nome duplicado no mesmo pilar
  ● Validação: deve falhar se pilar não pertence à empresa
  ● Validação: deve falhar se rotina não pertence à empresa
```

#### **Solução Sugerida:**
Completar os mocks para os cenários faltantes ou remover testes desnecessários.

---

## 🎯 **PRIORIDADES DE CORREÇÃO**

### 🔥 **CRÍTICO (Resolver Imediatamente)**
1. **Corrigir `addYears()`** - Impacta cálculo de períodos inteiro
2. **Investigar ordenação `findByEmpresa`** - Impacta histórico completo

### 🟡 **IMPORTANTE (Resolver Esta Sprint)**
3. **Investigar número sequencial** - Impacta organização histórica
4. **Corrigir mocks pilares-empresa** - Impacta validação de regras

---

## 📋 **RECOMENDAÇÕES PARA O DEV**

### ✅ **Antes de Começar:**
1. **Backup do código atual** - `git checkout -b bugfix-periodos`
2. **Rodar testes localmente** - `npm test -- --testPathPattern="periodos-mentoria"`
3. **Verificar dados no banco** - Consultar períodos existentes

### 🛠️ **Implementação Sugerida:**

#### 1. Função Auxiliar para Data Fim
```typescript
private calcularDataFimAno(dataInicio: Date): Date {
  const ano = dataInicio.getFullYear();
  return new Date(ano, 11, 31, 23, 59, 59, 999); // 31/dez/ano 23:59:59
}
```

#### 2. Debug de Números Sequenciais
```typescript
// Adicionar log temporário para debug
console.log('Último período encontrado:', ultimoPeriodo);
console.log('Novo número calculado:', numero);
```

#### 3. Validação Extra no Service
```typescript
// Validar se período criado tem número correto
if (periodo.numero !== numero) {
  throw new Error(`Inconsistência: esperado ${numero}, criado ${periodo.numero}`);
}
```

---

## 🧪 **VALIDAÇÃO PÓS-CORREÇÃO**

### **Testes Específicos para Rodar:**
```bash
# Testar períodos
npm test -- --testPathPattern="periodos-mentoria"

# Testar pilares
npm test -- --testPathPattern="pilares-empresa"

# Teste específico de datas
npm test -- --testNamePattern="deve criar período que será usado por Indicadores Mensais"
```

### **Critérios de Sucesso:**
- [ ] Todos os testes `periodos-mentoria.*.spec.ts` passam
- [ ] Datas calculadas corretamente (31/dez vs 01/jan+1)
- [ ] Números sequenciais consistentes
- [ ] Mocks completos em pilares-empresa
- [ ] Zero testes falhando no backend

---

## 🚨 **IMPACTO NO SISTEMA**

### **SE NÃO CORRIGIDO:**
- ❌ **Períodos com 366 dias** - afeta indicadores mensais e relatórios
- ❌ **Histórico desordenado** - confusão na timeline de evolução
- ❌ **Inconsistências numéricas** - erros em dashboards e análises

### **APÓS CORREÇÃO:**
- ✅ **Períodos exatos** - 365 dias corretos (ou 366 em bissextos)
- ✅ **Timeline organizada** - histórico sequencial correto
- ✅ **Testes confiáveis** - barreira de qualidade funcional

---

## 📞 **SUPORTE**

**Dúvidas durante a correção:**
1. **Mock dos testes** - Verificar se dados mockados são realistas
2. **Dados existentes** - Confirmar períodos no banco atual
3. **Integração frontend** - Testar impacto em componentes Angular

**Comando para debug de testes individuais:**
```bash
npm test -- --testNamePattern="específico" --verbose
```

---

**Status**: 🟡 **AGUARDANDO CORREÇÃO**  
**Previsão**: 1-2 dias úteis para correção completa  
**Risco**: Médio (funcionalidade afetada, mas sistema operacional)