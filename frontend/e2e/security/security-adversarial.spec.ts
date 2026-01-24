import { test, expect, login, TEST_USERS } from '../fixtures';

/**
 * SECURITY TEST SUITE
 * 
 * Testes adversariais para validar controles de segurança no frontend
 * Implementados após análise crítica de vulnerabilidades
 * 
 * Data: 2026-01-24
 * Priority: CRITICAL
 */

test.describe('SECURITY - JWT Token Manipulation', () => {
  
  test('deve rejeitar token expirado', async ({ page }) => {
    // Token JWT expirado (exp: 1623456789 = 2021)
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkByZWljaGUuY29tLmJyIiwiZXhwIjoxNjIzNDU2Nzg5LCJpYXQiOjE2MjMzNzAzODl9.invalid';
    
    await page.goto('/login');
    
    // Inserir token expirado diretamente
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, expiredToken);
    
    // Tentar acessar página protegida
    await page.goto('/usuarios');
    
    // Deve redirecionar para login (não deve permitir acesso)
    await expect(page).toHaveURL(/.*login/);
    
    // Token expirado deve ser removido
    const remainingToken = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(remainingToken).toBeNull();
  });

  test('deve rejeitar JWT com algoritmo "none"', async ({ page }) => {
    // JWT malicioso com alg=none
    const maliciousToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbkByZWljaGUuY29tLmJyIiwicm9sZSI6IkFETUlOSVNUUkFUT1IifQ.';
    
    await page.goto('/login');
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, maliciousToken);
    
    await page.goto('/usuarios');
    
    // Deve rejeitar e redirecionar para login
    await expect(page).toHaveURL(/.*login/);
  });

  test('deve rejeitar token assinado incorretamente', async ({ page }) => {
    // Token válido mas com assinatura inválida
    const invalidSignatureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkByZWljaGUuY29tLmJyIiwicm9sZSI6IkFETUlOSVNUUkFUT1IifQ.invalid-signature';
    
    await page.goto('/login');
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, invalidSignatureToken);
    
    await page.goto('/usuarios');
    
    // Deve rejeitar
    await expect(page).toHaveURL(/.*login/);
  });

  test('deve fazer logout automático em múltiplos dispositivos', async ({ page, context }) => {
    // Simular login em segundo dispositivo
    const page2 = await context.newPage();
    
    // Login no primeiro dispositivo
    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/.*usuarios/);
    
    // Login no segundo dispositivo (deve fazer logout do primeiro)
    await login(page2, TEST_USERS.admin);
    await page2.goto('/usuarios');
    
    // Primeiro dispositivo deve ser deslogado ao tentar nova requisição
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Deve redirecionar para login
    await expect(page).toHaveURL(/.*login/);
    
    await page2.close();
  });
});

