# Business Analysis: Segurança Adversarial (Smoke)

**Data:** 2026-01-30  
**Analista:** Business Analyst  
**Regras Documentadas:**
- /docs/business-rules/seguranca-autenticacao.md
- /docs/business-rules/seguranca-multi-tenant.md
- /docs/business-rules/usuarios.md

---

## 1️⃣ Resumo da Análise

- **Modo:** Extração + Validação (com base em QA E2E)
- **Regras documentadas:** 0 arquivos novos (uso das regras existentes)
- **Status:** ⚠️ APROVADO COM RESSALVAS

## 2️⃣ Regras Documentadas

### Regras Extraídas
- Nenhuma nova regra extraída.

### Regras Propostas
- Nenhuma regra proposta formalmente.

## 3️⃣ Análise de Completude

### ✅ O que está claro
- **RN-SEC-002** exige isolamento multi-tenant (guard + service) e validação de UUID.
- **RN-SEC-001.7** exige rate limiting com limites definidos.
- **R-USU-004** bloqueia elevação de perfil por perfis inferiores.

### ⚠️ O que está ausente/ambíguo
- **CSRF** não está normatizado em /docs/business-rules. Há testes esperando 403 sem token, mas não existe regra formal.
- **Comportamento de UI em 403/404** não está explicitado (redireciono vs erro inline). Isso afeta os testes de URL manipulation.

### 🔴 Riscos Identificados
- **Segurança (multi-tenant):** Endpoint `GET /empresas/:id` sem validação de tenant permite leitura cross-tenant.
- **Rate limiting:** Limites atuais não condizem com RN-SEC-001.7 (risco de brute force).
- **CSRF:** Gap de regra/documentação gera inconsistência entre testes e expectativa de segurança.

## 4️⃣ Checklist de Riscos Críticos

- [x] RBAC documentado e aplicado? (R-USU-004)
- [x] Isolamento multi-tenant documentado? (RN-SEC-002)
- [x] Auditoria de ações sensíveis? (RN-SEC-002.5 em usuários)
- [x] Validações de input? (UUID em RN-SEC-002.2)
- [x] Proteção contra OWASP Top 10? (parcial)
- [ ] Dados sensíveis protegidos? (não reavaliado aqui)

## 5️⃣ Bloqueadores

**Nenhum bloqueador absoluto.**

*Observação:* CSRF está fora das regras vigentes; requer decisão humana se será adotado como regra formal.

## 6️⃣ Recomendações (Correções para DEV)

**Abaixo estão correções recomendadas alinhadas às regras existentes.**

1) **Multi-tenant – API empresas** (RN-SEC-002.1/002.4)  
   - Aplicar validação de tenant em `GET /empresas/:id` (service/controller) usando `requestUser`.  
   - Resultado esperado: GESTOR/colaborador não acessa empresa de outro tenant (403).

2) **Multi-tenant – UI cockpit** (RN-SEC-002.4)  
   - Em erro 403/404 ao carregar cockpit, **redirecionar** para rota segura e exibir feedback.  
   - Resultado esperado: URL manipulation não mantém tela “acessível” sem dados.

3) **Multi-tenant – UI usuários (UUID inválido)** (RN-SEC-002.2)  
   - Validar UUID no frontend antes de renderizar formulário, ou bloquear render quando API retorna 400/404/403.  
   - Resultado esperado: rota inválida não exibe formulário editável.

4) **RBAC – criação de usuário por COLABORADOR** (R-USU-004)  
   - Confirmar via API que 403 é retornado para COLABORADOR (já documentado).  
   - Se teste falha por UI/fixture, ajustar fixture/teste, não regra.

5) **Rate limiting** (RN-SEC-001.7)  
   - Alinhar limites de produção com tabela normativa (ex.: 5/15min login, 100/min geral).  
   - Garantir 429 com headers de rate limit em bursts.

6) **CSRF** (gap de regra)  
   - **Decisão necessária**: ou documentar regra de CSRF e implementar, ou ajustar testes para não exigir CSRF em JWT stateless.

## 7️⃣ Decisão e Próximos Passos

- [x] Prosseguir para: **Dev Agent Enhanced**
- [ ] Dev Agent deve implementar correções listadas acima em aderência a RN-SEC-001 e RN-SEC-002
- [ ] Decisão humana sobre CSRF: **documentar regra** ou **remover expectativa de teste**

---

**Handoff criado automaticamente pelo Business Analyst**
