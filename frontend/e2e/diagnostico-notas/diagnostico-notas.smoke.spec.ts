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
    
    const header = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    await header.click();
    await page.waitForTimeout(500);

    const primeiraRotina = primeiroPilar.locator('[data-testid="rotina-row"]').first();
    
    const campoCriticidade = primeiraRotina.locator('[data-testid="rotina-criticidade-select"]').first();
    await campoCriticidade.click();
    await page.waitForTimeout(300);

    const options = page.locator('.ng-option');
    
    await options.first().click();

    const campoNota = primeiraRotina.locator('[data-testid="rotina-nota-input"]').first();
    await campoNota.clear();
    await campoNota.fill('8');
    await campoNota.blur();

    await page.waitForTimeout(2000);

    const lastSaveInfo = page.locator('[data-testid="last-save-info"]').first();
    await expect(lastSaveInfo).toBeVisible({ timeout: 5000 });
  });
});
