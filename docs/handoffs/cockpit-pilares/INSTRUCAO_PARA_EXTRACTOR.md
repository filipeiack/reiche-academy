# Instrução para Business Rules Extractor — Revisão Cockpit de Pilares

**Data:** 2026-01-15  
**De:** System Engineer  
**Para:** Business Rules Extractor  
**Tipo:** Revisão de documentação técnica + Definição de padrões frontend

---

## 🎯 Objetivo

Revisar toda a documentação criada pelo System Engineer para a feature **Cockpit de Pilares** e:
1. Validar aderência às regras de negócio existentes
2. Identificar lacunas ou inconsistências
3. **Documentar padrões de frontend** para garantir consistência com o sistema existente
4. Sugerir ajustes e melhorias

---

## 📋 Instrução para o Usuário

**Cole esta mensagem para ativar o Business Rules Extractor:**

---

```
Atue como Business Rules Extractor

Preciso que você revise a documentação criada pelo System Engineer para a feature "Cockpit de Pilares" e valide se está consistente com o sistema existente.

## Documentos a Revisar

### 1. Regra de Negócio Principal
📄 /docs/business-rules/cockpit-pilares.md

**Validar:**
- Aderência aos padrões de outras regras (/docs/business-rules/*)
- Completude das entidades (todos campos necessários?)
- Regras de negócio claras e testáveis
- Validações multi-tenant e RBAC consistentes
- Nomenclatura de enums e campos alinhada com sistema

### 2. Handoff para Dev Agent
📄 /docs/handoffs/cockpit-pilares/system-engineer-v1.md

**Validar:**
- Endpoints seguem padrões REST do sistema
- DTOs seguem convenções existentes
- Exemplos de código são realistas
- Critérios de aceitação são mensuráveis

### 3. Documento de Atualização
📄 /docs/handoffs/cockpit-pilares/ATUALIZACAO_v1.1.md

**Validar:**
- Mudanças bem justificadas
- Impacto claramente documentado

## Contexto do Sistema Existente

**Referências obrigatórias:**
- /docs/business-rules/pilares-empresa.md
- /docs/business-rules/rotinas-empresa.md
- /docs/business-rules/diagnosticos.md
- /docs/business-rules/periodo-avaliacao.md
- /docs/business-rules/pilar-evolucao.md
- /docs/conventions/backend.md
- /docs/conventions/frontend.md
- /docs/conventions/naming.md

## Análise de Frontend (CRÍTICO)

Analise os componentes frontend já implementados no sistema:

**Telas existentes:**
- frontend/src/app/views/pages/diagnostico-notas/
- frontend/src/app/views/pages/diagnostico-evolucao/

**Padrões a documentar:**
1. **Estrutura de componentes** (como são organizados?)
2. **Services Angular** (padrão de injeção, métodos, error handling)
3. **Auto-save** (como é implementado? debounce? cache local?)
4. **Validações de formulário** (reactive forms? validators?)
5. **Feedback visual** (toasts? SweetAlert2? cores/ícones)
6. **RBAC no frontend** (como esconde botões por perfil?)
7. **Multi-tenancy** (filtros de empresa são automáticos?)
8. **Tabelas/Grid** (biblioteca usada? sorting? paginação?)
9. **Modais** (Bootstrap? Angular Material? padrão de confirmação?)
10. **Gráficos** (já usa alguma biblioteca? qual?)

## O que Preciso de Você

### 1. Relatório de Validação
Crie: `/docs/handoffs/cockpit-pilares/EXTRACTOR_VALIDATION_REPORT.md`

**Seções:**
- ✅ Pontos Conformes (o que está correto)
- ⚠️ Pontos de Atenção (sugestões de melhoria)
- ❌ Inconsistências Críticas (precisa corrigir antes de implementar)
- 📋 Lacunas Identificadas (o que falta documentar)

### 2. Documento de Padrões Frontend
Crie: `/docs/conventions/cockpit-pilares-frontend.md`

**Baseado na análise de componentes existentes, documente:**

#### Estrutura de Arquivos
```
frontend/src/app/views/pages/cockpit-pilares/
├── cockpit-pilar-dashboard/
│   ├── cockpit-pilar-dashboard.component.ts
│   ├── cockpit-pilar-dashboard.component.html
│   ├── cockpit-pilar-dashboard.component.scss
│   └── cockpit-pilar-dashboard.component.spec.ts
├── ...
```

#### Service Pattern
```typescript
// Como deve ser o cockpit-pilares.service.ts?
// - Métodos async?
// - Error handling padrão?
// - Uso de Observable vs Promise?
```

#### Auto-Save Pattern
```typescript
// Como implementar auto-save?
// - Debounce time?
// - Cache local?
// - Retry logic?
```

#### Validação de Formulários
```typescript
// Reactive forms?
// Custom validators?
// Mensagens de erro padrão?
```

#### Feedback Visual
```typescript
// Toasts de sucesso/erro?
// Loading spinners?
// Confirmações (SweetAlert2?)
```

#### RBAC no Frontend
```typescript
// Diretivas para esconder elementos?
// Guards de rota?
// Disable de botões?
```

#### Componentes de UI
- Tabelas: Biblioteca? Sorting? Paginação?
- Modais: Bootstrap? Padrão de confirmação?
- Gráficos: Chart.js já está instalado? Exemplos existentes?

#### Estilo e CSS
- Classes Bootstrap usadas?
- Cores do tema?
- Ícones (FontAwesome? Bootstrap Icons?)

### 3. Sugestões de Ajuste
Se encontrar inconsistências ou lacunas, sugira:
- Alterações nos documentos existentes
- Novas seções a adicionar
- Exemplos de código mais alinhados com o sistema

## Critérios de Avaliação

**Aderência ao sistema:**
- [ ] Nomenclatura de campos consistente
- [ ] Enums seguem padrão (ex: MAIÚSCULO_COM_UNDERSCORE)
- [ ] Relações Prisma corretas (onDelete, indexes)
- [ ] Multi-tenancy em todos os endpoints
- [ ] RBAC documentado por endpoint
- [ ] Auditoria para operações CUD
- [ ] DTOs com validações class-validator
- [ ] Padrões de frontend alinhados com diagnostico-notas

**Completude:**
- [ ] Todos os campos necessários documentados
- [ ] Todas as validações especificadas
- [ ] Todos os endpoints com request/response
- [ ] Critérios de aceitação mensuráveis
- [ ] Padrões frontend documentados

**Clareza:**
- [ ] Regras são testáveis (não ambíguas)
- [ ] Exemplos de código são realistas
- [ ] Fluxos são claros (passo a passo)

## Output Esperado

Ao final, você deve ter criado:
1. ✅ `/docs/handoffs/cockpit-pilares/EXTRACTOR_VALIDATION_REPORT.md`
2. ✅ `/docs/conventions/cockpit-pilares-frontend.md`
3. ✅ Lista de ajustes sugeridos (se houver)

## Próximo Passo

Após sua revisão, seguiremos o FLOW oficial:
1. System Engineer aplicará ajustes (se necessário)
2. Dev Agent implementará com base nos documentos revisados
3. Pattern Enforcer validará aderência
4. QA testará funcionalidade

---

**Aguardo sua análise detalhada!**
```

