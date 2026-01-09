import { test, expect } from '../fixtures';
import { 
  login, 
  navigateTo, 
  fillFormField, 
  submitForm, 
  TEST_USERS 
} from '../fixtures';

/**
 * Debug - Wizard de Empresas
 */
test.describe('Debug Wizard Empresas', () => {
  test('debug - criar empresa simples', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/empresas/nova');
    await page.waitForTimeout(1000);

    console.log('=== DEBUG: CRIAR EMPRESA ===');
    
    // Verificar se etapa 1 está visível
    const step1 = await page.locator('[data-testid="wizard-step-1"]').isVisible();
    console.log('Etapa 1 visível:', step1);
    
    // Gerar CNPJ único
    const timestamp = Date.now();
    const cnpjNumeros = timestamp.toString().slice(-8) + '000199';
    console.log('CNPJ gerado:', cnpjNumeros);
    
    // Preencher campos
    await fillFormField(page, 'nome', `Empresa Debug ${timestamp}`);
    console.log('✓ Nome preenchido');
    
    await fillFormField(page, 'cnpj', cnpjNumeros);
    await page.waitForTimeout(300);
    console.log('✓ CNPJ preenchido');
    
    const cnpjValue = await page.locator('[formControlName="cnpj"]').inputValue();
    console.log('CNPJ com máscara:', cnpjValue);
    
    await fillFormField(page, 'cidade', 'São Paulo');
    console.log('✓ Cidade preenchida');
    
    await page.selectOption('[formControlName="estado"]', 'SP');
    console.log('✓ Estado selecionado');
    
    // Verificar se formulário está válido
    const submitBtn = page.locator('button[type="submit"]');
    const isDisabled = await submitBtn.isDisabled();
    console.log('Botão submit desabilitado:', isDisabled);
    
    if (!isDisabled) {
      console.log('Clicando em submit...');
      await submitBtn.click();
      
      // Aguardar um pouco
      await page.waitForTimeout(3000);
      
      // Verificar SweetAlert
      const swalCount = await page.locator('.swal2-popup').count();
      console.log('SweetAlerts visíveis:', swalCount);
      
      if (swalCount > 0) {
        const swalTitle = await page.locator('.swal2-title').textContent();
        console.log('SweetAlert título:', swalTitle);
        
        const hasError = await page.locator('.swal2-error').count();
        const hasSuccess = await page.locator('.swal2-success').count();
        console.log('Tem erro:', hasError > 0);
        console.log('Tem sucesso:', hasSuccess > 0);
      }
      
      // Verificar URL
      console.log('URL atual:', page.url());
      
      // Verificar se etapa 2 está visível
      const step2Count = await page.locator('[data-testid="wizard-step-2"]').count();
      console.log('Etapa 2 presente:', step2Count > 0);
      
      if (step2Count > 0) {
        const step2Visible = await page.locator('[data-testid="wizard-step-2"]').isVisible();
        console.log('Etapa 2 visível:', step2Visible);
      } else {
        console.log('Etapa 2 NÃO encontrada no DOM');
        
        // Verificar se ainda está na etapa 1
        const step1StillVisible = await page.locator('[data-testid="wizard-step-1"]').isVisible();
        console.log('Ainda na etapa 1:', step1StillVisible);
      }
      
      // Screenshot para análise
      await page.screenshot({ path: 'test-results/debug-empresa-final.png', fullPage: true });
      console.log('Screenshot salvo em test-results/debug-empresa-final.png');
    } else {
      console.log('❌ Botão submit está desabilitado - formulário inválido');
      
      // Verificar erros de validação
      const errors = await page.locator('.invalid-feedback.d-block').allTextContents();
      console.log('Erros de validação:', errors);
    }
    
    console.log('=== FIM DO DEBUG ===');
  });
});
