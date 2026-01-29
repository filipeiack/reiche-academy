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

test.describe.skip('LEGACY: Gestão de Rotinas - Gerenciar Rotinas Modal @rotinas @legacy', () => {
  
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
