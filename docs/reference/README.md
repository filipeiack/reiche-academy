# 📚 Documentação de Referência Técnica - Reiche Academy

Este diretório contém documentação técnica **não-normativa** (informativa) sobre funcionalidades implementadas no sistema.

> **Nota:** Estes documentos são **referências técnicas** e **não definem regras obrigatórias**.  
> Para documentos normativos, consulte: `/docs/business-rules/`, `/docs/architecture/`, `/docs/conventions/`.

---

## 🗂️ Estrutura

```
docs/reference/
├── README.md              ← VOCÊ ESTÁ AQUI
├── CONTEXT.md             ← Contexto histórico do projeto
└── frontend/              ← Referências técnicas do frontend
    ├── I18N.md
    ├── LOGIN_CUSTOMIZATION.md
    ├── MULTI_SELECT_BATCH_DELETE.md
    ├── ROUTE_PROTECTION.md
    ├── SORTABLE_DIRECTIVE.md
    ├── USER_AVATAR.md
    └── USER_DETAILS_OFFCANVAS.md
```

---

## 📖 Documentos Disponíveis

### Contexto Geral

- **[CONTEXT.md](CONTEXT.md)**
  - Contexto histórico do projeto
  - Stack tecnológica completa
  - Paleta de cores oficial
  - Módulos planejados (Fase 1 e 2)
  - Objetivos do MVP

---

## 🎨 Frontend - Referências Técnicas

Documentação de funcionalidades e componentes implementados no Angular:

### Sistema e Infraestrutura

- **[I18N.md](frontend/I18N.md)**
  - Sistema de internacionalização (pt-BR/en-US)
  - Como usar traduções em templates e componentes
  - Estrutura de arquivos de tradução
  - Pipe `translate` e serviço `TranslateService`

- **[ROUTE_PROTECTION.md](frontend/ROUTE_PROTECTION.md)**
  - Sistema de proteção de rotas (Route Guards)
  - `authGuard` - verificação de autenticação
  - Redirecionamento para login
  - Configuração de rotas protegidas

### Autenticação e Personalização

- **[LOGIN_CUSTOMIZATION.md](frontend/LOGIN_CUSTOMIZATION.md)**
  - Login customizado por empresa
  - Endpoint `/empresas/by-login-url/:loginUrl`
  - Logo dinâmico por empresa
  - Rotas: `/auth/login` e `/auth/login/:loginUrl`

### Componentes Reutilizáveis

- **[USER_AVATAR.md](frontend/USER_AVATAR.md)**
  - Sistema de avatar de perfil
  - Componente `UserAvatarComponent`
  - Pipe `initials` para gerar iniciais
  - Fallback com iniciais em círculo colorido

- **[USER_DETAILS_OFFCANVAS.md](frontend/USER_DETAILS_OFFCANVAS.md)**
  - Offcanvas de detalhes do usuário
  - Exibição de informações completas
  - Avatar, badges de status e perfil
  - Formatação de datas

### Diretivas e Funcionalidades de Tabelas

- **[SORTABLE_DIRECTIVE.md](frontend/SORTABLE_DIRECTIVE.md)**
  - Diretiva para ordenação de tabelas
  - Indicadores visuais (▲/▼)
  - Ciclo de ordenação (asc → desc → none)
  - Emissão de eventos `sort`

- **[MULTI_SELECT_BATCH_DELETE.md](frontend/MULTI_SELECT_BATCH_DELETE.md)**
  - Seleção múltipla em tabelas
  - Checkboxes individuais e select-all
  - Alert bar com contador de selecionados
  - Delete em lote com confirmação SweetAlert2

---

## 🔍 Como Usar Esta Documentação

### Para Desenvolvedores

1. **Implementar funcionalidade similar:**
   - Consulte o documento técnico correspondente
   - Adapte o código para seu caso de uso
   - Siga os padrões estabelecidos

2. **Entender funcionalidade existente:**
   - Leia a visão geral e exemplos
   - Veja a estrutura de arquivos
   - Consulte os snippets de código

3. **Troubleshooting:**
   - Verifique se está usando os imports corretos
   - Confirme a configuração necessária
   - Consulte os exemplos de uso

### Para Documentação

Esta pasta é **não-normativa**. Se você precisa:

- **Definir regras de negócio** → `/docs/business-rules/`
- **Documentar arquitetura** → `/docs/architecture/`
- **Criar convenções** → `/docs/conventions/`
- **Registrar decisões** → `/docs/adr/`
- **Escrever guias setup** → `/docs/guides/`

---

## 🆘 Precisa de Ajuda?

### Documentos Normativos (Obrigatórios)
- [FLOW.md](../FLOW.md) - Fluxo oficial de desenvolvimento
- [DOCUMENTATION_AUTHORITY.md](../DOCUMENTATION_AUTHORITY.md) - Hierarquia de documentos
- [business-rules/](../business-rules/) - Regras de negócio
- [conventions/](../conventions/) - Convenções técnicas

### Guias de Setup
- [guides/](../guides/) - Guias de configuração e deploy

---

**Status:** Documentação de Referência (Não-Normativa)  
**Última atualização:** Janeiro 2026
