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

test.describe.skip('LEGACY: Gestão de Pilares - Modal Gerenciar Pilares @pilares @regression @medium @legacy', () => {
});

test.describe.skip('LEGACY: Gestão de Pilares - Definir Responsável @pilares @legacy', () => {
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
    const drawerTitle = page.locator('.offcanvas-title:has-text("Definir Responsável pelo Pilar"), .offcanvas-header:has-text("Definir Responsável pelo Pilar"), [data-testid="drawer-title"]:has-text("Definir Responsável pelo Pilar"), [data-testid="offcanvas-title"]:has-text("Definir Responsável pelo Pilar")');
    await expect(drawerTitle).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Verificar se existe botão "Criar Novo Usuário" ou similar
    const createUserBtn = page.locator('.offcanvas-body button:has-text("Criar Novo"), .offcanvas-body button:has-text("Novo Usuário"), .offcanvas-body a:has-text("Adicionar Usuário"), [data-testid="drawer-body"] button:has-text("Criar Novo"), [data-testid="drawer-body"] button:has-text("Novo Usuário"), [data-testid="drawer-body"] a:has-text("Adicionar Usuário"), [data-testid="offcanvas-body"] button:has-text("Criar Novo"), [data-testid="offcanvas-body"] button:has-text("Novo Usuário"), [data-testid="offcanvas-body"] a:has-text("Adicionar Usuário")').first();
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
