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
 * E2E Smoke - Cockpit Pilares (Indicadores + Processos)
 *
 * Regras base:
 * - /docs/business-rules/cockpit-gestao-indicadores.md
 * - /docs/business-rules/cockpit-processos-prioritarios.md
 */

type CockpitUser = typeof TEST_USERS.admin | typeof TEST_USERS.gestorEmpresaA;

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
    if(user.perfil == 'ADMINISTRADOR') {
        await selectEmpresa(page, 'Empresa Teste A Ltda');
    }
    await navigateTo(page, '/diagnostico-notas');

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const pilar = await expandirPrimeiroPilar(page);

    const menuAbriu = await abrirMenuPilar(page, pilar);

    const menu = page.locator('[data-testid="pilar-actions-toggle"]').first();
    if ((await menu.count()) === 0) {
        return false;
    }

    await menu.click();
    await page.waitForTimeout(300);

    const cockpitBtn = page.locator('[data-testid="btn-navegar-cockpit"]').first();
    if ((await cockpitBtn.count()) === 0) {
        return false;
    }

    await menu.click();
    await page.waitForLoadState('networkidle');

    await cockpitBtn.click();
    await page.waitForLoadState('networkidle');

    const criarCockpitBtn = page.locator('[data-testid="btn-criar-cockpit"]').first();
    if ((await criarCockpitBtn.count()) > 0) {
        await criarCockpitBtn.click();
        await page.waitForLoadState('networkidle');
    }

    const cockpitHeader = page.locator('[data-testid="cockpit-header"]');
    await page.waitForTimeout(300);
    const hasHeader = await cockpitHeader.isVisible({ timeout: 8000 }).catch(() => false);
  if (hasHeader) {
    return true;
  }

  return false;
};

const abrirTabIndicadores = async (page: any) => {
  const tabIndicadores = page.locator('[data-testid="tab-indicadores"]').first();
  await expect(tabIndicadores).toBeVisible({ timeout: 5000 });
  await tabIndicadores.click();
  await expect(page.locator('[data-testid="indicadores-panel"], [data-testid="indicadores-table"]').first()).toBeVisible({ timeout: 10000 });
};

const abrirTabProcessos = async (page: any) => {
  const tabProcessos = page.locator('[data-testid="tab-processos"]').first();
  await expect(tabProcessos).toBeVisible({ timeout: 5000 });
  await tabProcessos.click();
  await expect(page.locator('[data-testid="processos-table"]').first()).toBeVisible({ timeout: 10000 });
};