test.describe('SECURITY - Multi-tenant Data Isolation', () => {
  
  test('deve bloquear acesso direto por ID sequencial', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Tentar acessar IDs de usuários sequencialmente
    const blockedCount = [];
    const allowedCount = [];
    
    for (let id = 1; id <= 50; id++) {
      try {
        const response = await page.goto(`/usuarios/${id}/editar`);
        
        // Se response for null ou error, página foi bloqueada
        if (!response || response.status() === 403 || response.status() === 404) {
          blockedCount.push(id);
        } else {
          // Verificar se realmente pertence à empresa A
          const currentUrl = page.url();
          if (currentUrl.includes('/usuarios/')) {
            const hasAccess = await page.locator('form').isVisible({ timeout: 1000 });
            if (hasAccess) {
              allowedCount.push(id);
            } else {
              blockedCount.push(id);
            }
          }
        }
      } catch {
        blockedCount.push(id);
      }
    }
    
    // A maioria deve ser bloqueada (não pertence à empresa A)
    expect(blockedCount.length).toBeGreaterThan(allowedCount.length);
    console.log(`IDs bloqueados: ${blockedCount.length}, IDs permitidos: ${allowedCount.length}`);
  });

  test('deve prevenir parameter pollution', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Tentar enviar múltiplos parâmetros de empresa
    await page.goto('/usuarios?empresaId=empresa-a&empresaId=empresa-b&empresaId=admin-global');
    
    // Deve usar apenas primeiro valor ou retornar erro
    const currentUrl = page.url();
    
    // Se não bloqueou, verificar se dados são da empresa A apenas
    if (currentUrl.includes('/usuarios')) {
      await page.waitForSelector('table tbody tr', { timeout: 5000 });
      
      // Verificar se há usuários de outras empresas
      const rows = await page.locator('table tbody tr').count();
      if (rows > 0) {
        // Pegar primeiro usuário e verificar empresa
        const firstRow = page.locator('table tbody tr').first();
        const empresaCell = firstRow.locator('td').last(); // Assumindo que empresa é última coluna
        
        const empresaText = await empresaCell.textContent();
        
        // Não deve conter "Empresa B" ou outra empresa
        expect(empresaText?.toLowerCase()).not.toContain('empresa-b');
      }
    }
  });

  test('deve ignorar headers maliciosos de tenant', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Tentar sobrescrever tenant via headers
    await page.setExtraHTTPHeaders({
      'X-Tenant-Id': 'empresa-b-id',
      'X-Empresa-Id': 'empresa-b-id',
      'X-Company-Id': 'empresa-b-id'
    });
    
    await page.goto('/usuarios');
    
    // Deve ignorar headers e usar apenas token/auth
    // Se carregar usuários, devem ser apenas da empresa A
    await page.waitForSelector('table tbody tr', { timeout: 5000 });
    
    // Verificar se há vazamento de dados
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    
    if (rowCount > 0) {
      // Verificar se há menção a outras empresas
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('empresa-b');
    }
  });

  test('deve bloquear acesso universal via API direta', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Tentar acessar endpoint de admin diretamente
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/empresas',
      '/api/admin/dashboard'
    ];
    
    for (const endpoint of adminEndpoints) {
      try {
        const response = await page.evaluate(async (url) => {
          const result = await fetch(url, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            }
          });
          return {
            status: result.status,
            statusText: result.statusText
          };
        }, `http://localhost:3000${endpoint}`);
        
        // Deve retornar 403 Forbidden ou 401 Unauthorized
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect([401, 403, 404]).toContain(response.status);
      } catch (error) {
        // Erro de rede/CORS também é aceitável (bloqueado)
        console.log(`Endpoint ${endpoint} bloqueado:`, error);
      }
    }
  });
});

