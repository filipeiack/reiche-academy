import {
  test,
  expect,
  login,
  navigateTo,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Wizard de Criação de Empresas
 *
 * Regras base: /docs/business-rules/empresas.md
 */

test.describe('@empresas smoke - wizard criacao', () => {
  test('exibe etapa 1 com campos obrigatórios', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/empresas/nova');

    await expect(page.locator('[data-testid="wizard-step-1"]').first()).toBeVisible();

    const nomeField = page.locator('[formControlName="nome"]').first();
    const cnpjField = page.locator('[formControlName="cnpj"]').first();

    await expect(nomeField).toBeVisible();
    await expect(cnpjField).toBeVisible();
  });

  test('aplica máscara de CNPJ durante digitação', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/empresas/nova');

    const cnpjField = page.locator('[formControlName="cnpj"]').first();
    await cnpjField.fill('11222333000144');
    await cnpjField.dispatchEvent('input');
    await page.waitForTimeout(300);

    await expect(cnpjField).toHaveValue(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/);
  });

  test('exige CNPJ para avançar etapa', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/empresas/nova');

    const nomeField = page.locator('[formControlName="nome"]').first();
    await nomeField.fill(`Empresa Smoke ${Date.now()}`);

    const submitButton = page.locator('button[type="submit"], button:has-text("Próximo")').first();

    const isDisabled = await submitButton.isDisabled().catch(() => false);
    const hasError = await page.locator('.invalid-feedback, .text-danger, [role="alert"]').first().isVisible().catch(() => false);

    expect(isDisabled || hasError).toBe(true);
  });
});
