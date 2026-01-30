# ADR-010: Política de Sessão Única por Usuário

## Status
✅ **Aceita**

## Contexto

Durante implementação de melhorias de segurança (Janeiro 2026), foi necessário decidir entre:
- **Opção A:** Múltiplas sessões simultâneas (usuário logado em N dispositivos)
- **Opção B:** Sessão única (usuário logado em apenas 1 dispositivo por vez)

Sistema Reiche Academy usa JWT com refresh tokens. Refresh tokens são persistidos em `refresh_tokens` table para controle e auditoria.

**Vulnerabilidade Identificada:** QA Engineer reportou CVSS 5.4 (médio) para "Exposição de Tokens JWT" devido a possibilidade de tokens roubados permanecerem ativos indefinidamente.

---

## Decisão

**Implementar Sessão Única Forçada:**
- Ao fazer login, todos refresh tokens anteriores do usuário são invalidados
- Apenas 1 refresh token ativo por `userId`
- Método: `RefreshTokensService.createRefreshToken()` executa `invalidateAllUserTokens(userId)` antes de criar novo token

```typescript
async createRefreshToken(userId: string, ...): Promise<string> {
  // Invalidate all existing tokens for this user (single session per user)
  await this.invalidateAllUserTokens(userId);
  
  const token = randomBytes(32).toString('hex');
  // ... criar novo token
}
```

---

## Consequências

### Positivas ✅

1. **Segurança Aumentada:**
   - Superfície de ataque reduzida (menos tokens ativos = menos vetores de roubo)
   - Token roubado tem vida útil limitada (máx 7 dias, mas invalidado no próximo login legítimo)
   - Previne session hijacking distribuído

2. **Simplicidade:**
   - Gestão de tokens mais simples (1 token por usuário)
   - Menos dados no banco (menos linhas em `refresh_tokens`)
   - Lógica de cleanup mais fácil

3. **Auditoria:**
   - Sempre sabemos qual o dispositivo ativo atual
   - Histórico de logins via `login_history`

4. **Compliance:**
   - Facilita auditoria de acesso (LGPD, SOC 2)
   - "Quem está logado agora?" = resposta determinística

### Negativas ❌

1. **UX Prejudicada (Principal Trade-off):**
   - Usuário não pode estar logado simultaneamente em:
     - Desktop do trabalho
     - Notebook pessoal
     - Tablet
     - Smartphone
   - Login em novo dispositivo desloga dispositivos anteriores
   - Pode causar frustração em usuários legítimos

2. **Casos de Uso Problemáticos:**
   - **Família compartilhando conta:** Último a logar desloga os outros (solução: criar usuários individuais)
   - **Apresentação em reunião:** Se logar no projetor, celular é deslogado
   - **Desenvolvimento/Teste:** Desenvolvedores testando em múltiplos browsers precisam relogar constantemente

3. **Suporte Adicional:**
   - Usuários podem não entender por que foram deslogados
   - Necessário documentar comportamento em FAQ

---

## Alternativas Consideradas

### Alt 1: Múltiplas Sessões com Limite (GitHub, Google)

**Descrição:**  
Permitir N sessões simultâneas (ex: 5), invalidar a mais antiga quando limite excedido.

**Código:**
```typescript
const activeSessions = await this.prisma.refreshToken.count({
  where: { userId, isActive: true }
});

if (activeSessions >= MAX_SESSIONS) {
  await this.invalidateOldestSession(userId);
}
```

**Vantagens:**
- ✅ UX melhor (usuário pode ter desktop + mobile)
- ✅ Padrão de mercado (Gmail, GitHub, Facebook)

**Desvantagens:**
- ❌ Mais tokens ativos = maior superfície de ataque
- ❌ Complexidade adicional (gestão de múltiplas sessões)
- ❌ UI necessária para "ver dispositivos ativos" e "logout remoto"

**Por que rejeitada:**  
- Projeto MVP (complexidade não justificada)
- Risco de segurança maior em fase inicial
- Pode ser implementado posteriormente (non-breaking change)

### Alt 2: Sessões Ilimitadas (Inseguro)

**Descrição:**  
Permitir qualquer número de sessões simultâneas.

**Vantagens:**
- ✅ UX máxima (zero restrições)

**Desvantagens:**
- ❌ Risco de segurança inaceitável
- ❌ Token roubado permanece ativo até expirar (7 dias)
- ❌ Violação de boas práticas de segurança

**Por que rejeitada:**  
Não atende requisitos mínimos de segurança.

### Alt 3: Sessão Única + "Lembrar Dispositivo"

**Descrição:**  
Sessão única, mas permitir "dispositivo confiável" com token de longa duração (30 dias).

**Vantagens:**
- ✅ UX boa para dispositivos pessoais
- ✅ Segurança razoável (apenas dispositivos explicitamente confiáveis)

**Desvantagens:**
- ❌ Complexidade alta (gestão de "dispositivos confiáveis")
- ❌ Risco se dispositivo confiável for comprometido

