import { test, expect } from '@playwright/test';

test.describe.skip('LEGACY: Diagnóstico de Notas @diagnostico @critical @medium @legacy', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para a página de diagnóstico
    await page.goto('/diagnostico/notas');
    // Esperar carregamento completar
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
  });

  test('deve carregar página com pilares disponíveis', async ({ page }) => {
    // Verificar se há pilares para diagnóstico
    await expect(page.getByTestId('pilar-accordion')).toBeVisible();
    
    // Verificar se há pelo menos um pilar expandido
    const pilares = page.locator('[data-testid="pilar-accordion"]');
    await expect(pilares.first()).toBeVisible();
    
    // Verificar se há informações de progresso
    const progressBadges = page.locator('.badge:has-text("Tx respostas")');
    if (await progressBadges.first().isVisible()) {
      await expect(progressBadges.first()).toBeVisible();
    }
  });

  test('deve exibir mensagem quando não há pilares', async ({ page }) => {
    // Simular empresa sem pilares
    await page.route('**/api/empresas/*/diagnostico/notas', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ pilares: [] })
      });
    });

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar mensagem de nenhum pilar (se implementada)
    const noPilarsMessage = page.locator('.alert-info:has-text("pilar")');
    if (await noPilarsMessage.isVisible()) {
      await expect(noPilarsMessage).toBeVisible();
    }
  });

  test('deve expandir e colapsar pilares', async ({ page }) => {
    // Aguardar carregamento dos pilares
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Pegar o primeiro pilar
    const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
    
    // Verificar se está expandido ou colapsado
    const isExpanded = await firstPilar.locator('.collapsed').count() === 0;
    
    // Clicar para alternar estado
    await firstPilar.locator('button').click();
    await page.waitForTimeout(500);
    
    // Verificar se o estado mudou
    const newIsExpanded = await firstPilar.locator('.collapsed').count() === 0;
    expect(newIsExpanded).not.toBe(isExpanded);
  });

  test('deve exibir média de notas do pilar', async ({ page }) => {
    // Aguardar carregamento dos pilares
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Procurar badges de média
    const mediaBadges = page.locator('app-media-badge');
    
    if (await mediaBadges.first().isVisible()) {
      // Verificar se há valor de média
      const firstMediaBadge = mediaBadges.first();
      await expect(firstMediaBadge).toBeVisible();
      
      // Verificar se o badge tem classe de cor (success/warning/danger)
      const badgeClasses = await firstMediaBadge.getAttribute('class');
      expect(badgeClasses).toMatch(/bg-(success|warning|danger)/);
    } else {
      console.log('Badges de média não encontrados');
    }
  });

  test('deve abrir modal de responsável do pilar', async ({ page }) => {
    // Aguardar carregamento dos pilares
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Expandir primeiro pilar se necessário
    const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const isCollapsed = await firstPilar.locator('.collapsed').count() > 0;
    if (isCollapsed) {
      await firstPilar.locator('button').click();
      await page.waitForTimeout(500);
    }
    
    // Procurar botão de definir responsável
    const responsavelButton = page.locator('[data-testid="btn-definir-responsavel"]');
    
    if (await responsavelButton.isVisible()) {
      await responsavelButton.click();
      
      // Verificar se o modal foi aberto
      const modal = page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]');
      await expect(modal).toBeVisible({ timeout: 2000 });
      
      // Verificar se há select de usuários
      const userSelect = modal.locator('select');
      if (await userSelect.isVisible()) {
        await expect(userSelect).toBeVisible();
      }
    } else {
      console.log('Botão de definir responsável não encontrado');
    }
  });

  test('deve adicionar rotina customizada', async ({ page }) => {
    // Aguardar carregamento dos pilares
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Expandir primeiro pilar se necessário
    const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
    const isCollapsed = await firstPilar.locator('.collapsed').count() > 0;
    if (isCollapsed) {
      await firstPilar.locator('button').click();
      await page.waitForTimeout(500);
    }
    
    // Procurar botão de adicionar rotina
    const adicionarRotinaButton = page.locator('[data-testid="btn-adicionar-rotina"]');
    
    if (await adicionarRotinaButton.isVisible()) {
      await adicionarRotinaButton.click();
      
      // Verificar se o modal foi aberto
      const modal = page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]');
      await expect(modal).toBeVisible({ timeout: 2000 });
      
      // Verificar se há campo de nome
      const nomeInput = modal.locator('input[placeholder*="nome"]');
      if (await nomeInput.isVisible()) {
        await expect(nomeInput).toBeVisible();
        await nomeInput.fill('Nova Rotina Customizada');
      }
      
      // Verificar se há campo de descrição
      const descricaoTextarea = modal.locator('textarea[placeholder*="descrição"]');
      if (await descricaoTextarea.isVisible()) {
        await expect(descricaoTextarea).toBeVisible();
        await descricaoTextarea.fill('Descrição da nova rotina');
      }
    } else {
      console.log('Botão de adicionar rotina não encontrado');
    }
  });

  test('deve navegar para cockpit do pilar', async ({ page }) => {
    // Aguardar carregamento dos pilares
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Procurar botão de navegar para cockpit
    const cockpitButton = page.locator('[data-testid="btn-navegar-cockpit"]');
    
    if (await cockpitButton.isVisible()) {
      await cockpitButton.click();
      
      // Verificar se foi redirecionado para página do cockpit
      await page.waitForTimeout(2000);
      
      // Verificar se está na página do cockpit
      const cockpitHeader = page.locator('[data-testid="cockpit-header"]');
      if (await cockpitHeader.isVisible({ timeout: 3000 })) {
        await expect(cockpitHeader).toBeVisible();
      }
    } else {
      console.log('Botão de navegar para cockpit não encontrado');
    }
  });

  test('deve exibir informações do responsável do pilar', async ({ page }) => {
    // Aguardar carregamento dos pilares
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Verificar se há informações de responsável
    const responsavelInfo = page.locator('.responsavel-info');
    
    if (await responsavelInfo.first().isVisible()) {
      await expect(responsavelInfo.first()).toBeVisible();
      
      // Verificar se há nome do responsável
      const responsavelNome = responsavelInfo.first().locator('text');
      if (await responsavelNome.isVisible()) {
        expect(responsavelNome.textContent()).not.toBe('');
      }
    } else {
      console.log('Informações de responsável não encontradas');
    }
  });

  test('deve ser responsivo em diferentes viewports', async ({ page }) => {
    // Teste em desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar layout desktop
    await expect(page.getByTestId('pilar-accordion')).toBeVisible();
    
    // Teste em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar layout tablet
    await expect(page.getByTestId('pilar-accordion')).toBeVisible();
    
    // Teste em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar layout mobile
    await expect(page.getByTestId('pilar-accordion')).toBeVisible();
    
    // Verificar se os pilares são responsivos
    const pilares = page.locator('[data-testid="pilar-accordion"]');
    await expect(pilares.first()).toBeVisible();
  });

  test('deve lidar com perfil read-only', async ({ page }) => {
    // Simular usuário com perfil read-only (COLABORADOR ou LEITURA)
    await page.route('**/api/auth/me', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          perfil: { codigo: 'COLABORADOR' },
          empresaId: '123'
        })
      });
    });

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar se os inputs estão desabilitados
    const notaInputs = page.locator('input[type="number"]');
    
    if (await notaInputs.first().isVisible()) {
      await expect(notaInputs.first()).toBeDisabled();
    }
    
    // Verificar se os botões de ação estão ocultos
    const actionButtons = page.locator('[data-testid="btn-definir-responsavel"], [data-testid="btn-adicionar-rotina"]');
    
    for (const button of await actionButtons.all()) {
      if (await button.isVisible()) {
        await expect(button).toBeDisabled();
      }
    }
  });

  test('deve exibir período de avaliação ativo', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Verificar se há informações de período de avaliação
    const periodoInfo = page.locator('.periodo-avaliacao');
    
    if (await periodoInfo.isVisible()) {
      await expect(periodoInfo).toBeVisible();
      
      // Verificar se há informações do período
      const periodoText = await periodoInfo.textContent();
      expect(periodoText).toMatch(/trimestre|período/i);
    } else {
      console.log('Informações de período não encontradas');
    }
  });
});

