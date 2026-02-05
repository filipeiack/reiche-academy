# 2-Business Rules - Regras de Negócio

Esta seção contém todas as regras de negócio do sistema Reiche Academy, organizadas por domínio. Estas regras definem **o que** o sistema faz, independentemente da implementação.

## 🏗️ Estrutura

```
2-business-rules/
├── README.md              # Este guia
├── core/                  # Domínios fundamentais
│   ├── auth.md           # Autenticação e tokens
│   ├── usuarios.md       # Gestão de usuários
│   ├── empresas.md       # Multi-tenant
│   └── auditoria.md      # Logs e rastreamento
├── pdca/                  # Sistema PDCA
│   ├── cockpit.md        # Cockpit de indicadores
│   ├── pilares.md        # Pilares e templates
│   ├── periodo-mentoria.md # Ciclos anuais
│   └── README.md         # Guia PDCA
├── security/              # Segurança e acesso
│   ├── rbac.md           # Perfis e permissões
│   ├── multi-tenant.md   # Isolamento de dados
│   ├── session-policy.md # Sessão e tokens
│   └── README.md         # Guia segurança
└── ui/                    # Interface e experiência
    ├── navigation.md     # Sidebar e navegação
    ├── feedback.md       # Toasts, modais, alerts
    ├── forms.md          # Validações e UX
    ├── accessibility.md  # Acessibilidade (WCAG)
    └── README.md         # Guia UI
```

## 🎯 Como Usar

### Para Desenvolvedores
- **Implementar feature**: Consulte regra específica antes de codar
- **Dúvidas de comportamento**: Verifique regra correspondente
- **Testes unitários**: Baseie-se nas regras documentadas

### Para QA
- **Criar testes**: Use regras como fonte da verdade
- **Validar comportamentos**: Compare implementação vs regra
- **Edge cases**: Verifique seções de exceções e ambiguidades

### Para Product Owners
- **Definir requisitos**: Use regras existentes como base
- **Priorizar features**: Verifique status de implementação
- **Negociar mudanças**: Entenda impactos nas regras

## 📋 Status das Regras

Cada regra tem status padronizado:

- ✅ **Implementado** - Funciona como documentado
- ⚠️ **Parcial** - Implementado com ressalvas
- ❌ **Ausente** - Não implementado
- 🔄 **Proposto** - Aguardando implementação

## 🔗 Relacionamentos

### Cross-Domínio
- **Auth ↔ Security**: Tokens validam perfis RBAC
- **PDCA ↔ Core**: Pilares pertencem a empresas
- **UI ↔ Security**: Menu obedece RBAC
- **Todos ↔ Auditoria**: Tudo é logado

### Referências Externas
- **Architecture**: Como regras são implementadas
- **ADRs**: Por quê das decisões de negócio
- **Conventions**: Padrões de codificação

## 📊 Métricas

| Domínio | Regras | Implementadas | Ausentes |
|---------|--------|---------------|----------|
| Core | 42 | 35 | 7 |
| PDCA | 28 | 20 | 8 |
| Security | 15 | 12 | 3 |
| UI | 18 | 15 | 3 |
| **Total** | **103** | **82** | **21** |

## 🚨 Ausências Críticas

Regras não implementadas que precisam de atenção:

1. **Rate Limiting** (R-AUTH-XXX) - Segurança crítica
2. **Single Session** (RN-SEC-001) - Política de segurança
3. **Logout Endpoint** - Invalidação de tokens
4. **2FA** - Autenticação forte
5. **Clean-up Jobs** - Manutenção de dados

## 🔄 Atualizações

- **Extração**: Business分析师 extrai do código
- **Validação**: Business analysts revisam completude
- **Atualização**: Mudanças no código devem refletir aqui
- **Versão**: Cada regra tem data de última extração

---

**Para regras específicas, navegue pelo domínio correspondente. Para mudanças em regras, consulte [FLOW.md](../FLOW.md).**