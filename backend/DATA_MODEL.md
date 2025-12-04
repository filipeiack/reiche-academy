# Reiche Academy - Data Model (ERD)

This document summarizes the Phase 1 data model and relationships implemented in `backend/prisma/schema.prisma`.

## ER Diagram (Mermaid)

```mermaid
erDiagram
  Usuario {
    String id PK
    String email UK
    String nome
    String senha
    Enum   perfil
    Boolean ativo
    String empresaId FK
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  Empresa {
    String id PK
    String nome
    String cnpj UK
    String razaoSocial
    Boolean ativo
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  Pilar {
    String id PK
    String nome UK
    String descricao
    Int    ordem
    Boolean ativo
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  Rotina {
    String id PK
    String nome
    String descricao
    Int    ordem
    Boolean ativo
    String pilarId FK
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  PilarEmpresa {
    String id PK
    String empresaId FK
    String pilarId   FK
    Boolean ativo
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  Diagnostico {
    String id PK
    String empresaId FK
    String criadoPorId FK
    DateTime dataInicio
    DateTime dataFim
    Boolean  finalizado
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  DiagnosticoPilar {
    String id PK
    String diagnosticoId FK
    String pilarId FK
    Float  nota
    Enum   criticidade
    String observacao
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  DiagnosticoRotina {
    String id PK
    String diagnosticoId FK
    String rotinaId FK
    Float  nota
    Enum   criticidade
    String observacao
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  AgendaReuniao {
    String id PK
    String titulo
    String descricao
    DateTime dataHora
    Int duracao
    String local
    String link
    DateTime createdAt
    DateTime updatedAt
    String createdBy
    String updatedBy
  }

  AuditLog {
    String id PK
    String usuarioId FK
    String entidade
    String entidadeId
    String acao
    Json   dadosAntes
    Json   dadosDepois
    DateTime createdAt
  }

  %% Relationships
  Empresa ||--o{ Usuario : "empresa (optional)"
  Usuario ||--o{ Diagnostico : "criadoPor"
  Empresa ||--o{ Diagnostico : "empresa"

  Pilar ||--o{ Rotina : "pilar"
  Empresa ||--o{ PilarEmpresa : "empresa"
  Pilar ||--o{ PilarEmpresa : "pilar"

  Diagnostico ||--o{ DiagnosticoPilar : "pilares"
  Pilar ||--o{ DiagnosticoPilar : "pilar"

  Diagnostico ||--o{ DiagnosticoRotina : "rotinas"
  Rotina ||--o{ DiagnosticoRotina : "rotina"

  Usuario ||--o{ AuditLog : "autor"
```

## Enums
- `PerfilUsuario`: CONSULTOR | GESTOR | COLABORADOR | LEITURA
- `Criticidade`: ALTO | MEDIO | BAIXO
- `StatusAcao`: PENDENTE | EM_ANDAMENTO | CONCLUIDA | CANCELADA

## Unique Constraints & Indexes
- `Usuario.email` unique
- `Empresa.cnpj` unique
- `Pilar.nome` unique
- `PilarEmpresa (empresaId, pilarId)` unique (vínculo único por empresa+pilar)
- `DiagnosticoPilar (diagnosticoId, pilarId)` unique
- `DiagnosticoRotina (diagnosticoId, rotinaId)` unique
- `AuditLog`: indexes on `(entidade, entidadeId)` and `(usuarioId)`

## Cardinalities & Notes
- Empresa 1—N Usuario (empresaId opcional em Usuario)
- Empresa 1—N Diagnostico (cada diagnóstico pertence a uma empresa)
- Usuario 1—N Diagnostico (criadoPorId)
- Pilar 1—N Rotina
- Empresa N—N Pilar via `PilarEmpresa`
- Diagnostico N—N Pilar via `DiagnosticoPilar` (com nota e criticidade)
- Diagnostico N—N Rotina via `DiagnosticoRotina` (com nota e criticidade)
- Usuario 1—N AuditLog

## Audit & Soft Delete
- Soft delete: `ativo` em Usuario, Empresa, Pilar, Rotina
- Auditoria: `createdBy`, `updatedBy`, timestamps

## Business Rules Reflected
- Isolamento por empresa: relações sempre filtráveis por `empresaId`
- Criticidade enum sem acentos: `ALTO|MEDIO|BAIXO`
- Validações de unicidade para nomes/CNPJ e vínculos
- Proteção de exclusão lógica (ex.: Pilar não desativado se houver Rotinas ativas)

## Suggested Validations/Checks
- Foreign keys enforced via Prisma (references)
- Migrations confirm constraints exist
- Seed minimal data for `Pilar` and `Rotina` to validate joins
- Sample query: listar pilares e rotinas por empresa via `PilarEmpresa`
