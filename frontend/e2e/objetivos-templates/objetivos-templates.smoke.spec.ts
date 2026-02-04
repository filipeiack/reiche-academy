import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Objetivos Templates (Admin)
 *
 * Regras base:
 * - /docs/business-rules/objetivos-templates-globais.md
 */

const acessarObjetivosTemplates = async (page: any) => {
  await login(page, TEST_USERS.admin);
  await selectEmpresa(page, 'Empresa Teste A Ltda');
  await navigateTo(page, '/objetivos-templates');
  await page.waitForLoadState('networkidle');
};

const acessarFormularioNovo = async (page: any) => {
  await navigateTo(page, '/objetivos-templates/novo');
  await page.waitForLoadState('networkidle');
};

test.describe('@objetivos-templates smoke', () => {
  test('admin acessa lista e filtros', async ({ page }) => {
    await acessarObjetivosTemplates(page);

    await expect(page.locator('#pilarFilter').first()).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('admin acessa formulário de novo objetivo template', async ({ page }) => {
    await acessarObjetivosTemplates(page);
    await acessarFormularioNovo(page);

    await expect(page.locator('#pilarId').first()).toBeVisible();
    await expect(page.locator('[formcontrolname="entradas"]').first()).toBeVisible();
    await expect(page.locator('[formcontrolname="saidas"]').first()).toBeVisible();
    await expect(page.locator('[formcontrolname="missao"]').first()).toBeVisible();

    await expect(page.locator('[data-testid="cancel-objetivo-template-button"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="submit-objetivo-template-button"]').first()).toBeVisible();
  });
});