test.describe('@cockpit smoke - indicadores e processos', () => {
  test('GESTOR cria indicador com campos obrigatórios', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);

    await abrirTabIndicadores(page);

    const btnNovoIndicador = page.locator('[data-testid="btn-novo-indicador"]').first();
    await expect(btnNovoIndicador).toBeVisible({ timeout: 5000 });
    await btnNovoIndicador.click();

    const drawerTitle = page.locator('[data-testid="indicador-drawer-title"]').first();
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });

    const nomeIndicador = `Indicador Smoke ${Date.now()}`;
    await page.locator('[data-testid="indicador-nome-input"]').first().fill(nomeIndicador);
    await page.locator('[data-testid="indicador-tipo-select"]').first().selectOption('REAL');
    await page.locator('[data-testid="indicador-melhor-maior"]').first().click();

    const salvarButton = page.locator('[data-testid="indicador-submit"]').first();
    await salvarButton.click();
    await page.waitForLoadState('networkidle');
    const cancelarButton = page.locator('[data-testid="indicador-cancel"]').first();
    if (await cancelarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelarButton.click();
    }

    const row = page.locator('[data-testid="indicadores-table"] tbody tr').filter({ hasText: nomeIndicador }).first();
    await expect(row).toBeVisible({ timeout: 10000 });
  });

  test('GESTOR valida nome único do indicador', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);

    await abrirTabIndicadores(page);

    const nomeIndicador = `Receita Unica ${Date.now()}`;

    const btnNovoIndicador = page.locator('[data-testid="btn-novo-indicador"]').first();
    
    await btnNovoIndicador.click();

    await page.locator('[data-testid="indicador-nome-input"]').first().fill(nomeIndicador);
    await page.locator('[data-testid="indicador-tipo-select"]').first().selectOption('REAL');
    await page.locator('[data-testid="indicador-melhor-maior"]').first().click();

    await page.locator('[data-testid="indicador-submit"]').first().click();
    await page.waitForLoadState('networkidle');
    await page.locator('[data-testid="indicador-cancel"]').first().click();
    await expect(page.locator('[data-testid="indicadores-table"] tbody tr').filter({ hasText: nomeIndicador }).first())
      .toBeVisible({ timeout: 10000 });

    await btnNovoIndicador.click();
    await page.locator('[data-testid="indicador-nome-input"]').first().fill(nomeIndicador);
    await page.locator('[data-testid="indicador-tipo-select"]').first().selectOption('QUANTIDADE');
    await page.locator('[data-testid="indicador-melhor-maior"]').first().click();

    await page.waitForTimeout(300);
    await page.locator('[data-testid="indicador-submit"]').first().click();

    const errorSelector = '.swal2-toast, .toast-error, .error-message, .alert-danger, [role="alert"]';
    await expect(page.locator(errorSelector).first()).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR remove indicador (soft delete)', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);

    await abrirTabIndicadores(page);

    const nomeIndicador = `Indicador Remover ${Date.now()}`;

    const btnNovoIndicador = page.locator('[data-testid="btn-novo-indicador"]').first();
    await btnNovoIndicador.click();

    await page.locator('[data-testid="indicador-nome-input"]').first().fill(nomeIndicador);
    await page.locator('[data-testid="indicador-tipo-select"]').first().selectOption('REAL');
    await page.locator('[data-testid="indicador-melhor-maior"]').first().click();

    await page.locator('[data-testid="indicador-submit"]').first().click();
    await page.waitForLoadState('networkidle');
    const cancelarButton = page.locator('[data-testid="indicador-cancel"]').first();
    if (await cancelarButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cancelarButton.click();
    }

    const row = page.locator('[data-testid="indicadores-table"] tbody tr').filter({ hasText: nomeIndicador }).first();
    await expect(row).toBeVisible({ timeout: 10000 });

    const deleteBtn = row.locator('[data-testid="delete-indicador-button"]').first();

    await deleteBtn.click();
    const confirmButton = page.locator('button:has-text("Sim, remover"), .swal2-confirm').first();
    if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmButton.click();
    }

    await expect(row).not.toBeVisible({ timeout: 5000 });
  });

  test('GESTOR atualiza status de mapeamento', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);

    await abrirTabProcessos(page);

    const primeiraLinha = page.locator('[data-testid="processos-table"] tbody tr').first();

    const statusSelect = primeiraLinha.locator('ng-select').first();

    await statusSelect.click();
    const optionMapeado = page.locator('.ng-option').filter({ hasText: 'MAPEADO' }).first();
    if ((await optionMapeado.count()) > 0) {
      await optionMapeado.click();
    } else {
      await page.locator('.ng-option').first().click();
    }

    const feedbackSelector = '#feedbackSaveCockpit .text-success, [data-testid="feedback-save"] .text-success, .swal2-toast, .toast-success';
    await expect(page.locator(feedbackSelector).first()).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR limpa status de mapeamento (valor vazio)', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);

    await abrirTabProcessos(page);

    const primeiraLinha = page.locator('[data-testid="processos-table"] tbody tr').first();

    const statusSelect = primeiraLinha.locator('ng-select').first();

    const clearButton = statusSelect.locator('.ng-clear-wrapper, .ng-clear').first();

    await clearButton.click();
    await expect(statusSelect.locator('.ng-value')).toHaveCount(0);
  });
});