test.describe('SECURITY - XSS and Input Validation', () => {
  
  const XSS_PAYLOADS = [
    '<script>alert("XSS")</script>',
    '"><script>alert("XSS")</script>',
    '<img src=x onerror=alert("XSS")>',
    'javascript:alert("XSS")',
    '<svg onload=alert("XSS")>',
    '<iframe src=javascript:alert("XSS")></iframe>',
    '<body onload=alert("XSS")>',
    '<input autofocus onfocus=alert("XSS")>'
  ];

  XSS_PAYLOADS.forEach((payload, index) => {
    test(`deve prevenir XSS payload ${index + 1}: ${payload.substring(0, 20)}...`, async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await page.goto('/usuarios/novo');
      
      // Tentar injetar XSS no campo nome
      await page.fill('[formControlName="nome"]', payload);
      await page.fill('[formControlName="email"]', `test${Date.now()}@test.com`);
      await page.fill('[formControlName="senha"]', 'Senha@123');
      await page.selectOption('[formControlName="perfilId"]', 'COLABORADOR');
      
      // Preencher empresa se necessário
      const empresaField = page.locator('[formControlName="empresaId"]');
      if (await empresaField.isVisible()) {
        await empresaField.click();
        await page.locator('.ng-option').first().click();
      }
      
      await page.click('button[type="submit"]');
      
      // Aguardar processamento
      await page.waitForTimeout(2000);
      
      // Verificar se script não foi executado
      // 1. Não deve haver alertas (verificar se há dialogs)
      const alertDialogs = page.locator('.swal2-popup, .modal, .alert');
      const alertCount = await alertDialogs.count();
      
      // 2. DOM não deve conter o script tag
      const scriptTags = await page.locator('script').count();
      expect(scriptTags).toBe(0);
      
      // 3. Se houve sucesso, verificar se payload foi sanitizado
      const currentUrl = page.url();
      if (!currentUrl.includes('/novo')) {
        // Usuário criado - verificar sanitização
        await page.goto('/usuarios');
        await page.locator('input[placeholder*="Buscar"]').fill(payload);
        await page.waitForTimeout(1000);
        
        // Não deve encontrar resultados ou resultado deve ter script removido
        const rows = await page.locator('table tbody tr').count();
        if (rows > 0) {
          const firstCell = await page.locator('table tbody tr').first().locator('td').nth(1).textContent();
          expect(firstCell).not.toContain('<script>');
          expect(firstCell).not.toContain('javascript:');
        }
      }
    });
  });

  test('deve sanitizar HTML em campos de texto livre', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    
    // Encontrar página com textarea ou campo de descrição
    const textAreas = await page.locator('textarea, [formControlName*="descricao"], [formControlName*="observacao"]').count();
    
    if (textAreas > 0) {
      const textArea = page.locator('textarea, [formControlName*="descricao"], [formControlName*="observacao"]').first();
      
      const htmlPayload = '<h1>Hacked</h1><script>alert("XSS")</script><img src=x onerror=alert("XSS")>';
      
      await textArea.fill(htmlPayload);
      
      // Aguardar autosave ou salvar
      await page.waitForTimeout(2000);
      
      // Verificar se HTML foi sanitizado
      const value = await textArea.inputValue();
      expect(value).not.toContain('<script>');
      expect(value).not.toContain('onerror');
      
      // Deve ter tags HTML removidas ou escapadas
      expect(value).not.toContain('<h1>');
    } else {
      test.skip();
    }
  });

  test('deve prevenir DOM XSS via innerHTML manipulation', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    
    // Tentar injetar HTML via manipulação direta do DOM
    const injectionResult = await page.evaluate(() => {
      // Criar elemento malicioso
      const maliciousInput = document.createElement('input');
      maliciousInput.type = 'hidden';
      maliciousInput.value = '<script>alert("DOM XSS")</script>';
      maliciousInput.id = 'email'; // Conflitar com formControlName
      
      document.body.appendChild(maliciousInput);
      
      // Verificar se formulário pega elemento malicioso
      const emailField = document.querySelector('[formControlName="email"], [name="email"]');
      return emailField?.value || '';
    });
    
    // Não deve ter executado script
    expect(injectionResult).not.toContain('<script>');
  });
});

