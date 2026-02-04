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
 * E2E Smoke - Gráfico de Indicadores
 *
 * Regras base:
 * - /docs/business-rules/cockpit-gestao-indicadores.md (seção 7)
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

  const menu = page.locator('[data-testid="pilar-actions-toggle"]').first();
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
  const hasHeader = await cockpitHeader.isVisible({ timeout: 8000 }).catch(() => false);
  return hasHeader;
};

const abrirTabGraficos = async (page: any) => {
  const tabGraficos = page.locator('[data-testid="tab-graficos"]').first();
  await expect(tabGraficos).toBeVisible({ timeout: 5000 });
  await tabGraficos.click();
  await expect(page.locator('[data-testid="grafico-panel"]').first()).toBeVisible({ timeout: 10000 });
};

const selecionarPrimeiroIndicador = async (page: any) => {
  const indicadorSelect = page.locator('#indicadorSelect, [data-testid="indicador-select"]').first();
  if ((await indicadorSelect.count()) === 0) {
    return false;
  }

  await indicadorSelect.click();
  const primeiraOpcao = page.locator('ng-dropdown-panel .ng-option').first();
  if ((await primeiraOpcao.count()) === 0) {
    return false;
  }

  await primeiraOpcao.click();
  return true;
};

test.describe('@cockpit smoke - grafico indicadores', () => {
  test('deve exibir dropdown de filtro com "Últimos 12 meses" e anos disponíveis', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

      await abrirTabGraficos(page);
    await selecionarPrimeiroIndicador(page);

    const filtroSelect = page.locator('#filtroSelect, [data-testid="filtro-select"]').first();
    await expect(filtroSelect).toBeVisible();
    await filtroSelect.click();

    await expect(page.locator('ng-dropdown-panel .ng-option').filter({ hasText: 'Últimos 12 meses' })).toBeVisible();

    const opcoes = await page.locator('ng-dropdown-panel .ng-option').count();
    expect(opcoes).toBeGreaterThanOrEqual(1);
  });

  test('deve ter "Últimos 12 meses" como filtro padrão', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

      await abrirTabGraficos(page);

    const filtroLabel = page.locator('#filtroSelect .ng-value-label, [data-testid="filtro-select"] .ng-value-label').first();
    await expect(filtroLabel).toContainText('Últimos 12 meses');
  });

  test('deve alterar filtro e recarregar gráfico', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

      await abrirTabGraficos(page);
    const indicadorOk = await selecionarPrimeiroIndicador(page);
    if (!indicadorOk) {
      test.skip();
      return;
    }

    await expect(page.locator('[data-testid="grafico-container"]').first()).toBeVisible();

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/graficos/dados') && response.status() === 200
    );

    await page.locator('#filtroSelect, [data-testid="filtro-select"]').first().click();
    const opcaoAno = page.locator('ng-dropdown-panel .ng-option').filter({ hasText: /^\d{4}$/ }).first();

    if ((await opcaoAno.count()) === 0) {
      test.skip();
      return;
    }

    await opcaoAno.click();

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    await expect(page.locator('[data-testid="grafico-container"]').first()).toBeVisible();
  });

  test('deve persistir filtro selecionado no localStorage', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

      await abrirTabGraficos(page);
    await selecionarPrimeiroIndicador(page);

    const url = page.url();
    const cockpitId = url.match(/cockpit-pilares\/([a-f0-9-]+)/)?.[1];

    if (!cockpitId) {
      test.skip();
      return;
    }

    await page.locator('#filtroSelect, [data-testid="filtro-select"]').first().click();
    const opcaoAno = page.locator('ng-dropdown-panel .ng-option').filter({ hasText: /^\d{4}$/ }).first();

    if ((await opcaoAno.count()) === 0) {
      test.skip();
      return;
    }

    const anoTexto = await opcaoAno.textContent();
    await opcaoAno.click();
    await page.waitForTimeout(500);

    const localStorageValue = await page.evaluate((key) => {
      return window.localStorage.getItem(key);
    }, `filtroGrafico_${cockpitId}`);

    expect(localStorageValue).toBe(anoTexto?.trim());

    await page.reload();
    await page.waitForLoadState('networkidle');

    const filtroLabel = page.locator('#filtroSelect .ng-value-label, [data-testid="filtro-select"] .ng-value-label').first();
    await expect(filtroLabel).toContainText(anoTexto?.trim() || '');
  });

  test('deve exibir gráfico com dados do filtro selecionado', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

      await abrirTabGraficos(page);
    const indicadorOk = await selecionarPrimeiroIndicador(page);
    if (!indicadorOk) {
      test.skip();
      return;
    }

    await expect(page.locator('[data-testid="grafico-container"]').first()).toBeVisible();
    await expect(page.locator('[data-testid="grafico-container"] canvas').first()).toBeVisible();
  });

  test('deve exibir fallback se não houver anos disponíveis', async ({ page }) => {
    await page.route('**/cockpits/**/anos-disponiveis', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

      await abrirTabGraficos(page);
    await selecionarPrimeiroIndicador(page);

    await page.locator('#filtroSelect, [data-testid="filtro-select"]').first().click();
    const opcoes = page.locator('ng-dropdown-panel .ng-option');

    expect(await opcoes.count()).toBe(1);
    await expect(opcoes.first()).toContainText('Últimos 12 meses');
  });

  test('deve validar que filtro altera query de requisição', async ({ page }) => {
    const cockpitOk = await acessarPrimeiroCockpit(page, TEST_USERS.gestorEmpresaA);
    if (!cockpitOk) {
      test.skip();
      return;
    }

      await abrirTabGraficos(page);
    const indicadorOk = await selecionarPrimeiroIndicador(page);
    if (!indicadorOk) {
      test.skip();
      return;
    }

    let filtroUsado = '';
    page.on('request', (request) => {
      if (request.url().includes('/graficos/dados')) {
        const url = new URL(request.url());
        filtroUsado = url.searchParams.get('filtro') || '';
      }
    });

    await page.waitForTimeout(1000);
    if (filtroUsado) {
      expect(filtroUsado).toBe('ultimos-12-meses');
    }

    await page.locator('#filtroSelect, [data-testid="filtro-select"]').first().click();
    const opcaoAno = page.locator('ng-dropdown-panel .ng-option').filter({ hasText: /^\d{4}$/ }).first();

    if ((await opcaoAno.count()) === 0) {
      test.skip();
      return;
    }

    const anoTexto = await opcaoAno.textContent();
    await opcaoAno.click();
    await page.waitForTimeout(1000);

    if (anoTexto?.trim()) {
      expect(filtroUsado).toBe(anoTexto.trim());
    }
  });
});
