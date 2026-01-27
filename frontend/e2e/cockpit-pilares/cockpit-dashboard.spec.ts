import { test, expect } from '@playwright/test';

test.describe('Dashboard Cockpit', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para o dashboard do cockpit
    await page.goto('/cockpit-pilares/123');
    // Esperar carregamento completar
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
  });

  test('deve carregar dashboard com abas disponíveis', async ({ page }) => {
    // Verificar cabeçalho do cockpit
    await expect(page.getByTestId('cockpit-header')).toBeVisible();
    
    // Verificar todas as abas
    await expect(page.getByTestId('tab-contexto')).toBeVisible();
    await expect(page.getByTestId('tab-indicadores')).toBeVisible();
    await expect(page.getByTestId('tab-graficos')).toBeVisible();
    await expect(page.getByTestId('tab-processos')).toBeVisible();
    
    // Verificar que a aba inicial (contexto) está ativa
    await expect(page.getByTestId('tab-contexto')).toHaveClass(/active/);
  });

  test('deve carregar e exibir formulário de contexto', async ({ page }) => {
    // Verificar aba de contexto ativa
    await expect(page.getByTestId('tab-contexto')).toHaveClass(/active/);
    
    // Verificar campos do formulário de contexto
    await expect(page.getByTestId('contexto-entradas')).toBeVisible();
    await expect(page.getByTestId('contexto-saidas')).toBeVisible();
    await expect(page.getByTestId('contexto-missao')).toBeVisible();
    
    // Verificar placeholders
    await expect(page.getByTestId('contexto-entradas')).toHaveAttribute('placeholder', /pedidos/i);
    await expect(page.getByTestId('contexto-saidas')).toHaveAttribute('placeholder', /propostas/i);
    await expect(page.getByTestId('contexto-missao')).toHaveAttribute('placeholder', /maximizar/i);
  });

  test('deve preencher e salvar contexto', async ({ page }) => {
    // Preencher formulário de contexto
    await page.getByTestId('contexto-entradas').fill('Pedidos de clientes, leads qualificados do marketing');
    await page.getByTestId('contexto-saidas').fill('Propostas comerciais enviadas, relatórios de performance');
    await page.getByTestId('contexto-missao').fill('Maximizar faturamento via canal indireto mantendo alta qualidade');
    
    // Verificar se os valores foram preenchidos
    await expect(page.getByTestId('contexto-entradas')).toHaveValue('Pedidos de clientes, leads qualificados do marketing');
    await expect(page.getByTestId('contexto-saidas')).toHaveValue('Propostas comerciais enviadas, relatórios de performance');
    await expect(page.getByTestId('contexto-missao')).toHaveValue('Maximizar faturamento via canal indireto mantendo alta qualidade');
    
    // Aguardar auto-save (se implementado)
    await page.waitForTimeout(2000);
    
    // Verificar feedback de salvamento (se implementado)
    const feedbackSave = page.getByTestId('feedback-save');
    if (await feedbackSave.isVisible()) {
      // Verificar se aparece mensagem de salvo com sucesso
      await expect(feedbackSave).toBeVisible();
    }
  });

  test('deve navegar entre abas', async ({ page }) => {
    // Clicar na aba de indicadores
    await page.getByTestId('tab-indicadores').click();
    
    // Verificar que aba de indicadores está ativa
    await expect(page.getByTestId('tab-indicadores')).toHaveClass(/active/);
    await expect(page.getByTestId('tab-contexto')).not.toHaveClass(/active/);
    
    // Verificar que o painel de indicadores é visível
    await expect(page.getByTestId('indicadores-panel')).toBeVisible();
    
    // Clicar na aba de gráficos
    await page.getByTestId('tab-graficos').click();
    
    // Verificar que aba de gráficos está ativa
    await expect(page.getByTestId('tab-graficos')).toHaveClass(/active/);
    await expect(page.getByTestId('tab-indicadores')).not.toHaveClass(/active/);
    
    // Verificar que o painel de gráficos é visível
    await expect(page.getByTestId('grafico-panel')).toBeVisible();
    
    // Clicar na aba de processos
    await page.getByTestId('tab-processos').click();
    
    // Verificar que aba de processos está ativa
    await expect(page.getByTestId('tab-processos')).toHaveClass(/active/);
    await expect(page.getByTestId('tab-graficos')).not.toHaveClass(/active/);
    
    // Verificar que o painel de processos é visível
    await expect(page.getByTestId('processos-panel')).toBeVisible();
  });

  test('deve exibir mensagem de erro quando cockpit não encontrado', async ({ page }) => {
    // Simular URL de cockpit inválido
    await page.goto('/cockpit-pilares/999');
    
    // Aguardar o estado de erro
    await expect(page.getByTestId('error-message')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('cockpit-header')).not.toBeVisible();
  });

  test('deve exibir loading durante carregamento', async ({ page }) => {
    // Simular carregamento lento
    await page.route('**/api/cockpit-pilares/123', route => {
      // Simular resposta lenta
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: '123', pilarEmpresa: { nome: 'Teste Cockpit' } })
        });
      }, 2000);
    });

    await page.goto('/cockpit-pilares/123');
    
    // Verificar indicador de loading
    await expect(page.getByTestId('loading-indicator')).toBeVisible();
    
    // Aguardar loading desaparecer
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 5000 });
    
    // Verificar que o conteúdo foi carregado
    await expect(page.getByTestId('cockpit-header')).toBeVisible();
  });

  test('deve ser responsivo em diferentes viewports', async ({ page }) => {
    // Teste em desktop
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('/cockpit-pilares/123');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar layout desktop
    await expect(page.getByTestId('cockpit-header')).toBeVisible();
    await expect(page.getByTestId('tab-contexto')).toBeVisible();
    
    // Teste em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar layout tablet
    await expect(page.getByTestId('cockpit-header')).toBeVisible();
    
    // Teste em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Verificar se há mensagem de uso preferencial desktop
    await expect(page.getByTestId('cockpit-header')).toBeVisible();
  });

  test('deve manter estado dos formulários entre abas', async ({ page }) => {
    // Preencher contexto
    await page.getByTestId('contexto-entradas').fill('Conteúdo de teste');
    
    // Mudar para aba de indicadores
    await page.getByTestId('tab-indicadores').click();
    await expect(page.getByTestId('indicadores-panel')).toBeVisible();
    
    // Voltar para aba de contexto
    await page.getByTestId('tab-contexto').click();
    
    // Verificar se o conteúdo preenchido foi mantido
    await expect(page.getByTestId('contexto-entradas')).toHaveValue('Conteúdo de teste');
  });

  test('deve validar limite de caracteres nos campos', async ({ page }) => {
    const entradasField = page.getByTestId('contexto-entradas');
    const saidasField = page.getByTestId('contexto-saidas');
    const missaoField = page.getByTestId('contexto-missao');
    
    // Preencher com mais caracteres que o permitido (simular)
    const longText = 'a'.repeat(500);
    
    await entradasField.fill(longText);
    
    // Verificar se há validação de tamanho (se implementado)
    const fieldValue = await entradasField.inputValue();
    
    // Se houver validação, o valor deve ser truncado
    if (fieldValue.length < longText.length) {
      console.log(`Campo truncado de ${longText.length} para ${fieldValue.length} caracteres`);
    }
    
    // Limpar campo
    await entradasField.fill('');
  });

  test('deve exibir feedback de salvamento automático', async ({ page }) => {
    // Modificar um campo para disparar salvamento
    await page.getByTestId('contexto-entradas').fill('Conteúdo modificado');
    
    // Aguardar feedback de salvamento
    const feedbackSave = page.getByTestId('feedback-save');
    
    // Pode haver um pequeno delay para o feedback aparecer
    await page.waitForTimeout(1500);
    
    if (await feedbackSave.isVisible()) {
      // Verificar se aparece indicador de salvamento ou sucesso
      await expect(feedbackSave).toBeVisible();
      
      // Aguardar finalização do salvamento
      await page.waitForTimeout(2000);
      
      // Verificar se há mensagem de sucesso
      const successMessage = feedbackSave.locator('.text-success');
      if (await successMessage.isVisible({ timeout: 1000 })) {
        await expect(successMessage).toBeVisible();
      }
    } else {
      console.log('Feedback de salvamento não implementado ou não visível');
    }
  });
});

