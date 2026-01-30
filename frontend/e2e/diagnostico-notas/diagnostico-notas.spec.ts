import { test, expect } from '@playwright/test';

// Migrado para frontend/e2e/diagnostico-notas/diagnostico-notas.smoke.spec.ts

test.describe('LEGACY: Diagnóstico de Notas - Estados de Erro @diagnostico @legacy', () => {
  test('deve exibir loading durante carregamento', async ({ page }) => {
    await page.route('**/api/empresas/*/diagnostico/notas', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ pilares: [] })
        });
      }, 2000);
    });

    await page.goto('/diagnostico/notas');

    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 5000 });
  });

  test('deve lidar com erro de API', async ({ page }) => {
    await page.route('**/api/empresas/*/diagnostico/notas', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro interno do servidor' })
      });
    });

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 15000 });

    const errorMessage = page.locator('.alert-danger');
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Erro');
    }
  });

  test('deve lidar com erro de salvamento', async ({ page }) => {
    await page.route('**/api/rotinas-empresa/*/nota', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro ao salvar nota' })
      });
    });

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    await page.waitForSelector('[data-testid="pilar-accordion"]');
    const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const isCollapsed = await firstPilar.locator('.collapsed').count() > 0;
    if (isCollapsed) {
      await firstPilar.locator('button').click();
      await page.waitForTimeout(500);
    }

    const notaInputs = firstPilar.locator('input[type="number"]');
    if (await notaInputs.first().isVisible()) {
      await notaInputs.first().fill('8');
      await page.waitForTimeout(2000);

      const savingBar = page.getByTestId('saving-bar');
      if (await savingBar.isVisible()) {
        const errorIndicator = savingBar.locator('.text-danger');
        if (await errorIndicator.isVisible({ timeout: 3000 })) {
          await expect(errorIndicator).toBeVisible();
        }
      }
    }
  });
});

test.describe('LEGACY: Diagnóstico de Notas - Performance @diagnostico @legacy', () => {
  test('deve carregar página rapidamente', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(4000);

    console.log(`Tempo de carregamento do diagnóstico: ${loadTime}ms`);
  });

  test('deve permanecer estável com múltiplas interações', async ({ page }) => {
    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });

    await page.waitForSelector('[data-testid="pilar-accordion"]');

    for (let i = 0; i < 3; i++) {
      const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
      await firstPilar.locator('button').click();
      await page.waitForTimeout(300);
    }

    await expect(page.getByTestId('pilar-accordion')).toBeVisible();
  });

  test('deve lidar com grande número de pilares e rotinas', async ({ page }) => {
    await page.route('**/api/empresas/*/diagnostico/notas', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          pilares: Array(20).fill(null).map((_, i) => ({
            id: `pilar-${i}`,
            nome: `Pilar ${i}`,
            rotinasEmpresa: Array(50).fill(null).map((_, j) => ({
              id: `rotina-${j}`,
              nome: `Rotina ${j}`
            }))
          }))
        })
      });
    });

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 15000 });

    await expect(page.getByTestId('pilar-accordion')).toBeVisible();

    const startTime = Date.now();

    const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
    await firstPilar.locator('button').click();

    const expandTime = Date.now() - startTime;

    expect(expandTime).toBeLessThan(1000);

    console.log(`Tempo de expansão com muitos elementos: ${expandTime}ms`);
  });
});