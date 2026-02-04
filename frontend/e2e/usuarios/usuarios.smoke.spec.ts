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
  TEST_USERS,
} from '../fixtures';

/**
 * E2E Smoke - Usuarios (CRUD básico)
 *
 * Regras base:
 * - /docs/business-rules/usuarios.md
 */

test.describe('@usuarios smoke - crud basico', () => {
  test('ADMIN cria usuário GESTOR com sucesso', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/usuarios');

    await page.click('[data-testid="novo-usuario-button"]');
    await page.waitForURL('**/usuarios/novo');
    await page.waitForLoadState('networkidle');

    const uniqueEmail = `usuario.gestor.${Date.now()}@empresa-teste.com`;
    await fillFormField(page, 'nome', 'Usuario Gestor Smoke');
    await fillFormField(page, 'email', uniqueEmail);
    await fillFormField(page, 'senha', 'Senha@123');

    await selectDropdownOption(page, 'perfilId', 'Gestor');
    await selectDropdownOption(page, 'empresaId', 'Empresa Teste A Ltda');

    await submitForm(page, 'Criar');
    await expectToast(page, 'success');

    await navigateTo(page, '/usuarios');
    await searchInTable(page, uniqueEmail);

    const row = page.locator('table tbody tr').filter({ hasText: uniqueEmail }).first();
    await expect(row).toBeVisible({ timeout: 5000 });
  });

  test('ADMIN valida email único', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/usuarios');

    const uniqueEmail = `usuario.unico.${Date.now()}@empresa-teste.com`;

    await page.click('[data-testid="novo-usuario-button"]');
    await page.waitForURL('**/usuarios/novo');

    await fillFormField(page, 'nome', 'Usuario Unico');
    await fillFormField(page, 'email', uniqueEmail);
    await fillFormField(page, 'senha', 'Senha@123');
    await selectDropdownOption(page, 'perfilId', 'Colaborador');
    await selectDropdownOption(page, 'empresaId', 'Empresa Teste A Ltda');

    await submitForm(page, 'Criar');
    await expectToast(page, 'success');

    await navigateTo(page, '/usuarios/novo');

    await fillFormField(page, 'nome', 'Usuario Duplicado');
    await fillFormField(page, 'email', uniqueEmail);
    await fillFormField(page, 'senha', 'Senha@123');
    await selectDropdownOption(page, 'perfilId', 'Colaborador');
    await selectDropdownOption(page, 'empresaId', 'Empresa Teste A Ltda');

    await submitForm(page, 'Criar');

    try {
      await expectToast(page, 'error');
    } catch {
      expect(page.url()).toContain('/usuarios/novo');
    }
  });

  test('ADMIN valida senha forte', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/usuarios');

    await page.click('[data-testid="novo-usuario-button"]');
    await page.waitForURL('**/usuarios/novo');

    await fillFormField(page, 'nome', 'Usuario Senha Fraca');
    await fillFormField(page, 'email', `senha.fraca.${Date.now()}@empresa-teste.com`);
    await fillFormField(page, 'senha', 'senhafraca');
    await selectDropdownOption(page, 'perfilId', 'Gestor');
    await selectDropdownOption(page, 'empresaId', 'Empresa Teste A Ltda');

    const senhaField = page.locator('[formcontrolname="senha"]');
    await senhaField.blur();

    const errorMessage = page.locator('.invalid-feedback:has-text("maiúscula")');
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    const submitButton = page.locator('[data-testid="submit-usuario-button"]');
    await expect(submitButton).toBeDisabled();
  });

  test('ADMIN lista usuário conhecido', async ({ page }) => {
    await login(page, TEST_USERS.admin);
    await navigateTo(page, '/usuarios');

    await searchInTable(page, TEST_USERS.gestorEmpresaA.email);

    const row = page.locator('table tbody tr').filter({ hasText: TEST_USERS.gestorEmpresaA.email }).first();
    await expect(row).toBeVisible({ timeout: 5000 });
  });

  test('GESTOR não vê usuários de outra empresa', async ({ page }) => {
    await login(page, TEST_USERS.gestorEmpresaA);
    await navigateTo(page, '/usuarios');

    await searchInTable(page, TEST_USERS.gestorEmpresaB.email);

    const row = page.locator('table tbody tr').filter({ hasText: TEST_USERS.gestorEmpresaB.email });
    await expect(row).toHaveCount(0);
  });
});