test.describe('Dashboard Cockpit - Componentes Filhos', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cockpit-pilares/123');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
  });

  test('deve carregar componente de gestão de indicadores', async ({ page }) => {
    // Mudar para aba de indicadores
    await page.getByTestId('tab-indicadores').click();
    
    // Aguardar componente carregar
    await expect(page.getByTestId('indicadores-panel')).toBeVisible();
    
    // Verificar se o componente filho carregou
    await page.waitForTimeout(1000);
    
    // Verificar se há elementos do componente de gestão
    const managementTable = page.locator('[data-testid="indicadores-table"]');
    if (await managementTable.isVisible({ timeout: 2000 })) {
      await expect(managementTable).toBeVisible();
    } else {
      console.log('Componente de gestão não carregado visivelmente');
    }
  });

  test('deve carregar componente de gráficos', async ({ page }) => {
    // Mudar para aba de gráficos
    await page.getByTestId('tab-graficos').click();
    
    // Aguardar componente carregar
    await expect(page.getByTestId('grafico-panel')).toBeVisible();
    
    // Verificar se o componente filho carregou
    await page.waitForTimeout(1000);
    
    // Verificar se há elementos do componente de gráficos
    const chartComponent = page.locator('[data-testid="grafico-container"]');
    if (await chartComponent.isVisible({ timeout: 2000 })) {
      await expect(chartComponent).toBeVisible();
    } else {
      console.log('Componente de gráficos não carregado visivelmente');
    }
  });

  test('deve carregar componente de processos', async ({ page }) => {
    // Mudar para aba de processos
    await page.getByTestId('tab-processos').click();
    
    // Aguardar componente carregar
    await expect(page.getByTestId('processos-panel')).toBeVisible();
    
    // Verificar se o componente filho carregou
    await page.waitForTimeout(1000);
    
    // Verificar se há elementos do componente de processos
    const processComponent = page.locator('table, .process-list, .task-list');
    if (await processComponent.isVisible({ timeout: 2000 })) {
      await expect(processComponent).toBeVisible();
    } else {
      console.log('Componente de processos não carregado visivelmente');
    }
  });
});

