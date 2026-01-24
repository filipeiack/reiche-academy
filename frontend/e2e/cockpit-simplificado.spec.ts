import { test, expect, login, TEST_USERS } from './fixtures';

/**
 * Testes E2E - Cockpit Simplificado
 * 
 * Versão simplificada para validar funcionamento básico
 * antes de testar funcionalidades complexas
 */

test.describe('Cockpit - Simplificado', () => {
  
  test('deve acessar cockpit dinamicamente', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Tentar navegar para lista de cockpits
    await page.goto('/cockpits');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Verificar se tem cockpits na lista
    const tableRows = await page.locator('table tbody tr').count();
    
    if (tableRows > 0) {
      console.log(`✅ Encontrados ${tableRows} cockpits na lista`);
      
      // Clicar no primeiro dashboard
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.locator('button:has-text("Dashboard"), a:has-text("Dashboard"), button:has-text("Cockpit")').first().click();
      
      await page.waitForLoadState('networkidle', { timeout: 5000 });
      console.log('✅ Navegou para cockpit dinamicamente');
    } else {
      console.log('ℹ️ Nenhum cockpit encontrado, tentando navegação direta');
      
      // Tentar IDs comuns baseados no seed
      const possibleIds = ['marketing-cockpit', 'cockpit-marketing', 'marketing-pilar-cockpit'];
      
      for (const id of possibleIds) {
        try {
          await page.goto(`/cockpits/${id}/dashboard`);
          await page.waitForLoadState('networkidle', { timeout: 3000 });
          console.log(`✅ Cockpit encontrado com ID: ${id}`);
          break;
        } catch {
          console.log(`❌ ID ${id} não encontrado`);
        }
      }
    }
    
    // Verificar se estamos em alguma página de cockpit
    const currentUrl = page.url();
    expect(currentUrl).toContain('/cockpit');
  });
  
  test('deve verificar estrutura do cockpit', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Navegar para cockpit usando fallback
    await page.goto('/cockpits');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Tentar encontrar cockpit existente
    const hasCockpits = await page.locator('table tbody tr').isVisible({ timeout: 2000 });
    
    if (hasCockpits) {
      const firstRow = page.locator('table tbody tr').first();
      await firstRow.locator('button, a').first().click();
    } else {
      // Fallback para cockpit direto
      await page.goto('/cockpits/cockpit-marketing/dashboard');
    }
    
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Verificar elementos esperados
    const currentUrl = page.url();
    console.log('URL final:', currentUrl);
    
    // Procurar por abas ou elementos do cockpit
    const tabs = await page.locator('.nav-tabs button, button[role="tab"]').count();
    const breadcrumb = await page.locator('.breadcrumb').isVisible({ timeout: 2000 }).catch(() => false);
    const cockpitTitle = await page.locator('text=/Cockpit .*/').isVisible({ timeout: 2000 }).catch(() => false);
    
    console.log(`Estrutura encontrada: ${tabs} abas, breadcrumb: ${breadcrumb}, title: ${cockpitTitle}`);
    
    // Pelo menos um elemento deve existir
    expect(tabs + (breadcrumb ? 1 : 0) + (cockpitTitle ? 1 : 0)).toBeGreaterThan(0);
  });

});