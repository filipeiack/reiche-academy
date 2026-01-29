import { test, expect } from '@playwright/test';

test.skip('login administrativo - teste de API direta @auth @legacy @high', async ({ page }) => {
  console.log('🔍 Testando login via API direta...');
  
  // 1. Testar login via API diretamente
  const apiResponse = await page.evaluate(async () => {
    try {
      console.log('Tentando fetch para API...');
      
      // Primeiro, vamos tentar verificar se o backend está respondendo
      const healthCheck = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          email: 'admin@reiche.com.br',
          senha: 'Admin@123'
        })
      });
      
      console.log('Status da resposta:', healthCheck.status);
      console.log('Headers:', Object.fromEntries(healthCheck.headers.entries()));
      
      if (!healthCheck.ok) {
        const errorText = await healthCheck.text();
        console.log('Corpo do erro:', errorText);
        return { 
          status: healthCheck.status, 
          error: errorText,
          headers: Object.fromEntries(healthCheck.headers.entries())
        };
      }
      
      const data = await healthCheck.json();
      return { status: healthCheck.status, data };
    } catch (error) {
      console.log('Erro no fetch:', error);
      return { error: error.message, stack: error.stack };
    }
  });
  
  console.log('✅ Resposta da API:', JSON.stringify(apiResponse, null, 2));
  
  // Verificar se API retornou sucesso
  expect(apiResponse.status).toBe(200);
  expect(apiResponse.data.accessToken).toBeTruthy();
  expect(apiResponse.data.usuario.email).toBe('admin@reiche.com.br');
  expect(apiResponse.data.usuario.perfil.codigo).toBe('ADMINISTRADOR');
  
  console.log('✅ Login via API funciona corretamente');
  
  // 2. Tentar login via interface do usuário
  console.log('🔍 Testando login via interface...');
  
  await page.goto('http://localhost:4200/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // Preencher formulário
  await page.fill('input[formcontrolname="email"]', 'admin@reiche.com.br');
  await page.fill('input[formcontrolname="senha"]', 'Admin@123');
  
  // Interceptar requisições de rede
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('/auth/login')) {
      responses.push({
        url: response.url(),
        status: response.status(),
        headers: response.headers()
      });
    }
  });
  
  // Clicar no botão de login
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  
  // Verificar requisições interceptadas
  console.log('📡 Requisições interceptadas:', responses.length);
  for (const resp of responses) {
    console.log(`  - ${resp.url}: ${resp.status}`);
    console.log(`  Headers: ${JSON.stringify(resp.headers, null, 2)}`);
  }
  
  // Verificar se houve erro
  const errorElement = page.locator('.text-danger');
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log(`❌ Erro na interface: ${errorText}`);
  } else {
    console.log('✅ Nenhum erro visível na interface');
  }
  
  // Verificar URL atual
  const currentUrl = page.url();
  console.log(`📍 URL atual: ${currentUrl}`);
  
  // Verificar tokens no storage
  const token = await page.evaluate(() => localStorage.getItem('access_token') || sessionStorage.getItem('access_token'));
  const user = await page.evaluate(() => {
    const userStr = localStorage.getItem('current_user') || sessionStorage.getItem('current_user');
    return userStr ? JSON.parse(userStr) : null;
  });
  
  console.log(`🔑 Token presente: ${!!token}`);
  console.log(`👤 Usuário: ${user ? JSON.stringify(user, null, 2) : 'null'}`);
  
  // Verificar status final
  if (token && user) {
    console.log('✅ Login bem-sucedido via interface');
    expect(user.email).toBe('admin@reiche.com.br');
    expect(user.perfil.codigo).toBe('ADMINISTRADOR');
  } else {
    console.log('❌ Login falhou via interface');
    
    // Investigar se há diferença entre as requisições
    if (responses.length === 0) {
      console.log('⚠️ Nenhuma requisição de login interceptada - problema no frontend');
    } else {
      console.log('⚠️ Requisição foi feita mas falhou - verificar corpo da requisição');
    }
  }
});