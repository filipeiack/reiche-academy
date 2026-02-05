 # Handoff: Security Rules Consolidation

**From:** Business Analyst  
**To:** Dev Agent Enhanced  
**Date:** 2026-02-04  
**Version:** 1.0  
**Status:** ✅ Ready for Implementation

---

## 📋 Handoff Summary

Consolidated scattered security rules from 8+ source files into 3 comprehensive security documents with standardized patterns, cross-references, and implementation requirements.

**Files Created:**
- `docs/2-business-rules/security/rbac.md` - Role-Based Access Control
- `docs/2-business-rules/security/multi-tenant.md` - Tenant Isolation  
- `docs/2-business-rules/security/session-policy.md` - Session Management
- `docs/2-business-rules/security/README.md` - Consolidation overview

---

## 🎯 Business Requirements

### 1. Eliminate Security Rule Redundancies
**Problem:** Security rules scattered across 8+ files with contradictions and duplicates.

**Solution Implemented:** Consolidated into 3 domain-specific documents with single source of truth.

**Acceptance Criteria:** [✅ COMPLETE]
- [x] All security rules extracted and categorized
- [x] Contradictions resolved (e.g., profile hierarchy)
- [x] Cross-references established between domains
- [x] Superseded source files identified

### 2. Standardize Security Implementation Patterns
**Problem:** Inconsistent validation code across services creating security gaps.

**Solution Implemented:** Documented standard patterns with code examples.

**Acceptance Criteria:** [🔄 READY FOR IMPLEMENTATION]
- [ ] Update JwtAuthGuard with multi-tenant validation
- [ ] Standardize validateTenantAccess() pattern
- [ ] Implement validateProfileElevation() consistently
- [ ] Add refresh token rotation

### 3. Establish Test Requirements
**Problem:** No systematic security test coverage requirements.

**Solution Implemented:** Mandatory unit + E2E test requirements per rule.

**Acceptance Criteria:** [🔄 READY FOR IMPLEMENTATION]
- [ ] Create security-adversarial.spec.ts with cross-tenant tests
- [ ] Add profile elevation unit tests
- [ ] Implement token rotation E2E tests
- [ ] Add rate limiting integration tests

---

## 🔧 Technical Implementation Tasks

### Priority 1: Critical Security Patterns

#### 1.1 Update JwtAuthGuard (RN-SEC-002)
**File:** `backend/src/modules/auth/guards/jwt-auth.guard.ts`
**Changes Required:**
```typescript
// Add empresaId extraction from multiple sources
private extractCompanyIdFromRequest(request): string | null {
  // params.empresaId, query.empresaId, body.empresaId
}

// Add tenant validation
if (user.perfil?.codigo !== 'ADMINISTRADOR') {
  const requestedCompanyId = this.extractCompanyIdFromRequest(request);
  if (requestedCompanyId && user.empresaId !== requestedCompanyId) {
    throw new ForbiddenException('Acesso não autorizado para esta empresa');
  }
}
```

**Tests:** Unit test for tenant validation + E2E cross-tenant attempt

#### 1.2 Standardize Profile Elevation (RN-SEC-003)
**File:** `backend/src/modules/usuarios/usuarios.service.ts`
**Current:** Already implemented but needs standardization
**Changes Required:**
- [x] ✅ validateProfileElevation() exists
- [ ] Apply pattern to ALL user management services
- [ ] Add unit tests for elevation scenarios

#### 1.3 Implement Refresh Token Rotation (RN-SEC-001)
**Files:** 
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/refresh-tokens.service.ts`

**Changes Required:**
```typescript
// One-time use validation
async rotateRefreshToken(oldToken: string) {
  // 1. Validate old token
  // 2. Deactivate old token
  // 3. Generate new token
  // 4. Return new token pair
}
```

**Tests:** Token reuse prevention + rotation success

### Priority 2: Service Pattern Updates

#### 2.1 Standardize validateTenantAccess()
**Apply to Services:**
- [ ] `empresas.service.ts`
- [ ] `pilares-empresa.service.ts`
- [ ] `cockpit-pilares.service.ts`
- [ ] `rotinas-empresa.service.ts`

**Pattern:**
```typescript
private validateTenantAccess(target: any, requestUser: RequestUser): void {
  if (requestUser.perfil.codigo === 'ADMINISTRADOR') {
    return; // Bypass for admin
  }
  if (target.empresaId !== requestUser.empresaId) {
    throw new ForbiddenException('Você não pode acessar dados de outra empresa');
  }
}
```

#### 2.2 Add Device Tracking
**File:** `backend/src/modules/auth/refresh-tokens.service.ts`
**Changes Required:**
- [ ] Add ipAddress, userAgent, dispositivo, navegador fields
- [ ] Implement device detection logic
- [ ] Update Prisma schema if needed

### Priority 3: Rate Limiting & Security Headers

#### 3.1 Implement Rate Limiting
**File:** `backend/src/modules/auth/auth.controller.ts`
**Changes Required:**
```typescript
@Throttle(5, 15) // 5 attempts per 15 minutes
@Post('login')
async login(@Body() loginDto: LoginDto) {
  // Implementation
}
```

**Limits to Apply:**
- `/auth/login`: 5/15min
- `/auth/forgot-password`: 3/1h
- `/auth/reset-password`: 3/1h

#### 3.2 Add Security Headers
**File:** `backend/src/main.ts`
**Changes Required:**
```typescript
app.use(helmet({
  contentSecurityPolicy: { /* CSP config */ },
  hsts: { maxAge: 31536000 }
}));
```

---

## 🧪 Test Implementation Requirements

### E2E Security Tests
**File:** `backend/test/security-adversarial.spec.ts`

**Required Test Cases:**
```typescript
describe('Security Adversarial Tests', () => {
  describe('Multi-Tenant Isolation (RN-SEC-002)', () => {
    it('GESTOR should not access another company data', async () => {});
    it('COLABORADOR should not edit cross-tenant users', async () => {});
    it('ADMINISTRADOR should access any company (logged)', async () => {});
  });

  describe('RBAC Enforcement (RN-SEC-003)', () => {
    it('User cannot elevate own profile', async () => {});
    it('GESTOR cannot create ADMINISTRADOR', async () => {});
    it('Profile hierarchy validation', async () => {});
  });

  describe('Session Security (RN-SEC-001)', () => {
    it('Refresh token rotation prevents reuse', async () => {});
    it('Single session invalidates previous', async () => {});
    it('Rate limiting blocks brute force', async () => {});
  });
});
```

### Unit Tests
**Coverage Requirements:**
- [x] ✅ validateProfileElevation() (exists)
- [ ] validateTenantAccess() - all services
- [ ] rotateRefreshToken() - one-time use
- [ ] extractCompanyIdFromRequest() - multiple sources
- [ ] Device tracking logic

---

## 📁 Files to Modify

### Backend Implementation Files
```
backend/src/modules/auth/
├── guards/jwt-auth.guard.ts           # Add tenant validation
├── auth.service.ts                     # Add token rotation
├── refresh-tokens.service.ts           # Add device tracking
└── auth.controller.ts                  # Add rate limiting

