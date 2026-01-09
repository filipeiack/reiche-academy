import { Page } from '@playwright/test';

/**
 * Fixtures E2E - Reiche Academy
 * 
 * Fornece utilitários compartilhados para testes E2E
 * 
 * NOTA: Arquivo simplificado sem test.extend() para evitar conflitos
 * 
 * Agente: QA_E2E_Interface
 * Data: 2026-01-09
 */

// Re-export test e expect do Playwright
export { test, expect } from '@playwright/test';

export type TestUser = {
  email: string;
  senha: string;
  perfil: 'ADMINISTRADOR' | 'GESTOR' | 'COLABORADOR' | 'CONSULTOR' | 'LEITURA';
  empresaId?: string;
};

/**
 * TEST_USERS - Usuários de fixtures para testes E2E
 * 
 * ⚠️ ATENÇÃO: Estes usuários NUNCA devem ser deletados!
 * 
 * São criados via seed do backend e são essenciais para login nos testes.
 * Qualquer cleanup de dados deve excluir apenas usuários criados durante
 * o teste, NUNCA os TEST_USERS.
 * 
 * Usuários protegidos:
 * - admin@reiche.com.br (ADMINISTRADOR)
 * - gestor@empresa-a.com (GESTOR)
 * - gestor@empresa-b.com (GESTOR)
 * - colab@empresa-a.com (COLABORADOR)
 */
export const TEST_USERS: Record<string, TestUser> = {
  admin: {
    email: 'admin@reiche.com.br',
    senha: 'Admin@123',
    perfil: 'ADMINISTRADOR',
  },
  gestorEmpresaA: {
    email: 'gestor@empresa-a.com',
    senha: 'Admin@123',
    perfil: 'GESTOR',
    empresaId: 'empresa-a-id',
  },
  gestorEmpresaB: {
    email: 'gestor@empresa-b.com',
    senha: 'Admin@123',
    perfil: 'GESTOR',
    empresaId: 'empresa-b-id',
  },
  colaborador: {
    email: 'colab@empresa-a.com',
    senha: 'Admin@123',
    perfil: 'COLABORADOR',
    empresaId: 'empresa-a-id',
  },
};

/**
 * Emails dos TEST_USERS que nunca devem ser deletados
 */
export const PROTECTED_TEST_USER_EMAILS = [
  'admin@reiche.com.br',
  'gestor@empresa-a.com',
  'gestor@empresa-b.com',
  'colab@empresa-a.com',
];

/**
 * Verifica se um email é de um TEST_USER protegido
 */
export function isProtectedTestUser(email: string): boolean {
  return PROTECTED_TEST_USER_EMAILS.includes(email.toLowerCase());
}

// Helpers de autenticação
export async function login(page: Page, user: TestUser) {
  await page.goto('/login');
  
  // Seletores baseados em formControlName (Angular)
  await page.fill('[formControlName="email"]', user.email);
  await page.fill('[formControlName="senha"]', user.senha);
  
  // Buscar botão de login por type="submit"
  await page.click('button[type="submit"]');
  
  // Aguardar navegação acontecer (detecta qualquer mudança de URL)
  await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(async () => {
    // Se não houver navegação, verificar se token foi criado
    const token = await page.evaluate(() => localStorage.getItem('access_token'));
    if (!token) {
      throw new Error('Login falhou: sem navegação e sem token');
    }
  });
  
  // Validar que saiu da página de login
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('Login falhou: ainda na página de login');
  }
}

export async function logout(page: Page) {
  // Abrir dropdown do usuário
  await page.click('.profile-dropdown .nav-link');
  
  // Clicar em "Sair" ou "Logout"
  await page.click('text=/sair|logout/i');
  
  await page.waitForURL('**/login');
}

// Helpers de navegação
export async function navigateTo(page: Page, route: string) {
  const baseUrl = 'http://localhost:4200';
  await page.goto(baseUrl + route);
  
  // Aguardar loader desaparecer (se existir)
  const loader = page.locator('.spinner-border, .loading-spinner').first();
  if (await loader.count() > 0) {
    await loader.waitFor({ state: 'hidden', timeout: 10000 });
  }
}

// Helpers de formulários
export async function fillFormField(page: Page, fieldName: string, value: string) {
  const field = page.locator(`[formControlName="${fieldName}"], [name="${fieldName}"]`);
  
  // Verificar se é um ng-select
  const tagName = await field.evaluate((el) => el.tagName.toLowerCase());
  
  if (tagName === 'ng-select') {
    // Para ng-select, usar estratégia específica
    await field.click(); // Abrir dropdown
    await page.waitForTimeout(200);
    
    // Digitar no input de busca interno
    const searchInput = page.locator('.ng-input input').first();
    await searchInput.fill(value);
    await page.waitForTimeout(300);
    
    // Selecionar primeira opção ou criar nova (taggable)
    const firstOption = page.locator('.ng-option').first();
    const optionCount = await firstOption.count();
    
    if (optionCount > 0) {
      await firstOption.click();
    } else {
      // Se não houver opções, pressionar Enter para criar (taggable)
      await searchInput.press('Enter');
    }
  } else {
    // Input/textarea padrão
    await field.clear();
    await field.fill(value);
  }
}

