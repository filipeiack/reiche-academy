import { test, expect } from '@playwright/test';

test.skip('login administrativo - fluxo completo @auth @legacy @high', async ({ page }) => {
  // 1. Navegar para página de login
  await page.goto('http://localhost:4200/login');
  
  // Aguardar página carregar completamente
  await page.waitForLoadState('networkidle');
  
  // Verificar se página de login carrega corretamente
  await expect(page).toHaveURL(/.*login/);
  
  // Aguardar um pouco mais para Angular carregar
  await page.waitForTimeout(3000);
  
  // Tentar diferentes seletores para elementos do formulário
  const emailInput = page.locator('input[formcontrolname="email"]');
  const passwordInput = page.locator('input[formcontrolname="senha"]');
  const submitButton = page.locator('button[type="submit"]');
  
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submitButton).toBeVisible();
  
  // 2. Inserir credenciais administrativas
  await emailInput.fill('admin@reiche.com.br');
  await passwordInput.fill('Admin@123');
  
  // Capturar antes do clique para debug
  console.log('Formulário preenchido, clicando no botão...');
  
  // 3. Clicar no botão de login
  await submitButton.click();
  
  // 4. Aguardar processamento e verificar se há mensagens de erro
  await page.waitForTimeout(2000);
  
  // Verificar se há mensagens de erro na tela
  const errorElement = page.locator('.text-danger');
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log(`❌ Erro de login: ${errorText}`);
    
    // Se houver erro, vamos investigar o que foi enviado para a API
    // Vamos interceptar a requisição para debug
    console.log('Investigando requisição de login...');
    
    // Tentar login direto via API para confirmar credenciais
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'admin@reiche.com.br',
            senha: 'Admin@123'
          })
        });
        const data = await response.json();
        return { status: response.status, data };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Resposta da API:', JSON.stringify(apiResponse, null, 2));
    
    throw new Error(`Login falhou: ${errorText}`);
  }
  
  // Verificar se ainda está carregando
  const loadingElement = page.locator('.spinner-border');
  if (await loadingElement.isVisible()) {
    console.log('Aguardando carregamento...');
    await loadingElement.waitFor({ state: 'hidden', timeout: 5000 });
  }
  
  // Aguardar mais um pouco para processamento final
  await page.waitForTimeout(2000);
  
  // Verificar URL atual após login
  const currentUrl = page.url();
  console.log(`URL após login: ${currentUrl}`);
  
  // Verificar se login foi bem-sucedido por outros meios
  // 5. Validar localStorage para autenticação
  const token = await page.evaluate(() => localStorage.getItem('access_token'));
  const refreshToken = await page.evaluate(() => localStorage.getItem('refresh_token'));
  const userInfo = await page.evaluate(() => {
    const userStr = localStorage.getItem('user_info') || localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  });
  
  console.log(`Token presente: ${!!token}`);
  console.log(`Refresh token presente: ${!!refreshToken}`);
  console.log(`Info usuário: ${userInfo ? JSON.stringify(userInfo) : 'null'}`);
  
  // Verificar se estamos autenticados
  const isAuthenticated = !!(token && userInfo);
  
  if (!isAuthenticated) {
    // Tentar verificar se houve erro de login
    const errorElement = page.locator('.error, .alert-danger, .swal2-error, .toast-error');
    if (await errorElement.isVisible()) {
      const errorText = await errorElement.textContent();
      console.log(`Erro de login: ${errorText}`);
    }
    
    // Verificar se ainda está na página de login
    if (page.url().includes('login')) {
      throw new Error('Falha na autenticação - usuário ainda na página de login');
    }
  }
  
  expect(isAuthenticated).toBe(true);
  expect(userInfo?.email).toBe('admin@reiche.com.br');
  expect(['ADMINISTRADOR', 'ADMIN']).toContain(userInfo?.perfil);
  
  // Se autenticado, verificar dashboard
  if (isAuthenticated) {
    // Tentar navegar para o dashboard se não redirecionado
    if (!page.url().includes('dashboard')) {
      await page.goto('http://localhost:4200/dashboard');
      await page.waitForLoadState('networkidle');
    }
    
    // Verificar elementos do dashboard
    const dashboardElements = [
      'h1', '.dashboard-title', '.page-title', '.card', '.table'
    ];
    
    let dashboardLoaded = false;
    for (const selector of dashboardElements) {
      try {
        await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
        dashboardLoaded = true;
        break;
      } catch {
        // Continuar para próximo seletor
      }
    }
    
    console.log('✅ Login administrativo executado com sucesso');
    console.log(`✅ Token JWT: ${token?.substring(0, 20)}...`);
    console.log(`✅ Perfil: ${userInfo?.perfil}`);
    console.log(`✅ Dashboard carregado: ${dashboardLoaded}`);
    console.log(`✅ URL final: ${page.url()}`);
  }
});