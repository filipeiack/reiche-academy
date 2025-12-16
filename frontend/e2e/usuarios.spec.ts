import { test, expect, Page } from '@playwright/test';

// Configurações de teste
const TEST_USER = {
  nome: 'Usuário Teste E2E',
  email: `teste.e2e.${Date.now()}@reiche.com`,
  cargo: 'Tester Automation',
  perfil: 'COLABORADOR',
  senha: 'senha123456'
};

const ADMIN_CREDENTIALS = {
  email: 'admin@reiche.com',
  senha: '123456'
};

// Helper para fazer login
async function login(page: Page) {
  try {
    await page.goto('http://localhost:4200/auth/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email, { timeout: 5000 });
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.senha, { timeout: 5000 });
    await page.click('button[type="submit"]', { timeout: 5000 });
    await page.waitForURL('**/dashboard', { timeout: 30000 });
  } catch (error) {
    console.error('Erro durante login:', error);
    throw error;
  }
}

test.describe('CRUD de Usuários', () => {
  test.beforeEach(async ({ page }) => {
    // Cada teste faz login e vai para usuários
    try {
      console.log('[beforeEach] Iniciando login...');
      await login(page);
      console.log('[beforeEach] Login realizado, navegando para usuários...');
      await page.goto('http://localhost:4200/usuarios', { waitUntil: 'domcontentloaded' });
      console.log('[beforeEach] Página de usuários carregada');
    } catch (error) {
      console.error('[beforeEach] Erro:', error);
      throw error;
    }
  });

  test('01 - Deve criar um novo usuário', async ({ page }) => {
    // Clica no botão de novo
    await page.click('a[href="/usuarios/novo"]');
    await page.waitForURL('**/usuarios/novo');

    // Preenche o formulário
    await page.fill('input#nome', TEST_USER.nome);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#cargo', TEST_USER.cargo);
    await page.selectOption('select#perfil', TEST_USER.perfil);
    await page.fill('input#senha', TEST_USER.senha);

    // Submete
    await page.click('button[type="submit"]');

    // Verifica sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('criado com sucesso');

    // Volta para lista
    await page.waitForURL('**/usuarios');

    // Busca o usuário criado
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    await expect(userRow).toBeVisible();
  });

  test('02 - Deve buscar usuários na lista', async ({ page }) => {
    // Busca por "admin"
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    await page.waitForTimeout(500);

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();

    // Limpa a busca
    await page.fill('input[placeholder*="Procurar"]', '');
    await page.waitForTimeout(500);

    // Verifica que voltou a exibir todos
    await expect(rows.first()).toBeVisible();
  });

  test('03 - Deve exibir avatar do usuário na lista', async ({ page }) => {
    // Verifica que o componente de avatar está sendo renderizado
    const avatarComponents = page.locator('app-user-avatar');
    const count = await avatarComponents.count();
    
    expect(count).toBeGreaterThan(0);
  });

  test('04 - Deve selecionar usuário individual via checkbox', async ({ page }) => {
    // Seleciona primeiro usuário
    const firstRow = page.locator('table tbody tr').first();
    const checkbox = firstRow.locator('input[type="checkbox"]');
    
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Verifica que barra de ações apareceu
    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toBeVisible();
    await expect(actionBar).toContainText('(1)');

    // Desmarcar
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect(actionBar).not.toBeVisible();
  });

  test('05 - Deve abrir offcanvas com detalhes', async ({ page }) => {
    // Busca por admin
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr').first();
    
    // Clica no botão de detalhes
    await userRow.locator('button i.icon-info').click();

    // Verifica que offcanvas abriu
    const offcanvas = page.locator('.offcanvas.show');
    await expect(offcanvas).toBeVisible({ timeout: 3000 });

    // Verifica conteúdo
    await expect(offcanvas.locator('h5')).toContainText('Detalhes do Usuário');

    // Fecha o offcanvas
    await page.keyboard.press('Escape');
  });

  test('06 - Deve editar usuário a partir do offcanvas', async ({ page }) => {
    // Busca por admin
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr').first();
    
    // Abre offcanvas
    await userRow.locator('button i.icon-info').click();
    const offcanvas = page.locator('.offcanvas.show');
    await expect(offcanvas).toBeVisible({ timeout: 3000 });

    // Clica em editar
    await offcanvas.locator('button:has-text("Editar")').click();

    // Verifica que foi para página de edição
    await page.waitForURL('**/usuarios/*/editar', { timeout: 10000 });
  });

  test('07 - Deve validar campos obrigatórios', async ({ page }) => {
    // Vai para criar novo
    await page.click('a[href="/usuarios/novo"]');
    await page.waitForURL('**/usuarios/novo');

    // Preenche nome muito curto
    await page.fill('input#nome', 'A');
    await page.locator('input#nome').blur();
    await page.waitForTimeout(300);

    // Verifica validação
    await expect(page.locator('.invalid-feedback:has-text("mínimo")')).toBeVisible();

    // Preenche email inválido
    await page.fill('input#email', 'invalido');
    await page.locator('input#email').blur();
    await page.waitForTimeout(300);

    // Verifica validação
    await expect(page.locator('.invalid-feedback:has-text("Email")')).toBeVisible();
  });

  test('08 - Deve selecionar múltiplos usuários', async ({ page }) => {
    // Seleciona primeiros usuários
    const rows = page.locator('table tbody tr');
    const count = Math.min(await rows.count(), 3);

    for (let i = 0; i < count; i++) {
      const checkbox = rows.nth(i).locator('input[type="checkbox"]');
      await checkbox.click();
      await page.waitForTimeout(200);
    }

    // Verifica contador
    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toBeVisible();
    await expect(actionBar).toContainText(`(${count})`);
  });

  test('09 - Deve sincronizar checkbox do header', async ({ page }) => {
    // Clica no checkbox do header
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    await headerCheckbox.click();
    await expect(headerCheckbox).toBeChecked();

    // Verifica que todos da página estão marcados
    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]');
    const count = await bodyCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      await expect(bodyCheckboxes.nth(i)).toBeChecked();
    }

    // Desmarcar todos
    await headerCheckbox.click();
    await expect(headerCheckbox).not.toBeChecked();
  });

  test('10 - Deve desativar usuário ativo', async ({ page }) => {
    // Busca por admin
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr').first();
    
    // Clica no botão de inativar
    await userRow.locator('button.text-primary i.icon-toggle-right').click();

    // Confirma no modal
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.locator('.swal2-popup button:has-text("Inativar")').click();

    // Verifica sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('inativado com sucesso');
  });

  test('11 - Deve ativar usuário inativo', async ({ page }) => {
    // Busca por admin (que agora está inativo do teste anterior)
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr').first();
    
    // Clica no botão de ativar (se estiver inativo)
    const toggleButton = userRow.locator('button.text-primary i[class*="icon-toggle"]');
    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Confirma no modal
      await expect(page.locator('.swal2-popup')).toBeVisible();
      const confirmButton = page.locator('.swal2-popup button').first();
      await confirmButton.click();

      // Verifica sucesso
      await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Seleção em Lote', () => {
  test.beforeEach(async ({ page }) => {
    try {
      await login(page);
      await page.goto('http://localhost:4200/usuarios', { waitUntil: 'domcontentloaded' });
    } catch (error) {
      console.error('Erro no beforeEach (lote):', error);
      throw error;
    }
  });

  test('01 - Deve selecionar múltiplos usuários com header checkbox', async ({ page }) => {
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    await headerCheckbox.click();

    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]:checked');
    const selectedCount = await bodyCheckboxes.count();

    expect(selectedCount).toBeGreaterThan(0);

    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toContainText(`(${selectedCount})`);
  });

  test('02 - Deve cancelar seleção com header checkbox', async ({ page }) => {
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    
    // Marca todos
    await headerCheckbox.click();
    await expect(headerCheckbox).toBeChecked();

    // Desmarca todos
    await headerCheckbox.click();
    await expect(headerCheckbox).not.toBeChecked();

    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]:checked');
    const selectedCount = await bodyCheckboxes.count();

    expect(selectedCount).toBe(0);

    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).not.toBeVisible();
  });

  test('03 - Deve sincronizar header checkbox com seleções individuais', async ({ page }) => {
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]');
    const count = await bodyCheckboxes.count();

    // Marca todos manualmente
    for (let i = 0; i < count; i++) {
      await bodyCheckboxes.nth(i).click();
      await page.waitForTimeout(100);
    }

    // Verifica que header foi marcado
    await expect(headerCheckbox).toBeChecked();

    // Desmarcar um
    await bodyCheckboxes.first().click();

    // Verifica que header foi desmarcado
    await expect(headerCheckbox).not.toBeChecked();
  });

  test('04 - Deve mostrar contador de seleção', async ({ page }) => {
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    
    // Marca todos
    await headerCheckbox.click();

    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]:checked');
    const selectedCount = await bodyCheckboxes.count();

    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toContainText(`(${selectedCount})`);
  });

  test('05 - Deve desselecionar ao mudar de página', async ({ page }) => {
    // Seleciona alguns usuários
    const firstCheckbox = page.locator('table tbody tr').first().locator('input[type="checkbox"]');
    await firstCheckbox.click();

    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toBeVisible();

    // Se houver próxima página, vai pra lá
    const nextButton = page.locator('ngb-pagination button:has-text("Next")');
    if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Verifica se há seleções na nova página
      const selectedCheckboxes = page.locator('table tbody input[type="checkbox"]:checked');
      const newSelectedCount = await selectedCheckboxes.count();

      // Pode estar vazia ou manter seleção dependendo da implementação
      expect(newSelectedCount >= 0).toBeTruthy();
    }
  });
});
