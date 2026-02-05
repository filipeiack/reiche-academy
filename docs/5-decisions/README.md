# 5-Decisions - Architecture Decision Records (ADRs)

Esta seção contém o registro histórico de decisões arquitetônicas do projeto Reiche Academy. ADRs documentam decisões importantes, seu contexto e consequências.

## 📋 O que são ADRs?

**Architecture Decision Records (ADRs)** são documentos que capturam decisões arquitetônicas importantes, incluindo:
- **Contexto**: Por que a decisão foi necessária
- **Decisão**: O que foi decidido
- **Consequências**: Resultados da decisão
- **Status**: Implementado, proposto, etc.

## 📁 Estrutura

```
5-decisions/
├── README.md                    # Este guia
├── ADR-001*.md                  # Decisões numeradas
├── ADR-002*.md
└── ...
```

## 🔍 Como Usar

### Para Consulta Rápida
- Busque por ADR-XXX nos documentos de regras/arquitetura
- ADRs são referenciados quando explicam "por quê" de uma regra

### Para Tomada de Decisão
- Consulte ADRs similares antes de novas decisões
- Use o formato padrão para novos ADRs

## 📝 ADRs Aprovados

| ADR | Título | Status | Data |
|-----|--------|--------|------|
| [ADR-001](ADR-001-system-engineer-creation.md) | System Engineer Creation | ✅ Aprovado | 2025-12-22 |
| [ADR-002](ADR-002-fix-qa-unitario-tools.md) | Fix QA Unitário Tools | ✅ Aprovado | 2026-01-14 |
| [ADR-003](ADR-003-cockpit-pilares-architecture.md) | Cockpit Pilares Architecture | ✅ Aprovado | 2026-01-15 |
| [ADR-004](ADR-004-consolidacao-system-engineer.md) | Consolidação System Engineer | ✅ Aprovado | 2026-01-15 |
| [ADR-005](ADR-005-ux-excel-like-indicadores.md) | UX Excel-like para Indicadores | ✅ Aprovado | 2026-01-15 |
| [ADR-006](ADR-006-arquitetura-matriz-indicadores.md) | Arquitetura de Componentes Matriz | ✅ Aprovado | 2026-01-15 |
| [ADR-007](ADR-007-periodo-mentoria-1-ano.md) | Período Mentoria 1 Ano | ✅ Aprovado | 2026-01-16 |
| [ADR-008](ADR-008-consolidacao-agentes-opencode.md) | Consolidação Agentes OpenCode | ✅ Aprovado | 2026-01-16 |
| [ADR-009](ADR-009-periodo-avaliacao-trimestral.md) | Período Avaliação Trimestral | ✅ Aprovado | 2026-01-17 |
| [ADR-010](ADR-010-single-session-policy.md) | Single Session Policy | ✅ Aprovado | 2026-01-18 |
| [ADR-011](ADR-011-global-sanitization-pipe.md) | Global Sanitization Pipe | ✅ Aprovado | 2026-01-20 |
| [ADR-012](ADR-012-qa-data-testid-exception.md) | QA data-testid Exception | ✅ Aprovado | 2026-01-22 |
| [ADR-013](ADR-013-csrf-desnecessario-jwt-stateless.md) | CSRF Desnecessário JWT Stateless | ✅ Aprovado | 2026-01-30 |

## 🎯 Quando Criar um ADR?

- Mudanças significativas na arquitetura
- Escolha de tecnologias/frameworks
- Padrões estruturais novos
- Decisões que impactam múltiplos módulos
- Trade-offs técnicos importantes

## 🔄 Relacionamentos

ADRs referenciam e são referenciados por:
- **Business Rules**: Quando ADR justifica regra específica
- **Architecture**: Quando ADR define padrão arquitetural
- **Security**: Quando ADR estabelece política de segurança

## 📝 Criando Novo ADR

1. Verifique se ADR similar já existe
2. Use template padrão (ver ADR-001)
3. Numere sequencialmente (próximo: ADR-014)
4. Discuta antes de aprovar
5. Atualize referências cruzadas

## ⚠️ Importante

ADRs são **registros históricos**. Uma vez criados, não são modificados - apenas novos ADRs podem rever decisões anteriores.

---

**Gerenciado por:** System Engineer (Modo Documentação)  
**Última atualização:** 2026-01-30  
**Total ADRs:** 14 decisões documentadas