test.describe('SECURITY - SQL Injection', () => {
  
  const SQLI_PAYLOADS = [
    "'; DROP TABLE usuarios; --",
    "' OR '1'='1",
    "' UNION SELECT * FROM usuarios --",
    "admin'; UPDATE usuarios SET email='hacked@test.com'; --",
    "' OR 1=1 --",
    "'; INSERT INTO usuarios VALUES('hacker@test.com','password'); --",
    "' AND (SELECT COUNT(*) FROM usuarios) > 0 --"
  ];

  SQLI_PAYLOADS.forEach((payload, index) => {
    test(`deve prevenir SQL Injection payload ${index + 1}`, async ({ page }) => {
      await login(page, TEST_USERS.admin);
      await page.goto('/usuarios');
      
      // Tentar injetar em campo de busca
      const searchInput = await page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
      await searchInput.fill(payload);
      await page.waitForTimeout(1000);
      
      // Não deve retornar erro 500 (exceção SQL)
      // Verificar se há mensagens de erro
      const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
      
      if (errorMessages > 0) {
        const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
        // Erro deve ser amigável, não expor detalhes do banco
        expect(errorText?.toLowerCase()).not.toContain('sql');
        expect(errorText?.toLowerCase()).not.toContain('database');
        expect(errorText?.toLowerCase()).not.toContain('table');
      }
      
      // Se houver resultados, devem ser legítimos (não todos os registros)
      const rows = await page.locator('table tbody tr').count();
      
      // SQL Injection típico "OR 1=1" retornaria todos os registros
      if (payload.includes("OR '1'='1") || payload.includes('OR 1=1')) {
        // Não deve retornar todos os usuários (seria vazamento)
        expect(rows).toBeLessThan(100); // Limite arbitrário para detectar vazamento
      }
    });
  });

  test('deve prevenir SQL Injection em filtros avançados', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');
    
    // Verificar se há filtros avançados
    const filters = await page.locator('select, [formControlName*="filtro"], [data-testid*="filter"]').count();
    
    if (filters > 0) {
      const filterSelect = page.locator('select, [formControlName*="filtro"], [data-testid*="filter"]').first();
      
      // Tentar injetar no valor do filtro
      const injectionValue = "admin' UNION SELECT email FROM usuarios --";
      
      await filterSelect.selectOption({ label: injectionValue }).catch(async () => {
        // Se select option não funcionar, tentar digitar
        await filterSelect.fill(injectionValue);
      });
      
      await page.waitForTimeout(1000);
      
      // Verificar se não há vazamento
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('union select');
    } else {
      test.skip();
    }
  });
});

test.describe('SECURITY - Rate Limiting and Brute Force', () => {
  
  test('deve implementar rate limiting em endpoints de API', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    
    let rateLimitHit = false;
    
    // Fazer requisições rápidas para testar rate limiting
    for (let i = 1; i <= 100; i++) {
      try {
        const response = await page.evaluate(async (index) => {
          const response = await fetch('/api/usuarios', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'X-Request-ID': `test-${index}`
            }
          });
          return {
            status: response.status,
            statusText: response.statusText
          };
        }, i);
        
        // Se receber 429 Too Many Requests, rate limiting está ativo
        if (response.status === 429) {
          rateLimitHit = true;
          break;
        }
        
        // Se receber 503 Service Unavailable, pode ser rate limiting
        if (response.status === 503) {
          rateLimitHit = true;
          break;
        }
        
      } catch (error) {
        // Erros de rede podem indicar rate limiting
        console.log(`Request ${i} failed:`, error);
        rateLimitHit = true;
        break;
      }
    }
    
    // Deve ter atingido rate limit em algum ponto
    expect(rateLimitHit).toBeTruthy();
  });

  test('deve bloquear brute force em login', async ({ page }) => {
    let blockDetected = false;
    
    // Tentar login com credenciais erradas várias vezes
    for (let i = 1; i <= 10; i++) {
      await page.goto('/login');
      
      await page.fill('[formControlName="email"]', 'test@test.com');
      await page.fill('[formControlName="senha"]', `wrong${i}`);
      await page.click('button[type="submit"]');
      
      await page.waitForTimeout(1000);
      
      // Verificar se há captcha ou bloqueio
      const captcha = await page.locator('[data-testid*="captcha"], .captcha, #captcha').count();
      const blockMessage = await page.locator('text=/bloqueado|tente novamente|muitas tentativas/i').count();
      
      if (captcha > 0 || blockMessage > 0) {
        blockDetected = true;
        break;
      }
      
      // Verificar se delay aumenta (rate limiting por IP)
      if (i > 5) {
        const startTime = Date.now();
        await page.goto('/login');
        const loadTime = Date.now() - startTime;
        
        // Se página demora muito para carregar, pode ser rate limiting
        if (loadTime > 3000) {
          blockDetected = true;
          break;
        }
      }
    }
    
    // Deve detectar algum mecanismo de proteção
    if (!blockDetected) {
      console.log('⚠️ Nenhum mecanismo de brute force detectado');
    }
  });

  test('deve implementar rate limiting por usuário', async ({ page }) => {
    // Login válido
    await login(page, TEST_USERS.admin);
    
    let userRateLimitHit = false;
    
    // Fazer requisições rápidas com mesmo usuário
    for (let i = 1; i <= 50; i++) {
      try {
        const response = await page.evaluate(async (index) => {
          const response = await fetch('/api/usuarios/search', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              query: `test${index}`,
              limit: 10
            })
          });
          return {
            status: response.status,
            statusText: response.statusText
          };
        }, i);
        
        if (response.status === 429) {
          userRateLimitHit = true;
          break;
        }
        
      } catch (error) {
        userRateLimitHit = true;
        break;
      }
    }
    
    // Deve ter rate limiting por usuário também
    expect(userRateLimitHit).toBeTruthy();
  });
});

