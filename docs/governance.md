# Governança Normativa — Flow & Authority Consolidado

**Última atualização:** 2026-02-06

---

## Objetivo

Este documento reúne o **fluxo oficial de desenvolvimento**, a **hierarquia de documentos normativos**, o **rol dos agentes autorizados** e as **regras de comunicação** (handoffs) que regem o projeto Reiche Academy. Ele substitui o fluxo separado e o mapa de autoridade anteriores, permitindo que os agentes encontrem todas as instruções críticas em um único lugar.

---

## Changelog

- **v2.1 (2026-02-06)** — Consolidação de `FLOW.md` + `DOCUMENTATION_AUTHORITY.md`; resumo dos handoffs; apontamento de safe failure. (Esta é a versão normativa atual.)
- **v2.0 (2026-01-22)** — Consolidação de 7 → 4 agentes; redução de handoffs; foco em OpenCode.

---

## Princípios Inquebráveis

1. **Documentos mandam, agentes obedecem**.
2. **Memória entre agentes só via artefatos oficiais (handoffs)**.
3. **Nenhum agente valida o próprio trabalho** — Dev auto-valida padrões, QA valida regras.
4. **Instruções ad-hoc não criam autoridade**.
5. **Nenhuma mudança chega ao `main` fora do fluxo descrito abaixo**.
6. **Humano tem a decisão final; Safe Failure é preferível a improviso**.

---

## Fluxo Oficial

1. **Requisitos com regra documentada** (novas regras passam por Business Analyst).
2. **Business Analyst** analisa regras, aprova e gera `business-v1.md` no handoff correspondente.
3. **Dev Agent Enhanced** implementa, auto-valida padrões, documenta em `dev-vN.md`.
4. **QA Engineer** cria testes baseados em regras, executa e documenta em `qa-vN.md`.
5. **System Engineer** atualiza documentação pós-merge, monitora impactos.

> Obs.: Handoffs são versionados e armazenados em `/docs/handoffs/<feature>/`.

---

## Agentes Oficiais (v2.1)

| # | Agente | Documento | Responsabilidade |
|---|--------|-----------|------------------|
| 0 | System Engineer | `/.github/agents/0-System_Engineer.md` | Governança meta-nível (modos: Governança, Consultivo, Documentação) |
| 1 | Business Analyst | `/.github/agents/1-Business_Analyst.md` | Extração e validação de regras; handoffs `business-*` |
| 2 | Dev Agent Enhanced | `/.github/agents/2-DEV_Agent_Enhanced.md` | Implementação + auto-validação de padrões; handoffs `dev-*` |
| 3 | QA Engineer | `/.github/agents/3-QA_Engineer.md` | Testes independentes (unitários + E2E); handoffs `qa-*` |

**Nota:** Agentes inexistentes não possuem autoridade, mesmo que instruídos diretamente.

---

## Hierarquia de Documentos Normativos

1. `docs/governance.md` (este arquivo)
2. `/.github/agents/*.md`
3. `/docs/business-rules/*`
4. `/docs/adr/*`
5. `/docs/architecture/*`
6. `/docs/conventions/*`
7. `/docs/handoffs/*`

### Regras de conflito e ausência

- Em conflitos, siga a ordem acima e notifique um humano.
- Falta de documento normativo → pare, descreva o gap, cite agente ou documento necessário e aguarde decisão.

---

## Handoffs e Comunicação

1. **Estrutura:** `/docs/handoffs/<feature>/` → arquivos `business-*`, `dev-*`, `qa-*`. A versão `vN` só avança quando há ida e volta entre agentes.
2. **Ritmo:** Cada agente lê o handoff anterior; QA só atua quando o pattern está conforme.
3. **Arquivamento:** Após 90 dias sem atividade ou após merge, mova a pasta para `/docs/handoffs-archive/`.
4. **Nova página de orientação:** `docs/handoffs/guidelines.md` descreve organização ideal.

---

## Safe Failure Rule

1. Pare se a informação estiver faltando ou o conflito for crítico.
2. Informe o que falta e qual documento/responsável pode suprir (agent, ADR, handoff).
3. Aguarde orientação humana antes de continuar.
4. Silêncio ou recusa explícita é preferível a improvisar.

---

## Ferramentas Básicas para Agentes

- Sempre consulte `docs/governance.md` antes de agir.
- Urgência? Citar a versão do handoff e do ADR relacionada facilita rastreio.
- Documentos de apoio: `docs/business-rules/README.md`, `docs/conventions/README.md`, `docs/architecture/README.md`.

---

## Como Usar

1. Leia do topo para baixo (Princípios → Fluxo → Agentes → Hierarquia).
2. Em caso de dúvida, **priorize a hierarquia** e notifique o humano responsável.
3. Certifique-se de que cada handoff referencie este guia quando necessário.
