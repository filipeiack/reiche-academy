# Índice de Documentação de Regras de Negócio

## Estrutura Organizacional

Este diretório contém a documentação completa de todas as regras de negócio do sistema, organizadas por módulo/contexto.

### Documentos Principais

#### Gestão de Templates (Bibliotecas Globais)
- **[pilares.md](./pilares.md)** — Templates globais de pilares (catálogo de padrões)
- **[rotinas.md](./rotinas.md)** — Templates globais de rotinas (biblioteca de rotinas padrão)

#### Gestão Multi-Tenant (Instâncias por Empresa)
- **[pilares-empresa.md](./pilares-empresa.md)** — Instâncias de pilares por empresa (Snapshot Pattern)
- **[rotinas-empresa.md](./rotinas-empresa.md)** — Instâncias de rotinas por empresa (Snapshot Pattern)

#### Diagnóstico e Avaliação
- **[diagnosticos.md](./diagnosticos.md)** — Avaliação de rotinas (NotaRotina) + interface de diagnóstico
- **[pilar-evolucao.md](./pilar-evolucao.md)** — Evolução temporal de pilares (snapshots de médias)

#### Gestão de Usuários e Autenticação
- **[auth.md](./auth.md)** — Autenticação e autorização
- **[usuarios.md](./usuarios.md)** — Gestão de usuários
- **[perfis.md](./perfis.md)** — Perfis e permissões

#### Gestão de Empresas
- **[empresas.md](./empresas.md)** — CRUD de empresas e contexto multi-tenant

#### Interface e Navegação
- **[navbar.md](./navbar.md)** — Barra de navegação superior
- **[sidebar.md](./sidebar.md)** — Menu lateral

#### Auditoria
- **[audit.md](./audit.md)** — Registro de operações (audit trail)

---

## Relacionamentos Entre Documentos

### Snapshot Pattern (Templates → Instâncias)

