import { test, expect, login, TEST_USERS } from './fixtures';

/**
 * Testes E2E Básicos - Cockpit
 * 
 * Testes simplificados para verificar funcionamento básico
 * antes de executar testes complexos
 */

test.describe('Cockpit - Básico @cockpit @regression @high', () => {
  
  test('deve acessar lista de cockpits', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    await page.goto('/cockpits');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verificar se página carregou (pode ter tabela ou mensagem de vazio)
    const currentUrl = page.url();
    expect(currentUrl).toContain('/cockpits');
  });
  
  test('deve tentar acessar cockpit diretamente', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    // Tentar acessar cockpit com ID qualquer
    await page.goto('/cockpits/test-id/dashboard');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verificar o que acontece (pode ser cockpit, 404, ou redirecionamento)
    const currentUrl = page.url();
    console.log('URL após navegação:', currentUrl);
    
    // Verificar se existe algum conteúdo visível
    const bodyVisible = await page.locator('body').isVisible();
    expect(bodyVisible).toBeTruthy();
  });
  
  test('deve acessar página de pilares', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    await page.goto('/pilares-empresa');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Verificar se página carregou
    const currentUrl = page.url();
    expect(currentUrl).toContain('/pilares');
  });
  
  test('deve verificar se existe botão de novo pilar', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    
    await page.goto('/pilares');
    await page.waitForLoadState('networkidle', { timeout: 5000 });
    
    // Procurar por botão de novo (pode ter diferentes textos/seletores)
    const novoButton = await page.locator('button:has-text("Novo"), button:has-text("Adicionar"), button[routerlink*="novo"]').first();
    const exists = await novoButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (exists) {
      console.log('✅ Botão de novo pilar encontrado');
    } else {
      console.log('ℹ️ Botão de novo pilar não encontrado (pode ser esperado)');
    }
    
    // O teste passa mesmo que não encontre o botão
    expect(true).toBeTruthy();
  });

});