export async function selectDropdownOption(page: Page, fieldName: string, optionText: string) {
  // Suporte para ng-select
  const ngSelect = page.locator(`[formControlName="${fieldName}"]`);
  const ngSelectCount = await ngSelect.count();
  
  if (ngSelectCount > 0) {
    // É um ng-select
    await ngSelect.click();
    await page.waitForTimeout(300);
    await page.locator(`.ng-option:has-text("${optionText}")`).first().click();
  } else {
    // Fallback para select nativo
    const dropdown = page.locator(`[formControlName="${fieldName}"] select, select[name="${fieldName}"]`);
    await dropdown.selectOption({ label: optionText });
  }
}

export async function submitForm(page: Page, buttonText: string = 'Salvar') {
  // Tenta primeiro pelo texto exato
  let button = page.locator(`button:has-text("${buttonText}")`);
  let count = await button.count();
  
  // Se não encontrar, tenta variações comuns
  if (count === 0) {
    const variations = ['Salvar', 'Criar', 'Confirmar', 'Enviar'];
    for (const variation of variations) {
      button = page.locator(`button:has-text("${variation}")`);
      count = await button.count();
      if (count > 0) break;
    }
  }
  
  // Se ainda não encontrou, tenta por tipo submit
  if (count === 0) {
    button = page.locator('button[type="submit"]');
  }
  
  await button.click();
}

// Helpers de validação
export async function expectToast(page: Page, type: 'success' | 'error' | 'warning' | 'info', message?: string | RegExp) {
  // Aguardar um pouco mais para o SweetAlert ou Toast aparecer
  await page.waitForTimeout(1200);
  
  // Verificar primeiro se é SweetAlert2 (usado na maioria dos módulos)
  const swal = page.locator('.swal2-popup');
  
  try {
    // Tentar aguardar SweetAlert aparecer (timeout curto)
    await swal.waitFor({ state: 'visible', timeout: 3000 });
    
    // É um SweetAlert2
    if (type === 'success') {
      const successIcon = swal.locator('.swal2-icon-success, .swal2-success');
      await successIcon.waitFor({ state: 'visible', timeout: 3000 });
    } else if (type === 'error') {
      const errorIcon = swal.locator('.swal2-icon-error, .swal2-error');
      await errorIcon.waitFor({ state: 'visible', timeout: 3000 });
    }
    
    if (message) {
      const titleOrContent = page.locator('.swal2-title, .swal2-html-container');
      if (typeof message === 'string') {
        const text = await titleOrContent.first().textContent();
        if (!text?.includes(message)) {
          throw new Error(`Expected message "${message}" but got "${text}"`);
        }
      } else {
        const text = await titleOrContent.first().textContent();
        if (!message.test(text || '')) {
          throw new Error(`Expected message matching ${message} but got "${text}"`);
        }
      }
    }
  } catch (e) {
    // Se não encontrou SweetAlert, tentar toasts Bootstrap
    const toastSelector = `.toast.bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : type}`;
    const toast = page.locator(toastSelector).first();
    
    await toast.waitFor({ state: 'visible', timeout: 3000 });
    
    if (message) {
      const text = await toast.textContent();
      if (typeof message === 'string') {
        if (!text?.includes(message)) {
          throw new Error(`Expected message "${message}" but got "${text}"`);
        }
      } else {
        if (!message.test(text || '')) {
          throw new Error(`Expected message matching ${message} but got "${text}"`);
        }
      }
    }
  }
}

export async function expectErrorMessage(page: Page, fieldName: string, errorMessage: string) {
  const errorElement = page.locator(`[formControlName="${fieldName}"] ~ .invalid-feedback, [name="${fieldName}"] ~ .invalid-feedback`);
  const text = await errorElement.textContent();
  if (!text?.includes(errorMessage)) {
    throw new Error(`Expected error "${errorMessage}" but got "${text}"`);
  }
}

// Helpers de tabelas
export async function getTableRowCount(page: Page, tableSelector: string = 'table') {
  return await page.locator(`${tableSelector} tbody tr`).count();
}

export async function searchInTable(page: Page, searchTerm: string) {
  const searchSelector = '[data-testid="search-input"], input[type="search"], input[placeholder*="Buscar"], input[type="text"]';
  await page.locator(searchSelector).first().fill(searchTerm);
  
  // Aguardar debounce de pesquisa (normalmente 300-500ms)
  await page.waitForTimeout(600);
}

// Helpers de modais
export async function openModal(page: Page, buttonSelector: string) {
  await page.click(buttonSelector);
  await page.waitForSelector('.modal.show, .offcanvas.show', { state: 'visible' });
}

export async function closeModal(page: Page) {
  const closeButton = page.locator('.modal .btn-close, .offcanvas .btn-close').first();
  if (await closeButton.count() > 0) {
    await closeButton.click();
    await page.waitForSelector('.modal.show, .offcanvas.show', { state: 'hidden' });
  }
}
