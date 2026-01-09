import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures';

test('teste simples - acessar lista de usuários', async ({ page }) => {
  console.log('\n=== INÍCIO DO TESTE ===');
  
  // 1. Login
  console.log('1. Fazendo login...');
  await page.goto('http://localhost:4200/login');
  await page.fill('[formControlName="email"]', TEST_USERS.admin.email);
  await page.fill('[formControlName="senha"]', TEST_USERS.admin.senha);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(/^(?!.*login).*$/, { timeout: 10000 });
  console.log('✓ Login realizado');
  
  // 2. Navegar para usuários
  console.log('\n2. Navegando para /usuarios...');
  await page.goto('http://localhost:4200/usuarios');
  await page.waitForLoadState('networkidle');
  console.log('✓ Página de usuários carregada');
  
  // 3. Verificar elementos da página
  console.log('\n3. Verificando elementos...');
  
  const btnNovo = page.locator('[data-testid="novo-usuario-button"]');
  const btnNovoCount = await btnNovo.count();
  console.log(`   - Botão "Novo": ${btnNovoCount > 0 ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
  
  const table = page.locator('table');
  const tableCount = await table.count();
  console.log(`   - Tabela: ${tableCount > 0 ? 'ENCONTRADA' : 'NÃO ENCONTRADA'}`);
  
  await page.screenshot({ path: 'test-results/usuarios-lista.png', fullPage: true });
  
  // 4. Tentar clicar no botão novo
  if (btnNovoCount > 0) {
    console.log('\n4. Clicando em "Novo Usuário"...');
    await btnNovo.click();
    
    await page.waitForTimeout(1000);
    
    const offcanvas = page.locator('.offcanvas.show');
    const offcanvasCount = await offcanvas.count();
    console.log(`   - Offcanvas aberto: ${offcanvasCount > 0 ? 'SIM' : 'NÃO'}`);
    
    await page.screenshot({ path: 'test-results/usuarios-offcanvas.png', fullPage: true });
    
    if (offcanvasCount > 0) {
      console.log('   ✓ Modal de criação aberto com sucesso');
    }
  }
  
  console.log('\n=== TESTE CONCLUÍDO ===\n');
  
  expect(btnNovoCount).toBeGreaterThan(0);
});
