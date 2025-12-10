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

let createdUserId: string | null = null;

test.describe('CRUD de Usuários', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login como admin antes de todos os testes
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.senha);
    await page.click('button[type="submit"]');
    
    // Aguardar redirecionamento
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    
    // Navegar para página de usuários
    await page.goto('/usuarios');
    await page.waitForLoadState('networkidle');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('01 - Deve criar um novo usuário', async () => {
    // Clicar no botão criar
    await page.click('a[href="/usuarios/novo"]');
    await page.waitForURL('**/usuarios/novo');

    // Preencher formulário
    await page.fill('input#nome', TEST_USER.nome);
    await page.fill('input#email', TEST_USER.email);
    await page.fill('input#cargo', TEST_USER.cargo);
    await page.selectOption('select#perfil', TEST_USER.perfil);
    await page.fill('input#senha', TEST_USER.senha);

    // Verificar checkbox ativo está marcado
    const ativoCheckbox = page.locator('input#ativo');
    await expect(ativoCheckbox).toBeChecked();

    // Submeter formulário
    await page.click('button[type="submit"]');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('criado com sucesso');

    // Aguardar redirecionamento para lista
    await page.waitForURL('**/usuarios', { timeout: 5000 });

    // Verificar se usuário aparece na lista
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500); // Aguardar filtro

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    await expect(userRow).toBeVisible();
    await expect(userRow).toContainText(TEST_USER.email);
    await expect(userRow).toContainText('Colaborador');
    
    // Capturar ID do usuário criado para próximos testes
    const editButton = userRow.locator('a[href*="/editar"]');
    const href = await editButton.getAttribute('href');
    createdUserId = href?.match(/\/usuarios\/([^/]+)\/editar/)?.[1] || null;
    
    expect(createdUserId).toBeTruthy();
  });

  test('02 - Deve visualizar usuário criado', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado no teste anterior');

    // Buscar usuário
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    await expect(userRow).toBeVisible();

    // Verificar dados na grid
    await expect(userRow).toContainText(TEST_USER.nome);
    await expect(userRow).toContainText(TEST_USER.email);
    await expect(userRow).toContainText('Colaborador');
    
    // Verificar badge de status ativo
    const statusBadge = userRow.locator('.badge.bg-success');
    await expect(statusBadge).toBeVisible();
  });

  test('03 - Deve editar usuário', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar e clicar em editar
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    await userRow.locator('a[href*="/editar"]').click();
    
    await page.waitForURL(`**/usuarios/${createdUserId}/editar`);

    // Atualizar dados
    const updatedName = `${TEST_USER.nome} - Editado`;
    const updatedCargo = 'Senior Tester';
    
    await page.fill('input#nome', updatedName);
    await page.fill('input#cargo', updatedCargo);
    await page.selectOption('select#perfil', 'GESTOR');

    // Submeter
    await page.click('button[type="submit"]');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('atualizado com sucesso');

    // Aguardar navegação de volta para lista
    await page.waitForTimeout(1000);
    
    // Verificar mudanças na lista
    await page.goto('/usuarios');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const updatedRow = page.locator('table tbody tr', { hasText: updatedName });
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow).toContainText('Gestor');
  });

  test('04 - Deve fazer upload de avatar', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Ir para edição
    await page.goto(`/usuarios/${createdUserId}/editar`);
    await page.waitForLoadState('networkidle');

    // Upload de avatar
    const testImagePath = './e2e/fixtures/test-avatar.png';
    
    // Localizar o input hidden e fazer upload
    const fileInput = page.locator('input[type="file"][accept*="image"]');
    await fileInput.setInputFiles(testImagePath);

    // Aguardar toast de sucesso do upload (com timeout menor)
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('Avatar atualizado com sucesso');

    // Aguardar um pouco para o upload processar
    await page.waitForTimeout(500);

    // Verificar que o avatar aparece no card de avatar (não na navbar)
    const avatarCard = page.locator('.card:has-text("Avatar")');
    const avatarImage = avatarCard.locator('app-user-avatar img.avatar-image');
    await expect(avatarImage).toBeVisible();
    
    // Verificar que a URL do avatar foi atualizada (não são mais iniciais)
    const avatarSrc = await avatarImage.getAttribute('src');
    expect(avatarSrc).toContain('/images/faces/');
  });

  test('05 - Deve verificar avatar na lista de usuários', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Voltar para lista
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Verificar que o avatar aparece na grid (não são iniciais)
    const avatarInGrid = userRow.locator('app-user-avatar img.avatar-image');
    await expect(avatarInGrid).toBeVisible();
    
    // Verificar que a URL do avatar contém o path correto
    const avatarSrc = await avatarInGrid.getAttribute('src');
    expect(avatarSrc).toContain('/images/faces/');
  });

  test('06 - Deve remover avatar do usuário', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Ir para edição
    await page.goto(`/usuarios/${createdUserId}/editar`);
    await page.waitForLoadState('networkidle');

    // Clicar no botão de remover avatar (botão vermelho com texto "Delete")
    const avatarCardToDelete = page.locator('.card:has-text("Avatar")');
    const deleteButton = avatarCardToDelete.locator('button.btn-danger:has-text("Delete")');
    await deleteButton.scrollIntoViewIfNeeded();
    await deleteButton.waitFor({ state: 'visible' });
    await deleteButton.click();

    // Confirmar no SweetAlert
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText('Remover Avatar');
    
    await page.click('button:has-text("Remover")');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('Avatar removido com sucesso');

    // Verificar que voltou para iniciais
    await page.waitForTimeout(500);
    const avatarCardDeleted = page.locator('.card:has-text("Avatar")');
    const avatarInitials = avatarCardDeleted.locator('app-user-avatar .avatar-initials');
    await expect(avatarInitials).toBeVisible();
    
    // Verificar que não há mais imagem
    const avatarImageDeleted = avatarCardDeleted.locator('app-user-avatar img.avatar-image');
    await expect(avatarImageDeleted).not.toBeVisible();
  });

  test('07 - Deve inativar usuário', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Clicar no botão de inativar (ícone eye-off, cor warning)
    await userRow.locator('button.text-warning').click();

    // Confirmar no SweetAlert
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText('Inativar Usuário');
    
    await page.click('button:has-text("Inativar")');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('inativado com sucesso');

    // Verificar badge mudou para inativo
    await page.waitForTimeout(500);
    const statusBadge = userRow.locator('.badge.bg-danger');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('Inativo');
  });

  test('08 - Deve ativar usuário novamente', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário inativo
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Clicar no botão de ativar (ícone eye, cor success)
    await userRow.locator('button.text-success').click();

    // Confirmar no SweetAlert
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText('Ativar Usuário');
    
    await page.click('button:has-text("Ativar")');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('ativado com sucesso');

    // Verificar badge voltou para ativo
    await page.waitForTimeout(500);
    const statusBadge = userRow.locator('.badge.bg-success');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('Ativo');
  });

  test('09 - Deve deletar usuário permanentemente', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Clicar no botão de deletar (ícone trash, cor danger)
    await userRow.locator('button.text-danger i.icon-trash-2').click();

    // Confirmar no SweetAlert
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText('Deletar Usuário');
    await expect(page.locator('.swal2-html-container')).toContainText('permanentemente');
    
    await page.click('button:has-text("Deletar")');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('deletado com sucesso');

    // Verificar usuário não existe mais na lista
    await page.waitForTimeout(500);
    const deletedRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    await expect(deletedRow).not.toBeVisible();

    // Verificar mensagem de "sem dados" ou lista vazia para este filtro
    const noDataMessage = page.locator('td:has-text("Nenhum dado encontrado")');
    await expect(noDataMessage).toBeVisible();
  });

  test('10 - Deve validar campos obrigatórios ao criar', async () => {
    await page.goto('/usuarios/novo');
    await page.waitForLoadState('networkidle');

    // Preencher apenas nome (minúscula) para validar tamanho mínimo
    await page.fill('input#nome', 'A');
    await page.locator('input#nome').blur();
    await page.waitForTimeout(300);

    // Verificar validação de tamanho mínimo
    await expect(page.locator('.invalid-feedback:has-text("mínimo")')).toBeVisible();

    // Preencher nome válido
    await page.fill('input#nome', 'Test User');
    await page.locator('input#nome').blur();

    // Preencher email inválido
    await page.fill('input#email', 'invalido');
    await page.locator('input#email').blur();
    await page.waitForTimeout(300);

    // Verificar validação de email
    await expect(page.locator('.invalid-feedback:has-text("Email")')).toBeVisible();
  });

  test('11 - Deve validar formato de email', async () => {
    await page.goto('/usuarios/novo');
    await page.waitForLoadState('networkidle');

    await page.fill('input#email', 'email-invalido');
    await page.locator('input#email').blur();
    await page.waitForTimeout(300);

    await expect(page.locator('.invalid-feedback:has-text("Email")')).toBeVisible();
  });

  test('12 - Deve buscar usuários na lista', async () => {
    await page.goto('/usuarios');

    // Buscar por nome
    await page.fill('input[placeholder*="Procurar"]', 'admin');
    await page.waitForTimeout(500);

    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();
    
    // Limpar busca
    await page.fill('input[placeholder*="Procurar"]', '');
    await page.waitForTimeout(500);

    // Verificar voltou a exibir todos
    await expect(rows.first()).toBeVisible();
  });
});
