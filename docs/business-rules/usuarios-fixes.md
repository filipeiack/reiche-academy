# Plano de Correção — Módulo Usuários

Fonte: usuarios-review.md  
Status: ✅ Correções Críticas Implementadas

## Correções Críticas (Bloqueantes)

- [x] RA-001 — Isolamento Multi-Tenant ✅ (commit dcad616)
- [x] RA-002 — Bloqueio de Auto-Edição Privilegiada ✅ (commit dcad616)
- [x] RA-003 — Proteção de Recursos (Foto) ✅ (commit dcad616)
- [x] RA-004 — Restrição de Elevação de Perfil ✅ (commit dcad616)

**Relatório completo:** `usuarios-implementacao.md`

---

## Correções de Segurança Alta (Pendentes)

- [ ] RA-005 — Fortalecer validação de senha
  - Aumentar mínimo para 8 caracteres
  - Exigir complexidade (maiúscula, minúscula, número, especial)
  
- [ ] RA-006 — Auditoria adicional
  - Registrar tentativas de acesso negado (403)
  - Registrar falhas de criação (email duplicado)

- [ ] Remover perfil CONSULTOR do código
  - Limpar referências no backend e frontend

---

## Melhorias (Opcional)

- [ ] Search server-side
  - Implementar endpoint `/usuarios/search` com filtros
  
- [ ] Validação de telefone
  - Adicionar regex no DTO para formato brasileiro
  
- [ ] Validação de deleção avançada
  - Impedir deleção do último ADMINISTRADOR
  - Verificar vínculos críticos antes de deletar

---

**Última atualização:** 21/12/2024  
**Próximo agente:** QA para testes de integração


## Correções Críticas (Bloqueantes)

- [ ] RA-001 — Isolamento Multi-Tenant
- [ ] RA-002 — Bloqueio de Auto-Edição Privilegiada
- [ ] RA-003 — Proteção de Recursos (Foto)
- [ ] RA-004 — Restrição de Elevação de Perfil

## Correções de Segurança Alta

- [ ] Fortalecer validação de senha
- [ ] Auditoria de foto
- [ ] Remover perfil CONSULTOR

## Melhorias

- [ ] Search server-side
- [ ] Validação de telefone
