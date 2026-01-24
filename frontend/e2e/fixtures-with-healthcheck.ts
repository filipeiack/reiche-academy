import { test as base, expect } from '@playwright/test';

/**
 * Base test extended com verificação de serviços
 * 
 * Este fixture verifica se backend e frontend estão disponíveis
 * antes de executar testes que dependem desses serviços.
 */
export const test = base.extend({
  // Adicionar verificação de serviços antes de cada teste
  page: async ({ page }, use) => {
    // Verificar se frontend está disponível
    try {
      const response = await page.goto('http://localhost:4200');
      if (!response || !response.ok()) {
        throw new Error('Frontend não está disponível');
      }
    } catch (error) {
      console.log('❌ Frontend não está rodando em http://localhost:4200');
      test.skip();
    }

    // Verificar se backend está disponível
    try {
      const backendResponse = await page.goto('http://localhost:3000/api/health', { timeout: 5000 });
      if (!backendResponse || !backendResponse.ok()) {
        throw new Error('Backend não está disponível');
      }
    } catch (error) {
      console.log('❌ Backend não está rodando em http://localhost:3000');
      console.log('💡 Execute: npm run dev (no backend)');
      test.skip();
    }

    await use(page);
  },
});

export { expect };