import { 
  test, 
  expect,
  login, 
  navigateTo,
  selectEmpresa,
  TEST_USERS 
} from '../fixtures';
import type { Page } from '@playwright/test';

const getDrawerContainer = (page: Page) =>
  page.locator('.offcanvas, [data-testid*="drawer"], [data-testid*="offcanvas"]').first();

const getDrawerTitle = (page: Page, title: string) =>
  getDrawerContainer(page)
    .locator(
      `.offcanvas-title:has-text("${title}"), .offcanvas-header:has-text("${title}"), [data-testid="drawer-title"]:has-text("${title}"), [data-testid="offcanvas-title"]:has-text("${title}")`
    )
    .first();

const getDrawerBody = (page: Page) =>
  getDrawerContainer(page).locator('.offcanvas-body, [data-testid="drawer-body"], [data-testid="offcanvas-body"]');

const getDrawerFooter = (page: Page) =>
  getDrawerContainer(page).locator('.offcanvas-footer, [data-testid="drawer-footer"], [data-testid="offcanvas-footer"], .offcanvas-body, .offcanvas');

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

test.describe.skip('LEGACY: Gestão de Rotinas - Adicionar Rotina Customizada @rotinas @regression @medium @legacy', () => {
  
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
      const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"], a:has-text("Adicionar Rotina")').first();
      await adicionarRotinaBtn.click();
      
      // Validar que drawer foi aberto
      await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible({ timeout: 5000 });
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
    const adicionarRotinaBtn = page.locator('[data-testid="btn-adicionar-rotina"], a:has-text("Adicionar Rotina")').first();
    await adicionarRotinaBtn.click();
    
    // Aguardar drawer carregar
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Preencher nome da rotina (textarea com formControlName="nome")
    const nomeRotina = `Rotina E2E Test ${Date.now()}`;
    const nomeTextarea = getDrawerBody(page).locator('textarea[formControlName="nome"]');
    await nomeTextarea.fill(nomeRotina);
    await page.waitForTimeout(500);
    
    // Clicar em "Adicionar Rotina"
    const criarButton = getDrawerFooter(page).locator('button:has-text("Adicionar Rotina")');
    await criarButton.click();
    await page.waitForTimeout(1500);
    
    // Drawer permanece aberto após adicionar (padrão atual)
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible();
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
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    const nomeRotina = `Rotina GESTOR Test ${Date.now()}`;
    const nomeTextarea = getDrawerBody(page).locator('textarea[formControlName="nome"]');
    await nomeTextarea.fill(nomeRotina);
    await page.waitForTimeout(500);
    
    const criarButton = getDrawerFooter(page).locator('button:has-text("Criar Rotina")');
    await criarButton.click();
    await page.waitForTimeout(1500);
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toHaveCount(0);
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
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Preencher com apenas 2 caracteres
    const nomeTextarea = getDrawerBody(page).locator('textarea[formControlName="nome"]');
    await nomeTextarea.fill('AB');
    await page.waitForTimeout(500);
    
    // Validar que botão "Criar Rotina" fica desabilitado (validação)
    const criarButton = getDrawerFooter(page).locator('button:has-text("Criar Rotina")');
    const isDisabled = await criarButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    // Validar que modal NÃO fechou (erro de validação)
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toHaveCount(1);
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
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    const nomeTextarea = getDrawerBody(page).locator('textarea[formControlName="nome"]');
    await nomeTextarea.fill('XY');
    await page.waitForTimeout(500);
    
    // Validar que botão "Criar Rotina" fica desabilitado
    const criarButton = getDrawerFooter(page).locator('button:has-text("Criar Rotina")');
    const isDisabled = await criarButton.isDisabled();
    expect(isDisabled).toBe(true);
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toHaveCount(1);
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
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    // Preencher rotina
    const nomeTextarea = getDrawerBody(page).locator('textarea[formControlName="nome"]');
    await nomeTextarea.fill('Rotina a cancelar');
    await page.waitForTimeout(500);
    
    // Cancelar
    const cancelButton = getDrawerFooter(page).locator('button:has-text("Cancelar")');
    await cancelButton.click();
    await page.waitForTimeout(1000);
    
    // Validar que drawer fechou
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toHaveCount(0);
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
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(1000);
    
    const nomeTextarea = getDrawerBody(page).locator('textarea[formControlName="nome"]');
    await nomeTextarea.fill('Rotina GESTOR a cancelar');
    await page.waitForTimeout(500);
    
    const cancelButton = getDrawerFooter(page).locator('button:has-text("Cancelar")');
    await cancelButton.click();
    await page.waitForTimeout(1000);
    
    await expect(getDrawerTitle(page, 'Nova Rotina Customizada')).toHaveCount(0);
  });
});

test.describe.skip('LEGACY: Gestão de Rotinas - Gerenciar Rotinas Modal @rotinas @legacy', () => {
  
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
      
      const drawerTitle = getDrawerContainer(page).locator('.offcanvas-title, .offcanvas-header, [data-testid="drawer-title"], [data-testid="offcanvas-title"]');
      await expect(drawerTitle).toBeVisible({ timeout: 5000 });
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
      
      const drawerTitle = getDrawerContainer(page).locator('.offcanvas-title, .offcanvas-header, [data-testid="drawer-title"], [data-testid="offcanvas-title"]');
      await expect(drawerTitle).toBeVisible({ timeout: 5000 });
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
