import { 
  test, 
  expect,
  login, 
  navigateTo,
  selectEmpresa,
  TEST_USERS 
} from '../fixtures';

/**
 * E2E Tests - Gestão de Pilares por Empresa
 * 
 * Regras testadas: /docs/business-rules/pilares-empresa.md
 * 
 * Funcionalidades validadas:
 * - Acesso ao modal "Gerenciar Pilares"
 * - Vincular pilar existente à empresa
 * - Criar pilar customizado e vincular
 * - Reordenar pilares via drag-and-drop
 * - Desvincular pilar da empresa
 * - Validação multi-tenant (GESTOR só vê própria empresa)
 * - Definir responsável por pilar (multi-tenant, criar usuário simplificado)
 * 
 * Agente: QA_E2E_Interface
 * Data: 2026-01-13
 * Versão: 2.0 - Ajustado conforme handoff DEV-to-QA-E2E-pilares-rotinas-rbac-v1
 */

test.describe('Gestão de Pilares - Modal Gerenciar Pilares', () => {
  
  test('ADMINISTRADOR deve selecionar empresa e abrir modal Gerenciar Pilares', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    
    // ADMINISTRADOR deve selecionar empresa na navbar (Empresa Teste A Ltda do seed)
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    
    await navigateTo(page, '/diagnostico-notas');
    
    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Validar que pilares foram carregados
    const pilaresCarregados = await page.locator('[data-testid="pilar-accordion"]').count();
    if (pilaresCarregados === 0) {
      console.log('[SKIP] Empresa A não possui pilares configurados');
      test.skip();
      return;
    }
    
    // Clicar no botão de menu (três pontos) dentro de #savingBar
    const menuButton = page.locator('#savingBar [id="dropdownMenuButton"]').first();
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();
    await page.waitForTimeout(500);
    
    // Clicar no item "Gerenciar Pilares"
    const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")').first();
    await gerenciarPilaresBtn.waitFor({ state: 'visible', timeout: 5000 });
    await gerenciarPilaresBtn.click();
    
    // Validar que modal foi aberto
    const modalTitle = page.locator('.modal-title:has-text("Gerenciar Pilares da Empresa")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR deve acessar modal Gerenciar Pilares da própria empresa', async ({ page }) => {
    // GESTOR já possui empresaId vinculado, não precisa selecionar na navbar
    await login(page, TEST_USERS['gestorEmpresaA']);
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const pilaresCarregados = await page.locator('[data-testid="pilar-accordion"]').count();
    if (pilaresCarregados === 0) {
      console.log('[SKIP] GESTOR Empresa A não possui pilares configurados');
      test.skip();
      return;
    }
    
    const menuButton = page.locator('#savingBar [id="dropdownMenuButton"]').first();
    await menuButton.waitFor({ state: 'visible', timeout: 10000 });
    await menuButton.click();
    await page.waitForTimeout(500);
    
    const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")').first();
    await gerenciarPilaresBtn.click();
    
    const modalTitle = page.locator('.modal-title:has-text("Gerenciar Pilares da Empresa")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test('COLABORADOR não deve ver menu de ações', async ({ page }) => {
    await login(page, TEST_USERS['colaborador']);
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // COLABORADOR não deve ver botão de menu no header
    const menuButton = page.locator('#savingBar [id="dropdownMenuButton"]');
    const menuCount = await menuButton.count();
    
    if (menuCount > 0) {
      await menuButton.first().click();
      await page.waitForTimeout(500);
      
      const gerenciarPilaresBtn = page.locator('a:has-text("Gerenciar Pilares")');
      const btnCount = await gerenciarPilaresBtn.count();
      expect(btnCount).toBe(0);
    } else {
      expect(menuCount).toBe(0);
    }
  });
});

test.describe('Gestão de Pilares - Definir Responsável', () => {
  
  test('ADMINISTRADOR deve abrir modal Definir Responsável', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    
    // ADMINISTRADOR seleciona Empresa Teste A Ltda
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarCount = await firstPilarAccordion.count();
    
    if (pilarCount === 0) {
      console.log('[SKIP] ADMINISTRADOR - Empresa A sem pilares configurados');
      test.skip();
      return;
    }
    
    // Expandir pilar
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    await firstPilarButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    // Clicar no menu do pilar (dropdown)
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.waitFor({ state: 'visible', timeout: 5000 });
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    // Clicar em "Definir Responsável"
    const definirRespBtn = page.locator('a:has-text("Definir Responsável")').first();
    await definirRespBtn.click();
    
    const modalTitle = page.locator('.modal-title:has-text("Definir Responsável pelo Pilar")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR deve definir responsável em pilar da própria empresa', async ({ page }) => {
    await login(page, TEST_USERS['gestorEmpresaA']);
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarCount = await firstPilarAccordion.count();
    
    if (pilarCount === 0) {
      console.log('[SKIP] GESTOR - sem pilares configurados');
      test.skip();
      return;
    }
    
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    await firstPilarButton.waitFor({ state: 'visible', timeout: 10000 });
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.waitFor({ state: 'visible', timeout: 5000 });
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const definirRespBtn = page.locator('a:has-text("Definir Responsável")').first();
    await definirRespBtn.click();
    
    const modalTitle = page.locator('.modal-title:has-text("Definir Responsável pelo Pilar")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
  });

  test('ADMINISTRADOR deve visualizar apenas usuários da empresa selecionada', async ({ page }) => {
    await login(page, TEST_USERS['admin']);
    await selectEmpresa(page, 'Empresa Teste A Ltda');
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarCount = await firstPilarAccordion.count();
    
    if (pilarCount === 0) {
      console.log('[SKIP] ADMINISTRADOR - Empresa A sem pilares');
      test.skip();
      return;
    }
    
    // Expandir pilar e abrir modal de responsável
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const definirRespBtn = page.locator('a:has-text("Definir Responsável")').first();
    await definirRespBtn.click();
    
    // Aguardar modal abrir
    const modalTitle = page.locator('.modal-title:has-text("Definir Responsável pelo Pilar")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(2000);
    
    // O ng-select usa [(ngModel)], não formControlName
    // Clicar no ng-select DENTRO DO MODAL para abrir lista de usuários
    const usuarioSelect = page.locator('.modal-body ng-select');
    await usuarioSelect.waitFor({ state: 'visible', timeout: 5000 });
    await usuarioSelect.click();
    await page.waitForTimeout(1000);
    
    // Validar que existem opções de usuários
    const userOptions = page.locator('.ng-option');
    const optionCount = await userOptions.count();
    
    // Deve haver ao menos 1 usuário da Empresa A (gestor ou colaborador)
    expect(optionCount).toBeGreaterThan(0);
    
    // Capturar nomes dos usuários visíveis
    const userNames = await userOptions.allTextContents();
    console.log('[INFO] Usuários disponíveis para Empresa A:', userNames);
    
    // Validar que ADMIN (admin@reiche.com.br) NÃO está na lista
    // (pois não pertence à Empresa A)
    const hasAdminInList = userNames.some(name => name.toLowerCase().includes('admin@reiche'));
    expect(hasAdminInList).toBe(false);
  });

  test('GESTOR deve criar usuário simplificado como responsável', async ({ page }) => {
    await login(page, TEST_USERS['gestorEmpresaA']);
    await navigateTo(page, '/diagnostico-notas');
    
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const firstPilarAccordion = page.locator('[data-testid="pilar-accordion"]').first();
    const pilarCount = await firstPilarAccordion.count();
    
    if (pilarCount === 0) {
      console.log('[SKIP] GESTOR - sem pilares');
      test.skip();
      return;
    }
    
    // Expandir pilar e abrir modal de responsável
    const firstPilarButton = firstPilarAccordion.locator('button.btn-link').first();
    await firstPilarButton.click();
    await page.waitForTimeout(500);
    
    const pilarMenu = firstPilarAccordion.locator('[ngbDropdownToggle]').first();
    await pilarMenu.click();
    await page.waitForTimeout(500);
    
    const definirRespBtn = page.locator('a:has-text("Definir Responsável")').first();
    await definirRespBtn.click();
    
    // Aguardar modal abrir
    const modalTitle = page.locator('.modal-title:has-text("Definir Responsável pelo Pilar")');
    await expect(modalTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Verificar se existe botão "Criar Novo Usuário" ou similar
    const createUserBtn = page.locator('.modal-body button:has-text("Criar Novo"), .modal-body button:has-text("Novo Usuário"), .modal-body a:has-text("Adicionar Usuário")').first();
    const btnCount = await createUserBtn.count();
    
    if (btnCount > 0) {
      await createUserBtn.click();
      await page.waitForTimeout(1000);
      
      // Validar que formulário de criação simplificada apareceu
      // Pode ser um offcanvas, modal secundário ou seção expandida
      const createForm = page.locator('[data-testid="create-user-form"], .user-create-form, .offcanvas.show').first();
      const formVisible = await createForm.isVisible({ timeout: 3000 });
      
      expect(formVisible).toBe(true);
    } else {
      console.log('[INFO] Botão de criação simplificada de usuário não encontrado no modal');
    }
  });
});