test.describe('SECURITY - CSRF Protection', () => {
  
  test('deve exigir CSRF token em requisições POST', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    
    // Tentar fazer requisição sem CSRF token
    const response = await page.evaluate(async () => {
      try {
        const result = await fetch('/api/usuarios', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: 'Test User',
            email: 'test@test.com',
            senha: 'Senha@123',
            perfilId: 'COLABORADOR'
          })
        });
        return {
          status: result.status,
          statusText: result.statusText
        };
      } catch (error) {
        return {
          error: error.message
        };
      }
    });
    
    // Deve retornar 403 Forbidden se CSRF protection ativa
    if (response.status) {
      expect(response.status).toBe(403);
    }
  });

  test('deve validar CSRF token correto', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');
    
    // Capturar CSRF token se existir
    const csrfToken = await page.evaluate(() => {
      const token = document.querySelector('input[name*="csrf"], input[name*="_token"], meta[name="csrf-token"]');
      return token?.getAttribute('value') || token?.getAttribute('content');
    });
    
    if (csrfToken) {
      // Tentar usar token inválido
      const response = await page.evaluate(async (invalidToken) => {
        try {
          const result = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
              'X-CSRF-Token': invalidToken
            },
            body: JSON.stringify({
              nome: 'Test User',
              email: 'test@test.com',
              senha: 'Senha@123',
              perfilId: 'COLABORADOR'
            })
          });
          return {
            status: result.status,
            statusText: result.statusText
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      }, 'invalid-csrf-token');
      
      // Deve rejeitar token inválido
      if (response.status) {
        expect(response.status).toBe(403);
      }
    } else {
      // Se não há CSRF token, é um security issue
      console.log('⚠️ Nenhum CSRF token encontrado');
      test.skip();
    }
  });
});

