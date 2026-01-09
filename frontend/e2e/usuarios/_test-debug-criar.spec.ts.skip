import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures';

test('debug - criar usuário gestor completo', async ({ page }) => {
  console.log('\n=== DEBUG: CRIAR GESTOR ===');
  
  // 1. Login
  await page.goto('http://localhost:4200/login');
  await page.fill('[formControlName="email"]', TEST_USERS.admin.email);
  await page.fill('[formControlName="senha"]', TEST_USERS.admin.senha);
  await page.click('button[type="submit"]');
  await page.waitForURL(/^(?!.*login).*$/);
  console.log('✓ Login OK');
  
  // 2. Ir para novo usuário
  await page.goto('http://localhost:4200/usuarios/novo');
  await page.waitForLoadState('networkidle');
  console.log('✓ Formulário carregado');
  
  await page.screenshot({ path: 'test-results/form-inicial.png', fullPage: true });
  
  // 3. Preencher dados básicos
  console.log('\n3. Preenchendo campos...');
  await page.fill('[formControlName="nome"]', 'João Gestor Teste');
  await page.fill('[formControlName="email"]', `gestor.${Date.now()}@test.com`);
  await page.fill('[formControlName="senha"]', 'Senha@123');
  await page.fill('[formControlName="cargo"]', 'Gerente');
  console.log('   ✓ Campos básicos preenchidos');
  
  // 4. Selecionar perfil
  console.log('\n4. Selecionando perfil...');
  const perfilSelect = page.locator('[formControlName="perfilId"]');
  await perfilSelect.click();
  await page.waitForTimeout(500);
  
  // Listar todas as opções
  const options = page.locator('.ng-option');
  const count = await options.count();
  console.log(`   - Opções disponíveis: ${count}`);
  
  for (let i = 0; i < count; i++) {
    const text = await options.nth(i).textContent();
    console.log(`     ${i + 1}. ${text}`);
  }
  
  // Procurar "Gestor"
  const gestorOption = page.locator('.ng-option', { hasText: /gestor/i });
  const gestorCount = await gestorOption.count();
  
  if (gestorCount > 0) {
    await gestorOption.first().click();
    console.log('   ✓ Perfil "Gestor" selecionado');
  } else {
    // Selecionar primeira opção não-admin
    await options.nth(1).click();
    console.log('   ⚠ Selecionada segunda opção (não encontrou Gestor)');
  }
  
  await page.waitForTimeout(500);
  
  // 5. Verificar se campo empresa apareceu
  console.log('\n5. Verificando campo empresa...');
  const empresaSelect = page.locator('[formControlName="empresaId"]');
  const empresaCount = await empresaSelect.count();
  console.log(`   - Campo empresa: ${empresaCount > 0 ? 'PRESENTE' : 'AUSENTE'}`);
  
  if (empresaCount > 0) {
    await page.screenshot({ path: 'test-results/form-com-empresa.png', fullPage: true });
    
    console.log('\n6. Selecionando empresa...');
    await empresaSelect.click();
    await page.waitForTimeout(500);
    
    const empresaOptions = page.locator('.ng-option');
    const empresaOptionsCount = await empresaOptions.count();
    console.log(`   - Empresas disponíveis: ${empresaOptionsCount}`);
    
    for (let i = 0; i < Math.min(empresaOptionsCount, 5); i++) {
      const text = await empresaOptions.nth(i).textContent();
      console.log(`     ${i + 1}. ${text}`);
    }
    
    if (empresaOptionsCount > 0) {
      await empresaOptions.first().click();
      console.log('   ✓ Primeira empresa selecionada');
    }
  }
  
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/form-completo.png', fullPage: true });
  
  // 7. Verificar erros de validação antes de submeter
  console.log('\n7. Verificando validação...');
  const invalidFields = page.locator('.is-invalid');
  const invalidCount = await invalidFields.count();
  console.log(`   - Campos inválidos: ${invalidCount}`);
  
  if (invalidCount > 0) {
    for (let i = 0; i < invalidCount; i++) {
      const fieldName = await invalidFields.nth(i).getAttribute('formControlName');
      console.log(`     - Campo inválido: ${fieldName}`);
    }
  }
  
  const errorMessages = page.locator('.invalid-feedback.d-block, .text-danger');
  const errorCount = await errorMessages.count();
  console.log(`   - Mensagens de erro visíveis: ${errorCount}`);
  
  if (errorCount > 0) {
    for (let i = 0; i < errorCount; i++) {
      const msg = await errorMessages.nth(i).textContent();
      console.log(`     - Erro: ${msg?.trim()}`);
    }
  }
  
  // 8. Tentar submeter
  console.log('\n8. Submetendo formulário...');
  const submitBtn = page.locator('button[type="submit"]');
  const btnText = await submitBtn.textContent();
  console.log(`   - Texto do botão: "${btnText?.trim()}"`);
  
  const isDisabled = await submitBtn.isDisabled();
  console.log(`   - Botão desabilitado: ${isDisabled}`);
  
  if (!isDisabled) {
    await submitBtn.click();
    console.log('   ✓ Formulário submetido');
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`\n9. URL após submit: ${currentUrl}`);
    
    await page.screenshot({ path: 'test-results/form-apos-submit.png', fullPage: true });
    
    // Verificar se há SweetAlert
    const swal = page.locator('.swal2-popup');
    const swalCount = await swal.count();
    if (swalCount > 0) {
      const swalTitle = await swal.locator('.swal2-title').textContent();
      const swalText = await swal.locator('.swal2-html-container').textContent();
      console.log(`   - SweetAlert: ${swalTitle} - ${swalText}`);
    }
    
    // Verificar erros após submit
    const errorsAfter = page.locator('.invalid-feedback.d-block, .text-danger');
    const errorsAfterCount = await errorsAfter.count();
    if (errorsAfterCount > 0) {
      console.log(`\n   ⚠ Erros após submit: ${errorsAfterCount}`);
      for (let i = 0; i < Math.min(errorsAfterCount, 5); i++) {
        const msg = await errorsAfter.nth(i).textContent();
        console.log(`     - ${msg?.trim()}`);
      }
    }
  }
  
  console.log('\n=== FIM DO DEBUG ===\n');
});
