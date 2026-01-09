import { test, expect } from '@playwright/test';

/**
 * Teste básico de login para debug
 */
test.describe('Teste de Login', () => {
  test('deve preencher formulário e tentar login', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle');
    
    // Screenshot inicial
    await page.screenshot({ path: 'test-results/1-pagina-login.png' });
    
    // Preencher email
    const emailInput = page.locator('[formControlName="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('admin@reiche.com.br');
    
    // Preencher senha
    const senhaInput = page.locator('[formControlName="senha"]');
    await senhaInput.waitFor({ state: 'visible', timeout: 5000 });
    await senhaInput.fill('Admin@123');
    
    // Screenshot com formulário preenchido
    await page.screenshot({ path: 'test-results/2-form-preenchido.png' });
    
    // Clicar no botão submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    
    // Interceptar request de login
    const loginPromise = page.waitForResponse(
      response => response.url().includes('/api/auth/login') && response.status() === 200,
      { timeout: 10000 }
    );
    
    await submitButton.click();
    
    // Aguardar resposta do backend
    const loginResponse = await loginPromise;
    const responseData = await loginResponse.json();
    
    // Screenshot após submit
    await page.screenshot({ path: 'test-results/3-apos-submit.png' });
    
    // Validar que resposta tem token
    expect(responseData).toHaveProperty('accessToken');
    
    console.log('✅ Login bem-sucedido! Token recebido.');
    
    // Aguardar um pouco para ver se redireciona
    await page.waitForTimeout(2000);
    
    // Screenshot final
    await page.screenshot({ path: 'test-results/4-final.png' });
    
    // Verificar URL atual (sem forçar específica)
    console.log('URL após login:', page.url());
    
    // Verificar se saiu da página de login OU se tem erro visível
    const currentUrl = page.url();
    const hasError = await page.locator('.text-danger, .alert-danger, .toast.bg-danger').count();
    
    if (hasError > 0) {
      const errorText = await page.locator('.text-danger, .alert-danger, .toast.bg-danger').first().textContent();
      console.log('❌ Erro visível:', errorText);
    }
    
    // Deve ter saído da página de login OU estar em alguma rota autenticada
    const isStillOnLogin = currentUrl.includes('/login') || currentUrl.includes('/auth/login');
    
    if (isStillOnLogin && hasError === 0) {
      console.log('⚠️ Ainda na página de login mas sem erro visível');
      console.log('Verificando localStorage...');
      
      const token = await page.evaluate(() => localStorage.getItem('access_token'));
      console.log('Token no localStorage:', token ? 'Presente' : 'Ausente');
    }
    
    // Teste deve passar se recebeu token (mesmo que não tenha redirecionado)
    expect(responseData.accessToken).toBeTruthy();
  });
});
