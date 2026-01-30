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
    
    const menuAbriu = await abrirMenuPilar(page, pilar);
    
    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const gerenciarBtn = page.locator('[data-testid="btn-editar-rotinas"]').first();

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

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const gerenciarBtn = page.locator('[data-testid="btn-editar-rotinas"]').first();

    await gerenciarBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-edit-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
  });

  test('ADMINISTRADOR reordena rotinas via drag & drop', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    await abrirMenuPilar(page, pilar);

    const gerenciarBtn = page.locator('[data-testid="btn-editar-rotinas"]').first();
    await gerenciarBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-edit-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const rotinas = page.locator('.rotina-item');
    let rotinasCount = await rotinas.count();

    if (rotinasCount < 2) {
      const fecharBtn = page.locator('.offcanvas-footer button:has-text("Fechar")').first();
      await fecharBtn.click();
      await page.waitForSelector('.offcanvas.show', { state: 'hidden', timeout: 5000 }).catch(() => {});

      await abrirMenuPilar(page, pilar);
      const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
      await adicionarRotinaBtn.click();

      const addTitle = page.locator('[data-testid="rotina-add-title"]').first();
      await expect(addTitle).toBeVisible({ timeout: 5000 });

      const nomeRotina = `Rotina Drag ${Date.now()}`;
      await page.locator('[data-testid="rotina-add-nome"]').first().fill(nomeRotina);
      await page.locator('[data-testid="rotina-add-submit"]').first().click();

      const toast = page.locator('.swal2-toast').first();
      await expect(toast).toBeVisible({ timeout: 5000 });

      await abrirMenuPilar(page, pilar);
      await gerenciarBtn.click();
      await expect(drawerTitle).toBeVisible({ timeout: 5000 });

      rotinasCount = await rotinas.count();
    }

    await expect(rotinasCount).toBeGreaterThanOrEqual(2);

    const primeiraRotina = rotinas.first();
    const segundaRotina = rotinas.nth(1);
    const primeiraAntes = await primeiraRotina.locator('.rotina-nome').textContent();

    const dragHandle = primeiraRotina.locator('.drag-handle');
    const fromBox = await dragHandle.boundingBox();
    const toBox = await segundaRotina.boundingBox();
    if (fromBox && toBox) {
      const startX = fromBox.x + fromBox.width / 2;
      const startY = fromBox.y + fromBox.height / 2;
      const endX = toBox.x + toBox.width / 2;
      const endY = toBox.y + toBox.height + Math.min(toBox.height, 40);

      await page.mouse.move(startX, startY);
      await page.mouse.down();
      await page.mouse.move(endX, endY, { steps: 30 });
      await page.mouse.up();
    }

    const toast = page.locator('.swal2-toast').first();
    if (await toast.isVisible({ timeout: 8000 }).catch(() => false)) {
      await expect(toast).toContainText('Ordem atualizada com sucesso');
    }

    await page.waitForTimeout(800);
    const primeiraDepois = await rotinas.first().locator('.rotina-nome').textContent();
    expect(primeiraDepois).not.toBe(primeiraAntes);
  });

  test('ADMINISTRADOR remove rotina do pilar', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);
    await abrirMenuPilar(page, pilar);

    const gerenciarBtn = page.locator('[data-testid="btn-editar-rotinas"]').first();
    await gerenciarBtn.click();

    const drawerTitle = page.locator('[data-testid="rotina-edit-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const rotinas = page.locator('.rotina-item');
    let rotinasCount = await rotinas.count();

    if (rotinasCount === 0) {
      const fecharBtn = page.locator('.offcanvas-footer button:has-text("Fechar")').first();
      await fecharBtn.click();
      await page.waitForSelector('.offcanvas.show', { state: 'hidden', timeout: 5000 }).catch(() => {});

      await abrirMenuPilar(page, pilar);
      const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"]').first();
      await adicionarRotinaBtn.click();

      const addTitle = page.locator('[data-testid="rotina-add-title"]').first();
      await expect(addTitle).toBeVisible({ timeout: 5000 });

      const nomeRotina = `Rotina Remover ${Date.now()}`;
      await page.locator('[data-testid="rotina-add-nome"]').first().fill(nomeRotina);
      await page.locator('[data-testid="rotina-add-submit"]').first().click();

      const toast = page.locator('.swal2-toast').first();
      await expect(toast).toBeVisible({ timeout: 5000 });

      await abrirMenuPilar(page, pilar);
      await gerenciarBtn.click();
      await expect(drawerTitle).toBeVisible({ timeout: 5000 });

      rotinasCount = await rotinas.count();
    }

    await expect(rotinasCount).toBeGreaterThan(0);

    const ultimaRotina = rotinas.last();
    const nomeRotina = await ultimaRotina.locator('.rotina-nome').textContent();
    await ultimaRotina.locator('[data-testid="delete-cargo-button"]').click();

    const confirmButton = page.locator('button:has-text("Sim, remover"), .swal2-confirm').first();
    await confirmButton.click();

    const toast = page.locator('.swal2-toast').first();
    await expect(toast).toBeVisible({ timeout: 5000 });
    await expect(toast).toContainText('removida com sucesso');

    if (nomeRotina) {
      const rotinaRemovida = page.locator('.rotina-item').filter({ hasText: nomeRotina });
      await expect(rotinaRemovida).toHaveCount(0);
    }
  });
});
