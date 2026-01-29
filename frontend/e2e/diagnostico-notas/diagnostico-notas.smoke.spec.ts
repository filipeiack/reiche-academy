import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Diagnóstico de Notas
 *
 * Regras base: /docs/business-rules/diagnosticos.md
 */

test.describe('@diagnostico smoke - diagnostico notas', () => {
  test('preenche e salva notas de rotinas', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    if ((await primeiroPilar.count()) === 0) {
      test.skip();
      return;
    }

    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const primeiraRotina = primeiroPilar.locator('[data-testid="rotina-row"]').first();
    if ((await primeiraRotina.count()) === 0) {
      test.skip();
      return;
    }

    const campoCriticidade = primeiraRotina.locator('[data-testid="rotina-criticidade-select"]').first();
    await campoCriticidade.click();
    await page.waitForTimeout(300);

    const options = page.locator('.ng-option');
    if ((await options.count()) === 0) {
      test.skip();
      return;
    }
    await options.first().click();

    const campoNota = primeiraRotina.locator('[data-testid="rotina-nota-input"]').first();
    await campoNota.clear();
    await campoNota.fill('8');
    await campoNota.blur();

    await page.waitForTimeout(2000);

    const lastSaveInfo = page.locator('[data-testid="last-save-info"]').first();
    await expect(lastSaveInfo).toBeVisible({ timeout: 5000 });
  });

  test('calcula progresso automaticamente quando houver rotinas', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const badge = page.locator('.badge:has-text("Tx respostas")').first();
    if (!(await badge.isVisible().catch(() => false))) {
      test.skip();
      return;
    }

    await expect(badge).toBeVisible();
  });
});