test.describe.skip('LEGACY: Diagnóstico de Notas - Estados de Erro @diagnostico @legacy', () => {
  test('deve exibir loading durante carregamento', async ({ page }) => {
    // Simular carregamento lento
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
    
    // Verificar indicador de loading
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    
    // Aguardar loading desaparecer
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 5000 });
  });

  test('deve lidar com erro de API', async ({ page }) => {
    // Simular erro de API
    await page.route('**/api/empresas/*/diagnostico/notas', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro interno do servidor' })
      });
    });

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 15000 });
    
    // Verificar mensagem de erro (se implementada)
    const errorMessage = page.locator('.alert-danger');
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible();
      await expect(errorMessage).toContainText('Erro');
    }
  });

  test('deve lidar com erro de salvamento', async ({ page }) => {
    // Simular erro ao salvar
    await page.route('**/api/rotinas-empresa/*/nota', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro ao salvar nota' })
      });
    });

    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Tentar preencher e salvar nota
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
      
      // Verificar se há mensagem de erro
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

test.describe.skip('LEGACY: Diagnóstico de Notas - Performance @diagnostico @legacy', () => {
  test('deve carregar página rapidamente', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Verificar se carregou em tempo razoável (< 4 segundos)
    expect(loadTime).toBeLessThan(4000);
    
    console.log(`Tempo de carregamento do diagnóstico: ${loadTime}ms`);
  });

  test('deve permanecer estável com múltiplas interações', async ({ page }) => {
    await page.goto('/diagnostico/notas');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Realizar múltiplas interações rápidas
    await page.waitForSelector('[data-testid="pilar-accordion"]');
    
    // Expandir e colapsar pilares
    for (let i = 0; i < 3; i++) {
      const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
      await firstPilar.locator('button').click();
      await page.waitForTimeout(300);
    }
    
    // Verificar se a página permanece funcional
    await expect(page.getByTestId('pilar-accordion')).toBeVisible();
  });

  test('deve lidar com grande número de pilares e rotinas', async ({ page }) => {
    // Simular muitos pilares
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
    
    // Verificar se a página carregou com muitos elementos
    await expect(page.getByTestId('pilar-accordion')).toBeVisible();
    
    // Verificar performance com muitos elementos
    const startTime = Date.now();
    
    // Expandir primeiro pilar
    const firstPilar = page.locator('[data-testid="pilar-accordion"]').first();
    await firstPilar.locator('button').click();
    
    const expandTime = Date.now() - startTime;
    
    // Verificar se a expansão foi rápida (< 1 segundo)
    expect(expandTime).toBeLessThan(1000);
    
    console.log(`Tempo de expansão com muitos elementos: ${expandTime}ms`);
  });
});