```
┌─────────────────────────────────────────────────────────┐
│  TEMPLATES GLOBAIS (Biblioteca/Catálogo)                │
├─────────────────────────────────────────────────────────┤
│  pilares.md        → Pilar (templates de pilares)       │
│  rotinas.md        → Rotina (templates de rotinas)      │
└─────────────────────────────────────────────────────────┘
                         ↓ (cópia snapshot)
┌─────────────────────────────────────────────────────────┐
│  INSTÂNCIAS POR EMPRESA (Multi-Tenant)                  │
├─────────────────────────────────────────────────────────┤
│  pilares-empresa.md → PilarEmpresa (snapshot editável)  │
│  rotinas-empresa.md → RotinaEmpresa (snapshot editável) │
└─────────────────────────────────────────────────────────┘
                         ↓ (avaliação)
┌─────────────────────────────────────────────────────────┐
│  DIAGNÓSTICO E EVOLUÇÃO                                 │
├─────────────────────────────────────────────────────────┤
│  diagnosticos.md     → NotaRotina (avaliações)          │
│  pilar-evolucao.md   → PilarEvolucao (histórico médias) │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Uso Típico

1. **ADMINISTRADOR** cria templates em [pilares.md](./pilares.md) e [rotinas.md](./rotinas.md)
2. **GESTOR** cria instâncias (cópias) para sua empresa via [pilares-empresa.md](./pilares-empresa.md) e [rotinas-empresa.md](./rotinas-empresa.md)
3. **COLABORADORES** avaliam rotinas via [diagnosticos.md](./diagnosticos.md)
4. **GESTOR** congela médias e visualiza evolução via [pilar-evolucao.md](./pilar-evolucao.md)

---

## Convenções de Nomenclatura

### Templates vs Instâncias

| Conceito | Documento | Entidade | Escopo |
|----------|-----------|----------|--------|
| Template de Pilar | pilares.md | Pilar | Global (todos) |
| Instância de Pilar | pilares-empresa.md | PilarEmpresa | Multi-tenant |
| Template de Rotina | rotinas.md | Rotina | Global (todos) |
| Instância de Rotina | rotinas-empresa.md | RotinaEmpresa | Multi-tenant |

### Regra de Ouro

**Templates** (biblioteca global):
- Apenas ADMINISTRADOR cria/edita
- Servem como catálogo de padrões
- **Não são editados por empresas**

**Instâncias** (snapshots por empresa):
- GESTOR e ADMINISTRADOR criam/editam
- Copiados de templates OU customizados
- **Editáveis sem afetar outras empresas**
- Isolamento multi-tenant

---

## Como Usar Este Índice

### Encontrar Regra Específica

**Quero saber sobre templates de pilares:**
→ Consulte [pilares.md](./pilares.md)

**Quero saber como empresas gerenciam pilares:**
→ Consulte [pilares-empresa.md](./pilares-empresa.md)

**Quero saber como funcionam avaliações de rotinas:**
→ Consulte [diagnosticos.md](./diagnosticos.md)

**Quero saber sobre histórico de evolução:**
→ Consulte [pilar-evolucao.md](./pilar-evolucao.md)

### Entender Fluxo Completo

**Fluxo de Diagnóstico Empresarial:**

1. [pilares.md](./pilares.md) — Templates criados
2. [rotinas.md](./rotinas.md) — Templates criados
3. [pilares-empresa.md](./pilares-empresa.md) — Empresa adiciona pilares
4. [rotinas-empresa.md](./rotinas-empresa.md) — Empresa adiciona rotinas
5. [diagnosticos.md](./diagnosticos.md) — Usuários avaliam rotinas
6. [pilar-evolucao.md](./pilar-evolucao.md) — Gestor visualiza evolução

---

## Status de Implementação

| Documento | Status Backend | Status Frontend |
|-----------|---------------|-----------------|
| pilares.md | ✅ Implementado | ✅ Implementado |
| pilares-empresa.md | ✅ Implementado | ✅ Implementado |
| rotinas.md | ✅ Implementado | ✅ Implementado |
| rotinas-empresa.md | ✅ Implementado | ✅ Implementado |
| diagnosticos.md | ✅ Implementado | ✅ Implementado |
| pilar-evolucao.md | ✅ Implementado | ✅ Implementado |
| auth.md | ✅ Implementado | ✅ Implementado |
| usuarios.md | ✅ Implementado | ✅ Implementado |
| perfis.md | ✅ Implementado | ✅ Implementado |
| empresas.md | ✅ Implementado | ✅ Implementado |
| audit.md | ✅ Implementado | N/A (backend-only) |
| navbar.md | N/A (frontend-only) | ✅ Implementado |
| sidebar.md | N/A (frontend-only) | ✅ Implementado |

---

## Padrões Arquiteturais Aplicados

### Snapshot Pattern
- **Documentos:** pilares-empresa.md, rotinas-empresa.md
- **Descrição:** Templates globais são copiados para instâncias editáveis por empresa
- **Vantagem:** Customização total sem afetar outras empresas

### Multi-Tenancy
- **Documentos:** Todos (exceto templates globais)
- **Descrição:** Isolamento de dados por empresa
- **Validação:** `empresaId === user.empresaId` (exceto ADMINISTRADOR)

### Soft Delete
- **Documentos:** Todos os CRUDs
- **Descrição:** Desativação lógica via campo `ativo: boolean`
- **Vantagem:** Preservação de histórico e integridade referencial

### RBAC (Role-Based Access Control)
- **Documentos:** Todos
- **Descrição:** Controle de acesso por perfil (ADMINISTRADOR, GESTOR, CONSULTOR, COLABORADOR, LEITURA)
- **Implementação:** Guards NestJS (backend) + Route Guards Angular (frontend)

### Audit Trail
- **Documentos:** audit.md
- **Descrição:** Registro completo de operações CUD (Create, Update, Delete)
- **Escopo:** Todas as entidades críticas

---

## Histórico de Mudanças

**13/01/2026:**
- ✅ Criado **rotinas-empresa.md** (extraído de rotinas.md e diagnosticos.md)
- ✅ Criado **pilar-evolucao.md** (extraído de diagnosticos.md)
- ✅ Criado **README.md** (este arquivo - índice organizacional)

**08/01/2026:**
- Extração inicial de regras por engenharia reversa
- Documentação de Snapshot Pattern aplicado

---

## Próximos Passos

### Documentos Pendentes de Criação
- ❌ **agenda-reuniao.md** — AgendaReuniao (entidade existe no schema, sem CRUD)

### Documentos Pendentes de Revisão
- ⚠️ **diagnosticos.md** — Remover duplicações de RotinaEmpresa e PilarEvolucao (delegado para documentos específicos)
- ⚠️ **rotinas.md** — Remover seções de RotinaEmpresa (delegado para rotinas-empresa.md)

---

**Agente:** Business Rules Extractor  
**Data:** 13/01/2026  
**Versão:** 1.0
