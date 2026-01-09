import { test, expect } from '@playwright/test';

/**
 * Teste básico de login - versão debug sem esperar backend
 */
test.describe('Teste de Login - Debug', () => {
  test('deve preencher formulário e clicar em login', async ({ page }) => {
    // Configurar console listener
    page.on('console', msg => console.log('Browser:', msg.text()));
    
    await page.goto('http://localhost:4200/login');
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle');
    
    // Screenshot inicial
    await page.screenshot({ path: 'test-results/1-pagina-login.png' });
    console.log('✅ Página de login carregada');
    
    // Preencher email
    const emailInput = page.locator('[formControlName="email"]');
    await emailInput.waitFor({ state: 'visible', timeout: 5000 });
    await emailInput.fill('admin@reiche.com.br');
    console.log('✅ Email preenchido');
    
    // Preencher senha
    const senhaInput = page.locator('[formControlName="senha"]');
    await senhaInput.waitFor({ state: 'visible', timeout: 5000 });
    await senhaInput.fill('Admin@123');
    console.log('✅ Senha preenchida');
    
    // Screenshot com formulário preenchido
    await page.screenshot({ path: 'test-results/2-form-preenchido.png' });
    
    // Verificar se botão está habilitado
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.waitFor({ state: 'visible' });
    const isDisabled = await submitButton.isDisabled();
    console.log('Botão desabilitado?', isDisabled);
    
    // Clicar no botão
    console.log('🔄 Clicando no botão de login...');
    await submitButton.click();
    
    // Aguardar um pouco para ver o que acontece
    await page.waitForTimeout(3000);
    
    // Screenshot após submit
    await page.screenshot({ path: 'test-results/3-apos-submit.png' });
    
    // Verificar URL atual
    const currentUrl = page.url();
    console.log('📍 URL após click:', currentUrl);
    
    // Verificar se há mensagens de erro
    const errorMessages = page.locator('.text-danger, .alert-danger, .toast.bg-danger, .invalid-feedback');
    const errorCount = await errorMessages.count();
    
    if (errorCount > 0) {
      console.log('❌ Erros encontrados:');
      for (let i = 0; i < errorCount; i++) {
        const text = await errorMessages.nth(i).textContent();
        if (text && text.trim()) {
          console.log(`  - ${text.trim()}`);
        }
      }
    } else {
      console.log('✅ Nenhum erro visível na página');
    }
    
    // Verificar se há loading/spinner
    const spinner = page.locator('.spinner-border');
    const hasSpinner = await spinner.count() > 0;
    console.log('Loading spinner:', hasSpinner ? 'Visível' : 'Não visível');
    
    // Verificar localStorage
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    console.log('🔑 Token no localStorage:', token ? 'Presente ✅' : 'Ausente ❌');
    
    // Verificar se form é válido
    const formValidity = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form ? {
        valid: form.checkValidity(),
        email: (document.querySelector('[formControlName="email"]') as HTMLInputElement)?.value,
        senha: (document.querySelector('[formControlName="senha"]') as HTMLInputElement)?.value?.length > 0 ? '***' : 'vazio'
      } : null;
    });
    console.log('📝 Form validity:', formValidity);
    
    // Screenshot final
    await page.screenshot({ path: 'test-results/4-final.png' });
    
    // Teste passa se conseguiu preencher formulário
    expect(formValidity?.email).toBe('admin@reiche.com.br');
  });
});
