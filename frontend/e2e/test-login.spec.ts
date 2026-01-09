import { test, expect } from './fixtures';

/**
 * E2E Tests - Login
 * 
 * Testes de autenticação básica
 * 
 * Agente: QA_E2E_Interface
 * Data: 2026-01-09
 */
test.describe('Login', () => {
  test('deve fazer login com credenciais válidas', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    
    // Aguardar página carregar
    await page.waitForLoadState('networkidle');
    
    // Preencher credenciais
    await page.fill('[formControlName="email"]', 'admin@reiche.com.br');
    await page.fill('[formControlName="senha"]', 'Admin@123');
    
    // Submeter formulário
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Aguardar redirecionamento (login bem-sucedido)
    await page.waitForURL(/^(?!.*login).*$/, { timeout: 10000 });
    
    // Aguardar um pouco para token ser salvo
    await page.waitForTimeout(1000);

    // Validar que token foi armazenado (pode ser 'access_token' ou 'token')
    const token = await page.evaluate(() => {
      return localStorage.getItem('access_token') || localStorage.getItem('token') || sessionStorage.getItem('access_token');
    });
    expect(token).toBeTruthy();
  });

  test('deve rejeitar credenciais inválidas', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    await page.waitForLoadState('networkidle');
    
    // Preencher credenciais inválidas
    await page.fill('[formControlName="email"]', 'invalido@test.com');
    await page.fill('[formControlName="senha"]', 'SenhaErrada123');
    
    // Submeter
    await page.click('button[type="submit"]');
    
    // Aguardar tentativa de login
    await page.waitForTimeout(2000);
    
    // Validar que continua na página de login (não redirecionou)
    expect(page.url()).toContain('/login');
    
    // E não tem token
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    expect(token).toBeFalsy();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    await page.waitForLoadState('networkidle');
    
    // Tentar submeter sem preencher
    const submitButton = page.locator('button[type="submit"]');
    
    // Validar que botão está desabilitado OU formulário está inválido
    const isDisabled = await submitButton.isDisabled().catch(() => false);
    
    if (!isDisabled) {
      // Se botão não está desabilitado, clicar e validar que não redireciona
      await submitButton.click();
      await page.waitForTimeout(1000);
      
      // Deve continuar na página de login
      expect(page.url()).toContain('/login');
    } else {
      // Botão desabilitado = validação OK
      expect(isDisabled).toBeTruthy();
    }
  });
});
