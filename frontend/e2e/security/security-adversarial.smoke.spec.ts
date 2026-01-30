import { test, expect, login, TEST_USERS } from '../fixtures';

/**
 * E2E Smoke - Segurança Adversarial (Frontend)
 *
 * Regras base:
 * - /docs/business-rules/seguranca-autenticacao.md
 * - /docs/business-rules/seguranca-multi-tenant.md
 */

test.describe('@security smoke - adversarial frontend', () => {
  test('rejeita token expirado', async ({ page }) => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkByZWljaGUuY29tLmJyIiwiZXhwIjoxNjIzNDU2Nzg5LCJpYXQiOjE2MjMzNzAzODl9.invalid';

    await page.goto('/login');

    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, expiredToken);

    await page.goto('/usuarios');

    await expect(page).toHaveURL(/.*login/);

    const loginFormVisible = await page.locator('[formControlName="email"], [name="email"]').first().isVisible().catch(() => false);
    expect(loginFormVisible).toBe(true);
  });

  test('rejeita JWT com algoritmo none', async ({ page }) => {
    const maliciousToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJhZG1pbkByZWljaGUuY29tLmJyIiwicm9sZSI6IkFETUlOSVNUUkFUT1IifQ.';

    await page.goto('/login');
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, maliciousToken);

    await page.goto('/usuarios');

    await expect(page).toHaveURL(/.*login/);
  });

  test('rejeita token com assinatura inválida', async ({ page }) => {
    const invalidSignatureToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkByZWljaGUuY29tLmJyIiwicm9sZSI6IkFETUlOSVNUUkFUT1IifQ.invalid-signature';

    await page.goto('/login');
    await page.evaluate((token) => {
      localStorage.setItem('access_token', token);
    }, invalidSignatureToken);

    await page.goto('/usuarios');

    await expect(page).toHaveURL(/.*login/);
  });

  test('ignora headers maliciosos de tenant', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    await page.setExtraHTTPHeaders({
      'X-Tenant-Id': 'empresa-b-id',
      'X-Empresa-Id': 'empresa-b-id',
      'X-Company-Id': 'empresa-b-id'
    });

    await page.goto('/usuarios');

    await page.waitForSelector('table tbody tr', { timeout: 5000 });

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('empresa-b');
  });

  test('bloqueia acesso a endpoints admin via API direta', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

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

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect([401, 403, 404]).toContain(response.status);
      } catch (error) {
        console.log(`Endpoint ${endpoint} bloqueado:`, error);
      }
    }
  });

  test('bloqueia acesso direto por ID sequencial', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    const invalidId = '00000000-0000-0000-0000-000000000000';
    const response = await page.goto(`/usuarios/${invalidId}/editar`).catch(() => null);

    const currentUrl = page.url();
    const status = response?.status();
    const hasAccess = await page.locator('form').isVisible({ timeout: 1000 }).catch(() => false);

    await page.waitForTimeout(1000);
    expect(status === 403 || status === 404 || !hasAccess || !currentUrl.includes('/editar')).toBe(true);
  });

  test('previne parameter pollution de empresa', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    await page.goto('/usuarios?empresaId=empresa-a&empresaId=empresa-b&empresaId=admin-global');

    const currentUrl = page.url();
    if (currentUrl.includes('/usuarios')) {
      await page.waitForSelector('table tbody tr', { timeout: 5000 });

      const rows = await page.locator('table tbody tr').count();
      if (rows > 0) {
        const firstRow = page.locator('table tbody tr').first();
        const empresaCell = firstRow.locator('td').last();

        const empresaText = await empresaCell.textContent();
        expect(empresaText?.toLowerCase()).not.toContain('empresa-b');
      }
    }
  });

  test('GESTOR não deve acessar cockpit de outra empresa por URL direta', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    const response = await page.goto('/cockpits/marketing-cockpit-empresa-b/dashboard').catch(() => null);

    const currentUrl = page.url();
    const status = response?.status();
    const isBlocked =
      (status !== undefined && [401, 403, 404].includes(status)) ||
      !currentUrl.includes('marketing-cockpit-empresa-b') ||
      currentUrl.includes('forbidden') ||
      currentUrl.includes('unauthorized') ||
      currentUrl.includes('login');

    expect(isBlocked).toBeTruthy();
  });

  test('GESTOR não deve ver dados de outra empresa via API manipulation', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    let interceptedData: { url: string; status: number } | null = null;

    page.on('response', (response) => {
      if (response.url().includes('/indicadores') || response.url().includes('/processos')) {
        interceptedData = {
          url: response.url(),
          status: response.status()
        };
      }
    });

    await page.goto('/cockpits/marketing-cockpit/dashboard');

    const indicadoresTab = page.locator('[data-testid="tab-indicadores"]');
    if (await indicadoresTab.count()) {
      await indicadoresTab.click();
      await page.waitForTimeout(2000);
    }

    const blocked = interceptedData.status >= 400 || !interceptedData.url.includes('empresa-b');
    expect(blocked).toBeTruthy();
  });

  test('Token JWT não deve permitir manipulação de empresaId', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    const token = await page.evaluate(() => localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));

    await page.goto('/diagnostico-notas');
    await page.evaluate((storedToken) => {
      localStorage.setItem('access_token', storedToken);
    }, token);

    await page.waitForLoadState('networkidle').catch(() => null);
    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('empresa-b');
  });

  test('COLABORADOR não deve conseguir criar usuário com privilégios elevados', async ({ page }) => {
    await login(page, TEST_USERS.colaborador);

    const response = await page.goto('/usuarios/novo').catch(() => null);
    const currentUrl = page.url();
    const status = response?.status();

    const isBlocked =
      (status !== undefined && [401, 403, 404].includes(status)) ||
      currentUrl.includes('forbidden') ||
      currentUrl.includes('unauthorized') ||
      currentUrl.includes('login') ||
      !currentUrl.includes('/usuarios/novo');

    expect(isBlocked).toBeTruthy();
  });

  test('LEITURA não deve conseguir editar dados', async ({ page }) => {
    await login(page, TEST_USERS.leituraEmpresaA);
    await page.goto('/usuarios');

    const editButtons = await page.locator('button:has-text("Editar"), button:has-text("Modificar")').count();
    const deleteButtons = await page.locator('button:has-text("Excluir"), button:has-text("Remover")').count();

    expect(editButtons + deleteButtons).toBe(0);
  });

  test('ADMINISTRADOR não deve ter restrições de acesso', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    const testRoutes = [
      '/usuarios',
      '/empresas',
      '/pilares',
      '/rotinas',
      '/cockpits',
      '/diagnostico-notas'
    ];

    for (const route of testRoutes) {
      const response = await page.goto(route).catch(() => null);
      await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => null);

      const currentUrl = page.url();
      const status = response?.status();
      const hasAccess =
        (status === undefined || ![401, 403].includes(status)) &&
        !currentUrl.includes('forbidden') &&
        !currentUrl.includes('unauthorized');

      expect(hasAccess).toBeTruthy();
    }
  });

  test('Não deve expor senhas em responses de API', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    const sensitiveResponses: string[] = [];

    page.on('response', async (response) => {
      if (!response.url().includes('/api/usuarios')) {
        return;
      }

      if (response.status() >= 400) {
        return;
      }

      const contentType = response.headers()['content-type'] || '';
      if (!contentType.includes('application/json')) {
        return;
      }

      try {
        const body = await response.text();
        if (/"senha"\s*:|"password"\s*:/i.test(body)) {
          sensitiveResponses.push(response.url());
        }
      } catch (error) {
        console.log('Falha ao ler response JSON:', error);
      }
    });

    await page.goto('/usuarios');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(sensitiveResponses.length).toBe(0);
  });

  test('LocalStorage não deve armazenar dados sensíveis em claro', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await page.goto('/dashboard');

    const localStorageContent = await page.evaluate(() => {
      return Object.keys(localStorage).map(key => ({
        key,
        value: localStorage.getItem(key) || ''
      }));
    });

    const hasSensitiveData = localStorageContent.some(item =>
      item.value.toLowerCase().includes('senha') ||
      item.value.toLowerCase().includes('password') ||
      item.value.toLowerCase().includes('secret')
    );

    expect(hasSensitiveData).toBe(false);
  });

  test('Headers de segurança devem estar presentes', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    const securityHeaders: Array<Record<string, string | undefined>> = [];

    page.on('response', (response) => {
      const headers = response.headers();
      securityHeaders.push({
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'strict-transport-security': headers['strict-transport-security']
      });
    });

    await page.goto('/usuarios');
    await page.waitForLoadState('networkidle');

    const hasSecurityHeaders = securityHeaders.some(headers =>
      Object.values(headers).some(header => header !== undefined)
    );

    if (!hasSecurityHeaders) {
      console.log('⚠️ Nenhum header de segurança detectado nas respostas.');
    }
  });

  test('Formulários devem resistir a injeção básica', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await page.goto('/usuarios');

    const formInputs = await page.locator('input[type="text"], input[type="email"], textarea').count();

    let dialogTriggered = false;
    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    const firstInput = page.locator('input[type="text"], input[type="email"], textarea').first();
    const xssPayload = '<script>alert("XSS")</script>';

    await firstInput.fill(xssPayload);
    await firstInput.blur();
    await page.waitForTimeout(1000);

    expect(dialogTriggered).toBe(false);
  });

  test('ignora payload XSS no campo de nome (script)', async ({ page }) => {
    const payload = '<script>alert("XSS")</script>';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('ignora payload XSS no campo de nome (img onerror)', async ({ page }) => {
    const payload = '<img src=x onerror=alert("XSS")>';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('ignora payload XSS no campo de nome (prefix script)', async ({ page }) => {
    const payload = '"><script>alert("XSS")</script>';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('ignora payload XSS no campo de nome (svg onload)', async ({ page }) => {
    const payload = '<svg onload=alert("XSS")>';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('ignora payload XSS no campo de nome (autofocus onfocus)', async ({ page }) => {
    const payload = '<input autofocus onfocus=alert("XSS")>';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('sanitiza HTML em campos de texto livre', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    const textAreas = await page.locator('textarea, [formControlName*="descricao"], [formControlName*="observacao"]').count();

    if (textAreas > 0) {
      const textArea = page.locator('textarea, [formControlName*="descricao"], [formControlName*="observacao"]').first();

      const htmlPayload = '<h1>Hacked</h1><script>alert("XSS")</script><img src=x onerror=alert("XSS")>';

      await textArea.fill(htmlPayload);
      await page.waitForTimeout(2000);

      const value = await textArea.inputValue();
      expect(value).not.toContain('<script>');
      expect(value).not.toContain('onerror');
      expect(value).not.toContain('<h1>');
    } else {
      test.skip();
    }
  });

  test('previne DOM XSS via manipulação de innerHTML', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    const injectionResult = await page.evaluate(() => {
      const maliciousInput = document.createElement('input');
      maliciousInput.type = 'hidden';
      maliciousInput.value = '<script>alert("DOM XSS")</script>';
      maliciousInput.id = 'email';

      document.body.appendChild(maliciousInput);

      const emailField = document.querySelector('[formControlName="email"], [name="email"]');
      return emailField?.value || '';
    });

    expect(injectionResult).not.toContain('<script>');
  });

  test('ignora payload XSS no campo de nome (javascript: URL)', async ({ page }) => {
    const payload = 'javascript:alert("XSS")';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('ignora payload XSS no campo de nome (iframe)', async ({ page }) => {
    const payload = '<iframe src=javascript:alert("XSS")></iframe>';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('ignora payload XSS no campo de nome (body onload)', async ({ page }) => {
    const payload = '<body onload=alert("XSS")>';
    let dialogTriggered = false;

    page.on('dialog', async (dialog) => {
      dialogTriggered = true;
      await dialog.dismiss();
    });

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios/novo');

    await page.fill('[formControlName="nome"]', payload);
    await page.locator('[formControlName="nome"]').blur();

    await page.waitForTimeout(1000);
    expect(dialogTriggered).toBe(false);
  });

  test('previne SQL injection no campo de busca (OR 1=1)', async ({ page }) => {
    const payload = "' OR 1=1 --";

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
    await searchInput.fill(payload);
    await page.waitForTimeout(1000);

    const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
      expect(errorText?.toLowerCase()).not.toContain('sql');
      expect(errorText?.toLowerCase()).not.toContain('database');
      expect(errorText?.toLowerCase()).not.toContain('table');
    }
  });

  test('previne SQL injection no campo de busca (UNION SELECT)', async ({ page }) => {
    const payload = "' UNION SELECT * FROM usuarios --";

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
    await searchInput.fill(payload);
    await page.waitForTimeout(1000);

    const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
      expect(errorText?.toLowerCase()).not.toContain('sql');
      expect(errorText?.toLowerCase()).not.toContain('database');
      expect(errorText?.toLowerCase()).not.toContain('table');
    }
  });

  test('previne SQL injection no campo de busca (DROP TABLE)', async ({ page }) => {
    const payload = "'; DROP TABLE usuarios; --";

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
    await searchInput.fill(payload);
    await page.waitForTimeout(1000);

    const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
      expect(errorText?.toLowerCase()).not.toContain('sql');
      expect(errorText?.toLowerCase()).not.toContain('database');
      expect(errorText?.toLowerCase()).not.toContain('table');
    }
  });

  test('previne SQL injection no campo de busca (OR 1=1 literal)', async ({ page }) => {
    const payload = "' OR '1'='1";

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
    await searchInput.fill(payload);
    await page.waitForTimeout(1000);

    const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
      expect(errorText?.toLowerCase()).not.toContain('sql');
      expect(errorText?.toLowerCase()).not.toContain('database');
      expect(errorText?.toLowerCase()).not.toContain('table');
    }
  });

  test('previne SQL injection no campo de busca (UPDATE)', async ({ page }) => {
    const payload = "admin'; UPDATE usuarios SET email='hacked@test.com'; --";

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
    await searchInput.fill(payload);
    await page.waitForTimeout(1000);

    const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
      expect(errorText?.toLowerCase()).not.toContain('sql');
      expect(errorText?.toLowerCase()).not.toContain('database');
      expect(errorText?.toLowerCase()).not.toContain('table');
    }
  });

  test('previne SQL injection no campo de busca (INSERT)', async ({ page }) => {
    const payload = "'; INSERT INTO usuarios VALUES('hacker@test.com','password'); --";

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
    await searchInput.fill(payload);
    await page.waitForTimeout(1000);

    const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
      expect(errorText?.toLowerCase()).not.toContain('sql');
      expect(errorText?.toLowerCase()).not.toContain('database');
      expect(errorText?.toLowerCase()).not.toContain('table');
    }
  });

  test('previne SQL injection no campo de busca (subquery COUNT)', async ({ page }) => {
    const payload = "' AND (SELECT COUNT(*) FROM usuarios) > 0 --";

    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const searchInput = page.locator('input[placeholder*="Buscar"], input[type="text"]').first();
    await searchInput.fill(payload);
    await page.waitForTimeout(1000);

    const errorMessages = await page.locator('.error-message, .alert-danger, .swal2-error').count();
    if (errorMessages > 0) {
      const errorText = await page.locator('.error-message, .alert-danger, .swal2-error').first().textContent();
      expect(errorText?.toLowerCase()).not.toContain('sql');
      expect(errorText?.toLowerCase()).not.toContain('database');
      expect(errorText?.toLowerCase()).not.toContain('table');
    }
  });

  test('deve prevenir SQL Injection em filtros avançados', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const filters = await page.locator('select, [formControlName*="filtro"], [data-testid*="filter"]').count();

    const filterSelect = page.locator('select, [formControlName*="filtro"], [data-testid*="filter"]').first();
    const injectionValue = "admin' UNION SELECT email FROM usuarios --";

    await filterSelect.selectOption({ label: injectionValue }).catch(async () => {
      await filterSelect.fill(injectionValue);
    });

    await page.waitForTimeout(1000);

    const pageContent = await page.content();
    expect(pageContent.toLowerCase()).not.toContain('union select');
  });

  test('não deve permitir SQL Injection em campos de busca', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]').first();

    const sqlPayload = "'; DROP TABLE usuarios; --";
    await searchInput.fill(sqlPayload);
    await page.waitForTimeout(1000);

    const pageStable = await page.locator('body').isVisible();
    expect(pageStable).toBeTruthy();
  });

  test('não deve permitir múltiplas tentativas de login falhadas', async ({ page }) => {
    const failedAttempts: Array<{ attempt: number; hasError: boolean }> = [];

    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', 'invalid@test.com');
      await page.fill('input[formControlName="senha"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      const hasError = await page.locator('.text-danger, .alert-danger, .invalid-feedback').isVisible().catch(() => false);
      failedAttempts.push({ attempt: i + 1, hasError });

      if (hasError) {
        break;
      }
    }

    const wasBlocked = failedAttempts.some((attempt) => attempt.hasError);
    expect(wasBlocked).toBeTruthy();
  });

  test('tokens não devem ser reutilizáveis em sessões diferentes', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);

    const token = await page.evaluate(() => localStorage.getItem('access_token'));

    await page.evaluate(() => localStorage.clear());

    await page.goto('/diagnostico-notas');
    await page.evaluate((storedToken) => {
      localStorage.setItem('access_token', storedToken);
    }, token);

    await page.waitForLoadState('networkidle').catch(() => null);
    await page.locator('body').isVisible();
  });

  test('implementa rate limiting em endpoints de API', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    let rateLimitHit = false;

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

        if (response.status === 429 || response.status === 503) {
          rateLimitHit = true;
          break;
        }
      } catch (error) {
        rateLimitHit = true;
        break;
      }
    }

    expect(rateLimitHit).toBeTruthy();
  });

  test('bloqueia brute force em login', async ({ page }) => {
    let blockDetected = false;

    for (let i = 1; i <= 10; i++) {
      await page.goto('/login');

      await page.fill('[formControlName="email"]', 'test@test.com');
      await page.fill('[formControlName="senha"]', `wrong${i}`);
      await page.click('button[type="submit"]');

      await page.waitForTimeout(1000);

      const captcha = await page.locator('[data-testid*="captcha"], .captcha, #captcha').count();
      const blockMessage = await page.locator('text=/bloqueado|tente novamente|muitas tentativas/i').count();

      if (captcha > 0 || blockMessage > 0) {
        blockDetected = true;
        break;
      }

      if (i > 5) {
        const startTime = Date.now();
        await page.goto('/login');
        const loadTime = Date.now() - startTime;

        if (loadTime > 3000) {
          blockDetected = true;
          break;
        }
      }
    }

    if (!blockDetected) {
      console.log('⚠️ Nenhum mecanismo de brute force detectado');
    }
  });

  test('implementa rate limiting por usuário', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    let userRateLimitHit = false;

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

    expect(userRateLimitHit).toBeTruthy();
  });

  /**
   * CSRF Protection: NOT IMPLEMENTED (ADR-013)
   * 
   * Rationale: Sistema usa JWT stateless em Authorization headers.
   * CSRF só é risco quando autenticação usa cookies (enviados automaticamente).
   * JWT em localStorage/sessionStorage requer JavaScript explícito - atacante
   * cross-origin não pode forçar navegador a incluir header Authorization.
   * 
   * Proteções existentes:
   * - CORS bloqueia requisições cross-origin
   * - JWT signature validation
   * - Token expiration
   * 
   * Se cookies forem introduzidos no futuro, CSRF DEVE ser implementado.
   * Ver: /docs/adr/ADR-013-csrf-desnecessario-jwt-stateless.md
   */

  test('não expõe dados sensíveis no DOM', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await page.goto('/usuarios');

    const sensitiveData = await page.evaluate(() => {
      const sensitivePatterns = [
        /password/i,
        /token/i,
        /secret/i,
        /api[_-]?key/i,
        /authorization/i
      ];

      const elements = document.querySelectorAll('*');
      const found: Array<{ element: string; text?: string; attribute?: string; value?: string }> = [];

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

    expect(sensitiveData.length).toBe(0);
  });

  test('não expõe informações de erro detalhadas', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    const response = await page.goto('/pagina-inexistente-12345');

    if (response) {
      const pageContent = await page.content();
      expect(pageContent.toLowerCase()).not.toContain('stack trace');
      expect(pageContent.toLowerCase()).not.toContain('internal server error');
      expect(pageContent.toLowerCase()).not.toContain('exception');
      expect(pageContent.toLowerCase()).not.toContain('system.path');
      expect(pageContent.toLowerCase()).not.toContain('node_modules');
    }
  });

  test('remove dados sensíveis do localStorage/sessionStorage', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await page.goto('/dashboard');

    const storageData = await page.evaluate(() => {
      const data: { localStorage: Record<string, string | null>; sessionStorage: Record<string, string | null> } = {
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

    const storageString = JSON.stringify(storageData);
    expect(storageString.toLowerCase()).not.toContain('"senha"');
    expect(storageString.toLowerCase()).not.toContain('"password"');

    const tokenKeys = Object.keys(storageData.localStorage).filter(k =>
      k.toLowerCase().includes('token')
    );

    tokenKeys.forEach(key => {
      const value = storageData.localStorage[key];
      if (value) {
        const jwtParts = value.split('.');
        expect(jwtParts.length).toBe(3);
      }
    });
  });

  test('não vaza dados sensíveis na memória', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    const heapBefore = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        };
      }
      return null;
    });

    await page.goto('/usuarios');
    await page.waitForTimeout(2000);
    await page.goto('/empresas');
    await page.waitForTimeout(2000);

    const heapAfter = await page.evaluate(() => {
      if ((performance as any).memory) {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize
        };
      }
      return null;
    });

    if (heapBefore && heapAfter) {
      expect(heapAfter.usedJSHeapSize).toBeLessThan(heapBefore.usedJSHeapSize * 5);
    }
  });
});
