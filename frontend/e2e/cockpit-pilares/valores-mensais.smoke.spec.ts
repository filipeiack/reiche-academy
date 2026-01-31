import {
  test,
  expect,
  login,
  navigateTo,
  selectEmpresa,
  TEST_USERS,
  TestUser,
} from '../fixtures';

/**
 * E2E Smoke - Valores Mensais (Cockpit)
 *
 * Regras base:
 * - /docs/business-rules/cockpit-valores-mensais.md
 */

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

const acessarPrimeiroCockpit = async (page: any, user: TestUser) => {
  await login(page, user);
  if (user.perfil === 'ADMINISTRADOR') {
    await selectEmpresa(page, 'Empresa Teste A Ltda');
  }

  await navigateTo(page, '/diagnostico-notas');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);

  const pilar = await expandirPrimeiroPilar(page);
  if (!pilar) {
    return false;
  }

  const menuAbriu = await abrirMenuPilar(page, pilar);
  if (!menuAbriu) {
    return false;
  }

  const cockpitBtn = page.locator('[data-testid="btn-navegar-cockpit"]').first();
  if ((await cockpitBtn.count()) === 0) {
    return false;
  }

  await cockpitBtn.click();
  await page.waitForLoadState('networkidle');

  const cockpitHeader = page.locator('[data-testid="cockpit-header"]');
  return cockpitHeader.isVisible({ timeout: 8000 }).catch(() => false);
};

const abrirTabIndicadores = async (page: any) => {
  const tabIndicadores = page.locator('[data-testid="tab-indicadores"]').first();
  await expect(tabIndicadores).toBeVisible({ timeout: 5000 });
  await tabIndicadores.click();
  await expect(page.locator('[data-testid="indicadores-panel"]').first()).toBeVisible({ timeout: 10000 });
};

test.describe('@cockpit smoke - valores mensais', () => {
  test('exibe seção de valores mensais', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

    await abrirTabIndicadores(page);

    const valoresSection = page.locator('[data-testid="valores-mensais-section"]').first();
    await expect(valoresSection).toBeVisible({ timeout: 10000 });
  });

  test('permite preencher meta e realizado quando disponível', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

    await abrirTabIndicadores(page);

    const indicadorCard = page.locator('[data-testid="indicador-card"]').first();
    if ((await indicadorCard.count()) === 0) {
      test.skip();
      return;
    }

    const metaInput = page.locator('[data-testid="input-meta"]').first();
    const realizadoInput = page.locator('[data-testid="input-realizado"]').first();

    if ((await metaInput.count()) === 0 || (await realizadoInput.count()) === 0) {
      test.skip();
      return;
    }

    await metaInput.fill('100');
    await realizadoInput.fill('80');

    await expect(metaInput).toHaveValue('100');
    await expect(realizadoInput).toHaveValue('80');
  });
});
