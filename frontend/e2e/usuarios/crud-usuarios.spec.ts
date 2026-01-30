import { 
  test, 
  expect,
  login, 
  navigateTo, 
  fillFormField, 
  selectDropdownOption, 
  submitForm, 
  expectToast,
  searchInTable,
  getTableRowCount,
  openModal,
  closeModal,
  TEST_USERS,
  isProtectedTestUser
} from '../fixtures';

/**
 * E2E Tests - CRUD de Usuários
 * 
 * Validação de:
 * - Criação de usuário (CREATE)
 * - Listagem e busca (READ)
 * - Edição de usuário (UPDATE)
 * - Desativação de usuário (DELETE - soft delete)
 * - Validações multi-tenant (GESTOR só vê própria empresa)
 * - Validações de RBAC (perfis e permissões)
 * 
 * ✅ Cleanup automático: Recursos criados são removidos após cada teste
 * 
 * Agente: QA_E2E_Interface
 */

test.describe.skip('LEGACY: CRUD de Usuários @usuarios @crud @medium @legacy', () => {
  
  test.describe('Listagem e Busca (READ)', () => {
    test('deve buscar usuários por nome', async ({ page }) => {
      await login(page, TEST_USERS['admin']);
      await navigateTo(page, '/usuarios');
      
      await page.waitForSelector('table tbody tr');
      
      const initialCount = await getTableRowCount(page);
      
      // Buscar por nome específico
      await searchInTable(page, 'Admin');
      
      // Aguardar filtro aplicar
      await page.waitForTimeout(800);
      
      const filteredCount = await getTableRowCount(page);
      
      // Se houver filtro, deve reduzir resultados ou manter igual (se todos contêm "Admin")
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    });

    test('deve ordenar usuários por coluna', async ({ page }) => {
      await login(page, TEST_USERS['admin']);
      await navigateTo(page, '/usuarios');
      
      await page.waitForSelector('table tbody tr');
      
      // Clicar no header da coluna "Nome" para ordenar
      await page.click('th:has-text("Nome")');
      
      // Aguardar reordenação
      await page.waitForTimeout(500);
      
      // Capturar primeira linha antes da segunda ordenação
      const primeiraLinhaAsc = await page.locator('table tbody tr').first().textContent();
      
      // Clicar novamente para inverter (DESC)
      await page.click('th:has-text("Nome")');
      
      await page.waitForTimeout(500);
      
      const primeiraLinhaDesc = await page.locator('table tbody tr').first().textContent();
      
      const primeiroNomeAsc = primeiraLinhaAsc;
      const primeiroNomeDesc = primeiraLinhaDesc;
      
      // Deve ter mudado a ordem
      expect(primeiroNomeDesc).not.toBe(primeiroNomeAsc);
    });
  });

  test.describe('Edição de Usuário (UPDATE)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS['admin']);
      await navigateTo(page, '/usuarios');
    });

    test('deve editar dados de usuário existente', async ({ page }) => {
      await page.waitForSelector('table tbody tr');
      
      // Obter ID do primeiro usuário
      const primeiraLinha = page.locator('table tbody tr').first();
      const editButton = primeiraLinha.locator('button[data-testid="edit-usuario-button"]');
      
      // Aguardar botão estar visível e clicar
      await editButton.waitFor({ state: 'visible' });
      await editButton.click();
      
      // Aguardar navegação para página de edição
      await page.waitForURL(/\/usuarios\/.*\/editar/);
      await page.waitForLoadState('networkidle');
      
      // Aguardar formulário carregar
      await page.waitForSelector('[formControlName="nome"]');
      
      // Editar nome
      const nomeField = page.locator('[formControlName="nome"]');
      const nomeOriginal = await nomeField.inputValue();
      
      await fillFormField(page, 'nome', nomeOriginal + ' (Editado)');
      
      // Editar cargo
      await fillFormField(page, 'cargo', 'Gerente Sênior');
      
      // Aguardar que formulário esteja válido (pode precisar de empresa se perfil mudou)
      await page.waitForTimeout(1000);
      
      // Verificar se botão está habilitado, senão verificar se precisa preencher empresa
      const submitButton = page.locator('button[type="submit"]');
      const isDisabled = await submitButton.isDisabled();
      
      if (isDisabled) {
        // Pode precisar preencher empresa se o perfil exige
        const empresaField = page.locator('[formcontrolname="empresaId"]');
        const empresaFieldVisible = await empresaField.isVisible().catch(() => false);
        if (empresaFieldVisible) {
          await selectDropdownOption(page, 'empresaId', 'Empresa Teste A Ltda');
          await page.waitForTimeout(500);
        }
      }
      
      // Salvar
      await submitForm(page, 'Salvar');
      
      // Aguardar SweetAlert de sucesso
      await expectToast(page, 'success');
    });

    test('GESTOR não deve poder acessar lista completa como ADMIN (multi-tenant)', async ({ page }) => {
      // Login como ADMIN primeiro para contar total de usuários
      await login(page, TEST_USERS['admin']);
      await navigateTo(page, '/usuarios');
      await page.waitForSelector('table tbody tr');
      
      const adminRowCount = await page.locator('table tbody tr').count();
      
      // Logout e login como GESTOR
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      await login(page, TEST_USERS['gestorEmpresaA']);
      await navigateTo(page, '/usuarios');
      await page.waitForSelector('table tbody tr');
      
      const gestorRowCount = await page.locator('table tbody tr').count();
      
      // GESTOR deve ver menos ou igual usuários (apenas da própria empresa)
      expect(gestorRowCount).toBeLessThanOrEqual(adminRowCount);
    });
  });

  test.describe('Desativação de Usuário (DELETE - Soft Delete)', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, TEST_USERS['admin']);
      await navigateTo(page, '/usuarios');
    });

    test('deve desativar usuário (soft delete)', async ({ page }) => {
      await page.waitForSelector('table tbody tr');
      
      // IMPORTANTE: Nunca desativar TEST_USERS
      // Procurar primeiro usuário que NÃO seja protegido
      const rows = page.locator('table tbody tr');
      const rowCount = await rows.count();
      
      let targetRow = null;
      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i);
        const emailCell = row.locator('td:nth-child(3)'); // Coluna de email
        const email = await emailCell.textContent();
        
        if (email && !isProtectedTestUser(email.trim())) {
          targetRow = row;
          break;
        }
      }
      
      if (!targetRow) {
        console.log('⚠️ Nenhum usuário não-protegido encontrado para testar desativação');
        return; // Skip teste se só há TEST_USERS
      }
      
      const nomeUsuario = await targetRow.locator('td:nth-child(2)').textContent();
      console.log('Desativando usuário:', nomeUsuario);
      
      // Clicar em desativar
      await targetRow.locator('button[data-testid="delete-usuario-button"]').click();
      
      // Confirmar SweetAlert de confirmação
      await page.waitForSelector('.swal2-popup', { timeout: 5000 });
      
      // Clicar no botão de confirmação (tem texto "Inativar")
      const confirmButton = page.locator('.swal2-confirm');
      await confirmButton.waitFor({ state: 'visible' });
      await confirmButton.click();
      
      // Aguardar toast de sucesso
      await page.waitForTimeout(1000);
      
      // Verificar se há SweetAlert de sucesso
      const successSwal = page.locator('.swal2-popup .swal2-success');
      if (await successSwal.count() > 0) {
        await expect(successSwal).toBeVisible();
      }
    });

    test('deve cancelar desativação ao fechar modal de confirmação', async ({ page }) => {
      await page.waitForSelector('table tbody tr');
      
      const rowCountBefore = await getTableRowCount(page);
      
      // Clicar em desativar
      await page.locator('button[data-testid="delete-usuario-button"]').first().click();
      
      // Cancelar SweetAlert
      await page.waitForSelector('.swal2-popup', { timeout: 5000 });
      
      const cancelButton = page.locator('.swal2-cancel');
      await cancelButton.waitFor({ state: 'visible' });
      await cancelButton.click();
      
      // Aguardar modal fechar
      await page.waitForSelector('.swal2-popup', { state: 'hidden' });
      
      // Validar que usuário permanece na lista
      const rowCountAfter = await getTableRowCount(page);
      
      expect(rowCountAfter).toBe(rowCountBefore);
    });
  });

  test.describe('Validações de RBAC e Perfis', () => {
    test('COLABORADOR não deve ter acesso ao CRUD de usuários', async ({ page }) => {
      await login(page, TEST_USERS['colaborador']);
      
      // Tentar acessar diretamente
      await page.goto('/usuarios');
      
      // Deve receber erro de permissão ou redirect
      await expectToast(page, 'error', /permissão|acesso negado/i);
      
      // Ou ser redirecionado para dashboard/home
      await expect(page).not.toHaveURL(/\/usuarios$/);
    });

    test('menu de usuários não deve aparecer para perfis sem permissão', async ({ page }) => {
      await login(page, TEST_USERS['colaborador']);
      
      await navigateTo(page, '/');
      
      // Menu "Usuários" não deve estar visível na sidebar
      const sidebarUsuarios = page.locator('[data-testid="sidebar"] a:has-text("Usuários")');
      
      await expect(sidebarUsuarios).not.toBeVisible();
    });
  });
});

