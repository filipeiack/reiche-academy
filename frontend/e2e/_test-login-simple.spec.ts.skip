import { test, expect } from '@playwright/test';

test('login simples com admin', async ({ page }) => {
  // Ativar logs de console
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  console.log('\n=== INÍCIO DO TESTE ===');
  
  // 1. Navegar para login
  console.log('1. Navegando para /login...');
  await page.goto('http://localhost:4200/login');
  await page.waitForLoadState('networkidle');
  console.log('✓ Página carregada');
  
  // 2. Verificar se campos existem
  console.log('\n2. Procurando campos do formulário...');
  
  const emailInput = page.locator('[formControlName="email"]');
  const senhaInput = page.locator('[formControlName="senha"]');
  const submitButton = page.locator('button[type="submit"]');
  
  const emailCount = await emailInput.count();
  const senhaCount = await senhaInput.count();
  const buttonCount = await submitButton.count();
  
  console.log(`   - Campos email encontrados: ${emailCount}`);
  console.log(`   - Campos senha encontrados: ${senhaCount}`);
  console.log(`   - Botões submit encontrados: ${buttonCount}`);
  
  if (emailCount === 0 || senhaCount === 0 || buttonCount === 0) {
    await page.screenshot({ path: 'test-results/login-campos-nao-encontrados.png', fullPage: true });
    throw new Error('Campos do formulário não encontrados!');
  }
  
  // 3. Preencher campos
  console.log('\n3. Preenchendo formulário...');
  await emailInput.fill('admin@reiche.com.br');
  console.log('   ✓ Email preenchido');
  
  await senhaInput.fill('Admin@123');
  console.log('   ✓ Senha preenchida');
  
  await page.screenshot({ path: 'test-results/login-form-preenchido.png', fullPage: true });
  
  // 4. Submeter formulário
  console.log('\n4. Clicando em submit...');
  
  // Interceptar requisição
  const requestPromise = page.waitForRequest(
    request => request.url().includes('/auth/login'),
    { timeout: 10000 }
  );
  
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/auth/login'),
    { timeout: 10000 }
  );
  
  await submitButton.click();
  console.log('   ✓ Botão clicado');
  
  // 5. Aguardar resposta
  console.log('\n5. Aguardando resposta do backend...');
  
  try {
    const request = await requestPromise;
    console.log('   ✓ Request enviado para:', request.url());
    console.log('   - Method:', request.method());
    console.log('   - Body:', await request.postData());
    
    const response = await responsePromise;
    console.log('   ✓ Response recebido');
    console.log('   - Status:', response.status());
    console.log('   - Status Text:', response.statusText());
    
    const responseBody = await response.json();
    console.log('   - Body:', JSON.stringify(responseBody, null, 2));
    
    await page.screenshot({ path: 'test-results/login-apos-submit.png', fullPage: true });
    
    // 6. Verificar resposta
    console.log('\n6. Verificando resposta...');
    
    if (response.status() === 200 || response.status() === 201) {
      console.log('   ✓ Login bem-sucedido!');
      expect(responseBody).toHaveProperty('accessToken');
      console.log('   ✓ Token presente na resposta');
    } else {
      console.log('   ✗ Login falhou com status:', response.status());
      throw new Error(`Login falhou: ${response.status()} - ${JSON.stringify(responseBody)}`);
    }
    
    // 7. Verificar localStorage
    console.log('\n7. Verificando localStorage...');
    await page.waitForTimeout(1000);
    
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log('   - Token no localStorage:', token ? 'PRESENTE' : 'AUSENTE');
    
    if (token) {
      console.log('   ✓ Token salvo no localStorage');
    }
    
    // 8. Verificar redirecionamento
    console.log('\n8. Verificando URL...');
    await page.waitForTimeout(2000);
    const finalUrl = page.url();
    console.log('   - URL final:', finalUrl);
    
    await page.screenshot({ path: 'test-results/login-final.png', fullPage: true });
    
    console.log('\n=== TESTE CONCLUÍDO COM SUCESSO ===\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error);
    await page.screenshot({ path: 'test-results/login-erro.png', fullPage: true });
    throw error;
  }
});
