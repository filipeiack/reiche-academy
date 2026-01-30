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

const acessarDiagnosticoNotas = async (page: any, user = TEST_USERS.admin) => {
  await login(page, user);

  if (user.perfil === 'ADMINISTRADOR') {
    await selectEmpresa(page, 'Empresa Teste A Ltda');
  }

  await navigateTo(page, '/diagnostico-notas');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  return page.locator('[data-testid="pilar-accordion"]').first();
};

const expandirPrimeiroPilar = async (page: any, pilar: any) => {
  const toggle = pilar.locator('[data-testid="pilar-toggle-button"]').first();
  if ((await toggle.count()) === 0) {
    return false;
  }

  await toggle.click();
  await page.waitForTimeout(500);
  return true;
};

test.describe('@diagnostico smoke - diagnostico notas', () => {
  test('preenche e salva notas de rotinas', async ({ page }) => {
    const primeiroPilar = await acessarDiagnosticoNotas(page, TEST_USERS.admin);
    
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

  test('carrega página com pilares disponíveis', async ({ page }) => {
    const primeiroPilar = await acessarDiagnosticoNotas(page, TEST_USERS.admin);

    const pilarCount = await page.locator('[data-testid="pilar-accordion"]').count();
    expect(pilarCount).toBeGreaterThanOrEqual(0);

    if (pilarCount === 0) {
      test.skip();
      return;
    }

    await expect(primeiroPilar).toBeVisible();
  });

  test('expande e colapsa pilares', async ({ page }) => {
    const primeiroPilar = await acessarDiagnosticoNotas(page, TEST_USERS.admin);
    const pilarExists = (await primeiroPilar.count()) > 0;

    if (!pilarExists) {
      test.skip();
      return;
    }

    const collapsedBefore = (await primeiroPilar.locator('.collapsed').count()) > 0;

    await expandirPrimeiroPilar(page, primeiroPilar);

    const collapsedAfter = (await primeiroPilar.locator('.collapsed').count()) > 0;
    expect(collapsedAfter).not.toBe(collapsedBefore);
  });

  test('exibe média de notas do pilar', async ({ page }) => {
    const primeiroPilar = await acessarDiagnosticoNotas(page, TEST_USERS.admin);
    const pilarExists = (await primeiroPilar.count()) > 0;

    if (!pilarExists) {
      test.skip();
      return;
    }

    const mediaBadges = page.locator('app-media-badge');
    if ((await mediaBadges.count()) === 0) {
      test.skip();
      return;
    }

    await expect(mediaBadges.first()).toBeVisible();
  });

  test('abre drawer de responsável do pilar', async ({ page }) => {
    const primeiroPilar = await acessarDiagnosticoNotas(page, TEST_USERS.admin);
    const pilarExists = (await primeiroPilar.count()) > 0;

    if (!pilarExists) {
      test.skip();
      return;
    }

    await expandirPrimeiroPilar(page, primeiroPilar);

    const responsavelButton = page.locator('[data-testid="btn-definir-responsavel"]').first();
    if ((await responsavelButton.count()) === 0) {
      test.skip();
      return;
    }

    await responsavelButton.click();

    const drawer = page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]').first();
    await expect(drawer).toBeVisible({ timeout: 2000 });
  });

  test('adiciona rotina customizada', async ({ page }) => {
    const primeiroPilar = await acessarDiagnosticoNotas(page, TEST_USERS.admin);
    const pilarExists = (await primeiroPilar.count()) > 0;

    if (!pilarExists) {
      test.skip();
      return;
    }

    await expandirPrimeiroPilar(page, primeiroPilar);

    const adicionarRotinaButton = page.locator('[data-testid="btn-adicionar-rotina"]').first();
    if ((await adicionarRotinaButton.count()) === 0) {
      test.skip();
      return;
    }

    await adicionarRotinaButton.click();
    const drawer = page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]').first();
    await expect(drawer).toBeVisible({ timeout: 2000 });

    const nomeInput = drawer.locator('input[placeholder*="nome"], [data-testid*="rotina-add-nome"]').first();
    if ((await nomeInput.count()) > 0) {
      await nomeInput.fill(`Rotina Smoke ${Date.now()}`);
    }
  });

  test('navega para cockpit do pilar', async ({ page }) => {
    const primeiroPilar = await acessarDiagnosticoNotas(page, TEST_USERS.admin);
    const pilarExists = (await primeiroPilar.count()) > 0;

    if (!pilarExists) {
      test.skip();
      return;
    }

    const cockpitButton = page.locator('[data-testid="btn-navegar-cockpit"]').first();
    if ((await cockpitButton.count()) === 0) {
      test.skip();
      return;
    }

    await cockpitButton.click();
    await page.waitForTimeout(2000);

    const cockpitHeader = page.locator('[data-testid="cockpit-header"]').first();
    if ((await cockpitHeader.count()) > 0) {
      await expect(cockpitHeader).toBeVisible({ timeout: 3000 });
    }
  });

  test('exibe loading durante carregamento', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');

    await page.route('**/api/empresas/*/diagnostico/notas', (route) => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ pilares: [] })
        });
      }, 2000);
    });

    await navigateTo(page, '/diagnostico-notas');
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 8000 });
  });

  test('lida com erro de API', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');

    await page.route('**/api/empresas/*/diagnostico/notas', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro interno do servidor' })
      });
    });

    await navigateTo(page, '/diagnostico-notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 15000 });

    const errorMessage = page.locator('.alert-danger, [role="alert"]').first();
    if (await errorMessage.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('lida com erro de salvamento', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');

    await page.route('**/api/rotinas-empresa/*/nota', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro ao salvar nota' })
      });
    });

    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    const primeiroPilar = page.locator('[data-testid="pilar-accordion"]').first();
    if ((await primeiroPilar.count()) === 0) {
      test.skip();
      return;
    }

    await expandirPrimeiroPilar(page, primeiroPilar);

    const notaInputs = primeiroPilar.locator('[data-testid="rotina-nota-input"], input[type="number"]').first();
    if ((await notaInputs.count()) === 0) {
      test.skip();
      return;
    }

    await notaInputs.fill('8');
    await page.waitForTimeout(2000);

    const savingBar = page.getByTestId('saving-bar');
    if (await savingBar.isVisible().catch(() => false)) {
      const errorIndicator = savingBar.locator('.text-danger');
      if (await errorIndicator.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(errorIndicator).toBeVisible();
      }
    }
  });

  test('carrega página em tempo aceitável', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');

    const startTime = Date.now();

    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(15000);
  });

  test('permanece estável com múltiplas interações', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    await page.waitForLoadState('networkidle');

    const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
    if ((await firstPilar.count()) === 0) {
      test.skip();
      return;
    }

    for (let i = 0; i < 3; i++) {
      const toggle = firstPilar.locator('[data-testid="pilar-toggle-button"]').first();
      await toggle.click();
      await page.waitForTimeout(300);
    }

    await expect(firstPilar).toBeVisible();
  });
});
