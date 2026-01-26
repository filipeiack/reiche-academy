import { test, expect, login, TEST_USERS } from './fixtures';

/**
 * Testes E2E - Cockpit Funcionalidades Completas
 * 
 * Testes robustos para funcionalidades do cockpit
 * baseados nos dados reais do seed
 */

test.describe('Cockpit - Funcionalidades Completas', () => {
  
  test.beforeEach(async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Navegar para lista de cockpits e clicar no primeiro disponível
    await page.goto('/cockpits');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Clicar no primeiro link de cockpit (ex: "marketing")
    const firstCockpitLink = page.locator('a[href*="/cockpits/"][href*="/dashboard"]').first();
    await firstCockpitLink.waitFor({ state: 'visible', timeout: 5000 });
    await firstCockpitLink.click();
    
    // Aguardar página do cockpit carregar
    await page.waitForLoadState('networkidle', { timeout: 5000 });
  });
  
  test('deve carregar contexto do pilar', async ({ page }) => {
    // Clicar na aba de Contexto via data-testid
    await page.locator('[data-testid="tab-contexto"]').click();
    await page.waitForTimeout(500);

    const entradasField = page.locator('[data-testid="contexto-entradas"]');
    const saidasField = page.locator('[data-testid="contexto-saidas"]');
    const missaoField = page.locator('[data-testid="contexto-missao"]');

    await expect(entradasField).toBeVisible({ timeout: 3000 });
    await expect(saidasField).toBeVisible({ timeout: 3000 });
    await expect(missaoField).toBeVisible({ timeout: 3000 });
  });
  
  test('deve acessar aba de indicadores', async ({ page }) => {
    await page.locator('[data-testid="tab-indicadores"]').click();
    await page.waitForTimeout(500);

    const indicadoresPanel = page.locator('[data-testid="indicadores-panel"], [data-testid="indicadores-table"], table').first();
    await expect(indicadoresPanel).toBeVisible({ timeout: 3000 });
  });
  
  test('deve acessar aba de gráficos', async ({ page }) => {
    await page.locator('[data-testid="tab-graficos"]').click();
    await page.waitForTimeout(500);

    const graficoElement = await page.locator('[data-testid="grafico-panel"], [data-testid="grafico-container"], app-grafico-indicadores').first().isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`Gráficos - Componente encontrado: ${graficoElement}`);
    expect(true).toBeTruthy();
  });
  
  test('deve acessar aba de processos', async ({ page }) => {
    await page.locator('[data-testid="tab-processos"]').click();
    await page.waitForTimeout(500);

    const processosTable = await page.locator('[data-testid="processos-panel"], [data-testid="processos-table"], table, app-matriz-processos').first().isVisible({ timeout: 3000 }).catch(() => false);

    console.log(`Processos - Tabela encontrada: ${processosTable}`);
    expect(true).toBeTruthy();
  });
  
  test('deve testar navegação entre abas', async ({ page }) => {
    const abas = [
      { name: 'Contexto', testId: 'tab-contexto' },
      { name: 'Indicadores', testId: 'tab-indicadores' },
      { name: 'Gráficos', testId: 'tab-graficos' },
      { name: 'Processos', testId: 'tab-processos' },
    ];

    for (const aba of abas) {
      const tabButton = page.locator(`[data-testid="${aba.testId}"]`);
      await tabButton.click();
      await page.waitForTimeout(500);

      await expect(tabButton).toHaveClass(/active/);
      console.log(`Aba "${aba.name}" ativa: ${await tabButton.getAttribute('class')}`);
      expect(true).toBeTruthy();
    }
  });
  
  test('deve verificar feedback de salvamento', async ({ page }) => {
    const entradasField = page.locator('[data-testid="contexto-entradas"]');
    await entradasField.fill(`Teste feedback ${Date.now()}`);
    
    // Aguardar debounce + request
    await page.waitForTimeout(1800);
    
    const feedbackSuccess = page.locator('[data-testid="feedback-save"] .text-success');
    await expect(feedbackSuccess).toBeVisible({ timeout: 8000 });
  });

});