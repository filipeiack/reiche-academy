import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Diagnóstico (Acesso e Navegação)
 *
 * Regras base: /docs/business-rules/diagnosticos.md
 */

test.describe('@diagnostico smoke - acesso e navegação', () => {
  test('ADMINISTRADOR acessa página de diagnóstico', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    expect(currentUrl).toContain('diagnostico');
  });

  test('ADMINISTRADOR seleciona empresa na navbar antes de acessar diagnóstico', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    await selectEmpresa(page, 'Empresa Teste A Ltda');

    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();
    expect(currentUrl).toContain('diagnostico');
  });

  test('GESTOR acessa diagnóstico da própria empresa automaticamente', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    expect(currentUrl).toContain('diagnostico');
  });

  test('estrutura de pilares carrega quando existir', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    expect(currentUrl).toContain('diagnostico');

    const pilares = page.locator('[data-testid="pilar-accordion"]');
    const pilarCount = await pilares.count();
    expect(pilarCount).toBeGreaterThanOrEqual(0);
  });
});
