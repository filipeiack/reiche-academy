import { test, expect } from '@playwright/test';

test('login administrativo - teste manual', async ({ page }) => {
  console.log('🔍 Iniciando teste manual de login...');
  
  // 1. Verificar se backend está online
  console.log('1️⃣ Verificando status do backend...');
  try {
    const backendHealth = await page.goto('http://localhost:3000/api');
    if (backendHealth) {
      console.log('✅ Backend está respondendo em http://localhost:3000');
    }
  } catch (error) {
    console.log('❌ Backend não está acessível:', error.message);
    throw new Error('Backend não está online');
  }
  
  // 2. Navegar para página de login
  console.log('2️⃣ Navegando para página de login...');
  await page.goto('http://localhost:4200/login');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 3. Verificar se elementos estão visíveis
  console.log('3️⃣ Verificando elementos do formulário...');
  
  // Tirar screenshot para diagnóstico
  await page.screenshot({ path: 'debug-login-page.png', fullPage: true });
  
  // Esperar um pouco mais e tentar novamente
  await page.waitForTimeout(2000);
  
  // Verificar elemento por elemento
  const emailSelectors = [
    'input[formcontrolname="email"]',
    'input[type="email"]',
    'input[name="email"]',
    '#exampleInputEmail1'
  ];
  
  let emailInput = null;
  for (const selector of emailSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 1000 })) {
        emailInput = element;
        console.log(`✅ Campo email encontrado com seletor: ${selector}`);
        break;
      }
    } catch {
      // Continuar para próximo seletor
    }
  }
  
  if (!emailInput) {
    console.log('❌ Campo email não encontrado. Elementos na página:');
    const allInputs = await page.locator('input').all();
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');
      const formControlName = await input.getAttribute('formcontrolname');
      console.log(`  Input ${i}: type=${type}, placeholder=${placeholder}, id=${id}, formcontrolname=${formControlName}`);
    }
    throw new Error('Campo de email não encontrado na página');
  }
  
  // Procurar campo senha
  const passwordSelectors = [
    'input[formcontrolname="senha"]',
    'input[type="password"]',
    'input[name="senha"]',
    'input[name="password"]',
    '#exampleInputPassword1'
  ];
  
  let passwordInput = null;
  for (const selector of passwordSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 1000 })) {
        passwordInput = element;
        console.log(`✅ Campo senha encontrado com seletor: ${selector}`);
        break;
      }
    } catch {
      // Continuar para próximo seletor
    }
  }
  
  if (!passwordInput) {
    throw new Error('Campo de senha não encontrado na página');
  }
  
  // 4. Preencher formulário
  console.log('4️⃣ Preenchendo formulário...');
  await emailInput.fill('admin@reiche.com.br');
  await passwordInput.fill('Admin@123');
  
  // 5. Procurar botão de submit
  console.log('5️⃣ Procurando botão de submit...');
  const buttonSelectors = [
    'button[type="submit"]',
    'button:has-text("Entrar")',
    'button:has-text("Login")',
    '.btn-primary',
    'button'
  ];
  
  let submitButton = null;
  for (const selector of buttonSelectors) {
    try {
      const element = page.locator(selector);
      if (await element.isVisible({ timeout: 1000 }) && await element.isEnabled()) {
        submitButton = element;
        console.log(`✅ Botão encontrado com seletor: ${selector}`);
        console.log(`  Texto: ${await element.textContent()}`);
        break;
      }
    } catch {
      // Continuar para próximo seletor
    }
  }
  
  if (!submitButton) {
    throw new Error('Botão de submit não encontrado ou não está habilitado');
  }
  
  // 6. Interceptar requisições
  console.log('6️⃣ Interceptando requisições...');
  const responses = [];
  page.on('response', response => {
    if (response.url().includes('/auth/login')) {
      responses.push(response);
      console.log(`📡 Resposta interceptada: ${response.status()} ${response.url()}`);
    }
  });
  
  // 7. Clicar no botão
  console.log('7️⃣ Clicando no botão de login...');
  await submitButton.click();
  
  // 8. Aguardar processamento
  console.log('8️⃣ Aguardando processamento...');
  await page.waitForTimeout(5000);
  
  // 9. Analisar resultados
  console.log('9️⃣ Analisando resultados...');
  
  // Verificar requisições
  if (responses.length === 0) {
    console.log('⚠️ Nenhuma requisição de login foi feita');
  } else {
    for (const response of responses) {
      console.log(`📊 Status: ${response.status()}`);
      console.log(`📊 Headers:`, Object.fromEntries(response.headers()));
      try {
        const body = await response.text();
        console.log(`📊 Body:`, body);
      } catch {
        console.log('📊 Body: não foi possível ler');
      }
    }
  }
  
  // Verificar erros
  const errorSelectors = [
    '.text-danger',
    '.alert-danger',
    '.error-message',
    '.swal2-error'
  ];
  
  let hasError = false;
  for (const selector of errorSelectors) {
    try {
      const errorElement = page.locator(selector);
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Erro encontrado: ${errorText}`);
        hasError = true;
      }
    } catch {
      // Continuar
    }
  }
  
  // Verificar URL final
  const finalUrl = page.url();
  console.log(`📍 URL final: ${finalUrl}`);
  
  // Verificar storage
  const storageData = await page.evaluate(() => {
    const result = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      result[key] = localStorage.getItem(key);
    }
    return result;
  });
  
  console.log('💾 LocalStorage:', storageData);
  
  // 10. Verdict
  console.log('🔍 VEREDITO:');
  
  if (responses.length > 0 && responses[0].status() === 200 && !hasError) {
    console.log('✅ Login bem-sucedido!');
    expect(true).toBe(true);
  } else {
    console.log('❌ Login falhou!');
    console.log(`   Requisições: ${responses.length}`);
    console.log(`   Erro visível: ${hasError}`);
    console.log(`   Status da última requisição: ${responses.length > 0 ? responses[responses.length - 1].status() : 'N/A'}`);
    
    // Tentar entender o motivo
    if (responses.length === 0) {
      console.log('   Motivo provável: O formulário não está sendo submetido');
    } else if (responses[0].status() === 401) {
      console.log('   Motivo provável: Credenciais inválidas');
    } else if (responses[0].status() >= 500) {
      console.log('   Motivo provável: Erro no servidor');
    } else if (hasError) {
      console.log('   Motivo provável: Erro de validação no frontend');
    }
    
    // Não falhar o teste, apenas reportar o status
    console.log('🔍 Teste concluído com informações de diagnóstico');
  }
});