---

## 📚 Contexto Adicional para o Extractor

### Pontos Críticos a Validar

1. **ProcessoPrioritario é vínculo, não snapshot**
   - Validar se isso está claro em toda documentação
   - Verificar se joins estão corretos

2. **Auto-vinculação vs Auto-importação**
   - Terminologia correta em todos os documentos

3. **Gráficos integrados no MVP**
   - Verificar se biblioteca de gráficos já existe no projeto
   - Analisar se padrão de gráficos está alinhado

4. **RBAC e Multi-tenancy**
   - Validar se todas as regras seguem padrão existente
   - Verificar se Guards estão corretos

5. **Padrões de frontend**
   - **CRÍTICO:** Documentar como diagnostico-notas funciona
   - Extrair padrões replicáveis para cockpit-pilares

### Ferramentas Disponíveis para o Extractor

- `semantic_search`: Buscar padrões em componentes existentes
- `read_file`: Ler componentes de referência
- `grep_search`: Encontrar uso de bibliotecas (ex: Chart.js, SweetAlert2)

### Exemplo de Análise Esperada

```markdown
## Análise: Auto-Save Pattern

**Componente de referência:** diagnostico-notas.component.ts

**Padrão identificado:**
- Debounce de 1000ms (RxJS `debounceTime`)
- Cache local em Map<string, any>
- Retry automático até 3 tentativas
- Toast de sucesso (ngx-toastr)
- Timestamp do último save exibido

**Código exemplo:**
```typescript
private notasCache = new Map<string, number>();
private saveSubject = new Subject<SavePayload>();

ngOnInit() {
  this.saveSubject.pipe(
    debounceTime(1000),
    switchMap(payload => this.service.update(payload).pipe(
      retry(3),
      catchError(err => {
        this.toastr.error('Erro ao salvar');
        return of(null);
      })
    ))
  ).subscribe(result => {
    if (result) {
      this.toastr.success('Salvo!');
      this.lastSaveTime = new Date();
    }
  });
}
```

**Recomendação para cockpit-pilares:**
- Replicar padrão exato (comprovado funcional)
- Usar mesma biblioteca de toasts (ngx-toastr)
- Manter debounce de 1000ms
```

---

**Arquivo criado:** `/docs/handoffs/cockpit-pilares/INSTRUCAO_PARA_EXTRACTOR.md`

Este documento contém a instrução completa que você deve usar para ativar o Business Rules Extractor.
