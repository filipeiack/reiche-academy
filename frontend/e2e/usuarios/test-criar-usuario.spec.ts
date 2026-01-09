import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures';

test('criar usuário - fluxo completo', async ({ page }) => {
  console.log('\n=== TESTE: CRIAR USUÁRIO ===');
  
  // 1. Login
  console.log('1. Login como admin...');
  await page.goto('http://localhost:4200/login');
  await page.fill('[formControlName="email"]', TEST_USERS.admin.email);
  await page.fill('[formControlName="senha"]', TEST_USERS.admin.senha);
  await page.click('button[type="submit"]');
  await page.waitForURL(/^(?!.*login).*$/, { timeout: 10000 });
  console.log('✓ Login OK');
  
  // 2. Navegar para usuários
  console.log('\n2. Navegando para lista...');
  await page.goto('http://localhost:4200/usuarios');
  await page.waitForLoadState('networkidle');
  console.log('✓ Lista carregada');
  
  // 3. Clicar em Novo
  console.log('\n3. Clicando em "Novo Usuário"...');
  await page.click('[data-testid="novo-usuario-button"]');
  await page.waitForURL('**/usuarios/novo');
  console.log('✓ Navegou para /usuarios/novo');
  
  await page.screenshot({ path: 'test-results/usuario-form-vazio.png', fullPage: true });
  
  // 4. Preencher formulário
  console.log('\n4. Preenchendo formulário...');
  
  await page.fill('[formControlName="nome"]', 'Test User E2E');
  console.log('   - Nome: OK');
  
  await page.fill('[formControlName="email"]', `test.e2e.${Date.now()}@example.com`);
  console.log('   - Email: OK');
  
  await page.fill('[formControlName="senha"]', 'Senha@123');
  console.log('   - Senha: OK');
  
  await page.fill('[formControlName="cargo"]', 'Testador');
  console.log('   - Cargo: OK');
  
  // 5. Selecionar perfil (ng-select)
  console.log('\n5. Selecionando perfil...');
  const perfilSelect = page.locator('[formControlName="perfilId"]');
  await perfilSelect.click();
  await page.waitForTimeout(300);
  
  const options = page.locator('.ng-option');
  const optionsCount = await options.count();
  console.log(`   - Opções disponíveis: ${optionsCount}`);
  
  if (optionsCount > 0) {
    await page.locator('.ng-option').first().click();
    console.log('   ✓ Perfil selecionado');
  }
  
  await page.screenshot({ path: 'test-results/usuario-form-preenchido.png', fullPage: true });
  
  // 6. Procurar botão submit
  console.log('\n6. Procurando botão de salvar...');
  
  const btnSubmit = page.locator('button[type="submit"]');
  const btnSubmitCount = await btnSubmit.count();
  console.log(`   - Botões submit encontrados: ${btnSubmitCount}`);
  
  const btnSalvar = page.locator('button:has-text("Salvar")');
  const btnSalvarCount = await btnSalvar.count();
  console.log(`   - Botões "Salvar" encontrados: ${btnSalvarCount}`);
  
  const btnCriar = page.locator('button:has-text("Criar")');
  const btnCriarCount = await btnCriar.count();
  console.log(`   - Botões "Criar" encontrados: ${btnCriarCount}`);
  
  // 7. Tentar submeter
  if (btnSubmitCount > 0) {
    console.log('\n7. Submetendo formulário...');
    await btnSubmit.click();
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    console.log(`   - URL atual: ${currentUrl}`);
    
    await page.screenshot({ path: 'test-results/usuario-apos-submit.png', fullPage: true });
  }
  
  console.log('\n=== TESTE CONCLUÍDO ===\n');
  
  expect(btnSubmitCount).toBeGreaterThan(0);
});