**Por que rejeitada:**  
Complexidade excessiva para MVP. Pode ser adicionado posteriormente.

---

## Justificativa da Decisão

**Critérios de Priorização:**
1. 🔴 **Segurança:** Alta prioridade (sistema gerencia dados confidenciais de empresas)
2. 🟡 **Simplicidade:** MVP deve ser simples e robusto
3. 🟢 **UX:** Importante, mas não crítico (usuários são empresas B2B, não B2C)

**Pontuação (1-10):**

| Critério | Sessão Única | Múltiplas Sessões | Ilimitadas |
|----------|--------------|-------------------|------------|
| Segurança | 9/10 | 7/10 | 3/10 |
| Simplicidade | 10/10 | 6/10 | 10/10 |
| UX | 5/10 | 9/10 | 10/10 |
| **Score Total** | **24/30** | **22/30** | **23/30** |

**Sessão Única vence por:**
- Melhor segurança (peso 2x)
- Máxima simplicidade
- UX aceitável para contexto B2B empresarial

---

## Plano de Migração Futura

Se decidirmos mudar para múltiplas sessões:

### Fase 1: Backend (Non-Breaking)
```typescript
// Adicionar configuração
const MAX_SESSIONS = process.env.MAX_SESSIONS || 1; // Default = 1 (atual)

if (activeSessions >= MAX_SESSIONS) {
  if (MAX_SESSIONS === 1) {
    await this.invalidateAllUserTokens(userId); // Comportamento atual
  } else {
    await this.invalidateOldestSession(userId); // Novo comportamento
  }
}
```

### Fase 2: Frontend (Novo Feature)
- Adicionar `/perfil/dispositivos` (lista sessões ativas)
- Botão "Deslogar deste dispositivo"
- Botão "Deslogar de todos os dispositivos"

### Fase 3: Configuração por Perfil
- ADMINISTRADOR: 10 sessões
- GESTOR: 5 sessões
- COLABORADOR: 3 sessões
- LEITURA: 1 sessão

**Estimativa:** 2-3 sprints de desenvolvimento

---

## Impacto em Outros Componentes

### Afetados ✅ (Implementado)
- `RefreshTokensService.createRefreshToken()` - invalida tokens antigos
- `AuthService.login()` - chama createRefreshToken
- Tabela `refresh_tokens` - armazena dispositivo e IP
- Business Rule RN-SEC-001.3 - documenta política

### Não Afetados ❌
- Access Token (JWT stateless, sem mudança)
- Frontend (transparente para cliente)
- Outros módulos (isolado em auth)

---

## Riscos Identificados

### Risco 1: Reclamações de Usuários (MÉDIO)
**Descrição:** Usuários reclamam de serem deslogados ao usar outro dispositivo.

**Mitigação:**
- Documentar comportamento em FAQ
- Mensagem clara no login: "Login realizado em novo dispositivo. Sessões anteriores foram encerradas."
- Oferecer alternativa: "Criar conta adicional" para múltiplos usuários

**Contingência:** Se reclamações > 20% dos usuários, re-avaliar para múltiplas sessões.

### Risco 2: Suporte Técnico (BAIXO)
**Descrição:** Aumento de tickets de suporte sobre "fui deslogado".

**Mitigação:**
- Artigo de conhecimento explicando
- Treinamento de equipe de suporte

---

## Métricas de Sucesso

### KPIs para Re-avaliação (após 3 meses):

1. **Reclamações de UX:** < 10% dos usuários ativos
2. **Tickets de Suporte:** < 5 tickets/mês sobre logout inesperado
3. **Incidentes de Segurança:** 0 casos de session hijacking
4. **Adoção:** > 90% dos usuários aceitam política sem problemas

**Próxima Revisão:** 2026-04-24 (3 meses após implementação)

---

## Referências

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [RFC 6749 (OAuth2): Token Management](https://datatracker.ietf.org/doc/html/rfc6749#section-6)
- QA Engineer Report: `docs/handoffs/seguranca-e2e/relatorio-analise-adversarial.md`
- Business Rule: `docs/business-rules/seguranca-autenticacao.md` (RN-SEC-001.3)

---

## Aprovações

| Papel | Nome | Data | Decisão |
|-------|------|------|---------|
| Dev Agent Enhanced | AI Assistant | 2026-01-24 | ✅ Implementado |
| QA Engineer | AI Assistant | 2026-01-24 | ✅ Testado |
| Business Analyst | AI Assistant | 2026-01-24 | ✅ Documentado |
| System Engineer | AI Assistant | 2026-01-24 | ✅ Aprovado (este ADR) |
| **Humano (final)** | **Pendente** | **-** | **⏳ Aguardando** |

---

**Autor:** System Engineer  
**Data de Criação:** 2026-01-24  
**Última Atualização:** 2026-01-24  
**Versão:** 1.0
