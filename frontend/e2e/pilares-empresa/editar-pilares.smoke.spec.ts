import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Pilares (Diagnóstico)
 *
 * Regras base: /docs/business-rules/pilares-empresa.md
 * UI: /docs/business-rules/diagnosticos.md (UI-DIAG-006/007)
 */

test.describe('@pilares smoke - editar pilares via drawer', () => {
  test('ADMINISTRADOR abre drawer "Editar Pilares" a partir do menu de ações', async ({ page }) => {
    await login(page, TEST_USERS.admin);

    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const menuButton = page.locator('#savingBar #dropdownMenuButton').first();
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();

    const editarPilaresBtn = page.locator('a:has-text("Editar Pilares")').first();
    await editarPilaresBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editarPilaresBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Editar Pilares")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR abre drawer "Editar Pilares" da própria empresa', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const menuButton = page.locator('#savingBar #dropdownMenuButton').first();
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();

    const editarPilaresBtn = page.locator('a:has-text("Editar Pilares")').first();
    await editarPilaresBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editarPilaresBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Editar Pilares")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('COLABORADOR não deve ver menu de ações', async ({ page }) => {
    await login(page, TEST_USERS.colaborador);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const menuButton = page.locator('#savingBar #dropdownMenuButton');
    await expect(menuButton).toHaveCount(0);
  });
});

test.describe('@pilares smoke - definir responsável via drawer', () => {
  test('ADMINISTRADOR abre drawer de responsável pelo pilar', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarCount = await firstPilarAccordion.count();

    if (pilarCount === 0) {
      test.skip();
      return;
    }

    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    await firstPilarButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstPilarButton.click();
    await page.waitForTimeout(500);

    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.waitFor({ state: 'visible', timeout: 5000 });
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const definirRespBtn = page.locator('a:has-text("Definir Responsável")').first();
    await definirRespBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Definir Responsável pelo Pilar")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR abre drawer de responsável pelo pilar da própria empresa', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarCount = await firstPilarAccordion.count();

    if (pilarCount === 0) {
      test.skip();
      return;
    }

    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    await firstPilarButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstPilarButton.click();
    await page.waitForTimeout(500);

    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.waitFor({ state: 'visible', timeout: 5000 });
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const definirRespBtn = page.locator('a:has-text("Definir Responsável")').first();
    await definirRespBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Definir Responsável pelo Pilar")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('ADMINISTRADOR vê apenas usuários da empresa selecionada no drawer', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarCount = await firstPilarAccordion.count();

    if (pilarCount === 0) {
      test.skip();
      return;
    }

    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    await firstPilarButton.click();
    await page.waitForTimeout(500);

    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);

    const definirRespBtn = page.locator('a:has-text("Definir Responsável")').first();
    await definirRespBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Definir Responsável pelo Pilar")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);

    const usuarioSelect = page.locator('.offcanvas-body ng-select');
    await usuarioSelect.waitFor({ state: 'visible', timeout: 5000 });
    await usuarioSelect.click();
    await page.waitForTimeout(800);

    const userOptions = page.locator('.ng-option');
    const optionCount = await userOptions.count();
    expect(optionCount).toBeGreaterThan(0);

    const userNames = await userOptions.allTextContents();
    const hasAdminInList = userNames.some((name) => name.toLowerCase().includes('admin@reiche'));
    expect(hasAdminInList).toBe(false);
  });
});

test.describe('@pilares smoke - adicionar pilar via drawer', () => {
  test('ADMINISTRADOR abre drawer "Adicionar Pilar" pelo menu de ações', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const menuButton = page.locator('#savingBar #dropdownMenuButton').first();
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();

    const adicionarPilarBtn = page.locator('a:has-text("Adicionar Pilar")').first();
    await adicionarPilarBtn.waitFor({ state: 'visible', timeout: 5000 });
    await adicionarPilarBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Adicionar Pilar Customizado")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR abre drawer "Adicionar Pilar" da própria empresa', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const menuButton = page.locator('#savingBar #dropdownMenuButton').first();
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();

    const adicionarPilarBtn = page.locator('a:has-text("Adicionar Pilar")').first();
    await adicionarPilarBtn.waitFor({ state: 'visible', timeout: 5000 });
    await adicionarPilarBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Adicionar Pilar Customizado")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });
});

test.describe('@pilares smoke - reordenação (visibilidade) via drawer', () => {
  test('ADMINISTRADOR vê seção de reordenar pilares no drawer de edição', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const menuButton = page.locator('#savingBar #dropdownMenuButton').first();
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();

    const editarPilaresBtn = page.locator('a:has-text("Editar Pilares")').first();
    await editarPilaresBtn.waitFor({ state: 'visible', timeout: 5000 });
    await editarPilaresBtn.click();

    const drawerTitle = page.locator('.offcanvas-title:has-text("Editar Pilares")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const reorderLabel = page.locator('label:has-text("Reordenar Pilares")');
    await expect(reorderLabel).toBeVisible({ timeout: 5000 });
  });
});
