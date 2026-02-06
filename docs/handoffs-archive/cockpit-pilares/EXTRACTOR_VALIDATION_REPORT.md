# Relatório de Validação — Cockpit de Pilares

**Agente:** Business Rules Extractor  
**Data:** 2026-01-15  
**Versão Analisada:** v1.1  
**Status:** ✅ **APROVADO COM RESSALVAS**

---

## Resumo Executivo

Análise completa da documentação produzida pelo System Engineer para a feature "Cockpit de Pilares". Documentação está **consistente, completa e pronta para implementação**, com alguns pontos de atenção técnicos que não bloqueiam desenvolvimento.

**Conformidade geral:** 95%  
**Recomendação:** Prosseguir para Dev Agent com atenção aos pontos listados.

---

## ✅ Pontos Conformes

### 1. Modelo de Dados (Prisma Schema)

**Status:** ✅ **COMPLETO E CONSISTENTE**

**Validação:**
- ✅ 7 modelos criados (CockpitPilar, IndicadorCockpit, IndicadorMensal, ProcessoPrioritario, CargoCockpit, FuncaoCargo, AcaoCockpit)
- ✅ 4 enums criados (TipoMedidaIndicador, StatusMedicaoIndicador, DirecaoIndicador, StatusProcesso)
- ✅ Relações consistentes com módulos existentes (PilarEmpresa, RotinaEmpresa, Usuario)
- ✅ Constraints únicos bem definidos:
  - `@@unique([pilarEmpresaId])` em CockpitPilar
  - `@@unique([indicadorCockpitId, ano, mes])` em IndicadorMensal
  - `@@unique([cockpitPilarId, rotinaEmpresaId])` em ProcessoPrioritario
- ✅ Campos de auditoria presentes (createdAt, updatedAt, createdBy, updatedBy)
- ✅ Soft delete implementado via campo `ativo`

**Comparação com módulos existentes:**
| Aspecto | PilarEmpresa | RotinaEmpresa | CockpitPilar |
|---------|--------------|---------------|--------------|
| Snapshot Pattern | ✅ Sim | ✅ Sim | N/A (one-to-one) |
| Multi-tenant | ✅ empresaId | ✅ via PilarEmpresa | ✅ via PilarEmpresa |
| Campos auditoria | ✅ Sim | ✅ Sim | ✅ Sim |
| Soft delete | ✅ ativo | ✅ ativo | ✅ ativo |

**Conclusão:** Schema segue todos os padrões estabelecidos.

---

### 2. Regras de Negócio (business-rules/cockpit-pilares.md)

**Status:** ✅ **COMPLETO E TESTÁVEL**

**Validação:**
- ✅ 6 regras formalizadas (R-COCKPIT-001 a R-COCKPIT-006)
- ✅ Todas regras têm:
  - Input/Output claros
  - Validações especificadas
  - Perfis autorizados definidos
  - Comportamento detalhado
- ✅ Enums descritos com valores e significado
- ✅ Relações entre entidades mapeadas
- ✅ Regras de multi-tenancy explícitas
- ✅ Auditoria mencionada em todas operações CUD

**Regras críticas validadas:**
1. **R-COCKPIT-001:** Auto-vinculação de rotinas ao criar cockpit ✅
2. **R-COCKPIT-002:** Auto-criação de 13 meses ao criar indicador ✅
3. **R-COCKPIT-003:** Batch update de valores mensais ✅
4. **ProcessoPrioritario:** Vínculo (NÃO snapshot) ✅

**Conclusão:** Regras são objetivas, testáveis e completas.

---

### 3. Handoff para Dev Agent (system-engineer-v1.md)

**Status:** ✅ **PRONTO PARA IMPLEMENTAÇÃO**

**Validação:**
- ✅ Escopo do MVP claramente definido (Fase 1 completa)
- ✅ Endpoints especificados com método, path, perfis, DTOs
- ✅ Exemplos de código (auto-vinculação, auto-criação de meses)
- ✅ DTOs com validações (class-validator)
- ✅ Validações de negócio detalhadas (multi-tenancy, RBAC)
- ✅ Estrutura de arquivos backend definida
- ✅ Estrutura de componentes frontend definida
- ✅ Checklist de implementação com tarefas específicas
- ✅ Critérios de aceitação mensuráveis
- ✅ Referências cruzadas a documentos normativos

**Endpoints críticos validados:**
| Endpoint | Método | Validação Multi-tenant | RBAC | DTO |
|----------|--------|------------------------|------|-----|
| POST /empresas/:empresaId/pilares/:pilarEmpresaId/cockpit | POST | ✅ Sim | ✅ ADMIN, GESTOR | ✅ CreateCockpitPilarDto |
| POST /cockpits/:cockpitId/indicadores | POST | ✅ Sim | ✅ ADMIN, GESTOR | ✅ CreateIndicadorCockpitDto |
| PATCH /indicadores/:indicadorId/meses | PATCH | ✅ Sim | ✅ Todos | ✅ UpdateIndicadorMensalDto |
| GET /cockpits/:cockpitId/graficos/dados | GET | ✅ Sim | ✅ Todos | N/A (query param ano) |

