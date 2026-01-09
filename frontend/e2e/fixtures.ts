import { test as base, expect, Page } from '@playwright/test';

/**
 * Fixtures E2E - Reiche Academy
 * 
 * Fornece utilitários compartilhados para testes E2E:
 * - Login automático
 * - Navegação
 * - Helpers de formulários
 * 
 * Agente: E2E_Agent
 */

export type TestUser = {
  email: string;
  senha: string;
  perfil: 'ADMINISTRADOR' | 'GESTOR' | 'COLABORADOR' | 'CONSULTOR' | 'LEITURA';
  empresaId?: string;
};

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

// Helpers de autenticação
export async function login(page: Page, user: TestUser) {
  await page.goto('/login');
  
  // Seletores baseados em formControlName (Angular)
  await page.fill('[formControlName="email"]', user.email);
  await page.fill('[formControlName="senha"]', user.senha);
  
  // Buscar botão de login por type="submit"
  await page.click('button[type="submit"]');
  
  // Aguardar redirecionamento após login bem-sucedido
  await page.waitForURL(/^(?!.*login).*$/, { timeout: 10000 });
  
  // Aguardar página carregar completamente
  await page.waitForLoadState('networkidle');
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
  const baseUrl = page.context().baseURL || 'http://localhost:4200';
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
  await field.clear();
  await field.fill(value);
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
      await expect(successIcon).toBeVisible({ timeout: 3000 });
    } else if (type === 'error') {
      const errorIcon = swal.locator('.swal2-icon-error, .swal2-error');
      await expect(errorIcon).toBeVisible({ timeout: 3000 });
    }
    
    if (message) {
      const titleOrContent = page.locator('.swal2-title, .swal2-html-container');
      if (typeof message === 'string') {
        await expect(titleOrContent.first()).toContainText(message);
      } else {
        const text = await titleOrContent.first().textContent();
        expect(text).toMatch(message);
      }
    }
  } catch (e) {
    // Se não encontrou SweetAlert, tentar toasts Bootstrap
    const toastSelector = `.toast.bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : type}`;
    const toast = page.locator(toastSelector).first();
    
    await expect(toast).toBeVisible({ timeout: 3000 });
    
    if (message) {
      if (typeof message === 'string') {
        await expect(toast).toContainText(message);
      } else {
        const text = await toast.textContent();
        expect(text || '').toMatch(message);
      }
    }
  }
}

