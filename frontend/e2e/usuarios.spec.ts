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

  test('07 - Deve abrir offcanvas de detalhes do usuário', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Clicar no botão de detalhes (ícone info)
    await userRow.locator('button.text-primary i.icon-info').click();

    // Aguardar offcanvas abrir
    const offcanvas = page.locator('.offcanvas.show');
    await expect(offcanvas).toBeVisible({ timeout: 3000 });

    // Verificar título do offcanvas
    await expect(offcanvas.locator('.offcanvas-title')).toContainText('Detalhes do Usuário');

    // Verificar avatar está visível (usando app-user-avatar)
    const avatar = offcanvas.locator('app-user-avatar');
    await expect(avatar).toBeVisible();

    // Verificar informações básicas
    await expect(offcanvas).toContainText(TEST_USER.nome);
    await expect(offcanvas).toContainText(TEST_USER.email);
    await expect(offcanvas).toContainText('Senior Tester'); // Cargo editado no teste 03
    await expect(offcanvas).toContainText('Gestor'); // Perfil editado no teste 03

    // Verificar cards de informações
    await expect(offcanvas.locator('.card:has-text("Informações Básicas")')).toBeVisible();
    await expect(offcanvas.locator('.card:has-text("Datas")')).toBeVisible();

    // Verificar botões de ação no offcanvas
    await expect(offcanvas.locator('button:has-text("Editar")')).toBeVisible();
    await expect(offcanvas.locator('button:has-text("Inativar")')).toBeVisible();
    await expect(offcanvas.locator('button:has-text("Deletar")')).toBeVisible();

    // Fechar offcanvas
    await offcanvas.locator('.btn-close').click();
    await expect(offcanvas).not.toBeVisible();
  });

  test('08 - Deve inativar usuário', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Clicar no botão de inativar (ícone toggle-right)
    await userRow.locator('button.text-primary i.icon-toggle-right').click();

    // Confirmar no SweetAlert
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText('Inativar Usuário');
    
    await page.click('button:has-text("Inativar")');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('inativado com sucesso');

    // Verificar status mudou (não há mais badge, apenas texto)
    await page.waitForTimeout(500);
    await expect(userRow).toContainText('Inativo');
  });

  test('09 - Deve ativar usuário novamente', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário inativo
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Clicar no botão de ativar (ícone toggle-left)
    await userRow.locator('button.text-primary i.icon-toggle-left').click();

    // Confirmar no SweetAlert
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText('Ativar Usuário');
    
    await page.click('button:has-text("Ativar")');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('ativado com sucesso');

    // Verificar status voltou para ativo
    await page.waitForTimeout(500);
    await expect(userRow).toContainText('Ativo');
  });

  test('09 - Deve deletar usuário permanentemente', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');
10 - Deve editar usuário a partir do offcanvas', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Abrir offcanvas
    await userRow.locator('button.text-primary i.icon-info').click();
    const offcanvas = page.locator('.offcanvas.show');
    await expect(offcanvas).toBeVisible({ timeout: 3000 });

    // Clicar no botão editar dentro do offcanvas
    await offcanvas.locator('button:has-text("Editar")').click();

    // Verificar que navegou para página de edição
    await page.waitForURL(`**/usuarios/${createdUserId}/editar`);
  });

  test('11 - Deve deletar usuário permanentemente', async () => {
    test.skip(!createdUserId, 'Usuário não foi criado');

    // Buscar usuário
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', TEST_USER.email);
    await page.waitForTimeout(500);

    const userRow = page.locator('table tbody tr', { hasText: TEST_USER.nome });
    
    // Clicar no botão de deletar (ícone trash, cor danger)
    await2userRow.locator('button.text-danger i.icon-trash-2').click();

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
    const noDataMessage = page.locator('td:has-text("Nenhum

  test('10 - Deve validar campos obrigatórios ao criar', async () => {
    await page.goto('/usuarios/novo');
    await3page.waitForLoadState('networkidle');

    // Preencher apenas nome (minúscula) para validar tamanho mínimo
    await page.fill('input#nome', 'A');
    await page.locator('input#nome').blur();
    await page.waitForTimeout(300);

    // Verificar validação de tamanho mínimo
    await expect(page.locator('.invalid-feedback:has-text("mínimo")')).toBeVisible();

    // Preencher nome válido
    await4page.fill('input#nome', 'Test User');
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
test.describe('Seleção e Delete em Lote de Usuários', () => {
  let page: Page;
  let testUserIds: string[] = [];

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Login como admin
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', ADMIN_CREDENTIALS.email);
    await page.fill('input[type="password"]', ADMIN_CREDENTIALS.senha);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test.afterAll(async () => {
    // Limpar usuários de teste criados
    for (const userId of testUserIds) {
      await page.goto('/usuarios');
      await page.waitForLoadState('networkidle');
      
      // Buscar e deletar silenciosamente
      const userRow = page.locator(`a[href="/usuarios/${userId}/editar"]`).locator('..');
      if (await userRow.isVisible()) {
        await userRow.locator('button.text-danger i.icon-trash-2').click();
        await page.click('button:has-text("Deletar")');
        await page.waitForTimeout(1000);
      }
    }
    
    await page.close();
  });

  test('01 - Deve criar múltiplos usuários para teste de seleção', async () => {
    // Criar 3 usuários de teste
    for (let i = 1; i <= 3; i++) {
      await page.goto('/usuarios/novo');
      await page.waitForLoadState('networkidle');

      const testUser = {
        nome: `Teste Lote ${i}`,
        email: `lote${i}.${Date.now()}@test.com`,
        cargo: `Cargo Teste ${i}`,
        perfil: 'COLABORADOR',
        senha: 'senha123'
      };

      await page.fill('input#nome', testUser.nome);
      await page.fill('input#email', testUser.email);
      await page.fill('input#cargo', testUser.cargo);
      await page.selectOption('select#perfil', testUser.perfil);
      await page.fill('input#senha', testUser.senha);

      await page.click('button[type="submit"]');
      await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
      await page.waitForURL('**/usuarios', { timeout: 5000 });

      // Capturar ID do usuário criado
      await page.fill('input[placeholder*="Procurar"]', testUser.email);
      await page.waitForTimeout(500);

      const userRow = page.locator('table tbody tr', { hasText: testUser.nome });
      const editButton = userRow.locator('a[href*="/editar"]');
      const href = await editButton.getAttribute('href');
      const userId = href?.match(/\/usuarios\/([^/]+)\/editar/)?.[1];
      
      if (userId) {
        testUserIds.push(userId);
      }
    }

    expect(testUserIds.length).toBe(3);
  });

  test('02 - Deve selecionar usuário individual via checkbox', async () => {
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', 'Teste Lote');
    await page.waitForTimeout(500);

    // Selecionar primeiro usuário
    const firstRow = page.locator('table tbody tr').first();
    const checkbox = firstRow.locator('input[type="checkbox"]');
    
    await checkbox.click();
    await expect(checkbox).toBeChecked();

    // Verificar que barra de ações apareceu
    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toBeVisible();
    await expect(actionBar).toContainText('(1)');

    // Desmarcar
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect(actionBar).not.toBeVisible();
  });

  test('03 - Deve selecionar múltiplos usuários individualmente', async () => {
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', 'Teste Lote');
    await page.waitForTimeout(500);

    // Selecionar os 3 usuários
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      const checkbox = rows.nth(i).locator('input[type="checkbox"]');
      await checkbox.click();
    }

    // Verificar contador
    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toBeVisible();
    await expect(actionBar).toContainText('(3)');
  });

  test('04 - Deve selecionar todos da página com checkbox do header', async () => {
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', 'Teste Lote');
    await page.waitForTimeout(500);

    // Clicar no checkbox do header
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    await headerCheckbox.click();
    await expect(headerCheckbox).toBeChecked();

    // Verificar que todos os checkboxes da página estão marcados
    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]');
    const count = await bodyCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      await expect(bodyCheckboxes.nth(i)).toBeChecked();
    }

    // Verificar contador
    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toBeVisible();
    await expect(actionBar).toContainText(`(${count})`);
  });

  test('05 - Deve desmarcar todos com checkbox do header', async () => {
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', 'Teste Lote');
    await page.waitForTimeout(500);

    // Marcar todos
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    await headerCheckbox.click();
    await page.waitForTimeout(300);

    // Desmarcar todos
    await headerCheckbox.click();
    await expect(headerCheckbox).not.toBeChecked();

    // Verificar que nenhum checkbox está marcado
    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]');
    const count = await bodyCheckboxes.count();
    
    for (let i = 0; i < count; i++) {
      await expect(bodyCheckboxes.nth(i)).not.toBeChecked();
    }

    // Verificar que barra de ações não está visível
    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).not.toBeVisible();
  });

  test('06 - Deve sincronizar checkbox do header com seleções individuais', async () => {
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', 'Teste Lote');
    await page.waitForTimeout(500);

    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    const bodyCheckboxes = page.locator('table tbody input[type="checkbox"]');
    const count = await bodyCheckboxes.count();

    // Marcar todos manualmente
    for (let i = 0; i < count; i++) {
      await bodyCheckboxes.nth(i).click();
    }

    // Verificar que header checkbox foi marcado automaticamente
    await expect(headerCheckbox).toBeChecked();

    // Desmarcar um
    await bodyCheckboxes.first().click();

    // Verificar que header checkbox foi desmarcado
    await expect(headerCheckbox).not.toBeChecked();
  });

  test('07 - Deve deletar usuários selecionados em lote', async () => {
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', 'Teste Lote');
    await page.waitForTimeout(500);

    // Selecionar todos os usuários de teste
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    await headerCheckbox.click();

    // Clicar no botão de deletar selecionados
    const deleteButton = page.locator('button:has-text("Deletar Selecionados")');
    await expect(deleteButton).toBeVisible();
    
    const selectedCount = await page.locator('table tbody input[type="checkbox"]:checked').count();
    await expect(deleteButton).toContainText(`(${selectedCount})`);
    
    await deleteButton.click();

    // Confirmar no SweetAlert
    await expect(page.locator('.swal2-popup')).toBeVisible();
    await expect(page.locator('.swal2-title')).toContainText('Deletar Usuários');
    await expect(page.locator('.swal2-html-container')).toContainText(`${selectedCount} usuário(s)`);
    await expect(page.locator('.swal2-html-container')).toContainText('permanentemente');
    
    await page.click('button:has-text("Deletar")');

    // Aguardar toast de sucesso
    await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.swal2-toast .swal2-title')).toContainText('deletado(s) com sucesso');

    // Verificar que usuários foram removidos
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder*="Procurar"]', 'Teste Lote');
    await page.waitForTimeout(500);

    const noDataMessage = page.locator('td:has-text("Nenhum")');
    await expect(noDataMessage).toBeVisible();

    // Limpar lista de IDs pois foram deletados
    testUserIds = [];
  });

  test('08 - Deve cancelar delete em lote', async () => {
    // Criar 2 usuários novos para testar cancelamento
    for (let i = 1; i <= 2; i++) {
      await page.goto('/usuarios/novo');
      await page.waitForLoadState('networkidle');

      await page.fill('input#nome', `Cancelar Teste ${i}`);
      await page.fill('input#email', `cancelar${i}.${Date.now()}@test.com`);
      await page.fill('input#cargo', 'Cargo Teste');
      await page.selectOption('select#perfil', 'COLABORADOR');
      await page.fill('input#senha', 'senha123');

      await page.click('button[type="submit"]');
      await expect(page.locator('.swal2-toast')).toBeVisible({ timeout: 5000 });
      await page.waitForURL('**/usuarios', { timeout: 5000 });
    }

    // Buscar e selecionar
    await page.goto('/usuarios');
    await page.fill('input[placeholder*="Procurar"]', 'Cancelar Teste');
    await page.waitForTimeout(500);

    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    await headerCheckbox.click();

    // Clicar em deletar mas cancelar
    const deleteButton = page.locator('button:has-text("Deletar Selecionados")');
    await deleteButton.click();

    await expect(page.locator('.swal2-popup')).toBeVisible();
    await page.click('button:has-text("Cancelar")');

    // Verificar que usuários ainda existem
    await page.waitForTimeout(500);
    const rows = page.locator('table tbody tr');
    await expect(rows.first()).toBeVisible();

    // Limpar manualmente esses usuários
    await headerCheckbox.click();
    await deleteButton.click();
    await page.click('button:has-text("Deletar")');
    await page.waitForTimeout(2000);
  });

  test('09 - Deve manter seleção ao trocar de página', async () => {
    await page.goto('/usuarios');
    
    // Limpar busca para ver todos
    await page.fill('input[placeholder*="Procurar"]', '');
    await page.waitForTimeout(500);

    // Selecionar primeiro usuário da primeira página
    const firstCheckbox = page.locator('table tbody tr').first().locator('input[type="checkbox"]');
    await firstCheckbox.click();

    // Verificar contador
    const actionBar = page.locator('#usuarioBarBtn');
    await expect(actionBar).toContainText('(1)');

    // Se houver paginação, ir para próxima página
    const nextButton = page.locator('ngb-pagination button:has-text("Next")');
    if (await nextButton.isVisible() && !await nextButton.isDisabled()) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Verificar que contador ainda mostra seleção
      await expect(actionBar).toContainText('(1)');
    }

    // Desmarcar todos para limpar
    await page.goto('/usuarios');
    const headerCheckbox = page.locator('table thead input[type="checkbox"]');
    if (await headerCheckbox.isChecked()) {
      await headerCheckbox.click();
    }
  });
});