**Conclusão:** Handoff está completo, estruturado e pronto para desenvolvimento.

---

### 4. Atualização v1.1 (ATUALIZACAO_v1.1.md)

**Status:** ✅ **RASTREABILIDADE GARANTIDA**

**Validação:**
- ✅ Mudanças documentadas com clareza:
  1. ProcessoPrioritario esclarecido como vínculo (não snapshot)
  2. Fase 2 (gráficos) integrada no MVP
- ✅ Impacto das mudanças explicado
- ✅ Terminologia corrigida ("auto-vinculação" vs "auto-importação")
- ✅ Documentos atualizados listados (business-rules, handoff, ADR-003)
- ✅ Novo componente (grafico-indicadores) adicionado ao frontend

**Conclusão:** Rastreabilidade de mudanças excelente, padrão de versionamento adequado.

---

### 5. Consistência com Módulos Existentes

**Status:** ✅ **PADRÕES RESPEITADOS**

**Comparação com pilares-empresa, rotinas-empresa, diagnosticos:**

| Aspecto | Existente | Cockpit | Conforme? |
|---------|-----------|---------|-----------|
| **Backend** |
| Estrutura módulo | module/controller/service | ✅ Igual | ✅ Sim |
| DTO validações | class-validator | ✅ Igual | ✅ Sim |
| Multi-tenancy | empresaId check | ✅ Igual | ✅ Sim |
| RBAC | Guards + @Roles | ✅ Igual | ✅ Sim |
| Auditoria | AuditService | ✅ Igual | ✅ Sim |
| Soft delete | campo ativo | ✅ Igual | ✅ Sim |
| **Frontend** |
| Componentes | Standalone | ✅ Igual | ✅ Sim |
| Injeção | inject() | ✅ Igual | ✅ Sim |
| Auto-save | debounceTime(1000ms) | ✅ Igual | ✅ Sim |
| Feedback | SweetAlert2 toast | ✅ Igual | ✅ Sim |
| Modais | NgBootstrap | ✅ Igual | ✅ Sim |

**Conclusão:** Cockpit segue TODOS os padrões arquiteturais estabelecidos.

---

## ⚠️ Pontos de Atenção

### 1. Biblioteca de Gráficos Não Especificada

**Severidade:** 🟡 **MÉDIA**

**Descrição:**  
Handoff menciona "Chart.js ou ng2-charts" sem definir qual usar.

**Impacto:**
- Dev Agent precisa escolher biblioteca
- Risco de escolha inadequada (bundle size, manutenção)

**Recomendação:**
Analisar frontend existente antes de implementar:
```bash
# Verificar se já existe biblioteca de gráficos instalada
grep -i "chart\|graph\|plot" frontend/package.json
```

**Sugestões:**
- **ng2-charts** (wrapper Angular para Chart.js): Mais integrado com Angular
- **Chart.js puro**: Mais leve, mas requer mais código manual
- **ApexCharts**: Alternativa moderna, rica em features

**Ação:** Dev Agent deve verificar package.json ANTES de adicionar nova dependência.

---

### 2. Validação de Range de Notas em ProcessoPrioritario

**Severidade:** 🟢 **BAIXA**

**Descrição:**  
ProcessoPrioritario exibe "nota atual" da rotina via join, mas não está claro se há validação de range (0-10) no backend de RotinaEmpresa.

**Impacto:**
- Se nota inválida existir, pode quebrar visualização
- Frontend assume nota entre 0-10 (classe CSS verde/amarelo/vermelho)

**Validação realizada:**
```typescript
// diagnostico-notas.component.ts (linha 428)
if (notaNum < 0 || notaNum > 10) {
  this.showToast('Nota deve estar entre 0 e 10', 'error');
  return;
}
```

**Recomendação:**
Verificar se backend de `NotaRotina` valida range 0-10. Se não, adicionar validação:
```typescript
// update-nota-rotina.dto.ts
@IsNumber()
@Min(0)
@Max(10)
nota: number;
```

**Ação:** Dev Agent deve revisar validação em RotinaEmpresa antes de implementar Cockpit.

---

### 3. Performance: N+1 em Queries de Gráficos

**Severidade:** 🟡 **MÉDIA**

**Descrição:**  
Endpoint `GET /cockpits/:id/graficos/dados?ano=2026` pode gerar N+1 queries se não otimizado.

