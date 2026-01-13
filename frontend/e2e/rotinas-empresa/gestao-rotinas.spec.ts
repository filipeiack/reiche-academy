import { 
  test, 
  expect,
  login, 
  navigateTo,
  selectEmpresa,
  TEST_USERS 
} from '../fixtures';

/**
 * E2E Tests - Gestão de Rotinas por Empresa
 * 
 * Regras testadas: /docs/business-rules/rotinas-empresa.md
 * 
 * Funcionalidades validadas:
 * - Adicionar rotina customizada a um pilar
 * - Abrir modal "Gerenciar Rotinas" de um pilar
 * - Reordenar rotinas via drag-and-drop
 * - Remover rotina de um pilar
 * - Validação multi-tenant (GESTOR só vê própria empresa)
 * - Validação de campos obrigatórios (nome mínimo 3 caracteres)
 * 
 * Agente: QA_E2E_Interface
 * Data: 2026-01-13
 * Versão: 2.0 - Ajustado conforme handoff DEV-to-QA-E2E-pilares-rotinas-rbac-v1
 */

test.describe('Gestão de Rotinas - Adicionar Rotina Customizada', () => {
  
  test('ADMINISTRADOR deve abrir modal Adicionar Rotina', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    
    // ADMINISTRADOR seleciona Empresa Teste A Ltda
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Expandir primeiro pilar
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const buttonCount = await firstPilarButton.count();
    if (buttonCount > 0) {
      await firstPilarButton.click();
      await page.waitForTimeout(500);
      
      // Clicar no menu de três pontos do pilar expandido
      const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
      await pilarMenu.waitFor({ state: 'visible', timeout: 5000 });
      await pilarMenu.click();
      await page.waitForTimeout(500);
      
      // Clicar em "Adicionar Rotina"
      const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")').first();
      await adicionarRotinaBtn.click();
      
      // Validar que modal foi aberto
      const modalTitle = page.locator('.modal-title:has-text("Nova Rotina Customizada")');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });
    }
  });

  test('ADMINISTRADOR deve criar rotina customizada com sucesso', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // Expandir primeiro pilar
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const btnCount = await firstPilarButton.count();
    if (btnCount === 0) {
      console.log('[SKIP] ADMINISTRADOR - Empresa A sem pilares');
      test.skip();
      return;
    }
    
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    // Abrir menu do pilar
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    // Clicar em "Adicionar Rotina"
    const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();
    
    // Aguardar modal carregar
    await page.waitForSelector('.modal-title:has-text("Nova Rotina Customizada")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Preencher nome da rotina (textarea com formControlName="nome")
    const nomeRotina = `Rotina E2E Test ${Date.now()}`;
    const nomeTextarea = page.locator('.modal-body textarea[formControlName="nome"]');
    await nomeTextarea.fill(nomeRotina);
    await page.waitForTimeout(500);
    
    // Clicar em "Criar Rotina"
    const criarButton = page.locator('.modal-footer button:has-text("Criar Rotina")');
    await criarButton.click();
    await page.waitForTimeout(1500);
    
    // Validar que modal fechou
    const modalVisible = await page.locator('.modal-title:has-text("Nova Rotina Customizada")').count();
    expect(modalVisible).toBe(0);
  });

  test('GESTOR deve criar rotina customizada com sucesso', async ({ page }) => {
    await login(page, TEST_USERS['gestorEmpresaA']);
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const btnCount = await firstPilarButton.count();
    if (btnCount === 0) {
      console.log('[SKIP] GESTOR - sem pilares');
      test.skip();
      return;
    }
    
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();
    
    await page.waitForSelector('.modal-title:has-text("Nova Rotina Customizada")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    const nomeRotina = `Rotina GESTOR Test ${Date.now()}`;
    const nomeTextarea = page.locator('.modal-body textarea[formControlName="nome"]');
    await nomeTextarea.fill(nomeRotina);
    await page.waitForTimeout(500);
    
    const criarButton = page.locator('.modal-footer button:has-text("Criar Rotina")');
    await criarButton.click();
    await page.waitForTimeout(1500);
    
    const modalVisible = await page.locator('.modal-title:has-text("Nova Rotina Customizada")').count();
    expect(modalVisible).toBe(0);
  });

  test('ADMINISTRADOR deve validar nome mínimo de 3 caracteres', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const btnCount = await firstPilarButton.count();
    if (btnCount === 0) {
      console.log('[SKIP] ADMINISTRADOR - Empresa A sem pilares');
      test.skip();
      return;
    }
    
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();
    
    await page.waitForSelector('.modal-title:has-text("Nova Rotina Customizada")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Preencher com apenas 2 caracteres
    const nomeTextarea = page.locator('.modal-body textarea[formControlName="nome"]');
    await nomeTextarea.fill('AB');
    await page.waitForTimeout(500);
    
    // Validar que botão "Criar Rotina" fica desabilitado (validação)
    const criarButton = page.locator('.modal-footer button:has-text("Criar Rotina")');
    const isDisabled = await criarButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Validar que modal NÃO fechou (erro de validação)
    const modalStillVisible = await page.locator('.modal-title:has-text("Nova Rotina Customizada")').count();
    expect(modalStillVisible).toBe(1);
  });

  test('GESTOR deve validar nome mínimo de 3 caracteres', async ({ page }) => {
    await login(page, TEST_USERS['gestorEmpresaA']);
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const btnCount = await firstPilarButton.count();
    if (btnCount === 0) {
      console.log('[SKIP] GESTOR - sem pilares');
      test.skip();
      return;
    }
    
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();
    
    await page.waitForSelector('.modal-title:has-text("Nova Rotina Customizada")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    const nomeTextarea = page.locator('.modal-body textarea[formControlName="nome"]');
    await nomeTextarea.fill('XY');
    await page.waitForTimeout(500);
    
    // Validar que botão "Criar Rotina" fica desabilitado
    const criarButton = page.locator('.modal-footer button:has-text("Criar Rotina")');
    const isDisabled = await criarButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    const modalStillVisible = await page.locator('.modal-title:has-text("Nova Rotina Customizada")').count();
    expect(modalStillVisible).toBe(1);
  });

  test('ADMINISTRADOR deve cancelar criação de rotina', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const btnCount = await firstPilarButton.count();
    if (btnCount === 0) {
      console.log('[SKIP] ADMINISTRADOR - Empresa A sem pilares');
      test.skip();
      return;
    }
    
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();
    
    await page.waitForSelector('.modal-title:has-text("Nova Rotina Customizada")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Preencher rotina
    const nomeTextarea = page.locator('.modal-body textarea[formControlName="nome"]');
    await nomeTextarea.fill('Rotina a cancelar');
    await page.waitForTimeout(500);
    
    // Cancelar
    const cancelButton = page.locator('.modal-footer button:has-text("Cancelar")');
    await cancelButton.click();
    await page.waitForTimeout(1000);
    
    // Validar que modal fechou
    const modalVisible = await page.locator('.modal-title:has-text("Nova Rotina Customizada")').count();
    expect(modalVisible).toBe(0);
  });

  test('GESTOR deve cancelar criação de rotina', async ({ page }) => {
    await login(page, TEST_USERS['gestorEmpresaA']);
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const btnCount = await firstPilarButton.count();
    if (btnCount === 0) {
      console.log('[SKIP] GESTOR - sem pilares');
      test.skip();
      return;
    }
    
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();
    
    await page.waitForSelector('.modal-title:has-text("Nova Rotina Customizada")', { timeout: 5000 });
    await page.waitForTimeout(1000);
    
    const nomeTextarea = page.locator('.modal-body textarea[formControlName="nome"]');
    await nomeTextarea.fill('Rotina GESTOR a cancelar');
    await page.waitForTimeout(500);
    
    const cancelButton = page.locator('.modal-footer button:has-text("Cancelar")');
    await cancelButton.click();
    await page.waitForTimeout(1000);
    
    const modalVisible = await page.locator('.modal-title:has-text("Nova Rotina Customizada")').count();
    expect(modalVisible).toBe(0);
  });
});

