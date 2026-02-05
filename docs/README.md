# Reiche Academy Documentation

Bem-vindo à documentação organizada do projeto Reiche Academy. Esta estrutura hierárquica organiza toda a documentação por níveis de autoridade e responsabilidade.

## 🏗️ Estrutura de Documentação (v2.0)

```
docs/
├── 1-governance/           # 🔝 Governança (imutável)
├── 2-business-rules/      # 📋 Regras de negócio
├── 3-architecture/        # 🏛️ Arquitetura técnica
├── 4-conventions/         # 📝 Padrões de código
├── 5-decisions/           # 📜 ADRs (histórico)
└── 6-handoffs/           # 🤝 Execução entre agentes
```

## 📍 Onde Encontrar Informação

### 🚀 Para Começar
- **[GOVERNANCE.md](GOVERNANCE.md)** - Fluxo + autoridade (versão compacta)
- **[1-governance/](1-governance/)** - Histórico e detalhes da governança

### 💼 Regras de Negócio
- **[2-business-rules/core/](2-business-rules/core/)** - Autenticação, usuários, empresas
- **[2-business-rules/pdca/](2-business-rules/pdca/)** - Sistema PDCA completo
- **[2-business-rules/security/](2-business-rules/security/)** - RBAC, sessão, multi-tenant
- **[2-business-rules/ui/](2-business-rules/ui/)** - Navegação, feedback, acessibilidade

### 🏛️ Arquitetura
- **[3-architecture/overview.md](3-architecture/overview.md)** - Stack e visão geral
- **[3-architecture/backend.md](3-architecture/backend.md)** - NestJS detalhado
- **[3-architecture/frontend.md](3-architecture/frontend.md)** - Angular detalhado
- **[3-architecture/data.md](3-architecture/data.md)** - Modelo de dados
- **[3-architecture/infrastructure.md](3-architecture/infrastructure.md)** - Deploy e infra

### 📝 Padrões de Código
- **[4-conventions/backend-patterns.md](4-conventions/backend-patterns.md)** - Padrões NestJS
- **[4-conventions/frontend-patterns.md](4-conventions/frontend-patterns.md)** - Padrões Angular
- **[4-conventions/naming.md](4-conventions/naming.md)** - Convenções de nomes
- **[4-conventions/testing.md](4-conventions/testing.md)** - Testes

### 📜 Decisões Históricas
- **[5-decisions/](5-decisions/)** - Architecture Decision Records (ADRs)

## 🔗 Fluxo de Trabalho

1. **Definir Regras** → `2-business-rules/`
2. **Projetar Arquitetura** → `3-architecture/`
3. **Estabelecer Padrões** → `4-conventions/`
4. **Documentar Decisões** → `5-decisions/`
5. **Executar com Handoffs** → `6-handoffs/`

## 🎯 Agentes do Sistema

O projeto usa 4 agentes especializados (v2.0):

1. **System Engineer** - Governança e meta-arquitetura
2. **Business Analyst** - Extração e validação de regras
3. **Dev Agent Enhanced** - Implementação e autovalidação
4. **QA Engineer** - Testes independentes

Veja **[AGENTS.md](AGENTS.md)** para detalhes completos.

## ⚡ Guia Rápido

### Para Desenvolvedores
- Novo feature? Comece em **2-business-rules/**
- Precisa de padrões? Veja **4-conventions/**
- Dúvidas de arquitetura? Consulte **3-architecture/**

### Para QA
- Testes baseados em regras? **2-business-rules/**
- Precisa de decisões históricas? **5-decisions/**
- Templates de handoff? **4-conventions/handoff-template.md**

### Para Arquitetos
- Visão geral? **3-architecture/overview.md**
- Decisões passadas? **5-decisions/**
- Governança? **1-governance/**

## 📊 Estatísticas da Documentação

- **Total de documentos**: 100+ arquivos organizados
- **Redução de redundâncias**: ~70% eliminadas
- **Estrutura hierárquica**: 6 níveis claros
- **Cross-references**: 200+ links internos

## ⚠️ Importante

- **Numeração 1-6** indica precedência (1 > 2 > 3 > 4 > 5 > 6)
- **ADRs são imutáveis** - decisions históricas
- **Business rules são source of truth** para comportamento
- **Conventions evoluem** com o código

---

**Para contribuir com a documentação, siga o [FLOW.md](FLOW.md) e respeite a hierarquia de autoridade em [DOCUMENTATION_AUTHORITY.md](DOCUMENTATION_AUTHORITY.md).**