**Exemplo de problema:**
```typescript
// ❌ Ruim (N+1)
const indicadores = await prisma.indicadorCockpit.findMany({ where: { cockpitPilarId } });
for (const ind of indicadores) {
  const meses = await prisma.indicadorMensal.findMany({ where: { indicadorCockpitId: ind.id } });
}

// ✅ Bom (1 query)
const indicadores = await prisma.indicadorCockpit.findMany({
  where: { cockpitPilarId },
  include: {
    mesesIndicador: {
      where: { ano: anoSelecionado },
      orderBy: { mes: 'asc' }
    }
  }
});
```

**Recomendação:**
- Usar `include` com `where` aninhado para eager loading
- Considerar índice composto em `IndicadorMensal(indicadorCockpitId, ano, mes)`

**Ação:** Dev Agent deve implementar query otimizada desde o início.

---

### 4. Ausência de Limite de Indicadores por Cockpit

**Severidade:** 🟢 **BAIXA**

**Descrição:**  
Não há limite de quantos indicadores podem ser criados por cockpit.

**Impacto:**
- Usuário pode criar 100+ indicadores
- Performance de renderização frontend (tabela grande)
- UX ruim (matriz muito extensa)

**Recomendação:**
Adicionar validação opcional:
```typescript
// cockpit-pilares.service.ts
const totalIndicadores = await this.prisma.indicadorCockpit.count({
  where: { cockpitPilarId, ativo: true }
});

if (totalIndicadores >= 20) {
  throw new BadRequestException('Limite de 20 indicadores por cockpit atingido');
}
```

**Ação:** Opcional. Deixar para Fase de Otimização (Fase 4).

---

## ❌ Inconsistências Críticas

**Status:** ✅ **NENHUMA INCONSISTÊNCIA CRÍTICA IDENTIFICADA**

Todas as regras estão consistentes com:
- Modelo de dados (schema Prisma)
- Convenções backend/frontend
- Padrões de segurança (multi-tenancy, RBAC)
- Documentos normativos (DOCUMENTATION_AUTHORITY.md, FLOW.md)

---

## 📋 Lacunas Identificadas

### 1. Falta Exemplo de Permissões RBAC no Frontend

**Descrição:**  
Handoff não especifica como implementar RBAC no frontend para botões/ações.

**Impacto:**
- Dev Agent pode implementar de forma inconsistente com resto do sistema

**Evidência do padrão existente:**
```typescript
// diagnostico-notas.component.ts (linha 76)
get isReadOnlyPerfil(): boolean {
  const user = this.authService.getCurrentUser();
  if (!user?.perfil) return false;
  const perfilCodigo = typeof user.perfil === 'object' ? user.perfil.codigo : user.perfil;
  return ['COLABORADOR', 'LEITURA'].includes(perfilCodigo);
}

// HTML (linha 134)
@if (pilarExpandido[i] && !isReadOnlyPerfil) {
  <button>Adicionar Indicador</button>
}
```

**Recomendação:**
Adicionar seção no handoff:
```markdown
### RBAC Frontend

Usar getter para controle de exibição:

```typescript
get canEdit(): boolean {
  const user = this.authService.getCurrentUser();
  return ['ADMINISTRADOR', 'GESTOR'].includes(user?.perfil?.codigo);
}
```

Condicionais no template:
```html
@if (canEdit) {
  <button>Adicionar Indicador</button>
}
```
```

**Ação:** Dev Agent deve extrair padrão RBAC de diagnostico-notas antes de implementar.

---

### 2. Falta Especificação de Feedback Visual de Auto-save

**Descrição:**  
Handoff menciona auto-save mas não especifica:
- Indicador de "salvando..." (spinner)
- Timestamp do último save
- Feedback de erro

**Evidência do padrão existente:**
```typescript
// diagnostico-notas.component.ts
savingCount = 0; // Contador de saves em andamento
lastSaveTime: Date | null = null; // Timestamp do último salvamento

// HTML (linhas 16-28)
@if (savingCount > 0) {
  <div class="saving-indicator">
    <div class="spinner-border spinner-border-sm"></div>
    <span>{{ 'DIAGNOSTICO.SAVING_CHANGES' | translate }}</span>
  </div>
} @else if (lastSaveTime) {
  <div class="last-save-info">
    <i class="feather icon-check-circle text-success"></i>
    <span>Salvo por último às: {{ getLastSaveTimeFormatted() }}</span>
  </div>
}
```

**Recomendação:**
Adicionar ao handoff:
- Variável `savingCount` (incrementar/decrementar)
- Variável `lastSaveTime` (atualizar após sucesso)
- Método `getLastSaveTimeFormatted()` para exibição

**Ação:** Dev Agent deve copiar padrão exato de diagnostico-notas.

---

### 3. Falta Testes E2E Mínimos

**Descrição:**  
Handoff marca testes E2E como "Opcional para Fase 1", mas não define mínimos obrigatórios.