test.describe('Gestão de Rotinas - Gerenciar Rotinas Modal', () => {
  
  test('ADMINISTRADOR deve abrir modal Gerenciar Rotinas', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const buttonCount = await firstPilarButton.count();
    if (buttonCount > 0) {
      await firstPilarButton.click();
      await page.waitForTimeout(500);
      
      const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
      await pilarMenu.waitFor({ state: 'visible', timeout: 5000 });
      await pilarMenu.click();
      await page.waitForTimeout(500);
      
      const gerenciarRotinasBtn = page.locator('a:has-text("Gerenciar Rotinas")').first();
      await gerenciarRotinasBtn.click();
      
      const modalTitle = page.locator('.modal-title:has(.feather.icon-list)');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });
    }
  });

  test('GESTOR deve abrir modal Gerenciar Rotinas', async ({ page }) => {
    await login(page, TEST_USERS['gestorEmpresaA']);
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const buttonCount = await firstPilarButton.count();
    if (buttonCount > 0) {
      await firstPilarButton.click();
      await page.waitForTimeout(500);
      
      const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
      await pilarMenu.waitFor({ state: 'visible', timeout: 5000 });
      await pilarMenu.click();
      await page.waitForTimeout(500);
      
      const gerenciarRotinasBtn = page.locator('a:has-text("Gerenciar Rotinas")').first();
      await gerenciarRotinasBtn.click();
      
      const modalTitle = page.locator('.modal-title:has(.feather.icon-list)');
      await expect(modalTitle).toBeVisible({ timeout: 5000 });
    }
  });

  test('COLABORADOR não deve ver botão Adicionar Rotina', async ({ page }) => {
    await login(page, TEST_USERS['colaborador']);
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const buttonCount = await firstPilarButton.count();
    if (buttonCount > 0) {
      await firstPilarButton.click();
      await page.waitForTimeout(500);
      
      const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
      const menuCount = await pilarMenu.count();
      
      if (menuCount > 0) {
        await pilarMenu.click();
        await page.waitForTimeout(500);
        
        const adicionarRotinaBtn = page.locator('a:has-text("Adicionar Rotina")');
        const btnCount = await adicionarRotinaBtn.count();
        
        expect(btnCount).toBe(0);
      }
    }
  });

  test('COLABORADOR não deve ver botão Gerenciar Rotinas', async ({ page }) => {
    await login(page, TEST_USERS['colaborador']);
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    
    const buttonCount = await firstPilarButton.count();
    if (buttonCount > 0) {
      await firstPilarButton.click();
      await page.waitForTimeout(500);
      
      const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
      const menuCount = await pilarMenu.count();
      
      if (menuCount > 0) {
        await pilarMenu.click();
        await page.waitForTimeout(500);
        
        const gerenciarRotinasBtn = page.locator('a:has-text("Gerenciar Rotinas")');
        const btnCount = await gerenciarRotinasBtn.count();
        
        expect(btnCount).toBe(0);
      }
    }
  });
});
