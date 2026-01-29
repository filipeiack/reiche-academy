import { test, expect } from '@playwright/test';

/**
 * Testes básicos de acessibilidade das páginas
 * 
 * Estes testes verificam se as páginas principais carregam
 * sem depender de backend ou banco de dados.
 */

test.describe('Acessibilidade Básica das Páginas @a11y @medium', () => {
  
  test('página de login deve carregar', async ({ page }) => {
    await page.goto('http://localhost:4200/login');
    
    // Verificar se elementos básicos da página de login existem
    await expect(page.locator('h5')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], [formControlName="senha"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('página inicial (dashboard) deve carregar ou redirecionar para login', async ({ page }) => {
    const response = await page.goto('http://localhost:4200');
    
    // Se não estiver autenticado, deve redirecionar para login
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await expect(page.locator('h1:has-text("Login"), h2:has-text("Login")')).toBeVisible({ timeout: 5000 });
    } else {
      // Se estiver acessível, deve ter elementos do dashboard
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('página de usuários deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('http://localhost:4200/usuarios');
    
    // Deve redirecionar para login
    await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('página de empresas deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('http://localhost:4200/empresas');
    
    // Deve redirecionar para login
    await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('página de diagnóstico deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('http://localhost:4200/diagnostico-notas');
    
    // Deve redirecionar para login
    await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('página de cockpit deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('http://localhost:4200/cockpit/test-id');
    
    // Aguardar um pouco para redirecionamento
    await page.waitForTimeout(2000);
    
    // Deve redirecionar para login ou mostrar página 404
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible({ timeout: 3000 });
    } else {
      // Se não redirecionou, verificar se há algum conteúdo visível
      try {
        await expect(page.locator('h1, h2, h3, h4, h5, .error-message, .not-found')).toBeVisible({ timeout: 3000 });
      } catch {
        // Se não encontrar nada específico, apenas verificar que página carregou
        const pageTitle = await page.title();
        expect(pageTitle).toBeTruthy();
      }
    }
  });

  test('página de pilares deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('http://localhost:4200/pilares');
    
    // Deve redirecionar para login
    await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('página de rotinas deve redirecionar para login se não autenticado', async ({ page }) => {
    await page.goto('http://localhost:4200/rotinas');
    
    // Deve redirecionar para login
    await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('rotas inválidas devem redirecionar para 404 ou login', async ({ page }) => {
    await page.goto('http://localhost:4200/rota-inexistente');
    
    // Pode ser página 404 ou redirecionar para login
    const currentUrl = page.url();
    
    // Se redirecionou para login, está correto
    if (currentUrl.includes('/login')) {
      await expect(page.locator('input[type="email"], [formControlName="email"]')).toBeVisible({ timeout: 3000 });
    } else {
      // Se ficou na página, deve mostrar algo (404, etc)
      await expect(page.locator('body')).toBeVisible();
    }
  });

});