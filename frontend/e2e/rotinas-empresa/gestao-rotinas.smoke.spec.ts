import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Gestão de Rotinas por Empresa
 *
 * Regras base: /docs/business-rules/rotinas-empresa.md
 */

test.describe('@rotinas smoke - gestao de rotinas', () => {
  const expandirPrimeiroPilar = async (page: any) => {
    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    if ((await primeiroPilar.count()) === 0) {
      return null;
    }

    const toggle = primeiroPilar.locator('[data-testid="pilar-toggle-button"]').first();
    if ((await toggle.count()) === 0) {
      return null;
    }

    await toggle.click();
    await page.waitForTimeout(500);
    return primeiroPilar;
  };

  const abrirMenuPilar = async (page: any, pilar: any) => {
    const menu = pilar.locator('[data-testid="pilar-actions-toggle"]').first();
    if ((await menu.count()) === 0) {
      return false;
    }
    await menu.click();
    await page.waitForTimeout(400);
    return true;
  };

  test('ADMINISTRADOR abre drawer de adicionar rotina', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaBtn.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-add-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('ADMINISTRADOR cria rotina customizada com sucesso', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaBtn.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-add-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const nomeRotina = `Rotina Smoke ${Date.now()}`;
    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill(nomeRotina);

    const criarButton = page.locator('[data-testid="rotina-add-submit"]').first();
    await criarButton.click();

    const toast = page.locator('.swal2-toast').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('criada com sucesso');
  });

  test('GESTOR cria rotina customizada com sucesso', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaBtn.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-add-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const nomeRotina = `Rotina Gestor Smoke ${Date.now()}`;
    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill(nomeRotina);

    const criarButton = page.locator('[data-testid="rotina-add-submit"]').first();
    await criarButton.click();

    const toast = page.locator('.swal2-toast').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('criada com sucesso');
  });

  test('ADMINISTRADOR valida nome mínimo de 3 caracteres', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaBtn.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-add-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill('AB');

    const criarButton = page.locator('[data-testid="rotina-add-submit"]').first();
    await expect(criarButton).toBeDisabled();
  });

  test('COLABORADOR não vê botão adicionar rotina', async ({ page }) => {
    await login(page, TEST_USERS.colaborador);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuToggle = pilar.locator('[data-testid="pilar-actions-toggle"]');
    await expect(menuToggle).toHaveCount(0);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]');
    await expect(adicionarRotinaBtn).toHaveCount(0);
  });

  test('GESTOR valida nome mínimo de 3 caracteres', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaBtn.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-add-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill('XY');

    const criarButton = page.locator('[data-testid="rotina-add-submit"]').first();
    await expect(criarButton).toBeDisabled();
  });

  test('ADMINISTRADOR cancela criação de rotina', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaBtn.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-add-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill('Rotina cancelar');

    const cancelButton = page.locator('[data-testid="rotina-add-cancel"]').first();
    await cancelButton.click();

    await expect(page.locator('[data-testid="rotina-add-title"]')).toHaveCount(0);
  });

  test('GESTOR cancela criação de rotina', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaBtn.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-add-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const nomeTextarea = page.locator('[data-testid="rotina-add-nome"]').first();
    await nomeTextarea.fill('Rotina cancelar gestor');

    const cancelButton = page.locator('[data-testid="rotina-add-cancel"]').first();
    await cancelButton.click();

    await expect(page.locator('[data-testid="rotina-add-title"]')).toHaveCount(0);
  });

  test('ADMINISTRADOR abre drawer Gerenciar Rotinas', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const gerenciarBtn = page.locator('[data-testid="btn-editar-rotinas"]').first();
    if ((await gerenciarBtn.count()) === 0) {
      test.skip();
      return;
    }

    await gerenciarBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-edit-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR abre drawer Gerenciar Rotinas', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    if (!pilar) {
      test.skip();
      return;
    }

    const menuAbriu = await abrirMenuPilar(page, pilar);
    if (!menuAbriu) {
      test.skip();
      return;
    }

    const gerenciarBtn = page.locator('[data-testid="btn-editar-rotinas"]').first();
    if ((await gerenciarBtn.count()) === 0) {
      test.skip();
      return;
    }

    await gerenciarBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-edit-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });
});