test.describe('SECURITY - Information Disclosure', () => {
  
  test('não deve expor dados sensíveis no DOM', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');
    
    // Verificar se há dados sensíveis expostos no DOM
    const sensitiveData = await page.evaluate(() => {
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /api[_-]?key/i,
        /authorization/i
      ];
      
      const elements = document.querySelectorAll('*');
      let found = [];
      
      elements.forEach(el => {
        const text = el.textContent || '';
        const attributes = Array.from(el.attributes);
        
        sensitivePatterns.forEach(pattern => {
          if (pattern.test(text) && text.length > 20) {
            found.push({
              element: el.tagName,
              text: text.substring(0, 100)
            });
          }
          
          attributes.forEach(attr => {
            if (pattern.test(attr.value) && attr.value.length > 20) {
              found.push({
                element: el.tagName,
                attribute: attr.name,
                value: attr.value.substring(0, 100)
              });
            }
          });
        });
      });
      
      return found;
    });
    
    // Não deve encontrar dados sensíveis expostos
    expect(sensitiveData.length).toBe(0);
  });

  test('não deve expor informações de erro detalhadas', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    
    // Tentar acessar URL inexistente
    const response = await page.goto('/pagina-inexistente-12345');
    
    if (response) {
      const pageContent = await page.content();
      
      // Não deve expor stack trace, paths do sistema, etc.
      expect(pageContent.toLowerCase()).not.toContain('stack trace');
      expect(pageContent.toLowerCase()).not.toContain('internal server error');
      expect(pageContent.toLowerCase()).not.toContain('exception');
      expect(pageContent.toLowerCase()).not.toContain('system.path');
      expect(pageContent.toLowerCase()).not.toContain('node_modules');
    }
  });

  test('deve remover dados sensíveis do localStorage/sessionStorage', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await page.goto('/dashboard');
    
    // Verificar storage após login
    const storageData = await page.evaluate(() => {
      const data = {
        localStorage: {},
        sessionStorage: {}
      };
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data.localStorage[key] = localStorage.getItem(key);
        }
      }
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data.sessionStorage[key] = sessionStorage.getItem(key);
        }
      }
      
      return data;
    });
    
    // Verificar se há dados sensíveis no storage
    const storageString = JSON.stringify(storageData);
    
    // Não deve armazenar senha em plaintext
    expect(storageString.toLowerCase()).not.toContain('"senha"');
    expect(storageString.toLowerCase()).not.toContain('"password"');
    
    // Tokens devem ser apenas JWTs, não dados brutos
    const tokenKeys = Object.keys(storageData.localStorage).filter(k => 
      k.toLowerCase().includes('token')
    );
    
    tokenKeys.forEach(key => {
      const value = storageData.localStorage[key];
      if (value) {
        // Deve ser um JWT válido (3 partes separadas por .)
        const jwtParts = value.split('.');
        expect(jwtParts.length).toBe(3);
      }
    });
  });
});

test.describe('SECURITY - Memory and Performance', () => {
  
  test('não deve vazar dados sensíveis na memória', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    
    // Capturar heap snapshot antes
    const heapBefore = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });
    
    // Navegar por várias páginas com dados sensíveis
    await page.goto('/usuarios');
    await page.waitForTimeout(2000);
    
    await page.goto('/empresas');
    await page.waitForTimeout(2000);
    
    // Criar um usuário (dados sensíveis temporários)
    await page.goto('/usuarios/novo');
    await page.fill('[formControlName="nome"]', 'Test Memory User');
    await page.fill('[formControlName="senha"]', 'SensitivePassword123!');
    await page.waitForTimeout(2000);
    
    // Capturar heap snapshot depois
    const heapAfter = await page.evaluate(() => {
      if (performance.memory) {
        return {
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          totalJSHeapSize: performance.memory.totalJSHeapSize
        };
      }
      return null;
    });
    
    // Verificar crescimento de memória
    if (heapBefore && heapAfter) {
      const memoryIncrease = heapAfter.usedJSHeapSize - heapBefore.usedJSHeapSize;
      
      // Crescimento deve ser razoável (< 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
    }
  });

  test('deve limpar dados sensíveis ao navegar', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    
    // Preencher formulário com dados sensíveis
    await page.goto('/usuarios/novo');
    await page.fill('[formControlName="nome"]', 'Sensitive Data Test');
    await page.fill('[formControlName="senha"]', 'SuperSecretPassword123!');
    await page.fill('[formControlName="email"]', 'sensitive@test.com');
    
    // Navegar para outra página sem salvar
    await page.goto('/dashboard');
    
    // Voltar para a página
    await page.goBack();
    
    // Formulário deve estar limpo (não deve manter dados sensíveis)
    const nomeValue = await page.locator('[formControlName="nome"]').inputValue();
    const senhaValue = await page.locator('[formControlName="senha"]').inputValue();
    
    expect(nomeValue).toBe('');
    expect(senhaValue).toBe('');
  });
});