backend/src/modules/usuarios/
└── usuarios.service.ts                 # Standardize elevation (✅ done)

backend/src/modules/empresas/
└── empresas.service.ts                 # Add validateTenantAccess()

backend/src/modules/pilares-empresa/
└── pilares-empresa.service.ts          # Add validateTenantAccess()

backend/src/modules/cockpit-pilares/
└── cockpit-pilares.service.ts          # Add validateTenantAccess()

backend/test/
└── security-adversarial.spec.ts        # New security tests

backend/src/main.ts                     # Add security headers
```

### Database Schema (if needed)
```
prisma/schema.prisma
├── refresh_tokens table               # Add device tracking fields
└── Add indexes for tenant validation
```

---

## 🚨 Security Considerations

### Critical Implementation Notes
1. **Never skip tenant validation** - Always apply except for ADMINISTRADOR
2. **Always log cross-tenant access** - Administrator access must be auditable
3. **Never return password fields** - Use explicit `.select()` in Prisma queries
4. **Always validate UUIDs** - Prevent injection in empresaId parameters
5. **Always rotate refresh tokens** - One-time use is mandatory

### Breaking Changes
- Frontend may need updates for device tracking UI
- Existing refresh tokens invalidated on deployment
- Rate limiting may affect legitimate high-volume usage

### Rollback Plan
- Keep current guard logic as fallback
- Feature flags for token rotation
- Gradual rollout of rate limiting

---

## 📊 Success Metrics

### Security Metrics
- [ ] 0 successful cross-tenant access attempts (403s OK)
- [ ] 100% refresh token rotation compliance
- [ ] 0 privilege escalation attempts succeed
- [ ] Rate limiting blocks >95% brute force attempts

### Implementation Metrics  
- [ ] All services implement validateTenantAccess()
- [ ] 100% test coverage for security rules
- [ ] 0 performance regression in tenant validation
- [ ] Documentation updated for all changed files

---

## 🔄 Dependencies

### Prerequisites
- [ ] Database backup before schema changes
- [ ] Performance baseline for tenant queries
- [ ] Test environment with multiple tenants

### Blocked By
- None - ready for implementation

### Blocks
- QA Engineer handoff (security tests)
- Production deployment (security review)

---

## 📝 Implementation Notes

### Code Conventions
- Follow existing NestJS patterns
- Use existing ForbiddenException messages
- Maintain existing audit logging format
- Use RequestUser interface consistently

### Testing Strategy
1. Implement unit tests first
2. Add E2E security tests
3. Performance test tenant validation
4. Penetration test before production

### Documentation Updates
- Update AGENTS.md with new security patterns
- Add security section to README files
- Update API documentation with rate limits

---

## ✅ Acceptance Criteria

### Functional Requirements
- [ ] Multi-tenant isolation enforced in all services
- [ ] RBAC profile elevation prevented
- [ ] Refresh token rotation implemented
- [ ] Rate limiting configured for auth endpoints
- [ ] Security headers configured

### Non-Functional Requirements
- [ ] No performance regression (>100ms tenant validation)
- [ ] 100% test coverage for security rules
- [ ] All security tests passing
- [ ] Documentation updated

### Security Requirements
- [ ] OWASP compliance for authentication
- [ ] Zero cross-tenant data leakage
- [ ] Complete audit trail for admin actions
- [ ] Brute force protection active

---

## 🚀 Next Steps

### Immediate (This Sprint)
1. Update JwtAuthGuard with tenant validation
2. Implement refresh token rotation
3. Create security E2E tests
4. Update 2-3 key services with tenant validation

### Short Term (Next Sprint)  
1. Complete tenant validation in all services
2. Add device tracking
3. Implement rate limiting
4. Complete test coverage

### Medium Term (Following Sprint)
1. Performance optimization
2. Security monitoring setup
3. Documentation completion
4. Security review and sign-off

---

**Handoff Status:** ✅ Ready  
**Implementation Priority:** 🔴 Critical (Security)  
**Estimated Effort:** 2-3 sprints  
**Risk Level:** High (Security implementation)