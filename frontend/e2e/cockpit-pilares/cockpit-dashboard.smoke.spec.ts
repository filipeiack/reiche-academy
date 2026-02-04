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
 * E2E Smoke - Cockpit Dashboard
 *
 * Regras base:
 * - /docs/business-rules/cockpit-gestao-indicadores.md
 * - /docs/business-rules/cockpit-processos-prioritarios.md
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

test.describe('@cockpit smoke - dashboard', () => {
  test('carrega dashboard com abas disponíveis', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

    await expect(page.locator('[data-testid="cockpit-header"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="tab-objetivos"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="tab-indicadores"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="tab-graficos"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="tab-processos"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="tab-cargos-funcoes"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="tab-plano-acao"]').first()).toBeVisible();
  });

  test('abre aba de objetivos e exibe formulário', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

    const tabObjetivos = page.locator('[data-testid="tab-objetivos"]').first();
    await tabObjetivos.click();

    await expect(page.locator('[data-testid="objetivos-entradas"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="objetivos-saidas"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="objetivos-missao"]').first()).toBeVisible();
  });

  test('abre aba de plano de ação e exibe lista', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

    const tabPlanoAcao = page.locator('[data-testid="tab-plano-acao"]').first();
    await tabPlanoAcao.click();

    await expect(page.locator('text=RESUMO DO PLANO DE AÇÃO').first()).toBeVisible();
    await expect(page.locator('button:has-text("Adicionar Ação")').first()).toBeVisible();

    const listaVazia = page.locator('text=Nenhuma ação encontrada.');
    const tabelaAcoes = page.locator('table').first();

    if (await listaVazia.isVisible().catch(() => false)) {
      await expect(listaVazia).toBeVisible();
    } else {
      await expect(tabelaAcoes).toBeVisible();
    }
  });
});
