import { test, expect, login, TEST_USERS } from '../fixtures';

/**
 * E2E Smoke - Auth (Login)
 *
 * Regras base:
 * - /docs/business-rules/seguranca-autenticacao.md
 * - /docs/business-rules/auth.md
 */

test.describe('@auth smoke - login', () => {
  test('login administrativo via UI', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    const token = await page.evaluate(() => localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
    expect(token).toBeTruthy();

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('login');
  });

  test('login via API retorna tokens válidos', async ({ request }) => {
    const response = await request.post('/api/auth/login', {
      data: {
        email: TEST_USERS.admin.email,
        senha: TEST_USERS.admin.senha,
      },
    });

    expect([200, 201]).toContain(response.status());

    const data = await response.json();
    expect(data.accessToken).toBeTruthy();
    expect(data.refreshToken).toBeTruthy();
    expect(data.usuario?.email).toBe(TEST_USERS.admin.email);
  });

  test('formulário de login renderiza campos obrigatórios', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('[formControlName="email"], input[name="email"]');
    const passwordInput = page.locator('[formControlName="senha"], input[name="senha"], input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput.first()).toBeVisible();
    await expect(passwordInput.first()).toBeVisible();
    await expect(submitButton.first()).toBeVisible();
  });
});