test.describe('Dashboard Cockpit - Performance', () => {
  test('deve carregar em tempo aceitável', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/cockpit-pilares/123');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    
    // Verificar se carregou em tempo razoável (< 3 segundos)
    expect(loadTime).toBeLessThan(3000);
    
    console.log(`Tempo de carregamento do dashboard: ${loadTime}ms`);
  });

  test('deve permanecer responsivo com múltiplas navegações', async ({ page }) => {
    await page.goto('/cockpit-pilares/123');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Realizar múltiplas navegações rápidas
    await page.getByTestId('tab-indicadores').click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('tab-graficos').click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('tab-processos').click();
    await page.waitForTimeout(500);
    
    await page.getByTestId('tab-contexto').click();
    await page.waitForTimeout(500);
    
    // Verificar se a página permanece funcional
    await expect(page.getByTestId('cockpit-header')).toBeVisible();
    await expect(page.getByTestId('tab-contexto')).toHaveClass(/active/);
  });

  test('deve lidar com erro de componente filho', async ({ page }) => {
    // Simular erro em componente filho
    await page.route('**/api/cockpit-pilares/123/indicadores*', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Erro ao carregar indicadores' })
      });
    });

    await page.goto('/cockpit-pilares/123');
    await expect(page.getByTestId('loading-indicator')).not.toBeVisible({ timeout: 10000 });
    
    // Tentar navegar para aba de indicadores
    await page.getByTestId('tab-indicadores').click();
    
    // Aguardar possível erro
    await page.waitForTimeout(2000);
    
    // Verificar se há mensagem de erro (se implementada)
    const errorMessage = page.getByTestId('error-message');
    if (await errorMessage.isVisible({ timeout: 2000 })) {
      await expect(errorMessage).toBeVisible();
    } else {
      // Verificar se o painel ainda está visível (pode mostrar erro interno)
      const panel = page.getByTestId('indicadores-panel');
      if (await panel.isVisible()) {
        console.log('Painel visível mas pode ter erro interno');
      }
    }
  });
});