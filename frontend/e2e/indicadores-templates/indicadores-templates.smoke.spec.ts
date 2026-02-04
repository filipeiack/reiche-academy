import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Indicadores Templates (Admin)
 *
 * Regras base:
 * - /docs/business-rules/indicadores-templates-globais.md
 */

const acessarIndicadoresTemplates = async (page: any) => {
  await login(page, TEST_USERS.admin);
  await selectEmpresa(page, 'Empresa Teste A Ltda');
  await navigateTo(page, '/indicadores-templates');
  await page.waitForLoadState('networkidle');
};

const acessarFormularioNovo = async (page: any) => {
  await navigateTo(page, '/indicadores-templates/novo');
  await page.waitForLoadState('networkidle');
};

test.describe('@indicadores-templates smoke', () => {
  test('admin acessa lista e filtros', async ({ page }) => {
    await acessarIndicadoresTemplates(page);

    await expect(page.locator('#pilarFilter').first()).toBeVisible();
    await expect(page.locator('input[type="text"]').first()).toBeVisible();
  });

  test('admin acessa formulário de novo indicador template', async ({ page }) => {
    await acessarIndicadoresTemplates(page);
    await acessarFormularioNovo(page);

    await expect(page.locator('#pilarId').first()).toBeVisible();
    await expect(page.locator('#nome').first()).toBeVisible();
    await expect(page.locator('#tipoMedida').first()).toBeVisible();
    await expect(page.locator('#statusMedicao').first()).toBeVisible();
    await expect(page.locator('#melhor').first()).toBeVisible();
    await expect(page.locator('#ordem').first()).toBeVisible();

    await expect(page.locator('[data-testid="cancel-indicador-template-button"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="submit-indicador-template-button"]').first()).toBeVisible();
  });
});
