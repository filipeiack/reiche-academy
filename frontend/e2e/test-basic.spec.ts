import { test, expect } from '@playwright/test';

test('verifica se frontend está acessível', async ({ page }) => {
  console.log('Tentando acessar http://localhost:4200/login...');
  
  const response = await page.goto('http://localhost:4200/login');
  
  console.log('Status da resposta:', response?.status());
  console.log('URL atual:', page.url());
  
  await page.screenshot({ path: 'test-results/basic-test.png' });
  
  expect(response?.status()).toBe(200);
  
  const title = await page.title();
  console.log('Título da página:', title);
});
