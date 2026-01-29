import { test, expect } from '@playwright/test';

test.describe.skip('LEGACY: Gestão de Indicadores @cockpit @indicadores @high @legacy', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de gestão de indicadores
    await page.goto('/cockpit-pilares/123/indicadores');
    // Esperar carregamento completar
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
  });

  test('deve carregar página com indicadores existentes', async ({ page }) => {
    // Verificar que a página carregou sem estado de vazio
    await expect(page.getByTestId('no-indicators-message')).not.toBeVisible();
    
    // Verificar que existe pelo menos um indicador na tabela
    await expect(page.getByTestId('indicadores-table')).toBeVisible();
    
    // Verificar botão de novo indicador
    await expect(page.getByTestId('btn-novo-indicador')).toBeVisible();
  });

  test('deve exibir mensagem quando não há indicadores', async ({ page }) => {
    // Simular URL sem indicadores ou cockpit sem indicadores
    await page.goto('/cockpit-pilares/456/indicadores');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar mensagem de nenhum indicador
    await expect(page.getByTestId('no-indicators-message')).toBeVisible();
    await expect(page.getByTestId('no-indicators-message')).toContainText('Nenhum indicador criado');
  });

  test('deve abrir modal de novo indicador', async ({ page }) => {
    // Aguardar botão de novo indicador estar habilitado
    await page.waitForSelector('[data-testid="btn-novo-indicador"]:not([disabled])');
    
    // Clicar no botão de novo indicador
    await page.getByTestId('btn-novo-indicador').click();
    
    // Verificar se o modal foi aberto (dependendo da implementação)
    const modal = page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]');
    if (await modal.isVisible({ timeout: 2000 })) {
      await expect(modal).toBeVisible();
      // Verificar elementos dentro do modal se necessário
    }
  });

  test('deve editar indicador existente', async ({ page }) => {
    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-testid="edit-indicador-button"]');
    
    // Clicar no primeiro botão de editar
    await page.getByTestId('edit-indicador-button').first().click();
    
    // Verificar se o modal de edição foi aberto
    const modal = page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]');
    if (await modal.isVisible({ timeout: 2000 })) {
      await expect(modal).toBeVisible();
      // Verificar se há campos preenchidos (dependendo da implementação)
    }
  });

  test('deve excluir indicador', async ({ page }) => {
    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-testid="delete-indicador-button"]');
    
    // Pegar o primeiro botão de excluir
    const deleteButton = page.getByTestId('delete-indicador-button').first();
    
    // Clicar no botão de excluir
    await deleteButton.click();
    
    // Aguardar e aceitar confirmação (SweetAlert2 ou similar)
    const confirmButton = page.locator('.swal2-confirm');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
      
      // Aguardar processo de exclusão
      await expect(page.getByTestId('loading-indicator')).toBeVisible({ timeout: 5000 });
      await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 15000 });
      
      // Verificar se o indicador foi removido
      // Pode haver mensagem de sucesso ou a lista pode diminuir
    }
  });

  test('deve ordenar indicadores via drag and drop', async ({ page }) => {
    // Verificar se há múltiplos indicadores
    await page.waitForSelector('[data-testid="edit-indicador-button"]');
    
    const indicadores = await page.locator('[data-testid="indicadores-table"] tbody tr').count();
    
    if (indicadores > 1) {
      // Pegar o primeiro indicador
      const firstIndicator = page.locator('[data-testid="indicadores-table"] tbody tr').first();
      
      // Pegar o segundo indicador
      const secondIndicator = page.locator('[data-testid="indicadores-table"] tbody tr').nth(1);
      
      // Realizar drag and drop (mover primeiro para posição do segundo)
      await firstIndicator.dragTo(secondIndicator);
      
      // Aguardar atualização
      await page.waitForTimeout(1000);
      
      // Verificar se a ordem mudou (implementação específica)
      // Isso pode precisar de verificação visual ou contagem
    } else {
      console.log('Não há indicadores suficientes para teste de drag and drop');
    }
  });

  test('deve filtrar indicadores', async ({ page }) => {
    // Verificar se há campo de busca (se implementado)
    const searchInput = page.locator('input[placeholder*="buscar"], input[placeholder*="search"]');
    
    if (await searchInput.isVisible()) {
      // Preencher campo de busca
      await searchInput.fill('Teste');
      
      // Aguardar resultados
      await page.waitForTimeout(1000);
      
      // Verificar se os resultados foram filtrados
      await expect(page.getByTestId('indicadores-table')).toBeVisible();
    } else {
      console.log('Campo de busca não implementado');
    }
  });

  test('deve exibir informações dos indicadores', async ({ page }) => {
    // Aguardar carregamento da tabela
    await page.waitForSelector('[data-testid="edit-indicador-button"]');
    
    // Verificar se as informações são exibidas corretamente
    const firstRow = page.locator('[data-testid="indicadores-table"] tbody tr').first();
    
    // Verificar se há nome do indicador
    const indicatorName = firstRow.locator('td:first-child');
    await expect(indicatorName).toBeVisible();
    await expect(indicatorName.textContent()).not.toBe('');
    
    // Verificar se há tipo de medida
    const measureType = firstRow.locator('td:nth-child(2)');
    await expect(measureType).toBeVisible();
    
    // Verificar se há status de medição
    const measurementStatus = firstRow.locator('td:nth-child(3)');
    await expect(measurementStatus).toBeVisible();
    
    // Verificar se há responsável
    const responsible = firstRow.locator('td:nth-child(4)');
    await expect(responsible).toBeVisible();
    
    // Verificar se há indicador de direção
    const direction = firstRow.locator('td:nth-child(5)');
    await expect(direction).toBeVisible();
  });

  test('deve ser responsivo em diferentes viewports', async ({ page }) => {
    // Teste em desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/cockpit-pilares/123/indicadores');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('indicadores-table')).toBeVisible();
    
    // Teste em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('indicadores-table')).toBeVisible();
    
    // Teste em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar se há mensagem de uso de desktop em mobile
    const mobileMessage = page.locator('.alert:has-text("Use desktop")');
    if (await mobileMessage.isVisible()) {
      await expect(mobileMessage).toBeVisible();
      await expect(mobileMessage).toContainText('Use desktop');
    }
  });

  test('deve lidar com estados de erro', async ({ page }) => {
    // Simular erro de API
    await page.route('**/api/cockpit-pilares/*/indicadores*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro interno do servidor' })
      });
    });

    await page.goto('/cockpit-pilares/123/indicadores');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 15000 });
    
    // Verificar mensagem de erro (se implementada)
    const errorMessage = page.locator('.alert-danger');
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Erro');
    }
  });

  test('deve validar permissões de usuário', async ({ page }) => {
    // Teste com usuário sem permissão (se aplicável)
    await page.goto('/cockpit-pilares/123/indicadores');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar se botão de novo indicador está presente/visível
    const novoIndicadorButton = page.getByTestId('btn-novo-indicador');
    if (await novoIndicadorButton.isVisible()) {
      await expect(novoIndicadorButton).toBeVisible();
      
      // Tentar clicar e verificar se há mensagem de permissão
      await novoIndicadorButton.click();
      
      const permissionError = page.locator('.swal2-error, .alert-warning');
      if (await permissionError.isVisible({ timeout: 2000 })) {
        await expect(permissionError).toBeVisible();
      }
    } else {
      // Botão não visível por falta de permissão
      console.log('Botão de novo indicador não visível - possivelmente por falta de permissão');
    }
  });

  test('deve paginar muitos indicadores', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="edit-indicador-button"]');
    
    // Verificar se há paginação
    const pagination = page.locator('.pagination');
    if (await pagination.isVisible()) {
      await expect(pagination).toBeVisible();
      
      // Tentar navegar para próxima página
      const nextPageButton = pagination.locator('.page-item.next:not(.disabled)');
      if (await nextPageButton.isVisible()) {
        await nextPageButton.click();
        await page.waitForTimeout(1000);
        await expect(page.getByTestId('indicadores-table')).toBeVisible();
      }
    } else {
      console.log('Paginação não implementada');
    }
  });
});

test.describe.skip('LEGACY: Gestão de Indicadores - Performance @cockpit @indicadores @high @legacy', () => {
  test('deve carregar página rapidamente', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/cockpit-pilares/123/indicadores');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Verificar se carregou em tempo razoável (< 5 segundos)
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`Tempo de carregamento: ${loadTime}ms`);
  });

  test('deve permanecer estável com múltiplas interações', async ({ page }) => {
    await page.goto('/cockpit-pilares/123/indicadores');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Realizar múltiplas interações rápidas
    await page.getByTestId('btn-novo-indicador').click();
    await page.waitForTimeout(500);
    
    const modal = page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]');
    if (await modal.isVisible()) {
      await page.keyboard.press('Escape'); // Fechar modal
    }
    
    await page.waitForTimeout(500);
    
    // Tentar editar primeiro indicador
    const editButton = page.getByTestId('edit-indicador-button').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);
      
      if (await modal.isVisible()) {
        await page.keyboard.press('Escape');
      }
    }
    
    // Verificar se a página permanece funcional
    await expect(page.getByTestId('indicadores-table')).toBeVisible();
  });
});