export async function expectErrorMessage(page: Page, fieldName: string, errorMessage: string) {
  const errorElement = page.locator(`[formControlName="${fieldName}"] ~ .invalid-feedback, [name="${fieldName}"] ~ .invalid-feedback`);
  await expect(errorElement).toContainText(errorMessage);
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

// Helper para capturar ID de recurso criado via interceptação HTTP
export async function captureCreatedResourceId(
  page: Page, 
  resourceType: 'usuario' | 'empresa' | 'pilar' | 'rotina',
  cleanupRegistry: CleanupRegistry
): Promise<void> {
  const endpoints: Record<typeof resourceType, RegExp> = {
    usuario: /\/api\/users$/,
    empresa: /\/api\/empresas$/,
    pilar: /\/api\/pilares$/,
    rotina: /\/api\/rotinas$/,
  };

  page.on('response', async response => {
    if (endpoints[resourceType].test(response.url()) && response.status() === 201) {
      try {
        const body = await response.json();
        if (body.id) {
          console.log(`[Capture] ✅ ${resourceType} criado com ID: ${body.id}`);
          cleanupRegistry.add(resourceType, body.id);
        }
      } catch (e) {
        // Response não é JSON ou não tem ID
      }
    }
  });
}

// Cleanup automático de recursos criados em testes
type CleanupResource = {
  type: 'usuario' | 'empresa' | 'pilar' | 'rotina';
  id: string;
};

export type CleanupRegistry = {
  add: (type: CleanupResource['type'], id: string) => void;
  addMultiple: (type: CleanupResource['type'], ids: string[]) => void;
};

async function cleanupResourceWithToken(page: Page, resource: CleanupResource, token: string | null): Promise<void> {
  try {
    const baseUrl = 'http://localhost:3000/api';
    
    if (!token) {
      console.warn(`[Cleanup] ⚠️ Sem token de auth - pulando cleanup de ${resource.type}:${resource.id}`);
      console.warn(`[Cleanup]    Recurso pode precisar de limpeza manual via SQL`);
      return;
    }

    const endpoints: Record<CleanupResource['type'], string> = {
      usuario: `${baseUrl}/users/${resource.id}`,
      empresa: `${baseUrl}/empresas/${resource.id}`,
      pilar: `${baseUrl}/pilares/${resource.id}`,
      rotina: `${baseUrl}/rotinas/${resource.id}`,
    };

    const response = await page.request.delete(endpoints[resource.type], {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok()) {
      console.log(`[Cleanup] ✅ ${resource.type}:${resource.id} removido com sucesso`);
    } else if (response.status() === 404) {
      console.log(`[Cleanup] ⚠️ ${resource.type}:${resource.id} já não existe (404)`);
    } else if (response.status() === 401) {
      console.warn(`[Cleanup] ❌ Token expirado ou inválido - ${resource.type}:${resource.id}`);
    } else {
      console.warn(`[Cleanup] ❌ Falha ao remover ${resource.type}:${resource.id} - Status ${response.status()}`);
      const body = await response.text().catch(() => '');
      if (body) console.warn(`[Cleanup]    Response: ${body.substring(0, 100)}`);
    }
  } catch (error) {
    console.error(`[Cleanup] ❌ Erro ao limpar ${resource.type}:${resource.id}:`, error);
  }
}

// Fixture customizado com login automático e cleanup
type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  gestorPage: Page;
  cleanupRegistry: CleanupRegistry;
};

export const test = base.extend<AuthFixtures>({
  // Registro de cleanup automático
  cleanupRegistry: async ({ page }, use) => {
    const resources: CleanupResource[] = [];
    
    // Capturar token no início (enquanto página está ativa)
    let authToken: string | null = null;
    
    const registry: CleanupRegistry = {
      add: (type, id) => {
        resources.push({ type, id });
        console.log(`[Cleanup] Registrado para limpeza: ${type}:${id}`);
        
        // Capturar token imediatamente quando recurso é registrado
        if (!authToken) {
          page.evaluate(() => {
            return localStorage.getItem('access_token') || 
                   sessionStorage.getItem('access_token');
          }).then(token => {
            if (token) authToken = token;
          }).catch(() => {});
        }
      },
      addMultiple: (type, ids) => {
        ids.forEach(id => registry.add(type, id));
      },
    };
    
    // Fornece registry para o teste
    await use(registry);
    
    // Cleanup automático após teste (ordem reversa = LIFO)
    if (resources.length === 0) {
      console.log('[Cleanup] Nenhum recurso para limpar');
      return;
    }
    
    console.log(`[Cleanup] Iniciando limpeza de ${resources.length} recurso(s)...`);
    
    // Garantir que temos token
    if (!authToken) {
      authToken = await page.evaluate(() => {
        return localStorage.getItem('access_token') || 
               sessionStorage.getItem('access_token');
      }).catch(() => null);
    }
    
    for (const resource of resources.reverse()) {
      await cleanupResourceWithToken(page, resource, authToken);
    }
  },
  
  // Página autenticada genérica (usa admin por padrão)
  authenticatedPage: async ({ page }, use) => {
    await login(page, TEST_USERS.admin);
    await use(page);
  },
  
  // Página autenticada como ADMINISTRADOR
  adminPage: async ({ page }, use) => {
    await login(page, TEST_USERS.admin);
    await use(page);
  },
  
  // Página autenticada como GESTOR
  gestorPage: async ({ page }, use) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await use(page);
  },
});

export { expect };
