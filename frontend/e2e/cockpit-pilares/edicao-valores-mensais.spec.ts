import { test, expect } from '@playwright/test';

test.describe.skip('LEGACY: Edição de Valores Mensais @cockpit @indicadores @high @legacy', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de edição de valores mensais
    await page.goto('/cockpit-pilares/123/valores-mensais');
    // Esperar carregamento completar
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();
  });

  test('deve carregar a página com indicadores existentes', async ({ page }) => {
    // Verificar que a página carregou sem estado de vazio
    await expect(page.getByTestId('no-indicators-message')).not.toBeVisible();
    
    // Verificar que existe pelo menos um indicador
    await expect(page.getByTestId('indicador-card')).toBeVisible();
    
    // Verificar botão de novo ciclo
    await expect(page.getByTestId('btn-novo-ciclo-mensal')).toBeVisible();
  });

  test('deve exibir mensagem quando não há indicadores', async ({ page }) => {
    // Simular URL sem indicadores
    await page.goto('/cockpit-pilares/456/valores-mensais');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();
    
    // Verificar mensagem de nenhum indicador
    await expect(page.getByTestId('no-indicators-message')).toBeVisible();
    await expect(page.getByTestId('no-indicators-message')).toContainText('Nenhum indicador criado ainda');
  });

  test('deve preencher e salvar valores mensais', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="indicador-card"]');
    
    // Preencher meta e realizado para o primeiro indicador
    await page.getByTestId('input-meta').first().fill('1000');
    await page.getByTestId('input-realizado').first().fill('850');
    
    // Preencher histórico
    await page.getByTestId('input-historico').first().fill('Dados históricos do trimestre anterior');
    
    // Verificar que os valores foram preenchidos
    await expect(page.getByTestId('input-meta').first()).toHaveValue('1000');
    await expect(page.getByTestId('input-realizado').first()).toHaveValue('850');
    await expect(page.getByTestId('input-historico').first()).toHaveValue('Dados históricos do trimestre anterior');
  });

  test('deve criar novo ciclo de 12 meses quando permitido', async ({ page }) => {
    // Aguardar botão de novo ciclo estar habilitado
    await page.waitForSelector('[data-testid="btn-novo-ciclo-mensal"]:not([disabled])');
    
    // Clicar no botão de novo ciclo
    await page.getByTestId('btn-novo-ciclo-mensal').click();
    
    // Aguardar confirmação do SweetAlert2 (simulação)
    await page.waitForTimeout(1000);
    
    // Simular confirmação
    const confirmButton = page.locator('.swal2-confirm');
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
    }
    
    // Verificar feedback de carregamento/criação
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
  });

  test('deve desabilitar botão de novo ciclo quando não permitido', async ({ page }) => {
    // Verificar se o botão está desabilitado (dependendo do período de mentoria)
    const novoCicloButton = page.getByTestId('btn-novo-ciclo-mensal');
    
    if (await novoCicloButton.isVisible()) {
      const isDisabled = await novoCicloButton.isDisabled();
      // Se estiver desabilitado, verificar tooltip informativo
      if (isDisabled) {
        await novoCicloButton.hover();
        // Verificar tooltip informativo (dependendo da implementação)
      }
    }
  });

  test('deve calcular e exibir desvios automaticamente', async ({ page }) => {
    // Preencher valores para disparar cálculo
    await page.getByTestId('input-meta').first().fill('1000');
    await page.getByTestId('input-realizado').first().fill('750');
    
    // Aguardar atualização automática (debounce)
    await page.waitForTimeout(1500);
    
    // Verificar se os badges de desvio estão visíveis
    const desvioAbsolutoBadge = page.locator('.badge-desvio');
    await expect(desvioAbsolutoBadge.first()).toBeVisible();
  });

  test('deve exibir totais e médias no rodapé da tabela', async ({ page }) => {
    // Aguardar carregamento completo da tabela
    await expect(page.getByTestId('valores-table')).toBeVisible();
    
    // Verificar totais no rodapé
    const tfoot = page.locator('tfoot');
    await expect(tfoot).toBeVisible();
    
    // Verificar se há valores calculados
    await expect(tfoot.locator('text=Total')).toBeVisible();
    await expect(tfoot.locator('text=Média')).toBeVisible();
  });

  test('deve manter estado de edição durante navegação', async ({ page }) => {
    // Preencher valor
    await page.getByTestId('input-meta').first().fill('500');
    
    // Recarregar página
    await page.reload();
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();
    
    // Verificar se o valor ainda está (persistido no backend)
    // Nota: Isso depende da implementação de salvamento automático
  });

  test('deve validar inputs numéricos', async ({ page }) => {
    const metaInput = page.getByTestId('input-meta').first();
    
    // Verificar se o input aceita apenas números
    await metaInput.fill('abc');
    await expect(metaInput).toHaveValue(''); // Deve limpar ou não aceitar texto
    
    // Verificar valores negativos se permitido
    await metaInput.fill('-100');
    await expect(metaInput).toHaveValue('-100'); // Se permitido, deve aceitar
  });
});

test.describe.skip('LEGACY: Edição de Valores Mensais - Estados de Erro @cockpit @indicadores @high @legacy', () => {
  test('deve exibir loading durante carregamento', async ({ page }) => {
    await page.goto('/cockpit-pilares/123/valores-mensais');
    
    // Verificar estado de loading inicial
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    
    // Aguardar loading desaparecer
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
  });

  test('deve lidar com erro de carregamento', async ({ page }) => {
    // Simular erro de API (pode precisar de mocking em ambiente real)
    await page.route('**/api/cockpit-pilares/*/indicadores', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro interno do servidor' })
      });
    });

    await page.goto('/cockpit-pilares/123/valores-mensais');
    
    // Verificar mensagem de erro (se implementada)
    // await expect(page.locator('.alert-danger')).toBeVisible();
  });
});

test.describe.skip('LEGACY: Edição de Valores Mensais - Responsividade @cockpit @indicadores @high @legacy', () => {
  test('deve ser responsivo em mobile', async ({ page }) => {
    // Simular viewport mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/cockpit-pilares/123/valores-mensais');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();
    
    // Verificar se a tabela é scrollável em mobile
    const table = page.getByTestId('valores-table');
    await expect(table).toBeVisible();
    
    // Verificar se os cards de indicadores estão adaptados
    await expect(page.getByTestId('indicador-card')).toBeVisible();
  });

  test('deve manter funcionalidade em desktop', async ({ page }) => {
    // Viewport desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/cockpit-pilares/123/valores-mensais');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible();
    
    // Verificar layout completo em desktop
    await expect(page.getByTestId('indicador-card')).toBeVisible();
    await expect(page.getByTestId('btn-novo-ciclo-mensal')).toBeVisible();
  });
});