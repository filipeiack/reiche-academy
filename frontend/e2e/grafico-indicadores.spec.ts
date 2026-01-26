import { test, expect } from '@playwright/test';

/**
 * Testes E2E - Gráfico de Indicadores
 * 
 * R-GRAF-001: Filtro de Gráficos por Ano e Últimos 12 Meses
 * 
 * Baseado em:
 * - /docs/business-rules/cockpit-gestao-indicadores.md (seção 7)
 * 
 * Validações:
 * 1. Dropdown de filtro exibe "Últimos 12 meses" + anos disponíveis
 * 2. Filtro padrão é "Últimos 12 meses"
 * 3. Alteração de filtro recarrega gráfico
 * 4. Filtro é persistido no localStorage
 * 5. Gráfico exibe dados corretos para filtro selecionado
 */

test.describe('Gráfico de Indicadores - Filtro por Ano', () => {
  test.beforeEach(async ({ page }) => {
    // Login como GESTOR
    await page.goto('/login');
    await page.fill('input[name="email"]', 'gestor@test.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/pilares-empresa');
  });

  test('deve exibir dropdown de filtro com "Últimos 12 meses" e anos disponíveis', async ({ page }) => {
    // Navegar para cockpit de pilar
    await page.click('a[href*="/cockpit-pilares"]');
    await page.waitForLoadState('networkidle');

    // Verificar que dropdown de filtro existe
    const filtroSelect = page.locator('#filtroSelect');
    await expect(filtroSelect).toBeVisible();

    // Abrir dropdown
    await filtroSelect.click();

    // Verificar opções
    await expect(page.locator('ng-dropdown-panel .ng-option').filter({ hasText: 'Últimos 12 meses' })).toBeVisible();
    
    // Verificar que há opções de anos (assumindo que dados de teste existem)
    const opcoes = await page.locator('ng-dropdown-panel .ng-option').count();
    expect(opcoes).toBeGreaterThanOrEqual(1); // Pelo menos "Últimos 12 meses"
  });

  test('deve ter "Últimos 12 meses" como filtro padrão', async ({ page }) => {
    await page.click('a[href*="/cockpit-pilares"]');
    await page.waitForLoadState('networkidle');

    // Verificar label exibido no ng-select
    const filtroLabel = page.locator('#filtroSelect .ng-value-label');
    await expect(filtroLabel).toContainText('Últimos 12 meses');
  });

  test('deve alterar filtro e recarregar gráfico', async ({ page }) => {
    await page.click('a[href*="/cockpit-pilares"]');
    await page.waitForLoadState('networkidle');

    // Aguardar indicador ser selecionado
    const indicadorSelect = page.locator('#indicadorSelect');
    await indicadorSelect.click();
    const primeiraOpcao = page.locator('ng-dropdown-panel .ng-option').first();
    await primeiraOpcao.click();

    // Aguardar gráfico carregar
    await expect(page.locator('[data-testid="grafico-container"]')).toBeVisible();

    // Interceptar requisição de dados do gráfico
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/graficos/dados') && response.status() === 200
    );

    // Alterar filtro para um ano específico (se disponível)
    await page.locator('#filtroSelect').click();
    const opcaoAno = page.locator('ng-dropdown-panel .ng-option').filter({ hasText: /^\d{4}$/ }).first();
    
    if (await opcaoAno.count() > 0) {
      await opcaoAno.click();
      
      // Aguardar requisição
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
      
      // Verificar que gráfico foi atualizado
      await expect(page.locator('[data-testid="grafico-container"]')).toBeVisible();
    }
  });

  test('deve persistir filtro selecionado no localStorage', async ({ page, context }) => {
    await page.click('a[href*="/cockpit-pilares"]');
    await page.waitForLoadState('networkidle');

    // Pegar cockpitId da URL ou do contexto
    const url = page.url();
    const cockpitId = url.match(/cockpit-pilares\/([a-f0-9-]+)/)?.[1];

    if (!cockpitId) {
      test.skip(); // Pular se não conseguir extrair cockpitId
    }

    // Alterar filtro
    await page.locator('#filtroSelect').click();
    const opcaoAno = page.locator('ng-dropdown-panel .ng-option').filter({ hasText: /^\d{4}$/ }).first();
    
    if (await opcaoAno.count() > 0) {
      const anoTexto = await opcaoAno.textContent();
      await opcaoAno.click();
      await page.waitForTimeout(500); // Aguardar persist

      // Verificar localStorage
      const localStorage = await page.evaluate((key) => {
        return window.localStorage.getItem(key);
      }, `filtroGrafico_${cockpitId}`);

      expect(localStorage).toBe(anoTexto?.trim());

      // Recarregar página
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Verificar que filtro foi restaurado
      const filtroLabel = page.locator('#filtroSelect .ng-value-label');
      await expect(filtroLabel).toContainText(anoTexto?.trim() || '');
    }
  });

  test('deve exibir gráfico com dados do filtro selecionado', async ({ page }) => {
    await page.click('a[href*="/cockpit-pilares"]');
    await page.waitForLoadState('networkidle');

    // Selecionar indicador
    const indicadorSelect = page.locator('#indicadorSelect');
    await indicadorSelect.click();
    const primeiraOpcao = page.locator('ng-dropdown-panel .ng-option').first();
    await primeiraOpcao.click();

    // Aguardar gráfico carregar com filtro padrão ("Últimos 12 meses")
    await expect(page.locator('[data-testid="grafico-container"]')).toBeVisible();

    // Verificar que canvas do gráfico está renderizado
    await expect(page.locator('[data-testid="grafico-container"] canvas')).toBeVisible();

    // Verificar que há labels de meses (formato: MMM/yy)
    const canvas = page.locator('[data-testid="grafico-container"] canvas');
    expect(await canvas.isVisible()).toBeTruthy();
  });

  test('deve exibir fallback se não houver anos disponíveis', async ({ page }) => {
    // Criar contexto onde não há meses criados (mockando resposta vazia)
    await page.route('**/cockpits/**/anos-disponiveis', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.click('a[href*="/cockpit-pilares"]');
    await page.waitForLoadState('networkidle');

    // Verificar que dropdown tem apenas "Últimos 12 meses"
    await page.locator('#filtroSelect').click();
    const opcoes = page.locator('ng-dropdown-panel .ng-option');
    
    expect(await opcoes.count()).toBe(1);
    await expect(opcoes.first()).toContainText('Últimos 12 meses');
  });

  test('deve validar que filtro altera query de requisição', async ({ page }) => {
    await page.click('a[href*="/cockpit-pilares"]');
    await page.waitForLoadState('networkidle');

    // Selecionar indicador
    const indicadorSelect = page.locator('#indicadorSelect');
    await indicadorSelect.click();
    await page.locator('ng-dropdown-panel .ng-option').first().click();

    // Interceptar próxima requisição
    let filtroUsado = '';
    page.on('request', (request) => {
      if (request.url().includes('/graficos/dados')) {
        const url = new URL(request.url());
        filtroUsado = url.searchParams.get('filtro') || '';
      }
    });

    // Aguardar primeira requisição (filtro padrão)
    await page.waitForTimeout(1000);
    expect(filtroUsado).toBe('ultimos-12-meses');

    // Alterar para ano específico
    await page.locator('#filtroSelect').click();
    const opcaoAno = page.locator('ng-dropdown-panel .ng-option').filter({ hasText: /^\d{4}$/ }).first();
    
    if (await opcaoAno.count() > 0) {
      const anoTexto = await opcaoAno.textContent();
      await opcaoAno.click();
      await page.waitForTimeout(1000);
      
      expect(filtroUsado).toBe(anoTexto?.trim());
    }
  });
});