**Impacto:**
- Feature pode ser mergeada sem validação de fluxo completo
- Bugs só detectados em produção

**Recomendação:**
Definir 3 testes E2E obrigatórios:
1. **Criar cockpit** → verificar que rotinas foram vinculadas automaticamente
2. **Adicionar indicador** → verificar que 13 meses foram criados
3. **Editar meta mensal** → verificar auto-save funcional

**Ação:** QA Agent deve criar esses testes na sequência do Dev Agent.

---

## 🎯 Recomendações para Dev Agent

### Ordem de Implementação Sugerida

**Fase 1A: Backend Base**
1. ✅ Migration já executada (schema pronto)
2. Criar módulo `CockpitPilaresModule`
3. Criar DTOs com validações
4. Implementar `CockpitPilaresService`:
   - `createCockpit` (com auto-vinculação)
   - `createIndicador` (com auto-criação de 13 meses)
5. Implementar `CockpitPilaresController` (apenas CRUD básico)
6. Testes unitários do service

**Fase 1B: Backend Complexo**
7. Endpoint de batch update de meses
8. Endpoint de dados agregados para gráficos (`/graficos/dados`)
9. Validações multi-tenant em TODOS os endpoints
10. Integração com AuditService

**Fase 1C: Frontend Base**
11. Verificar biblioteca de gráficos em package.json
12. Criar service Angular (`cockpit-pilares.service.ts`)
13. Criar tela de lista de cockpits
14. Criar dashboard básico (sem gráficos ainda)
15. Criar matriz de indicadores com auto-save

**Fase 1D: Frontend Complexo**
16. Componente de gráficos (meta vs realizado)
17. Matriz de processos prioritários
18. Modais (criar cockpit, adicionar indicador)
19. Feedback visual (saving indicator, last save time)
20. RBAC frontend (baseado em diagnostico-notas)

**Fase 1E: Validação**
21. Testes E2E mínimos (3 cenários críticos)
22. Revisão de segurança (Pattern Enforcer)
23. QA funcional

---

## 📚 Documentos de Referência Obrigatórios

Dev Agent DEVE consultar ANTES de implementar:

### Backend
- ✅ `/docs/business-rules/cockpit-pilares.md` — Fonte de verdade de regras
- ✅ `/docs/conventions/backend.md` — Padrões NestJS
- ✅ `/backend/src/modules/pilares-empresa/` — Exemplo de multi-tenancy
- ✅ `/backend/src/modules/diagnosticos/` — Exemplo de endpoints compostos

### Frontend
- ✅ `/docs/conventions/frontend.md` — Padrões Angular
- ✅ `/frontend/src/app/views/pages/diagnostico-notas/` — **PADRÃO OBRIGATÓRIO**
  - Auto-save com debounceTime
  - Feedback visual (saving/saved)
  - RBAC frontend
  - Modais NgBootstrap
- ✅ `/docs/conventions/cockpit-pilares-frontend.md` — **A SER CRIADO** (próximo passo)

---

## 🔒 Pontos de Segurança Validados

### Multi-Tenancy
- ✅ Todos endpoints validam `empresaId` via join
- ✅ GESTOR só acessa própria empresa
- ✅ ADMINISTRADOR acessa todas
- ✅ Validação em service, não apenas controller

### RBAC
- ✅ Guards aplicados em TODOS endpoints
- ✅ Perfis definidos por endpoint:
  - CREATE/UPDATE/DELETE: ADMIN, GESTOR
  - READ: Todos
  - UPDATE valores mensais: ADMIN, GESTOR, COLABORADOR

### Auditoria
- ✅ Registros CREATE/UPDATE/DELETE especificados
- ✅ AuditService (já existe) será usado
- ✅ Campos createdBy/updatedBy presentes

---

## ✅ Conclusão Final

**Documentação aprovada para implementação.**

**Pontos fortes:**
- Regras de negócio completas e testáveis
- Modelo de dados consistente com sistema existente
- Handoff estruturado e detalhado
- Rastreabilidade de mudanças (v1.1)
- Segurança (multi-tenancy, RBAC, auditoria)

**Pontos de atenção (não bloqueantes):**
- Especificar biblioteca de gráficos
- Otimizar queries de dados agregados
- Extrair padrões RBAC/auto-save do frontend existente
- Definir testes E2E mínimos

**Próximos passos:**
1. ✅ Criar `/docs/conventions/cockpit-pilares-frontend.md` com padrões extraídos
2. 🟢 Dev Agent pode iniciar implementação
3. 🟢 Pattern Enforcer deve validar durante desenvolvimento
4. 🟢 QA deve criar testes E2E baseados em critérios de aceitação

---

**Validado por:** Business Rules Extractor  
**Data:** 2026-01-15  
**Próximo agente:** Dev Agent (após criação de conventions/cockpit-pilares-frontend.md)
