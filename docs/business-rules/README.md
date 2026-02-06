# Índice enxuto de regras normativas

## Visão Geral

Este diretório reúne as regras de negócio aprovadas. Cada arquivo representa um domínio (templates globais, instâncias multi-tenant, auditoria, cockpit, usuários, autenticação e navegação). Use as páginas listadas abaixo como ponto de entrada para cada tema.

## Domínios Principais

- **Templates globais:** `pilares.md`, `rotinas.md`, `indicadores-templates-globais.md`
- **Instâncias por empresa (Snapshot Pattern):** `pilares-empresa.md`, `rotinas-empresa.md`, `cockpit-gestao-indicadores.md`
- **Diagnóstico e evolução:** `diagnosticos.md`, `pilar-evolucao.md`, `pilar-evolucao-visualizacao-completa.md`
- **Usuários, perfis e autenticação:** `usuarios.md`, `perfis.md`, `auth.md`, `auth-ui-visualizar-ocultar-senha.md`
- **Empresas e multi-tenant:** `empresas.md`, `seguranca-multi-tenant.md`
- **Cockpit / interface:** `cockpit-pilares.md`, `cockpit-processos-prioritarios.md`, `sidebar.md`, `navbar.md`, `sidebar-cockpit-submenu-ordenacao.md`
- **Auditoria:** `audit.md`, `auditoria-padronizacao-entidade.md`, `auditoria-periodos-mentoria.md`

## Fluxos e padrões transversais

- **Snapshot Pattern:** templates globais → snapshots por empresa → diagnóstico/métricas.
- **RBAC + Multi-tenant:** todos os arquivos incluem restrições por perfil (ADMINISTRADOR, GESTOR, COLABORADOR, LEITURA) e `empresaId`.
- **Soft delete e auditoria:** `ativo: boolean` + `audit.md` documenta trilha de ações críticas.

## Uso rápido

1. Leia `docs/governance.md` para entender o fluxo e o agente responsável.
2. Abra o documento que corresponde ao domínio da sua tarefa.
3. Verifique os handoffs em `/docs/handoffs/<feature>/` antes de implementar ou testar.

## Status & próximos passos

- **Documentos com revisão pendente:** `diagnosticos.md`, `rotinas.md`, `pilar-evolucao.md`
- **Documentos arquivados:** mova versões antigas (ex: `pilares-empresa/`) para `/docs/business-rules/archive/` enquanto mantiverem histórico.
- **Novo documento sugerido:** `agenda-reuniao.md` (interface existente sem CRUD documentado).

## Como contribuir

- Atualize o README aqui sempre que adicionar uma nova regra.
- Condense informações repetidas em um único documento temático (por exemplo, mantenha o Snapshot Pattern em um só lugar e remova duplicações).
- Use `docs/handoffs/guidelines.md` para validar o handoff antes de avançar.

**Nota:** este README agora serve como índice rápido. Conteúdo técnico continua nos arquivos específicos de cada domínio.